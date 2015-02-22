'use strict';

var LoanStates = require('../LoanStates');
var CombiningLoanChangeValidator = require('./CombiningLoanChangeValidator');
var DataChangePreventingValidator = require('./DataChangePreventingValidator');
var PermissionLoanStateChangeValidator = require('./PermissionLoanStateChangeValidator');
var StateMachineLoanChangeValidator = require('./StateMachineLoanChangeValidator');

var rights = {
  signature_received: 'receive signed contracts',
  loaned: 'receive loans',
  signature_sent: 'receive signed contracts'
};

module.exports = function (authorization) {
  var stateLoanChangeValidator = new CombiningLoanChangeValidator([
    new StateMachineLoanChangeValidator(LoanStates),
    new PermissionLoanStateChangeValidator(LoanStates, rights, authorization)
  ]);

  var validator = new CombiningLoanChangeValidator([
    new DataChangePreventingValidator(),
    stateLoanChangeValidator
  ]);

  return validator;
};
