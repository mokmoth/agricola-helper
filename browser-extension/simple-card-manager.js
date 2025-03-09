// 全局变量
let cardDB = null;
let currentCards = [];

// 初始化函数
async function initializeCardManager() {
    try {
        log('开始初始化卡牌管理器...', 'info');
        
        // 初始化调试信息区域
        const debugInfo = document.getElementById('debug-info');
        if (debugInfo) {
            debugInfo.style.display = 'none';
            debugInfo.innerHTML = ''; // 清空之前的内容
            
            // 添加初始调试信息
            const initialDebugLine = document.createElement('div');
            initialDebugLine.style.textAlign = 'center';
            initialDebugLine.style.padding = '10px';
            initialDebugLine.style.color = '#666';
            initialDebugLine.style.borderBottom = '1px solid #ddd';
            initialDebugLine.style.marginBottom = '10px';
            initialDebugLine.textContent = '--- 调试信息将显示在这里 ---';
            debugInfo.appendChild(initialDebugLine);
            
            // 添加一些系统信息
            log('调试信息区域已初始化', 'info');
            log(`浏览器: ${navigator.userAgent}`, 'info');
            log(`页面URL: ${window.location.href}`, 'info');
            log(`当前时间: ${new Date().toLocaleString()}`, 'info');
        } else {
            console.error('未找到调试信息区域元素');
        }
        
        // 初始化数据库
        try {
            cardDB = new AgricolaCardDB();
            await cardDB.init();
            log('数据库初始化成功', 'success');
        } catch (dbError) {
            log(`数据库初始化失败: ${dbError.message}`, 'error');
            // 尝试继续执行，可能仍然可以从Chrome存储加载数据
        }
        
        // 设置事件监听器
        try {
            setupEventListeners();
        } catch (eventError) {
            log(`设置事件监听器失败: ${eventError.message}`, 'error');
        }
        
        // 自动加载数据
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                log('检测到Chrome环境，尝试从存储加载数据', 'info');
                await loadFromStorage();
            } else {
                log('未检测到Chrome环境，尝试从IndexedDB加载数据', 'info');
                // 如果不在Chrome环境中，尝试从IndexedDB加载
                await loadFromDatabase();
            }
        } catch (loadError) {
            log(`加载数据失败: ${loadError.message}`, 'error');
        }
        
        log('卡牌管理器初始化完成', 'success');
    } catch (error) {
        log(`初始化失败: ${error.message}`, 'error');
        console.error('初始化错误详情:', error);
    }
}

// 从数据库加载数据
async function loadFromDatabase() {
    try {
        log('正在从数据库加载数据...', 'info');
        const cards = await cardDB.getAllCards();
        
        if (cards && cards.length > 0) {
            currentCards = cards;
            log(`成功从数据库加载 ${cards.length} 张卡牌`, 'success');
            renderCards(cards);
            updateStats(cards);
        } else {
            log('数据库中没有卡牌数据', 'warning');
        }
    } catch (error) {
        log(`从数据库加载数据失败: ${error.message}`, 'error');
    }
}

// 清空数据库
async function clearDatabase() {
    try {
        if (confirm('确定要清空数据库吗？此操作不可撤销！')) {
            log('正在清空数据库...', 'info');
            await cardDB.clearDatabase();
            
            // 清空Chrome存储
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.remove('agricolaCards', function() {
                    log('Chrome存储中的卡牌数据已清空', 'info');
                });
            }
            
            currentCards = [];
            renderCards([]);
            updateStats([]);
            log('数据库已清空', 'success');
        }
    } catch (error) {
        log(`清空数据库失败: ${error.message}`, 'error');
    }
}

