# Flows & Rules

## Main flow
1. Customer browses services on Menu → adds to cart
2. Goes to Cart → enters name + phone → taps Book Appointment
3. Sees token #42 on Token Status page (status: Placed)
4. Stylist taps "Start" on the Stylist Board → status: In Progress
5. Customer's tracking page updates automatically
6. Stylist taps "Complete" → status: Completed
7. TV display shows #42 under "Ready to Collect"; customer's page turns green
8. Counter staff taps "Check Out" → token leaves the board and TV
9. Customer can place a new booking

## Rules
- **Statuses**: Placed → In Progress → Completed → Checked Out. Never backwards.
- **Cancellation**: Customer can cancel only while status is Placed.
- **Token numbers**: Start from 1 every day (based on UTC date).
- **Estimated wait**: Based on total duration of booked services.
- **Max quantity**: Maximum 5 of any one service per booking (for group bookings).
- **Unavailable services**: If a service is marked unavailable by admin, it shows greyed out on the menu. Cannot be added to cart.
- **Salon hours**: Open 9 AM – 8 PM. No new bookings after 7:45 PM. Show "Salon Closed" message.
- **Real-time sync**: All screens update automatically via Socket.IO within ~1-2 seconds.
- **Phone validation**: Must be exactly 10 digits.
- **Backend validation**: All validation on the server, not just the frontend.
- **Persistence**: Orders and services stored in SQLite. Survive page refresh.

## Test checklist
- [ ] Add 3 services, book appointment → get token, total is correct
- [ ] Empty cart → Book Appointment button is disabled
- [ ] Name missing → error shown, booking not placed
- [ ] Invalid phone (not 10 digits) → error shown
- [ ] Start/Complete on stylist board → customer page updates by itself
- [ ] Completed token appears on TV display and blinks
- [ ] Cannot move an order backwards (e.g., Completed → In Progress)
- [ ] Mark service Unavailable → greyed out on Menu immediately
- [ ] Unavailable service cannot be added to cart
- [ ] Whole flow works on a phone screen
- [ ] Two browser windows (customer + stylist) stay in sync
- [ ] Token numbers reset daily
- [ ] Cancel booking while Placed → shows cancelled state
- [ ] Cannot cancel after In Progress
- [ ] Quantity max 5 enforced on frontend and backend
- [ ] Page refresh preserves the order status page
- [ ] Admin stats update when new bookings come in
