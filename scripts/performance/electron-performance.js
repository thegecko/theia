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
const { spawn, ChildProcess } = require('child_process');
const { measure, delay } = require('./common-performance');
const traceConfigTemplate = require('./electron-trace-config.json');

const basePath = resolve(__dirname, '../..');
const profilesPath = './profiles/';
const electronExample = resolve(basePath, 'examples/electron');
const theia = resolve(electronExample, 'node_modules/.bin/theia');

let name = 'Electron Frontend Startup';
let condition = 'UI Ready';
let folder = 'electron';
let runs = 10;

(async () => {
    const args = require('yargs/yargs')(process.argv.slice(2)).argv;
    if (args.name) {
        name = args.name.toString();
    }
    if (args.folder) {
        folder = args.folder.toString();
    }
    if (args.runs) {
        runs = parseInt(args.runs.toString());
    }

    // Verify that the application exists
    const mainJS = resolve(electronExample, 'src-gen/frontend/index.html');
    if (!fs.existsSync(mainJS)) {
        console.error('Electron example app does not exist. Please build it before running this script.');
        process.exit(1);
    }

    await measurePerformance();
})();

async function measurePerformance() {
    fsx.emptyDirSync(resolve(profilesPath, folder));
    const traceConfigPath = resolve(profilesPath, folder, 'trace-config.json');

    /**
     * Generate trace config from the template.
     * @param {number} runNr
     * @returns {string} the output trace file path
     */
    const traceConfigGenerator = (runNr) => {
        const traceConfig = { ...traceConfigTemplate };
        const traceFilePath = resolve(profilesPath, folder, `${runNr}.json`);
        traceConfig.result_file = traceFilePath
        fs.writeFileSync(traceConfigPath, JSON.stringify(traceConfig), 'utf-8');
        return traceFilePath;
    };

    const exitHandler = (andExit = false) => {
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

    let electron;

    /** @type import('./common-performance').TestFunction */
    const testScenario = async (runNr) => {
        const traceFile = traceConfigGenerator(runNr);
        electron = await launchElectron(traceConfigPath);

        // Wait long enough to be sure that tracing has finished. Kill the process group
        // because the 'theia' child process was detached
        await delay(traceConfigTemplate.startup_duration * 1_000 * 3 / 2)
            .then(() => process.kill(-electron.pid, 'SIGINT'));
        electron = undefined;
        return traceFile;
    };

    measure(name, condition, runs, testScenario, hasNonzeroTimestamp, isPreloadHidden);
}

/**
 * Launch the Electron app as a detached child process with tracing configured to start
 * immediately upon launch. The child process is detached because otherwise the attempt
 * to signal it to terminate when the test run is complete will not terminate the entire
 * process tree but only the root `theia` process, leaving the electron app instance
 * running until eventually this script itself exits.
 * 
 * @param {string} traceConfigPath the path to the tracing configuration file with which to initiate tracing
 * @returns {Promise<ChildProcess>} the Electron child process, if successfully launched
 */
async function launchElectron(traceConfigPath) {
    const workspace = resolve('./workspace');
    fsx.ensureDirSync(workspace);

    const args = ['start', workspace, '--plugins=local-dir:../../plugins', `--trace-config-file=${traceConfigPath}`];
    if (process.platform === 'linux') {
        args.push('--headless');
    }
    return spawn(theia, args, { cwd: electronExample, detached: true });
}

function hasNonzeroTimestamp(traceEvent) {
    return traceEvent.hasOwnProperty('ts') // The traces don't have explicit nulls or undefineds
        && traceEvent.ts > 0;
}

function isPreloadHidden(traceEvent) {
    return traceEvent.cat.includes('blink')
        && traceEvent.name === 'HitTest'
        && traceEvent.args.hasOwnProperty('endData') // The traces don't have explicit nulls or undefineds
        && traceEvent.args.endData.nodeName !== undefined
        && traceEvent.args.endData.nodeName.startsWith('DIV class=\'theia-preload theia-hidden\'');
}
