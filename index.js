#!/usr/bin/env node

const proc = require('child_process');
const events = require('events');

/**
 * @typedef {'ignore' | 'inherit'} Stdio
 * @param {string} cmd
 * @param {string[]} args
 * @param {'ignore' | 'inherit'} cmd
 * @param {Stdio} stdio
 */
function run(cmd, args = [], stdio = 'ignore') {
  return proc.spawn(cmd, args, { stdio, shell: true });
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
        const [code, signal] =
          /** @type {[number, number]} */
          (await events.once(cmd, 'exit'));

        this.exit = {
          code,
          signal,
          cmd: this.children.get(cmd),
        };
      }
    );
    return Promise.race(childrenExit);
  }
}

async function main() {
  if (process.argv.length < 3) {
    console.error('usage: fgbg <fg> [bg]... [-- <fg arg>...]');
    process.exit(1);
  }

  const argsIndex = Math.max(process.argv.length, process.argv.indexOf('--'));

  const fg = process.argv[2];
  const bg = process.argv.slice(3, argsIndex);
  const args = process.argv.slice(argsIndex);

  const child = run(fg, args, 'inherit');

  const pool = new Pool(bg);

  await Promise.race([
    pool.someExit,
    events.once(child, 'exit'),
    events.once(process, 'exit'),
    events.once(process, 'SIGTERM'),
    events.once(process, 'SIGINT'),
  ]);

  pool.killAll();
  child.kill();

  if (pool.exit) {
    const { code, signal, cmd } = pool.exit;
    const status = code !== null ? `exit code ${code}` : signal;
    console.error(`background command exited early: '${pool.exit.cmd}' (${status})`);
    process.exitCode = 1;
  }
}

main();
