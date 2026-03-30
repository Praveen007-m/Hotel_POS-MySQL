# Hotel POS - Billing Modal Fix TODO

## Plan Breakdown
- [x] Step 1: Create TODO.md ✅
- [x] Step 2: Edit Hotelbackend/routes/billings.js - Replace raw SQL in GET /:id with billingService.getBillingDetails() ✅
- [ ] Step 3: Test modal shows correct Room/Addon/Kitchen totals  
- [ ] Step 4: Verify API response has `lines` structure
- [ ] Step 5: attempt_completion

**Status:** Backend route fixed. `/api/billings/:id` now returns proper `{lines: {room:[], addon:[], kitchen:[]}}` structure via service.

**Next:** Test in app (restart server if running: `cd Hotelbackend && npm start`). Open billing modal → Room Charges/Addons/Kitchen should populate correctly.


