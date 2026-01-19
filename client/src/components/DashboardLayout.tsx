/**
 * CMDB 后台布局组件 - Material UI 版本
 * 包含侧边栏导航和顶部导航栏
 * 设计风格：现代企业风 - 深蓝侧边栏 + 浅色顶部导航
 */

import { ReactNode, useState } from 'react';
import * as React from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X, ChevronRight, ChevronDown } from 'lucide-react';
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
  icon: string;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  { label: '仪表板', href: '/', icon: '📊' },
  { label: '域名管理', href: '/domains', icon: '🌐' },
  {
    label: '网站管理',
    icon: '🌍',
    children: [
      { label: '网站列表', href: '/websites', icon: '📋' },
      { label: '回源分组', href: '/origin-groups', icon: '🔗' },
      { label: '线路分组', href: '/line-groups', icon: '🔀' },
      { label: '节点列表', href: '/nodes', icon: '🖥' },
      { label: '节点分组', href: '/node-groups', icon: '📋' },
      { label: '缓存设置', href: '/cache-settings', icon: '💾' },
      { label: 'DNS 配置', href: '/dns-config', icon: '🔧' },
    ],
  },
  { label: '服务器', href: '/servers', icon: '🖥️' },
  { label: '配置', href: '/settings', icon: '⚙️' },
];

export default function DashboardLayout({
  children,
  breadcrumbs = [],
  currentPage = '仪表板',
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { expandedMenu, setExpandedMenu } = useMenu();
  const [location] = useLocation();

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
          color: colors.sidebar.foreground,
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
                  backgroundColor: colors.sidebar.accent,
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
              color: colors.sidebar.foreground,
              borderRadius: '8px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
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
            const isActive = location === item.href;
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
                      backgroundColor: isExpanded ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                      color: colors.sidebar.foreground,
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isExpanded) {
                        e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isExpanded) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>{item.icon}</span>
                    {sidebarOpen && (
                      <>
                        <span style={{ fontSize: '14px', fontWeight: 500, flex: 1, textAlign: 'left' }}>
                          {item.label}
                        </span>
                        <ChevronDown
                          size={16}
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
                        const isChildActive = location === child.href;
                        return (
                          <Link key={child.href} href={child.href!}>
                            <a
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                fontSize: '14px',
                                textDecoration: 'none',
                                backgroundColor: isChildActive ? colors.sidebar.accent : 'transparent',
                                color: colors.sidebar.foreground,
                                transition: 'background-color 0.2s',
                              }}
                              onMouseEnter={(e) => {
                                if (!isChildActive) {
                                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isChildActive) {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }
                              }}
                            >
                              <span>{child.icon}</span>
                              {child.label}
                            </a>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link key={item.href} href={item.href!}>
                <a
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    backgroundColor: isActive ? colors.sidebar.accent : 'transparent',
                    color: colors.sidebar.foreground,
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{item.icon}</span>
                  {sidebarOpen && <span style={{ fontSize: '14px', fontWeight: 500 }}>{item.label}</span>}
                </a>
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
                backgroundColor: colors.sidebar.accent,
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
            <Link href="/">
              <a className="text-sm text-muted-foreground hover:text-foreground" style={{ textDecoration: 'none' }}>
                首页
              </a>
            </Link>
            {breadcrumbs.length > 0 && (
              <>
                <ChevronRight size={16} className="text-muted-foreground" />
                <div className="flex items-center gap-2">
                  {breadcrumbs.map((crumb, index) => (
                    <div key={index} className="flex items-center gap-2">
                      {crumb.href ? (
                        <Link href={crumb.href}>
                          <a className="text-sm text-muted-foreground hover:text-foreground" style={{ textDecoration: 'none' }}>
                            {crumb.label}
                          </a>
                        </Link>
                      ) : (
                        <span className="text-sm text-foreground font-medium">{crumb.label}</span>
                      )}
                      {index < breadcrumbs.length - 1 && (
                        <ChevronRight size={16} className="text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{new Date().toLocaleDateString('zh-CN')}</span>
            <Button variant="ghost" size="sm">
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
