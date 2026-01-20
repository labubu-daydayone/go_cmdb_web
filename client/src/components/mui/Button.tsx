/**
 * Material UI Button 组件封装
 * 设计风格：极简主义 · 无彩色系统 · 黑白灰
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
        // 主按钮：深灰黑背景 + 白色文字
        muiVariant = 'contained';
        color = 'primary';
        sx = {
          ...sx,
          backgroundColor: '#18181B',
          color: '#FFFFFF !important',
          border: 'none !important',
          boxShadow: 'none !important',
          '&:hover': {
            backgroundColor: '#000000',
            border: 'none !important',
            boxShadow: 'none !important',
            color: '#FFFFFF !important',
          },
        };
        break;
      case 'destructive':
        // 危险按钮：红色背景 + 白色文字
        muiVariant = 'contained';
        color = 'error';
        sx = {
          ...sx,
          border: 'none !important',
          boxShadow: 'none !important',
        };
        break;
      case 'outline':
        // 次要按钮：浅灰背景 + 深灰文字
        muiVariant = 'contained';
        sx = { 
          ...sx, 
          backgroundColor: '#F4F4F5',
          color: '#18181B !important',
          border: 'none !important',
          boxShadow: 'none !important',
          '&:hover': {
            backgroundColor: '#E4E4E7',
            border: 'none !important',
            boxShadow: 'none !important',
            color: '#18181B !important',
          },
        };
        break;
      case 'secondary':
        // 同 outline
        muiVariant = 'contained';
        sx = { 
          ...sx, 
          backgroundColor: '#F4F4F5',
          color: '#18181B !important',
          border: 'none !important',
          boxShadow: 'none !important',
          '&:hover': {
            backgroundColor: '#E4E4E7',
            border: 'none !important',
            boxShadow: 'none !important',
            color: '#18181B !important',
          },
        };
        break;
      case 'ghost':
        // 文字按钮：透明背景 + 中灰文字
        muiVariant = 'text';
        sx = { 
          ...sx, 
          color: '#52525B !important',
          border: 'none !important',
          boxShadow: 'none !important',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            border: 'none !important',
            boxShadow: 'none !important',
            color: '#18181B !important',
          },
        };
        break;
      case 'link':
        // 链接按钮：透明背景 + 深灰文字 + 下划线
        muiVariant = 'text';
        sx = { 
          ...sx, 
          color: '#18181B !important',
          textDecoration: 'underline',
          border: 'none !important',
          boxShadow: 'none !important',
          '&:hover': {
            backgroundColor: 'transparent',
            color: '#000000 !important',
          },
        };
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
