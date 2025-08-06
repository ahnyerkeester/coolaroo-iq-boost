module.exports = {
  apps: [
    {
      name: 'blind-accessory',
      script: './homekit-project/blind.js',
      exec_mode: 'fork',
      instances: 1,
      watch: false,
      max_memory_restart: '150M',
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'raspicode',
      script: '/home/pi/raspicode/raspicode.py', // Replace with actual path
      interpreter: 'python3',
      exec_mode: 'fork',
      instances: 1,
      watch: false,
      max_memory_restart: '150M',
      env: { NODE_ENV: 'production' },
    },
  ],
};

