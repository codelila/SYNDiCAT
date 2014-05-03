var path = require('path');
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

action(function show() {
  this.title = t(['loans.details', this.loan.id]);
  this.loan = this.loan.toCompoundViewObject();
  switch(params.format) {
    case "json":
      send({code: 200, data: this.loan.attributes});
      break;
    default:
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

var inWords = require('in-words').de;
var pdf = require('node-pdf');
var moment = require('moment');

action(function contract() {
  var loan = this.loan.attributes;

  var grantedUntil = moment(loan.granted_until, 'YYYY-MM-DD');
  var data = {
    debtor: {
      name: 'Hauswärts GmbH',
      address: 'Burgemeisterstr. 17--18, 12103 Berlin'
    }, loaner: {
      name: loan.loaner_name,
      address: loan.loaner_address.replace(/\n/g, '\\\\')
    }, contract: {
      nr: loan.id,
      value: loan.value,
      valueInWords: inWords(loan.value),
      interest: loan.rate_of_interest,
      minimumTerm: loan.minimum_term,
      yearlyInterestTo: loan.interest_yearly_to.replace(/\n/g, '\\\\'),
      grantedUntil: grantedUntil && grantedUntil.lang('de').format('LL'),
      cancelationPeriod: loan.cancelation_period
    }
  };

  pdf.render(app.root + '/config/contract-template.tex', data, function (err,rs) {
    if (err) {
      console.log(err);
    } else {
      res.attachment('kreditvertrag-' + loan.id + '.pdf');
      rs.pipe(res);
    }
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
        loan = loan.attributes;

        this.steps = [{
          isNextStep: loan.contract_state === null,
          desc: t(['loans.contract_state.sent_to_loaner.desc', pathTo.contract_loan(this.loan)]),
          stateType: 'contract_state',
          state: 'sent_to_loaner',
          isSet: loan.contract_state !== null,
        }, {
          isNextStep: loan.contract_state === 'sent_to_loaner' && req.user.can('receive signed contracts'),
          stateType: 'contract_state',
          state: 'signature_received',
          isSet: loan.contract_state === 'signature_received' || loan.contract_state === 'signature_sent',
        }, {
          isNextStep: loan.loan_state === null && req.user.can('receive loans'),
          stateType: 'loan_state',
          state: 'loaned',
          isSet: loan.loan_state !== null,
        }, {
          isNextStep: loan.contract_state === 'signature_received' && loan.loan_state === 'loaned' && req.user.can('receive signed contracts'),
          stateType: 'contract_state',
          state: 'signature_sent',
          isSet: loan.contract_state === 'signature_sent'
        }];
        next();
    }.bind(this), function (err) {
        console.log(err);
        redirect(path_to.loans);
    }.bind(this));
}
