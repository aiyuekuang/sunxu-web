import { FilterOutlined } from '@ant-design/icons';
import { Button, Drawer, Space, Tag, theme } from 'antd';
import {
  createContext,
  type ReactNode,
  useContext,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import './DocumentFilterDrawer.css';

const DOCUMENT_FILTER_DRAWER_ACTIONS_COL_CLASS =
  'document-filter-drawer-actions-col';

const DocumentFilterDrawerFooterContext = createContext<HTMLDivElement | null>(
  null,
);

/**
 * @sunxu-layer business
 * @sunxu-domain documents
 * @sunxu-reason Presents reusable document filter search config behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export const DOCUMENT_FILTER_SEARCH_CONFIG = {
  labelWidth: 'auto',
  filterType: 'query',
  defaultCollapsed: false,
  collapseRender: false,
} as const;

export function createDocumentFilterSearchConfig(onReset?: () => void) {
  return {
    ...DOCUMENT_FILTER_SEARCH_CONFIG,
    onReset,
    optionRender: (_: unknown, __: unknown, dom: ReactNode[]) => [
      renderDocumentFilterDrawerActions(_, dom),
    ],
    submitterColSpanProps: {
      className: DOCUMENT_FILTER_DRAWER_ACTIONS_COL_CLASS,
      span: 24,
    },
  };
}

function DocumentFilterDrawerActions({ children }: { children: ReactNode }) {
  const footerContainer = useContext(DocumentFilterDrawerFooterContext);
  if (!footerContainer) return null;
  return createPortal(
    <div className="document-filter-drawer-actions">{children}</div>,
    footerContainer,
  );
}

/** Portal QueryFilter and ProForm submitters into the drawer's fixed footer. */
export function renderDocumentFilterDrawerActions(
  _: unknown,
  dom: ReactNode,
) {
  return <DocumentFilterDrawerActions>{dom}</DocumentFilterDrawerActions>;
}

export type DocumentFilterDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appliedCount: number;
  children: ReactNode;
};

/**
 * @sunxu-layer business
 * @sunxu-domain documents
 * @sunxu-reason Preserves the host document filter drawer and fixed submitter contract while the host owns field definitions and query effects.
 */
export function DocumentFilterDrawer({
  open,
  onOpenChange,
  appliedCount,
  children,
}: DocumentFilterDrawerProps) {
  const { token } = theme.useToken();
  const [footerContainer, setFooterContainer] = useState<HTMLDivElement | null>(
    null,
  );

  return (
    <Drawer
      rootClassName="document-filter-drawer"
      classNames={{ body: 'document-filter-drawer-body' }}
      title={
        <Space>
          <span>筛选</span>
          {appliedCount > 0 ? (
            <Tag color="blue">已应用 {appliedCount} 项</Tag>
          ) : null}
        </Space>
      }
      size="min(440px, 100vw)"
      open={open}
      onClose={() => onOpenChange(false)}
      destroyOnHidden={false}
      styles={{ body: { padding: 0, overflow: 'hidden' } }}
    >
      <DocumentFilterDrawerFooterContext.Provider value={footerContainer}>
        <div className="document-filter-drawer-content">{children}</div>
        <div
          ref={setFooterContainer}
          className="document-filter-drawer-footer"
          style={{
            backgroundColor: token.colorBgContainer,
            borderTop: `1px solid ${token.colorSplit}`,
          }}
        />
      </DocumentFilterDrawerFooterContext.Provider>
    </Drawer>
  );
}

export type DocumentFilterButtonProps = {
  appliedCount: number;
  onClick: () => void;
};

/**
 * @sunxu-layer business
 * @sunxu-domain documents
 * @sunxu-reason Keeps the applied-filter count and drawer entry together in host document result toolbars.
 */
export function DocumentFilterButton({
  appliedCount,
  onClick,
}: DocumentFilterButtonProps) {
  return (
    <Button icon={<FilterOutlined />} onClick={onClick} size="small">
      筛选{appliedCount > 0 ? `（${appliedCount}）` : ''}
    </Button>
  );
}
