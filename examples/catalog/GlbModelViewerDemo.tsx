import { App, Segmented, Space, Typography } from 'antd';
import { useState } from 'react';
import { SectionCard } from '../../src';
import { GlbModelViewer } from '../../src/business/components/GlbModelViewer';

const triangleBuffer = 'data:application/octet-stream;base64,AAAAAAAAAAAAAAAAAACAPwAAAAAAAAAAAAAAAAAAgD8AAAAAAAABAAIA';

const demoGltf = {
  asset: { version: '2.0', generator: 'Sunxu Web GLB viewer demo' },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ mesh: 0 }],
  meshes: [
    {
      primitives: [{ attributes: { POSITION: 0 }, indices: 1 }],
    },
  ],
  buffers: [{ uri: triangleBuffer, byteLength: 42 }],
  bufferViews: [
    { buffer: 0, byteOffset: 0, byteLength: 36, target: 34962 },
    { buffer: 0, byteOffset: 36, byteLength: 6, target: 34963 },
  ],
  accessors: [
    {
      bufferView: 0,
      componentType: 5126,
      count: 3,
      type: 'VEC3',
      min: [0, 0, 0],
      max: [1, 1, 0],
    },
    { bufferView: 1, componentType: 5123, count: 3, type: 'SCALAR' },
  ],
};

const demoModelUrl =
  'data:application/json;charset=utf-8,' +
  encodeURIComponent(JSON.stringify(demoGltf));

function GlbModelViewerDemoContent() {
  const [state, setState] = useState<'model' | 'error'>('model');
  const url =
    state === 'model'
      ? demoModelUrl
      : 'data:application/octet-stream;base64,AA==';

  return (
    <SectionCard title="GLB 三维模型查看器">
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Typography.Paragraph type="secondary">
          three 和 OrbitControls / GLTFLoader 在查看器挂载后按需加载；MaterialDrawingsPanel 的宿主通过 renderModelPreview 插槽传入此组件，并负责解析文件访问 URL。
        </Typography.Paragraph>
        <Segmented
          aria-label="三维查看状态"
          value={state}
          options={[
            { label: '演示模型', value: 'model' },
            { label: '加载失败', value: 'error' },
          ]}
          onChange={(value) => setState(value as typeof state)}
        />
        <div style={{ width: '100%', height: 420, minHeight: 320 }}>
          <GlbModelViewer
            key={url}
            url={url}
            name={state === 'model' ? '目录演示三角模型' : '损坏模型示例'}
          />
        </div>
        <Typography.Text type="secondary">
          接入插槽：renderModelPreview: (url, name) =&gt; &lt;GlbModelViewer url=&#123;url&#125; name=&#123;name&#125; /&gt;
        </Typography.Text>
      </Space>
    </SectionCard>
  );
}

/** Independent Catalog demo for the standalone GLB renderer and its failure state. */
export function GlbModelViewerDemo() {
  return (
    <App>
      <GlbModelViewerDemoContent />
    </App>
  );
}
