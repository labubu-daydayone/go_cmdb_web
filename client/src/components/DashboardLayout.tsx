/**
 * CMDB 后台布局组件 - Material UI 版本
 * 包含侧边栏导航和顶部导航栏
 * 设计风格：现代企业风 - 深蓝侧边栏 + 浅色顶部导航
 */

import { ReactNode, useState } from 'react';
import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
// 菜单图标
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import ComputerOutlinedIcon from '@mui/icons-material/ComputerOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import SettingsEthernetOutlinedIcon from '@mui/icons-material/SettingsEthernetOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import { Button } from '@/components/mui';
import { useMenu } from '@/contexts/MenuContext';
import { colors } from '@/theme';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface DashboardLayoutProps {
  children: ReactNode;
  breadcrumbs?: Breadcrumb[];
  currentPage?: string;
}

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  { label: '仪表板', href: '/', icon: <DashboardOutlinedIcon fontSize="small" /> },
  {
    label: '域名管理',
    icon: <LanguageOutlinedIcon fontSize="small" />,
    children: [
      { label: '域名列表', href: '/domains', icon: <ListAltOutlinedIcon fontSize="small" /> },
      { label: '证书管理', href: '/certificates', icon: <SecurityOutlinedIcon fontSize="small" /> },
    ],
  },
  {
    label: '网站管理',
    icon: <PublicOutlinedIcon fontSize="small" />,
    children: [
      { label: '网站列表', href: '/websites', icon: <ListAltOutlinedIcon fontSize="small" /> },
      { label: '回源分组', href: '/origin-groups', icon: <LinkOutlinedIcon fontSize="small" /> },
      { label: '线路分组', href: '/line-groups', icon: <AccountTreeOutlinedIcon fontSize="small" /> },
      { label: '节点列表', href: '/nodes', icon: <ComputerOutlinedIcon fontSize="small" /> },
      { label: '节点分组', href: '/node-groups', icon: <FolderOutlinedIcon fontSize="small" /> },
      { label: '缓存设置', href: '/cache-settings', icon: <SaveOutlinedIcon fontSize="small" /> },
      { label: 'DNS 配置', href: '/dns-config', icon: <SettingsEthernetOutlinedIcon fontSize="small" /> },
    ],
  },
  { label: '服务器', href: '/servers', icon: <StorageOutlinedIcon fontSize="small" /> },
  {
    label: '设置',
    icon: <SettingsOutlinedIcon fontSize="small" />,
    children: [
      { label: '密钥管理', href: '/api-keys', icon: <VpnKeyOutlinedIcon fontSize="small" /> },
    ],
  },
];

