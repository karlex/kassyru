/**
 * @fileoverview
 *
 * Provides an data manager
 */


goog.provide('kassy.data.DataManager');

goog.require('kassy.data.Model');
goog.require('kassy.data.cache');

goog.require('goog.result');
goog.require('goog.net.XhrIo');
goog.require('goog.events.EventTarget');
goog.require('goog.Uri.QueryData');


/** @typedef {{module:string, item_name:(string|undefined), search:!Object.<string, string>, requestModel, withoutCache}} */
kassy.data.RequestOptions;

/** @typedef {function(new:kassy.data.Model, Object.<string,*>)} */
kassy.data.ModelCtor;

/**
 * @private - чтобы нельзя было создать экземпляр за пределами этого файла
 * @constructor
 */
kassy.data.DataManager = function() {
    /** @type {Object.<string, {ctor: kassy.data.ModelCtor, itemName, requestModel}>} */
    this.modelMap_ = {
        'subdivision': {ctor: kassy.data.SubdivisionModel},
        'building': {
            ctor: kassy.data.BuildingModel,
            itemName: 'building',
            requestModel: 'page_building'
        },
        'building_type': {
            ctor: kassy.data.BuildingTypeModel,
            itemName: 'building_type',
            requestModel: 'page_building_type'
        },
        'hall': {ctor: kassy.data.HallModel},
        'section': {ctor: kassy.data.SectionModel},
        'place': {ctor: kassy.data.PlaceModel},
        'event': {
            ctor: kassy.data.EventModel,
            itemName: 'event',
            requestModel: 'page_event_list'
        },
        'show': {
            ctor: kassy.data.ShowModel,
            itemName: 'show',
            requestModel: 'page_show'
        },
        'show_type': {
            ctor: kassy.data.ShowTypeModel,
            itemName: 'show_type',
            requestModel: 'page_show_type'
        },
        'event_places': {
            ctor: kassy.data.EventPlaceModel,
            itemName: 'place',
            requestModel: 'event'
        }
    };

    /** @type {Object.<string, goog.result.SimpleResult>} */
    this.cache_ = {};
};

/**
 * @param {Node} element
 * @param {function(new:kassy.data.Model, Object.<string,*>)} modelCtor
 * @return {kassy.data.Model}
 */
kassy.data.DataManager.elementToModel = function(element, modelCtor) {
    var fields = element.attributes,
        stateField = fields.getNamedItem('state'),
        // Запись является разрешенной, если у неё нет поля state или его значение неравно '0'
        isEnabled = (!goog.isDefAndNotNull(stateField) || (goog.isDefAndNotNull(stateField) && stateField.value !== '0'));

    // Выводим только те данные, которые разрешены
    if (isEnabled) {
        var values = {}, field;

        for (var i = 0; i < fields.length; i++) {
            field = fields[i];
            values[field.name] = field.value;
        }

        return new modelCtor(values);
    }
    else {
        return null;
    }
};

/**
 * Прокси для кэширования запросов по названию модуля и параметрам поиска
 *
 * @param {string} modelName
 * @param {string} keyField
 * @param {!Object.<string, string>} params
 * @param {function(Array.<kassy.data.Model>, Object.<string, kassy.data.Model>, boolean)} response
 * @param {boolean=} withoutCache
 */
kassy.data.DataManager.prototype.find = function(modelName, keyField, params, response, withoutCache) {
    //window.console.log('Get model "' + modelName + '"');
    var modelMeta = this.modelMap_[modelName];
    if (modelMeta && goog.isFunction(modelMeta.ctor)) {
        var token = kassy.settings.getRegionId() + '&' + modelName + '&' + goog.Uri.QueryData.createFromMap(params).toString();
        /** @type {goog.result.SimpleResult} */
        var result = this.cache_[token];

        //window.console.log('MODEL ITEM: ' + modelMeta.itemName);
        //window.console.log('MODEL REQ NAME: ' + modelMeta.requestModel);

        if (!result) {
            result = new goog.result.SimpleResult();

            var sendRequest = kassy.data.DataManager.sendRequestV3;
            sendRequest({module: modelName, search: params, requestModel: modelMeta.requestModel, withoutCache: withoutCache}, function(xml) {
                var elements = xml.getElementsByTagName(modelMeta.itemName ? modelMeta.itemName : modelName);
                var models = [];
                var index = {};

                //window.console.log('FROM SERVER ' + modelName + ' COUNT: ' + elements.length);

                // Урезаем список, чтобы непроизошло переполнение
                elements = goog.array.splice(elements, 0, 6062);
                for (var i = 0; i < elements.length; i++) {
                    var model = kassy.data.DataManager.elementToModel(elements[i], modelMeta.ctor);

                    // Если элемент удалось привести к типу Model, тогда сохраняем его в списке
                    if (model !== null) {
                        models.push(model);
                        index[model.get(keyField)] = model;
                    }
                }

                result.setValue({models: models, index: index});
              },
              result.setError.bind(result)
            );
        } else {
            //window.console.log('FROM CACHE ' + modelName);
        }

        result.wait(function(result) {
            var isOk = result.getState() == goog.result.Result.State.SUCCESS;

            if (isOk) {
                /** @type {{models:Array.<kassy.data.Model>, index:Object.<string, kassy.data.Model>}} */
                var modelsInfo = result.getValue();

                // Кэшируем успешный результат, если необходимо
                if (!withoutCache && modelsInfo.models.length > 0) {
                    this.cache_[token] = result;
                }
                //window.console.log('RESPONSE STATUS: OK');
                response(modelsInfo.models, modelsInfo.index, true);
            } else {
                //window.console.log('RESPONSE STATUS: ERROR');
                response([], {}, false);
            }
        }.bind(this));
    }
    else {
        throw new Error('Model with name "' + modelName + '" was not founded!')
    }
};

