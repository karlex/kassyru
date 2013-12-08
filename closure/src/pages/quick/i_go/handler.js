/**
 * @fileoverview
 */

goog.provide('kassy.handlers.IGo');

goog.require('kassy.handlers.BaseHandler');
goog.require('kassy.views.igo');
goog.require('goog.style');

goog.require('kassy.ui.gesture');

goog.scope(function() {
    /**
     * @param {kassy.ServiceProvider} sp The ServiceProvider.
     * @constructor
     * @extends {kassy.handlers.BaseHandler}
     */
    kassy.handlers.IGo = function(sp) {
        goog.base(this, sp);
    };
    goog.inherits(kassy.handlers.IGo, kassy.handlers.BaseHandler);
    var IGo = kassy.handlers.IGo;

    /** @override */
    IGo.prototype.handle_ = function(path) {
        this.setContentTitle('Я пойду');

        this.iGo_ = new kassy.data.IGo();
        this.orders_ = new kassy.data.MyOrders();

        this.loadAndShow_();
    };

    IGo.prototype.loadAndShow_ = function() {
        var Def = goog.async.Deferred;
        var defs = [new Def(), new Def(), new Def()];

        this.iGo_.toArray(function(rows) {
            //goog.array.sort(rows, function(a, b) { return a.date - b.date; });
            defs[0].callback(rows);
        });

        // После получения списка "Я пойду", запрашиваем список соответствующих событий и заказов
        defs[0].addCallback(function(iGoRows) {
            this.loadEvents_(iGoRows, function(events) { defs[1].callback(events); });
            this.findOrders_(iGoRows, function(orderIndex) { defs[2].callback(orderIndex); })
        }, this);

        this.barrier_ = new goog.async.DeferredList(defs);
        this.barrier_.addCallback(function(results) {
            var events = results[1][1],
                orderIndex = results[2][1];

            this.show_(events, orderIndex);
        }, this);
    };

    /**
     * @param {Array.<kassy.rpc.EventHallType>} eventHalls
     * @param {Object.<number, kassy.data.MyOrderItem>} orderIndex
     * @private
     */
    IGo.prototype.show_ = function(eventHalls, orderIndex) {
        var days = [];
        var lastDay = null;
        var currGroupVal = -1;

        goog.array.forEach(eventHalls, function(eventHall) {
            var groupVal = eventHall.event.date;

            if (groupVal != currGroupVal) {
                currGroupVal = groupVal;
                days.push(lastDay = {date: eventHall.event.date, events: []});
            }

            var order = orderIndex[eventHall.event.id];
            lastDay.events.push({id: eventHall.event.id, show: eventHall.show, building: eventHall.building, order: order});
        });

        this.setContentText(kassy.views.igo.List({ days: days }));
        this.setScroll();

        var removableEls = goog.dom.getElementsByClass('list-item_removable', this.getContentElement());
        goog.array.forEach(removableEls, function(removableEl) {
            kassy.ui.gesture.listenSwipe(this.handler, removableEl, this.onRemoveGesture_.bind(this));
        }, this);
    };

    /**
     * @param {Array.<kassy.data.IGoItem>} iGoRows
     * @param {function(Object.<number, kassy.data.MyOrderItem>)} callback
     * @private
     */
    IGo.prototype.findOrders_ = function(iGoRows, callback) {
        var defs = goog.array.map(iGoRows, function(iGoRow) {
            var def = new goog.async.Deferred();
            this.orders_.findByEventId(iGoRow.eventId, def.callback.bind(def));
            return def;
        }.bind(this));

        var barrier = new goog.async.DeferredList(defs);
        barrier.addCallback(function(results) {
            var orderIndex = goog.array.reduce(results, function(index, result) {
                var orders = result[1];
                if (orders.length > 0) {
                    var order = orders[0];
                    index[order.eventId] = order;
                }

                return index;
            }, {});

            callback(orderIndex);
        }.bind(this));
    };

    /**
     * @param {Array.<kassy.data.IGoItem>} iGoRows
     * @param {function(Array.<kassy.rpc.EventHallType>)} callback
     * @private
     */
    IGo.prototype.loadEvents_ = function(iGoRows, callback) {
        var defs = goog.array.map(iGoRows, function(iGoRow) {
            var def = new goog.async.Deferred();

            this.executeRPC(new kassy.rpc.GetEventHall({
                eventId: iGoRow.eventId,
                response: def.callback.bind(def)
            }));

            return def;
        }.bind(this));

        var barrier = new goog.async.DeferredList(defs);
        barrier.addCallback(function(results) {

            // Список непустых результатов
            var nonemptyResults = goog.array.filter(results, function(result) { return result[1] !== null; });

            var events = goog.array.map(nonemptyResults, function(result) {
                /** @type {kassy.rpc.EventHallType} */
                var eventHall = result[1];
                var timezone = eventHall.subdivision.tz;
                eventHall.event.date = kassy.utils.moment(eventHall.event.dateTime, timezone, 'D MMMM, dddd');
                eventHall.event.time = kassy.utils.moment(eventHall.event.dateTime, timezone, 'HH:mm');
                return eventHall;
            });

            callback(events);
        });
    };

    /**
     * @param { {target:Element, direction:kassy.ui.gesture.Direction} } e
     * @private
     */
    IGo.prototype.onRemoveGesture_ = function(e) {
        var removableEl = e.target;
        var contentHolderEl = goog.dom.getParentElement(this.getContentElement());
        var removablePosition = goog.style.getRelativePosition(removableEl, contentHolderEl);

        var removeBtnEl = goog.dom.createDom('div', {
            'class': 'small_button s_i',
            'style': 'right:20px;'
        });

        var lockerEl;
        this.lockerEl_ = lockerEl = goog.dom.createDom('div', {
            'style': 'position:absolute; left:0; top:0; width:100%; height:100%; z-index:999;'
        }, removeBtnEl);

        this.handler.listen(lockerEl, goog.events.EventType.TOUCHSTART, function(lockerEl, e) {
            if (!goog.dom.classes.has(e.target, 'small_button')) {
                goog.dom.removeNode(lockerEl);
            }
        }.bind(this, lockerEl));

        this.handler.listen(removeBtnEl, goog.events.EventType.CLICK, function(removableEl, lockerEl, e) {
            this.iGo_.remove({ eventId: ~~removableEl.getAttribute('data-event-id') });
            goog.dom.removeNode(removableEl);
            goog.dom.removeNode(lockerEl);
        }.bind(this, removableEl, lockerEl));

        contentHolderEl.appendChild(lockerEl);

        removeBtnEl.style.top = removablePosition.y + (removableEl.offsetHeight - removeBtnEl.offsetHeight) / 2 + 'px';
    };

    /** @override */
    IGo.prototype.disposeInternal = function() {
        if (this.lockerEl_) {
            goog.dom.removeNode(this.lockerEl_);
        }

        this.lockerEl_ = null;
    };
});