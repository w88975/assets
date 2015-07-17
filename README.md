# AssetDB Browser

## Usages

Clone github

**In Core Level**

Step 1: Initialize asset-db

```javascript
var AssetDB = require('../asset-db');
Editor.assetdb = new AssetDB({
    'cwd': 'your/project/path',
    'library': 'library',
});
```

Step 2: Register Panel Window and Selection

```javascript
// register panel window
Editor.Panel.templateUrl = 'app://your/window.html';

// register selections
Editor.Selection.register('asset');
```

Step 3: Mount and Open Window

```javascript
Editor.assetdb.mount('your/mounting/path', 'assets', function () {
    Editor.assetdb.init(function () {
        // open your window...
    });
});
```

**In Page Level**

```html
<head>
    <script type="text/javascript" src="editor-framework://page/page-init.js"></script>
    <link rel="import" href="editor-framework://page/ui/ui.html">
    <script>
        Editor.require('app://asset-db');
    </script>
</head>
```

