'use strict';

var StateMachineLoanChangeValidator = function (states) {
  this._states = states;
};

StateMachineLoanChangeValidator.prototype.validateChange = function (change) {
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
};

module.exports = StateMachineLoanChangeValidator;
