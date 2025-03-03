import { Card, CardType } from '../models/Card';
import { CardDatabase } from '../database/CardDatabase';
import { sampleCards } from '../database/sampleCards';

/**
 * 卡牌服务类
 * 提供前端访问卡牌数据的API
 */
export class CardService {
  private static database: CardDatabase = new CardDatabase();
  private static cards: Card[] = [];

  // 初始化服务
  static initialize() {
    try {
      // 从数据库加载卡牌
      this.cards = this.database.getAllCards();
      
      // 不再自动加载示例卡牌
      
      console.log(`CardService 已初始化，加载了 ${this.cards.length} 张卡牌`);
    } catch (error) {
      console.error('初始化 CardService 时出错:', error);
      this.cards = [];
    }
  }

  // 使用示例数据
  private static readonly originalSampleCards: Card[] = [...sampleCards];

  /**
   * 获取所有卡牌
   * @returns 所有卡牌的数组
   */
  static getAllCards(): Card[] {
    return this.cards;
  }

  /**
   * 获取卡牌统计信息
   * @returns 卡牌统计信息
   */
  static getCardStats(): {
    total: number;
    occupation: number;
    minor: number;
    major: number;
  } {
    return {
      total: this.cards.length,
      occupation: this.cards.filter(card => card.type === CardType.OCCUPATION).length,
      minor: this.cards.filter(card => card.type === CardType.MINOR).length,
      major: this.cards.filter(card => card.type === CardType.MAJOR).length
    };
  }

