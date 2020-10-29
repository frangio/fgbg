# fgbg

![npm](https://img.shields.io/npm/v/fgbg)

**`fgbg` is a lightweight tool that can run multiple commands concurrently**,
keeping one of them in the foreground and the rest silenced in the background.

It was built to solve the problem of running tests in watch mode for a
TypeScript project. With `fgbg` you can have the test runner watch for changes
in `*.js` files while you compile your `*.ts` sources into JavaScript in the
background.

## Installation

```
npm install --save-dev fgbg
```

## Example Usage

From the command line:

```
npx fgbg 'ava --watch' 'tsc --watch'
```

Or as a script in your `package.json`:

```diff
   "scripts": {
     "test": "ava",
+    "test:watch": "fgbg 'ava --watch' 'tsc --watch'
   },
```

```
npm run test:watch
```

## Additional arguments

Forward additional arguments to the foreground command using `--` as a separator.

```
npx fgbg 'ava --watch' 'tsc --watch' -- src/foo.test.ts
```
