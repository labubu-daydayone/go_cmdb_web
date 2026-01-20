/**
 * Material UI 风格的分页组件
 * 参考 Ant Design Pagination
 */

import React from 'react';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

export interface PaginationProps {
  /** 当前页码 */
  current?: number;
  /** 默认当前页码 */
  defaultCurrent?: number;
  /** 数据总数 */
  total: number;
  /** 每页条数 */
  pageSize?: number;
  /** 默认每页条数 */
  defaultPageSize?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否显示每页条数选择器 */
  showSizeChanger?: boolean;
  /** 每页条数选项 */
  pageSizeOptions?: number[];
  /** 页码改变的回调 */
  onChange?: (page: number, pageSize: number) => void;
  /** 每页条数改变的回调 */
  onShowSizeChange?: (current: number, size: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  current: controlledCurrent,
  defaultCurrent = 1,
  total,
  pageSize: controlledPageSize,
  defaultPageSize = 15,
  disabled = false,
  showSizeChanger = false,
  pageSizeOptions = [15, 20, 50, 100],
  onChange,
  onShowSizeChange,
}) => {
  const [internalCurrent, setInternalCurrent] = React.useState(defaultCurrent);
  const [internalPageSize, setInternalPageSize] = React.useState(defaultPageSize);

  // 使用受控或非受控模式
  const current = controlledCurrent !== undefined ? controlledCurrent : internalCurrent;
  const pageSize = controlledPageSize !== undefined ? controlledPageSize : internalPageSize;

  const totalPages = Math.ceil(total / pageSize);
  const startItem = (current - 1) * pageSize + 1;
  const endItem = Math.min(current * pageSize, total);

  const handlePageChange = (page: number) => {
    if (disabled || page < 1 || page > totalPages || page === current) return;
    
    if (controlledCurrent === undefined) {
      setInternalCurrent(page);
    }
    onChange?.(page, pageSize);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    if (disabled) return;
    
    const newTotalPages = Math.ceil(total / newPageSize);
    const newCurrent = current > newTotalPages ? newTotalPages : current;
    
    if (controlledPageSize === undefined) {
      setInternalPageSize(newPageSize);
    }
    if (controlledCurrent === undefined && newCurrent !== current) {
      setInternalCurrent(newCurrent);
    }
    
    onShowSizeChange?.(newCurrent, newPageSize);
    onChange?.(newCurrent, newPageSize);
  };

  // 生成页码按钮
  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      // 总页数较少，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 总页数较多，显示部分页码
      pages.push(1);

      if (current <= 3) {
        for (let i = 2; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
      } else if (current >= totalPages - 2) {
        pages.push('...');
        for (let i = totalPages - 3; i < totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push('...');
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = renderPageNumbers();

  return (
    <div className="flex items-center justify-end gap-4 px-6 py-4 border-t border-border bg-background">
      {/* 显示范围 */}
      <div className="text-sm text-muted-foreground">
        {total > 0 ? `${startItem}-${endItem} 条，共 ${total} 条` : '暂无数据'}
      </div>

      {/* 分页按钮 */}
      <div className="flex items-center gap-2">
        {/* 上一页 - 只显示 < 图标 */}
        <button
          onClick={() => handlePageChange(current - 1)}
          disabled={disabled || current === 1}
          className="min-w-[32px] h-8 px-2 text-sm border border-border rounded hover:bg-secondary/50 hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-border transition-colors flex items-center justify-center"
          title="上一页"
        >
          <ChevronLeftIcon fontSize="small" />
        </button>

        {/* 页码按钮 */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                  •••
                </span>
              );
            }

            const pageNum = page as number;
            const isActive = pageNum === current;

            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                disabled={disabled}
                className={`min-w-[32px] h-8 px-2 text-sm rounded transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'border border-border hover:bg-secondary/50 hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-border'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* 下一页 - 只显示 > 图标 */}
        <button
          onClick={() => handlePageChange(current + 1)}
          disabled={disabled || current === totalPages}
          className="min-w-[32px] h-8 px-2 text-sm border border-border rounded hover:bg-secondary/50 hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-border transition-colors flex items-center justify-center"
          title="下一页"
        >
          <ChevronRightIcon fontSize="small" />
        </button>
      </div>

      {/* 每页显示数量选择 */}
      {showSizeChanger && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>每页</span>
          <Select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            disabled={disabled}
            size="small"
            sx={{
              minWidth: 80,
              height: 32,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'var(--border)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'var(--primary)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'var(--primary)',
              },
            }}
          >
            {pageSizeOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
          <span>条</span>
        </div>
      )}
    </div>
  );
};
