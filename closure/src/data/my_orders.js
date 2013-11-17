goog.provide('kassy.data.MyOrders');

goog.require('kassy.data.Database');

goog.scope(function() {
    /** @typedef {{ orderId:number, eventId:number, placeIds:Array.<number> }} */
    kassy.data.MyOrderItem;

    /**
     * @constructor
     */
    kassy.data.MyOrders = function() {
        this.db_ = new kassy.data.Database();
    };
    var MyOrders = kassy.data.MyOrders;

    /**
     * @param {kassy.data.MyOrderItem} item
     */
    MyOrders.prototype.add = function(item) {
        var data = this.formatItem(item);
        this.db_.execute('INSERT INTO my_order (order_id, data) VALUES (' + item.orderId + ', "' + data + '")');
    };

    /**
     * @param {number} orderId
     */
    MyOrders.prototype.remove = function(orderId) {
        this.db_.execute('DELETE FROM my_order WHERE order_id = ' + orderId);
    };

    /**
     * @param {number} orderId
     * @param {function(boolean)} callback
     */
    MyOrders.prototype.contain = function(orderId, callback) {
        this.db_.execute('SELECT * FROM my_order WHERE order_id = ' + orderId, function(rows) {
            callback(rows.length > 0);
        });
    };

    /**
     * @param {number} eventId
     * @param {function(Array.<kassy.data.MyOrderItem>)} callback
     */
    MyOrders.prototype.findByEventId = function(eventId, callback) {
        this.db_.execute('SELECT * FROM my_order WHERE data LIKE "' + eventId + '|%"', function(rows) {
            callback(goog.array.map(rows, MyOrders.parseRow_));
        });
    };

    /**
     * @param {function(Array.<kassy.data.MyOrderItem>)} callback
     */
    MyOrders.prototype.toArray = function(callback) {
        this.db_.execute('SELECT * FROM my_order', function(rows) {
            callback(goog.array.map(rows, MyOrders.parseRow_));
        });
    };

    /**
     * @param row
     * @return {kassy.data.MyOrderItem}
     * @private
     */
    MyOrders.parseRow_ = function(row) {
        var orderId = ~~row['order_id'];
        var ids = goog.array.map(row['data'].split('|'), function(id) { return ~~id; });
        return {
            orderId: orderId,
            eventId: ids.shift(),
            placeIds: ids
        };
    };

    /**
     * @param {kassy.data.MyOrderItem} item
     * @return {string}
     */
    MyOrders.prototype.formatItem = function(item) {
        return item.eventId + '|' + item.placeIds.join('|');
    }
});