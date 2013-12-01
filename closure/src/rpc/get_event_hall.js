goog.provide('kassy.rpc.GetEventHall');

goog.require('kassy.rpc.BaseCommand');

goog.scope(function () {
    /** @typedef {{
     *    subdivision: kassy.data.SubdivisionModel,
     *    showType: kassy.data.ShowTypeModel,
     *    show: kassy.data.ShowModel,
     *    building: kassy.data.BuildingModel,
     *    hall: kassy.data.HallModel,
     *    event: kassy.data.EventModel,
     *    places: Array.<kassy.data.PlaceModel>
     * }}
     */
    kassy.rpc.EventHallType;

    /**
     * @param {{
     *   eventId: (number),
     *   response: function(kassy.rpc.EventHallType?)
     * }} options
     * @constructor
     * @extends {kassy.rpc.BaseCommand}
     */
    kassy.rpc.GetEventHall = function(options) {
        goog.base(this, {
            module: 'page_event_order',
            data: kassy.rpc.params({
                'id': options.eventId
            }),
            success: function(response) {
                options.response({
                    subdivision: response.get('subdivision', kassy.data.SubdivisionModel)[0],
                    showType: response.get('show_type', kassy.data.ShowTypeModel)[0],
                    show: response.get('show', kassy.data.ShowModel)[0],
                    building: response.get('building', kassy.data.BuildingModel)[0],
                    hall: response.get('hall', kassy.data.HallModel)[0],
                    event: response.get('event', kassy.data.EventModel)[0],
                    places: response.get('place', kassy.data.PlaceModel)
                })
            },
            error: function() {
                options.response(null);
            }
        });
    };
    goog.inherits(kassy.rpc.GetEventHall, kassy.rpc.BaseCommand);
    var GetEventHall = kassy.rpc.GetEventHall;
});