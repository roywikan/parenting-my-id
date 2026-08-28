const fs = require('fs');
let content = fs.readFileSync('src/components/Header.tsx', 'utf-8');

if (!content.includes('className="main-nav hidden md:flex items-center gap-1"')) {
  content = content.replace(
    'className="hidden md:flex items-center gap-1"',
    'className="main-nav hidden md:flex items-center gap-1"'
  );
  fs.writeFileSync('src/components/Header.tsx', content);
}
