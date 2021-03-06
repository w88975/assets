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

        this.$.tree.selectPrev(true);
    },

    selectNext: function ( event ) {
        if ( event ) {
            event.stopPropagation();
            event.preventDefault();
        }

        this.$.tree.selectNext(true);
    },

    // TODO: make it better
    shiftSelectPrev: function ( event ) {
        if ( event ) {
            event.stopPropagation();
            event.preventDefault();
        }

        this.$.tree.selectPrev(false);
    },

    // TODO: make it better
    shiftSelectNext: function ( event ) {
        if ( event ) {
            event.stopPropagation();
            event.preventDefault();
        }

        this.$.tree.selectNext(false);
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

        if ( this.$.tree._activeElement ) {
            this.$.tree.rename(this.$.tree._activeElement);
        }
    },

    deleteCurrentSelected: function ( event ) {
        if ( event ) {
            event.stopPropagation();
            event.preventDefault();
        }

        var ids = Editor.Selection.curSelection('asset');
        var urls = ids.map(function (id) {
            var el = this.$.tree._id2el[id];
            return this.$.tree.getUrl(el);
        }.bind(this));
        Editor.assetdb.delete(urls);
    },

    'editor:hint-asset': function ( uuid ) {
        this.$.tree.hintItemById(uuid);
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

        if ( !id )
            return;

        this.$.tree.activeItemById(id);
        this.activeItemUrl = this.$.tree.getUrl(this.$.tree._activeElement);
    },

    'selection:deactivated': function ( type, id ) {
        if ( type !== 'asset' )
            return;

        this.$.tree.deactiveItemById(id);
    },

    'asset-db:assets-created': function ( results ) {
        var self = this;

        results.forEach(function ( result ) {
            self.$.tree.addNewItemById(
                result.uuid,
                result.parentUuid,
                Path.basenameNoExt(result.path),
                Path.extname(result.path),
                result.type
            );
        });

        // flash added
        results.forEach(function ( result ) {
            var foundParentInResults = results.some(function (result2) {
                return result2.uuid === result.parentUuid;
            });

            if ( !foundParentInResults ) {
                requestAnimationFrame( function () {
                    var itemEL = self.$.tree._id2el[result.uuid];
                    itemEL.hint();

                    var parentEL = self.$.tree._id2el[result.parentUuid];
                    parentEL.folded = false;
                });
            }
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
            self.$.tree.moveItemById( result.uuid,
                                      result.parentUuid,
                                      Path.basenameNoExt(result.destPath) );
        });

        // flash moved
        filterResults.forEach(function ( result ) {
            requestAnimationFrame( function () {
                var itemEL = self.$.tree._id2el[result.uuid];
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

        filterResults.forEach( function ( result ) {
            this.$.tree.removeItemById( result.uuid );
        }.bind(this) );

        var uuids = results.map( function ( result ) {
            return result.uuid;
        });
        Editor.Selection.unselect('asset', uuids, true);
    },

    'asset-db:asset-changed': function ( result ) {
        var itemEL = this.$.tree._id2el[result.uuid];
        itemEL.hint();
    },

    'asset-db:asset-uuid-changed': function ( result ) {
        var itemEL = this.$.tree._id2el[result.oldUuid];
        this.$.tree.updateItemID(itemEL, result.uuid);
        itemEL.hint();
    },

    'assets:new-asset': function ( info, isContextMenu ) {
        // get parent url
        var url, el, parentUrl;
        if ( isContextMenu ) {
            var contextUuids = Editor.Selection.contexts('asset');
            if ( contextUuids.length > 0 ) {
                var contextUuid = contextUuids[0];
                el = this.$.tree._id2el[contextUuid];
                if ( el.assetType === 'folder' || el.assetType === 'mount' ) {
                    parentUrl = this.$.tree.getUrl(el);
                }
                else {
                    url = this.$.tree.getUrl(el);
                    parentUrl = Path.dirname(url);
                }
            } else {
                el = Polymer.dom(this.$.tree).firstElementChild;
                parentUrl = this.$.tree.getUrl(el);
            }
        } else {
            var uuid = Editor.Selection.curActivate('asset');
            if ( uuid ) {
                el = this.$.tree._id2el[uuid];
                url = this.$.tree.getUrl(el);

                // if this is not root
                if ( Polymer.dom(el).parentNode !== this.$.tree ) {
                    parentUrl = Path.dirname(url);
                }
                else {
                    parentUrl = url;
                }
            } else {
                el = Polymer.dom(this.$.tree).firstElementChild;
                parentUrl = this.$.tree.getUrl(el);
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
        var el = this.$.tree._id2el[uuid];
        if ( el ) {
            this.$.tree.rename(el);
        }
    },

    'assets:delete': function ( uuids ) {
        var urls = uuids.map(function (id) {
            var el = this.$.tree._id2el[id];
            return this.$.tree.getUrl(el);
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
    }
});

})();
