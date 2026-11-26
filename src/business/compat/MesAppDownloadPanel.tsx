import {
	AppDownloadPanel,
	type AppDownloadPanelProps,
} from '../domains/application/AppDownloadPanel';

/** @deprecated Use `AppDownloadPanel` and supply the consuming application's names. */
export type MesAppDownloadPanelProps = Omit<
	AppDownloadPanelProps,
	'applicationName' | 'appStoreSearchName'
>;

/** @deprecated Use `AppDownloadPanel` and supply application-specific copy. */
export function MesAppDownloadPanel(props: MesAppDownloadPanelProps) {
	return (
		<AppDownloadPanel
			{...props}
			applicationName="APP"
			appStoreSearchName="元问mes"
			appStoreInstruction={
				props.appStoreInstruction ?? 'App Store 搜索下方名称下载'
			}
			serverAddressInstruction={
				props.serverAddressInstruction ?? 'App 登录页点击「服务器地址设置」'
			}
		/>
	);
}
