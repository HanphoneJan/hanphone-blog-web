import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BlogApiClient } from '../client.js';
import { registerBlogTools } from './blog.js';
import { registerTaxonomyTools } from './taxonomy.js';
import { registerCommentTools } from './comment.js';
import { registerEssayTools } from './essay.js';
import { registerProjectTools } from './project.js';
import { registerDocTools } from './doc.js';
import { registerFriendLinkTools } from './friendlink.js';
import { registerMessageTools } from './message.js';
import { registerMiscTools } from './misc.js';

export function registerAllTools(server: McpServer, client: BlogApiClient): void {
  registerBlogTools(server, client);
  registerTaxonomyTools(server, client);
  registerCommentTools(server, client);
  registerEssayTools(server, client);
  registerProjectTools(server, client);
  registerDocTools(server, client);
  registerFriendLinkTools(server, client);
  registerMessageTools(server, client);
  registerMiscTools(server, client);
}
