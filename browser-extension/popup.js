/**
 * Agricola卡牌助手 - 弹出窗口脚本
 */

document.addEventListener('DOMContentLoaded', function() {
  // 获取DOM元素
  const extractButton = document.getElementById('extract-cards');
  const openManagerButton = document.getElementById('open-manager');
  const exportJsonButton = document.getElementById('export-json');
  const statusElement = document.getElementById('status');
  const statsContainer = document.getElementById('stats-container');
  const totalCardsElement = document.getElementById('total-cards');
  const newCardsElement = document.getElementById('new-cards');
  const pageCardsElement = document.getElementById('page-cards');
  
  // 初始化状态
  let isExtracting = false;
  
  // 显示状态信息
  function showStatus(message, type = 'info') {
    statusElement.textContent = message;
    statusElement.className = `status ${type}`;
    statusElement.style.display = 'block';
  }
  
  // 隐藏状态信息
  function hideStatus() {
    statusElement.style.display = 'none';
  }
  
  // 更新统计信息
  function updateStats(totalCards, newCards, pageCards) {
    totalCardsElement.textContent = totalCards;
    newCardsElement.textContent = newCards;
    pageCardsElement.textContent = pageCards;
    statsContainer.style.display = 'block';
  }
  
  // 检查当前页面是否是Agricola游戏页面
  async function checkAgricolaPage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // 检查URL是否包含boardgamearena.com
      if (!tab.url.includes('boardgamearena.com')) {
        showStatus('请在Board Game Arena网站使用此插件', 'error');
        extractButton.disabled = true;
        return false;
      }
      
      // 检查是否是Agricola游戏页面
      // 我们将通过发送消息给content script来检查
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'checkAgricolaPage' });
        if (response && response.isAgricolaPage) {
          return true;
        } else {
          showStatus('请在Board Game Arena的Agricola游戏回放页面使用此插件', 'error');
          extractButton.disabled = true;
          return false;
        }
      } catch (error) {
        // 如果content script还没有加载，我们尝试注入它
        console.log('Content script可能尚未加载，尝试注入脚本...');
        
        // 如果URL包含agricola或archive/replay，我们假设这是一个Agricola页面
        if (tab.url.includes('agricola') || tab.url.includes('archive/replay')) {
          return true;
        } else {
          showStatus('请在Board Game Arena的Agricola游戏回放页面使用此插件', 'error');
          extractButton.disabled = true;
          return false;
        }
      }
    } catch (error) {
      console.error('检查页面失败:', error);
      showStatus('检查页面失败: ' + error.message, 'error');
      return false;
    }
  }
  
  // 提取卡牌数据
  async function extractCards() {
    if (isExtracting) return;
    
    try {
      isExtracting = true;
      extractButton.disabled = true;
      showStatus('正在提取卡牌数据...', 'info');
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        showStatus('无法获取当前标签页信息', 'error');
        isExtracting = false;
        extractButton.disabled = false;
        return;
      }
      
      try {
        // 发送消息到content script
        const result = await chrome.tabs.sendMessage(tab.id, { action: 'extractCards' });
        
        if (result && result.success) {
          showStatus(`提取成功: 发现${result.totalCards}张卡牌，新增${result.newCards}张`, 'success');
          
          // 获取最新的统计数据
          await getDBStats();
          
          // 确认数据已保存到Chrome存储
          chrome.storage.local.get('agricolaCards', function(data) {
            if (data && data.agricolaCards && data.agricolaCards.length > 0) {
              console.log(`Chrome存储中有 ${data.agricolaCards.length} 张卡牌`);
            } else {
              console.warn('Chrome存储中没有卡牌数据');
              showStatus('警告: 卡牌数据未能保存到存储中', 'warning');
            }
          });
        } else {
          const errorMsg = result && result.error ? result.error : '未知错误';
          showStatus(`提取失败: ${errorMsg}`, 'error');
          console.error('提取失败:', result);
        }
      } catch (error) {
        console.error('与内容脚本通信失败:', error);
        showStatus('与页面通信失败，请确保您在Agricola游戏回放页面', 'error');
      }
    } catch (error) {
      console.error('提取卡牌失败:', error);
      showStatus('提取卡牌失败: ' + (error.message || '未知错误'), 'error');
    } finally {
      isExtracting = false;
      extractButton.disabled = false;
    }
  }
  
  // 打开卡牌管理器
  function openCardManager() {
    chrome.tabs.create({ url: chrome.runtime.getURL('simple-card-manager.html') });
  }
  
  // 导出数据库为JSON
  async function exportDatabase() {
    try {
      showStatus('正在导出数据...', 'info');
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // 发送消息到content script
      const result = await chrome.tabs.sendMessage(tab.id, { action: 'exportDatabase' });
      
      if (result.success) {
        showStatus('导出成功，文件已下载', 'success');
      } else {
        showStatus(`导出失败: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('导出数据库失败:', error);
      showStatus('导出数据库失败: ' + (error.message || '未知错误'), 'error');
    }
  }
  
  // 获取数据库统计信息
  async function getDBStats() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // 发送消息到content script
      const result = await chrome.tabs.sendMessage(tab.id, { action: 'getDBStats' });
      
      if (result.success) {
        totalCardsElement.textContent = result.totalCards;
        statsContainer.style.display = 'block';
      }
    } catch (error) {
      console.error('获取数据库统计失败:', error);
    }
  }
  
  // 初始化
  async function init() {
    const isValidPage = await checkAgricolaPage();
    
    if (isValidPage) {
      await getDBStats();
    }
  }
  
  // 绑定事件
  extractButton.addEventListener('click', extractCards);
  openManagerButton.addEventListener('click', openCardManager);
  exportJsonButton.addEventListener('click', exportDatabase);
  
  // 初始化
  init();
}); 