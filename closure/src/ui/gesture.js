goog.provide('kassy.ui.gesture');

goog.scope(function() {
    var gesture = kassy.ui.gesture;

    /**
     * @type {number}
     * @private
     */
    gesture.swipeDistance_ = 20;

    /** @enum {string} */
    gesture.Direction = {
        LEFT: 'left',
        RIGHT: 'right',
        UP: 'up',
        DOWN: 'down'
    };

    /**
     * @param {goog.events.EventHandler} eh
     * @param {Element} el
     * @param {function( {target: Element} )} callback
     */
    gesture.listenDoubleTap = function(eh, el, callback) {
        var waitForDoubleTap = false,
            lastTapTime = 0;

        eh.listen(el, goog.events.EventType.TOUCHEND, function() {
            if (waitForDoubleTap && (Date.now() - lastTapTime) < 250) {
                waitForDoubleTap = false;
                callback({target: el});
            }
            else {
                waitForDoubleTap = true;
            }
            lastTapTime = Date.now();
        });
    };

    /**
     * @param {goog.events.EventHandler} eh
     * @param {Element} el
     * @param {function( {target: Element, direction: gesture.Direction} )} callback
     */
    gesture.listenSwipe = function(eh, el, callback) {
        var touchStart = { ready: false };
        eh.listen(el, goog.events.EventType.TOUCHSTART, goog.partial(gesture.onSwipeTouchStart_, touchStart));
        eh.listen(el, goog.events.EventType.TOUCHMOVE, goog.partial(gesture.onSwipeTouchMove_, el, touchStart, callback));
        eh.listen(el, goog.events.EventType.TOUCHEND, goog.partial(gesture.onSwipeTouchEnd_, touchStart));
    };

    gesture.onSwipeTouchStart_ = function(touchStart, e) {
        var touches = e.getBrowserEvent()['changedTouches'];
        if (touches && touches.length > 0) {
            var touch = touches[0];
            touchStart.x = ~~touch['clientX'];
            touchStart.y = ~~touch['clientY'];
            touchStart.ready = true;
        }
    };

    gesture.onSwipeTouchMove_ = function(el, touchStart, callback, e) {
        var touches = e.getBrowserEvent()['changedTouches'];
        if (touchStart.ready && touches && touches.length > 0) {
            var touch = touches[0],
                finishTouch = { x: ~~touch['clientX'], y: ~~touch['clientY'] },
                dx = finishTouch.x - touchStart.x,
                dy = finishTouch.y - touchStart.y;

            if (Math.abs(dx) > gesture.swipeDistance_ && Math.abs(dx) > Math.abs(dy)) {
                touchStart.ready = false;
                callback({
                    target: el,
                    direction: (dx > 0) ? gesture.Direction.RIGHT : gesture.Direction.LEFT
                });
            }
        }
    };

    gesture.onSwipeTouchEnd_ = function(touchStart) {
        touchStart.ready = false;
    };

});