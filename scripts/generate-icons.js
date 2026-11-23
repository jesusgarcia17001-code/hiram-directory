const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 1. Crear el SVG con fondo naranja y "O" blanca centrada
const orange = '#F97316'; // brand.colors.accent
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="96" fill="${orange}"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="
    M 256 116
    C 180 116 130 168 130 256
    C 130 344 180 396 256 396
    C 332 396 382 344 382 256
    C 382 168 332 116 256 116
    Z
    M 256 182
    C 292 182 316 210 316 256
    C 316 302 292 330 256 330
    C 220 330 196 302 196 256
    C 196 210 220 182 256 182
    Z
  " fill="#FFFFFF"/>
</svg>`;

async function run() {
  const svgPath = path.join(__dirname, '../public/icons/icon.svg');
  fs.writeFileSync(svgPath, svgContent.trim());
  console.log('Saved icon.svg');

  const svgBuffer = Buffer.from(svgContent);

  // 2. Generar PNGs
  const icon512Path = path.join(__dirname, '../public/icons/icon-512.png');
  await sharp(svgBuffer).resize(512, 512).png().toFile(icon512Path);
  console.log('Saved icon-512.png');

  const icon192Path = path.join(__dirname, '../public/icons/icon-192.png');
  await sharp(svgBuffer).resize(192, 192).png().toFile(icon192Path);
  console.log('Saved icon-192.png');

  const appIconPath = path.join(__dirname, '../src/app/icon.png');
  await sharp(svgBuffer).resize(192, 192).png().toFile(appIconPath);
  console.log('Saved src/app/icon.png');

  const appleIconPath = path.join(__dirname, '../src/app/apple-icon.png');
  await sharp(svgBuffer).resize(180, 180).png().toFile(appleIconPath);
  console.log('Saved src/app/apple-icon.png');

  // 3. Generar favicon.ico con tamaños 16, 32, 48
  const sizes = [16, 32, 48];
  const pngBuffers = [];
  for (const s of sizes) {
    const buf = await sharp(svgBuffer).resize(s, s).png().toBuffer();
    pngBuffers.push({ size: s, buffer: buf });
  }

  // Empaquetar como ICO estándar
  // Header: 6 bytes (0, 0, 1, 0, count, 0)
  // Entry: 16 bytes per image
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(count, 4); // Number of images

  let offset = 6 + (16 * count);
  const entries = [];
  for (const item of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(item.size >= 256 ? 0 : item.size, 0); // width
    entry.writeUInt8(item.size >= 256 ? 0 : item.size, 1); // height
    entry.writeUInt8(0, 2); // color palette count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(item.buffer.length, 8); // image size
    entry.writeUInt32LE(offset, 12); // image offset
    entries.push(entry);
    offset += item.buffer.length;
  }

  const icoBuffer = Buffer.concat([
    header,
    ...entries,
    ...pngBuffers.map(b => b.buffer)
  ]);

  const appFaviconPath = path.join(__dirname, '../src/app/favicon.ico');
  fs.writeFileSync(appFaviconPath, icoBuffer);
  console.log('Saved src/app/favicon.ico');

  const publicFaviconPath = path.join(__dirname, '../public/favicon.ico');
  fs.writeFileSync(publicFaviconPath, icoBuffer);
  console.log('Saved public/favicon.ico');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
