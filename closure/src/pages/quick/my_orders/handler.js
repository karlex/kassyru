/**
 * @fileoverview
 */

goog.provide('kassy.handlers.MyOrders');

goog.require('kassy.handlers.BaseHandler');
goog.require('kassy.views.myorders');
goog.require('kassy.data.MyOrders');
goog.require('kassy.data.CancelOrder');

goog.require('kassy.mock.MyOrders');

goog.scope(function() {
    /**
     * @param {kassy.ServiceProvider} sp The ServiceProvider.
     * @constructor
     * @extends {kassy.handlers.BaseHandler}
     */
    kassy.handlers.MyOrders = function(sp) {
        goog.base(this, sp);
    };
    goog.inherits(kassy.handlers.MyOrders, kassy.handlers.BaseHandler);
    var MyOrders = kassy.handlers.MyOrders;

    /** @override */
    MyOrders.prototype.handle_ = function(path) {
        this.setContentTitle('Мои заказы');

        this.myOrders_ = new kassy.data.MyOrders();

        this.myOrders_.toArray(function(myOrders) {
            var data = this.data_;
            var defs = goog.array.map(myOrders, function(myOrder) {
                var eventDef = new goog.async.Deferred();
                var placesDef = new goog.async.Deferred();
                var showDef = new goog.async.Deferred();
                var buildingDef = new goog.async.Deferred();
                var barrier = new goog.async.DeferredList([eventDef, placesDef, showDef, buildingDef]);
                data.findEvent(myOrder.eventId, eventDef.callback.bind(eventDef));
                eventDef.addCallback(function(events) {
                    if (events.length > 0) {
                        var event = events[0];
                        data.findEventPlaces(event.id, function(places, placeIndex) {
                            var eventPlaces = goog.array.map(myOrder.placeIds, function(placeId) {
                                return placeIndex[placeId];
                            });
                            placesDef.callback(eventPlaces);
                        });
                        data.findShow(event.showId, showDef.callback.bind(showDef));
                        data.findHall(null, function(halls, hallIndex) {
                            var hall = hallIndex[event.hallId];
                            if (hall) {
                                data.findBuildingById(hall.buildingId, buildingDef.callback.bind(buildingDef));
                            }
                            else {
                                buildingDef.callback([]);
                            }
                        });
                    }
                });
                return barrier;
            });

            var barrier = new goog.async.DeferredList(defs);
            barrier.addCallback(function(ordersResults) {
                var orders = goog.array.map(ordersResults, function(orderResults) {
                    var orderResult = orderResults[1],
                        events = orderResult[0][1],
                        places = orderResult[1][1],
                        shows = orderResult[2][1],
                        buildings = orderResult[3][1];

                    if (events.length > 0 && shows.length > 0 && buildings.length > 0) {
                        return {
                            time: kassy.utils.formatDDMMMM(events[0].dateTime) + ', ' + events[0].timeHHMM,
                            show: shows[0],
                            building: buildings[0],
                            ticket: {
                                count: places.length + ' ' + kassy.utils.declOfNum(places.length, 'билет', 'билета', 'билетов'),
                                total: goog.array.reduce(places, function(a, place) {
                                    return a + (place ? place.price : 0);
                                }, 0)
                            }
                        }
                    }
                    else {
                        return null;
                    }
                });

                var filteredOrders = goog.array.filter(orders, function(order) { return order !== null });

                this.showOrders_(filteredOrders);

            }.bind(this));
        }.bind(this));

        //this.showOrders_(kassy.mock.MyOrders);
    };

    /**
     * @param {Array.<{time, show, building, ticket: { count, total }}>} orders
     */
    MyOrders.prototype.showOrders_ = function(orders) {
        this.setContentText(kassy.views.myorders.List({orders: orders}));
        this.setScroll();

        /*this.handler.listen(this.getContentElement(), goog.events.EventType.CLICK, function(e) {
            if (goog.dom.classes.has(e.target, 'cancel-order')) {

                var orderId = ~~e.target.getAttribute('data-order-id');
                kassy.data.execute(new kassy.data.CancelOrder(orderId));

                //this.myOrders_.remove(orderId);

                var orderEl = goog.dom.getAncestorByClass(e.target, 'order');
                goog.dom.removeNode(orderEl);
            }
        });*/
    };

    /** @override */
    MyOrders.prototype.disposeInternal = function() {

    };
});