export default function DashboardLayout({
  children,
  breadcrumbs = [],
  currentPage = '仪表板',
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { expandedMenu, setExpandedMenu } = useMenu();
  const location = useLocation();

  // 仅在初始加载时自动展开包含当前路由的父菜单，之后菜单状态由用户控制
  React.useEffect(() => {
    if (expandedMenu === null) {
      for (const item of navigationItems) {
        if (item.children) {
          const hasActiveChild = item.children.some(child => child.href === location);
          if (hasActiveChild) {
            setExpandedMenu(item.label);
            return;
          }
        }
      }
    }
  }, []);

  return (
    <div className="flex h-screen bg-background">
      {/* 侧边栏 */}
      <aside
        style={{
          width: sidebarOpen ? '240px' : '80px',
          backgroundColor: colors.sidebar.background,
          color: colors.sidebar.text,
          transition: 'width 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          borderRight: `1px solid ${colors.sidebar.border}`,
        }}
      >
        {/* Logo 区域 */}
        <div
          style={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            borderBottom: `1px solid ${colors.sidebar.border}`,
          }}
        >
          {sidebarOpen && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: colors.sidebar.active,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '14px',
                }}
              >
                CM
              </div>
              <span style={{ fontWeight: 'bold', fontSize: '18px' }}>CMDB</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              padding: '4px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: colors.sidebar.text,
              borderRadius: '8px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.sidebar.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {sidebarOpen ? <CloseIcon fontSize="small" /> : <MenuIcon fontSize="small" />}
          </button>
        </div>

        {/* 导航菜单 */}
        <nav
          style={{
            flex: 1,
            padding: '16px 12px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href;
            const isExpanded = expandedMenu === item.label;
            const hasChildren = item.children && item.children.length > 0;

            if (hasChildren) {
              return (
                <div key={item.label}>
                  <button
                    onClick={() => setExpandedMenu(isExpanded ? null : item.label)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: isExpanded ? colors.sidebar.hover : 'transparent',
                      color: colors.sidebar.text,
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isExpanded) {
                        e.currentTarget.style.backgroundColor = colors.sidebar.hover;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isExpanded) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {item.icon}
                    {sidebarOpen && (
                      <>
                        <span style={{ fontSize: '14px', fontWeight: 500, flex: 1, textAlign: 'left' }}>
                          {item.label}
                        </span>
                        <ExpandMoreIcon
                          fontSize="small"
                          style={{
                            transition: 'transform 0.2s',
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          }}
                        />
                      </>
                    )}
                  </button>
                  {isExpanded && sidebarOpen && (
                    <div style={{ marginLeft: '16px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {item.children!.map((child) => {
                        const isChildActive = location.pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            to={child.href!}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              fontSize: '14px',
                              textDecoration: 'none',
                              backgroundColor: isChildActive ? colors.sidebar.activeBg : 'transparent',
                              color: isChildActive ? colors.sidebar.active : colors.sidebar.text,
                              borderLeft: isChildActive ? `3px solid ${colors.sidebar.active}` : '3px solid transparent',
                              transition: 'background-color 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              if (!isChildActive) {
                                e.currentTarget.style.backgroundColor = colors.sidebar.hover;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isChildActive) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }
                            }}
                          >
                            {child.icon}
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                to={item.href!}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  backgroundColor: isActive ? colors.sidebar.activeBg : 'transparent',
                  color: isActive ? colors.sidebar.active : colors.sidebar.text,
                  borderLeft: isActive ? `3px solid ${colors.sidebar.active}` : '3px solid transparent',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = colors.sidebar.hover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {item.icon}
                {sidebarOpen && <span style={{ fontSize: '14px', fontWeight: 500 }}>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* 底部用户信息 */}
        <div style={{ borderTop: `1px solid ${colors.sidebar.border}`, padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: colors.sidebar.active,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              A
            </div>
            {sidebarOpen && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '14px', fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Admin User
                </p>
                <p style={{ fontSize: '12px', opacity: 0.75, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  admin@cmdb.local
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部导航栏 */}
        <header className="h-16 bg-background border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link to="/">
              <a className="text-sm text-muted-foreground hover:text-foreground" style={{ textDecoration: 'none' }}>
                首页
              </a>
            </Link>
            {breadcrumbs.length > 0 && (
              <>
                <ChevronRightIcon fontSize="small" className="text-muted-foreground" />
                <div className="flex items-center gap-2">
                  {breadcrumbs.map((crumb, index) => (
                    <div key={index} className="flex items-center gap-2">
                      {crumb.href ? (
                        < Link to={crumb.href}>
                          <a className="text-sm text-muted-foreground hover:text-foreground" style={{ textDecoration: 'none' }}>
                            {crumb.label}
                          </a>
                        </Link>
                      ) : (
                        <span className="text-sm text-foreground font-medium">{crumb.label}</span>
                      )}
                      {index < breadcrumbs.length - 1 && (
                        <ChevronRightIcon fontSize="small" className="text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{new Date().toLocaleDateString('zh-CN')}</span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                // 清除登录状态
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('user');
                // 跳转到登录页
                window.location.href = '/login';
              }}
            >
              登出
            </Button>
          </div>
        </header>

        {/* 内容区域 */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
