// Basic script to load the page and then search for a patient
'use strict';

const puppeteer = require('puppeteer');
const credentials = require('./credentials');
const patients = require('./patients');
const cures_website = require('./cures_website');

async function run() {
  const browser = await puppeteer.launch({slowMo: 50, headless: false, args: ['--window-size=1920,1080']});
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  let uname = await credentials.get_username();
  let pword = await credentials.get_password();
  await cures_website.login(page, uname, pword);
  await cures_website.par(page);
  await cures_website.par_search(page, "Ian", "Wallace", "01/01/1970");

  await page.screenshot({ path: 'downloads/cures.doj.ca.gov.png' });

  await cures_website.logout(page);
  await page.close();
  await browser.close();
}
run().catch((e) => console.log(e));
