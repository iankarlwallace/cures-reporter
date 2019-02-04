// Functions that allow one to navigate the CURES website
'use strict';

var cures_website = {
    _click_xpath: async function(page, myXpath) {
	console.log('_click_xpath start [',myXpath,']');
	const linkHandlers = await page.$x(myXpath);
	if (linkHandlers.length > 0) {
	        await linkHandlers[0].click();
	} else {
		throw new Error("Link not found");
	}
	console.log(' _click_xpath finished');
    },
    _fill_xpath: async function(page, xpathsel, myVal) {
	console.log('_fill_xpath start [',xpathsel,' = ',myVal,']');
	await this._click_xpath(page, xpathsel);
	await page.keyboard.type(myVal);
	console.log('_fill_xpath finished');
    },
    login: async function (page, username, password) { 
	const USERNAME_XPATH = '//*[@id="username"]';
	const PASSWORD_XPATH = '//*[@id="password"]';
	const LOGIN_XPATH = '//*[@id="loginForm"]/div[1]/span/input';

	console.log('Login started username [',username,']');
	try {
		await Promise.all([
		    page.waitForNavigation(),
		    page.goto('https://cures.doj.ca.gov')
		]);
	} catch(e) {console.error(e);}

	try {
		await this._fill_xpath(page, USERNAME_XPATH, username);
		await this._fill_xpath(page, PASSWORD_XPATH, password);
		await Promise.all([
			page.waitForNavigation(),
			this._click_xpath(page, LOGIN_XPATH)
		]);
	} catch(e) {console.error(e);}
	console.log('Login finished');
    },
    par: async function (page) {
	const MENU_SEARCH_XPATH = '//*[@id="headerForm:j_idt16"]/ul/li[3]/a';
	console.log('PAR started');
	try {
		await Promise.all([
		    page.waitFor('//*[@id="patientSrchForm:parTabs:searchBtn"]/span'),
		    this._click_xpath(page, MENU_SEARCH_XPATH)
		]);
	} catch(e) {console.error(e)};
	console.log('PAR finished');
    },
    par_search: async function (page, fname, lname, dob) {
	const FNAME_XPATH = '//*[@id="patientSrchForm:parTabs:firstName"]';
	const LNAME_XPATH = '//*[@id="patientSrchForm:parTabs:lastName"]';
	const DOB_XPATH = '//*[@id="patientSrchForm:parTabs:dob_input"]';
	const SEARCH_XPATH = '//*[@id="patientSrchForm:parTabs:searchBtn"]/span';
	const RESULT_XPATH = '//*[@id="patientSrchForm:parTabs:resultContainer"]';

	console.log('Start search with [',fname,' ',lname,' ',dob,']');
	try {
		await this._fill_xpath(page, FNAME_XPATH, fname);
		await this._fill_xpath(page, LNAME_XPATH, lname);
		await this._fill_xpath(page, DOB_XPATH, dob);
		await this._click_xpath(page, SEARCH_XPATH);
		await page.waitFor(RESULT_XPATH);
	} catch(e) {console.error(e)};
	console.log('Search finished');
    },
    logout: async function (page) {
	const LOGOUT_XPATH = '//*[@id="headerForm:j_idt16"]/ul/li[8]/a';
	console.log('Logout started');
	try {
		await this._click_xpath(page, LOGOUT_XPATH);	
	} catch(e) {console.error(e);}
	console.log('Logout finished');
    }
};

module.exports = cures_website;
