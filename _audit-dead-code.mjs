import fs from 'fs'
import path from 'path'

const root = path.join(process.cwd(), 'src')
const exts = new Set(['.ts', '.tsx', '.css'])

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    const st = fs.statSync(p)
    if (st.isDirectory()) walk(p, out)
    else if (exts.has(path.extname(name))) out.push(p)
  }
  return out
}

const files = walk(root)
const tsFiles = files.filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'))
const cssFiles = files.filter((f) => f.endsWith('.css'))

const allSrcText = tsFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\n')
const entryPoints = new Set([
  path.join(root, 'main.tsx'),
  path.join(root, 'App.tsx'),
  path.join(root, 'index.css'),
  path.join(root, 'vite-env.d.ts'),
])

// Orphan files
const orphans = []
for (const f of tsFiles) {
  if (entryPoints.has(f)) continue
  const rel = path.relative(root, f).replace(/\\/g, '/')
  const base = path.basename(f, path.extname(f))
  const noExt = rel.replace(/\.(tsx|ts)$/, '')
  const patterns = [
    `@/${noExt}`,
    `./${base}`,
    `/${noExt}`,
    `'${noExt}'`,
    `"${noExt}"`,
    `'./${rel.replace(/\.(tsx|ts)$/, '')}'`,
    `"./${rel.replace(/\.(tsx|ts)$/, '')}"`,
    `'../${base}'`,
    `"../${base}"`,
    `'@/${rel.replace(/\.(tsx|ts)$/, '')}'`,
  ]
  let refs = 0
  for (const other of tsFiles) {
    if (other === f) continue
    const text = fs.readFileSync(other, 'utf8')
    for (const pat of patterns) {
      if (text.includes(pat)) refs++
    }
    // lazy import pattern
    if (text.includes(`import('`) && text.includes(noExt)) refs++
    if (text.includes(`import("@`) && text.includes(noExt)) refs++
  }
  // index.css imports styles
  if (f.endsWith('.css')) {
    const idx = fs.readFileSync(path.join(root, 'index.css'), 'utf8')
    if (idx.includes(rel)) refs++
  }
  if (refs === 0) orphans.push({ rel, refs })
}

// CSS classes
function extractClasses(css) {
  const classes = new Set()
  const re = /\.([a-zA-Z_][\w-]*)/g
  let m
  while ((m = re.exec(css))) {
    const cls = m[1]
    if (cls.startsWith('webkit') || cls.startsWith('moz')) continue
    classes.add(cls)
  }
  return classes
}

const unusedCss = {}
for (const cssFile of cssFiles) {
  if (cssFile.endsWith('index.css')) continue
  const rel = path.relative(root, cssFile).replace(/\\/g, '/')
  const css = fs.readFileSync(cssFile, 'utf8')
  const classes = extractClasses(css)
  const unused = []
  for (const cls of [...classes].sort()) {
    // skip keyframe-ish names
    if (css.includes(`@keyframes ${cls}`)) continue
    const count = (allSrcText.match(new RegExp(`['"\`]${cls}['"\`]|className=\\{[^}]*['"\`]${cls}|\\b${cls}\\b`, 'g')) || []).length
    if (count === 0) unused.push(cls)
  }
  if (unused.length) unusedCss[rel] = unused
}

// Exports scan (simple)
const exportRe = /export (?:async )?(?:function|const|type|class|interface|enum) (\w+)/g
const unusedExports = []
for (const f of tsFiles) {
  const text = fs.readFileSync(f, 'utf8')
  const rel = path.relative(root, f).replace(/\\/g, '/')
  let m
  while ((m = exportRe.exec(text))) {
    const name = m[1]
    if (name === 'default') continue
    let external = 0
    for (const other of tsFiles) {
      if (other === f) continue
      const ot = fs.readFileSync(other, 'utf8')
      if (new RegExp(`import[^;\\n]*\\b${name}\\b`).test(ot)) external++
      if (new RegExp(`import\\([^)]*\\b${name}\\b`).test(ot)) external++
    }
    if (external === 0) {
      // check if used in same file (non-export usage)
      const localUses = (text.match(new RegExp(`\\b${name}\\b`, 'g')) || []).length
      const isTypeOnly = /export type/.test(text.slice(m.index - 20, m.index + 30))
      unusedExports.push({ rel, name, localUses, isTypeOnly })
    }
  }
}

console.log(JSON.stringify({ orphans, unusedCss, unusedExports }, null, 2))
