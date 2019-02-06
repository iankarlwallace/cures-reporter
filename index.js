// Basic script to load the page and then search for a patient
'use strict';

const mLog = require('./logging-func');
const puppeteer = require('puppeteer');
const credentials = require('./credentials');
const patients = require('./patients');
const cures_website = require('./cures_website');
const dbtools = require('./dbtools');
const xlsx_file = './xlsx/c_s5to11_18_c.xlsx'

async function run() {
  var pts = await dbtools.load_new_patients(xlsx_file);
  mLog.info('Query needed on [',pts,']');

  const browser = await puppeteer.launch({slowMo: 50, headless: false, args: ['--window-size=960,1080']});
  const page = await browser.newPage();
  await page.setViewport({ width: 960, height: 1080 });

  let uname = await credentials.get_username();
  let pword = await credentials.get_password();
  await cures_website.login(page, uname, pword);
  await cures_website.par(page);

  let ptCount = pts.length;
  let ptHits = 0;
  let ptMiss = 0;
  mLog.info('Working on queries on [',ptCount,'] patients');
  for(let pt in pts) {
	let fname = pts[pt][0];
	let lname = pts[pt][1];
	let dob = pts[pt][3];
	let return_searches = await cures_website.par_search(page, fname, lname, dob);
	ptHits = ptHits + return_searches[0];
	ptMiss = ptMiss + return_searches[1];

	// Time to logout and then login to reset things for the searches
	if ( ((ptHits+ptMiss) % 2 ) === 0 ) {
		await cures_website.logout(page);
		await cures_website.login(page, uname, pword);
		// slow things down a bit since unclear how long the second login will take
		await page.waitFor(1000);
	} 
	await cures_website.par(page);
  }

  let ptTot = ptHits + ptMiss;
  mLog.info('Total patient searches [',ptTot,'] hits [',ptHits,'] miss [',ptMiss,']');
  await cures_website.logout(page);

  await page.close();
  await browser.close();
}
run().catch((e) => mLog.error(e));
