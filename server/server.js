require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const CLASH_WIKI = "https://clashofclans.fandom.com"
// allow frontend request
app.use(cors());

// Define a route
app.get('/th-info', async (req, res) => {
    const url = req.query.url; // Get URL from frontend query parameter
    if (!url) {
        return res.status(400).json({ error: "Missing URL parameter" });
    }

    try {
        // Fetch the webpage
        const { data } = await axios.get(url);
        
        // Load HTML into Cheerio
        const $ = cheerio.load(data);
        // Example: Extract all headlines
        const items = [];
        $('.th_item').each((index, element) => {
            const imgSrc = url+$(element).find('.th_item_image a img').attr('src'); // Get image URL
            const linkText = $(element).find('.th_item_text a').text().trim(); // Get text inside <a>
            items.push({
                image: imgSrc,
                text: linkText,
            });
        });
        res.json({ url, items });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/src/:type", async(req, res)=>{
    
    try {
    const type = req.params.type;
    const url = `${CLASH_WIKI}/wiki/${type}`
    const { data } = await axios.get(url)
    const $ = cheerio.load(data);
    const army = []
    $('div.flexbox-display.bold-text.hovernav div').each((index, element)=>{
        const detailsSrc = CLASH_WIKI + $(element).find('div span a, div div a').attr('href');
        const imgSrc = $(element).find('div span a img, div figure a img').attr('src');
        const dataSrc = $(element).find('div span a img, div figure a img').attr('data-src');
        const name = $(element).find('div div a').text().trim();
        name && army.push({
            name: name,
            armySrc: detailsSrc,
            imgSrc: dataSrc || imgSrc,
        })
    });
    res.json(army)
    }
    catch (error) {
        res.status(500).json({error:error.message})
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});