module.exports = {
  apps: [
    {
      name: "TestPrj-Proxy",
      script: "dist/app.js",
      instances: 3,
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "development"
      },
      env_production: {
        NODE_ENV: "production"
      }
    }
  ]
};
