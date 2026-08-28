const fs = require('fs');
let content = fs.readFileSync('src/views/AdminPortal.tsx', 'utf-8');

if (!content.includes('import { THEME_PRESETS }')) {
  content = content.replace(
    "import { Post, AutoLink, User, SiteConfig } from '../types';",
    "import { Post, AutoLink, User, SiteConfig } from '../types';\nimport { THEME_PRESETS } from '../lib/themes';"
  );
}

if (!content.includes('Droplet')) {
  content = content.replace(
    "UserCheck } from 'lucide-react';",
    "UserCheck, Droplet } from 'lucide-react';"
  );
}

fs.writeFileSync('src/views/AdminPortal.tsx', content);
