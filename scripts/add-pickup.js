const fs = require('fs')
const path = require('path')

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (full.endsWith('.tsx')) {
      let source = fs.readFileSync(full, 'utf8')
      const next = source.replace(/className="btn (?!pickup)/g, 'className="btn pickup ')
      if (next !== source) {
        fs.writeFileSync(full, next)
        console.log(full)
      }
    }
  }
}

walk(path.join(__dirname, 'src'))
