const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf-8');

if (!content.includes('mobile_admin_btn_label')) {
  content = content.replace(
    "admin_login_btn_text?: string;",
    "admin_login_btn_text?: string;\n  mobile_admin_btn_label?: string;\n  mobile_show_logged_username?: boolean;"
  );
  fs.writeFileSync('src/types.ts', content);
}
