/**
 * Agricola卡牌助手 - 后台脚本
 */

// 监听插件安装事件
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // 首次安装
    console.log('Agricola卡牌助手已安装');
    
    // 打开欢迎页面
    chrome.tabs.create({
      url: chrome.runtime.getURL('welcome.html')
    });
  } else if (details.reason === 'update') {
    // 插件更新
    console.log(`Agricola卡牌助手已更新到版本 ${chrome.runtime.getManifest().version}`);
  }
});

// 监听插件图标点击事件
chrome.action.onClicked.addListener((tab) => {
  // 检查当前页面是否是Board Game Arena的Agricola页面
  if (tab.url.includes('boardgamearena.com') && tab.url.includes('agricola')) {
    // 如果是，则执行提取卡牌的操作
    chrome.tabs.sendMessage(tab.id, { action: 'extractCards' });
  } else {
    // 如果不是，则显示提示
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Agricola卡牌助手',
      message: '请在Board Game Arena的Agricola游戏页面使用此插件'
    });
  }
}); 