goog.provide('kassy.rpc.GetEventList');

goog.require('kassy.rpc.BaseCommand');

goog.scope(function () {
    /** @typedef {{
     *    showTypes: Array.<kassy.data.ShowTypeModel>,
     *    shows: Array.<kassy.data.ShowModel>,
     *    buildings: Array.<kassy.data.BuildingModel>,
     *    halls: Array.<kassy.data.HallModel>,
     *    events: Array.<kassy.data.EventModel>
     * }}
     */
    kassy.rpc.EventListType;

    /**
     * @param value
     * @param defaultValue
     * @return {*}
     */
    var getOrDef = function(value, defaultValue) {
        return (goog.isDef(value) ? value : defaultValue);
    };

    /**
     * @param {{ showTypeId, dateFrom, dateTo, isRecommend, response:function(kassy.rpc.EventListType) }} options
     * @constructor
     * @extends {kassy.rpc.BaseCommand}
     */
    kassy.rpc.GetEventList = function(options) {
        goog.base(this, {
            module: 'page_event_list',
            data: [
                {
                    name: 'params',
                    attrs: {
                        'show_type_id': getOrDef(options.showTypeId, ''),
                        'date_from': options.dateFrom,
                        'date_to': options.dateTo,
                        'is_recommend': options.isRecommend
                    }
                }
            ],
            success: function(data) {
                options.response({
                    showTypes: kassy.rpc.map(data['shows_types'], kassy.data.ShowTypeModel),
                    shows: kassy.rpc.map(data['shows'], kassy.data.ShowModel),
                    buildings: kassy.rpc.map(data['buildings'], kassy.data.BuildingModel),
                    halls: kassy.rpc.map(data['halls'], kassy.data.HallModel),
                    events: kassy.rpc.map(data['events'], kassy.data.EventModel)
                })
            },
            error: function() {
                options.response(null);
            }
        });
    };
    goog.inherits(kassy.rpc.GetEventList, kassy.rpc.BaseCommand);
    var GetEventList = kassy.rpc.GetEventList;
});