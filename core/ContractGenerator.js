/**
 * Copyright 2014 Adrian Lang <mail@adrianlang.de>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

var inWords = require('in-words').de;
var moment = require('moment');
var Promise = require('es6-promise').Promise;

var ContractGenerator = function (renderPdf) {
  this._renderPdf = renderPdf;
};

ContractGenerator.prototype = {
  _renderPdf: null,

  render: function (data) {
    var grantedUntil = moment(data.loan.granted_until, 'YYYY-MM-DD');
    return this._renderPdf({
      debtor: data.debtor,
      loaner: {
        name: data.loan.loaner_name,
        address: data.loan.loaner_address.replace(/\n/g, '\\\\')
      },
      contract: {
        nr: data.loan.id,
        value: data.loan.value,
        valueInWords: inWords(data.loan.value),
        interest: data.loan.rate_of_interest,
        minimumTerm: data.loan.minimum_term,
        yearlyInterestTo: (data.loan.interest_yearly_to || '').replace(/\n/g, '\\\\'),
        grantedUntil: grantedUntil && grantedUntil.lang('de').format('LL'),
        cancelationPeriod: data.loan.cancelation_period
      }
    });
  }
};

module.exports = ContractGenerator;
