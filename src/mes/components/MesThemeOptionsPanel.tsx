import { CheckOutlined } from "@ant-design/icons";
import { theme } from "antd";
import type { CSSProperties, ReactNode } from "react";
import "./MesThemeOptionsPanel.css";

export type MesThemeOption = {
	key: string;
	label: ReactNode;
	swatch: string;
};

export type MesThemeOptionsPanelProps = {
	options: MesThemeOption[];
	currentKey: string;
	onSelect: (key: string) => void;
	title?: ReactNode;
};

/**
 * @sunxu-component mes-specific
 * @sunxu-domain application-theme
 * @sunxu-reason Shares theme option presentation while preference persistence and application configuration stay host owned.
 */
export function MesThemeOptionsPanel({
	options,
	currentKey,
	onSelect,
	title = "切换主题",
}: MesThemeOptionsPanelProps) {
	const { token } = theme.useToken();
	const style = {
		"--sxw-mes-theme-text": token.colorText,
		"--sxw-mes-theme-hover": token.colorFillQuaternary,
		"--sxw-mes-theme-focus": token.colorPrimaryBorder,
		"--sxw-mes-theme-active-border": token.colorPrimaryBorder,
		"--sxw-mes-theme-active-bg": token.colorPrimaryBg,
		"--sxw-mes-theme-radius": `${token.borderRadiusLG}px`,
	} as CSSProperties;

	return (
		<div className="sxw-mes-theme-options" style={style}>
			<div className="sxw-mes-theme-options__title">{title}</div>
			<div className="sxw-mes-theme-options__list">
				{options.map((option) => {
					const selected = option.key === currentKey;
					return (
						<button
							aria-pressed={selected}
							className={[
								"sxw-mes-theme-options__item",
								selected ? "sxw-mes-theme-options__item--selected" : null,
							]
								.filter(Boolean)
								.join(" ")}
							key={option.key}
							onClick={() => onSelect(option.key)}
							type="button"
						>
							<span
								aria-hidden="true"
								className="sxw-mes-theme-options__swatch"
								style={{
									backgroundColor: option.swatch,
									borderRadius: token.borderRadiusSM,
									boxShadow: `inset 0 0 0 1px ${token.colorBgContainer}`,
								}}
							/>
							<span className="sxw-mes-theme-options__label">
								{option.label}
							</span>
							{selected ? (
								<CheckOutlined
									aria-hidden="true"
									className="sxw-mes-theme-options__check"
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
