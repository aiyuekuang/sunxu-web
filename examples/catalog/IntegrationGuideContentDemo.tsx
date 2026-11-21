import { Tabs } from 'antd';
import { SectionCard } from '../../src';
import {
  IntegrationGuideContent,
  INTEGRATION_GUIDE_TITLES,
} from '../../src/mes/components/IntegrationGuideContent';
import type { IntegrationGuideTopic } from '../../src/mes/components/IntegrationGuideContent';

const topics: IntegrationGuideTopic[] = [
  'api',
  'webhook',
  'robots',
  'device-points',
  'sync',
];

export function IntegrationGuideContentDemo() {
  return (
    <SectionCard title="MES 集成指南内容">
      <Tabs
        items={topics.map((topic) => ({
          key: topic,
          label: INTEGRATION_GUIDE_TITLES[topic],
          children: <IntegrationGuideContent topic={topic} />,
        }))}
      />
    </SectionCard>
  );
}
