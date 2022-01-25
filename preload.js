//document.getElementById('mermaidGraph').innerHTML

console.log("...Starting tracker...")
const fs = require('fs')
const path = require('path')
const root = path.resolve(process.env.APPDATA, "../LocalLow/Team Cherry/Hollow Knight/Randomizer 4/Recent/")
const helperLog = path.resolve(root, "HelperLog.txt")
const modLog = path.resolve(root, "../../ModLog.txt")
const modLogAppend = path.resolve(root, "../../ModLogAppend.txt")
const spoilerLog = path.resolve(root, "RawSpoiler.json")
const dict = path.resolve(__dirname, "mapDict.json")
const output = "HKAutotrack.md"
const lastOut = "localTracker.md"
const rightOut = "rightLocations.md"
const settingsFile = path.resolve(process.env.APPDATA, "HKAutoTracker/settings.json")

const r_helperLocation = /[a-zA-Z0-9_]*(?=\[)/
const r_helperDoor = /(?<=\[)[a-zA-Z0-9_]*(?=\])/
const r_locationLogic = /[a-zA-Z0-9_]*(?=(\[| |$))/

var mapTrackerString = ""
var rightLocationString = ""
var localTrackerString = ""

var defaultTransitionTable = {
   Ruins2_10: { elevator: ["Ruins2_10b", "elevator"] },
   Ruins2_10b: { elevator: ["Ruins2_10", "elevator"] },
   Crossroads_49: { elevator: ["Crossroads_49b", "elevator"] },
   Crossroads_49b: { elevator: ["Crossroads_49", "elevator"] },
}
var transitionTable = {}
var checkTable = {}
var avaliableTransitionTable = {}
var lastLocation = ""

const specialCustom = {
   Crossroads_04: [ 'Salubra Bench', 'bench' ],
   Tutorial_01: [ 'Start', 'start' ],
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
   Room_Ouiji: [ 'Jiji', undefined ],
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
   Cliffs_03: ["Stag Nest", "stag"]
}
const special = { ...JSON.parse(fs.readFileSync(dict)), ...specialCustom }

const classDefs = `
classDef stag fill:#a775d9;
classDef shop fill:#946513;
classDef bench fill:#138d94;
classDef transition stroke-width:4px,stroke:#d68b00;
classDef check color:#3ab020;
classDef last fill:#022e00;
classDef unchecked fill:#9e3c03;
`

var locationData = JSON.parse(fs.readFileSync(spoilerLog))
var termsData = JSON.parse(fs.readFileSync(path.resolve(__dirname, "terms.json")))
var locationLogic = {}

termsData.push("RIGHTBALDURS")

var regexTerms = new RegExp(termsData.join("|"), "g")

for (const itemSpoiler of locationData.itemPlacements) {
   var logic = itemSpoiler.location.logic.logic.replaceAll(regexTerms, "")
   locationLogic[itemSpoiler.location.logic.name] = logic.match(r_locationLogic)?.[0]
}

const defaultOptions = {
   translationType: 'full',
   mapOrientation: 'LR',
   lineLength: 1
}
var options = {}
{ // Load options

   { // First load   
      if (fs.existsSync(settingsFile)) {
         try {
            options = {...defaultOptions, ...JSON.parse(fs.readFileSync(settingsFile))}
         } catch (err) {
            console.log("Settings file corrupt, resetting to default settings.")
            options = defaultOptions
         }
      } else {
         options = defaultOptions
      }
      fs.mkdir(path.resolve(process.env.APPDATA, "HKAutoTracker"), { recursive: true }, (err) => {
        if (err) throw err
      })
      fs.writeFile(settingsFile, JSON.stringify(options, null, 3), (err) => {
         if (err) throw err
      })
      verifySettings()
   }

   { // Check updates
      fs.watchFile(settingsFile, { interval: 1000 }, async (curr, prev) => {
         try {
            options = {...defaultOptions, ...JSON.parse(fs.readFileSync(settingsFile))}
         } catch (err) {
            console.log("Settings file corrupt, resetting to default settings.")
            options = defaultOptions
         }
      })
   }
}

async function start() {
   updateLocation()
   updateTracker()
   updateFiles()
   fs.watchFile(helperLog, { interval: 500 }, async (curr, prev) => {
      updateTracker()
      updateLocation(true)
      updateFiles()
   })
   fs.watchFile(modLog, { interval: 500 }, async (curr, prev) => {
      if (updateLocation(false, true)) {
         updateTracker()
         updateLocation()
         updateTracker()
         updateFiles()
      }
   })
   console.log("Tracker running.")
}

function verifySettings() {
   if (!['full', 'basic', 'landmark', 'none'].includes(options.translationType)) {
      console.log(`Invalid translationType option "${options.translationType}". Must be either "full", "basic", "landmark", or "none".`)
   }
   if (!['TB', 'TD', 'BT', 'RL', 'LR'].includes(options.mapOrientation)) {
      console.log(`Invalid mapOrientation option "${options.mapOrientation}". Must be either "TB", "TD", "BT", "RL", or "LR".`)
   }
   if (![1, 2, 3].includes(options.lineLength)) {
      console.log(`Invalid lineLength option "${options.lineLength}". Must be either "1", "2", or "3".`)
   }
}

function updateTracker() {
   var transitionData = ""
   rightLocationString = ""
   checkTable = {}
   avaliableTransitionTable = {}
   addedStyles = []
   addedNames = []
   nameString = ""
   transitionTable = defaultTransitionTable
   var helperLogFile = undefined
   try {
       helperLogFile = fs.readFileSync(helperLog, 'utf-8').replaceAll(/\*/g, "")
   } catch (err) {
       console.log("helper log file not found")
   }
   if (!helperLogFile) { return }

   var startInfo = false
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
            if (transitionTo && transitionFrom) {
               if (!transitionTable[transitionFrom]) { transitionTable[transitionFrom] = {} }
               transitionTable[transitionFrom][doorFrom] = [transitionTo, doorTo]
            }
         }
      }
      if (!startTransition && r_transitionStart.test(line)) {
         startTransition = true
      }

      if (startInfo) {
         if (line.replaceAll(/\r?\n? /g) == "") {
            startInfo = false
         } else {
            var transitionLocation = line.match(r_helperLocation)[0]
            var transitionDoor = line.match(r_helperDoor)[0]

            if (avaliableTransitionTable[transitionLocation]) {
               avaliableTransitionTable[transitionLocation].push(transitionDoor)
            } else {
               avaliableTransitionTable[transitionLocation] = [transitionDoor]
            }
            if (r_right.test(line)) {
               rightLocationString += `- ${transitionLocation}\n`
            }
         }
      }
      if (!startInfo && r_transStart.test(line)) {
         startInfo = true
      }
      if (startItemChecks) {
         if (line.replaceAll(/\r?\n? /g) == "") {
            startItemChecks = false
         } else {
            var item = line.replaceAll(/\r?\n? /g, "")
            if (locationLogic[item]) {

               if (checkTable[locationLogic[item]]) {
                  checkTable[locationLogic[item]] += 1
               } else {
                  checkTable[locationLogic[item]] = 1
               }
            }
         }
      }
      if (!startItemChecks && r_itemStart.test(line)) {
         startItemChecks = true
      }
   })

   var connections = {}
   for (const [location, doors] of Object.entries(transitionTable)) {
      var subgraph = ``
      for (const [fromDoor, toId] of Object.entries(doors)) {
         if (connections[`${toId[0]}:${toId[1]}`] != `${location}:${fromDoor}`) {
            var nameFrom = location
            var nameTo = toId[0]
            var length = options.lineLength == 1 ? "" : (options.lineLength == 2 ? "-" : "--")
            subgraph += `${nameFrom} --${length}- ${nameTo}\n`

            var fromCheck = checkRoom(nameFrom)
            var toCheck = checkRoom(nameTo)
            if (!addedStyles.includes(nameFrom)) {
               addedStyles.push(nameFrom)
               subgraph += fromCheck
            }
            if (!addedStyles.includes(nameTo)) {
               addedStyles.push(nameTo)
               subgraph += toCheck
            }
            if (!addedNames.includes(nameFrom)) {
               addedNames.push(nameFrom)
               nameString += `${styleRoom(nameFrom)}\n`
            }
            if (!addedNames.includes(nameTo)) {
               addedNames.push(nameTo)
               nameString += `${styleRoom(nameTo)}\n`
            }
            connections[`${location}:${fromDoor}`] = `${toId[0]}:${toId[1]}`
         }
      }
      transitionData += subgraph
   }

   mapTrackerString = `flowchart ${options.mapOrientation}\n${classDefs}\n\n${nameString}\n${transitionData}`
}

