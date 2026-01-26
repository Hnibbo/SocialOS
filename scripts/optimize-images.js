#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories to optimize
const directories = [
  path.join(__dirname, '../public'),
  path.join(__dirname, '../src/assets')
];

// Supported image extensions
const supportedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

// Optimization settings
const quality = 85;

console.log('🔍 Finding images to optimize...');

const optimizeImages = async () => {
  let totalOptimized = 0;
  let totalSaved = 0;

  for (const directory of directories) {
    if (!fs.existsSync(directory)) {
      console.log(`⚠️  Directory not found: ${directory}`);
      continue;
    }

    const files = fs.readdirSync(directory, { recursive: true });

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      
      if (supportedExtensions.includes(ext)) {
        const filePath = path.join(directory, file);
        const stats = fs.statSync(filePath);
        const originalSize = stats.size;

        try {
          await sharp(filePath)
            .resize({
              width: 1920,
              height: 1080,
              fit: sharp.fit.inside,
              withoutEnlargement: true
            })
            .jpeg({ quality, progressive: true, optimizeScans: true })
            .png({ quality, compressionLevel: 9 })
            .webp({ quality })
            .toFile(filePath.replace(ext, '.webp'));

          // If it's not already a WebP, convert and keep original as backup
          if (ext !== '.webp') {
            const backupPath = filePath + '.backup';
            fs.renameSync(filePath, backupPath);
            
            // Rename WebP to original filename
            fs.renameSync(filePath.replace(ext, '.webp'), filePath);
          }

          const optimizedStats = fs.statSync(filePath);
          const optimizedSize = optimizedStats.size;
          const savedBytes = originalSize - optimizedSize;
          const savedPercent = ((savedBytes / originalSize) * 100).toFixed(1);

          totalOptimized++;
          totalSaved += savedBytes;

          console.log(`✅ Optimized: ${file} (${savedPercent}% saved)`);
        } catch (error) {
          console.error(`❌ Failed to optimize ${file}:`, error.message);
        }
      }
    }
  }

  console.log(`\n🎉 Optimization complete!`);
  console.log(`📊 Total files optimized: ${totalOptimized}`);
  console.log(`💾 Total space saved: ${(totalSaved / 1024 / 1024).toFixed(2)} MB`);
};

// Check if sharp is installed
if (!fs.existsSync(path.join(__dirname, '../node_modules/sharp'))) {
  console.error('❌ Sharp not installed. Please run: npm install sharp --save-dev');
  process.exit(1);
}

optimizeImages().catch((error) => {
  console.error('❌ Error during optimization:', error);
  process.exit(1);
});