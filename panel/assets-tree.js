(function () {

Polymer({
    is: 'assets-tree',

    behaviors: [EditorUI.focusable, EditorUI.idtree],

    listeners: {
        'focus': '_onFocus',
        'blur': '_onBlur',
        'selecting': '_onSelecting',
        'select': '_onSelect',
        'mousedown': '_onMouseDown',
        'scroll': '_onScroll',
        'dragstart': '_onDragStart',
    },

    properties: {
    },

    created: function () {
    },

    ready: function () {
        this._shiftStartElement = null;

        this._initFocusable(this);

        this.$.loader.hidden = false;
        Editor.assetdb.deepQuery(function ( results ) {
            this._build(results);
            this.$.loader.hidden = true;
            console.log('assets-tree-ready');
            this.fire('assets-tree-ready');
        }.bind(this));
    },

    select: function ( itemEL ) {
        Editor.Selection.select( 'asset', itemEL._userId, true, true );
    },

    clearSelection: function () {
        Editor.Selection.clear('asset');
        this._activeElement = null;
        this._shiftStartElement = null;
    },

    selectPrev: function ( unselectOthers ) {
        if ( this._activeElement ) {
            var prev = this.prevItem(this._activeElement);
            if ( prev ) {
                if (prev !== this._activeElement) {
                    Editor.Selection.select( 'asset', prev._userId, unselectOthers, true );
                    this.activeItem(prev);

                    window.requestAnimationFrame( function() {
                        if ( prev.offsetTop <= this.scrollTop ) {
                            this.scrollTop = prev.offsetTop - 2; // 1 for padding, 1 for border
                        }
                    }.bind(this));
                }
            }
        }
    },

    selectNext: function ( unselectOthers ) {
        if ( this._activeElement ) {
            var next = this.nextItem(this._activeElement, false);
            if ( next ) {
                if ( next !== this._activeElement ) {
                    Editor.Selection.select( 'asset', next._userId, unselectOthers, true );
                    this.activeItem(next);

                    window.requestAnimationFrame( function() {
                        var headerHeight = next.$.header.offsetHeight;
                        var contentHeight = this.offsetHeight - 3; // 2 for border, 1 for padding
                        if ( next.offsetTop + headerHeight >= this.scrollTop + contentHeight ) {
                            this.scrollTop = next.offsetTop + headerHeight - contentHeight;
                        }
                    }.bind(this));
                }
            }
        }
    },

    _build: function ( data ) {
        console.time('assets-tree._build()');
        data.forEach( function ( entry ) {
            var newEL = this._newEntryRecursively(entry);
            this.addItem( this, newEL, entry.name, entry.id );
            newEL.setIcon( entry.type );

            newEL.folded = false;
        }.bind(this));
        console.timeEnd('assets-tree._build()');

        // sync the selection
        var selection = Editor.Selection.curSelection('asset');
        selection.forEach(function ( id ) {
            this.selectItemById(id);
        }.bind(this));
        this.activeItemById(Editor.Selection.curActivate('asset'));
    },

    _newEntryRecursively: function ( entry ) {
        var ctor = Editor.widgets['assets-item'];
        var el = new ctor();

        if ( entry.children ) {
            entry.children.forEach( function ( childEntry ) {
                var childEL = this._newEntryRecursively(childEntry);
                this.addItem( el, childEL, childEntry.name, childEntry.id );
                childEL.setIcon( childEntry.type );
                // childEL.folded = false;
            }.bind(this) );
        }

        return el;
    },

    // events

    _onSelecting: function ( event ) {
        event.stopPropagation();

        var targetEL = event.target;
        var shiftStartEL = this._shiftStartElement;
        this._shiftStartElement = null;

        if (event.detail.shift) {
            if (shiftStartEL === null) {
                shiftStartEL = this._activeElement;
            }

            this._shiftStartElement = shiftStartEL;

            var el = this._shiftStartElement;
            var userIds = [];

            if (shiftStartEL !== targetEL) {
                if (this._shiftStartElement.offsetTop < targetEL.offsetTop) {
                    while (el !== targetEL) {
                        userIds.push(el._userId);
                        el = this.nextItem(el);
                    }
                } else {
                    while (el !== targetEL) {
                        userIds.push(el._userId);
                        el = this.prevItem(el);
                    }
                }
            }
            userIds.push(targetEL._userId);
            Editor.Selection.select( 'asset', userIds, true, false );
        } else if ( event.detail.toggle ) {
            if ( targetEL.selected ) {
                Editor.Selection.unselect('asset', targetEL._userId, false);
            } else {
                Editor.Selection.select('asset', targetEL._userId, false, false);
            }
        } else {
            // if target already selected, do not unselect others
            if ( !targetEL.selected ) {
                Editor.Selection.select('asset', targetEL._userId, true, false);
            }
        }
    },

    _onSelect: function ( event ) {
        event.stopPropagation();

        if ( event.detail.shift ) {
            Editor.Selection.confirm();
        } else if ( event.detail.toggle ) {
            Editor.Selection.confirm();
        } else {
            Editor.Selection.select( 'asset', event.target._userId, true );
        }
    },

    _onMouseDown: function ( event ) {
        if ( event.which !== 1 )
            return;

        event.stopPropagation();
        this.clearSelection();
    },

    _onScroll: function ( event ) {
        this.scrollLeft = 0;
    },

    _onDragStart: function ( event ) {
        event.stopPropagation();

        var selection = Editor.Selection.curSelection('asset');
        EditorUI.DragDrop.start(event.dataTransfer, 'copyMove', 'asset', selection.map(function(uuid) {
            var itemEL = this._id2el[uuid];
            return {
                id: uuid,
                name: itemEL.name,
                icon: itemEL.$.icon,
            };
        }.bind(this)));
    },
});

})();
