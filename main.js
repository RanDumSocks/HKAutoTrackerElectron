const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const settings = require('./helper/settings')
const path = require('path')
const url = require('url')

const version = app.getVersion()

// TODO add autoupdate support

// Whether app has cleaned up and can continue termination
var cleanedUp = false

// BrowserWindow objects
var windows = {
   main: {
      instance: undefined,
      options: {
         url: url.format({
            pathname: path.resolve(__dirname, 'pages/mainTracker.html'),
            protocol: 'file',
            slashes: true,
         }),
         webPreferences: {
            preload: path.resolve(__dirname, 'preloads/mainTracker.js'),
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
            contextIsolation: false
         },
      },
   },
   local: {
      instance: undefined,
      menuID: 'localTracker',
      options: {
         url: url.format({
            pathname: path.resolve(__dirname, 'pages/localTracker.html'),
            protocol: 'file',
            slashes: true,
         }),
         webPreferences: {
            preload: path.resolve(__dirname, 'preloads/localTracker.js')
         },
      },
   },
   nearest: {
      instance: undefined,
      menuID: 'nearestTracker',
      options: {
         url: url.format({
            pathname: path.resolve(__dirname, 'pages/nearestTracker.html'),
            protocol: 'file',
            slashes: true,
         }),
         webPreferences: {
            preload: path.resolve(__dirname, 'preloads/nearestTracker.js')
         },
      },
   },
}

var menuTemplate = [
   {
      label: 'File',
      submenu: [
         {
            label: 'Exit',
            role: 'quit',
         },
      ],
   },
   {
      label: 'Settings',
      submenu: [
         {
            label: 'Graph orientation',
            type: 'submenu',
            submenu: [
               {
                  label: 'Top to Bottom',
                  type: 'radio',
                  id: 'TB',
                  click: () => {
                     settings.mapOrientation = 'TB'
                     sendMessage('main', 'setting-change', settings.options)
                  },
                  checked: settings.mapOrientation == 'TB',
               },
               {
                  label: 'Left to Right',
                  type: 'radio',
                  id: 'LR',
                  click: () => {
                     settings.mapOrientation = 'LR'
                     sendMessage('main', 'setting-change', settings.options)
                  },
                  checked: settings.mapOrientation == 'LR',
               },
               {
                  label: 'Right to Left',
                  type: 'radio',
                  id: 'RL',
                  click: () => {
                     settings.mapOrientation = 'RL'
                     sendMessage('main', 'setting-change', settings.options)
                  },
                  checked: settings.mapOrientation == 'RL',
               },
               {
                  label: 'Bottom to Top',
                  type: 'radio',
                  id: 'BT',
                  click: () => {
                     settings.mapOrientation = 'BT'
                     sendMessage('main', 'setting-change', settings.options)
                  },
                  checked: settings.mapOrientation == 'BT',
               },
            ],
         },
         {
            label: 'Translation Type',
            type: 'submenu',
            submenu: [
               {
                  label: 'Full',
                  type: 'radio',
                  id: 'full',
                  click: () => {
                     settings.translationType = 'full'
                     sendMessage('main', 'setting-change', settings.options)
                  },
                  checked: settings.translationType == 'full',
               },
               {
                  label: 'Landmarks',
                  type: 'radio',
                  id: 'landmark',
                  click: () => {
                     settings.translationType = 'landmark'
                     sendMessage('main', 'setting-change', settings.options)
                  },
                  checked: settings.translationType == 'landmark',
               },
               {
                  label: 'Basic',
                  type: 'radio',
                  id: 'basic',
                  click: () => {
                     settings.translationType = 'basic'
                     sendMessage('main', 'setting-change', settings.options)
                  },
                  checked: settings.translationType == 'basic',
               },
               {
                  label: 'None',
                  type: 'radio',
                  id: 'none',
                  click: () => {
                     settings.translationType = 'none'
                     sendMessage('main', 'setting-change', settings.options)
                  },
                  checked: settings.translationType == 'none',
               },
            ],
         },
         /*{
            label: 'sep',
            type: 'separator',
         },
         {
            label: 'Consider benches for pathfinding',
            type: 'checkbox',
            id: 'benchPathfinding',
            click: () => {
               settings.benchPathfinding = !settings.benchPathfinding
            },
            checked: settings.benchPathfinding,
         },*/
      ],
   },
   {
      label: 'View',
      submenu: [
         {
            label: 'Local Tracker',
            type: 'checkbox',
            id: 'localTracker',
            click: () => {
               toggleWindow('local')
               sendMessage('main', 'update-local')
            },
         },
         /*{
            label: 'Nearest Tracker',
            type: 'checkbox',
            id: 'nearestTracker',
            click: () => {
               toggleWindow('nearest')
               sendMessage('main', 'update-nearest')
            },
         },*/
         {
            label: 'sep',
            type: 'separator',
         },
         {
            label: 'Find Current Location',
            click: (_menuItem, window) => {
               window.webContents.postMessage('find-location', "")
            },
         },
      ],
   },
   {
      label: 'Help',
      submenu: [
         {
            label: 'Submit Feedback',
            click: () => {
               open('https://github.com/RanDumSocks/HKAutoTrackerElectron/issues/new/choose')
            },
         },
      ],
   },
]

function toggleWindow(windowName, url) {
   let windowInstance = windows[windowName].instance
   let windowOptions = windows[windowName].options

   if (!windowInstance) {
      windowInstance = new BrowserWindow(windowOptions)
      windowInstance.loadURL(windowOptions.url)
      windows[windowName].instance = windowInstance
   } else {
      windowInstance.close()
      windows[windowName].instance = undefined
   }

   windowInstance.on('closed', () => {
      windows[windowName].instance = undefined
      let menuItem = Menu.getApplicationMenu().getMenuItemById(windows[windowName].menuID)
      if (menuItem) { menuItem.checked = false }
   })

   return windowInstance
}

function sendMessage(windowName, id, data) {
   let windowInstance = windows[windowName].instance
   windowInstance?.webContents.postMessage(id, data)
}

app.whenReady().then(() => {
   let mainWin = toggleWindow('main')
   sendMessage('main', 'version', version)
   sendMessage('main', 'setting-change', settings.options)

   if (process.defaultApp) {
      menuTemplate.push({
         label: 'Dev Tools',
         role: 'toggleDevTools',
      })
   }

   Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate))

   ipcMain.on('update-local-tracker', (e, data) => {sendMessage('local', 'updateGraph', data)})
   ipcMain.on('update-nearest-tracker', (e, data) => {sendMessage('nearest', 'updateGraph', data)})
   ipcMain.on('msg', (e, msg) => { console.log(msg) })
   ipcMain.handle('is-window-open', (e, windowName) => { return windows[windowName] != undefined })

   mainWin.on('closed', () => {
      app.quit()
   })

   app.on('before-quit', (e) => {
      if (!cleanedUp) {
         e.preventDefault()
         settings.writeSettings()
         cleanedUp = true
         app.quit()
      }
   })

   app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
         app.quit()
      }
   })
})
