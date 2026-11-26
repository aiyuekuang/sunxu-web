import { CheckOutlined } from "@ant-design/icons";
import { Button, Empty, Listy, Popover, Spin, Typography, theme } from "antd";
import type { Key, ReactElement, ReactNode } from "react";

export type MesNotificationPanelItem = {
	id: Key;
	title: string;
	content?: string;
	createdAtText?: ReactNode;
	isRead: boolean;
};

export type MesNotificationPanelProps<
	TItem extends MesNotificationPanelItem = MesNotificationPanelItem,
> = {
	trigger: ReactElement;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	items: TItem[];
	unreadCount: number;
	loading: boolean;
	onRead: (item: TItem) => void;
	onReadAll: () => void;
	onViewAll: () => void;
};

export type MesNotificationPanelContentProps<
	TItem extends MesNotificationPanelItem = MesNotificationPanelItem,
> = Omit<MesNotificationPanelProps<TItem>, "trigger" | "open" | "onOpenChange">;

/**
 * @sunxu-layer business
 * @sunxu-domain notifications
 * @sunxu-reason Shares notification list presentation and states while data, permissions, read actions, timestamps and navigation stay host supplied.
 */
export function MesNotificationPanelContent<
	TItem extends MesNotificationPanelItem = MesNotificationPanelItem,
>({
	items,
	unreadCount,
	loading,
	onRead,
	onReadAll,
	onViewAll,
}: MesNotificationPanelContentProps<TItem>) {
	const { token } = theme.useToken();

	return (
		<div style={{ width: "min(360px, calc(100vw - 16px))" }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					padding: "0 4px",
				}}
			>
				<Typography.Text strong>通知</Typography.Text>
				{unreadCount > 0 ? (
					<Button
						type="link"
						size="small"
						icon={<CheckOutlined />}
						onClick={onReadAll}
					>
						全部已读
					</Button>
				) : null}
			</div>

			{loading ? (
				<div style={{ textAlign: "center", padding: 24 }} aria-busy="true">
					<Spin size="small" />
				</div>
			) : items.length === 0 ? (
				<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无通知" />
			) : (
				<div role="list">
					<Listy
						items={items}
						rowKey="id"
						virtual={false}
						styles={{
							item: {
								padding: "10px 4px",
								borderBottom: `1px solid ${token.colorSplit}`,
							},
						}}
						itemRender={(item) => (
							<div role="listitem">
								<button
									aria-label={String(item.title)}
									onClick={() => onRead(item)}
									type="button"
									style={{
										display: "block",
										width: "100%",
										padding: 0,
										border: 0,
										background: "transparent",
										color: "inherit",
										textAlign: "left",
										cursor: "pointer",
									}}
								>
									<div style={{ display: "flex", gap: 8, width: "100%" }}>
										{!item.isRead ? (
											<span
												aria-hidden="true"
												style={{
													width: 6,
													height: 6,
													borderRadius: "50%",
													backgroundColor: token.colorPrimary,
													flexShrink: 0,
													marginTop: 8,
												}}
											/>
										) : null}
										<div style={{ flex: 1, minWidth: 0 }}>
											<Typography.Text
												strong={!item.isRead}
												ellipsis
												style={{ display: "block", marginBottom: 2 }}
											>
												{item.title}
											</Typography.Text>
											<Typography.Paragraph
												type="secondary"
												ellipsis={{ rows: 1 }}
												style={{ marginBottom: 2, fontSize: 12 }}
											>
												{item.content}
											</Typography.Paragraph>
											<Typography.Text type="secondary" style={{ fontSize: 11 }}>
												{item.createdAtText}
											</Typography.Text>
										</div>
									</div>
								</button>
							</div>
						)}
					/>
				</div>
			)}

			<div
				style={{
					display: "flex",
					justifyContent: "center",
					padding: "8px 0 4px",
					borderTop: `1px solid ${token.colorBorderSecondary}`,
				}}
			>
				<Button type="link" size="small" onClick={onViewAll}>
					查看全部通知
				</Button>
			</div>
		</div>
	);
}

/**
 * @sunxu-layer business
 * @sunxu-domain notifications
 * @sunxu-reason Provides the notification popover boundary while open state and every business action stay host supplied.
 */
export function MesNotificationPanel<
	TItem extends MesNotificationPanelItem = MesNotificationPanelItem,
>({
	trigger,
	open,
	onOpenChange,
	...contentProps
}: MesNotificationPanelProps<TItem>) {
	return (
		<Popover
			content={<MesNotificationPanelContent {...contentProps} />}
			trigger="click"
			open={open}
			onOpenChange={onOpenChange}
			placement="bottomRight"
			arrow={false}
		>
			{trigger}
		</Popover>
	);
}
