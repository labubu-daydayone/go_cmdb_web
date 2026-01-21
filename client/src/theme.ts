/**
 * CMDB 后台系统 - Material UI 主题配置
 * 设计风格：白色极简主义 · 浅色系 · 紫蓝点缀
 * 参考：StrikingDash 模板
 */

import { createTheme } from '@mui/material/styles';

// 白色极简主义色彩系统
export const colors = {
  // 白色系 - 主色调
  white: {
    pure: '#FFFFFF',      // 纯白（侧边栏、卡片）
    off: '#F9FAFB',       // 极浅灰（页面背景）
    hover: '#F3F4F6',     // 浅灰（悬停背景）
  },
  
  // 灰色系 - 文字和边框
  gray: {
    900: '#1F2937',       // 深灰（主要文字）
    800: '#374151',       // 中深灰
    700: '#4B5563',       // 中灰
    600: '#6B7280',       // 中浅灰（次要文字）
    500: '#9CA3AF',       // 浅灰（辅助文字、图标）
    400: '#D1D5DB',       // 极浅灰（悬停边框）
    300: '#E5E7EB',       // 更浅灰（默认边框）
    200: '#F3F4F6',       // 背景灰
    100: '#F9FAFB',       // 极浅背景
    50: '#FAFAFA',        // 最浅背景
  },
  
  // 紫蓝色 - 点缀色（克制使用）
  primary: {
    main: '#6366F1',      // 紫蓝（主按钮、选中状态）
    dark: '#4F46E5',      // 深紫蓝（悬停）
    light: '#818CF8',     // 浅紫蓝
    pale: '#EEF2FF',      // 极浅紫蓝（选中背景）
  },
  
  // 状态色 - 克制使用
  status: {
    success: '#10B981',   // 绿色（成功）
    warning: '#F59E0B',   // 琥珀色（警告）
    error: '#EF4444',     // 红色（错误）
    info: '#3B82F6',      // 蓝色（信息）
  },
  
  // 侧边栏 - 白色风格
  sidebar: {
    background: '#FFFFFF',        // 纯白背景
    border: '#E5E7EB',            // 极浅灰边框
    text: '#6B7280',              // 中浅灰文字
    icon: '#9CA3AF',              // 浅灰图标
    hover: '#F3F4F6',             // 浅灰悬停背景
    active: '#6366F1',            // 紫蓝选中文字/边框
    activeBg: '#EEF2FF',          // 极浅紫蓝选中背景
    activeText: '#4F46E5',        // 深紫蓝选中文字（更深，对比度更好）
  },
};

