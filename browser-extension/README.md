# Agricola卡牌助手 - 浏览器扩展

这是一个浏览器扩展，用于从 Board Game Arena 的 Agricola 游戏回放页面提取卡牌数据，并将其存储到本地数据库中。

## 功能特点

- **一键提取**：只需点击一个按钮，即可提取当前页面的所有卡牌数据
- **智能识别**：自动识别中英文卡牌名称和描述
- **数据完整性**：确保只保存完整的卡牌数据（包含ID、类型、中文名称和中文描述）
- **增量更新**：只会添加数据库中还不存在的卡牌，避免重复数据
- **本地存储**：将提取的数据存储到浏览器的本地存储和 IndexedDB 数据库
- **卡牌管理**：提供简洁的卡牌管理界面，支持搜索、过滤和排序
- **数据导出导入**：支持导出/导入 JSON 数据，方便备份和共享
- **调试功能**：提供详细的调试信息，帮助排查问题

## 安装方法

### Chrome / Edge

1. 下载或克隆此仓库
2. 打开 Chrome/Edge 浏览器，进入扩展管理页面
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
3. 启用"开发者模式"
4. 点击"加载已解压的扩展程序"（Chrome）或"加载解压缩的扩展"（Edge）
5. 选择 `browser-extension` 文件夹

### Firefox

1. 下载或克隆此仓库
2. 打开 Firefox 浏览器，进入 `about:debugging#/runtime/this-firefox`
3. 点击"临时载入附加组件"
4. 选择 `browser-extension` 文件夹中的 `manifest.json` 文件

## 使用方法

### 提取卡牌数据

1. 访问 Board Game Arena 的 Agricola 游戏回放页面
2. 点击浏览器工具栏中的插件图标，打开插件弹出窗口
3. 点击"提取当前页面卡牌"按钮，插件将自动提取页面上所有可见的卡牌数据
4. 提取完成后，会显示提取的卡牌数量和新增卡牌数量

### 管理卡牌数据

1. 在插件弹出窗口中点击"打开卡牌管理器"按钮
2. 在卡牌管理器页面，您可以：
   - 查看所有已收集的卡牌
   - 使用搜索框搜索卡牌名称或描述
   - 使用筛选器按类型、牌组筛选卡牌
   - 选择不同的排序方式
   - 导出数据库为JSON文件
   - 导入JSON数据
   - 清空数据库
   - 清理不完整的卡牌
   - 查看调试信息

### 备份和恢复

1. 在卡牌管理器页面点击"导出数据"按钮，将所有卡牌数据导出为JSON文件
2. 需要恢复数据时，点击"导入数据"按钮，选择之前导出的JSON文件

## 文件结构

```
browser-extension/           # 浏览器扩展主目录
├── manifest.json            # 扩展配置文件
├── popup.html               # 扩展弹出窗口HTML
├── popup.js                 # 扩展弹出窗口脚本
├── content.js               # 内容脚本，负责与页面交互
├── background.js            # 后台脚本
├── agricolaCardDB.js        # IndexedDB 数据库实现
├── card-manager.js          # 卡牌管理器核心功能
├── simple-card-manager.html # 简化版卡牌管理器界面
├── simple-card-manager.js   # 简化版卡牌管理器脚本
├── import-handler.js        # 导入处理器
├── extractCardData.js       # 独立的卡牌数据提取脚本
├── welcome.html             # 欢迎页面
├── icons/                   # 图标目录
│   ├── icon16.png           # 16x16 图标
│   ├── icon48.png           # 48x48 图标
│   ├── icon128.png          # 128x128 图标
│   ├── create_icons.html    # 图标生成工具
│   └── generate_icons.js    # 图标生成脚本
└── README.md                # 扩展说明文档
```

## 独立脚本使用方法

如果您不想安装浏览器扩展，也可以使用独立的提取脚本：

1. 在 Board Game Arena 的 Agricola 游戏回放页面打开浏览器控制台(F12)
2. 复制粘贴 `extractCardData.js` 的内容到控制台并运行
3. 脚本将自动提取页面上所有可见的卡牌数据并下载为JSON文件

## 注意事项

- 扩展只能在 Board Game Arena 的 Agricola 游戏回放页面使用
- 数据存储在浏览器的本地存储和 IndexedDB 数据库中，清除浏览器数据可能会导致数据丢失
- 建议定期导出数据库为JSON文件，以便备份
- 只有包含ID、类型、中文名称和中文描述的卡牌才会被保存

## 许可证

MIT 