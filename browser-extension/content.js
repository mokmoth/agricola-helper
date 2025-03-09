/**
 * Agricola卡牌助手 - 内容脚本
 * 
 * 负责与页面交互，提取卡牌数据并存储到数据库
 */

// 初始化数据库
let cardDB = null;

// 检查当前页面是否是Agricola游戏页面
function isAgricolaPage() {
  // 检查URL是否包含boardgamearena.com和agricola或archive/replay
  const isAgricolaUrl = window.location.href.includes('boardgamearena.com') && 
    (window.location.href.includes('agricola') || 
     (window.location.href.includes('archive/replay') && document.body.textContent.includes('Agricola')));
  
  // 检查页面上是否有Agricola相关元素
  const hasAgricolaElements = document.querySelectorAll('[class*="player-card"]').length > 0 || 
                             document.querySelectorAll('.action-card-name-reference').length > 0;
  
  console.log('URL检查:', isAgricolaUrl);
  console.log('元素检查:', hasAgricolaElements);
  
  return isAgricolaUrl || hasAgricolaElements;
}

// 初始化函数
async function initializeDB() {
  if (!cardDB) {
    cardDB = new AgricolaCardDB();
    await cardDB.init();
    console.log('Agricola卡牌数据库初始化成功');
  }
  return cardDB;
}

// 检查卡牌信息是否完整
function isCardComplete(card) {
  // 检查必要的字段
  if (!card) return false;
  
  // 检查是否有ID
  const hasId = card.id && card.id.trim().length > 0;
  
  // 检查是否有类型
  const hasType = card.type && ['occupation', 'minor', 'major', 'action'].includes(card.type);
  
  // 检查是否有中文名称
  const hasChineseName = card.zhName && card.zhName.trim().length > 0;
  
  // 检查是否有中文描述
  const hasChineseDesc = card.zhDesc && Array.isArray(card.zhDesc) && card.zhDesc.length > 0;
  
  // 返回是否完整（必须同时具有ID、类型、中文名称和中文描述）
  return hasId && hasType && hasChineseName && hasChineseDesc;
}

