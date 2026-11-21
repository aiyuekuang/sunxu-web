import { Alert, Collapse, Space, Tag, Typography } from 'antd';

const { Paragraph, Text, Title } = Typography;

const WEBHOOK_PAYLOAD_FIELDS = [
  {
    key: 'work_order.released',
    label: '工单下达',
    fields: [
      'id',
      'orderNo',
      'status',
      'workOrderType',
      'materialId',
      'materialCode',
      'materialName',
      'materialSpec',
      'unit',
      'unitLabel',
      'plannedQty',
      'priority',
      'planId',
      'planNo',
      'customerId',
      'customerCode',
      'customerName',
      'sourceRemark',
      'assigneeId',
      'assigneeName',
      'planStartTime',
      'planStartTimeText',
      'planEndTime',
      'planEndTimeText',
      'dueDate',
      'dueDateText',
      'routeId',
      'routeName',
      'routeVersion',
      'externalId',
      'externalSource',
    ],
  },
  {
    key: 'work_order.completed',
    label: '工单完成',
    fields: [
      'id',
      'orderNo',
      'status',
      'workOrderType',
      'materialId',
      'materialCode',
      'materialName',
      'materialSpec',
      'unit',
      'unitLabel',
      'plannedQty',
      'completedQty',
      'scrappedQty',
      'planId',
      'planNo',
      'customerId',
      'customerCode',
      'customerName',
      'sourceRemark',
      'assigneeId',
      'assigneeName',
      'actualStartTime',
      'actualStartTimeText',
      'actualEndTime',
      'actualEndTimeText',
      'planEndTime',
      'planEndTimeText',
      'dueDate',
      'dueDateText',
      'routeId',
      'routeName',
      'routeVersion',
      'receiptWarehouseId',
      'receiptWarehouseCode',
      'receiptWarehouseName',
      'externalId',
      'externalSource',
    ],
  },
  {
    key: 'quality.result',
    label: '质检通过、条件接受、未通过',
    fields: [
      'id',
      'inspectionNo',
      'type',
      'conclusion',
      'materialId',
      'materialCode',
      'materialName',
      'materialSpec',
      'unit',
      'unitLabel',
      'workOrderId',
      'workOrderNo',
      'planId',
      'planNo',
      'customerId',
      'customerCode',
      'customerName',
      'batchNo',
      'sampleQty',
      'passQty',
      'failQty',
      'inspectorId',
      'inspectorName',
      'submittedById',
      'submittedByName',
      'submittedAt',
      'submittedAtText',
      'disposalNote',
      'remarks',
    ],
  },
  {
    key: 'warehouse.low_stock',
    label: '库存预警',
    fields: [
      'materialId',
      'materialCode',
      'materialName',
      'materialSpec',
      'unit',
      'unitLabel',
      'warehouseId',
      'warehouseName',
      'currentQty',
      'availableQty',
      'threshold',
      'safetyStock',
      'ownerType',
      'ownerRefId',
      'ownerName',
      'transactionId',
      'transactionNo',
      'operatorId',
      'operatorName',
    ],
  },
  {
    key: 'todo.approval.created',
    label: '审批待办创建',
    fields: [
      'id',
      'title',
      'assigneeId',
      'assigneeName',
      'entityType',
      'entityId',
      'documentNo',
      'priority',
      'dueDate',
    ],
  },
];

