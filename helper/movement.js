// Zoom
var zoom = 1
window.addEventListener("wheel", (event) => {
   var halfWidth = document.documentElement.clientWidth / 2
   var halfHeight = document.documentElement.clientHeight / 2

   var prevRatioW = (window.scrollX + halfWidth) / (document.documentElement.scrollWidth - halfWidth - window.scrollX)
   var prevRatioH = (window.scrollY + halfHeight) / (document.documentElement.scrollHeight - halfHeight - window.scrollY)
   
   zoom -= event.deltaY / 1500
   zoom = Math.min(Math.max(zoom, 0.2), 2)
   document.body.style.zoom = zoom

   var newX = ((prevRatioW * document.documentElement.scrollWidth) / (prevRatioW + 1)) - halfWidth
   var newY = ((prevRatioH * document.documentElement.scrollHeight) / (prevRatioH + 1)) - halfHeight
   
   window.scrollTo(newX, newY)
})

// Drag
window.addEventListener("DOMContentLoaded", () => {
   const ele = document.getElementById("main")
   ele.style.cursor = "grab"
   let pos = { top: 0, left: 0, x: 0, y: 0 }

   const mouseDownHandler = (e) => {
      ele.style.cursor = "grabbing"
      ele.style.userSelect = "none"
      pos = {
         left: window.scrollX,
         top: window.scrollY,
         x: e.clientX,
         y: e.clientY,
      }
      document.addEventListener("mousemove", mouseMoveHandler)
      document.addEventListener("mouseup", mouseUpHandler)
   }

   const mouseMoveHandler = (e) => {
      const dx = e.clientX - pos.x
      const dy = e.clientY - pos.y
      window.scrollTo(pos.left - dx, pos.top - dy)
   }

   const mouseUpHandler = () => {
      ele.style.cursor = "grab"
      ele.style.removeProperty("usser-select")
      document.removeEventListener("mousemove", mouseMoveHandler)
      document.removeEventListener("mouseup", mouseUpHandler)
   }

   window.addEventListener("mousedown", mouseDownHandler)
})
