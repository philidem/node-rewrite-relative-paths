import { promises as fs } from 'fs';
import ignore from 'ignore';

export async function readIgnoreFiles(ignoreFiles: string[]) {
  const ignoreChecker = ignore();
  ignoreChecker.add('.git/');
  ignoreChecker.add('node_modules/');

  for (const file of ignoreFiles) {
    let fileContents: string;
    try {
      fileContents = await fs.readFile(file, { encoding: 'utf8' });
    } catch (err) {
      continue;
    }

    ignoreChecker.add(fileContents);
  }

  return {
    isIgnored(file: string) {
      return file && ignoreChecker.ignores(file);
    },
  };
}
