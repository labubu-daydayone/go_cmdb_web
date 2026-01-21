/**
 * 此文件已被替换为 Dashboard.tsx
 * 请访问 / 路由查看仪表板
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/');
  }, [navigate]);

  return null;
}
