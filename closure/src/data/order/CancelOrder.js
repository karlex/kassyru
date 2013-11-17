goog.provide('kassy.data.CancelOrder');

goog.require('kassy.data.Command');

goog.scope(function() {
    /**
     * @param {number} orderId
     * @constructor
     * @extends {kassy.data.Command}
     */
    kassy.data.CancelOrder = function(orderId) {
        goog.base(this, {module: 'order_cancel'},
            {
                model: 'params',
                params: { 'id': orderId }
            }
        );
    };
    goog.inherits(kassy.data.CancelOrder, kassy.data.Command);
});