function updateLocation(updateAnyway, onlyReport) {
   const r_transitionChange = /(?<=\[INFO\]:\[Hkmp\.Game\.Client\.ClientManager\] Scene changed from ).*(?=\n|$)/gm
   const modLogFile = fs.readFileSync(modLog, 'utf-8')

   const location = updateAnyway ? lastLocation : modLogFile.match(r_transitionChange)?.at(-1).match(/\b(\w+)$/)[0]
   
   { // Local map
      var doors = transitionTable[location]
      var secondLayer = []
      var transitionData = ``
      var chartLocal = ""
      if ((!location || !doors) || (!updateAnyway && lastLocation == location)) { return false }
      if (onlyReport) { return true }
      fs.truncate(modLog, 0, () => {})
      fs.appendFile(modLogAppend, modLogFile, (err) => { if (err) throw err })
      lastLocation = location
      for (const [fromDoor, toId] of Object.entries(doors)) {
            var nameFrom = location
            var nameTo = toId[0]
            transitionData += `${styleRoom(nameFrom)} -- ${fromDoor} --> ${styleRoom(nameTo)}\n${checkRoom(nameFrom)}${checkRoom(nameTo)}`
            secondLayer.push(toId[0])
      }
      for (const location2 of secondLayer) {
         doors = transitionTable[location2]
         if (!doors) { continue }
         for (const [fromDoor, toId] of Object.entries(doors)) {
            var nameFrom = location2
            var nameTo = toId[0]
            if (nameTo != location) {
               transitionData += `${styleRoom(nameFrom)} -- ${fromDoor} --> ${styleRoom(nameTo)}\n${checkRoom(nameFrom)}${checkRoom(nameTo)}`
            }
         }
      }
      for (const [transition, transitionCheck] of Object.entries(avaliableTransitionTable)) {
         if (transition == location) {
            for (const door of transitionCheck) {
               transitionData += `${transition} -- ${door} --> UNCHECKED([UNCHECKED]):::unchecked\n`
            }
         }
      }
      secondLayer.push(location)
      for (const room of secondLayer) {
         if (checkTable[room]) {
            transitionData += `${room}:::check\n`
         }
         if (avaliableTransitionTable[room]) {
            transitionData += `${room}:::transition\n`
         }
      }
      transitionData += `${lastLocation}:::last\n`
      chartLocal = `# Local map\n\`\`\`mermaid\nflowchart LR\n${classDefs}\n\n${transitionData}\n\`\`\`\n`
   }

   { // Nearest Transition
      var BFSqueue = []
      var visited = {}
      var dist = {}
      var pred = {}
      var foundTransition = false
      var foundCheck = false
      var foundBench
      var transitionString = ""
      var checkString = ""
      var benchString = ""
      var transitionChart = ""
      var checkChart = ""
      var benchChart = ""

      visited[location] = true
      dist[location] = 0
      BFSqueue.push(location)

      while (BFSqueue.length != 0) {
         var u = BFSqueue.shift()
         if (!transitionTable[u]) { continue }
         for (const frontVal of Object.values(transitionTable[u])) {
            const front = frontVal[0]
            if (!visited[front]) {
               visited[front] = true
               dist[front] = dist[u] + 1
               pred[front] = u

               BFSqueue.push(front)
               if (avaliableTransitionTable[front] && !foundTransition) { // Transition path
                  foundTransition = true
                  // Generate Path
                  var currPrint = u
                  var predPrint = pred[u]
                  while (predPrint) {
                     var door = ""
                     for (const [doorTrans, toRoom] of Object.entries(transitionTable[currPrint])) { // Find door
                        if (toRoom[0] == predPrint) {
                           door = toRoom[1]
                           break
                        }
                     }
                     transitionString += `${styleRoom(predPrint)} -- ${door} --> ${styleRoom(currPrint)}\n${checkRoom(currPrint)}${checkRoom(predPrint)}`
                     currPrint = predPrint
                     predPrint = pred[currPrint]
                  }
                  for (const [doorTrans, toRoom] of Object.entries(transitionTable[front])) {
                     if (toRoom[0] == u) {
                        door = toRoom[1]
                        break
                     }
                  }
                  transitionString += `${styleRoom(u)} -- ${door} --> ${styleRoom(front)}\n${checkRoom(u)}${checkRoom(front)}`
               }
               if (checkTable[front] && !foundCheck) { // Check path
                  foundCheck = true
                  // Generate Path
                  var currPrint = u
                  var predPrint = pred[u]
                  while (predPrint) {
                     var door = ""
                     for (const [doorTrans, toRoom] of Object.entries(transitionTable[currPrint])) { // Find door
                        if (toRoom[0] == predPrint) {
                           door = toRoom[1]
                           break
                        }
                     }
                     checkString += `${styleRoom(predPrint)} -- ${door} --> ${styleRoom(currPrint)}\n${checkRoom(currPrint)}${checkRoom(predPrint)}`
                     currPrint = predPrint
                     predPrint = pred[currPrint]
                  }
                  for (const [doorTrans, toRoom] of Object.entries(transitionTable[front])) { // Find door
                     if (toRoom[0] == u) {
                        door = toRoom[1]
                        break
                     }
                  }
                  checkString += `${styleRoom(u)} -- ${door} --> ${styleRoom(front)}\n${checkRoom(u)}${checkRoom(front)}`
               }
               if (special[front]?.[1] == 'bench' && !foundBench) { // Check bench
                  foundBench = true
                  // Generate Path
                  var currPrint = u
                  var predPrint = pred[u]
                  while (predPrint) {
                     var door = ""
                     for (const [doorTrans, toRoom] of Object.entries(transitionTable[currPrint])) { // Find door
                        if (toRoom[0] == predPrint) {
                           door = toRoom[1]
                           break
                        }
                     }
                     benchString += `${styleRoom(predPrint)} -- ${door} --> ${styleRoom(currPrint)}\n${checkRoom(currPrint)}${checkRoom(predPrint)}`
                     currPrint = predPrint
                     predPrint = pred[currPrint]
                  }
                  for (const [doorTrans, toRoom] of Object.entries(transitionTable[front])) { // Find door
                     if (toRoom[0] == u) {
                        door = toRoom[1]
                        break
                     }
                  }
                  benchString += `${styleRoom(u)} -- ${door} --> ${styleRoom(front)}\n${checkRoom(u)}${checkRoom(front)}`
               }
            }
         }
         if (foundTransition && foundCheck) { break }
      }
      transitionChart = `# Nearest transition\n\`\`\`mermaid\nflowchart LR\n${classDefs}\n${transitionString}\n\`\`\`\n`
      checkChart = `# Nearest check\n\`\`\`mermaid\nflowchart LR\n${classDefs}\n${checkString}\n\`\`\`\n`
      benchChart = `# Nearest bench\n\`\`\`mermaid\nflowchart LR\n${classDefs}\n${benchString}\n\`\`\`\n`
   }

   localTrackerString = `${chartLocal}${transitionChart}${checkChart}${benchChart}`
   return true
}

