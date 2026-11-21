import { AndroidOutlined, AppleOutlined } from "@ant-design/icons";
import { Empty, Spin, Typography, theme } from "antd";
import type { ReactNode } from "react";

export type MesAppDownloadPanelProps = {
	loaded: boolean;
	loading: boolean;
	downloadUrl?: string | null;
	versionText?: string | null;
	serverAddress: string;
	qrCode?: ReactNode;
};

/**
 * @sunxu-component mes-specific
 * @sunxu-domain app-download
 * @sunxu-reason Shares MES download guidance while release data, server address and authorized QR rendering stay host supplied.
 */
export function MesAppDownloadPanel({
	loaded,
	loading,
	downloadUrl,
	versionText,
	serverAddress,
	qrCode,
}: MesAppDownloadPanelProps) {
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
				APP 下载
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
									: "扫描二维码下载 APP"}
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
							App Store 搜索下方名称下载
						</Typography.Text>
						<Typography.Text copyable strong style={lineStyle}>
							元问mes
						</Typography.Text>
					</div>

					<div style={serverTipStyle}>
						<Typography.Text type="secondary" style={lineStyle}>
							App 登录页点击「服务器地址设置」
						</Typography.Text>
						<Typography.Text type="secondary" style={lineStyle}>
							服务器地址填：
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