// 提取卡牌数据并增量更新数据库
async function extractAndUpdateCards() {
  try {
    // 检查是否是Agricola游戏页面
    if (!isAgricolaPage()) {
      return {
        success: false,
        error: '当前页面不是Agricola游戏回放页面，无法提取卡牌数据'
      };
    }
    
    console.log('开始提取卡牌数据...');
    
    // 初始化数据库
    const db = await initializeDB();
    if (!db) {
      console.error('数据库初始化失败');
      return {
        success: false,
        error: '数据库初始化失败'
      };
    }
    
    // 存储提取的卡牌数据
    const cards = [];
    const processedIds = new Set();
    
    // 资源类型映射表
    const RESOURCE_MAP = {
      'wood': '[木材]',
      'clay': '[黏土]',
      'reed': '[芦苇]',
      'stone': '[石头]',
      'grain': '[谷物]',
      'vegetable': '[蔬菜]',
      'sheep': '[羊]',
      'boar': '[野猪]',
      'cattle': '[牛]',
      'food': '[食物]',
      'family': '[家庭成员]'
    };
    
    // 类别映射表 - 增强版
    const CATEGORY_MAP = {
      // 基础类别
      'CropCategory': '谷物类别',
      'AnimalCategory': '动物类别',
      'FoodCategory': '食物类别',
      'ResourceCategory': '资源类别',
      'BuildingCategory': '建筑类别',
      'FarmCategory': '农场类别',
      'ToolCategory': '工具类别',
      'ActionCategory': '行动类别',
      
      // 扩展类别
      'LivestockCategory': '畜牧类别',
      'PointsCategory': '得分类别',
      'BoosterCategory': '增强类别',
      'GoodsCategory': '商品类别',
      'FOOD_-_FUTURE_ROUND_SPACES': '食物-未来回合',
      'ACTION_-_FAMILY_GROWTH': '行动-家庭成长',
      'GOODS_-_GET': '商品-获取',
      'BUILDING_RESOURCES_-_WOOD': '建筑资源-木材',
      'BONUS_POINTS': '奖励分数',
      'food': '食物类别',
      
      // 其他可能的类别
      'FOOD_-_COOKING': '食物-烹饪',
      'FOOD_-_CONVERSION': '食物-转换',
      'ANIMAL_-_SHEEP': '动物-羊',
      'ANIMAL_-_BOAR': '动物-猪',
      'ANIMAL_-_CATTLE': '动物-牛',
      'FIELD_-_GRAIN': '农田-谷物',
      'FIELD_-_VEGETABLE': '农田-蔬菜',
      'BUILDING_RESOURCES_-_CLAY': '建筑资源-黏土',
      'BUILDING_RESOURCES_-_REED': '建筑资源-芦苇',
      'BUILDING_RESOURCES_-_STONE': '建筑资源-石头',
      'ACTION_-_PLOW': '行动-耕作',
      'ACTION_-_SOW': '行动-播种',
      'ACTION_-_BAKE': '行动-烤面包',
      'ACTION_-_FENCE': '行动-栅栏',
      'ACTION_-_STABLE': '行动-畜棚',
      'ACTION_-_RENOVATION': '行动-翻修',
      'ACTION_-_ROOM': '行动-房间',
      'ACTION_-_MAJOR_IMPROVEMENT': '行动-主要改良',
      'ACTION_-_MINOR_IMPROVEMENT': '行动-次要改良',
      'ACTION_-_OCCUPATION': '行动-职业'
    };
    
    // 处理描述元素及其子元素的函数
    function processDescriptionElement(element) {
      let result = '';
      
      // 如果是文本节点，直接返回文本内容
      if (!element || element.nodeType === Node.TEXT_NODE) {
        return element ? element.textContent : '';
      }
      
      // 处理所有子节点
      Array.from(element.childNodes).forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          // 文本节点直接添加
          result += node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          // 元素节点
          if (node.classList.contains('meeple-container')) {
            // 处理资源图标容器
            const meepleElement = node.querySelector('[class*="meeple-"]');
            if (meepleElement) {
              // 从类名中提取资源类型
              const classes = Array.from(meepleElement.classList);
              const resourceClass = classes.find(cls => cls.startsWith('meeple-'));
              if (resourceClass) {
                const resourceType = resourceClass.replace('meeple-', '');
                // 将资源类型转换为文本表示
                result += RESOURCE_MAP[resourceType] || `[${resourceType}]`;
              }
            }
          } else {
            // 递归处理其他元素
            result += processDescriptionElement(node);
          }
        }
      });
      
      return result;
    }
    
    // 提取常规卡牌
    function extractRegularCards() {
      // 查找所有卡牌元素
      const cardElements = document.querySelectorAll('[class*="player-card"]');
      console.log(`Found ${cardElements.length} card elements`);
      
      const extractedCards = [];
      
      cardElements.forEach(cardElement => {
        try {
          // 提取基本信息
          const id = cardElement.dataset.id || '';
          const numbering = cardElement.dataset.numbering || '';
          
          // 如果已处理过此ID或ID为空，则跳过
          if (!id || processedIds.has(id)) return;
          processedIds.add(id);
          
          // 确定卡牌类型
          let type = 'unknown';
          if (cardElement.classList.contains('occupation')) {
            type = 'occupation';
          } else if (cardElement.classList.contains('minor')) {
            type = 'minor';
          } else if (cardElement.classList.contains('major')) {
            type = 'major';
          }
          
          // 提取卡牌名称（英文）
          const nameElement = cardElement.querySelector('.name');
          const name = nameElement ? nameElement.textContent.trim() : '';
          
          // 提取卡牌描述（英文）
          const descriptionElement = cardElement.querySelector('.description');
          const description = descriptionElement ? processDescriptionElement(descriptionElement) : '';
          
          // 提取中文名称
          const zhNameElement = cardElement.querySelector('.card-title');
          const zhName = zhNameElement ? zhNameElement.textContent.trim() : '';
          
          // 提取中文描述
          const zhDescElement = cardElement.querySelector('.card-desc');
          let zhDesc = [];
          if (zhDescElement) {
            const zhDescText = processDescriptionElement(zhDescElement);
            if (zhDescText && zhDescText.trim().length > 0) {
              zhDesc = [zhDescText.trim()];
            }
          }
          
          // 提取牌组信息
          const deckElement = cardElement.querySelector('.deck');
          const deck = deckElement ? deckElement.textContent.trim() : '';
          
          // 提取前置条件
          const prerequisiteElement = cardElement.querySelector('.prerequisite');
          const prerequisiteText = prerequisiteElement ? prerequisiteElement.textContent.trim() : '';
          
          // 提取玩家数
          const playersElement = cardElement.querySelector('.players');
          const players = playersElement ? playersElement.textContent.trim() : '';
          
          // 提取分类
          const categoryElement = cardElement.querySelector('.category');
          const category = categoryElement ? categoryElement.textContent.trim() : '';
          
          // 提取分数
          const pointsElement = cardElement.querySelector('.points');
          const points = pointsElement ? pointsElement.textContent.trim() : '';
          
          // 创建卡牌对象
          const card = {
            id,
            numbering,
            type,
            name,
            description,
            zhName,
            zhDesc,
            deck,
            prerequisiteText,
            players,
            category,
            points
          };
          
          // 添加到结果数组
          extractedCards.push(card);
        } catch (error) {
          console.error('Error extracting card:', error);
        }
      });
      
      return extractedCards;
    }
    
    // 提取动作卡牌
    function extractActionCards() {
      // 查找所有行动卡元素
      const actionElements = document.querySelectorAll('.action-card');
      console.log(`Found ${actionElements.length} action card elements`);
      
      const extractedCards = [];
      
      actionElements.forEach(actionElement => {
        try {
          // 生成唯一ID
          const id = 'action_' + Math.random().toString(36).substring(2, 15);
          
          // 如果已处理过此ID，则跳过
          if (processedIds.has(id)) return;
          processedIds.add(id);
          
          // 提取卡牌名称（英文）
          const nameElement = actionElement.querySelector('.name');
          const name = nameElement ? nameElement.textContent.trim() : '';
          
          // 提取卡牌描述（英文）
          const descriptionElement = actionElement.querySelector('.description');
          const description = descriptionElement ? processDescriptionElement(descriptionElement) : '';
          
          // 提取中文名称
          const zhNameElement = actionElement.querySelector('.action-card-name-reference');
          const zhName = zhNameElement ? zhNameElement.textContent.trim() : '';
          
          // 提取中文描述（行动卡通常没有详细描述，使用名称作为描述）
          const zhDesc = zhName ? [zhName] : [];
          
          // 创建卡牌对象
          const card = {
            id,
            type: 'action',
            name,
            description,
            zhName,
            zhDesc
          };
          
          // 添加到结果数组
          extractedCards.push(card);
        } catch (error) {
          console.error('Error extracting action card:', error);
        }
      });
      
      return extractedCards;
    }
    
    // 清理描述文本，移除多余的空白字符
    function cleanDescription(cards) {
      cards.forEach(card => {
        if (card.zhDesc && card.zhDesc.length > 0) {
          card.zhDesc = card.zhDesc.map(desc => 
            desc.replace(/\s+/g, ' ')
                .replace(/\n\s*/g, ' ')
                .trim()
          );
        }
      });
      return cards;
    }
    
    // 提取常规卡牌
    try {
      const regularCards = extractRegularCards() || [];
      console.log(`提取到 ${regularCards.length} 张常规卡牌`);
      cards.push(...regularCards);
    } catch (error) {
      console.error('提取常规卡牌失败:', error);
    }
    
    // 提取行动卡
    try {
      const actionCards = extractActionCards() || [];
      console.log(`提取到 ${actionCards.length} 张行动卡`);
      cards.push(...actionCards);
    } catch (error) {
      console.error('提取行动卡失败:', error);
    }
    
    // 清理描述文本
    try {
      cleanDescription(cards);
    } catch (error) {
      console.error('清理描述文本失败:', error);
    }
    
    console.log(`总共提取到 ${cards.length} 张卡牌`);
    
    // 输出前5张卡牌的详细信息，用于调试
    if (cards.length > 0) {
      console.log('前5张卡牌的详细信息:');
      cards.slice(0, 5).forEach((card, index) => {
        console.log(`卡牌 #${index + 1} (${card.id}):`);
        console.log('  字段:', Object.keys(card).join(', '));
        console.log('  类型:', card.type);
        console.log('  中文名称:', card.zhName || '无');
        console.log('  中文描述:', card.zhDesc ? JSON.stringify(card.zhDesc) : '无');
        console.log('  完整性检查:', isCardComplete(card) ? '通过' : '不通过');
        if (!isCardComplete(card)) {
          console.log('  不通过原因:',
            !card.id ? '缺少ID' : '',
            !card.type || !['occupation', 'minor', 'major', 'action'].includes(card.type) ? '类型无效' : '',
            !card.zhName || card.zhName.trim().length === 0 ? '缺少中文名称' : '',
            !card.zhDesc || !Array.isArray(card.zhDesc) || card.zhDesc.length === 0 ? '缺少中文描述' : ''
          );
        }
      });
    }
    
    // 过滤出信息完整的卡牌
    const completeCards = cards.filter(isCardComplete);
    console.log(`其中信息完整的卡牌有 ${completeCards.length} 张`);
    
    if (completeCards.length === 0) {
      return {
        success: false,
        error: '未能提取到任何信息完整的卡牌数据（需要同时具有ID、类型、中文名称和中文描述）'
      };
    }
    
    // 更新数据库
    const newCards = [];
    const existingCards = [];
    
    for (const card of completeCards) {
      if (!card || !card.id) continue;
      
      try {
        // 检查卡牌是否已存在
        const existingCard = await db.getCard(card.id);
        if (existingCard) {
          existingCards.push(card);
        } else {
          newCards.push(card);
          await db.addCard(card);
        }
      } catch (error) {
        console.error(`处理卡牌 ${card.id} 失败:`, error);
      }
    }
    
    console.log(`新增 ${newCards.length} 张卡牌，已存在 ${existingCards.length} 张卡牌`);
    
    // 获取所有卡牌并保存到Chrome存储中
    try {
      // 获取所有卡牌
      const allCards = await db.getAllCards();
      console.log(`数据库中共有 ${allCards ? allCards.length : 0} 张卡牌（包括可能的不完整卡牌）`);
      
      // 清理不完整的卡牌
      const completeCardsInDB = allCards.filter(isCardComplete);
      console.log(`其中完整的卡牌有 ${completeCardsInDB.length} 张`);
      
      // 如果有不完整的卡牌，清理它们
      if (completeCardsInDB.length < allCards.length) {
        console.log(`发现 ${allCards.length - completeCardsInDB.length} 张不完整的卡牌，正在清理...`);
        
        // 清空数据库
        await db.clearDatabase();
        console.log('数据库已清空');
        
        // 重新添加完整的卡牌
        for (const card of completeCardsInDB) {
          await db.addCard(card);
        }
        console.log(`已重新添加 ${completeCardsInDB.length} 张完整的卡牌`);
        
        // 更新allCards变量
        const updatedCards = await db.getAllCards();
        console.log(`清理后数据库中共有 ${updatedCards.length} 张卡牌`);
        
        if (typeof chrome !== 'undefined' && chrome.storage) {
          console.log('正在保存清理后的卡牌数据到Chrome存储...');
          chrome.storage.local.set({ 'agricolaCards': updatedCards || [] }, function() {
            console.log('清理后的卡牌数据已保存到Chrome存储');
          });
        } else {
          console.warn('未检测到Chrome存储API，无法保存数据');
        }
      } else {
        // 如果没有不完整的卡牌，直接保存
        if (typeof chrome !== 'undefined' && chrome.storage) {
          console.log('正在保存卡牌数据到Chrome存储...');
          chrome.storage.local.set({ 'agricolaCards': completeCardsInDB || [] }, function() {
            console.log('卡牌数据已保存到Chrome存储');
          });
        } else {
          console.warn('未检测到Chrome存储API，无法保存数据');
        }
      }
    } catch (error) {
      console.error('获取或保存卡牌数据失败:', error);
      return {
        success: false,
        error: '获取或保存卡牌数据失败: ' + error.message
      };
    }
    
    return {
      success: true,
      totalCards: completeCards.length,
      newCards: newCards.length,
      existingCards: existingCards.length
    };
  } catch (error) {
    console.error('Error extracting cards:', error);
    return {
      success: false,
      error: error.message || '提取卡牌数据失败'
    };
  }
}

