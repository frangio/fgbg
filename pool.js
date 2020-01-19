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

module.exports = { run, Pool };
