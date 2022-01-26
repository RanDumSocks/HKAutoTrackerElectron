const { ipcRenderer } = require('electron')

ipcRenderer.on('local-link', (e, msg) => {
   localPort = e.ports[0]
   localPort.onmessage = (trackerData) => {
      document.getElementById('mermaidGraph').innerHTML = trackerData.data
   }
})
