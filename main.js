// Modules
const {app, BrowserWindow, ipcMain} = require('electron')
const windowStateKeeper = require('electron-window-state')
const readItem = require('./readItem')
const puppeteer = require('puppeteer');
const $ = require('cheerio');
const common = require('./common');
const {download} = require('electron-dl');

const url = 'https://services.gst.gov.in/services/login';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

let browser;
// console.log(browser);

// Listen for new item request
ipcMain.on('new-item', (e, itemUrl) => {

    // Get new item and send back to renderer
    readItem( itemUrl, item => {
        e.sender.send('new-item-success', item)
    })
})

// Listen for get captcha request
ipcMain.on('get-captcha', (e) => {
    console.log("in main.js :- get-captcha call");
    const response = browser.then(page => {
        common.getCaptcha(page)
            .then(res => {
                e.sender.send('get-captcha-success', "success");
            })
            .catch(err => {
                e.sender.send('get-captcha-success', "error");
            })
    });
});

// Download JSON
ipcMain.on('download-json', (e,userName, gstnPassword, captchaValue, returnPeriod, returnType) => {
    console.log("in main.js :- set-captcha call");
    const response = browser.then(page => {
        common.downloadJSON(page, userName, gstnPassword, captchaValue, returnPeriod, returnType)
            .then(res => {
                console.log(res);
                e.sender.send('set-captcha-success', res);
            })
            .catch(err => {
                console.log(err);
                e.sender.send('get-captcha-success', err);
            })
    });
});

//Download excel
ipcMain.on('download-excel', (e,userName, gstnPassword, captchaValue, returnPeriod, returnType) => {
    console.log("in main.js :- set-captcha call");
    browser.then(page => {
        common.downloadExcel(page, userName, gstnPassword, captchaValue, returnPeriod, returnType)
            .then(res => {
                // console.log(res);
                //   const response = JSON.parse(res);
                //   console.log(response.data.url[0]);
                //   download(BrowserWindow.getFocusedWindow(), response.data.url[0])
                //       .then(dl => mainWindow.webContents.send("download-excel-success", dl.getSavePath()));
                e.sender.send('download-excel-success', res);
            })
            .catch(err => {
                console.log(err);
                e.sender.send('download-excel-error', err);
            })
    });
});

//Download excel
ipcMain.on('download-cashLedger', (e,userName, gstnPassword, captchaValue, returnPeriod, returnType) => {
    console.log("in main.js :- set-captcha call");
    browser.then(page => {
        common.downloadCashLedger(page, userName, gstnPassword, captchaValue, returnPeriod, returnType)
            .then(res => {
                e.sender.send('download-cashLedger-success', res);
            })
            .catch(err => {
                console.log(err);
                e.sender.send('download-cashLedger-error', err);
            })
    });
});

//Download pdf
ipcMain.on('download-pdf', async (e, userName, gstnPassword, captchaValue, returnPeriod, returnType) => {
    console.log("in main.js :- set-captcha call");
    browser.then(page => {
        common.downloadPdf(page, userName, gstnPassword, captchaValue, returnPeriod, returnType)
            .then(res => {
                // console.log(res);
                //   const response = JSON.parse(res);
                //   console.log(response.data.url[0]);
                //   download(BrowserWindow.getFocusedWindow(), response.data.url[0])
                //       .then(dl => mainWindow.webContents.send("download-excel-success", dl.getSavePath()));
                e.sender.send('download-pdf-success', res);
            })
            .catch(err => {
                console.log(err);
                e.sender.send('download-pdf-error', err);
            })
    });
});


ipcMain.on('login-success', async (e) => {
    await mainWindow.loadFile('renderer/startbootstrap-sb-admin-2-gh-pages/index.html')
});

ipcMain.on('logout-success', async (e) => {
    await mainWindow.loadFile('renderer/startbootstrap-sb-admin-2-gh-pages/login.html')
});

// Create a new BrowserWindow when `app` is ready
function createWindow () {

    // Win state keeper
    let state = windowStateKeeper({
        defaultWidth: 500, defaultHeight: 650
    })

    mainWindow = new BrowserWindow({
        x: state.x, y: state.y,
        width: state.width, height: state.height,
        minWidth: 350, maxWidth: 650, minHeight: 300,
        webPreferences: {
            nodeIntegration: true
        }
    })

    // Load index.html into the new BrowserWindow
    mainWindow.loadFile('renderer/startbootstrap-sb-admin-2-gh-pages/login.html')

    // Manage new window state
    state.manage(mainWindow)

    // Open DevTools - Remove for PRODUCTION!
    mainWindow.webContents.openDevTools();

    //open headless browser here
    browser = common.openBrowser();

    // Listen for window being closed
    mainWindow.on('closed',  () => {
        mainWindow = null
    })
}

// Electron `app` is ready
app.on('ready', createWindow)

// When app icon is clicked and app is running, (macOS) recreate the BrowserWindow
app.on('activate', () => {
    if (mainWindow === null) createWindow()
})

// Quit when all windows are closed - (Not macOS - Darwin)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})