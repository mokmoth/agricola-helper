/**
 * Agricola卡牌数据库 - 本地IndexedDB实现
 * 
 * 功能：
 * - 将提取的卡牌数据存储到本地IndexedDB数据库
 * - 提供增删改查API
 * - 支持按各种条件查询卡牌
 * - 支持导入/导出数据
 * 
 * 使用方法：
 * 1. 引入此脚本
 * 2. 使用AgricolaCardDB类的方法操作数据库
 */

class AgricolaCardDB {
  constructor() {
    this.dbName = 'agricola_cards_db';
    this.dbVersion = 1;
    this.db = null;
    this.isInitialized = false;
  }

  /**
   * 初始化数据库
   * @returns {Promise} 初始化完成的Promise
   */
  async init() {
    if (this.isInitialized) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = (event) => {
        console.error('数据库打开失败:', event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.isInitialized = true;
        console.log('数据库连接成功');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // 创建卡牌存储对象
        if (!db.objectStoreNames.contains('cards')) {
          const cardsStore = db.createObjectStore('cards', { keyPath: 'id' });
          
          // 创建索引以便快速查询
          cardsStore.createIndex('type', 'type', { unique: false });
          cardsStore.createIndex('deck', 'deck', { unique: false });
          cardsStore.createIndex('category', 'category', { unique: false });
          cardsStore.createIndex('zhName', 'zhName', { unique: false });
          cardsStore.createIndex('numbering', 'numbering', { unique: false });
          cardsStore.createIndex('players', 'players', { unique: false });
          
          console.log('数据库结构创建完成');
        }
      };
    });
  }

  /**
   * 添加单张卡牌
   * @param {Object} card 卡牌数据对象
   * @returns {Promise} 添加完成的Promise
   */
  async addCard(card) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['cards'], 'readwrite');
      const cardsStore = transaction.objectStore('cards');
      
      const request = cardsStore.add(card);
      
      request.onsuccess = () => {
        console.log(`卡牌 ${card.id} 添加成功`);
        resolve();
      };
      
      request.onerror = (event) => {
        console.error(`卡牌 ${card.id} 添加失败:`, event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * 批量添加卡牌
   * @param {Array} cards 卡牌数据对象数组
   * @returns {Promise} 添加完成的Promise
   */
  async addCards(cards) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['cards'], 'readwrite');
      const cardsStore = transaction.objectStore('cards');
      
      let successCount = 0;
      let errorCount = 0;
      
      transaction.oncomplete = () => {
        console.log(`批量添加完成: ${successCount}张卡牌添加成功, ${errorCount}张卡牌添加失败`);
        resolve({ success: successCount, error: errorCount });
      };
      
      transaction.onerror = (event) => {
        console.error('批量添加事务失败:', event.target.error);
        reject(event.target.error);
      };
      
      cards.forEach(card => {
        const request = cardsStore.put(card); // 使用put而不是add，以便支持更新
        
        request.onsuccess = () => {
          successCount++;
        };
        
        request.onerror = (event) => {
          console.error(`卡牌 ${card.id} 添加失败:`, event.target.error);
          errorCount++;
        };
      });
    });
  }

  /**
   * 获取单张卡牌
   * @param {String} id 卡牌ID
   * @returns {Promise} 包含卡牌数据的Promise
   */
  async getCard(id) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['cards'], 'readonly');
      const cardsStore = transaction.objectStore('cards');
      
      const request = cardsStore.get(id);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error(`获取卡牌 ${id} 失败:`, event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * 更新卡牌
   * @param {Object} card 卡牌数据对象
   * @returns {Promise} 更新完成的Promise
   */
  async updateCard(card) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['cards'], 'readwrite');
      const cardsStore = transaction.objectStore('cards');
      
      const request = cardsStore.put(card);
      
      request.onsuccess = () => {
        console.log(`卡牌 ${card.id} 更新成功`);
        resolve();
      };
      
      request.onerror = (event) => {
        console.error(`卡牌 ${card.id} 更新失败:`, event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * 删除卡牌
   * @param {String} id 卡牌ID
   * @returns {Promise} 删除完成的Promise
   */
  async deleteCard(id) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['cards'], 'readwrite');
      const cardsStore = transaction.objectStore('cards');
      
      const request = cardsStore.delete(id);
      
      request.onsuccess = () => {
        console.log(`卡牌 ${id} 删除成功`);
        resolve();
      };
      
      request.onerror = (event) => {
        console.error(`卡牌 ${id} 删除失败:`, event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * 获取所有卡牌
   * @returns {Promise} 包含所有卡牌数据的Promise
   */
  async getAllCards() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['cards'], 'readonly');
      const cardsStore = transaction.objectStore('cards');
      
      const request = cardsStore.getAll();
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error('获取所有卡牌失败:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * 按类型查询卡牌
   * @param {String} type 卡牌类型 (occupation, minor, major, action)
   * @returns {Promise} 包含查询结果的Promise
   */
  async getCardsByType(type) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['cards'], 'readonly');
      const cardsStore = transaction.objectStore('cards');
      const typeIndex = cardsStore.index('type');
      
      const request = typeIndex.getAll(type);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error(`按类型 ${type} 查询卡牌失败:`, event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * 按牌组查询卡牌
   * @param {String} deck 牌组 (A, B, C, D, E, 0)
   * @returns {Promise} 包含查询结果的Promise
   */
  async getCardsByDeck(deck) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['cards'], 'readonly');
      const cardsStore = transaction.objectStore('cards');
      const deckIndex = cardsStore.index('deck');
      
      const request = deckIndex.getAll(deck);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error(`按牌组 ${deck} 查询卡牌失败:`, event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * 按类别查询卡牌
   * @param {String} category 卡牌类别
   * @returns {Promise} 包含查询结果的Promise
   */
  async getCardsByCategory(category) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['cards'], 'readonly');
      const cardsStore = transaction.objectStore('cards');
      const categoryIndex = cardsStore.index('category');
      
      const request = categoryIndex.getAll(category);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error(`按类别 ${category} 查询卡牌失败:`, event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * 按名称搜索卡牌（模糊匹配）
   * @param {String} name 卡牌名称关键词
   * @returns {Promise} 包含查询结果的Promise
   */
  async searchCardsByName(name) {
    const allCards = await this.getAllCards();
    const keyword = name.toLowerCase();
    
    return allCards.filter(card => 
      card.zhName && card.zhName.toLowerCase().includes(keyword)
    );
  }

  /**
   * 按描述搜索卡牌（模糊匹配）
   * @param {String} text 描述关键词
   * @returns {Promise} 包含查询结果的Promise
   */
  async searchCardsByDescription(text) {
    const allCards = await this.getAllCards();
    const keyword = text.toLowerCase();
    
    return allCards.filter(card => 
      card.zhDesc && card.zhDesc.some(desc => 
        desc.toLowerCase().includes(keyword)
      )
    );
  }

  /**
   * 高级搜索卡牌
   * @param {Object} criteria 搜索条件
   * @returns {Promise} 包含查询结果的Promise
   */
  async advancedSearch(criteria) {
    const allCards = await this.getAllCards();
    
    return allCards.filter(card => {
      // 检查每个搜索条件
      for (const key in criteria) {
        if (criteria[key] === undefined || criteria[key] === null) continue;
        
        if (key === 'nameKeyword' && criteria[key]) {
          if (!card.zhName || !card.zhName.toLowerCase().includes(criteria[key].toLowerCase())) {
            return false;
          }
        } else if (key === 'descKeyword' && criteria[key]) {
          if (!card.zhDesc || !card.zhDesc.some(desc => 
            desc.toLowerCase().includes(criteria[key].toLowerCase())
          )) {
            return false;
          }
        } else if (key === 'costResource' && criteria[key]) {
          // 检查卡牌是否包含特定资源成本
          if (!card.costResources || !card.costResources.some(resource => 
            resource.type === criteria[key]
          )) {
            return false;
          }
        } else if (key === 'minVp' && criteria[key] !== undefined) {
          // 检查最小胜利点数
          if (card.vp < criteria[key]) {
            return false;
          }
        } else if (key === 'maxVp' && criteria[key] !== undefined) {
          // 检查最大胜利点数
          if (card.vp > criteria[key]) {
            return false;
          }
        } else if (key === 'players' && criteria[key]) {
          // 检查玩家数量要求
          if (card.players !== 'all' && !card.players.startsWith(criteria[key])) {
            return false;
          }
        } else if (criteria[key] && card[key] !== criteria[key]) {
          // 其他精确匹配条件
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * 清空数据库
   * @returns {Promise} 清空完成的Promise
   */
  async clearDatabase() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['cards'], 'readwrite');
      const cardsStore = transaction.objectStore('cards');
      
      const request = cardsStore.clear();
      
      request.onsuccess = () => {
        console.log('数据库已清空');
        resolve();
      };
      
      request.onerror = (event) => {
        console.error('清空数据库失败:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * 导入JSON数据
   * @param {String|Object} jsonData JSON字符串或对象
   * @returns {Promise} 导入完成的Promise
   */
  async importFromJSON(jsonData) {
    let cards;
    
    if (typeof jsonData === 'string') {
      try {
        cards = JSON.parse(jsonData);
      } catch (error) {
        return Promise.reject(new Error('JSON解析失败: ' + error.message));
      }
    } else {
      cards = jsonData;
    }
    
    if (!Array.isArray(cards)) {
      return Promise.reject(new Error('导入数据必须是数组'));
    }
    
    return this.addCards(cards);
  }

  /**
   * 导出为JSON
   * @returns {Promise} 包含JSON字符串的Promise
   */
  async exportToJSON() {
    const cards = await this.getAllCards();
    return JSON.stringify(cards, null, 2);
  }

  /**
   * 获取数据库统计信息
   * @returns {Promise} 包含统计信息的Promise
   */
  async getStats() {
    const allCards = await this.getAllCards();
    
    // 按类型统计
    const typeStats = {};
    allCards.forEach(card => {
      typeStats[card.type] = (typeStats[card.type] || 0) + 1;
    });
    
    // 按牌组统计
    const deckStats = {};
    allCards.forEach(card => {
      if (card.deck) {
        deckStats[card.deck] = (deckStats[card.deck] || 0) + 1;
      }
    });
    
    // 按类别统计
    const categoryStats = {};
    allCards.forEach(card => {
      if (card.category) {
        categoryStats[card.category] = (categoryStats[card.category] || 0) + 1;
      }
    });
    
    return {
      totalCards: allCards.length,
      typeStats,
      deckStats,
      categoryStats
    };
  }
}

// 导出数据库类
window.AgricolaCardDB = AgricolaCardDB; 