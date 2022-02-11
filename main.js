const { app, BrowserWindow, Menu } = require('electron')
const settings = require('./helper/settings')
const path = require('path')
const url = require('url')

const version = app.getVersion()

// Whether app has cleaned up and can continue termination
var cleanedUp = false

// BrowserWindow objects
var windows = {
   main: [
      undefined,
      {
         url: url.format({
            pathname: path.resolve(__dirname, 'pages/mainTracker.html'),
            protocol: 'file',
            slashes: true,
         }),
         webPreferences: {
            preload: path.resolve(__dirname, 'preloads/mainTracker.js'),
         },
      },
   ],
   local: [
      undefined,
      {
         url: url.format({
            pathname: path.resolve(__dirname, 'pages/localTracker.html'),
            protocol: 'file',
            slashes: true,
         }),
      },
   ],
   nearest: [
      undefined,
      {
         url: url.format({
            pathname: path.resolve(__dirname, 'pages/nearestTracker.html'),
            protocol: 'file',
            slashes: true,
         }),
      },
   ],
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
                  },
                  checked: settings.mapOrientation == 'TB',
               },
               {
                  label: 'Left to Right',
                  type: 'radio',
                  id: 'LR',
                  click: () => {
                     settings.mapOrientation = 'LR'
                  },
                  checked: settings.mapOrientation == 'LR',
               },
               {
                  label: 'Right to Left',
                  type: 'radio',
                  id: 'RL',
                  click: () => {
                     settings.mapOrientation = 'RL'
                  },
                  checked: settings.mapOrientation == 'RL',
               },
               {
                  label: 'Bottom to Top',
                  type: 'radio',
                  id: 'BT',
                  click: () => {
                     settings.mapOrientation = 'BT'
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
                  },
                  checked: settings.translationType == 'full',
               },
               {
                  label: 'Basic',
                  type: 'radio',
                  id: 'basic',
                  click: () => {
                     settings.translationType = 'basic'
                  },
                  checked: settings.translationType == 'basic',
               },
               {
                  label: 'Landmarks',
                  type: 'radio',
                  id: 'landmark',
                  click: () => {
                     settings.translationType = 'landmark'
                  },
                  checked: settings.translationType == 'landmark',
               },
               {
                  label: 'None',
                  type: 'radio',
                  id: 'none',
                  click: () => {
                     settings.translationType = 'none'
                  },
                  checked: settings.translationType == 'none',
               },
            ],
         },
         {
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
         },
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
            },
         },
         {
            label: 'Nearest Tracker',
            type: 'checkbox',
            id: 'nearestTracker',
            click: () => {
               toggleWindow('nearest')
            },
         },
         {
            label: 'sep',
            type: 'separator',
         },
         {
            label: 'Find Current Location',
            /*click: () => {
               winMain.webContents.postMessage('main-message', [
                  'find-location',
                  {},
               ])
            },*/
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
         {
            label: 'Changelog',
            //click: changelog.showLatest,
         },
      ],
   },
]

function toggleWindow(windowName, url) {
   let windowInstance = windows[windowName][0]
   let windowOptions = windows[windowName][1]

   if (!windowInstance) {
      windowInstance = new BrowserWindow(windowOptions)
      windowInstance.loadURL(windowOptions.url)
      windows[windowName][0] = windowInstance
   } else {
      windowInstance.close()
      windows[windowName][0] = undefined
   }

   return windowInstance
}

function sendMessage(windowName, id, data) {
   let windowInstance = windows[windowName][0]
   windowInstance.webContents.postMessage(id, data)
}

app.whenReady().then(() => {
   let mainWin = toggleWindow('main')
   sendMessage('main', 'version', version)

   if (process.defaultApp) {
      menuTemplate.push({
         label: 'Dev Tools',
         role: 'toggleDevTools',
      })
   }

   Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate))

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
