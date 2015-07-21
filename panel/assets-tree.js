(function () {
var Url = require('fire-url');
var Path = require('fire-path');

function _getNameCollisions(itemELs, list) {

    var elementsLen = itemELs.length;
    var len = list.length;
    var i, j;
    var name;
    var node;
    var collisions = [];

    for (i = 0; i < len; i++) {
        name = list[i];

        for (j = 0; j < elementsLen; j++) {

            node = itemELs[j];
            if ( node.name + node.extname === name ) {
                collisions.push(node);
            }

        }
    }

    return collisions;
}

Polymer({
    is: 'assets-tree',

    behaviors: [EditorUI.focusable, EditorUI.droppable, EditorUI.idtree],

    hostAttributes: {
        'droppable': 'file,asset,node',
    },

    listeners: {
        'focus': '_onFocus',
        'blur': '_onBlur',
        'mousedown': '_onMouseDown',
        'contextmenu': '_onContextMenu',
        'dragstart': '_onDragStart',
        'dragend': '_onDragEnd',
        'dragover': '_onDragOver',
        'drop-area-enter': '_onDropAreaEnter',
        'drop-area-leave': '_onDropAreaLeave',
        'drop-area-accept': '_onDropAreaAccept',
        'item-selecting': '_onItemSelecting',
        'item-select': '_onItemSelect',
    },

    properties: {
    },

    created: function () {
    },

    ready: function () {
        this._shiftStartElement = null;
        this._conflictElements = [];

        this._initFocusable(this);
        this._initDroppable(this);

        this.refresh();
    },

    refresh: function () {
        this.clear();

        this.$.loader.hidden = false;
        Editor.assetdb.deepQuery(function ( results ) {
            this._build(results);
            this.$.loader.hidden = true;
            console.log('assets-tree-ready');
            this.fire('assets-tree-ready');
        }.bind(this));
    },

    rename: function ( element ) {
        var treeBCR = this.getBoundingClientRect();
        var elBCR = element.getBoundingClientRect();
        var offsetTop = elBCR.top - treeBCR.top - 1;
        var offsetLeft = elBCR.left - treeBCR.left + 27 - 4;
        this.$.nameInput.style.top = (this.$.content.scrollTop + offsetTop) + 'px';
        this.$.nameInput.style.left = offsetLeft + 'px';
        this.$.nameInput.style.width = 'calc(100% - ' + offsetLeft + 'px)';

        this.$.nameInput.hidden = false;
        this.$.nameInput.value = element.name;
        this.$.nameInput.focus();
        this.$.nameInput._renamingEL = element;
        window.requestAnimationFrame( function () {
            this.$.nameInput.select();
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
                        if ( prev.offsetTop <= this.$.content.scrollTop ) {
                            this.$.content.scrollTop = prev.offsetTop - 2; // 1 for padding, 1 for border
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
                        if ( next.offsetTop + headerHeight >= this.$.content.scrollTop + contentHeight ) {
                            this.$.content.scrollTop = next.offsetTop + headerHeight - contentHeight;
                        }
                    }.bind(this));
                }
            }
        }
    },

    getUrl: function(element) {
        if (element.metaType === 'mount') {
            return element.name + '://';
        }

        var url = element.name + element.extname;
        var parentEL = Polymer.dom(element).parentNode;
        while (parentEL instanceof Editor.widgets['assets-item']) {
            if (parentEL.metaType === 'mount') {
                url = parentEL.name + '://' + url;
                break;
            } else {
                url = Url.join(parentEL.name + parentEL.extname, url);
                parentEL = Polymer.dom(parentEL).parentNode;
            }
        }
        return url;
    },

    moveItemById: function ( id, parentID, name ) {
        var srcEL = this._id2el[id];
        if ( !srcEL ) {
            Editor.warn('Can not find source element by id: %s', id);
            return;
        }

        // rename it first
        srcEL.name = name;

        // insert it
        this.setItemParentById(id, parentID);

        // expand parent
        var parentEL = this._id2el[parentID];
        if ( parentEL && parentEL.foldable ) {
            parentEL.folded = false;
        }
    },

    addNewItemById: function ( uuid, parentID, name, extname, metaType ) {
        var parentEL = this._id2el[parentID];
        var ctor = Editor.widgets['assets-item'];
        var newEL = new ctor();

        this.addItem( parentEL, newEL, {
            id: uuid,
            name: name,
        });
        newEL.metaType = metaType;
        newEL.extname = extname;
        newEL.setIcon( metaType );
    },

    hintItemById: function ( uuid ) {
        this.expand( uuid, true );
        var itemEL = this._id2el[uuid];
        if (itemEL) {
            this.scrollToItem(itemEL);
            itemEL.hint();
        }
    },

    _build: function ( data ) {
        console.time('assets-tree._build()');
        data.forEach( function ( entry ) {
            var newEL = this._newEntryRecursively(entry);
            this.addItem( this, newEL, {
                id: entry.uuid,
                name: entry.name,
                folded: false,
            });
            newEL.metaType = entry.type;
            newEL.extname = entry.extname;
            newEL.setIcon( entry.type );
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
                this.addItem( el, childEL, {
                    id: childEntry.uuid,
                    name: childEntry.name,
                } );
                childEL.metaType = childEntry.type;
                childEL.extname = childEntry.extname;
                childEL.setIcon( childEntry.type );
            }.bind(this) );
        }

        return el;
    },

    // events

    _onItemSelecting: function ( event ) {
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

    _onItemSelect: function ( event ) {
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

    _onContextMenu: function ( event ) {
        event.preventDefault();
        event.stopPropagation();

        var contextEL = Polymer.dom(event).localTarget;
        Editor.Selection.setContext('asset',contextEL._userId);

        Editor.sendToCore(
            'assets:popup-context-menu',
            event.clientX,
            event.clientY,
            Editor.requireIpcEvent
        );
    },

    _onScroll: function ( event ) {
        this.$.content.scrollLeft = 0;
    },

    // drag & drop events

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

    _onDragEnd: function ( event ) {
        EditorUI.DragDrop.end();

        Editor.Selection.cancel();
        this._cancelHighligting();
        this._curInsertParentEL = null;
    },

    _onDragOver: function ( event ) {
        var dragType = EditorUI.DragDrop.type(event.dataTransfer);
        if ( dragType !== 'node' && dragType !== 'asset' && dragType !== 'file' ) {
            EditorUI.DragDrop.allowDrop( event.dataTransfer, false );
            return;
        }

        //
        event.preventDefault();
        event.stopPropagation();

        //
        if ( event.target ) {
            var dragoverEL = Polymer.dom(event).localTarget;
            var insertParentEL = dragoverEL;
            var thisDOM = Polymer.dom(this);

            // NOTE: invalid assets browser, no mount in it
            if ( thisDOM.children.length === 0 ) {
                return;
            }

            // get drag over target
            if ( insertParentEL === this ) {
                insertParentEL = thisDOM.firstElementChild;
            }
            if ( !insertParentEL.canAddChild() ) {
                insertParentEL = Polymer.dom(insertParentEL).parentNode;
            }

            // do conflict check if we last dragover is not the same
            if ( insertParentEL !== this._curInsertParentEL ) {
                this._cancelHighligting();
                this._curInsertParentEL = insertParentEL;

                this._highlightBorder( insertParentEL );

                // name collision check
                var names = [];
                var i = 0;
                var dragItems = EditorUI.DragDrop.items(event.dataTransfer);

                if (dragType === 'file') {
                    for (i = 0; i < dragItems.length; i++) {
                        names.push(Path.basename(dragItems[i]));
                    }
                } else if (dragType === 'asset') {
                    var srcELs = this.getToplevelElements(dragItems);
                    for (i = 0; i < srcELs.length; i++) {
                        var srcEL = srcELs[i];
                        if (insertParentEL !== Polymer.dom(srcEL).parentNode) {
                            names.push(srcEL.name + srcEL.extname);
                        }
                    }
                }

                // check if we have conflicts names
                var valid = true;
                if (names.length > 0) {
                    var resultELs = _getNameCollisions( Polymer.dom(insertParentEL).children, names);
                    if (resultELs.length > 0) {
                        this._highlightConflicts(resultELs);
                        valid = false;
                    }
                }
                EditorUI.DragDrop.allowDrop(event.dataTransfer, valid);
            }

            // highlight insert
            var bcr = this.getBoundingClientRect();
            var offsetY = event.clientY - bcr.top + this.$.content.scrollTop;
            var position = 'before';
            if (offsetY >= (dragoverEL.offsetTop + dragoverEL.offsetHeight * 0.5))
                position = 'after';
            this._highlightInsert(dragoverEL, insertParentEL, position);
        }

        //
        var dropEffect = 'none';
        if ( dragType === 'node' || dragType === 'file' ) {
            dropEffect = 'copy';
        } else if ( dragType === 'asset' ) {
            dropEffect = 'move';
        }
        EditorUI.DragDrop.updateDropEffect(event.dataTransfer, dropEffect);
    },

    _onDropAreaEnter: function ( event ) {
        event.stopPropagation();
    },

    _onDropAreaLeave: function ( event ) {
        event.stopPropagation();

        this._cancelHighligting();
        this._curInsertParentEL = null;
    },

    _onDropAreaAccept: function ( event ) {
        event.stopPropagation();
        var targetEL = this._curInsertParentEL;

        Editor.Selection.cancel();
        this._cancelHighligting();
        this._curInsertParentEL = null;

        //
        if ( event.detail.dragItems.length === 0 ) {
            return;
        }

        var dragItems = event.detail.dragItems;
        var destUrl = this.getUrl(targetEL);

        // process drop
        if ( event.detail.dragType === 'node' ) {
            Editor.info('TODO: @Jare, please implement Prefab!');
        }
        else if ( event.detail.dragType === 'asset' ) {
            if ( targetEL ) {
                var srcELs = this.getToplevelElements(dragItems);

                for (var i = 0; i < srcELs.length; ++i) {
                    var srcEL = srcELs[i];

                    // do nothing if we already here
                    if (srcEL === targetEL ||
                        Polymer.dom(srcEL).parentNode === targetEL)
                        continue;

                    if ( srcEL.contains(targetEL) === false ) {
                        var srcUrl = this.getUrl(srcEL);
                        Editor.assetdb.move( srcUrl, Url.join(destUrl, Url.basename(srcUrl) ) );
                    }
                }
            }
        }
        else if ( event.detail.dragType === 'file' ) {
            if ( targetEL ) {
                Editor.assetdb.import( dragItems, destUrl );
            }
        }
    },

    // rename events

    _onRenameMouseDown: function ( event ) {
        event.stopPropagation();
    },

    _onRenameKeyDown: function ( event ) {
        event.stopPropagation();
    },

    _onRenameValueChanged: function ( event ) {
        var targetEL = this.$.nameInput._renamingEL;
        if ( targetEL ) {
            var srcUrl = this.getUrl(targetEL);
            var destUrl = Url.join(Url.dirname(srcUrl), this.$.nameInput.value + targetEL.extname);
            Editor.assetdb.move( srcUrl, destUrl );

            this.$.nameInput._renamingEL = null;
            this.$.nameInput.hidden = true;
        }
    },

    _onRenameFocusChanged: function ( event ) {
        if ( !this.$.nameInput._renamingEL ) {
            return;
        }

        if ( !event.detail.value ) {
            this.$.nameInput._renamingEL = null;
            this.$.nameInput.hidden = true;
        }
    },

    // highlighting

    _highlightBorder: function ( itemEL ) {
        if ( itemEL && itemEL instanceof Editor.widgets['assets-item'] ) {
            var style = this.$.highlightBorder.style;
            style.display = 'block';
            style.left = (itemEL.offsetLeft-2) + 'px';
            style.top = (itemEL.offsetTop-1) + 'px';
            style.width = (itemEL.offsetWidth+4) + 'px';
            style.height = (itemEL.offsetHeight+3) + 'px';

            itemEL.highlighted = true;
        }
        else {
            this.$.highlightBorder.style.display = 'none';
        }
    },

    _highlightInsert: function ( itemEL, parentEL, position ) {
        var style = this.$.insertLine.style;
        if (itemEL === this) {
            itemEL = this.firstChild;
        }

        if (itemEL === parentEL) {
            style.display = 'none';
        } else if (itemEL && parentEL) {
            style.display = 'block';

            style.left = parentEL.offsetLeft + 'px';
            if (position === 'before')
                style.top = (itemEL.offsetTop) + 'px';
            else
                style.top = (itemEL.offsetTop + itemEL.offsetHeight) + 'px';

            style.width = parentEL.offsetWidth + 'px';
            style.height = '0px';
        }
    },

    _highlightConflicts: function(itemELs) {
        for (var i = 0; i < itemELs.length; ++i) {
            var itemEL = itemELs[i];
            if ( itemEL.conflicted === false ) {
                itemEL.conflicted = true;
                this._conflictElements.push(itemEL);
            }
        }

        if (this._curInsertParentEL) {
            this._curInsertParentEL.invalid = true;
        }

        this.$.highlightBorder.setAttribute('invalid', '');
    },

    _cancelHighligting: function () {
        this.$.highlightBorder.style.display = 'none';
        this.$.highlightBorder.removeAttribute('invalid');

        this.$.insertLine.style.display = 'none';

        if (this._curInsertParentEL) {
            this._curInsertParentEL.highlighted = false;
            this._curInsertParentEL.invalid = false;
        }

        this._conflictElements.forEach(function ( el ) {
            el.conflicted = false;
        });
        this._conflictElements = [];
    },
});

})();
