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

function resolveImport(fromFile, spec) {
  if (!spec.startsWith('.') && !spec.startsWith('@/')) return null
  let target = spec
  if (spec.startsWith('@/')) target = path.join(root, spec.slice(2))
  else target = path.resolve(path.dirname(fromFile), spec)
  const candidates = [
    target,
    target + '.ts',
    target + '.tsx',
    path.join(target, 'index.ts'),
    path.join(target, 'index.tsx'),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return path.normalize(c)
  }
  return null
}

const files = walk(root)
const tsFiles = files.filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'))
const cssFiles = files.filter((f) => f.endsWith('.css'))
const allTsText = tsFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\n')

const importRe =
  /(?:import\s+(?:type\s+)?(?:\{[^}]+\}|\*\s+as\s+\w+|\w+)\s+from\s+|import\s+)['"]([^'"]+)['"]/g
const dynamicRe = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g

const referenced = new Set([
  path.normalize(path.join(root, 'main.tsx')),
  path.normalize(path.join(root, 'App.tsx')),
  path.normalize(path.join(root, 'index.css')),
  path.normalize(path.join(root, 'vite-env.d.ts')),
])

for (const css of cssFiles) {
  if (css.endsWith('index.css')) continue
  const rel = path.relative(root, css).replace(/\\/g, '/')
  const idx = fs.readFileSync(path.join(root, 'index.css'), 'utf8')
  if (idx.includes(rel)) referenced.add(path.normalize(css))
}

for (const f of tsFiles) {
  const text = fs.readFileSync(f, 'utf8')
  for (const re of [importRe, dynamicRe]) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(text))) {
      const resolved = resolveImport(f, m[1])
      if (resolved) referenced.add(resolved)
    }
  }
}

const orphans = []
for (const f of tsFiles) {
  if (referenced.has(path.normalize(f))) continue
  const rel = path.relative(root, f).replace(/\\/g, '/')
  orphans.push(rel)
}

// CSS classes - only in .tsx/.ts className strings and cn()
function classUsageCount(cls) {
  const patterns = [
    new RegExp(`className\\s*=\\s*['"\`][^'"\`]*\\b${cls}\\b`, 'g'),
    new RegExp(`className\\s*=\\s*\\{[^}]*['"\`]\\b${cls}\\b`, 'g'),
    new RegExp(`cn\\([^)]*['"\`]\\b${cls}\\b`, 'g'),
    new RegExp(`['"\`]\\s*\\+\\s*['"\`]${cls}['"\`]`, 'g'),
    new RegExp(`['"\`]${cls}['"\`]`, 'g'),
  ]
  let total = 0
  for (const p of patterns) {
    const m = allTsText.match(p)
    if (m) total += m.length
  }
  return total
}

function extractTopLevelClasses(css) {
  const classes = new Set()
  const re = /(?:^|[,{}\s])\.([a-zA-Z_][\w-]*)/gm
  let m
  while ((m = re.exec(css))) classes.add(m[1])
  return classes
}

const unusedCss = {}
for (const cssFile of cssFiles) {
  if (cssFile.endsWith('index.css')) continue
  const rel = path.relative(root, cssFile).replace(/\\/g, '/')
  const css = fs.readFileSync(cssFile, 'utf8')
  const classes = extractTopLevelClasses(css)
  const unused = []
  for (const cls of [...classes].sort()) {
    if (css.includes(`@keyframes ${cls}`)) continue
    const count = classUsageCount(cls)
    if (count === 0) unused.push({ cls, count })
  }
  if (unused.length) unusedCss[rel] = unused
}

// Exports - improved import detection including multiline
function countExternalImport(name, fromFile) {
  let count = 0
  for (const other of tsFiles) {
    if (other === fromFile) continue
    const text = fs.readFileSync(other, 'utf8')
    const importBlocks = text.match(/import[\s\S]*?from\s+['"][^'"]+['"]/g) || []
    for (const block of importBlocks) {
      if (new RegExp(`\\b${name}\\b`).test(block)) count++
    }
    const dyn = text.match(/import\s*\([\s\S]*?\)/g) || []
    for (const block of dyn) {
      if (new RegExp(`\\b${name}\\b`).test(block)) count++
    }
  }
  return count
}

const exportRe = /export (?:async )?(?:function|const|type|class|interface|enum) (\w+)/g
const unusedExports = []
for (const f of tsFiles) {
  const text = fs.readFileSync(f, 'utf8')
  const rel = path.relative(root, f).replace(/\\/g, '/')
  let m
  while ((m = exportRe.exec(text))) {
    const name = m[1]
    const external = countExternalImport(name, f)
    if (external === 0) {
      const kind = /export type/.test(text.slice(Math.max(0, m.index - 8), m.index + 20))
        ? 'type'
        : 'value'
      unusedExports.push({ rel, name, external, kind })
    }
  }
}

console.log(JSON.stringify({ orphans, unusedCss, unusedExports }, null, 2))
