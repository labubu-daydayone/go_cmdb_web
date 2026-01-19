/**
 * Material UI Card 组件封装
 * 提供与 shadcn/ui card 类似的 API
 */

import {
  Card as MuiCard,
  CardProps as MuiCardProps,
  CardContent,
  CardHeader as MuiCardHeader,
  CardActions,
} from '@mui/material';
import { forwardRef, ReactNode } from 'react';

export interface CardProps extends MuiCardProps {
  children?: ReactNode;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, ...props }, ref) => {
    return (
      <MuiCard ref={ref} {...props}>
        {children}
      </MuiCard>
    );
  }
);

Card.displayName = 'Card';

export interface CardHeaderProps {
  children?: ReactNode;
  title?: ReactNode;
  subheader?: ReactNode;
  action?: ReactNode;
  className?: string;
}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, title, subheader, action, className, ...props }, ref) => {
    if (children) {
      return <div ref={ref} className={className} {...props}>{children}</div>;
    }
    return (
      <MuiCardHeader
        ref={ref}
        title={title}
        subheader={subheader}
        action={action}
        className={className}
        {...props}
      />
    );
  }
);

CardHeader.displayName = 'CardHeader';

export interface CardContentProps {
  children?: ReactNode;
  className?: string;
}

const CardBody = forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <CardContent ref={ref} className={className} {...props}>
        {children}
      </CardContent>
    );
  }
);

CardBody.displayName = 'CardBody';

export interface CardFooterProps {
  children?: ReactNode;
  className?: string;
}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <CardActions ref={ref} className={className} {...props}>
        {children}
      </CardActions>
    );
  }
);

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardBody, CardFooter, CardContent };
