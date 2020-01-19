#!/usr/bin/env node

const proc = require('child_process');
const events = require('events');

const { run, Pool } = require('./pool');

main();

async function main() {
  if (process.argv.length < 3) {
    console.error('usage: fgbg <fg> [bg]...');
    process.exit(1);
  }

  const fg = process.argv[2];
  const bg = process.argv.slice(3);

  const child = run(fg, 'inherit');

  const pool = new Pool(bg);

  await Promise.race([
    pool.someExit,
    events.once(child, 'exit'),
    events.once(process, 'exit'),
  ]);

  pool.killAll();
  child.kill();

  if (pool.exit) {
    console.error(`background command exited early: '${pool.exit.cmd}' (code ${pool.exit.code})`);
    process.exitCode = 1;
  }
}
