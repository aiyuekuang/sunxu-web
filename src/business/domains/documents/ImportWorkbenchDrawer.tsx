import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import {
  App,
  Button,
  Checkbox,
  Descriptions,
  Drawer,
  Segmented,
  Space,
  Tag,
  Typography,
  Upload,
} from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import React, { useEffect, useMemo, useState } from 'react';
import { ResizableTable as Table } from '../shared/ResizableTable';
import {
  useImportWorkbenchCapabilities,
  useHostPermissionChecker,
} from '../../providers/BusinessUiProvider';
import { downloadBlob } from '../../utils/downloadBlob';
import type {
  ImportTargetType,
  ImportWorkbenchPreview,
  ImportWorkbenchRow,
  ImportWorkbenchTargetOption,
} from './import-workbench-types';

const IMPORT_JOB_ROW_STATUS_ENUM: Record<
  string,
  { text: string; color: string }
> = {
  valid: { text: '有效', color: '#00B578' },
  warning: { text: '有警告', color: '#FF8F1F' },
  error: { text: '错误', color: '#FF3141' },
  imported: { text: '已导入', color: '#1677FF' },
};

export type ImportWorkbenchDrawerProps = {
  open: boolean;
  /** 单目标模式：导入目标类型，如 material / customer / supplier。与 targets 二选一。 */
  targetType?: ImportTargetType;
  /** 多目标模式：抽屉顶部提供切换（如物料档案/供货关系/供货价目），首项为默认。 */
  targets?: ImportWorkbenchTargetOption[];
  title?: string;
  /** 指定映射方案时按方案导入；留空使用系统默认映射（按字段名自动匹配表头） */
  profileId?: string;
  templateFileName?: string;
  /** 单目标模式下的填写和执行提示。 */
  description?: string;
  /** 单目标模式下是否默认允许导入警告行。 */
  allowWarningsByDefault?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      resolve(result.includes(',') ? (result.split(',').pop() ?? '') : result);
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

/**
 * @sunxu-layer business
 * @sunxu-domain documents
 * @sunxu-reason Preserves host multi-target import permission filtering, template/preview/execute lifecycle, warning policy, row diagnostics, and refresh behavior while backend requests stay host supplied.
 */
const ImportWorkbenchDrawer: React.FC<ImportWorkbenchDrawerProps> = ({
  open,
  targetType,
  targets,
  title = '批量导入',
  profileId,
  templateFileName,
  description,
  allowWarningsByDefault,
  onClose,
  onSuccess,
}) => {
  const { message } = App.useApp();
  const hasPermission = useHostPermissionChecker();
  const capabilities = useImportWorkbenchCapabilities();
  const resolvedTargets = useMemo<ImportWorkbenchTargetOption[]>(() => {
    if (targets && targets.length > 0) {
      return targets.filter(
        (item) =>
          !item.requiredPermission ||
          hasPermission(item.requiredPermission),
      );
    }
    if (targetType) {
      return [
        {
          value: targetType,
          label: title,
          templateFileName,
          description,
          allowWarningsByDefault,
        },
      ];
    }
    return [];
  }, [
    hasPermission,
    targets,
    targetType,
    title,
    templateFileName,
    description,
    allowWarningsByDefault,
  ]);
  const [activeTarget, setActiveTarget] = useState<
    ImportTargetType | undefined
  >(resolvedTargets[0]?.value);
  const activeOption =
    resolvedTargets.find((item) => item.value === activeTarget) ??
    resolvedTargets[0];
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [preview, setPreview] = useState<ImportWorkbenchPreview | null>(
    null,
  );
  const [rows, setRows] = useState<ImportWorkbenchRow[]>([]);
  const [allowWarnings, setAllowWarnings] = useState(true);
  const [templateDownloading, setTemplateDownloading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [executing, setExecuting] = useState(false);

  const reset = (option?: ImportWorkbenchTargetOption) => {
    setFileList([]);
    setPreview(null);
    setRows([]);
    setAllowWarnings(option?.allowWarningsByDefault ?? true);
    setTemplateDownloading(false);
    setPreviewing(false);
    setExecuting(false);
  };

  useEffect(() => {
    if (open) {
      const firstTarget = resolvedTargets[0];
      setActiveTarget(firstTarget?.value);
      reset(firstTarget);
    } else {
      reset();
    }
    // 仅在开关切换时初始化，目标列表变化不重置用户当前选择
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleTargetChange = (value: ImportTargetType) => {
    const nextTarget = resolvedTargets.find((item) => item.value === value);
    setActiveTarget(value);
    setFileList([]);
    setPreview(null);
    setRows([]);
    setAllowWarnings(nextTarget?.allowWarningsByDefault ?? true);
  };

  const handleDownloadTemplate = async () => {
    if (!activeOption) return;
    if (!capabilities) {
      message.error('导入服务未配置');
      return;
    }
    setTemplateDownloading(true);
    try {
      const blob = await capabilities.requestTemplate({
        targetType: activeOption.value,
        ...(profileId ? { profileId } : {}),
      });
      downloadBlob(
        blob,
        `${activeOption.templateFileName ?? activeOption.label}_导入模板.xlsx`,
      );
      message.success('模板文件已开始下载');
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : '模板下载失败');
    } finally {
      setTemplateDownloading(false);
    }
  };

  const handlePreview = async () => {
    const file = fileList[0]?.originFileObj;
    if (!file || !activeOption) {
      message.warning('请选择 Excel 文件');
      return;
    }
    if (!capabilities) {
      message.error('导入服务未配置');
      return;
    }
    setPreviewing(true);
    try {
      const base64 = await fileToBase64(file);
      const result = await capabilities.preview({
        targetType: activeOption.value,
        ...(profileId ? { profileId } : {}),
        base64,
        fileName: file.name,
      });
      setPreview(result);
      if (result.rows?.length) {
        setRows(result.rows);
      } else if (result.jobId) {
        const rowResult = await capabilities.requestRows({
          jobId: result.jobId,
          page: 1,
          pageSize: 100,
        });
        setRows(rowResult?.list ?? []);
      } else {
        setRows([]);
      }
      message.success('预览完成');
    } finally {
      setPreviewing(false);
    }
  };

  const handleExecute = async () => {
    if (!preview?.jobId) {
      message.warning('请先预览导入文件');
      return;
    }
    if (!capabilities) {
      message.error('导入服务未配置');
      return;
    }
    setExecuting(true);
    try {
      const result = await capabilities.execute({
        id: preview.jobId,
        allowWarnings,
      });
      if (result.errors?.length) {
        message.error(result.errors.join('；'));
        return;
      }
      message.success(`已导入 ${result.importedRows ?? 0} 行`);
      onSuccess?.();
      onClose();
    } finally {
      setExecuting(false);
    }
  };

  const rowColumns: ProColumns<ImportWorkbenchRow>[] = [
    { title: '行号', dataIndex: 'sourceRowNo', width: 70 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (_, record) => {
        const item = record.status ? IMPORT_JOB_ROW_STATUS_ENUM[record.status] : undefined;
        return <Tag color={item?.color}>{item?.text ?? '未知状态'}</Tag>;
      },
    },
    {
      title: '错误',
      width: 240,
      render: (_, record) => {
        const list = record.errorJson ?? record.errors ?? [];
        return list.length ? list.join('；') : '-';
      },
    },
    {
      title: '警告',
      width: 240,
      render: (_, record) => {
        const list = record.warningJson ?? record.warnings ?? [];
        return list.length ? list.join('；') : '-';
      },
    },
  ];

  return (
    <Drawer
      title={title}
      open={open}
      onClose={onClose}
      size={960}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={handlePreview} loading={previewing}>
            预览
          </Button>
          <Button
            type="primary"
            onClick={handleExecute}
            loading={executing}
            disabled={!preview?.jobId}
          >
            确认导入
          </Button>
        </Space>
      }
    >
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        {resolvedTargets.length > 1 && (
          <Segmented
            value={activeTarget}
            onChange={(value) => handleTargetChange(value as ImportTargetType)}
            options={resolvedTargets.map((item) => ({
              label: item.label,
              value: item.value,
            }))}
          />
        )}
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          {activeOption?.description ??
            '下载模板后按列填写并上传即可导入；表头保持与模板一致，系统会自动匹配字段，无需额外配置。'}
        </Typography.Paragraph>
        <Space wrap>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleDownloadTemplate}
            loading={templateDownloading}
          >
            下载模板
          </Button>
          <Upload
            accept=".xlsx,.xls"
            maxCount={1}
            fileList={fileList}
            beforeUpload={() => false}
            onChange={({ fileList: next }) => {
              setFileList(next);
              setPreview(null);
              setRows([]);
            }}
          >
            <Button icon={<UploadOutlined />}>选择 Excel</Button>
          </Upload>
          <Checkbox
            checked={allowWarnings}
            onChange={(event) => setAllowWarnings(event.target.checked)}
          >
            允许警告行导入
          </Checkbox>
        </Space>

        {preview && (
          <Descriptions size="small" column={4}>
            <Descriptions.Item label="总行数">
              {preview.summary?.totalRows ?? 0}
            </Descriptions.Item>
            <Descriptions.Item label="有效">
              {preview.summary?.validRows ?? 0}
            </Descriptions.Item>
            <Descriptions.Item label="警告">
              {preview.summary?.warningRows ?? 0}
            </Descriptions.Item>
            <Descriptions.Item label="错误">
              {preview.summary?.errorRows ?? 0}
            </Descriptions.Item>
          </Descriptions>
        )}

        <Table<ImportWorkbenchRow>
          rowKey={(record) => String(record.id ?? record.sourceRowNo)}
          size="small"
          columns={rowColumns as never}
          dataSource={rows}
          pagination={{ pageSize: 20 }}
          scroll={{ x: 720, y: 420 }}
        />
      </Space>
    </Drawer>
  );
};

export default ImportWorkbenchDrawer;
