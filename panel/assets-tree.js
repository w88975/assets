Polymer({
    is: 'assets-tree',

    behaviors: [EditorUI.idtree],

    properties: {
    },

    created: function () {
    },

    ready: function () {
        this.$.loader.hidden = false;
        Editor.assetdb.deepQuery( function ( results ) {
            this._build(results);
            this.$.loader.hidden = true;
        }.bind(this));
    },

    _build: function ( data ) {
        console.time('assets-tree._build()');

        data.forEach( function ( entry ) {
            var newEL = this._newEntryRecursively(entry);
            this.addItem( this, newEL, entry.name, entry.id );

            newEL.folded = false;
        }.bind(this));

        console.timeEnd('assets-tree._build()');
    },

    _newEntryRecursively: function ( entry ) {
        var ctor = Editor.widgets['tree-item'];
        var el = new ctor();

        if ( entry.children ) {
            entry.children.forEach( function ( childEntry ) {
                var childEL = this._newEntryRecursively(childEntry);
                this.addItem( el, childEL, childEntry.name, childEntry.id );
                // childEL.folded = false;
            }.bind(this) );
        }

        return el;
    },
});
