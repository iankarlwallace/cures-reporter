// Functions that allow one to navigate the CURES website
'use strict';
const mLog = require('./logging-func');
const fs = require('fs');
const download_dir = './downloads';	

var cures_website = {
    _fs_safe_name: function(text) {
	    return text.replace(/[ \'\/]/g,'-');
    },
    _set_download_dir: function(page, dirpath) {
		return page._client.send('Page.setDownloadBehavior',{
			behavior: 'allow',
			downloadPath: dirpath
			});
    },
    _click_xpath: async function(page, myXpath) {
	mLog.debug('_click_xpath start [',myXpath,']');
	const linkHandlers = await page.$x(myXpath);
	if (linkHandlers.length > 0) {
	        await linkHandlers[0].click();
	} else {
		mLog.error('Link not found [',myXpath,']');
		throw new Error("Link not found.");
	}
	mLog.debug(' _click_xpath finished');
    },
    _fill_xpath: async function(page, xpathsel, myVal) {
	mLog.debug('_fill_xpath start [',xpathsel,' = ',myVal,']');
	await this._click_xpath(page, xpathsel);
	await page.keyboard.type(myVal);
	mLog.debug('_fill_xpath finished');
    },
    goto_homepage: async function (page) {
	try {
		await Promise.all([
		    page.waitForNavigation(),
		    page.goto('https://cures.doj.ca.gov',{waitUntil: 'networkidle0'})
		]);
	} catch(e) {mLog.error(e);}
    },
    login: async function (page, username, password) { 
	const USERNAME_XPATH = '//*[@id="username"]';
	const PASSWORD_XPATH = '//*[@id="password"]';
	const LOGIN_XPATH = '//*[@id="loginForm"]/div[1]/span/input';

	mLog.info('Login started username [',username,']');
	await this.goto_homepage(page);

	try {
		await this._fill_xpath(page, USERNAME_XPATH, username);
		await this._fill_xpath(page, PASSWORD_XPATH, password);
		await Promise.all([
			page.waitForNavigation(),
			this._click_xpath(page, LOGIN_XPATH)
		]);
	} catch(e) {mLog.error(e);}
	mLog.info('Login finished');
    },
    cleanup_downloads_dir: function () {
	// After a failed attempt the downloads_dir might have old CuresSearchSummaryReport in it
	// Or may have a crdownload
	try {
		mLog.info('Removing partial CuresSearchSummaryReport, .crdownloadi, or par.xlsx files');
		var entries = fs.readdirSync(download_dir);
		var curessumfiles = entries.filter( elm => elm.match(
			new RegExp(`CuresSearchSummaryReport.*\.pdf`,'g')));
		var crdownloads = entries.filter( elm => elm.match(
			new RegExp(`.*\.crdownload`,'g')));
		var par_xlsx = entries.filter( elm => elm.match(
			new RegExp(`par.xlsx`,'g')));
		curessumfiles.concat(crdownloads.concat(par_xlsx)).forEach((file) => {
			let fullpath = download_dir + '/' + file;
			mLog.info('Working on removing [',fullpath,']');
			fs.unlinkSync(fullpath);
		});
	} catch(e) {mLog.error(e)};

    },
    file_exists: function (filename) {
	    try {
		    fs.accessSync(filename);
		    return true;
	    } catch(e) {
		    return false;
	    }
    },
    par: async function (page) {
	const MENU_SEARCH_XPATH = '//*[@id="headerForm:j_idt16"]/ul/li[3]/a';
	const SEARCH_BTN_XPATH ='//*[@id="patientSrchForm:parTabs:searchBtn"]/span';
	mLog.debug('Patient Activity Report started');
	try {
		const navPromise = page.waitForNavigation();
		await this._click_xpath(page, MENU_SEARCH_XPATH);
		await navPromise;
	} catch(e) {
		mLog.error('PAR caught an error.');
		mLog.error(e)
	};
	mLog.debug('Patient Activity Report finished');
    },
    fullpath: function( fname, lname, dob) {
	    return ( download_dir + '/' 
		    + this._fs_safe_name(fname) + '-'
		    + this._fs_safe_name(lname) + '-'
		    + this._fs_safe_name(dob) );
    },
    confirm_pt_file_needed: function( fname, lname, dob) {
	let fullpath_noext = this.fullpath( fname, lname, dob);
	// If either file exists then we should just skip the query
	if (this.file_exists(fullpath_noext + '.pdf') || this.file_exists(fullpath_noext + '.xlsx')) {
		// file found skip
		mLog.info('Skip for retreive for [',fullpath_noext,']');
		return false;
	} else {
		mLog.info('File not found QUERY needed for [',fullpath_noext,']');
		return true;
	}
    },
    par_search: async function (page, fname, lname, dob) {
	const FNAME_XPATH = '//*[@id="patientSrchForm:parTabs:firstName"]';
	const LNAME_XPATH = '//*[@id="patientSrchForm:parTabs:lastName"]';
	const DOB_XPATH = '//*[@id="patientSrchForm:parTabs:dob_input"]';
	const SEARCH_XPATH = '//*[@id="patientSrchForm:parTabs:searchBtn"]/span';
	const RESULT_XPATH = '//*[@id="patientSrchForm:parTabs:resultContainer"]';
	const MATCHES_XPATH = '//*[@id="patientSrchForm:parTabs:searchResult"]/text()';
	const RESULTS_CHKBOX_XPATH = '//*[@id="patientSrchForm:parTabs:patientTbl:j_idt185"]/div/div[2]';
	const GEN_REPORT_XPATH = '//*[@id="patientSrchForm:parTabs:patientTbl:genReportBtn"]';
	const DOWNLOAD_PAR_XPATH = '//*[@id="patientSrchForm:parTabs:downloadPar"]';
	const SEARCH_SUM_XPATH = '//*[@id="patientSrchForm:parTabs:patientTbl:j_idt206"]';
	let matchNum = undefined;

	let ptRecs = 0;
	let ptNoRecs = 0;
	let totPts = 0;

	let fullpath_noext = this.fullpath( fname, lname, dob);
	mLog.info('Start search with [',fname,' ',lname,' ',dob,']');
	try {
		await this._fill_xpath(page, FNAME_XPATH, fname.substring(0,4));
	 	await this._fill_xpath(page, LNAME_XPATH, lname.substring(0,4));
	 	await this._fill_xpath(page, DOB_XPATH, dob);
		await this._click_xpath(page, SEARCH_XPATH);
		await page.waitFor(MATCHES_XPATH);
	} catch(e) {mLog.error(e)};

	// A Search should return a search result of some kind (usually with results number)
	try {
		var xpathData = await page.$x(MATCHES_XPATH);
		var xpathVal = await xpathData[0].getProperty('textContent');
		matchNum = Number((await xpathVal.jsonValue()).split(':')[1]);
	} catch(e) {mLog.error(e)};

	if ( matchNum === 0 ) {
		mLog.info('NO records matched.');
		ptNoRecs++;
		await this._set_download_dir(page,download_dir);
		await this._click_xpath(page, SEARCH_SUM_XPATH);
		await page.waitFor(1000);

		// Filename format CuresSearchSummaryReportYYYYMMDD_HHMMSS-NNN.pdf
		try {
			console.info('Look for [',download_dir + '/CuresSearchSummaryReport*.pdf',']');
			var entries = fs.readdirSync(download_dir); 
			var files = entries.filter(
				elm => elm.match( new RegExp(`CuresSearchSummaryReport.*.(pdf)`,'g')));
			mLog.info('File [',files,']');
			fs.renameSync(download_dir + "/" + files[0], fullpath_noext + '.pdf');
		} catch(e) {mLog.error(e)};
	} else {
		mLog.info('Matches [',matchNum,']');
		ptRecs++;
		try {
			const navPromise = page.waitFor(GEN_REPORT_XPATH);
			await this._click_xpath(page,RESULTS_CHKBOX_XPATH);
			await navPromise;
		} catch(e) {mLog.error(e)};

		try {
			const navPromise = page.waitFor(DOWNLOAD_PAR_XPATH);
			await this._click_xpath(page,GEN_REPORT_XPATH);
			await navPromise;
		} catch(e) {mLog.error(e)};

		await this._set_download_dir(page,download_dir);
		await this._click_xpath(page, DOWNLOAD_PAR_XPATH);

		// Pure hack to just wait for the download ... we be better to keyoff some DOMEvent 
		await page.waitFor(1000);

		// Change the filename to the current patient name-DOB.xlsx
		try {
			if (fs.existsSync(download_dir + "/par.xlsx")) {
				mLog.info('Found download file par.xlsx');
				fs.renameSync(download_dir + "/par.xlsx", fullpath_noext + ".xlsx");
			} else {
				mLog.error('MISSING par.xlsx however download flagged as successful.');
			}
		} catch(e) {mLog.error(e)};
	}
	totPts = ptRecs + ptNoRecs;
	mLog.info('Search finished with recs [', 
		ptRecs,'] no recs [', 
		ptNoRecs,'] total pt searches [', 
		totPts ,']');
	return( [ ptRecs, ptNoRecs ] );
    },
    logout: async function (page) {
	const LOGOUT_XPATH = '//*[@id="headerForm:j_idt16"]/ul/li[8]/a';
	mLog.info('Logout started');
	try {
		var navPromise = page.waitForNavigation();
		await this._click_xpath(page, LOGOUT_XPATH);
		await navPromise;
	} catch(e) {mLog.error(e);}
	mLog.info('Logout finished');
    }
};

module.exports = cures_website;
