goog.provide('kassy.handlers.Direction');

goog.require('kassy.handlers.BaseHandler');
goog.require('kassy.views.direction');

goog.scope(function() {
    /**
     * @param {kassy.ServiceProvider} sp The ServiceProvider.
     * @constructor
     * @extends {kassy.handlers.BaseHandler}
     */
    kassy.handlers.Direction = function(sp) {
        goog.base(this, sp);

        goog.style.showElement(goog.dom.getElement('nav-btn-back'), false);
    };
    goog.inherits(kassy.handlers.Direction, kassy.handlers.BaseHandler);
    var Direction = kassy.handlers.Direction;

    /** @override */
    Direction.prototype.handle_ = function(path) {
        this.setContentTitle('');

        this.setContentText(kassy.views.direction.List());
    };

    /** @override */
    Direction.prototype.disposeInternal = function() {
        goog.style.showElement(goog.dom.getElement('nav-btn-back'), true);
    };
});