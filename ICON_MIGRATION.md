# 图标迁移：lucide-react → Material Icons

## 图标映射表

| lucide-react | Material Icons | 说明 |
|--------------|----------------|------|
| `AlertCircle` | `ErrorOutline` | 警告/错误图标 |
| `CheckCircle` | `CheckCircle` | 成功/完成图标 |
| `ChevronDown` | `ExpandMore` | 向下箭头 |
| `ChevronRight` | `ChevronRight` | 向右箭头 |
| `Clock` | `Schedule` | 时钟/时间图标 |
| `Copy` | `ContentCopy` | 复制图标 |
| `Edit2` | `Edit` | 编辑图标 |
| `Eye` | `Visibility` | 可见/查看图标 |
| `EyeOff` | `VisibilityOff` | 不可见/隐藏图标 |
| `Menu` | `Menu` | 菜单图标 |
| `Network` | `Hub` | 网络/集线器图标 |
| `Pencil` | `Create` | 编辑/创建图标 |
| `Plus` | `Add` | 添加图标 |
| `Search` | `Search` | 搜索图标 |
| `Server` | `Storage` | 服务器/存储图标 |
| `Trash2` | `Delete` | 删除图标 |
| `Wifi` | `Wifi` | WiFi 连接图标 |
| `WifiOff` | `WifiOff` | WiFi 断开图标 |
| `X` | `Close` | 关闭图标 |
| `Zap` | `FlashOn` | 闪电/快速图标 |

## 使用方式对比

### lucide-react
```tsx
import { Plus, Edit2, Trash2 } from 'lucide-react';

<Plus size={16} />
<Edit2 size={20} className="text-blue-500" />
```

### Material Icons
```tsx
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

<AddIcon fontSize="small" />
<EditIcon fontSize="medium" sx={{ color: 'primary.main' }} />
```

## fontSize 映射

| lucide-react size | Material Icons fontSize |
|-------------------|-------------------------|
| `size={14}` | `fontSize="small"` (20px) |
| `size={16}` | `fontSize="small"` (20px) |
| `size={18}` | `fontSize="small"` (20px) |
| `size={20}` | `fontSize="medium"` (24px) |
| `size={24}` | `fontSize="medium"` (24px) |
| `size={28}` | `fontSize="large"` (35px) |
| `size={32}` | `fontSize="large"` (35px) |

## 需要替换的文件列表

1. client/src/components/DashboardLayout.tsx
2. client/src/components/mui/MultiSelect.tsx
3. client/src/pages/CacheSettings.tsx
4. client/src/pages/DNSConfig.tsx
5. client/src/pages/Dashboard.tsx
6. client/src/pages/Domains.tsx
7. client/src/pages/LineGroups.tsx
8. client/src/pages/NodeGroups.tsx
9. client/src/pages/Nodes.tsx
10. client/src/pages/OriginGroups.tsx
11. client/src/pages/OriginManagement.tsx
12. client/src/pages/Websites.tsx

## 迁移步骤

1. ✅ 确认 @mui/icons-material 已安装
2. ⏳ 创建图标映射表
3. ⏳ 批量替换所有文件中的图标导入
4. ⏳ 调整图标属性（size → fontSize）
5. ⏳ 测试验证所有页面
6. ⏳ 移除 lucide-react 依赖
