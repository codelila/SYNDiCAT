'use strict';

var Bookshelf = require('bookshelf');

module.exports = Bookshelf.initialize({
  client: 'sqlite',
  connection: {
    filename: './var/test.sqlite3'
  }
});
