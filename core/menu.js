var Shell = require('shell');
var Fs = require('fire-fs');

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

        //{
        //    label: 'Reimport',
        //    click: function() {
        //        Editor.info('TODO - Reimport');
        //    }
        //},

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
                    var fspath = Editor.assetdb._uuid2importPath(uuid);
                    if ( Fs.existsSync(fspath) ) {
                        Shell.showItemInFolder(fspath);
                    }
                    else {
                        Editor.failed( 'The asset %s is not exists in library', Editor.assetdb.uuidToUrl(uuid) );
                    }
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