/**
 * @param {kassy.data.RequestOptions} options
 * @param {function(Document)} success
 * @param {function(string)} error
 */
kassy.data.DataManager.sendRequestV3 = function(options, success, error) {
    var search = '';

    //window.console.log('SEARCH: ' + goog.debug.expose(options.search));

    if (!goog.object.isEmpty(options.search)) {
        search = '<params';
        goog.object.forEach(options.search, function(value, key) {
            search += goog.getMsg(' {$key}="{$value}"', {'key': key, 'value': value});
        });
        search += ' />';
    }

    var request_template = '<?xml version="1.0" encoding="UTF-8"?>' +
        '<request db="{$db}" module="{$module}" protocol="xml" version="3.0">' +
        search +
        '<auth id="{$authId}" key="{$authKey}" /></request>';

    var requestValue = goog.getMsg(request_template, {
        'db': kassy.settings.getRegionId(),
        'module': (options.requestModel ? options.requestModel : options.module),
        'authId': kassy.settings.getAuthId(),
        'authKey': kassy.settings.getAuthKey()
    });

    //window.console.log('REQUEST XML: ' + requestValue);
    //window.console.log('WITHOUT CACHE: ' + options.withoutCache);

    if (options.withoutCache) {
        //window.console.log('REQUEST ' + options.module + ' FROM SERVER');
        kassy.data.DataManager.sendXmlRequest_(requestValue, function(xml) {
            //window.console.log('Request "' + options.module + '" is success');
            success(xml);
        }, function(errorMsg) {
            //window.console.log('Request "' + options.module + '" is fail');
            error(errorMsg);
        });
    }
    else {
        //window.console.log('CACHE GET ' + options.module);
        kassy.data.cache.get(requestValue, function(value) {
            if (value === null) {
                //window.console.log('REQUEST ' + options.module + ' FROM SERVER');
                kassy.data.DataManager.sendXmlRequest_(requestValue, function(xml, responseText) {
                    //window.console.log('Request "' + options.module + '" is success');

                    var resultCode = xml.getElementsByTagName('result')[0].getAttribute('code');
                    var hasErrors = xml.getElementsByTagName('errors').length > 0;

                    //window.console.log('XML RESULT CODE: ' + resultCode);

                    if (!options.withoutCache && resultCode >= 1 && !hasErrors) {
                        kassy.data.cache.add(requestValue, responseText, Date.now());
                    }

                    success(xml);
                }, function(errorMsg) {
                    //window.console.log('Request "' + options.module + '" is fail');
                    error(errorMsg);
                });
            }
            else {
                //window.console.log('REQUEST ' + options.module + ' FROM DB CACHE');
                success(goog.dom.xml.loadXml(value));
            }
        });
    }
};

kassy.data.DataManager.sendXmlRequest_ = function(requestValue, success, error) {
    var url = 'https://api.kassy.ru/request/';
    var params = goog.Uri.QueryData.createFromMap({'request': requestValue}).toString();
    var headers = {
        'Accept-Encoding': 'gzip,deflate',
        'Content-Type': 'application/x-www-form-urlencoded'
    };
    var callback = function(e) {
        var xhr = /** @type {goog.net.XhrIo} */ (e.target);

        //window.console.log('SEND XML REQUEST STATE IS: ' + (xhr.isSuccess() ? 'OK' : 'FAIL'));

        if (!xhr.isComplete()) {
            //window['offlineAlert']();
        }

        /** @type {string} */
        var responseText = xhr.getResponseText();

        if (xhr.isSuccess()) {
            var xml = goog.dom.xml.loadXml(responseText);
            var resultCode = xml.getElementsByTagName('result')[0].getAttribute('code');
            var hasErrors = xml.getElementsByTagName('errors').length > 0;

            //window.console.log('SEND XML RESULT CODE: ' + resultCode);

            success(xml, responseText);
        } else {
            error(xhr.getLastError());
        }
    };

    //window.console.log('SEND XML REQUEST: ' + requestValue);
    goog.net.XhrIo.send(url, callback, 'POST', params, headers, 0, true);
};

