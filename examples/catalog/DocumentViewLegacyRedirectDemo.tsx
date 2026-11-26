import { useCallback, useMemo, useState } from 'react';
import { Space, Typography } from 'antd';
import { SectionCard } from '../../src';
import {
  DocumentViewLegacyRedirect,
  MesUiProvider,
  type MesUiRoute,
} from '../../src/business';

export function DocumentViewLegacyRedirectDemo() {
  const [routeState, setRouteState] = useState({
    pathname: '/purchase/orders/legacy-detail',
    search: '?status=confirmed&page=3',
  });
  const replace = useCallback((path: string) => {
    const queryIndex = path.indexOf('?');
    setRouteState({
      pathname: queryIndex < 0 ? path : path.slice(0, queryIndex),
      search: queryIndex < 0 ? '' : path.slice(queryIndex),
    });
  }, []);
  const route = useMemo<MesUiRoute>(
    () => ({ ...routeState, replace }),
    [replace, routeState],
  );

  return (
    <SectionCard title="旧单据明细链接兼容">
      <Typography.Paragraph type="secondary">
        打开历史详情路由时，将目标单据页的视图偏好设为“明细”，并保留搜索条件后执行宿主路由替换。
      </Typography.Paragraph>
      <MesUiProvider hasPermission={() => true} actionIntentRoute={route}>
        <DocumentViewLegacyRedirect
          description="正在打开采购订单明细台账…"
          legacyPath="/purchase/orders/legacy-detail"
          storageKey="catalog-document-view-preference"
          targetPath="/purchase/orders"
        />
      </MesUiProvider>
      <Space orientation="vertical" size={0}>
        <Typography.Text type="secondary">
          当前宿主地址：{routeState.pathname}{routeState.search}
        </Typography.Text>
        <Typography.Text type="secondary">
          目标地址应保留查询条件：/purchase/orders?status=confirmed&amp;page=3
        </Typography.Text>
      </Space>
    </SectionCard>
  );
}
