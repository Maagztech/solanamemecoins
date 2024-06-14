


const puppeteer = require('puppeteer');
const connection = require('./database');

async function scrapeData() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://pump.fun/board', { waitUntil: 'networkidle2', timeout: 60000 });

    async function scrapePage() {
        return await page.evaluate(() => {
            const selector = '.max-h-\\[300px\\].overflow-hidden.h-fit.p-2.flex.border.border-transparent.hover\\:border-white.gap-2.w-full';
            const elements = document.querySelectorAll(selector);

            return Array.from(elements).map(element => {
                const parentAnchor = element.closest('a');
                const href = parentAnchor?.href || '';
                let caValue = '';
                if (href) {
                    const url = new URL(href);
                    caValue = url.pathname.split('/').pop();
                }

                const img = element.querySelector('img.mr-4.w-32.h-auto')?.src || '';
                const creator = element.querySelector('.text-xs.text-blue-200.flex.items-center.gap-2 button span.px-1')?.innerText || '';
                const marketCap = element.querySelector('.text-xs.text-green-300.flex.gap-1')?.innerText.replace('market cap: ', '').trim().replace(/\[badge:\s*\n*\s*\]/, '') || '';
                const replies = element.querySelector('p.text-xs.flex.items-center.gap-2')?.innerText.replace('replies: ', '') || '';
                const description = element.querySelector('p.text-sm.w-full span.font-bold')?.innerText || '';
                const message = element.querySelector('p.text-sm.w-full')?.innerText.replace(description, '').trim() || '';

                return {
                    img,
                    creator,
                    marketCap,
                    replies,
                    description,
                    message,
                    caValue
                };
            });
        });
    }

    async function clickNext() {
        const divSelector = '.flex.justify-center.space-x-2.text-slate-50';
        const buttonSelector = 'button.text-sm.text-slate-50.hover\\:font-bold.hover\\:bg-transparent.hover\\:text-slate-50';

        try {
            await page.waitForSelector(divSelector, { timeout: 60000 });
            const buttons = await page.$$(buttonSelector);

            if (buttons.length > 0) {
                let nextButton;
                for (const button of buttons) {
                    const buttonText = await page.evaluate(el => el.textContent.trim(), button);
                    if (buttonText === '[ >> ]') {
                        nextButton = button;
                        break;
                    }
                }

                if (nextButton) {
                    await nextButton.click();
                    await page.waitForSelector('.max-h-\\[300px\\].overflow-hidden.h-fit.p-2.flex.border.border-transparent.hover\\:border-white.gap-2.w-full');
                    await new Promise(resolve => setTimeout(resolve, 10000));
                    return true;
                }
            }
        } catch (error) {
            console.error('Error clicking next button or waiting for navigation:', error);
        }

        return false;
    }

    let results = [];
    let previousPageResults = [];
    let pageCount = 0;

    while (pageCount < 23) {
        const pageResults = await scrapePage();

        const isSamePage = JSON.stringify(pageResults) === JSON.stringify(previousPageResults);
        if (isSamePage) {
            console.log('No new elements found. Stopping.');
            break;
        }

        results = results.concat(pageResults);
        previousPageResults = pageResults;

        const hasNext = await clickNext();
        if (!hasNext) break;
        pageCount++;
    }

    await browser.close();
    return results;
}

async function insertDataToDB(data) {
    try {
        await connection.execute(`DROP TABLE IF EXISTS memecoinsList`);
        console.log('Table memecoinsList dropped successfully.');

        await connection.execute(`CREATE TABLE IF NOT EXISTS memecoinsList (
            id INT AUTO_INCREMENT PRIMARY KEY,
            caValue VARCHAR(255),
            img VARCHAR(255),
            creator VARCHAR(255),
            marketCap VARCHAR(255),
            replies VARCHAR(255),
            description TEXT,
            message TEXT
        )`);
        console.log('Table memecoinsList created');

        const insertQuery = `INSERT INTO memecoinsList (caValue, img, creator, marketCap, replies, description, message) VALUES (?, ?, ?, ?, ?, ?, ?)`;

        for (const item of data) {
            try {
                await connection.execute(insertQuery, [item.caValue, item.img, item.creator, item.marketCap, item.replies, item.description, item.message]);
                console.log(`Inserted data with caValue ${item.caValue} into database.`);
            } catch (error) {
                console.error(`Error processing item with caValue ${item.caValue}:`, error);
            }
        }
    } catch (error) {
        console.error('Error inserting data:', error);
    }
}



