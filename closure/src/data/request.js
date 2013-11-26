goog.provide('kassy.data.Command');

goog.scope(function() {
    /**
     * @param {{db, module:string}} request
     * @param {{model, params, items}} data
     * @param {function(Object)=} response
     * @param {{id, key}=} auth
     * @constructor
     */
    kassy.data.Command = function(request, data, response, auth) {
        this.request = { db: kassy.settings.getRegionId(), module: '' };
        goog.object.extend(this.request, request);

        this.auth = { id: kassy.settings.getAuthId(), key: kassy.settings.getAuthKey() };
        if (auth) {
            goog.object.extend(this.auth, auth);
        }

        this.data = data;

        this.response = response;
    };
    var Command = kassy.data.Command;

    Command.prototype.itemToXml_ = function(item) {
        var tagName = item.model;

        var childrens = item.items ? item.items : [];

        var attributes = [];
        for (var key in item.params) {
            attributes.push(key + '="' + item.params[key] + '"');
        }

        var xml = '<' + tagName + ' ' + attributes.join(' ');

        if (childrens.length > 0) {
            xml += '>' + goog.array.reduce(childrens, function(xml, item) {
                            return xml + this.itemToXml_(item);
                         }, '', this) +
                         '</' + tagName + '>';
        } else {
            xml += '/>'
        }

        return xml;
    };

    Command.prototype.toXml = function() {
        return '<?xml version="1.0" encoding="utf-8"?>' +
            '<request db="' + this.request.db + '" module="' + this.request.module + '" protocol="json" version="3.0">' +
            this.itemToXml_(this.data) +
            '<auth id="' + this.auth.id + '" key="' + this.auth.key + '" />' +
            '</request>';
    };

    /**
     * @param {kassy.data.Command} cmd
     */
    kassy.data.execute = function(cmd) {
        var url = 'https://api.kassy.ru/request/';
        var request = cmd.toXml();

        window.console.log('EXEC REQUEST: ' + request);

        var params = goog.Uri.QueryData.createFromMap({'request': request}).toString();
        var headers = {'Content-Type': 'application/x-www-form-urlencoded'};
        var callback = goog.partial(function(response, e) {
            /**
             * @type {goog.net.XhrIo}
             */
            var xhr = e.target;

            if (!xhr.isComplete()) {
                window['offlineAlert']();
            }

            window.console.log('RESPONSE: ' + xhr.getResponseText());
            window.console.log('RESPONSE IS SUCCESS: ' + xhr.isSuccess());

            try {
                var jsResp = xhr.getResponseJson(),
                    jsResult = jsResp['result'],
                    jsData = jsResp['data'],
                    jsErrors = jsData['errors'];

                if (goog.isFunction(response)) {
                    if (xhr.isSuccess()) {
                        response(jsData, jsErrors, jsResult);
                    } else {
                        response(null, jsErrors, jsResult);
                    }
                }
            }
            catch(ex) {
                window.console.log('RESPONSE: Invalid JSON format');

                response(null, [
                    {'code': '500', 'message': 'На сервере произошла ошибка'}
                ], null);
            }

        }, cmd.response);

        goog.net.XhrIo.send(url, callback, 'POST', params, headers, 0, true);
    };
});

/* success json = {db, module: "login", result: {
 code: "1",
 message: "",
 data: {
 result_code: "1",
 errors: null(!),
 token: "123abc"
 }
 }}*/

/* error json = {db, module: "login", result: {
 code: "0",
 message: "",
 data: {
 result_code: "0",
 errors: [{code: "30", message: ""}],
 token: null(!)
 }
 }}*/