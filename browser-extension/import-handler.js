// 导入处理器
(function() {
    console.log('导入处理器已加载');
    
    // 等待DOM加载完成
    document.addEventListener('DOMContentLoaded', function() {
        console.log('导入处理器DOM加载完成');
        setupImportHandlers();
    });
    
    // 设置导入处理器
    function setupImportHandlers() {
        console.log('设置导入处理器...');
        
        // 导入按钮
        const importBtn = document.getElementById('import-btn');
        if (importBtn) {
            importBtn.addEventListener('click', function() {
                console.log('导入按钮被点击');
                const importContainer = document.getElementById('import-container');
                if (importContainer) {
                    importContainer.style.display = importContainer.style.display === 'none' || importContainer.style.display === '' ? 'block' : 'none';
                    console.log(`导入容器显示状态: ${importContainer.style.display}`);
                } else {
                    console.error('未找到导入容器');
                }
            });
            console.log('导入按钮事件监听器已设置');
        } else {
            console.error('未找到导入按钮');
        }
        
        // 处理导入按钮
        const processImportBtn = document.getElementById('process-import-btn');
        if (processImportBtn) {
            processImportBtn.addEventListener('click', function(event) {
                console.log('处理导入按钮被点击');
                event.preventDefault();
                handleImport();
            });
            console.log('处理导入按钮事件监听器已设置');
        } else {
            console.error('未找到处理导入按钮');
        }
        
        // 取消导入按钮
        const cancelImportBtn = document.getElementById('cancel-import-btn');
        if (cancelImportBtn) {
            cancelImportBtn.addEventListener('click', function() {
                console.log('取消导入按钮被点击');
                const importContainer = document.getElementById('import-container');
                if (importContainer) {
                    importContainer.style.display = 'none';
                    console.log('导入容器已隐藏');
                }
                
                // 清空文件输入
                const importFile = document.getElementById('import-file');
                if (importFile) {
                    importFile.value = '';
                    console.log('文件输入已清空');
                }
            });
            console.log('取消导入按钮事件监听器已设置');
        } else {
            console.error('未找到取消导入按钮');
        }
        
        // 导入表单提交
        const importForm = document.getElementById('import-form');
        if (importForm) {
            importForm.addEventListener('submit', function(event) {
                console.log('导入表单被提交');
                event.preventDefault();
                handleImport();
            });
            console.log('导入表单事件监听器已设置');
        } else {
            console.error('未找到导入表单');
        }
        
        // 文件输入元素变化
        const importFile = document.getElementById('import-file');
        if (importFile) {
            importFile.addEventListener('change', function(event) {
                const files = event.target.files;
                if (files && files.length > 0) {
                    console.log(`已选择文件: ${files[0].name}`);
                } else {
                    console.warn('未选择文件');
                }
            });
            console.log('文件输入元素事件监听器已设置');
        } else {
            console.error('未找到文件输入元素');
        }
    }
    
    // 处理导入
    function handleImport() {
        console.log('开始处理导入...');
        
        const importFile = document.getElementById('import-file');
        if (!importFile) {
            console.error('未找到文件输入元素');
            showMessage('未找到文件输入元素', 'error');
            return;
        }
        
        if (!importFile.files || !importFile.files.length) {
            console.warn('请选择要导入的JSON文件');
            showMessage('请选择要导入的JSON文件', 'warning');
            return;
        }
        
        const file = importFile.files[0];
        console.log(`选择的文件: ${file.name}, 大小: ${file.size} 字节, 类型: ${file.type}`);
        
        // 读取文件
        const reader = new FileReader();
        
        reader.onload = function(event) {
            console.log(`文件读取完成，数据长度: ${event.target.result.length} 字符`);
            
            try {
                // 解析JSON
                const jsonData = event.target.result;
                console.log('开始解析JSON数据...');
                const parsedData = JSON.parse(jsonData);
                console.log(`JSON解析成功，包含 ${Array.isArray(parsedData) ? parsedData.length : 0} 条记录`);
                
                if (!Array.isArray(parsedData)) {
                    console.error('导入的数据不是数组格式');
                    showMessage('导入的数据不是数组格式', 'error');
                    return;
                }
                
                // 导入数据到数据库
                importToDatabase(parsedData);
            } catch (error) {
                console.error(`JSON解析失败: ${error.message}`);
                showMessage(`JSON解析失败: ${error.message}`, 'error');
            }
        };
        
        reader.onerror = function(error) {
            console.error(`文件读取错误: ${error}`);
            showMessage(`文件读取错误: ${error}`, 'error');
        };
        
        reader.onprogress = function(event) {
            if (event.lengthComputable) {
                const percentLoaded = Math.round((event.loaded / event.total) * 100);
                console.log(`文件读取进度: ${percentLoaded}%`);
            }
        };
        
        try {
            reader.readAsText(file);
            console.log('文件读取请求已发送');
        } catch (error) {
            console.error(`调用readAsText时出错: ${error.message}`);
            showMessage(`调用readAsText时出错: ${error.message}`, 'error');
        }
    }
    
    // 导入数据到数据库
    async function importToDatabase(data) {
        console.log(`准备导入 ${data.length} 条记录到数据库...`);
        
        try {
            // 初始化数据库
            const cardDB = new AgricolaCardDB();
            await cardDB.init();
            console.log('数据库初始化成功');
            
            // 导入数据
            const result = await cardDB.addCards(data);
            console.log(`导入完成: ${result.success}张卡牌添加成功, ${result.error}张卡牌添加失败`);
            showMessage(`导入完成: ${result.success}张卡牌添加成功, ${result.error}张卡牌添加失败`, 'success');
            
            // 更新Chrome存储
            if (typeof chrome !== 'undefined' && chrome.storage) {
                console.log('正在更新Chrome存储...');
                const allCards = await cardDB.getAllCards();
                chrome.storage.local.set({ 'agricolaCards': allCards || [] }, function() {
                    console.log(`已将 ${allCards.length} 张卡牌保存到Chrome存储`);
                    
                    // 隐藏导入容器
                    const importContainer = document.getElementById('import-container');
                    if (importContainer) {
                        importContainer.style.display = 'none';
                    }
                    
                    // 刷新页面
                    location.reload();
                });
            } else {
                console.log('未检测到Chrome存储，刷新页面');
                location.reload();
            }
        } catch (error) {
            console.error(`导入数据到数据库失败: ${error.message}`);
            showMessage(`导入数据到数据库失败: ${error.message}`, 'error');
        }
    }
    
    // 显示消息
    function showMessage(message, type = 'info') {
        console.log(message);
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
    }
})(); 