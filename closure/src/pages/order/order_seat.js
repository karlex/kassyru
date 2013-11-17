/**
 * @fileoverview
 */

goog.provide('kassy.handlers.OrderSeat');

goog.require('kassy.handlers.BaseHandler');

goog.require('goog.dom.xml');
goog.require('goog.math.Rect');

goog.scope(function() {
    /**
     * @param {kassy.ServiceProvider} sp The ServiceProvider.
     * @constructor
     * @extends {kassy.handlers.BaseHandler}
     */
    kassy.handlers.OrderSeat = function(sp) {
        goog.base(this, sp);
    };
    goog.inherits(kassy.handlers.OrderSeat, kassy.handlers.BaseHandler);
    var OrderSeat = kassy.handlers.OrderSeat;

    /** @override */
    OrderSeat.prototype.handle_ = function(path) {
        this.setContentTitle('Место в зале');

        this.setContentStyle('position:relative; width:100%; height:100%; overflow:hidden;');

        var params = path.params.split('/'),
            showId = ~~params[0],
            buildingId = ~~params[1],
            eventDate = ~~params[2];

        this.loadAndShowEvents_(showId, buildingId, eventDate);
    };

    /**
     * @param {number} showId
     * @param {number} buildingId
     * @param {number} eventDate - seconds
     */
    OrderSeat.prototype.loadAndShowEvents_ = function(showId, buildingId, eventDate) {
        var Def = goog.async.Deferred;
        var defs = [new Def(), new Def()];

        var dateFrom = new goog.date.Date();
            dateFrom.setTime(eventDate * 1000);

        var dateTo = dateFrom.clone();
            dateTo.add(new goog.date.Interval(goog.date.Interval.DAYS, 1));

        window.console.log('EVENTS FROM ' + dateFrom + ' TO ' + dateTo);

        var data = this.data_;
        data.findEvents(dateFrom, dateTo, function(events, eventIndex) { defs[0].callback(events); });
        data.findHall(buildingId, function(halls, hallIndex) { defs[1].callback(hallIndex); });

        this.barrier_ = new goog.async.DeferredList(defs);
        this.barrier_.addCallback(function(results) {
            var events = results[0][1],
                hallIndex = results[1][1];

            this.hallIndex_ = hallIndex;

            this.orderEvents_ = goog.array.filter(events, goog.partial(this.eventFilterFn_, showId, buildingId, hallIndex));

            this.showTimes_(this.orderEvents_);
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
    OrderSeat.prototype.eventFilterFn_ = function(showId, buildingId, hallIndex, event) {
        if (event.showId == showId) {
            var hall = hallIndex[event.hallId];
            if (hall instanceof kassy.data.HallModel && hall.buildingId == buildingId) {
                return true;
            }
        }

        return false;
    };

    /**
     * @param {Array.<kassy.data.EventModel>} events
     */
    OrderSeat.prototype.showTimes_ = function(events) {
        this.setContentText(kassy.views.order.Seat({ events: events }));

        var btnGroupEl = goog.dom.getElementByClass('btn_group', this.getContentElement());

        var activeTimeEl = goog.dom.getElementByClass('active', btnGroupEl);
        if (activeTimeEl) {
            var eventId = ~~activeTimeEl.getAttribute('data-event-id');
            this.selectEvent_(eventId);
        }

        this.handler.listen(btnGroupEl, goog.events.EventType.CLICK, function(e) {
            // Если пользователь тыкнул время, значит надо показать соответствующий зал
            if (goog.dom.classes.has(e.target, 'btn-time')) {
                var activeBtnEl = goog.dom.getElementByClass('active', btnGroupEl);
                if (activeBtnEl) {
                    goog.dom.classes.remove(activeBtnEl, 'active');
                }

                goog.dom.classes.enable(e.target, 'active', true);

                var eventId = ~~e.target.getAttribute('data-event-id');
                this.selectEvent_(eventId);
            }
        }, false, this);
    };

    OrderSeat.prototype.selectEvent_ = function(eventId) {
        this.setLoadingVisible(true);

        this.selectedEventId_ = eventId;

        if (this.selectedPlaces_) {
            this.selectedPlaces_.clear();
        }
        this.selectedPlaces_ = new goog.structs.Set();

        this.refreshConfirmLink_();

        this.loadAndShowEventHall_(eventId);
    };

    OrderSeat.prototype.refreshConfirmLink_ = function() {
        var selectedPlacesId = this.selectedPlaces_ ? this.selectedPlaces_.getValues() : [];
        var btnConfirmEl = goog.dom.getElement('btn-confirm');

        if (selectedPlacesId.length > 0) {
            btnConfirmEl.style.display = 'block';
            btnConfirmEl.setAttribute('href', '#order/confirm/' + this.selectedEventId_ + '/' + selectedPlacesId.join('/'));
        } else {
            btnConfirmEl.style.display = 'none';
        }
    };

    /**
     * @param {number} eventId
     */
    OrderSeat.prototype.loadAndShowEventHall_ = function(eventId) {
        var event = goog.array.find(this.orderEvents_, function(event) {
            return event.id == eventId;
        });
        if (!event) return;

        var hall = this.hallIndex_[event.hallId];

        var Def = goog.async.Deferred;
        var defs = [new Def(), new Def(), new Def()];

        var data = this.data_;
        data.findSection(hall.id, function(sections) {
            defs[0].callback(sections);
            this.loadPlacesBySections_(sections, function(places) { defs[1].callback(places); });
        }.bind(this));
        data.findEventPlaces(eventId, function(placesStates, placeStateIndex) { defs[2].callback(placeStateIndex); });

        this.barrier_ = new goog.async.DeferredList(defs);
        this.barrier_.addCallback(function(results) {
            var places = results[1][1];
            var placeStateIndex = results[2][1];

            places = goog.array.map(places, function(place) {
                var exPlace = goog.object.clone(place);

                var placeState = placeStateIndex[place.id];
                if (placeState instanceof kassy.data.EventPlaceModel) {
                    exPlace.color = '#' + placeState.color;
                    exPlace.state = placeState.state;
                }

                return exPlace;
            });
            this.show_(hall.width, hall.height, places);
        }, this);
    };

    /**
     * @param {Array.<kassy.data.SectionModel>} sections
     * @param {function(Array.<kassy.data.PlaceModel>)} callback
     * @private
     */
    OrderSeat.prototype.loadPlacesBySections_ = function(sections, callback) {
        var Def = goog.async.Deferred;

        var defs = goog.array.map(sections, function(section) {
            var def = new Def();
            this.data_.findPlace(null, section.id, goog.partial(function(def, places) { def.callback(places); }, def));
            return def;
        }, this);

        var barrier = new goog.async.DeferredList(defs);
        barrier.addCallback(function(results) {
            var places = goog.array.reduce(results, function(places, result) {
                return goog.array.concat(places, result[1]);
            }, []);

            callback(places);
        });
    };

    /**
     * @param {number} width
     * @param {number} height
     * @param {Array.<kassy.data.PlaceModel>} places
     */
    OrderSeat.prototype.show_ = function(width, height, places) {
        var placeSize = 10;
        var placeZoom = window.innerWidth/10/placeSize;

        // build rectangle for each place
        goog.array.forEach(places, function(place) {
            place.rect = new goog.math.Rect(place.x, place.y, placeSize, placeSize);
        });

        var content = this.getContentElement(),
            canvas = goog.dom.getElementByClass('hall-canvas'),
            ctx = canvas.getContext('2d');

        // Увеличенный размер
        canvas.width = width + 4;
        canvas.height = height + 4;

        // init graphics context
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.translate(2, 2);

        // draw places
        (function drawPlaces(ctx, places) {
            goog.array.forEach(places, function(place) {
                var rect = place.rect;
                ctx.fillStyle = (place.state == 1 ? place.color : 'white');
                ctx.fillRect(rect.left - 2, rect.top - 2, rect.width + 4, rect.height + 4);

                ctx.fillStyle = 'white';
                ctx.fillRect(rect.left + 1, rect.top + 1, rect.width - 2, rect.height - 2);

                if (place.state != 1) {
                    ctx.fillStyle = 'lightgrey';
                    ctx.fillRect(rect.left + 1, rect.top + 1, rect.width - 2, rect.height - 2);
                }
            });

            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgb(131,131,131)';
            goog.array.forEach(places, function(place) {
                var box = place.rect.toBox();

                ctx.moveTo(box.left + 1, box.top + 0.5);
                ctx.lineTo(box.right - 1, box.top + 0.5);

                ctx.moveTo(box.left + 1, box.bottom - 0.5);
                ctx.lineTo(box.right - 1, box.bottom - 0.5);

                ctx.moveTo(box.left + 0.5, box.top + 1);
                ctx.lineTo(box.left + 0.5, box.bottom - 1);

                ctx.moveTo(box.right - 0.5, box.top + 1);
                ctx.lineTo(box.right - 0.5, box.bottom - 1);
            });
            ctx.stroke();
        })(ctx, places);

        var zoomed = false;

        this.setLoadingVisible(false);

        var seatHolderEl = goog.dom.getElementByClass('seat-holder', content);

        var canvasPosition = goog.style.getPageOffset(canvas);

        var getSeatScroll = function() { return this.seatScroll_; }.bind(this);

        var self = this;
        var onSeatClick = function(e) {
            var sender = e.target;
            if (goog.dom.classes.has(sender, 'hall-canvas')) {
                if (zoomed) {
                    /*if (e['changedTouches']) {
                        var touch = e['changedTouches'][0];
                        var seatScroll = getSeatScroll();
                        e.offsetX = touch['clientX'] - seatScroll.getX();
                        e.offsetY = touch['clientY'] - canvasPosition.y - seatScroll.getY();
                    }*/

                    var coord = new goog.math.Coordinate(e.offsetX, e.offsetY);
                    var place = goog.array.find(places, function(place) {
                        return place.rect.contains(coord);
                    });

                    if (place && place.state == 1) {
                        var rect = place.rect,
                            selectedPlaces = self.selectedPlaces_;

                        if (selectedPlaces.contains(place.id)) {
                            selectedPlaces.remove(place.id);
                            ctx.fillStyle = (place.state == 1 ? 'white' : 'lightgrey');
                        }
                        else {
                            selectedPlaces.add(place.id);
                            ctx.fillStyle = 'yellow';
                        }

                        ctx.fillRect(rect.left + 1, rect.top + 1, rect.width - 2, rect.height - 2);

                        self.refreshConfirmLink_();
                    }
                }
            }
            else if (goog.dom.classes.has(sender, 'seat-holder')) {
                e.preventDefault();
                return false;
            }
        };

        if (this.seatScroll_) {
            this.seatScroll_.dispose();
        }
        this.seatScroll_ = new kassy.ui.Scroll(seatHolderEl, {
            'doubleTapZoom': placeZoom,
            'hScrollbar': false,
            'vScrollbar': false,
            'zoom': true,
            'onZoomEnd': function() { zoomed = !zoomed; }/*,
            'onTouchEnd': function(e) {
                if (!this['moved']) {
                    onSeatClick(e);
                }
            }*/
        });

        this.handler.listen(seatHolderEl, [goog.events.EventType.CLICK], onSeatClick, false, this);
    };

    /** @override */
    OrderSeat.prototype.dispose = function() {
        OrderSeat.superClass_.dispose.call(this);

        if (this.seatScroll_) {
            this.seatScroll_.dispose();
            this.seatScroll_ = null;
        }
    };
});