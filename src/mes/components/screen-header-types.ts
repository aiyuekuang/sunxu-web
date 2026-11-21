export interface ScreenHeaderCapabilities {
  /** Host-owned navigation replaces the source app's Umi history integration. */
  navigate: (path: string) => void;
}

export interface ScreenHeaderProps {
  capabilities: ScreenHeaderCapabilities;
  /** 大屏标题 */
  title: string;
  /** 返回路径，默认 '/dashboard' */
  backPath?: string;
  /** 手动刷新回调 */
  onRefresh?: () => void;
  /** 最近更新时间，显示在时钟旁 */
  lastUpdated?: Date | null;
  /** 是否显示刷新按钮，默认 true */
  showRefresh?: boolean;
  /** 图表自动播放状态 */
  autoPlaying?: boolean;
  /** 切换自动播放 */
  onToggleAutoPlay?: () => void;
  /** 语音播报开关状态；提供 onToggleVoice 时才显示播报图标 */
  voiceEnabled?: boolean;
  /** 切换语音播报（首次点击即浏览器手势授权发声） */
  onToggleVoice?: () => void;
  /** 打开语音播报设置面板（仅播报开启时显示） */
  onOpenVoiceSettings?: () => void;
}
