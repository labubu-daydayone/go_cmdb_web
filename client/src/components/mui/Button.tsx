/**
 * Material UI Button 组件封装
 * 设计风格：白色极简主义 · 深灰主按钮
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
        // 主按钮：深灰黑背景 + 白色文字（专业、克制）
        muiVariant = 'contained';
        color = 'primary';
        sx = {
          ...sx,
          backgroundColor: '#1F2937', // 深灰黑
          color: '#FFFFFF !important',
          border: 'none !important',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05) !important',
          borderRadius: '6px',
          fontWeight: 500,
          '&:hover': {
            backgroundColor: '#111827', // 更深灰
            border: 'none !important',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1) !important',
            color: '#FFFFFF !important',
            transform: 'translateY(-1px)',
          },
          transition: 'all 0.2s ease',
        };
        break;
      case 'destructive':
        // 危险按钮：红色背景 + 白色文字
        muiVariant = 'contained';
        color = 'error';
        sx = {
          ...sx,
          backgroundColor: '#EF4444',
          color: '#FFFFFF !important',
          border: 'none !important',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05) !important',
          borderRadius: '6px',
          fontWeight: 500,
          '&:hover': {
            backgroundColor: '#DC2626',
            boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3) !important',
            transform: 'translateY(-1px)',
          },
          transition: 'all 0.2s ease',
        };
        break;
      case 'outline':
        // 次要按钮：白色背景 + 灰色边框 + 灰色文字
        muiVariant: 'outlined';
        sx = { 
          ...sx, 
          backgroundColor: '#FFFFFF',
          color: '#6B7280 !important',
          border: '1px solid #E5E7EB !important',
          boxShadow: 'none !important',
          borderRadius: '6px',
          fontWeight: 500,
          '&:hover': {
            backgroundColor: '#F9FAFB',
            border: '1px solid #D1D5DB !important',
            boxShadow: 'none !important',
            color: '#6B7280 !important',
          },
          transition: 'all 0.2s ease',
        };
        break;
      case 'secondary':
        // 同 outline
        muiVariant = 'outlined';
        sx = { 
          ...sx, 
          backgroundColor: '#FFFFFF',
          color: '#6B7280 !important',
          border: '1px solid #E5E7EB !important',
          boxShadow: 'none !important',
          borderRadius: '6px',
          fontWeight: 500,
          '&:hover': {
            backgroundColor: '#F9FAFB',
            border: '1px solid #D1D5DB !important',
            boxShadow: 'none !important',
            color: '#6B7280 !important',
          },
          transition: 'all 0.2s ease',
        };
        break;
      case 'ghost':
        // 文字按钮：透明背景 + 中灰文字
        muiVariant = 'text';
        sx = { 
          ...sx, 
          color: '#6B7280 !important',
          border: 'none !important',
          boxShadow: 'none !important',
          borderRadius: '6px',
          fontWeight: 500,
          '&:hover': {
            backgroundColor: '#F3F4F6',
            border: 'none !important',
            boxShadow: 'none !important',
            color: '#1F2937 !important',
          },
          transition: 'all 0.2s ease',
        };
        break;
      case 'link':
        // 链接按钮：透明背景 + 深灰文字 + 下划线
        muiVariant = 'text';
        sx = { 
          ...sx, 
          color: '#6B7280 !important',
          textDecoration: 'underline',
          border: 'none !important',
          boxShadow: 'none !important',
          fontWeight: 500,
          '&:hover': {
            backgroundColor: 'transparent',
            color: '#1F2937 !important',
          },
          transition: 'all 0.2s ease',
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
