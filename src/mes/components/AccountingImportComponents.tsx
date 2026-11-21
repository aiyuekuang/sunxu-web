import {
  ModalForm,
  ProFormDatePicker,
  ProFormUploadDragger,
} from '@ant-design/pro-components';
import { Alert, Button, Form, type UploadFile } from 'antd';
import { useState } from 'react';
import { AccountingBookField } from './AccountingSelectorFields';
import { ResizableTable as Table } from './ResizableTable';
import type {
  AccountingAccountImportResult,
  AccountImportModalProps,
  OpeningBalanceImportFormValues,
  OpeningBalanceImportModalProps,
} from './accounting-import-components-types';

/**
 * @sunxu-component mes-specific
 * @sunxu-domain accounting chart of accounts import
 * @sunxu-reason Preserves all-or-nothing Excel validation, downloadable template, row-level error review, and completion refresh while the host owns permissions, file transport, and notifications.
 *
 * Imports a chart of accounts from a workbook and keeps validation errors in the
 * modal so the user can correct the source file without losing the report.
 */
export function AccountImportModal({
  onDone,
  capabilities,
}: AccountImportModalProps) {
  const [result, setResult] = useState<AccountingAccountImportResult>();
  const [downloading, setDownloading] = useState(false);
  const errorRows = result?.rows.filter((row) => row.status === 'error') ?? [];

  const downloadTemplate = async () => {
    setDownloading(true);
    try {
      await capabilities.downloadTemplate();
      capabilities.notifySuccess('模板已开始下载');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <ModalForm<{ file: UploadFile[] }>
      title="导入会计科目"
      trigger={
        capabilities.canManage ? <Button>导入科目</Button> : undefined
      }
      modalProps={{ destroyOnHidden: true }}
      submitter={{ searchConfig: { submitText: '导入并校验' } }}
      onOpenChange={(open) => {
        if (!open) setResult(undefined);
      }}
      onFinish={async (values) => {
        const file = values.file?.[0]?.originFileObj;
        if (!(file instanceof File)) {
          capabilities.notifyError('请选择会计科目 Excel 文件');
          return false;
        }
        setResult(undefined);
        const importResult = await capabilities.importAccounts(file);
        if (importResult.imported === 0) {
          setResult(importResult);
          const errorCount = importResult.rows.filter(
            (row) => row.status === 'error',
          ).length;
          capabilities.notifyError(
            `发现 ${errorCount || importResult.total} 行问题`,
          );
          return false;
        }
        capabilities.notifySuccess(
          `已导入 ${importResult.imported} 个会计科目`,
        );
        onDone();
        return true;
      }}
    >
      <Alert
        showIcon
        type="info"
        message="导入会先校验整棵科目树；任一行错误时不会写入任何科目。"
        style={{ marginBottom: 16 }}
      />
      <Button
        loading={downloading}
        onClick={() => void downloadTemplate()}
        style={{ marginBottom: 16 }}
      >
        下载模板
      </Button>
      <ProFormUploadDragger
        name="file"
        label="Excel 文件"
        max={1}
        fieldProps={{ beforeUpload: () => false, accept: '.xlsx' }}
        rules={[{ required: true, message: '请选择 Excel 文件' }]}
      />
      {result && result.imported === 0 ? (
        <>
          <Alert
            showIcon
            type="error"
            message={`未导入任何科目，共 ${errorRows.length} 行需要修正。`}
          />
          <Table<AccountingAccountImportResult['rows'][number]>
            columns={[
              { title: 'Excel 行', dataIndex: 'rowNo', width: 90 },
              { title: '账簿', dataIndex: 'accountingBookCode', width: 120 },
              { title: '科目编码', dataIndex: 'code', width: 130 },
              {
                title: '问题说明',
                dataIndex: 'message',
                render: (_, row) => row.message || '-',
              },
            ]}
            dataSource={errorRows}
            pagination={{ pageSize: 8, hideOnSinglePage: true, size: 'small' }}
            rowKey={(row) => `${row.rowNo}-${row.code}`}
            scroll={{ y: 240 }}
            size="small"
            style={{ marginTop: 12 }}
          />
        </>
      ) : null}
    </ModalForm>
  );
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain accounting opening balances
 * @sunxu-reason Preserves workbook selection by accounting book, date validation, template download, precheck-only import result, and host refresh while keeping service and permission decisions outside the library.
 *
 * Imports opening balances into a validation batch; it does not create a voucher
 * or change account balances directly.
 */
export function OpeningBalanceImportModal({
  onImported,
  capabilities,
}: OpeningBalanceImportModalProps) {
  const [form] = Form.useForm<OpeningBalanceImportFormValues>();
  const accountingBookCode = Form.useWatch('accountingBookCode', form) as
    | string
    | undefined;
  const [downloading, setDownloading] = useState(false);

  const downloadTemplate = async () => {
    if (!accountingBookCode) {
      capabilities.notifyWarning('请先选择会计账簿');
      return;
    }
    setDownloading(true);
    try {
      await capabilities.downloadTemplate(accountingBookCode);
      capabilities.notifySuccess('模板已开始下载');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <ModalForm<OpeningBalanceImportFormValues>
      form={form}
      title="导入期初余额"
      width={680}
      trigger={
        capabilities.canManage ? (
          <Button type="primary">导入期初余额</Button>
        ) : undefined
      }
      modalProps={{ destroyOnHidden: true }}
      submitter={{ searchConfig: { submitText: '导入并预检' } }}
      onFinish={async (values) => {
        const file = values.file?.[0]?.originFileObj;
        if (!(file instanceof File)) {
          capabilities.notifyError('请选择期初余额 Excel 文件');
          return false;
        }
        const detail = await capabilities.importOpeningBalances(
          {
            accountingBookCode: values.accountingBookCode,
            openingDate: values.openingDate,
          },
          file,
        );
        capabilities.notifySuccess(
          detail.batch.status === 'validated'
            ? '导入完成，借贷平衡，可确认生成凭证'
            : '导入完成，请先处理校验问题',
        );
        onImported(detail);
        return true;
      }}
    >
      <AccountingBookField />
      <Button
        style={{ marginBottom: 16 }}
        loading={downloading}
        disabled={!accountingBookCode}
        onClick={() => void downloadTemplate()}
      >
        下载当前账簿模板
      </Button>
      <ProFormDatePicker
        name="openingDate"
        label="期初余额日期"
        rules={[{ required: true, message: '请选择期初余额日期' }]}
        width="md"
      />
      <ProFormUploadDragger
        name="file"
        label="期初余额 Excel"
        max={1}
        fieldProps={{
          accept: '.xlsx',
          beforeUpload: () => false,
          maxCount: 1,
        }}
        rules={[{ required: true, message: '请选择 Excel 文件' }]}
        description="请使用系统下载的标准模板；导入只生成预检批次，不会直接改科目余额。"
      />
    </ModalForm>
  );
}
