import React, { useState, useEffect } from 'react';
import { CardType } from '../models/Card';
import { CardService } from '../api/cardService';

interface CardFilterProps {
  onFilter: (filters: FilterOptions) => void;
}

export interface FilterOptions {
  type?: CardType;
  deck?: string;
  players?: string;
  vp?: number;
  category?: string;
}

/**
 * 卡牌筛选组件
 * 支持按类型、牌组等条件筛选卡牌
 */
const CardFilter: React.FC<CardFilterProps> = ({ onFilter }) => {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [decks, setDecks] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [playerOptions, setPlayerOptions] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  // 加载筛选选项
  useEffect(() => {
    setDecks(CardService.getAvailableDecks());
    setCategories(CardService.getAvailableCategories());
    setPlayerOptions(CardService.getAvailablePlayerOptions());
  }, []);

  // 处理筛选条件变化
  const handleFilterChange = (name: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters };
    
    if (value === '') {
      // 如果值为空，则删除该筛选条件
      delete newFilters[name];
    } else {
      // 否则，更新筛选条件
      newFilters[name] = value;
    }
    
    setFilters(newFilters);
    onFilter(newFilters);
  };

  // 重置所有筛选条件
  const resetFilters = () => {
    setFilters({});
    onFilter({});
  };

  // 获取活跃筛选条件数量
  const getActiveFilterCount = () => {
    return Object.keys(filters).length;
  };

  // 切换展开/折叠状态
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="card mb-6 animate-fadeIn">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          筛选卡牌
          {getActiveFilterCount() > 0 && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              {getActiveFilterCount()}
            </span>
          )}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={resetFilters}
            className="text-sm text-primary-600 hover:text-primary-800 font-medium flex items-center"
            disabled={getActiveFilterCount() === 0}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            重置
          </button>
          <button
            onClick={toggleExpanded}
            className="text-sm text-gray-600 hover:text-gray-800 font-medium flex items-center"
          >
            {isExpanded ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                收起
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                展开
              </>
            )}
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 卡牌类型筛选 */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              卡牌类型
            </label>
            <select
              className="select"
              value={filters.type || ''}
              onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
            >
              <option value="">全部类型</option>
              <option value={CardType.OCCUPATION}>职业卡</option>
              <option value={CardType.MINOR}>次要改良卡</option>
              <option value={CardType.MAJOR}>主要改良卡</option>
            </select>
          </div>
          
          {/* 牌组筛选 */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              牌组
            </label>
            <select
              className="select"
              value={filters.deck || ''}
              onChange={(e) => handleFilterChange('deck', e.target.value || undefined)}
            >
              <option value="">全部牌组</option>
              {decks.map((deck) => (
                <option key={deck} value={deck}>
                  {deck}
                </option>
              ))}
            </select>
          </div>
          
          {/* 玩家数量筛选 */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              适用玩家数
            </label>
            <select
              className="select"
              value={filters.players || ''}
              onChange={(e) => handleFilterChange('players', e.target.value || undefined)}
            >
              <option value="">全部玩家数</option>
              {playerOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          
          {/* 胜利点数筛选 */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              胜利点数
            </label>
            <select
              className="select"
              value={filters.vp !== undefined ? String(filters.vp) : ''}
              onChange={(e) => handleFilterChange('vp', e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">全部点数</option>
              <option value="0">0点</option>
              <option value="1">1点</option>
              <option value="2">2点</option>
              <option value="3">3点</option>
              <option value="4">4点</option>
            </select>
          </div>
          
          {/* 类别筛选 */}
          <div className="mb-3 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              卡牌类别
            </label>
            <select
              className="select"
              value={filters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
            >
              <option value="">全部类别</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      
      {/* 活跃筛选条件标签 */}
      {getActiveFilterCount() > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.type && (
            <FilterTag 
              label={`类型: ${filters.type === CardType.OCCUPATION ? '职业卡' : filters.type === CardType.MINOR ? '次要改良卡' : '主要改良卡'}`} 
              onRemove={() => handleFilterChange('type', '')} 
            />
          )}
          {filters.deck && (
            <FilterTag 
              label={`牌组: ${filters.deck}`} 
              onRemove={() => handleFilterChange('deck', '')} 
            />
          )}
          {filters.players && (
            <FilterTag 
              label={`玩家数: ${filters.players}`} 
              onRemove={() => handleFilterChange('players', '')} 
            />
          )}
          {filters.vp !== undefined && (
            <FilterTag 
              label={`胜利点数: ${filters.vp}点`} 
              onRemove={() => handleFilterChange('vp', '')} 
            />
          )}
          {filters.category && (
            <FilterTag 
              label={`类别: ${filters.category}`} 
              onRemove={() => handleFilterChange('category', '')} 
            />
          )}
        </div>
      )}
    </div>
  );
};

interface FilterTagProps {
  label: string;
  onRemove: () => void;
}

const FilterTag: React.FC<FilterTagProps> = ({ label, onRemove }) => {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
      {label}
      <button
        type="button"
        className="ml-1 inline-flex text-primary-500 hover:text-primary-700 focus:outline-none"
        onClick={onRemove}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
};

export default CardFilter; 