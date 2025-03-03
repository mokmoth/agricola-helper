import React, { useState, useRef, useEffect } from 'react';
import { Card, CardType } from '../models/Card';

interface CardItemProps {
  card: Card;
  onUpdate?: (updatedCard: Card) => void;
}

// 定义成本对象的接口
interface CostItem {
  wood?: number;
  clay?: number;
  reed?: number;
  stone?: number;
  food?: number;
  grain?: number;
  vegetable?: number;
  [key: string]: any; // 允许其他属性
}

/**
 * 卡牌项组件
 * 显示单个卡牌的信息
 */
const CardItem: React.FC<CardItemProps> = ({ card, onUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(card.name);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // 当进入编辑模式时，自动聚焦到输入框
  useEffect(() => {
    if (isEditing && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isEditing]);

  // 根据卡牌类型获取样式类名
  const getCardTypeClassName = (type: CardType) => {
    switch (type) {
      case CardType.OCCUPATION:
        return 'card-occupation';
      case CardType.MINOR:
        return 'card-minor';
      case CardType.MAJOR:
        return 'card-major';
      default:
        return '';
    }
  };

  // 根据卡牌类型获取背景颜色
  const getCardTypeColor = (type: CardType) => {
    switch (type) {
      case CardType.OCCUPATION:
        return 'bg-secondary-50';
      case CardType.MINOR:
        return 'bg-accent-50';
      case CardType.MAJOR:
        return 'bg-red-50';
      default:
        return 'bg-gray-50';
    }
  };

  // 获取卡牌类型的中文名称
  const getCardTypeName = (type: CardType) => {
    switch (type) {
      case CardType.OCCUPATION:
        return '职业卡';
      case CardType.MINOR:
        return '次要改良卡';
      case CardType.MAJOR:
        return '主要改良卡';
      default:
        return '未知类型';
    }
  };

  // 格式化资源成本显示
  const formatResourceCost = (costs: any[][]) => {
    if (!costs || costs.length === 0) return null;

    const costItems: string[] = [];
    const costOption = costs[0];
    if (costOption && costOption.length > 0) {
      costOption.forEach(costObj => {
        if (costObj && typeof costObj === 'object') {
          const cost = costObj as CostItem;
          if (cost.wood) costItems.push(`木${cost.wood}`);
          if (cost.clay) costItems.push(`黏${cost.clay}`);
          if (cost.reed) costItems.push(`芦${cost.reed}`);
          if (cost.stone) costItems.push(`石${cost.stone}`);
          if (cost.food) costItems.push(`食${cost.food}`);
          if (cost.grain) costItems.push(`谷${cost.grain}`);
          if (cost.vegetable) costItems.push(`蔬${cost.vegetable}`);
        }
      });
    }
    return costItems.length > 0 ? costItems.join(' ') : null;
  };

  // 处理卡牌名称编辑
  const handleNameEdit = () => {
    setIsEditing(true);
  };

  // 处理卡牌名称保存
  const handleNameSave = () => {
    if (editedName.trim() !== '') {
      const updatedCard = { ...card, name: editedName.trim() };
      if (onUpdate) {
        onUpdate(updatedCard);
      }
      setIsEditing(false);
    }
  };

  // 处理按键事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setEditedName(card.name);
      setIsEditing(false);
    }
  };

  // 切换展开/折叠状态
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  // 检查卡牌是否有成本信息
  const hasCostInfo = () => {
    return card.costs && card.costs.length > 0;
  };

  return (
    <div 
      className={`card ${getCardTypeClassName(card.type)} ${getCardTypeColor(card.type)} hover:shadow-md transition-all duration-200 animate-fadeIn`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-grow">
          {/* 卡牌ID和名称 */}
          <div className="flex items-center mb-2">
            <span className="text-xs text-gray-500 mr-2">[{card.id}]</span>
            {isEditing ? (
              <div className="flex items-center">
                <input
                  ref={nameInputRef}
                  type="text"
                  className="input py-1 text-lg font-semibold"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleNameSave}
                />
              </div>
            ) : (
              <div className="flex items-center">
                <h3 className="text-lg font-semibold mr-2">{card.name}</h3>
                {onUpdate && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNameEdit();
                    }}
                    className="text-gray-400 hover:text-primary-600 focus:outline-none"
                    title="编辑卡牌名称"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* 卡牌类型和类别 */}
          <div className="flex flex-wrap gap-2 mt-1">
            <span className="badge badge-blue">
              {getCardTypeName(card.type)}
            </span>
            {card.category && (
              <span className="badge badge-pink">
                {card.category}
              </span>
            )}
            {card.vp > 0 && (
              <span className="badge badge-purple">
                {card.vp} 点
              </span>
            )}
          </div>
          
          {/* 成本信息区域 - 始终显示所有成本相关字段 */}
          <div className="mt-3 space-y-2 text-sm text-gray-700">
            {/* 资源成本 */}
            <div>
              <span className="font-medium">资源成本: </span>
              <span>{card.costs && card.costs.length > 0 ? formatResourceCost(card.costs) : '无'}</span>
            </div>
            
            {/* 成本说明文本 */}
            <div>
              <span className="font-medium">成本说明: </span>
              <span>{card.costText && card.costText.trim() !== '' ? card.costText : '无'}</span>
            </div>
            
            {/* 条件成本 */}
            <div>
              <span className="font-medium">条件成本: </span>
              <span>{card.conditionalCost && card.conditionalCost.trim() !== '' ? card.conditionalCost : '无'}</span>
            </div>

            {/* 前提条件 */}
            <div>
              <span className="font-medium">前提条件: </span>
              <span>{card.prerequisite && card.prerequisite.trim() !== '' ? card.prerequisite : '无'}</span>
            </div>

            {/* 额外分数 */}
            <div>
              <span className="font-medium">额外分数: </span>
              <span>{card.extraVp && card.bonusVp && card.bonusVp.trim() !== '' ? card.bonusVp : '无'}</span>
            </div>
          </div>
          
          {/* 卡牌描述 - 始终显示完整描述 */}
          <div className="mt-3 space-y-1">
            <div className="font-medium text-sm text-gray-700">描述:</div>
            <div className="text-sm text-gray-600">
              {card.desc && card.desc.length > 0 ? (
                card.desc.map((line, index) => (
                  <p key={index} className="mb-1 last:mb-0">{line}</p>
                ))
              ) : (
                <p>无描述</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-gray-500 text-sm">{card.numbering}</span>
          <button
            onClick={toggleExpanded}
            className="mt-2 text-primary-600 hover:text-primary-800 focus:outline-none"
          >
            {expanded ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 成本详细信息 */}
            {card.costs && card.costs.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  成本详情
                </h4>
                <div className="text-sm bg-gray-50 p-3 rounded-md">
                  <div className="space-y-2">
                    {card.costs.map((costOption, index) => (
                      <div key={index} className="border-b border-gray-200 last:border-0 pb-2 last:pb-0">
                        <div className="font-medium text-xs text-gray-600 mb-1">支付方式 {index + 1}:</div>
                        {costOption.map((cost, costIndex) => (
                          <div key={costIndex} className="flex flex-wrap gap-2">
                            {cost.wood && <span className="badge badge-brown">木材 x{cost.wood}</span>}
                            {cost.clay && <span className="badge badge-orange">黏土 x{cost.clay}</span>}
                            {cost.reed && <span className="badge badge-green">芦苇 x{cost.reed}</span>}
                            {cost.stone && <span className="badge badge-gray">石头 x{cost.stone}</span>}
                            {cost.food && <span className="badge badge-red">食物 x{cost.food}</span>}
                            {cost.grain && <span className="badge badge-yellow">谷物 x{cost.grain}</span>}
                            {cost.vegetable && <span className="badge badge-green">蔬菜 x{cost.vegetable}</span>}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 玩家数 */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                适用玩家数
              </h4>
              <p className="text-sm bg-gray-50 p-3 rounded-md">{card.players || '未知'}</p>
            </div>

            {/* 牌组 */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                牌组
              </h4>
              <p className="text-sm bg-gray-50 p-3 rounded-md">{card.deck || '未知'}</p>
            </div>

            {/* 其他属性 */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                其他属性
              </h4>
              <div className="text-sm bg-gray-50 p-3 rounded-md">
                <ul className="space-y-1">
                  {card.holder && <li>✓ 可放置物品</li>}
                  {card.animalHolder && <li>✓ 可放置动物</li>}
                  {card.field && <li>✓ 田地</li>}
                  {card.actionCard && <li>✓ 行动卡</li>}
                  {card.fee && <li>费用: {card.fee}</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardItem; 