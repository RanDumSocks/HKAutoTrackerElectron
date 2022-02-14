const path            = require('path')
const fs              = require('fs')
const rLineReader     = require('reverse-line-reader')
const { ipcRenderer } = require('electron')

// File Paths
const rootPath                 = path.resolve(process.env.APPDATA, '../LocalLow/Team Cherry/Hollow Knight')
const helperLogPath            = path.resolve(rootPath, 'Randomizer 4/Recent/HelperLog.txt')
const trackerDataPath          = path.resolve(rootPath, 'Randomizer 4/Recent/TrackerDataPM.txt')
const modSettingsPath          = path.resolve(rootPath, 'Randomizer 4/Recent/settings.txt')
const modLogPath               = path.resolve(rootPath, 'ModLog.txt')
const spoilerLogPath           = path.resolve(rootPath, 'Randomizer 4/Recent/RawSpoiler.json')
const transitionDictionaryPath = path.resolve(__dirname, '../resources/mapDict.json')
var   saveFilePath             = undefined                                                                   // Location of the user's modded save file, can change

const transitionLandmarks = {
   Crossroads_04          : ['Salubra Bench', 'bench'],
   Tutorial_01            : ["King's Pass", undefined],
   RestingGrounds_12      : ['Grey Mourner Bench', 'bench'],
   RestingGrounds_09      : ['Resting Grounds Stag Station', 'bench'],
   Deepnest_East_06       : ['Oro Bench', 'bench'],
   Room_mapper            : ['Iselda', 'shop'],
   Town                   : ['Dirtmouth', 'bench'],
   Deepnest_10            : ['Distant Village', undefined],
   RestingGrounds_07      : ['Seer', 'shop'],
   White_Palace_03_hub    : ['White Palace Atrium', 'bench'],
   Ruins_House_03         : ['Eternal Emilitia', undefined],
   Fungus3_archive        : ['Archives Bench', 'bench'],
   Mines_29               : ['Mines Dark Room Bench', 'bench'],
   Ruins1_02              : ['Quirrel Bench', 'bench'],
   Ruins1_31              : ['Ruins Toll Bench', 'bench'],
   Room_temple            : ['Temple', 'temple'],
   Fungus1_16_alt         : ['Greenpath Stag Station', 'bench'],
   Crossroads_47          : ['Crossroads Stag Station', 'bench'],
   Room_Ouiji             : ['Jiji', 'shop'],
   Room_Colosseum_02      : ['Colosseum Bench', 'bench'],
   Fungus1_15             : ['Sheo Bench', 'bench'],
   Crossroads_30          : ['Crossroads Hot Spring Bench', 'bench'],
   Deepnest_09            : ['Deepnest Stag Station', 'stag'],
   Deepnest_30            : ['Deepnest Hotspring Bench', 'bench'],
   Crossroads_46          : ['Upper Tram Left', undefined],
   Ruins2_06              : ['Kings Station', undefined],
   Fungus2_13             : ['Bretta Bench', 'bench'],
   Ruins_Bathhouse        : ['Pleasure House Bench', 'bench'],
   Abyss_18               : ['Basin Toll Bench', 'bench'],
   Crossroads_ShamanTemple: ['Ancestral Mounds Bench', 'bench'],
   Fungus2_31             : ['Mantis Village Bench', 'bench'],
   Ruins1_29              : ['City Storerooms', 'bench'],
   Mines_18               : ['Crystal Guardian Bench', 'bench'],
   White_Palace_01        : ['White Palace Entrance', 'bench'],
   Fungus3_40             : ['Gardens Stag Station', 'bench'],
   Fungus3_50             : ['Gardens Toll Bench', 'bench'],
   Deepnest_Spider_Town   : ["Beast's Den", undefined],
   Deepnest_14            : ['Failed Tramway Bench', 'bench'],
   Room_Slug_Shrine       : ['Unn Bench', 'bench'],
   White_Palace_06        : ['White Palace Balcony', 'bench'],
   Abyss_03               : ['Lower Tram Center', undefined],
   Fungus1_31             : ['Greenpath Toll Bench', 'bench'],
   Ruins2_08              : ['Kings Station Bench', 'bench'],
   Fungus2_02             : ['Queens Station Stag', 'bench'],
   Ruins1_18              : ["Watcher's Spire", 'Bench'],
   Fungus1_37             : ['Stone Sanctuary Bench', 'bench'],
   Room_Charm_Shop        : ['Salubra', 'shop'],
   Fungus1_01b            : ['Greenpath Waterfall Bench', 'bench'],
   Fungus2_26             : ['Leg Eater', 'shop'],
   Room_Town_Stag_Station : ['Dirtmouth Stag', 'stag'],
   Abyss_22               : ['Hidden Station', 'bench'],
   Crossroads_38          : ['Grubfather', 'shop'],
   Cliffs_03              : ['Stag Nest', 'stag'],
   Crossroads_07          : ['Crossroads Hub', undefined],
   RestingGrounds_05      : ['Resting Grounds Hub', undefined],
   Ruins2_04              : ['City Hub', undefined],
   Room_ruinhouse         : ['Sly Shack', undefined],
   Fungus2_01             : ["Queen's Station", undefined],
}
const transitionTranslation = { ...JSON.parse(fs.readFileSync(transitionDictionaryPath)), ...transitionLandmarks }

