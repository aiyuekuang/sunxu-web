import { Select } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import type {
  BomIssueOperationBindingSelection,
  BomIssueOperationCapabilities,
  BomIssueOperationSelectProps,
  IssueOperationOption,
} from './bom-issue-operation-select-types';

interface RouteOperation {
  code?: string;
  name: string;
  sequence?: number;
  stageNo?: number;
  stageName?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readRouteOperation(value: unknown): RouteOperation | null {
  if (!isRecord(value) || typeof value.name !== 'string') return null;
  return {
    code: typeof value.code === 'string' ? value.code : undefined,
    name: value.name,
    sequence: typeof value.sequence === 'number' ? value.sequence : undefined,
    stageNo: typeof value.stageNo === 'number' ? value.stageNo : undefined,
    stageName:
      typeof value.stageName === 'string' ? value.stageName : undefined,
  };
}

function resolveOperationPhaseCode(operation: RouteOperation): string | undefined {
  if (operation.stageNo !== undefined && operation.stageNo !== null) {
    return String(operation.stageNo);
  }
  return operation.stageName?.trim() || undefined;
}

function createSelectionValue(
  selection: BomIssueOperationBindingSelection,
): string {
  return [
    selection.routeMasterId,
    selection.operationCode,
    selection.phaseCode ?? '',
  ]
    .map((part) => encodeURIComponent(part))
    .join('|');
}

function buildUnresolvedOption(
  selection: BomIssueOperationBindingSelection,
): IssueOperationOption {
  const phaseText = selection.phaseCode ? ` / 阶段 ${selection.phaseCode}` : '';
  return {
    label: `${selection.routeMasterId} → ${selection.operationCode}${phaseText}（当前候选路线未识别）`,
    value: createSelectionValue(selection),
    searchText: `${selection.routeMasterId} ${selection.operationCode} ${selection.phaseCode ?? ''}`,
    selection,
  };
}

const optionsInFlight = new WeakMap<
  BomIssueOperationCapabilities,
  Map<string, Promise<IssueOperationOption[]>>
>();

async function fetchIssueOperationOptions(
  materialId: string,
  capabilities: BomIssueOperationCapabilities,
): Promise<IssueOperationOption[]> {
  const response = await capabilities.listRouteCandidates({
    materialId,
    routeSelectionDate:
      capabilities.getRouteSelectionDate?.() ?? new Date().toISOString(),
  });
  const candidates = [
    ...new Map(
      (response?.candidates ?? []).map((candidate) => [
        candidate.routeMasterId,
        candidate,
      ]),
    ).values(),
  ];
  const routeDetails = await Promise.all(
    candidates.map(async (candidate) => ({
      candidate,
      route: await capabilities.getRouteDetail({ id: candidate.routeId }),
    })),
  );

  const nextOptions: IssueOperationOption[] = [];
  for (const { candidate, route } of routeDetails) {
    const routeOperations = Array.isArray(route.operations)
      ? route.operations
      : [];
    for (const rawOperation of routeOperations) {
      const operation = readRouteOperation(rawOperation);
      const operationCode = operation?.code?.trim();
      if (!operation || !operationCode) continue;
      const phaseCode = resolveOperationPhaseCode(operation);
      const selection: BomIssueOperationBindingSelection = {
        routeMasterId: candidate.routeMasterId,
        operationCode,
        phaseCode,
      };
      const sequenceText = operation.sequence ? `${operation.sequence} ` : '';
      const phaseText = phaseCode ? ` / 阶段 ${phaseCode}` : '';
      nextOptions.push({
        label: `${candidate.code} / ${candidate.name} / ${candidate.versionLabel} → ${sequenceText}${operation.name}（${operationCode}${phaseText}）`,
        value: createSelectionValue(selection),
        searchText: `${candidate.code} ${candidate.name} ${candidate.versionLabel} ${operationCode} ${operation.name} ${phaseCode ?? ''}`,
        selection,
      });
    }
  }
  nextOptions.sort((left, right) =>
    left.label.localeCompare(right.label, 'zh-CN'),
  );
  return nextOptions;
}

function loadIssueOperationOptions(
  materialId: string,
  capabilities: BomIssueOperationCapabilities,
): Promise<IssueOperationOption[]> {
  let materialRequests = optionsInFlight.get(capabilities);
  if (!materialRequests) {
    materialRequests = new Map();
    optionsInFlight.set(capabilities, materialRequests);
  }
  const current = materialRequests.get(materialId);
  if (current) return current;

  const request = fetchIssueOperationOptions(materialId, capabilities);
  materialRequests.set(materialId, request);
  void request.then(
    () => {
      if (materialRequests?.get(materialId) === request) {
        materialRequests.delete(materialId);
      }
    },
    () => {
      if (materialRequests?.get(materialId) === request) {
        materialRequests.delete(materialId);
      }
    },
  );
  return request;
}

/**
 * Loads selectable route/operation pairs for a parent material.
 * The host supplies MES route APIs; failures leave the list empty for retry on context change.
 */
export function useBomIssueOperationOptions(
  materialId: string | undefined,
  capabilities: BomIssueOperationCapabilities,
) {
  const [options, setOptions] = useState<IssueOperationOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!materialId) {
      setOptions([]);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    void loadIssueOperationOptions(materialId, capabilities).then(
      (nextOptions) => {
        if (cancelled) return;
        setOptions(nextOptions);
        setLoading(false);
      },
      () => {
        if (!cancelled) setLoading(false);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [capabilities, materialId]);

  return { options, loading };
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain manufacturing
 * @sunxu-reason Preserves multi-route BOM issue-operation bindings and unresolved legacy selections while route candidates and details are host supplied.
 */
export function BomIssueOperationSelect({
  materialId,
  options,
  loading = false,
  value,
  onChange,
}: BomIssueOperationSelectProps) {
  const selectedValues = useMemo(
    () => (value ?? []).map(createSelectionValue),
    [value],
  );
  const optionMap = useMemo(
    () => new Map(options.map((option) => [option.value, option])),
    [options],
  );
  const selectOptions = useMemo(() => {
    const resolvedSelections = new Set(options.map((option) => option.value));
    const unresolvedOptions = (value ?? [])
      .filter(
        (selection) => !resolvedSelections.has(createSelectionValue(selection)),
      )
      .map(buildUnresolvedOption);
    return [...unresolvedOptions, ...options];
  }, [options, value]);

  return (
    <Select
      allowClear
      mode="multiple"
      showSearch
      disabled={!materialId}
      loading={loading}
      value={selectedValues}
      options={selectOptions}
      optionFilterProp="searchText"
      placeholder={
        materialId ? '选择路线及该路线的投料工序' : '请先选择父项物料'
      }
      style={{ width: '100%' }}
      onChange={(nextValues: string[]) => {
        const selectedOptions = new Map(
          selectOptions.map((option) => [option.value, option]),
        );
        const nextSelections = nextValues
          .map((nextValue) => ({
            value: nextValue,
            option: optionMap.get(nextValue) ?? selectedOptions.get(nextValue),
          }))
          .filter(
            (item): item is { value: string; option: IssueOperationOption } =>
              Boolean(item.option),
          );
        const previousValueSet = new Set(selectedValues);
        const latestAddedValueByRouteMasterId = new Map<string, string>();
        for (const item of nextSelections) {
          if (!previousValueSet.has(item.value)) {
            // A route has one issue point; a newly selected operation replaces its old value.
            latestAddedValueByRouteMasterId.set(
              item.option.selection.routeMasterId,
              item.value,
            );
          }
        }
        onChange(
          nextSelections
            .filter((item) => {
              const latestAddedValue = latestAddedValueByRouteMasterId.get(
                item.option.selection.routeMasterId,
              );
              return !latestAddedValue || latestAddedValue === item.value;
            })
            .map((item) => item.option.selection),
        );
      }}
    />
  );
}

export type { BomIssueOperationSelectProps };
