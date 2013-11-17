/**
 * @fileoverview
 */

goog.provide('kassy.handlers.MoviePlaces');

goog.require('kassy.handlers.BaseHandler');
goog.require('kassy.views.movie');
goog.require('kassy.utils');

goog.require('goog.string');
goog.require('goog.date.Date');
goog.require('goog.date.Interval');
goog.require('goog.async.Deferred');
goog.require('goog.async.DeferredList');

goog.scope(function() {
    /**
     * @param {kassy.ServiceProvider} sp The ServiceProvider.
     * @constructor
     * @extends {kassy.handlers.BaseHandler}
     */
    kassy.handlers.MoviePlaces = function(sp) {
        goog.base(this, sp);

        /**
         * @type {goog.async.DeferredList}
         * @private
         */
        this.barrier_ = null;
    };
    goog.inherits(kassy.handlers.MoviePlaces, kassy.handlers.BaseHandler);
    var MoviePlaces = kassy.handlers.MoviePlaces;

    /** @override */
    MoviePlaces.prototype.handle_ = function(path) {
        this.setContentTitle('Дата и место');

        var showId = ~~path.params;

        this.loadAndShow_(showId);
    };

    /**
     * @param {number} showId
     */
    MoviePlaces.prototype.loadAndShow_ = function(showId) {
        var Def = goog.async.Deferred;
        var defs = [new Def(), new Def(), new Def(), new Def()];

        var data = this.data_;
        data.findEvents(null, null, function(events, eventIndex) { defs[0].callback(events); });
        // После получения списка событий, запрашиваем индекс только необходимых(!) зрелищь
        defs[0].addCallback(function(events) {
            var showIds = goog.array.map(events, function(event) { return event.showId; });
            data.findShows(showIds, function(shows, showIndex) { defs[1].callback(showIndex); });
        });
        data.findHall(null, function(halls, hallIndex) { defs[2].callback(hallIndex); });
        data.findBuilding(null, function(buildings, buildingIndex) { defs[3].callback(buildingIndex); });

        this.barrier_ = new goog.async.DeferredList(defs);
        this.barrier_.addCallback(function(results) {
            var events = results[0][1];
            var showIndex = results[1][1];
            var hallIndex = results[2][1];
            var buildingIndex = results[3][1];

            var showEvents = goog.array.filter(events, function(event) {
                return (event.showId == showId && event.state >= 0);
            });

            var show = showIndex[showId];
            if (show instanceof kassy.data.ShowModel) {
                kassy.ui.downloadFile(show.image, function(fullPath) {

                    var showExt = /** @type {kassy.data.ShowModel} */ (goog.object.clone(show));
                    showExt.image = fullPath;

                    this.show_(showExt, showEvents, hallIndex, buildingIndex);
                }.bind(this), true);
            } else {
                this.setContentText('Зрелище не найдено!');
            }
        }, this);
    };

    /**
     * @param {kassy.data.ShowModel} show
     * @param {Array.<kassy.data.EventModel>} events
     * @param {Object.<string, kassy.data.HallModel>} hallIndex
     * @param {Object.<string, kassy.data.BuildingModel>} buildingIndex
     */
    MoviePlaces.prototype.show_ = function(show, events, hallIndex, buildingIndex) {
        var dateFormat = kassy.utils.groupDateFormat;

        var days = [];
        var lastDay = null;
        var currGroupVal = -1;
        var lastBuildingId = -1;
        var lastBuilding = null;
        goog.array.forEach(events, function(event) {
            var groupVal = Math.floor(event.dateTime / 86400);

            if (groupVal != currGroupVal) {
                currGroupVal = groupVal;
                lastBuildingId = -1;
                days.push(lastDay = {dateRaw: event.dateTime, date: dateFormat(event.dateTime), events: []});
            }

            var hall = hallIndex[event.hallId];
            if (hall instanceof kassy.data.HallModel) {

                var building = buildingIndex[hall.buildingId];
                if (building instanceof kassy.data.BuildingModel) {

                    if (building.id != lastBuildingId) {
                        lastBuildingId = building.id;
                        lastDay.events.push(lastBuilding = {
                            date: event.dateTime,
                            building: {id: building.id, name: building.name},
                            times:[]
                        });
                    }

                    lastBuilding.times.push(event.timeHHMM);
                }
            }
        });

        this.setContentText(kassy.views.movie.Times({show: show, days: days}));
        this.setScroll();
    };

    /** @override */
    MoviePlaces.prototype.disposeInternal = function() {
        if (this.barrier_) {
            this.barrier_.cancel(true);
        }

        this.barrier_ = null;
    }
});