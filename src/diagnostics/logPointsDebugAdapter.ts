import {
    Logger, logger, LoggingDebugSession, InitializedEvent, DebugSession,
    Source, Event,
    Thread
} from 'vscode-debugadapter';
import { DebugProtocol } from 'vscode-debugprotocol';

import { MockLogpointsDebuggerClient, DebugSessionMetadata, LoadSourceRequest, LoadedScriptsResponse, CommandRunResult } from './logPointsClient';

interface AttachRequestArguments extends DebugProtocol.AttachRequestArguments {
    trace?: boolean;
    siteName?: string;
    publishCredentialName?: string;
    publishCredentialPassword?: string;
    instanceId?: string;
    sessionId: string;
    debugId: string;
}

const logPointsDebuggerClient = new MockLogpointsDebuggerClient();

export class NodeDebugSession extends LoggingDebugSession {
    private _sessionId: string;
    private _debugId: string;

    public constructor() {
        super("jsLogPointsdebugadapter.log");	//ToDo: where's the log file

        // uses zero-based lines and columns
        this.setDebuggerLinesStartAt1(false);
        this.setDebuggerColumnsStartAt1(false);
    }

    protected initializeRequest(response: DebugProtocol.InitializeResponse, args: DebugProtocol.InitializeRequestArguments) {
        logger.setup(Logger.LogLevel.Verbose, false);

        super.initializeRequest(response, args);
        this.sendEvent(new InitializedEvent());
    };

    protected attachRequest(response: DebugProtocol.AttachResponse, args: AttachRequestArguments) {
        this._sessionId = args.sessionId;
        this._debugId = args.debugId;

        response.body = response.body || {};
        response.body.supportsConfigurationDoneRequest = false;

        this.sendResponse(response);
    }

    protected setBreakPointsRequest(response: DebugProtocol.SetBreakpointsResponse, args: DebugProtocol.SetBreakpointsArguments): void {
        args && 1;
        response.body = {
            breakpoints: []
        }
        this.sendResponse(response);
    }

    protected threadsRequest(response: DebugProtocol.ThreadsResponse): void {
        // return the default thread
        response.body = {
            threads: [
                new Thread(1, "thread 1")
            ]
        };
        this.sendResponse(response);

        this.getLoadedScripts();
    }

    protected customRequest(command: string, response: DebugProtocol.Response, args: any): void {
        if (command == 'loadSource') {
            let sourceId: string = args;

            logPointsDebuggerClient.loadSource(null, null, null, new LoadSourceRequest(this._sessionId, this._debugId, sourceId)).then(
                (result) => {
                    if (result.isSuccessful()) {
                        response.body = {
                            content: result.json.data,
                        };
                    } else {
                        response.body = {
                            error: result.error
                        };
                    }
                    this.sendResponse(response);
                });
        }
    }

    private async getLoadedScripts() {
        let response: CommandRunResult<LoadedScriptsResponse> = await logPointsDebuggerClient.loadedScripts(null, null, null, new DebugSessionMetadata(this._sessionId, this._debugId));

        if (response.isSuccessful()) {
            response.json.data.forEach((sourceData) => {
                let source = new Source(sourceData.name, sourceData.path);
                try {
                    source.sourceReference = parseInt(sourceData.sourceId);
                } catch {
                    // if parseInt is not sucessful, then do not set the 'sourceReference' field.
                }

                this.sendEvent(new Event('loadedSource', source));
            })
        }

    }
}

DebugSession.run(NodeDebugSession);