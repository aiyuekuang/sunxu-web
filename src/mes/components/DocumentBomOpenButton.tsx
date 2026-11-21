import { FileTextOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useState } from 'react';
import { useMesDocumentBomOpenCapabilities } from '../MesUiProvider';
import { DocumentBomDrawer } from './DocumentBomDrawer';
import type { DocumentBomOpenButtonProps } from './document-bom-open-types';

/**
 * @sunxu-component mes-specific
 * @sunxu-domain mes-document-bom
 * @sunxu-reason Preserves MES document BOM permission gates and edit/import shortcut behavior while the full drawer receives APIs, dictionaries, file handling, and policy from the host.
 */
export function DocumentBomOpenButton({
  documentType,
  documentId,
  title,
  children,
  buttonProps,
  editable,
  productQty,
  onSaved,
  initialEdit,
  initialImport,
}: DocumentBomOpenButtonProps) {
  const capabilities = useMesDocumentBomOpenCapabilities();
  const [open, setOpen] = useState(false);

  if (!documentId || !capabilities?.canView()) return <span>—</span>;

  const canUpdate = capabilities.canUpdate();
  const wantsEditShortcut = Boolean(initialEdit || initialImport);
  const effectiveEditable = Boolean(editable && canUpdate);
  const effectiveInitialEdit = canUpdate ? initialEdit : false;
  const effectiveInitialImport = canUpdate ? initialImport : false;
  const effectiveChildren =
    wantsEditShortcut && !canUpdate ? '查看单据 BOM' : children;
  const effectiveButtonProps =
    wantsEditShortcut && !canUpdate
      ? { ...buttonProps, icon: <FileTextOutlined /> }
      : buttonProps;

  return (
    <>
      <Button
        type="link"
        size="small"
        icon={<FileTextOutlined />}
        style={{ padding: 0 }}
        {...effectiveButtonProps}
        onClick={() => setOpen(true)}
      >
        {effectiveChildren ?? '查看单据 BOM'}
      </Button>
      {capabilities.drawerCapabilities ? (
        <DocumentBomDrawer
          open={open}
          documentType={documentType}
          documentId={documentId}
          title={title}
          editable={effectiveEditable}
          productQty={productQty}
          onSaved={onSaved}
          initialEdit={effectiveInitialEdit}
          initialImport={effectiveInitialImport}
          onClose={() => setOpen(false)}
          capabilities={{
            ...capabilities.drawerCapabilities,
            permissions: {
              canView: capabilities.canView,
              canUpdate: capabilities.canUpdate,
            },
          }}
        />
      ) : (
        capabilities.renderDrawer({
          open,
          documentType,
          documentId,
          title,
          editable: effectiveEditable,
          productQty,
          onSaved,
          initialEdit: effectiveInitialEdit,
          initialImport: effectiveInitialImport,
          onClose: () => setOpen(false),
        })
      )}
    </>
  );
}
