'use strict';

var path = require('path');
var Promise = require('es6-promise').Promise;

var Loan = (require(path.resolve('app/model/loan_bookshelf.js'))(compound.__localeData[compound.app.settings.defaultLocale]));

load('application');

before(loadLoan, {
    only: ['show', 'edit', 'put_state', 'contract']
    });

action('new', function () {
    this.title = t('loans.new');
    this.loan = new Loan().toCompoundViewObject();
    render();
});

action(function create() {
    var data = Loan.fromStringHash(req.body.Loan);
    data.setCurUser(req.user);

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
                    title: t('loans.new')
                });
            });
        });
    });
});

action(function index() {
  this.title = t('loans.index');
  (new Loan.Collection()).fetch().then(function (loans) {
    loans = loans.models;
    switch (params.format) {
      case "json":
        send({code: 200, data: loans});
        break;
      default:
        render({loans: loans});
    }
  });
});

var LoanStates = require(path.resolve('core/LoanStates.js'));
function getSteps(loan, req) {
  var curState = {
    contract: loan.get('contract_state'),
    loan: loan.get('loan_state')
  };
  var rights = {
    signature_received: 'receive signed contracts',
    loaned: 'receive loans',
    signature_sent: 'receive signed contracts'
  };
  return LoanStates.map(function (loanState) {
    return {
      isNextStep: loanState.isNext(curState) && (!rights[loanState.name] || req.user.can(rights[loanState.name])),
      stateType: loanState.type,
      state: loanState.name,
      isSet: loanState.isSet(curState)
    };
  });
}

action(function show() {
  this.title = t(['loans.details', this.loan.id]);

  switch(params.format) {
    case "json":
      send({code: 200, data: this.loan.attributes});
      break;
    default:
      this.steps = getSteps(this.loan, req);
      this.loan = this.loan.toCompoundViewObject();
      render();
  }
});

action(function put_state() {
    var loan = this.loan;
    loan.setCurUser(req.user);

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
                render('show', {
                    loan: loan.toCompoundViewObject(),
                    title: t(['loans.details', loan.id])
                });
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
