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
import { Command, CommandContribution, CommandRegistry } from '@theia/core';
import { inject, injectable } from '@theia/core/shared/inversify';
import { FileReadTest, TestResult } from 'theia-performance-test';
import { WorkspaceService } from '@theia/workspace/lib/browser/';
import { ExtensionFileReadTest } from './extension-file-read-test';
import { TheiaExtensionLogger } from './extension-logger';
import { NodeFileReadTest } from './node-file-read-test';

const EXECUTE_EXTENSION_TEST_COMMAND: Command = {
    id: 'theia.ptest.readsingle.extension',
    label: 'Execute File Reading Performance Tests (Theia-extension)'
};

const EXECUTE_NODE_TEST_COMMAND: Command = {
    id: 'theia.ptest.readsingle.node.extension',
    label: 'Execute File Reading Performance Tests (Theia-extension-node)'
};

const EXECUTE_ALL_TESTS_COMMAND: Command = {
    id: 'theia.ptest.readsingle.all',
    label: 'Execute File Reading Performance Tests (All)'
};

const EXECUTE_ALL_PLUGIN_TESTS_COMMAND: Command = {
    id: 'theia.ptest.readsingle.plugin'
};
const RETRIEVE_ENVIRONMENT: Command = {
    id: 'theia.ptest.environment'
};

@injectable()
export class ExtensionFileReadTestCommandContribution implements CommandContribution {
    @inject(TheiaExtensionLogger)
    protected logger: TheiaExtensionLogger;

    @inject(ExtensionFileReadTest)
    protected extensionTest: ExtensionFileReadTest;

    @inject(NodeFileReadTest)
    protected nodeTest: NodeFileReadTest;

    @inject(WorkspaceService)
    protected workspace: WorkspaceService;

    protected commandRegistry: CommandRegistry;

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(EXECUTE_EXTENSION_TEST_COMMAND, {
            execute:  () =>  this.executeTestCommand(this.extensionTest)
        });
        commands.registerCommand(EXECUTE_NODE_TEST_COMMAND, {
            execute:  () => this.executeTestCommand(this.nodeTest)
        });

        commands.registerCommand(EXECUTE_ALL_TESTS_COMMAND, {
            execute: async () => {
                await this.commandRegistry.executeCommand(EXECUTE_NODE_TEST_COMMAND.id);
                await this.commandRegistry.executeCommand(EXECUTE_EXTENSION_TEST_COMMAND.id);
                await this.commandRegistry.executeCommand(EXECUTE_ALL_PLUGIN_TESTS_COMMAND.id);
            }
        });
        this.commandRegistry = commands;
    }

    protected async executeTestCommand(test: FileReadTest): Promise<Map<string, TestResult>> {
        const workspaceRoots = await this.workspace.roots;
        if (workspaceRoots.length === 0) {
            const errorMsg = 'Could not retrieve current workspace. Test is aborted!';
            this.logger.log(errorMsg, 'error');
            this.logger.show(errorMsg, 'error');
            throw new Error(errorMsg);
        }
        const workspaceRoot = workspaceRoots[0].resource.toString();
        const env = (await this.commandRegistry.executeCommand<Promise<string>>(RETRIEVE_ENVIRONMENT.id)) ?? 'undefined';
        await test.initialize(workspaceRoot, env.concat('-extension'), this.logger);
        const result = await test.execute();
        test.exportTestResults(result);
        return result;
    }
}
