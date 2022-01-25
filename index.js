const { app, BrowserWindow } = require('electron')
const path = require('path')
const formatURL = require('url').format

const isDevelopment = process.env.NODE_ENV !== 'production'

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.resolve(__dirname, 'preload.js'),
            nodeIntegration: true
        }
    })

    /*if (isDevelopment) {
        win.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`)
    } else {*/
        win.loadURL(formatURL({
            pathname: path.resolve(__dirname, 'index.html'),
            protocol: 'file',
            slashes: true
        }))
        console.log(__dirname)
    //}

    //win.loadFile(path.resolve(__dirname, '../index.html'))
}

app.whenReady().then( () => {
    createWindow()
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})