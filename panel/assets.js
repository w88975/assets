(function () {
var Path = require('fire-path');
var Fs = require('fire-fs');

Editor.registerPanel( 'assets.panel', {
    is: 'editor-assets',

    properties: {
        activeItemUrl: {
            type: String,
            value: '',
        },

        filterText: {
            type: String,
            value: '',
            observer: '_onFilterTextChanged'
        },
    },

    listeners: {
        'assets-tree-ready': '_onAssetsTreeReady',
        'open-asset': '_onOpenAsset',
    },

    ready: function () {
        window.addEventListener( 'beforeunload', function ( event ) {
            var states = this.$.tree.dumpItemStates();
            this.profiles.local['item-states'] = states;
            this.profiles.local.save();

            // NOTE: this will prevent window reload
            // event.returnValue = false;
        }.bind(this) );
    },

    focusOnSearch: function ( event ) {
        if ( event ) {
            event.stopPropagation();
        }

        this.$.search.setFocus();
    },

    selectPrev: function ( event ) {
        if ( event ) {
            event.stopPropagation();
            event.preventDefault();
        }

        this.curView().selectPrev(true);
    },

    selectNext: function ( event ) {
        if ( event ) {
            event.stopPropagation();
            event.preventDefault();
        }

        this.curView().selectNext(true);
    },

    // TODO: make it better
    shiftSelectPrev: function ( event ) {
        if ( event ) {
            event.stopPropagation();
            event.preventDefault();
        }

        this.curView().selectPrev(false);
    },

    // TODO: make it better
    shiftSelectNext: function ( event ) {
        if ( event ) {
            event.stopPropagation();
            event.preventDefault();
        }

        this.curView().selectNext(false);
    },

    foldCurrent: function ( event ) {
        if ( event ) {
            event.stopPropagation();
            event.preventDefault();
        }

        var activeEL = this.$.tree._activeElement;
        if ( activeEL ) {
            if ( activeEL.foldable && !activeEL.folded ) {
                activeEL.folded = true;
            }
        }
    },

    foldupCurrent: function ( event ) {
        if ( event ) {
            event.stopPropagation();
            event.preventDefault();
        }

        var activeEL = this.$.tree._activeElement;
        if ( activeEL ) {
            if ( activeEL.foldable && activeEL.folded ) {
                activeEL.folded = false;
            }
        }
    },

    renameCurrentSelected: function ( event ) {
        if ( event ) {
            event.stopPropagation();
            event.preventDefault();
        }

        if ( this.curView()._activeElement ) {
            this.curView().rename(this.curView()._activeElement);
        }
    },

    deleteCurrentSelected: function ( event ) {
        if ( event ) {
            event.stopPropagation();
            event.preventDefault();
        }

        var ids = Editor.Selection.curSelection('asset');
        var urls = ids.map(function (id) {
            var el = this.curView()._id2el[id];
            return this.curView().getUrl(el);
        }.bind(this));
        Editor.assetdb.delete(urls);
    },

    'editor:hint-asset': function ( uuid ) {
        this.curView().hintItemById(uuid);
    },

    'selection:selected': function ( type, ids ) {
        if ( type !== 'asset' )
            return;

        ids.forEach( function ( id ) {
            this.curView().selectItemById(id);
        }.bind(this));
    },

    'selection:unselected': function ( type, ids ) {
        if ( type !== 'asset' )
            return;

        ids.forEach( function ( id ) {
            this.$.tree.unselectItemById(id);
            this.$.searchResult.unselectItemById(id);
        }.bind(this));
    },

    'selection:activated': function ( type, id ) {
        if ( type !== 'asset' )
            return;

        if ( !id )
            return;

        this.curView().activeItemById(id);
        this.activeItemUrl = this.curView().getUrl(this.curView()._activeElement);
    },

    'selection:deactivated': function ( type, id ) {
        if ( type !== 'asset' )
            return;

        this.curView().deactiveItemById(id);
    },

    'asset-db:assets-created': function ( results ) {
        var self = this;
        var hintResults = [];

        results.forEach(function ( result ) {
            var baseNameNoExt = Path.basenameNoExt(result.path);
            self.$.tree.addNewItemById(
                result.uuid,
                result.parentUuid,
                baseNameNoExt,
                Path.extname(result.path),
                result.type
            );

            if ( !self.$.searchResult.hidden ) {
                if ( self.$.searchResult.validate( baseNameNoExt, self.filterText) ) {
                    var ctor = Editor.widgets['assets-item'];
                    var newEL = new ctor();
                    self.$.searchResult.addItem( self.curView(), newEL, {
                        id: result.uuid,
                        name: baseNameNoExt,
                    });
                    newEL.assetType = result.type;
                    newEL.extname = Path.extname(result.path);
                    newEL.setIcon( result.type );
                    hintResults.push(result);
                }
            }
            else {
                var foundParentInResults = results.some(function (result2) {
                    return result2.uuid === result.parentUuid;
                });
                if ( !foundParentInResults ) {
                    hintResults.push(result);
                }
            }
        });

        var curView = self.curView();
        hintResults.forEach(function ( result ) {
            requestAnimationFrame( function () {
                var itemEL = curView._id2el[result.uuid];
                itemEL.hint();
                var parentEL = curView._id2el[result.parentUuid];
                if (parentEL) {
                    parentEL.folded = false;
                }
            });
        });
    },

    'asset-db:assets-moved': function ( results ) {
        var filterResults = Editor.Utils.arrayCmpFilter ( results, function ( a, b ) {
            if ( Path.contains( a.srcPath, b.srcPath ) ) {
                return 1;
            }
            if ( Path.contains( b.srcPath, a.srcPath ) ) {
                return -1;
            }
            return 0;
        });
        var self = this;

        filterResults.forEach(function ( result ) {
            var views = [ 'tree', 'searchResult' ];
            views.forEach( function (name) {
                self.$[name].moveItemById( result.uuid,
                                          result.parentUuid,
                                          Path.basenameNoExt(result.destPath) );
            });
        });

        // flash moved
        filterResults.forEach(function ( result ) {
            requestAnimationFrame( function () {
                var itemEL = self.curView()._id2el[result.uuid];
                itemEL.hint();
            });
        });
    },

    'asset-db:assets-deleted': function ( results ) {
        var filterResults = Editor.Utils.arrayCmpFilter ( results, function ( a, b ) {
            if ( Path.contains( a.path, b.path ) ) {
                return 1;
            }
            if ( Path.contains( b.path, a.path ) ) {
                return -1;
            }
            return 0;
        });

        results.forEach( function ( result ) {
            this.$.tree.removeItemById( result.uuid );
            this.$.searchResult.removeItemById( result.uuid );
        }.bind(this) );

        var uuids = results.map( function ( result ) {
            return result.uuid;
        });
        Editor.Selection.unselect('asset', uuids, true);
    },

    'asset-db:asset-changed': function ( result ) {
        var itemEL = this.curView()._id2el[result.uuid];
        itemEL.hint();
    },

    'asset-db:asset-uuid-changed': function ( result ) {
        var itemEL = this.curView()._id2el[result.oldUuid];
        this.curView().updateItemID(itemEL, result.uuid);
        itemEL.hint();
    },

    'assets:new-asset': function ( info, isContextMenu ) {
        // get parent url
        var url, el, parentUrl;
        if ( isContextMenu ) {
            var contextUuids = Editor.Selection.contexts('asset');
            if ( contextUuids.length > 0 ) {
                var contextUuid = contextUuids[0];
                el = this.curView()._id2el[contextUuid];
                if ( el.assetType === 'folder' || el.assetType === 'mount' ) {
                    parentUrl = this.curView().getUrl(el);
                }
                else {
                    url = this.curView().getUrl(el);
                    parentUrl = Path.dirname(url);
                }
            } else {
                el = Polymer.dom(this.curView()).firstElementChild;
                parentUrl = this.curView().getUrl(el);
            }
        } else {
            var uuid = Editor.Selection.curActivate('asset');
            if ( uuid ) {
                el = this.curView()._id2el[uuid];
                url = this.curView().getUrl(el);

                // if this is not root
                if ( Polymer.dom(el).parentNode !== this.curView() ) {
                    parentUrl = Path.dirname(url);
                }
                else {
                    parentUrl = url;
                }
            } else {
                el = Polymer.dom(this.curView()).firstElementChild;
                parentUrl = this.curView().getUrl(el);
            }
        }

        //
        var data = info.data;
        if ( info.url ) {
            data = Fs.readFileSync(Editor.url(info.url), {encoding:'utf8'});
        }
        Editor.assetdb.create( Path.join(parentUrl, info.name), data );
    },

    'assets:rename': function ( uuid ) {
        var el = this.curView()._id2el[uuid];
        if ( el ) {
            this.curView().rename(el);
        }
    },

    'assets:delete': function ( uuids ) {
        var urls = uuids.map(function (id) {
            var el = this.curView()._id2el[id];
            return this.curView().getUrl(el);
        }.bind(this));
        Editor.assetdb.delete(urls);
    },

    _onAssetsTreeReady: function () {
        var localProfile = this.profiles.local;
        this.$.tree.restoreItemStates(localProfile['item-states']);
    },

    _onOpenAsset: function ( event ) {
        var uuid = event.detail.uuid;
        Editor.assetdb.queryInfoByUuid( uuid, function ( info ) {
            var assetType = info.type;
            if ( assetType === 'javascript' || assetType === 'coffeescript' ) {
                Editor.sendToCore('code-editor:open-by-uuid', uuid);
            }
            else if ( assetType === 'scene' ) {
                Editor.sendToCore('scene:open-by-uuid', uuid);
            }
        }.bind(this));
    },

    _onRefresh: function ( event ) {
        event.stopPropagation();
        this.$.tree.refresh();
    },

    _onCreateClick: function ( event ) {
        var rect = this.$.createBtn.getBoundingClientRect();
        Editor.sendToCore('assets:popup-create-menu', rect.left, rect.bottom + 5, Editor.requireIpcEvent);
    },

    _onFilterTextChanged: function () {
        this.$.searchResult.filter(this.filterText);

        if (this.filterText) {
            this.$.searchResult.hidden = false;
            this.$.tree.hidden = true;
            return;
        }

        this.$.searchResult.hidden = true;
        this.$.searchResult.clear();
        this.$.tree.hidden = false;
    },

    curView: function () {
        if (!this.$.searchResult.hidden) {
            return this.$.searchResult;
        }
        return this.$.tree;
    },

    _onSearchConfirm: function ( event ) {
        if ( event.detail.confirmByEnter ) {
            this.async( function () {
                if ( !this.$.searchResult.hidden ) {
                    this.$.searchResult.setFocus();
                    return;
                }

                this.$.tree.setFocus();
            });
        }
    },
});

})();
