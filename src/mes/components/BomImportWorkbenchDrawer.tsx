import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import {
  ModalForm,
  type ProColumns,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import {
  Button,
  Checkbox,
  Descriptions,
  Drawer,
  Select,
  Space,
  Tag,
  Upload,
} from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { useEffect, useMemo, useState } from 'react';
import { ResizableTable as Table } from './ResizableTable';
import { downloadBlob } from '../utils/downloadBlob';
import { formatUnitLabel } from '../utils/qty-unit';
import type {
  BomImportConfirmCandidateValues,
  BomImportMaterialCandidate,
  BomImportMappingProfile,
  BomImportPreview,
  BomImportPreviewRow,
  BomImportWorkbenchDrawerProps,
} from './bom-import-workbench-types';

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

function renderJson(value: unknown) {
  if (!value) return '-';
  return (
    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function safeDownloadFileName(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim() || 'BOM导入模板';
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain material-bom
 * @sunxu-reason Preserves BOM mapping-profile selection, mapped-row diagnostics, and material-candidate confirmation/ignore flows that the generic import workbench does not expose; all MES requests, dictionaries, field help, and feedback remain host supplied.
 */
export function BomImportWorkbenchDrawer({
  open,
  onClose,
  onSuccess,
  capabilities,
}: BomImportWorkbenchDrawerProps) {
  const [profiles, setProfiles] = useState<BomImportMappingProfile[]>([]);
  const [profileId, setProfileId] = useState<string>();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewResult, setPreviewResult] = useState<BomImportPreview | null>(
    null,
  );
  const [previewRows, setPreviewRows] = useState<BomImportPreviewRow[]>([]);
  const [materialCandidates, setMaterialCandidates] = useState<
    BomImportMaterialCandidate[]
  >([]);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>(
    [],
  );
  const [confirmCandidateOpen, setConfirmCandidateOpen] = useState(false);
  const [allowWarnings, setAllowWarnings] = useState(true);
  const [loading, setLoading] = useState(false);
  const [templateDownloading, setTemplateDownloading] = useState(false);

  const profileOptions = useMemo(
    () =>
      profiles.map((profile) => ({
        label: profile.isDefault ? `${profile.name}（默认）` : profile.name,
        value: profile.id,
      })),
    [profiles],
  );

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === profileId),
    [profileId, profiles],
  );
  const selectedCandidates = useMemo(
    () =>
      materialCandidates.filter((candidate) =>
        selectedCandidateIds.includes(candidate.id),
      ),
    [materialCandidates, selectedCandidateIds],
  );

  useEffect(() => {
    if (!open) return;
    capabilities
      .requestProfiles({
        page: 1,
        pageSize: 100,
        targetType: 'bom',
        status: 'active',
      })
      .then((result) => {
        const list = result?.list ?? [];
        setProfiles(list);
        setProfileId(
          (current) => current ?? list.find((profile) => profile.isDefault)?.id ?? list[0]?.id,
        );
      });
    // Resolve the mapping catalog only when the drawer opens, matching the host flow.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const resetState = () => {
    setFileList([]);
    setPreviewResult(null);
    setPreviewRows([]);
    setMaterialCandidates([]);
    setSelectedCandidateIds([]);
    setConfirmCandidateOpen(false);
    setAllowWarnings(true);
  };

  const loadMaterialCandidates = async (jobId: string) => {
    const result = await capabilities.requestCandidates({
      importJobId: jobId,
      page: 1,
      pageSize: 100,
    });
    setMaterialCandidates(result?.list ?? []);
    setSelectedCandidateIds([]);
  };

  const handlePreview = async () => {
    const file = fileList[0]?.originFileObj;
    if (!profileId || !file) {
      capabilities.notify('warning', '请选择映射方案和 Excel 文件');
      return;
    }
    setLoading(true);
    try {
      const base64 = await fileToBase64(file);
      const result = await capabilities.preview({
        targetType: 'bom',
        profileId,
        base64,
        fileName: file.name,
      });
      setPreviewResult(result);
      if (result.rows?.length) {
        setPreviewRows(result.rows);
      } else if (result.jobId) {
        const rows = await capabilities.requestRows({
          jobId: result.jobId,
          page: 1,
          pageSize: 100,
        });
        setPreviewRows(rows?.list ?? []);
      }
      if (result.jobId) await loadMaterialCandidates(result.jobId);
      capabilities.notify('success', '预览完成');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    if (!profileId) {
      capabilities.notify('warning', '请选择导入映射方案');
      return;
    }
    setTemplateDownloading(true);
    try {
      const blob = await capabilities.requestTemplate({
        targetType: 'bom',
        profileId,
      });
      downloadBlob(
        blob,
        `${safeDownloadFileName(selectedProfile?.name ?? 'BOM导入模板')}_导入模板.xlsx`,
      );
    } finally {
      setTemplateDownloading(false);
    }
  };

  const handleConfirmCandidates = async (
    values: BomImportConfirmCandidateValues,
  ) => {
    if (selectedCandidateIds.length === 0) {
      capabilities.notify('warning', '请选择要确认建料的候选');
      return false;
    }
    setLoading(true);
    try {
      const result = await capabilities.confirmCandidates({
        ids: selectedCandidateIds,
        baseType: values.baseType,
        type: values.type,
        category: values.category,
        procurementType: values.procurementType,
        remark: values.remark,
      });
      const errors = result?.errors as string[] | undefined;
      if (errors?.length) {
        capabilities.notify('warning', errors.join('；'));
      } else {
        capabilities.notify('success', `已创建 ${result?.created ?? 0} 个物料`);
      }
      if (previewResult?.jobId) {
        await loadMaterialCandidates(previewResult.jobId);
      }
      setConfirmCandidateOpen(false);
      return true;
    } finally {
      setLoading(false);
    }
  };

  const handleIgnoreCandidates = async () => {
    if (selectedCandidateIds.length === 0) {
      capabilities.notify('warning', '请选择要忽略的候选');
      return;
    }
    setLoading(true);
    try {
      await capabilities.ignoreCandidates({
        ids: selectedCandidateIds,
        remark: 'BOM 导入工作台忽略',
      });
      capabilities.notify('success', '已忽略候选');
      if (previewResult?.jobId) {
        await loadMaterialCandidates(previewResult.jobId);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!previewResult?.jobId) {
      capabilities.notify('warning', '请先预览导入文件');
      return;
    }
    setLoading(true);
    try {
      const result = await capabilities.execute({
        id: previewResult.jobId,
        allowWarnings,
      });
      if (result.errors?.length) {
        capabilities.notify('error', result.errors.join('；'));
      } else {
        capabilities.notify('success', `已导入 ${result.importedRows ?? 0} 行`);
        onSuccess();
        onClose();
        resetState();
      }
    } finally {
      setLoading(false);
    }
  };

  const rowColumns: ProColumns<BomImportPreviewRow>[] = [
    { title: '行号', dataIndex: 'sourceRowNo', width: 80 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (_, record) => {
        const status = record.status ?? 'valid';
        const item = capabilities.rowStatusLabels[status];
        return <Tag color={item?.color}>{item?.text ?? '未知状态'}</Tag>;
      },
    },
    {
      title: '错误',
      width: 220,
      render: (_, record) => {
        const errors = record.errorJson ?? record.errors ?? [];
        return errors.length ? errors.join('；') : '-';
      },
    },
    {
      title: '警告',
      width: 220,
      render: (_, record) => {
        const warnings = record.warningJson ?? record.warnings ?? [];
        return warnings.length ? warnings.join('；') : '-';
      },
    },
    {
      title: '映射后数据',
      dataIndex: 'mappedJson',
      render: (_, record) => renderJson(record.mappedJson),
    },
  ];

  const candidateColumns: ProColumns<BomImportMaterialCandidate>[] = [
    { title: '物料名称', dataIndex: 'materialName', width: 180 },
    { title: '物料编码', dataIndex: 'materialCode', width: 140 },
    { title: '规格', dataIndex: 'materialSpec', width: 160 },
    {
      title: '单位',
      dataIndex: 'unit',
      width: 80,
      render: (_, record) =>
        formatUnitLabel(record.unit, capabilities.unitLabelMap) || '-',
    },
    {
      title: '系统分类',
      dataIndex: 'baseType',
      width: 100,
      render: (_, record) => {
        const value = record.baseType;
        return value
          ? capabilities.materialTypeOptions.find((option) => option.value === value)?.label ?? value
          : '-';
      },
    },
    {
      title: '采购类型',
      dataIndex: 'procurementType',
      width: 100,
      render: (_, record) => {
        const value = record.procurementType;
        return value
          ? capabilities.procurementTypeOptions.find((option) => option.value === value)?.label ?? value
          : '-';
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (_, record) => {
        const status = record.status ?? 'pending';
        const item = capabilities.candidateStatusLabels[status];
        return <Tag color={item?.color}>{item?.text ?? '未知状态'}</Tag>;
      },
    },
    {
      title: '错误',
      dataIndex: 'errorJson',
      width: 220,
      render: (_, record) =>
        record.errorJson?.length ? record.errorJson.join('；') : '-',
    },
  ];

  return (
    <Drawer
      title="BOM 导入工作台"
      open={open}
      onClose={() => {
        onClose();
        resetState();
      }}
      size={1000}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={handlePreview} loading={loading}>
            预览
          </Button>
          <Button
            type="primary"
            onClick={handleExecute}
            loading={loading}
            disabled={!previewResult?.jobId}
          >
            确认导入
          </Button>
        </Space>
      }
    >
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <Space wrap>
          <Select
            style={{ width: 320 }}
            placeholder="选择启用状态的导入映射方案"
            options={profileOptions}
            value={profileId}
            onChange={setProfileId}
          />
          <Button
            icon={<DownloadOutlined />}
            onClick={handleDownloadTemplate}
            loading={templateDownloading}
            disabled={!profileId}
          >
            下载模板
          </Button>
          <Upload
            accept=".xlsx,.xls"
            maxCount={1}
            fileList={fileList}
            beforeUpload={() => false}
            onChange={({ fileList: nextFileList }) => {
              setFileList(nextFileList);
              setPreviewResult(null);
              setPreviewRows([]);
              setMaterialCandidates([]);
              setSelectedCandidateIds([]);
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

        {previewResult && (
          <Descriptions size="small" column={4}>
            <Descriptions.Item label="总行数">
              {previewResult.summary?.totalRows ?? 0}
            </Descriptions.Item>
            <Descriptions.Item label="有效">
              {previewResult.summary?.validRows ?? 0}
            </Descriptions.Item>
            <Descriptions.Item label="警告">
              {previewResult.summary?.warningRows ?? 0}
            </Descriptions.Item>
            <Descriptions.Item label="错误">
              {previewResult.summary?.errorRows ?? 0}
            </Descriptions.Item>
          </Descriptions>
        )}

        {materialCandidates.length > 0 && (
          <Space orientation="vertical" size={8} style={{ width: '100%' }}>
            <Space>
              <Button
                type="primary"
                onClick={() => setConfirmCandidateOpen(true)}
                loading={loading}
                disabled={selectedCandidateIds.length === 0}
              >
                确认建料
              </Button>
              <Button
                onClick={handleIgnoreCandidates}
                loading={loading}
                disabled={selectedCandidateIds.length === 0}
              >
                忽略候选
              </Button>
            </Space>
            <Table<BomImportMaterialCandidate>
              rowKey="id"
              size="small"
              columns={candidateColumns as never}
              dataSource={materialCandidates}
              pagination={false}
              rowSelection={{
                selectedRowKeys: selectedCandidateIds,
                onChange: (keys) =>
                  setSelectedCandidateIds(keys.map((key) => String(key))),
                getCheckboxProps: (record) => ({
                  disabled: record.status !== 'pending',
                }),
              }}
              scroll={{ x: 980 }}
            />
          </Space>
        )}

        <ModalForm<BomImportConfirmCandidateValues>
          title={`确认建料（${selectedCandidateIds.length} 个候选）`}
          open={confirmCandidateOpen}
          onOpenChange={setConfirmCandidateOpen}
          modalProps={{ destroyOnHidden: true }}
          initialValues={{
            baseType: selectedCandidates[0]?.baseType ?? 'raw',
            type: selectedCandidates[0]?.type ?? undefined,
            category: selectedCandidates[0]?.category ?? undefined,
            procurementType: selectedCandidates[0]?.procurementType ?? 'buy',
            remark: 'BOM 导入工作台确认建料',
          }}
          onFinish={handleConfirmCandidates}
        >
          <ProFormSelect
            name="baseType"
            label={capabilities.renderFieldHelp('系统分类', 'materialBaseType')}
            options={capabilities.materialTypeOptions}
            extra="决定候选物料进入原材料、半成品还是成品主类型，会影响后续库存和生产口径。"
            rules={[{ required: true, message: '请选择系统分类' }]}
          />
          <ProFormSelect
            name="procurementType"
            label={capabilities.renderFieldHelp('采购类型', 'materialProcurementType')}
            options={capabilities.procurementTypeOptions}
            extra="决定候选物料后续是外购、自制还是兼有；会影响采购、生产和补货路径。"
            rules={[{ required: true, message: '请选择采购类型' }]}
          />
          <ProFormText
            name="type"
            label={capabilities.renderFieldHelp('业务分类编码', 'categoryCode')}
            placeholder="可选；不填则按系统分类归入默认分类"
            extra="用于把候选物料归入已有或待创建的业务分类；不确定时可留空使用默认分类。"
          />
          <ProFormText
            name="category"
            label={capabilities.renderFieldHelp('业务分类名称', 'categoryName')}
            placeholder="可选；已有分类名称会被导入逻辑解析"
            extra="已有分类名称会尽量匹配到现有分类；新分类会按导入逻辑创建或提示处理。"
          />
          <ProFormTextArea
            name="remark"
            label={capabilities.renderFieldHelp('确认说明', 'importMaterialCandidateRemark')}
            placeholder="记录本次从 BOM 导入候选确认建料的依据或限制"
          />
        </ModalForm>

        <Table<BomImportPreviewRow>
          rowKey={(record) => String(record.id ?? record.sourceRowNo)}
          size="small"
          columns={rowColumns as never}
          dataSource={previewRows}
          pagination={{ pageSize: 20 }}
          scroll={{ x: 980, y: 520 }}
        />
      </Space>
    </Drawer>
  );
}
