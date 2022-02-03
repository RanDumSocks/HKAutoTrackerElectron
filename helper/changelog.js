const { dialog } = require('electron')
exports.history = [
{
message: `FEATURES
• Added Changelog
• Changelog automatically apprears if application detected an update

CHANGES
• Moved feedback to 'Help' submenu`,
version: '1.3.4'
}

]

exports.showLatest = () => {
   dialog.showMessageBox({
      message: this.history[0].message,
      title: `Changelog v${this.history[0].version}`
   })
}