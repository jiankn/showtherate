const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Use the new speedometer logo
const originalPath = 'C:/Users/jiank/.gemini/antigravity/brain/027f7690-2234-48ae-9534-6cad8a33a57d/speedometer_logo_final_1767416742978.png';
const outputPath = path.join(__dirname, '../public/logo.png');

async function removeBackground() {
    console.log('Processing logo to remove background...');
    console.log('Input:', originalPath);

    // Read the image and get raw pixel data
    const image = sharp(originalPath);
    const { data, info } = await image
        .raw()
        .ensureAlpha()
        .toBuffer({ resolveWithObject: true });

    const { width, height, channels } = info;
    console.log(`Image size: ${width}x${height}, channels: ${channels}`);

    // Process each pixel - remove white/light backgrounds
    let transparentCount = 0;
    for (let i = 0; i < data.length; i += channels) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Check if pixel is white/near-white/light background
        const brightness = (r + g + b) / 3;
        const isLightColor = brightness > 240;
        const isWhitish = r > 235 && g > 235 && b > 235;

        if (isWhitish || isLightColor) {
            data[i + 3] = 0; // Set alpha to 0
            transparentCount++;
        }
    }

    console.log(`Made ${transparentCount} pixels transparent`);

    // Save the processed image
    await sharp(data, {
        raw: {
            width,
            height,
            channels
        }
    })
        .png()
        .toFile(outputPath);

    console.log('✓ Background removed successfully!');
    console.log(`Saved to: ${outputPath}`);
}

removeBackground().catch(console.error);
