import {
  AudioMutedOutlined,
  CaretRightOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  HomeOutlined,
  PauseOutlined,
  ReloadOutlined,
  SettingOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import React, { useEffect, useRef, useState } from 'react';
import './large-screen-components.css';
import type { ScreenHeaderProps } from './screen-header-types';
export type {
  ScreenHeaderCapabilities,
  ScreenHeaderProps,
} from './screen-header-types';

function formatNow(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function formatUpdated(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `更新于 ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function ActionButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="sunxu-mes-screen-action-button"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain large-screen dashboard header
 * @sunxu-reason MES large-screen pages share clock, route, refresh, playback, voice, and fullscreen controls.
 *
 * Top bar for MES large-screen dashboards. Navigation is delegated to the host;
 * refresh, playback and voice behavior remain caller-owned callbacks.
 */
export function ScreenHeader({
  capabilities,
  title,
  backPath = '/dashboard',
  onRefresh,
  lastUpdated,
  showRefresh = true,
  autoPlaying,
  onToggleAutoPlay,
  voiceEnabled,
  onToggleVoice,
  onOpenVoiceSettings,
}: ScreenHeaderProps) {
  const { navigate } = capabilities;
  const [clock, setClock] = useState(formatNow);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    clockRef.current = setInterval(() => setClock(formatNow()), 1000);
    return () => {
      if (clockRef.current) clearInterval(clockRef.current);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.fullscreenElement) {
        navigate(backPath);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [backPath, navigate]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen();
    } else {
      void document.exitFullscreen();
    }
  };

  return (
    <header className="sunxu-mes-screen-header">
      <div className="sunxu-mes-screen-header-clock">
        <span className="sunxu-mes-screen-clock">{clock}</span>
        {lastUpdated && (
          <span className="sunxu-mes-screen-updated-hint">{formatUpdated(lastUpdated)}</span>
        )}
      </div>

      <h1 className="sunxu-mes-screen-title">{title}</h1>

      <div className="sunxu-mes-screen-actions">
        {onToggleVoice && (
          <ActionButton
            label={voiceEnabled ? '关闭语音播报' : '开启语音播报'}
            onClick={onToggleVoice}
          >
            {voiceEnabled ? (
              <SoundOutlined className="sunxu-mes-screen-action-icon" aria-hidden="true" />
            ) : (
              <AudioMutedOutlined
                className="sunxu-mes-screen-action-icon"
                aria-hidden="true"
              />
            )}
          </ActionButton>
        )}
        {voiceEnabled && onOpenVoiceSettings && (
          <ActionButton label="语音播报设置" onClick={onOpenVoiceSettings}>
            <SettingOutlined className="sunxu-mes-screen-action-icon" aria-hidden="true" />
          </ActionButton>
        )}
        {onToggleAutoPlay && (
          <ActionButton
            label={autoPlaying ? '暂停自动播放' : '开启自动播放'}
            onClick={onToggleAutoPlay}
          >
            {autoPlaying ? (
              <PauseOutlined className="sunxu-mes-screen-action-icon" aria-hidden="true" />
            ) : (
              <CaretRightOutlined
                className="sunxu-mes-screen-action-icon"
                aria-hidden="true"
              />
            )}
          </ActionButton>
        )}
        <ActionButton
          label="返回首页"
          onClick={() => navigate(backPath)}
        >
          <HomeOutlined className="sunxu-mes-screen-action-icon" aria-hidden="true" />
        </ActionButton>
        {showRefresh && onRefresh && (
          <ActionButton label="刷新" onClick={onRefresh}>
            <ReloadOutlined className="sunxu-mes-screen-action-icon" aria-hidden="true" />
          </ActionButton>
        )}
        {isFullscreen ? (
          <ActionButton label="退出全屏" onClick={toggleFullscreen}>
            <FullscreenExitOutlined
              className="sunxu-mes-screen-action-icon"
              aria-hidden="true"
            />
          </ActionButton>
        ) : (
          <ActionButton label="全屏" onClick={toggleFullscreen}>
            <FullscreenOutlined
              className="sunxu-mes-screen-action-icon"
              aria-hidden="true"
            />
          </ActionButton>
        )}
      </div>
    </header>
  );
}
