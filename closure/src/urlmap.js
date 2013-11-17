/**
 * @fileoverview
 *
 * Provides the URL Map
 */

goog.provide('kassy.urlMap');

//goog.require('kassy.auth.pageConfigs.login');
//goog.require('kassy.auth.pageConfigs.logout');

/* QUICK ACCESS */
goog.require('kassy.handlers.Direction');
goog.require('kassy.handlers.IGo');
goog.require('kassy.handlers.TicketOffice');
goog.require('kassy.handlers.MyOrders');
goog.require('kassy.handlers.Settings');
goog.require('kassy.handlers.SettingsRegion');
goog.require('kassy.handlers.Login');
goog.require('kassy.handlers.Registration');

/* MOVIE */
goog.require('kassy.handlers.MovieTypes');
goog.require('kassy.handlers.MovieList');
goog.require('kassy.handlers.MoviePlaces');
goog.require('kassy.handlers.MovieRecommend');

/* PLACE */
goog.require('kassy.handlers.PlaceTypes');
goog.require('kassy.handlers.PlaceList');
goog.require('kassy.handlers.PlaceMovies');
goog.require('kassy.handlers.PlaceMap');

/* ORDER */
goog.require('kassy.handlers.OrderDetails');
goog.require('kassy.handlers.OrderFullDetails');
goog.require('kassy.handlers.OrderSeat');
goog.require('kassy.handlers.OrderConfirm');
goog.require('kassy.handlers.OrderFinal');

/* OTHER */
goog.require('relief.handlers.MessageHandler');
goog.require('relief.handlers.templates');
goog.require('relief.handlers.errors');
goog.require('relief.nav.URLMap');

/**
 * @type {!relief.nav.URLMap}
 */
kassy.urlMap = {
    /* QUICK ACCESS */
    '': kassy.handlers.Direction,
    'i_go': kassy.handlers.IGo,
    'ticketoffice': kassy.handlers.TicketOffice,
    'myorders': kassy.handlers.MyOrders,
    'settings': kassy.handlers.Settings,
    'settings/region': kassy.handlers.SettingsRegion,
    'login': kassy.handlers.Login,
    'registration': kassy.handlers.Registration,

    /* MOVIE */
    'movie/types': kassy.handlers.MovieTypes,
    'movie/list': kassy.handlers.MovieList,
    'movie/places': kassy.handlers.MoviePlaces,
    'movie/recommend': kassy.handlers.MovieRecommend,

    /* PLACE */
    'place/types': kassy.handlers.PlaceTypes,
    'place/list': kassy.handlers.PlaceList,
    'place/movies': kassy.handlers.PlaceMovies,
    'place/map': kassy.handlers.PlaceMap,

    /* ORDER */
    'order/details': kassy.handlers.OrderDetails,
    'order/full_details': kassy.handlers.OrderFullDetails,
    'order/seat': kassy.handlers.OrderSeat,
    'order/confirm': kassy.handlers.OrderConfirm,
    'order/final': kassy.handlers.OrderFinal,

    // Authentication handlers
    //'/auth/login': kassy.auth.pageConfigs.login,
    //'/auth/logout': kassy.auth.pageConfigs.logout,

    // Use the generic error handlers provided by Relief
    ':401': relief.handlers.errors.Error401,
    ':404': { //relief.handlers.errors.Error404,
        handler: relief.handlers.MessageHandler,
        message: {
            template: function(templateParams) { return templateParams.details; },
            templateParams: {
                details: '<div style="color:#787878; text-align:center;">Пусто</div>'
            }
        }
    },
    ':501': {
        handler: relief.handlers.MessageHandler,
        message: {
            template: relief.handlers.templates.genericError,
            templateParams: {
                header: 'Not Yet Implemented',
                details: 'This space intentionally left blank.'
            }
        }
    }
};