'use strict';

var authorization = require('./authorization');
var SyndicatValidator = require('../core/Validators/SyndicatValidator');

module.exports = SyndicatValidator(authorization);
