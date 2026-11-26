import { AndroidOutlined, AppleOutlined } from "@ant-design/icons";
import { Empty, Spin, Typography, theme } from "antd";
import type { ReactNode } from "react";

export type AppDownloadPanelProps = {
	applicationName: string;
	appStoreSearchName: string;
	loaded: boolean;
	loading: boolean;
	downloadUrl?: string | null;
	versionText?: string | null;
	serverAddress: string;
	appStoreInstruction?: string;
	serverAddressInstruction?: string;
	qrCode?: ReactNode;
};

/**
 * @sunxu-layer business
 * @sunxu-domain application
 * @sunxu-reason Shares application download and server setup guidance while release data, names, address and QR rendering stay host supplied.
 */
export function AppDownloadPanel({
	applicationName,
	appStoreSearchName,
	loaded,
	loading,
	downloadUrl,
	versionText,
	serverAddress,
	appStoreInstruction = 'App Store 搜索以下名称下载',
	serverAddressInstruction = '在应用登录页设置服务器地址',
	qrCode,
}: AppDownloadPanelProps) {
	const { token } = theme.useToken();
	if (!loaded) return null;
	const panelStyle = {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		gap: 12,
		padding: 8,
		width: "min(280px, calc(100vw - 16px))",
		minWidth: "min(240px, calc(100vw - 16px))",
		boxSizing: "border-box",
	} as const;
	const serverTipStyle = {
		width: "100%",
		padding: "8px 10px",
		borderRadius: token.borderRadius,
		backgroundColor: token.colorFillAlter,
		textAlign: "left",
	} as const;
	const lineStyle = {
		display: "block",
		fontSize: 12,
		lineHeight: "20px",
	} as const;

	return (
		<div style={panelStyle}>
			<Typography.Text style={{ fontWeight: 600, fontSize: 14 }}>
				{applicationName} 下载
			</Typography.Text>
			{loading ? (
				<Spin size="small" />
			) : (
				<>
					<Typography.Text
						style={{
							display: "inline-flex",
							alignItems: "center",
							gap: 6,
							fontSize: 13,
							fontWeight: 600,
						}}
					>
						<AndroidOutlined /> 安卓下载
					</Typography.Text>
					{downloadUrl && qrCode ? (
						<>
							{qrCode}
							<Typography.Text type="secondary" style={{ fontSize: 12 }}>
								{versionText
									? `${versionText} · 扫码下载`
									: `扫描二维码下载 ${applicationName}`}
							</Typography.Text>
						</>
					) : (
						<Empty
							image={Empty.PRESENTED_IMAGE_SIMPLE}
							description="暂未提供安卓 APP"
						/>
					)}

					<div style={serverTipStyle}>
						<Typography.Text
							style={{
								display: "inline-flex",
								alignItems: "center",
								gap: 6,
								fontSize: 13,
								fontWeight: 600,
							}}
						>
							<AppleOutlined /> iOS 下载
						</Typography.Text>
						<Typography.Text
							type="secondary"
							style={{ ...lineStyle, marginTop: 4 }}
						>
							{appStoreInstruction}
						</Typography.Text>
						<Typography.Text copyable strong style={lineStyle}>
							{appStoreSearchName}
						</Typography.Text>
					</div>

					<div style={serverTipStyle}>
						<Typography.Text type="secondary" style={lineStyle}>
							{serverAddressInstruction}
						</Typography.Text>
						<Typography.Text type="secondary" style={lineStyle}>
							服务器地址
						</Typography.Text>
						<Typography.Text copyable style={lineStyle}>
							{serverAddress}
						</Typography.Text>
					</div>
				</>
			)}
		</div>
	);
}
