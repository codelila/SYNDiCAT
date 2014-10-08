'use strict';

var user = require('connect-roles');

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

function groupBased(groupName) {
  return function (req) {
    if (groups[groupName].indexOf(req.user.id) !== -1) {
      return true;
    }
  };
}

groupPermissions.forEach(function (o) {
  user.use(o.action, groupBased(o.group));
});

module.exports = user;
