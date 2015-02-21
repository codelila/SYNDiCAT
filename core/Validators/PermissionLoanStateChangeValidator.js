'use strict';

var PermissionLoanStateChangeValidator = function (states, statesToRights, hasRight) {
  this._states = states;
  this._statesToRights = statesToRights;
  this._hasRight = hasRight;
};

PermissionLoanStateChangeValidator.prototype.validateChange = function (change) {
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
};

module.exports = PermissionLoanStateChangeValidator;
