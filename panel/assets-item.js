(function () {

function _binaryIndexOf ( elements, key ) {
    var lo = 0;
    var hi = elements.length - 1;
    var mid, el;

    while (lo <= hi) {
        mid = ((lo + hi) >> 1);
        name = elements[mid].name + elements[mid].type;

        if (name < key) {
            lo = mid + 1;
        }
        else if (name > key) {
            hi = mid - 1;
        }
        else {
            return mid;
        }
    }
    return lo;
}

function _binaryInsert( parentEL, el ) {
    var parentDOM = Polymer.dom(parentEL);

    var idx = _binaryIndexOf( parentDOM.children, el.name + el.type );
    if ( idx === -1 ) {
        parentDOM.appendChild(el);
    }
    else {
        if ( el !== parentDOM.children[idx] ) {
            parentDOM.insertBefore(el, parentDOM.children[idx]);
        }
    }
}

Editor.registerWidget( 'assets-item', {
    is: 'assets-item',

    hostAttributes: {
        draggable: 'true',
    },

    properties: {
        // basic

        foldable: {
            type: Boolean,
            value: false,
            notify: true,
            reflectToAttribute: true,
        },

        folded: {
            type: Boolean,
            value: false,
            notify: true,
            reflectToAttribute: true,
        },

        selected: {
            type: Boolean,
            value: false,
            notify: true,
            reflectToAttribute: true,
        },

        name: {
            type: String,
            value: '',
        },

        // advance

        extname: {
            type: String,
            value: '',
        },

        metaType: {
            type: String,
            value: '',
        },

        conflicted: {
            type: Boolean,
            value: false,
            reflectToAttribute: true
        },

        highlighted: {
            type: Boolean,
            value: false,
            reflectToAttribute: true
        },

        invalid: {
            type: Boolean,
            value: false,
            reflectToAttribute: true
        },
    },

    listeners: {
        'mousedown': '_onMouseDown',
        'click': '_onClick',
        'dblclick': '_onDblClick',
    },

    ready: function () {
        this._renaming = false;
        this._userId = '';
    },

    //
    setIcon: function ( type ) {
        if ( type === 'texture' ) {
            this.$.icon.src = 'uuid://' + this._userId + '?thumbnail';
            return;
        }

        var metaCtor = Editor.metas[type];
        if ( metaCtor && metaCtor['meta-icon'] ) {
            this.$.icon.src = metaCtor['meta-icon'];
            return;
        }

        // fallback to default icon
        this.$.icon.src = 'packages://assets/static/icon' + type + '.png';
    },

    //

    _nameClass: function ( name ) {
        if ( !name )
            return 'no-name';
        return 'name';
    },

    _nameText: function ( name ) {
        if ( !name )
            return 'No Name';
        return name;
    },

    _foldIconClass: function ( folded ) {
        if ( folded )
            return 'fa fa-caret-right';

        return 'fa fa-caret-down';
    },

    // events

    _onMouseDown: function ( event ) {
        if ( event.which !== 1 )
            return;

        event.stopPropagation();

        if ( this._renaming ) {
            return;
        }

        var shift = false;
        var toggle = false;

        if ( event.shiftKey ) {
            shift = true;
        } else if ( event.metaKey || event.ctrlKey ) {
            toggle = true;
        }

        this.fire('item-selecting', {
            toggle: toggle,
            shift: shift,
        });

    },

    _onClick: function ( event ) {
        if ( event.which !== 1 )
            return;

        event.stopPropagation();

        var shift = false;
        var toggle = false;

        if ( event.shiftKey ) {
            shift = true;
        } else if ( event.metaKey || event.ctrlKey ) {
            toggle = true;
        }

        this.fire('item-select', {
            toggle: toggle,
            shift: shift,
        });
    },

    _onDblClick: function ( event ) {
        if ( event.which !== 1 )
            return;

        if ( event.shiftKey || event.metaKey || event.ctrlKey ) {
            return;
        }

        event.stopPropagation();
        this.fire('open-asset', {
            uuid: this._userId
        });
    },

    _onFoldMouseDown: function ( event ) {
        event.stopPropagation();
    },

    _onFoldClick: function ( event ) {
        event.stopPropagation();

        if ( event.which !== 1 )
            return;

        this.folded = !this.folded;
    },

    _onFoldDblClick: function ( event ) {
        event.stopPropagation();
    },

    insertItem: function ( el ) {
        _binaryInsert( this, el );
    },

    canAddChild: function () {
        return this.metaType === 'folder' ||
               this.metaType === 'mount'
               // TODO: this.isFolderAsset
               ;
    },

    hint: function ( color, duration ) {
        color = color || 'white';
        duration = duration || 1000;

        var computedStyle = window.getComputedStyle(this.$.bar);
        this.$.bar.animate([
            { background: color, transform: 'scale(1.2)' },
            { background: computedStyle.backgroundColor, transform: 'scale(1)' }
        ], {
            duration: duration
        });
    },
});

})();
