(function() {
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
            'item-selecting': '_onItemSelecting',
            'item-select': '_onItemSelect',
        },

        ready: function() {
            this._initFocusable(this);
            this._initDroppable(this);
        },

        _onItemSelecting: function(event) {
            event.stopPropagation();

            var targetEL = event.target;

            if (event.detail.toggle) {
                if (targetEL.selected) {
                    Editor.Selection.unselect('asset', targetEL._userId, false);
                } else {
                    Editor.Selection.select('asset', targetEL._userId, false, false);
                }
            } else {
                if (!targetEL.selected) {
                    Editor.Selection.select('asset', targetEL._userId, true, false);
                }
            }
        },

        _onItemSelect: function(event) {
            event.stopPropagation();

            if (event.detail.toggle) {
                Editor.Selection.confirm();
            } else {
                Editor.Selection.select('asset', event.target._userId, true);
            }
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

                        var name = Path.basename(info.path);
                        if (name.toLowerCase().indexOf(text) > -1) {
                            var ctor = Editor.widgets['assets-item'];
                            var newEL = new ctor();

                            this.addItem(this, newEL, {
                                id: info.uuid,
                                name: name,
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
    });
})();
