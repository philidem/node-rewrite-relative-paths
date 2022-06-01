import chalk from 'chalk';
import fs, { promises as fsPromises } from 'fs';

import PQueue from 'p-queue';
import path from 'path';
import { readIgnoreFiles } from './readIgnoreFiles';

const { readFile, writeFile } = fsPromises;

const Walker = require('walker');

const queue = new PQueue({ concurrency: 5 });

const DOUBLE_QUOTE_REGEXP = /(require\(")~(\/[^"]+)?(")/g;
const SINGLE_QUOTE_REGEXP = /(require\(')~((?:\/[^']+)?)(')/g;
const IMPORT_IN_TYPE_DECLARATION_FILE =
  /(import\(")((?:src|tools|test|bin)(?:\/[^"]+)?)(")/g;
const IMPORT_FROM_DOUBLE_QUOTE = /(from ")~(\/[^"]+)?(")/g;
const IMPORT_FROM_SINGLE_QUOTE = /(from ')~(\/[^']+)?(')/g;

function createReplacer(rootDir: string, srcFile: string) {
  return function (
    _: string,
    before: string,
    requiredFile: string,
    after: string
  ) {
    const from = '/' + path.dirname(srcFile);
    const to = '/' + requiredFile;
    let relativePath = path.relative(from, to);

    if (relativePath.charAt(0) !== '.') {
      relativePath = './' + relativePath;
    }

    return before + relativePath + after;
  };
}

function fixFile(rootDir: string, file: string) {
  queue
    .add(async () => {
      let srcFile = file;
      if (srcFile.startsWith(rootDir + '/')) {
        srcFile = srcFile.substring(rootDir.length + 1);
      }

      const oldContents = await readFile(file, { encoding: 'utf8' });
      let newContents = oldContents;

      if (file.endsWith('.js')) {
        newContents = newContents
          .replace(DOUBLE_QUOTE_REGEXP, createReplacer(rootDir, srcFile))
          .replace(SINGLE_QUOTE_REGEXP, createReplacer(rootDir, srcFile));
      } else if (file.endsWith('.ts')) {
        newContents = newContents
          .replace(
            IMPORT_IN_TYPE_DECLARATION_FILE,
            createReplacer(rootDir, srcFile)
          )
          .replace(IMPORT_FROM_DOUBLE_QUOTE, createReplacer(rootDir, srcFile))
          .replace(IMPORT_FROM_SINGLE_QUOTE, createReplacer(rootDir, srcFile));
      }

      if (oldContents === newContents) {
        console.log(chalk.gray(`Did not modify ${chalk.bold(srcFile)}`));
      } else {
        await writeFile(file, newContents, { encoding: 'utf8' });
        console.log(chalk.green(`Modified ${chalk.bold(srcFile)}`));
      }
    })
    .catch((err: Error) => {
      console.log(
        chalk.red(`Error writing ${chalk.bold(file)}. ${err.toString()}`)
      );
    });
}

export async function rewriteRequires(options: { dir: string }) {
  const workDir = process.cwd();
  const rootDir = path.resolve(workDir, options.dir);

  console.log(
    `Rewriting ~/* paths in ${chalk.bold(
      rootDir + '/**/*'
    )} so that they are relative...`
  );

  const filter = await readIgnoreFiles();

  await new Promise((resolve, reject) => {
    Walker(rootDir)
      .filterDir(function (dir: string, stats: fs.Stats) {
        const relative = path.relative(workDir, dir);
        return !relative || !filter.isIgnored(relative + '/');
      })
      .on('file', function (file: string, stats: fs.Stats) {
        const relative = path.relative(workDir, file);
        if (relative && filter.isIgnored(relative)) {
          return;
        }

        if (
          file.endsWith('.js') ||
          file.endsWith('.ts') ||
          file.endsWith('.jsx') ||
          file.endsWith('.tsx') ||
          file.indexOf('.') === -1
        ) {
          fixFile(rootDir, file);
        }
      })
      .on('end', function () {
        resolve(undefined);
      });
  });

  await queue.onIdle();

  console.log(chalk.green(chalk.bold('Done!')));
}