/**
 * @param {function(Array.<kassy.data.SubdivisionModel>, Object.<string, kassy.data.SubdivisionModel>, boolean)} response
 */
kassy.data.DataManager.prototype.findSubdivisions = function(response) {
    var params = {};

    this.find('subdivision', 'id', params, response);
};

/**
 * @param {number?} buildingTypeId
 * @param {function(Array.<kassy.data.BuildingModel>, Object.<string, kassy.data.BuildingModel>, boolean)} response
 */
kassy.data.DataManager.prototype.findBuilding = function(buildingTypeId, response) {
    var params = {};

    if (buildingTypeId !== null) params['type_id'] = buildingTypeId;

    this.find('building', 'id', params, response);
};

/**
 * @param {number} buildingId
 * @param {function(Array.<kassy.data.BuildingModel>, Object.<string, kassy.data.BuildingModel>, boolean)} response
 */
kassy.data.DataManager.prototype.findBuildingById = function(buildingId, response) {
    var params = {
        'id': buildingId
    };

    this.find('building', 'id', params, response);
};

/**
 * @param {number?} buildingId
 * @param {function(Array.<kassy.data.HallModel>, Object.<string, kassy.data.HallModel>, boolean)} response
 */
kassy.data.DataManager.prototype.findHall = function(buildingId, response) {
    var params = {};

    if (buildingId !== null) {
        params['building_id'] = buildingId;
    }

    this.find('hall', 'id', params, response);
};

/**
 * @param {number?} hallId
 * @param {function(Array.<kassy.data.SectionModel>, Object.<string, kassy.data.SectionModel>, boolean)} response
 */
kassy.data.DataManager.prototype.findSection = function(hallId, response) {
    var params = {};

    if (hallId !== null) {
        params['hall_id'] = hallId;
    }

    this.find('section', 'id', params, response);
};

/**
 * @param {number?} id
 * @param {number?} sectionId
 * @param {function(Array.<kassy.data.PlaceModel>, Object.<string, kassy.data.PlaceModel>, boolean)} response
 */
kassy.data.DataManager.prototype.findPlace = function(id, sectionId, response) {
    var params = {};
    if (id !== null) params['id'] = id;
    if (sectionId !== null) params['section_id'] = sectionId;

    this.find('place', 'id', params, response, true);
};

/**
 * @param {Array.<number>} placeIds
 * @param {function(Array.<kassy.data.PlaceModel>, Object.<string, kassy.data.PlaceModel>)} response
 */
kassy.data.DataManager.prototype.findPlacesByIds = function(placeIds, response) {
    var defs = goog.array.map(placeIds, function(placeId) {
        var def = new goog.async.Deferred();
        this.findPlace(placeId, null, def.callback.bind(def));
        return def;
    }, this);

    var barrier = new goog.async.DeferredList(defs);
    barrier.addCallback(function(results) {
        var places = goog.array.reduce(results, function(places, result) {
            return goog.array.concat(places, result[1]);
        }, []);

        // Индекс, для быстрого поиска по ID
        var placeIndex = goog.array.reduce(places, function(index, model) {
            index[model.id] = model;
            return index;
        }, {});

        response(places, placeIndex);
    })
};

/**
 * @param {function(Array.<kassy.data.BuildingTypeModel>, Object.<string, kassy.data.BuildingTypeModel>, boolean)} response
 */
kassy.data.DataManager.prototype.findBuildingTypes = function(response) {
    var params = {
        'kind': 1
    };

    this.find('building_type', 'id', params, response);
};

/**
 * @param {string?} showTypeId
 * @param {goog.date.Date} dateTimeFrom
 * @param {goog.date.Date} dateTimeTo
 * @param {function(Array.<kassy.data.EventModel>, Object.<string, kassy.data.EventModel>, boolean)} response
 */
kassy.data.DataManager.prototype.findEventsByShowTypeId = function(showTypeId, dateTimeFrom, dateTimeTo, response) {
    if (!dateTimeFrom) {
        dateTimeFrom = new goog.date.Date();
    }

    if (!dateTimeTo) {
        dateTimeTo = dateTimeFrom.clone();
        dateTimeTo.add(new goog.date.Interval(goog.date.Interval.DAYS, kassy.config.daysLimit));
    }

    var unixDateTimeFrom = Math.round(dateTimeFrom.getTime() / 1000);
    var unixDateTimeTo = Math.round(dateTimeTo.getTime() / 1000);
    var params = {
        'date_from': unixDateTimeFrom.toString(),
        'date_to': unixDateTimeTo.toString()
    };

    /*if (showTypeId) {
        params['show_type_id'] = showTypeId
    }*/

    this.find('event', 'id', params, function(events, eventIndex, success) {
        goog.array.sort(events, function(a, b) {
            return a.dateTime - b.dateTime;
        });

        response(goog.array.filter(events, function(event) {
            // Только активные события на данный момент времени
            return (event.state > 0) && (event.dateTime * 1000 > Date.now());
        }), eventIndex, success);
    });
};

