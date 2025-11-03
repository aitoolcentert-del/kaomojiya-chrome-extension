// 這個腳本在 Node.js 環境中運行，需要安裝 canvas 套件
// 運行: node generate-icons.js

const fs = require('fs');
const { createCanvas } = require('canvas');

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // 繪製漸變背景
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // 繪製顏文字
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.45}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('(◕‿◕)', size / 2, size / 2);

  // 保存為 PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`icon${size}.png`, buffer);
  console.log(`✓ icon${size}.png 生成完了`);
}

// 生成所有尺寸的圖示
[16, 48, 128].forEach(size => {
  try {
    generateIcon(size);
  } catch (error) {
    console.error(`✗ icon${size}.png 生成失敗:`, error.message);
  }
});

console.log('\n完了！すべてのアイコンが生成されました。');
