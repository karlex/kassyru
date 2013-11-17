goog.provide('kassy.handlers.OrderFinal');

goog.require('kassy.handlers.BaseHandler');

goog.require('kassy.views.order');

goog.scope(function() {
    /**
     * @param {kassy.ServiceProvider} sp The ServiceProvider.
     * @constructor
     * @extends {kassy.handlers.BaseHandler}
     */
    kassy.handlers.OrderFinal = function(sp) {
        goog.base(this, sp);
    };
    goog.inherits(kassy.handlers.OrderFinal, kassy.handlers.BaseHandler);
    var OrderFinal = kassy.handlers.OrderFinal;

    /** @override */
    OrderFinal.prototype.handle_ = function(path) {
        this.setContentTitle('Подтверждение');

        var params = path.params.split('/');

        this.loadAndShow_();
    };

    OrderFinal.prototype.loadAndShow_ = function() {
        this.setContentText(kassy.views.order.Final({
            number: 49395,
            total: '5 100'
        }));
        this.setScroll();

        var readTermEl = goog.dom.getElementByClass('checkbox', this.getContentElement());
        var cardBuyEl = goog.dom.getElementByClass('btn-card-buy', this.getContentElement());

        this.handler.listen(readTermEl, goog.events.EventType.CLICK, function() {
            // Состояние checkbox после(!) переключения
            var checked = !goog.dom.classes.has(readTermEl, 'checked');

            goog.dom.classes.enable(readTermEl, 'checked', checked);
            goog.dom.classes.enable(cardBuyEl, 'hidden', !checked);

            this.setScroll();
        }, false, this);
    };
});