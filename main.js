// Modules
const {app, BrowserWindow, ipcMain} = require('electron')
const windowStateKeeper = require('electron-window-state')
const readItem = require('./readItem')
const puppeteer = require('puppeteer');
const $ = require('cheerio');
const common = require('./common');
const {download} = require('electron-dl');

// Module with utilities for working with file and directory paths.
const path = require('path')
// Module with utilities for URL resolution and parsing.
const url = require('url')

// const url = 'https://services.gst.gov.in/services/login';

// Force Single Instance Application
const gotTheLock = app.requestSingleInstanceLock()
if (gotTheLock) {
    app.on('second-instance', (e, argv) => {
        // Someone tried to run a second instance, we should focus our window.

        // Protocol handler for win32
        // argv: An array of the second instance’s (command line / deep linked) arguments
        console.log("platform===========" + process.platform)
        console.log("argv===========" + argv.slice(1))
        if (process.platform == 'win32' || process.platform == 'linux') {
            // Keep only command line / deep linked arguments
            deeplinkingUrl = argv.slice(1)
        }
        logEverywhere('app.makeSingleInstance# ' + deeplinkingUrl)

        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.focus()
        }
    })
} else {
    app.quit()
    return
}

// Deep linked url
let deeplinkingUrl;

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

//upload JSON
ipcMain.on('upload-json', (e, userName, gstnPassword, captchaValue, returnPeriod, returnType) => {
    console.log("in main.js :- set-captcha call");
    const response = browser.then(page => {
        common.uploadJSON(page, userName, gstnPassword, captchaValue, returnPeriod, returnType)
            .then(res => {
                console.log(res);
                e.sender.send('upload-json-success', res);
            })
            .catch(err => {
                console.log(err);
                e.sender.send('upload-json-error', err);
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
    // mainWindow.loadFile('renderer/startbootstrap-sb-admin-2-gh-pages/login.html')

    // and load the index.html of the app.
    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, 'renderer/startbootstrap-sb-admin-2-gh-pages/login.html'),
            protocol: 'file:',
            slashes: true
        })
    )

    // Manage new window state
    state.manage(mainWindow)

    // Open DevTools - Remove for PRODUCTION!
    mainWindow.webContents.openDevTools();

    // Protocol handler for win32
    if (process.platform == 'win32' || process.plateform == "linux") {
        // Keep only command line / deep linked arguments
        deeplinkingUrl = process.argv.slice(1)
    }
    logEverywhere('createWindow# ' + deeplinkingUrl)

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

if (!app.isDefaultProtocolClient('myapp')) {
    // Define custom protocol handler. Deep linking works on packaged versions of the application!
    app.setAsDefaultProtocolClient('myapp')
}

// Quit when all windows are closed - (Not macOS - Darwin)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

app.on('will-finish-launching', function() {
    // Protocol handler for osx
    app.on('open-url', function(event, url) {
        event.preventDefault()
        deeplinkingUrl = url
        logEverywhere('open-url# ' + deeplinkingUrl)
    })
})

// Log both at dev console and at running node console instance
function logEverywhere(s) {
    console.log(s)
    if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.executeJavaScript(`console.log("${s}")`)
    }
}