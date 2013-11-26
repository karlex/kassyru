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

        var showTypeId = goog.string.urlDecode(path.params);
        var buildingTypeId = kassy.settings.getBuildingTypeIdByShowTypeId(showTypeId);

        this.executeRPC(new kassy.rpc.GetEventList({
            showTypeId: showTypeId,
            response: function(eventList) {
                window.console.log('eventList:' + goog.debug.expose(eventList));
                /*if (eventList) {

                } else {
                    // error
                }*/
            }
        }));

        this.loadAndShow_(showTypeId, buildingTypeId);
    };

    /**
     * @param {string} showTypeId
     */
    MovieList.prototype.loadAndShow_ = function(showTypeId, buildingTypeId) {
        var timePoint = Date.now();

        var Def = goog.async.Deferred;
        var defs = [new Def(), new Def(), new Def(), new Def()];

        var data = this.data_;
        data.findEventsByShowTypeId(showTypeId, null, null, function(events, eventIndex) { defs[0].callback(events); });
        data.findShowType(function(showTypes, showTypeIndex) { defs[2].callback(showTypeIndex); });
        data.findBuildingTypes(function(buildingTypes, buildingTypeIndex) { defs[3].callback(buildingTypeIndex); });

        // После получения списка событий, запрашиваем индекс только необходимых(!) зрелищь
        defs[0].addCallback(function(events) {
            var showIds = goog.array.map(events, function(event) { return event.showId; });
            data.findShows(showIds, function(shows, showIndex) { defs[1].callback(showIndex); });
        });

        this.barrier_ = new goog.async.DeferredList(defs);
        this.barrier_.addCallback(function(results) {
            window.console.log('SHOW LOAD TIME: ' + (Date.now() - timePoint));

            timePoint = Date.now();

            var events = results[0][1];
            var showIndex = results[1][1];
            var showTypeIndex = results[2][1];
            var buildingTypeIndex = results[3][1];

            var buildingType, showType;
            this.showType_ = showType = showTypeIndex[showTypeId];
            this.buildingType_ = buildingType = buildingTypeIndex[buildingTypeId];

            if (showType instanceof kassy.data.ShowTypeModel) {
                this.setContentTitle(showType.name);
            }

            var filteredEvents = [];

            goog.array.forEach(events, function(event) {
                if (event.state > 0) {
                    var show = showIndex[event.showId];
                    if (show instanceof kassy.data.ShowModel && show.typeId == showTypeId) {
                        var extEvent = goog.object.clone(event);
                        extEvent.show = goog.object.clone(show);
                        filteredEvents.push(extEvent);
                    }
                }
            });

            this.events_ = filteredEvents;
            
            window.console.log('SHOW BEFORE SHOW TIME: ' + (Date.now() - timePoint));

            this.show_(filteredEvents);
        }, this);
    };

    /**
     * @param {Array.<kassy.data.EventModel>} events
     */
    MovieList.prototype.show_ = function(events) {
        var timePoint = Date.now();

        var dateFormat = kassy.utils.groupDateFormat;

        var buildingType = this.buildingType_,
            showType = this.showType_;

        var days = this.days_ = [];
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
            showType: showType,
            buildingType: buildingType
        }));

        this.setScroll();
        this.setLoadingVisible(false);

        window.console.log('SHOW TIME: ' + (Date.now() - timePoint));
    };

    MovieList.prototype.onSearch_ = function(e) {
        if (!this.events_) return;

        var buildingType = this.buildingType_,
            showType = this.showType_;

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