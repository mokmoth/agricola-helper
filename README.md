# 农场主卡牌助手（Agricola Helper）项目说明文档

## 项目概述

农场主卡牌助手是一个基于 Next.js 和 TypeScript 开发的 Web 应用，旨在帮助玩家管理和查询桌游《农场主（Agricola）》的卡牌信息。该应用允许用户导入、筛选、搜索和查看卡牌详情，提高游戏体验。

## 技术栈

- **前端框架**：Next.js 14.2.x
- **编程语言**：TypeScript
- **状态管理**：React Hooks (useState, useEffect)
- **样式**：Tailwind CSS
- **数据存储**：浏览器 localStorage
- **UI 组件**：自定义组件
- **通知系统**：react-toastify

## 项目结构

```
/src
  /api
    cardService.ts        # 卡牌服务，处理卡牌数据的核心逻辑
  /components
    CardFilter.tsx        # 卡牌筛选组件
    CardImport.tsx        # 卡牌导入组件
    CardItem.tsx          # 单个卡牌展示组件
    CardList.tsx          # 卡牌列表组件
    CardSearch.tsx        # 卡牌搜索组件
    CardStats.tsx         # 卡牌统计组件
  /database
    CardDatabase.ts       # 卡牌数据库类，处理数据持久化
    sampleCards.ts        # 示例卡牌数据
  /models
    Card.ts               # 卡牌模型定义
  /pages
    index.tsx             # 主页
  /scripts
    clearSampleCards.js   # 清除示例卡牌脚本
  /utils
    validators.ts         # 数据验证工具
/public
  clear-sample-cards.html # 清除示例卡牌的工具页面
```

## 核心功能

### 1. 卡牌数据管理

- **导入卡牌**：从游戏日志文件中解析并导入卡牌数据
- **持久化存储**：使用 localStorage 保存卡牌数据
- **数据清理**：支持清空数据库或移除示例卡牌

### 2. 卡牌查询与筛选

- **搜索功能**：按卡牌名称搜索
- **多条件筛选**：按类型、牌组、玩家数量等条件筛选
- **统计信息**：显示卡牌总数和各类型卡牌数量

### 3. 卡牌展示

- **卡牌列表**：以卡片形式展示卡牌基本信息
- **详细信息**：展示卡牌的完整信息，包括成本、描述、前提条件等
- **可视化**：使用颜色和图标增强信息展示

## 数据模型

### Card 模型

```typescript
enum CardType {
  OCCUPATION = 'occupation',  // 职业卡
  MINOR = 'minor',            // 次要改良卡
  MAJOR = 'major'             // 主要改良卡
}

interface Card {
  id: string;                 // 卡牌ID
  name: string;               // 卡牌名称
  type: CardType;             // 卡牌类型
  deck: string;               // 所属牌组
  players: string;            // 适用玩家数
  vp: number;                 // 胜利点数
  category: string;           // 类别
  desc: string[];             // 描述文本数组
  costs: any[];               // 成本数组
  costText: string;           // 成本文本描述
  conditionalCost: string;    // 条件成本
  prerequisite: string;       // 前提条件
  extraVp: boolean;           // 是否有额外分数
  bonusVp: string;            // 额外分数描述
  numbering: string;          // 编号
  holder: boolean;            // 是否为持有物
  animalHolder: boolean;      // 是否可放置动物
  field: boolean;             // 是否为田地
  actionCard: boolean;        // 是否为行动卡
  fee: any;                   // 费用
}
```

## 关键组件说明

### CardService

`CardService` 是应用的核心服务类，负责处理所有与卡牌相关的操作：

- 初始化卡牌数据
- 提供卡牌查询、筛选功能
- 处理卡牌导入和更新
- 管理数据库操作

### CardDatabase

`CardDatabase` 负责数据持久化，使用 localStorage 存储卡牌数据：

- 加载和保存卡牌数据
- 提供增删改查功能
- 处理数据验证

### CardItem

`CardItem` 组件负责单个卡牌的展示：

- 显示卡牌基本信息
- 格式化和展示成本信息
- 支持展开/折叠详细信息
- 处理卡牌更新

### CardImport

`CardImport` 组件负责卡牌导入功能：

- 处理文件上传
- 解析日志文件中的卡牌数据
- 处理 JSON 解析和清理
- 提供导入统计信息

## 数据流

1. **初始化**：应用启动时，`CardService` 从 `CardDatabase` 加载卡牌数据
2. **导入**：用户上传文件 → `CardImport` 解析数据 → `CardService` 处理导入 → `CardDatabase` 保存数据
3. **查询**：用户输入搜索条件 → `CardService` 执行查询 → 结果显示在 `CardList` 中
4. **筛选**：用户选择筛选条件 → `CardService` 执行筛选 → 结果显示在 `CardList` 中
5. **更新**：用户修改卡牌 → `CardService` 更新数据 → `CardDatabase` 保存更改

