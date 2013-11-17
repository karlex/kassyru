goog.provide('kassy.data.CreateOrder');

goog.require('kassy.data.Command');

goog.scope(function() {
    /**
     * @param {number} eventId
     * @param {Array.<number>} placeIds
     * @param {function((number|null))} callback
     * @constructor
     * @extends {kassy.data.Command}
     */
    kassy.data.CreateOrder = function(eventId, placeIds, callback) {
        var expire = Date.now() / 1000 + 60 * 60 * 24 * 3;
        goog.base(this, {module: 'order_create'},
            {
                model: 'params',
                params: { /*'client_id': '1783',*/ 'expire': expire, 'description': "Описание" },
                items: [
                    {
                        model: 'event',
                        params: { 'id': eventId },
                        items: goog.array.map(placeIds, function(placeId) {
                            return {
                                model: 'place',
                                params: { 'id': placeId /*, 'tariff_id': '1'*/ }
                            };
                        })
                    }
                ]
            },
            function(jsData) {
                callback((jsData !== null ? jsData['order_id'] : null));
            }
        );
    };
    goog.inherits(kassy.data.CreateOrder, kassy.data.Command);
});