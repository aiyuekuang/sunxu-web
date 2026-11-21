import { Space } from 'antd';
import { useRef } from 'react';
import { SavedViewBar, type SavedViewItem } from '../../components/SavedViewBar';
import { DocumentFilterButton } from './DocumentFilterDrawer';
import './DocumentViewBar.css';

export interface DocumentViewBarView {
  id: string;
  name: string;
  isDefault?: boolean;
}

export interface DocumentViewBarController<TView extends DocumentViewBarView> {
  views: readonly TView[];
  loading: boolean;
  activeViewId?: string;
  dirty: boolean;
  activeFilterCount?: number;
  selectView: (viewId: string) => void;
  save: () => void | boolean | Promise<void | boolean>;
  saveAs: (params: { name: string }) => void | boolean | Promise<void | boolean>;
  setDefault: (view: TView) => void | boolean | Promise<void | boolean>;
  rename: (view: TView, name: string) => void | boolean | Promise<void | boolean>;
  remove: (view: TView) => void | boolean | Promise<void | boolean>;
  reorder: (
    orderedIds: string[],
  ) => void | boolean | Promise<void | boolean>;
  discardAndSwitch: () => void | boolean | Promise<void | boolean>;
  saveAndSwitch: () => void | boolean | Promise<void | boolean>;
};

export type DocumentViewBarProps<TView extends DocumentViewBarView> = {
  controller: DocumentViewBarController<TView>;
  onOpenFilters?: () => void;
  filterCount?: number;
};

/**
 * @sunxu-component mes-specific
 * @sunxu-domain mes-document-list
 * @sunxu-reason Adapts MES saved-view controller behavior to Sunxu's shared bar while the host owns view state and persistence.
 * MES document saved-view adapter with a neighboring filter entry.
 */
export function DocumentViewBar<TView extends DocumentViewBarView>({
  controller,
  onOpenFilters,
  filterCount,
}: DocumentViewBarProps<TView>) {
  const controllerRef = useRef(controller);
  controllerRef.current = controller;
  const activeFilterCount = filterCount ?? controller.activeFilterCount ?? 0;

  const views: SavedViewItem[] = controller.views.map((view) => ({
    id: view.id,
    name: view.name,
    scope: 'personal',
    isDefault: view.isDefault,
  }));

  const findView = (viewId: string) =>
    controller.views.find((view) => view.id === viewId);

  return (
    <div className="document-view-bar">
      <div className="document-view-tabs">
        <SavedViewBar
          views={views}
          activeViewId={controller.activeViewId}
          dirty={controller.dirty}
          loading={controller.loading}
          onChange={async (viewId) => {
            if (controllerRef.current.dirty) {
              controllerRef.current.selectView(viewId);
              await new Promise((resolve) => setTimeout(resolve, 0));
              controllerRef.current.discardAndSwitch();
              return true;
            }
            controllerRef.current.selectView(viewId);
            return true;
          }}
          onSave={() => controllerRef.current.save()}
          onSaveAs={(name) => controllerRef.current.saveAs({ name })}
          onRename={(viewId, name) => {
            const view = findView(viewId);
            return view ? controllerRef.current.rename(view, name) : false;
          }}
          onDelete={(viewId) => {
            const view = findView(viewId);
            return view ? controllerRef.current.remove(view) : false;
          }}
          onSetDefault={(viewId) => {
            const view = findView(viewId);
            return view ? controllerRef.current.setDefault(view) : false;
          }}
          onReorder={(orderedIds) => controllerRef.current.reorder(orderedIds)}
        />
      </div>
      <Space className="document-view-actions" size={6}>
        {onOpenFilters ? (
          <DocumentFilterButton
            appliedCount={activeFilterCount}
            onClick={onOpenFilters}
          />
        ) : null}
      </Space>
    </div>
  );
}