// 导出数据库为JSON
async function exportDatabaseToJSON() {
  try {
    // 初始化数据库
    const db = await initializeDB();
    
    // 获取所有卡牌
    const allCards = await db.getAllCards();
    
    // 保存到Chrome存储中
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ 'agricolaCards': allCards }, function() {
        console.log('卡牌数据已保存到Chrome存储');
      });
    }
    
    // 导出JSON
    const jsonData = await db.exportToJSON();
    
    // 创建下载
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = `agricola_cards_export_${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error exporting database:', error);
    return {
      success: false,
      error: error.message || '导出数据库失败'
    };
  }
}

// 获取数据库统计信息
async function getDatabaseStats() {
  try {
    // 初始化数据库
    const db = await initializeDB();
    
    // 获取所有卡牌
    const allCards = await db.getAllCards();
    
    // 过滤出完整的卡牌
    const completeCards = allCards.filter(isCardComplete);
    
    return {
      success: true,
      totalCards: completeCards.length,
      completeCards: completeCards.length,
      incompleteCards: allCards.length - completeCards.length
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return {
      success: false,
      error: error.message || '获取数据库统计失败'
    };
  }
}

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);
  
  if (message.action === 'extractCards') {
    extractAndUpdateCards().then(sendResponse);
    return true; // 异步响应
  } else if (message.action === 'exportDatabase') {
    exportDatabaseToJSON().then(sendResponse);
    return true; // 异步响应
  } else if (message.action === 'getDBStats') {
    getDatabaseStats().then(sendResponse);
    return true; // 异步响应
  } else if (message.action === 'checkAgricolaPage') {
    // 检查当前页面是否是Agricola游戏页面
    sendResponse({ isAgricolaPage: isAgricolaPage() });
    return false; // 同步响应
  }
});

// 初始化
(async function() {
  try {
    // 检查是否是Agricola游戏页面
    if (!isAgricolaPage()) {
      console.log('当前页面不是Agricola游戏回放页面，不加载卡牌助手');
      return;
    }
    
    console.log('检测到Agricola游戏回放页面，正在加载卡牌助手...');
    
    // 动态加载数据库脚本
    if (typeof AgricolaCardDB === 'undefined') {
      console.log('Loading AgricolaCardDB script...');
      
      // 创建脚本元素
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('agricolaCardDB.js');
      script.onload = function() {
        console.log('AgricolaCardDB script loaded successfully');
        initializeDB().then(() => {
          console.log('Agricola卡牌助手内容脚本已加载');
        });
      };
      script.onerror = function(error) {
        console.error('Failed to load AgricolaCardDB script:', error);
      };
      
      // 添加到文档
      (document.head || document.documentElement).appendChild(script);
    } else {
      await initializeDB();
      console.log('Agricola卡牌助手内容脚本已加载');
    }
  } catch (error) {
    console.error('初始化Agricola卡牌助手失败:', error);
  }
})(); 