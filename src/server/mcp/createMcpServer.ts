import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import getAppVersion from '@/server/app/getAppVersion';
import type AuthContext from '@/server/auth/AuthContext';
import getConfig from '@/server/config/getConfig';
import ApiError from '@/server/error/ApiError';
import buildMcpTools from '@/server/mcp/buildMcpTools';

/**
 * MCP server for one request, with the tools the token's user may use.
 */
export default function createMcpServer(context: AuthContext): McpServer {
    const server = new McpServer({name: getConfig().appName.toLowerCase(), version: getAppVersion()}, {
        instructions: 'Business data of a freelancer: customers, recurring charges (hosting, domains), fixed costs, expenses, invoices, offers, '
                      + 'resources, tasks and taxes. Money values in entity tools are decimals; dashboard values are integer cents. '
                      + 'Invoices are drafts (to_issue) until issued; issued invoices cannot be changed, only cancelled. '
                      + 'Receipts and other files are uploaded with upload_file (base64) and can be attached to an expense or offer in the same call.',
    });

    for (const tool of buildMcpTools()) {
        if (!tool.readOnly && context.scope !== 'read_write') {
            continue;
        }
        if (tool.adminOnly === true && context.role !== 'admin') {
            continue;
        }
        server.registerTool(tool.name, {
            annotations: {destructiveHint: tool.destructive === true, readOnlyHint: tool.readOnly},
            description: tool.description,
            inputSchema: tool.inputSchema,
        }, async (args: Record<string, unknown>) => {
            try {
                const result = await tool.handler(context, args ?? {});
                return {content: [{text: JSON.stringify(result ?? {ok: true}, null, 2), type: 'text' as const}]};
            }
            catch (error) {
                const message = error instanceof ApiError
                                ? JSON.stringify({code: error.code, details: error.details ?? null, message: error.message})
                                : (error instanceof Error ? error.message : String(error));
                return {content: [{text: message, type: 'text' as const}], isError: true};
            }
        });
    }
    return server;
}
