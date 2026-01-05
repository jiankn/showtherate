const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, '../public/logo.png');
const outputPath = path.join(__dirname, '../public/logo-transparent.png');

async function makeTransparent() {
    console.log('Converting logo to PNG with transparent background...');

    // Read the image and get raw pixel data
    const { data, info } = await sharp(inputPath)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const { width, height, channels } = info;
    console.log(`Image size: ${width}x${height}, channels: ${channels}`);

    // Make white/near-white pixels transparent
    let transparentCount = 0;
    for (let i = 0; i < data.length; i += channels) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Check if pixel is white/near-white
        if (r > 240 && g > 240 && b > 240) {
            data[i + 3] = 0; // Set alpha to 0
            transparentCount++;
        }
    }

    console.log(`Made ${transparentCount} pixels transparent`);

    // Save as PNG with transparency
    await sharp(data, {
        raw: { width, height, channels }
    })
        .png()
        .toFile(outputPath);

    // Replace original
    const fs = require('fs');
    fs.copyFileSync(outputPath, inputPath);
    fs.unlinkSync(outputPath);

    console.log('✓ Logo converted to transparent PNG!');
}

makeTransparent().catch(console.error);