## 关键实现细节

### 1. 卡牌导入与解析

卡牌导入功能是应用的核心，它从游戏日志文件中提取卡牌数据。实现了多层次的 JSON 解析和清理：

- **基础清理**：修复常见的 JSON 格式问题
- **高级清理**：处理更复杂的格式错误
- **最小提取**：当前两层失败时，尝试提取关键字段

### 2. 数据持久化

应用使用浏览器的 localStorage 进行数据持久化：

- 使用固定的键名 `'agricola_helper_cards'` 存储数据
- 在浏览器环境检查 (`typeof window !== 'undefined'`) 确保代码安全执行
- 数据以 JSON 格式序列化存储

### 3. 卡牌成本展示

卡牌成本信息有多种格式，应用实现了灵活的展示逻辑：

- 支持资源成本（如木材、石头等）的格式化
- 支持成本文本描述的展示
- 支持条件成本的展示
- 使用颜色标签增强资源成本的可视化

## 已知问题和解决方案

### 1. 数据持久化问题

**问题**：Next.js 服务端渲染与客户端存储交互导致的数据丢失。

**解决方案**：
- 使用 `typeof window !== 'undefined'` 检查确保只在浏览器环境执行存储操作
- 在组件挂载时（useEffect）加载数据，而不是在组件定义时

### 2. JSON 解析错误

**问题**：游戏日志中的 JSON 数据格式不规范，导致解析失败。

**解决方案**：
- 实现多层次的 JSON 清理和解析
- 提供详细的错误日志，帮助诊断问题
- 使用 try-catch 块防止单个卡牌解析错误影响整体导入

### 3. 卡牌重复问题

**问题**：导入时可能出现卡牌重复显示。

**解决方案**：
- 修改 `handleImportComplete` 函数，使用 `CardService.getAllCards()` 获取最新完整列表
- 在 `importCards` 方法中检查卡牌是否已存在

## 开发指南

### 添加新功能

1. **新增卡牌属性**：
   - 在 `Card` 接口中添加新属性
   - 更新 `CardItem` 组件以显示新属性
   - 在 `CardImport` 中确保新属性被正确解析

2. **新增筛选条件**：
   - 在 `CardFilter` 组件中添加新的筛选选项
   - 在 `CardService.filterCards` 方法中添加对应的筛选逻辑

3. **新增卡牌类型**：
   - 在 `CardType` 枚举中添加新类型
   - 更新 `getCardTypeClassName`、`getCardTypeColor` 和 `getCardTypeName` 方法
   - 在 `CardStats` 组件中添加新类型的统计

### 性能优化

1. **大量卡牌处理**：
   - 考虑实现分页加载
   - 使用虚拟滚动技术（如 react-window）减少渲染负担

2. **搜索优化**：
   - 考虑实现搜索索引
   - 添加防抖（debounce）机制减少搜索请求

### 数据迁移

如需将数据从 localStorage 迁移到其他存储方式（如服务器数据库）：

1. 修改 `CardDatabase` 类，替换 localStorage 相关代码
2. 确保 `initialize`、`saveDatabase` 和 `loadDatabase` 方法适配新的存储方式
3. 考虑添加数据迁移工具，帮助用户将现有数据迁移到新系统

## 部署指南

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 生产部署

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

### 环境要求

- Node.js 18.x 或更高版本
- npm 9.x 或更高版本

## 常见问题解答

### Q: 为什么刷新页面后数据丢失？

A: 确保 `CardDatabase` 正确使用 localStorage，并且在组件挂载时调用 `CardService.initialize()`。

### Q: 如何清除示例卡牌？

A: 访问 `/clear-sample-cards.html` 页面，点击"清除示例卡牌"按钮。

### Q: 导入卡牌时出现解析错误怎么办？

A: 检查日志文件格式，确保符合预期的 JSON 结构。应用已实现多层次的解析逻辑，但极端情况下仍可能失败。

### Q: 如何添加自定义卡牌？

A: 目前应用不支持直接添加自定义卡牌，只能通过导入功能。可以考虑开发卡牌编辑功能。

## 未来计划

1. **卡牌编辑功能**：允许用户创建和编辑卡牌
2. **牌组管理**：支持创建和管理自定义牌组
3. **数据导出**：支持将卡牌数据导出为 JSON 或 CSV 格式
4. **多语言支持**：添加英文等其他语言支持
5. **高级搜索**：实现更复杂的搜索功能，如组合条件搜索
6. **用户账户**：添加用户账户系统，支持云端数据同步

## 结语

农场主卡牌助手是一个功能丰富的工具，旨在提升《农场主》桌游的游戏体验。通过持续改进和添加新功能，它可以成为玩家不可或缺的游戏辅助工具。

希望这份文档能帮助您快速了解项目结构和功能，顺利进行后续开发。如有任何问题或建议，欢迎提出。 