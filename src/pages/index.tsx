import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import CardStats from '../components/CardStats';
import CardSearch from '../components/CardSearch';
import CardFilter, { FilterOptions } from '../components/CardFilter';
import CardList from '../components/CardList';
import CardImport from '../components/CardImport';
import { CardService } from '../api/cardService';
import { Card } from '../models/Card';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/**
 * 农场主卡牌助手主页
 */
export default function Home() {
  const [cards, setCards] = useState<Card[]>([]);
  const [filteredCards, setFilteredCards] = useState<Card[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    occupation: 0,
    minor: 0,
    major: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({});
  const [showImport, setShowImport] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [keepSampleCards, setKeepSampleCards] = useState(false);

  // 加载卡牌数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // 确保 CardService 已初始化
        CardService.initialize();
        
        // 获取所有卡牌
        const allCards = CardService.getAllCards();
        setCards(allCards);
        setFilteredCards(allCards);
        
        // 获取卡牌统计信息
        const cardStats = CardService.getCardStats();
        setStats(cardStats);
      } catch (error) {
        console.error('加载卡牌数据时出错:', error);
        toast.error('加载卡牌数据时出错');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 处理搜索
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    applyFiltersAndSearch(term, filters);
  };

  // 处理筛选
  const handleFilter = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    applyFiltersAndSearch(searchTerm, newFilters);
  };

  // 应用搜索和筛选
  const applyFiltersAndSearch = (term: string, filterOptions: FilterOptions) => {
    setLoading(true);
    
    // 先按名称搜索
    let results = term 
      ? CardService.searchCardsByName(term)
      : CardService.getAllCards();
    
    // 再应用筛选条件
    if (Object.keys(filterOptions).length > 0) {
      results = CardService.filterCards(filterOptions).filter(card => 
        results.some(c => c.id === card.id)
      );
    }
    
    setFilteredCards(results);
    setLoading(false);
  };

  // 处理卡牌更新
  const handleCardUpdate = (updatedCard: Card) => {
    try {
      // 更新卡牌数据
      const success = CardService.updateCard(updatedCard);
      
      if (success) {
        // 更新本地状态
        const updatedCards = cards.map(card => 
          card.id === updatedCard.id ? updatedCard : card
        );
        setCards(updatedCards);
        
        // 更新筛选后的卡牌列表
        const updatedFilteredCards = filteredCards.map(card => 
          card.id === updatedCard.id ? updatedCard : card
        );
        setFilteredCards(updatedFilteredCards);
        
        // 更新统计信息
        const cardStats = CardService.getCardStats();
        setStats(cardStats);
        
        toast.success(`卡牌 "${updatedCard.name}" 更新成功`);
      } else {
        toast.error('更新卡牌失败');
      }
    } catch (error) {
      console.error('更新卡牌时出错:', error);
      toast.error('更新卡牌时出错');
    }
  };

  // 处理导入完成
  const handleImportComplete = (importedCards: Card[]) => {
    try {
      // 从 CardService 获取最新的完整卡牌列表
      const allCards = CardService.getAllCards();
      setCards(allCards);
      
      // 如果没有筛选条件，显示所有卡牌
      if (searchTerm === '' && Object.keys(filters).length === 0) {
        setFilteredCards(allCards);
      } else {
        // 如果有筛选条件，重新应用筛选
        applyFiltersAndSearch(searchTerm, filters);
      }
      
      // 更新统计信息
      const cardStats = CardService.getCardStats();
      setStats(cardStats);
      
      // 隐藏导入面板
      setShowImport(false);
    } catch (error) {
      console.error('更新卡牌列表时出错:', error);
      toast.error('更新卡牌列表时出错');
    }
  };

  // 切换导入面板显示状态
  const toggleImportPanel = () => {
    setShowImport(!showImport);
  };

  // 显示清空数据库确认对话框
  const showClearDatabaseConfirm = () => {
    setShowClearConfirm(true);
    setKeepSampleCards(false); // 默认不保留示例卡牌
  };

  // 取消清空数据库
  const cancelClearDatabase = () => {
    setShowClearConfirm(false);
  };

  // 确认清空数据库
  const confirmClearDatabase = () => {
    try {
      // 清空数据库
      const previousCount = CardService.clearDatabase(keepSampleCards);
      
      // 重新加载数据
      const allCards = CardService.getAllCards();
      setCards(allCards);
      setFilteredCards(allCards);
      
      // 更新统计信息
      const cardStats = CardService.getCardStats();
      setStats(cardStats);
      
      // 显示成功消息
      if (keepSampleCards) {
        toast.success(`数据库已重置为示例数据，删除了 ${previousCount - allCards.length} 张卡牌`);
      } else {
        toast.success(`数据库已完全清空，删除了 ${previousCount} 张卡牌`);
      }
      
      // 隐藏确认对话框
      setShowClearConfirm(false);
    } catch (error) {
      console.error('清空数据库时出错:', error);
      toast.error('清空数据库时出错');
    }
  };

  // 切换是否保留示例卡牌
  const toggleKeepSampleCards = () => {
    setKeepSampleCards(!keepSampleCards);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>农场主卡牌助手</title>
        <meta name="description" content="农场主桌游卡牌查询和管理工具" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="bg-primary-700 text-white shadow-md">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">农场主卡牌助手</h1>
          <p className="mt-2 text-primary-100">查询和管理您的农场主卡牌</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* 卡牌统计 */}
        <CardStats stats={stats} />
        
        {/* 操作按钮 */}
        <div className="flex justify-end mb-6 space-x-4">
          <button
            onClick={showClearDatabaseConfirm}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            清空数据库
          </button>
          
          <button
            onClick={toggleImportPanel}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {showImport ? '隐藏导入面板' : '导入卡牌数据'}
          </button>
        </div>
        
        {/* 导入面板 */}
        {showImport && (
          <div className="mb-6">
            <CardImport onImportComplete={handleImportComplete} />
          </div>
        )}
        
        {/* 清空数据库确认对话框 */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-4">确认清空数据库</h3>
              <p className="text-gray-700 mb-4">
                您确定要清空数据库吗？此操作将删除所有导入的卡牌数据。此操作不可撤销。
              </p>
              
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={keepSampleCards}
                    onChange={toggleKeepSampleCards}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-gray-700">保留示例卡牌</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  {keepSampleCards 
                    ? "将保留初始的示例卡牌，仅删除后续导入的卡牌" 
                    : "将完全清空数据库，包括初始的示例卡牌"}
                </p>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  onClick={cancelClearDatabase}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200"
                >
                  取消
                </button>
                <button
                  onClick={confirmClearDatabase}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                >
                  确认清空
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            {/* 卡牌搜索 */}
            <CardSearch onSearch={handleSearch} />
            
            {/* 卡牌筛选 */}
            <CardFilter onFilter={handleFilter} />
          </div>
          
          <div className="lg:col-span-2">
            {/* 卡牌列表 */}
            <CardList 
              cards={filteredCards} 
              loading={loading} 
              onCardUpdate={handleCardUpdate}
            />
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} 农场主卡牌助手</p>
        </div>
      </footer>

      {/* 通知组件 */}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
} 