function styleRoom(room) {
   var name = ""
   var number = checkTable[room] ? ` [${checkTable[room]}]` : ""
   if (options.translationType == 'full') {
      name = special[room] ? `${room}(["${special[room][0].replaceAll(/_/g, " ")}${number}"])` : `${room}(["${room}${number}"])`
   } else if (options.translationType == 'basic') {
      name = special[room] && special[room]?.[1] && (special[room][1] == 'bench' || special[room][1] == 'shop' || special[room][1] == 'stag') ? `${room}(["${special[room][0].replaceAll(/_/g, " ")}${number}"])` : `${room}(["${room}${number}"])`
   } else if (options.translationType == 'landmark') {
      name = special[room] && specialCustom[room]?.[1] ? `${room}(["${special[room][0].replaceAll(/_/g, " ")}${number}"])` : `${room}(["${room}${number}"])`
   } else if (options.translationType == 'none') {
      name = `${room}(["${room}${number}"])`
   }
   //var name = room
   if (lastLocation == room) {
      name = `${name}:::last`
   } else {
      name = special[room]?.[1] ? `${name}:::${special[room]?.[1]}` : name
   }
   return name
}

function checkRoom(room) {
   var addStyle = ""
   if (avaliableTransitionTable[room]) {
      addStyle += `${room}:::transition\n`
   }
   if (checkTable[room]) {
      addStyle += `${room}:::check\n`
   }
   return addStyle
}

var lastMapTrackerString = ""
var lastRightLocationString = ""
var lastLocalTrackerString = ""
async function updateFiles() {
   if (mapTrackerString != lastMapTrackerString) {
      document.getElementById('mermaidGraph').innerHTML = mapTrackerString
      lastMapTrackerString = mapTrackerString
   }

   /*
   if (rightLocationString != lastRightLocationString) {
      fs.writeFile(rightOut, rightLocationString, (err) => {
         if (err) throw err
      })
      lastRightLocationString = rightLocationString
   }
   if (lastLocalTrackerString != localTrackerString) {
      fs.writeFile(lastOut, localTrackerString, (err) => {
         if (err) throw err
      })
      lastLocalTrackerString = localTrackerString
   }
   */
}

window.addEventListener('DOMContentLoaded', () => {
    try {
        start()
    } catch (err) {
        console.log(err)
    }
})