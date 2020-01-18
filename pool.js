const proc = require('child_process');
const events = require('events');

class Pool {
  constructor() {
    /** @type Map<proc.ChildProcess, string> */
    this.children = new Map();
  }

  /**
   * @typedef {'ignore' | 'inherit'} Stdio
   * @param {string} cmd
   * @param {Stdio} stdio
   */
  run(cmd, stdio = 'ignore') {
    const child = proc.spawn(cmd, { stdio, shell: true });
    this.children.set(child, cmd);
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

module.exports = { Pool };
