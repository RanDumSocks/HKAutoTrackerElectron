const { ipcRenderer } = require('electron')

ipcRenderer.on('local-link', (e, msg) => {
   localPort = e.ports[0]
   localPort.onmessage = (trackerData) => {
      document.getElementById('mermaidGraphTransition').innerHTML = trackerData.data.transitionChart
      document.getElementById('mermaidGraphCheck').innerHTML = trackerData.data.checkChart
      document.getElementById('mermaidGraphBench').innerHTML = trackerData.data.benchChart
      document.getElementById('mermaidGraph').innerHTML = `${trackerData.data.transitionChart}\n${trackerData.data.checkChart}\n${trackerData.data.benchChart}`
   }
})