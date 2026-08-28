const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf-8');

if (!content.includes('age_accessibility_preset?:')) {
  content = content.replace(
    "font_density_scale?: 'compact' | 'standard' | 'spacious';",
    "font_density_scale?: 'compact' | 'standard' | 'spacious';\n  age_accessibility_preset?: '18-28' | '29-38' | '39-48' | '49-58';"
  );
  fs.writeFileSync('src/types.ts', content);
}
