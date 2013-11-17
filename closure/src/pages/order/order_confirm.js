/**
 * @fileoverview
 */

goog.provide('kassy.handlers.OrderConfirm');

goog.require('kassy.handlers.BaseHandler');
goog.require('kassy.views.order');
goog.require('kassy.data.LockPlace');
goog.require('kassy.data.UnlockPlace');
goog.require('kassy.data.CreateOrder');

goog.scope(function() {
    /**
     * @param {kassy.ServiceProvider} sp The ServiceProvider.
     * @constructor
     * @extends {kassy.handlers.BaseHandler}
     */
    kassy.handlers.OrderConfirm = function(sp) {
        goog.base(this, sp);
    };
    goog.inherits(kassy.handlers.OrderConfirm, kassy.handlers.BaseHandler);
    var OrderConfirm = kassy.handlers.OrderConfirm;

    /** @override */
    OrderConfirm.prototype.handle_ = function(path) {
        this.setContentTitle('Подтверждение');

        var params = path.params.split('/'),
            eventId = ~~params.shift(),
            placesId = goog.array.map(params, function(param) { return ~~param; });

        this.eventId_ = eventId;
        this.placesId_ = placesId;

        kassy.data.execute(new kassy.data.LockPlace(eventId, placesId, function(data, errors) {
            if (errors) {
                // Если ошибка связана с тем, что пользователь неавторизован,
                // тогда отправляем его на авторизацию
                /*if (error.code == 2) {
                    window.location.hash = 'login';
                }*/

                //TODO: Разкомментировать сообщение об ошибке и убрать loadAndShow
                //kassy.ui.alert('Не удалось заблокировать.\nВыберите другие места.', 'Ошибка', 'OK');
                //window.history.go(-1);
                this.loadAndShow_(eventId, placesId);
            }
            else {
                this.loadAndShow_(eventId, placesId);
            }
        }.bind(this)));
    };

    /**
     * @param {number} eventId
     * @param {Array.<number>} placesId
     */
    OrderConfirm.prototype.loadAndShow_ = function(eventId, placesId) {
        var Def = goog.async.Deferred;
        var defs = [new Def(), new Def(), new Def(), new Def(), new Def()];

        var data = this.data_;
        data.findEvents(null, null, function(events, eventIndex) { defs[0].callback(eventIndex); });
        // После получения списка событий, запрашиваем индекс только необходимых(!) зрелищь
        defs[0].addCallback(function(eventIndex) {
            var event = eventIndex[eventId];
            data.findShow(event.showId, function(shows, showIndex) { defs[1].callback(showIndex); });
        });
        data.findHall(null, function(halls, hallIndex) { defs[2].callback(hallIndex); });
        data.findBuilding(null, function(buildings, buildingIndex) { defs[3].callback(buildingIndex); });
        data.findEventPlaces(eventId, function(eventPlaces, eventPlaceIndex) { defs[4].callback(eventPlaceIndex); });

        this.barrier_ = new goog.async.DeferredList(defs);
        this.barrier_.addCallback(function(results) {
            var eventIndex = results[0][1],
                showIndex = results[1][1],
                hallIndex = results[2][1],
                buildingIndex = results[3][1],
                eventPlaceIndex = results[4][1];

            var event = eventIndex[eventId];
            if (event) {
                event.dateDDMMMM = kassy.utils.formatDDMMMM(event.dateTime);

                var show = showIndex[event.showId],
                    hall = hallIndex[event.hallId],
                    building = buildingIndex[hall.buildingId];

                this.notice_ = { event: event, show: show };

                this.data_.findSection(hall.id, function(sections, sectionIndex) {
                    window.console.log('SECTION COUNT: ' + sections.length);

                    this.loadPlacesById_(placesId, sectionIndex, function(places) {
                        window.console.log('PLACE COUNT: ' + places.length);

                        places = goog.array.map(places, function(place) {
                            var exPlace = goog.object.clone(place);

                            var eventPlace = eventPlaceIndex[place.id];
                            if (eventPlace instanceof kassy.data.EventPlaceModel) {
                                goog.object.extend(exPlace, {
                                    price: eventPlace.price
                                });
                            }

                            return exPlace;
                        });

                        this.show_(event, show, building, places);
                    }.bind(this));
                }.bind(this));
            }
        }, this);
    };

    /**
     * @param {Array.<number>} placesId
     * @param {Object.<number, kassy.data.SectionModel>} sectionIndex
     * @param {function(Array.<kassy.data.PlaceModel>)} callback
     * @private
     */
    OrderConfirm.prototype.loadPlacesById_ = function(placesId, sectionIndex, callback) {
        var Def = goog.async.Deferred;

        var defs = goog.array.map(placesId, function(placeId) {
            var def = new Def();
            this.data_.findPlace(placeId, null, goog.partial(function(def, places) { def.callback(places); }, def));
            return def;
        }, this);

        var barrier = new goog.async.DeferredList(defs);
        barrier.addCallback(function(results) {
            var places = goog.array.reduce(results, function(places, result) {
                return goog.array.concat(places, result[1]);
            }, []);

            goog.array.forEach(places, function(place) {
                place.color = '#fff';
                place.section = sectionIndex[place.sectionId];
            });

            callback(places);
        });
    };

    /**
     * @param {kassy.data.EventModel} event
     * @param {kassy.data.ShowModel} show
     * @param {kassy.data.BuildingModel} building
     * @param {Array.<{price: number}>} places
     * @private
     */
    OrderConfirm.prototype.show_ = function(event, show, building, places) {
        window.console.log('ORDER CONFIRM BEFORE RENDER');

        this.setContentText(kassy.views.order.Confirm({
            event: event,
            show: show,
            building: building,
            places: places,
            total: goog.array.reduce(places, function(total, place) { return total + place.price; }, 0)
        }));

        window.console.log('ORDER CONFIRM AFTER RENDER');

        this.setScroll();

        this.handler.listen(this.getContentElement(), goog.events.EventType.CLICK, function(e) {
            var el = e.target;
            if (goog.dom.classes.has(el, 'confirm-order-btn')) {
                this.confirm_();
            }
        }, false, this);
    };

    /**
     * Подтверждение заказа
     */
    OrderConfirm.prototype.confirm_ = function() {
        var eventId = this.eventId_,
            placesId = this.placesId_;

        var createOrderCmd = new kassy.data.CreateOrder(eventId, placesId, function(orderId) {
            if (orderId != null) {
                var myOrders = new kassy.data.MyOrders();
                myOrders.add({ orderId: orderId, eventId: eventId, placeIds: placesId });
                this.setNotification_();
                window.location.hash = 'myorders';
            }
            else {
                //TODO: Сообщение об ошибке
                var myOrders = new kassy.data.MyOrders();
                myOrders.add({ orderId: Math.floor(Date.now() / 1000), eventId: eventId, placeIds: placesId });
                this.setNotification_();
                window.location.hash = 'myorders';
            }
        }.bind(this));

        kassy.data.execute(createOrderCmd);
    };

    OrderConfirm.prototype.setNotification_ = function() {
        var notice = this.notice_;
        if (notice && notice.event && notice.show && kassy.settings.getUsePush()) {

            //(this.event_.dateTime - 2 * 60 * 60) * 1000 // миллисекунды, -2*60*60 сек = -2 часа
            kassy.utils.addLocalNotification({
                id: notice.event.id,
                date: (notice.event.dateTime - 2 * 60 * 60) * 1000, //Date.now() + 60000,
                ticker: notice.show.name,
                title: 'Kassy.ru - ' + notice.show.name,
                message: notice.event.dateDDMMMM + ' в ' + notice.event.timeHHMM
            });
        }
    };

    /** @override */
    OrderConfirm.prototype.dispose = function() {
        OrderConfirm.superClass_.dispose.call(this);
        kassy.data.execute(new kassy.data.UnlockPlace(this.eventId_, this.placesId_));
    };
});