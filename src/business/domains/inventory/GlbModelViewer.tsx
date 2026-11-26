import { AppstoreOutlined, ReloadOutlined } from '@ant-design/icons';
import { Alert, App, Button, Empty, Space, Spin, theme, Tooltip } from 'antd';
import { useEffect, useRef, useState } from 'react';
import type * as ThreeNamespace from 'three';
import type { GlbModelViewerProps } from '../manufacturing/glb-model-viewer-types';
import '../manufacturing/glb-model-viewer.css';

type WireframeMaterial = ThreeNamespace.Material & { wireframe: boolean };

const hasWireframe = (
  material: ThreeNamespace.Material,
): material is WireframeMaterial => 'wireframe' in material;

function isMeshObject(object: ThreeNamespace.Object3D): object is ThreeNamespace.Mesh {
  return 'isMesh' in object && object.isMesh === true;
}

function updateWireframe(
  model: ThreeNamespace.Object3D | null,
  enabled: boolean,
) {
  model?.traverse((object) => {
    if (!isMeshObject(object)) return;
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    materials.forEach((material) => {
      if (hasWireframe(material)) material.wireframe = enabled;
    });
  });
}

function disposeMaterial(material: ThreeNamespace.Material) {
  const visited = new WeakSet<object>();
  const disposeTextures = (value: unknown) => {
    if (
      !value ||
      typeof value !== 'object' ||
      visited.has(value)
    ) {
      return;
    }
    visited.add(value);
    if ('isTexture' in value && value.isTexture === true) {
      (value as ThreeNamespace.Texture).dispose();
      return;
    }
    Object.values(value).forEach(disposeTextures);
  };
  Object.values(material).forEach(disposeTextures);
  material.dispose();
}

function disposeObject(object: ThreeNamespace.Object3D) {
  object.traverse((child) => {
    const renderable = child as ThreeNamespace.Object3D & {
      geometry?: ThreeNamespace.BufferGeometry;
      material?: ThreeNamespace.Material | ThreeNamespace.Material[];
      skeleton?: ThreeNamespace.Skeleton;
    };
    renderable.geometry?.dispose();
    if (renderable.material) {
      const materials = Array.isArray(renderable.material)
        ? renderable.material
        : [renderable.material];
      materials.forEach(disposeMaterial);
    }
    renderable.skeleton?.dispose();
  });
}

/**
 * @sunxu-layer business
 * @sunxu-domain inventory
 * @sunxu-reason Provides the host GLB preview controls and owns the WebGL/three lifecycle while the host supplies an authorized, browser-readable file URL and composes the viewer through MaterialDrawingsPanel's renderer slot.
 * Interactive GLB preview with orbit controls, grid, wireframe, and camera reset.
 */
