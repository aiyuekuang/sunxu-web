import { CloseOutlined, NotificationOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useEffect, useState } from 'react';
import './announcement-banner.css';

export type AnnouncementPriority = 'urgent' | 'important' | (string & {});

export type AnnouncementBannerItem = {
  id: string;
  title?: string | null;
  content?: string | null;
  priority?: AnnouncementPriority | null;
};

export type AnnouncementBannerProps = {
  items: readonly AnnouncementBannerItem[];
  className?: string;
  /** Pauses the presentation timer while the document is hidden. */
  visible?: boolean;
  /** Host callback for opening the announcement detail route. */
  onOpen: (id: string) => void;
};

function compactText(value?: string | null) {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function getAnnouncementText(item: AnnouncementBannerItem) {
  const title = compactText(item.title);
  const content = compactText(item.content);
  return content ? `${title}：${content}` : title;
}

function getPriorityLabel(priority?: AnnouncementPriority | null) {
  if (priority === 'urgent') return '紧急';
  if (priority === 'important') return '重要';
  return null;
}

/**
 * @sunxu-layer business
 * @sunxu-domain application
 * @sunxu-reason Keeps announcement presentation and dismissal reusable while data, permissions, polling and navigation stay in the host.
 */
export function AnnouncementBanner({
  items,
  className,
  visible = true,
  onOpen,
}: AnnouncementBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissedItemIds, setDismissedItemIds] = useState<Set<string>>(
    () => new Set(),
  );
  const visibleItems = items.filter((item) => !dismissedItemIds.has(item.id));
  const currentItem = visibleItems[currentIndex] ?? visibleItems[0];
  const announcementText = currentItem ? getAnnouncementText(currentItem) : '';
  const priorityLabel = getPriorityLabel(currentItem?.priority);

  useEffect(() => {
    setCurrentIndex(0);
  }, [items]);

  useEffect(() => {
    if (currentIndex >= visibleItems.length) setCurrentIndex(0);
  }, [currentIndex, visibleItems.length]);

  useEffect(() => {
    if (!visible || visibleItems.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((index) => (index + 1) % visibleItems.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [visible, visibleItems.length]);

  if (!visible || !currentItem) return null;

  const handleClose = () => {
    setDismissedItemIds((previous) => new Set(previous).add(currentItem.id));
    setCurrentIndex(0);
  };

  return (
    <div
      className={[
        'sxw-mes-announcement-banner',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <button
        aria-label={`查看公告：${announcementText}`}
        className="sxw-mes-announcement-banner__content"
        onClick={() => onOpen(currentItem.id)}
        title={announcementText}
        type="button"
      >
        <NotificationOutlined
          aria-hidden="true"
          className="sxw-mes-announcement-banner__icon"
        />
        <span className="sxw-mes-announcement-banner__label">公告</span>
        {priorityLabel ? (
          <span
            className={`sxw-mes-announcement-banner__priority sxw-mes-announcement-banner__priority--${currentItem.priority}`}
          >
            {priorityLabel}
          </span>
        ) : null}
        <span className="sxw-mes-announcement-banner__marquee">
          <span
            className="sxw-mes-announcement-banner__track"
            style={{ transform: `translateY(-${currentIndex * 22}px)` }}
          >
            {visibleItems.map((item) => (
              <span
                className="sxw-mes-announcement-banner__item"
                key={item.id}
              >
                {getAnnouncementText(item)}
              </span>
            ))}
          </span>
        </span>
      </button>
      {visibleItems.length > 1 ? (
        <span className="sxw-mes-announcement-banner__count">
          {currentIndex + 1}/{visibleItems.length}
        </span>
      ) : null}
      <Button
        aria-label="隐藏当前公告"
        className="sxw-mes-announcement-banner__close"
        icon={<CloseOutlined aria-hidden="true" />}
        onClick={handleClose}
        size="small"
        type="text"
      />
    </div>
  );
}
