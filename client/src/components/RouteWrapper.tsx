import { useLocation } from 'react-router-dom';
import { ComponentType } from 'react';

/**
 * RouteWrapper - 高阶组件，用于强制页面组件在路由变化时重新挂载
 * 
 * 这个组件解决了一个常见的React Router问题：
 * 当多个路由使用相同的布局组件（如DashboardLayout）时，
 * React会复用组件实例，导致页面内容不更新。
 * 
 * 通过使用location.pathname作为key，我们强制React在路由变化时
 * 卸载旧组件并挂载新组件。
 */
export function withRouteKey<P extends object>(Component: ComponentType<P>) {
  return function WrappedComponent(props: P) {
    const location = useLocation();
    
    // 使用location.pathname作为key强制组件重新挂载
    return <Component key={location.pathname} {...props} />;
  };
}

export default withRouteKey;
