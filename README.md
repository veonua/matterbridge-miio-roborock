<p align="center">
  <img src="./matterbridge.svg" alt="Matterbridge Miio Roborock Logo" width="64" height="64" />
</p>

<h1 align="center">Matterbridge Miio Roborock Plugin</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/matterbridge-miio-roborock">
    <img src="https://img.shields.io/npm/v/matterbridge-miio-roborock.svg" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/matterbridge-miio-roborock">
    <img src="https://img.shields.io/npm/dt/matterbridge-miio-roborock.svg" alt="npm downloads" />
  </a>
  <a href="https://github.com/veonua/matterbridge-miio-roborock/actions/workflows/publish-matterbridge-plugin.yml/badge.svg">
    <img src="https://github.com/veonua/matterbridge-miio-roborock/actions/workflows/publish-matterbridge-plugin.yml/badge.svg" alt="nodejs ci" />
  </a>
  <a href="https://codecov.io/gh/veonua/matterbridge-miio-roborock">
    <img src="https://codecov.io/gh/veonua/matterbridge-miio-roborock/branch/main/graph/badge.svg" alt="codecov" />
  </a>
  <a href="https://www.npmjs.com/package/matterbridge">
    <img src="https://img.shields.io/badge/powered%20by-matterbridge-blue" alt="powered by Matterbridge" />
  </a>
  <a href="https://www.npmjs.com/package/node-ansi-logger">
    <img src="https://img.shields.io/badge/powered%20by-node--ansi--logger-blue" alt="powered by node-ansi-logger" />
  </a>
</p>

---

**Matterbridge Miio Roborock Plugin** is a dynamic platform plugin for [Matterbridge](https://www.npmjs.com/package/matterbridge) that integrates Roborock vacuums using the Miio protocol. It allows controlling your robot from Apple Home and other Matter compatible apps.

> ⭐ If you find this project useful, please consider starring the repository on GitHub:  
> [https://github.com/veonua/matterbridge-miio-roborock](https://github.com/veonua/matterbridge-miio-roborock)

---

### ⚠️ Important Notes

- **Matterbridge must be run in child bridge mode** for proper operation.
- **Use one Matterbridge instance per Roborock vacuum.**  
  If you have more than one vacuum, please run separate instances. Put the `<Vacuum name>-<duid>` of the device you want to use into the **whiteList** section of the plugin configuration popup.

More details available here: [Discussion #264](https://github.com/Luligu/matterbridge/discussions/264)

---
### 🚧 Project Status

- **Under active development**
- Requires **`matterbridge@3.0.4`**
- ⚠️ **Known Issue:** Vacuum may appear as **two devices** in Apple Home

---


📋 **Apple Home ↔️ Roborock Clean Mode Mapping:**
| Apple Home Mode | Roborock Fan Speed |
|-----------------|--------------------|
| Standard        | 101                |
| Medium          | 102                |
| Turbo           | 104                |
| Max             | 105                |

These values may vary depending on the model. Consult your device documentation for details.

---
### 📦 Prerequisites

- A working installation of [Matterbridge](https://github.com/Luligu/matterbridge)
- Compatible Xiaomi/Roborock vacuum model (not all models supported yet)

---
### 🧱 Built With

This plugin is built on top of the Matterbridge plugin template:
🔗 [matterbridge-plugin-template](https://github.com/Luligu/matterbridge-plugin-template)

---

Please be aware that this plugin is about Roborock robots that work with Xiaomi (Miio protocol).

## Xiaomi Token

To use this plugin you need the vacuum's `token`. Here are some resources:

- :us::gb: - [Xiaomi cloud tokens extractor](https://github.com/PiotrMachowski/Xiaomi-cloud-tokens-extractor)
- :us::gb: - [python-miio - Getting started](https://python-miio.readthedocs.io/en/latest/discovery.html)
- :de: - [Apple HomeKit Forum - HomeKit.Community](https://forum.smartapfel.de/forum/thread/370-xiaomi-token-auslesen/)
- :de: - [Homematic-Guru.de](https://homematic-guru.de/xiaomi-vacuum-staubsauger-roboter-mit-homematic-steuern)
- :de: - [Tutorial with token extractor - simon42.com](https://www.simon42.com/roborock-homekit-token-einfach/)

NOTE: We are not currently aware of how to retrieve the token from the Roborock App. If you find a way please share it.

