module.exports = {
  apps: [
    {
      name: "diversified-os",
      script: "node_modules/.bin/next",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        NOCODB_URL: "https://data.snrglabs.com",
        N8N_URL: "https://auto.snrglabs.com",
      },
    },
  ],
};
