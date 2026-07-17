const fs = require('node:fs')
const path = require('node:path')

const distDir = path.resolve(__dirname, '..', 'dist-admin')
const adminHtml = path.join(distDir, 'admin.html')
const indexHtml = path.join(distDir, 'index.html')

if (!fs.existsSync(adminHtml)) {
  throw new Error(`Missing admin build entry: ${adminHtml}`)
}

fs.copyFileSync(adminHtml, indexHtml)
fs.unlinkSync(adminHtml)
console.log('Admin build entry normalized: dist-admin/index.html')
