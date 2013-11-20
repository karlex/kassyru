goog.provide('kassy.data.Model');

/**
 * @param {Object.<string, *>} values
 * @constructor
 */
kassy.data.Model = function(values) {
    /** @type {Object.<string, *>} */
    this.values_ = values;
};

/**
 * @param {string} field
 * @return {*}
 */
kassy.data.Model.prototype.get = function(field) {
    return this.values_[field];
};

/**
 * @constructor
 * @extends {kassy.data.Model}
 */
kassy.data.SubdivisionModel = function(values) {
    goog.base(this, values);
    this.id = values['id'];
    this.name = values['name'];
    this.db = values['db'];
};
goog.inherits(kassy.data.SubdivisionModel, kassy.data.Model);

/**
 * @constructor
 * @extends {kassy.data.Model}
 */
kassy.data.BuildingTypeModel = function(values) {
    goog.base(this, values);
    this.id = values['id'];
    this.name = values['name'];
    this.kind = ~~values['kind'];

    this.state = ~~values['state'];

    this.order = ~~values['order'];

    this.other = ~~values['other'];

    var icon = values['icon'];
    if (goog.isDef(icon)) {
        this.icon = icon;
    } else {
        this.icon = kassy.config.getBuildingIcon(this.id);
    }
};
goog.inherits(kassy.data.BuildingTypeModel, kassy.data.Model);

/**
 * @constructor
 * @extends {kassy.data.Model}
 */
kassy.data.BuildingModel = function(values) {
    //<building id="365" type_id="4" region_id="1" name="Hilton Garden Inn Perm" namei="hilton-garden-inn-perm" descr=""
    // address="614022, Пермь, ул. Мира, 45б" phone="(342) 227-67-87" url="www.hi-perm.ru" workhrs="" hall_count="1"
    // marginprc="0" _lat="57.978008" _lng="56.187042" _sale="1" _state="1"/>
    goog.base(this, values);
    this.id = values['id'];
    this.name = goog.string.unescapeEntities(values['name'].replace(/\\/g, ''));
    this.description = goog.string.unescapeEntities(kassy.utils.replaceUrlWithLinks(values['descr'] + ''));
    this.address = values['address'];
    this._lat = values['geo_lat'];
    this._lng = values['geo_lng'];
    this.workhours = values['workhrs'];
    this.card = ~~values['is_pos'];

    if (goog.string.trim(values['phone']).length > 0) {
        this.phones = goog.array.map(values['phone'].split(','), function(phone) { return '+7 ' + goog.string.trim(phone); });
    } else {
        this.phones = [];
    }
};
goog.inherits(kassy.data.BuildingModel, kassy.data.Model);

/**
 * @constructor
 * @extends {kassy.data.Model}
 */
kassy.data.HallModel = function(values) {
    goog.base(this, values);

    //id="56" building_id="31" name="NewStar" descr="NewStar" updated="1280139120" navigated="0" hidden="0" width="534" height="598" _state="1"

    this.id = values['id'];
    this.buildingId = values['building_id'];
    this.name = values['name'];
    this.descr = values['descr'];
    this.width = ~~values['width'];
    this.height = ~~values['height'];
    this.hidden = ~~values['hidden'];
    this.state = ~~values['state'];
};
goog.inherits(kassy.data.HallModel, kassy.data.Model);

/**
 * @constructor
 * @extends {kassy.data.Model}
 */
kassy.data.SectionModel = function(values) {
    goog.base(this, values);

    //<section id="1180" hall_id="49" metric_id="1" name=" " namei="" width="1108" height="135" _state="1"/>

    this.id = values['id'];
    this.hallId = values['hall_id'];
    this.name = values['name'];
    this.width = ~~values['width'];
    this.height = ~~values['height'];
    this.state = ~~values['state'];
};
goog.inherits(kassy.data.SectionModel, kassy.data.Model);

/**
 * @constructor
 * @extends {kassy.data.Model}
 */
kassy.data.PlaceModel = function(values) {
    goog.base(this, values);
    //<place id="32531" section_id="1172" title_mretic_id="6" title="1" place_metric_id="7" place="1" x="14" y="0" _state="1"/>

    this.id = values['id'];
    this.sectionId = values['section_id'];
    this.x = ~~values['x'];
    this.y = ~~values['y'];
    this.row = ~~values['title'];
    this.num = ~~values['name'];
    this.state = ~~values['state'];
};
goog.inherits(kassy.data.PlaceModel, kassy.data.Model);

