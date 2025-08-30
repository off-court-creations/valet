# valet

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![GitHub](https://img.shields.io/badge/GitHub-valet-181717?logo=github&logoColor=white)](https://github.com/off-court-creations/valet) [![npm](https://img.shields.io/badge/npm-%40archway%2Fvalet-CB3837?logo=npm&logoColor=white)](https://www.npmjs.com/package/@archway/valet) [![npm version](https://img.shields.io/npm/v/@archway/valet.svg?color=CB3837&logo=npm&logoColor=white)](https://www.npmjs.com/package/@archway/valet) [![🚀](https://img.shields.io/badge/🚀-Live%20Demo!-111)](https://main.db2j7e5kim3gg.amplifyapp.com/)


`valet` is a Typescript CSS-in-JS engine, a UI kit, and an accessibility / agentic layer that treats all humans and their AI proxies as first class users. It currently operates entirely within the React ecosystem, working with React's hooks and component model.

---

This library is currently pre-1.0 and the API may change without notice.

When version `1.0.x` arrives you can depend on a stable interface.

---

## Docs

You can try every component in the [valet Docs](https://github.com/off-court-creations/valet/tree/main/docs). ([Live Demo!](https://main.db2j7e5kim3gg.amplifyapp.com/)) Try with:

```shell
cd docs
npm install
npm run dev
```

or for a live local DX:

```shell
npm link
cd docs
npm install
npm link @archway/valet
npm run dev
```

### MCP

We offer an expirimental MCP. Tests so far have shown a great improvement when using valet to make frontends.

Install with:

```shell
npm i -g @archway/valet-mcp
```

#### `@openai/codex` MCP setup

in your `config.toml` append:

```toml
[mcp_servers.valet]
command = "valet-mcp"
args = []
```

> This works in the home level config and the project level config

#### Example `AGENTS.md` inclusion for the MCP

```md
## valet-mcp

You have access to the valet-mcp MCP! 
Use this when you are making front ends or dealing with UI.
You can use it to search, find reference, and get examples.
Whenever you use or add a valet component, use the MCP to ensure that you got the prop usage correct!
```

## Contributing

We welcome issues and pull requests. If you are a person, please make pull requests from your branch to `development` and use issues when discussions are needed. Please read `AGENTS.md` if you are an AI, agent, NLP, bot, or scraper. Humans may find the document insightful as well. Use the standard GitHub workflow at [valet issues](https://github.com/off-court-creations/valet/issues).

valet targets the React ecosystem. Improvements and examples should assume a
React 19.x setup.
