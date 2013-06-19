load('application');

before(loadLoan, {
    only: ['show', 'edit', 'update', 'destroy']
    });

action('new', function () {
    this.title = 'New loan';
    this.loan = new Loan;
    render();
});

action(function create() {
    Loan.create(req.body.Loan, function (err, loan) {
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
                    flash('error', 'Loan can not be created');
                    render('new', {
                        loan: loan,
                        title: 'New loan'
                    });
                } else {
                    flash('info', 'Loan created');
                    redirect(path_to.loans);
                }
            });
        });
    });
});

action(function index() {
    this.title = 'Loans index';
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
    this.title = 'Loan show';
    switch(params.format) {
        case "json":
            send({code: 200, data: this.loan});
            break;
        default:
            render();
    }
});

action(function edit() {
    this.title = 'Loan edit';
    switch(params.format) {
        case "json":
            send(this.loan);
            break;
        default:
            render();
    }
});

action(function update() {
    var loan = this.loan;
    this.title = 'Edit loan details';
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
                    render('edit');
                }
            });
        });
    });
});

action(function destroy() {
    this.loan.destroy(function (error) {
        respondTo(function (format) {
            format.json(function () {
                if (error) {
                    send({code: 500, error: error});
                } else {
                    send({code: 200});
                }
            });
            format.html(function () {
                if (error) {
                    flash('error', 'Can not destroy loan');
                } else {
                    flash('info', 'Loan successfully removed');
                }
                send("'" + path_to.loans + "'");
            });
        });
    });
});

function loadLoan() {
    Loan.find(params.id, function (err, loan) {
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
