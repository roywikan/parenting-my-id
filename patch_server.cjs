const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf-8');

const configEndpoints = `
// ==========================================
// CONFIG ENDPOINTS (Reads/Writes to public/site_config.json)
// ==========================================
app.get('/api/config', (req, res) => {
  try {
    const configPath = path.join(process.cwd(), 'public', 'site_config.json');
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf-8');
      res.json(JSON.parse(configData));
    } else {
      res.json({});
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to read config' });
  }
});

app.post('/api/config', (req, res) => {
  try {
    const configPath = path.join(process.cwd(), 'public', 'site_config.json');
    fs.writeFileSync(configPath, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save config' });
  }
});
`;

if (!content.includes('/api/config')) {
  content = content.replace(
    "// ==========================================\n// ENDPOINTS\n// ==========================================",
    "// ==========================================\n// ENDPOINTS\n// ==========================================\n" + configEndpoints
  );
  fs.writeFileSync('server.ts', content);
}
