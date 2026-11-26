import React from 'react';
import ReactDOM from 'react-dom/client';
import 'antd/dist/reset.css';
import '../../src';
import '../../src/business/tableStyles.css';
import { CatalogApp } from './CatalogApp';
import './catalog.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CatalogApp />
  </React.StrictMode>,
);
