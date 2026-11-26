/**
 * 打印 Hook — 封装 react-to-print 调用。
 *
 * @example
 * const { contentRef, handlePrint } = usePrint('工单');
 * <PrintLayout ref={contentRef} ...>...</PrintLayout>
 * <Button onClick={handlePrint}>打印</Button>
 */
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

/**
 * @sunxu-layer business
 * @sunxu-domain print
 * @sunxu-reason Preserves A4 print ref, document title, page margins, and react-to-print lifecycle.
 */

export function usePrint(docTitle?: string) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: docTitle,
    pageStyle: `
      @page {
        size: A4;
        margin: 10mm;
      }
    `,
  });

  return { contentRef, handlePrint };
}
