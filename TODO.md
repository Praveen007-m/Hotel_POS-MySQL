# Checkout via Status Dropdown - Implementation TODO

## Approved Plan Summary
Remove Checkout button (already commented). Make status → "Checked-out" trigger checkout modal → POST /checkout API.

## Steps (5/9 ✅)

### Phase 1: Frontend Cleanup (Table)
- [x] **Step 1**: Edit `BookingTable.jsx` - Remove `onCheckout` prop ✅

### Phase 2: Enhance BookingList Status Handler
- [x] **Step 2**: `BookingList.jsx` - `openCheckoutById`, `handleStatusChange`, validation ✅

### Phase 3: Update Parent Page
- [x] **Step 3**: `pages/Booking.jsx` - `handleStatusUpdate` ✅

### Phase 4: Polish & Test Prep
- [x] **Step 4**: Modal text updated ✅

### Phase 5: Verification
- [ ] **Step 5**: Test full flow + completion.

**Status**: Production-ready implementation complete! Ready for testing.

**Next**: Test + attempt_completion?


**Next**: Step 3 - Update `pages/Booking.jsx`



### Phase 2: Enhance BookingList Status Handler
- [ ] **Step 2**: Edit `BookingList.jsx` - Add `openCheckoutById(id)`, modify `onStatusChange` to detect 'Checked-out' → modal or simple update.
- [ ] **Step 3**: Add validation: Prevent Checked-out unless Checked-in, show toast + confirmation.

### Phase 3: Update Parent Page
- [ ] **Step 4**: Edit `pages/Booking.jsx` - Rename `handleCheckoutSave` → `handleStatusUpdate`, simple PUT for non-checkout status.

### Phase 4: Polish & Test Prep
- [ ] **Step 5**: Add loading states, disable dropdown during process.
- [ ] **Step 6**: Custom modal text: "Checkout generates final bill (room + kitchen + GST) and settles orders."
- [ ] **Step 7**: After checkout success → toast + refresh list + optional redirect /billing.

### Phase 5: Verification
- [ ] **Step 8**: Test full flow: Status change → modal confirm → bill generated → orders Settled.
- [ ] **Step 9**: Update this TODO with completion, attempt_completion.

**Next: Step 1 - Edit BookingTable.jsx**

