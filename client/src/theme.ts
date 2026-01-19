/**
 * Material UI 主题配置
 * 匹配 CMDB 系统的设计风格：深蓝侧边栏 + 浅色主题
 */

import { createTheme } from '@mui/material/styles';

// 定义颜色常量
const colors = {
  // 主色调 - 深蓝色
  primary: {
    main: '#1e40af', // blue-800
    light: '#3b82f6', // blue-500
    dark: '#1e3a8a', // blue-900
    contrastText: '#ffffff',
  },
  // 辅助色 - 中性灰
  secondary: {
    main: '#64748b', // slate-500
    light: '#94a3b8', // slate-400
    dark: '#475569', // slate-600
    contrastText: '#ffffff',
  },
  // 侧边栏颜色
  sidebar: {
    background: '#1e293b', // slate-800
    foreground: '#e2e8f0', // slate-200
    accent: '#3b82f6', // blue-500
    border: '#334155', // slate-700
  },
  // 状态颜色
  success: {
    main: '#10b981', // green-500
    light: '#34d399', // green-400
    dark: '#059669', // green-600
  },
  warning: {
    main: '#f59e0b', // amber-500
    light: '#fbbf24', // amber-400
    dark: '#d97706', // amber-600
  },
  error: {
    main: '#ef4444', // red-500
    light: '#f87171', // red-400
    dark: '#dc2626', // red-600
  },
  info: {
    main: '#3b82f6', // blue-500
    light: '#60a5fa', // blue-400
    dark: '#2563eb', // blue-600
  },
};

// 创建主题
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: colors.primary,
    secondary: colors.secondary,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,
    background: {
      default: '#f8fafc', // slate-50
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a', // slate-900
      secondary: '#64748b', // slate-500
    },
    divider: '#e2e8f0', // slate-200
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    h1: {
      fontSize: '2.25rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '1.875rem',
      fontWeight: 700,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #e2e8f0',
        },
        head: {
          fontWeight: 600,
          backgroundColor: '#f8fafc',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&:hover fieldset': {
              borderColor: colors.primary.main,
            },
          },
        },
      },
    },
  },
});

export default theme;
export { colors };
