#!/usr/bin/env node
/**
 * Build a manifest of available agent skills by scanning skills-main/skills
 * for SKILL.md files and extracting YAML frontmatter (name, description).
 *
 * Writes:
 *   skills-main/MANIFEST.json  - machine-readable
 *   skills-main/MANIFEST.md    - human/LLM-readable summary
 *
 * Usage:
 *   node scripts/build-skills-manifest.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SKILLS_ROOT = path.join(ROOT, 'skills-main', 'skills')
const OUT_JSON = path.join(ROOT, 'skills-main', 'MANIFEST.json')
const OUT_MD = path.join(ROOT, 'skills-main', 'MANIFEST.md')

/**
 * Minimal YAML frontmatter parser: reads a top-of-file `---` block and
 * extracts simple `key: value` pairs. Handles multi-line values that are
 * continued with indentation.
 */
function parseFrontmatter(content) {
  if (!content.startsWith('---')) return {}
  const end = content.indexOf('\n---', 3)
  if (end === -1) return {}
  const block = content.slice(3, end).trim()
  const lines = block.split(/\r?\n/)
  const out = {}
  let currentKey = null
  for (const line of lines) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (m) {
      currentKey = m[1]
      out[currentKey] = m[2].trim()
    } else if (currentKey && /^\s+/.test(line)) {
      // continuation line — append
      out[currentKey] = (out[currentKey] + ' ' + line.trim()).trim()
    }
  }
  // Strip surrounding quotes
  for (const k of Object.keys(out)) {
    const v = out[k]
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      out[k] = v.slice(1, -1)
    }
  }
  return out
}

function walk(dir) {
  const results = []
  if (!fs.existsSync(dir)) return results
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...walk(full))
    } else if (entry.isFile() && entry.name === 'SKILL.md') {
      results.push(full)
    }
  }
  return results
}

function categoryFor(skillPath) {
  const rel = path.relative(SKILLS_ROOT, skillPath)
  const top = rel.split(path.sep)[0]
  if (top === '.curated') return 'curated'
  if (top === '.system') return 'system'
  if (top === 'other-skills') return 'other'
  return top
}

function main() {
  const files = walk(SKILLS_ROOT).sort()
  const skills = []

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8')
    const fm = parseFrontmatter(content)
    const dir = path.dirname(file)
    const name = fm.name || path.basename(dir)
    const description = (fm.description || '').replace(/\s+/g, ' ').trim()
    skills.push({
      name,
      description,
      category: categoryFor(file),
      path: path.relative(ROOT, dir),
      skillFile: path.relative(ROOT, file)
    })
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    workspaceRelative: true,
    count: skills.length,
    skills
  }

  fs.writeFileSync(OUT_JSON, JSON.stringify(manifest, null, 2))

  // Human-readable markdown, grouped by category
  const byCategory = skills.reduce((acc, s) => {
    (acc[s.category] ||= []).push(s)
    return acc
  }, {})

  const order = ['curated', 'system', 'other']
  const categories = [...order.filter(c => byCategory[c]), ...Object.keys(byCategory).filter(c => !order.includes(c))]

  const lines = [
    '# Agent Skills Manifest',
    '',
    `Generated: ${manifest.generatedAt}`,
    `Total skills: ${skills.length}`,
    '',
    'Paths are relative to the workspace root. Read the SKILL.md at the listed path to get full instructions before using a skill.',
    ''
  ]

  for (const cat of categories) {
    lines.push(`## ${cat} (${byCategory[cat].length})`, '')
    lines.push('| Name | Path | Description |')
    lines.push('| --- | --- | --- |')
    for (const s of byCategory[cat].sort((a, b) => a.name.localeCompare(b.name))) {
      const desc = (s.description || '').replace(/\|/g, '\\|').slice(0, 260)
      lines.push(`| \`${s.name}\` | \`${s.path}\` | ${desc} |`)
    }
    lines.push('')
  }

  fs.writeFileSync(OUT_MD, lines.join('\n'))

  console.log(`[skills-manifest] Wrote ${skills.length} skills`)
  console.log(`  - ${path.relative(ROOT, OUT_JSON)}`)
  console.log(`  - ${path.relative(ROOT, OUT_MD)}`)
}

main()
