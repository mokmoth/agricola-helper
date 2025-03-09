/**
 * Agricola卡牌数据提取脚本 - 增强版
 * 
 * 使用方法：
 * 1. 在Board Game Arena的Agricola游戏回放页面打开浏览器控制台(F12)
 * 2. 复制粘贴此脚本到控制台并运行
 * 3. 脚本将自动提取页面上所有可见的卡牌数据并下载为JSON文件
 * 
 * 特点：
 * - 支持提取卡牌描述中的资源图标
 * - 将图标转换为文本表示，使描述更加完整
 * - 提取卡牌成本信息、前置条件、卡牌类别和卡牌组
 */

(function extractAgricolaCardData() {
  console.log('Starting Agricola card data extraction (Enhanced version)...');
  
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
    'food': '[食物]',
    'sheep': '[羊]',
    'boar': '[猪]',
    'cattle': '[牛]',
    'family': '[家庭成员]',
    'point': '[分数]',
    'stable': '[畜棚]',
    'pasture': '[牧场]',
    'field': '[农田]',
    'room': '[房间]',
    'fence': '[栅栏]'
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
  
  // 提取常规卡牌数据（职业卡、小改良卡、大改良卡）
  function extractRegularCards() {
    // 查找所有卡牌元素
    const cardElements = document.querySelectorAll('[class*="player-card"]');
    console.log(`Found ${cardElements.length} card elements`);
    
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
        
        // 提取中文名称
        const titleElement = cardElement.querySelector('.card-title');
        const zhName = titleElement ? titleElement.textContent.trim() : '';
        
        // 提取中文描述 - 增强版
        const descElement = cardElement.querySelector('.card-desc');
        let zhDesc = [];
        if (descElement) {
          const descText = processDescriptionElement(descElement).trim();
          if (descText) {
            zhDesc = [descText];
          }
        }
        
        // 提取卡牌类别
        const categoryElement = cardElement.querySelector('.card-category');
        let category = '';
        let categoryText = '';
        if (categoryElement) {
          category = categoryElement.dataset.category || '';
          categoryText = CATEGORY_MAP[category] || category;
          
          // 如果没有找到映射，尝试根据类别名称推断中文翻译
          if (categoryText === category && category) {
            // 移除Category后缀
            const baseName = category.replace(/Category$/, '');
            
            // 常见词汇映射
            const commonTerms = {
              'Crop': '谷物',
              'Animal': '动物',
              'Food': '食物',
              'Resource': '资源',
              'Building': '建筑',
              'Farm': '农场',
              'Tool': '工具',
              'Action': '行动',
              'Livestock': '畜牧',
              'Points': '得分',
              'Booster': '增强',
              'Goods': '商品',
              'Bonus': '奖励'
            };
            
            // 尝试翻译
            if (commonTerms[baseName]) {
              categoryText = commonTerms[baseName] + '类别';
            }
          }
        }
        
        // 提取胜利点数
        const vpElement = cardElement.querySelector('.card-bonus-vp-counter');
        let vp = 0;
        if (vpElement && vpElement.textContent) {
          const vpMatch = vpElement.textContent.match(/(\d+)/);
          if (vpMatch) {
            vp = parseInt(vpMatch[1], 10);
          }
        }
        
        // 提取成本信息
        const costElement = cardElement.querySelector('.card-cost');
        let costText = '';
        let costResources = [];
        if (costElement) {
          costText = processDescriptionElement(costElement).trim();
          
          // 提取具体的资源成本
          const meepleContainers = costElement.querySelectorAll('.meeple-container');
          meepleContainers.forEach(container => {
            const meepleElement = container.querySelector('[class*="meeple-"]');
            if (meepleElement) {
              const classes = Array.from(meepleElement.classList);
              const resourceClass = classes.find(cls => cls.startsWith('meeple-'));
              if (resourceClass) {
                const resourceType = resourceClass.replace('meeple-', '');
                const countElement = container.querySelector('.agricola-meeple');
                let count = 1;
                if (countElement && countElement.textContent) {
                  const countMatch = countElement.textContent.match(/(\d+)/);
                  if (countMatch) {
                    count = parseInt(countMatch[1], 10);
                  }
                }
                costResources.push({
                  type: resourceType,
                  count: count
                });
              }
            }
          });
        }
        
        // 提取前置条件
        const prerequisiteElement = cardElement.querySelector('.card-prerequisite');
        let prerequisiteText = '';
        if (prerequisiteElement) {
          prerequisiteText = processDescriptionElement(prerequisiteElement).trim();
        }
        
        // 提取玩家数量要求
        const playersElement = cardElement.querySelector('.card-players');
        let players = 'all';
        if (playersElement && playersElement.dataset.n) {
          players = playersElement.dataset.n + '+';
        }
        
        // 提取牌组信息
        const deckElement = cardElement.querySelector('.card-deck');
        let deck = 'unknown';
        if (deckElement && deckElement.dataset.deck) {
          deck = deckElement.dataset.deck;
        } else if (numbering && numbering.length > 0) {
          deck = numbering.charAt(0);
        }
        
        // 构建卡牌对象
        const card = {
          id,
          numbering,
          type,
          zhName,
          zhDesc,
          category,
          categoryText,
          vp,
          costText,
          costResources,
          prerequisiteText,
          players,
          deck
        };
        
        cards.push(card);
        console.log(`Extracted card: ${zhName} (${id})`);
      } catch (error) {
        console.error(`Error processing card:`, error);
      }
    });
  }
  
  // 提取动作卡牌
  function extractActionCards() {
    const actionCardElements = document.querySelectorAll('.action-card-name-reference');
    console.log(`Found ${actionCardElements.length} action card elements`);
    
    actionCardElements.forEach((element, index) => {
      try {
        const zhName = element.textContent.trim();
        if (!zhName) return;
        
        // 为动作卡牌创建一个唯一ID
        const id = `action_${zhName.replace(/\s+/g, '_')}`;
        
        // 如果已处理过此ID，则跳过
        if (processedIds.has(id)) return;
        processedIds.add(id);
        
        // 构建动作卡牌对象
        const card = {
          id,
          type: 'action',
          zhName,
          zhDesc: [],
          category: 'ActionCategory',
          categoryText: '行动类别',
          vp: 0
        };
        
        cards.push(card);
        console.log(`Extracted action card: ${zhName}`);
      } catch (error) {
        console.error(`Error processing action card:`, error);
      }
    });
  }
  
  // 下载数据为JSON文件
  function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
  
  // 执行提取过程
  try {
    extractRegularCards();
    extractActionCards();
    
    // 清理描述文本
    const cleanedCards = cleanDescription(cards);
    
    console.log(`Successfully extracted ${cleanedCards.length} cards`);
    
    // 下载提取的数据
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadJSON(cleanedCards, `agricola_cards_enhanced_${timestamp}.json`);
    
    // 在控制台中显示数据
    console.table(cleanedCards.map(card => ({
      id: card.id,
      type: card.type,
      zhName: card.zhName,
      prerequisite: card.prerequisiteText || '-',
      cost: card.costText || '-',
      category: card.categoryText || '-',
      deck: card.deck || '-'
    })));
    
    console.log('Card data extraction complete, JSON file downloaded');
    console.log('Note: This enhanced version script correctly processes resource icons, prerequisites, costs, and categories');
  } catch (error) {
    console.error('Error extracting card data:', error);
  }
})(); 