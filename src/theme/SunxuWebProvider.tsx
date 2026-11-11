import type { ReactNode } from 'react';
import { App as AntdApp, ConfigProvider, theme as antdTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import type { Locale } from 'antd/es/locale';
import type { ThemeConfig } from 'antd';
import { SunxuWebColors, type SunxuAppearance } from './colors';
import { WorkspaceFrameProvider, type WorkspaceFrame } from './WorkspaceFrame';

export type SunxuWebProviderProps = {
  children: ReactNode;
  appearance?: SunxuAppearance;
  locale?: Locale;
  theme?: ThemeConfig;
  /**
   * Declare who owns the workspace frame. Host shells that already provide the
   * page gutter pass `host`; standalone apps keep the default `container`.
   */
  workspaceFrame?: WorkspaceFrame;
};

const fontFamily =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif';

export function SunxuWebProvider({
  children,
  appearance = 'light',
  locale = zhCN,
  theme,
  workspaceFrame = 'container',
}: SunxuWebProviderProps) {
  const colors = SunxuWebColors[appearance];
  const antdConfig: ThemeConfig = {
    ...theme,
    algorithm:
      theme?.algorithm ??
      (appearance === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm),
    token: {
      colorPrimary: colors.primary,
      colorSuccess: colors.success,
      colorWarning: colors.warning,
      colorError: colors.error,
      colorInfo: colors.info,
      colorText: colors.text,
      colorTextSecondary: colors.textSecondary,
      colorBgLayout: colors.background,
      colorBgContainer: colors.surface,
      colorBorderSecondary: colors.border,
      borderRadius: 6,
      controlHeight: 36,
      fontFamily,
      fontSize: 14,
      ...theme?.token,
    },
  };

  return (
    <ConfigProvider locale={locale} componentSize="middle" theme={antdConfig}>
      <AntdApp>
        <WorkspaceFrameProvider value={workspaceFrame}>
          <div className="sxw-provider" data-theme={appearance}>
            {children}
          </div>
        </WorkspaceFrameProvider>
      </AntdApp>
    </ConfigProvider>
  );
}
