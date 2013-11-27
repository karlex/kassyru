goog.provide('kassy.rpc.BaseCommand');

goog.require('goog.crypt');
goog.require('goog.crypt.Sha1');
goog.require('goog.json');

goog.require('relief.rpc.Command');

/** @typedef {{ get:function(Array.<kassy.data.Model>) }} */
kassy.rpc.Response;

/** @typedef {{ name:string, attrs:Object.<string, *>, childs:(Array.<kassy.rpc.OptionsDataItem>|undefined) }} */
kassy.rpc.OptionsDataItem;

/** @typedef {{ module:string, data:Array.<kassy.rpc.OptionsDataItem>, success:function(kassy.rpc.Response), error:function() }} */
kassy.rpc.Options;

/**
 * @param {HTMLDocument} xml
 * @param {string} entityName
 * @param {function(new:kassy.data.Model, Object)} [opt_modelCtor]
 * @returns {Array.<kassy.data.Model>}
 */
kassy.rpc.getModelsFromXml = function(xml, entityName, opt_modelCtor) {
    var models = [];
    var elements = xml.getElementsByTagName(entityName);

    for (var i = 0; i < elements.length; i++) {
        var values = {};
        var element = elements[i];

        for (var j = 0; j < element.attributes.length; j++) {
            var attribute = element.attributes[j];
            values[attribute.name] = attribute.value;
        }

        if (goog.isFunction(opt_modelCtor)) {
            models.push(new opt_modelCtor(values));
        } else {
            models.push(values);
        }
    }

    return models;
};

/**
 * @param {Array.<kassy.data.Model>} models
 * @param {string=} opt_keyFieldName
 * @return {Object.<*, kassy.data.Model>};
 */
kassy.rpc.index = function(models, opt_keyFieldName) {
    var keyFieldName = (goog.isDef(opt_keyFieldName) ? opt_keyFieldName : 'id');
    var index = {};
    for (var i = 0; i < models.length; i++) {
        var model = models[i];
        index[model.get(keyFieldName)] = model;
    }
    return index;
};

/**
 * @param {Object.<string, string>} attrs
 * @returns {Array}
 */
kassy.rpc.params = function(attrs) {
    return [ { name: 'params', attrs: attrs } ]
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
     * @constructor
     * @extends {relief.rpc.Command}
     */
    kassy.rpc.BaseCommand = function(options) {
        this.request_ = {
            db: kassy.settings.getRegionId(),
            authId: kassy.settings.getAuthId(),
            authKey: kassy.settings.getAuthKey(),
            module: options.module,
            data: options.data
        };

        var url = 'https://api.kassy.ru/request/',
            method = 'POST';

        goog.base(this, options.success, options.error, this.request_.module + hash(), url, method, 0);
    };
    goog.inherits(kassy.rpc.BaseCommand, relief.rpc.Command);
    var BaseCommand = kassy.rpc.BaseCommand;

    /**
     * @inheritDoc
     */
    BaseCommand.prototype.getData = function() {
        var request = this.request_;

        var xml =
            '<?xml version="1.0" encoding="utf-8"?>' +
            '<request db="' + request.db + '" module="' + request.module + '" protocol="xml" version="3.0">';

        for (var i = 0; i < request.data.length; i++) {
            xml += this.itemToXml_(request.data[i]);
        }

        xml += '<auth id="' + request.authId + '" key="' + request.authKey + '" /></request>';

        var data = goog.Uri.QueryData.createFromMap({'request': xml}).toString();

        window.console.log('REQUEST:' + goog.string.urlDecode(data));

        return data;
    };

    /**
     * Callback for successful server requests.
     *
     * @param {goog.events.Event} event The COMPLETE event for the XHR Req.
     * @override
     */
    BaseCommand.prototype.onSuccess = function(event) {
        //window.console.log('RESPONSE:' + event.target.getResponseText());

        var xml = event.target.getResponseXml(),
            response = {
                get: goog.partial(kassy.rpc.getModelsFromXml, xml)
            },
            result = response.get('result')[0],
            resultCode = (result && goog.isDef(result['code']) ? ~~result['code'] : 0);

        window.console.log('result code: ' + resultCode);

        if (resultCode === 1) {
            this.callersOnSuccess(response);
        }
        else {
            this.callersOnFailure();
        }
    };


    /**
     * Callback for failed server responses.
     *
     * @param {goog.events.Event} event The COMPLETE event for the XHR Req.
     * @override
     */
    BaseCommand.prototype.onFailure = function(event) {
        this.callersOnFailure();
    };

    /**
     * @param {kassy.rpc.OptionsDataItem} item
     * @return {string}
     * @private
     */
    BaseCommand.prototype.itemToXml_ = function(item) {
        var xml = '<' + item.name;

        for (var key in item.attrs) {
            var value = item.attrs[key];
            if (goog.isDef(value)) {
                xml += ' ' + key + '="' + value + '"';
            }
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
});