// 导入数据
async function importData() {
    try {
        log('导入数据函数被调用', 'info');
        
        const importFile = document.getElementById('import-file');
        
        if (!importFile) {
            log('未找到文件输入元素', 'error');
            return;
        }
        
        log(`文件输入元素状态: ${importFile.files ? '有files属性' : '无files属性'}`, 'info');
        
        if (!importFile.files || !importFile.files.length) {
            log('请选择要导入的JSON文件', 'warning');
            return;
        }
        
        const file = importFile.files[0];
        log(`选择的文件: ${file.name}, 大小: ${file.size} 字节, 类型: ${file.type}`, 'info');
        
        // 使用Promise包装FileReader，使其更易于处理错误
        const readFileAsText = (file) => {
            return new Promise((resolve, reject) => {
                log('开始读取文件...', 'info');
                const reader = new FileReader();
                
                reader.onload = (event) => {
                    try {
                        log(`文件读取完成，数据长度: ${event.target.result.length} 字符`, 'info');
                        resolve(event.target.result);
                    } catch (error) {
                        log(`文件读取回调中出错: ${error.message}`, 'error');
                        reject(error);
                    }
                };
                
                reader.onerror = (error) => {
                    log(`文件读取错误: ${error}`, 'error');
                    reject(error);
                };
                
                reader.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percentLoaded = Math.round((event.loaded / event.total) * 100);
                        log(`文件读取进度: ${percentLoaded}%`, 'info');
                    }
                };
                
                try {
                    reader.readAsText(file);
                    log('文件读取请求已发送', 'info');
                } catch (error) {
                    log(`调用readAsText时出错: ${error.message}`, 'error');
                    reject(error);
                }
            });
        };
        
        try {
            // 读取文件内容
            log('准备读取文件内容...', 'info');
            const jsonData = await readFileAsText(file);
            log('文件读取成功，正在解析JSON...', 'info');
            
            // 确保数据库已初始化
            if (!cardDB) {
                log('数据库未初始化，正在初始化...', 'info');
                cardDB = new AgricolaCardDB();
                await cardDB.init();
                log('数据库初始化成功', 'success');
            }
            
            try {
                // 尝试解析JSON
                log('开始解析JSON数据...', 'info');
                const parsedData = JSON.parse(jsonData);
                log(`JSON解析成功，包含 ${Array.isArray(parsedData) ? parsedData.length : 0} 条记录`, 'info');
                
                if (!Array.isArray(parsedData)) {
                    log('导入的数据不是数组格式', 'error');
                    return;
                }
                
                // 导入数据到数据库
                log(`准备导入 ${parsedData.length} 条记录到数据库...`, 'info');
                const result = await cardDB.addCards(parsedData);
                log(`导入完成: ${result.success}张卡牌添加成功, ${result.error}张卡牌添加失败`, 'success');
                
                // 更新Chrome存储
                if (typeof chrome !== 'undefined' && chrome.storage) {
                    log('正在更新Chrome存储...', 'info');
                    const allCards = await cardDB.getAllCards();
                    chrome.storage.local.set({ 'agricolaCards': allCards || [] }, function() {
                        log(`已将 ${allCards.length} 张卡牌保存到Chrome存储`, 'info');
                        
                        // 更新当前卡牌数据
                        currentCards = allCards;
                        
                        // 渲染卡牌
                        renderCards(allCards);
                        updateStats(allCards);
                        
                        // 隐藏导入容器
                        const importContainer = document.getElementById('import-container');
                        if (importContainer) {
                            importContainer.style.display = 'none';
                        }
                    });
                } else {
                    // 如果不在Chrome环境中，直接从数据库加载
                    log('未检测到Chrome存储，直接从数据库加载数据', 'info');
                    loadFromDatabase();
                }
            } catch (error) {
                log(`JSON解析失败: ${error.message}`, 'error');
            }
        } catch (error) {
            log(`读取文件内容失败: ${error.message}`, 'error');
        }
    } catch (error) {
        log(`导入数据过程中出错: ${error.message}`, 'error');
        console.error('导入数据错误详情:', error);
    }
}

