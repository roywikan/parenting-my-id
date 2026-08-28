const fs = require('fs');
let content = fs.readFileSync('src/views/AdminPortal.tsx', 'utf-8');

const newStates = `
  const [cfgMobileAdminBtnLabel, setCfgMobileAdminBtnLabel] = useState(siteConfig?.mobile_admin_btn_label || 'Portal Admin & Editor');
  const [cfgMobileShowLoggedUsername, setCfgMobileShowLoggedUsername] = useState(siteConfig?.mobile_show_logged_username || false);
`;

content = content.replace(
  "const [cfgSiteName, setCfgSiteName] = useState(siteConfig?.site_name || 'Parenting.my.id');",
  "const [cfgSiteName, setCfgSiteName] = useState(siteConfig?.site_name || 'Parenting.my.id');" + newStates
);

const newEffect = `
      setCfgMobileAdminBtnLabel(siteConfig.mobile_admin_btn_label || 'Portal Admin & Editor');
      setCfgMobileShowLoggedUsername(siteConfig.mobile_show_logged_username || false);
`;

content = content.replace(
  "setCfgSiteName(siteConfig.site_name || 'Parenting.my.id');",
  "setCfgSiteName(siteConfig.site_name || 'Parenting.my.id');" + newEffect
);

const newSave = `
        mobile_admin_btn_label: cfgMobileAdminBtnLabel,
        mobile_show_logged_username: cfgMobileShowLoggedUsername,
`;

content = content.replace(
  "site_name: cfgSiteName,",
  "site_name: cfgSiteName," + newSave
);

fs.writeFileSync('src/views/AdminPortal.tsx', content);
