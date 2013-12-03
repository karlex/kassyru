/**
 * @fileoverview
 */

goog.provide('kassy.handlers.Settings');

goog.require('kassy.handlers.BaseHandler');
goog.require('kassy.views.settings');
goog.require('goog.dom.xml');

goog.scope(function() {
    /**
     * @param {kassy.ServiceProvider} sp The ServiceProvider.
     * @constructor
     * @extends {kassy.handlers.BaseHandler}
     */
    kassy.handlers.Settings = function(sp) {
        goog.base(this, sp);
    };
    goog.inherits(kassy.handlers.Settings, kassy.handlers.BaseHandler);
    var Settings = kassy.handlers.Settings;

    /** @override */
    Settings.prototype.handle_ = function(path) {
        this.setContentTitle('Настройки');

        this.loadAndShow_();
    };

    Settings.prototype.loadAndShow_ = function() {
        var barrier = this.barrier_ = new goog.async.Deferred();

        this.executeRPC(
            new kassy.rpc.GetSubdivisions({
                db: kassy.settings.getRegionId(),
                response: barrier.callback.bind(barrier)
            })
        );

        barrier.addCallback(function(subdivisionsInfo) {
            this.show_(subdivisionsInfo ? subdivisionsInfo.subdivisions[0] : []);
        }, this);
    };

    /**
     * @param {kassy.data.SubdivisionModel} subdivision
     * @private
     */
    Settings.prototype.show_ = function(subdivision) {
        if (!subdivision) {
            this.setContentText('<center>Пусто</center>');
            return;
        }

        this.setContentText(kassy.views.settings.Main({
            cityName: subdivision.name,
            useGPS: kassy.settings.getUseGPS(),
            usePush: kassy.settings.getUsePush(),
            region: subdivision.db
        }));
        this.setScroll();

        var settingsEl = goog.dom.getElementByClass('settings');

        if (settingsEl) {
            var switchEls = goog.dom.getElementsByClass('switch', settingsEl);
            goog.array.forEach(switchEls, function(switchEl) {

                kassy.ui.gesture.listenSwipe(this.handler, switchEl, this.onSwitchSwipe_.bind(this));

                this.handler.listen(switchEl, goog.events.EventType.CLICK, this.onSwitchClick_.bind(this));

            }, this);
        }
    };

    /**
     * @param { {target:Element, direction:kassy.ui.gesture.Direction} } e
     * @private
     */
    Settings.prototype.onSwitchSwipe_ = function(e) {
        var switchEl = e.target;
        if (e.direction == kassy.ui.gesture.Direction.LEFT) {
            this.setSwitchState_(switchEl, false);
        }
        else if (e.direction == kassy.ui.gesture.Direction.RIGHT) {
            this.setSwitchState_(switchEl, true);
        }
    };

    /**
     * @param { {target:Element} } e
     * @private
     */
    Settings.prototype.onSwitchClick_ = function(e) {
        var switchEl = e.target;
        var isOn = goog.dom.classes.has(switchEl, 'on');

        this.setSwitchState_(switchEl, !isOn);
    };

    /**
     * @param {Element} switchEl
     * @param {boolean} state
     */
    Settings.prototype.setSwitchState_ = function(switchEl, state) {
        goog.dom.classes.enable(switchEl, 'on', state);

        switch (switchEl.id) {
            case 'btn-gps': this.setGps_(state); break;
            case 'btn-push': this.setPush_(state); break;
        }
    };

    /**
     * @param {boolean} switchOn
     * @private
     */
    Settings.prototype.setGps_ = function(switchOn) {
        window.console.log('gps switch ' + (switchOn ? 'on' : 'off'));
        kassy.settings.setUseGPS(switchOn);
    };

    /**
     * @param {boolean} switchOn
     * @private
     */
    Settings.prototype.setPush_ = function(switchOn) {
        window.console.log('push switch ' + (switchOn ? 'on' : 'off'));
        kassy.settings.setUsePush(switchOn);
    };
});