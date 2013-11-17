/**
 * @fileoverview
 *
 * Provides an auth manager
 */


goog.provide('kassy.auth.AuthManager');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventType');
goog.require('goog.soy');

//goog.require('kassy.auth.AuthCheckCommand');
//goog.require('kassy.auth.UpdateUserCommand');
//goog.require('kassy.auth.templates');
goog.require('kassy.auth.User');
goog.require('kassy.auth.AuthLevel');

goog.require('relief.auth.AuthChangeEvent');
goog.require('relief.auth.AuthManager');
goog.require('relief.auth.EventType');



/**
 * An AuthManager implementation that can talk to the Relieved back-end.
 *
 * @param {relief.rpc.RPCService} rpc The app's RPC service.
 *
 * @constructor
 * @extends {relief.auth.AuthManager}
 */
kassy.auth.AuthManager = function(rpc) {
  goog.base(this);

  /**
   * @type {relief.rpc.RPCService}
   * @private
   */
  this.rpc_ = rpc;

  /**
   * Whether a request to the server is currently in progress.
   * @type {boolean}
   * @private
   */
  this.pendingRequest_ = false;

  /**
   * Array of callbacks to be executed when a request returns.
   *
   * @type {!Array.<function(relief.auth.User)>}
   * @private
   */
  this.listeners_ = [];

  /**
   * The current user.
   * @type {kassy.auth.User}
   * @private
   */
  this.user_ = new kassy.auth.User('Вася', 'email', 'id', kassy.auth.AuthLevel.NORMAL_USER, false);
};
goog.inherits(kassy.auth.AuthManager, relief.auth.AuthManager);


/**
 * Takes a callback and calls it with an appropriate kassy.auth.User object.
 *
 * @param {function(kassy.auth.User)} callback The client's callback.
 * @override
 */
kassy.auth.AuthManager.prototype.getCurrentUser = function(callback) {
  if (this.pendingRequest_) {
    this.listeners_.push(callback);
  }
  else {
    var user = this.user_;
    if (user) {
      callback(user.clone());
    }
    else {
      this.pendingRequest_ = true;
      this.listeners_.push(callback);

      /*var authCheck = new rb.auth.AuthCheckCommand(goog.bind(this.gotUser_, this));
      this.rpc_.execute(authCheck);*/
    }
  }
};


/**
 * Callback called when the server check returns.
 *
 * @param {kassy.auth.User} user The new user object.
 * @private
 */
kassy.auth.AuthManager.prototype.gotUser_ = function(user) {
  this.user_ = user;

  if (user.isNewUser()) {
    //this.registerUser_(user);
  }
  else {
    this.dispatchUser_(user);
  }
};

/**
 * Dispatches the new user to any listeners.
 * @param {kassy.auth.User} user The user to object to send out.
 *
 * @private
 */
kassy.auth.AuthManager.prototype.dispatchUser_ = function(user) {
  this.pendingRequest_ = false;
  user = user.clone();

  var listeners = this.listeners_;
  for (var i = 0, len = listeners.length; i < len; ++i) {
    listeners[i](user);
  }

  this.listeners_ = [];

  var event = /** @type {relief.auth.AuthChangeEvent} */ ({
    type: relief.auth.EventType.AUTH_CHANGE,
    user: user
  });

  this.dispatchEvent(event);
};


/**
 * @inheritDoc
 */
kassy.auth.AuthManager.prototype.disposeInternal = function() {
  var handler = this.handler_;
  if (handler) {
    handler.dispose();
    this.handler_ = null;
  }

  this.pendingRequest_ = false;
  this.rpc_ = this.user_ = null;

  this.listeners_ = [];

  goog.base(this, 'disposeInternal');
};