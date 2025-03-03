import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { CardService } from '../api/cardService';
import { Card, CardType } from '../models/Card';

interface CardImportProps {
  onImportComplete: (importedCards: Card[]) => void;
}

/**
 * 卡牌导入组件
 * 允许用户上传日志文件并从中提取卡牌数据
 */
const CardImport: React.FC<CardImportProps> = ({ onImportComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [fileSelected, setFileSelected] = useState(false);
  const [importStats, setImportStats] = useState<{
    total: number;
    new: number;
    duplicate: number;
    invalid: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileSelected(true);
    } else {
      setFileSelected(false);
    }
  };

  // 处理文件上传和导入
  const handleImport = async () => {
    if (!fileInputRef.current?.files?.length) {
      toast.error('请先选择文件');
      return;
    }

    setIsLoading(true);
    setImportStats(null);

    try {
      const file = fileInputRef.current.files[0];
      const fileContent = await readFileContent(file);
      
      // 解析文件内容，提取卡牌数据
      const extractedCards = parseLogFileForCards(fileContent);
      
      if (extractedCards.length === 0) {
        toast.warning('未从文件中找到有效的卡牌数据');
        setIsLoading(false);
        return;
      }

      // 导入卡牌数据
      const importResult = await CardService.importCards(extractedCards);
      
      // 更新导入统计信息
      setImportStats({
        total: extractedCards.length,
        new: importResult.newCards.length,
        duplicate: importResult.duplicates.length,
        invalid: importResult.invalidCards.length
      });

      // 通知父组件导入完成
      onImportComplete(importResult.newCards);
      
      // 显示成功消息
      if (importResult.newCards.length > 0) {
        toast.success(`成功导入 ${importResult.newCards.length} 张新卡牌`);
      } else if (importResult.duplicates.length > 0 && importResult.invalidCards.length > 0) {
        toast.warning(`未导入任何卡牌: ${importResult.duplicates.length} 张重复, ${importResult.invalidCards.length} 张无效`);
      } else if (importResult.duplicates.length > 0) {
        toast.warning(`未导入任何卡牌: ${importResult.duplicates.length} 张重复`);
      } else if (importResult.invalidCards.length > 0) {
        toast.warning(`未导入任何卡牌: ${importResult.invalidCards.length} 张无效`);
      }
      
      // 重置文件选择
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
        setFileSelected(false);
      }
    } catch (error) {
      console.error('导入卡牌数据时出错:', error);
      toast.error('导入卡牌数据时出错');
    } finally {
      setIsLoading(false);
    }
  };

  // 读取文件内容
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('读取文件内容失败'));
        }
      };
      reader.onerror = () => reject(new Error('读取文件时出错'));
      reader.readAsText(file);
    });
  };

  // 解析日志文件，提取卡牌数据
  const parseLogFileForCards = (content: string): Card[] => {
    const extractedCards: Card[] = [];
    const processedIds = new Set<string>(); // 用于跟踪已处理的卡牌ID
    
    try {
      // 1. 尝试查找包含卡牌数据的脚本块
      const scriptMatches = content.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/g);
      
      // 2. 处理脚本块中的内容
      if (scriptMatches) {
        for (const scriptContent of scriptMatches) {
          // 提取脚本内容
          const scriptText = scriptContent.replace(/<script[\s\S]*?>/, '').replace(/<\/script>/, '');
          extractCardsFromText(scriptText, extractedCards, processedIds);
        }
      }
      
      // 3. 如果从脚本中没有找到卡牌数据，尝试从整个内容中提取
      if (extractedCards.length === 0) {
        extractCardsFromText(content, extractedCards, processedIds);
      }
    } catch (error) {
      console.error('解析日志文件时出错:', error);
    }
    
    console.log(`从文件中提取了 ${extractedCards.length} 张卡牌`);
    return extractedCards;
  };
  
  // 从文本中提取卡牌数据
  const extractCardsFromText = (text: string, cards: Card[], processedIds: Set<string>): void => {
    try {
      // 1. 查找可能的JSON对象
      const jsonRegex = /\{[\s\S]*?"id"[\s\S]*?"name"[\s\S]*?\}/g;
      const jsonMatches = text.match(jsonRegex);
      
      if (jsonMatches) {
        for (const jsonStr of jsonMatches) {
          try {
            // 尝试提取完整的JSON对象
            const startPos = Math.max(0, text.lastIndexOf('{', text.indexOf(jsonStr)));
            let endPos = startPos;
            let openBrackets = 1;
            
            for (let i = startPos + 1; i < text.length; i++) {
              if (text[i] === '{') openBrackets++;
              else if (text[i] === '}') openBrackets--;
              
              if (openBrackets === 0) {
                endPos = i + 1;
                break;
              }
            }
            
            if (endPos <= startPos) continue;
            
            // 提取完整的JSON字符串
            const completeJsonStr = text.substring(startPos, endPos);
            
            // 清理JSON字符串
            const cleanedJson = cleanJsonString(completeJsonStr);
            
            // 尝试解析JSON
            try {
              const obj = JSON.parse(cleanedJson);
              processCardObject(obj, cards, processedIds);
            } catch (e) {
              // 如果解析失败，尝试提取关键字段
              const idMatch = cleanedJson.match(/"id"\s*:\s*"([^"]+)"/);
              const nameMatch = cleanedJson.match(/"name"\s*:\s*"([^"]+)"/);
              const typeMatch = cleanedJson.match(/"type"\s*:\s*"([^"]+)"/);
              
              if (idMatch && nameMatch) {
                // 构造最小化的有效JSON对象
                const minimalObj = {
                  id: idMatch[1],
                  name: nameMatch[1],
                  type: typeMatch ? typeMatch[1] : 'minor'
                };
                
                processCardObject(minimalObj, cards, processedIds);
              }
            }
          } catch (e) {
            // 忽略无法解析的JSON
            continue;
          }
        }
      }
      
      // 2. 查找可能的卡牌数组
      const arrayRegex = /\[\s*\{[\s\S]*?"id"[\s\S]*?"name"[\s\S]*?\}\s*\]/g;
      const arrayMatches = text.match(arrayRegex);
      
      if (arrayMatches) {
        for (const arrayStr of arrayMatches) {
          try {
            // 清理并解析数组
            const cleanedArrayStr = cleanJsonString(arrayStr);
            
            try {
              const cardArray = JSON.parse(cleanedArrayStr);
              if (Array.isArray(cardArray)) {
                for (const cardObj of cardArray) {
                  processCardObject(cardObj, cards, processedIds);
                }
              }
            } catch (e) {
              // 忽略解析失败的数组
            }
          } catch (e) {
            // 忽略无法处理的数组
            continue;
          }
        }
      }
      
      // 3. 查找"card"字段
      const cardObjRegex = /"card"\s*:\s*\{[\s\S]*?\}/g;
      const cardObjMatches = text.match(cardObjRegex);
      
      if (cardObjMatches) {
        for (const cardObjStr of cardObjMatches) {
          try {
            // 提取卡牌对象
            const cardObjMatch = cardObjStr.match(/"card"\s*:\s*(\{[\s\S]*?\})/);
            if (!cardObjMatch || !cardObjMatch[1]) continue;
            
            const cardJsonStr = cardObjMatch[1];
            const cleanedJson = cleanJsonString(cardJsonStr);
            
            try {
              const obj = JSON.parse(cleanedJson);
              processCardObject(obj, cards, processedIds);
            } catch (e) {
              // 忽略解析失败的卡牌对象
            }
          } catch (e) {
            // 忽略无法处理的卡牌对象
            continue;
          }
        }
      }
    } catch (error) {
      console.error('从文本中提取卡牌数据时出错:', error);
    }
  };
  
  // 清理JSON字符串
  const cleanJsonString = (jsonStr: string): string => {
    return jsonStr
      .replace(/'/g, '"')  // 将单引号替换为双引号
      .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')  // 确保键名有引号
      .replace(/,\s*}/g, '}')  // 移除尾随逗号
      .replace(/,\s*\]/g, ']')  // 移除数组末尾的逗号
      .replace(/:\s*undefined/g, ':null')  // 将undefined替换为null
      .replace(/:\s*NaN/g, ':0')  // 将NaN替换为0
      .replace(/:\s*Infinity/g, ':9999999')  // 将Infinity替换为大数字
      .replace(/:\s*-Infinity/g, ':-9999999');  // 将-Infinity替换为负大数字
  };
  
  // 处理卡牌对象
  const processCardObject = (obj: any, cards: Card[], processedIds: Set<string>): void => {
    // 检查是否是卡牌数据
    if (obj && obj.id && obj.name) {
      // 如果已经处理过这个ID，跳过
      const cardId = String(obj.id);
      if (processedIds.has(cardId)) return;
      processedIds.add(cardId);
      
      // 确定卡牌类型
      let cardType: CardType;
      if (typeof obj.type === 'string') {
        const typeStr = obj.type.toLowerCase();
        if (typeStr === 'occupation') {
          cardType = CardType.OCCUPATION;
        } else if (typeStr === 'minor') {
          cardType = CardType.MINOR;
        } else if (typeStr === 'major') {
          cardType = CardType.MAJOR;
        } else {
          // 默认为次要改良卡
          cardType = CardType.MINOR;
        }
      } else {
        // 如果类型不是字符串，默认为次要改良卡
        cardType = CardType.MINOR;
      }
      
      // 处理成本信息
      let costs = [];
      if (obj.costs) {
        try {
          // 检查costs的格式并进行标准化处理
          if (Array.isArray(obj.costs)) {
            if (obj.costs.length > 0) {
              // 检查第一个元素是否是数组
              if (Array.isArray(obj.costs[0])) {
                // 已经是数组的数组格式 [[{...}], [{...}]]
                costs = obj.costs;
              } else if (typeof obj.costs[0] === 'object' && obj.costs[0] !== null) {
                // 是对象数组 [{...}, {...}]，需要转换为数组的数组 [[{...}, {...}]]
                costs = [obj.costs];
              } else {
                // 其他情况，使用空数组
                costs = [];
              }
            }
          } else if (typeof obj.costs === 'object' && obj.costs !== null) {
            // 单个对象，转换为数组的数组 [[{...}]]
            costs = [[obj.costs]];
          } else {
            // 不是数组或对象，使用空数组
            costs = [];
          }
        } catch (e) {
          console.error('处理成本数据时出错:', e);
          costs = [];
        }
      }
      
      // 转换为卡牌对象
      const card: Card = {
        id: cardId,
        name: String(obj.name),
        type: cardType,
        deck: obj.deck ? String(obj.deck) : 'unknown',
        players: obj.players ? String(obj.players) : 'all',
        vp: obj.vp !== undefined ? Number(obj.vp) : 0,
        category: obj.category ? String(obj.category) : '',
        desc: Array.isArray(obj.desc) ? obj.desc.map(String) : (obj.desc ? [String(obj.desc)] : []),
        costs: costs,
        costText: obj.costText !== undefined ? String(obj.costText) : '',
        conditionalCost: obj.conditionalCost !== undefined ? String(obj.conditionalCost) : '',
        prerequisite: obj.prerequisite !== undefined ? String(obj.prerequisite) : '',
        extraVp: obj.extraVp === true,
        bonusVp: obj.bonusVp !== undefined ? String(obj.bonusVp) : '',
        numbering: obj.numbering !== undefined ? String(obj.numbering) : '',
        // 添加必需的字段，设置默认值
        holder: obj.holder === true,
        animalHolder: obj.animalHolder === true,
        field: obj.field === true,
        actionCard: obj.actionCard === true,
        fee: obj.fee || null
      };
      
      // 检查卡牌是否已存在于结果中
      if (!cards.some(c => c.id === card.id)) {
        cards.push(card);
      }
    }
  };

  return (
    <div className="card animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          导入卡牌数据
        </h2>
      </div>
      
      <div className="space-y-4">
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            选择日志文件
          </label>
          <div className="flex items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="*/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary-50 file:text-primary-700
                hover:file:bg-primary-100"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            支持所有文件类型，包括没有扩展名的文件 (如 cardsLog_01, cardsLog_02 等)
          </p>
          <p className="mt-1 text-xs text-gray-600 italic">
            提示：如果在Finder中看不到文件，请尝试按下 Command+Shift+. 显示隐藏文件，或直接拖放文件到此处
          </p>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={handleImport}
            disabled={isLoading || !fileSelected}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              isLoading || !fileSelected
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700'
            } transition-colors duration-200`}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                导入中...
              </span>
            ) : (
              '导入卡牌'
            )}
          </button>
        </div>
        
        {importStats && (
          <div className="mt-4 p-4 bg-green-50 rounded-md">
            <h3 className="text-sm font-medium text-green-800">导入结果</h3>
            <ul className="mt-2 text-sm text-green-700">
              <li>总计解析: {importStats.total} 张卡牌</li>
              <li>新增卡牌: {importStats.new} 张</li>
              <li>重复卡牌: {importStats.duplicate} 张</li>
              <li>无效卡牌: {importStats.invalid} 张</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardImport; 