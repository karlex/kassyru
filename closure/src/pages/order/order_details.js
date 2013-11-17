/**
 * @fileoverview
 */

goog.provide('kassy.handlers.OrderDetails');

goog.require('kassy.handlers.BaseHandler');
goog.require('kassy.views.order');
goog.require('kassy.data.IGo');

goog.require('goog.ui.Dialog');

goog.scope(function() {
    /**
     * @param {kassy.ServiceProvider} sp The ServiceProvider.
     * @constructor
     * @extends {kassy.handlers.BaseHandler}
     */
    kassy.handlers.OrderDetails = function(sp) {
        goog.base(this, sp);

        /**
         * @type {goog.async.DeferredList}
         * @private
         */
        this.barrier_ = null;
    };
    goog.inherits(kassy.handlers.OrderDetails, kassy.handlers.BaseHandler);
    var OrderDetails = kassy.handlers.OrderDetails;

    /** @override */
    OrderDetails.prototype.handle_ = function(path) {
        this.setContentTitle('Заказ');

        var params = path.params.split('/'),
            showId = ~~params[0],
            buildingId = ~~params[1],
            eventDate = ~~params[2];

        this.loadAndShow_(showId, buildingId, eventDate);
    };

    /**
     * @param {number} showId
     * @param {number} buildingId
     * @param {number} eventDate - seconds
     */
    OrderDetails.prototype.loadAndShow_ = function(showId, buildingId, eventDate) {
        this.showId_ = showId;
        this.buildingId_ = buildingId;
        this.eventDate_ = eventDate;

        var Def = goog.async.Deferred;
        var defs = [new Def(), new Def(), new Def(), new Def()];

        var dateFrom = new goog.date.Date();
        dateFrom.setTime(eventDate * 1000);
        var dateTo = dateFrom.clone();
        dateTo.add(new goog.date.Interval(goog.date.Interval.DAYS, 1));

        var data = this.data_;
        data.findEvents(dateFrom, dateTo, function(events, eventIndex) { defs[0].callback(events); });
        // После получения списка событий, запрашиваем индекс только необходимых(!) зрелищь
        defs[0].addCallback(function(events) {
            var showIds = goog.array.map(events, function(event) { return event.showId; });
            data.findShows(showIds, function(shows, showIndex) { defs[1].callback(showIndex); });
        });
        data.findHall(null, function(halls, hallIndex) { defs[2].callback(hallIndex); });
        data.findBuilding(null, function(buildings, buildingIndex) { defs[3].callback(buildingIndex); });

        this.barrier_ = new goog.async.DeferredList(defs);
        this.barrier_.addCallback(function(results) {
            var events = results[0][1],
                showIndex = results[1][1],
                hallIndex = results[2][1],
                buildingIndex = results[3][1],
                order = {
                    show: showIndex[showId],
                    date: kassy.utils.groupDateFormat(eventDate),
                    dateRaw: eventDate,
                    building: buildingIndex[buildingId],
                    events: goog.array.filter(events, goog.partial(this.eventFilterFn_, showId, buildingId, hallIndex))
                };

            goog.array.sort(order.events, function(a, b) {
                var diff = a.hallId - b.hallId;
                return (diff != 0 ? diff : a.dateTime - b.dateTime);
            });

            kassy.ui.downloadFile(order.show.image, function(fullPath) {

                order.posterUrl = fullPath;

                this.getIGo_( this.show_.bind(this, order) );

            }.bind(this), true);
        }, this);
    };

    /**
     * @param {number} showId
     * @param {number} buildingId
     * @param {Array.<kassy.data.HallModel>} hallIndex
     * @param {kassy.data.EventModel} event
     * @return {boolean}
     * @private
     */
    OrderDetails.prototype.eventFilterFn_ = function(showId, buildingId, hallIndex, event) {
        if (event.showId == showId) {
            var hall = hallIndex[event.hallId];
            if (hall instanceof kassy.data.HallModel && hall.buildingId == buildingId) {
                event.hall = hall;
                return true;
            }
        }

        return false;
    };

    /**
     * @param {{ show: kassy.data.ShowModel, posterUrl: string, date: string, building: kassy.data.BuildingModel, events: Array.<kassy.data.EventModel> }} order
     * @param {boolean} iGoChecked
     * @private
     */
    OrderDetails.prototype.show_ = function(order, iGoChecked) {
        this.setContentText(this.render_(order));
        this.setScroll();

        this.handler.listen(this.getContentElement(), goog.events.EventType.CLICK, function(e) {
            if (goog.dom.classes.has(e.target, 'poster')) {
                var dlg = new goog.ui.Dialog();
                var style = dlg.getContentElement().style;
                style.backgroundImage = 'url(' + e.target.src + ')';
                style.backgroundSize = 'contain';
                style.backgroundPosition = 'center center';
                style.backgroundRepeat = 'no-repeat';
                style.position = 'absolute';
                style.left = style.right = style.top = style.bottom = '5%';

                dlg.setButtonSet(null);
                dlg.setDisposeOnHide(true);
                dlg.setVisible(true);

                e.stopPropagation();
                
                var fn = function() {
                    if (dlg.isVisible()) {
                        dlg.setVisible(false);
                    }
                };

                goog.events.listenOnce(dlg.getContentElement(), goog.events.EventType.CLICK, fn);
                goog.events.listenOnce(dlg.getBackgroundElement(), goog.events.EventType.CLICK, fn);
            }
        }, false, this);

        // TODO: read IGo from list to this checkbox
        var iGoEl = goog.dom.getElementByClass('checkbox', this.getContentElement());

        goog.dom.classes.enable(iGoEl, 'checked', iGoChecked);

        this.handler.listen(iGoEl, goog.events.EventType.CLICK, function() {
            // Состояние checkbox после(!) переключения
            var checked = !goog.dom.classes.has(iGoEl, 'checked');

            goog.dom.classes.enable(iGoEl, 'checked', checked);

            this.setIGo_(checked);
        }, false, this);
    };

    /**
     * @param { { show: kassy.data.ShowModel, posterUrl: string, date: string, building: kassy.data.BuildingModel, events: Array.<kassy.data.EventModel> } } order
     * @protected
     */
    OrderDetails.prototype.render_ = function(order) {
        return kassy.views.order.Details(order);
    };

    /**
     * @param {function(boolean)} callback
     * @private
     */
    OrderDetails.prototype.getIGo_ = function(callback) {
        if (goog.isNumber(this.showId_) && goog.isNumber(this.buildingId_) && goog.isNumber(this.eventDate_)) {
            var iGo = this.iGo_;
            if (!iGo) {
                this.iGo_ = iGo = new kassy.data.IGo();
            }

            iGo.contain({showId: this.showId_, buildingId: this.buildingId_, date: this.eventDate_}, callback);
        } else {
            callback(false);
        }
    };

    /**
     * @param {boolean} checked
     * @private
     */
    OrderDetails.prototype.setIGo_ = function(checked) {
        if (goog.isNumber(this.showId_) && goog.isNumber(this.buildingId_) && goog.isNumber(this.eventDate_)) {

            var item = {showId: this.showId_, buildingId: this.buildingId_, date: this.eventDate_};

            var iGo = this.iGo_;
            if (!iGo) {
                this.iGo_ = iGo = new kassy.data.IGo();
            }

            if (checked) {
                iGo.add(item);
            } else {
                iGo.remove(item);
            }
        }
    };

    /** @override */
    OrderDetails.prototype.disposeInternal = function() {
        if (this.barrier_) {
            this.barrier_.cancel(true);
        }

        this.barrier_ = null;
    }
});