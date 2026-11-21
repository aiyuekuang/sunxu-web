import { useCallback, useMemo, useState } from 'react';
import { ProForm } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Col,
  Form,
  Row,
  Segmented,
  Select,
  Space,
  Switch,
  Typography,
} from 'antd';
import { SectionCard } from '../../src';
import {
  MesConfigEntryFieldLabel,
  MesConfigEntryLink,
  MesConfigurableProFormSelect,
  MesDictionaryFormItem,
  MesDictionaryProFormSelect,
  MesExportButton,
  MesExportDropdownButton,
  MesReportQuickRangeButtons,
  MesStatusTag,
  type MesDictionarySelectState,
} from '../../src/mes';

const statusMap = {
  draft: { text: '草稿', status: 'Default' },
  processing: { text: '处理中', status: 'Processing' },
  completed: { text: '已完成', status: 'Success' },
  warning: { text: '待复核', status: 'Warning' },
  failed: { text: '失败', status: 'Error' },
  custom: { text: '自定义颜色', color: '#6B4EFF' },
} as const;

const quickRanges = [
  { key: 'today', label: '今日' },
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
] as const;

type QuickRangeKey = (typeof quickRanges)[number]['key'];

export function MesHostInjectedControlsDemo() {
  const [quickRange, setQuickRange] = useState<[string, string]>(['2026-11-21', '2026-11-21']);
  const [quickRangeMessage, setQuickRangeMessage] = useState('宿主当前范围：2026-11-21 至 2026-11-21');
  const [configPermitted, setConfigPermitted] = useState(true);
  const [configFeedback, setConfigFeedback] = useState('尚未打开配置入口');
  const [configRequestState, setConfigRequestState] = useState<'empty' | 'ready' | 'error'>('empty');
  const [dictionaryPhase, setDictionaryPhase] = useState<'loading' | 'error' | 'empty' | 'ready'>('empty');
  const [exportPermitted, setExportPermitted] = useState(true);
  const [simulateExportError, setSimulateExportError] = useState(false);
  const [exportFeedback, setExportFeedback] = useState('尚未执行导出');
  const [nativeForm] = Form.useForm();

  const dictionaryRetry = useCallback(() => {
    setDictionaryPhase('ready');
  }, []);
  const dictionary: MesDictionarySelectState = useMemo(() => ({
    options: dictionaryPhase === 'ready'
      ? [
          { value: 'normal', label: '正常' },
          { value: 'urgent', label: '紧急' },
        ]
      : [],
    loading: dictionaryPhase === 'loading',
    error: dictionaryPhase === 'error' ? new Error('示例字典服务暂不可用') : undefined,
    retry: dictionaryRetry,
  }), [dictionaryPhase, dictionaryRetry]);

  const requestConfigurableOptions = useCallback(async () => {
    if (configRequestState === 'error') throw new Error('示例候选请求失败');
    return configRequestState === 'empty'
      ? []
      : [
          { value: 'route-a', label: '装配路线 A' },
          { value: 'route-b', label: '装配路线 B' },
        ];
  }, [configRequestState]);

  const rangeFor = (key: QuickRangeKey): [string, string] => {
    if (key === 'today') return ['2026-11-21', '2026-11-21'];
    if (key === 'week') return ['2026-11-16', '2026-11-21'];
    return ['2026-11-01', '2026-11-30'];
  };

  const runExport = useCallback(async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    if (simulateExportError) throw new Error('示例导出失败');
    return 'sample-export';
  }, [simulateExportError]);

  const download = useCallback((_value: unknown, fileName: string) => {
    setExportFeedback(`宿主下载回调：${fileName}`);
  }, []);

  const configEntry = {
    href: '#catalog-config-entry',
    permitted: configPermitted,
    onOpen: () => setConfigFeedback('已触发宿主配置入口回调；返回窗口焦点后选择器会请求候选。'),
  };

  return (
    <div className="sxw-docs-page-content">
      <SectionCard title="MES 宿主注入控件">
        <Typography.Paragraph type="secondary">
          这些 UI 组件保留 MES 当前展示和交互；状态字典、日期规则、候选请求、授权、下载及路由仍由宿主传入。
        </Typography.Paragraph>
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={12}>
            <SectionCard title="MesStatusTag">
              <Space wrap>
                <MesStatusTag value="draft" enumMap={statusMap} />
                <MesStatusTag value="processing" enumMap={statusMap} />
                <MesStatusTag value="completed" enumMap={statusMap} />
                <MesStatusTag value="warning" enumMap={statusMap} />
                <MesStatusTag value="failed" enumMap={statusMap} />
                <MesStatusTag value="custom" enumMap={statusMap} />
                <MesStatusTag value={null} enumMap={statusMap} />
                <MesStatusTag value="legacy-unknown" enumMap={statusMap} />
                <MesStatusTag value="legacy-unknown" enumMap={statusMap}>宿主回退文案</MesStatusTag>
              </Space>
              <Typography.Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
                未知状态保留灰色回退；最后一项演示宿主 children 覆盖文案。只读标签不承担状态更新。
              </Typography.Paragraph>
            </SectionCard>
          </Col>
          <Col xs={24} xl={12}>
            <SectionCard title="MesReportQuickRangeButtons">
              <MesReportQuickRangeButtons<QuickRangeKey>
                label="报表日期快捷范围"
                value={quickRange}
                options={quickRanges}
                matchValue={(value) => quickRanges.find(({ key }) => {
                  const [start, end] = rangeFor(key);
                  return value?.[0] === start && value?.[1] === end;
                })?.key ?? null}
                onSelect={(key) => {
                  const next = rangeFor(key);
                  setQuickRange(next);
                  setQuickRangeMessage(`宿主应用 ${key}：${next[0]} 至 ${next[1]}`);
                }}
              />
              <Typography.Paragraph aria-live="polite" type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
                {quickRangeMessage}
              </Typography.Paragraph>
            </SectionCard>
          </Col>
        </Row>
      </SectionCard>

      <SectionCard title="配置入口与字典选择">
        <Space wrap style={{ marginBottom: 16 }}>
          <Switch
            checked={configPermitted}
            aria-label="配置入口授权状态"
            checkedChildren="已授权"
            unCheckedChildren="无权限"
            onChange={setConfigPermitted}
          />
          <Typography.Text>切换宿主注入的配置权限</Typography.Text>
        </Space>
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={12}>
            <SectionCard title="MesConfigEntryLink 与 MesConfigEntryFieldLabel">
              <Space orientation="vertical" size={12}>
                <MesConfigEntryLink
                  {...configEntry}
                  label="仓库资料"
                  actionText="打开配置入口"
                />
                <Form layout="vertical">
                  <Form.Item label={(
                    <MesConfigEntryFieldLabel {...configEntry}>
                      默认仓库
                    </MesConfigEntryFieldLabel>
                  )}>
                    <Select
                      aria-label="默认仓库"
                      placeholder="选择仓库"
                      options={[{ value: 'wh-1', label: '一号仓库' }]}
                    />
                  </Form.Item>
                </Form>
                <Typography.Text type="secondary">
                  无权限或无 href 时只显示原字段标签；链接会在新标签页打开并调用宿主 onOpen。
                </Typography.Text>
                <Alert
                  type="info"
                  showIcon
                  title="配置入口的显隐"
                  description="字段标签在 show、宿主权限和 href 均有效时展示链接；选择器会按候选、加载、错误、已选和禁用状态传入 show。"
                />
                <Typography.Text aria-live="polite" type="secondary">{configFeedback}</Typography.Text>
              </Space>
            </SectionCard>
          </Col>
          <Col xs={24} xl={12}>
            <SectionCard title="MesConfigurableProFormSelect">
              <Segmented
                aria-label="配置选择器候选请求状态"
                value={configRequestState}
                onChange={(value) => setConfigRequestState(String(value) as typeof configRequestState)}
                options={[
                  { label: '空候选', value: 'empty' },
                  { label: '有候选', value: 'ready' },
                  { label: '请求失败', value: 'error' },
                ]}
              />
              <ProForm layout="vertical" submitter={false}>
                <MesConfigurableProFormSelect
                  name="route"
                  label="工艺路线"
                  placeholder="选择工艺路线"
                  request={requestConfigurableOptions}
                  params={{ sampleRequestState: configRequestState }}
                  configEntry={configEntry}
                  fieldProps={{ allowClear: true }}
                />
              </ProForm>
              {configRequestState === 'error' ? (
                <Alert
                  type="error"
                  showIcon
                  title="宿主候选请求失败"
                  description="包装器继续向 ProForm 传递请求错误，并隐藏配置入口；目录用此反馈标明模拟宿主状态。"
                />
              ) : null}
              <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                无值时用去除搜索词的宿主请求探测基础候选；请求错误不显示配置入口，配置页返回焦点后重新请求。
              </Typography.Paragraph>
            </SectionCard>
          </Col>
          <Col xs={24} xl={12}>
            <SectionCard title="MesDictionaryProFormSelect">
              <Segmented
                aria-label="ProForm 字典状态"
                value={dictionaryPhase}
                onChange={(value) => setDictionaryPhase(String(value) as typeof dictionaryPhase)}
                options={[
                  { label: '加载中', value: 'loading' },
                  { label: '失败', value: 'error' },
                  { label: '空候选', value: 'empty' },
                  { label: '有选项', value: 'ready' },
                ]}
              />
              <ProForm layout="vertical" submitter={false}>
                <MesDictionaryProFormSelect
                  name="priority"
                  label="优先级"
                  placeholder="选择优先级"
                  dictionary={dictionary}
                  configEntry={configEntry}
                />
              </ProForm>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                加载、错误、重试和空态提示由字典状态驱动；“重试”由宿主回调，成功加载后展示候选。
              </Typography.Paragraph>
            </SectionCard>
          </Col>
          <Col xs={24} xl={12}>
            <SectionCard title="MesDictionaryFormItem">
              <Segmented
                aria-label="原生 Form 字典状态"
                value={dictionaryPhase}
                onChange={(value) => setDictionaryPhase(String(value) as typeof dictionaryPhase)}
                options={[
                  { label: '加载中', value: 'loading' },
                  { label: '失败', value: 'error' },
                  { label: '空候选', value: 'empty' },
                  { label: '有选项', value: 'ready' },
                ]}
              />
              <Form form={nativeForm} layout="vertical">
                <MesDictionaryFormItem
                  name="nativePriority"
                  label="原生表单优先级"
                  dictionary={dictionary}
                  configEntry={configEntry}
                >
                  <Select placeholder="选择优先级" />
                </MesDictionaryFormItem>
              </Form>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                适用于 Form.List 等原生 AntD Form；当前 Select 的 disabled 状态和 notFoundContent 会被保留或按状态补齐。
              </Typography.Paragraph>
            </SectionCard>
          </Col>
        </Row>
      </SectionCard>

      <SectionCard title="导出按钮状态">
        <Space wrap style={{ marginBottom: 16 }}>
          <Switch
            checked={exportPermitted}
            aria-label="导出授权状态"
            checkedChildren="允许导出"
            unCheckedChildren="无权限"
            onChange={setExportPermitted}
          />
          <Switch
            checked={simulateExportError}
            aria-label="模拟导出错误"
            checkedChildren="模拟错误"
            unCheckedChildren="模拟成功"
            onChange={setSimulateExportError}
          />
        </Space>
        <Space wrap>
          <MesExportButton
            canExport={exportPermitted}
            exportFn={runExport}
            fileName="报表.xlsx"
            download={download}
            onPrepareExport={() => setExportFeedback('宿主准备当前表格导出布局')}
            onSuccess={() => setExportFeedback('单项导出成功')}
            onError={() => setExportFeedback('单项导出失败；按钮结束 loading 状态')}
          >
            导出当前报表
          </MesExportButton>
          {exportPermitted ? (
            <MesExportDropdownButton
              items={[
                {
                  key: 'visible-columns',
                  label: '按当前列导出',
                  exportFn: runExport,
                  fileName: '当前列.xlsx',
                  applyTableLayout: true,
                },
                {
                  key: 'template',
                  label: '导出模板（不应用列布局）',
                  exportFn: runExport,
                  fileName: '导入模板.xlsx',
                  applyTableLayout: false,
                },
                {
                  key: 'disabled',
                  label: '无数据时不可用',
                  exportFn: runExport,
                  fileName: '不可用.xlsx',
                  disabled: true,
                },
              ]}
              download={download}
              onPrepareExport={(applyTableLayout) => setExportFeedback(`宿主准备导出；应用表格列布局：${applyTableLayout ? '是' : '否'}`)}
              onSuccess={() => setExportFeedback('菜单导出成功')}
              onError={() => setExportFeedback('菜单导出失败；按钮结束 loading 状态')}
            >
              选择导出内容
            </MesExportDropdownButton>
          ) : null}
        </Space>
        <Alert
          style={{ marginTop: 16 }}
          type="info"
          showIcon
          title={exportFeedback}
          description="目录仅记录宿主回调，不会创建文件。真实授权、导出 API、下载策略、通知和表格列布局由宿主负责。"
          aria-live="polite"
        />
      </SectionCard>

      <div id="catalog-config-entry">
        <Typography.Text type="secondary">目录配置链接目标锚点</Typography.Text>
      </div>
    </div>
  );
}
