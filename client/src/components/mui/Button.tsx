/**
 * Material UI Button 组件封装
 * 提供与 shadcn/ui button 类似的 API
 */

import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';
import { forwardRef } from 'react';

export interface ButtonProps extends Omit<MuiButtonProps, 'variant' | 'size'> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'default', ...props }, ref) => {
    // 映射 variant
    let muiVariant: MuiButtonProps['variant'] = 'contained';
    let color: MuiButtonProps['color'] = 'primary';
    let sx = props.sx || {};

    switch (variant) {
      case 'default':
        muiVariant = 'contained';
        color = 'primary';
        break;
      case 'destructive':
        muiVariant = 'contained';
        color = 'error';
        break;
      case 'outline':
        muiVariant = 'contained';
        color = 'primary';
        sx = { 
          ...sx, 
          backgroundColor: 'rgba(99, 102, 241, 0.08)',
          color: '#6366F1 !important',
          border: 'none !important',
          boxShadow: 'none !important',
          '&:hover': {
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            border: 'none !important',
            boxShadow: 'none !important',
            color: '#6366F1 !important',
          },
        };
        break;
      case 'secondary':
        muiVariant = 'contained';
        sx = { 
          ...sx, 
          backgroundColor: '#F3F4F6',
          color: '#374151 !important',
          border: 'none !important',
          boxShadow: 'none !important',
          '&:hover': {
            backgroundColor: '#E5E7EB',
            border: 'none !important',
            boxShadow: 'none !important',
            color: '#374151 !important',
          },
        };
        break;
      case 'ghost':
        muiVariant = 'text';
        sx = { 
          ...sx, 
          color: '#6B7280 !important',
          border: 'none !important',
          boxShadow: 'none !important',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            border: 'none !important',
            boxShadow: 'none !important',
            color: '#6B7280 !important',
          },
        };
        break;
      case 'link':
        muiVariant = 'text';
        color = 'primary';
        sx = { ...sx, textDecoration: 'underline' };
        break;
    }

    // 映射 size
    let muiSize: MuiButtonProps['size'] = 'medium';
    switch (size) {
      case 'sm':
        muiSize = 'small';
        break;
      case 'lg':
        muiSize = 'large';
        break;
      case 'icon':
        muiSize = 'small';
        sx = { ...sx, minWidth: 'auto', padding: '8px' };
        break;
      default:
        muiSize = 'medium';
    }

    return (
      <MuiButton
        ref={ref}
        variant={muiVariant}
        color={color}
        size={muiSize}
        sx={sx}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };
