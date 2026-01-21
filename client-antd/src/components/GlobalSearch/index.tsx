import { SearchOutlined } from '@ant-design/icons';
import { AutoComplete, Input, Tag } from 'antd';
import { history } from '@umijs/max';
import React, { useState, useMemo } from 'react';
import { searchRoutes } from '@/utils/routes';
import './index.less';

/**
 * 全局搜索组件
 */
const GlobalSearch: React.FC = () => {
  const [searchValue, setSearchValue] = useState('');
  const [open, setOpen] = useState(false);

  /**
   * 搜索过滤
   */
  const searchOptions = useMemo(() => {
    if (!searchValue) {
      return [];
    }

    const filtered = searchRoutes(searchValue);

    return filtered.map((item) => ({
      value: item.path,
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontWeight: 500 }}>{item.title}</span>
            {item.category && (
              <Tag color="blue" style={{ marginLeft: 8, fontSize: 11 }}>
                {item.category}
              </Tag>
            )}
          </div>
          <span style={{ color: '#999', fontSize: 12 }}>{item.path}</span>
        </div>
      ),
    }));
  }, [searchValue]);

  /**
   * 选择路由
   */
  const handleSelect = (value: string) => {
    history.push(value);
    setSearchValue('');
    setOpen(false);
  };

  /**
   * 搜索变化
   */
  const handleSearch = (value: string) => {
    setSearchValue(value);
    setOpen(value.length > 0);
  };

  return (
    <div className="global-search">
      <AutoComplete
        value={searchValue}
        options={searchOptions}
        onSelect={handleSelect}
        onSearch={handleSearch}
        open={open}
        onBlur={() => setOpen(false)}
        onFocus={() => setOpen(searchValue.length > 0)}
        style={{ width: 300 }}
        placeholder="搜索路由..."
      >
        <Input
          prefix={<SearchOutlined />}
          allowClear
        />
      </AutoComplete>
    </div>
  );
};

export default GlobalSearch;
