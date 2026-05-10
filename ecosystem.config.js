module.exports = {
  apps: [{
    name: 'diversified-os',
    script: 'node_modules/.bin/next',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_URL: 'postgresql://diversified:Div3rs1f1ed_DB_2026@localhost:5432/diversified_os',
      NOCODB_URL: 'https://data.snrglabs.com',
      N8N_URL: 'https://auto.snrglabs.com'
    }
  }]
}
