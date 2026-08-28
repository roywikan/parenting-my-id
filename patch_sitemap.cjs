const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

const oldSitemap = "  res.header('Content-Type', 'application/xml');\n  res.send(xml);";
const newSitemap = "  res.setHeader('Content-Type', 'application/xml; charset=utf-8');\n  res.status(200).send(xml.trim());";

content = content.replace(oldSitemap, newSitemap);

const oldRss = "  res.header('Content-Type', 'application/xml');\n  res.send(rss);";
const newRss = "  res.setHeader('Content-Type', 'application/xml; charset=utf-8');\n  res.status(200).send(rss.trim());";

content = content.replace(oldRss, newRss);

fs.writeFileSync('server.ts', content);
