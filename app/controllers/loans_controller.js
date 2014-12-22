'use strict';

var path = require('path');
var Promise = require('es6-promise').Promise;

var LoanGetter = require(path.resolve('app/model/loan_bookshelf.js'));

var validator = compound.app.settings.validator;
var Loan = LoanGetter(compound.__localeData[compound.app.settings.defaultLocale], validator);

load('application');

before(loadLoan, {
    only: ['show', 'edit', 'put_state', 'contract']
    });

action('new', function () {
    render({
      loan: new Loan().toCompoundViewObject(),
      title: t('loans.new'),
      user: req.user
    });
});

action(function create() {
    var data = Loan.fromStringHash(req.body.Loan);
    data.setCurUser(req.user.id);

    data.save().then(function (loan) {
        respondTo(function (format) {
            format.json(function () {
                redirect(path_to.loans);
            });
            format.html(function () {
                flash('info', t('loans.created'));
                redirect(path_to.loans);
            });
        });
    }, function (err) {
        respondTo(function (format) {
            format.json(function () {
                send({code: 500, error: err});
            });
            format.html(function () {
                flash('error', t('loans.cannot_create'));
                flash('error', err.message ? (t(err.message) || err.message) : err);
                render('new', {
                    loan: data.toCompoundViewObject(),
                    title: t('loans.new'),
                    user: req.user
                });
            });
        });
    });
});

action(function index() {
  (new Loan.Collection()).fetch().then(function (loans) {
    loans = loans.models;
    switch (params.format) {
      case "json":
        send({code: 200, data: loans});
        break;
      default:
        render({
          loans: loans,
          title: t('loans.index'),
          user: req.user
        });
    }
  });
});

var LoanStates = require(path.resolve('core/LoanStates.js'));
function getSteps(loan, user, validator) {
  var curState = {
    contract: loan.get('contract_state'),
    loan: loan.get('loan_state')
  };
  return LoanStates.map(function (loanState) {
    var newProps = {};
    newProps[loanState.type] = loanState.name;
    var change = {
      user: user,
      date: Date.now(),
      old: loan,
      diff: newProps
    };
    return {
      isNextStep: loanState.isNext(curState) && validator.validateChange(change) === null,
      stateType: loanState.type,
      state: loanState.name,
      isSet: loanState.isSet(curState)
    };
  });
}

action(function show() {
  switch(params.format) {
    case "json":
      send({code: 200, data: this.loan.attributes});
      break;
    default:
      render({
        loan: this.loan.toCompoundViewObject(),
        steps: getSteps(this.loan, req.user.id, validator),
        title: t(['loans.details', this.loan.id]),
        user: req.user
      });
  }
});

action(function put_state() {
    var loan = this.loan;
    this.loan.setCurUser(req.user.id);

    this.loan.set(body.Loan);
    this.loan.save().then(function () {
        respondTo(function (format) {
            format.json(function () {
                send({code: 200, data: loan.attributes});
            });
            format.html(function () {
                flash('info', 'Loan updated');
                redirect(path_to.loan(loan));
            });
        });
    }, function (err) {
        respondTo(function (format) {
            format.json(function () {
                send({code: 500, error: loan && loan.errors || err});
            });
            format.html(function () {
                flash('error', 'Loan can not be updated');
                flash('error', err.message ? (t(err.message) || err.message) : err);
                redirect(path_to.loan(loan));
            });
        });
    });
});

var pdf = require('node-pdf');
var ContractGenerator = require(path.resolve('core/ContractGenerator'));
var contractGenerator = new ContractGenerator(function (data) {
  return new Promise(function (resolve, reject) {
    pdf.render(path.resolve('config/contract-template.tex'), data, function (err,rs) {
      if (err) {
        reject(err);
      } else {
        resolve(rs);
      }
    });
  });
}, require(path.resolve('config/debtor')));

action(function contract() {
  var loanId = this.loan.attributes.id;

  contractGenerator.render(this.loan.attributes)
  .then(function (rs) {
    res.attachment('kreditvertrag-' + loanId + '.pdf');
    rs.pipe(res);
  }).catch(function (err) {
    console.log(err);
  });
});

function loadLoan() {
    new Loan({id: params.id || params.loan_id}).fetch().then(function (loan) {
        if (!loan) {
            if (params.format === 'json') {
                return send({code: 404, error: 'Not found'});
            }
            return redirect(path_to.loans);
        }
        this.loan = loan;
        next();
    }.bind(this), function (err) {
        console.log(err);
        redirect(path_to.loans);
    }.bind(this));
}
