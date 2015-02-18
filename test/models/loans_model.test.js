'use strict';

var assert = require('assert');
var sinon = require('sinon');

var testBookshelf = require('../testBookshelf');

var strings = {
  models: {
    Loan: {
      fields: {
        granted_until: 'Kredit gewährt bis',
        date_created: 'Erstelldatum'
      }
    }
  },
  validate: {
    date: 'muss ein Datum im Format YYYY-MM-DD sein'
  }
};

var Loan = require('../../app/model/loan_bookshelf.js')(strings, require('../../config/validation'), testBookshelf);

function loanStub() {
  var loan = new Loan({value: 10, loaner_name: 'Ich', loaner_address: 'Here',
    rate_of_interest: 0, granted_until: '2013-01-01', user_created: 'Me',
    date_created: (new Date()).toISOString()
  });
  loan.setCurUser('Me');
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
      assert.equal(err.message, 'Not allowed to update value');
      done();
    });
  });

  it('allows updates of contract_state', function (done) {
    var loan = loanStub();
    loan.save().then(function (l) {
      return l.set('contract_state', 'sent_to_loaner').save();
    }).then(function (m) {
      assert.equal(m.get('contract_state'), 'sent_to_loaner');
      done();
    }).then(null, done);
  });

  it('does not allow arbitrary updates of contract_state', function (done) {
    var loan = loanStub();
    loan.save().then(function (l) {
      return l.set('contract_state', 'signature_received').save();
    }).then(function (m) {
      done('Should not have saved successfully');
    }).then(null, function(err) {
      assert.equal(err.message, 'You are trying to do bad stuff');
      done();
    });
  });

  it('updates date_contract_sent_to_loaner', function (done) {
    var loan = loanStub();
    loan.save().then(function (l) {
      assert.equal(l.get('date_contract_sent_to_loaner'), null);
      return l.set('contract_state', 'sent_to_loaner').save();
    }).then(function (l) {
      assert.notEqual(l.get('date_contract_sent_to_loaner'), null);
      done();
    }).then(null, done);
  });

  it('updates user_contract_sent_to_loaner', function (done) {
    var loan = loanStub();
    loan.save().then(function (l) {
      assert.equal(l.get('user_contract_sent_to_loaner'), null);
      return l.set('contract_state', 'sent_to_loaner').save();
    }).then(function (l) {
      assert.equal(l.get('user_contract_sent_to_loaner'), 'Me');
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
      assert.equal(err, 'Erstelldatum muss ein Datum sein');
      done();
    });
  });
});
