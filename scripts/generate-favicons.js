const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputPath = path.join(__dirname, '../public/logo.png');
const publicDir = path.join(__dirname, '../public');
const appDir = path.join(__dirname, '../src/app');

async function generateFavicons() {
    console.log('Generating favicons from logo...');

    // Generate various sizes for different purposes
    const sizes = [
        { size: 16, name: 'favicon-16x16.png', dir: publicDir },
        { size: 32, name: 'favicon-32x32.png', dir: publicDir },
        { size: 180, name: 'apple-touch-icon.png', dir: publicDir },
        { size: 192, name: 'android-chrome-192x192.png', dir: publicDir },
        { size: 512, name: 'android-chrome-512x512.png', dir: publicDir },
        { size: 180, name: 'apple-icon.png', dir: appDir },
        { size: 32, name: 'icon.png', dir: appDir },
    ];

    for (const { size, name, dir } of sizes) {
        await sharp(inputPath)
            .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
            .png()
            .toFile(path.join(dir, name));
        console.log(`✓ Generated ${name} (${size}x${size})`);
    }

    // Generate ICO file (32x32 PNG saved as ico)
    await sharp(inputPath)
        .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toFile(path.join(appDir, 'favicon.ico'));
    console.log('✓ Generated favicon.ico');

    // Generate Open Graph image (1200x630) with the logo centered on white background
    const logoBuffer = await sharp(inputPath)
        .resize(300, 300, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .toBuffer();

    await sharp({
        create: {
            width: 1200,
            height: 630,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
    })
        .composite([{
            input: logoBuffer,
            top: 165,  // (630 - 300) / 2
            left: 450  // (1200 - 300) / 2
        }])
        .png()
        .toFile(path.join(publicDir, 'og-image.png'));
    console.log('✓ Generated og-image.png (1200x630 for Open Graph)');

    console.log('\nAll favicons generated successfully!');
}

generateFavicons().catch(console.error);
