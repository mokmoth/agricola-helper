// DOM元素
const statusMessage = document.getElementById('status-message');
const cardList = document.getElementById('card-list');
const loadFromStorageBtn = document.getElementById('load-from-storage');
const exportBtn = document.getElementById('export-btn');
const showDebugBtn = document.getElementById('show-debug');
const debugInfo = document.getElementById('debug-info');

// 统计元素
const totalCards = document.getElementById('total-cards');
const occupationCards = document.getElementById('occupation-cards');
const minorCards = document.getElementById('minor-cards');
const majorCards = document.getElementById('major-cards');
const actionCards = document.getElementById('action-cards');

// 存储卡牌数据
let cardsData = [];

// 显示状态消息
function log(message, type = 'info') {
    console.log(message);
    statusMessage.textContent = message;
    statusMessage.className = type;
    statusMessage.style.display = 'block';
    
    // 添加到调试信息
    const timestamp = new Date().toLocaleTimeString();
    const debugLine = document.createElement('div');
    debugLine.textContent = `[${timestamp}] [${type}] ${message}`;
    debugInfo.appendChild(debugLine);
    
    // 5秒后自动隐藏状态消息
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 5000);
}

// 从Chrome存储加载数据
async function loadFromStorage() {
    try {
        log('正在从Chrome存储加载数据...', 'info');
        
        if (typeof chrome === 'undefined') {
            log('未检测到Chrome环境', 'error');
            return;
        }
        
        if (!chrome.storage) {
            log('未检测到Chrome存储API', 'error');
            return;
        }
        
        log('Chrome存储API可用', 'info');
        
        // 先获取所有存储的键，用于调试
        chrome.storage.local.get(null, function(items) {
            try {
                const keys = Object.keys(items);
                log(`Chrome存储中的所有键: ${keys.length > 0 ? keys.join(', ') : '无'}`, 'info');
                
                // 然后获取agricolaCards数据
                chrome.storage.local.get('agricolaCards', function(result) {
                    try {
                        log(`获取到agricolaCards结果: ${result ? JSON.stringify(Object.keys(result)) : '无'}`, 'info');
                        
                        if (result && result.agricolaCards) {
                            log(`agricolaCards类型: ${Array.isArray(result.agricolaCards) ? '数组' : typeof result.agricolaCards}`, 'info');
                            
                            if (Array.isArray(result.agricolaCards) && result.agricolaCards.length > 0) {
                                // 所有卡牌数据
                                cardsData = result.agricolaCards;
                                log(`成功加载 ${cardsData.length} 张卡牌`, 'success');
                                
                                // 显示前5张卡牌的字段信息，用于调试
                                const sampleCards = cardsData.slice(0, 5);
                                sampleCards.forEach((card, index) => {
                                    const cardFields = Object.keys(card);
                                    log(`卡牌 #${index + 1} (${card.id}) 字段: ${cardFields.join(', ')}`, 'info');
                                });
                                
                                renderCards(cardsData);
                                updateStats(cardsData);
                            } else {
                                log(`存储中的agricolaCards是空数组或非数组: ${JSON.stringify(result.agricolaCards)}`, 'warning');
                            }
                        } else {
                            log('存储中没有agricolaCards数据', 'warning');
                            
                            // 尝试手动创建一些测试数据
                            const testData = [
                                {
                                    id: 'test_1',
                                    type: 'occupation',
                                    zhName: '测试职业卡',
                                    zhDesc: ['这是一张测试职业卡'],
                                    deck: 'A',
                                    categoryText: '测试类别',
                                    vp: 1,
                                    players: '1+'
                                },
                                {
                                    id: 'test_2',
                                    type: 'minor',
                                    zhName: '测试小改良卡',
                                    zhDesc: ['这是一张测试小改良卡'],
                                    deck: 'B',
                                    categoryText: '测试类别',
                                    vp: 2,
                                    costText: '木材x1',
                                    players: '3+'
                                }
                            ];
                            
                            log('创建测试数据以验证渲染功能', 'info');
                            cardsData = testData;
                            renderCards(testData);
                            updateStats(testData);
                        }
                    } catch (error) {
                        log(`处理agricolaCards数据时出错: ${error.message}`, 'error');
                    }
                });
            } catch (error) {
                log(`获取存储键时出错: ${error.message}`, 'error');
            }
        });
    } catch (error) {
        log(`加载数据失败: ${error.message}`, 'error');
    }
}

