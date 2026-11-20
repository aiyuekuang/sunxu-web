import dayjs from 'dayjs';
import { Form, Typography } from 'antd';
import { ProForm } from '@ant-design/pro-components';
import {
  QuickDateRangePicker,
  QuickProFormDateRangePicker,
  QuickProFormDateTimeRangePicker,
  SectionCard,
  type DateRangePickerPreset,
} from '../../src';

const customDatePreset: DateRangePickerPreset = {
  label: '近7天',
  value: () => [dayjs().subtract(13, 'day').startOf('day'), dayjs().endOf('day')],
};

const customDateTimePreset: DateRangePickerPreset = {
  label: '近2小时',
  value: () => [dayjs().subtract(2, 'hour'), dayjs()],
};

export function QuickDateRangePickerDemo() {
  return (
    <SectionCard title="通用日期范围快捷选择器">
      <Typography.Paragraph type="secondary">
        自定义快捷范围优先保留；缺少的通用日期范围会自动补齐，且相同文字标签只显示一次。窄屏双月日历可横向滑动查看。
      </Typography.Paragraph>
      <Form layout="vertical">
        <Form.Item label="Ant Design 日期范围">
          <QuickDateRangePicker
            aria-label="Ant Design 日期范围"
            style={{ width: '100%' }}
            presets={[customDatePreset]}
          />
        </Form.Item>
      </Form>
      <ProForm layout="vertical" submitter={false}>
        <QuickProFormDateRangePicker
          name="dateRange"
          label="ProForm 日期范围"
          fieldProps={{ presets: [customDatePreset] }}
        />
        <QuickProFormDateTimeRangePicker
          name="dateTimeRange"
          label="ProForm 日期时间范围"
          fieldProps={{ presets: [customDateTimePreset] }}
        />
      </ProForm>
    </SectionCard>
  );
}
