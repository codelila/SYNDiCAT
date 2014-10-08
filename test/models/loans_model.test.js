'use strict';

var assert = require('assert');
var sinon = require('sinon');

var strings = {
  models: {
    Loan: {
      fields: {
        granted_until: 'Kredit gewährt bis'
      }
    }
  },
  validate: {
    date: 'muss ein Datum im Format YYYY-MM-DD sein'
  }
};

var Loan = require('../../app/model/loan_bookshelf.js')(strings);

function loanStub() {
  var loan = new Loan({value: 10, loaner_name: 'Ich', loaner_address: 'Here',
    rate_of_interest: 0, granted_until: '2013-01-01', user_created: 'Me',
    date_created: (new Date()).toISOString()
  });
  loan.setCurUser({id: 'Me', can: function () { return true; }});
  return loan;
}

describe('LoanModel', function () {
  it('does not allow arbitrary updates', function (done) {
    var loan = loanStub();
    loan.save().then(function (l) {
      return l.set('value', 10000).save();
    }).then(function (m) {
      assert.ok(m.get('value') === 10, 'Should not have saved successfully');
      done();
    }, function (err) {
      err.message.should.equal('Not allowed to update value');
      done();
    });
  });

  it('allows updates of contract_state', function (done) {
    var loan = loanStub();
    loan.save().then(function (l) {
      return l.set('contract_state', 'sent_to_loaner').save();
    }).then(function (m) {
      if (m.get('contract_state') !== 'sent_to_loaner') {
        throw new Error('Should have saved successfully');
      }
      done();
    }, function (err) {
      done(err);
    });
  });

  it('updates date_contract_sent_to_loaner', function (done) {
    var loan = loanStub();
    loan.save().then(function (l) {
      if (l.get('date_contract_sent_to_loaner')) {
        throw new Error('date_contract_sent_to_loaner already set');
      }
      return l.set('contract_state', 'sent_to_loaner').save();
    }).then(function (m) {
      if (m.get('date_contract_sent_to_loaner') === null) {
        throw new Error('Did not update date_contract_sent_to_loaner');
      }
      done();
    }, function (err) {
      done(err);
    });
  });

  it('updates user_contract_sent_to_loaner', function (done) {
    var loan = loanStub();
    loan.save().then(function (l) {
      if (l.get('user_contract_sent_to_loaner')) {
        throw new Error('user_contract_sent_to_loaner already set');
      }
      return l.set('contract_state', 'sent_to_loaner').save();
    }).then(function (m) {
      if (m.get('user_contract_sent_to_loaner') !== 'Me') {
        throw new Error('Did not update user_contract_sent_to_loaner');
      }
      done();
    }, function (err) {
      done(err);
    });
  });

  it('validates date_created', function (done) {
    var loan = loanStub();
    loan.set('date_created', '2013');
    loan.save().then(function () {
      done('Should not have saved successfully');
    }, function (err) {
      err.should.equal('Erstelldatum muss ein Datum sein');
      done();
    });
  });
});
