BANKING APP (mobile UI prototype)
=================================

FILES
  index.html     Page structure
  style.css      All styling
  script.js      Avatar faces + transfer flow logic
  manifest.json  Web app manifest (name, colours, icon)
  sw.js          Service worker (needed for phone notifications)
  icon-192.png, icon-512.png, apple-touch-icon.png   App icons (also used in notifications)
  README.txt     This file

HOW TO RUN
  1. Keep all files in the same folder.
  2. Double-click index.html to open it in a browser.
     (For best results view at phone width, or use browser
     dev tools > device toolbar.)
  3. To test the manifest / "Add to Home Screen", serve the
     folder over http, e.g.:  python3 -m http.server 8000
     then open http://localhost:8000

NOTES
  - Processing and success are bottom-sheet pop-ups shown after PIN entry (paper plane, badge + confetti).
  - Avatars and Upwork/Netflix/Starbucks logos are drawn
    inline as SVG. Replace them with your own images by
    editing index.html and script.js.
  - Colours and sizes are in style.css.
  - The bottom bar is a frosted-glass pill (see "Floating frosted-glass pill nav" in style.css).

RECEIPT & NOTIFICATION
  - The success pop-up rises to about 86% of the screen and lists recipient, account number, bank,
    date/time and a generated reference number (TXN + 9 digits, the same one used in the notification) under the amount. The pending pop-up is a little taller than before.
  - About 1.4s after a successful transfer the app sends a real phone notification
    ("Transaction Successful" with amount, recipient, reference, date, available balance and a thank-you line). If the phone can't show one,
    an in-app banner drops from the top instead.
  - Phone notifications need: (1) the app served over https:// (or localhost) - not opened as a file,
    (2) permission - asked when you tap Transfer, or use Settings > Notifications,
    (3) on iPhone (iOS 16.4+): Safari > Share > Add to Home Screen, then open the app from the Home Screen icon.
  - Notifications are triggered by the app itself (no server), so the app must still be running
    when the transfer finishes. Real bank alerts while the app is closed need a push server.

SETTINGS
  - Tap "Settings" in the bottom bar: theme colour (purple/red/green/light blue/grey),
    Light/Dark mode and USD/NGN currency. Choices are remembered on the device.
  - NGN rate is the RATE constant at the top of script.js (default 1 USD = 1,500 NGN).

PIN & KEYBOARD
  - Tapping "Send money" opens a 4-digit PIN popup. Default PIN is 1472.
    Change it in Settings > Security > Change transaction PIN (current -> new -> confirm).
    The PIN is stored on the device (localStorage) - prototype only; a real app must verify it on a server.
  - The popup and the transfer form are positioned above the phone keyboard using the
    visualViewport API (see fit() in script.js).

DEPOSIT
  - Tap "Deposit" on the home screen to choose "Receive tag" or "Card top up".
  - Receive tag: enter the amount and the name you are receiving from, then tap Done.
  - Card top up: enter the amount, card number, expiry (MM/YY) and CVV, then tap Done.
    (Card details are only checked for format and are never stored or sent anywhere.)
  - Both show the same Processing and Success pop-ups as Transfer, add a green entry to the
    transaction list, increase the balance, and send a "Deposit Successful" notification
    (amount, Checking account ending ****2345, available balance, time). The receipt reference starts
    with DEP. No PIN is asked for deposits.
  - The balance starts at $0.00 the first time the app is opened.

SAVINGS
  - The Savings card starts empty: "Save more, Spend less" and a "Start saving" button.
  - Start saving: choose a goal name (optional) and a target amount. The card then shows
    progress, an "Add money" button and "Edit goal".
  - Add money opens the Savings transfer screen: move money Checking -> Savings, or switch to
    "To checking" to withdraw. 25% / 50% / Max chips fill the amount. No PIN is asked for
    transfers between your own accounts. Each move adds a row to the transaction list, a
    receipt (reference starts with SAV) and a notification.
  - The top balance is now labelled "Checking Balance" because savings are kept separately.

PULL TO REFRESH
  - Drag the white sheet down from the top: a coin flips as you pull, locks into an orbit ring
    past the threshold (small vibration), spins while refreshing, then turns into a tick.
  - It re-renders the greeting and balances (there is no server in this prototype).

LOANS
  - A long Loans card sits under the Savings card. Before you borrow it shows "Get fast and easy loans"
    with a "Get a loan" button. After you borrow it shows "Amount owed", a repayment progress bar,
    the due date, and Repay / Borrow more buttons.
  - Get a loan: enter an amount and pick 1, 3 or 6 months. Interest is flat 2% per month (shown before you
    confirm, with the total to repay and due date). The money lands in Checking straight away.
  - Repay: pay part or all of what you owe from Checking (25% / 50% / Max chips). When it reaches zero the card
    goes back to its starting look.
  - Credit limit is LN_MAX (default $10,000) and the interest rate is LN_RATE (default 0.02 = 2% a month),
    both near the top of the saved-state section of script.js. No PIN is asked, like savings moves.
  - Loans add rows to the transaction list, a receipt (reference starts with LON / RPY) and a notification.

TRANSFER SCREEN
  - A themed "Easy, Fast and Free transfers" banner with a drawn lightning-bolt icon sits above Available balance.
  - New optional Description field (many banks call it Narration, Remark or Note) with quick tags such as
    Food, Clothes, Rent. It shows on the receipt, in the notification and in the transaction list.

FIXES IN THIS VERSION
  - Deposit notification said account ****1234 while the card shows 2345 (now 2345).
  - Success tick was invisible for people using "reduce motion".
  - Money maths is rounded so balances never show float errors (e.g. 0.30000000000000004).
  - Sending the full balance while in NGN was sometimes rejected by a rounding error.
  - Greeting follows the time of day. Enter key on a field now closes the keyboard.
  - "See all" no longer jumps the page; empty "Yesterday" label removed.
  - manifest.json theme colour now matches the page.

SAVED DATA
  - The balance and the transaction list you create are saved on the device (localStorage), together
    with theme, currency and PIN, so they are still there after closing and reopening the app.
  - To start again from $0.00, clear the site data in the browser (or run localStorage.clear() in the console).
