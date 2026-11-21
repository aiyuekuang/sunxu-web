import { WechatOutlined } from "@ant-design/icons";
import { Typography, theme } from "antd";
import type { CSSProperties, ReactNode } from "react";

export type MesSupportQRCodeProps = {
	account: string;
	qrCode: ReactNode;
	className?: string;
	layout?: "vertical" | "horizontal";
};

/**
 * @sunxu-component mes-specific
 * @sunxu-domain support-contact
 * @sunxu-reason Shares support contact presentation while account data and authorized QR rendering stay host supplied.
 */
export function MesSupportQRCode({
	account,
	qrCode,
	className,
	layout = "vertical",
}: MesSupportQRCodeProps) {
	const { token } = theme.useToken();
	const horizontal = layout === "horizontal";
	const rootStyle: CSSProperties = {
		display: "inline-flex",
		alignItems: "center",
		gap: 12,
		padding: 12,
		maxWidth: "100%",
		boxSizing: "border-box",
		borderRadius: token.borderRadiusLG,
		background: token.colorBgContainer,
		border: `1px solid ${token.colorBorderSecondary}`,
		flexDirection: horizontal ? "row" : "column",
		flexWrap: horizontal ? "wrap" : "nowrap",
		textAlign: horizontal ? "left" : "center",
	};

	return (
		<div className={className} style={rootStyle}>
			<span
				style={{
					display: "inline-flex",
					padding: 6,
					borderRadius: token.borderRadiusLG,
					background: "#ffffff",
					border: `1px solid ${token.colorBorderSecondary}`,
				}}
			>
				{qrCode}
			</span>
			<div style={{ display: "grid", gap: 4, minWidth: 0 }}>
				<Typography.Text
					style={{
						display: "inline-flex",
						alignItems: "center",
						justifyContent: horizontal ? "flex-start" : "center",
						gap: 6,
						color: "#079455",
						fontWeight: 600,
					}}
				>
					<WechatOutlined aria-hidden="true" /> 微信 {account}
				</Typography.Text>
				<Typography.Text
					copyable={{ text: account }}
					type="secondary"
					style={{ maxWidth: 180, fontSize: 12, lineHeight: 1.6 }}
				>
					扫码添加微信，或复制微信号搜索
				</Typography.Text>
			</div>
		</div>
	);
}
