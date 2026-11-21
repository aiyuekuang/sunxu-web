import type { ButtonProps } from "antd";
import { Button, theme } from "antd";
import type { CSSProperties, ReactNode } from "react";
import { forwardRef } from "react";

export type HeaderActionButtonProps = Omit<
	ButtonProps,
	"shape" | "size" | "type"
> & {
	/** Accessible name for the icon-only action. */
	"aria-label": string;
	children?: ReactNode;
};

/**
 * @sunxu-component shared
 * @sunxu-domain application-header
 * @sunxu-reason Standardizes accessible icon-only actions while Tooltip, Popover, Badge, permissions and action behavior remain host composed.
 *
 * Token-sized icon-only action for application headers and toolbars.
 * Tooltip, Popover, Badge and all action behavior remain owned by the host.
 */
export const HeaderActionButton = forwardRef<
	HTMLButtonElement,
	HeaderActionButtonProps
>(function HeaderActionButton({ className, style, ...props }, ref) {
	const { token } = theme.useToken();
	const tokenStyle = {
		"--sxw-header-action-color": token.colorTextSecondary,
		"--sxw-header-action-hover-color": token.colorText,
		"--sxw-header-action-hover-background": token.colorFillTertiary,
		"--sxw-header-action-focus-color": token.colorPrimaryBorder,
		"--sxw-header-action-active-color": token.colorPrimary,
		"--sxw-header-action-active-background": token.colorFillSecondary,
	} as CSSProperties;

	return (
		<Button
			{...props}
			ref={ref}
			className={["sxw-header-action-button", className]
				.filter(Boolean)
				.join(" ")}
			type="text"
			style={{
				display: "inline-flex",
				alignItems: "center",
				justifyContent: "center",
				width: token.controlHeight,
				minWidth: token.controlHeight,
				height: token.controlHeight,
				padding: 0,
				fontSize: token.controlHeight / 2,
				borderRadius: token.borderRadiusLG,
				...tokenStyle,
				...style,
			}}
		/>
	);
});

HeaderActionButton.displayName = "HeaderActionButton";
