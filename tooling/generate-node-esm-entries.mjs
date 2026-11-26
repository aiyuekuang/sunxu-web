import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const require = createRequire(import.meta.url);
const outputDirectory = path.join(root, 'dist/node');

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

for (const [packagePath, conditions] of Object.entries(packageJson.exports)) {
  if (typeof conditions !== 'object' || !conditions.import || !conditions.require) continue;

  const esmTarget = conditions.import.replace(/^\.\/dist\//, '');
  const cjsTarget = conditions.require.replace(/^\.\/dist\//, '');
  const cjsExports = require(path.join(root, 'dist', cjsTarget));
  const names = Object.keys(cjsExports).filter((name) => name !== 'default' && name !== '__esModule');

  for (const name of names) {
    if (!/^[$A-Z_a-z][$\w]*$/.test(name)) {
      throw new Error(`Cannot generate a named Node ESM export for ${packagePath}: ${name}`);
    }
  }

  const outputName = esmTarget.replace(/\.js$/, '.mjs');
  const outputPath = path.join(outputDirectory, outputName);
  const cjsImport = path.posix.join('..', cjsTarget);
  const lines = [
    `import entry from ${JSON.stringify(cjsImport)};`,
    ...names.map((name) => `export const ${name} = entry[${JSON.stringify(name)}];`),
    '',
  ];

  await writeFile(outputPath, lines.join('\n'));
}
