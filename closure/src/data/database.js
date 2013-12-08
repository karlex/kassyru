goog.provide('kassy.data.Database');

goog.scope(function() {
    /**
     * @constructor
     */
    kassy.data.Database = function() {
        this.db_ = window['openDatabase']("kassy", "1.0", "Kassy.ru", 50 * 1024 * 1024); // 1Мб

        var iGoDef = new goog.async.Deferred();
        var myOrderDef = new goog.async.Deferred();
        this.def_ = new goog.async.DeferredList([iGoDef, myOrderDef]);

        this.execute_('CREATE TABLE IF NOT EXISTS i_go (eventId)',
            iGoDef.callback.bind(iGoDef), iGoDef.errback.bind(iGoDef));

        /*this.execute_('CREATE TABLE IF NOT EXISTS cache (token, expireDate, value, ind)',
            cacheDef.callback.bind(cacheDef), cacheDef.errback.bind(cacheDef));*/

        this.execute_('CREATE TABLE IF NOT EXISTS my_order (order_id, data)',
            myOrderDef.callback.bind(myOrderDef), myOrderDef.errback.bind(myOrderDef));
    };
    var Database = kassy.data.Database;

    /**
     * @param {string} sql
     * @param {function(Array)=} callback
     * @param {function()=} errback
     */
    Database.prototype.execute = function(sql, callback, errback) {
        if (this.def_) {
            this.def_.addCallback(
                this.execute_.bind(this, sql, callback, errback)
            );
        }
    };

    /**
     * @param {string} sql
     * @param {function(Array)=} callback
     * @param {function()=} errback
     */
    Database.prototype.execute_ = function(sql, callback, errback) {
        this.db_['transaction'](function(tx) {

            //window.console.log('SQL: ' + sql);

            tx['executeSql'](sql, [], function(tx, results) {

                window.console.log('SQL OK: ' + sql.substr(0, 200));

                if (goog.isFunction(callback)) {
                    var resultsRows = results['rows'],
                        len = resultsRows['length'],
                        rows = [];

                    for (var i = 0; i < len; i++) {
                        rows.push(resultsRows['item'](i));
                    }

                    callback(rows);
                }
            }, function() {

                window.console.log('SQL FAIL: ' + sql.substr(0, 200));

                if (goog.isFunction(callback)) {
                    callback([]);
                }
            });
        }, function() {

            window.console.log('SQL FAIL: ' + sql.substr(0, 200));

            if (goog.isFunction(errback)) {
                errback();
            }
        });
    };
});