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
import * as fs from "fs";
import * as path from "path";

const resourceDir = path.resolve(__dirname, '..', 'workspace', 'resources');

if (!fs.existsSync(resourceDir)) {
    fs.mkdirSync(resourceDir);
}

const text_100b = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.";
const text_1k = text_100b.repeat(10);

createFiles([5, 50, 500, 5000, 10000]);

function createFiles(fileSizes: number[]) {
    const paddingSize = Math.max.apply(fileSizes.map(number => number.toString().length));
    for (let i = 0; i < fileSizes.length; i++) {
        const size = fileSizes[i];
        createFile(`${zeroPad(i, paddingSize)}_gen_${size}k.txt`, size);
    }
}

function createFile(name: string, size: number): void {
    const content = text_1k.repeat(size);
    const buffer = Buffer.from(content, 'utf-8');
    fs.writeFileSync(path.join(resourceDir, name), buffer);
}

function zeroPad(number: number, size: number):string {
   return String(number).padStart(size, '0')
}