goog.provide('kassy.handlers.OrderSeat');

goog.require('kassy.handlers.BaseHandler');
goog.require('kassy.rpc.GetEventHall');

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

        var eventId = ~~path.params.split('/');

        this.getEventHall_({ eventId: eventId });
    };

    OrderSeat.prototype.getEventHall_ = function(options) {
        var barrier = this.barrier_ = new goog.async.Deferred();
        barrier.addCallback(this.gotEventHall_, this);

        options.response = barrier.callback.bind(barrier);

        this.executeRPC(new kassy.rpc.GetEventHall(options));
    };

    /**
     * @param {kassy.rpc.EventHallType} eventHall
     */
    OrderSeat.prototype.gotEventHall_ = function(eventHall) {
        if (eventHall) {
            var timezone = eventHall.subdivision.tz;
            var places = eventHall.places;
            var hall = eventHall.hall;
            var event = eventHall.event;
            event.time = kassy.utils.moment(eventHall.event.dateTime, timezone, 'HH:mm');
            //if (eventHall.event.state > 0)
            this.show_(event, hall, places);
        }
        else {
            throw new Error('EventHall is NULL');
        }
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
     * @param {kassy.data.EventModel} event
     * @param {kassy.data.HallModel} hall
     * @param {Array.<kassy.data.PlaceModel>} places
     */
    OrderSeat.prototype.show_ = function(event, hall, places) {
        this.content_.innerHTML = kassy.views.order.Seat({ event: event });
        this.selectedEventId_ = event.id;
        this.selectedPlaces_ = new goog.structs.Set();
        this.places_ = places;

        this.handler.listen(goog.dom.getElement('btn-confirm'), [goog.events.EventType.CLICK], function(e) {
            kassy.ui.alert('Подтверждение заказа', 'Заказ', 'ok');
            e.preventDefault();
            return false;
        }, false, this);

        var placeSize = 10;
        var placeZoom = window.innerWidth/10/placeSize;

        // build rectangle for each place
        goog.array.forEach(places, function(place) {
            place.rect = new goog.math.Rect(place.x, place.y, placeSize, placeSize);
        });

        var content = this.getContentElement(),
            seatHolderEl = goog.dom.getElementByClass('seat-holder', content),
            canvas = goog.dom.getElementByClass('hall-canvas'),
            ctx = this.ctx_ = canvas.getContext('2d');

        // Увеличенный размер
        canvas.width = hall.width + 4;
        canvas.height = hall.height + 4;

        var canvasToHolderWidth = seatHolderEl.clientWidth - canvas.width,
            canvasToHolderHeight = seatHolderEl.clientHeight - canvas.height;

        if (canvasToHolderWidth > 0) {
            canvas.width = seatHolderEl.clientWidth;
        }

        if (canvasToHolderHeight > 0) {
            canvas.height = seatHolderEl.clientHeight;
        }

        var translateX = 2 + (canvasToHolderWidth > 0 ? canvasToHolderWidth / 2 : 0),
            translateY = 2 + (canvasToHolderHeight > 0 ? canvasToHolderHeight / 2 : 0);

        // init graphics context
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.translate(translateX, translateY);

        // draw places
        this.drawPlaces_(ctx, places);

        this.zoomed_ = false;

        this.seatScroll_ = new kassy.ui.Scroll(seatHolderEl, {
            'doubleTapZoom': placeZoom,
            'hScrollbar': false,
            'vScrollbar': false,
            'zoom': true,
            'onZoomEnd': function() { this.zoomed_ = !this.zoomed_;}.bind(this)
            /*'onTouchEnd': function(e) { if (!this['moved']) onSeatClick(e); }*/
        });

        var scrollX = (canvasToHolderWidth < 0 ? canvasToHolderWidth / 2 : 0),
            scrollY = (canvasToHolderHeight < 0 ? canvasToHolderHeight / 2 : 0);
        this.seatScroll_.scrollTo(scrollX, scrollY);

        this.handler.listen(seatHolderEl, [goog.events.EventType.CLICK], goog.partial(this.onSeatClick_, translateX, translateY), false, this);

        this.refreshConfirmLink_();

        this.setLoadingVisible(false);
    };

    OrderSeat.prototype.onSeatClick_ = function(translateX, translateY, e) {
        var sender = e.target;
        if (goog.dom.classes.has(sender, 'hall-canvas')) {
            if (this.zoomed_) {
                var coord = new goog.math.Coordinate(e.offsetX - translateX, e.offsetY - translateY);
                var place = goog.array.find(this.places_, function(place) {
                    return place.rect.contains(coord);
                });

                if (place && place.state == 1) {
                    var rect = place.rect,
                        selectedPlaces = this.selectedPlaces_;

                    if (selectedPlaces.contains(place.id)) {
                        selectedPlaces.remove(place.id);
                       this.ctx_.fillStyle = (place.state == 1 ? 'white' : 'lightgrey');
                    }
                    else {
                        selectedPlaces.add(place.id);
                        this.ctx_.fillStyle = 'yellow';
                    }

                    this.ctx_.fillRect(rect.left + 1, rect.top + 1, rect.width - 2, rect.height - 2);

                    this.refreshConfirmLink_();
                }
            }
        }
        else if (goog.dom.classes.has(sender, 'seat-holder')) {
            e.preventDefault();
            return false;
        }
    };

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {Array.<kassy.data.PlaceModel>} places
     * @private
     */
    OrderSeat.prototype.drawPlaces_ = function(ctx, places) {
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