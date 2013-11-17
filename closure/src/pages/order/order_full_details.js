/**
 * Дублирует kassy.handlers.OrderDetails, дополняя немного другой отображения:
 * описание мероприятия выводится полностью, а учреждение и время не выводится
 * @fileoverview
 */

goog.provide('kassy.handlers.OrderFullDetails');

goog.require('kassy.handlers.BaseHandler');
goog.require('kassy.views.order');
goog.require('kassy.data.IGo');

goog.scope(function() {
    /**
     * @param {kassy.ServiceProvider} sp The ServiceProvider.
     * @constructor
     * @extends {kassy.handlers.OrderDetails}
     */
    kassy.handlers.OrderFullDetails = function(sp) {
        goog.base(this, sp);
    };
    goog.inherits(kassy.handlers.OrderFullDetails, kassy.handlers.OrderDetails);
    var OrderFullDetails = kassy.handlers.OrderFullDetails;

    /**
     * @param { { show: kassy.data.ShowModel, posterUrl: string, date: string, building: kassy.data.BuildingModel, events: Array.<kassy.data.EventModel> } } order
     * @override
     * @private
     */
    OrderFullDetails.prototype.render_ = function(order) {
        order.full = true;
        return kassy.views.order.Details(order);
    };
});