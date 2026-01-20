/**
 * CMDB 后台系统 - Material UI 主题配置
 * 设计风格：极简主义 · 无彩色系统 · 黑白灰
 */

import { createTheme } from '@mui/material/styles';

// 极简主义色彩系统 - 无彩色（Achromatic）
export const colors = {
  // 黑色系 - 主要色调
  black: {
    pure: '#000000',      // 纯黑
    dark: '#18181B',      // 深灰黑（主按钮、主要文字）
    medium: '#27272A',    // 中深灰
  },
  
  // 灰色系 - 层级区分
  gray: {
    900: '#18181B',       // 最深灰（主要文字）
    800: '#27272A',       // 深灰
    700: '#3F3F46',       // 中深灰
    600: '#52525B',       // 中灰（次要文字）
    500: '#71717A',       // 中浅灰
    400: '#A1A1AA',       // 浅灰（辅助文字、图标）
    300: '#D4D4D8',       // 极浅灰（边框）
    200: '#E4E4E7',       // 更浅灰（分隔线）
    100: '#F4F4F5',       // 背景灰（次要背景）
    50: '#FAFAFA',        // 极浅背景
  },
  
  // 白色系
  white: {
    pure: '#FFFFFF',      // 纯白（卡片、主背景）
  },
  
  // 状态色 - 克制使用
  status: {
    success: '#10B981',   // 绿色（成功）
    warning: '#F59E0B',   // 琥珀色（警告）
    error: '#EF4444',     // 红色（错误）
    info: '#3B82F6',      // 蓝色（信息）
  },
  
  // 侧边栏 - 深色对比
  sidebar: {
    background: '#18181B',        // 深灰黑
    foreground: '#FAFAFA',        // 极浅灰
    icon: '#A1A1AA',              // 浅灰图标
    hover: 'rgba(255, 255, 255, 0.1)',
    active: '#FFFFFF',            // 纯白（选中状态）
    border: 'rgba(255, 255, 255, 0.1)',
  },
};

// 创建 Material UI 主题
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colors.black.dark,      // #18181B 深灰黑
      light: colors.gray[600],      // #52525B 中灰
      dark: colors.black.pure,      // #000000 纯黑
      contrastText: colors.white.pure,
    },
    secondary: {
      main: colors.gray[100],       // #F4F4F5 背景灰
      light: colors.gray[50],       // #FAFAFA 极浅背景
      dark: colors.gray[200],       // #E4E4E7 更浅灰
      contrastText: colors.black.dark,
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
      default: colors.gray[50],     // #FAFAFA 极浅背景
      paper: colors.white.pure,     // #FFFFFF 纯白
    },
    text: {
      primary: colors.gray[900],    // #18181B 深灰黑
      secondary: colors.gray[600],  // #52525B 中灰
      disabled: colors.gray[400],   // #A1A1AA 浅灰
    },
    divider: colors.gray[200],      // #E4E4E7 更浅灰
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
      fontSize: '1.75rem',   // 28px
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
      color: colors.black.dark,
    },
    h2: {
      fontSize: '1.25rem',   // 20px
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
      color: colors.black.dark,
    },
    h3: {
      fontSize: '1rem',      // 16px
      fontWeight: 600,
      lineHeight: 1.4,
      color: colors.black.dark,
    },
    h4: {
      fontSize: '0.875rem',  // 14px
      fontWeight: 600,
      lineHeight: 1.5,
      color: colors.black.dark,
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
  
  // 圆角系统 - 小圆角
  shape: {
    borderRadius: 6,
  },
  
  // 阴影系统 - 极简，几乎无阴影
  shadows: [
    'none',
    '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
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
    // 按钮 - 极简无彩色设计
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '10px 20px',
          fontSize: '0.875rem',
          fontWeight: 500,
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
          backgroundColor: colors.black.dark,
          color: `${colors.white.pure} !important`,
          border: 'none !important',
          '&:hover': {
            backgroundColor: colors.black.pure,
            border: 'none !important',
            color: `${colors.white.pure} !important`,
          },
        },
        outlined: {
          backgroundColor: colors.gray[100],
          color: `${colors.black.dark} !important`,
          border: 'none !important',
          '&:hover': {
            backgroundColor: colors.gray[200],
            border: 'none !important',
          },
        },
        text: {
          color: `${colors.gray[600]} !important`,
          border: 'none !important',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            border: 'none !important',
            color: `${colors.black.dark} !important`,
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
    
    // 卡片 - 极简边框
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          border: `1px solid ${colors.gray[100]}`,
          transition: 'all 0.25s ease-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.08)',
            borderColor: colors.gray[200],
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
            transition: 'all 0.15s ease-out',
            '& fieldset': {
              borderWidth: 2,
              borderColor: colors.gray[200],
            },
            '&:hover fieldset': {
              borderColor: colors.gray[300],
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.black.dark,
              boxShadow: `0 0 0 3px rgba(24, 24, 27, 0.1)`,
            },
          },
        },
      },
    },
    
    // 表格
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: colors.gray[50],
          '& .MuiTableCell-root': {
            fontWeight: 600,
            color: colors.black.dark,
            borderBottom: `2px solid ${colors.gray[100]}`,
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
              backgroundColor: colors.gray[50],
            },
          },
          '& .MuiTableCell-root': {
            borderBottom: `1px solid ${colors.gray[100]}`,
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
          border: 'none',
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
          borderRadius: 12,
          boxShadow: '0 20px 44px 0 rgba(0, 0, 0, 0.1)',
        },
      },
    },
    
    // 菜单
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.08)',
          border: `1px solid ${colors.gray[200]}`,
        },
      },
    },
    
    // 分隔线
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: colors.gray[200],
        },
      },
    },
  },
});

export default theme;
