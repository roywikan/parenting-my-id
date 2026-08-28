const fs = require('fs');
let content = fs.readFileSync('src/components/Header.tsx', 'utf-8');

const oldSpan = "<span>Portal Admin & Editor</span>";
const newSpan = "<span>\n                  {siteConfig?.mobile_show_logged_username && currentUser ? `${currentUser.name} (${currentUser.role.toUpperCase()})` : siteConfig?.mobile_admin_btn_label || 'Portal Admin & Editor'}\n                </span>";

content = content.replace(oldSpan, newSpan);
fs.writeFileSync('src/components/Header.tsx', content);
