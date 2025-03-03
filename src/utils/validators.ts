import { Card, CardType } from '../models/Card';

/**
 * 验证卡牌数据
 * @param card 卡牌数据
 * @returns 是否有效
 */
export function validateCard(card: any): boolean {
  // 检查必填字段
  if (!card.id || typeof card.id !== 'string') {
    console.error('无效的卡牌ID');
    return false;
  }

  if (!card.name || typeof card.name !== 'string') {
    console.error('无效的卡牌名称');
    return false;
  }

  if (!card.deck || typeof card.deck !== 'string') {
    console.error('无效的牌组');
    return false;
  }

  if (!Array.isArray(card.desc)) {
    console.error('无效的卡牌描述');
    return false;
  }

  // 验证卡牌类型
  if (!Object.values(CardType).includes(card.type as CardType)) {
    console.error('无效的卡牌类型');
    return false;
  }

  // 验证数值字段
  if (typeof card.vp !== 'number') {
    console.error('无效的基础胜利点数');
    return false;
  }

  if (typeof card.extraVp !== 'boolean') {
    console.error('无效的额外胜利点标志');
    return false;
  }

  // 验证成本数组
  if (!Array.isArray(card.costs)) {
    console.error('无效的成本数组');
    return false;
  }

  // 验证布尔字段
  const booleanFields = ['holder', 'animalHolder', 'field', 'actionCard'];
  for (const field of booleanFields) {
    if (typeof card[field] !== 'boolean') {
      console.error(`无效的${field}字段`);
      return false;
    }
  }

  // 验证可选布尔字段
  const optionalBooleanFields = ['cook', 'bread', 'passing', 'marked'];
  for (const field of optionalBooleanFields) {
    if (field in card && typeof card[field] !== 'boolean') {
      console.error(`无效的${field}字段`);
      return false;
    }
  }

  return true;
} 