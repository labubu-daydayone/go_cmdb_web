/**
 * CMDB 后台系统 - Material UI 主题配置
 * 设计风格：扁平化 · 时尚 · 简洁 · 现代
 */

import { createTheme } from '@mui/material/styles';

// 色彩系统
export const colors = {
  // 主色调 - 现代紫蓝渐变
  primary: {
    main: '#6366F1',      // Indigo 500
    light: '#818CF8',     // Indigo 400
    dark: '#4F46E5',      // Indigo 600
    gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
  },
  
  // 辅助色
  success: {
    main: '#10B981',      // Emerald 500
    light: '#34D399',
    dark: '#059669',
  },
  warning: {
    main: '#F59E0B',      // Amber 500
    light: '#FBBF24',
    dark: '#D97706',
  },
  error: {
    main: '#EF4444',      // Red 500
    light: '#F87171',
    dark: '#DC2626',
  },
  info: {
    main: '#3B82F6',      // Blue 500
    light: '#60A5FA',
    dark: '#2563EB',
  },
  
  // 中性色 - 极简灰度
  background: {
    default: '#FAFAFA',   // 极浅灰，几乎白色
    paper: '#FFFFFF',     // 纯白
    surface: '#F9FAFB',   // 表格头部等
  },
  border: {
    light: '#F3F4F6',     // 极浅边框
    main: '#E5E7EB',      // 浅灰边框
    dark: '#D1D5DB',      // 中灰边框
  },
  text: {
    primary: '#111827',   // 深灰黑
    secondary: '#6B7280', // 中灰
    disabled: '#9CA3AF',  // 浅灰
  },
  
  // 侧边栏 - 深色模式
  sidebar: {
    background: '#1F2937', // Gray 800 - 深灰色
    foreground: '#F9FAFB',       // Gray 50
    accent: '#6366F1',     // Indigo 500
    hover: 'rgba(99, 102, 241, 0.1)',
    border: 'rgba(255, 255, 255, 0.1)',
  },
};

