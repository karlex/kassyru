goog.provide('kassy.data.cache');

goog.require('kassy.data.Database');

goog.scope(function() {
    /** @typedef {{ token: string, expireDate: number, value: string }} */
    kassy.data.CacheItem;

    kassy.data.CacheDisabled = false;

    /**
     * @constructor
     * @private
     */
    kassy.data.Cache = function() {
        this.db_ = new kassy.data.Database();
    };
    var Cache = kassy.data.Cache;

    /**
     * @param {string} token
     * @param {string} value
     * @param {number} expireDate
     */
    Cache.prototype.add = function(token, value, expireDate) {
        if (kassy.data.CacheDisabled) return;

        // Разбиваем значение на массив маленьких (4кб) упорядоченных подзначений
        var subvalues = goog.string.htmlEscape(goog.string.stripNewlines(value)).match(/.{1,10240}/g);

        // Вставляем каждое подзначение с его индексом
        goog.array.forEach(subvalues, this.insertSubvalue_.bind(this, token, expireDate));
    };

    /**
     * @param {string} token
     * @param {number} expireDate
     * @param {string} subvalue
     * @param {number} index
     * @private
     */
    Cache.prototype.insertSubvalue_ = function(token, expireDate, subvalue, index) {
        //window.console.log('CACHE INSERT SUBVALUE: ' + subvalue);

        this.db_.execute(
            'INSERT INTO cache (token, expireDate, ind, value) ' +
            'VALUES ("' + goog.string.htmlEscape(token) + '",' + expireDate + ', ' + index + ',"' + subvalue + '")'
        );
    };

    /**
     * @param {string} token
     */
    Cache.prototype.removeByToken = function(token) {
        this.db_.execute('DELETE FROM cache WHERE token = "' + goog.string.htmlEscape(token) + '"');
    };

    /**
     * @param {number} date - in ms
     */
    Cache.prototype.removeUntil = function(date) {
        this.db_.execute('DELETE FROM cache WHERE expireDate < ' + date);
    };

    /**
     * @param {string} token
     * @param {function(string?)} callback
     */
    Cache.prototype.get = function(token, callback) {
        if (kassy.data.CacheDisabled) {
            callback(null);
            return;
        }

        this.db_.execute(
            'SELECT DISTINCT value FROM cache WHERE token = "' + goog.string.htmlEscape(token) + '" ORDER BY ind ASC',
            this.onSelect_.bind(this, callback)
        );
    };

    /**
     * @param {function(string?)} callback
     * @param {Array.<Object>} rows
     * @private
     */
    Cache.prototype.onSelect_ = function(callback, rows) {
        //window.console.log('ON SELECT ROW COUNT: ' + rows.length);

        var value = goog.array.reduce(rows, function(value, row) {
            var subvalue = row['value'];
            //window.console.log('ON SELECT SUBVALUE: ' + subvalue);
            return value + subvalue;
        }, '');

        callback(value ? goog.string.unescapeEntities(value) : null);
    };

    /**
     * @type {kassy.data.Cache}
     */
    kassy.data.cache = new Cache();
});