// Credentials functions to get them from the command line
'use strict';

const mLog = require('./logging-func');
const readline = require('readline-sync'); 
const username = undefined;
const password = undefined;

var credentials = {
  _if_undef_readline: async function(myVar,myQuestion) {
    mLog.info('_if_undef_readline start');
    if (myVar === undefined) {
      myVar = await readline.question(myQuestion);
    } 
    mLog.info('_if_undef_readline finish [',myVar,']');
    return myVar;
  },
  get_username: async function() {
    mLog.info('get_username start');
    this.username = await this._if_undef_readline( this.username, "Username: ");
    mLog.info('get_username finish');
    return this.username.toString();
  },
  get_password: async function() {
    mLog.info('get_password start');
    this.password = await this._if_undef_readline( this.password, "Password: ");
    mLog.info('get_password finish');
    return this.password.toString();
  }
};

module.exports = credentials;
