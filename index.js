// Basic script to load the page and then search for a patient
'use strict';

const appRoot = require('app-root-path');
const puppeteer = require('puppeteer');

const mLog = require(appRoot + '/lib/logging-func');
const credentials = require(appRoot + '/lib/credentials');
const patients = require(appRoot + '/lib/patients');
const cures_website = require(appRoot + '/lib/cures_website');
const dbtools = require(appRoot + '/lib/dbtools');

const xlsx_file = appRoot + '/xlsx/c_s5to11_18_c.xlsx'

async function run() {
  var pts = await dbtools.load_new_patients(xlsx_file);

  cures_website.cleanup_downloads_dir();

  let uname = await credentials.get_username();
  let pword = await credentials.get_password();

  let ptCount = pts.length;
  let ptHits = 0;
  let ptMiss = 0;
  mLog.info('Working on queries on [',ptCount,'] patients');

  for(let pt in pts) {
	mLog.info('Query for patient [',pt,']');
	let fname = pts[pt][0];
	let lname = pts[pt][1];
	let dob = pts[pt][3];

 	if ( cures_website.confirm_pt_file_needed(fname, lname, dob) ) {

		const browser = await puppeteer.launch({headless: true,
			slowMo: 50,
			args: ['--window-size=960,1080']});
		const page = await browser.newPage();
		await page.setViewport({ width: 960, height: 1080 });

		await cures_website.login(page, uname, pword);
		await cures_website.par(page);

		let return_searches = await cures_website.par_search(page, fname, lname, dob);
		ptHits = ptHits + return_searches[0];
		ptMiss = ptMiss + return_searches[1];

		await cures_website.logout(page);
		await page.close();
		await browser.close();
	} else {
		mLog.info('Pt query not needed for [',fname,'] [',lname,'] [',dob,']');
	}
  }

  let ptTot = ptHits + ptMiss;
  mLog.info('Total patient searches [',ptTot,'] hits [',ptHits,'] miss [',ptMiss,']');
}
run().catch((e) => mLog.error(e));
