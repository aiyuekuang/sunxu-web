import { Alert, Button, Select, Space, Typography } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { MaterialFilteredSelect } from './MaterialFilteredSelect';
import type { MaterialFilteredSelectOption } from './material-select-types';
import type {
  BomEffectiveBomSelectorProps,
  BomResolutionResponse,
} from './bom-effective-bom-selector-types';

/**
 * @sunxu-component mes-specific
 * @sunxu-domain bom
 * @sunxu-reason Preserves the MES effective-BOM resolution flow while the host supplies material search, resolver requests, and the resulting document update.
 */
export function BomEffectiveBomSelector({
  bom,
  resolvedBom,
  resolutionKey,
  capabilities,
  onResolved,
}: BomEffectiveBomSelectorProps) {
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>();
  const [selectedMaterial, setSelectedMaterial] =
    useState<MaterialFilteredSelectOption>();
  const [resolution, setResolution] =
    useState<BomResolutionResponse | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isProductBase = Boolean(
    bom &&
      (bom.bomScope === 'product_base' || (!bom.bomScope && !bom.materialId)),
  );

  useEffect(() => {
    setSelectedMaterialId(undefined);
    setSelectedMaterial(undefined);
    setResolution(null);
    setSelectedCandidateId(undefined);
    setError(null);
  }, [bom?.bomScope, bom?.familyId, bom?.id, bom?.materialId, resolutionKey]);

  const request = useCallback(
    (params: { keyWords?: string } & Record<string, unknown> = {}) =>
      capabilities.requestMaterialOptions({
        ...params,
        ...(bom?.familyId ? { familyId: bom.familyId } : {}),
      }),
    [bom?.familyId, capabilities],
  );

  const resolveMaterialId = () =>
    isProductBase ? selectedMaterialId : bom?.materialId ?? undefined;

  const finishResolution = async (nextResolution: BomResolutionResponse) => {
    if (!nextResolution.bomHeaderId) {
      throw new Error('当前型号没有可用的有效 BOM');
    }
    await onResolved(nextResolution, {
      bomId: bom?.id ?? '',
      resolutionKey,
    });
    setResolution(null);
    setSelectedCandidateId(undefined);
    setError(null);
  };

  const handleResolve = async () => {
    const materialId = resolveMaterialId();
    if (!materialId) {
      setError(
        isProductBase
          ? '请先选择一个物料型号，再查看型号有效 BOM'
          : '当前 BOM 未绑定具体型号，无法解析有效 BOM',
      );
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const nextResolution = await capabilities.resolveBom({
        materialId,
        purpose: 'new_selection',
      });
      if (nextResolution.status === 'matched' && nextResolution.bomHeaderId) {
        await finishResolution(nextResolution);
        return;
      }
      if (
        nextResolution.status === 'conflict' &&
        nextResolution.candidates.length
      ) {
        setResolution(nextResolution);
        setSelectedCandidateId(undefined);
        return;
      }
      if (
        nextResolution.status !== 'matched' ||
        !nextResolution.bomHeaderId
      ) {
        throw new Error(
          nextResolution.messages.join('；') || '当前型号没有可用的有效 BOM',
        );
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '解析有效 BOM 失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateResolve = async () => {
    const materialId = resolveMaterialId();
    if (!materialId || !selectedCandidateId) {
      setError('请先选择要展开的 BOM 方案和版本');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const nextResolution = await capabilities.resolveBom({
        materialId,
        bomHeaderId: selectedCandidateId,
        purpose: 'new_selection',
      });
      if (
        nextResolution.status !== 'matched' ||
        !nextResolution.bomHeaderId
      ) {
        throw new Error(
          nextResolution.messages.join('；') ||
            '选中的 BOM 已不可用，请重新解析',
        );
      }
      await finishResolution(nextResolution);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '解析所选 BOM 失败');
    } finally {
      setLoading(false);
    }
  };

  const canExpandDirectly = Boolean(
    bom &&
      (bom.bomScope
        ? ['model_standard', 'model_effective'].includes(bom.bomScope)
        : bom.materialId),
  );
  if (!bom || canExpandDirectly) return null;

  const materialLabel = [bom.material?.code, bom.material?.name]
    .filter(Boolean)
    .join(' · ');

  return (
    <Space orientation="vertical" size={8} style={{ width: '100%' }}>
      <Alert
        showIcon
        type="info"
        message={
          isProductBase
            ? '系列基础 BOM 不能直接做多级展开'
            : '型号差异 BOM 不能直接做多级展开'
        }
        description={
          <Space orientation="vertical" size={8} style={{ width: '100%' }}>
            <Typography.Text type="secondary">
              {isProductBase
                ? '请选择具体物料型号，系统会按当前有效配置解析型号有效 BOM。'
                : `当前型号：${materialLabel || bom.materialId || '-'}`}
            </Typography.Text>
            {isProductBase ? (
              <MaterialFilteredSelect
                request={request}
                requestKey={bom.familyId ?? 'no-family'}
                value={selectedMaterialId}
                selectedOption={selectedMaterial}
                onChange={(value, option) => {
                  setSelectedMaterialId(value);
                  setSelectedMaterial(option);
                  setResolution(null);
                  setSelectedCandidateId(undefined);
                  setError(null);
                }}
                filterMode="hidden"
                selectWidth="100%"
                placeholder="选择物料型号"
              />
            ) : null}
            <Button
              type="primary"
              onClick={() => void handleResolve()}
              loading={loading}
            >
              查看型号有效 BOM
            </Button>
            {resolution?.candidates.length ? (
              <Space orientation="vertical" size={6} style={{ width: '100%' }}>
                <Typography.Text strong>
                  当前型号存在多个可用 BOM，请选择要展开的方案和版本
                </Typography.Text>
                <Select
                  style={{ width: '100%' }}
                  value={selectedCandidateId}
                  placeholder="选择 BOM 方案和版本"
                  options={resolution.candidates.map((candidate) => ({
                    label:
                      [
                        candidate.bomMasterCode,
                        candidate.bomMasterName,
                        candidate.version,
                      ]
                        .filter(Boolean)
                        .join(' · ') || candidate.bomHeaderId,
                    value: candidate.bomHeaderId,
                  }))}
                  onChange={(value) => {
                    setSelectedCandidateId(value);
                    setError(null);
                  }}
                />
                <Button
                  type="primary"
                  onClick={() => void handleCandidateResolve()}
                  loading={loading}
                >
                  展开选中的 BOM
                </Button>
              </Space>
            ) : null}
          </Space>
        }
      />
      {resolvedBom ? (
        <Typography.Text type="secondary">
          当前展开：
          {[
            resolvedBom.material?.code,
            resolvedBom.material?.name,
          ]
            .filter(Boolean)
            .join(' · ') ||
            resolvedBom.materialId ||
            '-'}{' '}
          · {resolvedBom.version}
        </Typography.Text>
      ) : null}
      {error ? <Alert showIcon type="error" message={error} /> : null}
    </Space>
  );
}