  /**
   * 按名称搜索卡牌
   * @param name 卡牌名称（支持模糊搜索）
   * @returns 符合条件的卡牌数组
   */
  static searchCardsByName(name: string): Card[] {
    if (!name) return this.cards;
    
    const searchTerm = name.toLowerCase();
    return this.cards.filter(card => 
      card.name.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * 按条件筛选卡牌
   * @param filters 筛选条件
   * @returns 符合条件的卡牌数组
   */
  static filterCards(filters: {
    type?: CardType;
    deck?: string;
    players?: string;
    vp?: number;
    category?: string;
  }): Card[] {
    // 创建副本以避免修改原始数组
    let filteredCards = [...this.cards]; 
    
    // 应用所有筛选条件
    if (filters.type !== undefined) {
      filteredCards = filteredCards.filter(card => card.type === filters.type);
    }
    
    if (filters.deck !== undefined && filters.deck !== 'all') {
      if (filters.deck === 'unknown') {
        filteredCards = filteredCards.filter(card => 
          !card.deck || card.deck === '' || card.deck === 'unknown'
        );
      } else {
        filteredCards = filteredCards.filter(card => card.deck === filters.deck);
      }
    }
    
    if (filters.players !== undefined && filters.players !== 'all') {
      if (filters.players === 'unknown') {
        filteredCards = filteredCards.filter(card => 
          !card.players || card.players === '' || card.players === 'unknown'
        );
      } else {
        filteredCards = filteredCards.filter(card => card.players === filters.players);
      }
    }
    
    if (filters.vp !== undefined) {
      filteredCards = filteredCards.filter(card => card.vp === filters.vp);
    }
    
    if (filters.category !== undefined && filters.category !== 'all') {
      if (filters.category === 'unknown') {
        filteredCards = filteredCards.filter(card => 
          !card.category || card.category === ''
        );
      } else {
        filteredCards = filteredCards.filter(card => card.category === filters.category);
      }
    }
    
    return filteredCards;
  }

  /**
   * 获取所有可用的牌组
   * @returns 牌组列表
   */
  static getAvailableDecks(): string[] {
    const decks = new Set<string>();
    // 添加"全部"选项
    decks.add('all');
    // 添加"未知"选项
    decks.add('unknown');
    
    this.cards.forEach(card => {
      if (card.deck && card.deck !== 'unknown') {
        decks.add(card.deck);
      }
    });
    
    return Array.from(decks).sort((a, b) => {
      if (a === 'all') return -1;
      if (b === 'all') return 1;
      if (a === 'unknown') return 1;
      if (b === 'unknown') return -1;
      return a.localeCompare(b);
    });
  }

  /**
   * 获取所有可用的类别
   * @returns 类别列表
   */
  static getAvailableCategories(): string[] {
    const categories = new Set<string>();
    // 添加"全部"选项
    categories.add('all');
    // 添加"未知"选项
    categories.add('unknown');
    
    this.cards.forEach(card => {
      if (card.category && card.category.trim() !== '') {
        categories.add(card.category);
      }
    });
    
    return Array.from(categories).sort((a, b) => {
      if (a === 'all') return -1;
      if (b === 'all') return 1;
      if (a === 'unknown') return 1;
      if (b === 'unknown') return -1;
      return a.localeCompare(b);
    });
  }

  /**
   * 获取所有可用的玩家数量选项
   * @returns 玩家数量选项列表
   */
  static getAvailablePlayerOptions(): string[] {
    const playerOptions = new Set<string>();
    // 添加"全部"选项
    playerOptions.add('all');
    // 添加"未知"选项
    playerOptions.add('unknown');
    
    this.cards.forEach(card => {
      if (card.players && card.players !== 'all' && card.players !== 'unknown') {
        playerOptions.add(card.players);
      }
    });
    
    return Array.from(playerOptions).sort((a, b) => {
      if (a === 'all') return -1;
      if (b === 'all') return 1;
      if (a === 'unknown') return 1;
      if (b === 'unknown') return -1;
      return a.localeCompare(b);
    });
  }

  /**
   * 更新卡牌信息
   * @param updatedCard 更新后的卡牌信息
   * @returns 更新是否成功
   */
  static updateCard(updatedCard: Card): boolean {
    try {
      const index = this.cards.findIndex(card => card.id === updatedCard.id);
      if (index === -1) {
        console.error(`未找到ID为${updatedCard.id}的卡牌`);
        return false;
      }

      // 更新卡牌信息
      this.cards[index] = { ...updatedCard };
      console.log(`卡牌 "${updatedCard.name}" 更新成功`);
      return true;
    } catch (error) {
      console.error('更新卡牌时出错:', error);
      return false;
    }
  }

  /**
   * 根据ID获取卡牌
   * @param id 卡牌ID
   * @returns 卡牌对象，如果未找到则返回undefined
   */
  static getCardById(id: string): Card | undefined {
    return this.cards.find(card => card.id === id);
  }

  /**
   * 导入卡牌数据
   * @param cardsToImport 要导入的卡牌数组
   * @returns 导入结果
   */
  static importCards(cardsToImport: Card[]): {
    newCards: Card[];
    duplicates: Card[];
    invalidCards: Card[];
  } {
    const newCards: Card[] = [];
    const duplicates: Card[] = [];
    const invalidCards: Card[] = [];

    for (const cardToImport of cardsToImport) {
      // 验证卡牌数据是否有效
      if (!this.isValidCard(cardToImport)) {
        invalidCards.push(cardToImport);
        continue;
      }
      
      // 检查卡牌是否已存在
      const existingCard = this.cards.find(card => 
        card.id === cardToImport.id || 
        (card.name === cardToImport.name && card.type === cardToImport.type)
      );

      if (existingCard) {
        // 卡牌已存在，添加到重复列表
        duplicates.push(cardToImport);
      } else {
        // 卡牌不存在，添加到新增列表
        newCards.push(cardToImport);
        this.cards.push(cardToImport);
        
        // 保存到数据库
        this.database.addCard(cardToImport);
      }
    }

    console.log(`导入完成: 新增 ${newCards.length} 张卡牌, 重复 ${duplicates.length} 张卡牌, 无效 ${invalidCards.length} 张卡牌`);
    return { newCards, duplicates, invalidCards };
  }

  /**
   * 验证卡牌数据是否有效
   * @param card 要验证的卡牌
   * @returns 卡牌是否有效
   */
  private static isValidCard(card: Card): boolean {
    // 检查必填字段
    if (!card.id || !card.name || card.type === undefined) {
      console.warn(`卡牌验证失败: 缺少必填字段`, card);
      return false;
    }
    
    // 确保布尔字段有默认值
    if (card.holder === undefined) card.holder = false;
    if (card.animalHolder === undefined) card.animalHolder = false;
    if (card.field === undefined) card.field = false;
    if (card.actionCard === undefined) card.actionCard = false;
    if (card.extraVp === undefined) card.extraVp = false;
    
    // 确保描述字段至少是空数组
    if (!card.desc) card.desc = [];
    
    return true;
  }

  /**
   * 清空数据库
   * @param keepSampleCards 是否保留示例卡牌
   * @returns 清空前的卡牌数量
   */
  static clearDatabase(keepSampleCards: boolean = false): number {
    const previousCount = this.cards.length;
    
    if (keepSampleCards) {
      // 保留示例卡牌
      const sampleCards = this.cards.filter(card => card.deck === 'sample');
      this.cards = sampleCards;
      this.database.clear();
      sampleCards.forEach(card => this.database.addCard(card));
    } else {
      // 完全清空
      this.cards = [];
      this.database.clear();
    }
    
    return previousCount;
  }

  /**
   * 移除所有示例卡牌
   * @returns 移除的卡牌数量
   */
  static removeSampleCards(): number {
    try {
      // 找出所有示例卡牌
      const sampleCards = this.cards.filter(card => card.deck === 'sample');
      const count = sampleCards.length;
      
      if (count === 0) {
        console.log('没有找到示例卡牌');
        return 0;
      }
      
      // 从内存中移除示例卡牌
      this.cards = this.cards.filter(card => card.deck !== 'sample');
      
      // 清空数据库并重新添加非示例卡牌
      this.database.clear();
      this.cards.forEach(card => {
        this.database.addCard(card);
      });
      
      console.log(`已移除 ${count} 张示例卡牌`);
      return count;
    } catch (error) {
      console.error('移除示例卡牌时出错:', error);
      return 0;
    }
  }
}

// 初始化服务
CardService.initialize(); 