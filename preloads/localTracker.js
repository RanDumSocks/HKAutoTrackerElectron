const { ipcRenderer } = require('electron')
const common          = require('./../helper/commonjs.js') 

window.addEventListener('DOMContentLoaded', () => {
   document.title = "Local Tracker"
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
   await isReady
   console.log("recieved update")
   let graph = document.getElementById('mermaidGraph')
   graph.innerHTML = data
})
