/**
 * 此文件已被替换为 Dashboard.tsx
 * 请访问 / 路由查看仪表板
 */

import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function Home() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation('/');
  }, [setLocation]);

  return null;
}
