import chalk from 'chalk';
import fs, { promises as fsPromises } from 'fs';
import PQueue from 'p-queue';
import path, { dirname, join, resolve, sep } from 'path';
import { readIgnoreFiles } from './readIgnoreFiles';

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

export async function rewriteImports(options: {
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

  const filter = await readIgnoreFiles();

  const handleFile = function (file: string) {
    if (!file.endsWith('.ts') && !file.endsWith('.tsx')) {
      return;
    }

    const relative = path.relative(rootDir, file);
    if (relative && filter.isIgnored(relative)) {
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
  };

  if (options?.files?.length) {
    options.files.forEach(handleFile);
  } else {
    const startDir = options.monorepo ? join(rootDir, 'packages') : rootDir;

    await new Promise((resolve, reject) => {
      Walker(startDir)
        .filterDir(function (dir: string, stats: fs.Stats) {
          const relative = path.relative(rootDir, dir);
          return !relative || !filter.isIgnored(relative + '/');
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
