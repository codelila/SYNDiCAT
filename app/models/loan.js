module.exports = function (compound, Loan) {
  // define Loan here
  Loan.validate('value', function (err) {
    if (!(Number(this.value) > 0)) {
      err();
    };
  }, {message: 'validate.positive_number'});

  Loan.validatesPresenceOf('minimum_term', {message: 'validate.presence_of'});
  Loan.validate('cancelation_period', function (err) {
    if (this.cancelation_period && this.granted_until) {
      err();
    }
  }, {message: 'validate.not_with_granted_until'});
  Loan.validate('cancelation_period', function (err) {
    if (!this.cancelation_period && !this.granted_until) {
      err();
    }
  }, {message: 'validate.one_of_and_granted_until'});
  Loan.validatesFormatOf('granted_until', {with: /^\d{4}-\d{2}-\d{2}$/, message: 'validate.date', allowBlank: true});

  Loan.validate('rate_of_interest', function (err) {
    if (Number.isNaN(Number(this.rate_of_interest))) {
      err();
    }
  }, {message: 'validate.number'});

  Loan.validatesPresenceOf('loaner_name', {message: 'validate.presence_of'});
  Loan.validatesPresenceOf('loaner_address', {message: 'validate.presence_of'});
  Loan.validatesPresenceOf('loaner_phone', {message: 'validate.presence_of'});

  var updateAllowedKeys = [ 'contract_state', 'loan_state' ];
  // FIXME: Error message instead?
  Loan.beforeUpdate = function (next, data) {
    var keys = Object.keys(data);
    var user = data.updating_user;
    data = keys.reduce(function(data, k) {
      if(updateAllowedKeys.indexOf(k) === -1) {
        delete data[k];
      }
      return data;
    }, data);
    if (data.contract_state) {
      data['date_contract_' + data.contract_state] = Date.now();
      data['user_contract_' + data.contract_state] = user;
    }
    if (data.loan_state) {
      data['date_loan_' + data.loan_state] = Date.now();
      data['user_loan_' + data.loan_state] = user;
    }
    next();
  };
};
