// Functions to load new patients, list them out or get a list of patient names and DOB's to query
'use strict';
const mLog = require('./logging-func');
const XLSX = require('xlsx');

var dbtools = {
    load_new_patients: async function(xlsxFile) {
	mLog.debug('load_new_patients started [',xlsxFile,']');
	var myWb = XLSX.readFile(xlsxFile);
	var myWs = myWb.Sheets[myWb.SheetNames[0]];

   	var rows = [];
	var rowNum;
	var range = XLSX.utils.decode_range(myWs['!ref']);
	for(rowNum = range.s.r; rowNum <= range.e.r; rowNum++){
		if (rowNum !== 0) { 
			var ptNameCell = myWs[XLSX.utils.encode_cell({r: rowNum, c: 1})];
			var mrnCell = myWs[XLSX.utils.encode_cell({r: rowNum, c: 6})];
			var dobCell = myWs[XLSX.utils.encode_cell({r: rowNum, c: 7})];

			// Confirm that DOB is set
			if( typeof dobCell !== 'undefined' ) {
				// The dob must be in MM/DD/YYYY format or the website won't find the search
				delete dobCell.w;
				dobCell.z = 'mm/dd/yyyy';
				XLSX.utils.format_cell(dobCell);

				var names = ptNameCell.w.split(';');
				var lname = names[0].trimStart();
				var fname = names[1].trimStart();

				mLog.info('FOUND [',fname,'] [',lname,'] [',mrnCell.w,'] [',dobCell.w,']');
				rows.push([fname, lname, mrnCell.w, dobCell.w]);
			} else {
				mLog.info('No DOB set for row [',rowNum,']');
			}
		}
	}
	return rows;
	mLog.debug('load_new_patients finished');
    }
};

module.exports = dbtools;
