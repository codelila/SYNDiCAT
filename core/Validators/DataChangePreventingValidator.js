'use strict';

var DataChangePreventingValidator = function () {
};

DataChangePreventingValidator.prototype.validateChange = function (change) {
  var updateableKeys = [ 'contract_state', 'loan_state' ];

  return Object.keys(change.diff).reduce(function (ret, key) {
    if (ret !== null) {
      return ret;
    }
    if (change.diff[key] !== change.old[key]) {
      if (updateableKeys.indexOf(key) === -1) {
        return 'Not allowed to update ' + key;
      }
    }
    return null;
  }, null);
};

module.exports = DataChangePreventingValidator;
