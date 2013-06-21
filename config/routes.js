exports.routes = function (map) {
    map.resources('loans', {only: ['new', 'create', 'index', 'show']}, function (loan) {
      loan.get('contract_state', 'loans#contract_state');
      loan.put('contract_state', 'loans#put_contract_state');
      loan.get('loan_state', 'loans#loan_state');
      loan.put('loan_state', 'loans#put_loan_state');

      loan.get('contract', 'loans#contract');
    });

    map.root('loans#index');

    // Generic routes. Add all your routes below this line
    // feel free to remove generic routes
    map.all(':controller/:action');
    map.all(':controller/:action/:id');
};
