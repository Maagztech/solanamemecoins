const puppeteer = require('puppeteer');
async function realTimeData(req, res) {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        // Navigate to the webpage
        await page.goto('https://pump.fun/' + req.query.ca, { waitUntil: 'networkidle2', timeout: 60000 });

        await page.waitForSelector('.text-xs.text-green-300.flex');

        // Extract data from the first div
        const firstDivValues = await page.evaluate(() => {
            const div = document.querySelector('.text-xs.text-green-300.flex');
            return {
                archangels: div.querySelector('.text-gray-400').textContent.trim(),
                ticker: div.querySelector('.text-gray-400:nth-child(2)').textContent.trim(),
                marketCap: div.querySelector(':nth-child(3)').textContent.trim(),
                createdBy: div.querySelector('.inline-flex.items-center.gap-2.text-sm').textContent.trim(),
            };
        });

        // Extract data from the second div
        const secondDivValues = await page.evaluate(() => {
            const div = document.querySelector('.gap-3.h-fit.items-start.flex');
            return {
                imageSrc: div.querySelector('img').getAttribute('src'),
                messageTitle: div.querySelector('.font-bold.text-sm').textContent.trim(),
                description: div.querySelector('.text-xs.text-gray-400').textContent.trim(),
            };
        });


        const links = await page.evaluate(() => {
            const linksArray = [];
            const linksElements = document.querySelectorAll('.flex.gap-4 a');

            linksElements.forEach(link => {
                const href = link.getAttribute('href');
                const text = link.textContent.trim().replace('[', '').replace(']', '');
                linksArray.push({ href, text });
            });

            return linksArray;
        });


        await page.waitForSelector('.text-sm.text-gray-400.mb-1');

        // Extract data using evaluate function
        const bondingCurveProgress = await page.evaluate(() => {
            const div = document.querySelector('.text-sm.text-gray-400.mb-1');
            const text = div.textContent.trim();
            const progress = text.replace('bonding curve progress: ', ''); // Remove the prefix
            return progress;
        });



        // Wait for the grid container to load
        await page.waitForSelector('.grid.gap-1');

        // Extract holder information
        const holderInfo = await page.evaluate(() => {
            const holders = [];
            const holderElements = document.querySelectorAll('.grid.gap-1 > div.flex.justify-between');

            holderElements.forEach((element) => {
                const holderNameElement = element.querySelector('a');
                const percentageElement = element.querySelector('div');

                if (holderNameElement && percentageElement) {
                    const holderName = holderNameElement.innerText.trim().replace(/^\d+\.\s*/, '');
                    const holderUrl = holderNameElement.href;
                    const percentage = percentageElement.innerText.trim();
                    holders.push({ holderName, holderUrl, percentage });
                }
            });

            return holders;
        });



        await page.waitForSelector('.gap-1.grid.h-fit.bg-\\[\\#2e303a\\].p-1.text-sm');

        // Extract data
        const data = await page.evaluate(() => {
            const container = document.querySelector('.gap-1.grid.h-fit.bg-\\[\\#2e303a\\].p-1.text-sm');

            // Extract developer profile link and name
            const profileElement = container.querySelector('.flex.gap-1.text-xs a');
            const profileLink = profileElement.href;
            const profileName = profileElement.querySelector('span.px-1').innerText.trim();

            // Extract date
            const dateElement = container.querySelector('.flex.gap-1.text-xs div');
            const date = dateElement.innerText.trim();

            // Extract image source
            const imageElement = container.querySelector('.relative.items-start img');
            const imageSrc = imageElement.src;

            // Extract ticker and description
            const tickerElement = container.querySelector('.relative.items-start .grid .font-bold.text-sm');
            const ticker = tickerElement.innerText.trim();

            const descriptionElement = container.querySelector('.relative.items-start .grid div:nth-child(2)');
            const description = descriptionElement.innerText.trim();

            return {
                profileLink,
                profileName,
                date,
                imageSrc,
                ticker,
                description
            };
        });




        // Wait for the container to load
        await page.waitForSelector('.text-slate-300.grid.gap-1.relative');

        // Extract data
        const replydata = await page.evaluate(() => {
            const containers = document.querySelectorAll('.text-slate-300.grid.gap-1.relative > div.bg-\\[\\#2e303a\\].p-1.text-slate-200.text-sm.grid.gap-1.overflow-auto');

            return Array.from(containers).map(container => {
                const profileElement = container.querySelector('.flex.flex-wrap.gap-2.text-slate-400.text-xs.items-start.w-full a');
                const profileLink = profileElement ? profileElement.href : null;
                const profileName = profileElement ? profileElement.querySelector('span.px-1').innerText.trim() : null;

                const dateElement = container.querySelector('.flex.flex-wrap.gap-2.text-slate-400.text-xs.items-start.w-full div:nth-child(2)');
                const date = dateElement ? dateElement.innerText.trim() : null;

                const likeElement = container.querySelector('.flex.items-center.gap-2.w-fit div');
                const likes = likeElement ? likeElement.innerText.trim() : '0';

                const replyElement = container.querySelector('.cursor-pointer.justify-self-end.hover\\:underline');
                const replyText = replyElement ? replyElement.innerText.trim() : null;

                const extraContentElement = container.querySelector('.flex.gap-2.items-start');
                const extraImage = extraContentElement && extraContentElement.querySelector('img') ? extraContentElement.querySelector('img').src : null;
                const extraText = extraContentElement && extraContentElement.querySelector('div') ? extraContentElement.querySelector('div').innerText.trim() : null;

                return {
                    profileLink,
                    profileName,
                    date,
                    likes,
                    replyText,
                    extraImage,
                    extraText
                };
            });
        });



        await page.waitForSelector('.flex.gap-2.h-fit.mt-4');

        // Click on the "Trades" button
        await page.evaluate(() => {
            const divs = document.querySelectorAll('.flex.gap-2.h-fit.mt-4 > div');
            divs.forEach(div => {
                if (div.innerText.trim() === 'Trades') {
                    div.click();
                }
            });
        });

        // Wait for the trade elements to load
        await page.waitForSelector('.text-xs.my-1.bg-\\[\\#2e303a\\].rounded-lg.grid.grid-cols-4.sm\\:grid-cols-6.items-start');

        // Extract transaction data from the loaded trade elements
        const transactionData = await page.evaluate(() => {
            const tradeElements = document.querySelectorAll('.text-xs.my-1.bg-\\[\\#2e303a\\].rounded-lg.grid.grid-cols-4.sm\\:grid-cols-6.items-start');

            return Array.from(tradeElements).map(trade => {
                const accountElement = trade.querySelector('div:nth-child(1) a span.px-1');
                const account = accountElement ? accountElement.innerText.trim() : null;

                const typeElement = trade.querySelector('div:nth-child(2)');
                const type = typeElement ? typeElement.innerText.trim() : null;

                const solElement = trade.querySelector('div:nth-child(4)');
                const sol = solElement ? solElement.innerText.trim() : null;

                const angelElement = trade.querySelector('div:nth-child(5)');
                const angel = angelElement ? angelElement.innerText.trim() : null;

                const dateElement = trade.querySelector('div:nth-child(6)');
                const date = dateElement ? dateElement.innerText.trim() : null;

                const transactionElement = trade.querySelector('a');
                const transaction = transactionElement ? transactionElement.innerText.trim() : null;

                return {
                    account,
                    type,
                    sol,
                    angel,
                    date,
                    transaction
                };
            });
        });

        let extractedValues = {
            Name: firstDivValues.archangels,
            Ticker: firstDivValues.ticker,
            'Market Cap': firstDivValues.marketCap,
            'Created By': firstDivValues.createdBy,
            'Image Source': secondDivValues.imageSrc,
            'Message Title': secondDivValues.messageTitle,
            Description: secondDivValues.description,
            Links: links.map(link => ({ Text: link.text, Href: link.href })),
            'Bonding Curve Progress': bondingCurveProgress,
            'Holder Information': holderInfo.map((holder, index) => ({
                [`${index + 1}. Holder Name`]: holder.holderName,
                'Holder URL': holder.holderUrl,
                'Percentage Held': holder.percentage
            })),
            'Extracted Data': {
                'Profile Link': data.profileLink,
                'Profile Name': data.profileName,
                Date: data.date,
                'Image Source': data.imageSrc,
                Ticker: data.ticker,
                Description: data.description
            },
            'Extracted Transaction Data': transactionData,
            ReplyData: replydata
        };

        // Log the entire object
        console.log(extractedValues);

        // Close the browser
        await browser.close();
        res.json(extractedValues);
    } catch (error) {
        console.error('Error during data extraction:', error);
        res.status(500).send('An error occurred.');
    }
};


module.exports = {
    realTimeData
};