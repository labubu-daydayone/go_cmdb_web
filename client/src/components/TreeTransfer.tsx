import React, { useState } from 'react';
import { Checkbox } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

export interface TreeNode {
  key: string;
  title: string;
  children?: TreeNode[];
  disabled?: boolean;
}

interface TreeTransferProps {
  dataSource: TreeNode[];
  targetKeys: string[];
  onChange: (targetKeys: string[]) => void;
  titles?: [string, string];
  height?: number;
}

const TreeTransfer: React.FC<TreeTransferProps> = ({
  dataSource,
  targetKeys,
  onChange,
  titles = ['可选项', '已选项'],
  height = 400,
}) => {
  const [leftChecked, setLeftChecked] = useState<string[]>([]);
  const [rightChecked, setRightChecked] = useState<string[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  // 展开/收起节点
  const handleToggleExpand = (key: string) => {
    const newExpanded = new Set(expandedKeys);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedKeys(newExpanded);
  };

  // 获取所有子节点的key
  const getAllChildKeys = (node: TreeNode): string[] => {
    const keys: string[] = [];
    if (node.children) {
      node.children.forEach(child => {
        keys.push(child.key);
        keys.push(...getAllChildKeys(child));
      });
    }
    return keys;
  };

  // 扁平化树结构
  const flattenTree = (nodes: TreeNode[]): string[] => {
    const keys: string[] = [];
    const traverse = (node: TreeNode) => {
      keys.push(node.key);
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    nodes.forEach(traverse);
    return keys;
  };

  // 检查节点是否被选中（包括子节点）
  const isNodeChecked = (node: TreeNode, checkedKeys: string[]): boolean => {
    return checkedKeys.includes(node.key);
  };

  // 主节点和子IP独立选择，不需要半选状态
  const isNodeIndeterminate = (node: TreeNode, checkedKeys: string[]): boolean => {
    return false;
  };

  // 处理节点选中（主节点和子IP独立选择）
  const handleNodeCheck = (node: TreeNode, checked: boolean, side: 'left' | 'right') => {
    const setChecked = side === 'left' ? setLeftChecked : setRightChecked;
    const currentChecked = side === 'left' ? leftChecked : rightChecked;

    const newChecked = [...currentChecked];

    if (checked) {
      // 只添加当前节点，不自动选中子节点
      if (!newChecked.includes(node.key)) {
        newChecked.push(node.key);
      }
    } else {
      // 只移除当前节点
      const index = newChecked.indexOf(node.key);
      if (index > -1) {
        newChecked.splice(index, 1);
      }
    }

    setChecked(newChecked);
  };

  // 移动到右侧
  const handleMoveRight = () => {
    const newTargetKeys = [...new Set([...targetKeys, ...leftChecked])];
    onChange(newTargetKeys);
    setLeftChecked([]);
  };

  // 移动到左侧
  const handleMoveLeft = () => {
    const newTargetKeys = targetKeys.filter(key => !rightChecked.includes(key));
    onChange(newTargetKeys);
    setRightChecked([]);
  };

  // 渲染树节点
  const renderTreeNode = (
    node: TreeNode,
    checkedKeys: string[],
    onCheck: (node: TreeNode, checked: boolean) => void,
    level: number = 0,
  ) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedKeys.has(node.key);
    const isChecked = isNodeChecked(node, checkedKeys);
    const isIndeterminate = isNodeIndeterminate(node, checkedKeys);
    const isInTargetList = targetKeys.includes(node.key);
    const isDisabled = node.disabled || isInTargetList; // 已在右侧的节点禁用

    return (
      <div key={node.key}>
        <div
          className={`flex items-center py-1 rounded transition-colors ${
            isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-secondary/30 cursor-pointer'
          } ${
            isChecked ? 'bg-primary/10' : ''
          }`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleExpand(node.key);
              }}
              className="p-0.5 hover:bg-secondary rounded transition-colors"
            >
              {isExpanded ? (
                <ExpandMoreIcon fontSize="small" className="text-muted-foreground" />
              ) : (
                <ChevronRightIcon fontSize="small" className="text-muted-foreground" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-6" />}
          <div
            className="flex items-center flex-1"
            onClick={() => !isDisabled && onCheck(node, !isChecked)}
          >
            <Checkbox
              checked={isChecked || isInTargetList}
              indeterminate={isIndeterminate}
              disabled={isDisabled}
              size="small"
              sx={{ padding: '4px' }}
            />
            <span className={`text-sm ${isDisabled ? 'text-muted-foreground' : 'text-foreground'}`}>
              {node.title}
            </span>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => 
              renderTreeNode(child, checkedKeys, onCheck, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  // 渲染扁平化的已选列表
  const renderFlatList = (
    nodes: TreeNode[],
    checked: string[],
    onCheck: (node: TreeNode, checked: boolean) => void,
    title: string,
  ) => {
    // 扁平化所有节点和子节点
    const flatItems: { key: string; title: string; node: TreeNode }[] = [];
    const traverse = (node: TreeNode) => {
      if (targetKeys.includes(node.key)) {
        flatItems.push({ key: node.key, title: node.title, node });
      }
      if (node.children) {
        node.children.forEach(child => {
          if (targetKeys.includes(child.key)) {
            flatItems.push({ key: child.key, title: child.title, node: child });
          }
        });
      }
    };
    nodes.forEach(traverse);

    const checkedCount = checked.length;
    const totalCount = flatItems.length;

    return (
      <div className="flex flex-col border border-border rounded-lg bg-background">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/5">
          <span className="text-sm font-medium text-foreground">
            {title} ({checkedCount}/{totalCount})
          </span>
        </div>

        {/* 列表内容 - 扁平化显示 */}
        <div 
          className="overflow-y-auto p-2"
          style={{ height: `${height}px` }}
        >
          {totalCount === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              暂无数据
            </div>
          ) : (
            flatItems.map(item => (
              <div
                key={item.key}
                className={`flex items-center py-1 px-2 rounded hover:bg-secondary/30 transition-colors cursor-pointer ${
                  checked.includes(item.key) ? 'bg-primary/10' : ''
                }`}
                onClick={() => onCheck(item.node, !checked.includes(item.key))}
              >
                <Checkbox
                  checked={checked.includes(item.key)}
                  disabled={item.node.disabled}
                  size="small"
                  sx={{ padding: '4px' }}
                />
                <span className={`text-sm ${
                  item.node.disabled ? 'text-muted-foreground' : 'text-foreground'
                }`}>
                  {item.title}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // 渲染树形列表（左侧）- 始终显示所有节点
  const renderTreeList = (
    nodes: TreeNode[],
    checked: string[],
    onCheck: (node: TreeNode, checked: boolean) => void,
    title: string,
  ) => {
    const allKeys = flattenTree(nodes);
    const checkedCount = checked.length;
    const totalCount = allKeys.length;

    return (
      <div className="flex flex-col border border-border rounded-lg bg-background">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/5">
          <span className="text-sm font-medium text-foreground">
            {title} ({checkedCount}/{totalCount})
          </span>
        </div>

        {/* 列表内容 - 树形显示 */}
        <div 
          className="overflow-y-auto p-2"
          style={{ height: `${height}px` }}
        >
          {totalCount === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              暂无数据
            </div>
          ) : (
            nodes.map(node => renderTreeNode(node, checked, onCheck, 0))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-center gap-4">
      {/* 左侧列表 - 树形 */}
      <div className="flex-1">
        {renderTreeList(
          dataSource,
          leftChecked,
          (node, checked) => handleNodeCheck(node, checked, 'left'),
          titles[0]
        )}
      </div>

      {/* 中间操作按钮 */}
      <div className="flex flex-col gap-2">
        <button
          onClick={handleMoveRight}
          disabled={leftChecked.length === 0}
          className="p-2 border border-border rounded bg-background hover:bg-secondary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="移动到右侧"
        >
          <ArrowForwardIcon fontSize="small" className="text-foreground" />
        </button>
        <button
          onClick={handleMoveLeft}
          disabled={rightChecked.length === 0}
          className="p-2 border border-border rounded bg-background hover:bg-secondary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="移动到左侧"
        >
          <ArrowBackIcon fontSize="small" className="text-foreground" />
        </button>
      </div>

      {/* 右侧列表 - 扁平化 */}
      <div className="flex-1">
        {renderFlatList(
          dataSource,
          rightChecked,
          (node, checked) => handleNodeCheck(node, checked, 'right'),
          titles[1]
        )}
      </div>
    </div>
  );
};

export default TreeTransfer;
