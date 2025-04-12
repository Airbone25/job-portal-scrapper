require('dotenv').config();
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const express = require('express');
const mongoose = require('mongoose');
const Job = require('./models/Job');
const cors = require('cors');
const app = express();

mongoose.connect(process.env.LOCAL_DB_URI);
const db = mongoose.connection;

db.on('error', () => console.error('Error connecting to database'));
db.once('open', () => {
    console.log('Connected to database');
})

app.use(cors());

const scrapData = async (site) => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(site.url);
    const content = await page.content();
    const $ = cheerio.load(content);
    const jobs = [];
    $(site.parentSelector).each((index, element) => {
        const jobTitle = $(element).find(site.titleSelector).text().trim();
        const companyName = $(element).find(site.companySelector).text().trim();
        const link = $(element).find(site.linkSelector).attr('href');
        jobs.push({ jobTitle, companyName, link, site: site.url.split('/')[2] });
    });
    await browser.close();
    return jobs;
}

const options = [
    {
        url: 'https://www.foundit.in/srp/results?query=%22%22&quickApplyJobs=true&searchId=f2cb5ffe-112c-4010-8a2d-1c90ea9e505a',
        parentSelector: '.infoSection',
        titleSelector: '.jobTitle',
        companySelector: '.companyName > p',
        linkSelector: "a.jobTupleHeader"
    },
    {
        url: 'https://internshala.com/jobs//',
        parentSelector: '.company',
        titleSelector: '.job-title-href',
        companySelector: '.company-name',
        linkSelector: '.job-title-href',
    },
    {
        url: 'https://www.quikr.com/jobs/full-time+zwqxj2363381545',
        parentSelector: '.job-card',
        titleSelector: '.job-title',
        companySelector: '.company-name',
        linkSelector: 'a.job-title'
    }
]

// app.get('/scrape', async (req, res) => {
//     const query = req.query.q;
//     try {
//         const scrapedJobs = [];
//         const target = options.find(option => option.url.includes(query));
//         const jobs = await scrapData(target);
//         scrapedJobs.push(...jobs);
//         for (let i = 0; i < scrapedJobs.length; i++) {
//             await Job.findOneAndUpdate(
//                 { jobTitle: scrapedJobs[i].jobTitle },
//                 {
//                     jobTitle: scrapedJobs[i].jobTitle,
//                     $addToSet: {listings: [{ companyName: scrapedJobs[i].companyName, url: scrapedJobs[i].link }]},
//                     site: scrapedJobs[i].site
//                 },
//                 { upsert: true, new: true, setDefaultsOnInsert: true }
//             )
//         }
//         res.send({ message: 'Data scraped successfully', jobs: scrapedJobs });
//     } catch (error) {
//         console.error(error);
//         res.send('Error scraping data');
//     }
// });

app.get('/scrape', async (req, res) => {
    const query = req.query.q;
    console.log(query)
    if (!query) {
        return res.status(400).send('Query parameter is required');
    }
    try {
        const scrapedJobs = [];
        const target = options.find(option => option.url.includes(query));
        const jobs = await scrapData(target);
        console.log(jobs)
        scrapedJobs.push(...jobs);
        for (let i = 0; i < scrapedJobs.length; i++) {
            const newJob = new Job({
                jobTitle: scrapedJobs[i].jobTitle,
                companyName: scrapedJobs[i].companyName,
                link: scrapedJobs[i].link,
                site: scrapedJobs[i].site
            });
            await newJob.save()
        }
        res.send({ message: 'Data scraped successfully', jobs: scrapedJobs });
    } catch (error) {
        console.error(error);
        res.send('Error scraping data');
    }
});

app.get('/search', async (req, res) => {
    try{
        const search = req.query.search.toLowerCase();
        const searchResult = await Job.find({ jobTitle: { $regex: search, $options: 'i' } });
        // if (searchResult.length === 0) {
        //     return res.status(404).send('No jobs found');
        // }
        res.send(searchResult);
    }catch(error){
        res.status(500).send("Error in Searching Job")
        console.error(error)
    }
})

app.get('/jobs/:id', async (req, res) => {
    try{
        const jobId = req.params.id;
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).send('Job not found');
        }
        res.send(job);
    }
    catch(error){
        res.status(500).send("Error in fetching Job")
        console.error(error)
    }
});

app.listen(3001, () => {
    console.log('Server is running at http://localhost:3001');
});