# Tropica Sales Command Centre

A static GitHub Pages dashboard for the Tropica sales summary. It keeps the existing visual style and reads the latest published figures from `data/sales.json`.

## Data flow

1. The workbook stays in your OneDrive for Business / SharePoint.
2. An Office Script reads the `Follow-up Summary` sheet and returns dates, target, total figures, and every salesperson row.
3. A Power Automate cloud flow runs when the workbook is modified and sends that summary to the GitHub connector.
4. GitHub Actions saves the summary in `data/sales.json` and publishes the updated dashboard. Your PC does not need to be on.

The browser never logs into SharePoint. Because this is a public GitHub Pages site, its summary data file is public too. Only publish figures and names that you are allowed to share publicly. Do not place Microsoft or GitHub passwords/tokens in this repository.

## Set up or stop automatic updates

Follow [LIVE-DATA-SETUP.md](LIVE-DATA-SETUP.md). It explains the Office Script, Power Automate flow, required GitHub Actions settings, first test, and how to turn the flow off and back on.

The OneDrive and Excel Online (Business) connectors are standard connectors, and Microsoft lists the GitHub connector as standard; its **Create a repository dispatch event** action is marked Preview. The HTTP-based route is not used in this project. You need a Microsoft 365 business license that supports Office Scripts with Power Automate. Your organization may restrict Office Scripts, connectors, or outbound GitHub access, in which case an admin may need to allow them. See the Microsoft documentation links in the setup guide for current connector details.

The bundled Three.js library is MIT licensed; see `THREE-LICENSE.txt`.