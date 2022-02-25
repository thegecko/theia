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
import { MessageService } from '@theia/core';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { OutputChannel, OutputChannelManager } from '@theia/output/lib/browser/output-channel';
import { Logger } from 'theia-performance-test';

/**
 * A test logger for `FileReadTests` are executed in a Theia extension.
 */
@injectable()
export class TheiaExtensionLogger implements Logger {
    @inject(OutputChannelManager)
    protected channelManager: OutputChannelManager;

    @inject(MessageService)
    protected messageService: MessageService;
    output: OutputChannel;

    @postConstruct()
    protected postConstruct() {
        this.output = this.channelManager.getChannel('Performance Tests (Extension)');
        this.output.show();
    }

    log(message: string, level = 'info'): void {
        this.output.appendLine(`[${level}] ${message}`);
    }

    show(message: string, level = 'info'): void {
        switch (level) {
            case 'warn':
                this.messageService.warn(message);
                break;
            case 'error':
                this.messageService.error(message);
                break;
            default:
                this.messageService.info(message);
        }
    }
}
