import { FileTextOutlined } from '@ant-design/icons';
import { Button, Modal } from 'antd';
import { useState, type ReactNode } from 'react';

export interface IntegrationGuideLinkProps {
  title: ReactNode;
  children: ReactNode;
  buttonLabel?: string;
  closeLabel?: string;
  width?: number;
}

/**
 * @sunxu-layer business
 * @sunxu-domain integration
 * @sunxu-reason Retains the MES integration-guide button and scrollable dialog while host-owned guide copy and topic routing are supplied as content.
 */
export function IntegrationGuideLink({
  title,
  children,
  buttonLabel = '接入说明',
  closeLabel = '关闭',
  width = 840,
}: IntegrationGuideLinkProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        icon={<FileTextOutlined />}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        {buttonLabel}
      </Button>
      <Modal
        title={title}
        open={open}
        width={width}
        onCancel={() => setOpen(false)}
        footer={
          <Button type="primary" onClick={() => setOpen(false)}>
            {closeLabel}
          </Button>
        }
        styles={{
          body: {
            maxBlockSize: 'calc(100vh - 220px)',
            overflowY: 'auto',
          },
        }}
      >
        {children}
      </Modal>
    </>
  );
}
