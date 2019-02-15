// Functions to load new patients, list them out or get a list of patient names and DOB's to query
'use strict';
const mLog = require('./logging-func')(__filename);
const XLSX = require('xlsx');

var dbtools = {
  _reformat_date: async function(myDateCell) {
      // The dob must be in MM/DD/YYYY format or the website won't find the search
      delete myDateCell.w;
      myDateCell.z = 'mm/dd/yyyy';
      XLSX.utils.format_cell(myDateCell);
      return (myDateCell);
    },
    load_new_patients: async function(xlsxFile) {
      mLog.debug('load_new_patients started [%s]', xlsxFile);
      var myWb = XLSX.readFile(xlsxFile);
      var myWs = myWb.Sheets[myWb.SheetNames[0]];

      var rows = [];
      var rowNum;
      var range = XLSX.utils.decode_range(myWs['!ref']);

      mLog.debug('Working on loading patients');
      for (rowNum = range.s.r; rowNum <= range.e.r; rowNum++) {
        mLog.debug('RowNum [%s]',rowNum);
        if (rowNum !== 0) {
          var ptNameCell = myWs[XLSX.utils.encode_cell({
            r: rowNum,
            c: 1
          })];
          mLog.debug('Patient name [%s]', ptNameCell.w);

          var mrnCell = myWs[XLSX.utils.encode_cell({
            r: rowNum,
            c: 6
          })];
          mLog.debug('MRN [%s]', mrnCell.w);

          var dobCell = myWs[XLSX.utils.encode_cell({
            r: rowNum,
            c: 7
          })];
          mLog.debug('DOB [%s]', typeof dobCell !== 'undefined' ? dobCell.w : 'n/a');

          var dischargeDate = myWs[XLSX.utils.encode_cell({
            r: rowNum,
            c: 4
          })];
          mLog.debug('DischargeDate [%s]', typeof dischargeDate !== 'undefined' ? dischargeDate.w : 'n/a');

          var csectionDate = myWs[XLSX.utils.encode_cell({
            r: rowNum,
            c: 5
          })];
          mLog.debug('CSection Date [%s]', typeof csectionDate !== 'undefined' ? csectionDate.w : 'n/a');

          // Confirm that DOB is set
          if (typeof dobCell !== 'undefined') {

            this._reformat_date(dobCell);
            this._reformat_date(csectionDate);
            this._reformat_date(dischargeDate);
            var names = ptNameCell.w.split(';');
            var lname = names[0].trimStart();
            var fname = names[1].trimStart();

            mLog.info('FOUND [%s] [%s] [%s] [%s] [%s] [%s]', fname, lname, mrnCell.w, dobCell.w, csectionDate.w, dischargeDate.w);
            rows.push({
              "row": rowNum,
              "firstname": fname,
              "lastname": lname,
              "mrn": mrnCell.w,
              "dob": dobCell.w,
              "csectionDate": csectionDate.w,
              "dischargeDate": dischargeDate.w
            });
          } else {
            mLog.info('No DOB set for row [%s]', rowNum);
          }
        }
      }
      mLog.debug('load_new_patients finished');
      return rows;
    }
};

module.exports = dbtools;
