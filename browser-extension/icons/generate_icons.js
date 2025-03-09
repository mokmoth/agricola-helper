/**
 * 生成简单的图标文件
 * 
 * 使用方法：
 * 1. 安装 Node.js
 * 2. 安装依赖：npm install canvas fs
 * 3. 运行脚本：node generate_icons.js
 */

const { createCanvas } = require('canvas');
const fs = require('fs');

// 生成图标函数
function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // 背景
  ctx.fillStyle = '#3498db';
  ctx.fillRect(0, 0, size, size);
  
  // 卡牌形状
  const cardWidth = size * 0.7;
  const cardHeight = size * 0.8;
  const cardX = (size - cardWidth) / 2;
  const cardY = (size - cardHeight) / 2;
  
  ctx.fillStyle = 'white';
  ctx.fillRect(cardX, cardY, cardWidth, cardHeight);
  
  // 卡牌边框
  ctx.strokeStyle = '#2c3e50';
  ctx.lineWidth = Math.max(1, size * 0.02);
  ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);
  
  // 卡牌标题线
  const titleLineY = cardY + cardHeight * 0.2;
  ctx.beginPath();
  ctx.moveTo(cardX, titleLineY);
  ctx.lineTo(cardX + cardWidth, titleLineY);
  ctx.stroke();
  
  // 卡牌内容线
  const contentLineCount = 3;
  const contentLineSpacing = cardHeight * 0.15;
  const contentLineStartY = titleLineY + contentLineSpacing;
  
  ctx.strokeStyle = '#bdc3c7';
  ctx.lineWidth = Math.max(1, size * 0.01);
  
  for (let i = 0; i < contentLineCount; i++) {
    const lineY = contentLineStartY + i * contentLineSpacing;
    const lineWidth = cardWidth * (0.9 - i * 0.15);
    
    ctx.beginPath();
    ctx.moveTo(cardX + (cardWidth - lineWidth) / 2, lineY);
    ctx.lineTo(cardX + (cardWidth - lineWidth) / 2 + lineWidth, lineY);
    ctx.stroke();
  }
  
  // 字母A
  if (size >= 48) {
    ctx.fillStyle = '#e74c3c';
    ctx.font = `bold ${size * 0.25}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('A', size / 2, cardY + cardHeight * 0.1);
  }
  
  return canvas.toBuffer();
}

// 生成并保存图标
function saveIcon(size, filename) {
  const buffer = generateIcon(size);
  fs.writeFileSync(filename, buffer);
  console.log(`Generated ${filename}`);
}

// 生成所有图标
saveIcon(16, 'icon16.png');
saveIcon(48, 'icon48.png');
saveIcon(128, 'icon128.png');

console.log('All icons generated successfully!'); 