# Screens & Features

## Screen 1: Services Menu  (/)
User: customer. Goal: pick salon services fast.
- Top: salon name "Glamour Queue", Open/Closed badge, search box
- Category tabs (sticky): All | Hair | Skin | Nails | Spa
- Service cards, 2 per row on mobile: category emoji, name, type tag (Quick/Standard/Premium),
  duration, price, [ + Add ] button → becomes [ - 1 + ] after adding
- Unavailable services: greyed out, "Unavailable" label, button disabled
- Bottom sticky bar (only when cart has items):
  "3 services · ₹1400    View Cart >"

## Screen 2: Cart  (/cart)
- Back arrow to menu
- List of selected services with - / + controls and remove (trash) button
- Each item: name, duration, unit price, quantity, subtotal
- Summary: service count, estimated duration, total
- Name and Phone Number fields (required, show error if empty/invalid)
- Phone: 10 digits only
- [ Book Appointment ] big violet button → goes to Token Status
- Empty state: shopping bag icon + "Your cart is empty" + browse button

## Screen 3: Token Status  (/token/:id)
- Large token number (e.g. #42) taking up ~1/3 of screen
- Customer name below token
- Progress steps: Placed → In Progress → Completed (current one highlighted with ring)
- Estimated wait based on service durations
- Service list with quantities
- When Completed: green background, celebration icon, "Your service is ready!"
- When Cancelled: red state with cancelled message
- Cancel button (only while Placed)
- Updates in real time via Socket.IO, no manual refresh needed

## Screen 4: Stylist Board  (/stylist)   — tablet/laptop
- 3 columns: NEW (blue) | IN PROGRESS (amber) | COMPLETED (green)
- Each order card: token number, customer name, services with qty, time since booked
- Card buttons: NEW → [Start] | IN PROGRESS → [Complete] | COMPLETED → [Check Out]
- Orders older than 20 min get a red border
- New order arrives → card appears automatically via Socket.IO
- Empty column: "No orders" placeholder

## Screen 5: Now Serving Display  (/display)   — TV
- Full screen, dark background (gray-900), no navbar
- Two halves side by side:
  Left: "🔄 In Progress" — grey tokens on dark cards
  Right: "✅ Ready to Collect" — large green tokens with green border
- Newly-completed token blinks for 5 seconds
- Tokens disappear when order is Checked Out
- Optimized for 1920×1080, readable from 5 metres
- Auto-updates via Socket.IO, no interaction needed

## Screen 6: Admin / Service Manager  (/admin)
- Summary cards at top: Today's Bookings, Revenue, Completed, Top Service
- Service table: name, category, price, duration, type, available toggle, edit/delete
- [ + Add Service ] button → opens modal form
- Form: name, category dropdown, price, duration, type dropdown, description
- Available toggle: instant on/off, broadcasts update via Socket.IO
- Delete: confirmation dialog
- Real-time stats update when new orders come in
