/**
 * @fileoverview
 */

goog.provide('kassy.handlers.MovieRecommend');

goog.require('kassy.handlers.BaseHandler');
goog.require('kassy.ui.SearchField');
goog.require('kassy.views.movie');
goog.require('kassy.utils');

goog.require('goog.string');
goog.require('goog.date.Date');
goog.require('goog.date.Interval');

goog.scope(function() {
    /**
     * @param {kassy.ServiceProvider} sp The ServiceProvider.
     * @constructor
     * @extends {kassy.handlers.BaseHandler}
     */
    kassy.handlers.MovieRecommend = function(sp) {
        goog.base(this, sp);

        /**
         * @type {goog.async.Deferred}
         * @private
         */
        this.barrier_ = null;

        /**
         * @type {Array.<kassy.data.EventModel>}
         * @private
         */
        this.events_ = null;
    };
    goog.inherits(kassy.handlers.MovieRecommend, kassy.handlers.BaseHandler);
    var MovieRecommend = kassy.handlers.MovieRecommend;

    /** @override */
    MovieRecommend.prototype.handle_ = function(path) {
        this.setContentTitle('Рекомендуем');

        this.searchField_ = new kassy.ui.SearchField(this.getContentElement());
        this.handler.listen(this.searchField_, goog.events.EventType.CHANGE, this.onSearch_, false, this);

        this.loadAndShow_();
    };

    MovieRecommend.prototype.loadAndShow_ = function() {
        var Def = goog.async.Deferred;
        var defs = [new Def(), new Def()];

        var data = this.data_;
        data.findEvents(null, null, function(events, eventIndex) { defs[0].callback(events); });
        // После получения списка событий, запрашиваем индекс только необходимых(!) зрелищь
        defs[0].addCallback(function(events) {
            var showIds = goog.array.map(events, function(event) { return event.showId; });
            data.findShows(showIds, function(shows, showIndex) { defs[1].callback(showIndex); });
        });

        this.barrier_ = new goog.async.DeferredList(defs);
        this.barrier_.addCallback(function(results) {
            var events = results[0][1];
            var showIndex = results[1][1];

            var filteredEvents = [];

            goog.array.forEach(events, function(event) {
                if (event.state >= 0 && event.isRecommend) {
                    var show = showIndex[event.showId];
                    if (show instanceof kassy.data.ShowModel) {
                        var extEvent = goog.object.clone(event);
                        extEvent.show = goog.object.clone(show);
                        filteredEvents.push(extEvent);
                    }
                }
            });

            this.events_ = filteredEvents;
            this.show_(filteredEvents);
        }, this);
    };

    /**
     * @param {Array.<kassy.data.EventModel>} events
     */
    MovieRecommend.prototype.show_ = function(events) {
        var dateFormat = kassy.utils.groupDateFormat;

        var days = this.days_ = [];
        var lastDay = null;
        var currGroupVal = -1;

        goog.array.forEach(events, function(event) {
            var groupVal = Math.floor(event.dateTime / 86400);
            if (groupVal != currGroupVal) {
                currGroupVal = groupVal;
                days.push(lastDay = {date: dateFormat(event.dateTime), events: []});
            }
            lastDay.events.push(event);
        });

        this.searchField_.setContentText(kassy.views.movie.List({days: days}));
        this.setScroll();
        this.setLoadingVisible(false);
    };

    MovieRecommend.prototype.onSearch_ = function(e) {
        if (!this.events_) return;

        if (e.search && e.search.length > 0) {

            var filterFn = goog.partial(function(search, event) {
                return goog.string.startsWith(event.show.name.toLowerCase(), search);
            }, e.search.toLowerCase());

            this.show_(goog.array.filter(this.events_, filterFn));
        } else {
            this.show_(this.events_);
        }
    };

    /** @override */
    MovieRecommend.prototype.disposeInternal = function() {
        if (this.barrier_) {
            this.barrier_.cancel(true);
        }

        if (this.searchField_) {
            this.searchField_.dispose();
        }

        this.barrier_ = this.searchField_ = this.events_ = null;
    };
});