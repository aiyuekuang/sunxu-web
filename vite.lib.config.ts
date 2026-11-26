import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    emptyOutDir: true,
    lib: {
      entry: {
        index: 'src/index.ts',
        business: 'src/business/index.ts',
        businessAccounting: 'src/business/domains/accounting/index.ts',
        businessApplication: 'src/business/domains/application/index.ts',
        businessDocuments: 'src/business/domains/documents/index.ts',
        businessInventory: 'src/business/domains/inventory/index.ts',
        businessManufacturing: 'src/business/domains/manufacturing/index.ts',
        businessPrinting: 'src/business/domains/printing/index.ts',
        businessProcurement: 'src/business/domains/procurement/index.ts',
        businessQuality: 'src/business/domains/quality/index.ts',
        businessSales: 'src/business/domains/sales/index.ts',
        businessShared: 'src/business/domains/shared/index.ts',
      },
      name: 'SunxuWeb',
      formats: ['es', 'cjs'],
      fileName: (format, entryName) =>
        `${entryName.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}.${format === 'es' ? 'js' : 'cjs'}`,
      cssFileName: 'sunxu-web',
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'antd',
        '@ant-design/pro-components',
        '@ant-design/icons',
        '@dnd-kit/core',
        '@dnd-kit/sortable',
        '@dnd-kit/utilities',
        'dayjs',
        'react-pdf',
        'pdfjs-dist',
        'use-antd-resizable-header',
        'react-to-print',
        /^three(?:\/.*)?$/,
      ],
    },
  },
});
