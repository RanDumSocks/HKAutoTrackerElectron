const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron')
const { autoUpdater } = require('electron-updater')
const settings        = require('./helper/settings')
const path            = require('path')
const url             = require('url')
const open            = require('open')
const fs              = require('fs')
const extract         = require('extract-zip')

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
               sendMessage('main', 'setting-change', settings.options)
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
               sendMessage('main', 'update-local')
            },
         },
         {
            label: 'Nearest Tracker',
            type: 'checkbox',
            id: 'nearestTracker',
            click: () => {
               toggleWindow('nearest')
               sendMessage('main', 'update-nearest')
            },
         },
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
         {
            label: 'Changelog',
            click: () => {
               open(`https://github.com/RanDumSocks/HKAutoTrackerElectron/releases/tag/v${version}`)
            }
         },
         {
            label: 'Reinstall Companion Mod',
            click: () => {
               settings.options.dataLocation = undefined
               installCompanionMod(true)
            }
         }
      ],
   },
   {
      label: 'Donate',
      click: () => {
         open("https://www.paypal.com/donate/?business=5DRWDFEJEAPUS&no_recurring=1&item_name=Developing+free+software+and+games+for+fun.&currency_code=USD")
      },
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

function installCompanionMod(force = false) {
   if (!settings.dataLocation || force) {
      var option = dialog.showMessageBoxSync(windows['main'].instance, {
         message: `Hollow Knight data file location not set. This is needed to install the companion mod. Enter in the location of your Hollow Knight install (folder containing hollow_knight.exe).`,
         type: 'question',
         buttons: ['Select Folder', 'Cancel'],
         title: `Data Location`,
         noLink: true
      })
      if (option == 0) {
         var filePath = dialog.showOpenDialogSync(windows['main'].instance, {
            title: "Hollow Knight data location",
            properties: ["openDirectory"]
         })
         settings.dataLocation = filePath ? filePath[0] : settings.dataLocation
         installCompanionMod()
      }
   } else {
      if (fs.existsSync(path.join(settings.dataLocation, "hollow_knight_Data/Managed/Mods/HKRoomLogger/HKRoomLogger.dll"))) {
         var option = dialog.showMessageBoxSync(windows['main'].instance, {
            message: `Companion mod already installed!`,
            type: 'question',
            buttons: ['Okay', 'Manual Install'],
            title: `Already Installed`,
            noLink: true
         })
         if (option == 1) {
            open("https://github.com/RanDumSocks/HKRoomLogger/releases/latest")
         }
      } else {
         var option = dialog.showMessageBoxSync(windows['main'].instance, {
            message: `Would you like to install the companion mod now?`,
            type: 'question',
            buttons: ['Yes', 'Manual Install', 'No'],
            noLink: true
         })
         if (option == 0) {
            extract('./HKRoomLogger.zip', { dir : path.join(settings.dataLocation, "hollow_knight_Data/Managed/Mods/HKRoomLogger")})
            .then( () => {
               dialog.showMessageBoxSync(windows['main'].instance, {
                  message: `Mod successfully installed! Remember to restart Hollow Knight for changes to take effects.`,
                  type: 'info',
                  noLink: true
               })
            }).catch(() => {
               var option = dialog.showMessageBoxSync(windows['main'].instance, {
                  message: `Something went wrong! Please contact the developer for help, or install the mod manually.`,
                  type: 'question',
                  buttons: ['Okay :(', 'Manual Install'],
                  noLink: true
               })
               if (option == 1) {
                  open("https://github.com/RanDumSocks/HKRoomLogger/releases/latest")
               }
            })
         } else if (option == 1) {
            open("https://github.com/RanDumSocks/HKRoomLogger/releases/latest")
         }
      }
   }
}

{ // auto updater

   autoUpdater.on('error', (err) => {
      console.error(err)
      dialog.showMessageBoxSync(windows['main'].instance, {
         message: err.message,
         type: 'error',
         noLink: true
      })
   })

   autoUpdater.on('update-downloaded', (info) => {
      var option = dialog.showMessageBoxSync(windows['main'].instance, {
         message: `${info.releaseName}\n\nNew update downloaded, would you like to restart and update now?`,
         type: 'question',
         buttons: ['Yes', 'No'],
         title: `Update available!`,
         noLink: true
      })
      if (option == 0) {
         autoUpdater.quitAndInstall()
      }
      menuTemplate.push({
         label: "Update!",
         click: () => { autoUpdater.quitAndInstall() }
      })
      Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate))
   })
}

app.whenReady().then(() => {
   let mainWin = toggleWindow('main')
   sendMessage('main', 'version', version)
   sendMessage('main', 'setting-change', settings.options)

   if (process.defaultApp) {
      console.log('defaultApp')
      menuTemplate.push({
         label: 'Dev Tools',
         role: 'toggleDevTools',
      })
   } else {
      console.log("checking for updates")
      autoUpdater.checkForUpdates()
   }

   Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate))

   ipcMain.on('update-local-tracker', (e, data, isComplete) => {sendMessage('local', 'updateGraph', [data, isComplete])})
   ipcMain.on('update-nearest-tracker', (e, data, isComplete) => {sendMessage('nearest', 'updateGraph', [data, isComplete])})
   ipcMain.on('msg', (e, msg) => { console.log(msg) })
   ipcMain.handle('is-window-open', (e, windowName) => { return windows[windowName].instance != undefined })

   if (!settings.dataLocation || !fs.existsSync(path.join(settings.dataLocation, "hollow_knight_Data/Managed/Mods/HKRoomLogger/HKRoomLogger.dll"))) {
      installCompanionMod()
   }

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