// 创建 Material UI 主题
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colors.primary.main,
      light: colors.primary.light,
      dark: colors.primary.dark,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#8B5CF6',      // Purple 500
      light: '#A78BFA',
      dark: '#7C3AED',
      contrastText: '#FFFFFF',
    },
    success: {
      main: colors.success.main,
      light: colors.success.light,
      dark: colors.success.dark,
      contrastText: '#FFFFFF',
    },
    warning: {
      main: colors.warning.main,
      light: colors.warning.light,
      dark: colors.warning.dark,
      contrastText: '#FFFFFF',
    },
    error: {
      main: colors.error.main,
      light: colors.error.light,
      dark: colors.error.dark,
      contrastText: '#FFFFFF',
    },
    info: {
      main: colors.info.main,
      light: colors.info.light,
      dark: colors.info.dark,
      contrastText: '#FFFFFF',
    },
    background: {
      default: colors.background.default,
      paper: colors.background.paper,
    },
    text: {
      primary: colors.text.primary,
      secondary: colors.text.secondary,
      disabled: colors.text.disabled,
    },
    divider: colors.border.main,
  },
  
  // 排版系统
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2rem',      // 32px
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '1.5rem',    // 24px
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.25rem',   // 20px
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.125rem',  // 18px
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h5: {
      fontSize: '1rem',      // 16px
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '0.875rem',  // 14px
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '0.875rem',  // 14px
      fontWeight: 400,
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.75rem',   // 12px
      fontWeight: 400,
      lineHeight: 1.5,
    },
    button: {
      fontSize: '0.875rem',  // 14px
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.01em',
    },
    caption: {
      fontSize: '0.75rem',   // 12px
      fontWeight: 400,
      lineHeight: 1.4,
    },
  },
  
  // 圆角系统
  shape: {
    borderRadius: 8,         // 默认圆角
  },
  
  // 阴影系统 - 扁平化，极浅阴影
  shadows: [
    'none',
    '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
    '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
    '0 2px 4px 0 rgba(0, 0, 0, 0.05)',
    '0 2px 6px 0 rgba(0, 0, 0, 0.05)',
    '0 4px 8px 0 rgba(0, 0, 0, 0.05)',
    '0 4px 12px 0 rgba(0, 0, 0, 0.05)',
    '0 6px 16px 0 rgba(0, 0, 0, 0.05)',
    '0 8px 20px 0 rgba(0, 0, 0, 0.05)',
    '0 10px 24px 0 rgba(0, 0, 0, 0.05)',
    '0 12px 28px 0 rgba(0, 0, 0, 0.05)',
    '0 14px 32px 0 rgba(0, 0, 0, 0.05)',
    '0 16px 36px 0 rgba(0, 0, 0, 0.05)',
    '0 18px 40px 0 rgba(0, 0, 0, 0.05)',
    '0 20px 44px 0 rgba(0, 0, 0, 0.05)',
    '0 22px 48px 0 rgba(0, 0, 0, 0.05)',
    '0 24px 52px 0 rgba(0, 0, 0, 0.05)',
    '0 26px 56px 0 rgba(0, 0, 0, 0.05)',
    '0 28px 60px 0 rgba(0, 0, 0, 0.05)',
    '0 30px 64px 0 rgba(0, 0, 0, 0.05)',
    '0 32px 68px 0 rgba(0, 0, 0, 0.05)',
    '0 34px 72px 0 rgba(0, 0, 0, 0.05)',
    '0 36px 76px 0 rgba(0, 0, 0, 0.05)',
    '0 38px 80px 0 rgba(0, 0, 0, 0.05)',
    '0 40px 84px 0 rgba(0, 0, 0, 0.05)',
  ],
  
  // 组件样式覆盖
  components: {
    // 按钮 - 无边框扁平设计
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 20px',
          fontSize: '0.875rem',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 'none !important',
          border: 'none !important',
          outline: 'none !important',
          transition: 'all 0.15s ease-out',
          '&:hover': {
            boxShadow: 'none !important',
            border: 'none !important',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
          '&:focus': {
            outline: 'none !important',
            boxShadow: 'none !important',
          },
        },
        contained: {
          background: colors.primary.gradient,
          color: '#FFFFFF !important',
          border: 'none !important',
          '&:hover': {
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            border: 'none !important',
            color: '#FFFFFF !important',
          },
        },
        outlined: {
          backgroundColor: 'rgba(99, 102, 241, 0.08)',
          color: `${colors.primary.main} !important`,
          border: 'none !important',
          '&:hover': {
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            border: 'none !important',
          },
        },
        text: {
          border: 'none !important',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            border: 'none !important',
          },
        },
        sizeSmall: {
          padding: '6px 16px',
          fontSize: '0.8125rem',
        },
        sizeLarge: {
          padding: '12px 24px',
          fontSize: '0.9375rem',
        },
      },
    },
    
    // 卡片
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: 'none',
          border: 'none',
          transition: 'all 0.25s ease-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.08)',
          },
        },
      },
    },
    
    // 输入框
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: colors.background.paper,
            transition: 'all 0.15s ease-out',
            '& fieldset': {
              borderWidth: 2,
              borderColor: colors.border.main,
            },
            '&:hover fieldset': {
              borderColor: colors.border.dark,
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.primary.main,
              boxShadow: `0 0 0 3px rgba(99, 102, 241, 0.1)`,
            },
          },
        },
      },
    },
    
    // 表格
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: colors.background.surface,
          '& .MuiTableCell-root': {
            fontWeight: 600,
            color: colors.text.primary,
            borderBottom: `2px solid ${colors.border.light}`,
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root': {
            transition: 'background-color 0.15s ease-out',
            '&:hover': {
              backgroundColor: colors.background.surface,
            },
          },
          '& .MuiTableCell-root': {
            borderBottom: `1px solid ${colors.border.light}`,
          },
        },
      },
    },
    
    // Chip/徽章
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 600,
          fontSize: '0.75rem',
        },
        filled: {
          border: 'none',
        },
      },
    },
    
    // 对话框
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 20px 44px 0 rgba(0, 0, 0, 0.1)',
        },
      },
    },
    
    // 菜单
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.08)',
          border: `1px solid ${colors.border.main}`,
        },
      },
    },
    
    // 分隔线
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: colors.border.light,
        },
      },
    },
  },
});

export default theme;
