import { Card } from '../models/Card';
import { validateCard } from '../utils/validators';

// 本地存储键名
const CARDS_STORAGE_KEY = 'agricola_helper_cards';

/**
 * 卡牌数据库类
 * 提供添加、查询、更新和删除卡牌的功能
 */
export class CardDatabase {
  private cards: Map<string, Card>;

  /**
   * 构造函数
   */
  constructor() {
    this.cards = new Map();
    this.loadDatabase();
  }

  /**
   * 加载数据库
   */
  private loadDatabase(): void {
    try {
      // 检查是否在浏览器环境
      if (typeof window !== 'undefined') {
        const data = localStorage.getItem(CARDS_STORAGE_KEY);
        
        if (data) {
          const cardArray: Card[] = JSON.parse(data);
          
          // 初始化卡牌Map
          this.cards.clear();
          cardArray.forEach(card => {
            this.cards.set(card.id, card);
          });
          
          console.log(`已从本地存储加载 ${this.cards.size} 张卡牌`);
        } else {
          // 如果本地存储中没有数据，则初始化为空
          this.saveDatabase();
          console.log('初始化了空的卡牌数据库');
        }
      }
    } catch (error) {
      console.error('加载数据库时出错:', error);
      // 初始化为空数据库
      this.cards.clear();
    }
  }

  /**
   * 保存数据库
   */
  private saveDatabase(): void {
    try {
      // 检查是否在浏览器环境
      if (typeof window !== 'undefined') {
        const cardArray = Array.from(this.cards.values());
        localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(cardArray));
        console.log('卡牌数据已保存到本地存储');
      }
    } catch (error) {
      console.error('保存数据库时出错:', error);
    }
  }

  /**
   * 清空数据库
   */
  public clear(): void {
    this.cards.clear();
    this.saveDatabase();
  }

  /**
   * 添加卡牌
   * @param card 要添加的卡牌
   * @returns 是否添加成功
   */
  public addCard(card: Card): boolean {
    if (!validateCard(card)) {
      return false;
    }
    
    this.cards.set(card.id, card);
    this.saveDatabase();
    return true;
  }

  /**
   * 添加多张卡牌
   * @param cards 卡牌数据数组
   * @returns 添加成功的卡牌数量
   */
  public addCards(cards: Card[]): number {
    let successCount = 0;
    
    for (const card of cards) {
      if (this.addCard(card)) {
        successCount++;
      }
    }
    
    return successCount;
  }

  /**
   * 获取卡牌
   * @param id 卡牌ID
   * @returns 卡牌数据，如果不存在则返回undefined
   */
  public getCard(id: string): Card | undefined {
    return this.cards.get(id);
  }

  /**
   * 获取所有卡牌
   * @returns 所有卡牌的数组
   */
  public getAllCards(): Card[] {
    return Array.from(this.cards.values());
  }

  /**
   * 更新卡牌
   * @param id 卡牌ID
   * @param cardData 更新的卡牌数据
   * @returns 是否更新成功
   */
  public updateCard(id: string, cardData: Partial<Card>): boolean {
    try {
      const existingCard = this.cards.get(id);
      
      if (!existingCard) {
        console.error(`卡牌ID "${id}" 不存在`);
        return false;
      }

      // 更新卡牌数据
      const updatedCard = { ...existingCard, ...cardData };
      
      // 验证更新后的卡牌数据
      if (!validateCard(updatedCard)) {
        console.error('更新后的卡牌数据无效');
        return false;
      }

      this.cards.set(id, updatedCard);
      this.saveDatabase();
      return true;
    } catch (error) {
      console.error('更新卡牌时出错:', error);
      return false;
    }
  }

  /**
   * 删除卡牌
   * @param id 卡牌ID
   * @returns 是否删除成功
   */
  public deleteCard(id: string): boolean {
    try {
      if (!this.cards.has(id)) {
        console.error(`卡牌ID "${id}" 不存在`);
        return false;
      }

      this.cards.delete(id);
      this.saveDatabase();
      return true;
    } catch (error) {
      console.error('删除卡牌时出错:', error);
      return false;
    }
  }

  /**
   * 搜索卡牌
   * @param filters 过滤条件
   * @returns 符合条件的卡牌数组
   */
  public searchCards(filters: Partial<Card>): Card[] {
    let results = Array.from(this.cards.values());
    
    // 应用所有过滤条件
    for (const [key, value] of Object.entries(filters)) {
      results = results.filter(card => {
        const cardValue = card[key as keyof Card];
        
        // 处理数组类型
        if (Array.isArray(cardValue) && Array.isArray(value)) {
          return value.every(v => cardValue.includes(v));
        }
        
        // 处理字符串、数字和布尔值
        return cardValue === value;
      });
    }
    
    return results;
  }

  /**
   * 按类型获取卡牌
   * @param type 卡牌类型
   * @returns 符合类型的卡牌数组
   */
  public getCardsByType(type: string): Card[] {
    return Array.from(this.cards.values()).filter(card => card.type === type);
  }

  /**
   * 按牌组获取卡牌
   * @param deck 牌组
   * @returns 符合牌组的卡牌数组
   */
  public getCardsByDeck(deck: string): Card[] {
    return Array.from(this.cards.values()).filter(card => card.deck === deck);
  }

  /**
   * 按类别获取卡牌
   * @param category 类别
   * @returns 符合类别的卡牌数组
   */
  public getCardsByCategory(category: string): Card[] {
    return Array.from(this.cards.values()).filter(card => card.category === category);
  }
} 