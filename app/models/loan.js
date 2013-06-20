module.exports = function (compound, Loan) {
  // define Loan here
  Loan.validate('value', function (err) {
    if (!(Number(this.value) > 0)) {
      err();
    };
  }, {message: 'validate.positive_number'});

  Loan.validatesPresenceOf('start_date', {message: 'validate.presence_of'});
  Loan.validatesFormatOf('start_date', {with: /^\d{4}-\d{2}-\d{2}$/, message: 'validate.date'});

  Loan.validate('rate_of_interest', function (err) {
    if (Number.isNaN(Number(this.rate_of_interest))) {
      err();
    }
  }, {message: 'validate.number'});

  Loan.validatesPresenceOf('loaner_name', {message: 'validate.presence_of'});

  Loan.validatesPresenceOf('loaner_address', {message: 'validate.presence_of'});
/*
    property('cancelation_period', String);
    property('minimum_term', String);

    property('contract_state', String);
    property('loan_state', String);
    property('date_contract_sent_to_loaner', Date);
    property('date_contract_signature_received', Date);
    property('date_loan_loaned', Date);
    property('date_loan_repaid', Date);
*/

  var updateAllowedKeys = [ 'contract_state', 'loan_state' ];
  // FIXME: Error message instead?
  Loan.beforeUpdate = function (next, data) {
    var keys = Object.keys(data);
    data = keys.reduce(function(data, k) {
      if(updateAllowedKeys.indexOf(k) === -1) {
        delete data[k];
      }
      return data;
    }, data);
    if (data.contract_state) {
       data['date_contract_' + data.contract_state] = Date.now();
    }
    next();
  };
};