// 筛选和排序卡牌
async function filterAndSortCards() {
    try {
        // 获取筛选条件
        const searchText = document.getElementById('search-input').value.trim().toLowerCase();
        const typeValue = document.getElementById('type-filter').value;
        const deckValue = document.getElementById('deck-filter').value;
        const sortValue = document.getElementById('sort-by').value;
        
        log(`应用筛选: 搜索="${searchText}", 类型="${typeValue}", 牌组="${deckValue}", 排序="${sortValue}"`, 'info');
        
        // 获取所有卡牌
        let cards = currentCards;
        
        // 应用筛选
        if (searchText) {
            cards = cards.filter(card => 
                (card.zhName && card.zhName.toLowerCase().includes(searchText)) || 
                (card.name && card.name.toLowerCase().includes(searchText)) || 
                (card.zhDesc && Array.isArray(card.zhDesc) && card.zhDesc.some(desc => desc.toLowerCase().includes(searchText))) || 
                (card.description && card.description.toLowerCase().includes(searchText))
            );
        }
        
        if (typeValue) {
            cards = cards.filter(card => card.type === typeValue);
        }
        
        if (deckValue) {
            cards = cards.filter(card => card.deck === deckValue);
        }
        
        // 应用排序
        if (sortValue === 'name') {
            cards.sort((a, b) => {
                const nameA = a.zhName || a.name || '';
                const nameB = b.zhName || b.name || '';
                return nameA.localeCompare(nameB, 'zh-CN');
            });
        } else if (sortValue === 'type') {
            cards.sort((a, b) => {
                if (a.type !== b.type) {
                    return a.type.localeCompare(b.type);
                }
                const nameA = a.zhName || a.name || '';
                const nameB = b.zhName || b.name || '';
                return nameA.localeCompare(nameB, 'zh-CN');
            });
        } else if (sortValue === 'deck') {
            cards.sort((a, b) => {
                if (!a.deck) return 1;
                if (!b.deck) return -1;
                if (a.deck !== b.deck) {
                    return a.deck.localeCompare(b.deck);
                }
                const nameA = a.zhName || a.name || '';
                const nameB = b.zhName || b.name || '';
                return nameA.localeCompare(nameB, 'zh-CN');
            });
        }
        
        // 渲染卡牌
        renderCards(cards);
        
        log(`筛选结果: 显示 ${cards.length} 张卡牌`, 'success');
    } catch (error) {
        log(`筛选卡牌失败: ${error.message}`, 'error');
    }
}

// 重置筛选条件
function resetFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('type-filter').value = '';
    document.getElementById('deck-filter').value = '';
    document.getElementById('sort-by').value = 'name';
    
    // 重新渲染所有卡牌
    renderCards(currentCards);
    log('已重置所有筛选条件', 'info');
}

