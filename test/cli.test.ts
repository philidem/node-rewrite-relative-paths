import child_process from 'child_process';
import { promises as fsPromises } from 'fs';
import path from 'path';
import { rewriteImports, rewriteRequires } from '../src';

jest.setTimeout(10000);

const { readFile } = fsPromises;

const fakeProjectDir = path.join(__dirname, 'work/fake-project');

function build() {
  child_process.execFileSync('yarn', ['build'], {
    cwd: fakeProjectDir,
  });

  child_process.execFileSync('yarn', ['install'], {
    cwd: fakeProjectDir,
  });
}

beforeAll(async () => {
  await rewriteImports({
    dir: fakeProjectDir,
    monorepo: false,
  });

  build();

  await rewriteRequires({
    dir: path.join(fakeProjectDir, 'dist'),
  });
});

// NOTE: This test assumes that `yarn pretest` has been ran
test('should rewrite relative paths in imports to use "~"', async () => {
  const src_util_index = await readFile(
    path.join(__dirname, 'work/fake-project/src/util/index.ts'),
    { encoding: 'utf8' }
  );
  expect(src_util_index.includes('./formatUtil')).toBe(true);
  expect(src_util_index.includes('~/src/constants')).toBe(true);

  const tools_formatCode = await readFile(
    path.join(__dirname, 'work/fake-project/tools/formatCode.ts'),
    { encoding: 'utf8' }
  );
  expect(tools_formatCode.includes('~/src/util')).toBe(true);
});

test('should rewrite "~" paths in the output *.js files', async () => {
  const src_util_index = await readFile(
    path.join(__dirname, 'work/fake-project/dist/src/util/index.js'),
    { encoding: 'utf8' }
  );
  expect(src_util_index.includes('./formatUtil')).toBe(true);
  expect(src_util_index.includes('../constants')).toBe(true);

  const src_util_index_d = await readFile(
    path.join(__dirname, 'work/fake-project/dist/src/util/index.d.ts'),
    { encoding: 'utf8' }
  );
  expect(src_util_index_d.includes('./formatUtil')).toBe(true);
  expect(src_util_index_d.includes('../constants')).toBe(true);

  const tools_formatCode = await readFile(
    path.join(__dirname, 'work/fake-project/dist/tools/formatCode.js'),
    { encoding: 'utf8' }
  );
  expect(tools_formatCode.includes('../src/util')).toBe(true);
});

test('output js files should work', () => {
  const { default: formatCode } = require(path.join(
    fakeProjectDir,
    'dist/tools/formatCode'
  ));
  expect(formatCode()).toBe('test TEST');
});
