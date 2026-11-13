# Carpool

A private carpool app for parents and their trusted friends: school runs and classes with fair driving turns, kids' outings with a seat plan, and rides with friends with a simple cost split.

Plain HTML, CSS and JavaScript (no framework, no build step for the web page), packaged as an Android app with [Capacitor](https://capacitorjs.com/). Same setup as [techtool4u/games](https://github.com/techtool4u/games).

- `index.html`, `styles.css`, `app.js`: the app screens. Open `index.html` in a browser to try it.
- `logic.js`: the rules with no UI: driving rotation, fairness, seat checks, cover and swap, outing seat plan, cost balances. Tested in `tests/`.
- `docs/REQUIREMENTS.md`: product requirements. `docs/mockups/`: design mockups.

## What it does

- **Family:** your kids (seat needs: regular, booster, car seat; medical notes; emergency contacts), your cars and a second adult.
- **Carpool groups** (school, swimming, music…): families, kids, trips (e.g. *To school 7:45, Mon–Fri*), holidays. The app plans **fair driving turns** for 4 weeks ahead, only picking drivers whose car has enough seats and boosters and who can drive that day. A fairness chart shows trips driven and planned.
- **Today:** your turn to drive (Confirm, Start trip), who's driving your kids, open cover requests, coming outings.
- **Trip check-in:** tick each child at pickup and drop-off, then *Send update* to the parents' group chat. Running late, emergency (call 112 or parents), child info, Google Maps.
- **Can't drive:** ask for cover (message for the group chat), someone taps *I'll cover it*, or swap days.
- **Kids' outings:** birthday party, playdate: RSVPs, drivers there and back, automatic seat plan (kids ride with their own parent first, booster rules), tap to move a child.
- **Friends:** offer or ask for rides (office commute, airport, wedding), log trips, see who owes what and settle up.
- **Reminders** on Android: the evening before and 30 minutes before your driving turn.
- **Backup / restore** of all data as text.
- **Share a group with other parents (no server):** on a group tap **Invite** and send the message on WhatsApp. The other parent opens Carpool, taps **Join a group** and pastes the whole message, then picks which family is theirs (a new install is set up as that family; an existing one is matched, kids by first name). The message holds a compressed copy of the group, its families and its turns. After changes, anyone taps **Invite** again and the others paste it to update; trips already checked in on a phone are kept.

**Current limit:** there's no server, so phones don't update each other automatically: a change reaches other parents when someone sends the group again with **Invite**. Live sync needs a backend (e.g. Firebase or Supabase) and is a possible next step.

## Android app

- **Get the APK:** every push that touches the app runs the *Android APK* workflow (Actions tab). Open the latest run and download the `Carpool-apk-…` artifact, unzip it, and open the `.apk` on your phone (allow "Install unknown apps" when asked). You can also start the workflow by hand with **Run workflow**. A second job installs the APK on an Android 14 emulator and checks that it starts and handles Back.
- **What changes in the app:** `scripts/build-web.mjs` copies the page into `www/`, downloads the fonts so the app works offline, and links `app-shell/` in (Android back button, no long-press text selection).
- **Signing:** without secrets each build is signed with a throwaway debug key, so installing a newer APK may require uninstalling the old one first (which erases the app's data, so use *Back up data* first). To sign every build with the same key, create one (`keytool -genkeypair -v -keystore app.keystore -alias carpool -keyalg RSA -keysize 2048 -validity 10000`) and add the repository secrets `ANDROID_KEYSTORE_BASE64` (`base64 -w0 app.keystore`), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` and `ANDROID_KEY_PASSWORD`. With them set, the workflow also builds the Google Play bundle (`.aab`). Keep that key safe and never commit it.
- **Build locally:** install Node 22, JDK 21 and Android Studio (for the SDK), then run `npm ci && npm run apk`. The APK lands in `android/app/build/outputs/apk/debug/`.
- **Tests:** `npm test`.
- **Icon:** `app-shell/icon.svg`. After changing it, regenerate the PNGs with `node scripts/make-icons.cjs` (needs Playwright).
