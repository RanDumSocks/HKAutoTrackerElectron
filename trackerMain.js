console.log("...Starting tracker...")
const { ipcRenderer } = require('electron')
const fs              = require('fs')
const path            = require('path')
const root            = path.resolve(process.env.APPDATA, "../LocalLow/Team Cherry/Hollow Knight/Randomizer 4/Recent/")
const helperLog       = path.resolve(root, "HelperLog.txt")
const trackerDataPath = path.resolve(root, "TrackerDataPM.txt")
const modSettingsPath = path.resolve(root, "settings.txt")
const modLog          = path.resolve(root, "../../ModLog.txt")
const spoilerLog      = path.resolve(root, "RawSpoiler.json")
const dict            = path.resolve(__dirname, "mapDict.json")
const settings        = require("./settings.js")
const rLineReader     = require('reverse-line-reader')
require("./helper/nodeMenu")
var debugOn = false

const r_helperLocation = /[a-zA-Z0-9_]*(?=\[)/
const r_helperDoor = /(?<=\[)[a-zA-Z0-9_]*(?=\])/
const r_itemLogic = /[a-zA-Z0-9_]+(?=(\[| |$))/

var mapTrackerString = ""
var rightLocationString = ""
var localTrackerString = ""
var nearestTrackerData = {}
var localPort = undefined
var nearestPort = undefined

ipcRenderer.on('local-link-main', (e, msg) => {
   localPort = e.ports[0]
})
ipcRenderer.on('local-unlink', (e, msg) => {
   localPort = undefined
})

ipcRenderer.on('nearest-link-main', (e, msg) => {
   nearestPort = e.ports[0]
})
ipcRenderer.on('nearest-unlink', (e, msg) => {
   nearestPort = undefined
})

const defaultTransitionTable = {
   Ruins2_10: { elevator: ["Ruins2_10b", "elevator"] },
   Ruins2_10b: { elevator: ["Ruins2_10", "elevator"] },
   Crossroads_49: { elevator: ["Crossroads_49b", "elevator"] },
   Crossroads_49b: { elevator: ["Crossroads_49", "elevator"] },
}
var checkedTransitionTable = {}
var sceneItemTable = {}
var uncheckedTransitionTable = {}
var lastLocation = ""
var exactLocation = ""
var targetNode = undefined // Node to pathfind to
var saveData = undefined
var saveFile = undefined

const specialCustom = {
   Crossroads_04: [ 'Salubra Bench', 'bench' ],
   Tutorial_01: [ 'King\'s Pass', undefined ],
   RestingGrounds_12: [ 'Grey Mourner Bench', 'bench' ],
   RestingGrounds_09: [ 'Resting Grounds Stag Station', 'bench' ],
   Deepnest_East_06: [ 'Oro Bench', 'bench' ],
   Room_mapper: [ 'Iselda', 'shop' ],
   Town: [ 'Dirtmouth', 'bench' ],
   Deepnest_10: [ 'Distant Village', undefined ],
   RestingGrounds_07: [ 'Seer', 'shop' ],
   White_Palace_03_hub: [ 'White Palace Atrium', 'bench' ],
   Ruins_House_03: [ 'Eternal Emilitia', undefined ],
   Fungus3_archive: [ 'Archives Bench', 'bench' ],
   Mines_29: [ 'Mines Dark Room Bench', 'bench' ],
   Ruins1_02: [ 'Quirrel Bench', 'bench' ],
   Ruins1_31: [ 'Ruins Toll Bench', 'bench' ],
   Room_temple: [ 'Temple', 'temple' ],
   Fungus1_16_alt: [ 'Greenpath Stag Station', 'bench' ],
   Crossroads_47: [ 'Crossroads Stag Station', 'bench' ],
   Room_Ouiji: [ 'Jiji', 'shop' ],
   Room_Colosseum_02: [ 'Colosseum Bench', 'bench' ],
   Fungus1_15: [ 'Sheo Bench', 'bench' ],
   Crossroads_30: [ 'Crossroads Hot Spring Bench', 'bench' ],
   Deepnest_09: [ 'Deepnest Stag Station', 'stag' ],
   Deepnest_30: [ 'Deepnest Hotspring Bench', 'bench' ],
   Crossroads_46: [ 'Upper Tram Left', undefined ],
   Ruins2_06: [ 'Kings Station', undefined ],
   Fungus2_13: [ 'Bretta Bench', 'bench' ],
   Ruins_Bathhouse: [ 'Pleasure House Bench', 'bench' ],
   Abyss_18: [ 'Basin Toll Bench', 'bench' ],
   Crossroads_ShamanTemple: [ 'Ancestral Mounds Bench', 'bench' ],
   Fungus2_31: [ 'Mantis Village Bench', 'bench' ],
   Ruins1_29: [ 'City Storerooms', 'bench' ],
   Mines_18: [ 'Crystal Guardian Bench', 'bench' ],
   White_Palace_01: [ 'White Palace Entrance', 'bench' ],
   Fungus3_40: [ 'Gardens Stag Station', 'bench' ],
   Fungus3_50: [ 'Gardens Toll Bench', 'bench' ],
   Deepnest_Spider_Town: [ 'Beast\'s Den', undefined ],
   Deepnest_14: [ 'Failed Tramway Bench', 'bench' ],
   Room_Slug_Shrine: [ 'Unn Bench', 'bench' ],
   White_Palace_06: [ 'White Palace Balcony', 'bench' ],
   Abyss_03: [ 'Lower Tram Center', undefined ],
   Fungus1_31: [ 'Greenpath Toll Bench', 'bench' ],
   Ruins2_08: [ 'Kings Station Bench', 'bench' ],
   Fungus2_02: [ 'Queens Station Stag', 'bench' ],
   Ruins1_18: [ 'Watcher\'s Spire', 'Bench' ],
   Fungus1_37: [ 'Stone Sanctuary Bench', 'bench' ],
   Room_Charm_Shop: [ 'Salubra', 'shop' ],
   Fungus1_01b: [ 'Greenpath Waterfall Bench', 'bench' ],
   Fungus2_26: [ 'Leg Eater', 'shop'],
   Room_Town_Stag_Station: ["Dirtmouth Stag", "stag"],
   Abyss_22: ["Hidden Station", "bench"],
   Crossroads_38: ["Grubfather", "shop"],
   Cliffs_03: ["Stag Nest", "stag"],
   Crossroads_07: ["Crossroads Hub", undefined],
   RestingGrounds_05: ["Resting Grounds Hub", undefined],
   Ruins2_04: ["City Hub", undefined],
   Room_ruinhouse: ["Sly Shack", undefined],
   Fungus2_01: ["Queen's Station", undefined]
}
const special = { ...JSON.parse(fs.readFileSync(dict)), ...specialCustom }

const classDefs = `
classDef stag fill:#a775d9;
classDef shop fill:#946513;
classDef bench fill:#022426;
classDef benchactive fill:#138d94;
classDef transition stroke-width:4px,stroke:#d68b00;
classDef check color:#3ab020;
classDef last fill:#022e00;
classDef unchecked fill:#9e3c03;
classDef target fill:#06288f;
`

var itemLocations = {}
var modLogic = {}
var saveVariables = {}
var oneWayOut = []
var oneWayIn = []
var sceneNames = new Set() // room[door]
var gateNames = new Set()

function loadSpoiler() {
   var termsData = JSON.parse(fs.readFileSync(path.resolve(__dirname, "terms.json")))
   var regexTerms = new RegExp(termsData.join("|"), "g")
   var locationData = undefined
   try {
      locationData = JSON.parse(fs.readFileSync(spoilerLog))
   } catch (err) {
      return false
   }
   itemLocations = {}
   oneWayOut = []
   oneWayIn = []
   sceneNames = new Set(['Upper_Tram', 'Lower_Tram'])
   gateNames = new Set()
   modLogic = {}
   for (const itemSpoiler of locationData.itemPlacements) {
      var logic = itemSpoiler.Location.logic.Logic.replaceAll(regexTerms, "")
      itemLocations[itemSpoiler.Location.logic.Name] = logic.match(r_itemLogic)?.[0]
   }
   for (const transition of locationData.transitionPlacements) {
      if (transition.Target.TransitionDef.Sides == 'OneWayOut') {
         oneWayOut.push(`${transition.Target.TransitionDef.SceneName}:${transition.Target.TransitionDef.DoorName}`)
      }
      if (transition.Target.TransitionDef.Sides == 'OneWayIn') {
         oneWayIn.push(`${transition.Target.TransitionDef.SceneName}:${transition.Target.TransitionDef.DoorName}`)
      }
      sceneNames.add(transition.Target.TransitionDef.SceneName)
      gateNames.add(transition.Target.Name)
   }
   for (const data of locationData.LM.Logic) {
      modLogic[data.name] = data.logic
   }
}

function linkSave() {
   try {
      var seed = fs.readFileSync(modSettingsPath, 'utf-8').match(/(?<="Seed": )[0-9]*/)[0]
      var files = fs.readdirSync(path.resolve(root, '../../'))
      files.every( (fileName) => {
         if ((/^user[0-9]+\.modded\.json$/).test(fileName)) {
            var prevSave = saveFile
            saveFile = path.resolve(root, "../../", fileName)
            let modFile = JSON.parse(fs.readFileSync(saveFile))
            console.log(saveFile)
            if (modFile?.modData?.["Randomizer 4"]?.GenerationSettings?.Seed == seed) {
               console.log('linked')
               
               if (prevSave) { fs.unwatchFile(prevSave) }
               saveData = modFile
               saveData.modData.Benchwarp.visitedBenchScenes['Upper_Tram'] = saveData.modData.Benchwarp.visitedBenchScenes['Room_Tram_RG']
               saveData.modData.Benchwarp.visitedBenchScenes['Lower_Tram'] = saveData.modData.Benchwarp.visitedBenchScenes['Room_Tram']
               console.log(`Linked save file ${fileName}`)

               fs.watchFile(saveFile, { interval: 1000 }, async (curr, prev) => {
                  saveData = JSON.parse(fs.readFileSync(saveFile))
                  saveData.modData.Benchwarp.visitedBenchScenes['Upper_Tram'] = saveData.modData.Benchwarp.visitedBenchScenes['Room_Tram_RG']
                  saveData.modData.Benchwarp.visitedBenchScenes['Lower_Tram'] = saveData.modData.Benchwarp.visitedBenchScenes['Room_Tram']
                  await updateLocation(true)
                  updateTracker()
                  updateFiles()
               })

               return false
            }
         }
         return true
      })
   } catch (err) {
      if (err) {
         console.log("Seed could not be found")
         return false
      }
   }
}

function loadVariables() {
   try {
      saveVariables = JSON.parse(fs.readFileSync(trackerDataPath, 'utf-8').replace(/\,(?!\s*?[\{\[\"\'\w])/g, ''))
      saveVariables['FALSE'] = 0
      saveVariables['TRUE'] = 1
   } catch (err) {
      console.log("Could not link logic")
   }
}

async function start() {
   loadSpoiler()
   linkSave()
   loadVariables()
   await updateLocation()
   updateTracker()
   updateFiles()
   fs.watchFile(helperLog, { interval: 500 }, async (curr, prev) => {
      updateTracker()
      await updateLocation(true)
      updateFiles()
   })
   fs.watchFile(modLog, { interval: 1000 }, async (curr, prev) => {
      if (await updateLocation(false, true)) {
         updateTracker()
         await updateLocation()
         updateTracker()
         updateFiles()
      }
   })
   fs.watchFile(settings.settingsFile, { interval: 1000 }, async (curr, prev) => {
      settings.loadSettings(false)
      updateTracker()
      await updateLocation(true)
      updateFiles()
   })
   fs.watchFile(spoilerLog, {interval: 1200}, async (curr, prev) => {
      loadSpoiler()
      updateTracker()
      await updateLocation()
      updateFiles()
   })
   fs.watchFile(modSettingsPath, { interval: 1000 }, async (curr, prev) => {
      linkSave()
      updateTracker()
      await updateLocation(true)
      updateFiles()
   })
   fs.watchFile(trackerDataPath, { interval: 1000 }, async (curr, prev) => {
      loadVariables()
   })
   console.log("Tracker running.")
}

function getData(str, isRaw) {
   return isRaw ? saveVariables[str] : saveVariables[str] > 0
}

function evalLogic(logicString, truthRegexStr, checkDirection) {
   var r_known = truthRegexStr ? new RegExp(truthRegexStr, 'g') : undefined
   var parsedString = logicString
   if (checkDirection) {
      var reLogic = evalLogic(modLogic[checkDirection], truthRegexStr)
      if (!reLogic) { return false }
   }
   parsedString = truthRegexStr != '' && r_known ? parsedString.replaceAll(r_known, "true") : parsedString
   parsedString = parsedString.replaceAll("+", "&&")
   parsedString = parsedString.replaceAll("|", "||")
   parsedString = parsedString.replaceAll(/[a-zA-Z0-9_]+\[[a-zA-Z0-9_]+\]/g, "false") // FIXME may be uneeded, testing required

   // Conditional parsing
   var conditionals = parsedString.match(/[a-zA-Z0-9_]+(?=>|<|=)[>|<|=][0-9]+/g)
   if (conditionals) {
      for (const conditional of conditionals) {
         let r_conditionalData = /[a-zA-Z_]+/
         let dataValue = getData(conditional.match(r_conditionalData)[0], true)
         let newConditional = conditional.replace(r_conditionalData, dataValue.toString()).replace('=', '==')
         parsedString = parsedString.replace(conditional, `(${newConditional})`)
      }
   }

   // Variable parsing
   var variables = parsedString.match(/[a-zA-Z_']+[0-9_]*[a-zA-Z_']*/g)
   if (variables) {
      for (const variable of variables) {

         if (gateNames.has(variable)) {
            parsedString = parsedString.replace(variable, 'false')
         } else if (sceneNames.has(variable)) {
            parsedString = parsedString.replace(variable, evalLogic(modLogic[variable], r_known).toString())
         } else if (variable != 'true') {
            parsedString = parsedString.replace(variable, getData(variable).toString())
         }
      }
   }

   return eval(parsedString)
}

function findRoom(str, lookGates, lookScenes) {
   var variables = str.match(/[a-zA-Z0-9_\[\]]+/g)
   if (variables) {
      for (const variable of variables) {
         if ((gateNames.has(variable) && lookGates) || (sceneNames.has(variable) && lookScenes)) {
            return variable
         }
      }
   }
}

function updateTracker() {
   var transitionData = ""
   rightLocationString = ""
   sceneItemTable = {}
   uncheckedTransitionTable = {}
   addedStyles = []
   addedNames = []
   nameString = ""
   checkedTransitionTable = JSON.parse(JSON.stringify(defaultTransitionTable))

   /* #region loadHelper*/
   var helperLogFile = undefined
   try {
       helperLogFile = fs.readFileSync(helperLog, 'utf-8').replaceAll(/\*/g, "")
   } catch (err) {
       console.log("helper log file not found")
   }
   if (!helperLogFile) { return }

   var inUncheckedTransition = false
   var startItemChecks = false
   var startTransition = false
   const r_transStart = /UNCHECKED REACHABLE TRANSITIONS$/
   const r_itemStart = /UNCHECKED REACHABLE LOCATIONS$/
   const r_transitionStart = /CHECKED TRANSITIONS$/
   const r_transitionFrom = /^[a-zA-Z0-9_]*/
   const r_transitionTo = /(?<=-->)[a-zA-Z0-9_]*/
   const r_doorTransitions = /(?<=\[)[a-zA-Z0-9_]*(?=\])/g
   const r_right = /right/g
   helperLogFile.split(/\r?\n/).forEach(line => {
      if (startTransition) {
         if (line.replaceAll(/\r?\n? /g) == "") {
            startTransition = false
         } else {
            var trimmedLine = line.replaceAll(/\r?\n? /g, "")
            var transitionFrom = trimmedLine.match(r_transitionFrom)[0]
            var transitionTo = trimmedLine.match(r_transitionTo)[0]
            var doorFrom = trimmedLine.match(r_doorTransitions)[0]
            var doorTo = trimmedLine.match(r_doorTransitions)[1]
            if (transitionTo && transitionFrom && !oneWayOut.includes(`${transitionFrom}:${doorFrom}`)) {
               if (!checkedTransitionTable[transitionFrom]) { checkedTransitionTable[transitionFrom] = {} }
               checkedTransitionTable[transitionFrom][doorFrom] = [transitionTo, doorTo]
            }
         }
      }
      if (!startTransition && r_transitionStart.test(line)) {
         startTransition = true
      }

      if (inUncheckedTransition) {
         if (line.replaceAll(/\r?\n? /g) == "") {
            inUncheckedTransition = false
         } else {
            var transitionLocation = line.match(r_helperLocation)[0]
            var transitionDoor = line.match(r_helperDoor)[0]

            if (uncheckedTransitionTable[transitionLocation]) {
               uncheckedTransitionTable[transitionLocation].push(transitionDoor)
            } else {
               uncheckedTransitionTable[transitionLocation] = [transitionDoor]
            }
            if (r_right.test(line)) {
               rightLocationString += `- ${transitionLocation}\n`
            }
         }
      }
      if (!inUncheckedTransition && r_transStart.test(line)) {
         inUncheckedTransition = true
      }

      if (startItemChecks) {
         if (line.replaceAll(/\r?\n? /g) == "") {
            startItemChecks = false
         } else {
            var item = line.replaceAll(/\r?\n? /g, "")
            if (itemLocations[item]) {

               if (sceneItemTable[itemLocations[item]]) {
                  sceneItemTable[itemLocations[item]] += 1
               } else {
                  sceneItemTable[itemLocations[item]] = 1
               }
            }
         }
      }
      if (!startItemChecks && r_itemStart.test(line)) {
         startItemChecks = true
      }
   })
   /* #endregion */

   var connections = {}
   for (const [sceneFrom, doors] of Object.entries(checkedTransitionTable)) {
      var subgraph = ``
      for (const [gateFrom, toId] of Object.entries(doors)) {
         if (connections[`${toId[0]}:${toId[1]}`] != `${sceneFrom}:${gateFrom}`) {
            var nameTo = toId[0]
            var length = settings.getSetting('lineLength') == "normal" ? "" : (settings.getSetting('lineLength') == "medium" ? "-" : "--")
            if (oneWayIn.includes(`${sceneFrom}:${gateFrom}`)) {
               subgraph += `${sceneFrom} --${length}> ${nameTo}\n`
            } else {
               subgraph += `${sceneFrom} --${length}- ${nameTo}\n`
            }

            var fromCheck = checkRoom(sceneFrom)
            var toCheck = checkRoom(nameTo)
            if (!addedStyles.includes(sceneFrom)) {
               addedStyles.push(sceneFrom)
               subgraph += fromCheck
            }
            if (!addedStyles.includes(nameTo)) {
               addedStyles.push(nameTo)
               subgraph += toCheck
            }
            if (!addedNames.includes(sceneFrom)) {
               addedNames.push(sceneFrom)
               nameString += `${styleRoom(sceneFrom)}\n`
            }
            if (!addedNames.includes(nameTo)) {
               addedNames.push(nameTo)
               nameString += `${styleRoom(nameTo)}\n`
            }
            connections[`${sceneFrom}:${gateFrom}`] = `${toId[0]}:${toId[1]}`
         }
      }
      transitionData += subgraph
   }

   mapTrackerString = `flowchart ${settings.getSetting('mapOrientation')}\n${classDefs}\n\n${nameString}\n${transitionData}`
}

async function updateLocation(updateAnyway, onlyReport, forceLast) {
   const r_transitionChange = /(?<=\[INFO\]:\[Hkmp\.Game\.Client\.ClientManager\] Scene changed from ).*(?=\n|$)/gm
   var location = undefined

   if (forceLast) {
      location = lastLocation
   } else {
      await rLineReader.eachLine(modLog, (line, last) => {
         location = line.match(r_transitionChange)?.[0].match(/\b(\w+)($|\s*$)/)?.[0]
         if (location) {
            return false
         }
      })
   }

   if (updateAnyway && !location) { location = lastLocation }

   var doors = checkedTransitionTable[location]
   var secondLayer = []
   var transitionData = ``
   var chartLocal = ""
   if ((lastLocation == location) && !updateAnyway) { return false }
   if (!location || !doors) { return false }
   if (onlyReport) { return true }

   { // Guess transition
      if (lastLocation != location && checkedTransitionTable[location]) {
         for (const [door, toRoom] of Object.entries(checkedTransitionTable[location])) {
            if (toRoom[0] == lastLocation) {
               exactLocation = `${location}[${door}]`
               break
            }
         }
      }
   }

   // Build truth table
   var activeBenches = []
   var truths = []
   var truthsNames = []
   var r_truths = undefined
   if (exactLocation) { truths.push(exactLocation) }
   if (location) { truthsNames.push(location) }

   if (settings.getSetting('benchPathfinding')) {
      // Get benches
      for (const data of saveData.modData.Benchwarp.visitedBenchScenes) {
         activeBenches.push(data.SceneName)
      }
      console.log(activeBenches)

      var r_truth = undefined
      if (activeBenches.length > 0) {
         r_truth = new RegExp(activeBenches.join('(\\[[a-zA-Z0-9_]*\\])*|') + '(\\[[a-zA-Z0-9_]*\\])*', 'g')
      }
      // Build bench logic
      let benchLogicPart = []
      var stringBuilder = ""
      var nest = 0
      for (var i = 0; i < modLogic.Can_Bench.length; i++) {
         var character = modLogic.Can_Bench.charAt(i)
         if (character == "|" && nest == 0) {
            benchLogicPart.push(stringBuilder)
            stringBuilder = ""
            continue
         } else if (character == "(") {
            nest++
         } else if (character == ")") {
            nest--
         }
         stringBuilder += character
      }

      // find true checks
      for (const key in benchLogicPart) {
         const logic = benchLogicPart[key]
         const logicRoom = findRoom(logic, true, true)
         const logicDirection = findRoom(logic, true, false)
         if (evalLogic(logic, r_truth, logicDirection)) {
            truths.push(logicRoom)
            truthsNames.push(logicRoom.match(/[a-zA-Z0-9_]*(?=\[)?/)[0])
         }
      }
   }

   r_truths = truths.join('|').replaceAll('[', '\\[').replaceAll(']', '\\]')
   
   { // Local map

      // Local map generation
      lastLocation = location
      for (const [fromDoor, toId] of Object.entries(doors)) {
            var nameFrom = location
            var nameTo = toId[0]
            if (exactLocation) {
               if (evalLogic(modLogic[`${nameFrom}[${fromDoor}]`], r_truths + '|' + exactLocation.replace('[', '\\[').replace(']', '\\]'))) {
                  transitionData += `${styleRoom(nameFrom)} -- ${fromDoor} --> ${styleRoom(nameTo)}\n${checkRoom(nameFrom)}${checkRoom(nameTo)}`
                  secondLayer.push(toId[0])
               }
            } else {
               transitionData += `${styleRoom(nameFrom)} -- ${fromDoor} --> ${styleRoom(nameTo)}\n${checkRoom(nameFrom)}${checkRoom(nameTo)}`
               secondLayer.push(toId[0])
            }
      }
      /*for (const location2 of secondLayer) {
         doors = checkedTransitionTable[location2]
         if (!doors) { continue }
         for (const [fromDoor, toId] of Object.entries(doors)) {
            var nameFrom = location2
            var nameTo = toId[0]
            if (nameTo != location) {
              transitionData += `${styleRoom(nameFrom)} -- ${fromDoor} --> ${styleRoom(nameTo)}\n${checkRoom(nameFrom)}${checkRoom(nameTo)}`
            }
         }
      }*/
      for (const [transition, transitionCheck] of Object.entries(uncheckedTransitionTable)) {
         if (transition == location) {
            for (const door of transitionCheck) {
               if (exactLocation) {
                  if (evalLogic(modLogic[`${transition}[${door}]`], r_truths + '|' + exactLocation.replace('[', '\\[').replace(']', '\\]'))) {
                     transitionData += `${transition} -- ${door} --> UNCHECKED([UNCHECKED]):::unchecked\n`
                  }
               } else {
                  transitionData += `${transition} -- ${door} --> UNCHECKED([UNCHECKED]):::unchecked\n`
               }
            }
         }
      }
      secondLayer.push(location)
      for (const room of secondLayer) {
         if (sceneItemTable[room]) {
            transitionData += `${room}:::check\n`
         }
         if (uncheckedTransitionTable[room]) {
            transitionData += `${room}:::transition\n`
         }
      }
      transitionData += `${lastLocation}:::last\n`
      chartLocal = `flowchart LR\n${classDefs}\n\n${transitionData}\n`
   }

   { // Nearest Transition


      // Smart AI
      var BFSqueue = []
      var visited = {}
      var dist = {}
      var pred = {}
      var link = {}

      var foundTransition = false
      var foundCheck = false
      var foundBench = false
      var foundTarget = false

      var transitionString = ""
      var checkString = ""
      var benchString = ""
      var targetString = ""

      var transitionChart = ""
      var checkChart = ""
      var benchChart = ""
      var targetChart = ""

      for (const truth of truths) {
         visited[truth] = true
         dist[truth] = 0
         BFSqueue.push(truth)
      }

      gateNames.forEach( (roomName) => {
         var scene = roomName.match(/[a-zA-Z0-9_]*(?=\[)/)[0]
         if ( !visited[roomName] && truthsNames.includes(scene) && evalLogic(modLogic[roomName], r_truths)) {
            truths.push(roomName)
            visited[roomName] = true
            dist[roomName] = 0
            BFSqueue.push(roomName)
         }
      })

      r_truths = truths.join('|').replaceAll('[', '\\[').replaceAll(']', '\\]')

      while (BFSqueue.length != 0) {
         var u = BFSqueue.shift()
         var currRoom = u.match(/[a-zA-Z0-9_]+(?=\[)?/)[0] // Where you can go
         var currDoor = u.match(/(?<=\[)[a-zA-Z0-9_]+(?=\])/)?.[0]
         if (!checkedTransitionTable[currRoom]?.[currDoor]) { continue }
         const front = checkedTransitionTable[currRoom][currDoor] // Where it leads
         const frontName = front[0]
         const frontRoom = front[1]
         const frontTitle = `${frontName}[${frontRoom}]`

         dist[frontTitle] = dist[u] + 1
         pred[frontTitle] = u
         visited[frontTitle] = true

         r_newTruths = r_truths + `|${frontName}\\[${frontRoom}\\]`

         gateNames.forEach( (roomName) => {
            var roomScene = roomName.match(/[a-zA-Z0-9_]*(?=\[)/)[0]
            if ( !visited[roomName] && roomScene == frontName && evalLogic(modLogic[roomName], r_newTruths)) {
               visited[roomName] = true
               link[roomName] = frontTitle
               BFSqueue.push(roomName)
            }
         })

         let buildBFSMap = (outStringC) => {
            var outString = outStringC
            var currPrint = frontTitle
            var predPrint = pred[frontTitle]
            var linkPrint = link[predPrint]
            while (predPrint) {
               var fromRoom = predPrint.match(/[a-zA-Z0-9_]*(?=\[)/)[0]
               var fromDoor = predPrint.match(/(?<=\[)[a-zA-Z0-9_]+(?=\])/)[0]
               var toRoom = currPrint.match(/[a-zA-Z0-9_]*(?=\[)/)[0]
               outString += `${styleRoom(fromRoom)} -- ${fromDoor} --> ${styleRoom(toRoom)}\n${checkRoom(toRoom)}${checkRoom(fromRoom)}`
               currPrint = linkPrint
               predPrint = pred[currPrint]
               linkPrint = link[predPrint]
            }
            return outString
         }

         if (uncheckedTransitionTable[frontName] && !foundTransition && evalLogic(modLogic[frontTitle], r_newTruths)) { // Transition path
            foundTransition = true
            let successBFS = buildBFSMap(transitionString)
            if (!successBFS) {
               continue
            } else {
               transitionString = successBFS
            }
         }

         if (sceneItemTable[frontName] && !foundCheck) { // Check path
            foundCheck = true
            let successBFS = buildBFSMap(checkString)
            if (!successBFS) {
               continue
            } else {
               checkString = successBFS
            }
         }
         if (special[frontName]?.[1] == 'bench' && !foundBench) { // Check bench
            foundBench = true
            let successBFS = buildBFSMap(benchString)
            if (!successBFS) {
               continue
            } else {
               benchString = successBFS
            }
         }
         if (targetNode == frontName && !foundTarget) { // Check bench
            foundTarget = true
            let successBFS = buildBFSMap(targetString)
            if (!successBFS) {
               continue
            } else {
               targetString = successBFS
            }
         }

         if (foundTransition && foundCheck && foundBench && foundTarget) { break }
      }
      transitionChart = `flowchart LR\n${classDefs}\n${transitionString}`
      checkChart = `flowchart LR\n${classDefs}\n${checkString}`
      benchChart = `flowchart LR\n${classDefs}\n${benchString}`
      targetChart = `flowchart LR\n${classDefs}\n${targetString}`
      nearestTrackerData = {
         transitionChart: transitionChart,
         checkChart: checkChart,
         benchChart: benchChart,
         targetChart: targetChart
      }
   }

   localTrackerString = chartLocal
   return true
}

function styleRoom(room) {
   var name = ""
   var number = sceneItemTable[room] ? ` [${sceneItemTable[room]}]` : ""
   if (settings.getSetting('translationType') == 'full') {
      name = special[room] ? `${room}(["${special[room][0].replaceAll(/_/g, " ")}${number}"])` : `${room}(["${room}${number}"])`
   } else if (settings.getSetting('translationType') == 'basic') {
      name = special[room] && special[room]?.[1] && (special[room][1] == 'bench' || special[room][1] == 'shop' || special[room][1] == 'stag') ? `${room}(["${special[room][0].replaceAll(/_/g, " ")}${number}"])` : `${room}(["${room}${number}"])`
   } else if (settings.getSetting('translationType') == 'landmark') {
      name = special[room] && specialCustom[room] ? `${room}(["${special[room][0].replaceAll(/_/g, " ")}${number}"])` : `${room}(["${room}${number}"])`
   } else if (settings.getSetting('translationType') == 'none') {
      name = `${room}(["${room}${number}"])`
   }

   if (lastLocation == room) {
      name = `${name}:::last`
   } else if (targetNode == room) {
      name = `${name}:::target`
   } else if (saveData?.modData?.Benchwarp?.visitedBenchScenes?.some(e => e.SceneName == room)) {
      name = `${name}:::benchactive`
   } else {
      name = special[room]?.[1] ? `${name}:::${special[room]?.[1]}` : name
   }
   return name
}

function checkRoom(room) {
   var addStyle = ""
   if (uncheckedTransitionTable[room]) {
      addStyle += `${room}:::transition\n`
   }
   if (sceneItemTable[room]) {
      addStyle += `${room}:::check\n`
   }
   return addStyle
}

var lastMapTrackerString = ""
var lastRightLocationString = ""
var lastLocalTrackerString = ""
var lastNearestTrackerData = {}
async function updateFiles() {
   if (mapTrackerString != lastMapTrackerString) {
      document.getElementById('mermaidGraph').innerHTML = mapTrackerString
      lastMapTrackerString = mapTrackerString
   }

   /*if (rightLocationString != lastRightLocationString) {
      fs.writeFile(rightOut, rightLocationString, (err) => {
         if (err) throw err
      })
      lastRightLocationString = rightLocationString
   }*/

   if (localPort && lastLocalTrackerString != localTrackerString) {
      localPort.postMessage(localTrackerString)
      lastLocalTrackerString = localTrackerString
   }

   if (nearestPort && lastNearestTrackerData != nearestTrackerData) {
      nearestPort.postMessage(nearestTrackerData)
      lastNearestTrackerData = nearestTrackerData
   }
}

window.addEventListener('DOMContentLoaded', () => {
    try {
        start()
    } catch (err) {
        console.log(err)
    }
})

ipcRenderer.on('node-menu-apply', async (e, roomName) => {
   targetNode = roomName
   updateTracker()
   await updateLocation(true)
   updateFiles()
})

ipcRenderer.on('node-set-current', async (e, roomName) => {
   lastLocation = roomName
   updateTracker()
   await updateLocation(true, false, true)
   updateFiles()
})

ipcRenderer.on('main-message', (e, info) => {
   var id = info[0]
   var data = info[1]
   switch (id) {
      case 'version':
         window.addEventListener('DOMContentLoaded', () => {
            document.title = `HKAT v${data}`
         })
         break

      case 'find-location':
         var lastNode = document.getElementsByClassName('node last')[0]
         if (lastNode) {
            console.log(lastNode.offsetTop, lastNode),
            lastNode.scrollIntoView({
               behavior: 'smooth'
            })
         } else {
            alert('Location could not be found, try transitioning once or set it manually.')
         }
         break
   
      default:
         break
   }
})

function debug(...msg) {
   if (debugOn) {
      console.log(msg)
   }
}