const ROBOT_MESSAGE_FIELDS = [
  {
    key: 'work_order.released',
    label: '工单下达提醒',
    fields: [
      { key: 'materialName', label: '物料名称', path: 'data.materialName' },
      { key: 'materialSpec', label: '规格', path: 'data.materialSpec' },
      { key: 'plannedQty', label: '数量', path: 'data.plannedQty' },
      { key: 'unit', label: '单位', path: 'data.unitLabel' },
      { key: 'customerName', label: '客户名称', path: 'data.customerName' },
      { key: 'customerCode', label: '客户编码', path: 'data.customerCode' },
      {
        key: 'sourceRemark',
        label: '订单明细备注',
        path: 'data.sourceRemark',
      },
      { key: 'planNo', label: '生产计划', path: 'data.planNo' },
      { key: 'materialCode', label: '物料编码', path: 'data.materialCode' },
      { key: 'priority', label: '优先级', path: 'data.priority' },
      {
        key: 'planStartTimeText',
        label: '计划开始',
        path: 'data.planStartTimeText',
      },
      {
        key: 'planEndTimeText',
        label: '计划结束',
        path: 'data.planEndTimeText',
      },
      { key: 'dueDateText', label: '交期', path: 'data.dueDateText' },
      { key: 'routeName', label: '工艺路线', path: 'data.routeName' },
      { key: 'routeVersion', label: '路线版本', path: 'data.routeVersion' },
      {
        key: 'externalSource',
        label: '外部来源',
        path: 'data.externalSource',
      },
      { key: 'externalId', label: '外部单号', path: 'data.externalId' },
      { key: 'assigneeName', label: '负责人', path: 'data.assigneeName' },
    ],
  },
  {
    key: 'work_order.completed',
    label: '工单完工提醒',
    fields: [
      { key: 'materialName', label: '物料名称', path: 'data.materialName' },
      { key: 'materialSpec', label: '规格', path: 'data.materialSpec' },
      { key: 'completedQty', label: '完工数量', path: 'data.completedQty' },
      { key: 'scrappedQty', label: '报废数量', path: 'data.scrappedQty' },
      { key: 'unit', label: '单位', path: 'data.unitLabel' },
      { key: 'customerName', label: '客户名称', path: 'data.customerName' },
      {
        key: 'sourceRemark',
        label: '订单明细备注',
        path: 'data.sourceRemark',
      },
      { key: 'planNo', label: '生产计划', path: 'data.planNo' },
      { key: 'materialCode', label: '物料编码', path: 'data.materialCode' },
      { key: 'plannedQty', label: '计划数量', path: 'data.plannedQty' },
      {
        key: 'actualEndTimeText',
        label: '完工时间',
        path: 'data.actualEndTimeText',
      },
      { key: 'dueDateText', label: '交期', path: 'data.dueDateText' },
      { key: 'routeName', label: '工艺路线', path: 'data.routeName' },
      {
        key: 'receiptWarehouseName',
        label: '入库仓',
        path: 'data.receiptWarehouseName',
      },
      { key: 'assigneeName', label: '负责人', path: 'data.assigneeName' },
      { key: 'externalId', label: '外部单号', path: 'data.externalId' },
    ],
  },
  ...(
    ['quality.passed', 'quality.rejected', 'quality.conditional'] as const
  ).map((key) => ({
    key,
    label:
      key === 'quality.passed'
        ? '质检通过提醒'
        : key === 'quality.rejected'
          ? '质检拒绝提醒'
          : '质检让步接收提醒',
    fields: [
      { key: 'inspectionNo', label: '质检单', path: 'data.inspectionNo' },
      { key: 'type', label: '检验类型', path: 'data.type' },
      { key: 'materialName', label: '物料名称', path: 'data.materialName' },
      { key: 'materialCode', label: '物料编码', path: 'data.materialCode' },
      { key: 'materialSpec', label: '物料规格', path: 'data.materialSpec' },
      { key: 'unit', label: '单位', path: 'data.unitLabel' },
      { key: 'customerName', label: '客户名称', path: 'data.customerName' },
      { key: 'batchNo', label: '批号', path: 'data.batchNo' },
      { key: 'sampleQty', label: '抽检数量', path: 'data.sampleQty' },
      { key: 'passQty', label: '合格数量', path: 'data.passQty' },
      { key: 'failQty', label: '不合格数量', path: 'data.failQty' },
      {
        key: 'submittedAtText',
        label: '提交时间',
        path: 'data.submittedAtText',
      },
      { key: 'inspectorName', label: '检验员', path: 'data.inspectorName' },
      {
        key: 'submittedByName',
        label: '提交人',
        path: 'data.submittedByName',
      },
      ...(key === 'quality.passed'
        ? []
        : [
            {
              key: 'disposalNote',
              label: '处置说明',
              path: 'data.disposalNote',
            },
          ]),
    ],
  })),
  {
    key: 'warehouse.low_stock',
    label: '库存预警提醒',
    fields: [
      { key: 'materialCode', label: '物料编码', path: 'data.materialCode' },
      { key: 'materialName', label: '物料名称', path: 'data.materialName' },
      { key: 'materialSpec', label: '物料规格', path: 'data.materialSpec' },
      { key: 'ownerName', label: '客户货主', path: 'data.ownerName' },
      { key: 'availableQty', label: '当前可用', path: 'data.availableQty' },
      { key: 'safetyStock', label: '预警线', path: 'data.safetyStock' },
      { key: 'unit', label: '单位', path: 'data.unitLabel' },
      { key: 'warehouseName', label: '仓库', path: 'data.warehouseName' },
      { key: 'operatorName', label: '操作人', path: 'data.operatorName' },
    ],
  },
  {
    key: 'todo.approval.created',
    label: '审批待办提醒',
    fields: [
      { key: 'title', label: '待办', path: 'data.title' },
      { key: 'documentNo', label: '业务单号', path: 'data.documentNo' },
      { key: 'assigneeName', label: '审批人', path: 'data.assigneeName' },
      { key: 'priority', label: '优先级', path: 'data.priority' },
    ],
  },
];

