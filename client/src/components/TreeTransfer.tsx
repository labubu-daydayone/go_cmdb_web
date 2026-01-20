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

  // 检查节点是否半选中（部分子节点被选中）
  const isNodeIndeterminate = (node: TreeNode, checkedKeys: string[]): boolean => {
    if (!node.children || node.children.length === 0) return false;
    const childKeys = getAllChildKeys(node);
    const checkedChildCount = childKeys.filter(key => checkedKeys.includes(key)).length;
    return checkedChildCount > 0 && checkedChildCount < childKeys.length;
  };

  // 处理节点选中
  const handleNodeCheck = (node: TreeNode, checked: boolean, side: 'left' | 'right') => {
    const setChecked = side === 'left' ? setLeftChecked : setRightChecked;
    const currentChecked = side === 'left' ? leftChecked : rightChecked;

    const newChecked = [...currentChecked];
    const allKeys = [node.key, ...getAllChildKeys(node)];

    if (checked) {
      // 添加节点和所有子节点
      allKeys.forEach(key => {
        if (!newChecked.includes(key)) {
          newChecked.push(key);
        }
      });
    } else {
      // 移除节点和所有子节点
      allKeys.forEach(key => {
        const index = newChecked.indexOf(key);
        if (index > -1) {
          newChecked.splice(index, 1);
        }
      });
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
    isInTarget: boolean = false,
  ) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedKeys.has(node.key);
    const isChecked = isNodeChecked(node, checkedKeys);
    const isIndeterminate = isNodeIndeterminate(node, checkedKeys);
    const isInTargetList = targetKeys.includes(node.key);

    // 如果是左侧列表，过滤掉已在右侧的节点
    if (!isInTarget && isInTargetList) {
      return null;
    }

    // 如果是右侧列表，只显示在targetKeys中的节点
    if (isInTarget && !isInTargetList) {
      return null;
    }

    return (
      <div key={node.key}>
        <div
          className={`flex items-center py-1 rounded hover:bg-secondary/30 transition-colors cursor-pointer ${
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
            onClick={() => !node.disabled && onCheck(node, !isChecked)}
          >
            <Checkbox
              checked={isChecked}
              indeterminate={isIndeterminate}
              disabled={node.disabled}
              size="small"
              sx={{ padding: '4px' }}
            />
            <span className={`text-sm ${node.disabled ? 'text-muted-foreground' : 'text-foreground'}`}>
              {node.title}
            </span>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => 
              renderTreeNode(child, checkedKeys, onCheck, level + 1, isInTarget)
            )}
          </div>
        )}
      </div>
    );
  };

  // 渲染列表
  const renderList = (
    nodes: TreeNode[],
    checked: string[],
    onCheck: (node: TreeNode, checked: boolean) => void,
    title: string,
    isTarget: boolean = false,
  ) => {
    const allKeys = flattenTree(nodes);
    const visibleKeys = isTarget ? allKeys.filter(key => targetKeys.includes(key)) : allKeys.filter(key => !targetKeys.includes(key));
    const checkedCount = checked.length;
    const totalCount = visibleKeys.length;

    return (
      <div className="flex flex-col border border-border rounded-lg bg-background">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/5">
          <span className="text-sm font-medium text-foreground">
            {title} ({checkedCount}/{totalCount})
          </span>
        </div>

        {/* 列表内容 */}
        <div 
          className="overflow-y-auto p-2"
          style={{ height: `${height}px` }}
        >
          {totalCount === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              暂无数据
            </div>
          ) : (
            nodes.map(node => renderTreeNode(node, checked, onCheck, 0, isTarget))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-center gap-4">
      {/* 左侧列表 */}
      <div className="flex-1">
        {renderList(
          dataSource,
          leftChecked,
          (node, checked) => handleNodeCheck(node, checked, 'left'),
          titles[0],
          false
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

      {/* 右侧列表 */}
      <div className="flex-1">
        {renderList(
          dataSource,
          rightChecked,
          (node, checked) => handleNodeCheck(node, checked, 'right'),
          titles[1],
          true
        )}
      </div>
    </div>
  );
};

export default TreeTransfer;
