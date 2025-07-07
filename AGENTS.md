# Agent Guidelines

- Before finishing any pull request, the agent must run `npm run runMeBeforePublish`.
- Matterbridge **must not** be added as a dependency, devDependency, or peerDependency in `package.json`.
- Ensure there is a `dev:link` npm script linking Matterbridge for development: `"dev:link": "npm link matterbridge"`.
