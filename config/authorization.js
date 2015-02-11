'use strict';

var groups = {
  paperwork: [ 'julian', 'franziska' ],
  account: [ 'adrian' ]
};

var groupPermissions = [
  {
    action: 'receive signed contracts',
    group: 'paperwork'
  }, {
    action: 'receive loans',
    group: 'account'
  }
];

module.exports = function (user, right) {
  var allowed = false;
  groupPermissions.forEach(function (o) {
    if (o.action === right && groups[o.group].indexOf(user) !== -1) {
      allowed = true;
    }
  });
  return allowed;
};
