(function() {
    var Url = require('fire-url');
    var Path = require('fire-path');

    Polymer({
        is: 'assets-search-result',

        properties: {
            assets: {
                type: Array,
                value: function() {
                    return [];
                },
            }
        },

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
            'item-selecting': '_onItemSelecting',
            'item-select': '_onItemSelect',
        },

        ready: function() {
            this._shiftStartElement = null;
            this._conflictElements = [];

            this._initFocusable(this);
            this._initDroppable(this);
        },

        clearSelection: function() {
            Editor.Selection.clear('asset');
            this._activeElement = null;
            this._shiftStartElement = null;
        },

        _onMouseDown: function(event) {
            if (event.which !== 1)
                return;

            event.stopPropagation();
            this.clearSelection();
        },

        _onItemSelecting: function(event) {
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
                Editor.Selection.select('asset', userIds, true, false);
            } else if (event.detail.toggle) {
                if (targetEL.selected) {
                    Editor.Selection.unselect('asset', targetEL._userId, false);
                } else {
                    Editor.Selection.select('asset', targetEL._userId, false, false);
                }
            } else {
                // if target already selected, do not unselect others
                if (!targetEL.selected) {
                    Editor.Selection.select('asset', targetEL._userId, true, false);
                }
            }
        },

        _onItemSelect: function(event) {
            event.stopPropagation();

            if (event.detail.shift) {
                Editor.Selection.confirm();
            } else if (event.detail.toggle) {
                Editor.Selection.confirm();
            } else {
                Editor.Selection.select('asset', event.target._userId, true);
            }
        },

        selectPrev: function(unselectOthers) {
            if (this._activeElement) {
                var prev = this.prevItem(this._activeElement);
                if (prev) {
                    if (prev !== this._activeElement) {
                        Editor.Selection.select('asset', prev._userId, unselectOthers, true);
                        this.activeItem(prev);

                        window.requestAnimationFrame(function() {
                            if (prev.offsetTop <= this.$.content.scrollTop) {
                                this.$.content.scrollTop = prev.offsetTop - 2; // 1 for padding, 1 for border
                            }
                        }.bind(this));
                    }
                }
            }
        },

        selectNext: function(unselectOthers) {
            if (this._activeElement) {
                var next = this.nextItem(this._activeElement, false);
                if (next) {
                    if (next !== this._activeElement) {
                        Editor.Selection.select('asset', next._userId, unselectOthers, true);
                        this.activeItem(next);

                        window.requestAnimationFrame(function() {
                            var headerHeight = next.$.header.offsetHeight;
                            var contentHeight = this.offsetHeight - 3; // 2 for border, 1 for padding
                            if (next.offsetTop + headerHeight >= this.$.content.scrollTop + contentHeight) {
                                this.$.content.scrollTop = next.offsetTop + headerHeight - contentHeight;
                            }
                        }.bind(this));
                    }
                }
            }
        },

        getUrl: function(element) {
            return Editor.remote.assetdb.uuidToUrl(element.id);
        },

        moveItemById: function(id, parentID, name) {
            var srcEL = this._id2el[id];
            if (!srcEL) {
                Editor.warn('Can not find source element by id: %s', id);
                return;
            }

            // rename it first
            srcEL.name = name;

            // insert it
            this.setItemParentById(id, parentID);

            // expand parent
            var parentEL = this._id2el[parentID];
            if (parentEL && parentEL.foldable) {
                parentEL.folded = false;
            }
        },

        _onDragStart: function(event) {
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

        _onDragEnd: function(event) {
            EditorUI.DragDrop.end();

            Editor.Selection.cancel();
            this._curInsertParentEL = null;
        },

        _onDragOver: function(event) {
            var dragType = EditorUI.DragDrop.type(event.dataTransfer);
            if (dragType !== 'node' && dragType !== 'asset' && dragType !== 'file') {
                EditorUI.DragDrop.allowDrop(event.dataTransfer, false);
                return;
            }

            //
            event.preventDefault();
            event.stopPropagation();

            var dropEffect = 'none';
            if (dragType === 'node' || dragType === 'file') {
                dropEffect = 'copy';
            } else if (dragType === 'asset') {
                dropEffect = 'move';
            }
            EditorUI.DragDrop.updateDropEffect(event.dataTransfer, dropEffect);
        },

        rename: function(element) {
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
            window.requestAnimationFrame(function() {
                this.$.nameInput.select();
            }.bind(this));
        },

        _onRenameMouseDown: function(event) {
            event.stopPropagation();
        },

        _onRenameKeyDown: function(event) {
            event.stopPropagation();
        },

        _onRenameValueChanged: function(event) {
            var targetEL = this.$.nameInput._renamingEL;
            if (targetEL) {
                var srcUrl = this.getUrl(targetEL);
                var destUrl = Url.join(Url.dirname(srcUrl), this.$.nameInput.value + targetEL.extname);
                Editor.assetdb.move(srcUrl, destUrl);

                this.$.nameInput._renamingEL = null;
                this.$.nameInput.hidden = true;
            }
        },

        _onRenameFocusChanged: function(event) {
            if (!this.$.nameInput._renamingEL) {
                return;
            }

            if (!event.detail.value) {
                this.$.nameInput._renamingEL = null;
                this.$.nameInput.hidden = true;
            }
        },

        _onContextMenu: function(event) {
            event.preventDefault();
            event.stopPropagation();

            var contextEL = Polymer.dom(event).localTarget;
            Editor.Selection.setContext('asset', contextEL._userId);

            Editor.sendToCore(
                'assets:popup-context-menu',
                event.clientX,
                event.clientY,
                Editor.requireIpcEvent
            );
        },

        showLoaderAfter: function(timeout) {
            if (this.$.loader.hidden === false)
                return;

            if (this._loaderID)
                return;

            this._loaderID = this.async(function() {
                this.$.loader.hidden = false;
                this._loaderID = null;
            }, timeout);
        },

        hideLoader: function() {
            this.cancelAsync(this._loaderID);
            this._loaderID = null;
            this.$.loader.hidden = true;
        },

        validate: function (name, filterText) {
            return name.toLowerCase().indexOf(filterText.toLowerCase()) > -1 ;
        },

        filter: function(filterText) {
            if (!filterText) {
                return;
            }
            this.cancelAsync(this._asyncID);
            this._asyncID = null;

            this.showLoaderAfter(50);

            var id = this.async(function() {
                this.hideLoader();
                Editor.assetdb.queryAssets('assets://**/*', null, function(results) {
                    this.clear();
                    if (id !== this._asyncID)
                        return;
                    var text = filterText.toLowerCase();
                    results.forEach(function(info) {

                        var name = Path.basenameNoExt(info.path);
                        var extname = Path.extname(info.path);
                        if (this.validate(name, text)) {
                            var ctor = Editor.widgets['assets-item'];
                            var newEL = new ctor();

                            this.addItem(this, newEL, {
                                id: info.uuid,
                                name: name,
                                extname: extname,
                                folded: false,
                            });
                            newEL.setIcon(info.type);
                        }
                    }.bind(this));

                    var selection = Editor.Selection.curSelection('asset');
                    selection.forEach(function(id) {
                        this.selectItemById(id);
                    }.bind(this));
                    this.activeItemById(Editor.Selection.curActivate('asset'));
                }.bind(this));

            }, 50);

            this._asyncID = id;
        },

        _onScroll: function(event) {
            this.$.content.scrollLeft = 0;
        },

    });
})();
