/**
 * @fileoverview
 *
 * Provides a relief.auth.User implementation.
 */

goog.provide('kassy.auth.AuthLevel');
goog.provide('kassy.auth.User');

goog.require('relief.auth.User');



/**
 * A class encapsulating the user's auth/auth credentials.  If the user is not
 * logged in, all identifying fields will be empty strings and authLevel should
 * be ANONYMOUS.
 *
 * @param {string} name The user's display name.
 * @param {string} email The user's e-mail address.
 * @param {string} id The user's unique ID.
 * @param {kassy.auth.AuthLevel} authLevel The user's authnorization level.
 * @param {boolean} newUser Whether the user needs to register.
 *
 * @constructor
 * @implements {relief.auth.User}
 */
kassy.auth.User = function(name, email, id, authLevel, newUser) {
  /**
   * @type {string}
   * @private
   */
  this.name_ = name;

  /**
   * @type {string}
   * @private
   */
  this.email_ = email;

  /**
   * @type {string}
   * @private
   */
  this.id_ = id;

  /**
   * @type {kassy.auth.AuthLevel}
   * @private
   */
  this.authLevel_ = authLevel;

  /**
   * @type {boolean}
   * @private
   */
  this.newUser_ = newUser;
};


/**
 * Auth levels used in this app.
 * @enum {number}
 */
kassy.auth.AuthLevel = {
  /**
   * Not logged in
   */
  ANONYMOUS: 0,

  /**
   * Normal user
   */
  NORMAL_USER: 1,

  /**
   * Admin
   */
  ADMIN: 2
};


/**
 * Determines whether the user is allowed to execute the given handler.  This is
 * done by comparing the user's authorization level to the handler constructor's
 * "requiredAuth" property.
 *
 * @param {function(new: relief.nav.Handler)} handler The handler against which
 *    to test for sufficient authorization.
 * @return {boolean} Whether or not the user is allowed to execute the given
 *    handler.
 * @override
 */
kassy.auth.User.prototype.checkAuthorized = function(handler) {
  var req = /** @type {undefined|number} */ (handler.requiredAuth);
  if (req) {
    return this.authLevel_ >= req;
  }
  else {
    return true;
  }
};


/**
 * Compares two kassy.auth.User objects.  Checks that the unique user ID is the
 * same, and that the user's authorization level hasn't changed.
 *
 * @param {relief.auth.User} other The other User object.
 * @return {boolean} Whether the two are equivalent.
 * @override
 */
kassy.auth.User.prototype.equals = function(other) {
  other = /** @type {kassy.auth.User} */ (other);
  return (other instanceof kassy.auth.User) &&
         (other.getId() === this.id_) &&
         (other.getAuthLevel() === this.authLevel_);
};


/**
 * @return {kassy.auth.User} A copy of this User object.
 * @override
 */
kassy.auth.User.prototype.clone = function() {
  return new kassy.auth.User(this.name_, this.email_, this.id_,
                          this.authLevel_, this.newUser_);
};


/**
 * @return {string} The user's display name.
 */
kassy.auth.User.prototype.getName = function() {
  return this.name_;
};


/**
 * Sets the user's display name.  This should only ever be called by the
 * Auth Manager for the app.
 *
 * @param {string} name The user's new display name.
 */
kassy.auth.User.prototype.setName = function(name) {
  this.name_ = name;
};


/**
 * @return {string} The user's display name.
 */
kassy.auth.User.prototype.getEmail = function() {
  return this.email_;
};


/**
 * @return {string} The user's display name.
 */
kassy.auth.User.prototype.getId = function() {
  return this.id_;
};


/**
 * @return {kassy.auth.AuthLevel} The user's authorization level.
 */
kassy.auth.User.prototype.getAuthLevel = function() {
  return this.authLevel_;
};


/**
 * @return {boolean} Whether the user still has to register.
 */
kassy.auth.User.prototype.isNewUser = function() {
  return this.newUser_;
};