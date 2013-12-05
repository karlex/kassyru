goog.provide('kassy.rpc.GetShowTypes');

goog.require('kassy.rpc.BaseCommand');

goog.scope(function () {
    /** @typedef {{
     *    subdivision: kassy.data.SubdivisionModel,
     *    showTypes: Array.<kassy.data.ShowTypeModel>
     * }}
     */
    kassy.rpc.ShowTypeListType;

    /**
     * @param {{
     *   response: function(kassy.rpc.ShowTypeListType?)
     * }} options
     * @constructor
     * @extends {kassy.rpc.BaseCommand}
     */
    kassy.rpc.GetShowTypes = function(options) {
        goog.base(this, {
            module: 'page_show_type',
            data: [],
            success: function(response) {
                options.response({
                    subdivision: response.get('subdivision', kassy.data.SubdivisionModel)[0],
                    showTypes: response.get('show_type', kassy.data.ShowTypeModel, function(showType) {
                        return showType.state === 1;
                    })
                })
            },
            error: function() {
                options.response(null);
            }
        });
    };
    goog.inherits(kassy.rpc.GetShowTypes, kassy.rpc.BaseCommand);
});