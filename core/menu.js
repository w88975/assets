var Shell = require('shell');

function getContextTemplate ( uuid ) {
    return [
        {
            label: 'Create',
            submenu: getCreateTemplate( uuid )
        },

        {
            // ---------------------------------------------
            type: 'separator'
        },

        {
            label: 'Rename',
            click: function() {
                Editor.sendToPanel('assets.panel', 'assets:rename-asset', uuid);
            },
        },

        {
            label: 'Delete',
            click: function() {
                var url = Editor.assetdb.uuidToUrl(uuid);
                Editor.sendToCore('asset-db:delete-assets', [url]);
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
                var fspath = Editor.assetdb.uuidToFspath(uuid);
                Shell.showItemInFolder(fspath);
            }
        },

        {
            label: Fire.isDarwin ? 'Reveal in Library' : 'Show in Library',
            visible: Editor.isDev,
            click: function() {
                var fspath = Editor.assetdb._uuid2importPath(uuid);
                Shell.showItemInFolder(fspath);
            }
        },

        {
            label: 'Show UUID',
            visible: Editor.isDev,
            click: function() {
                var url = Editor.assetdb.uuidToUrl(uuid);
                Editor.info( '%s, %s', uuid, url);
            }
        },
    ];
}

function getCreateTemplate ( uuid ) {
    // NOTE: this will prevent menu item pollution
    var createAssetMenu = Editor.menus['create-asset'].map ( function ( item ) {
        var cloneItem = {};
        for ( var k in item ) {
            if ( k === 'params' ) {
                cloneItem.params = item.params.slice(0);
                cloneItem.params.push(uuid);
                continue;
            }
            cloneItem[k] = item[k];
        }
        return cloneItem;
    });

    return [
        {
            label: 'Folder',
            message: 'assets:new-asset',
            params: ['New Folder', 'folder', uuid]
        },

        {
            // ---------------------------------------------
            type: 'separator'
        },
    ].concat(createAssetMenu);
}

module.exports = {
    getContextTemplate: getContextTemplate,
    getCreateTemplate: getCreateTemplate,
};
