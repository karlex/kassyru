goog.provide('kassy.data.UnlockPlace');

goog.require('kassy.data.Command');

goog.scope(function() {
    /**
     * @param {number} eventId
     * @param {Array.<number>} placeIds
     * @constructor
     * @extends {kassy.data.Command}
     */
    kassy.data.UnlockPlace = function(eventId, placeIds) {
        goog.base(this, { module: 'place_unlock' },
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
            }
        );
    };
    goog.inherits(kassy.data.UnlockPlace, kassy.data.Command);
});