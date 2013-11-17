/**
 * @fileoverview
 */

goog.provide('kassy.handlers.PlaceMovies');

goog.require('kassy.handlers.BaseHandler');
goog.require('kassy.views.place');

goog.require('goog.date.Date');
goog.require('goog.date.Interval');

goog.scope(function() {
    /**
     * @param {kassy.ServiceProvider} sp The ServiceProvider.
     * @constructor
     * @extends {kassy.handlers.BaseHandler}
     */
    kassy.handlers.PlaceMovies = function(sp) {
        goog.base(this, sp);
    };
    goog.inherits(kassy.handlers.PlaceMovies, kassy.handlers.BaseHandler);
    var PlaceMovies = kassy.handlers.PlaceMovies;

    /** @override */
    PlaceMovies.prototype.handle_ = function(path) {
        this.setContentTitle('Описание места');

        var buildingId = parseInt(path.params, 10);

        this.loadAndShow_(buildingId);
    };

    /**
     * @param {number} buildingId
     */
    PlaceMovies.prototype.loadAndShow_ = function(buildingId) {
        var Def = goog.async.Deferred;
        var defs = [new Def(), new Def(), new Def(), new Def(), new Def()];

        var data = this.data_;
        data.findEvents(null, null, function(events, eventIndex) { defs[0].callback(events); });
        // После получения списка событий, запрашиваем индекс только необходимых(!) зрелищь
        defs[0].addCallback(function(events) {
            var showIds = goog.array.map(events, function(event) { return event.showId; });
            data.findShows(showIds, function(shows, showIndex) { defs[1].callback(showIndex); });
        });
        data.findHall(buildingId, function(halls, hallIndex) { defs[2].callback(hallIndex); });
        data.findBuilding(null, function(buildings, buildingIndex) { defs[3].callback(buildingIndex); });
        data.findShowType(function(showTypes, showTypeIndex) { defs[4].callback(showTypeIndex); });

        var barrier = new goog.async.DeferredList(defs);
        barrier.addCallback(function(results) {
            var events = results[0][1];
            var showIndex = results[1][1];
            var hallIndex = results[2][1];
            var buildingIndex = results[3][1];
            var showTypeIndex = results[4][1];

            var place = buildingIndex[buildingId];
            if (place instanceof kassy.data.BuildingModel) {
                // Выбираем события, проходящие в этом учреждении
                var placeEvents = [];
                goog.array.forEach(events, function(event) {
                    if (event.state >= 0) {
                        var hall = hallIndex[event.hallId];
                        if (hall instanceof kassy.data.HallModel) {
                            var show = showIndex[event.showId];
                            if (show instanceof kassy.data.ShowModel) {
                                var showType = showTypeIndex[show.typeId];
                                var placeEvent = /** @type {kassy.data.EventModel} */ (goog.object.clone(event));
                                placeEvent.show = /** @type {kassy.data.ShowModel} */ (goog.object.clone(show));
                                placeEvent.show.type = showType;
                                placeEvents.push(placeEvent);
                            }
                        }
                    }
                });

                // Группируем события по дате
                var dateFormat = kassy.utils.groupDateFormat;
                var days = [];
                var lastDay = null;
                var currGroupVal = -1;
                var lastShowId = -1;
                var lastEvent = null;
                goog.array.forEach(placeEvents, function(event) {
                    var groupVal = Math.floor(event.dateTime / 86400);

                    if (groupVal != currGroupVal) {
                        currGroupVal = groupVal;
                        lastShowId = -1;
                        days.push(lastDay = {date: dateFormat(event.dateTime), dateRaw: event.dateTime, events: []});
                    }

                    if (event.showId != lastShowId) {
                        lastShowId = event.showId;
                        event.times = [];
                        lastDay.events.push(lastEvent = event);
                    }

                    lastEvent.times.push(event.timeHHMM);
                });
                this.show_(place, days);
            }
        }, this);
    };

    /**
     * @param {kassy.data.BuildingModel} place
     * @param {Array.<{date:string, events:Array.<kassy.data.EventModel>}>} days
     */
    PlaceMovies.prototype.show_ = function(place, days) {
        this.setContentText(kassy.views.place.Movies({place: place, days: days}));
        this.setScroll();
    };
});