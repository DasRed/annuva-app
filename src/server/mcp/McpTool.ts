import type {z} from 'zod';
import type AuthContext from '@/server/auth/AuthContext';

/**
 * One MCP tool. Tools run with the permissions of the token's user; write tools are only offered
 * to tokens with scope "read_write", admin tools only to tenant admins.
 */
export default interface McpTool {
    adminOnly?: boolean;
    description: string;
    destructive?: boolean;
    handler: (context: AuthContext, args: Record<string, any>) => Promise<unknown>;
    inputSchema: z.ZodObject;
    name: string;
    readOnly: boolean;
}
