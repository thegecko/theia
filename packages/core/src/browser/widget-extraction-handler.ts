/********************************************************************************
 * Copyright (C) 2021 EclipseSource and others.
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
import debounce = require('lodash.debounce');
import { inject, injectable, postConstruct } from 'inversify';
import { Command } from '../common/command';
import { BoxLayout, BoxPanel, ExtractableWidget, Widget } from './widgets';
import { MessageService } from '../common/message-service';

export const EXTRACT_WIDGET = Command.toDefaultLocalizedCommand({
    id: 'extract-widget',
    label: 'Extract View'
});

class ExternalRootWidget extends Widget {

    constructor() {
        super();
        this.layout = new BoxLayout();
    }

    addWidget(widget: Widget): void {
        (this.layout as BoxLayout).addWidget(widget);
        BoxPanel.setStretch(widget, 1);
    }

}

/**
 * Offers functionality to move a widget out of the main window to a newly created window.
 * Widgets must explicitly implement the `ExtractableWidget` interface to support this.
 * This handler keeps the opened external windows and sets up messaging between them and the Theia main window.
 */
@injectable()
export class WidgetExtractionHandler {
    protected readonly externalWindows: Window[] = [];
    protected readonly prefix = crypto.getRandomValues(new Uint16Array(1))[0];

    constructor(@inject(MessageService) protected readonly messageService: MessageService) { }

    @postConstruct()
    protected init(): void {
        // Set up messaging with external windows
        window.addEventListener('message', (event: MessageEvent) => {
            console.trace('Message on main window', event);
            if (event.data.fromExternal) {
                console.trace('Message comes from external window');
                return;
            }
            if (event.data.fromMain) {
                console.trace('Message has mainWindow marker, therefore ignore it');
                return;
            }

            // TODO primitive filter for setImmediate messages. Is there a better way?
            if (typeof event.data === 'string' && event.data.startsWith('setImmediate')) {
                console.trace('Filtered setImmediate message');
                return;
            }

            console.trace('Delegate main window message to external windows', event);
            this.externalWindows.forEach(externalWindow => {
                if (!externalWindow.window.closed) {
                    externalWindow.window.postMessage({ ...event.data, fromMain: true }, '*');
                }
            });
        });
    }

    /**
     *  Moves the given widget to a new window.
     *
     * @param widget the widget to extract
     * @param closeWidget Callback to close the widget when the external window is closed.
     */
    moveWidgetToExternalWindow(widget: ExtractableWidget, closeWidget: (id: string) => Promise<unknown>): void {
        if (!widget.isExtractable) {
            console.warn('Widget is not extractable.', widget.id);
            return;
        }

        const extWindow = window.open('', `${this.prefix}-subwindow${this.externalWindows.length}`, 'popup');

        if (!extWindow) {
            this.messageService.error('The widget could not be moved to an external window because the window creation failed. Please make sure to allow popus.');
            return;
        }

        this.externalWindows.push(extWindow);

        extWindow.document.write(`<!doctype html>
                <html>
                    <head>
                        <title>External Window</title>
                        <style>
                          body {
                              margin: 0;
                          }
                          html, head, body, #pwidget, .p-Widget {
                              width: 100% !important;
                              height: 100% !important;
                          }
                        </style>
                        <script>
                            window.addEventListener('message', e => {
                                // Only process messages from Theia main window
                                if (e.source === window.opener) {
                                    // Delegate message to iframe
                                    document.getElementsByTagName('iframe').item(0).contentWindow.postMessage({ ...e.data }, '*');
                                }
                            });
                        </script>
                    </head>
                    <body>
                        <div id="pwidget"></div>
                    </body>
                </html>
                `);
        extWindow.document.close();

        const element = extWindow.document.getElementById('pwidget');
        if (!element) {
            console.error('Could not find dom element to attach to in external window');
            return;
        }

        widget.externalWindow = extWindow;
        const rootWidget = new ExternalRootWidget();
        Widget.attach(rootWidget, element);
        rootWidget.addWidget(widget);
        widget.update();

        // Close widget and remove window from this handler when the window is closed.
        extWindow.addEventListener('beforeunload', () => {
            closeWidget(widget.id);
            const extIndex = this.externalWindows.indexOf(extWindow);
            if (extIndex > -1) {
                this.externalWindows.splice(extIndex, 1);
            }
        });

        // Close the window if the widget is disposed, e.g. by a command closing all widgets.
        widget.disposed.connect(() => {
            if (!extWindow.closed) {
                extWindow.close();
            }
        });

        // debounce to avoid rapid updates while resizing the external window
        const updateWidget = debounce(widget.update, 100);
        extWindow.addEventListener('resize', () => updateWidget());
    }
}
