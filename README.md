# RewardLedger

A simple, responsive reward cost calculator for vouchers, courses, licenses, subscriptions, merchandise, and other rewards.

## Features
- Add unlimited reward entries with category, unit cost, and quantity.
- Automatically calculate line totals, entry count, total units, and the overall budget.
- Display totals in INR, USD, EUR, GBP, AED, CAD, AUD, SGD, JPY, or CHF.
- Edit and delete entries.
- Export the list as CSV.
- Save entries in browser localStorage.
- Responsive desktop and mobile layout.
- No backend, dependencies, build step, or API keys.

## Deploy on GitHub Pages
1. Open **Settings → Pages** in this repository.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Choose branch `main` and folder `/(root)`, then click **Save**.
4. Wait for the Pages deployment to finish.

Site URL: https://adityapidurkar-dev.github.io/rewardledger/

## Important notes
- Data is stored in the current browser on the current device; it does not sync between devices. Export CSV for backups.
- Currency selection changes display formatting only; it does not perform foreign-exchange conversion. Enter all prices in the same currency for a meaningful total.
- Clearing browser site data may remove the saved list.

## Files
- `index.html` — page structure
- `style.css` — responsive styling
- `script.js` — calculations, local storage, and CSV export
- `.nojekyll` — disables Jekyll processing
