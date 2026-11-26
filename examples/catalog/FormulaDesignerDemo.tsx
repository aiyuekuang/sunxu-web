import { useMemo, useRef, useState } from 'react';
import type { ProFormInstance } from '@ant-design/pro-components';
import { ProForm } from '@ant-design/pro-components';
import { Alert, Button, Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import FormulaDesigner from '../../src/business/components/FormulaDesigner';
import type {
  FormulaDesignerCapabilities,
  FormulaFormSchema,
} from '../../src/business/components/formula-designer-types';

const schema: FormulaFormSchema = {
  systemFields: [
    { key: 'quantity', label: '数量', dataType: 'number' },
    { key: 'createdAt', label: '创建时间', dataType: 'datetime' },
  ],
  fields: [
    { fieldKey: 'cf_width', label: '宽度', dataType: 'number', fieldKind: 'input' },
    { fieldKey: 'cf_height', label: '高度', dataType: 'number', fieldKind: 'input' },
    { fieldKey: 'cf_pack_fee', label: '包装费', dataType: 'money', fieldKind: 'input' },
    { fieldKey: 'cf_passed', label: '检验合格', dataType: 'boolean', fieldKind: 'input' },
    { fieldKey: 'cf_tags', label: '标签', dataType: 'multi_select', fieldKind: 'input' },
    { fieldKey: 'cf_area', label: '面积', dataType: 'number', fieldKind: 'formula' },
  ],
};

export function FormulaDesignerDemo() {
  const formRef = useRef<ProFormInstance | undefined>(undefined);
  const [expression, setExpression] = useState(
    'round(cf_width * cf_height / 1000, 2)',
  );
  const [disabled, setDisabled] = useState(false);
  const [feedback, setFeedback] = useState('公式预览、字段引用与类型诊断由宿主提供能力。');

  const capabilities = useMemo<FormulaDesignerCapabilities>(
    () => ({
      async requestFormSchema({ objectType }) {
        if (objectType !== 'material') throw new Error('未配置该对象的自定义字段');
        return schema;
      },
      async previewFormula({ expression: formula, sampleData }) {
        if (/syntax_error/i.test(formula)) throw new Error('公式语法错误：请检查字段名和括号。');
        const dependencyKeys = Array.from(
          new Set(formula.match(/\b(?:cf_[a-z0-9_]+|quantity|createdAt)\b/gi) ?? []),
        );
        const normalizedExpression = formula.trim().replace(/\s+/g, ' ');
        const calculated = formula.includes('cf_width') && formula.includes('cf_height')
          ? Number(sampleData.cf_width) * Number(sampleData.cf_height) / 1000
          : formula.includes('cf_pack_fee')
            ? Number(sampleData.cf_pack_fee)
            : 1;
        const isText = /concat|"/.test(formula);
        return {
          value: isText ? '铝型材-样例' : Number(calculated.toFixed(2)),
          dependencyKeys,
          resultType: isText ? 'text' : 'number',
          typeError: null,
          normalizedExpression,
          readableExpression: dependencyKeys.length
            ? dependencyKeys.join(' + ')
            : '常量计算',
        };
      },
      getErrorMessage(error, fallback) {
        const message = error instanceof Error ? error.message : '';
        if (message) setFeedback(message);
        return message || fallback;
      },
    }),
    [],
  );

  return (
    <SectionCard title="自定义字段公式设计器">
      <Typography.Paragraph type="secondary">
        编辑计算属性公式，查看字段/函数/运算符目录、预览结果、依赖字段、类型诊断与标准化表达式。Schema、计算服务、权限结果和错误文案由宿主注入。
      </Typography.Paragraph>
      <Space wrap style={{ marginBottom: 12 }}>
        <Button onClick={() => setDisabled((value) => !value)}>
          {disabled ? '恢复编辑权限' : '切换只读权限'}
        </Button>
        <Button type="primary" onClick={() => formRef.current?.submit()} disabled={disabled}>
          保存公式
        </Button>
      </Space>
      <ProForm
        formRef={formRef}
        layout="vertical"
        initialValues={{ formulaExpression: expression }}
        onValuesChange={(_, values) => setExpression(values.formulaExpression ?? '')}
        onFinish={async (values) => {
          setFeedback(`宿主已保存并校验：${values.formulaExpression ?? ''}`);
          return true;
        }}
        submitter={false}
      >
        <FormulaDesigner
          objectType="material"
          currentFieldKey="cf_area"
          expression={expression}
          dataType="number"
          disabled={disabled}
          getExpression={() => formRef.current?.getFieldValue('formulaExpression')}
          setExpression={(nextExpression) => {
            formRef.current?.setFieldsValue({ formulaExpression: nextExpression });
            setExpression(nextExpression);
          }}
          capabilities={capabilities}
        />
      </ProForm>
      <Alert type="info" showIcon message={feedback} />
    </SectionCard>
  );
}
