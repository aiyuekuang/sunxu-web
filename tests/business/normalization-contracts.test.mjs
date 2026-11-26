import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const domains = [
  'accounting',
  'application',
  'documents',
  'inventory',
  'manufacturing',
  'printing',
  'procurement',
  'quality',
  'sales',
  'shared',
];

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

test('business package exposes neutral, domain-based entry points and one compatibility layer', async () => {
  const pkg = JSON.parse(await read('package.json'));
  const root = await read('src/business/index.ts');
  const compatibility = await read('src/business/compat/mesAliases.ts');

  for (const domain of domains) {
    assert.ok(pkg.exports[`./business/${domain}`], `missing ${domain} export`);
    const barrel = await read(`src/business/domains/${domain}/index.ts`);
    assert.doesNotMatch(barrel, /\b(?:Mes[A-Z]|useMes[A-Z]|MES_[A-Z])/);
  }
  assert.match(root, /export \* from '\.\/providers\/BusinessUiProvider'/);
  assert.doesNotMatch(root, /export \* from '\.\/compatibility'/);
  assert.doesNotMatch(root, /Mes[A-Z]|useMes[A-Z]/);
  assert.match(compatibility, /BusinessUiProvider as MesUiProvider/);
  assert.match(compatibility, /@deprecated/);
});

test('legacy MES package entry is generated from the shared compatibility layer', async () => {
  const pkg = JSON.parse(await read('package.json'));
  const vite = await read('vite.lib.config.ts');
  const entry = await read('src/business/compat/mesEntry.ts');

  assert.ok(!pkg.exports['./mes'].types.includes('/types/mes/'));
  assert.match(pkg.exports['./mes'].types, /business\/compat\/mesEntry\.d\.ts$/);
  assert.match(vite, /mes: 'src\/business\/compat\/mesEntry\.ts'/);
  assert.match(entry, /@deprecated/);
  assert.match(entry, /export \* from '\.\.\/index'/);
  assert.match(entry, /export \* from '\.\/mesAliases'/);
});

test('legacy table preference identifiers stay isolated in the compatibility layer', async () => {
  const legacyKeys = await read('src/business/compat/legacyStorageKeys.ts');
  const safeStorage = await read('src/business/utils/safeStorage.ts');
  const density = await read('src/business/theme/tableDensity.ts');
  const table = await read('src/business/domains/shared/ResizableTable.tsx');

  assert.match(legacyKeys, /LEGACY_TABLE_DENSITY_STORAGE_KEY\s*=\s*'mes-admin:table-density'/);
  assert.match(safeStorage, /LEGACY_TABLE_CACHE_KEY_PREFIXES/);
  assert.match(density, /LEGACY_TABLE_DENSITY_STORAGE_KEY/);
  assert.doesNotMatch(safeStorage, /mes-admin:table-|mes_table_(?:width|sort|cols)_/);
  assert.doesNotMatch(table, /mes-admin:table-|mes_table_(?:width|sort|cols)_/);
});

test('catalog loads shared business styles while importing source modules', async () => {
  const entry = await read('examples/catalog/main.tsx');
  assert.match(entry, /import ['"]\.\.\/\.\.\/src\/styles\.css['"]/);
  assert.match(entry, /import ['"]\.\.\/\.\.\/src\/business\/tableStyles\.css['"]/);
  assert.doesNotMatch(entry, /import ['"]\.\.\/\.\.\/src['"]/);
});

test('catalog lazily loads route pages and defers the GLB viewer until requested', async () => {
  const app = await read('examples/catalog/CatalogApp.tsx');
  const businessPage = await read('examples/catalog/BusinessComponentsPage.tsx');
  const viewer = await read('examples/catalog/GlbModelViewerDemo.tsx');

  assert.match(app, /lazy\(\(\)\s*=>\s*import\('\.\/BusinessComponentsPage'\)/);
  for (const routePage of ['TokensPage', 'ContainersPage', 'MappingsPage', 'StatesPage']) {
    assert.match(app, new RegExp(`lazy\\(\\(\\)\\s*=>\\s*import\\('./${routePage}'\\)`));
  }
  assert.match(app, /<Suspense fallback={<CatalogPageLoading \/>}>/);
  assert.match(app, /正在加载组件示例/);
  assert.match(businessPage, /IntersectionObserver/);
  assert.match(businessPage, /rootMargin: '900px 0px'/);
  assert.equal((businessPage.match(/<DeferredCatalogDemo component=\{/g) ?? []).length, 119);
  assert.doesNotMatch(businessPage, /import\s+\{\s*MaterialSelectorDemo\s*\}\s+from/);
  assert.match(viewer, /打开三维预览/);
  assert.match(viewer, /!viewerOpen \?/);
});

test('Node ESM package conditions point to generated explicit named-export wrappers', async () => {
  const pkg = JSON.parse(await read('package.json'));
  const generator = await read('tooling/generate-node-esm-entries.mjs');

  for (const [entry, file] of [
    ['.', 'index.mjs'],
    ['./business', 'business.mjs'],
    ['./business/accounting', 'business-accounting.mjs'],
    ['./mes', 'mes.mjs'],
  ]) {
    assert.equal(pkg.exports[entry].node.import, `./dist/node/${file}`);
  }
  assert.match(generator, /export const \$\{name\} = entry/);
  assert.match(generator, /dist\/node/);
});

test('application download copy is supplied by the consuming project', async () => {
  const source = await read('src/business/domains/application/AppDownloadPanel.tsx');
  assert.match(source, /applicationName:\s*string/);
  assert.match(source, /appStoreSearchName:\s*string/);
  assert.match(source, /\{applicationName\} 下载/);
  assert.doesNotMatch(source, /元问mes/i);
});

test('business catalog examples use host-neutral permission identifiers', async () => {
  const paths = [
    'examples/catalog/BusinessComponentsPage.tsx',
    'examples/catalog/ApplicationShellComponentsDemo.tsx',
    'examples/catalog/ImportWorkbenchDrawerDemo.tsx',
    'examples/catalog/BusinessPrintTemplatesDemo.tsx',
    'examples/catalog/OrderItemEditorDemo.tsx',
  ];

  for (const path of paths) {
    assert.doesNotMatch(await read(path), /\bmes:/i, `${path} should not imply a product permission namespace`);
  }
});

test('PDF preview loads its browser renderer only when the preview is opened', async () => {
  const source = await read('src/business/domains/shared/DrawingFilesInline.tsx');
  assert.match(source, /import\('react-pdf'\)/);
  assert.doesNotMatch(source, /import\s*\{[^}]*\}\s*from\s*'react-pdf'/);
});
