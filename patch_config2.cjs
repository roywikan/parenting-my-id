const fs = require('fs');
let content = fs.readFileSync('src/lib/config.ts', 'utf-8');

if (!content.includes('mobile_admin_btn_label:')) {
  content = content.replace(
    "admin_login_btn_text: 'Masuk Portal CMS',",
    "admin_login_btn_text: 'Masuk Portal CMS',\n  mobile_admin_btn_label: 'Portal Admin & Editor',\n  mobile_show_logged_username: false,"
  );
  fs.writeFileSync('src/lib/config.ts', content);
}