// 从Chrome存储加载数据
async function loadFromStorage() {
    try {
        log('正在从Chrome存储加载数据...', 'info');
        
        if (typeof chrome === 'undefined' || !chrome.storage) {
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
                                currentCards = result.agricolaCards;
                                log(`成功加载 ${currentCards.length} 张卡牌`, 'success');
                                
                                // 显示前5张卡牌的字段信息，用于调试
                                const sampleCards = currentCards.slice(0, 5);
                                sampleCards.forEach((card, index) => {
                                    const cardFields = Object.keys(card);
                                    log(`卡牌 #${index + 1} (${card.id}) 字段: ${cardFields.join(', ')}`, 'info');
                                });
                                
                                // 同步到数据库
                                syncToDatabase(currentCards);
                                
                                // 渲染卡牌
                                renderCards(currentCards);
                                updateStats(currentCards);
                            } else {
                                log(`存储中的agricolaCards是空数组或非数组: ${JSON.stringify(result.agricolaCards)}`, 'warning');
                            }
                        } else {
                            log('存储中没有agricolaCards数据', 'warning');
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

// 将数据同步到数据库
async function syncToDatabase(cards) {
    try {
        if (!cardDB) {
            log('数据库未初始化', 'error');
            return;
        }
        
        log('正在将数据同步到数据库...', 'info');
        
        // 清空数据库
        await cardDB.clearDatabase();
        
        // 添加卡牌
        const result = await cardDB.addCards(cards);
        log(`数据库同步完成: ${result.success}张卡牌添加成功, ${result.error}张卡牌添加失败`, 'success');
    } catch (error) {
        log(`同步到数据库失败: ${error.message}`, 'error');
    }
}

// 导出数据
function exportData() {
    try {
        if (currentCards.length === 0) {
            log('没有数据可导出', 'warning');
            return;
        }
        
        const jsonData = JSON.stringify(currentCards, null, 2);
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

// 设置事件监听器
function setupEventListeners() {
    try {
        log('开始设置事件监听器...', 'info');
        
        // 从存储加载数据按钮
        const loadFromStorageBtn = document.getElementById('load-from-storage');
        if (loadFromStorageBtn) {
            loadFromStorageBtn.addEventListener('click', loadFromStorage);
            log('从存储加载数据按钮事件监听器已设置', 'info');
        } else {
            log('未找到从存储加载数据按钮', 'error');
        }
        
        // 导出数据按钮
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportData);
            log('导出数据按钮事件监听器已设置', 'info');
        } else {
            log('未找到导出数据按钮', 'error');
        }
        
        // 导入数据按钮
        const importBtn = document.getElementById('import-btn');
        if (importBtn) {
            importBtn.addEventListener('click', function() {
                log('导入数据按钮被点击', 'info');
                const importContainer = document.getElementById('import-container');
                if (importContainer) {
                    importContainer.style.display = importContainer.style.display === 'none' || importContainer.style.display === '' ? 'block' : 'none';
                    log(`导入容器显示状态: ${importContainer.style.display}`, 'info');
                } else {
                    log('未找到导入容器', 'error');
                }
            });
            log('导入数据按钮事件监听器已设置', 'info');
        } else {
            log('未找到导入数据按钮', 'error');
        }
        
        // 处理导入按钮
        const processImportBtn = document.getElementById('process-import-btn');
        if (processImportBtn) {
            // 移除可能存在的旧事件监听器
            processImportBtn.removeEventListener('click', importData);
            
            // 添加新的事件监听器
            processImportBtn.addEventListener('click', function(event) {
                log('处理导入按钮被点击', 'info');
                event.preventDefault(); // 防止表单提交
                importData();
            });
            
            log('处理导入按钮事件监听器已设置', 'info');
        } else {
            log('未找到处理导入按钮', 'error');
        }
        
        // 取消导入按钮
        const cancelImportBtn = document.getElementById('cancel-import-btn');
        if (cancelImportBtn) {
            cancelImportBtn.addEventListener('click', function() {
                log('取消导入按钮被点击', 'info');
                const importContainer = document.getElementById('import-container');
                if (importContainer) {
                    importContainer.style.display = 'none';
                    log('导入容器已隐藏', 'info');
                }
                
                // 清空文件输入
                const importFile = document.getElementById('import-file');
                if (importFile) {
                    importFile.value = '';
                    log('文件输入已清空', 'info');
                }
            });
            log('取消导入按钮事件监听器已设置', 'info');
        } else {
            log('未找到取消导入按钮', 'error');
        }
        
        // 导入表单提交
        const importForm = document.getElementById('import-form');
        if (importForm) {
            importForm.addEventListener('submit', function(event) {
                log('导入表单被提交', 'info');
                event.preventDefault(); // 防止表单提交
                importData();
            });
            log('导入表单事件监听器已设置', 'info');
        } else {
            log('未找到导入表单', 'error');
        }
        
        // 文件输入元素变化
        const importFile = document.getElementById('import-file');
        if (importFile) {
            importFile.addEventListener('change', function(event) {
                const files = event.target.files;
                if (files && files.length > 0) {
                    log(`已选择文件: ${files[0].name}`, 'info');
                } else {
                    log('未选择文件', 'warning');
                }
            });
            log('文件输入元素事件监听器已设置', 'info');
        } else {
            log('未找到文件输入元素', 'error');
        }
        
        // 清空数据库按钮
        const clearBtn = document.getElementById('clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', clearDatabase);
            log('清空数据库按钮事件监听器已设置', 'info');
        } else {
            log('未找到清空数据库按钮', 'error');
        }
        
        // 显示调试信息按钮
        const showDebugBtn = document.getElementById('show-debug');
        if (showDebugBtn) {
            showDebugBtn.addEventListener('click', function() {
                const debugInfo = document.getElementById('debug-info');
                if (debugInfo) {
                    // 检查当前计算样式而不是内联样式
                    const currentDisplay = window.getComputedStyle(debugInfo).display;
                    log(`当前调试信息区域显示状态: ${currentDisplay}`, 'info');
                    
                    if (currentDisplay === 'none') {
                        debugInfo.style.display = 'block';
                        this.textContent = '隐藏调试信息';
                        log('已显示调试信息区域', 'success');
                        
                        // 添加一些测试日志
                        log('这是一条测试信息', 'info');
                        log('这是一条成功信息', 'success');
                        log('这是一条警告信息', 'warning');
                        log('这是一条错误信息', 'error');
                        
                        // 自动滚动到底部
                        debugInfo.scrollTop = debugInfo.scrollHeight;
                    } else {
                        debugInfo.style.display = 'none';
                        this.textContent = '显示调试信息';
                        log('已隐藏调试信息区域', 'info');
                    }
                } else {
                    log('未找到调试信息容器', 'error');
                }
            });
            log('显示调试信息按钮事件监听器已设置', 'info');
        } else {
            log('未找到显示调试信息按钮', 'error');
        }
        
        // 搜索按钮
        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', filterAndSortCards);
            log('搜索按钮事件监听器已设置', 'info');
        } else {
            log('未找到搜索按钮', 'error');
        }
        
        // 重置搜索按钮
        const resetSearchBtn = document.getElementById('reset-search');
        if (resetSearchBtn) {
            resetSearchBtn.addEventListener('click', resetFilters);
            log('重置搜索按钮事件监听器已设置', 'info');
        } else {
            log('未找到重置搜索按钮', 'error');
        }
        
        // 类型筛选器变化
        const typeFilter = document.getElementById('type-filter');
        if (typeFilter) {
            typeFilter.addEventListener('change', filterAndSortCards);
            log('类型筛选器事件监听器已设置', 'info');
        } else {
            log('未找到类型筛选器', 'error');
        }
        
        // 牌组筛选器变化
        const deckFilter = document.getElementById('deck-filter');
        if (deckFilter) {
            deckFilter.addEventListener('change', filterAndSortCards);
            log('牌组筛选器事件监听器已设置', 'info');
        } else {
            log('未找到牌组筛选器', 'error');
        }
        
        // 排序方式变化
        const sortBy = document.getElementById('sort-by');
        if (sortBy) {
            sortBy.addEventListener('change', filterAndSortCards);
            log('排序方式事件监听器已设置', 'info');
        } else {
            log('未找到排序方式选择器', 'error');
        }
        
        // 搜索框回车键
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('keyup', function(e) {
                if (e.key === 'Enter') {
                    log('搜索框回车键被按下', 'info');
                    filterAndSortCards();
                }
            });
            log('搜索框事件监听器已设置', 'info');
        } else {
            log('未找到搜索框', 'error');
        }
        
        // 清理不完整卡牌按钮
        const cleanBtn = document.getElementById('clean-btn');
        if (cleanBtn) {
            cleanBtn.addEventListener('click', cleanIncompleteCards);
            log('清理不完整卡牌按钮事件监听器已设置', 'info');
        } else {
            log('未找到清理不完整卡牌按钮', 'error');
        }
        
        log('所有事件监听器设置完成', 'info');
    } catch (error) {
        log(`设置事件监听器失败: ${error.message}`, 'error');
        console.error('设置事件监听器错误详情:', error);
    }
}

