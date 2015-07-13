var BrowserWindow = require('browser-window');
var Menu = require('./core/menu');

module.exports = {
    load: function () {
    },

    unload: function () {
    },

    'assets:open': function () {
        Editor.Panel.open('assets.panel');
    },

    'assets:popup-create-menu': function (event, x, y) {
        var template = Menu.getCreateTemplate();
        var editorMenu = new Editor.Menu(template, event.sender);
        x = Math.floor(x);
        y = Math.floor(y);
        editorMenu.nativeMenu.popup(BrowserWindow.fromWebContents(event.sender), x, y);
        editorMenu.dispose();
    },
};
