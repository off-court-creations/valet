// ─────────────────────────────────────────────────────────────
// scripts/mcp/directionalNavigationSkill.test.mjs  | valet
// Source-level contract tests for the packaged MCP navigation skill
// ─────────────────────────────────────────────────────────────
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DIRECTIONAL_NAVIGATION_PROMPT_NAME,
  DIRECTIONAL_NAVIGATION_SKILL_MARKDOWN,
  DIRECTIONAL_NAVIGATION_SKILL_NAME,
  DIRECTIONAL_NAVIGATION_SKILL_PROMPT,
  DIRECTIONAL_NAVIGATION_SKILL_URI,
  registerDirectionalNavigationSkill,
} from '../../packages/valet-mcp/src/skills/directionalNavigation.ts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(HERE, '..', '..', 'packages', 'valet-mcp');

describe('valet directional-navigation MCP skill', () => {
  it('registers one prompt and one resource from the canonical skill', async () => {
    /** @type {any} */
    const registrations = {};
    /** @type {any} */
    const server = {
      registerPrompt(name, config, callback) {
        registrations.prompt = { name, config, callback };
      },
      registerResource(name, uri, config, callback) {
        registrations.resource = { name, uri, config, callback };
      },
    };

    registerDirectionalNavigationSkill(server);
    const { prompt: promptRegistration, resource: resourceRegistration } = registrations;
    if (!promptRegistration || !resourceRegistration) {
      throw new Error('directional-navigation skill registrations were not captured');
    }

    expect(promptRegistration.name).toBe(DIRECTIONAL_NAVIGATION_PROMPT_NAME);
    expect(promptRegistration.config.title).toBe('Build directional navigation with valet');
    const prompt = await promptRegistration.callback();
    expect(prompt.messages).toEqual([
      {
        role: 'user',
        content: { type: 'text', text: DIRECTIONAL_NAVIGATION_SKILL_PROMPT },
      },
    ]);

    expect(resourceRegistration.name).toBe(DIRECTIONAL_NAVIGATION_SKILL_NAME);
    expect(resourceRegistration.uri).toBe(DIRECTIONAL_NAVIGATION_SKILL_URI);
    const resource = await resourceRegistration.callback(new URL(DIRECTIONAL_NAVIGATION_SKILL_URI));
    expect(resource.contents).toEqual([
      {
        uri: DIRECTIONAL_NAVIGATION_SKILL_URI,
        mimeType: 'text/markdown',
        text: DIRECTIONAL_NAVIGATION_SKILL_MARKDOWN,
      },
    ]);
  });

  it('keeps the physical-input boundary and validation workflow explicit', () => {
    expect(DIRECTIONAL_NAVIGATION_SKILL_MARKDOWN).toContain('name: valet-directional-navigation');
    expect(DIRECTIONAL_NAVIGATION_SKILL_PROMPT).toContain('external adapter');
    expect(DIRECTIONAL_NAVIGATION_SKILL_PROMPT).toContain('valet__validate_jsx');
    expect(DIRECTIONAL_NAVIGATION_SKILL_PROMPT).toContain(
      'Do not add controller, remote, or rotary dependencies to valet.',
    );
    expect(DIRECTIONAL_NAVIGATION_SKILL_MARKDOWN).not.toContain('TODO');
  });

  it('includes the skill directory in the published MCP package', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'));
    expect(pkg.files).toContain('skills');
    expect(
      fs.existsSync(
        path.join(
          PACKAGE_ROOT,
          'skills',
          DIRECTIONAL_NAVIGATION_SKILL_NAME,
          'agents',
          'openai.yaml',
        ),
      ),
    ).toBe(true);
  });
});
