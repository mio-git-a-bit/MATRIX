# MATRIX (Windows)

A personal finance ledger for Windows. Electron app; all data stays on your PC (nothing is sent anywhere).

## Features
- Multiple users, each with their own accounts and data. Create your profile on first launch.
- Optional password per user. It really encrypts the data (AES-256). If you forget it, the data cannot be recovered.
- Taskbar icon switches automatically: white M on a dark Windows taskbar, black M on a light one.
- Custom title bar with themed window buttons (solid, so it matches the native buttons exactly), quick light/dark toggle and a user menu: click your name to see who is signed in and switch users without logging anyone out.
- Light and Black modes; full colour control with a circular hue wheel in Settings.
- English (sidebar on the left) and Arabic (sidebar on the right, full RTL). Changing language restarts the app.
- Accounts in JOD, USD, EUR, each either a bank account or cash in hand. Income, expenses, transfers.
- Custom dropdowns and date picker; ambient background (aurora + ruled ledger paper + coin ripples) tinted by your color.
- Gold and silver: buy/sell transactions in grams with purity, average cost and realized profit; purity converter (24K / 0.875 = 21K, / 0.750 = 18K).
- People: who owes you and whom you owe, per currency, gold or silver.
- Charts: net worth, income vs expense, spending by category.
- Activity search by date range with quick shortcuts (today, yesterday, last 7 days, this month, last month, this year, last year); CSV export; JSON backup/restore (backups are NOT encrypted).

## Build the Windows app
1. Install Node.js (LTS) from nodejs.org.
2. In this folder run:

       npm install
       npm run dist

3. The installer and a portable exe appear in `dist/`. (Windows SmartScreen may warn because the app is unsigned: More info > Run anyway.)

To just try it: `npm install` then `npm start`.

## Your data
Stored in your Windows user profile (%APPDATA%\Ledger (kept from the earlier name so your data carries over)). Exchange rates and metal prices are set by you in Settings; nothing is fetched online.

## Icon troubleshooting
The exe/shortcut icon is stamped in during `npm run dist`. If you ever see the default Electron atom icon:
1. Uninstall the old MATRIX, delete the `dist` folder, then run `npm run dist` again and install the new build.
2. If the build stops with a "Cannot create symbolic link" error, turn on **Windows Developer Mode** (Settings > System > For developers) or run the terminal as Administrator once, then build again.
3. Windows caches icons: run `ie4uinit.exe -show` (or restart Explorer) if the old icon still shows.
