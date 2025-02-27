const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const express = require('express');
const mongoose = require('mongoose');
const Job = require('./models/Job');
const app = express();

mongoose.connect('mongodb+srv://keshavmehra2005:LeoMessi10@cluster0.zky0x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
const db = mongoose.connection;
db.on('error', ()=>console.error('Error connecting to database'));
db.once('open',()=>{
    console.log('Connected to database');
})

const scrapData = async (url,parentSelector,titleSelector,companySelector) => {
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    await page.goto(url);
    const content = await page.content();
    const $ = cheerio.load(content);
    const jobs = [];
    $(parentSelector).each((index, element) => {
        const jobTitle = $(element).find(titleSelector).text().trim();
        const companyName = $(element).find(companySelector).text().trim();
        jobs.push({jobTitle,companyName});
    });
    await browser.close();
    return jobs;
}

const options = [
    {
        url: 'https://www.foundit.in/srp/results?query=%22%22&quickApplyJobs=true&searchId=f97a63ce-5eb5-4085-9e2a-35c837e728fa',
        parentSelector: '.infoSection',
        titleSelector: '.jobTitle',
        companySelector: '.companyName > p'
    }
]

app.get('/scrape', async (req, res) => {
    const scrapedJobs = [];
    for(let i=0;i<options.length;i++){
        const {url,parentSelector,titleSelector,companySelector} = options[i];
        const jobs = await scrapData(url,parentSelector,titleSelector,companySelector);
        scrapedJobs.push(...jobs);
    }
    for(let i=0;i<scrapedJobs.length;i++){
        const job = new Job(scrapedJobs[i]);
        await job.save();
    }
    res.send(scrapedJobs);
});

app.get('/search',async(req,res)=>{
    const search = req.query.search.toLowerCase();
    const scrapedJobs = await scrapData();
    const searchResult = scrapedJobs.filter(job => job.jobTitle.toLowerCase().includes(search.toLowerCase()));
    res.send(searchResult);
})

app.listen(3000, () => {
    console.log('Server is running at http://localhost:3000');
});