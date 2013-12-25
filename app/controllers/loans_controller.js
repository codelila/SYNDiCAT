var path = require('path');
var Loan = (require(path.resolve('app/model/loan_bookshelf.js'))(compound.__localeData[compound.app.settings.defaultLocale]));
var Bookshelf = require('bookshelf');
require('bookshelf/plugins/exec');

load('application');

before(loadLoan, {
    only: ['show', 'edit', 'put_state', 'contract']
    });

action('new', function () {
    this.title = t('loans.new');
    this.loan = new Loan;
    render();
});

action(function create() {
    var data = Loan.fromStringHash(req.body.Loan);
    if (Object.prototype.hasOwnProperty.call(data.attributes, 'rate_of_interest')) {
      data.set('rate_of_interest', data.attributes.rate_of_interest.replace(/,/g, '.'));
    }
    data.setCurUser(req.user.id || 'unknown user');

    data.save().exec(function (err, loan) {
        respondTo(function (format) {
            format.json(function () {
                if (err) {
                    send({code: 500, error: err});
                } else {
                    redirect(path_to.loans);
                }
            });
            format.html(function () {
                if (err) {
                    flash('error', t('loans.cannot_create'));
                    flash('error', err.message ? (t(err.message) || err.message) : err);
                    render('new', {
                        loan: data,
                        title: t('loans.new')
                    });
                } else {
                    flash('info', t('loans.created'));
                    redirect(path_to.loans);
                }
            });
        });
    });
});

action(function index() {
    this.title = t('loans.index');
    Bookshelf.Collection.extend({model: Loan})
        .forge()
        .fetch()
        .exec(function (err, loans) {
        loans = loans.models;
        switch (params.format) {
            case "json":
                send({code: 200, data: loans});
                break;
            default:
                render({
                    loans: loans
                });
        }
    });
});

action(function show() {
    this.title = t(['loans.details', this.loan.id]);
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
    data.setCurUser(req.user.id || 'unknown user');
    if (this.loan.contract_state === null && body.Loan.contract_state === 'sent_to_loaner') {
    } else if (this.loan.contract_state === 'sent_to_loaner' && body.Loan.contract_state === 'signature_received' &&
      req.user.can('receive signed contracts')) {
    } else if (this.loan.contract_state === 'signature_received' && body.Loan.contract_state === 'signature_sent' &&
      req.user.can('receive signed contracts')) {
    } else if (body.Loan.contract_state) {
      console.log(req.user.id + ' trying to do bad stuff');
      delete body.Loan.contract_state;
    }
    if (this.loan.loan_state === null && body.Loan.loan_state === 'loaned' &&
      req.user.can('receive loans')) {
    } else if (body.Loan.loan_state) {
      console.log(req.user.id + ' trying to do bad stuff');
      delete body.Loan.loan_state;
    }
    this.loan.set(body.Loan, function (err) {
        respondTo(function (format) {
            format.json(function () {
                if (err) {
                    send({code: 500, error: loan && loan.errors || err});
                } else {
                    send({code: 200, data: loan.attributes});
                }
            });
            format.html(function () {
                if (!err) {
                    flash('info', 'Loan updated');
                } else {
                    flash('error', 'Loan can not be updated');
                }
                redirect(path_to.loan(loan));
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
    new Loan({id: params.id || params.loan_id}).fetch().exec(function (err, loan) {
        if (err || !loan) {
            if (!err && !loan && params.format === 'json') {
                return send({code: 404, error: 'Not found'});
            }
            redirect(path_to.loans);
        } else {
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
        }
    }.bind(this));
}
