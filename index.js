const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const express = require('express');
const app = express();

const scrapData = async () => {
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    await page.goto('https://www.foundit.in/srp/results?query=%22%22&quickApplyJobs=true&searchId=f97a63ce-5eb5-4085-9e2a-35c837e728fa');
    const content = await page.content();
    const $ = cheerio.load(content);
    const jobs = [];
    $('.infoSection').each((index, element) => {
        const jobTitle = $(element).find('.jobTitle').text().trim();
        const companyName = $(element).find('.companyName > p').text().trim();
        jobs.push({jobTitle,companyName});
    });
    await browser.close();
    return jobs;
}

app.get('/scrape', async (req, res) => {
    const scrapedJobs = await scrapData();
    res.send(scrapedJobs);
});

app.listen(3000, () => {
    console.log('Server is running at http://localhost:3000');
});