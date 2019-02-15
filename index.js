// Basic script to load the page and then search for a patient
'use strict';

const appRoot = require('app-root-path');
const puppeteer = require('puppeteer');
const util = require('util');

const mLog = require(appRoot + '/lib/logging-func')(__filename);
const credentials = require(appRoot + '/lib/credentials');
const cures_website = require(appRoot + '/lib/cures_website');
const dbtools = require(appRoot + '/lib/dbtools');

const xlsx_file = appRoot + '/xlsx/c_s5to11_18_c.xlsx';
const downloads_dir = appRoot + '/downloads';

var argv = require('yargs')
  .usage('Usage: $0 <command[> [options]')
  .command(['query', '$0'],
    'Query the CURES website',
    () => {}, (argv) => {
      query(argv.file, argv.downloadsDir).catch((e) => mLog.error(e));
    })
  .command('process',
    'Process downloaded files in download dir',
    () => {}, (argv) => {
      process().catch((e) => mLog.error(e));
    })
  .demandCommand(1)
  .example('$0 query -f patient_data_.xlsx', 'Query patient data from xlsx file')
  .example('$0 process', 'Try to process all downloaded files')
  .alias('v', 'version')
  .alias('h', 'help')
  .alias('f', 'file')
  .alias('d', 'downloadsDir')
  .default('f', xlsx_file)
  .default('d', downloads_dir)
  .epilog('copyright 2019')
  .argv;

async function process() {
  mLog.info('Stubbed process files function');
  return;
}

async function query(myFile, myDir) {
  mLog.info('Starting to work on query [%s] with dir [%s]', myFile, myDir);

  var pts = await dbtools.load_new_patients(myFile);

  // Currently the downloads_dir is hardcoded in the cures_website module
  // cures_website.downloads_dir = myDir;
  cures_website.cleanup_downloads_dir();

  let uname = await credentials.get_username();
  let pword = await credentials.get_password();

  let ptCount = pts.length;
  let ptHits = 0;
  let ptMiss = 0;

  for (let pt in pts) {
    let rowNum = pts[pt]["row"];
    let fname = pts[pt]["firstname"];
    let lname = pts[pt]["lastname"];
    let dob = pts[pt]["dob"];

    if (cures_website.confirm_pt_file_needed(fname, lname, dob)) {

      const browser = await puppeteer.launch({
        headless: true,
        slowMo: 50,
        args: ['--window-size=960,1080']
      });
      const page = await browser.newPage();
      await page.setViewport({
        width: 960,
        height: 1080
      });

      await cures_website.login(page, uname, pword);
      await cures_website.par(page);

      let return_searches = await cures_website.par_search(page, fname, lname, dob);
      ptHits = ptHits + return_searches[0];
      ptMiss = ptMiss + return_searches[1];

      await cures_website.logout(page);
      await page.close();
      await browser.close();
    } else {
      mLog.info('Pt query not needed for [%s] [%s] [%s] [%s] [%s]', pt, rowNum, fname, lname, dob);
    }
  }

  let ptTot = ptHits + ptMiss;
  mLog.info('Pt searches [%s] hits [%s] miss [%s]', ptTot, ptHits, ptMiss);
}
