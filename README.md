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

The `tsconfig.json` would need to be modified to have the following `paths`
property similar to the following:

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

This project exposes to utility functions:

- `rewrite-imports`: Rewrites source `*.ts` files so that paths with `import`
  statements using `../` are rewritten to use `~/`.

- `rewrite-requires`: Rewrites compiled `*.js` files so that paths in `require`
  statements using `~/` are rewritten to use `../`.

## Installation

```sh
npm install -D @philidem/rewrite-project-paths
```

```sh
yarn add --dev @philidem/rewrite-project-paths
```

## Usage

```sh
# Using yarn
yarn rewrite-imports --dir .

# Using npm
npm run rewrite-imports --dir .
```
