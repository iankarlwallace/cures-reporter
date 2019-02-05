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

  const browser = await puppeteer.launch({slowMo: 100, headless: false, args: ['--window-size=1920,1080']});
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  let uname = await credentials.get_username();
  let pword = await credentials.get_password();
  await cures_website.login(page, uname, pword);
  await cures_website.par(page);

  for(let pt in pts) {
	  let fname = pts[pt][0].substring(0,3);
	  let lname = pts[pt][1].substring(0,3);
	  let dob = pts[pt][3];
	  mLog.info('Query for [',fname,'][',lname,'][',dob,']');
	  await cures_website.par_search(page, fname, lname, dob);
	  await cures_website.par(page);
  }

  await page.screenshot({ path: 'downloads/cures.doj.ca.gov.png' });

  await cures_website.logout(page);
  await page.close();
  await browser.close();
}
run().catch((e) => mLog.error(e));
