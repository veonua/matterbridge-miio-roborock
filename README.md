# <img src="matterbridge.svg" alt="Matterbridge Logo" width="64px" height="64px">&nbsp;&nbsp;&nbsp;Matterbridge Plugin Template

[![npm version](https://img.shields.io/npm/v/matterbridge.svg)](https://www.npmjs.com/package/matterbridge)
[![npm downloads](https://img.shields.io/npm/dt/matterbridge.svg)](https://www.npmjs.com/package/matterbridge)
[![Docker Version](https://img.shields.io/docker/v/luligu/matterbridge?label=docker%20version&sort=semver)](https://hub.docker.com/r/luligu/matterbridge)
[![Docker Pulls](https://img.shields.io/docker/pulls/luligu/matterbridge.svg)](https://hub.docker.com/r/luligu/matterbridge)
![Node.js CI](https://github.com/Luligu/matterbridge-plugin-template/actions/workflows/build-matterbridge-plugin.yml/badge.svg)
![CodeQL](https://github.com/Luligu/matterbridge-plugin-template/actions/workflows/codeql.yml/badge.svg)
[![codecov](https://codecov.io/gh/Luligu/matterbridge-plugin-template/branch/main/graph/badge.svg)](https://codecov.io/gh/Luligu/matterbridge-plugin-template)

[![powered by](https://img.shields.io/badge/powered%20by-matterbridge-blue)](https://www.npmjs.com/package/matterbridge)
[![powered by](https://img.shields.io/badge/powered%20by-matter--history-blue)](https://www.npmjs.com/package/matter-history)
[![powered by](https://img.shields.io/badge/powered%20by-node--ansi--logger-blue)](https://www.npmjs.com/package/node-ansi-logger)
[![powered by](https://img.shields.io/badge/powered%20by-node--persist--manager-blue)](https://www.npmjs.com/package/node-persist-manager)

This template now includes an example of how to register a virtual robotic vacuum cleaner. The vacuum exposes clusters for run mode, clean mode and operational state and logs simple messages when commands like `changeToMode`, `pause`, `resume` or `goHome` are received. Supported run and clean modes are modelled after the Roborock S5. The example also defines service areas for **Kitchen**, **Living Room**, **Master Bedroom**, **Second Bedroom**, **Dressing** and **Entryway**. Check `src/module.ts` for the implementation details.

## Features

- **Dev Container support for instant development environment**.
- Pre-configured TypeScript, ESLint, Prettier, Jest and Vitest.
- Example project structure for Accessory and Dynamic platforms.
- Ready for customization for your own plugin.
- The dev branch of Matterbridge is already build and installed into the Dev Container and linked to the plugin.
- The project has an already configured Jest / Vitest test unit (with 100% coverage) that you can expand while you add your own plugin logic.
- It has a workflow configured to run on push and pull request that build, lint and test the plugin on node 20, 22 and 24 with ubuntu, macOS and windows.
- It also has a workflow configured to publish on npm. Add your NPM_TOKEN to the repository secrets.

## Getting Started

1. Create a repository from this template using the [template feature of GitHub](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template).
2. Clone it locally and open the cloned folder project with [VS Code](https://code.visualstudio.com/). If you have docker or docker desktop, just run `code .`.
3. When prompted, reopen in the devcontainer. VS Code will automatically build and start the development environment with all dependencies installed.
4. Update the code and configuration files as needed for your plugin.
5. Follow the instructions in the matterbridge [README-DEV](https://github.com/Luligu/matterbridge/blob/dev/README-DEV.md) and comments in module.ts to implement your plugin logic.

## Using the Devcontainer

- Docker Desktop or Docker Engine are required to use the Dev Container.
- Devcontainer works correctly on Linux, macOS, Windows, WSL2.
- The devcontainer provides Node.js, npm, TypeScript, ESLint, Prettier, Jest, Vitest and other tools and extensions pre-installed and configured.
- The devcontainer is optimized using named mounts for node_modules and matterbridge.
- You can run, build, and test your plugin directly inside the container.
- To open a terminal in the devcontainer, use the VS Code terminal after the container starts.
- All commands (npm, tsc, matterbridge etc.) will run inside the container environment.
- All the source files are on host.
- Since the dev container doesn't have network host and IPV6, is not possible to pair matterbridge from the Devcontainer but you can add your plugin to matterbridge and test it inside the devcontainer.

## Documentation

Refer to the Matterbridge documentation for other guidelines.

---
