/**
 * @fileoverview
 */

goog.provide('kassy.handlers.BaseHandler');

goog.require('relief.nav.Handler');

/**
 * @param {kassy.ServiceProvider} sp The ServiceProvider.
 * @constructor
 * @implements {relief.nav.Handler}
 */
kassy.handlers.BaseHandler = function(sp) {
    /**
     * @type {kassy.ServiceProvider}
     * @protected
     */
    this.sp_ = sp;

    /**
     * @type {goog.events.EventHandler}
     */
    this.handler = new goog.events.EventHandler(this);

    /**
     * @type {kassy.data.DataManager}
     * @protected
     */
    this.data_ = sp.getDataManager();

    /**
     * @type {Element}
     * @protected
     */
    this.content_ = sp.getContentRoot();
    this.content_.innerHTML = '';

    this.setLoadingVisible(true);

    /**
     * @type {kassy.ui.Scroll}
     * @protected
     */
    this.scroll_ = null;
};

/**
 * @param {boolean} visible
 */
kassy.handlers.BaseHandler.prototype.setLoadingVisible = function(visible) {
    goog.dom.getElement('loading').style.display = (visible ? 'block' : 'none');
};

/**
 * @return {Element}
 */
kassy.handlers.BaseHandler.prototype.getContentElement = function() {
    return this.content_;
};

/**
 * @param {string} text
 */
kassy.handlers.BaseHandler.prototype.setContentTitle = function(text) {
    if (!this.isDisposed()) {
        this.sp_.setContentTitle(text);
    }
};

/**
 * @param {string} text
 */
kassy.handlers.BaseHandler.prototype.setContentText = function(text) {
    if (!this.isDisposed()) {
        this.content_.innerHTML = text;
        this.setLoadingVisible(false);

        this.sp_.getEventBus().dispatchEvent({type: 'set_content_text'});
    }
};

/**
 * @param {string} style
 */
kassy.handlers.BaseHandler.prototype.setContentStyle = function(style) {
    if (!this.isDisposed()) {
        this.content_.style.cssText = style;
    }
};

/**
 * @param {kassy.ui.ScrollOptions=} opt_options
 */
kassy.handlers.BaseHandler.prototype.setScroll = function(opt_options) {
    if (!this.isDisposed()) {
        if (this.scroll_) {
            this.scroll_.refresh();
        } else {
            this.scroll_ = new kassy.ui.Scroll(goog.dom.getParentElement(this.content_), opt_options);
        }
    }
};

/** @protected */
kassy.handlers.BaseHandler.prototype.handle_ = goog.abstractMethod;

kassy.handlers.BaseHandler.prototype.handle = function(path) {
    // чтобы содержимое немедленно заменилось на "Загрузка..."
    window.setTimeout(this.handle_.bind(this, path), 0);
};

/** @override */
kassy.handlers.BaseHandler.prototype.transition = function(path, onTransition) {
    this.handle(path);
    onTransition(true);
};


/** @override */
kassy.handlers.BaseHandler.prototype.exit = function(onExit) {
    onExit(true);
};

kassy.handlers.BaseHandler.prototype.disposeInternal = function() {};

kassy.handlers.BaseHandler.prototype.dispose = function() {
    this.disposeInternal();

    if (this.handler) {
        this.handler.removeAll();
        this.handler.dispose();
    }

    if (this.scroll_) {
        this.scroll_.dispose();
        this.scroll_ = null;
    }

    this.setContentStyle('');

    this.sp_ = this.data_ = this.content_ = this.handler = this.scroll_ = null;
};


/** @override */
kassy.handlers.BaseHandler.prototype.isDisposed = function() {
    return this.sp_ === null;
};