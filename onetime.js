const puppeteer = require('puppeteer');
const { insertDataToDB } = require('./database');

async function scrapeData() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        await page.goto('https://pump.fun/board', { waitUntil: 'networkidle2', timeout: 60000 });
        await page.waitForSelector('.md\\:grid.flex.flex-wrap.text-sm.md\\:gap-1.gap-4', { timeout: 60000 });

        await page.evaluate(() => {
            const animationButtons = document.querySelectorAll('.md\\:grid .cursor-pointer.px-1.rounded');
            const animationOffButton = Array.from(animationButtons).find(el => el.textContent.trim() === 'Off' && el.parentNode.textContent.includes('Show animations:'));
            if (animationOffButton) {
                animationOffButton.click();
            }
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        let results = [];
        let previousPageResults = [];
        let pageCount = 1;

        while (pageCount < 3) {
            const pageResults = await scrapePage(page);
            const isSamePage = JSON.stringify(pageResults) === JSON.stringify(previousPageResults);
            
            if (isSamePage) {
                console.log('No new elements found. Stopping.');
                break;
            }

            results = results.concat(pageResults);
            previousPageResults = pageResults;

            const hasNext = await clickNext(page);
            if (!hasNext) break;
            pageCount++;
        }

        await browser.close();

        const uniqueResults = [];
        const caValueSet = new Set();

        for (const item of results) {
            if (!caValueSet.has(item.caValue)) {
                uniqueResults.push(item);
                caValueSet.add(item.caValue);
            }
        }

        await insertDataToDB(uniqueResults);

        return uniqueResults;
    } catch (error) {
        console.error('Error scraping data:', error);
        throw error;
    }
}

async function scrapePage(page) {
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
                caValue,
                img,
                creator,
                marketCap,
                replies,
                description,
                message
            };
        });
    });
}

async function clickNext(page) {
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
                await new Promise(resolve => setTimeout(resolve, 2000));
                return true;
            }
        }
    } catch (error) {
        console.error('Error clicking next button or waiting for navigation:', error);
    }

    return false;
}

module.exports = {
    scrapeData
};
