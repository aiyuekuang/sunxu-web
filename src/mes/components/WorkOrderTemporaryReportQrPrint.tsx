import type {
  WorkOrderTemporaryQrPrintCapabilities,
  WorkOrderTemporaryQrPrintItem,
  WorkOrderTemporaryQrOperation,
  WorkOrderTemporaryQrResult,
} from './work-order-temporary-report-qr-types';

const PRINT_PAGE_SIZE = 6;

/** @sunxu-component mes-specific @sunxu-domain manufacturing @sunxu-reason Preserves temporary work-order reporting QR eligibility, token URL fallback, six-label A4 pagination, expiry text and print-window behavior while the host supplies origin and QR rendering. */
export function canPrintTemporaryReportQr(
  operation: WorkOrderTemporaryQrOperation,
  workOrderStatus: string,
): boolean {
  return (
    !operation.isOutsourced &&
    ['quantity', 'quantity_time'].includes(
      operation.operationOutputMode ?? 'quantity',
    ) &&
    ['released', 'in_progress', 'paused'].includes(workOrderStatus)
  );
}

export function buildTemporaryReportPortalUrl(
  qr: WorkOrderTemporaryQrResult,
  origin: string,
): string {
  return (
    qr.portalUrl ||
    `${origin.replace(/\/+$/, '')}/temporary-report#token=${encodeURIComponent(qr.token)}`
  );
}

function escapePrintHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      })[character] ?? character,
  );
}

function formatExpiresAt(value: string | Date): string {
  const expiresAt = new Date(value);
  if (Number.isNaN(expiresAt.getTime())) return '—';
  return expiresAt.toLocaleString('zh-CN', { hour12: false });
}

function chunkItems<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

export function buildTemporaryReportQrPrintHtml(
  orderNo: string,
  items: WorkOrderTemporaryQrPrintItem[],
  capabilities: Pick<WorkOrderTemporaryQrPrintCapabilities, 'origin' | 'renderQrSvg' | 'formatExpiresAt'>,
): string {
  const safeOrderNo = escapePrintHtml(orderNo || '未编号工单');
  const addressWarning = items.some(({ qr }) => !qr.portalUrl)
    ? '<p class="address-warning">注意：未配置手机端公网地址，使用前请确认当前系统地址可被手机访问。</p>'
    : '';
  const pages = chunkItems(items, PRINT_PAGE_SIZE)
    .map((pageItems, pageIndex, allPages) => {
      const cards = pageItems
        .map(({ operation, qr }) => {
          const url = buildTemporaryReportPortalUrl(qr, capabilities.origin);
          const qrMarkup = capabilities.renderQrSvg(url, { size: 176, level: 'M' });
          const sequence = operation.sequence ?? '—';
          const operationName = escapePrintHtml(
            operation.operationName || '未命名工序',
          );
          const stage = operation.stageName
            ? `<div class="stage">${escapePrintHtml(operation.stageName)}</div>`
            : '';
          const expiry = capabilities.formatExpiresAt?.(qr.expiresAt) ?? formatExpiresAt(qr.expiresAt);
          return `<article class="qr-card">
            <div class="operation-title">${escapePrintHtml(String(sequence))} · ${operationName}</div>
            ${stage}
            <div class="qr-code">${qrMarkup}</div>
            <div class="hint">微信或浏览器扫码报工</div>
            <div class="expires">有效期至：${escapePrintHtml(expiry)}</div>
          </article>`;
        })
        .join('');
      const lastPageClass =
        pageIndex === allPages.length - 1 ? ' print-page-last' : '';
      return `<section class="print-page${lastPageClass}">
        <header>
          <div><h1>工单 ${safeOrderNo} · 临时报工码</h1>${addressWarning}</div>
          <span>第 ${pageIndex + 1} / ${allPages.length} 页</span>
        </header>
        <main>${cards}</main>
      </section>`;
    })
    .join('');

  return `<!doctype html>
  <html lang="zh-CN">
    <head>
      <meta charset="utf-8" />
      <title>工单 ${safeOrderNo} 临时报工码</title>
      <style>
        @page { size: A4 portrait; margin: 10mm; }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; color: #111827; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; }
        .print-page { break-after: page; page-break-after: always; }
        .print-page-last { break-after: auto; page-break-after: auto; }
        header { min-height: 14mm; display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 1px solid #d1d5db; }
        h1 { margin: 0; font-size: 16px; line-height: 1.4; }
        header span { color: #6b7280; font-size: 11px; }
        .address-warning { margin: 1mm 0 2mm; color: #b45309; font-size: 10px; font-weight: 600; }
        main { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); grid-auto-rows: 79mm; gap: 4mm 6mm; padding-top: 4mm; }
        .qr-card { break-inside: avoid; page-break-inside: avoid; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; border: 1px solid #9ca3af; border-radius: 3mm; padding: 3mm; text-align: center; }
        .operation-title { max-width: 100%; overflow: hidden; font-size: 15px; font-weight: 700; line-height: 1.35; white-space: nowrap; text-overflow: ellipsis; }
        .stage { margin-top: 1mm; color: #4b5563; font-size: 11px; }
        .qr-code { display: flex; margin-top: 2mm; }
        .qr-code svg { width: 42mm; height: 42mm; }
        .hint { margin-top: 1.5mm; font-size: 11px; font-weight: 600; }
        .expires { margin-top: 1mm; color: #6b7280; font-size: 9px; }
        @media screen {
          body { background: #e5e7eb; padding: 12px; }
          .print-page { width: 210mm; min-height: 297mm; margin: 0 auto 12px; padding: 10mm; background: white; box-shadow: 0 2px 12px rgba(0, 0, 0, .12); }
        }
        @media print { .print-page { min-height: 0; } }
      </style>
    </head>
    <body>
      ${pages}
      <script>
        window.addEventListener('load', function () {
          window.setTimeout(function () { window.focus(); window.print(); }, 250);
        });
      </script>
    </body>
  </html>`;
}

export function openTemporaryReportQrPrintWindow(
  capabilities: Pick<WorkOrderTemporaryQrPrintCapabilities, 'openWindow'>,
): Window | null {
  const printWindow = capabilities.openWindow();
  if (!printWindow) return null;
  printWindow.document.open();
  printWindow.document.write(
    '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>正在准备临时报工码</title></head><body style="font-family:sans-serif;padding:32px">正在准备临时报工码，请稍候…</body></html>',
  );
  printWindow.document.close();
  return printWindow;
}

export function renderTemporaryReportQrPrintWindow(
  printWindow: Window,
  orderNo: string,
  items: WorkOrderTemporaryQrPrintItem[],
  capabilities: Pick<WorkOrderTemporaryQrPrintCapabilities, 'origin' | 'renderQrSvg' | 'formatExpiresAt'>,
): void {
  printWindow.document.open();
  printWindow.document.write(
    buildTemporaryReportQrPrintHtml(orderNo, items, capabilities),
  );
  printWindow.document.close();
}
