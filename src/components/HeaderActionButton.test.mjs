import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

let vite;
let HeaderActionButton;

before(async () => {
	vite = await createServer({
		configFile: "vite.lib.config.ts",
		server: { middlewareMode: true },
		appType: "custom",
	});
	({ HeaderActionButton } = await vite.ssrLoadModule(
		"/src/components/HeaderActionButton.tsx",
	));
});

after(async () => {
	await vite?.close();
});

test("header action button preserves accessible naming, state, and content", () => {
	const html = renderToStaticMarkup(
		React.createElement(
			HeaderActionButton,
			{
				"aria-label": "通知",
				title: "通知",
				disabled: true,
				onClick: () => undefined,
			},
			React.createElement("span", null, "图标"),
		),
	);

	assert.match(html, /<button[^>]*type="button"/);
	assert.match(html, /aria-label="通知"/);
	assert.match(html, /title="通知"/);
	assert.match(html, /disabled=""/);
	assert.match(html, />图标<\/span>/);
});

test("header action button forwards refs for tooltip and popover triggers", () => {
	assert.equal(typeof HeaderActionButton.render, "function");
});
