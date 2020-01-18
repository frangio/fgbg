#!/usr/bin/env node

const events = require('events');

const { Pool } = require('./pool');

main();

async function main() {
  if (process.argv.length < 3) {
    console.error('usage: fgbg <fg> [bg]...');
    process.exit(1);
  }

  const fg = process.argv[2];
  const bg = process.argv.slice(3);

  const pool = new Pool;

  pool.run(fg, 'inherit');

  for (const cmd of bg) {
    pool.run(cmd);
  }

  await Promise.race([pool.someExit, events.once(process, 'exit')]);

  pool.killAll();
}
