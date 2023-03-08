const { ipcRenderer } = require('electron')
const common          = require('./../helper/commonjs.js') 

window.addEventListener('DOMContentLoaded', () => {
   document.title = "Nearest Tracker"
})

var isReady = new Promise( (resolve) => {
   if (document.readyState != "loading") {
      return resolve()
   } else {
      document.addEventListener("DOMContentLoaded", () => {
         return resolve()
      })
   }
})

ipcRenderer.on('updateGraph', async (e, data) => {
   console.log("recieved update")
   await isReady

   if (data[1]) {
      document.title = "Nearest Tracker"
   } else {
      document.title = "Nearest Tracker*"
   }

   console.log("recieved update2")
   document.getElementById('mermaidGraphTransition').innerHTML = data[0].transition
   document.getElementById('mermaidGraphCheck').innerHTML = data[0].check
   console.log("recieved update3")
})
