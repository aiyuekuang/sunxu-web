import { CloseOutlined, MinusOutlined } from '@ant-design/icons';
import { ModalForm, type ModalFormProps } from '@ant-design/pro-components';
import type { ModalProps } from 'antd';
import React from 'react';
import { mergeMesDocumentModalStyles } from '../documentModalStyles';

function resolveDocumentMask(
  mask: ModalProps['mask'],
  legacyMaskClosable: boolean | undefined,
  minimized: boolean,
): ModalProps['mask'] {
  if (minimized || mask === false) return false;

  const closable = legacyMaskClosable ?? false;
  if (typeof mask === 'boolean' || mask === undefined) {
    return { enabled: mask ?? true, closable };
  }

  return { closable, ...mask };
}

export type DocumentModalFormProps<T, U> = ModalFormProps<T, U> & {
  /** Let this editor fill the browser viewport instead of its current tab panel. */
  viewportFullscreen?: boolean;
};

/**
 * MES document editor modal with the current tab containment, minimize/restore,
 * and draft-preserving behavior used by mes-admin.
 */
export function DocumentModalForm<
  // Keep the same defaults as Pro Components so existing ModalForm call sites
  // can migrate without changing the inferred onFinish values type.
  // biome-ignore lint/suspicious/noExplicitAny: Keep ModalForm's published defaults.
  T = Record<string, any>,
  // biome-ignore lint/suspicious/noExplicitAny: Keep ModalForm's published defaults.
  U = Record<string, any>,
>({
  title,
  open,
  onOpenChange,
  modalProps,
  children,
  viewportFullscreen = false,
  ...rest
}: DocumentModalFormProps<T, U>) {
  const [minimized, setMinimized] = React.useState(false);

  React.useEffect(() => {
    setMinimized(false);
  }, [open]);

  const resolvedWidth = rest.width ?? '100vw';
  const isFullScreen = resolvedWidth === '100vw' || resolvedWidth === '100%';
  const shouldRenderInsideTab =
    isFullScreen && modalProps?.getContainer === undefined;
  const shouldUseViewportFullscreen =
    viewportFullscreen && shouldRenderInsideTab;
  const modalWidth = isFullScreen ? '100%' : resolvedWidth;

  const titleText = typeof title === 'string' ? title : '未完成单据';
  const titleNode = (
    <div className="sxw-mes-document-modal__title">
      <span className="sxw-mes-document-modal__title-text">{title}</span>
      <span className="sxw-mes-document-modal__window-controls">
        <button
          type="button"
          className="sxw-mes-document-modal__window-button"
          title="最小化"
          aria-label="最小化单据窗口"
          onClick={() => setMinimized(true)}
        >
          <MinusOutlined aria-hidden="true" />
        </button>
        <button
          type="button"
          className="sxw-mes-document-modal__window-button sxw-mes-document-modal__window-button--close"
          title="关闭"
          aria-label="关闭单据窗口"
          onClick={() => onOpenChange?.(false)}
        >
          <CloseOutlined aria-hidden="true" />
        </button>
      </span>
    </div>
  );

  const formChildren =
    isFullScreen && typeof children !== 'function' ? (
      <div className="sxw-mes-document-modal__form-content document-form-content">
        {children}
      </div>
    ) : (
      children
    );

  return (
    <>
      {minimized && open ? (
        <button
          type="button"
          className="sxw-mes-document-modal__restore"
          title="点击还原"
          aria-label={`还原单据窗口：${titleText}`}
          onClick={() => setMinimized(false)}
        >
          <span className="sxw-mes-document-modal__restore-title">
            {titleText}
          </span>
          <span className="sxw-mes-document-modal__restore-hint">
            点击还原
          </span>
        </button>
      ) : null}
      <ModalForm<T, U>
        {...rest}
        title={titleNode}
        open={open}
        onOpenChange={onOpenChange}
        width={modalWidth}
        layout={rest.layout ?? 'vertical'}
        modalProps={{
          destroyOnHidden: true,
          centered: false,
          closable: false,
          ...modalProps,
          getContainer: shouldRenderInsideTab
            ? false
            : modalProps?.getContainer,
          styles: isFullScreen
            ? mergeMesDocumentModalStyles(modalProps?.styles)
            : modalProps?.styles,
          style: isFullScreen
            ? {
                top: 0,
                height: '100%',
                maxWidth: '100%',
                margin: 0,
                ...modalProps?.style,
              }
            : modalProps?.style,
          rootClassName: [
            shouldUseViewportFullscreen
              ? 'sxw-mes-document-modal-root--viewport'
              : shouldRenderInsideTab
                ? 'sxw-mes-document-modal-root'
                : '',
            modalProps?.rootClassName ?? '',
          ]
            .filter(Boolean)
            .join(' '),
          mask: resolveDocumentMask(
            modalProps?.mask,
            modalProps?.maskClosable,
            minimized,
          ),
          className: [
            isFullScreen ? 'sxw-mes-document-modal' : '',
            // Keep the MES host's established selector hook during migration.
            isFullScreen ? 'document-form-modal' : '',
            modalProps?.className ?? '',
          ]
            .filter(Boolean)
            .join(' '),
          wrapClassName: [
            modalProps?.wrapClassName ?? '',
            minimized ? 'sxw-mes-document-modal--minimized' : '',
          ]
            .filter(Boolean)
            .join(' '),
        }}
      >
        {formChildren}
      </ModalForm>
    </>
  );
}
