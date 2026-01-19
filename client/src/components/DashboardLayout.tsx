/**
 * CMDB 后台布局组件
 * 包含侧边栏导航和顶部导航栏
 * 设计风格：现代企业风 - 深蓝侧边栏 + 浅色顶部导航
 */

import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  { label: 'DNS 配置', href: '/dns-config', icon: '🔧' },
  {
    label: '网站管理',
    icon: '🌍',
    children: [
      { label: '网站列表', href: '/websites', icon: '📋' },
      { label: '线路分组', href: '/line-groups', icon: '🔀' },
      { label: '节点列表', href: '/nodes', icon: '🖥' },
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
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [location] = useLocation();

  return (
    <div className="flex h-screen bg-background">
      {/* 侧边栏 */}
      <aside
        className={`${
          sidebarOpen ? 'w-60' : 'w-20'
        } bg-sidebar text-sidebar-foreground transition-all duration-300 flex flex-col border-r border-sidebar-border`}
      >
        {/* Logo 区域 */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center font-bold text-sm">
                CM
              </div>
              <span className="font-bold text-lg">CMDB</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-sidebar-accent/20 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const isActive = location === item.href;
            const isExpanded = expandedMenu === item.label;
            const hasChildren = item.children && item.children.length > 0;

            if (hasChildren) {
              return (
                <div key={item.label}>
                  <button
                    onClick={() => setExpandedMenu(isExpanded ? null : item.label)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                      isExpanded
                        ? 'bg-sidebar-accent/20 text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/10'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    {sidebarOpen && (
                      <>
                        <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                        <ChevronDown
                          size={16}
                          className={`transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </>
                    )}
                  </button>
                  {isExpanded && sidebarOpen && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children!.map((child) => {
                        const isChildActive = location === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href!}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                              isChildActive
                                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                : 'text-sidebar-foreground hover:bg-sidebar-accent/10'
                            }`}
                          >
                            <span>{child.icon}</span>
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
                href={item.href!}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/10'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* 底部用户信息 */}
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 bg-sidebar-accent rounded-full flex items-center justify-center text-xs font-bold">
              A
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Admin User</p>
                <p className="text-xs opacity-75 truncate">admin@cmdb.local</p>
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
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              首页
            </Link>
            {breadcrumbs.length > 0 && (
              <>
                <ChevronRight size={16} className="text-muted-foreground" />
                <div className="flex items-center gap-2">
                  {breadcrumbs.map((crumb, index) => (
                    <div key={index} className="flex items-center gap-2">
                      {crumb.href ? (
                        <Link href={crumb.href} className="text-sm text-muted-foreground hover:text-foreground">
                          {crumb.label}
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
