const { ipcRenderer } = require('electron')

ipcRenderer.on('find-location', () => {
   var lastNode = document.getElementsByClassName('node last')[0]
   if (lastNode) {
      lastNode.scrollIntoView({
         behavior: 'smooth'
      })
   }
})