async function performFunction(req, res) {
    try {
        const data = await scrapeData();
        await insertDataToDB(data);
        res.json(data);
    } catch (error) {
        console.error('Error scraping data:', error);
        res.status(500).send('An error occurred while scraping data.');
    }
}

module.exports = {
    performFunction
};




// const puppeteer = require('puppeteer');
// const XLSX = require('xlsx');
// const fs = require('fs').promises;

// (async () => {
//     const browser = await puppeteer.launch({ headless: false });
//     const page = await browser.newPage();

//     async function scrapePage() {
//         return await page.evaluate(() => {
//             const selector = '.max-h-\\[300px\\].overflow-hidden.h-fit.p-2.flex.border.border-transparent.hover\\:border-white.gap-2.w-full';
//             const elements = document.querySelectorAll(selector);

//             return Array.from(elements).map(element => {
//                 const parentAnchor = element.closest('a');
//                 const href = parentAnchor?.href || '';
//                 let caValue = '';
//                 if (href) {
//                     const url = new URL(href);
//                     caValue = url.pathname.split('/').pop();
//                 }

//                 const img = element.querySelector('img.mr-4.w-32.h-auto')?.src || '';
//                 const creator = element.querySelector('.text-xs.text-blue-200.flex.items-center.gap-2 button span.px-1')?.innerText || '';
//                 const marketCap = element.querySelector('.text-xs.text-green-300.flex.gap-1')?.innerText.replace('market cap: ', '').trim().replace(/\[badge:\s*\n*\s*\]/, '') || '';
//                 const replies = element.querySelector('p.text-xs.flex.items-center.gap-2')?.innerText.replace('replies: ', '') || '';
//                 const description = element.querySelector('p.text-sm.w-full span.font-bold')?.innerText || '';
//                 const message = element.querySelector('p.text-sm.w-full')?.innerText.replace(description, '').trim() || '';

//                 return {
//                     img,
//                     creator,
//                     marketCap,
//                     replies,
//                     description,
//                     message,
//                     caValue
//                 };
//             });
//         });
//     }
//     async function clickNext() {
//         const divSelector = '.flex.justify-center.space-x-2.text-slate-50';
//         const buttonSelector = 'button.text-sm.text-slate-50.hover\\:font-bold.hover\\:bg-transparent.hover\\:text-slate-50';

//         try {
//             await page.waitForSelector(divSelector, { timeout: 60000 });
//             const buttons = await page.$$(buttonSelector);

//             if (buttons.length > 0) {
//                 let nextButton;
//                 for (const button of buttons) {
//                     const buttonText = await page.evaluate(el => el.textContent.trim(), button);
//                     if (buttonText === '[ >> ]') {
//                         nextButton = button;
//                         break;
//                     }
//                 }

//                 if (nextButton) {// Capture initial page content
//                     await nextButton.click();
//                     await page.waitForSelector('.max-h-\\[300px\\].overflow-hidden.h-fit.p-2.flex.border.border-transparent.hover\\:border-white.gap-2.w-full');
//                     await new Promise(resolve => setTimeout(resolve, 10000));
//                     return true;
//                 }
//             }
//         } catch (error) {
//             console.error('Error clicking next button or waiting for navigation:', error);
//         }

//         return false;
//     }


//     try {
//         await page.goto('https://pump.fun/board', { waitUntil: 'networkidle2', timeout: 60000 });

//         let results = [];
//         let previousPageResults = [];
//         let pageCount = 0;

//         while (pageCount < 23) {
//             const pageResults = await scrapePage();

//             const isSamePage = JSON.stringify(pageResults) === JSON.stringify(previousPageResults);
//             if (isSamePage) {
//                 console.log('No new elements found. Stopping.');
//                 break;
//             }

//             results = results.concat(pageResults);
//             previousPageResults = pageResults;

//             const hasNext = await clickNext();
//             if (!hasNext) break;
//             pageCount++;
//         }

//         console.log(`Scraped ${results.length} elements from ${pageCount} pages.`);

//         const csvContent = results.map(result => Object.values(result).join(',')).join('\n');
//         await fs.writeFile('scraped_data.csv', csvContent, 'utf8');
//         console.log('Data saved to scraped_data.csv');

//         const ws = XLSX.utils.json_to_sheet(results);
//         const wb = XLSX.utils.book_new();
//         XLSX.utils.book_append_sheet(wb, ws, 'Scraped Data');
//         XLSX.writeFile(wb, 'scraped_data.xlsx');
//         console.log('Data saved to scraped_data.xlsx');
//     } catch (error) {
//         console.error('Error:', error);
//     } finally {
//         await browser.close();
//     }
// })();