const mermaidClassDefs = `
classDef stag fill              : #a775d9;
classDef shop fill              : #946513;
classDef bench fill             : #022426;
classDef benchactive fill       : #138d94;
classDef transition stroke-width: 4px, stroke: #d68b00;
classDef check color            : #3ab020;
classDef last fill              : #022e00;
classDef unchecked fill         : #9e3c03;
classDef target fill            : #06288f;
`

{ // Tracker state variables
   var modLogic      = {}         // name: logic
   var itemLocations = {}         // itemID: room
   var oneWayOut     = []         // Transitions which are one way
   var oneWayIn      = []
   var sceneNames    = new Set()  // string 'room'
   var gateNames     = new Set()  // string 'room[door]'
   var saveVariables = {}         // randomiser logic variables (varName: value)

   var saveData = undefined  // User's modded save data parsed
}

// Called when user switches between saves
function loadSpoiler() {
   let r_itemLogic  = /[a-zA-Z0-9_]+(?=(\[| |$))/
   let r_terms      = undefined
   let terms        = []                           // logic variables
   let locationData = undefined

   try {
      locationData = JSON.parse(fs.readFileSync(spoilerLogPath))
   } catch (err) {
      return false
   }

   itemLocations = {}
   oneWayOut     = []
   oneWayIn      = []

   // Find transition data, scenes, rooms, and one ways
   for (const transition of locationData.LM.Transitions) {
      if (transition.oneWayType == 'OneWayOut') {
         oneWayOut.push(`${transition.sceneName}:${transition.gateName}`)
      }
      if (transition.oneWayType == 'OneWayIn') {
         oneWayIn.push(`${transition.sceneName}:${transition.gateName}`)
      }
      sceneNames.add(transition.sceneName)
      gateNames.add(transition.Name)
   }

   // Find logic variables 'terms'
   for (const term of locationData.LM.Terms) {
      if (!sceneNames.has(term) && !gateNames.has(term)) {
         terms.push(term)
      }
   }
   r_terms = new RegExp(terms.join('|'), 'g')

   // Find items and their location
   for (const itemSpoiler of locationData.itemPlacements) {
      var logic = itemSpoiler.location.logic.logic.replaceAll(r_terms, '')

      itemLocations[itemSpoiler.location.logic.name] = logic.match(r_itemLogic)?.[0]
   }

   for (const data of locationData.LM.Logic) {
      logic[data.name] = data.logic
   }
}

// Keeps save data updated with internal file watches
// Called when user switches between saves
function loadSave() {
   try {
      var seed  = fs.readFileSync(modSettingsPath, 'utf-8').match(/(?<="Seed": )[0-9]*/)[0]
      var files = fs.readdirSync(rootPath)

      files.every( (fileName) => {
         if ((/^user[0-9]+\.modded\.json$/).test(fileName)) {
            let previousSaveFilePath = saveFilePath
            let filePath             = path.resolve(rootPath, fileName)
            let testFile             = JSON.parse(fs.readFileSync(filePath))  // TODO dont parse, just use a regex test
            
            // Find save file with matching seed
            if (testFile?.modData?.["Randomizer 4"]?.GenerationSettings?.Seed == seed) {
               if (previousSaveFilePath) { fs.unwatchFile(previousSaveFilePath) }
               saveData = testFile

               saveData.modData.Benchwarp.visitedBenchScenes['Upper_Tram'] = saveData.modData.Benchwarp.visitedBenchScenes['Room_Tram_RG']
               saveData.modData.Benchwarp.visitedBenchScenes['Lower_Tram'] = saveData.modData.Benchwarp.visitedBenchScenes['Room_Tram']

               fs.watchFile(saveFilePath, { interval: 1000 }, async (curr, prev) => {
                  saveData = JSON.parse(fs.readFileSync(saveFilePath))

                  saveData.modData.Benchwarp.visitedBenchScenes['Upper_Tram'] = saveData.modData.Benchwarp.visitedBenchScenes['Room_Tram_RG']
                  saveData.modData.Benchwarp.visitedBenchScenes['Lower_Tram'] = saveData.modData.Benchwarp.visitedBenchScenes['Room_Tram']
                  // TODO update apropriate files
                  /*await updateLocation(true)
                  updateTracker()
                  updateFiles()*/
               })

               return false
            }
         }

         return true
      })
   } catch (err) {
      if (err) {
         console.warn('Save file could not be found')
         return false
      }
   }
}

// Called when trackerDataPath file changes
function loadVariables() {
   try {
      saveVariables = JSON.parse(fs.readFileSync(trackerDataPath, 'utf-8').replace(/\,(?!\s*?[\{\[\"\'\w])/g, ''))

      saveVariables['FALSE'] = 0
      saveVariables['TRUE']  = 1
   } catch (err) {
      console.warn("Could not load tracker data")
   }
}

// TODO evalLogic
// CHANGES: modLogic now passed, not logic string
// recieve list of true tokens instead of regex
// no checkDirections parameter
/**
 * 
 * @param {string} modLogicName name of the item in logic to compute
 * @param {Array[string] | RegExp} knownVars known variables or regular expression of assumed true variables
 */
function evalLogic(modLogicName, knownVars) {
   var parsedString = modLogic[modLogicName]
   var r_known      = knownVars instanceof RegExp ? knownVars : new RegExp(knownVars.join('|').replaceAll('[', '\\[').replaceAll(']', '\\]'))

   parsedString = truthRegexStr != '' ? parsedString.replaceAll(r_known, "true") : parsedString
   parsedString = parsedString.replaceAll("+", "&&")
   parsedString = parsedString.replaceAll("|", "||")
   //parsedString = parsedString.replaceAll(/[a-zA-Z0-9_]+\[[a-zA-Z0-9_]+\]/g, "false") // FIXME may be uneeded, testing required

   // TODO check if some conditionals compare 2 variables and not always a variable and a constant
   { // Conditional parsing
      let conditionals = parsedString.match(/[a-zA-Z0-9_]+(?=>|<|=)[>|<|=][0-9]+/g)
      if (conditionals) {
         for (const conditional of conditionals) {
            let r_conditionalData = /[a-zA-Z_]+/
            let dataValue         = saveVariables[conditional.match(r_conditionalData)[0]]
            let newConditional    = conditional.replace(r_conditionalData, dataValue.toString()).replace('=', '==')

            parsedString = parsedString.replace(conditional, `(${newConditional})`)
         }
      }
   }

   { // Variable parsing
      let variables = parsedString.match(/[a-zA-Z_']+[0-9_]*[a-zA-Z_']*/g)
      if (variables) {
         for (const variable of variables) {
            if (gateNames.has(variable)) {
               parsedString = parsedString.replace(variable, 'false')
            } else if (sceneNames.has(variable)) {
               parsedString = parsedString.replace(variable, evalLogic(modLogic[variable], r_known).toString())
            } else if (variable != 'true') {
               parsedString = parsedString.replace(variable, (saveVariables[variable] > 0).toString())
            }
         }
      }
   }

   return eval(parsedString)
}

// TODO findRoomInString

// TODO updateTracker

// TODO updateLocation

// TODO styleRoom

// TODO checkRoom

// TODO updateFiles

// TODO start

{ // Message handling
   ipcRenderer.once('version', (e, versionNum) => {
      window.addEventListener('DOMContentLoaded', () => {
         document.title = `HKAT v${versionNum}`
      })
   })
}
