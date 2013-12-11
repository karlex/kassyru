goog.provide('kassy.rpc.GetEventList');

goog.require('kassy.rpc.BaseCommand');

goog.scope(function () {
    /** @typedef {{
     *    subdivision: kassy.data.SubdivisionModel,
     *    showTypes: Array.<kassy.data.ShowTypeModel>,
     *    shows: Array.<kassy.data.ShowModel>,
     *    buildings: Array.<kassy.data.BuildingModel>,
     *    halls: Array.<kassy.data.HallModel>,
     *    events: Array.<kassy.data.EventModel>
     * }}
     */
    kassy.rpc.EventListType;

    /**
     * @param {{
     *   showTypeId: (string|undefined),
     *   buildingId: (number|undefined),
     *   dateFrom: (goog.date.Date|undefined),
     *   dateTo: (goog.date.Date|undefined),
     *   isRecommend: (boolean|undefined),
     *   response: function(kassy.rpc.EventListType?)
     * }} options
     * @constructor
     * @extends {kassy.rpc.BaseCommand}
     */
    kassy.rpc.GetEventList = function(options) {
        if (!options.dateFrom) {
            options.dateFrom = new goog.date.DateTime();
        }

        /*if (!options.dateTo) {
            options.dateTo = options.dateFrom.clone();
            options.dateTo.add(new goog.date.Interval(goog.date.Interval.MONTHS, 6));
        }*/

        var unixDateTimeFrom = Math.round(options.dateFrom.getTime() / 1000);
        //var unixDateTimeTo = Math.round(options.dateTo.getTime() / 1000);

        goog.base(this, {
            module: 'page_event_list',
            data: kassy.rpc.params({
                'building_id': options.buildingId,
                'show_type_id': options.showTypeId,
                'date_from': unixDateTimeFrom.toString(),
                //'date_to': unixDateTimeTo.toString(),
                'is_recommend': (goog.isDef(options.isRecommend) ? ~~options.isRecommend : undefined)
            }),
            success: function(response) {
                options.response({
                    subdivision: response.get('subdivision', kassy.data.SubdivisionModel)[0],
                    showTypes: response.get('show_type', kassy.data.ShowTypeModel),
                    shows: response.get('show', kassy.data.ShowModel),
                    buildings: response.get('building', kassy.data.BuildingModel),
                    halls: response.get('hall', kassy.data.HallModel),
                    events: response.get('event', kassy.data.EventModel, function(event) {
                        return event.saleState === 1;
                    })
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