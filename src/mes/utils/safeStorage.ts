/**
 * localStorage 容错写入工具。
 *
 * 背景：表格列宽/排序/列显隐、筛选记忆等 UI 状态会持久化到 localStorage。这些 key
 * 以页面 pathname 为一部分，详情页带 UUID 会不断产生新 key 且无淘汰逻辑，长期使用后
 * 可能把 localStorage 撑到配额上限。一旦 setItem 抛 QuotaExceededError 而调用点没有
 * try/catch，异常会在渲染/请求路径中冒泡，导致列表被清空显示“暂无数据”。
 *
 * 这些 UI 缓存都是可重建的派生状态，写失败时应当降级为“本次不持久化”，绝不能打断渲染。
 * 因此这里提供统一的容错读写：读失败时回退到调用方默认值，写失败时先清理可重建的
 * 表格 UI 缓存腾出空间重试一次，仍失败则降级为本次不持久化。这不是“兜底掩盖业务错误”，
 * 而是对纯 UI 缓存的合理容量恢复。业务数据、登录态等不应使用本工具。
 */

/** 所有可重建的表格 UI 缓存 key 前缀（列宽 / 排序 / 列显隐，含新旧两套命名）。 */
const TABLE_CACHE_KEY_PREFIXES = [
  'mes-admin:table-width:',
  'mes-admin:table-sort:',
  'mes_table_width_',
  'mes_table_sort_',
  'mes_table_cols_',
] as const;
const TABLE_CACHE_CAPACITY_PROBE_KEY = '__mes_table_cache_capacity_probe__';
// 以一个足以覆盖常见列状态写入的探针提前发现存储空间不足。表格缓存可重建，
// 配额不足时应当在用户调整列宽/列展示前腾出空间，而不是等第三方组件写入失败。
const TABLE_CACHE_CAPACITY_PROBE_VALUE = '0'.repeat(16 * 1024);
let tableCacheCapacityAvailable: boolean | undefined;

/** localStorage 可能因 SSR、隐私模式或浏览器策略而不可访问。 */
function getLocalStorage(): Storage | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function isTableCacheKey(key: string): boolean {
  return TABLE_CACHE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function isQuotaExceededError(error: unknown): boolean {
  if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
    // 不同浏览器 code/name 不一致，逐项识别。
    return (
      error.code === 22 ||
      error.code === 1014 ||
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    );
  }
  return false;
}

/** 清理所有可重建的表格 UI 缓存 key，返回清理条数。 */
export function evictTableCacheKeys(exceptKey?: string): number {
  const storage = getLocalStorage();
  if (!storage) return 0;

  let storageLength: number;
  try {
    storageLength = storage.length;
  } catch {
    return 0;
  }

  const toRemove: string[] = [];
  for (let i = 0; i < storageLength; i += 1) {
    let key: string | null;
    try {
      key = storage.key(i);
    } catch {
      continue;
    }
    if (key && key !== exceptKey && isTableCacheKey(key)) {
      toRemove.push(key);
    }
  }
  toRemove.forEach((key) => {
    try {
      storage.removeItem(key);
    } catch {
      // 忽略单条清理失败，继续清理其余 key。
    }
  });
  return toRemove.length;
}

/** 读取可重建的 UI 偏好；不可访问或读取失败时返回 null，让调用方使用默认值。 */
export function safeLocalStorageGetItem(key: string): string | null {
  const storage = getLocalStorage();
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * 容错写入 localStorage。写失败时（尤其配额超限）先清理表格 UI 缓存重试一次，
 * 仍失败则静默降级（返回 false），不抛出，绝不打断调用方的渲染/请求路径。
 */
export function safeLocalStorageSetItem(key: string, value: string): boolean {
  const storage = getLocalStorage();
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch (error: unknown) {
    if (!isQuotaExceededError(error)) {
      console.warn('localStorage 写入失败，已跳过持久化', error);
      return false;
    }
    // 配额超限：清理可重建的表格 UI 缓存后重试一次。
    evictTableCacheKeys(key);
    try {
      storage.setItem(key, value);
      return true;
    } catch (retryError: unknown) {
      console.warn(
        'localStorage 配额不足，清理缓存后仍写入失败，已跳过持久化',
        retryError,
      );
      return false;
    }
  }
}

/**
 * 在表格组件挂载时预检 localStorage 容量。
 *
 * `use-antd-resizable-header` 和 ProTable 的列状态持久化直接使用
 * localStorage；它们在配额耗尽时只会吞掉写入失败，用户随后看到的就是
 * “拖了列宽/改了列展示，重新打开又还原”。这里复用统一的缓存淘汰策略，
 * 让后续第三方写入仍有可用空间。
 */
export function ensureTableCacheCapacity(): boolean {
  if (typeof window === 'undefined') return false;
  if (tableCacheCapacityAvailable !== undefined) {
    return tableCacheCapacityAvailable;
  }

  const wrote = safeLocalStorageSetItem(
    TABLE_CACHE_CAPACITY_PROBE_KEY,
    TABLE_CACHE_CAPACITY_PROBE_VALUE,
  );
  if (!wrote) {
    tableCacheCapacityAvailable = false;
    return false;
  }

  const storage = getLocalStorage();
  try {
    storage?.removeItem(TABLE_CACHE_CAPACITY_PROBE_KEY);
  } catch {
    // 探针残留不影响业务；下次预检会覆盖同一 key。
  }
  tableCacheCapacityAvailable = true;
  return true;
}
