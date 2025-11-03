# Publish Order
- **valet library** → lint, build, version, publish. This release is the source of truth baked into MCP data.
  ```sh
  npm run lint:fix
  npm run build
  npm version patch|minor|major
  npm publish --access public
  ```
- **valet-mcp** → rebuild data (captures new valet version), selfcheck, publish via wrapper scripts.
  ```sh
  npm run mcp:build
  npm run mcp:server:build
  npm run mcp:server:publish[:patch|:minor|:major]
  ```
- **create-valet-app** → update template deps, validate, publish from the root.
  ```sh
  npm run cva:install
  cd packages/create-valet-app
  npm version patch|minor|major
  # npm run cva:validate
  npm publish --access public
  ```
- **docs** → bump to the new valet release, ensure regenerated MCP data is staged, build.
  ```sh
  npm --prefix docs run build
  ```
- **git + deploy** → commit bumps/data, push with tags, PR into `main` for the production docs build.
  ```sh
  git push origin development --follow-tags 
  ```
