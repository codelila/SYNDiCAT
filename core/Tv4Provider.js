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

var tv4 = require('tv4');
var languageNumber = 0;

var dateTimeRegex = new RegExp(
  '^' +
  '(\\d{4})\\-(\\d{2})\\-(\\d{2})' +        // full-date
  '[T ]' +
  '(\\d{2}):(\\d{2}):(\\d{2})(\\.\\d+)?' +  // partial-time
  '(Z|(?:([\\+|\\-])(\\d{2}):(\\d{2})))' +  // time-offset
  '$'
);

var Tv4Provider = function () {};

Tv4Provider.prototype = {
  getInstance: function (localeData) {
    var languageName = 'custom' + (++languageNumber);
    var l = Object.create(localeData);
    l.FORMAT_CUSTOM = '{message}';
    tv4.addLanguage(languageName, l);

    var tv4Instance = tv4.freshApi(languageName);
    this._addDateFormat(tv4Instance, localeData);
    this._addDateTimeFormat(tv4Instance, localeData);
    return tv4Instance;
  },

  _addDateFormat: function (tv4Instance, localeData) {
    tv4Instance.addFormat('date', function (data, schema) {
      if (typeof data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data)) {
        return null;
      }
      return localeData.DATE;
    });
  },

  _addDateTimeFormat: function (tv4Instance, localeData) {
    tv4Instance.addFormat('date-time', function (data, schema) {
      if (typeof data === 'string' && dateTimeRegex.test(data)) {
        return null;
      }
      return localeData.DATE_TIME;
    });
  }
};

module.exports = Tv4Provider;
