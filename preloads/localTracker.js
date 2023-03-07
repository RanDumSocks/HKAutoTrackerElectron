const { ipcRenderer } = require('electron')
window.addEventListener('DOMContentLoaded', () => {
   document.title = "Local Tracker"
})

ipcRenderer.on('updateGraph', (e, data) => {
   document.getElementById('mermaidGraph').innerHTML = data
})