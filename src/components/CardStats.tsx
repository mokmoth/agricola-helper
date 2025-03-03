import React from 'react';
import { CardType } from '../models/Card';

interface CardStatsProps {
  stats: {
    total: number;
    occupation: number;
    minor: number;
    major: number;
  };
}

/**
 * 卡牌统计组件
 * 显示卡牌总数和各类型卡牌数量
 */
const CardStats: React.FC<CardStatsProps> = ({ stats }) => {
  return (
    <div className="card mb-8 animate-fadeIn">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        卡牌统计
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard 
          title="总卡牌" 
          count={stats.total} 
          bgColor="bg-primary-100" 
          textColor="text-primary-800" 
          borderColor="border-primary-500"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          }
        />
        <StatCard 
          title="职业卡" 
          count={stats.occupation} 
          bgColor="bg-secondary-100" 
          textColor="text-secondary-800" 
          borderColor="border-secondary-500"
          type={CardType.OCCUPATION}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-secondary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />
        <StatCard 
          title="次要改良卡" 
          count={stats.minor} 
          bgColor="bg-accent-100" 
          textColor="text-accent-800" 
          borderColor="border-accent-500"
          type={CardType.MINOR}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          }
        />
        <StatCard 
          title="主要改良卡" 
          count={stats.major} 
          bgColor="bg-red-100" 
          textColor="text-red-800" 
          borderColor="border-red-500"
          type={CardType.MAJOR}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  count: number;
  bgColor: string;
  textColor: string;
  borderColor: string;
  type?: CardType;
  icon?: React.ReactNode;
}

/**
 * 统计卡片组件
 */
const StatCard: React.FC<StatCardProps> = ({ title, count, bgColor, textColor, borderColor, type, icon }) => {
  return (
    <div className={`${bgColor} rounded-lg p-5 border-l-4 ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold mb-1">{title}</h3>
          <p className={`text-3xl font-bold ${textColor}`}>{count}</p>
        </div>
        <div className="mt-1">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default CardStats; 