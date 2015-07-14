var Shell = require('shell');

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
                Editor.sendToPanel('assets.panel', 'assets:context-menu-rename');
            },
        },

        {
            label: 'Delete',
            click: function() {
                var url = Editor.assetdb.uuidToUrl();
                Editor.sendToPanel('assets.panel', 'assets:context-menu-delete');
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
                Editor.sendToPanel('assets.panel', 'assets:context-menu-explore');
                // var fspath = Editor.assetdb.uuidToFspath(uuid);
                // Shell.showItemInFolder(fspath);
            }
        },

        {
            label: Fire.isDarwin ? 'Reveal in Library' : 'Show in Library',
            visible: Editor.isDev,
            click: function() {
                Editor.sendToPanel('assets.panel', 'assets:context-menu-explore-lib');
                // var fspath = Editor.assetdb._uuid2importPath(uuid);
                // Shell.showItemInFolder(fspath);
            }
        },

        {
            label: 'Show UUID',
            visible: Editor.isDev,
            click: function() {
                Editor.sendToPanel('assets.panel', 'assets:context-menu-show-uuid');
                // var url = Editor.assetdb.uuidToUrl(uuid);
                // Editor.info( '%s, %s', uuid, url);
            }
        },
    ];
}

function getCreateTemplate ( isContextMenu ) {
    // NOTE: this will prevent menu item pollution
    var createAssetMenu = JSON.parse(JSON.stringify(Editor.menus['create-asset']));
    createAssetMenu = Editor.menus['create-asset'].map ( function ( item ) {
        if ( item.params ) {
            item.params.push(isContextMenu);
        }
        return item;
    });

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
    ].concat(createAssetMenu);
}

module.exports = {
    getContextTemplate: getContextTemplate,
    getCreateTemplate: getCreateTemplate,
};
