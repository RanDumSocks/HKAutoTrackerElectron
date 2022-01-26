const path = require("path")
const fs = require('fs')

exports.settingsFile = path.resolve(process.env.APPDATA, "HKAutoTracker/settings.json")
exports.options = {}
exports.defaultOptions = {
   translationType: "full",
   mapOrientation: "LR",
   lineLength: 1,
}

exports.loadSettings = (write) => {
   // Make options filepath
   fs.mkdir(path.resolve(process.env.APPDATA, "HKAutoTracker"), { recursive: true }, (err) => {
      if (err) throw err
   })

   // Load
   if (fs.existsSync(this.settingsFile)) {
      try {
         this.options = { ...this.defaultOptions, ...JSON.parse(fs.readFileSync(this.settingsFile)) }
      } catch (err) {
         console.log("Settings file corrupt, resetting to default settings.")
         this.options = this.defaultOptions
      }
   } else {
      this.options = this.defaultOptions
   }

   if (write) {
      this.writeSettings()
   }

   this.verifySettings()
}

exports.writeSettings = () => {
   fs.writeFile(this.settingsFile, JSON.stringify(this.options, null, 3), (err) => {
      if (err) throw err
   })
}

exports.verifySettings = () => {
   if (!["full", "basic", "landmark", "none"].includes(this.options.translationType)) {
      console.log(
         `Invalid translationType option "${this.options.translationType}". Must be either "full", "basic", "landmark", or "none".`
      )
   }
   if (!["TB", "TD", "BT", "RL", "LR"].includes(this.options.mapOrientation)) {
      console.log(
         `Invalid mapOrientation option "${this.options.mapOrientation}". Must be either "TB", "TD", "BT", "RL", or "LR".`
      )
   }
   if (!['normal', 'medium', 'long'].includes(this.options.lineLength)) {
      console.log(`Invalid lineLength option "${this.options.lineLength}". Must be either "normal", "meduim", or "long".`)
   }
}

exports.getSetting = (name) => {
   return this.options[name]
}

exports.changeSetting = (setting, value) => {
   this.options[setting] = value
   this.verifySettings()
   this.writeSettings()
}

this.loadSettings()
