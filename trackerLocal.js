const { ipcRenderer } = require('electron')
window.addEventListener('DOMContentLoaded', () => {
   document.title = "Local Tracker"
})

ipcRenderer.on('local-link', (e, msg) => {
   localPort = e.ports[0]
   localPort.onmessage = (trackerData) => {
      document.getElementById('mermaidGraph').innerHTML = trackerData.data
   }
})
