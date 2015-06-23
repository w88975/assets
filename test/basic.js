describe('<editor-assets>', function() {
    var deepQuery = sinon.stub( Editor.assetdb, 'deepQuery' );
    deepQuery.yields([{
        id: 'assets',
        name: 'assets',
        type: 'mount',
        children: [
            {
                id: '9ba83c96-3ee6-4500-8aae-9b907bb8dd84',
                name: 'backgrounds',
                type: 'folder',
            },
            {
                id: '3f10fba4-4093-419a-aa6e-b1068a3c7170',
                name: 'log_horizontal',
                type: 'texture',
            },
        ],
    }]);

    var assetsEL;
    beforeEach(function ( done ) {
        fixture('panel', function (el) {
            assetsEL = el;
            done();
        });
    });
    after(function () {
    });

    it('should be ok', function( done ) {
        done();
    });
});
