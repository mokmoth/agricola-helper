import { CardDatabase } from './database/CardDatabase';
import { Card, CardType } from './models/Card';

/**
 * Agricola卡牌数据库模块
 */
export { Card, CardType, CardDatabase };

// 示例使用
export function example() {
  // 创建数据库实例
  const db = new CardDatabase();
  
  // 添加卡牌示例
  const exampleCard: Card = {
    id: "A101_CookeryOutfitter",
    name: "Cookery Outfitter",
    deck: "A",
    players: "1+",
    desc: ["During scoring, you get 1 bonus <SCORE> for each cooking improvement you have. (Ovens are not considered cooking improvements.)"],
    vp: 0,
    extraVp: true,
    bonusVp: "",
    prerequisite: "",
    costs: [[]],
    conditionalCost: null,
    costText: "",
    fee: null,
    type: CardType.OCCUPATION,
    category: "PointsCategory",
    numbering: "A101",
    holder: false,
    animalHolder: false,
    field: false,
    actionCard: false,
    stats: [],
    infobox: null,
    marked: false
  };
  
  db.addCard(exampleCard);
  
  // 搜索卡牌示例
  const occupationCards = db.getCardsByType(CardType.OCCUPATION);
  console.log(`找到 ${occupationCards.length} 张职业卡`);
  
  // 按牌组搜索卡牌
  const deckACards = db.getCardsByDeck("A");
  console.log(`找到 ${deckACards.length} 张A牌组的卡牌`);
  
  return db;
} 