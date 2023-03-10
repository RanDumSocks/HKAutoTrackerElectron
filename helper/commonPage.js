window.addEventListener('DOMContentLoaded', () => {
   updateNodes()
   var container = document.documentElement || document.body
   new MutationObserver(updateNodes).observe(container, { attributes: false, childList: true, subtree: true })
})

function updateNodes() {
   var nodes = document.getElementsByClassName("node")
   for (const node of nodes) {
      node.addEventListener("mouseover", () => {
         var name = node.id.match(/(?<=\-).*(?=\-)/gm)[0]
         var lines = Array.from(document.getElementsByClassName(`LS-${name}`)).concat(Array.from(document.getElementsByClassName(`LE-${name}`)))
         for (const line of lines) {
            line.style.strokeWidth = "8px"
            line.style.stroke = "green"
         }
      })
      node.addEventListener("mouseout", () => {
         var name = node.id.match(/(?<=\-).*(?=\-)/gm)[0]
         var lines = Array.from(document.getElementsByClassName(`LS-${name}`)).concat(Array.from(document.getElementsByClassName(`LE-${name}`)))
         for (const line of lines) {
            line.style.strokeWidth = ''
            line.style.stroke = ''
         }
      })
   }
}