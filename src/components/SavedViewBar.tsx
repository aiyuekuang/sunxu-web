import {
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  MoreOutlined,
  SaveOutlined,
  SortAscendingOutlined,
  StarOutlined,
  UpOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Dropdown,
  Form,
  Input,
  Modal,
  Space,
  Spin,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { MenuProps } from 'antd';
import { useEffect, useRef, useState } from 'react';

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
 * @sunxu-layer composite
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
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [orderedViewIds, setOrderedViewIds] = useState<string[]>([]);
  const [nameDialog, setNameDialog] = useState<NameDialog>(null);
  const [nameValue, setNameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<SavedViewItem>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const tabsRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);

  const activeView = views.find((view) => view.id === activeViewId);
  const viewLayoutKey = JSON.stringify(views.map(({ id, name }) => [id, name]));
  useEffect(() => {
    const scrollToActiveTab = () => {
      const activeTab = tabsRef.current?.querySelector<HTMLElement>(
        '[role="tab"][aria-selected="true"]',
      );
      activeTab?.scrollIntoView({
        block: 'nearest',
        inline: window.matchMedia('(max-width: 768px)').matches
          ? 'start'
          : 'nearest',
      });
    };
    scrollToActiveTab();
    window.addEventListener('resize', scrollToActiveTab);
    return () => window.removeEventListener('resize', scrollToActiveTab);
  }, [activeViewId, viewLayoutKey]);

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

  const confirmDelete = async () => {
    if (!deleteTarget || !onDelete) return;
    const succeeded = await runAction(() => onDelete(deleteTarget.id));
    if (succeeded) setDeleteTarget(undefined);
  };

  const openSortDialog = () => {
    setOrderedViewIds(views.map((view) => view.id));
    setSortDialogOpen(true);
  };

  const moveView = (viewId: string, direction: -1 | 1) => {
    setOrderedViewIds((current) => {
      const currentIndex = current.indexOf(viewId);
      const targetIndex = currentIndex + direction;
      if (currentIndex < 0 || targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }
      const next = [...current];
      [next[currentIndex], next[targetIndex]] = [
        next[targetIndex],
        next[currentIndex],
      ];
      return next;
    });
  };

  const saveViewOrder = async () => {
    if (!onReorder) return;
    const succeeded = await runAction(() => onReorder(orderedViewIds));
    if (succeeded) setSortDialogOpen(false);
  };

  const tabItems = views.map((view) => {
    const menuItems: MenuProps['items'] = [
      ...(onSetDefault && !view.isDefault
        ? [{ key: 'default', icon: <StarOutlined />, label: '设为默认' }]
        : []),
      ...(view.scope === 'personal' && onRename
        ? [{ key: 'rename', icon: <EditOutlined />, label: '重命名' }]
        : []),
      ...(view.scope === 'personal' && onDelete
        ? [{ key: 'delete', icon: <DeleteOutlined />, label: '删除', danger: true }]
        : []),
    ];

    const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
      if (key === 'default' && onSetDefault) {
        void runAction(() => onSetDefault(view.id));
      } else if (key === 'rename' && onRename) {
        openNameDialog({ mode: 'rename', view });
      } else if (key === 'delete' && onDelete) {
        setDeleteTarget(view);
      }
    };

    return {
      key: view.id,
      label: (
        <span className="sxw-saved-view-bar__tab-label">
          <span className="sxw-saved-view-bar__tab-text">{view.name}</span>
          {view.isDefault ? (
            <Tag className="sxw-saved-view-bar__default-tag" color="blue">
              默认
            </Tag>
          ) : null}
          {menuItems.length > 0 ? (
            <Dropdown
              trigger={['click']}
              menu={{ items: menuItems, onClick: handleMenuClick }}
              // React 的 portal 事件沿 React 树冒泡：弹层菜单项的点击会冒回
              // tab label，进而触发外层 tab 的 onClick 造成误切换
              //（antd v6 起外层 tab 节点也绑定 onClick）。在弹层容器上截断冒泡。
              popupRender={(menuNode) => (
                <div
                  onClick={(event) => event.stopPropagation()}
                  onMouseDown={(event) => event.stopPropagation()}
                >
                  {menuNode}
                </div>
              )}
            >
              <Button
                aria-label={`管理视图：${view.name}`}
                className="sxw-saved-view-bar__tab-menu"
                disabled={loading || busy}
                icon={<MoreOutlined aria-hidden="true" />}
                onClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
                size="small"
                type="text"
              />
            </Dropdown>
          ) : null}
        </span>
      ),
      children: null,
    };
  });
  const sortAction = onReorder ? (
    <Tooltip title="调整视图栏顺序">
      <Button
        disabled={loading || busy || views.length < 2}
        icon={<SortAscendingOutlined aria-hidden="true" />}
        onClick={openSortDialog}
        size="small"
        type="text"
      >
        排序
      </Button>
    </Tooltip>
  ) : null;

  return (
    <div className="sxw-saved-view-bar" role="group" aria-label="列表视图">
      <div className="sxw-saved-view-bar__row">
        <div
          className="sxw-saved-view-bar__tabs"
          aria-busy={loading}
          ref={tabsRef}
        >
          <Spin
            classNames={{
              root: 'sxw-saved-view-bar__tabs-spin',
              container: 'sxw-saved-view-bar__tabs-spin-container',
            }}
            spinning={loading}
            size="small"
          >
            <Tabs
              activeKey={activeViewId}
              animated={false}
              classNames={{
                root: 'sxw-saved-view-bar__tabs-root',
                item: 'sxw-saved-view-bar__tabs-item',
                indicator: 'sxw-saved-view-bar__tabs-indicator',
                header: 'sxw-saved-view-bar__tabs-header',
              }}
              items={tabItems}
              onChange={requestChange}
              size="small"
              tabBarGutter={12}
            />
          </Spin>
        </div>
        <Space size={6} className="sxw-saved-view-bar__actions">
          {sortAction}
          {dirty ? <Tag color="orange">未保存</Tag> : null}
          {activeView?.scope === 'personal' && onSave ? (
            <Tooltip title="更新当前视图">
              <Button
                disabled={loading || !dirty}
                icon={<SaveOutlined aria-hidden="true" />}
                loading={busy}
                onClick={() => void runAction(onSave)}
                size="small"
              >
                保存
              </Button>
            </Tooltip>
          ) : null}
          {onSaveAs ? (
            <Button
              size="small"
              loading={busy}
              disabled={loading}
              onClick={() => openNameDialog({ mode: 'save-as' })}
            >
              {activeView ? '另存为' : '保存为视图'}
            </Button>
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
        title="当前视图有未保存修改"
        width="min(520px, calc(100vw - 32px))"
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
          <Space wrap>
            <Button
              disabled={busy}
              onClick={() => {
                setSwitchDialogOpen(false);
                setPendingViewId(undefined);
              }}
            >
              取消
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
        保存会更新当前视图；放弃修改则直接切换到目标视图。
      </Modal>

      <Modal
        title={
          nameDialog?.mode === 'rename'
            ? '重命名视图'
            : activeView
              ? '另存为视图'
              : '保存为视图'
        }
        open={Boolean(nameDialog)}
        confirmLoading={busy}
        closable={!busy && !loading}
        mask={{ closable: !busy && !loading }}
        keyboard={!busy && !loading}
        okText="保存"
        cancelText="取消"
        width="min(440px, calc(100vw - 32px))"
        okButtonProps={{ disabled: !nameValue.trim() || loading }}
        onCancel={() => {
          if (!busy && !loading) setNameDialog(null);
        }}
        onOk={() => void submitNameDialog()}
      >
        {error ? <Alert type="error" showIcon message={error} role="alert" /> : null}
        <Form layout="vertical">
          <Form.Item label="视图名称" required>
            <Input
              aria-label="视图名称"
              autoFocus
              disabled={busy || loading}
              maxLength={40}
              showCount
              value={nameValue}
              onChange={(event) => setNameValue(event.target.value)}
              onPressEnter={() => void submitNameDialog()}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        cancelText="取消"
        confirmLoading={busy}
        okButtonProps={{ disabled: orderedViewIds.length < 2 || loading }}
        okText="保存排序"
        open={sortDialogOpen}
        title="排序视图"
        width="min(440px, calc(100vw - 32px))"
        onCancel={() => {
          if (!busy && !loading) setSortDialogOpen(false);
        }}
        onOk={() => void saveViewOrder()}
      >
        <ol className="sxw-saved-view-bar__sort-list" aria-label="视图顺序">
          {orderedViewIds.map((viewId, index) => {
            const view = views.find((item) => item.id === viewId);
            if (!view) return null;
            return (
              <li className="sxw-saved-view-bar__sort-item" key={view.id}>
                <Typography.Text
                  className="sxw-saved-view-bar__sort-index"
                  type="secondary"
                >
                  {index + 1}
                </Typography.Text>
                <Typography.Text
                  className="sxw-saved-view-bar__sort-name"
                  ellipsis
                >
                  {view.name}
                </Typography.Text>
                <Space size={0}>
                  <Button
                    aria-label={`上移视图：${view.name}`}
                    disabled={index === 0 || busy || loading}
                    icon={<UpOutlined aria-hidden="true" />}
                    onClick={() => moveView(view.id, -1)}
                    size="small"
                    type="text"
                  />
                  <Button
                    aria-label={`下移视图：${view.name}`}
                    disabled={index === orderedViewIds.length - 1 || busy || loading}
                    icon={<DownOutlined aria-hidden="true" />}
                    onClick={() => moveView(view.id, 1)}
                    size="small"
                    type="text"
                  />
                </Space>
              </li>
            );
          })}
        </ol>
      </Modal>

      <Modal
        title={`删除视图“${deleteTarget?.name ?? ''}”？`}
        width="min(520px, calc(100vw - 32px))"
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
        {deleteTarget?.id === activeViewId && dirty
          ? '当前视图有未保存修改，删除后这些修改也会丢弃。删除视图不会修改列表数据。'
          : '删除视图不会修改列表数据。'}
      </Modal>
    </div>
  );
}
