// 清除示例卡牌脚本

// 获取当前存储的卡牌数据
const CARDS_STORAGE_KEY = 'agricola_helper_cards';
const cardsData = localStorage.getItem(CARDS_STORAGE_KEY);

if (!cardsData) {
  console.log('没有找到卡牌数据');
} else {
  try {
    // 解析卡牌数据
    const cards = JSON.parse(cardsData);
    console.log(`当前有 ${cards.length} 张卡牌`);
    
    // 过滤掉示例卡牌
    const filteredCards = cards.filter(card => card.deck !== 'sample');
    console.log(`过滤后剩余 ${filteredCards.length} 张卡牌`);
    
    // 保存过滤后的卡牌
    localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(filteredCards));
    console.log('已成功移除所有示例卡牌');
  } catch (error) {
    console.error('处理卡牌数据时出错:', error);
  }
} 