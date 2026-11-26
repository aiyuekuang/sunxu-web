import type { ModalProps } from 'antd';

type ModalStyleFunction = Extract<
  NonNullable<ModalProps['styles']>,
  (info: { props: ModalProps }) => unknown
>;
type ModalStyleRecord = Exclude<
  NonNullable<ModalProps['styles']>,
  ModalStyleFunction
>;
type ModalStyleFunctionInfo = Parameters<ModalStyleFunction>[0];

export type DocumentModalStyleOptions = {
  paddedBody?: boolean;
  variant?: 'document-form' | 'formula-workbench';
  overlay?: 'tab' | 'viewport';
};

const documentFormStyles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    top: 0,
    width: '100%',
    height: '100%',
    minHeight: 0,
    maxHeight: '100%',
    maxWidth: '100%',
    margin: 0,
    paddingBottom: 0,
  },
  container: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flex: '1 1 auto',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    minHeight: 0,
    maxHeight: '100%',
    overflow: 'hidden',
    padding: 0,
    borderRadius: 0,
    pointerEvents: 'auto',
  },
  mask: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'auto',
  },
  wrapper: {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    pointerEvents: 'auto',
  },
  header: {
    flex: '0 0 auto',
    marginBottom: 0,
    padding: '16px 24px',
    borderBottom: '1px solid var(--ant-color-border-secondary, #ebebeb)',
  },
  close: {
    top: 12,
  },
  body: {
    flex: '1 1 auto',
    minHeight: 0,
    overflow: 'auto',
    padding: 0,
    background: 'var(--ant-color-bg-container, #ffffff)',
  },
  footer: {
    flex: '0 0 auto',
    marginTop: 0,
    padding: '12px 24px',
    background: 'var(--ant-color-bg-container, #ffffff)',
    borderTop: '1px solid var(--ant-color-border-secondary, #ebebeb)',
  },
} satisfies ModalStyleRecord;

const documentFormPanelStyle = {
  display: 'flex',
  flexDirection: 'column',
  top: 0,
  width: '100%',
  height: '100%',
  minHeight: 0,
  maxHeight: '100%',
  maxWidth: '100%',
  margin: 0,
  paddingBottom: 0,
  pointerEvents: 'auto',
} satisfies NonNullable<ModalProps['style']>;

const paddedDocumentFormBodyStyles = {
  body: {
    padding: '20px 24px 24px',
  },
} satisfies ModalStyleRecord;

const formulaWorkbenchStyles = {
  container: {
    overflow: 'hidden',
  },
  body: {
    maxHeight: 'none',
    overflow: 'hidden',
  },
} satisfies ModalStyleRecord;

const tabOverlayStyles = {
  root: {
    position: 'absolute',
    inset: 0,
    zIndex: 1000,
    pointerEvents: 'none',
  },
  mask: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'auto',
  },
  wrapper: {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    pointerEvents: 'auto',
  },
} satisfies ModalStyleRecord;

const viewportOverlayStyles = {
  root: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    height: '100dvh',
    pointerEvents: 'none',
  },
  mask: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'auto',
  },
  wrapper: {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    pointerEvents: 'auto',
  },
} satisfies ModalStyleRecord;

function mergeStyleRecords(
  defaults: ModalStyleRecord,
  overrides?: ModalStyleRecord,
): ModalStyleRecord {
  return {
    ...defaults,
    ...overrides,
    root: { ...defaults.root, ...overrides?.root },
    container: { ...defaults.container, ...overrides?.container },
    header: { ...defaults.header, ...overrides?.header },
    body: { ...defaults.body, ...overrides?.body },
    footer: { ...defaults.footer, ...overrides?.footer },
    close: { ...defaults.close, ...overrides?.close },
    title: { ...defaults.title, ...overrides?.title },
    wrapper: { ...defaults.wrapper, ...overrides?.wrapper },
    mask: { ...defaults.mask, ...overrides?.mask },
  };
}

/** Merge the full-screen document layout with Ant Design Modal slots. */
export function mergeDocumentModalStyles(
  overrides: ModalProps['styles'],
  options: DocumentModalStyleOptions = {},
): NonNullable<ModalProps['styles']> {
  const componentDefaults =
    options.variant === 'formula-workbench'
      ? formulaWorkbenchStyles
      : options.paddedBody
        ? mergeStyleRecords(documentFormStyles, paddedDocumentFormBodyStyles)
        : documentFormStyles;
  const overlayDefaults =
    options.overlay === 'viewport'
      ? viewportOverlayStyles
      : options.overlay === 'tab'
        ? tabOverlayStyles
        : undefined;
  const defaults = overlayDefaults
    ? mergeStyleRecords(componentDefaults, overlayDefaults)
    : componentDefaults;

  if (typeof overrides === 'function') {
    return (info: ModalStyleFunctionInfo) =>
      mergeStyleRecords(defaults, overrides(info));
  }

  return mergeStyleRecords(defaults, overrides);
}

/** Keep full-screen geometry on the dialog panel and preserve caller overrides. */
export function mergeDocumentModalPanelStyle(
  overrides: ModalProps['style'],
): NonNullable<ModalProps['style']> {
  return {
    ...documentFormPanelStyle,
    ...overrides,
  };
}
