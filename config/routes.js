exports.routes = function (map) {
    map.resources('loans', {only: ['new', 'create', 'index', 'show']}, function (loan) {
      loan.put('state', 'loans#put_state');

      loan.get('contract', 'loans#contract');
    });

    map.root('loans#index');

    // Generic routes. Add all your routes below this line
    // feel free to remove generic routes
    map.all(':controller/:action');
    map.all(':controller/:action/:id');
};
