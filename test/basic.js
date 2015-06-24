describe('<editor-assets>', function() {
    var deepQuery = sinon.stub( Editor.assetdb, 'deepQuery' );
    deepQuery.yields([{
        id: 'assets',
        name: 'assets',
        type: 'mount',
        children: [
            {
                id: '1b984894-76c5-4687-b3b3-3f6f4e9f5f2c',
                name: 'backgrounds',
                type: 'folder',
                children: [
                    {
                        id: 'd5f4bd68-519b-40e9-95ce-10db7ac837c1',
                        name: 'foo',
                        type: 'asset',
                    },
                    {
                        id: '6e4ee64b-357c-4cb5-bbed-292f0312afab',
                        name: 'bar',
                        type: 'texture',
                    },
                ]
            },
            {
                id: '149c6d29-119e-4ba7-84bd-1fd4ce1f46cd',
                name: 'simple-texture',
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

    it('should load asset when ready', function( done ) {
        expect( Polymer.dom(assetsEL.$.tree).children[0].name ).to.be.equal('assets');
        expect( assetsEL.$.tree._id2el['149c6d29-119e-4ba7-84bd-1fd4ce1f46cd'].name ).to.be.equal('simple-texture');
        done();
    });

    it('should focus on search', function( done ) {
        assetsEL.focusOnSearch();
        expect( assetsEL.$.search.focused ).to.be.equal(true);
        done();
    });

    it('should select the item', function( done ) {
        var fn = sinon.spy(assetsEL.$.tree, '_onSelect');
        var itemEL = assetsEL.$.tree._id2el['1b984894-76c5-4687-b3b3-3f6f4e9f5f2c'];
        Tester.click(itemEL);

        expect(fn.calledOnce).to.be.equal(true);

        fn.restore();
        done();
    });
});
