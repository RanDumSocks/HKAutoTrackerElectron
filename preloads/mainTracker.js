const path            = require('path')
const fs              = require('fs')
const { ipcRenderer } = require('electron')
const common          = require('./../helper/commonjs.js') 

// File Paths
const rootPath                 = path.resolve(process.env.APPDATA, '../LocalLow/Team Cherry/Hollow Knight')
const trackerDataPath          = path.resolve(rootPath, 'Randomizer 4/Recent/TrackerData.json')
const trackerDataPMPath        = path.resolve(rootPath, 'Randomizer 4/Recent/TrackerDataPM.txt')
const modSettingsPath          = path.resolve(rootPath, 'Randomizer 4/Recent/settings.txt')
const roomLoggerPath           = path.resolve(rootPath, 'RoomLogger.json')
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
classDef stag fill:#a775d9;
classDef shop fill:#946513;
classDef bench fill:#022426;
classDef benchactive fill:#138d94;
classDef transition stroke-width:4px, stroke:#d68b00;
classDef check color:#3ab020;
classDef last fill:#022e00;
classDef unchecked fill:#9e3c03;
classDef uncheckeditem fill:#3ab020, color:#ffffff;
classDef target fill:#06288f;
`
/* TODO figure out if this is needed for pathing
const defaultTransitionTable = {
   Ruins2_10: { elevator: ["Ruins2_10b", "elevator"] },
   Ruins2_10b: { elevator: ["Ruins2_10", "elevator"] },
   Crossroads_49: { elevator: ["Crossroads_49b", "elevator"] },
   Crossroads_49b: { elevator: ["Crossroads_49", "elevator"] },
}*/

{ // Tracker state variables
   var modLogic                 = {}         // name: logic
   var itemLocations            = {}         // itemID: location
   var oneWayOut                = []         // Transitions which are one way
   var oneWayIn                 = []
   var sceneNames               = new Set()  // string 'scene'
   var gateNames                = new Set()  // string 'scene[gate]'
   var saveVariables            = {}         // randomiser logic variables (varName: value)
   var checkedTransitionTable   = {}         // fromScene: { fromGate: ['toScene', 'toGate'] }
   var uncheckedTransitionTable = {}         // scene: [gate]
   var sceneUncheckedItemTable  = {}         // scene: [itemID]
   var currentLocation          = undefined  // Guessed scene or gate player is in
   var lastLocation             = undefined
   var targetScene              = undefined  // Manually set target scene
   var activeBenches            = []         // ['scene']

   var settings = {} // Settings updated by main process

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
   modLogic      = {}
   //sceneNames    = new Set(['Upper_Tram', 'Lower_Tram'])
   sceneNames    = new Set()
   gateNames     = new Set()

   // Find transition data, scenes, rooms, and one ways
   for (const transitionBulk of locationData.transitionPlacements) {
      let transition = transitionBulk.Target.TransitionDef
      if (transition.Sides == 'OneWayOut') {
         oneWayOut.push(`${transition.SceneName}:${transition.DoorName}`)
      }
      if (transition.Sides == 'OneWayIn') {
         oneWayIn.push(`${transition.SceneName}:${transition.DoorName}`)
      }
      sceneNames.add(transition.SceneName)
      gateNames.add(transitionBulk.Target.lt.Name)
   }

   // Find logic variables 'terms'
   for (const subkey of Object.keys(locationData.LM.Terms)) {
      for (const term of locationData.LM.Terms[subkey]) {
         if (!sceneNames.has(term) && !gateNames.has(term)) {
            terms.push(term)
         }
      }
   }
   r_terms = new RegExp(terms.join('|'), 'g')

   // Find items and their location
   for (const itemSpoiler of locationData.itemPlacements) {
      itemLocations[itemSpoiler.Location.logic.Name] = itemSpoiler.Location.LocationDef.SceneName
   }

   // Save all logic rules
   for (const data of locationData.LM.Logic) {
      modLogic[data.name] = data.logic
   }
}

// Called when trackerDataPMPath file changes
function loadVariables() {
   try {
      saveVariables = JSON.parse(fs.readFileSync(trackerDataPMPath, 'utf-8').replace(/\,(?!\s*?[\{\[\"\'\w])/g, ''))

      saveVariables['FALSE'] = 0
      saveVariables['TRUE']  = 1
   } catch (err) {
      console.warn("Could not load tracker data")
   }
   updateBenches()
}

function loadHelper() {
   var trackerData           = undefined

   checkedTransitionTable   = {}
   uncheckedTransitionTable = {}
   sceneUncheckedItemTable  = {}

   trackerData = JSON.parse(fs.readFileSync(trackerDataPath))

   for (const [from, to] of Object.entries(trackerData.visitedTransitions)) {
      let fromScene = from.match(/^[a-zA-Z0-9_]*/)[0]
      let fromDoor = from.match(/(?<=\[)[a-zA-Z0-9_]*(?=\])/)[0]
      let toScene = to.match(/^[a-zA-Z0-9_]*/)[0]
      let toDoor = to.match(/(?<=\[)[a-zA-Z0-9_]*(?=\])/)[0]

      if (!checkedTransitionTable[fromScene]) { checkedTransitionTable[fromScene] = {} }
      checkedTransitionTable[fromScene][fromDoor] = [toScene, toDoor]
   }

   for (const transition of trackerData.uncheckedReachableTransitions) {
      let scene = transition.match(/^[a-zA-Z0-9_]*/)[0]
      let door = transition.match(/(?<=\[)[a-zA-Z0-9_]*(?=\])/)[0]

      if (uncheckedTransitionTable[scene]) {
         uncheckedTransitionTable[scene].push(door)
      } else {
         uncheckedTransitionTable[scene] = [door]
      }
   }

   for (const item of trackerData.uncheckedReachableLocations) {
      if (sceneUncheckedItemTable[itemLocations[item]]) {
         sceneUncheckedItemTable[itemLocations[item]].push(item)
      } else {
         sceneUncheckedItemTable[itemLocations[item]] = [item]
      }
   }
}

// NOTE modLogic now passed, not logic string
// recieve list of true tokens instead of regex
// no checkDirections parameter
/**
 * Evaluates a gate/scene variable pulling data from mod's save data.
 * @param {string} modLogicName name of the item in logic to compute
 * @param {Array[string] | RegExp} knownVars known variables or regular expression of assumed true variables
 * @returns {boolean} 
 */
function evalLogic(modLogicName, knownVars, falseVars) {
   var parsedString = modLogic[modLogicName]
   console.log(modLogicName, falseVars, parsedString)
   var r_known      = knownVars instanceof RegExp ? knownVars : new RegExp(knownVars.join('|').replaceAll('[', '\\[').replaceAll(']', '\\]'), "g")

   parsedString = knownVars != '' ? parsedString.replaceAll(r_known, "true") : parsedString
   parsedString = parsedString.replaceAll("+", "&&")
   parsedString = parsedString.replaceAll("|", "||")
   parsedString = parsedString.replaceAll(/\$[^\s^\)^\()]*/gm, 'false')

   if (falseVars) {
      for (const fVar of falseVars) {
         parsedString = parsedString.replaceAll(fVar, "false")
      }
   }
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
      let variables = parsedString.match(/[a-zA-Z0-9_\-'\[\]]+/g)
      if (variables) {
         for (const variable of variables) {
            if (gateNames.has(variable)) {
               parsedString = parsedString.replace(variable, 'false')
            } else if (sceneNames.has(variable)) {
               parsedString = parsedString.replace(variable, evalLogic(variable, r_known, falseVars).toString())
            } else if (saveVariables[variable]) {
               parsedString = parsedString.replace(variable, (saveVariables[variable] > 0).toString())
            } else if (modLogic[variable]) {
               var fal = falseVars ? [...falseVars] : []
               fal.push(variable)
               parsedString = parsedString.replace(variable, evalLogic(variable, r_known, fal).toString())
            } else if (variable != 'true'){
               parsedString = parsedString.replace(variable, 'false')
            }
         }
      }
   }

   return eval(parsedString)
}

/**
 * 
 * @param {string} str string to search for room/gate
 * @param {boolean} lookGates whether to look for a gate in the string
 * @param {boolean} lookScenes whether to look for a scene in the string
 * @returns {string} found gate/scene
 */
function findLocationInString(str) {
   if (!str) { return false }
   var variables = str.match(/[a-zA-Z0-9_\[\]]+/g)
   if (variables) {
      for (const variable of variables) {
         if (gateNames.has(variable) || sceneNames.has(variable)) {
            return  {
               found: variable,
               scene: variable?.replace(/\[.*/gm, ''),
               gate: variable?.match(/(?<=\[)[a-zA-Z0-9_].*(?=\])/gm)?.[0]
            }
         }
      }
   }
   return {}
}

// returns: { fromGate: [toScene, toGate, toFullName] }
function getAdjacentScenes(sceneName) {
   var location = findLocationInString(sceneName)
   var adjacent = {}
   
   if (checkedTransitionTable[location.scene]) {
      if (location.gate) {
         for (const [fromGate, [toScene, toGate]] of Object.entries(checkedTransitionTable[location.scene])) {
            if (evalLogic(`${location.scene}[${fromGate}]`, [location.found])) {
               adjacent[fromGate] = [toScene, toGate, `${toScene}[${toGate}]`]
            }
         }
      } else if (location.scene) {
         for (const [fromGate, [toScene, toGate]] of Object.entries(checkedTransitionTable[location.scene])) {
            adjacent[fromGate] = [toScene, toGate, `${toScene}[${toGate}]`]
         }
      }
   }

   return adjacent
}

function getPathTo(fromScenes, targetScenes, customFilter) {
   var frontier = [...fromScenes]
   var sceneMap = [] // [ { fromGate, fromName, toName, fromRaw } ]
   var pathMap = []
   var foundScene = undefined
   var completedBacktrack = false
   var noPath = false
   
   while (frontier.length > 0 && !foundScene) {
      var from = frontier.shift()
      var fromData = findLocationInString(from)

      foundScene = (customFilter ? customFilter(fromData) : targetScenes.includes(fromData.scene)) ? from : undefined
      if (foundScene) break;

      var adj = getAdjacentScenes(from)
      for (const [fromDoor, adjSceneData] of Object.entries(adj)) {
         var fromName = `${fromData.scene}[${fromDoor}]`
         var toName = adjSceneData[2]
         if (sceneMap.some( (e) => {return (e.fromName == fromName && e.toName == toName)}))  { continue }
         if (sceneMap.some( (e) => {return (e.toName == fromName && e.fromName == toName)}))  { continue }

         sceneMap.push({
            fromPrevGate: fromData.gate,
            fromName:fromName,
            toName: toName,
            fromRaw: from
         })

         frontier.push(toName)
      }
   }

   if (!foundScene) { return undefined }
   noPath = fromScenes.some( (e) => {
      return findLocationInString(e).scene == findLocationInString(foundScene).scene
   })

   pathMap.unshift(foundScene)
   if (!noPath) {
      while (!completedBacktrack) {
         var prevRoom = sceneMap.find((e) => e.toName == pathMap[0])
         pathMap.unshift(prevRoom.fromName)
         pathMap.unshift(`${findLocationInString(prevRoom.fromName).scene}[${prevRoom.fromPrevGate}]`)
         if (fromScenes.includes(prevRoom.fromRaw)) {
            completedBacktrack = true
         }
      }
   }

   return pathMap
}

// TODO styleRoom
// Merged with checkRoom
/**
 * 
 * @param {string} sceneName Name of the scene to generate mermaid styles
 * @returns Array[name, type]
 */
function styleScene(sceneName) {
   var name            = ""
   var classStyle      = ""
   var itemCheckNumber = sceneUncheckedItemTable[sceneName] ? ` [${sceneUncheckedItemTable[sceneName].length}]` : ""
   var translationData = transitionTranslation[sceneName]
   var fullName        = translationData?.[0]
   var type            = translationData?.[1]

   switch (settings.translationType) {
      case 'full':
         name = fullName ? `${sceneName}(["${fullName.replaceAll(/_/g, " ")}${itemCheckNumber}"])` : `${sceneName}(["${sceneName}${itemCheckNumber}"])`
         break
      case 'basic':
         name = fullName && type ? `${sceneName}(["${fullName.replaceAll(/_/g, " ")}${itemCheckNumber}"])` : `${sceneName}(["${sceneName}${itemCheckNumber}"])`
         break
      case 'landmark':
         name = fullName && transitionLandmarks[sceneName] ? `${sceneName}(["${fullName.replaceAll(/_/g, " ")}${itemCheckNumber}"])` : `${sceneName}(["${sceneName}${itemCheckNumber}"])`
         break
      case 'none':
         name = `${sceneName}(["${sceneName}${itemCheckNumber}"])`
         break
   }

   if (findLocationInString(currentLocation).scene == sceneName) {
      name = `${name}:::last`
   } else if (targetScene == sceneName) {
      name = `${name}:::target`
   } else if (activeBenches.includes(sceneName)) {
      name = `${name}:::benchactive`
   } else {
      name = type ? `${name}:::${type}` : name
   }

   if (uncheckedTransitionTable[sceneName]) {
      classStyle += `${sceneName}:::transition\n`
   }
   if (sceneUncheckedItemTable[sceneName]) {
      classStyle += `${sceneName}:::check\n`
   }

   let retVal = [name == '' ? undefined : name, classStyle == '' ? undefined : classStyle]
   return retVal
}

function updateBenches() {
   for (const benchID of Object.keys(saveVariables).filter( (e) => e.match(/^Bench\-/))) {
      activeBenches.push(findLocationInString(modLogic[benchID]).scene)
   }
}

/**
 * Updates currentLocation
 * @param {string} manualLocation scene to manually set as location
 */
async function updateLocation() {
   var locationChanged = false

   if (fs.existsSync(roomLoggerPath)) {
      var locData = JSON.parse(fs.readFileSync(roomLoggerPath))
      if (lastLocation != locData.last || currentLocation != locData.current) {
         lastLocation = locData.last
         currentLocation = locData.current
         locationChanged = true
      }
   }

   if (checkedTransitionTable[currentLocation] && locationChanged) {
      for (const [door, toLocation] of Object.entries(checkedTransitionTable[currentLocation])) {
         let toScene = toLocation[0]
   
         if (toScene == lastLocation) {
            currentLocation = `${currentLocation}[${door}]`
            break
         }
      }
      console.log(`Location changed from ${lastLocation} --> ${currentLocation}`)
   }

   return locationChanged
}

function updateMainTracker() {
   var connections       = {}
   var mainTrackerString = ""
   var sceneNames        = ""
   var sceneTypes        = ""
   var addedStyles       = []

   for (const [sceneFrom, doors] of Object.entries(checkedTransitionTable)) {
      for (const [gateFrom, toId] of Object.entries(doors)) {
         let sceneTo        = toId[0]
         let gateTo         = toId[1]
         let sceneStyleFrom = styleScene(sceneFrom)
         let sceneStyleTo   = styleScene(sceneTo)

         if (connections[`${sceneTo}:${gateTo}`] != `${sceneFrom}:${gateFrom}`) {
            if (oneWayIn.includes(`${sceneFrom}:${gateFrom}`)) {
               mainTrackerString += `${sceneFrom} --> ${sceneTo}\n`
            } else {
               mainTrackerString += `${sceneFrom} --- ${sceneTo}\n`
            }
         }

         connections[`${sceneFrom}:${gateFrom}`] = `${sceneTo}:${gateTo}`

         if (!addedStyles.includes(sceneFrom)) {
            sceneNames += `${sceneStyleFrom[0]}\n`
            sceneTypes += sceneStyleFrom[1] ?? ''
            addedStyles.push(sceneFrom)
         }

         if (!addedStyles.includes(sceneTo)) {
            sceneNames += `${sceneStyleTo[0]}\n`
            sceneTypes += sceneStyleTo[1] ?? ''
            addedStyles.push(sceneTo)
         }
      }
   }

   document.getElementById('mermaidGraph').innerHTML = `flowchart ${settings.mapOrientation ?? 'LR'}\n${mermaidClassDefs}\n\n${mainTrackerString}\n${sceneNames}\n${sceneTypes}`
}

async function updateLocalTracker() {
   if (!(await ipcRenderer.invoke('is-window-open', 'local'))) { return }
   if (!currentLocation) { return }
   var data = ''
   var currentLocationData = findLocationInString(currentLocation)
   var frontier = [currentLocationData.found]
   var createdConnections = []
   var addedNodes = new Set()
   addedNodes.add(currentLocationData.scene)
   
   var sceneNames = ''
   var sceneTypes = ''
   var mainString = ''

   // Main structure
   for (let i = 2; i > 0; i--) {
      var newFrontier = []
      for (const scene of frontier) {
         let adjacent = getAdjacentScenes(scene)
         let sceneName = findLocationInString(scene).scene
         for (const [gate, toData] of Object.entries(adjacent)) {
            let addString = `${sceneName} -- ${gate} --> ${toData[0]}\n`
            if (!createdConnections.includes(addString)) {
               mainString += addString
               createdConnections.push([sceneName, toData[0]])
               newFrontier.push(toData[2])
               addedNodes.add(sceneName)
               addedNodes.add(toData[0])
            }
         }
      }
      frontier = newFrontier
   }

   // unchecked locations
   if (uncheckedTransitionTable[currentLocationData.scene]) {
      for (const uncheckedGate of uncheckedTransitionTable[currentLocationData.scene]) {
         if (!currentLocationData.gate || evalLogic(`${currentLocationData.scene}[${uncheckedGate}]`, [currentLocationData.found])) {
            mainString += `${currentLocationData.scene} -- ${uncheckedGate} --> unchecked([unchecked]):::unchecked\n`
         }
      }
   }

   // unchecked items
   if (sceneUncheckedItemTable[currentLocationData.scene]) {
      for (const item of sceneUncheckedItemTable[currentLocationData.scene]) {
         if (!currentLocationData.gate || evalLogic(item, [currentLocationData.found])) {
            mainString += `${currentLocationData.scene} --> ${item}(${item}):::uncheckeditem\n`
         }
      }
   }

   for (const node of addedNodes) {
      let style = styleScene(node)
      sceneNames += `${style[0]}\n`
      sceneTypes += style[1] ?? ''
   }

   data = `flowchart ${settings.mapOrientation ?? 'LR'}\n${mermaidClassDefs}\n\n${mainString}\n${sceneNames}\n${sceneTypes}`
   ipcRenderer.send('update-local-tracker', data, findLocationInString(currentLocation).gate != undefined)
}

async function updateNearestTracker() {
   if (!(await ipcRenderer.invoke('is-window-open', 'nearest'))) { return }
   if (!currentLocation) { return }
   var data = {
      check: undefined,
      transition: undefined
   }

   var checkNodes = new Set()
   var checkNames = ''
   var checkTypes = ''
   var checkString = ''

   var transitionNodes = new Set()
   var transitionNames = ''
   var transitionTypes = ''
   var transitionString = ''

   var searchStart = [currentLocation]
   if (settings.benchPathfinding) { searchStart = searchStart.concat(activeBenches) }

   var checkPath = getPathTo(searchStart, undefined, (checkData) => {
      var items = sceneUncheckedItemTable[checkData.scene]
      return items?.some( (item) => {
         console.log(item, checkData)
         return evalLogic(item, [checkData.found])
      })
   })
   if (checkPath) {
      if (checkPath.length > 1) {
         for (var i = 0; i < checkPath.length - 1; i += 2) {
            var fromScene = findLocationInString(checkPath[i + 1]).scene
            var fromDoor = findLocationInString(checkPath[i + 1]).gate
            var toScene = findLocationInString(checkPath[i + 2]).scene
            checkString += `${fromScene} -- ${fromDoor} --> ${toScene}\n`
            checkNodes.add(fromScene)
            checkNodes.add(toScene)
         }
      } else {
         var scene = findLocationInString(checkPath[0])
         checkString += `${scene.scene}\n`
         checkNodes.add(scene.scene)
      }

      for (const node of checkNodes) {
         let style = styleScene(node)
         checkNames += `${style[0]}\n`
         checkTypes += style[1] ?? ''
      }

   }

   var extraTPath = []
   var transitionPath = getPathTo(searchStart, undefined, (e) => {
      var found = false
      if (uncheckedTransitionTable[e.scene]) {
         for (const uncheckedGate of uncheckedTransitionTable[e.scene]) {
            var uncheckedFullName = `${e.scene}[${uncheckedGate}]`
            found = evalLogic(uncheckedFullName, [e.found])
            extraTPath = [e.scene, uncheckedGate]
         }
      }
      return found
   })
   if (transitionPath) {
      for (var i = 0; i < transitionPath.length - 1; i += 2) {
         var fromScene = findLocationInString(transitionPath[i + 1]).scene
         var fromDoor = findLocationInString(transitionPath[i + 1]).gate
         var toScene = findLocationInString(transitionPath[i + 2]).scene
         transitionString += `${fromScene} -- ${fromDoor} --> ${toScene}\n`
         transitionNodes.add(fromScene)
         transitionNodes.add(toScene)
      }

      transitionString += `${extraTPath[0]} -- ${extraTPath[1]} --> unchecked([unchecked]):::unchecked\n`
      transitionNodes.add(extraTPath[0])

      for (const node of transitionNodes) {
         let style = styleScene(node)
         transitionNames += `${style[0]}\n`
         transitionTypes += style[1] ?? ''
      }
   }

   data.check = `flowchart LR\n${mermaidClassDefs}\n\n${checkString}\n${checkNames}\n${checkTypes}`
   data.transition = `flowchart LR\n${mermaidClassDefs}\n\n${transitionString}\n${transitionNames}\n${transitionTypes}`

   ipcRenderer.send('update-nearest-tracker', data, findLocationInString(currentLocation).gate != undefined)
}

async function reloadTracker() {
   loadSpoiler()
   loadVariables()
   loadHelper()
   await updateLocation()
   updateMainTracker()
   updateLocalTracker()
   updateNearestTracker()
   return true
}

{ // Message handling
   ipcRenderer.once('version', (e, versionNum) => {
      window.addEventListener('DOMContentLoaded', () => {
         document.title = `HKAT v${versionNum}`
      })
   })
      
   ipcRenderer.on('setting-change', (e, settingsData) => {
      settings = settingsData
      if (document.readyState === 'complete') {
         updateMainTracker()
         updateLocalTracker()
         updateNearestTracker()
      }
   })

   ipcRenderer.on('set-target', async (e, sceneName) => {
      targetScene = sceneName
   })

   ipcRenderer.on('update-local', async (e) => {
      updateLocalTracker()
   })

   ipcRenderer.on('update-nearest', async (e) => {
      updateNearestTracker()
   })
}

window.addEventListener('DOMContentLoaded', () => {
   reloadTracker()

   fs.watchFile(trackerDataPath, { interval: 500 }, async (curr, prev) => {
      loadHelper()
      updateMainTracker()
      updateLocalTracker()
      updateNearestTracker()
   })

   fs.watchFile(trackerDataPMPath, { interval: 500 }, async (curr, prev) => {
      loadVariables()
      updateLocalTracker()
      updateNearestTracker()
   })

   fs.watchFile(modSettingsPath, { interval: 500 }, async (curr, prev) => {
      reloadTracker()
   })

   fs.watchFile(roomLoggerPath, { interval: 500 }, async (curr, prev) => {
      updateLocation()
      updateMainTracker()
      updateLocalTracker()
      updateNearestTracker()
   })

   /* Should fire when modSettingsPath changes
   fs.watchFile(spoilerLogPath , { interval: 500 }, async (curr, prev) => {
      reloadTracker()
   })
   */
})