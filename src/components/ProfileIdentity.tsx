import type { ReactNode } from 'react';
import { Avatar, Button, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';

export type ProfileIdentityProps = {
  displayName: string;
  avatarUrl?: string;
  metadata?: ReactNode;
  onAvatarPress?: () => void;
  avatarActionLabel?: string;
  avatarLoading?: boolean;
  className?: string;
};

export function ProfileIdentity({
  displayName,
  avatarUrl,
  metadata,
  onAvatarPress,
  avatarActionLabel = '更换头像',
  avatarLoading = false,
  className,
}: ProfileIdentityProps) {
  const avatar = (
    <Avatar size={44} src={avatarUrl} icon={<UserOutlined aria-hidden="true" />} alt={displayName} />
  );

  return (
    <div className={['sxw-profile-identity', className].filter(Boolean).join(' ')}>
      {onAvatarPress ? (
        <Button
          className="sxw-profile-identity__avatar-action"
          type="text"
          shape="circle"
          aria-label={avatarActionLabel}
          loading={avatarLoading}
          disabled={avatarLoading}
          onClick={onAvatarPress}
        >
          {avatar}
        </Button>
      ) : (
        avatar
      )}
      <div className="sxw-profile-identity__copy">
        <Typography.Text strong className="sxw-profile-identity__name">
          {displayName}
        </Typography.Text>
        {metadata ? <div className="sxw-profile-identity__metadata">{metadata}</div> : null}
      </div>
    </div>
  );
}
