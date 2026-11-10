import { MoreOutlined } from '@ant-design/icons';
import { Alert, Button, Dropdown, Input, Modal, Space, Spin, Tabs, Tag } from 'antd';
import type { MenuProps } from 'antd';
import { useMemo, useRef, useState } from 'react';

export type SavedViewScope = 'system' | 'personal';

export type SavedViewItem = {
  id: string;
  name: string;
  scope: SavedViewScope;
  isDefault?: boolean;
};

export type SavedViewAction = () => void | boolean | Promise<void | boolean>;
export type SavedViewChangeAction = (
  viewId: string,
) => void | boolean | Promise<void | boolean>;

export type SavedViewBarProps = {
  views: readonly SavedViewItem[];
  activeViewId?: string;
  dirty?: boolean;
  loading?: boolean;
  onChange: SavedViewChangeAction;
  onSave?: SavedViewAction;
  onSaveAs?: (name: string) => void | boolean | Promise<void | boolean>;
  onRename?: (
    viewId: string,
    name: string,
  ) => void | boolean | Promise<void | boolean>;
  onDelete?: SavedViewChangeAction;
  onSetDefault?: SavedViewChangeAction;
  onReorder?: (
    orderedViewIds: string[],
  ) => void | boolean | Promise<void | boolean>;
  onActionError?: (error: unknown) => void;
};

type NameDialog =
  | { mode: 'save-as' }
  | { mode: 'rename'; view: SavedViewItem }
  | null;

/**
 * @sunxu-component shared
 *
 * Controlled system/personal list view selector and manager. The host owns persistence,
 * filter/sort/column snapshots, authorization, and the API that applies a selected view.
 */
