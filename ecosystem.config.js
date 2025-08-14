module.exports = {
  apps: [
    {
      name: 'catconecta-backend',
      script: './backend/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'catconecta-webapp',
      script: 'npm',
      args: 'start',
      cwd: './web-app',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        REACT_APP_API_URL: 'http://localhost:3001'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        REACT_APP_API_URL: 'https://api.catconecta.cl'
      }
    },
    {
      name: 'catconecta-dashboard',
      script: 'npm',
      args: 'start',
      cwd: './dashboard',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3002,
        REACT_APP_API_URL: 'http://localhost:3001'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3002,
        REACT_APP_API_URL: 'https://api.catconecta.cl'
      }
    }
  ],

  deploy: {
    production: {
      user: 'ubuntu',
      host: 'catconecta.cl',
      ref: 'origin/main',
      repo: 'https://github.com/jnrivra/catconecta.git',
      path: '/var/www/catconecta',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};