function ApiGuide() {
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Paragraph>
        API Token 用于让 ERP、WMS 或其他受控系统调用 MES 开放接口。Token
        沿用创建账号的权限、当前公司和数据范围，不会额外扩大访问权限。
      </Paragraph>
      <Title level={5}>接入步骤</Title>
      <ol>
        <li>为外部系统准备专用 MES 用户，只授予实际需要的角色权限。</li>
        <li>
          在“API 接入”中新增 Token，填写用途名称；有期限要求时设置过期时间。
        </li>
        <li>
          创建后立即复制完整 Token 并安全保存。Token
          只显示一次；遗失或泄露时先吊销，再创建新的。
        </li>
        <li>
          调用时使用 <Text code>Authorization: Bearer &lt;Token&gt;</Text>
          ，并按接口文档中的请求格式提交。
        </li>
      </ol>
      <Alert
        showIcon
        type="info"
        message="先核对权限，再联调写入接口"
        description="OpenAPI 文档列出系统支持的接口，不代表当前账号有权调用全部接口。先用只读请求验证连接，再按业务流程验证写入结果。"
      />
    </Space>
  );
}

function WebhookGuide() {
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Paragraph>
        Webhook 将 MES
        已支持的业务事件推送到外部系统。创建配置后，接收端负责校验签名、处理事件并快速返回成功响应。
      </Paragraph>
      <Title level={5}>接入步骤</Title>
      <ol>
        <li>新增 Webhook，填写接收地址并选择要接收的事件。</li>
        <li>复制创建时显示的签名密钥，通过安全渠道交给接收端负责人。</li>
        <li>
          接收端完成验签后，用“发送测试”验证连接；测试事件不代表真实业务事件。
        </li>
        <li>按正常业务操作触发一条已订阅事件，双方核对业务对象和处理结果。</li>
      </ol>
      <Title level={5}>请求与验签</Title>
      <Paragraph>
        MES 以 <Text code>POST application/json</Text> 推送。请求体包含
        <Text code>event</Text>、<Text code>company_id</Text>、
        <Text code>timestamp</Text> 和 <Text code>data</Text>；部分事件还包含
        <Text code>idempotency_key</Text>。
      </Paragraph>
      <Paragraph>
        接收端使用创建时的密钥，对原始请求体字节计算 HMAC-SHA256，比较
        <Text code>X-Mes-Signature</Text> 请求头中的
        <Text code>sha256=&lt;hex&gt;</Text>。必须在解析 JSON
        前校验原始请求体；实现比较时使用恒定时间比较。
      </Paragraph>
      <Paragraph>
        <Text code>X-Mes-Event</Text> 与请求体中的事件名相同。若请求带有
        <Text code>idempotency_key</Text>，MES 也会通过
        <Text code>Idempotency-Key</Text> 请求头发送它。
      </Paragraph>
      <Title level={5}>当前可选事件</Title>
      <Space wrap>
        <Tag>工单下达</Tag>
        <Tag>工单完成</Tag>
        <Tag>质检通过</Tag>
        <Tag>质检条件接受</Tag>
        <Tag>质检未通过</Tag>
        <Tag>库存预警</Tag>
        <Tag>审批待办创建</Tag>
      </Space>
      <Title level={5}>各事件的完整 data 字段</Title>
      <Paragraph type="secondary">
        下列为当前推送代码实际发送的字段名。字段会出现在
        <Text code>data</Text> 中；关联资料缺失时部分字段值可能为
        <Text code>null</Text>。三类质检事件还会在外层携带
        <Text code>idempotency_key</Text>。
      </Paragraph>
      <Collapse
        items={WEBHOOK_PAYLOAD_FIELDS.map((group) => ({
          key: group.key,
          label: `${group.label}（${group.key}）`,
          children: (
            <Space wrap size={[4, 8]}>
              {group.fields.map((field) => (
                <Text key={field} code>
                  {field}
                </Text>
              ))}
            </Space>
          ),
        }))}
      />
      <Title level={5}>失败与重复事件</Title>
      <ul>
        <li>接收端应在 10 秒内返回 HTTP 2xx；其他状态或超时会记为失败。</li>
        <li>
          失败记录可手动重试，重试会再次发送原请求体；接收端要做幂等处理。
        </li>
        <li>
          投递记录展示发送内容和 HTTP
          状态，不保存接收端响应正文；具体错误文字需查接收服务日志。
        </li>
      </ul>
    </Space>
  );
}

