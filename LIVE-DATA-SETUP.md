# Connect the Tropica dashboard to the SharePoint workbook

This setup uses Power Automate as a cloud bridge. The flow reads your workbook and sends the summary to GitHub; GitHub Actions updates the public dashboard. Your PC stays off. It does not use Microsoft Graph app registration.

> **Public data:** this repository and GitHub Pages site need to be public. The summary written to `data/sales.json` is therefore public. The flow sends salesperson names, sales amounts, target, and date range. Do not publish information your organization considers private.

> **Licensing:** OneDrive for Business, Excel Online (Business), and the Microsoft GitHub connector are listed as standard connectors. Microsoft lists the GitHub **Create a repository dispatch event** action as Preview. Office Scripts in Power Automate requires a qualifying Microsoft 365 business license. If your tenant blocks Office Scripts or the GitHub connector, ask your Microsoft 365 administrator to enable/allow it. This project avoids the HTTP Premium connector and a GitHub personal access token in Power Automate. Check your tenant plan before relying on the flow.

## 1. Add the project to its own GitHub repository

1. Create a separate public GitHub repository for this dashboard. Do not upload these files over another project.
2. Upload the contents of this folder so `index.html`, `data/`, `assets/`, `scripts/`, and `.github/` appear at the repository root.
3. In the repository, open **Settings → Pages**. Choose **GitHub Actions** as the build and deployment source. The included workflow will publish the Pages site.
4. In **Settings → Actions → General**, make sure GitHub Actions are allowed and the workflow has permission to write repository contents. The included workflow declares `contents: write` for its own data commit.
5. Wait for the first **Publish dashboard and process SharePoint refresh** workflow run to finish. The site address is shown under **Settings → Pages**.

## 2. Save the Office Script in Excel for the web

1. Open the workbook link in Excel for the web using your Microsoft 365 account.
2. Open the **Automate** tab, select **New Script**, and replace the sample code with everything in [`scripts/ExportDashboardData.ts`](scripts/ExportDashboardData.ts).
3. Save the script with the name **ExportDashboardData**.
4. Run it once manually. It should return JSON with `dateRange`, `totals`, and a `salespeople` list.

The script looks for a sheet named **Follow-up Summary** (or **Summary**) and a header row containing **Salesperson** plus a sales value column. Add new salesperson summary rows below that header; the script reads the current used range and includes each named row before the summary total/target lines.

## 3. Create the Power Automate cloud flow

1. Go to [Power Automate](https://make.powerautomate.com/) and choose **Create → Automated cloud flow**.
2. Choose the OneDrive for Business trigger **When a file is modified (properties only)**. Select the folder containing this workbook.
3. Add a condition so only the workbook filename continues down the Yes branch. Use the exact filename shown in OneDrive.
4. In the Yes branch, add **Excel Online (Business) → Run script**. Select the workbook and **ExportDashboardData**.
5. Add a **Compose** action. Open its **Expression** tab and enter this expression (replace `Run_script` if your step has a different internal name):

   ```text
   json(concat('{"dashboardJson":', outputs('Run_script')?['body/result'], '}'))
   ```

   This turns the script's JSON text into the event payload object that GitHub expects.

6. Add the **GitHub → Create a repository dispatch event** action. Sign in with the GitHub account that can write to this new repository. Set:
   - **Repository Owner:** your GitHub username or organization
   - **Repository Name:** this new dashboard repository
   - **Event Name:** `dashboard-sales-updated`
   - **Event Payload:** the output of the Compose action
7. Save the flow. In its settings, turn on trigger concurrency control and set the maximum concurrent runs to **1** so overlapping file-change notifications do not try to update the file at once.
8. Test the flow once. The GitHub Actions run should show **repository_dispatch** as its event, commit `data/sales.json`, and deploy Pages. The dashboard refresh time and figures should then change.

You do not need to create Microsoft app registration, a Graph API permission, a GitHub Actions secret, or a GitHub personal access token for this version. The GitHub connector creates an account connection inside Power Automate instead.

## 4. How to stop or restart updates

- To pause automatic refreshes, open the flow in Power Automate and switch it **Off**. The last published dashboard values remain visible.
- To resume, switch the flow **On**. New workbook edits will trigger refreshes again. If you want to refresh immediately, use **Test** or edit and save the workbook once.
- The GitHub Pages workflow also supports a manual run under **GitHub → Actions → Publish dashboard and process SharePoint refresh → Run workflow**. A manual workflow run republishes the current committed data; it does not read the workbook itself.

## Troubleshooting

- **The GitHub dispatch action is unavailable or blocked:** your tenant might restrict it, or its Preview availability may differ in your environment. Ask your Power Platform administrator. The fallback uses GitHub REST API HTTP actions, which Microsoft classifies as Premium in Power Automate and may require a paid entitlement.
- **The flow succeeds but the dashboard does not change:** open the GitHub Actions run and look for an error in **Save new workbook summary**. Check that the event name is exactly `dashboard-sales-updated`, the payload has a `dashboardJson` object, and the script output contains `salespeople` and `totals.target`.
- **Names or dates are missing:** confirm the worksheet is named **Follow-up Summary** and the header cells contain Salesperson and Sales value. The date fields should be labelled From and To with each date in the next cell.
- **A modified-file trigger runs more than once:** that can happen. Trigger concurrency control serializes those runs. The GitHub workflow also cancels an older Pages deployment when a newer one starts.
- **Usage:** Microsoft documents up to 1,600 Office Script `Run script` calls per user per day for Power Automate. This flow normally uses one call per workbook change, but file-change triggers can occasionally fire more than once.

## Microsoft reference links

- [Run Office Scripts with Power Automate](https://learn.microsoft.com/office/dev/scripts/develop/power-automate-integration)
- [Excel Online (Business) connector](https://learn.microsoft.com/connectors/excelonlinebusiness/)
- [GitHub connector and its available actions](https://learn.microsoft.com/connectors/github/)
- [Power Automate licensing and connector entitlements](https://learn.microsoft.com/power-platform/admin/power-automate-licensing/types)