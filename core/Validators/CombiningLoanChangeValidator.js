'use strict';

var CombiningLoanChangeValidator = function (validators) {
  this._validators = validators;
};

CombiningLoanChangeValidator.prototype._validators = [];

CombiningLoanChangeValidator.prototype.validateChange = function (change) {
  return this._validators.reduce(function (state, validator) {
    if (state !== null) {
      return state;
    }
    return validator.validateChange(change);
  }, null);
};

module.exports = CombiningLoanChangeValidator;
