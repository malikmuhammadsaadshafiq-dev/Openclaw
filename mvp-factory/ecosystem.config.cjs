module.exports = {
  apps: [
    {
      name: 'mvp-daemon',
      script: '/usr/bin/node',
      args: '/root/Openclaw-repo/mvp-factory/node_modules/.bin/tsx daemon/mvp-factory-daemon-v11-multiagent.ts',
      cwd: '/root/Openclaw-repo/mvp-factory',
      interpreter: 'none',
      // Kill the ENTIRE process tree (tsx parent + child node worker) on restart
      treekill: true,
      kill_timeout: 10000,
      // Restart policy
      autorestart: true,
      max_restarts: 999,
      restart_delay: 2000,
      min_uptime: '5s',
      // Logging
      out_file: '/root/.openclaw/logs/daemon-v11.log',
      error_file: '/root/.openclaw/logs/daemon-v11.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
    },
  ],
};
