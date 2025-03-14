const axios = require('axios');
const cheerio = require('cheerio');


const parseLevel = (text) => {
    text = text.replace("Level ","")
    let levels = []
    if(text.includes('-')){
        let [start, end] = text.split('-').map(num => num.trim());
        start = parseInt(start);
        end = parseInt(end);
        for (let i = start; i <= end; i++) {
            levels.push(i.toString());
        }
    }
    else if(text.includes('&')){
        levels = text.split('&').map(num => num.trim());
    }
    else {
        levels.push(text.trim());
    }
    return levels

}

const scrapeTroops =  async (army, req, res, CLASH_WIKI) => {
    try {
    const tableData = {}
    const { data } = await axios.get(army.armySrc)
    const $ = cheerio.load(data);
    const imgSelector = $(".mw-halign-center span img");
    tableData['Troop'] = army.name;
    tableData['mainImg'] = imgSelector.attr("data-src") || imgSelector.attr("src")

    tableData['desc'] = $("center i b").text() || "No Description as of yet 😊"
    // webScrape the table and get all the troop stats
    $('.wikitable.floatheader.row-highlight tbody').each((tableIndex, table)=>{
        const headers = [];
        $(table).find('tr').first().find('th').each((index, element) => {
            headers.push($(element).text().trim());
        });

        const rows = []
        $(table).find('tr').slice(1).each((index, row) => {
            const rowData = {};
            $(row).find('td').each((i, cell) => {
                rowData[headers[i]] = $(cell).text().trim();
            });
            rows.push(rowData);
        });
            tableData['stats']= rows
        
    });

    // Get the image source for eaqch level
    const imgArr = {}
    $(".flexbox-display.bold-text div").each((index, element)=>{
        let levelText = $(element).find("div div").text()
        if(levelText.includes("Level")){
            const imgTag = $(element).find("div span span img")
            const levels = parseLevel(levelText)
            levels.forEach((lvl, index)=>{
                imgArr[lvl] = imgTag.attr("data-src") || imgTag.attr("src")
            })
        } 
    })
    tableData["stats"].forEach(obj => obj.imgSrc = imgArr[obj.Level])

    $(".hidden.mw-collapsible.mw-collapsed + .wikitable tbody").each((index, table)=>{
        const headers = [];
        $(table).find('tr').first().find('th').each((index, element) => {
            headers.push($(element).text().trim());
        });

        const rows = []
        $(table).find('tr').slice(1).each((index, row) => {
            const rowData = {};
            $(row).find('td').each((i, cell) => {
                rowData[headers[i]] = $(cell).text().trim();
            });
            rows.push(rowData);
        });

        tableData['BasicInfo']= rows[0]
    })
    //  Find if there exists a super troop version
    let superText = $(".wikitable.floatheader.row-highlight + div b").text()
    if(superText.includes("Super")){
        // console.log("hi")
            tableData["SuperTroopExits"] = true;
        $(".wikitable.floatheader.row-highlight ~ .wikitable").first().each((index, table)=>{
            const headers = [];
            $(table).find('tr').first().find('th').each((index, element) => {
                headers.push($(element).text().trim());
            });

            const rows = []
            $(table).find('tr').slice(1).each((index, row) => {
                const rowData = {};
                $(row).find('td').each((i, cell) => {
                    rowData[headers[i]] = $(cell).text().trim();
                });
                rows.push(rowData);
            });
            console.log(rows);
            tableData['SuperTroopInfo']= rows[0]
        })

    }




    res.status(200).json(tableData)

    }
    catch(error){
        res.status(500).json({error:error.message})
    }
};

module.exports = scrapeTroops;