// 导出数据
function exportData() {
    try {
        if (cardsData.length === 0) {
            log('没有数据可导出', 'warning');
            return;
        }
        
        const jsonData = JSON.stringify(cardsData, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'agricola_cards.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        log('数据导出成功', 'success');
    } catch (error) {
        log(`导出失败: ${error.message}`, 'error');
    }
}

// 更新统计信息
function updateStats(cards) {
    const stats = {
        total: cards.length,
        occupation: 0,
        minor: 0,
        major: 0,
        action: 0,
        unknown: 0
    };
    
    cards.forEach(card => {
        if (card.type === 'occupation') stats.occupation++;
        else if (card.type === 'minor') stats.minor++;
        else if (card.type === 'major') stats.major++;
        else if (card.type === 'action') stats.action++;
        else stats.unknown++;
    });
    
    totalCards.textContent = stats.total;
    occupationCards.textContent = stats.occupation;
    minorCards.textContent = stats.minor;
    majorCards.textContent = stats.major;
    actionCards.textContent = stats.action;
    
    // 在调试信息中显示详细统计
    log(`统计信息: 总计 ${stats.total} 张卡牌 (职业卡: ${stats.occupation}, 小改良卡: ${stats.minor}, 大改良卡: ${stats.major}, 行动卡: ${stats.action}, 未知类型: ${stats.unknown})`, 'info');
}

// 渲染卡牌列表
function renderCards(cards) {
    // 清空现有卡牌
    cardList.innerHTML = '';
    
    if (!cards || cards.length === 0) {
        const noCards = document.createElement('p');
        noCards.textContent = '没有找到卡牌数据';
        cardList.appendChild(noCards);
        return;
    }
    
    // 添加卡牌
    cards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        
        // 卡牌名称 (支持多种可能的字段名)
        const cardTitle = document.createElement('h3');
        // 优先使用zhName，然后是name，最后是id或默认文本
        cardTitle.textContent = card.zhName || card.name || card.id || '未命名卡牌';
        cardElement.appendChild(cardTitle);
        
        // 卡牌类型
        const cardType = document.createElement('span');
        cardType.className = `card-type card-type-${card.type || 'unknown'}`;
        
        switch (card.type) {
            case 'occupation':
                cardType.textContent = '职业卡';
                break;
            case 'minor':
                cardType.textContent = '小改良卡';
                break;
            case 'major':
                cardType.textContent = '大改良卡';
                break;
            case 'action':
                cardType.textContent = '行动卡';
                break;
            default:
                cardType.textContent = card.type || '未知类型';
        }
        
        cardElement.appendChild(cardType);
        
        // 卡牌描述 (支持多种可能的字段名)
        const description = getCardDescription(card);
        if (description) {
            const cardDescription = document.createElement('div');
            cardDescription.className = 'card-description';
            cardDescription.textContent = description;
            cardElement.appendChild(cardDescription);
        }
        
        // 卡牌元数据
        const cardMeta = document.createElement('div');
        cardMeta.className = 'card-meta';
        
        // ID
        const id = document.createElement('span');
        id.textContent = `ID: ${card.id || '未知'}`;
        cardMeta.appendChild(id);
        
        // 编号
        if (card.numbering) {
            const numbering = document.createElement('span');
            numbering.textContent = `编号: ${card.numbering}`;
            cardMeta.appendChild(numbering);
        }
        
        // 牌组
        if (card.deck) {
            const deck = document.createElement('span');
            deck.textContent = `牌组: ${card.deck}`;
            cardMeta.appendChild(deck);
        }
        
        // 分类
        if (card.category || card.categoryText) {
            const category = document.createElement('span');
            category.textContent = `分类: ${card.categoryText || card.category || ''}`;
            cardMeta.appendChild(category);
        }
        
        // 分数
        if (card.points || card.vp) {
            const points = document.createElement('span');
            points.textContent = `分数: ${card.points || card.vp || 0}`;
            cardMeta.appendChild(points);
        }
        
        // 前置条件
        if (card.prerequisiteText) {
            const prerequisite = document.createElement('span');
            prerequisite.textContent = `前置: ${card.prerequisiteText}`;
            cardMeta.appendChild(prerequisite);
        }
        
        // 玩家数
        if (card.players) {
            const players = document.createElement('span');
            players.textContent = `玩家: ${card.players}`;
            cardMeta.appendChild(players);
        }
        
        // 成本
        if (card.costText) {
            const cost = document.createElement('span');
            cost.textContent = `成本: ${card.costText}`;
            cardMeta.appendChild(cost);
        }
        
        cardElement.appendChild(cardMeta);
        cardList.appendChild(cardElement);
    });
}

// 获取卡牌描述，支持多种可能的字段名
function getCardDescription(card) {
    // 如果有zhDesc数组，将其合并为字符串
    if (card.zhDesc && Array.isArray(card.zhDesc) && card.zhDesc.length > 0) {
        return card.zhDesc.join(' ');
    }
    
    // 如果有description字段
    if (card.description) {
        return card.description;
    }
    
    return '';
}

// 事件监听器
function setupEventListeners() {
    loadFromStorageBtn.addEventListener('click', loadFromStorage);
    exportBtn.addEventListener('click', exportData);
    showDebugBtn.addEventListener('click', function() {
        if (debugInfo.style.display === 'none') {
            debugInfo.style.display = 'block';
            showDebugBtn.textContent = '隐藏调试信息';
        } else {
            debugInfo.style.display = 'none';
            showDebugBtn.textContent = '显示调试信息';
        }
    });
}

// 初始化
function init() {
    try {
        log('初始化完成', 'info');
        
        // 设置事件监听器
        setupEventListeners();
        
        // 检查是否在扩展环境中
        if (typeof chrome !== 'undefined') {
            log('检测到Chrome环境', 'info');
            
            if (chrome.runtime) {
                log('检测到chrome.runtime API', 'info');
            } else {
                log('未检测到chrome.runtime API', 'warning');
            }
            
            if (chrome.storage) {
                log('检测到chrome.storage API', 'info');
                // 自动加载数据
                loadFromStorage();
            } else {
                log('未检测到chrome.storage API', 'warning');
            }
        } else {
            log('未检测到Chrome环境，某些功能可能不可用', 'warning');
        }
    } catch (error) {
        log(`初始化失败: ${error.message}`, 'error');
    }
}

// 当文档加载完成后执行初始化
document.addEventListener('DOMContentLoaded', init); 