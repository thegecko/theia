/********************************************************************************
 * Copyright (C) 2021 STMicroelectronics and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
// @ts-check
const puppeteer = require('puppeteer');
const fs = require('fs');
const fsExtra = require('fs-extra');
const { resolve } = require('path');
const { measure, delay } = require('./common-performance');

const workspacePath = resolve('./workspace');
const profilesPath = './profiles/';
const lcp = 'Largest Contentful Paint (LCP)';

let name = 'Browser Frontend Startup';
let url = 'http://localhost:3000/#' + workspacePath;
let folder = 'browser';
let headless = true;
let runs = 10;

(async () => {
    let defaultUrl = true;

    const args = require('yargs/yargs')(process.argv.slice(2)).argv;
    if (args.name) {
        name = args.name.toString();
    }
    if (args.url) {
        url = args.url.toString();
        defaultUrl = false;
    }
    if (args.folder) {
        folder = args.folder.toString();
    }
    if (args.runs) {
        runs = parseInt(args.runs.toString());
    }
    if (args.headless) {
        if (args.headless.toString() === 'false') {
            headless = false;
        }
    }

    // Verify that the application exists
    const mainJS = resolve(__dirname, '../../examples/browser/src-gen/frontend/index.html');
    if (!fs.existsSync(mainJS)) {
        console.error('Browser example app does not exist. Please build it before running this script.');
        process.exit(1);
    }

    if (defaultUrl) { fsExtra.ensureDirSync(workspacePath); }
    fsExtra.ensureDirSync(profilesPath);
    const folderPath = profilesPath + folder;
    fsExtra.ensureDirSync(folderPath);

    const deployed = await waitForDeployed(url, 10, 500);
    if (deployed == false) {
        console.error('Could not connect to application.')
    } else {
        await measurePerformance(name, url, folderPath, headless, runs);
    }
})();

async function measurePerformance(name, url, folder, headless, runs) {

    /** @type import('./common-performance').TestFunction */
    const testScenario = async (runNr) => {
        const browser = await puppeteer.launch({ headless: headless });
        const page = await browser.newPage();

        const file = folder + '/' + runNr + '.json';
        await page.tracing.start({ path: file, screenshots: true });
        await page.goto(url);
        // This selector is for the theia application, which is exposed when the loading indicator vanishes
        await page.waitForSelector('.theia-ApplicationShell', { visible: true });
        // Prevent tracing from stopping too soon and skipping a LCP candidate
        await delay(1000);

        await page.tracing.stop();

        await browser.close();

        return file;
    };

    measure(name, lcp, runs, testScenario, isStart, isLCP);
}

function isLCP(x) {
    return x.name === 'largestContentfulPaint::Candidate';
}

function isStart(x) {
    return x.name === 'TracingStartedInBrowser';
}

async function waitForDeployed(url, maxTries, ms) {
    let deployed = true;
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto(url);
    } catch (e) {
        await delay(ms);
        let newTries = maxTries - 1;
        if (newTries > 0) {
            deployed = await waitForDeployed(url, newTries, ms);
        } else {
            browser.close();
            return false;
        }
    }
    browser.close();
    return deployed;
}