/**
 * @constructor
 * @extends {kassy.data.Model}
 */
kassy.data.EventModel = function(values) {
    goog.base(this, values);

    //<event id="236" show_id="0" hall_id="0" date="" is_gst="0" is_prm="0" is_recommend="0" _state="1" />

    this.id = ~~values['id'];
    this.showId = ~~values['show_id'];
    this.hallId = ~~values['hall_id'];
    this.dateTime = ~~values['date'];
    this.state = ~~values['state'];
    this.isPremier = ~~values['is_prm'];
    this.isRecommend = ~~values['is_recommend'];

    this.timeHHMM = kassy.data.EventModel.getTimeHHMM(this.dateTime);
};
goog.inherits(kassy.data.EventModel, kassy.data.Model);

/**
 * @param {number} dateTime
 * @return {string}
 * @private
 */
kassy.data.EventModel.getTimeHHMM = function(dateTime) {
    var time = new Date(dateTime * 1000),
        hh = goog.string.padNumber(time.getHours(), 2),
        mm = goog.string.padNumber(time.getMinutes(), 2);

    return hh + ':' + mm;
};

/**
 * @constructor
 * @extends {kassy.data.Model}
 */
kassy.data.ShowModel = function(values) {
    goog.base(this, values);
    /*
    id="4956717"
    type_id="дт"
    name="Мама для мамонтёнка"
    namei="mama-dlya-mamontyonka"
    _descr=""
    hidden="0"
    marginprc="0"
    rollerman_id="9540"
    duration=""
    age_restriction="0+"
    rating="0"
    _announce=""
    _videoid=""
    _sale="1"
    _state="1"
    image=""
    */

    this.id = values['id'];
    this.name = goog.string.unescapeEntities(values['name'].replace(/\\/g, ''));
    this.typeId = values['type_id'];
    this.ageRestriction = values['age_restriction'];
    this.rating = ~~values['rating'];
    this.duration = ~~values['duration']; // сек.
    this.announce = ~~values['announce'];
    this.description = goog.string.unescapeEntities(values['descr'].replace(/<[^>]+>/g,''));
    this.image = (values['image'] ? 'http://' + kassy.settings.getRegionId() + '.kassy.ru/media/' + values['image'] : '');
    this.price = ~~values['marginprc'];

    switch(this.rating) {
        case 1: this.ratingEn = 'one'; break;
        case 2: this.ratingEn = 'two'; break;
        case 3: this.ratingEn = 'three'; break;
        case 4: this.ratingEn = 'four'; break;
        case 5: this.ratingEn = 'five'; break;
        default: this.ratingEn = ''; break;
    }
    if (this.duration > 0) {
        this.durationHHMM = goog.getMsg('{$hh}:{$mm}', {
            'hh': goog.string.padNumber(Math.floor(this.duration / 3600), 2),
            'mm': goog.string.padNumber(Math.floor((this.duration % 3600) / 60), 2)
        });
    }
};
goog.inherits(kassy.data.ShowModel, kassy.data.Model);

/**
 * @constructor
 * @extends {kassy.data.Model}
 */
kassy.data.ShowTypeModel = function(values) {
    goog.base(this, values);
    this.id = values['id'];
    this.name = values['name'];
    this.description = values['descr'];

    this.order = ~~values['order'];
    this.other = ~~values['other'];

    var icon = values['icon'];
    if (goog.isDef(icon)) {
        this.icon = icon;
    } else {
        this.icon = kassy.config.getShowIcon(this.id);
    }
};
goog.inherits(kassy.data.ShowTypeModel, kassy.data.Model);

/**
 * @constructor
 * @extends {kassy.data.Model}
 */
kassy.data.EventPlaceModel = function(values) {
    //<place id="195428" event_id="5692422" price="5000.00" color="FF0080" state="1"/>

    goog.base(this, values);
    this.placeId = values['id'];
    this.eventId = values['event_id'];
    this.color = values['color'];
    this.price = parseFloat(values['price']);
    this.state = values['state'];
};
goog.inherits(kassy.data.EventPlaceModel, kassy.data.Model);