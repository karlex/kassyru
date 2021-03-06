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

        /**
         * @type {boolean}
         * @protected
         */
        this.useShowTypeTitle_ = false;
    };
    goog.inherits(kassy.handlers.MovieList, kassy.handlers.BaseHandler);
    var MovieList = kassy.handlers.MovieList;

    /** @override */
    MovieList.prototype.handle_ = function(path) {
        var showNameI = goog.string.urlDecode(path.params);

        this.useShowTypeTitle_ = true;

        this.setContentTitle('Зрелища');

        this.initSearch_();

        this.getEventList_({ showTypeId: showNameI });
    };

    MovieList.prototype.initSearch_ = function() {
        this.searchField_ = new kassy.ui.SearchField(this.getContentElement());
        this.handler.listen(this.searchField_, goog.events.EventType.CHANGE, this.onSearch_, false, this);
    };

    MovieList.prototype.getEventList_ = function(options) {
        var barrier = this.barrier_ = new goog.async.Deferred();
        barrier.addCallback(this.gotEventList_, this);

        options.response = barrier.callback.bind(barrier);

        this.executeRPC(new kassy.rpc.GetEventList(options));
    };

    /**
     * @param {kassy.rpc.EventListType} eventList
     */
    MovieList.prototype.gotEventList_ = function(eventList) {
        var events = [];

        if (eventList) {
            var timezone = eventList.subdivision.tz;
            var showIndex = kassy.rpc.index(eventList.shows);
            var hallIndex = kassy.rpc.index(eventList.halls);
            var buildingIndex = kassy.rpc.index(eventList.buildings);

            if (this.useShowTypeTitle_) {
                var showType = eventList.showTypes[0];
                if (showType) {
                    this.setContentTitle(showType.name);
                }
            }

            // фильтруем и добавляем show
            for (var i = 0; i < eventList.events.length; i++) {
                /** @type {kassy.data.EventModel} */
                var event = eventList.events[i];

                if (event.state > 0) {
                    var show = showIndex[event.showId];
                    var hall = /** @type {kassy.data.HallModel} */ (hallIndex[event.hallId]);
                    var building = buildingIndex[hall.buildingId];

                    if (show && hall && building) {
                        hall.building = building;
                        event.hall = hall;
                        event.show = show;
                        event.date = kassy.utils.moment(event.dateTime, timezone, 'D MMMM, dddd');
                        event.time = kassy.utils.moment(event.dateTime, timezone, 'HH:mm');
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

        var days = [];
        var lastDay = null;
        var currGroupVal;
        var eventDistinct = null;

        goog.array.forEach(events, function(event) {
            //var groupVal = Math.floor(event.dateTime / 86400);
            var groupVal = event.date;
            if (groupVal != currGroupVal) {
                currGroupVal = groupVal;
                days.push(lastDay = { date: event.date, events: [] });
                eventDistinct = {};
            }

            lastDay.events.push(event);
        });

        this.searchField_.setContentText(kassy.views.movie.List({
            days: days
        }));

        this.setScroll();
        this.setLoadingVisible(false);

        window.console.log('SHOW TIME: ' + (Date.now() - timePoint));
    };

    /**
     * @param {Array.<{date:string, events:kassy.data.EventModel}>} days
     * @private
     */
    MovieList.prototype.render_ = function(days) {
        this.searchField_.setContentText(kassy.views.movie.List({
            days: days
        }));
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