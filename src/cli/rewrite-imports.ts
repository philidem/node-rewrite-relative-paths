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

  await rewriteImports({
    dir: input.dir!,
  });
}
