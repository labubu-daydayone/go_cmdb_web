# 左侧菜单栏图标映射

## 图标选择原则
- 使用 Material Icons 扁平风格（Outlined 变体）
- 图标语义清晰，符合功能定位
- 保持视觉一致性和现代感

## 菜单图标映射表

| 菜单项 | 当前 Emoji | Material Icon | 图标名称 | 说明 |
|--------|-----------|---------------|----------|------|
| 仪表板 | 📊 | `DashboardOutlined` | Dashboard | 仪表板/控制面板图标 |
| 域名管理 | 🌐 | `LanguageOutlined` | Language | 全球/域名图标 |
| 网站管理 | 🌍 | `PublicOutlined` | Public | 公共/网站图标 |
| └ 网站列表 | 📋 | `ListAltOutlined` | List Alt | 列表图标 |
| └ 回源分组 | 🔗 | `LinkOutlined` | Link | 链接/连接图标 |
| └ 线路分组 | 🔀 | `AccountTreeOutlined` | Account Tree | 树形/分组图标 |
| └ 节点列表 | 🖥 | `ComputerOutlined` | Computer | 计算机/节点图标 |
| └ 节点分组 | 📋 | `FolderOutlined` | Folder | 文件夹/分组图标 |
| └ 缓存设置 | 💾 | `SaveOutlined` | Save | 保存/缓存图标 |
| └ DNS 配置 | 🔧 | `SettingsEthernetOutlined` | Settings Ethernet | 网络设置图标 |
| 服务器 | 🖥️ | `StorageOutlined` | Storage | 存储/服务器图标 |
| 配置 | ⚙️ | `SettingsOutlined` | Settings | 设置图标 |

## 图标使用示例

### 导入方式
```tsx
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
// ... 其他图标
```

### 使用方式
```tsx
<DashboardOutlinedIcon fontSize="small" />
<LanguageOutlinedIcon fontSize="small" />
```

## 图标尺寸
- 侧边栏菜单图标：`fontSize="small"` (20px)
- 保持与文字的视觉平衡

## 颜色
- 默认：继承父元素颜色（白色，来自侧边栏样式）
- 激活状态：蓝色高亮
- 悬停状态：轻微透明度变化

## 设计理念
Material Icons Outlined 变体提供了：
- **扁平化设计**：线条简洁，无填充
- **现代感**：符合 Material Design 3 设计语言
- **清晰度**：在小尺寸下依然清晰可辨
- **一致性**：所有图标风格统一
