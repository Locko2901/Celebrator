module.exports = {
    apps: [
      {
        name: 'Celebrator',
        script: 'index.js',
        cwd: './src',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '512M',
        env: {
          NODE_ENV: 'production',
        },
        output: '/logs/Celebrator_out.log',
        error: '/logs/Celebrator_error.log',
        combine_logs: true,
        log_file: '/logs/Celebrator_combined.log',
      }
    ],
    modules: {
      'pm2-logrotate': {
        max_size: '10M',
        retain: '5',
        compress: true,
        dateFormat: 'YYYY-MM-DD_HH-mm-ss',
        workerInterval: '30',
        rotateInterval: '0 0 * * *',
        create_symlink: true,
        symlink_name: 'current.log'
      }
    }
  };