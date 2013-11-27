goog.provide('kassy.ui.SearchField');

goog.require('kassy.views.search');

goog.scope(function() {
    /**
     * @param {Element} content
     * @constructor
     * @extends {goog.events.EventTarget}
     */
    kassy.ui.SearchField = function(content) {
        goog.base(this);

        content.innerHTML += kassy.views.search.Field();

        /**
         * @type {goog.events.EventHandler}
         * @private
         */
        this.eh_ = new goog.events.EventHandler(this);

        /**
         * @type {Element}
         * @private
         */
        this.searchListEl_ = goog.dom.getElementByClass('search_list', content);

        /**
         * @type {Element}
         * @private
         */
        this.searchLblEl_ = goog.dom.getElement('search_label');

        /**
         * @type {Element}
         * @private
         */
        this.searchFldEl_ = goog.dom.getElement('search_field');

        this.eh_.listen(this.searchFldEl_, goog.events.EventType.FOCUS, function(e) {
            this.searchLblEl_.style.display = 'none';
        }, false, this);

        this.eh_.listen(this.searchFldEl_, goog.events.EventType.BLUR, function(e) {
            if (!e.target.value.length) {
                this.searchLblEl_.style.display = 'block';
            }
        }, false, this);

        this.eh_.listen(this.searchFldEl_, goog.events.EventType.TOUCHSTART, function(e) {
            e.stopPropagation();
        }, false, this);

        this.eh_.listen(this.searchFldEl_,
            goog.events.EventType.KEYDOWN, kassy.utils.debounce(this.onKeyUp_, 500), false, this);
    };
    goog.inherits(kassy.ui.SearchField, goog.events.EventTarget);
    var SearchField = kassy.ui.SearchField;

    /**
     * @param {string} html
     */
    SearchField.prototype.setContentText = function(html) {
        this.searchListEl_.innerHTML = html;
    };

    SearchField.prototype.onKeyUp_ = function(e) {
        var event = new goog.events.Event(goog.events.EventType.CHANGE);
        event.search = e.target.value;

        this.dispatchEvent(event);
    };

    /** @override */
    SearchField.prototype.disposeInternal = function() {
        SearchField.superClass_.disposeInternal.call(this);

        if (this.eh_) {
            this.eh_.removeAll();
            this.eh_.dispose();
        }

        if (this.searchFldEl_) {
            goog.dom.removeNode(this.searchFldEl_);
        }

        if (this.searchListEl_) {
            goog.dom.removeNode(this.searchListEl_);
        }

        this.searchFldEl_ = this.searchListEl_ = this.eh_ = null;
    };
});