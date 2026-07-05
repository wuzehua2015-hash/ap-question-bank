#!/usr/bin/env node

const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const PROJECT_ROOT = path.resolve(ROOT, '..', '..')
const SCRIPT = path.join(
  PROJECT_ROOT,
  'subjects',
  'AP',
  'Physics-C-Mechanics',
  'tools',
  'audit_mechanics_image_content_fidelity.py',
)

if (!fs.existsSync(SCRIPT)) {
  console.error([
    'Missing local Mechanics image-content audit script.',
    `Expected: ${SCRIPT}`,
    'This command requires the local production workspace. Source PDFs and production workspaces are intentionally not part of the Web repository.',
  ].join('\n'))
  process.exit(1)
}

const result = spawnSync('python', [SCRIPT], {
  cwd: PROJECT_ROOT,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

process.exit(result.status || 0)
