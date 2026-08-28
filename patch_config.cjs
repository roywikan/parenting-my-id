const fs = require('fs');
let content = fs.readFileSync('src/lib/config.ts', 'utf-8');

if (!content.includes('age_accessibility_preset:')) {
  content = content.replace(
    "font_density_scale: 'standard',",
    "font_density_scale: 'standard',\n  age_accessibility_preset: '29-38',"
  );
  fs.writeFileSync('src/lib/config.ts', content);
}
