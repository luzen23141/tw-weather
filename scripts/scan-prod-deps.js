#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const deps = Object.keys(pkg.dependencies || {});

let hasIssue = false;
deps.forEach((dep) => {
  const dir = path.join('node_modules', dep);
  if (!fs.existsSync(dir)) return;
  try {
    const result = execSync(
      `grep -rl 'import\\.meta' "${dir}" --include="*.js" --include="*.cjs" 2>/dev/null || true`,
      { encoding: 'utf8', shell: '/bin/bash' },
    ).trim();
    if (!result) return;
    let main = '(none)';
    try {
      const p = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
      main = p.main || p.module || '(none)';
    } catch (_) {}
    console.log(`❌ ${dep}  (main: ${main})`);
    result
      .split('\n')
      .slice(0, 2)
      .forEach((f) => console.log(`   ${f}`));
    hasIssue = true;
  } catch (e) {
    // ignore
  }
});

if (!hasIssue) {
  console.log('✅ 所有 production dependencies 均無 import.meta（in .js/.cjs）');
}
process.exit(hasIssue ? 1 : 0);
