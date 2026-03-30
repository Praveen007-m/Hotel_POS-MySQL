# Checkout Total Mismatch Fix - TODO

## Plan Summary
Fix frontend checkout total calculation in BookingList.jsx to match backend expectedTotal:
- Use EXACT ground truth: sum(lines.room.total) + sum(lines.addon.total) + sum(new add_ons price*qty) + sum(lines.kitchen.total)
- Remove price * nights fallback/multiplication causing 14000 instead of 5000
- Add FINAL DEBUG console.log before API call

## Steps
- [ ] Step 1: Read full BookingList.jsx to confirm current calc
- [ ] Step 2: Edit BookingList.jsx - replace total calc with ground truth structure
  - Rename backendAddOnsTotal → backendAddOns
  - Convert add_ons object → array for reduce like form.add_ons
  - Force bill.lines fetch, no fallback mult
  - Add console.log("FINAL DEBUG", {roomCharges, backendAddOns, newAddOns, kitchenTotal, finalTotal})
  - Set checkoutData.totalAmount = finalTotal
- [ ] Step 3: Verify no GST/discount/advance in total_amount
- [ ] Step 4: Test checkout produces 5000 for 4500 room + 500 addon case
- [ ] Step 5: attempt_completion

- [x] Step 1: Read full BookingList.jsx to confirm current calc
- [x] Step 2: Edit BookingList.jsx - replace total calc with ground truth structure (removes price*nights fallback, standardizes to lines.reduce(.total) + newAddOns price*qty sum)
  - Uses bill.lines always (empty arrays on error)
  - Renames backendAddOnsTotal → backendAddOns for consistency
  - Adds exact console.log("FINAL DEBUG", ...) before API
  - Updates setCheckoutData / handleAddonSelect / toggleAddon to use finalTotal = roomCharges + backendAddOns + newAddOns + kitchenTotal (NO GST/discount/advance)
- [ ] Step 3: Verify no GST/discount/advance in total_amount
- [ ] Step 4: Test checkout produces 5000 for 4500 room + 500 addon case
- [ ] Step 5: attempt_completion

- [x] Step 3: Verify total_amount uses ONLY finalTotal = roomCharges + backendAddOns + newAddOns + kitchenTotal (confirmed: checkoutData.totalAmount = finalTotal, no GST/discount/advance/double-counting/nights mult)

**Current: Step 4** (Testing: run checkout flow, check console FINAL DEBUG log shows correct breakdown summing to expectedTotal matching backend)
