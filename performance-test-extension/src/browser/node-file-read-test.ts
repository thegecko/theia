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
import URI from '@theia/core/lib/common/uri';
import { FileReadTest, Logger, NULL_LOGGER } from 'theia-performance-test';
import { inject, injectable } from 'inversify';
import { BasicNodeFS } from '../common/basic-node-fs';

/**
 * A {@link FileReadTest} that is executed from a Theia extension and directly reads the files with nodes fs.
 * This is a complementary that is used to identify potential issues with Theias `FileService` implementation compared
 * to plain node fs.
 */
@injectable()
export class NodeFileReadTest extends FileReadTest {
    @inject(BasicNodeFS)
    protected nodeFs: BasicNodeFS;

    async initialize(workspaceRoot: string, environment: string, logger: Logger = NULL_LOGGER): Promise<void> {
        return super.initialize(workspaceRoot, `${environment}-node`, logger);
    }

    protected readFile(uri: string): Promise<unknown> {
        console.log(`[MYTEST] NodeFileReadTest: start loading file [${Date.now()}]`);
        return this.nodeFs.readFile(uri);
    }

    protected readFileAsString(uri: string): Promise<string> {
        return this.nodeFs.readFileAsString(uri);
    }

    protected writeFile(uri: string, content: string): Promise<void> {
        return this.nodeFs.writeFile(uri, content);
    }

    protected mkdir(uri: string): Promise<void> {
        return this.nodeFs.mkdir(uri);
    }

    protected list(uri: string): Promise<string[]> {
        return this.nodeFs.list(uri);
    }

    protected getSize(uri: string): Promise<number> {
        return this.nodeFs.getSize(uri);
    }

    protected resolve(...pathFragments: string[]): string {
        const first = pathFragments.shift()!;
        let uri = new URI(first);
        pathFragments.forEach(fragment => {
            uri = uri.resolve(fragment);
        });
        return uri.toString();
    }
}
