import { CheckOutlined } from "@ant-design/icons";
import { theme } from "antd";
import type { CSSProperties, ReactNode } from "react";
import './ThemeOptionsPanel.css';

export type ThemeOption = {
	key: string;
	label: ReactNode;
	swatch: string;
};

export type ThemeOptionsPanelProps = {
	options: ThemeOption[];
	currentKey: string;
	onSelect: (key: string) => void;
	title?: ReactNode;
};

/**
 * @sunxu-layer business
 * @sunxu-domain application
 * @sunxu-reason Shares theme option presentation while preference persistence and application configuration stay host owned.
 */
export function ThemeOptionsPanel({
	options,
	currentKey,
	onSelect,
	title = "切换主题",
}: ThemeOptionsPanelProps) {
	const { token } = theme.useToken();
	const style = {
		"--sxw-theme-text": token.colorText,
		"--sxw-theme-hover": token.colorFillQuaternary,
		"--sxw-theme-focus": token.colorPrimaryBorder,
		"--sxw-theme-active-border": token.colorPrimaryBorder,
		"--sxw-theme-active-bg": token.colorPrimaryBg,
		"--sxw-theme-radius": `${token.borderRadiusLG}px`,
	} as CSSProperties;

	return (
		<div className="sxw-theme-options" style={style}>
			<div className="sxw-theme-options__title">{title}</div>
			<div className="sxw-theme-options__list">
				{options.map((option) => {
					const selected = option.key === currentKey;
					return (
						<button
							aria-pressed={selected}
							className={[
								"sxw-theme-options__item",
								selected ? "sxw-theme-options__item--selected" : null,
							]
								.filter(Boolean)
								.join(" ")}
							key={option.key}
							onClick={() => onSelect(option.key)}
							type="button"
						>
							<span
								aria-hidden="true"
								className="sxw-theme-options__swatch"
								style={{
									backgroundColor: option.swatch,
									borderRadius: token.borderRadiusSM,
									boxShadow: `inset 0 0 0 1px ${token.colorBgContainer}`,
								}}
							/>
							<span className="sxw-theme-options__label">
								{option.label}
							</span>
							{selected ? (
								<CheckOutlined
									aria-hidden="true"
									className="sxw-theme-options__check"
									style={{ color: token.colorPrimary }}
								/>
							) : null}
						</button>
					);
				})}
			</div>
		</div>
	);
}
