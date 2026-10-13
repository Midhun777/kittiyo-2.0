const { spawn } = require('child_process');

console.log('Starting LabDrop development environment...\n');

// 1. Start API Server (server.dev.js)
const apiProcess = spawn('node', ['server.dev.js'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

// 2. Start Vite Frontend Server
const viteProcess = spawn('npx', ['vite'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

function cleanup() {
  apiProcess.kill();
  viteProcess.kill();
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
