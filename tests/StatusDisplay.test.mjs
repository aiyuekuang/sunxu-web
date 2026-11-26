import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

let vite;
let StatusDisplay;

before(async () => {
  vite = await createServer({
    configFile: 'vite.lib.config.ts',
    server: { middlewareMode: true },
    appType: 'custom',
  });
  ({ StatusDisplay } = await vite.ssrLoadModule(
    '/src/components/StatusDisplay.tsx',
  ));
});

after(async () => {
  await vite?.close();
});

const enumMap = {
  in_progress: { text: '进行中', status: 'Processing' },
  completed: { text: '已完成', status: 'Success' },
  custom: { text: '特殊状态', color: '#123456' },
};

test('status display maps known values to the shared status tag and label', () => {
  const html = renderToStaticMarkup(
    React.createElement(StatusDisplay, {
      value: 'in_progress',
      enumMap,
      className: 'order-status',
    }),
  );

  assert.match(html, /进行中/);
  assert.match(html, /sxw-status-tag/);
  assert.match(html, /order-status/);
});

test('status display uses explicit empty and unknown fallbacks', () => {
  const empty = renderToStaticMarkup(
    React.createElement(StatusDisplay, { value: '', enumMap, emptyLabel: '未设置' }),
  );
  const unknown = renderToStaticMarkup(
    React.createElement(StatusDisplay, {
      value: 'new_state',
      enumMap,
      unknownLabel: '其他状态',
    }),
  );

  assert.match(empty, /未设置/);
  assert.match(unknown, /其他状态/);
});

test('badge and text modes preserve mapped labels, colors, and caller label overrides', () => {
  const badge = renderToStaticMarkup(
    React.createElement(StatusDisplay, {
      value: 'completed',
      enumMap,
      mode: 'badge',
      label: '已经完成',
    }),
  );
  const text = renderToStaticMarkup(
    React.createElement(StatusDisplay, {
      value: 'custom',
      enumMap,
      mode: 'text',
      className: 'custom-status',
      style: { fontWeight: 600 },
    }),
  );

  assert.match(badge, /已经完成/);
  assert.match(badge, /ant-badge/);
  assert.match(text, /特殊状态/);
  assert.match(text, /custom-status/);
  assert.match(text, /#123456/);
  assert.match(text, /font-weight:600/);
});
