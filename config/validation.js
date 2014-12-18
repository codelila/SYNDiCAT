'use strict';

var path = require('path');

var authorization = require('./authorization');
var LoanStates = require(path.resolve('core/LoanStates.js'));

var CombiningLoanChangeValidator = function (validators) {
  this._validators = validators;
};

CombiningLoanChangeValidator.prototype = {
  _validators: [],

  validateChange: function (change) {
    return this._validators.reduce(function (state, validator) {
      if (state !== null) {
        return state;
      }
      return validator.validateChange(change);
    }, null);
  },
};

var StateMachineLoanChangeValidator = function (states) {
  this._states = states;
};

StateMachineLoanChangeValidator.prototype = {
  validateChange: function (change) {
    var oldState = {
      contract: change.old.contract_state,
      loan: change.old.loan_state
    };
    var newState = {
      contract: change.diff.contract_state,
      loan: change.diff.loan_state
    };

    return this._states.reduce(function (ret, state) {
      if (ret !== null) {
        return ret;
      }
      var isNew = state.isSet(newState);
      var isOld = state.isSet(oldState);
      var isOldNext = state.isNext(oldState);
      if ((isNew && !isOld && !isOldNext) || (isOld && !isNew)) {
        return 'You are trying to do bad stuff';
      }
      return null;
    }, null);
  }
};

var PermissionLoanStateChangeValidator = function (states, statesToRights, hasRight) {
  this._states = states;
  this._statesToRights = statesToRights;
  this._hasRight = hasRight;
};
PermissionLoanStateChangeValidator.prototype = {
  validateChange: function (change) {
    var self = this;
    var oldState = {
      contract: change.old.contract_state || null,
      loan: change.old.loan_state || null
    };
    var newState = {
      contract: change.diff.contract_state || null,
      loan: change.diff.loan_state || null
    };
    var newStates = this._states.filter(function (state) {
      return state.isSet(newState) && !state.isSet(oldState);
    });
    return newStates.reduce(function (ret, state) {
      if (ret !== null) {
        return ret;
      }
      if (self._statesToRights[state.name] && !self._hasRight(change.user, self._statesToRights[state.name])) {
        return 'You are trying to do bad stuff';
      }
      return null;
    }, null);
  }
};
var DataChangePreventingValidator = function () {
};
DataChangePreventingValidator.prototype = {
  validateChange: function (change) {
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

  }
};

var rights = {
  signature_received: 'receive signed contracts',
  loaned: 'receive loans',
  signature_sent: 'receive signed contracts'
};
var stateLoanChangeValidator = new CombiningLoanChangeValidator([
  new StateMachineLoanChangeValidator(LoanStates),
  new PermissionLoanStateChangeValidator(LoanStates, rights, authorization)
]);

var validator = new CombiningLoanChangeValidator([
  new DataChangePreventingValidator(),
  stateLoanChangeValidator
]);

module.exports = validator;
