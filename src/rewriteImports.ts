import PQueue from 'p-queue';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import chalk from 'chalk';
import ignore from 'ignore';
import { dirname, resolve, join, sep } from 'path';

const { readFile, writeFile } = fsPromises;

const Walker = require('walker');

const queue = new PQueue({ concurrency: 5 });

const DOUBLE_QUOTE_REGEXP = /( from ")((?:\.\/)?\.\.\/[^"]+)(")/g;
const SINGLE_QUOTE_REGEXP = /( from ')((?:\.\/)?\.\.\/[^']+)(')/g;

function createReplacer(dir: string) {
  return function (_: string, before: string, srcFile: string, after: string) {
    const resolvedPath = '~/' + resolve(dir, srcFile).substring(1);
    return before + resolvedPath + after;
  };
}

function fixFile(rootDir: string, file: string) {
  queue
    .add(async () => {
      let srcFile = file;
      if (srcFile.startsWith(rootDir + sep)) {
        srcFile = srcFile.substring(rootDir.length + 1);
      }

      const dir = sep + dirname(srcFile);
      const oldContents = await readFile(file, { encoding: 'utf8' });
      const newContents = oldContents
        .replace(DOUBLE_QUOTE_REGEXP, createReplacer(dir))
        .replace(SINGLE_QUOTE_REGEXP, createReplacer(dir));

      if (oldContents !== newContents) {
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

async function createIgnoreFilter() {
  let fileContents: string;
  try {
    fileContents = await readFile('.gitignore', { encoding: 'utf8' });
  } catch (err) {
    return {
      isIgnored() {
        return false;
      },
    };
  }

  const ignoreChecker = ignore().add(fileContents);

  return {
    isIgnored(file: string) {
      return file !== '.' && ignoreChecker.ignores(file);
    },
  };
}

export default async function rewriteImports(options: {
  dir: string;
  monorepo: boolean;
  files?: string[];
}) {
  const rootDir = resolve(process.cwd(), options.dir);

  console.log(
    `Rewriting relative paths for files in ${chalk.bold(
      rootDir
    )} so that they use ~/* convention...`
  );

  function handleFile(file: string) {
    if (!file.endsWith('.ts') && !file.endsWith('.tsx')) {
      return;
    }
    if (options.monorepo) {
      const packagesDir = join(rootDir, 'packages');
      if (file.startsWith(packagesDir + sep)) {
        const relativeFile = file.substring(packagesDir.length + 1);
        const pos = relativeFile.indexOf(sep);
        if (pos !== -1) {
          const packageName = relativeFile.substring(0, pos);
          fixFile(join(packagesDir, packageName), file);
        }
      }
    } else {
      fixFile(rootDir, file);
    }
  }

  if (options?.files?.length) {
    options.files.forEach(handleFile);
  } else {
    const filter = await createIgnoreFilter();
    const startDir = options.monorepo ? join(rootDir, 'packages') : rootDir;

    await new Promise((resolve, reject) => {
      Walker(startDir)
        .filterDir(function (dir: string, stats: fs.Stats) {
          if (dir.startsWith(rootDir)) {
            dir = dir.substring(rootDir.length);
          }

          if (dir.charAt(0) === sep) {
            dir = dir.substring(1);
          }

          if (dir.length === 0) {
            dir = '.';
          }

          return filter.isIgnored(dir) ? false : true;
        })
        .on('file', handleFile)
        .on('end', function () {
          resolve(undefined);
        });
    });

    await queue.onIdle();
  }

  console.log(chalk.green(chalk.bold('Done!')));
}
