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

var assert = require('assert');
var Promise = require('es6-promise').Promise;
var sinon = require('sinon');

var Tv4Provider = require('../../core/Tv4Provider.js');

describe('Tv4Provider', function () {
  it('is constructable', function () {
    var tv4Provider = new Tv4Provider();

    assert.ok(tv4Provider instanceof Tv4Provider);
  });

  describe('getInstance', function () {
    it('returns a tv4 instance', function () {
      var tv4Provider = new Tv4Provider();
      var tv4Instance = tv4Provider.getInstance({});
      assert.ok(tv4Instance.validateResult);
    });

    it('returns a tv4 instance with correct locale set', function () {
      var tv4Provider = new Tv4Provider();
      var tv4Instance = tv4Provider.getInstance({
        INVALID_TYPE: "INVALID_TYPE {type} {expected}",
      });
      var result = tv4Instance.validateResult({
        field: 'data'
      }, {
        properties: {
          field: { type: 'integer' }
        }
      });
      assert.equal(result.error.message, 'INVALID_TYPE string integer' );
    });

    it('returns two tv4 instances with correct locale set', function () {
      var tv4Provider = new Tv4Provider();
      var tv4Instance1 = tv4Provider.getInstance({
        INVALID_TYPE: "INVALID_TYPE1 {type} {expected}",
      });
      var tv4Instance2 = tv4Provider.getInstance({
        INVALID_TYPE: "INVALID_TYPE2 {type} {expected}",
      });
      var result = tv4Instance1.validateResult({
        field: 'data'
      }, {
        properties: {
          field: { type: 'integer' }
        }
      });
      assert.equal(result.error.message, 'INVALID_TYPE1 string integer' );
      result = tv4Instance2.validateResult({
        field: 'data'
      }, {
        properties: {
          field: { type: 'integer' }
        }
      });
      assert.equal(result.error.message, 'INVALID_TYPE2 string integer' );
    });

    it('returns a tv4 instance which recognizes a date', function () {
      var tv4Provider = new Tv4Provider();
      var tv4Instance = tv4Provider.getInstance({
        DATE: "DATE"
      });
      var result = tv4Instance.validateResult({
        field: '2013-01-01'
      }, {
        properties: {
          field: { type: 'string', format: 'date' }
        }
      });
      assert.ok(result.valid);
    });

    it('returns a tv4 instance which recognizes an incorrect date', function () {
      var tv4Provider = new Tv4Provider();
      var tv4Instance = tv4Provider.getInstance({
        DATE: 'DATE'
      });
      var result = tv4Instance.validateResult({
        field: '2013-01-'
      }, {
        properties: {
          field: { type: 'string', format: 'date' }
        }
      });
      assert.equal(result.error.message, 'DATE');
    });

    it('returns a tv4 instance which recognizes a date-time', function () {
      var tv4Provider = new Tv4Provider();
      var tv4Instance = tv4Provider.getInstance({
        DATE_TIME: "DATE_TIME"
      });
      var result = tv4Instance.validateResult({
        field: '2013-01-01 00:00:00Z'
      }, {
        properties: {
          field: { type: 'string', format: 'date-time' }
        }
      });
      assert.ok(result.valid);
    });

    it('returns a tv4 instance which recognizes an incorrect date-time', function () {
      var tv4Provider = new Tv4Provider();
      var tv4Instance = tv4Provider.getInstance({
        DATE_TIME: 'DATE_TIME'
      });
      var result = tv4Instance.validateResult({
        field: '2013-01-'
      }, {
        properties: {
          field: { type: 'string', format: 'date-time' }
        }
      });
      assert.equal(result.error.message, 'DATE_TIME');
    });
  });
});
