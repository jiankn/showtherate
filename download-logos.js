// Download logos using Google Favicon service with redirect support
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const logos = [
    { name: 'wellsfargo', domain: 'wellsfargo.com' },
    { name: 'chase', domain: 'chase.com' },
    { name: 'bankofamerica', domain: 'bankofamerica.com' },
    { name: 'citi', domain: 'citi.com' },
    { name: 'rocketmortgage', domain: 'rocketmortgage.com' },
    { name: 'uwm', domain: 'uwm.com' },
    { name: 'loandepot', domain: 'loandepot.com' },
    { name: 'fairway', domain: 'fairwaymc.com' },
    { name: 'guildmortgage', domain: 'guildmortgage.com' },
    { name: 'crosscountry', domain: 'crosscountrymortgage.com' },
    { name: 'movement', domain: 'movement.com' },
    { name: 'primelending', domain: 'primelending.com' },
    { name: 'caliber', domain: 'caliberhomeloans.com' },
    { name: 'fanniemae', domain: 'fanniemae.com' },
    { name: 'freddiemac', domain: 'freddiemac.com' },
    { name: 'zillow', domain: 'zillow.com' },
    { name: 'redfin', domain: 'redfin.com' },
    { name: 'kellerwilliams', domain: 'kw.com' },
    { name: 'remax', domain: 'remax.com' },
    { name: 'compass', domain: 'compass.com' },
    { name: 'coldwellbanker', domain: 'coldwellbanker.com' },
    { name: 'century21', domain: 'century21.com' },
    { name: 'guaranteedrate', domain: 'rate.com' },
    { name: 'mrcooper', domain: 'mrcooper.com' }
];

const outputDir = path.join(__dirname, 'public/images/logos');

function downloadWithRedirect(url, filePath, maxRedirects = 5) {
    return new Promise((resolve) => {
        const protocol = url.startsWith('https') ? https : http;

        protocol.get(url, (response) => {
            // Handle redirects
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                if (maxRedirects > 0) {
                    let newUrl = response.headers.location;
                    if (!newUrl.startsWith('http')) {
                        const urlObj = new URL(url);
                        newUrl = `${urlObj.protocol}//${urlObj.host}${newUrl}`;
                    }
                    return downloadWithRedirect(newUrl, filePath, maxRedirects - 1).then(resolve);
                } else {
                    console.log(`✗ Too many redirects`);
                    resolve(false);
                    return;
                }
            }

            if (response.statusCode === 200) {
                const file = fs.createWriteStream(filePath);
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve(true);
                });
            } else {
                console.log(`✗ Status: ${response.statusCode}`);
                resolve(false);
            }
        }).on('error', (err) => {
            console.log(`✗ Error: ${err.message}`);
            resolve(false);
        });
    });
}

async function main() {
    console.log('Downloading logos using Google Favicon API...\n');

    for (const logo of logos) {
        const url = `https://www.google.com/s2/favicons?domain=${logo.domain}&sz=128`;
        const filePath = path.join(outputDir, `${logo.name}.png`);

        const success = await downloadWithRedirect(url, filePath);
        if (success) {
            console.log(`✓ Downloaded: ${logo.name}`);
        } else {
            console.log(`✗ Failed: ${logo.name}`);
        }
    }

    console.log('\nDone!');
}

main();