function RobotGuide() {
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Paragraph>
        群机器人把 MES
        业务提醒发送到飞书、企业微信或钉钉群，适合提醒岗位及时处理事项；审批、报工和单据确认仍要回到
        MES 完成。
      </Paragraph>
      <Title level={5}>配置步骤</Title>
      <ol>
        <li>先在对应平台创建群机器人，复制完整的机器人地址。</li>
        <li>打开“群机器人”，选择平台和推送事件，粘贴地址并填写配置名称。</li>
        <li>按模板选择需要展示的业务字段，检查消息预览后发送测试。</li>
        <li>测试成功后保存并启用；需要暂停提醒时停用配置。</li>
      </ol>
      <Title level={5}>快捷配置可选消息字段</Title>
      <Paragraph type="secondary">
        每个事件只能从对应模板列出的字段中选择，最多选择 20
        项；字段展示名可调整，数据来源路径固定。下列字段与当前 MES
        推送内容一致。
      </Paragraph>
      <Collapse
        items={ROBOT_MESSAGE_FIELDS.map((group) => ({
          key: group.key,
          label: `${group.label}（${group.key}）`,
          children: (
            <Space direction="vertical" size={4}>
              {group.fields.map((field) => (
                <Text key={field.key}>
                  <Text code>{field.key}</Text> — {field.label}（
                  <Text code>{field.path}</Text>）
                </Text>
              ))}
            </Space>
          ),
        }))}
      />
      <Alert
        showIcon
        type="warning"
        message="机器人地址是访问凭据"
        description="只交给负责配置和联调的人员。编辑已有配置时，已保存的密钥不会回显；留空表示继续使用原地址，更换机器人时粘贴新地址并重新测试。"
      />
      <Paragraph>
        推送失败时先检查平台、事件、机器人地址和测试结果，再在对应机器人配置行打开“运行记录”查看错误信息。钉钉机器人当前不支持标题颜色。
      </Paragraph>
    </Space>
  );
}

