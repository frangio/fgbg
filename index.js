#!/usr/bin/env node

const proc = require('child_process');
const events = require('events');

main();

async function main() {
  if (process.argv.length < 3) {
    console.error('usage: fgbg <fg> [bg]...');
    process.exit(1);
  }

  const fg = process.argv[2];
  const bg = process.argv.slice(3);

  const children = [];

  children.push(run(fg, 'inherit'));
  children.push(...bg.map(run));

  const exit = children.map(c => events.once(c, 'exit'));
  exit.push(events.once(process, 'exit'));

  await Promise.race(exit);

  for (const c of children) {
    c.kill();
  }
}

function run(cmd, stdio = 'ignore') {
  return proc.spawn(cmd, { stdio, shell: true });
}
