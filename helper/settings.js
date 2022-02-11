// Settings management, should only be visible to the main process
const path = require('path')
const fs = require('fs')

module.exports = {
   settingsPath: path.resolve(
      process.env.APPDATA,
      'HKAutoTracker/settings.json'
   ),
   defaultOptions: {
      translationType: 'full',
      mapOrientation: 'LR',
      benchPathfinding: true,
      lastVersion: undefined,
   },
   options: {},

   get translationType() {
      return this.options.translationType
   },

   set translationType(value) {
      if (["full", "basic", "landmark", "none"].includes(value)) {
         this.options.translationType = value
      } else {
         console.log(`Invalid translationType option ${value}`)
      }
   },

   get mapOrientation() {
      return this.options.mapOrientation
   },

   set mapOrientation(value) {
      if (["TB", "TD", "BT", "RL", "LR"].includes(value)) {
         this.options.mapOrientation = value
      } else {
         console.log(`Invalid mapOrientation option ${value}`)
      }
   },

   get benchPathfinding() {
      return this.options.benchPathfinding
   },

   set benchPathfinding(value) {
      if (typeof(value) == 'boolean') {
         this.options.benchPathfinding = value
      } else {
         console.log(`Invalid benchPathfinding option ${value}`)
      }
   },

   get lastVersion() {
      return this.options.lastVersion
   },

   set lastVersion(value) {
      this.options.lastVersion = value
   },

   loadSettings: () => {
      var userSettings = undefined
      try {
         userSettings = JSON.parse(fs.readFileSync(module.exports.settingsPath))
      } catch (err) {
         console.log('Settings file corrupt, resetting to default settings.')
         module.exports.options = module.exports.defaultOptions
         return
      }

      for (const [settingName, value] of Object.entries(userSettings)) {
         if (Object.getOwnPropertyDescriptor(module.exports, settingName)?.set) {
            module.exports[settingName] = value
         } else {
            console.log(`Unknown setting ${settingName} found in user settings.`)
         }
      }

      module.exports.options = { ...module.exports.defaultOptions, ...module.exports.options}
   },

   // Should only be called on application exit
   writeSettings: () => {
      fs.writeFileSync(
         module.exports.settingsPath,
         JSON.stringify(module.exports.options, null, 3)
      )
   },
}

module.exports.loadSettings()
