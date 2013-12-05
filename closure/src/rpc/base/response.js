goog.provide('kassy.rpc.Response');

goog.scope(function() {
    /**
     * @param {HTMLDocument} xml
     * @constructor
     */
    kassy.rpc.Response = function(xml) {
        this.xml_ = xml;
    };
    var Response = kassy.rpc.Response;

    /**
     * @param {string} entityName
     * @param {function(new:kassy.data.Model, Object)} [opt_modelCtor]
     * @param {function((kassy.data.Model|Object.<string, string>)):boolean} [opt_filter]
     * @return {Array.<(kassy.data.Model|Object.<string, string>)>}
     */
    Response.prototype.get = function(entityName, opt_modelCtor, opt_filter) {
        return kassy.rpc.getModelsFromXml(this.xml_, entityName, opt_modelCtor, opt_filter);
    };

    /**
     * @param {HTMLDocument} xml
     * @param {string} entityName
     * @param {function(new:kassy.data.Model, Object)} [opt_modelCtor]
     * @param {function((kassy.data.Model|Object.<string, string>)):boolean} [opt_filter]
     * @return {Array.<(kassy.data.Model|Object.<string, string>)>}
     */
    kassy.rpc.getModelsFromXml = function(xml, entityName, opt_modelCtor, opt_filter) {
        var models = [];
        var elements = xml.getElementsByTagName(entityName);

        if (elements.length > 0) {
            var useModel = goog.isFunction(opt_modelCtor);
            var useFilter = goog.isFunction(opt_filter);

            var values = null;
            var element = null;
            var attribute = null;
            var model = null;

            for (var i = 0; i < elements.length; i++) {
                values = {};
                element = elements[i];

                for (var j = 0; j < element.attributes.length; j++) {
                    attribute = element.attributes[j];
                    values[attribute.name] = attribute.value;
                }

                model = (useModel ? new opt_modelCtor(values) : values);

                if ( !useFilter || opt_filter(model) ) {
                    models.push(model);
                }
            }
        }

        return models;
    };
});