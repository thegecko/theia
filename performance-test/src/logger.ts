/********************************************************************************
 * Copyright (C) 2022 STMicroelectronics and others.
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


export type LogLevel = 'info' | 'warn' | 'error';

/**
 * Common abstraction for the logger implementation of the execution context.
 */
export interface Logger {
    // Logs a message to the underlying logger implementation of the execution context (e.g. an OutputChannel)
    log(message: string, level?: LogLevel): void;
    // Shows a message by using the message service implementation of the execution context (e.g. Theias MessageService)
    show(message: string, level?: LogLevel): void;
}

class NullLogger implements Logger {
    log(message: string, level?: LogLevel): void {

    }
    show(message: string, level?: LogLevel): void {

    }

}

export const NULL_LOGGER = new NullLogger();
