type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function getHeader(headers: unknown, name: string): string | undefined {
  if (!isRecord(headers)) return undefined;
  const get = headers.get;
  if (typeof get === 'function') {
    const value = get.call(headers, name);
    if (typeof value === 'string') return value;
  }
  const key = Object.keys(headers).find(
    (candidate) => candidate.toLowerCase() === name.toLowerCase(),
  );
  const value = key ? headers[key] : undefined;
  return typeof value === 'string' ? value : undefined;
}

function readResponseFileName(headers: unknown): string | undefined {
  const contentDisposition = getHeader(headers, 'content-disposition');
  if (!contentDisposition) return undefined;
  const encoded = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(contentDisposition)?.[1];
  const quoted = /filename\s*=\s*"([^"]+)"/i.exec(contentDisposition)?.[1];
  const unquoted = /filename\s*=\s*([^;]+)/i.exec(contentDisposition)?.[1];
  const raw = encoded ?? quoted ?? unquoted;
  if (!raw) return undefined;
  const trimmed = raw.trim().replace(/^"|"$/g, '');
  if (!encoded) return trimmed;
  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

function resolveDownload(value: unknown): { blob: Blob; fileName?: string } {
  if (value instanceof Blob) return { blob: value };
  if (!isRecord(value) || !(value.data instanceof Blob)) {
    throw new Error('下载响应不是有效文件');
  }
  const response = isRecord(value.response) ? value.response : undefined;
  return {
    blob: value.data,
    fileName: readResponseFileName(response?.headers),
  };
}

/** Browser download adapter for file responses; requests themselves stay host-owned. */
export function downloadBlob(value: unknown, fallbackFileName?: string): void {
  const resolved = resolveDownload(value);
  const serverName = resolved.fileName?.trim();
  const fileName = serverName && !/(?:^|_)\d{10,}\.(?:xlsx|xls|csv|pdf)$/i.test(serverName)
    ? serverName
    : fallbackFileName?.trim() || serverName;
  if (!fileName) throw new Error('下载文件名缺失');
  if (resolved.blob.size === 0) throw new Error('下载文件为空');
  const url = URL.createObjectURL(resolved.blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
