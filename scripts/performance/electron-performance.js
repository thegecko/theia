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
const fs = require('fs');
const fsx = require('fs-extra');
const { resolve } = require('path');
const { spawn } = require('child_process');
const { measure, delay } = require('./common-performance');

const basePath = resolve(__dirname, '../..');
const electronExample = resolve(basePath, 'examples/electron');
const theia = resolve(electronExample, 'node_modules/.bin/theia');

let name = 'ElectronStartup';
let condition = 'UI Ready';
let traceFile = resolve(electronExample, 'electron-trace.json');
let runs = 10;

const traceConfigFile = resolve(__dirname, './electron-trace-config.json');
const traceConfig = require('./electron-trace-config.json');

(async () => {
    const args = require('yargs/yargs')(process.argv.slice(2)).argv;
    if (args.name) {
        name = args.name.toString();
    }
    if (args.file) {
        traceFile = args.file.toString();
    }
    if (args.runs) {
        runs = parseInt(args.runs.toString());
    }

    await measurePerformance(name, traceFile, runs);
})();

async function measurePerformance(name, traceFile, runs) {
    let electron;

    function exitHandler(andExit = false) {
        return () => {
            if (electron && !electron.killed) {
                process.kill(-electron.pid, 'SIGINT');
            }
            if (andExit) {
                process.exit();
            }
        }
    };

    // Be sure not to leave a detached Electron child process
    process.on('exit', exitHandler());
    process.on('SIGINT', exitHandler(true));
    process.on('SIGTERM', exitHandler(true));

    /** @type import('./common-performance').TestFunction */
    const testScenario = async (runNr) => {
        electron = await launchElectron(traceConfigFile);

        // Wait long enough to be sure that tracing has finished
        await delay(traceConfig.startup_duration * 1000 * 3 / 2)
            .then(() => process.kill(-electron.pid, 'SIGINT'));
        electron = undefined;
        return traceFile;
    };

    measure(name, condition, runs, testScenario, hasNonzeroTimestamp, isPreloadHidden);
}

async function launchElectron(traceConfigFile) {
    return spawn(theia,
        ['start', '--plugins=local-dir:../../plugins', `--trace-config-file=${traceConfigFile}`],
        { cwd: electronExample, detached: true });
}

function hasNonzeroTimestamp(traceEvent) {
    return traceEvent.hasOwnProperty('ts')
        && traceEvent.ts > 0;
}

function isPreloadHidden(traceEvent) {
    return traceEvent.cat.includes('blink')
        && traceEvent.name === 'HitTest'
        && traceEvent.args.hasOwnProperty('endData')
        && traceEvent.args.endData.nodeName.startsWith('DIV class=\'theia-preload theia-hidden\'');
}
