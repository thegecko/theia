# Theia RPC Performance Tests POC

This repository contains a PoC implementation for executing semi automated tests to measure the performance of RPC communication in Theia.
The following packages a provided:

-   [`theia-performance-test`](performance-test/): The common test library providing the shared test infrastructure.

-   [`theia-performance-test-plugin`](performance-test-plugin/): Provides the tests for measuring the RPC performance of Theia plugins/VS Code extenions.
-   [`theia-performance-test-extension`](performance-test-extension/): Provides the the tests for measuring the RPC performance of Theia extensions
-   [browser-app](browser-app/): The test application to test the RPC performance in browser based Theia applications.
    Includes the `theia-performance-test-extension` and the `theia-performance-test-plugin`.
-   [electron-app](electron-app/): The test application to test the RPC performance in electron based Theia applications.
    Includes the `theia-performance-test-extension` and the `theia-performance-test-plugin`.
<br><br>

The tests load files of different sizes from the local filesystem using a Theia RPC service.
The actual service implementation depends on the test application context.
If the tests are executed within a VS Code extension/Theia plugin then the vscode.workspace.fs API is used. Inside of Theia extensions the injectable `FileService` is used.

Each test application provides commands to start the test suites.
When executing the tests load a set of files from a given directory, measure and record the loading time.
To avoid statistical errors each file is loaded multiple times (i.e. multiple test runs) and the median loading time is recorded.
Once the test suite has finished reports are generated into specified `results` directory.

## Building

To build all package simply execute the following in the root directory:

```bash
yarn
```

## Test configuration

The tests load files directly from the opened workspace.
A `.ptestrc.json` can be provided to dynamically configure the test setup:

```ts
{
    "testRuns":25, //specifies the amount of individual test runs
    "resultDir":"results", //specifies the directory where result reports should be stored
    "resourceDir":"resources" // specifies the directory with the test resource files. All child files are considered valid test candidates
}
```

You can either provider your own test files your use the `generate:resources` convenience script to autogenerate sample resources into the default `resources` directory.
To use the script simply execute the following in the project root:

```bash
yarn generate:resources
```

## Test execution

To cover all potential combinations of extension type (Theia extension vs Theia plugin) and application frame (browser,electron, VS Code) the  following test suites are provided and can be invoked with the command palette (`Ctrl+p`) and the `Execute File Reading Performance Tests ...` commands

- `vscode`: RPC performance tests in VS Code
- `browser-plugin`: RPC performance tests executed inside of a Theia plugin/VS Code extension in a Browser Theia application
- `browser-extension`: RPC performance tests executed inside of a Theia  extension in a Browser Theia application
- `browser-extension-node`: RPC performance tests with a Theia extension RPC service that directly uses node fs in the browser context. 
Used to identify potential issues in Theia's `FileService` implementation.
- `electron-plugin`: RPC performance tests executed inside of a Theia plugin/VS Code extension in a Electron Theia application
- `electron-extension`:  RPC performance tests executed inside of a Theia plugin/VS Code extension in a Browser Theia application
- `electron-extension-node`:PC performance tests with a Theia extension RPC service that directly uses node fs in the electron context. 
Used to identify potential issues in Theia's `FileService` implementation.

### Launching Browser Theia Application

A VS Code launch configuration is provided.
 Go to the `Run & Debug` view (`Ctrl+Shift+D`) and
selected and launch `Launch Theia Browser Backend`.
 Then go to `localhost:3000` and start the desired test suite via command palette.

### Launching Electron Theia Application

A VS Code launch configuration is provided. 
Go to the `Run & Debug` view (`Ctrl+Shift+D`) and
selected and launch `Launch Theia Electron Backend`. 
Theia will open in an electron window, then start the desired test suite via command palette.

### Launching VS Code

A VS Code launch configuration is provided. 
Go to the `Run & Debug` view (`Ctrl+Shift+D`) and
selected and launch `Launch VS Code`. 
A second VS Code instance will open in which you can execute teh tests via command palette.
