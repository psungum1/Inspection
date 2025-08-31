module.exports = {
  apps: [
    {
      name: 'pqms-backend',
      cwd: './server',
      script: 'src/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/log/pm2/pqms-backend-error.log',
      out_file: '/var/log/pm2/pqms-backend-out.log',
      log_file: '/var/log/pm2/pqms-backend-combined.log',
      time: true
    }
  ]
}; 