/**
 * @param {goog.date.Date} dateTimeFrom
 * @param {goog.date.Date} dateTimeTo
 * @param {function(Array.<kassy.data.EventModel>, Object.<string, kassy.data.EventModel>, boolean)} response
 */
kassy.data.DataManager.prototype.findEvents = function(dateTimeFrom, dateTimeTo, response) {
    kassy.data.DataManager.prototype.findEventsByShowTypeId(null, dateTimeFrom, dateTimeTo, response);
};

/**
 * @param {number} eventId
 * @param {function(Array.<kassy.data.EventModel>, Object.<string, kassy.data.EventModel>, boolean)} response
 */
kassy.data.DataManager.prototype.findEvent = function(eventId, response) {
    var params = {
        'id': eventId.toString()
    };

    this.find('event', 'id', params, response);
};

/**
 * @param {Array.<number>} eventIds
 * @param {function(Array.<kassy.data.EventModel>, Object.<string, kassy.data.EventModel>)} response
 */
kassy.data.DataManager.prototype.findEventsByIds = function(eventIds, response) {
    var defs = goog.array.map(eventIds, function(eventId) {
        var def = new goog.async.Deferred();
        this.findEvent(eventId, def.callback.bind(def));
        return def;
    }, this);

    var barrier = new goog.async.DeferredList(defs);
    barrier.addCallback(function(results) {
        // Не пустые результаты
        var nonemptyResults = goog.array.filter(results, function(result) { return result[1].length > 0; });

        // Одномерный список событий
        var events = goog.array.reduce(nonemptyResults, function(modelsAccum, result) {
                var models = result[1];
                goog.array.concat(modelsAccum, models);
                return modelsAccum;
        }, []);

        // Индекс, для быстрого поиска зрелищ по ID
        var eventIndex = goog.array.reduce(events, function(index, model) {
            index[model.id] = model;
            return index;
        }, {});

        response(events, eventIndex);
    })
};

/**
 * @param {function(Array.<kassy.data.ShowTypeModel>, Object.<string, kassy.data.ShowTypeModel>, boolean)} response
 */
kassy.data.DataManager.prototype.findShowType = function(response) {
    var params = {};

    this.find('show_type', 'id', params, response);
};

/**
 * @param {number} showId
 * @param {function(Array.<kassy.data.ShowModel>, Object.<string, kassy.data.ShowModel>, boolean)} response
 */
kassy.data.DataManager.prototype.findShow = function(showId, response) {
    var params = {
        'id': showId.toString()
    };

    this.find('show', 'id', params, response);
};

/**
 * @param {Array.<number>} showIds
 * @param {function(Array.<kassy.data.ShowModel>, Object.<string, kassy.data.ShowModel>, boolean)} response
 */
kassy.data.DataManager.prototype.findShows = function(showIds, response) {
    /** @type {!Array.<goog.async.Deferred>} */
    var defs = goog.array.map(showIds, function(showId) {
        var def = new goog.async.Deferred();

        this.findShow(showId, def.callback.bind(def));

        return def;
    }, this);

    var barrier = new goog.async.DeferredList(defs);
    barrier.addCallback(goog.partial(function(response, results) {

        // Список непустых списков зрелищ
        var nonemptyResults = goog.array.filter(results, function(result) { return result[1].length > 0; });

        // Одномерный список зрелищ
        var shows = goog.array.map(nonemptyResults, function(result) {
                var shows = result[1];

                if (shows.length > 1) {
                    window.console.error('SHOW ID DUPLICATED: ' + goog.debug.exposeArray(result));
                }

                return shows[0];
            }
        );

        // Индекс, для быстрого поиска зрелищ по ID
        var showIndex = goog.array.reduce(shows, function(index, show) {
            index[show.id] = show;
            return index;
        }, {});

        response(shows, showIndex);
    }, response));
};

/**
 * @param {number} eventId
 * @param {function(Array.<kassy.data.EventPlaceModel>, Object.<string, kassy.data.EventPlaceModel>, boolean)} response
 */
kassy.data.DataManager.prototype.findEventPlaces = function(eventId, response) {
    var params = {'id': eventId.toString()};

    this.find('event_places', 'id', params, response, true);
};