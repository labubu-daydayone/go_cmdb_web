/**
 * 统一的分页组件
 */

import React from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-background">
      {/* 左侧：每页显示数量选择 */}
      {onItemsPerPageChange && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>每页显示</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="px-2 py-1 border border-border rounded bg-background text-foreground cursor-pointer hover:border-primary/50 transition-colors"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>条</span>
        </div>
      )}

      {/* 中间：显示范围 */}
      <div className="text-sm text-muted-foreground">
        显示 {startItem} - {endItem} 条，共 {totalItems} 条
      </div>

      {/* 右侧：分页按钮 */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 text-sm border border-border rounded hover:bg-secondary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
        >
          <ChevronLeftIcon fontSize="small" />
          上一页
        </button>

        {/* 页码按钮 */}
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`w-8 h-8 text-sm rounded transition-colors ${
                  currentPage === pageNum
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'border border-border hover:bg-secondary/50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 text-sm border border-border rounded hover:bg-secondary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
        >
          下一页
          <ChevronRightIcon fontSize="small" />
        </button>
      </div>
    </div>
  );
};
