# shadcn/ui 到 Material UI 迁移计划

## 项目概述
- **项目名称**: CMDB Admin
- **当前 UI 库**: shadcn/ui (基于 Radix UI)
- **目标 UI 库**: Material UI (MUI)
- **前端框架**: React 19 + TypeScript + Vite

## 组件映射表

### 核心组件映射

| shadcn/ui 组件 | Material UI 组件 | 说明 |
|---------------|-----------------|------|
| Button | Button | 直接替换 |
| Card | Card, CardContent, CardHeader | 结构类似 |
| Input | TextField | MUI 使用 TextField |
| Select | Select, MenuItem | 结构略有不同 |
| Dialog | Dialog, DialogTitle, DialogContent | 结构类似 |
| Alert | Alert | 直接替换 |
| Badge | Badge | 直接替换 |
| Checkbox | Checkbox | 直接替换 |
| Switch | Switch | 直接替换 |
| Tabs | Tabs, Tab | 直接替换 |
| Table | Table, TableBody, TableCell, TableHead, TableRow | 结构类似 |
| Tooltip | Tooltip | 直接替换 |
| Progress | LinearProgress / CircularProgress | 根据需求选择 |
| Slider | Slider | 直接替换 |
| Accordion | Accordion, AccordionSummary, AccordionDetails | 结构类似 |
| Avatar | Avatar | 直接替换 |
| Breadcrumb | Breadcrumbs | 直接替换 |
| Dropdown Menu | Menu, MenuItem | MUI 使用 Menu |
| Popover | Popover | 直接替换 |
| Radio Group | RadioGroup, Radio | 直接替换 |
| Separator | Divider | MUI 使用 Divider |
| Skeleton | Skeleton | 直接替换 |
| Textarea | TextField (multiline) | MUI 使用 multiline TextField |
| Toggle | ToggleButton | MUI 使用 ToggleButton |

### 需要自定义的组件

| shadcn/ui 组件 | 解决方案 |
|---------------|---------|
| Command | 使用 Autocomplete 或自定义 |
| Drawer | 使用 Drawer |
| Sheet | 使用 Drawer (side) |
| Sidebar | 使用 Drawer (persistent) |
| Sonner (Toast) | 使用 Snackbar |
| Calendar | 使用 @mui/x-date-pickers |
| Chart | 保持使用 recharts |

## 迁移步骤

### 第一阶段：依赖安装和配置
1. 安装 Material UI 核心包
2. 安装 Material UI Icons
3. 安装日期选择器（如需要）
4. 配置主题系统
5. 移除 Radix UI 依赖

### 第二阶段：创建基础组件
1. 创建 MUI 主题配置
2. 创建通用布局组件
3. 创建常用组件的封装

### 第三阶段：页面迁移
1. Dashboard.tsx
2. DashboardLayout.tsx
3. 其他页面文件

### 第四阶段：测试和优化
1. 功能测试
2. 样式调整
3. 性能优化

## 依赖变更

### 需要移除的依赖
```json
"@radix-ui/react-*" (所有 Radix UI 包)
"class-variance-authority"
"cmdk"
"vaul"
"sonner"
```

### 需要添加的依赖
```json
"@mui/material"
"@mui/icons-material"
"@emotion/react"
"@emotion/styled"
"@mui/x-date-pickers" (可选)
```

## 注意事项

1. **样式系统**: Material UI 使用 Emotion，而 shadcn/ui 使用 Tailwind CSS。需要决定是保留 Tailwind 还是完全使用 MUI 的样式系统。
2. **主题配置**: 需要创建 MUI 主题以匹配当前设计风格（深蓝侧边栏 + 浅色主题）
3. **图标**: 当前使用 lucide-react，可以保留或迁移到 @mui/icons-material
4. **图表**: recharts 可以继续使用，无需更改
5. **路由**: wouter 可以继续使用，无需更改
