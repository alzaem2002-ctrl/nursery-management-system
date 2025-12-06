module.exports = {
  apps: [
    {
      name: 'nursery-system',
      script: 'server.js',
      args: '',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}