const { app, BrowserWindow, Menu, globalShortcut, MessageChannelMain, ipcMain } = require("electron")
const path = require("path")
const formatURL = require("url").format
const settings = require("./settings.js")

var winMain = undefined
var winLocal = undefined
var winNearest = undefined

const setOrientation = (menuItem, window, event) => {
   settings.changeSetting("mapOrientation", menuItem.id)
}

const setTranslation = (menuItem, window, event) => {
   settings.changeSetting("translationType", menuItem.id)
}

const setLineLength = (menuItem, window, event) => {
   settings.changeSetting("lineLength", menuItem.id)
}

const toggleLocalTracker = () => {
   if (!winLocal) {
      winLocal = new BrowserWindow({
         width: 800,
         height: 600,
         webPreferences: {
            preload: path.resolve(__dirname, "trackerLocal.js"),
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
            contextIsolation: false
         },
      })
   
      winLocal.on('closed', () => {
         winLocal = null
         Menu.getApplicationMenu().getMenuItemById('localTracker').checked = false
         winMain?.webContents.postMessage('local-unlink', 'null')
      })
   
      winLocal.loadURL(
         formatURL({
            pathname: path.resolve(__dirname, "tracker.html"),
            protocol: "file",
            slashes: true,
         })
      )

      const ports = new MessageChannelMain()
      const mainPort = ports.port1
      const localPort = ports.port2
      winMain.webContents.postMessage('local-link-main', 'null', [mainPort])
      winLocal.webContents.postMessage('local-link', 'null', [localPort])
   } else {
      winLocal.close()
   }
}

const toggleNearestTracker = () => {
   if (!winNearest) {
      winNearest = new BrowserWindow({
         width: 800,
         height: 600,
         webPreferences: {
            preload: path.resolve(__dirname, "trackerNearest.js"),
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
            contextIsolation: false
         },
      })
   
      winNearest.on('closed', () => {
         winNearest = null
         Menu.getApplicationMenu().getMenuItemById('nearestTracker').checked = false
         winMain?.webContents.postMessage('nearest-unlink', 'null')
      })
   
      winNearest.loadURL(
         formatURL({
            pathname: path.resolve(__dirname, "nearestTracker.html"),
            protocol: "file",
            slashes: true,
         })
      )

      const ports = new MessageChannelMain()
      const mainPort = ports.port1
      const localPort = ports.port2
      winMain.webContents.postMessage('nearest-link-main', 'null', [mainPort])
      winNearest.webContents.postMessage('local-link', 'null', [localPort])
   } else {
      winNearest.close()
   }
}

const toggleBenchPathfinding = () => {
   settings.changeSetting('benchPathfinding', !settings.getSetting('benchPathfinding'))
}

let menuTemplate = [
   {
      label: "Settings",
      submenu: [
         {
            label: "Graph orientation",
            type: "submenu",
            toolTip: "What direction the graph should flow.",
            submenu: [
               {
                  label: "Top to Bottom",
                  type: "radio",
                  id: "TB",
                  click: setOrientation,
                  checked: settings.getSetting("mapOrientation") == "TB",
               },
               {
                  label: "Left to Right",
                  type: "radio",
                  id: "LR",
                  click: setOrientation,
                  checked: settings.getSetting("mapOrientation") == "LR",
               },
               {
                  label: "Right to Left",
                  type: "radio",
                  id: "RL",
                  click: setOrientation,
                  checked: settings.getSetting("mapOrientation") == "RL",
               },
               {
                  label: "Bottom to Top",
                  type: "radio",
                  id: "BT",
                  click: setOrientation,
                  checked: settings.getSetting("mapOrientation") == "BT",
               },
            ],
         },
         {
            label: "Translation Type",
            type: "submenu",
            toolTip: "Determines the text of nodes from dev text, to human readable.",
            submenu: [
               {
                  label: "Full",
                  type: "radio",
                  id: "full",
                  toolTip: "All nodes are translated to their human readable version.",
                  click: setTranslation,
                  checked: settings.getSetting("translationType") == "full",
               },
               {
                  label: "Basic",
                  type: "radio",
                  id: "basic",
                  toolTip: "Only translates important nodes (benches, stag, shops, etc...)",
                  click: setTranslation,
                  checked: settings.getSetting("translationType") == "basic",
               },
               {
                  label: "Landmarks",
                  type: "radio",
                  id: "landmark",
                  toolTip: "Translates major hub locations on-top-of basic locations.",
                  click: setTranslation,
                  checked: settings.getSetting("translationType") == "landmark",
               },
               {
                  label: "None",
                  type: "radio",
                  id: "none",
                  toolTip: "All nodes will be their default unformatted.",
                  click: setTranslation,
                  checked: settings.getSetting("translationType") == "none",
               },
            ],
         },
         {
            label: "Line length",
            type: "submenu",
            toolTip: "Length of the lines connecting nodes.",
            submenu: [
               {
                  label: "Normal",
                  type: "radio",
                  id: "normal",
                  click: setLineLength,
                  checked: settings.getSetting("lineLength") == "normal",
               },
               {
                  label: "Medium",
                  type: "radio",
                  id: "medium",
                  click: setLineLength,
                  checked: settings.getSetting("lineLength") == "medium",
               },
               {
                  label: "Long",
                  type: "radio",
                  id: "long",
                  click: setLineLength,
                  checked: settings.getSetting("lineLength") == "long",
               },
            ],
         },
         {
            label: "Consider benches for pathfinding",
            type: "checkbox",
            id: "benchPathfinding",
            click: toggleBenchPathfinding,
            checked: settings.getSetting("benchPathfinding")
         }
      ],
   },
   {
      label: "View",
      submenu: [
         {
            label: "Local Tracker",
            type: "checkbox",
            id: "localTracker",
            click: toggleLocalTracker
         },
         {
            label: "Nearest Tracker",
            type: "checkbox",
            id: "nearestTracker",
            click: toggleNearestTracker
         }
      ]
   },
   {
      label: "Dev Tools",
      role: "toggleDevTools"
   }
]


const createWindowMain = () => {

   winMain = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
         preload: path.resolve(__dirname, "trackerMain.js"),
         nodeIntegration: true,
         nodeIntegrationInWorker: true,
         contextIsolation: false
      },
   })

   winMain.on("closed", () => {
      winMain = null
      if (process.platform !== "darwin") app.quit()
   })

   winMain.loadURL(
      formatURL({
         pathname: path.resolve(__dirname, "tracker.html"),
         protocol: "file",
         slashes: true,
      })
   )

   Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate))

   globalShortcut.register("Control+Shift+I", () => {
      winMain.webContents.openDevTools()
   })
}

{
   // Start
   app.whenReady().then( () => {
      createWindowMain()
   })

   app.on("window-all-closed", () => {
      if (process.platform !== "darwin") app.quit()
   })
}

ipcMain.on('node-menu', (e, nodeName) => {
   let menuTemplate = [
      {
         label: "Set Target",
         click: () => { winMain.webContents.send('node-menu-apply', nodeName) }
      },
      {
         label: "Set Current Location",
         click: () => { winMain.webContents.send('node-set-current', nodeName) }
      }
   ]
   const menu = Menu.buildFromTemplate(menuTemplate)
   menu.popup()
})
