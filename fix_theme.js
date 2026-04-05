const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  for (const f of fs.readdirSync(dir)) {
    const fp = path.join(dir, f);
    const stat = fs.statSync(fp);
    if (stat.isDirectory()) {
      if (!fp.includes('.next') && !fp.includes('node_modules')) {
        results = results.concat(walk(fp));
      }
    } else if (fp.endsWith('.tsx') || fp.endsWith('.ts')) {
      results.push(fp);
    }
  }
  return results;
}

const files = walk('./app');
let count = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  const replacements = [
    ['text-3xl font-bold text-white', 'text-xl font-bold text-gray-900'],
    ['text-2xl font-bold text-white', 'text-xl font-bold text-gray-900'],
    ['bg-green-500 hover:bg-green-600', 'bg-[#EF3A2A] hover:bg-[#d42f1e]'],
    ['bg-[#22c55e] hover:bg-[#1ea34d]', 'bg-[#EF3A2A] hover:bg-[#d42f1e]'],
    ['border-gray-200 text-white', 'border-gray-200 text-gray-900'],
    ['min-h-screen bg-gray-950', 'min-h-screen bg-gray-50/50'],
    ['min-h-screen bg-[#0f1117]', 'min-h-screen bg-gray-50/50'],
    ['text-white font-medium bg-green', 'text-white font-medium bg-[#EF3A2A]'],
    ['"bg-green-500"', '"bg-[#EF3A2A]"'],
    [' bg-green-600"', ' bg-[#d42f1e]"'],
  ];

  for (const [from, to] of replacements) {
    while (content.includes(from)) {
      content = content.replace(from, to);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content);
    count++;
    console.log('Fixed:', file.replace(process.cwd() + '\\', '').replace(process.cwd() + '/', ''));
  }
});

console.log('Total:', count, 'files updated');
