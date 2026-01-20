import React, { useState } from 'react';
import Popover from '@mui/material/Popover';
import { Button } from './mui';

interface PopconfirmProps {
  title: string;
  description?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  children: React.ReactElement;
}

export const Popconfirm: React.FC<PopconfirmProps> = ({
  title,
  description,
  onConfirm,
  onCancel,
  children,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    onCancel?.();
  };

  const handleConfirm = () => {
    setAnchorEl(null);
    onConfirm();
  };

  const open = Boolean(anchorEl);

  return (
    <>
      {React.cloneElement(children, { onClick: handleClick })}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <div className="p-4 max-w-xs">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="text-xs"
            >
              取消
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirm}
              className="text-xs"
            >
              确定
            </Button>
          </div>
        </div>
      </Popover>
    </>
  );
};
