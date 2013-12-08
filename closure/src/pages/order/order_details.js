/**
 * @fileoverview
 */

goog.provide('kassy.handlers.OrderDetails');

goog.require('kassy.handlers.BaseHandler');
goog.require('kassy.views.order');
goog.require('kassy.data.IGo');
goog.require('kassy.rpc.GetEventHall');

goog.require('goog.ui.Dialog');

goog.scope(function() {
    /**
     * @param {kassy.ServiceProvider} sp The ServiceProvider.
     * @constructor
     * @extends {kassy.handlers.BaseHandler}
     */
    kassy.handlers.OrderDetails = function(sp) {
        goog.base(this, sp);
    };
    goog.inherits(kassy.handlers.OrderDetails, kassy.handlers.BaseHandler);
    var OrderDetails = kassy.handlers.OrderDetails;

    /** @override */
    OrderDetails.prototype.handle_ = function(path) {
        var eventId = ~~path.params;

        this.setContentTitle('Заказ');

        this.getEventHall_({ eventId: eventId });
    };

    OrderDetails.prototype.getEventHall_ = function(options) {
        var barrier = this.barrier_ = new goog.async.Deferred();
        barrier.addCallback(this.gotEventHall_, this);

        options.response = barrier.callback.bind(barrier);

        this.executeRPC(new kassy.rpc.GetEventHall(options));
    };

    /**
     * @param {kassy.rpc.EventHallType} eventHall
     */
    OrderDetails.prototype.gotEventHall_ = function(eventHall) {
        if (!eventHall) {
            throw new Error('EventHall is NULL');
        }

        var timezone = eventHall.subdivision.tz;
        var event = eventHall.event;
        event.date = kassy.utils.moment(eventHall.event.dateTime, timezone, 'D MMMM, dddd');
        event.time = kassy.utils.moment(eventHall.event.dateTime, timezone, 'HH:mm');
        event.show = eventHall.show;
        event.hall = eventHall.hall;
        event.building = eventHall.building;

        var fileDef = new goog.async.Deferred();
        var iGoDef = new goog.async.Deferred();
        var barrier = this.barrier_ = new goog.async.DeferredList([fileDef, iGoDef]);

        kassy.ui.downloadFile(eventHall.show.image, fileDef.callback.bind(fileDef), true);
        this.getIGo_(eventHall.event.id, iGoDef.callback.bind(iGoDef));

        barrier.addCallback(function(results) {
            var imageFullPath = results[0][1];
            var iGoChecked = results[1][1];

            event.posterUrl = imageFullPath;

            this.show_(event, iGoChecked);
        }, this);
    };

    /**
     * @param {kassy.data.EventModel} event
     * @param {boolean} iGoChecked
     * @private
     */
    OrderDetails.prototype.show_ = function(event, iGoChecked) {
        this.setContentText(kassy.views.order.Details({ event: event }));
        this.setScroll();

        this.handler.listen(this.getContentElement(), goog.events.EventType.CLICK, function(e) {
            if (goog.dom.classes.has(e.target, 'poster')) {
                var dlg = new goog.ui.Dialog();
                var style = dlg.getContentElement().style;
                style.backgroundImage = 'url(' + e.target.src + ')';
                style.backgroundSize = 'contain';
                style.backgroundPosition = 'center center';
                style.backgroundRepeat = 'no-repeat';
                style.position = 'absolute';
                style.left = style.right = style.top = style.bottom = '5%';

                dlg.setButtonSet(null);
                dlg.setDisposeOnHide(true);
                dlg.setVisible(true);

                e.stopPropagation();
                
                var fn = function() {
                    if (dlg.isVisible()) {
                        dlg.setVisible(false);
                    }
                };

                goog.events.listenOnce(dlg.getContentElement(), goog.events.EventType.CLICK, fn);
                goog.events.listenOnce(dlg.getBackgroundElement(), goog.events.EventType.CLICK, fn);
            }
        }, false, this);

        // TODO: read IGo from list to this checkbox
        var iGoEl = goog.dom.getElementByClass('checkbox', this.getContentElement());

        goog.dom.classes.enable(iGoEl, 'checked', iGoChecked);

        this.handler.listen(iGoEl, goog.events.EventType.CLICK, function() {
            // Состояние checkbox после(!) переключения
            var checked = !goog.dom.classes.has(iGoEl, 'checked');

            goog.dom.classes.enable(iGoEl, 'checked', checked);

            this.setIGo_(event.id, checked);
        }, false, this);
    };

    /**
     * @param {number} eventId
     * @param {function(boolean)} callback
     * @private
     */
    OrderDetails.prototype.getIGo_ = function(eventId, callback) {
        var iGo = this.iGo_;
        if (!iGo) {
            this.iGo_ = iGo = new kassy.data.IGo();
        }

        iGo.contain({eventId: eventId}, callback);
    };

    /**
     * @param {number} eventId
     * @param {boolean} checked
     * @private
     */
    OrderDetails.prototype.setIGo_ = function(eventId, checked) {
            var iGo = this.iGo_;
            if (!iGo) {
                this.iGo_ = iGo = new kassy.data.IGo();
            }

            var item = {eventId: eventId};

            if (checked) {
                iGo.add(item);
            } else {
                iGo.remove(item);
            }
    };

    /** @override */
    OrderDetails.prototype.disposeInternal = function() {
        if (this.barrier_) {
            this.barrier_.cancel(true);
        }

        this.barrier_ = null;
    }
});