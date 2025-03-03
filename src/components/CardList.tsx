import React from 'react';
import { Card } from '../models/Card';
import CardItem from './CardItem';

interface CardListProps {
  cards: Card[];
  loading?: boolean;
  onCardUpdate?: (updatedCard: Card) => void;
}

/**
 * 卡牌列表组件
 * 显示卡牌列表
 */
const CardList: React.FC<CardListProps> = ({ cards, loading = false, onCardUpdate }) => {
  if (loading) {
    return (
      <div className="card animate-fadeIn">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="card animate-fadeIn">
        <div className="flex flex-col justify-center items-center h-60 py-8">
          <svg
            className="w-16 h-16 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <p className="text-gray-500 text-lg font-medium">没有找到符合条件的卡牌</p>
          <p className="text-gray-400 text-sm mt-2">请尝试调整搜索条件或筛选条件</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          卡牌列表
          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
            {cards.length}
          </span>
        </h2>
      </div>
      <div className="space-y-6">
        {cards.map((card, index) => (
          <CardItem key={`${card.id}_${index}`} card={card} onUpdate={onCardUpdate} />
        ))}
      </div>
    </div>
  );
};

export default CardList; 