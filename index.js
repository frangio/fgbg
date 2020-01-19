#!/usr/bin/env node

const proc = require('child_process');
const events = require('events');

/**
 * @typedef {'ignore' | 'inherit'} Stdio
 * @param {string} cmd
 * @param {Stdio} stdio
 */
function run(cmd, stdio = 'ignore') {
  return proc.spawn(cmd, { stdio, shell: true });
}

class Pool {
  /**
   * @param {string[]} cmds
   */
  constructor(cmds) {
    this.children = new Map(
      cmds.map(cmd => [run(cmd), cmd])
    );
  }

  killAll() {
    for (const c of this.children.keys()) {
      c.kill();
    }
  }

  get someExit() {
    const childrenExit = Array.from(
      this.children.keys(),
      async cmd => {
        const [code] =
          /** @type {[number]} */
          (await events.once(cmd, 'exit'));

        this.exit = {
          code,
          cmd: this.children.get(cmd),
        };
      }
    );
    return Promise.race(childrenExit);
  }
}

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

main();
