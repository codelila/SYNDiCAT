'use strict';

var path = require('path');

var authorization = require('./authorization');
var LoanStates = require(path.resolve('core/LoanStates.js'));
var CombiningLoanChangeValidator = require('../core/Validators/CombiningLoanChangeValidator');
var DataChangePreventingValidator = require('../core/Validators/DataChangePreventingValidator');
var PermissionLoanStateChangeValidator = require('../core/Validators/PermissionLoanStateChangeValidator');
var StateMachineLoanChangeValidator = require('../core/Validators/StateMachineLoanChangeValidator');

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
