/* 生成 PWA 图标：node tools/gen-icons.js  —— 纯 Node 手写 PNG（zlib），无第三方依赖
 * 图案：暗夜星穹底 + 金色九星（3×3，中星略大）+ 外环，呼应「九星霸体」 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/* ---------- PNG 编码 ---------- */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePNG(size, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    sig, chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

/* ---------- 绘制 ---------- */
function draw(size) {
  const px = Buffer.alloc(size * size * 4);
  const put = (x, y, r, g, b, a) => {
    const i = (y * size + x) * 4;
    const ia = 1 - a;
    px[i] = Math.round(px[i] * ia + r * a);
    px[i + 1] = Math.round(px[i + 1] * ia + g * a);
    px[i + 2] = Math.round(px[i + 2] * ia + b * a);
    px[i + 3] = 255;
  };
  // 九星位置（3×3 网格，中心星略大）
  const stars = [];
  for (let gy = 0; gy < 3; gy++) for (let gx = 0; gx < 3; gx++)
    stars.push({ x: 0.30 + gx * 0.20, y: 0.30 + gy * 0.20, r: (gx === 1 && gy === 1) ? 0.062 : 0.048 });

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size, ny = y / size;
      // 背景：径向暗夜渐变
      const d0 = Math.hypot(nx - 0.5, ny - 0.5);
      let br = 10 + 16 * (1 - d0), bg = 15 + 22 * (1 - d0), bb = 34 + 34 * (1 - d0);
      // 外环
      const ring = Math.abs(d0 - 0.455);
      if (ring < 0.006) { br = 212; bg = 175; bb = 55; }
      else if (ring < 0.016) { const t = 1 - (ring - 0.006) / 0.010; br += (212 - br) * t * 0.35; bg += (175 - bg) * t * 0.35; bb += (55 - bb) * t * 0.35; }
      // 九星（实心 + 柔光）
      let I = 0;
      for (const s of stars) {
        const d = Math.hypot(nx - s.x, ny - s.y);
        const core = Math.max(0, Math.min(1, (s.r - d) / (1.5 / size)));
        const glow = Math.exp(-(d * d) / (2 * s.r * s.r * 0.36)) * 0.42;
        I = Math.max(I, core + glow * (1 - core));
      }
      if (I > 0) {
        const gr = 245, gg = 215, gb = 110; // 金
        br = br * (1 - I) + gr * I; bg = bg * (1 - I) + gg * I; bb = bb * (1 - I) + gb * I;
      }
      put(x, y, Math.round(br), Math.round(bg), Math.round(bb), 1);
    }
  }
  return px;
}

const out = path.join(__dirname, '..');
fs.writeFileSync(path.join(out, 'icon-512.png'), encodePNG(512, draw(512)));
fs.writeFileSync(path.join(out, 'icon-192.png'), encodePNG(192, draw(192)));
console.log('OK icons:', fs.statSync(path.join(out, 'icon-512.png')).size, 'bytes /',
  fs.statSync(path.join(out, 'icon-192.png')).size, 'bytes');
