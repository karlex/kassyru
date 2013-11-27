goog.provide('kassy.handlers.MovieList');

goog.require('kassy.handlers.BaseHandler');
goog.require('kassy.ui.SearchField');
goog.require('kassy.views.movie');
goog.require('kassy.utils');
goog.require('kassy.rpc.GetEventList');

goog.require('goog.string');
goog.require('goog.date.Date');
goog.require('goog.date.Interval');

goog.scope(function() {
    /**
     * @param {kassy.ServiceProvider} sp The ServiceProvider.
     * @constructor
     * @extends {kassy.handlers.BaseHandler}
     */
    kassy.handlers.MovieList = function(sp) {
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
    goog.inherits(kassy.handlers.MovieList, kassy.handlers.BaseHandler);
    var MovieList = kassy.handlers.MovieList;

    /** @override */
    MovieList.prototype.handle_ = function(path) {
        this.setContentTitle('Зрелища');

        this.searchField_ = new kassy.ui.SearchField(this.getContentElement());
        this.handler.listen(this.searchField_, goog.events.EventType.CHANGE, this.onSearch_, false, this);

        var showNameI = goog.string.urlDecode(path.params);

        var barrier = this.barrier_ = new goog.async.Deferred();

        this.executeRPC(new kassy.rpc.GetEventList({
            showTypeId: showNameI,
            response: barrier.callback.bind(barrier)
        }));

        barrier.addCallback(this.gotEventList_, this);
    };

    /**
     * @param {kassy.rpc.EventListType} eventList
     */
    MovieList.prototype.gotEventList_ = function(eventList) {
        var events = [];

        if (eventList) {
            var showIndex = kassy.rpc.index(eventList.shows);
            var showType = this.showType_ = eventList.showTypes[0];

            if (showType instanceof kassy.data.ShowTypeModel) {
                this.setContentTitle(showType.name);
            }

            // фильтруем и добавляем show
            for (var i = 0; i < eventList.events.length; i++) {
                var event = eventList.events[i];
                if (event.state > 0) {
                    var show = showIndex[event.showId];
                    if (show instanceof kassy.data.ShowModel) {
                        event.show = show;

                        events.push(event);
                    }
                }
            }
        }

        // запомним для поиска
        this.events_ = events;

        this.show_(events);
    };

    /**
     * @param {Array.<kassy.data.EventModel>} events
     */
    MovieList.prototype.show_ = function(events) {
        var timePoint = Date.now();

        var dateFormat = kassy.utils.groupDateFormat;

        var showType = this.showType_;

        var days = [];
        var lastDay = null;
        var currGroupVal = -1;
        var eventDistinct = null;

        goog.array.forEach(events, function(event) {
            var groupVal = Math.floor(event.dateTime / 86400);
            if (groupVal != currGroupVal) {
                currGroupVal = groupVal;
                days.push(lastDay = {date: dateFormat(event.dateTime), events: []});
                eventDistinct = {};
            }
            if (!eventDistinct[event.showId]) {
                eventDistinct[event.showId] = true;
                lastDay.events.push(event);
            }
        });

        this.searchField_.setContentText(kassy.views.movie.List({
            days: days,
            showType: showType
        }));

        this.setScroll();
        this.setLoadingVisible(false);

        window.console.log('SHOW TIME: ' + (Date.now() - timePoint));
    };

    MovieList.prototype.onSearch_ = function(e) {
        if (!this.events_) return;

        if (e.search && e.search.length > 0) {
            var filterFn = goog.partial(function(search, event) {
                return goog.string.startsWith(event.show.name.toLowerCase(), search);
            }, e.search.toLowerCase());

            this.show_(goog.array.filter(this.events_, filterFn));
        }
        else {
            this.show_(this.events_);
        }
    };

    /** @override */
    MovieList.prototype.disposeInternal = function() {
        if (this.barrier_) {
            this.barrier_.cancel(true);
        }

        if (this.searchField_) {
            this.searchField_.dispose();
        }

        this.barrier_ = this.searchField_ = this.events_ = null;
    };
});