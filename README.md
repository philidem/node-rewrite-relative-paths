# Rewrite project paths

**TLDR:** This package helps you write code using imports with
`~/src/some/directory/someFile` instead of something like
`../../../../src/some/directory/someFile`.

## Motivation

If you're a JavaScript developer then you have probably seen code similar to the
following:

```typescript
// inside src/some/directory/file1.ts
import { doSomething } from '../../../util';
```

```typescript
// inside src/some/other/directory/file2.ts
import { doSomething } from '../../../../util';
```

Relative paths with `..` are difficult to read and interpret and it causes
inconsistency in `import` statement when importing the same file from different
source files.

The typescript compiler can be configured to support paths that are relative to
the project root.

For example, the examples above would become:

```typescript
// inside src/some/directory/file1.ts
import { doSomething } from '~/src/util';
```

```typescript
// inside src/some/other/directory/file2.ts
import { doSomething } from '~/src/util';
```

The `tsconfig.json` should be modified to have a `paths` property similar to the
following:

```json
{
  "compilerOptions": {
    "rootDir": ".",
    "baseUrl": ".",
    "outDir": "dist",
    "paths": {
      "~/*": ["./*"]
    }
  }
}
```

However, even when you configure typescript to understand these paths, the `~`
will still appear in the output `*.js` files. To fix the output `*.js` files you
will need to rewrite the `require(...)` statements so that the paths become
relative again.

This project exposes two commands:

- `rewrite-imports`: Rewrites source `*.ts` files so that paths with `import`
  statements using `../` are rewritten to use `~/`. You can run this command in
  directory that contains `*.ts` so that ugly `../` paths will be rewritten and
  then can be committed to your source code repository.

- `rewrite-requires`: Rewrites compiled `*.js` files so that paths in `require`
  statements are rewritten to always use relative paths. You can run this
  command after compiling typescript files to a target directory.

## Installation

```sh
npm install -D @philidem/rewrite-relative-paths
```

```sh
yarn add --dev @philidem/rewrite-relative-paths
```

## Usage

**Rewrite `import` statements in source files to use paths relative to project
root:**

```sh
# Using yarn
yarn rewrite-imports --dir .

# Using npm
npm run rewrite-imports --dir .
```

**Rewrite `require` statements in compiled \*.js files to use relative paths:**

```sh
# Using yarn
yarn rewrite-requires --dir ./dist

# Using npm
npm run rewrite-requires --dir ./dist
```
