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
        var buildingId = parseInt(path.params, 10);

        this.setContentTitle('Описание места');

        this.getEventList_({ buildingId: buildingId });
    };

    PlaceMovies.prototype.getEventList_ = function(options) {
        var barrier = this.barrier_ = new goog.async.Deferred();
        barrier.addCallback(this.gotEventList_, this);

        options.response = barrier.callback.bind(barrier);

        this.executeRPC(new kassy.rpc.GetEventList(options));
    };

    /**
     * @param {kassy.rpc.EventListType} eventList
     */
    PlaceMovies.prototype.gotEventList_ = function(eventList) {
        var events = [];
        var place = eventList.buildings[0];

        if (eventList) {
            var timezone = eventList.subdivision.tz;
            var showTypeIndex = kassy.rpc.index(eventList.showTypes);
            var showIndex = kassy.rpc.index(eventList.shows);
            var hallIndex = kassy.rpc.index(eventList.halls);

            // фильтруем и добавляем show
            for (var i = 0; i < eventList.events.length; i++) {
                var event = eventList.events[i];
                if (event.state > 0) {
                    var show = showIndex[event.showId];
                    var hall = hallIndex[event.hallId];
                    if (show && hall) {
                        show.type = showTypeIndex[show.typeId];
                        event.show = show;
                        event.hall = hall;
                        event.date = kassy.utils.moment(event.dateTime, timezone, 'D MMMM, dddd');
                        event.time = kassy.utils.moment(event.dateTime, timezone, 'HH:mm');
                        events.push(event);
                    }
                }
            }
        }

        this.show_(place, events);
    };

    /**
     * @param {kassy.data.BuildingModel} place
     * @param {Array.<kassy.data.EventModel>} events
     */
    PlaceMovies.prototype.show_ = function(place, events) {
        // Группируем события по дате
        var days = [];
        var lastDay = null;
        var currGroupVal = -1;
        var lastShowId = -1;
        goog.array.forEach(events, function(event) {
            var groupVal = event.date;
            if (groupVal != currGroupVal) {
                currGroupVal = groupVal;
                lastShowId = -1;
                days.push(lastDay = { date: event.date, dateRaw: event.dateTime, events: [] });
            }

            lastDay.events.push(event);
        });

        this.setContentText(kassy.views.place.Movies({place: place, days: days}));
        this.setScroll();
    };
});