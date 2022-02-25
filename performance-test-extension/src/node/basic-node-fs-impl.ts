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
import { injectable } from '@theia/core/shared/inversify';
import { BasicNodeFS } from '../common/basic-node-fs';
import { promises as fs } from 'fs';
import * as path from 'path';

@injectable()
export class BasicNodeFSImpl implements BasicNodeFS {
    readFile(uri: string): Promise<unknown> {
        return fs.readFile(uri.replace(/file:\/*/, '/'));
    }

    readFileAsString(uri: string): Promise<string> {
        return fs.readFile(uri.replace(/file:\/*/, '/'), { encoding: 'UTF8' }) as Promise<string>;
    }

    async writeFile(uri: string, content: string): Promise<void> {
        await fs.writeFile(uri.replace(/file:\/*/, '/'), content);
    }

    async list(uri: string): Promise<string[]> {
        return (await fs.readdir(uri.replace(/file:\/*/, '/'))).map(file => path.join(uri, file));
    }

    async mkdir(uri: string): Promise<void> {
        await fs.mkdir(uri.replace(/file:\/*/, '/'), { recursive: true });
    }

    async getSize(uri: string): Promise<number> {
        const stat = await fs.stat(uri.replace(/file:\/*/, '/'));
        return stat.size;
    }
}
export function toArrayBuffer(buffer: Buffer): ArrayBuffer {
    if (buffer.byteOffset === 0 && buffer.byteLength === buffer.buffer.byteLength) {
        return buffer.buffer;
    } else if (typeof buffer.buffer.slice === 'function') {
        // Otherwise we need to get a proper copy
        return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    }
    throw new Error('Buffer could not be converted to array buffer');
}