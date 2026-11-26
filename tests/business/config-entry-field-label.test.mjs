import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

describe('MES configuration entry label', () => {
  let vite;
  let ConfigEntryFieldLabel;
  let ConfigEntryLink;

  before(async () => {
    vite = await createServer({
      configFile: 'vite.config.ts',
      server: { middlewareMode: true },
      appType: 'custom',
    });
    ({ ConfigEntryFieldLabel, ConfigEntryLink } = await vite.ssrLoadModule(
      '/src/business/domains/shared/ConfigEntryFieldLabel.tsx',
    ));
  });

  after(async () => {
    await vite?.close();
  });

  it('includes the visible action text in the accessible link name', () => {
    const html = renderToStaticMarkup(
      React.createElement(ConfigEntryLink, {
        href: '/system/dict?typeCode=quality',
        permitted: true,
        label: '质量类型',
        actionText: '去配置',
      }),
    );

    assert.match(html, />去配置<\/a>/);
    assert.match(html, /aria-label="去配置：新标签页打开质量类型"/);
    assert.match(html, /target="_blank"/);
    assert.match(html, /rel="noreferrer"/);
  });

  it('does not render a maintenance link without host permission', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        ConfigEntryFieldLabel,
        { href: '/system/dict', permitted: false },
        '质量类型',
      ),
    );

    assert.match(html, /质量类型/);
    assert.doesNotMatch(html, /去配置/);
  });
});
