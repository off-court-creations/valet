// ─────────────────────────────────────────────────────────────
// packages/valet-mcp/src/skills/directionalNavigation.ts  | valet-mcp
// Packaged directional-navigation skill exposed as an MCP prompt and resource
// ─────────────────────────────────────────────────────────────
import { readFileSync } from 'node:fs';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

type DirectionalNavigationSkillServer = Pick<McpServer, 'registerPrompt' | 'registerResource'>;

export const DIRECTIONAL_NAVIGATION_SKILL_NAME = 'valet-directional-navigation';
export const DIRECTIONAL_NAVIGATION_PROMPT_NAME = 'valet__build_directional_navigation';
export const DIRECTIONAL_NAVIGATION_SKILL_URI = 'mcp://valet/skill/valet-directional-navigation';

const skillFile = new URL('../../skills/valet-directional-navigation/SKILL.md', import.meta.url);

export const DIRECTIONAL_NAVIGATION_SKILL_MARKDOWN = readFileSync(skillFile, 'utf8');
export const DIRECTIONAL_NAVIGATION_SKILL_PROMPT = DIRECTIONAL_NAVIGATION_SKILL_MARKDOWN.replace(
  /^---\r?\n[\s\S]*?\r?\n---\r?\n/,
  '',
).trim();

export function registerDirectionalNavigationSkill(server: DirectionalNavigationSkillServer): void {
  server.registerResource(
    DIRECTIONAL_NAVIGATION_SKILL_NAME,
    DIRECTIONAL_NAVIGATION_SKILL_URI,
    {
      title: 'Valet Directional Navigation Skill',
      description:
        'Canonical workflow for building device-neutral directional navigation with valet.',
      mimeType: 'text/markdown',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'text/markdown',
          text: DIRECTIONAL_NAVIGATION_SKILL_MARKDOWN,
        },
      ],
    }),
  );

  server.registerPrompt(
    DIRECTIONAL_NAVIGATION_PROMPT_NAME,
    {
      title: 'Build directional navigation with valet',
      description: 'Apply valet’s device-neutral focus, scope, activation, and adapter workflow.',
    },
    async () => ({
      description: 'Build or review an accessible directional-navigation integration using valet.',
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: DIRECTIONAL_NAVIGATION_SKILL_PROMPT,
          },
        },
      ],
    }),
  );
}
