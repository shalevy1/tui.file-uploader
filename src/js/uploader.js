/**
 * @fileoverview FileUploader is core of file uploader component.<br>FileManager manage connector to connect server and update FileListView.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author NHN Ent. FE Development Team <e0242@nhnent.com>
 */

var statics = require('./statics.js');
var utils = require('./utils.js');
var conn = require('./connector/connector.js');
var Input = require('./view/input.js');
var List = require('./view/list.js');
var Pool = require('./view/pool.js');

/**
 * FileUploader act like bridge between connector and view.
 * It makes connector and view with option and environment.
 * It control and make connection among modules.
 * @constructor ne.component.Uploader
 * @example
 * var uploader = new ne.component.Uploader({
 *     url: {
 *         send: "http://fe.nhnent.com/etc/etc/uploader/uploader.php",
 *         remove: "http://fe.nhnent.com/etc/etc/uploader/remove.php"
 *     },
 *     helper: {
 *         url: 'http://10.77.34.126:8009/samples/response.html',
 *         name: 'REDIRECT_URL'
 *     },
 *     resultTypeElementName: 'RESPONSE_TYPE',
 *     formTarget: 'hiddenFrame',
 *     callbackName: 'responseCallback',
 *     listInfo: {
 *         list: $('#files'),
 *         count: $('#file_count'),
 *         size: $('#size_count')
 *     },
 *     separator: ';'
 * }, $('#uploader'));
 */
var Uploader = ne.util.defineClass(/**@lends ne.component.Uploader.prototype */{

    /**
     * initialize options
     * @param {object} options The options to set up file uploader modules.
     *  @param {object} options.url The url is file server.
     *      @param {string} options.url.send The url is for file attach.
     *      @param {string} options.url.remove The url is for file detach.
     *  @param {object} options.helper The helper object info is for x-domain.
     *      @param {string} options.helper.url The url is helper page url.
     *      @param {string} options.helper.name The name of hidden element for sending server helper page information.
     *  @param {string} options.resultTypeElementName The type of hidden element for sending server response type information.
     *  @param {string} options.formTarget The target for x-domain jsonp case.
     *  @param {string} options.callbackName The name of jsonp callback function.
     *  @param {object} opitons.listInfo The element info to display file list information.
     *  @param {string} options.separator The separator for jsonp helper response.
     *  @param {string} [options.fileField=userFile] The field name of input file element.
     *  @param {boolean} options.useFolder Whether select unit is folder of not. If this is ture, multiple will be ignored.
     *  @param {boolean} options.isMultiple Whether enable multiple select or not.
     * @param {JqueryObject} $el Root Element of Uploader
     */
    init: function(options, $el) {
        this._setData(options);
        this._setConnector();

        this.$el = $el;
        this.inputView = new Input(options, this);
        this.listView = new List(options, this);
        this.fileField = this.fileField || statics.CONF.FILE_FILED_NAME;
        this._pool = new Pool(this.listView.$el[0]);

        this._addEvent();
    },

    /**
     * Set Connector by useJsonp flag and whether.
     * @private
     */
    _setConnector: function() {
        if (this.isBatchTransfer) {
            this.type = 'local';
        } else if (this.isCrossDomain()) {
            if (this.helper) {
                this.type = 'jsonp';
            } else {
                alert(statics.CONF.ERROR.NOT_SURPPORT);
            }
        } else {
            if (this.useJsonp || !utils.isSupportFormData()) {
                this.type = 'jsonp';
            } else {
                this.type = 'ajax';
            }
        }
        this._connector = conn.getConnector(this);
    },

    /**
     * Update list view with custom or original data.
     * @param {object} info The data for update list
     *  @param {string} info.action The action name to execute method
     */
    notify: function(info) {
        this.listView.update(info);
        this.listView.updateTotalInfo(info);
    },

    /**
     * Set field data by option values.
     * @param options
     */
    _setData: function(options) {
        ne.util.extend(this, options);
    },

    /**
     * Extract protocol + domain from url to find out whether cross-domain or not.
     * @returns {boolean}
     */
    isCrossDomain: function() {
        var pageDomain = document.domain;
        return this.url.send.indexOf(pageDomain) === -1;
    },

    /**
     * Callback for error
     * @param {object} response Error response
     */
    errorCallback: function(response) {
        var message;
        if (response && response.msg) {
            message = response.msg;
        } else {
            message = statics.CONF.ERROR.DEFAULT;
        }
        alert(message);
    },

    /**
     * Callback for custom send event
     * @param {object} [data] The data include callback function for file clone
     */
    sendFile: function(data) {
        var callback = ne.util.bind(this.notify, this);

        this._connector.addRequest({
            type: 'add',
            success: function(result) {
                if (data && data.callback) {
                    data.callback(result);
                }
                callback(result);
            },
            error: this.errorCallback
        });
    },

    /**
     * Callback for custom remove event
     * @param {object} data The data for remove file.
     */
    removeFile: function(data) {
        var callback = ne.util.bind(this.notify, this);
        this._connector.removeRequest({
            type: 'remove',
            data: data,
            success: callback
        });
    },

    /**
     * Submit for data submit to server
     */
    submit: function() {
        this._connector.submit(function() {
            // todo submit preprocess
        });
    },

    /**
     * Get file info locally
     * @param {HtmlElement} element Input element
     * @private
     */
    _getFileInfo: function(element) {
        var files;
        if (utils.isSupportFileSystem()) {
            files = this._getFileList(element.files);
        } else {
            files = {
                name: element.value,
                id: element.value
            };
        }
        return files;
    },

    /**
     * Get file list from FileList object
     * @param {FileList} files A FileList object
     * @returns {Array}
     * @private
     */
    _getFileList: function(files) {
        return ne.util.map(files, function(file) {
            return {
                name: file.name,
                size: file.size,
                id: file.name
            };
        });
    },

    /**
     * Add event to listview and inputview
     * @private
     */
    _addEvent: function() {
        if (this.isBatchTransfer) {
            this.inputView.on('save', this.sendFile, this);
            this.listView.on('remove', this.removeFile, this);
        } else {
            this.inputView.on('change', this.sendFile, this);
            this.listView.on('remove', this.removeFile, this);
        }
    },

    /**
     * Store input element to pool.
     * @param {HTMLElement} input A input element[type=file] for store pool
     */
    store: function(input) {
        this._pool.store(input);
    },

    /**
     * Remove input element form pool.
     * @param {string} name The file name to remove
     */
    remove: function(name) {
        if (!utils.isSupportFormData()) {
            this._pool.remove(name);
        }
    }
});

ne.util.CustomEvents.mixin(Uploader);
module.exports = Uploader;