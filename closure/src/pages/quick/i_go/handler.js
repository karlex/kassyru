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
        var defs = [new Def(), new Def(), new Def(), new Def(), new Def(), new Def()];

        this.iGo_.toArray(function(rows) {
            goog.array.sort(rows, function(a, b) { return a.date - b.date; });
            defs[0].callback(rows);
        });

        // После получения списка "Я пойду", запрашиваем список соответствующих событий
        defs[0].addCallback(function(iGoRows) {
            this.loadEvents_(iGoRows, function(events) { defs[1].callback(events); });
        }, this);

        // После получения списка событий, запрашиваем индекс только необходимых(!) зрелищь
        defs[1].addCallback(function(events) {
            var showIds = goog.array.map(events, function(event) { return event.showId; });
            this.data_.findShows(showIds, function(shows, showIndex) { defs[2].callback(showIndex); });

            var eventIds = goog.array.map(events, function(event) { return event.id; });
            this.findOrders_(eventIds, function(orderIndex) { defs[5].callback(orderIndex); })
        }, this);

        this.data_.findHall(null, function(halls, hallIndex) { defs[3].callback(hallIndex); });
        this.data_.findBuilding(null, function(buildings, buildingIndex) { defs[4].callback(buildingIndex); });

        this.barrier_ = new goog.async.DeferredList(defs);
        this.barrier_.addCallback(function(results) {
            var events = results[1][1],
                showIndex = results[2][1],
                hallIndex = results[3][1],
                buildingIndex = results[4][1],
                orderIndex = results[5][1];

            this.show_(events, showIndex, hallIndex, buildingIndex, orderIndex);
        }, this);
    };

    IGo.prototype.findOrders_ = function(eventIds, callback) {
        window.console.log('ORDER IDS: ' + goog.debug.expose(eventIds));

        var defs = goog.array.map(eventIds, function(eventId) {
            var def = new goog.async.Deferred();
            this.orders_.findByEventId(eventId, function(orders) {
                window.console.log('ORDERS: ' + goog.debug.expose(orders));
                def.callback(orders);
            });

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

            window.console.log('ORDER INDEX: ' + goog.debug.expose(orderIndex));

            callback(orderIndex);
        }.bind(this));
    };

    /**
     * @param {Array.<kassy.data.IGoItem>} iGoRows
     * @param {function(Array.<kassy.data.EventModel>)} callback
     * @private
     */
    IGo.prototype.loadEvents_ = function(iGoRows, callback) {
        var defs = goog.array.map(iGoRows, function(iGoRow) {
            var def = new goog.async.Deferred();

            var params = {
                'show_id': iGoRow.showId,
                'date_from': iGoRow.date * 86400,
                'date_to': (iGoRow.date + 1) * 86400 - 1
            };

            this.data_.find('event', 'id', params, def.callback.bind(def));

            return def;
        }.bind(this));

        var barrier = new goog.async.DeferredList(defs);
        barrier.addCallback(function(results) {

            // Список непустых результатов
            var nonemptyResults = goog.array.filter(results, function(result) { return result[1].length > 0; });

            // Одномерный список событий
            var events = goog.array.map(nonemptyResults, function(result) {
                var events = result[1]; // Список событий для одного шоу за весь день
                return events[0]; // Нам нужно только одно событие, разное время нам не важно
            });

            callback(events);
        });
    };

    IGo.prototype.show_ = function(events, showIndex, hallIndex, buildingIndex, orderIndex) {
        var dateFormat = kassy.utils.groupDateFormat;

        var days = [];
        var lastDay = null;
        var currGroupVal = -1;

        goog.array.forEach(events, function(event) {
            if (!event) return;

            var groupVal = Math.floor(event.dateTime / 86400);

            if (groupVal != currGroupVal) {
                currGroupVal = groupVal;
                days.push(lastDay = {date: dateFormat(event.dateTime), rawDate: event.dateTime, events: []});
            }

            var show = showIndex[event.showId];
            var hall = hallIndex[event.hallId];
            var order = orderIndex[event.id];
            if (show && hall) {
                var building = buildingIndex[hall.buildingId];
                if (building) {
                    lastDay.events.push({show: show, building: building, order: order});
                }
            }
        });

        this.setContentText(kassy.views.igo.List({ days: days }));
        this.setScroll();

        var removableEls = goog.dom.getElementsByClass('list-item_removable', this.getContentElement());
        goog.array.forEach(removableEls, function(removableEl) {
            kassy.ui.gesture.listenSwipe(this.handler, removableEl, this.onRemoveGesture_.bind(this));
        }, this);
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
            this.iGo_.remove({
                showId: ~~removableEl.getAttribute('data-show-id'),
                buildingId: ~~removableEl.getAttribute('data-building-id'),
                date: ~~removableEl.getAttribute('data-date')
            });
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