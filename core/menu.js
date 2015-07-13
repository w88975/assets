
function getContextTemplate () {
    return [
        {
            label: 'Create',
            submenu: getCreateTemplate()
        },

        {
            // ---------------------------------------------
            type: 'separator'
        },

        {
            label: 'Rename',
            click: function() {
                Editor.info('TODO - Rename');
            },
        },

        {
            label: 'Delete',
            click: function() {
                Editor.info('TODO - Delete');
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
                Editor.info('TODO - Reveal in Finder');
            }
        },

        {
            label: Fire.isDarwin ? 'Reveal in Library' : 'Show in Library',
            visible: Editor.isDev,
            click: function() {
                Editor.info('TODO - Reveal in Library');
            }
        },

        {
            label: 'Show Uuid',
            visible: Editor.isDev,
            click: function() {
                Editor.info('TODO - Show Uuid');
            }
        },
    ];
}

function getCreateTemplate () {
    return _appendRegisteredTo([
        {
            label: 'Folder',
            message: 'assets:new-asset',
            params: ['New Folder', 'folder']
        },

        {
            // ---------------------------------------------
            type: 'separator'
        },
    ]);
}



function _findMenu(menuArray, label) {
    for (var i = 0; i < menuArray.length; i++) {
        if (menuArray[i].label === label) {
            return menuArray[i];
        }
    }
    return null;
}

// Append custom asset menu items to target template
function _appendRegisteredTo (target) {
    // build from registered data
    var items = Editor.menus['create-asset'];
    if (!items) {
        return target;
    }

    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var newMenu = null;
        var parent = target;
        var parentSubmenuArray = null;
        // enumerate menu path
        var subPaths = item.menuPath ? item.menuPath.split('/') : [];
        for (var p = 0; p < subPaths.length; p++) {
            var menu;
            parentSubmenuArray = parent === target ? target : parent.submenu;
            var label = subPaths[p];
            if (!label) {
                continue;
            }
            if (parentSubmenuArray) {
                if (parentSubmenuArray.length > 0) {
                    menu = _findMenu(parentSubmenuArray, label);
                }
                if (menu) {
                    if (menu.submenu) {
                        parent = menu;
                        continue;
                    }
                    else {
                        Editor.error('Asset menu path %s conflict', item.menuPath);
                        break;
                    }
                }
            }
            // create
            newMenu = {
                label: label,
            };
            if (parentSubmenuArray) {
                parentSubmenuArray.push(newMenu);
            }
            else {
                parent.submenu = [newMenu];
            }
            if (item.type !== 'separator') {
                parent = newMenu;
            }
        }
        if (item.type === 'separator') {
            newMenu = {
                type: 'separator'
            };
            parentSubmenuArray = parent === target ? target : parent.submenu;
            parentSubmenuArray.push(newMenu);
        }
        else {
            if (newMenu && !newMenu.submenu) {
                newMenu.message = item.message;
                newMenu.params = item.params;
            }
            else {
                Editor.error('Invalid asset menu path: ' + item.menuPath);
            }
        }
    }

    return target;
}

module.exports = {
    getContextTemplate: getContextTemplate,
    getCreateTemplate: getCreateTemplate,
};
