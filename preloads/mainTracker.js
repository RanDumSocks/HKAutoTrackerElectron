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
   var logic         = {}         // name: logic
   var itemLocations = {}         // itemID: room
   var oneWayOut     = []         // Transitions which are one way
   var oneWayIn      = []
   var sceneNames    = new Set()  // string 'room'
   var gateNames     = new Set()  // string 'room[door]'
}

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

{ // Message handling
   ipcRenderer.once('version', (e, versionNum) => {
      window.addEventListener('DOMContentLoaded', () => {
         document.title = `HKAT v${versionNum}`
      })
   })
}
