var Shell = require('shell');
var Fs = require('fire-fs');
var Globby = require('globby');

function getContextTemplate () {
    return [
        {
            label: 'Create',
            submenu: getCreateTemplate(true)
        },

        {
            // ---------------------------------------------
            type: 'separator'
        },

        {
            label: 'Rename',
            click: function() {
                var contextUuids = Editor.Selection.contexts('asset');
                if ( contextUuids.length > 0 ) {
                    Editor.sendToPanel('assets.panel', 'assets:rename', contextUuids[0]);
                }
            },
        },

        {
            label: 'Delete',
            click: function() {
                var contextUuids = Editor.Selection.contexts('asset');
                if ( contextUuids.length > 0 ) {
                    Editor.sendToPanel('assets.panel', 'assets:delete', contextUuids);
                }
            },
        },

        {
            // ---------------------------------------------
            type: 'separator'
        },

        {
            label: Fire.isDarwin ? 'Reveal in Finder' : 'Show in Explorer',
            click: function() {
                var contextUuids = Editor.Selection.contexts('asset');
                if ( contextUuids.length > 0 ) {
                    var uuid = contextUuids[0];
                    var fspath = Editor.assetdb.uuidToFspath(uuid);
                    if ( Fs.existsSync(fspath) ) {
                        Shell.showItemInFolder(fspath);
                    }
                    else {
                        Editor.failed( 'Can not found the asset %s', Editor.assetdb.uuidToUrl(uuid) );
                    }
                }
            }
        },

        {
            label: Fire.isDarwin ? 'Reveal in Library' : 'Show in Library',
            visible: Editor.isDev,
            click: function() {
                var contextUuids = Editor.Selection.contexts('asset');
                if ( contextUuids.length > 0 ) {
                    var uuid = contextUuids[0];
                    var meta = Editor.assetdb.loadMeta(uuid);

                    if ( meta.useRawfile() ) {
                        Editor.info( 'This is a raw asset, it does not exists in library' );
                        return;
                    }

                    var dests = meta.dests(Editor.assetdb);
                    if ( !dests.length ) {
                        Editor.failed( 'The asset %s is not exists in library', Editor.assetdb.uuidToUrl(uuid) );
                        return;
                    }

                    var fspath = dests[0];
                    if ( !Fs.existsSync(fspath) ) {
                        Editor.failed( 'The asset %s is not exists in library', Editor.assetdb.uuidToUrl(uuid) );
                        return;
                    }

                    Shell.showItemInFolder(fspath);
                }
            }
        },

        {
            label: 'Show UUID',
            visible: Editor.isDev,
            click: function() {
                var contextUuids = Editor.Selection.contexts('asset');
                if ( contextUuids.length > 0 ) {
                    var uuid = contextUuids[0];
                    var url = Editor.assetdb.uuidToUrl(uuid);
                    Editor.info('%s, %s', uuid, url );
                }
            }
        },

        {
            // ---------------------------------------------
            type: 'separator'
        },

        {
           label: 'Refresh',
           click: function() {
                var contextUuids = Editor.Selection.contexts('asset');
                if ( contextUuids.length > 0 ) {
                    var urls = contextUuids.map( function (uuid) {
                        return Editor.assetdb.uuidToUrl(uuid);
                    });
                    Editor.assetdb.watchOFF();
                    urls.forEach( function (url) {
                        // import asset
                        Editor.assetdb.refresh ( url, function ( err, results ) {
                            if ( err ) {
                                Editor.assetdb.error('Failed to import asset %s, %s', url, err.stack);
                                return;
                            }

                            Editor.assetdb._handleRefreshResults(results);
                        });
                    });
                    if ( !Editor.focused ) {
                        Editor.assetdb.watchON();
                    }
                }
           }
        },
    ];
}

function getCreateTemplate ( isContextMenu ) {
    var menuTmpl = Editor.menus['create-asset'];

    // NOTE: this will prevent menu item pollution
    if ( menuTmpl ) {
        menuTmpl = JSON.parse(JSON.stringify(menuTmpl));
        menuTmpl = menuTmpl.map ( function ( item ) {
            if ( item.params ) {
                item.params.push(isContextMenu);
            }
            return item;
        });
    }

    return [
        {
            label: 'Folder',
            message: 'assets:new-asset',
            params: [{
                name: 'New Folder',
            }, isContextMenu]
        },

        {
            // ---------------------------------------------
            type: 'separator'
        },
    ].concat(menuTmpl);
}

module.exports = {
    getContextTemplate: getContextTemplate,
    getCreateTemplate: getCreateTemplate,
};
