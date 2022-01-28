const { ipcRenderer } = require("electron")

addClick = () => {
   var nodes = document.getElementsByClassName('node')
   var r_id = /(?<=-).*(?=-)/
   for (const node of nodes) {
      node.oncontextmenu = function() {
         var roomName = node.id.match(r_id)[0]
         ipcRenderer.send('node-menu', roomName)
      }
   }
}
