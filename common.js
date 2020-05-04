/**
 * @author Santosh Thakur
 */

const puppeteer = require('puppeteer');

module.exports = {

  /**
   * @description method to empty check
   * @param val
   * @returns {boolean}
   */
  isEmpty: function (val) {
    return val == null || val == undefined || val == "" || val == "undefined" || val == "null";
  },

  openBrowser: async function () {
    const browser = await puppeteer.launch({
                            args: [
                              '--disable-web-security',
                            ],
                            headless: true
                          });
    const page = await browser.newPage();
    return page;
  },

  getCaptcha: async function(page){
    // const browser = await puppeteer.launch();
    // const browserWSEndpoint = await browser.wsEndpoint({headless: false});
    // console.log("browserWSEndpoint :- " + browserWSEndpoint);
    // const page = await browser.newPage();           // open new tab
    await page.goto('https://services.gst.gov.in/services/login',{"waitUntil" : "networkidle0"});          // go to site

    await page.waitForSelector('#username');          // wait for the selector to load
    const element = await page.$('#username');        // declare a variable with an ElementHandle
    element.type("a");

    await page.waitForSelector('#imgCaptcha');
    const imgElement = await page.$('#imgCaptcha');

    await page.waitFor(2000);

    return await imgElement.screenshot({path: 'captcha.png'}); // take screenshot element in puppeteer
  },

  downloadJSON: async function(page, userName, gstnPassword, captchaValue, returnPeriod, returnType){
    await page.waitForSelector('#username');          // wait for the selector to load
    await page.keyboard.press('Backspace');
    const username = await page.$('#username');        // declare a variable with an ElementHandle
    username.type(userName);
    await page.waitFor(1000);
    await page.waitForSelector('#user_pass');          // wait for the selector to load
    const password = await page.$('#user_pass');        // declare a variable with an ElementHandle
    password.type(gstnPassword);
    await page.waitFor(1000);
    await page.waitForSelector('#captcha');          // wait for the selector to load
    const captcha = await page.$('#captcha');        // declare a variable with an ElementHandle
    captcha.type(captchaValue);
    await page.waitFor(1000);
    await page.waitForSelector('body > div.content-wrapper > div.container > div > div.content-pane > div > div > div > div > div > form > div:nth-child(6) > div > button');          // wait for the selector to load
    // const loginBtn = await page.$('body > div.content-wrapper > div.container > div > div.content-pane > div > div > div > div > div > form > div:nth-child(6) > div > button');        // declare a variable with an ElementHandle
    // loginBtn.click();

    await Promise.all([
      page.click("body > div.content-wrapper > div.container > div > div.content-pane > div > div > div > div > div > form > div:nth-child(6) > div > button"),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

    // await page.waitForNavigation();

    // await page.once('load', () => console.log('Page loaded!'));
    await page.waitFor(3000);
    await page.evaluate(() => {
      document.querySelector("div.dp-btns > div:nth-child(1) > button").click();
    });

    await page.waitForNavigation({ waitUntil: 'networkidle0' })
    await page.waitFor(3000);

    return page.evaluate(async ({returnPeriod, returnType}) => {
      if(returnType === "gstr1" || returnType === "gstr3b"){
        console.log("inside");
        console.log(`https://return.gst.gov.in/returns/auth/api/${returnType}/summary?rtn_prd=${returnPeriod}`)
        return Promise.resolve(
            await fetch(`https://return.gst.gov.in/returns/auth/api/${returnType}/summary?rtn_prd=${returnPeriod}`)
                .then(res => res.text())
                .then(data => {
                  console.log(data);
                  return data;
                })
        )
      }else{
        let gstr2aObj = {};

        gstr2aObj["b2b"] = await fetch(`https://return.gst.gov.in/returns/auth/api/gstr2a/ctin?rtn_prd=${returnPeriod}&section_name=B2B`)
                .then(res => res.text())
                .then(data => {
                  return data;
                })

        gstr2aObj["b2b"] = await fetch(`https://return.gst.gov.in/returns/auth/api/gstr2a/ctin?rtn_prd=${returnPeriod}&section_name=B2B`)
            .then(res => res.text())
            .then(data => {
              return data;
            })

        return Promise.resolve(gstr2aObj);
      }
    }, {returnPeriod, returnType});
  },

  downloadExcel: async function(page, userName, gstnPassword, captchaValue, returnPeriod, returnType){
    await page.waitForSelector('#username');          // wait for the selector to load
    await page.keyboard.press('Backspace');
    const username = await page.$('#username');        // declare a variable with an ElementHandle
    username.type(userName);
    await page.waitFor(1000);
    await page.waitForSelector('#user_pass');          // wait for the selector to load
    const password = await page.$('#user_pass');        // declare a variable with an ElementHandle
    password.type(gstnPassword);
    await page.waitFor(1000);
    await page.waitForSelector('#captcha');          // wait for the selector to load
    const captcha = await page.$('#captcha');        // declare a variable with an ElementHandle
    captcha.type(captchaValue);
    await page.waitFor(1000);
    await page.waitForSelector('body > div.content-wrapper > div.container > div > div.content-pane > div > div > div > div > div > form > div:nth-child(6) > div > button');          // wait for the selector to load
    // const loginBtn = await page.$('body > div.content-wrapper > div.container > div > div.content-pane > div > div > div > div > div > form > div:nth-child(6) > div > button');        // declare a variable with an ElementHandle
    // loginBtn.click();

    await Promise.all([
      page.click("body > div.content-wrapper > div.container > div > div.content-pane > div > div > div > div > div > form > div:nth-child(6) > div > button"),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

    // await page.waitForNavigation();

    // await page.once('load', () => console.log('Page loaded!'));
    await page.waitFor(3000);
    await page.evaluate(() => {
      document.querySelector("div.dp-btns > div:nth-child(1) > button").click();
    });

    await page.waitForNavigation({ waitUntil: 'networkidle0' })
    await page.waitFor(3000);

      await page._client.send('Page.setDownloadBehavior', {
          behavior: 'allow',
          // This path must match the WORKSPACE_DIR in Step 1
          downloadPath: '/home/perennial/Downloads/',
      });

    const response = page.evaluate(async ({returnPeriod, returnType}) => {
        console.log("inside");
        console.log(`https://return.gst.gov.in/returns/auth/api/${returnType}/summary?rtn_prd=${returnPeriod}`)
        return Promise.resolve(
            await fetch(`https://return.gst.gov.in/returns/auth/api/offline/download/generate?file_type=EX&flag=0&rtn_prd=${returnPeriod}&rtn_typ=GSTR2A`)
                .then(res => res.text())
                .then(data => {
                  console.log(data);
                  const response = JSON.parse(data);
                  console.log(response.data.url[0]);
                  let a = document.createElement("a");
                  document.body.appendChild(a);
                  a.style = "display: none";
                  a.href = response.data.url[0];
                  a.download = "gstr2a_file_bla_bla";
                  a.click();
                  document.body.removeChild(a);
                  console.log(data)
                  return data;
                })
        )
    }, {returnPeriod, returnType});

    await page.waitFor(5000);

    return response;
  },

  downloadPdf: async function(page, userName, gstnPassword, captchaValue, returnPeriod, returnType){
    await page.waitForSelector('#username');          // wait for the selector to load
    await page.keyboard.press('Backspace');
    const username = await page.$('#username');        // declare a variable with an ElementHandle
    username.type(userName);
    await page.waitFor(1000);
    await page.waitForSelector('#user_pass');          // wait for the selector to load
    const password = await page.$('#user_pass');        // declare a variable with an ElementHandle
    password.type(gstnPassword);
    await page.waitFor(1000);
    await page.waitForSelector('#captcha');          // wait for the selector to load
    const captcha = await page.$('#captcha');        // declare a variable with an ElementHandle
    captcha.type(captchaValue);
    await page.waitFor(1000);
    await page.waitForSelector('body > div.content-wrapper > div.container > div > div.content-pane > div > div > div > div > div > form > div:nth-child(6) > div > button');          // wait for the selector to load
    // const loginBtn = await page.$('body > div.content-wrapper > div.container > div > div.content-pane > div > div > div > div > div > form > div:nth-child(6) > div > button');        // declare a variable with an ElementHandle
    // loginBtn.click();

    await Promise.all([
      page.click("body > div.content-wrapper > div.container > div > div.content-pane > div > div > div > div > div > form > div:nth-child(6) > div > button"),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

    // await page.waitForNavigation();

    // await page.once('load', () => console.log('Page loaded!'));
    await page.waitFor(3000);
    await page.evaluate(() => {
      document.querySelector("div.dp-btns > div:nth-child(1) > button").click();
    });

    await page.waitForNavigation({ waitUntil: 'networkidle0' })
    await page.waitFor(3000);

      await page._client.send('Page.setDownloadBehavior', {
          behavior: 'allow',
          // This path must match the WORKSPACE_DIR in Step 1
          downloadPath: '/home/perennial/Downloads/',
      });

      await page.waitFor(1000);

    page.evaluate(async ({returnPeriod, returnType}) => {
        let textToFind = '2019-20';
        let dd = document.getElementsByName('fin')[0];
        for (var i = 0; i < dd.options.length; i++) {
            if (dd.options[i].text === textToFind) {
                dd.selectedIndex = i;
                break;
            }
        }
        let changeEvent = new Event('change');
        dd.dispatchEvent(changeEvent);
    }, {returnPeriod, returnType});

    await page.waitFor(1000);

      await page.evaluate(async ({returnPeriod, returnType}) => {
          let textToFind = 'January';
          let dd1 = document.getElementsByName('mon')[0];
          for (var i = 0; i < dd1.options.length; i++) {
              if (dd1.options[i].text === textToFind) {
                  dd1.selectedIndex = i;
                  break;
              }
          }
          let changeEvent1 = new Event('change');
          dd1.dispatchEvent(changeEvent1);
      }, {returnPeriod, returnType});

      await page.waitFor(1000);

      await page.evaluate(async ({returnPeriod, returnType}) => {
          function getElementByXpath(path) {
              return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
          }

          let searchBtn = getElementByXpath(`//BUTTON[@class='btn btn-primary srchbtn'][text()='Search']`);
          searchBtn.click();
      }, {returnPeriod, returnType});

      await page.waitFor(2000);

      await page.evaluate(async ({returnPeriod, returnType}) => {
          function getElementByXpath(path) {
              return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
          }

          let gstr3bPdfDownloadBtn = getElementByXpath(`(//BUTTON[@class='btn btn-primary pull-right'][text()='Download'][text()='Download'])[3]`);
          gstr3bPdfDownloadBtn.click();
      }, {returnPeriod, returnType});

      await page.waitFor(2000);

      return "success";
  },

  downloadCashLedger: async function(page, userName, gstnPassword, captchaValue, returnPeriod, returnType){
      await page.waitForSelector('#username');          // wait for the selector to load
      await page.keyboard.press('Backspace');
      const username = await page.$('#username');        // declare a variable with an ElementHandle
      username.type(userName);
      await page.waitFor(1000);
      await page.waitForSelector('#user_pass');          // wait for the selector to load
      const password = await page.$('#user_pass');        // declare a variable with an ElementHandle
      password.type(gstnPassword);
      await page.waitFor(1000);
      await page.waitForSelector('#captcha');          // wait for the selector to load
      const captcha = await page.$('#captcha');        // declare a variable with an ElementHandle
      captcha.type(captchaValue);
      await page.waitFor(1000);
      await page.waitForSelector('body > div.content-wrapper > div.container > div > div.content-pane > div > div > div > div > div > form > div:nth-child(6) > div > button');          // wait for the selector to load
      // const loginBtn = await page.$('body > div.content-wrapper > div.container > div > div.content-pane > div > div > div > div > div > form > div:nth-child(6) > div > button');        // declare a variable with an ElementHandle
      // loginBtn.click();

      await Promise.all([
          page.click("body > div.content-wrapper > div.container > div > div.content-pane > div > div > div > div > div > form > div:nth-child(6) > div > button"),
          page.waitForNavigation({ waitUntil: 'networkidle0' }),
      ]);

      // await page.waitForNavigation();

      // await page.once('load', () => console.log('Page loaded!'));
      await page.waitFor(3000);

      await page.evaluate(() => {
          document.querySelector("#main > ul > li.dropdown > ul > li:nth-child(2) > ul > li:nth-child(1) > a").click();
      });

      await page.waitForNavigation({ waitUntil: 'networkidle0' })
      await page.waitFor(3000);

      return page.evaluate(async ({returnPeriod, returnType}) => {
          console.log("inside");
          return Promise.resolve(
              await fetch(`https://payment.gst.gov.in/payment/auth/api/cashdetls?fdate=01/01/2020&tdate=24/04/2020`)
                  .then(res => res.text())
                  .then(data => {
                      console.log(data);
                      return data;
                  })
          )
      }, {returnPeriod, returnType});
  }
}