// 创建 Material UI 主题
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colors.primary.main,      // #6366F1 紫蓝
      light: colors.primary.light,    // #818CF8 浅紫蓝
      dark: colors.primary.dark,      // #4F46E5 深紫蓝
      contrastText: colors.white.pure,
    },
    secondary: {
      main: colors.gray[600],         // #6B7280 中浅灰
      light: colors.gray[500],        // #9CA3AF 浅灰
      dark: colors.gray[700],         // #4B5563 中灰
      contrastText: colors.white.pure,
    },
    success: {
      main: colors.status.success,
      light: '#34D399',
      dark: '#059669',
      contrastText: colors.white.pure,
    },
    warning: {
      main: colors.status.warning,
      light: '#FBBF24',
      dark: '#D97706',
      contrastText: colors.white.pure,
    },
    error: {
      main: colors.status.error,
      light: '#F87171',
      dark: '#DC2626',
      contrastText: colors.white.pure,
    },
    info: {
      main: colors.status.info,
      light: '#60A5FA',
      dark: '#2563EB',
      contrastText: colors.white.pure,
    },
    background: {
      default: colors.white.off,      // #F9FAFB 极浅灰背景
      paper: colors.white.pure,       // #FFFFFF 纯白
    },
    text: {
      primary: colors.gray[900],      // #1F2937 深灰
      secondary: colors.gray[600],    // #6B7280 中浅灰
      disabled: colors.gray[500],     // #9CA3AF 浅灰
    },
    divider: colors.gray[300],        // #E5E7EB 极浅灰
  },
  
  // 排版系统
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"SF Pro Display"',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '1.5rem',    // 24px
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
      color: colors.gray[900],
    },
    h2: {
      fontSize: '1.25rem',   // 20px
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
      color: colors.gray[900],
    },
    h3: {
      fontSize: '1rem',      // 16px
      fontWeight: 600,
      lineHeight: 1.4,
      color: colors.gray[900],
    },
    h4: {
      fontSize: '0.875rem',  // 14px
      fontWeight: 600,
      lineHeight: 1.5,
      color: colors.gray[900],
    },
    body1: {
      fontSize: '0.875rem',  // 14px
      fontWeight: 400,
      lineHeight: 1.6,
      color: colors.gray[900],
    },
    body2: {
      fontSize: '0.75rem',   // 12px
      fontWeight: 400,
      lineHeight: 1.5,
      color: colors.gray[600],
    },
    button: {
      fontSize: '0.875rem',  // 14px
      fontWeight: 500,
      textTransform: 'none',
      letterSpacing: '0',
    },
    caption: {
      fontSize: '0.75rem',   // 12px
      fontWeight: 400,
      lineHeight: 1.4,
      color: colors.gray[500],
    },
  },
  
  // 圆角系统
  shape: {
    borderRadius: 6,
  },
  
  // 阴影系统 - 微阴影
  shadows: [
    'none',
    '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  ],
  
  // 组件样式覆盖
  components: {
    // 按钮 - 白色极简设计
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '10px 20px',
          fontSize: '0.875rem',
          fontWeight: 500,
          textTransform: 'none',
          boxShadow: 'none',
          transition: 'all 0.2s ease-out',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          backgroundColor: colors.primary.main,
          color: colors.white.pure,
          '&:hover': {
            backgroundColor: colors.primary.dark,
            boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.3)',
          },
        },
        outlined: {
          backgroundColor: colors.white.pure,
          color: colors.gray[600],
          border: `1px solid ${colors.gray[300]}`,
          '&:hover': {
            backgroundColor: colors.white.off,
            border: `1px solid ${colors.gray[400]}`,
          },
        },
        text: {
          color: colors.gray[600],
          '&:hover': {
            backgroundColor: colors.white.hover,
            color: colors.gray[900],
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
    
    // 卡片 - 微阴影
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          border: `1px solid ${colors.gray[300]}`,
          transition: 'all 0.25s ease-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            borderColor: colors.gray[400],
          },
        },
      },
    },
    
    // 输入框
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
            backgroundColor: colors.white.pure,
            transition: 'all 0.2s ease-out',
            '& fieldset': {
              borderWidth: 1,
              borderColor: colors.gray[300],
            },
            '&:hover fieldset': {
              borderColor: colors.gray[400],
            },
            '&.Mui-focused fieldset': {
              borderWidth: 2,
              borderColor: colors.primary.main,
              boxShadow: `0 0 0 3px ${colors.primary.pale}`,
            },
          },
        },
      },
    },
    
    // 表格
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: colors.white.off,
          '& .MuiTableCell-root': {
            fontWeight: 600,
            color: colors.gray[900],
            borderBottom: `1px solid ${colors.gray[300]}`,
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
              backgroundColor: colors.white.off,
            },
          },
          '& .MuiTableCell-root': {
            borderBottom: `1px solid ${colors.gray[300]}`,
          },
        },
      },
    },
    
    // Chip/徽章
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
          fontSize: '0.75rem',
        },
      },
    },
    
    // 对话框
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        },
      },
    },
    
    // 菜单
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          border: `1px solid ${colors.gray[300]}`,
        },
      },
    },
    
    // 分隔线
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: colors.gray[300],
        },
      },
    },
  },
});

export default theme;
