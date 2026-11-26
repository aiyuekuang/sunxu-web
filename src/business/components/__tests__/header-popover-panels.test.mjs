import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

let vite;
let MesNotificationPanel;
let MesNotificationPanelContent;
let MesThemeOptionsPanel;
let MesAppDownloadPanel;
let MesSupportQRCode;

before(async () => {
	vite = await createServer({
		configFile: "vite.lib.config.ts",
		server: { middlewareMode: true },
		appType: "custom",
	});
	const [notification, theme, app, support] = await Promise.all([
		vite.ssrLoadModule("/src/business/components/MesNotificationPanel.tsx"),
		vite.ssrLoadModule("/src/business/components/MesThemeOptionsPanel.tsx"),
		vite.ssrLoadModule("/src/business/components/MesAppDownloadPanel.tsx"),
		vite.ssrLoadModule("/src/business/components/MesSupportQRCode.tsx"),
	]);
	MesNotificationPanel = notification.MesNotificationPanel;
	MesNotificationPanelContent = notification.MesNotificationPanelContent;
	MesThemeOptionsPanel = theme.MesThemeOptionsPanel;
	MesAppDownloadPanel = app.MesAppDownloadPanel;
	MesSupportQRCode = support.MesSupportQRCode;
});

after(async () => {
	await vite?.close();
});

test("notification popover exposes items, unread action, empty state and footer", () => {
	const html = renderToStaticMarkup(
		React.createElement(MesNotificationPanelContent, {
			unreadCount: 1,
			loading: false,
			items: [
				{
					id: "notice-1",
					title: "生产计划已更新",
					content: "计划单 MPS-001 已调整",
					createdAtText: "3 分钟前",
					isRead: false,
				},
			],
			onRead: () => undefined,
			onReadAll: () => undefined,
			onViewAll: () => undefined,
		}),
	);

	assert.match(html, /全部已读/);
	assert.match(html, /生产计划已更新/);
	assert.match(html, /计划单 MPS-001 已调整/);
	assert.match(html, /3 分钟前/);
	assert.match(html, /role="list"/);
	assert.match(html, /role="listitem"/);
	assert.match(html, /aria-label="生产计划已更新"/);
	assert.match(html, /查看全部通知/);
});

test("notification popover supports loading and empty states without read-all action", () => {
	const loadingHtml = renderToStaticMarkup(
		React.createElement(MesNotificationPanelContent, {
			unreadCount: 0,
			loading: true,
			items: [],
			onRead: () => undefined,
			onReadAll: () => undefined,
			onViewAll: () => undefined,
		}),
	);
	const emptyHtml = renderToStaticMarkup(
		React.createElement(MesNotificationPanelContent, {
			unreadCount: 0,
			loading: false,
			items: [],
			onRead: () => undefined,
			onReadAll: () => undefined,
			onViewAll: () => undefined,
		}),
	);

	assert.match(loadingHtml, /aria-busy="true"/);
	assert.doesNotMatch(loadingHtml, /全部已读/);
	assert.match(emptyHtml, /暂无通知/);
	assert.doesNotMatch(emptyHtml, /全部已读/);
	assert.match(emptyHtml, /查看全部通知/);
});

test("notification popover preserves the host supplied trigger and controlled visibility", () => {
	const html = renderToStaticMarkup(
		React.createElement(MesNotificationPanel, {
			trigger: React.createElement(
				"button",
				{ "aria-label": "通知", type: "button" },
				"铃铛",
			),
			open: false,
			onOpenChange: () => undefined,
			unreadCount: 0,
			loading: false,
			items: [],
			onRead: () => undefined,
			onReadAll: () => undefined,
			onViewAll: () => undefined,
		}),
	);

	assert.match(html, /aria-label="通知"/);
	assert.match(html, /铃铛/);
});

test("theme options retain selected state, swatch labels, and host selection", () => {
	const html = renderToStaticMarkup(
		React.createElement(MesThemeOptionsPanel, {
			options: [
				{ key: "green", label: "榫序绿", swatch: "#007D35" },
				{ key: "blue", label: "蓝色", swatch: "#1677ff" },
			],
			currentKey: "green",
			onSelect: () => undefined,
		}),
	);

	assert.match(html, /切换主题/);
	assert.match(html, /aria-pressed="true"/);
	assert.match(html, /aria-pressed="false"/);
	assert.match(html, /榫序绿/);
	assert.match(html, /蓝色/);
});

test("app download panel preserves loaded, loading, available, and empty release states", () => {
	const notLoaded = renderToStaticMarkup(
		React.createElement(MesAppDownloadPanel, {
			loaded: false,
			loading: false,
			serverAddress: "https://mes.example.com",
		}),
	);
	const loading = renderToStaticMarkup(
		React.createElement(MesAppDownloadPanel, {
			loaded: true,
			loading: true,
			serverAddress: "https://mes.example.com",
		}),
	);
	const available = renderToStaticMarkup(
		React.createElement(MesAppDownloadPanel, {
			loaded: true,
			loading: false,
			downloadUrl: "https://mes.example.com/app.apk",
			versionText: "版本号 42",
			serverAddress: "https://mes.example.com",
			qrCode: React.createElement("svg", { "aria-label": "下载二维码" }),
		}),
	);
	const unavailable = renderToStaticMarkup(
		React.createElement(MesAppDownloadPanel, {
			loaded: true,
			loading: false,
			serverAddress: "https://mes.example.com",
		}),
	);

	assert.equal(notLoaded, "");
	assert.match(loading, /APP 下载/);
	assert.match(loading, /ant-spin/);
	assert.match(available, /下载二维码/);
	assert.match(available, /版本号 42 · 扫码下载/);
	assert.match(available, /元问mes/);
	assert.match(available, /https:\/\/mes\.example\.com/);
	assert.match(unavailable, /暂未提供安卓 APP/);
	assert.match(unavailable, /iOS 下载/);
});

test("support QR card supports both layouts, accessible QR, and copyable account", () => {
	const verticalHtml = renderToStaticMarkup(
		React.createElement(MesSupportQRCode, {
			account: "mes-support",
			qrCode: React.createElement("svg", { title: "微信 mes-support" }),
		}),
	);
	const horizontalHtml = renderToStaticMarkup(
		React.createElement(MesSupportQRCode, {
			account: "mes-support",
			layout: "horizontal",
			qrCode: React.createElement("svg", { title: "微信 mes-support" }),
		}),
	);

	assert.match(verticalHtml, /微信 mes-support/);
	assert.match(verticalHtml, /扫码添加微信，或复制微信号搜索/);
	assert.match(verticalHtml, /title="微信 mes-support"/);
	assert.match(horizontalHtml, /flex-direction:row/);
});