export function SavedViewBar({
  views,
  activeViewId,
  dirty = false,
  loading = false,
  onChange,
  onSave,
  onSaveAs,
  onRename,
  onDelete,
  onSetDefault,
  onReorder,
  onActionError,
}: SavedViewBarProps) {
  const [pendingViewId, setPendingViewId] = useState<string>();
  const [switchDialogOpen, setSwitchDialogOpen] = useState(false);
  const [nameDialog, setNameDialog] = useState<NameDialog>(null);
  const [nameValue, setNameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<SavedViewItem>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const busyRef = useRef(false);

  const activeView = views.find((view) => view.id === activeViewId);
  const tabItems = useMemo(
    () =>
      views.map((view) => ({
        key: view.id,
        label: (
          <span className="sxw-saved-view-bar__tab-label">
            {view.name}
            {view.isDefault ? <Tag color="blue">默认</Tag> : null}
          </span>
        ),
        children: null,
      })),
    [views],
  );

  const runAction = async (
    action: () => void | boolean | Promise<void | boolean>,
  ) => {
    if (busyRef.current || loading) return false;
    busyRef.current = true;
    setBusy(true);
    setError(undefined);
    try {
      const result = await action();
      return result !== false;
    } catch (caught) {
      setError('操作未完成，请检查后重试。');
      onActionError?.(caught);
      return false;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const requestChange = (nextViewId: string) => {
    if (nextViewId === activeViewId || loading || busy) return;
    if (dirty) {
      setPendingViewId(nextViewId);
      setSwitchDialogOpen(true);
      return;
    }
    void runAction(() => onChange(nextViewId));
  };

  const discardAndSwitch = async () => {
    if (!pendingViewId) return;
    const succeeded = await runAction(() => onChange(pendingViewId));
    if (succeeded) {
      setSwitchDialogOpen(false);
      setPendingViewId(undefined);
    }
  };

  const saveAndSwitch = async () => {
    if (!pendingViewId || !onSave) return;
    const saved = await runAction(onSave);
    if (!saved) return;
    const switched = await runAction(() => onChange(pendingViewId));
    if (switched) {
      setSwitchDialogOpen(false);
      setPendingViewId(undefined);
    }
  };

  const openNameDialog = (dialog: Exclude<NameDialog, null>) => {
    setNameValue(dialog.mode === 'rename' ? dialog.view.name : '');
    setNameDialog(dialog);
    setError(undefined);
  };

  const submitNameDialog = async () => {
    const normalizedName = nameValue.trim();
    if (!normalizedName || !nameDialog) return;
    const action =
      nameDialog.mode === 'save-as'
        ? () => onSaveAs?.(normalizedName)
        : () => onRename?.(nameDialog.view.id, normalizedName);
    const succeeded = await runAction(action);
    if (succeeded) setNameDialog(null);
  };

  const moveActiveView = (direction: -1 | 1) => {
    if (!activeView || !onReorder) return;
    const currentIndex = views.findIndex((view) => view.id === activeView.id);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= views.length) return;
    const orderedIds = views.map((view) => view.id);
    [orderedIds[currentIndex], orderedIds[targetIndex]] = [
      orderedIds[targetIndex],
      orderedIds[currentIndex],
    ];
    void runAction(() => onReorder(orderedIds));
  };

  const viewMenuItems: MenuProps['items'] = [
    ...(activeView && onSetDefault && !activeView.isDefault
      ? [{ key: 'default', label: '设为默认视图' }]
      : []),
    ...(activeView?.scope === 'personal' && onRename
      ? [{ key: 'rename', label: '重命名' }]
      : []),
    ...(onReorder && views.length > 1
      ? [
          { key: 'move-up', label: '移至上一位', disabled: views[0]?.id === activeViewId },
          {
            key: 'move-down',
            label: '移至下一位',
            disabled: views.at(-1)?.id === activeViewId,
          },
        ]
      : []),
    ...(activeView?.scope === 'personal' && onDelete
      ? [{ key: 'delete', label: '删除视图', danger: true }]
      : []),
  ];

  const handleViewMenu: MenuProps['onClick'] = ({ key }) => {
    if (!activeView) return;
    if (key === 'default' && onSetDefault) {
      void runAction(() => onSetDefault(activeView.id));
    } else if (key === 'rename' && onRename) {
      openNameDialog({ mode: 'rename', view: activeView });
    } else if (key === 'move-up') {
      moveActiveView(-1);
    } else if (key === 'move-down') {
      moveActiveView(1);
    } else if (key === 'delete' && onDelete) {
      setDeleteTarget(activeView);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !onDelete) return;
    const succeeded = await runAction(() => onDelete(deleteTarget.id));
    if (succeeded) setDeleteTarget(undefined);
  };

  return (
    <div className="sxw-saved-view-bar" role="group" aria-label="列表视图">
      <div className="sxw-saved-view-bar__row">
        <div className="sxw-saved-view-bar__tabs" aria-busy={loading}>
          <Spin spinning={loading} size="small">
            <Tabs
              activeKey={activeViewId}
              animated={false}
              items={tabItems}
              onChange={requestChange}
              size="small"
              tabBarGutter={16}
            />
          </Spin>
        </div>
        <Space size={4} className="sxw-saved-view-bar__actions">
          {dirty && activeView?.scope === 'personal' && onSave ? (
            <Button
              size="small"
              loading={busy}
              disabled={loading}
              onClick={() => void runAction(onSave)}
            >
              保存
            </Button>
          ) : null}
          {onSaveAs ? (
            <Button
              size="small"
              loading={busy}
              disabled={loading}
              onClick={() => openNameDialog({ mode: 'save-as' })}
            >
              另存为
            </Button>
          ) : null}
          {viewMenuItems.length > 0 ? (
            <Dropdown
              trigger={['click']}
              menu={{ items: viewMenuItems, onClick: handleViewMenu }}
            >
              <Button
                type="text"
                size="small"
                aria-label={`管理视图${activeView ? `：${activeView.name}` : ''}`}
                icon={<MoreOutlined aria-hidden="true" />}
                disabled={loading || busy}
              />
            </Dropdown>
          ) : null}
        </Space>
      </div>

      {error ? (
        <Alert
          className="sxw-saved-view-bar__error"
          type="error"
          showIcon
          message={error}
          role="alert"
        />
      ) : null}

      <Modal
        title="切换视图"
        open={switchDialogOpen}
        closable={!busy && !loading}
        mask={{ closable: !busy && !loading }}
        keyboard={!busy && !loading}
        onCancel={() => {
          if (busy || loading) return;
          setSwitchDialogOpen(false);
          setPendingViewId(undefined);
          setError(undefined);
        }}
        footer={
          <Space>
            <Button
              disabled={busy}
              onClick={() => {
                setSwitchDialogOpen(false);
                setPendingViewId(undefined);
              }}
            >
              继续编辑
            </Button>
            <Button danger loading={busy} onClick={() => void discardAndSwitch()}>
              放弃修改并切换
            </Button>
            {onSave ? (
              <Button type="primary" loading={busy} onClick={() => void saveAndSwitch()}>
                保存并切换
              </Button>
            ) : null}
          </Space>
        }
      >
        {error ? <Alert type="error" showIcon message={error} role="alert" /> : null}
        当前视图有未保存修改。
      </Modal>

      <Modal
        title={nameDialog?.mode === 'rename' ? '重命名视图' : '另存为视图'}
        open={Boolean(nameDialog)}
        confirmLoading={busy}
        closable={!busy && !loading}
        mask={{ closable: !busy && !loading }}
        keyboard={!busy && !loading}
        okText="保存"
        cancelText="取消"
        okButtonProps={{ disabled: !nameValue.trim() || loading }}
        onCancel={() => {
          if (!busy && !loading) setNameDialog(null);
        }}
        onOk={() => void submitNameDialog()}
      >
        {error ? <Alert type="error" showIcon message={error} role="alert" /> : null}
        <Input
          aria-label="视图名称"
          autoFocus
          disabled={busy || loading}
          maxLength={40}
          value={nameValue}
          onChange={(event) => setNameValue(event.target.value)}
          onPressEnter={() => void submitNameDialog()}
        />
      </Modal>

      <Modal
        title={`删除视图“${deleteTarget?.name ?? ''}”？`}
        open={Boolean(deleteTarget)}
        confirmLoading={busy}
        closable={!busy && !loading}
        mask={{ closable: !busy && !loading }}
        keyboard={!busy && !loading}
        okText="删除"
        cancelText="取消"
        okButtonProps={{ danger: true, disabled: loading }}
        onCancel={() => {
          if (!busy && !loading) setDeleteTarget(undefined);
        }}
        onOk={() => void confirmDelete()}
      >
        {error ? <Alert type="error" showIcon message={error} role="alert" /> : null}
        只删除视图，不修改列表数据。
      </Modal>
    </div>
  );
}
