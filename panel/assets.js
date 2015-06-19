(function () {
var Util = require('util');

Editor.registerPanel( 'assets.panel', {
    is: 'editor-assets',

    properties: {
    },

    ready: function () {
    },

    focusOnSearch: function () {
        this.$.search.setFocus();
    },
});

})();
