// Simple logging functions for seeing workings of app
'use strict';

const DEBUG = false;
const INFO = true;

var mLog = {
  error: async function(...msg) {
	  console.error(...msg);
  },
  info: async function(...msg) {
	if (INFO) {
		console.log(...msg);
	}
  },
  debug: async function(...msg) {
	if (DEBUG) {
		console.debug(...msg);
	}
  }	
};

module.exports = mLog;
