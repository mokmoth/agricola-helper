/**
 * 卡牌类型定义
 */

// 资源成本定义
export interface Cost {
  wood?: number;
  clay?: number;
  reed?: number;
  stone?: number;
  food?: number;
  grain?: number;
  vegetable?: number;
}

// 卡牌类型枚举
export enum CardType {
  OCCUPATION = "occupation",
  MINOR = "minor",
  MAJOR = "major",
}

// 卡牌定义
export interface Card {
  // 基本信息
  id: string;            // 卡牌唯一标识符
  name: string;          // 卡牌名称
  deck: string;          // 卡牌所属的牌组 (A, B, C, D, E)
  players: string;       // 适用的玩家数量 ("1+", "3+", "4+" 等)
  desc: string[];        // 卡牌描述
  
  // 分数相关
  vp: number;            // 基础胜利点数
  extraVp: boolean;      // 是否有额外胜利点
  bonusVp: string;       // 额外胜利点描述
  
  // 游戏规则相关
  prerequisite: string;  // 使用卡牌的前提条件
  costs: Cost[][];       // 卡牌费用 (可能有多种支付方式)
  conditionalCost: any;  // 条件性成本
  costText: string;      // 成本描述文本
  fee: any;              // 额外费用
  
  // 分类信息
  type: CardType;        // 卡牌类型
  category: string;      // 卡牌类别
  numbering: string;     // 卡牌编号
  
  // 特性标记
  holder: boolean;       // 是否为持有者卡
  animalHolder: boolean; // 是否为动物持有者卡
  field: boolean;        // 是否为田地卡
  actionCard: boolean;   // 是否为行动卡
  
  // 烹饪相关
  cook?: boolean;        // 是否为烹饪卡
  bread?: boolean;       // 是否为面包卡
  passing?: boolean;     // 是否为传递卡
  
  // 可选的元数据
  stats?: any[];         // 统计数据
  infobox?: any;         // 信息框
  marked?: boolean;      // 是否被标记
} 