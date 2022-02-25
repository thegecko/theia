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

import { FileReadTest, TestResult } from 'theia-performance-test';
import * as vscode from 'vscode';
import { TheiaPluginFileReadTest } from './plugin-file-read-test';
import { TheiaPluginLogger } from './plugin-logger';

export async function activate(context: vscode.ExtensionContext) {
    const logger = new TheiaPluginLogger();

    context.subscriptions.push(
        vscode.commands.registerCommand('theia.ptest.readsingle.plugin', async () => {
            const test = new TheiaPluginFileReadTest();
            return executeTestCommand(test, logger);
        }),
        vscode.commands.registerCommand('theia.ptest.environment', () => {
            return getExecutionEnvironment();
        })
    );
}

export async function executeTestCommand(test: FileReadTest, logger: TheiaPluginLogger): Promise<Map<string, TestResult>> {
    logger.output.show();
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        const errorMsg = 'Could not retrieve current workspace. Test is aborted!';
        logger.log(errorMsg, 'error');
        logger.show(errorMsg, 'error');
        throw new Error(errorMsg);
    }
    const workspaceRoot = vscode.workspace.workspaceFolders![0].uri;
    const env = getExecutionEnvironment()+"-plugin";
    await test.initialize(workspaceRoot.fsPath, env, logger);
    const result = await test.execute();
    test.exportTestResults(result);
    return result;
}

export function getExecutionEnvironment(): string {
    return `${process.env.PERFORMANCE_TEST_ENV ?? 'undefined'}`;
}
