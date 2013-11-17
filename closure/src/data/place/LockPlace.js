goog.provide('kassy.data.LockPlace');

goog.require('kassy.data.Command');

goog.scope(function() {
    /**
     * @param {number} eventId
     * @param {Array.<number>} placeIds
     * @param {function(Object, Object)} response
     * @constructor
     * @extends {kassy.data.Command}
     */
    kassy.data.LockPlace = function(eventId, placeIds, response) {
        goog.base(this, { module: 'place_lock' },
            {
                model: 'params',
                items: [
                    {
                        model: 'event',
                        params: { 'id': eventId },
                        items: goog.array.map(placeIds, function(placeId) {
                            return {
                                model: 'place',
                                params: { 'id': placeId }
                            };
                        })
                    }
                ]
            },
            function(data, errors) {
                window.console.log('LOCK PLACE RESULT: ' + goog.debug.expose(data));
                response(data, errors);
            }
        );
    };
    goog.inherits(kassy.data.LockPlace, kassy.data.Command);
});