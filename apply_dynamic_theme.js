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

const files = [...walk('./app'), ...walk('./components')];
let count = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  const replacements = [
    // Backgrounds
    ['bg-[#EF3A2A]', 'bg-brand'],
    ['bg-[var(--brand)]', 'bg-brand'],
    ['bg-[#EF3A2A]/10', 'bg-brand-10'],
    ['bg-[var(--brand-10)]', 'bg-brand-10'],
    ['bg-[#EF3A2A]/8', 'bg-brand-10'], // approx
    ['bg-[#EF3A2A]/20', 'bg-brand-20'],
    ['bg-[var(--brand-20)]', 'bg-brand-20'],
    ['bg-[#EF3A2A]/30', 'bg-brand-30'],
    ['bg-[var(--brand-30)]', 'bg-brand-30'],
    
    // Hovers
    ['hover:bg-[#d42f1e]', 'hover:brightness-90'],
    ['hover:text-[#d42f1e]', 'hover:opacity-80'],
    
    // Texts
    ['text-[#EF3A2A]', 'text-brand'],
    ['text-[var(--brand)]', 'text-brand'],
    
    // Borders
    ['border-[#EF3A2A]', 'border-brand'],
    ['border-[var(--brand)]', 'border-brand'],
    ['border-[#EF3A2A]/20', 'border-brand-20'],
    ['border-[var(--brand-20)]', 'border-brand-20'],
    ['border-[#EF3A2A]/30', 'border-brand-30'],
    ['border-[var(--brand-30)]', 'border-brand-30'],
    ['border-[#EF3A2A]/40', 'border-brand-30'],
    
    // Rings
    ['ring-[#EF3A2A]', 'ring-brand'],
    ['ring-[var(--brand)]', 'ring-brand'],
    ['ring-[#EF3A2A]/20', 'ring-brand-20'],
    ['ring-[var(--brand-20)]', 'ring-brand-20'],
    ['ring-[#EF3A2A]/10', 'ring-brand-10'],
    ['ring-[var(--brand-10)]', 'ring-brand-10'],
  ];

  for (const [from, to] of replacements) {
    while (content.includes(from)) {
      content = content.replace(from, to);
      changed = true;
    }
  }

  const textMatches = content.match(/text-\[#EF3A2A\]/g);
  if (textMatches) {
    content = content.replace(/text-\[#EF3A2A\]/g, 'text-brand');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    count++;
    console.log('Fixed:', file);
  }
});

console.log('Total:', count, 'files updated to strict css classes');
