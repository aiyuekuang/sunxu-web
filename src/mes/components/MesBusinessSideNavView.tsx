import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Button, Popover, Tooltip } from 'antd';
import type { MouseEvent, ReactNode } from 'react';
import './business-side-nav.css';

export type MesBusinessSideNavEntry = {
  key: string;
  path: string;
  title: string;
  icon?: ReactNode;
  active: boolean;
};

export type MesBusinessSideNavSection = {
  key: string;
  title: string;
  items: MesBusinessSideNavEntry[];
};

export type MesBusinessSideNavPrimaryItem = MesBusinessSideNavEntry & {
  hasChildren: boolean;
  sections: MesBusinessSideNavSection[];
  fallbackItem?: MesBusinessSideNavEntry;
};

export type MesBusinessSideNavViewProps = {
  collapsed?: boolean;
  primaryItems: MesBusinessSideNavPrimaryItem[];
  activePrimaryKey?: string;
  activePrimaryTitle?: string;
  sections?: MesBusinessSideNavSection[];
  fallbackItem?: MesBusinessSideNavEntry;
  search?: ReactNode;
  onCollapse?: (collapsed: boolean) => void;
  onPrimarySelect: (key: string) => void;
  onNavigate: (path: string) => void;
};

function navigateFromLink(
  event: MouseEvent<HTMLAnchorElement>,
  path: string,
  onNavigate: (path: string) => void,
) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }
  event.preventDefault();
  onNavigate(path);
}

function SecondaryNavItem({
  item,
  onNavigate,
}: {
  item: MesBusinessSideNavEntry;
  onNavigate: (path: string) => void;
}) {
  return (
    <a
      aria-current={item.active ? 'page' : undefined}
      className={`mes-business-side-nav-secondary-item ${
        item.active ? 'mes-business-side-nav-secondary-item-active' : ''
      }`}
      href={item.path}
      onClick={(event) => navigateFromLink(event, item.path, onNavigate)}
      title={item.path}
    >
      <span className="mes-business-side-nav-item-text">
        <span className="mes-business-side-nav-item-name">{item.title}</span>
      </span>
      <RightOutlined
        aria-hidden="true"
        className="mes-business-side-nav-secondary-arrow"
      />
    </a>
  );
}

function SectionList({
  sections,
  fallbackItem,
  onNavigate,
}: {
  sections: MesBusinessSideNavSection[];
  fallbackItem?: MesBusinessSideNavEntry;
  onNavigate: (path: string) => void;
}) {
  if (sections.length === 0) {
    return fallbackItem ? (
      <div className="mes-business-side-nav-section-items">
        <SecondaryNavItem item={fallbackItem} onNavigate={onNavigate} />
      </div>
    ) : null;
  }

  return (
    <>
      {sections.map((section) => (
        <section className="mes-business-side-nav-section" key={section.key}>
          <div className="mes-business-side-nav-section-title">
            {section.title}
          </div>
          <div className="mes-business-side-nav-section-items">
            {section.items.map((item) => (
              <SecondaryNavItem item={item} key={item.key} onNavigate={onNavigate} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

function CollapsedSubMenu({
  item,
  onNavigate,
}: {
  item: MesBusinessSideNavPrimaryItem;
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="mes-business-side-nav-popover-panel">
      <div className="mes-business-side-nav-popover-title">{item.title}</div>
      <div className="mes-business-side-nav-popover-list">
        <SectionList
          fallbackItem={item.fallbackItem}
          onNavigate={onNavigate}
          sections={item.sections}
        />
      </div>
    </div>
  );
}

function PrimaryNavItem({
  item,
  collapsed,
  onPrimarySelect,
  onNavigate,
}: {
  item: MesBusinessSideNavPrimaryItem;
  collapsed: boolean;
  onPrimarySelect: (key: string) => void;
  onNavigate: (path: string) => void;
}) {
  const content = (
    <button
      aria-label={item.title}
      aria-current={item.active ? 'page' : undefined}
      className={`mes-business-side-nav-primary-item ${
        item.active ? 'mes-business-side-nav-primary-item-active' : ''
      }`}
      onClick={() => onPrimarySelect(item.key)}
      type="button"
    >
      <span className="mes-business-side-nav-primary-icon">
        {item.icon}
      </span>
      {!collapsed ? (
        <span className="mes-business-side-nav-primary-title">
          {item.title}
        </span>
      ) : null}
    </button>
  );

  if (!collapsed) return content;

  if (item.hasChildren) {
    return (
      <Popover
        arrow={false}
        content={<CollapsedSubMenu item={item} onNavigate={onNavigate} />}
        destroyOnHidden
        mouseEnterDelay={0.08}
        placement="rightTop"
        rootClassName="mes-business-side-nav-popover"
        trigger="hover"
      >
        {content}
      </Popover>
    );
  }

  return (
    <Tooltip placement="right" title={item.title}>
      {content}
    </Tooltip>
  );
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain business-navigation
 * @sunxu-reason Keeps MES navigation presentation reusable while menu data, permissions, path matching, keyboard shortcuts and navigation stay in the host.
 */
export function MesBusinessSideNavView({
  collapsed = false,
  primaryItems,
  activePrimaryKey,
  activePrimaryTitle = '',
  sections = [],
  fallbackItem,
  search,
  onCollapse,
  onPrimarySelect,
  onNavigate,
}: MesBusinessSideNavViewProps) {
  return (
    <aside
      className={`mes-business-side-nav ${
        collapsed ? 'mes-business-side-nav-collapsed' : ''
      }`}
    >
      <div className="mes-business-side-nav-primary">
        <nav
          aria-label="一级业务导航"
          className="mes-business-side-nav-primary-list"
        >
          {primaryItems.map((item) => (
            <PrimaryNavItem
              collapsed={collapsed}
              item={{ ...item, active: item.key === activePrimaryKey }}
              key={item.key}
              onNavigate={onNavigate}
              onPrimarySelect={onPrimarySelect}
            />
          ))}
        </nav>
        {onCollapse ? (
          <Tooltip
            placement="right"
            title={collapsed ? '展开菜单' : '收起菜单'}
          >
            <button
              aria-label={collapsed ? '展开菜单' : '收起菜单'}
              className="mes-business-side-nav-collapse-button"
              onClick={() => onCollapse(!collapsed)}
              type="button"
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </button>
          </Tooltip>
        ) : null}
      </div>

      {!collapsed ? (
        <div className="mes-business-side-nav-secondary">
          {search}
          <div className="mes-business-side-nav-secondary-head">
            <span className="mes-business-side-nav-secondary-title">
              {activePrimaryTitle}
            </span>
            {sections.length > 0 ? (
              <span className="mes-business-side-nav-secondary-count">
                {sections.reduce((sum, section) => sum + section.items.length, 0)}
                个入口
              </span>
            ) : null}
          </div>
          <nav
            aria-label={`${activePrimaryTitle || '当前业务'}任务导航`}
            className="mes-business-side-nav-secondary-list"
          >
            <SectionList
              fallbackItem={fallbackItem}
              onNavigate={onNavigate}
              sections={sections}
            />
          </nav>
        </div>
      ) : null}
    </aside>
  );
}
