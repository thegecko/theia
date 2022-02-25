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
import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import URI from '@theia/core/lib/common/uri';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileReadTest } from 'theia-performance-test';
import { decorate, inject, injectable } from 'inversify';
decorate(injectable(), FileReadTest);

/**
 * A {@link FileReadTest} that is executed from a Theia extension and uses Theias
 * FileService implementation to test the json-rpc communication performance in Theia extensions.
 */
@injectable()
export class ExtensionFileReadTest extends FileReadTest {
    @inject(FileService)
    protected fileService: FileService;

    protected async readFile(uri: string): Promise<unknown> {
        const theiaUri = new URI(uri);
        return this.fileService.readFile(theiaUri);
    }

    protected async readFileAsString(uri: string): Promise<string> {
        const theiaUri = new URI(uri);
        const content = await this.fileService.readFile(theiaUri);
        return content.value.toString();
    }

    protected async writeFile(uri: string, content: string): Promise<void> {
        const theiaUri = new URI(uri);
        await this.fileService.writeFile(theiaUri, BinaryBuffer.fromString(content));
    }

    protected async mkdir(uri: string): Promise<void> {
        const theiaUri = new URI(uri);
        await this.fileService.createFolder(theiaUri);
    }

    protected async list(uri: string): Promise<string[]> {
        const theiaUri = new URI(uri);
        const stat = await this.fileService.resolve(theiaUri);
        return (stat.children ?? []).map(childStat => childStat.resource.toString());
    }

    protected async getSize(uri: string): Promise<number> {
        const theiaUri = new URI(uri);
        const stat = await this.fileService.resolve(theiaUri);
        return stat.size ?? 0;
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
