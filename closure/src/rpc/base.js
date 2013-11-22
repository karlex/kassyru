goog.provide('kassy.rpc.BaseCommand');

goog.require('goog.crypt');
goog.require('goog.crypt.Sha1');
goog.require('goog.json');

goog.require('relief.rpc.Command');

/** @typedef {{ name:string, attrs:Object.<string, *>, childs:(Array.<kassy.rpc.OptionsDataItem>|undefined) }} */
kassy.rpc.OptionsDataItem;

/** @typedef {{ module:string, data:Array.<kassy.rpc.OptionsDataItem>, success:function(Object), error:function() }} */
kassy.rpc.Options;

/**
 * @param {Array.<Object>} rows
 * @param {function(new:kassy.data.Model, Object)} ctor
 * @return {Array.<kassy.data.Model>}
 */
kassy.rpc.map = function(rows, ctor) {
    var models = [];

    if (goog.isArray(rows)) {
        for (var i = 0; i < rows.length; i++) {
            models.push(new ctor(rows[i]));
        }
    }

    return models;
};

/**
 * @return {number}
 * @private
 */
kassy.rpc.nextHash_ = (function() {
    var i = 0;
    return function() { return i++; };
})();

goog.scope(function() {
    var hash = kassy.rpc.nextHash_;

    /**
     * @param {kassy.rpc.Options} options
     * @param {function(goog.net.XhrIo)} onSuccess
     * @param {function(goog.net.XhrIo)} onFailure
     * @constructor
     * @extends {relief.rpc.Command}
     */
    kassy.rpc.BaseCommand = function(options, onSuccess, onFailure) {
        this.request_ = {
            db: kassy.settings.getRegionId(),
            authId: kassy.settings.getAuthId(),
            authKey: kassy.settings.getAuthKey(),
            module: options.module,
            data: options.data
        };

        var url = 'https://api.kassy.ru/request/',
            method = 'POST';

        goog.base(this, onSuccess, onFailure, this.request_.module + hash(), url, method, 0);

        /*this.isUpdate_ = !!options.isUpdate;
        this.writeToCache = true;*/
    };
    goog.inherits(kassy.rpc.BaseCommand, relief.rpc.Command);
    var BaseCommand = kassy.rpc.BaseCommand;

    /**
     * Create a Sha1 checksum of the post contents.
     *
     * @param {Object} post The post to hash.
     * @return {string} The resulting 20-byte hexadecimal (uppercase) checksum.
     * @private
     */
    BaseCommand.prototype.hashPost_ = function(post) {
        var sha = new goog.crypt.Sha1();
        sha.update(post.getContent());
        var hash = sha.digest();
        return goog.crypt.byteArrayToHex(hash).toUpperCase();
    };

    /**
     * @inheritDoc
     */
    BaseCommand.prototype.getData = function() {
        var request = this.request_;

        var xml =
            '<?xml version="1.0" encoding="utf-8"?>' +
            '<request db="' + request.db + '" module="' + request.module + '" protocol="xml" version="3.0">' +
            this.itemToXml_(request.data) +
            '<auth id="' + request.authId + '" key="' + request.authKey + '" />' +
            '</request>';

        return goog.Uri.QueryData.createFromMap({'request': xml}).toString();
    };

    /**
     * @param {} item
     * @return {string}
     * @private
     */
    BaseCommand.prototype.itemToXml_ = function(item) {
        var xml = '<' + item.name;

        for (var key in item.attrs) {
            xml += ' ' + key + '="' + item.attrs[key] + '"';
        }

        if (goog.isArray(item.childs) && item.childs.length > 0) {
            xml += '>';

            for (var i = 0; i < item.childs.length; i++) {
                xml += this.itemToXml_(item.childs[i]);
            }

            xml += '</' + item.name + '>';
        } else {
            xml += '/>'
        }

        return xml;
    };

    /**
     * Callback for successful server requests.
     *
     * @param {goog.net.XhrManager.Event} event The COMPLETE event for the XHR Req.
     * @override
     */
    BaseCommand.prototype.onSuccess = function(event) {
        var resp = event.target.getResponseXml(),
            status = resp['status'];

        if (status === BaseCommand.Response.SUCCESS) {
            var slug = resp['slug'];
            this.post_.setSlug(slug);
            this.callersOnSuccess(slug);
        }
        else {
            this.callersOnFailure(resp);
        }
    };


    /**
     * Callback for failed server responses.
     *
     * @param {goog.net.XhrManager.Event} event The COMPLETE event for the XHR Req.
     * @override
     */
    BaseCommand.prototype.onFailure = function(event) {
        /** @preserveTry */
        try {
            var resp = event.target.getResponseXml();
        }
        catch (e) {
            this.callersOnFailure(BaseCommand.Response.UNKNOWN_ERROR);
            return;
        }

        this.callersOnFailure(resp['status']);
    };


    /*
     * @return {Array.<string>} The unique slug for this post, which is used as a
     * key name on the server.
     *
     * @override
     */
    /*BaseCommand.prototype.getCacheKeys = function() {
        var key = this.post_.getCacheKey();
        if (key) {
            return [key];
        }
        else {
            return [];
        }
    };/*


    /*
     * @return {Array.<{key: string, value: rb.post.BlogPost}>} An array of cache
     *    key/value pairs.
     * @override
     */
    /*BaseCommand.prototype.getCacheValues = function() {
        var post = this.post_;
        return [{
            key: post.getCacheKey(),
            value: post
        }];
    };*/
});