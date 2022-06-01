#!/usr/bin/env node

/* istanbul ignore file */
import chalk from 'chalk';
import yargs from 'yargs';
import { rewriteRequires } from '~/src/rewriteRequires';

async function run() {
  const input = yargs
    .option('d', {
      alias: 'dir',
      type: 'string',
      required: true,
    })
    .option('h', {
      alias: 'help',
      type: 'boolean',
    }).argv as {
    dir?: string;
    help?: boolean;
    _: string[];
  };

  if (input.help) {
    return yargs.showHelp();
  }

  await rewriteRequires({
    dir: input.dir!,
  });
}

run().catch((err) => {
  console.error(
    chalk.red(`${chalk.bold('Error running command')}. Error: ${err.stack}`)
  );
});