function DevicePointGuide() {
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Paragraph>
        设备点位映射用于把外部网关上报的设备编码和点位名称，对应到 MES
        设备及标准点位，避免同一测量值在两边叫法不同。
      </Paragraph>
      <Title level={5}>维护步骤</Title>
      <ol>
        <li>确认外部系统或设备来源、MES 设备和实际点位名称都已准备好。</li>
        <li>新增映射，选择来源和 MES 设备，填写源设备编码、源点位。</li>
        <li>选择对应的 MES 标准点位和单位，保存并启用映射。</li>
        <li>
          由网关发送一条实际数据，再核对运行记录和设备数据中的设备、点位、单位和值。
        </li>
      </ol>
      <Alert
        showIcon
        type="info"
        message="映射只负责对准来源"
        description="源设备编码和源点位要与网关上报内容一致。没有对应的来源选项时，请联系负责集成配置的管理员或实施人员；不要用相似设备或点位代替。"
      />
    </Space>
  );
}

function SyncGuide() {
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Paragraph>
        “同步与运行记录”用于跟踪已有外部连接任务的执行情况，帮助双方按同一条记录定位失败，不在这里重新录入业务单据。同步任务、主动同步进度和通用运行记录分别在对应页签查看；Webhook
        投递记录在 Webhook 模块查看，AI 调用日志在 AI 集成模块查看。
      </Paragraph>
      <Title level={5}>查看同步任务</Title>
      <ol>
        <li>在“同步任务”按任务内容、连接对象和启用状态找到对应配置。</li>
        <li>核对连接对象、业务内容、同步方式和最近触发时间。</li>
        <li>
          当前页面用于查看已有任务；需要新增或修改时联系负责集成配置的管理员或实施人员。
        </li>
      </ol>
      <Title level={5}>定位运行问题</Title>
      <ol>
        <li>
          进入“运行记录”，按连接对象、任务和时间范围定位失败记录；需要核对主动拉取位置时，切换到“主动同步进度”。
        </li>
        <li>
          也可以在“同步任务”对应行直接打开“运行记录”，查看该任务的执行情况。
        </li>
        <li>
          查看状态、错误提示和展开后的请求/响应摘要，再结合外部系统日志核对。
        </li>
        <li>
          主动拉取任务可在“主动同步进度”中检查续拉位置、最近成功时间和下次同步时间。Webhook
          投递失败或 AI 动作执行失败时，分别回到 Webhook 或 AI
          集成模块查看对应记录。
        </li>
        <li>修复后由任务负责人重新执行，并确认新记录成功、进度按预期推进。</li>
      </ol>
      <Alert
        showIcon
        type="warning"
        message="先确认哪一侧没有完成"
        description="MES 记录失败可能来自地址、凭证、字段映射、外部系统响应或业务数据。保留失败记录和时间，再由双方按同一笔请求排查。"
      />
    </Space>
  );
}

export type IntegrationGuideTopic =
  | 'api'
  | 'webhook'
  | 'robots'
  | 'device-points'
  | 'sync';

export const INTEGRATION_GUIDE_TITLES: Record<IntegrationGuideTopic, string> = {
  api: 'API 接入说明',
  webhook: 'Webhook 接入说明',
  robots: '群机器人配置说明',
  'device-points': '设备点位说明',
  sync: '同步与运行记录说明',
};

/**
 * @sunxu-component mes-specific
 * @sunxu-domain integration-guides
 * @sunxu-reason Keeps the MES integration guide content and topic presentation together; the host route chooses the topic and retains page navigation.
 */
export function IntegrationGuideContent({
  topic,
}: {
  topic: IntegrationGuideTopic;
}) {
  switch (topic) {
    case 'api':
      return <ApiGuide />;
    case 'webhook':
      return <WebhookGuide />;
    case 'robots':
      return <RobotGuide />;
    case 'device-points':
      return <DevicePointGuide />;
    case 'sync':
      return <SyncGuide />;
  }
  return null;
}