// 显示状态消息和记录调试信息
function log(message, type = 'info') {
    // 输出到控制台
    console.log(message);
    
    // 更新状态消息
    const statusMessage = document.getElementById('status-message');
    if (statusMessage) {
        statusMessage.textContent = message;
        statusMessage.className = type;
        statusMessage.style.display = 'block';
        
        // 5秒后自动隐藏状态消息
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 5000);
    }
    
    // 添加到调试信息区域
    try {
        const debugInfo = document.getElementById('debug-info');
        if (debugInfo) {
            // 创建新的调试信息行
            const timestamp = new Date().toLocaleTimeString();
            const debugLine = document.createElement('div');
            debugLine.style.marginBottom = '5px';
            debugLine.style.paddingBottom = '5px';
            debugLine.style.borderBottom = '1px solid #eee';
            
            // 根据消息类型设置不同的样式
            let typeStyle = '';
            switch(type) {
                case 'error':
                    typeStyle = 'color: #721c24; font-weight: bold;';
                    break;
                case 'warning':
                    typeStyle = 'color: #856404;';
                    break;
                case 'success':
                    typeStyle = 'color: #155724;';
                    break;
                default:
                    typeStyle = 'color: #0c5460;';
            }
            
            // 设置内容
            debugLine.innerHTML = `<span style="color: #666;">[${timestamp}]</span> <span style="${typeStyle}">[${type}]</span> ${message}`;
            
            // 添加到调试信息区域
            debugInfo.appendChild(debugLine);
            
            // 自动滚动到底部
            debugInfo.scrollTop = debugInfo.scrollHeight;
        }
    } catch (error) {
        console.error('添加调试信息时出错:', error);
    }
}

