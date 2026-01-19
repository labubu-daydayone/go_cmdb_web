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
        muiVariant = 'outlined';
        color = 'primary';
        break;
      case 'secondary':
        muiVariant = 'contained';
        color = 'secondary';
        break;
      case 'ghost':
        muiVariant = 'text';
        color = 'inherit';
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
