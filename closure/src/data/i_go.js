goog.provide('kassy.data.IGo');

goog.require('kassy.data.Database');

goog.scope(function() {
    /** @typedef {{ eventId:number }} */
    kassy.data.IGoItem;

    /**
     * @constructor
     */
    kassy.data.IGo = function() {
        this.db_ = new kassy.data.Database();
    };
    var IGo = kassy.data.IGo;

    /**
     * @param {kassy.data.IGoItem} item
     */
    IGo.prototype.add = function(item) {
        this.db_.execute('INSERT INTO i_go (eventId) VALUES (' + item.eventId + ')');
    };

    /**
     * @param {kassy.data.IGoItem} item
     */
    IGo.prototype.remove = function(item) {
        this.db_.execute('DELETE FROM i_go WHERE eventId = ' + item.eventId);
    };

    /**
     * @param {kassy.data.IGoItem} item
     * @param {function(boolean)} callback
     */
    IGo.prototype.contain = function(item, callback) {
        this.db_.execute('SELECT * FROM i_go WHERE eventId=' + item.eventId, function(rows) {
            callback(rows.length > 0);
        });
    };

    /**
     * @param {function(Array.<kassy.data.IGoItem>)} callback
     */
    IGo.prototype.toArray = function(callback) {
        this.db_.execute('SELECT * FROM i_go', function(rows) {
            callback(goog.array.map(rows, function(row) {
                return {
                    eventId: ~~row['eventId']
                }
            }));
        });
    };
});