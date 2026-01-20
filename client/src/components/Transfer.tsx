import React from 'react';
import { Checkbox, FormControlLabel } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export interface TransferItem {
  key: string;
  title: string;
  disabled?: boolean;
}

interface TransferProps {
  dataSource: TransferItem[];
  targetKeys: string[];
  onChange: (targetKeys: string[]) => void;
  titles?: [string, string];
  height?: number;
}

const Transfer: React.FC<TransferProps> = ({
  dataSource,
  targetKeys,
  onChange,
  titles = ['可选项', '已选项'],
  height = 400,
}) => {
  const [leftChecked, setLeftChecked] = React.useState<string[]>([]);
  const [rightChecked, setRightChecked] = React.useState<string[]>([]);

  // 左侧数据：未选中的项
  const leftItems = dataSource.filter(item => !targetKeys.includes(item.key));
  // 右侧数据：已选中的项
  const rightItems = dataSource.filter(item => targetKeys.includes(item.key));

  // 处理左侧复选框变化
  const handleLeftToggle = (key: string) => {
    const currentIndex = leftChecked.indexOf(key);
    const newChecked = [...leftChecked];

    if (currentIndex === -1) {
      newChecked.push(key);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setLeftChecked(newChecked);
  };

  // 处理右侧复选框变化
  const handleRightToggle = (key: string) => {
    const currentIndex = rightChecked.indexOf(key);
    const newChecked = [...rightChecked];

    if (currentIndex === -1) {
      newChecked.push(key);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setRightChecked(newChecked);
  };

  // 移动到右侧
  const handleMoveRight = () => {
    const newTargetKeys = [...targetKeys, ...leftChecked];
    onChange(newTargetKeys);
    setLeftChecked([]);
  };

  // 移动到左侧
  const handleMoveLeft = () => {
    const newTargetKeys = targetKeys.filter(key => !rightChecked.includes(key));
    onChange(newTargetKeys);
    setRightChecked([]);
  };

  // 全选/取消全选
  const handleToggleAll = (side: 'left' | 'right') => {
    if (side === 'left') {
      if (leftChecked.length === leftItems.length) {
        setLeftChecked([]);
      } else {
        setLeftChecked(leftItems.map(item => item.key));
      }
    } else {
      if (rightChecked.length === rightItems.length) {
        setRightChecked([]);
      } else {
        setRightChecked(rightItems.map(item => item.key));
      }
    }
  };

  // 渲染列表
  const renderList = (
    items: TransferItem[],
    checked: string[],
    onToggle: (key: string) => void,
    onToggleAll: () => void,
    title: string,
  ) => {
    const allChecked = items.length > 0 && checked.length === items.length;
    const indeterminate = checked.length > 0 && checked.length < items.length;

    return (
      <div className="flex flex-col border border-border rounded-lg bg-background">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/5">
          <FormControlLabel
            control={
              <Checkbox
                checked={allChecked}
                indeterminate={indeterminate}
                onChange={onToggleAll}
                size="small"
              />
            }
            label={
              <span className="text-sm font-medium text-foreground">
                {title} ({checked.length}/{items.length})
              </span>
            }
          />
        </div>

        {/* 列表内容 */}
        <div 
          className="overflow-y-auto p-2"
          style={{ height: `${height}px` }}
        >
          {items.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              暂无数据
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.key}
                className={`flex items-center px-2 py-1 rounded hover:bg-secondary/30 transition-colors cursor-pointer ${
                  checked.includes(item.key) ? 'bg-primary/10' : ''
                }`}
                onClick={() => !item.disabled && onToggle(item.key)}
              >
                <Checkbox
                  checked={checked.includes(item.key)}
                  disabled={item.disabled}
                  size="small"
                  sx={{ padding: '4px' }}
                />
                <span className={`text-sm ${item.disabled ? 'text-muted-foreground' : 'text-foreground'}`}>
                  {item.title}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-center gap-4">
      {/* 左侧列表 */}
      <div className="flex-1">
        {renderList(leftItems, leftChecked, handleLeftToggle, () => handleToggleAll('left'), titles[0])}
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
        {renderList(rightItems, rightChecked, handleRightToggle, () => handleToggleAll('right'), titles[1])}
      </div>
    </div>
  );
};

export default Transfer;
