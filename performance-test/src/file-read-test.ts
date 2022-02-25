// *****************************************************************************
// Copyright (C) 2022 STMicroelectronics and others.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses when the conditions for such availability set forth in the Eclipse
// Public License v. 2.0 are satisfied: GNU General Public License, version 2
// with the GNU Classpath Exception which is available at
// https://www.gnu.org/software/classpath/license.html.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
// *****************************************************************************

import { Logger, NULL_LOGGER } from './logger';
import { TestResult } from './test-result';
import { currentFormattedDate, median } from './test-util';

const CONFIG_FILE = '.ptestrc.json';

export interface FileReadTestConfig {
    testRuns: number;
    resultDir: string;
    resourceDir: string;
}

export const DEFAULT_PERFORMANCE_TEST_CONFIG: FileReadTestConfig = {
    testRuns: 10,
    resultDir: 'results',
    resourceDir: 'single_file_load'
};

/**
 * Abstract class to execute tests that interact with fs access in a Theia execution context.
 * The execution context composes the application frame in which the test is loaded (either browser,electron or vscode)
 * and the extension type it is executed in (Theia extension or Theia plugin/VSCode extension)
 */
export abstract class FileReadTest {
    protected config: FileReadTestConfig;
    protected workspaceRoot: string;
    protected environment: string;
    protected logger: Logger;

    /**
     * Reads the file with the given URI with the fs access of the execution context
     * @param uri File that should be loaded.
     * @returns The file in `unknown` representation
     */
    protected abstract readFile(uri: string): Promise<unknown>;

    /**
     * Reads the file with the given URI with the fs access of the execution context
     * @param uri File that should be loaded.
     * @returns The file in string representation
     */
    protected abstract readFileAsString(uri: string): Promise<string>;

    /**
     * Write the the content into the file with the given URI using the fs access of the execution context.
     * @param uri The file location.
     * @param uri THe content that should be written.
     *
     */
    protected abstract writeFile(uri: string, content: string): Promise<void>;

    /**
     * Creates a new directory at the given URI using the fs access of the execution context
     * @param uri The URI of the directory that should be created.
     */
    protected abstract mkdir(uri: string): Promise<void>;

    /**
     * Lists the children of the given file directory using the fs access of the execution context.
     * @param uri The URI of the directory
     * @returns An of the URIs of all files inside of this directory
     */
    protected abstract list(uri: string): Promise<string[]>;

    /**
     * Retrieves the size of the given URI with the fs access of the execution context
     * @param uri The size of the given file
     */
    protected abstract getSize(uri: string): Promise<number>;

    /**
     * Resolves the given path fragments with the fs access/path library of the execution context.
     * @param pathFragments The path fragments to resolve
     * @returns the resolved path.
     */
    protected abstract resolve(...pathFragments: string[]): string;

    async initialize(workspaceRoot: string, environment: string, logger: Logger = NULL_LOGGER): Promise<void> {
        this.workspaceRoot = workspaceRoot;
        this.environment = environment;
        this.logger = logger;
        const configUri = this.resolve(this.workspaceRoot, CONFIG_FILE);
        try {
            const configFile = await this.readFileAsString(configUri);
            this.config = JSON.parse(configFile);
        } catch (err) {
            this.logger.log(`Could not load configuration file '${configUri}'. The default config is used instead`, 'warn');
            this.config = DEFAULT_PERFORMANCE_TEST_CONFIG;
        }
    }

    /**
     * Executes the the file reading performance test for the loaded {@link FileReadTestConfig}. Each file is loaded
     * individually and the reading time is recorded.
     * @returns A map of the read file and their {@link TestResult}
     */
    async execute(): Promise<Map<string, TestResult>> {
        if (!this.config) {
            const errorMsg = 'The Test class is not properly initialized (configuration is undefined). Test execution is aborted';
            this.logger.log(errorMsg, 'error');
            this.logger.show(errorMsg, 'error');
            return new Map();
        }
        const startMsg = `Start SingleFileReadTest [env: ${this.environment}]`;
        this.logger.log(startMsg);
        this.logger.show(startMsg);
        const results = new Map<string, TestResult>();
        const testRuns = this.config.testRuns;
        const resourceDir = this.resolve(this.workspaceRoot, this.config.resourceDir);
        const testFiles = await this.list(resourceDir);
        this.logger.log(`Start reading test files [Runs: ${this.config.testRuns}]`);
        for (let i = 0; i < testRuns; i++) {
            for (const fileUri of testFiles) {
                if (i === 0) {
                    const size = (await this.getSize(fileUri)) / 1000;
                    const result: TestResult = {
                        uri: fileUri,
                        size,
                        testRuns: testRuns,
                        durations: [],
                        medianDuration: 0
                    };
                    results.set(fileUri, result);
                }
                const result = results.get(fileUri)!;
                const start = Date.now();
                await this.readFile(fileUri);
                const end = Date.now();
                const duration = end - start;
                result.durations.push(duration);
                this.logger.log(`[Run ${i + 1}] '${fileUri}'- Reading took ${duration} ms`);
                if (i == testRuns - 1) {
                    result.medianDuration = median(result.durations);
                }
            }
        }
        const endMsg = `Completed SingleFileReadTest [env: ${this.environment}]`;
        this.logger.log(endMsg);
        this.logger.show(endMsg);
        this.logger.log('');
        return results;
    }

    /**
     * Exports the given map of {@link TestResult}s into the configured result directory.
     * @param resultMap The map of results that should be exported
     * @returns The time it took to read the file.
     */
    async exportTestResults(resultMap: Map<string, TestResult>): Promise<void> {
        const date = currentFormattedDate();
        const results: any[] = Array.from(resultMap.values()).sort((a, b) => a.uri.localeCompare(b.uri));
        const durations = results.map(result => result.medianDuration);
        const completeResults=[...results];
        completeResults.push({ allDurations: durations });
        const resultDir = this.resolve(this.workspaceRoot, this.config.resultDir, this.environment, date);
        let report = `Report for SingleFileReadTest (${date})
        Environment: ${this.environment}`;
        report = report.concat(results.map(TestResult.toString).join(',\n'));
        const logFile = this.resolve(resultDir, 'report.log');
        const jsonFile = this.resolve(resultDir, 'report.json');

        await this.mkdir(resultDir);
        await this.writeFile(logFile, report);
        await this.writeFile(jsonFile, JSON.stringify(completeResults, undefined, 2));
    }
}
