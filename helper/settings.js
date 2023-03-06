// Settings management, should only be writable from the main process
const path = require('path')
const fs = require('fs')

const isRenderer = (process && process.type === 'renderer')

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
      if (isRenderer) { throw 'Cannot change setting values in renderer' }
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
      if (isRenderer) { throw 'Cannot change setting values in renderer' }
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
      if (isRenderer) { throw 'Cannot change setting values in renderer' }
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
      if (isRenderer) { throw 'Cannot change setting values in renderer' }
      this.options.lastVersion = value
   },

   getSetting: (settingName) => {
      // TODO implement me
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
            if (isRenderer) {
               module.exports.options[settingName] = value
            } else {
               module.exports[settingName] = value
            }
         } else {
            console.log(`Unknown setting ${settingName} found in user settings.`)
         }
      }

      module.exports.options = { ...module.exports.defaultOptions, ...module.exports.options}
   },

   // Should only be called on application exit
   writeSettings: () => {
      if (isRenderer) { throw 'Cannot change setting values in renderer' }
      fs.writeFileSync(
         module.exports.settingsPath,
         JSON.stringify(module.exports.options, null, 3)
      )
   },
}

module.exports.loadSettings()
