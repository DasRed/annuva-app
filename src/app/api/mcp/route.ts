import {WebStandardStreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import errorResponse from '@/server/api/errorResponse';
import getRequestContext from '@/server/auth/getRequestContext';
import createMcpServer from '@/server/mcp/createMcpServer';

export const dynamic = 'force-dynamic';

/**
 * MCP endpoint (Streamable HTTP, stateless). Authenticate with "Authorization: Bearer <API token>".
 */
async function handle(request: Request): Promise<Response> {
    try {
        const context = await getRequestContext(request, 'mcp');
        const server = createMcpServer(context);
        const transport = new WebStandardStreamableHTTPServerTransport({enableJsonResponse: true, sessionIdGenerator: undefined});
        await server.connect(transport);
        const response = await transport.handleRequest(request);
        void server.close();
        return response;
    }
    catch (error) {
        const response = errorResponse(error);
        if (response.status === 401) {
            response.headers.set('WWW-Authenticate', 'Bearer realm="annuva"');
        }
        return response;
    }
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;
