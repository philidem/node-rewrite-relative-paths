/* istanbul ignore file */
import yargs from 'yargs';
import rewriteImports from '../rewriteImports';

export async function run() {
  const input = yargs
    .option('d', {
      alias: 'dir',
      type: 'string',
      required: true,
    })
    .option('monorepo', {
      type: 'boolean',
      required: false,
    })
    .option('h', {
      alias: 'help',
      type: 'boolean',
    }).argv as {
    dir?: string;
    monorepo?: boolean;
    help?: boolean;
    _: string[];
  };

  if (input.help) {
    return yargs.showHelp();
  }

  await rewriteImports({
    dir: input.dir!,
    files: input._,
    monorepo: input.monorepo === true,
  });
}
