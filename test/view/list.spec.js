var List = require('../../src/js/view/list.js');

describe('List test', function() {
    var list,
        listEl,
        counterEl,
        sizeEl,
        uploader,
        itemInfo;

    beforeEach(function() {
        uploader = {};
        listEl = $('<div class="list"></div>');
        counterEl = $('<div class="counter"></div>');
        sizeEl = $('<div class="size"></div>');

        itemInfo = {
            name: 'filename1.jpg',
            type: 'jpg',
            url: 'http://localhost:8009/filename.jpg',
            hiddenFrame: {},
            size: 10.15
        };

        list = new List({
            listInfo: {
                list: listEl,
                count: counterEl,
                size: sizeEl
            },
            sizeunit: 'kb',
            template: {
                item: ['<li class="filetypeDisplayClass">',
                '<spna class="fileicon {{filetype}}">{{filetype}}</spna>',
                '<span class="file_name">{{filename}}</span>',
                '<span class="file_size">{{filesize}}</span>',
                '<button type="button" class="{{deleteButtonClassName}}">Delete</button>',
                '</li>'].join('')
            }
        }, uploader);
    });

    it('List is define', function() {
        expect(list).toBeDefined();
    });

    it('_createItem', function() {
        var item = list._createItem(itemInfo);
        expect(item).toBeDefined();
    });

    it('_updateTotalCount', function() {
        var count = 10;
        list._updateTotalCount(count);
        expect(parseInt(list.$counter.html(), 10)).toBe(count);
    });

    it('_updateTotalCount Counter without count parameter', function() {
        list._updateTotalCount();
        expect(parseInt(list.$counter.html(), 10)).toBe(0);
    });

    it('_updateTotalUsage', function() {
        var size = 30.10;
        list._updateTotalUsage(size);
        expect(parseFloat(list.$size.html())).toBe(30.10);
    });

    it('_updateTotalUsage without param', function() {
        list._updateTotalUsage();
        expect(parseFloat(list.$size.html())).toBe(0);
    });

    it('_updateTotalUsage without param, After file', function() {
        list._addFiles(itemInfo);
        list._updateTotalUsage();
        expect(parseFloat(list.$size.html())).toBe(10.15);
    });

    it('updateTotalInfo', function() {
        var info = {
            count: 10,
            size: 100.20
        };

        list.updateTotalInfo(info);
        expect(parseInt(list.$counter.html(), 10)).toBe(10);
        expect(parseFloat(list.$size.html())).toBe(100.20);
    });

    it('removeFile', function() {
        var name;

        list.on('remove', function(data) {
            name = data.name;
        });

        list._removeFile({
            name: 'test'
        });

        expect(name).toBe('test');
    });

    it('_addFiles', function() {
        list._addFiles(itemInfo);

        expect(list.items.length).toBe(1);
    });

    it('update add file', function() {
        var info = {
            items: itemInfo
        };
        list.update(info);
        expect(list.items.length).toBe(1);
    });

    it('update remove file', function() {
        list._addFiles(itemInfo);

        expect(list.items.length).toBe(1);

        var info = {
            name : itemInfo.name,
            action: 'remove'
        };
        list.update(info);

        expect(list.items.length).toBe(0);
    });

    it('update remove file but not match', function() {
        list._addFiles(itemInfo);

        expect(list.items.length).toBe(1);

        var info = {
            name : 'wrongname.jpg',
            action: 'remove'
        };
        list.update(info);

        expect(list.items.length).toBe(1);
    });

});