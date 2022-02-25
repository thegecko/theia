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
import { FileReadTest } from 'theia-performance-test';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * A {@link FileReadTest} that is executed from a Theia plugin context (either in Theia or VSCode) uses vscodes
 * FileService implementation to test the json-rpc communication performance in Theia plugins/VSCode extensions
 */
export class TheiaPluginFileReadTest extends FileReadTest {

    protected resolve(...pathFragments: string[]): string {
        return path.resolve(...pathFragments);
    }

    protected async readFile(uri: string): Promise<unknown> {
        const vscodeUri = vscode.Uri.parse(uri);
        return vscode.workspace.fs.readFile(vscodeUri);
    }
    
    protected async readFileAsString(uri: string): Promise<string> {
        return fs.readFileSync(uri, { encoding: 'UTF8' });
    }

    protected async list(uri: string): Promise<string[]> {
        const vscodeUri = vscode.Uri.parse(uri);
        const contents = await vscode.workspace.fs.readDirectory(vscodeUri);
        return contents.map(content => vscode.Uri.joinPath(vscodeUri, content[0]).fsPath);
    }

    protected async writeFile(uri: string, content: string): Promise<void> {
        fs.writeFileSync(uri, content, { encoding: 'UTF8' });
    }
    protected async mkdir(uri: string): Promise<void> {
        fs.mkdirSync(uri, { recursive: true });
    }
    protected async getSize(uri: string): Promise<number> {
        const vscodeUri = vscode.Uri.parse(uri);
        const stat = await vscode.workspace.fs.stat(vscodeUri);
        return stat.size;
    }
}
