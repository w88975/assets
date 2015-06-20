(function () {
var Util = require('util');

Editor.registerPanel( 'assets.panel', {
    is: 'editor-assets',

    properties: {
    },

    ready: function () {
    },

    focusOnSearch: function ( event ) {
        event.stopPropagation();

        this.$.search.setFocus();
    },

    selectPrev: function ( event ) {
        event.stopPropagation();
        event.preventDefault();

        this.$.tree.selectPrev(true);
    },

    selectNext: function ( event ) {
        event.stopPropagation();
        event.preventDefault();

        this.$.tree.selectNext(true);
    },

    // TODO: make it better
    shiftSelectPrev: function ( event ) {
        event.stopPropagation();
        event.preventDefault();

        this.$.tree.selectPrev(false);
    },

    // TODO: make it better
    shiftSelectNext: function ( event ) {
        event.stopPropagation();
        event.preventDefault();

        this.$.tree.selectNext(false);
    },

    foldCurrent: function () {
        var activeEL = this.$.tree._activeElement;
        if ( activeEL ) {
            if ( activeEL.foldable && !activeEL.folded ) {
                activeEL.folded = true;
            }
        }
    },

    foldupCurrent: function () {
        var activeEL = this.$.tree._activeElement;
        if ( activeEL ) {
            if ( activeEL.foldable && activeEL.folded ) {
                activeEL.folded = false;
            }
        }
    },

    'selection:selected': function ( type, ids ) {
        if ( type !== 'asset' )
            return;

        ids.forEach( function ( id ) {
            this.$.tree.selectItemById(id);
        }.bind(this));
    },

    'selection:unselected': function ( type, ids ) {
        if ( type !== 'asset' )
            return;

        ids.forEach( function ( id ) {
            this.$.tree.unselectItemById(id);
        }.bind(this));
    },

    'selection:activated': function ( type, id ) {
        if ( type !== 'asset' )
            return;

        this.$.tree.activeItemById(id);
    },

    'selection:deactivated': function ( type, id ) {
        if ( type !== 'asset' )
            return;

        this.$.tree.deactiveItemById(id);
    },
});

})();