export function GlbModelViewer({ url, name }: GlbModelViewerProps) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<ThreeNamespace.Object3D | null>(null);
  const gridRef = useRef<ThreeNamespace.GridHelper | null>(null);
  const resetCameraRef = useRef<(() => void) | null>(null);
  const showGridRef = useRef(true);
  const wireframeRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const { message } = App.useApp();
  const { token } = theme.useToken();

  useEffect(() => {
    wireframeRef.current = wireframe;
    updateWireframe(modelRef.current, wireframe);
  }, [wireframe]);

  useEffect(() => {
    showGridRef.current = showGrid;
    if (gridRef.current) gridRef.current.visible = showGrid;
  }, [showGrid]);

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return undefined;

    let disposed = false;
    let frameId = 0;
    let scene: ThreeNamespace.Scene | null = null;
    let camera: ThreeNamespace.PerspectiveCamera | null = null;
    let renderer: ThreeNamespace.WebGLRenderer | null = null;
    let controls: { update: () => void; dispose: () => void; target: ThreeNamespace.Vector3; minDistance: number; maxDistance: number } | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const disposeRuntime = () => {
      resizeObserver?.disconnect();
      resizeObserver = null;
      resetCameraRef.current = null;
      if (modelRef.current) {
        scene?.remove(modelRef.current);
        disposeObject(modelRef.current);
        modelRef.current = null;
      }
      if (gridRef.current) {
        scene?.remove(gridRef.current);
        gridRef.current.geometry.dispose();
        const materials = Array.isArray(gridRef.current.material)
          ? gridRef.current.material
          : [gridRef.current.material];
        materials.forEach((material) => material.dispose());
        gridRef.current = null;
      }
      controls?.dispose();
      controls = null;
      renderer?.dispose();
      renderer?.domElement.remove();
      renderer = null;
    };

    const setLoadError = () => {
      setLoading(false);
      setError('无法加载“' + name + '”，请下载原始 GLB 文件检查。');
    };

    const initialize = async () => {
      setLoading(true);
      setError(null);
      try {
        // Optional peer dependency: load the renderer only when this viewer mounts.
        const [threeModule, controlsModule, loaderModule] = await Promise.all([
          import('three'),
          import('three/addons/controls/OrbitControls.js'),
          import('three/addons/loaders/GLTFLoader.js'),
        ]);
        if (disposed) return;

        scene = new threeModule.Scene();
        scene.background = new threeModule.Color('#f4f6f8');
        camera = new threeModule.PerspectiveCamera(35, 1, 0.01, 1000);
        renderer = new threeModule.WebGLRenderer({ antialias: true, alpha: false });
        renderer.outputColorSpace = threeModule.SRGBColorSpace;
        renderer.toneMapping = threeModule.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        renderer.domElement.style.touchAction = 'none';
        container.appendChild(renderer.domElement);

        const orbitControls = new controlsModule.OrbitControls(
          camera,
          renderer.domElement,
        );
        controls = orbitControls;
        orbitControls.enableDamping = true;
        orbitControls.dampingFactor = 0.08;
        orbitControls.screenSpacePanning = true;

        scene.add(new threeModule.HemisphereLight('#ffffff', '#7d8794', 2.2));
        const keyLight = new threeModule.DirectionalLight('#ffffff', 2.8);
        keyLight.position.set(4, 8, 6);
        scene.add(keyLight);
        const fillLight = new threeModule.DirectionalLight('#b9d7ff', 1.2);
        fillLight.position.set(-4, 3, -5);
        scene.add(fillLight);

        const resize = () => {
          if (!camera || !renderer) return;
          const width = container.clientWidth;
          const height = container.clientHeight;
          if (!width || !height) return;
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height, false);
        };
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(container);
        resize();

        const loader = new loaderModule.GLTFLoader();
        loader.load(
          url,
          (gltf) => {
            if (disposed) {
              disposeObject(gltf.scene);
              return;
            }

            const model = gltf.scene;
            const initialBox = new threeModule.Box3().setFromObject(model);
            const initialCenter = initialBox.getCenter(new threeModule.Vector3());
            const initialSize = initialBox.getSize(new threeModule.Vector3());
            const maxDimension = Math.max(
              initialSize.x,
              initialSize.y,
              initialSize.z,
              1,
            );
            model.position.sub(initialCenter);
            scene?.add(model);
            modelRef.current = model;
            updateWireframe(model, wireframeRef.current);

            const gridSize = Math.max(maxDimension * 4, 4);
            const grid = new threeModule.GridHelper(
              gridSize,
              20,
              '#aeb8c2',
              '#d7dde3',
            );
            grid.position.y = -initialSize.y / 2;
            grid.visible = showGridRef.current;
            gridRef.current = grid;
            scene?.add(grid);

            if (!camera || !controls) return;
            camera.near = Math.max(maxDimension / 100, 0.001);
            camera.far = maxDimension * 100;
            camera.position.set(
              maxDimension * 1.5,
              maxDimension * 0.9,
              maxDimension * 1.5,
            );
            camera.updateProjectionMatrix();
            controls.target.set(0, 0, 0);
            controls.minDistance = Math.max(maxDimension * 0.05, 0.01);
            controls.maxDistance = maxDimension * 20;
            controls.update();
            resetCameraRef.current = () => {
              camera?.position.set(
                maxDimension * 1.5,
                maxDimension * 0.9,
                maxDimension * 1.5,
              );
              controls?.target.set(0, 0, 0);
              controls?.update();
            };
            setLoading(false);
          },
          undefined,
          () => {
            if (disposed) return;
            setLoadError();
          },
        );

        const render = () => {
          if (disposed || !scene || !camera || !renderer || !controls) return;
          controls.update();
          renderer.render(scene, camera);
          frameId = window.requestAnimationFrame(render);
        };
        render();
      } catch {
        if (disposed) return;
        disposeRuntime();
        setLoadError();
      }
    };

    void initialize();
    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      disposeRuntime();
    };
  }, [url, name]);

  const resetCamera = () => {
    resetCameraRef.current?.();
    if (!resetCameraRef.current) message.info('模型仍在加载，请稍候');
  };

  return (
    <section
      className="sxw-glb-model-viewer"
      aria-label={name + ' 3D查看器'}
      style={{ background: token.colorFillQuaternary }}
    >
      <div
        className="sxw-glb-model-viewer-toolbar"
        style={{
          background: token.colorBgContainer,
          borderBottomColor: token.colorBorderSecondary,
        }}
      >
        <Space size={4} wrap>
          <Tooltip title="恢复视角">
            <Button
              size="small"
              icon={<ReloadOutlined />}
              aria-label="恢复视角"
              onClick={resetCamera}
            >
              恢复视角
            </Button>
          </Tooltip>
          <Tooltip title={showGrid ? '隐藏地面网格' : '显示地面网格'}>
            <Button
              size="small"
              type={showGrid ? 'primary' : 'default'}
              ghost={showGrid}
              icon={<AppstoreOutlined />}
              aria-pressed={showGrid}
              onClick={() => setShowGrid((value) => !value)}
            >
              网格
            </Button>
          </Tooltip>
          <Button
            size="small"
            type={wireframe ? 'primary' : 'default'}
            ghost={wireframe}
            aria-pressed={wireframe}
            onClick={() => setWireframe((value) => !value)}
          >
            线框
          </Button>
        </Space>
        <span
          className="sxw-glb-model-viewer-hint"
          style={{ color: token.colorTextSecondary }}
        >
          拖拽旋转 · 滚轮缩放
        </span>
      </div>
      <div ref={canvasContainerRef} className="sxw-glb-model-viewer-canvas">
        {loading ? (
          <div className="sxw-glb-model-viewer-status">
            <Spin description="正在加载3D模型" />
          </div>
        ) : null}
        {error ? (
          <div className="sxw-glb-model-viewer-status">
            <Alert type="warning" showIcon message={error} />
          </div>
        ) : null}
        {!loading && !error && !modelRef.current ? (
          <div className="sxw-glb-model-viewer-status">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无模型" />
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default GlbModelViewer;
