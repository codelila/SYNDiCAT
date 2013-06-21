load('application');

before(loadLoan, {
    only: ['show', 'edit', 'contract_state', 'put_contract_state', 'loan_state', 'put_loan_state', 'contract']
    });

action('new', function () {
    this.title = t('loans.new');
    this.loan = new Loan;
    render();
});

action(function create() {
    var data = req.body.Loan;
    if (data.hasOwnProperty('rate_of_interest')) {
      data.rate_of_interest = data.rate_of_interest.replace(/,/g, '.');
    }
    data.date_created = Date.now();
    data.user_created = req.user.id;

    Loan.create(data, function (err, loan) {
        respondTo(function (format) {
            format.json(function () {
                if (err) {
                    send({code: 500, error: loan && loan.errors || err});
                } else {
                    send({code: 200, data: loan.toObject()});
                }
            });
            format.html(function () {
                if (err) {
                    flash('error', t('loans.cannot_create'));
                    render('new', {
                        loan: loan,
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
    Loan.all(function (err, loans) {
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
            send({code: 200, data: this.loan});
            break;
        default:
            render();
    }
});

action(function contract_state() {
    this.title = t(['loans.contract_state_edit', this.loan.id]);
    switch(params.format) {
        case "json":
            send(this.loan);
            break;
        default:
            render();
    }
});

action(function put_contract_state() {
    var loan = this.loan;
    this.title = t(['loans.contract_state_edit', this.loan.id]);
    body.Loan.updating_user = req.user.id;
    if (this.loan.contract_state === null && body.Loan.contract_state === 'sent_to_loaner') {
    } else if (this.loan.contract_state === 'sent_to_loaner' && body.Loan.contract_state === 'signature_received' &&
      req.user.can('receive signed contracts')) {
    } else {
      console.log(req.user.id + ' trying to do bad stuff');
      delete body.Loan.contract_state;
    }
    this.loan.updateAttributes(body.Loan, function (err) {
        respondTo(function (format) {
            format.json(function () {
                if (err) {
                    send({code: 500, error: loan && loan.errors || err});
                } else {
                    send({code: 200, data: loan});
                }
            });
            format.html(function () {
                if (!err) {
                    flash('info', 'Loan updated');
                    redirect(path_to.loan(loan));
                } else {
                    flash('error', 'Loan can not be updated');
                    render('contract_state');
                }
            });
        });
    });
});

action(function loan_state() {
    this.title = t(['loans.loan_state_edit', this.loan.id]);
    switch(params.format) {
        case "json":
            send(this.loan);
            break;
        default:
            render();
    }
});

action(function put_loan_state() {
    var loan = this.loan;
    this.title = t(['loans.loan_state_edit', this.loan.id]);
    body.Loan.updating_user = req.user.id;
    if (this.loan.loan_state === null && body.Loan.loan_state === 'loaned' &&
      req.user.can('receive loans')) {
    } else {
      console.log(req.user.id + ' trying to do bad stuff');
      delete body.Loan.loan_state;
    }
    this.loan.updateAttributes(body.Loan, function (err) {
        respondTo(function (format) {
            format.json(function () {
                if (err) {
                    send({code: 500, error: loan && loan.errors || err});
                } else {
                    send({code: 200, data: loan});
                }
            });
            format.html(function () {
                if (!err) {
                    flash('info', 'Loan updated');
                    redirect(path_to.loan(loan));
                } else {
                    flash('error', 'Loan can not be updated');
                    render('loan_state');
                }
            });
        });
    });
});

function inWords(val, joinAfter) {
  function join(a, joiner, b) {
    var ret = a;
    if (a && b) {
      ret += joiner;
    }
    ret += b;
    return ret;
  }

  if (val < 13) {
    return {
      0: '',
      1: joinAfter ? 'ein' : 'eins',
      2: 'zwei',
      3: 'drei',
      4: 'vier',
      5: 'fünf',
      6: 'sechs',
      7: 'sieben',
      8: 'acht',
      9: 'neun',
      10: 'zehn',
      11: 'elf',
      12: 'zwölf'
    }[val];
  } else if (val < 100) {
    var prefix = inWords(val % 10);
    return join(prefix, val > 20 ? 'und' : '', {
      1: 'zehn',
      2: 'zwanzig',
      3: 'dreißig',
      4: 'vierzig',
      5: 'fünfzig',
      6: 'sechzig',
      7: 'siebzig',
      8: 'achtzig',
      9: 'neunzig'
    }[Math.floor(val / 10)]);
  } else if (val < 1000) {
    return join(inWords(Math.floor(val / 100), true) + 'hundert', 'und', inWords(val % 100));
  } else if (val < 1000000) {
    return join(inWords(Math.floor(val / 1000), true) + 'tausend', 'und', inWords(val % 1000));
  } else {
    throw new Error('too big');
  }
}

action(function contract() {
  var render = require('node-pdf').render;
  var loan = this.loan;

  function tick(b) {
    return b ? '☑' : '☐';
  }

  var data = {
    debtor: {
      name: 'Hauswärts GmbH i.G.',
      address: 'Marchlewskistr. 101, 10243 Berlin'
    }, loaner: {
      name: loan.loaner_name,
      address: loan.loaner_address.replace(/\n/g, '\\\\')
    }, contract: {
      nr: loan.id,
      value: loan.value,
      value_in_words: inWords(loan.value),
      interest: loan.rate_of_interest,
      minimum_term: loan.minimum_term,
      yearly_interest_to: loan.interest_yearly_to.replace(/\n/g, '\\\\'),
      yearly_interest_tick: tick(loan.interest_yearly_to),
      cumulated_interest_tick: tick(!loan.interest_yearly_to),
      cancelation_period_tick: tick(loan.cancelation_period),
      granted_until_tick: tick(loan.granted_until),
      granted_until: loan.granted_until, // FIXME: format
      cancelation_period: loan.cancelation_period
    }
  };

  render(app.root + '/var/contract-template.tex', data, function (err,rs) {
    if (err) {
      console.log(err);
    } else {
      res.attachment('kreditvertrag-' + loan.id + '.pdf');
      rs.pipe(res);
    }
  });
});

function loadLoan() {
    Loan.find(params.id || params.loan_id, function (err, loan) {
        if (err || !loan) {
            if (!err && !loan && params.format === 'json') {
                return send({code: 404, error: 'Not found'});
            }
            redirect(path_to.loans);
        } else {
            this.loan = loan;
            next();
        }
    }.bind(this));
}