// 渲染卡牌列表
function renderCards(cards) {
    const cardList = document.getElementById('card-list');
    
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
    
    document.getElementById('total-cards').textContent = stats.total;
    document.getElementById('occupation-cards').textContent = stats.occupation;
    document.getElementById('minor-cards').textContent = stats.minor;
    document.getElementById('major-cards').textContent = stats.major;
    document.getElementById('action-cards').textContent = stats.action;
    
    // 在调试信息中显示详细统计
    log(`统计信息: 总计 ${stats.total} 张卡牌 (职业卡: ${stats.occupation}, 小改良卡: ${stats.minor}, 大改良卡: ${stats.major}, 行动卡: ${stats.action}, 未知类型: ${stats.unknown})`, 'info');
}

// 清理不完整卡牌
async function cleanIncompleteCards() {
    try {
        if (confirm('确定要清理不完整的卡牌吗？此操作将删除所有没有中文名称或中文描述的卡牌。')) {
            log('正在清理不完整的卡牌...', 'info');
            
            // 获取所有卡牌
            const allCards = await cardDB.getAllCards();
            log(`数据库中共有 ${allCards.length} 张卡牌`, 'info');
            
            // 筛选出完整的卡牌
            const completeCards = allCards.filter(card => isCardComplete(card));
            log(`其中完整的卡牌有 ${completeCards.length} 张`, 'info');
            
            // 计算要删除的卡牌数量
            const incompleteCount = allCards.length - completeCards.length;
            log(`将删除 ${incompleteCount} 张不完整的卡牌`, 'warning');
            
            if (incompleteCount > 0) {
                // 清空数据库
                await cardDB.clearDatabase();
                log('数据库已清空', 'info');
                
                // 重新添加完整的卡牌
                const result = await cardDB.addCards(completeCards);
                log(`重新添加完成: ${result.success}张卡牌添加成功, ${result.error}张卡牌添加失败`, 'success');
                
                // 更新Chrome存储
                if (typeof chrome !== 'undefined' && chrome.storage) {
                    chrome.storage.local.set({ 'agricolaCards': completeCards || [] }, function() {
                        log('卡牌数据已保存到Chrome存储', 'info');
                        
                        // 更新当前卡牌数据
                        currentCards = completeCards;
                        
                        // 渲染卡牌
                        renderCards(completeCards);
                        updateStats(completeCards);
                        
                        log('清理完成', 'success');
                    });
                } else {
                    // 如果不在Chrome环境中，直接更新界面
                    currentCards = completeCards;
                    renderCards(completeCards);
                    updateStats(completeCards);
                    log('清理完成', 'success');
                }
            } else {
                log('没有发现不完整的卡牌', 'info');
            }
        }
    } catch (error) {
        log(`清理不完整卡牌失败: ${error.message}`, 'error');
    }
}

// 检查卡牌是否完整
function isCardComplete(card) {
    // 卡牌必须有ID和类型
    if (!card.id || !card.type) {
        return false;
    }
    
    // 卡牌必须有中文名称
    if (!card.zhName) {
        return false;
    }
    
    // 卡牌必须有中文描述
    if (!card.zhDesc || !Array.isArray(card.zhDesc) || card.zhDesc.length === 0) {
        return false;
    }
    
    return true;
}

// 当文档加载完成后执行初始化
document.addEventListener('DOMContentLoaded', initializeCardManager); 