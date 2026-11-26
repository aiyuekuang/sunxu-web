import { App, Button, type ButtonProps } from 'antd';
import { useCallback, useState, type ReactNode } from 'react';
import { useMesPermission } from '../MesUiProvider';

export interface PermissionButtonProps extends Omit<ButtonProps, 'onClick'> {
  /** MES 权限码；权限解析由 `MesUiProvider` 注入。 */
  permission?: string;
  /** 业务条件；传入 false 时不渲染。 */
  visible?: boolean;
  confirm?: {
    title: string;
    content?: ReactNode;
    danger?: boolean;
    okText?: string;
    cancelText?: string;
  };
  /** 由宿主提供的确认后操作。 */
  onConfirm?: () => Promise<unknown>;
  successMessage?: string;
  onSuccess?: () => void;
  onClick?: ButtonProps['onClick'];
}

export function PermissionButton({
  permission,
  visible,
  confirm,
  onConfirm,
  successMessage,
  onSuccess,
  onClick,
  children,
  disabled,
  loading: externalLoading,
  ...rest
}: PermissionButtonProps) {
  const { modal, message } = App.useApp();
  const permitted = useMesPermission(permission);
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback<NonNullable<ButtonProps['onClick']>>(
    async (event) => {
      if (onClick && !confirm) {
        onClick(event);
        return;
      }
      if (!confirm || !onConfirm) return;

      const okText = confirm.okText ?? '确定';
      modal.confirm({
        title: confirm.title,
        content: confirm.content,
        okType: confirm.danger ? 'danger' : 'primary',
        okText,
        cancelText: confirm.cancelText ?? (okText === '取消' ? '关闭' : '取消'),
        onOk: async () => {
          setLoading(true);
          try {
            await onConfirm();
            if (successMessage) message.success(successMessage);
            onSuccess?.();
          } catch (error) {
            modal.error({
              title: '操作未完成',
              content: extractErrorMessage(error),
            });
          } finally {
            setLoading(false);
          }
        },
      });
    },
    [confirm, message, modal, onClick, onConfirm, onSuccess, successMessage],
  );

  if (visible === false || !permitted) return null;

  return (
    <Button
      {...rest}
      disabled={disabled || loading || !!externalLoading}
      loading={externalLoading || loading}
      onClick={handleClick}
    >
      {children}
    </Button>
  );
}

function extractErrorMessage(error: unknown): string {
  const err = error as {
    info?: { msg?: string };
    data?: { msg?: string };
    response?: { data?: { msg?: string } };
  };

  return (
    err?.info?.msg ??
    err?.data?.msg ??
    err?.response?.data?.msg ??
    (error instanceof Error ? error.message : undefined) ??
    '操作失败'
  );
}
