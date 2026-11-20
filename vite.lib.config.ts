import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    emptyOutDir: false,
    lib: {
      entry: {
        index: 'src/index.ts',
        mes: 'src/mes/index.ts',
      },
      name: 'SunxuWeb',
      formats: ['es', 'cjs'],
      fileName: (format, entryName) =>
        `${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
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
        'dayjs',
        'react-pdf',
        'pdfjs-dist',
        'use-antd-resizable-header',
      ],
    },
  },
});
