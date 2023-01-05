const chromium = require('chrome-aws-lambda')
const puppeteer = require('puppeteer-core')
const mongoose = require('mongoose')

const mongo_uri = process.env.MONGO_URI
mongoose.connect(mongo_uri)

const sheetSchema = new mongoose.Schema({
  _id: String,
  owner_id: String,
  list_owner: String,
  list_name: String,
  lists: [{website: String, biz_name: String, phone: String, email: String, templated: String, size: String, address: String, score: Number}],
})

const Sheet = mongoose.models.Sheet || mongoose.model('Sheet', sheetSchema);


exports.handler =  async function(event, context) {
  const list_id = event.list_id
  const url_id = event.url_id

  const user_data = await Sheet.findOne({_id: list_id})

  let the_data = []
  let browser = null

  browser = await chromium.puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  });

  const page = await browser.newPage();
  await page.goto(url_id);

  const resultsSelector = '.rllt__link'

    await page.waitForTimeout(5000)
    const elements = await page.$$(resultsSelector)
    await page.waitForSelector(resultsSelector)

    for (let i = 0; i < elements.length; i++) {
        try {
          const element = elements[i]
          const title = await element.$eval('.OSrXXb', el => el.textContent)
          let rating = await element.$eval('.RDApEe', el => el.textContent)
          rating = rating.replace('(', '').replace(')', '')       
          
          await element.click()
          await page.waitForSelector('.ifM9O')
          await page.waitForTimeout(500)
  
          let address
          let website_text_two
          const element2 = await page.$('.ifM9O')
          address = await element2.$eval('.LrzXr', el => el.textContent)
          const phone = await element2.$eval('.kno-fv', el => el.textContent)
          const website = await element2.$eval('.dHS6jb', el => el.getAttribute('href'))
  
  
          if (website) {
              website_text_two = (website.split('//')[1]).split('/')[0]
              if (website_text_two.includes("www.")) {
                  website_text_two = website_text_two.split('www.')[1]
              }
          } else {
              website_text_two = ''
          }

          if (address === phone) {address = ''}
  
          const data = { title, rating, address, phone, website_text_two }
          console.log(data)
          the_data.push(data)

          user_data.lists.push({website: website_text_two, biz_name: title, phone: phone, email: "sample@gmail.com", templated: 'weebly',  size: rating, address: address, score: 0})
          await user_data.save()
          // fix bug where sites are duplicated
          website_text_two = ''
          /////////////////////////////////////


        } catch {
          console.log('error')
        }
        
    }

    const response = {
      statusCode: 200,
      body: the_data,
    }

    return response;

    await browser.close();




}