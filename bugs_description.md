# Bugs Description - Basketball Manager

## Bug 1: Gap Between Schedule Rows (Home/Schedule Page)
**Screenshot:** image.png
**Description:** On the home/schedule page, there are visible gaps between event rows in the "today's schedule" list. The rows should be compact with minimal spacing to maximize visible content on mobile. Currently the spacing makes the list look loose and wastes precious vertical space on iPhone screens.

---

## Bug 2: "Add Event" Modal Cut Off & Not Scrollable
**Screenshot:** image-1.png
**Description:** When opening the "add event" modal from the hall/court calendar, the bottom of the modal content is cut off by the screen edge. The modal is not scrollable, so users cannot reach the bottom content or buttons. This is a critical UX blocker — users literally cannot complete the event creation flow on smaller screens.

---

## Bug 3: Team Selector Should Be Text Input (Not Card Selector)
**Screenshot:** image-2.png
**Description:** When adding a game event, the team (opponent) selector uses card-style block selectors. This is wrong for two reasons:
1. The cards look crooked/misaligned on mobile
2. For games, teams play against **external** teams (not just internal classes), so the opponent name should be a **free text input** field, not a card selector from existing classes.
The scrolling on the card selector is also difficult on mobile.

---

## Bug 4: Time Picker Not Editable on iOS
**Screenshot:** image-3.png
**Description:** The time picker (start time / end time) when adding a game event does not allow manual editing on iOS Safari/PWA. The `<input type="time">` fields display the time but users cannot tap to change it. This may be related to how iOS handles time inputs in modal/overlay contexts, or CSS preventing interaction.

---

## Bug 5: Need Delete Button Inside Event Cards
**Screenshot:** image-4.png
**Description:** There is no way to delete an event directly from the event card in the hall schedule view. Users need a trash icon inside each event card to quickly remove events. Currently deletion requires navigating into the event first.

---

## Bug 6: Coach Name Hard to Click in Event Creation
**Screenshot:** image-5.png
**Description:** When adding a training from the court/hall calendar, the coach/trainer name cards are hard to tap — users report needing multiple taps before selection registers. The touch target is likely too small or there's a competing touch handler. User suggests redesigning the entire "add event" UI for better reliability.

---

## Bug 7: Event Deletion Broken + Wrong Redirect
**Description:** Two issues:
1. The delete action doesn't actually remove the event from the database (event persists after "deleting")
2. After confirming deletion, the user is redirected to a completely different/wrong page instead of staying on the hall schedule or going back to the relevant view.

---

## Bug 8: UI Overlap Bug on Team Page
**Screenshot:** image-6.png
**Description:** On the team detail page, the "assign trainer" modal/overlay doesn't display properly. It overlaps with the underlying page content (hall info, schedule section visible behind the modal). The modal backdrop isn't covering the full screen, and content beneath bleeds through. Z-index or positioning issue.

---

## Bug 9: Bottom Navigation Disappears on iOS
**Description:** The bottom navigation bar disappears on iOS Safari/PWA. This is likely caused by iOS safe area handling — the nav may be hidden behind the iOS home indicator bar, or viewport height calculations are off. This is a critical navigation blocker since the bottom nav is the primary way to navigate the app on mobile.

---

## Bug 10: Edit Player Modal Scroll Bug
**Screenshot:** image-7.png
**Description:** When editing a player (trainee) details, the modal content extends beyond the visible area and cannot be scrolled. The bottom action buttons are likely hidden below the fold. The modal needs proper overflow-y scrolling and respect for safe areas.

---

## Bug 11: Arabic Calendar Day Abbreviations Are Wrong
**Description:** The calendar in the hall schedule view shows Arabic single-letter abbreviations for days of the week (Sunday through Saturday), but the letters displayed don't correctly represent the intended days. The `arSA` (Saudi Arabic) locale from date-fns may use different day abbreviations than what's expected in the app's context. Need to use correct Arabic day abbreviations manually.
