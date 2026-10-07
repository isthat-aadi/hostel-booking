# Antigravity: how to operate it + the 8 tasks to give it

Antigravity is Google's AI coding app (a code editor with an AI agent built in). It updates often, so a menu name may differ slightly from my notes. The idea stays the same.

Think of it like a contractor. You give ONE small job, read the plan, let it work, then inspect the result before the next job. You never say "build the whole thing".

## One-time setup
1. Run the installer `Antigravity-x64.exe` (keep it OUTSIDE the project folder, for example in Downloads).
2. Sign in with the Google account that has your Gemini Pro.
3. **File > Open Folder** and choose `C:\Users\LENOVO\Desktop\hostel-booking` (the ROOT folder, so it can see both `backend` and `frontend`).
4. Make a save point so you can undo anything. Open the terminal inside Antigravity (Terminal > New Terminal) and run:
   ```
   git init
   git add .
   git commit -m "clean start"
   ```
   If Git says "not recognized", install Git for Windows first (git-scm.com), then reopen.
5. Open the agent panel (the chat/agent side panel). Pick the strongest Gemini model offered in the model dropdown. Set the mode to **Planning** (it shows a plan first) instead of Fast.
6. In the agent settings, set terminal commands to **ask for approval / request review** instead of auto-run. Read each command before you click approve. Only approve `npm install`, `npm run dev`, or `npm start` style commands. Say no to anything that deletes things or touches MySQL.

## First message to the agent (paste exactly)
```
Read GEMINI_HANDOFF.md and START_HERE.md in this folder fully. Do not change any file yet. Reply in 8 lines or fewer: what is done, what is left, and which task from ANTIGRAVITY_TASKS.md you will do first.
```
(Both files are already in the project folder, so the agent can read them itself.)

## The loop for every task
1. Make a save point: `git add . && git commit -m "before task N"`
2. Paste the task prompt below.
3. Read the plan it shows. If it wants to change `backend` or any `.sql` file, reply: "No, do not touch backend or SQL. Only change files in frontend."
4. Approve. Let it work.
5. Look at the changes (it shows diffs for every file). Skim them.
6. Run the app yourself: backend window + frontend window (see START_HERE.md) and click through the screen.
7. It works: `git add . && git commit -m "task N done"`
   It is broken: paste the exact error to the agent, or undo everything with `git checkout .`

Rules for yourself: one task at a time, test before the next one, never approve a command you do not understand.

## When something breaks (paste this)
```
This broke. Here is the exact error or what I see: <paste text or describe>. Find the cause, fix it with the smallest change, only in the frontend folder, and tell me what you changed.
```

---

# THE 8 TASKS (paste the prompt text between the lines)

Every task starts with this shared rule line, so include it each time:
> Rules: keep the existing design exactly as is. Replace hardcoded mock data with real API calls using the helpers in frontend/src/api.js. Add loading and error states and show the backend "error" text in the existing error toast. Do not change backend or .sql files. When done, list the files you changed and how I can test.

## Task 1: Register + login polish
```
(Rules line above.)
In the Login component of frontend/src/App.tsx, add a "New student? Register here" mode for students. Fields: admission number, email, phone, password, year/semester. Call POST /auth/register with {admission_no, email, phone, password, year_semester}. Do NOT ask for hobbies here (hobbies are chosen later on the Preferences screen). On success show a green message and switch back to sign in with the admission number prefilled. Show backend errors such as "Admission number not found in college records".
```
Test: register `JKLU2026005` with any email and phone, then log in with it.

## Task 2: Home + Preferences
```
(Rules line above.)
Part 1, Home component: show the real student name from GET /student/me. Fill the 4 stat cards and the progress tracker from GET /student/booking (if it returns null: Hostel/Room "Not chosen", Amount Due 0, status "Not started"). Student already has preferences if GET /student/preferences returns preferences, so move the tracker step accordingly.
Part 2, Preferences component: load hobby chips from GET /student/hobbies. Prefill the form from GET /student/preferences. On Save call PUT /student/preferences. Map form fields to API fields: sleep_schedule, cleanliness, study_style (these three are required), preferred_course, preferred_floor_type, preferred_room_type, wants_ac, preferred_bed_level, wants_window_bed (true/false), notes, hobbies (array of hobby_id numbers). After a successful save go to the Choose Room screen.
```
Test: log in as `JKLU2026005`, fill preferences, refresh the page, open preferences again: values must still be there.

## Task 3: Choose Room (floors, rooms, beds, hold)
```
(Rules line above.)
HostelStep already loads GET /student/hostels. Now wire the rest: FloorStep from GET /student/hostels/:id/floors, RoomStep from GET /student/floors/:id/rooms, BedStep from GET /student/rooms/:id/beds. Money fields arrive as strings like "96750.00": convert with Number(). near_window and is_ac arrive as 0/1. bed_status values: Available, Held, Pending, Booked, Blocked (only Available beds can be selected). Use price_total, window_charge and base_semester_fee for the price sheet. The "Hold this bed" button calls POST /student/bookings with {bed_id}; keep the returned booking_id and hold_minutes in app state (and localStorage), then go to the Fee Receipt screen. If the server returns an error (for example "you already have a live booking"), show it in the error toast. When the Choose Room screen opens, first call GET /student/booking: if a Held/Pending/Approved booking already exists, send the student to the matching screen instead of letting them pick again.
```
Test: log in as `JKLU2026005`, pick Boys Hostel A, floor 1, room 101, a window bed (price must be 10,000 higher than the non-window bed of the same level). Hold it. Trying to hold a second bed must show an error.

## Task 4: Fee Receipt
```
(Rules line above.)
FeeReceipt component: on open call POST /student/bookings/:id/receipt with {transport: "NONE"} using the booking_id from state. Render the returned items (item_type, description, amount) and total_amount. The Transport radio group (None / Per semester / Yearly) calls the same endpoint again with transport "NONE", "SEM" or "YEAR" and refreshes the lines (the server rebuilds the receipt each time). The countdown uses hold_expires_at from GET /student/booking (or hold_minutes from the hold response); when it reaches zero show the "Hold expired, pick again" state with a button back to Choose Room. "Next" goes to the Upload Documents screen.
```
Test: receipt total for a Quad AC lower window bed must be 96750; picking Per semester transport adds 26250.

## Task 5: Upload Documents + Submit
```
(Rules line above.)
UploadDocuments component: the two upload cards send the chosen file with FormData (field name "file") to POST /student/bookings/:id/documents/payment-receipt and POST /student/bookings/:id/documents/allotment-form (use api.js apiRequest with isFormData = true). Accept only PDF, JPG, PNG up to 5 MB and show the file name and a status chip once uploaded. The Submit button stays disabled until both documents are uploaded and the payment reference number is filled. Submit calls POST /student/bookings/:id/submit with {payment_mode, payment_reference, amount_paid}; payment_mode must be one of Online, UPI, Card, Cash. On success go to the Submitted screen and show the real receipt_no from GET /student/booking.
```
Test: upload any small PDF and PNG, fill UTR `UTR123456`, amount = receipt total, submit.

## Task 6: Booking Status
```
(Rules line above.)
BookingStatus component: load GET /student/booking and show real data: status (Held, Pending, Approved, Rejected, Cancelled, Expired), hostel, floor, room, bed, level, window yes/no, the 5-step tracker, and the documents list with chips Pending/Verified/Rejected plus the warden remark. For a Rejected document show a Re-upload button using the same upload endpoints (Verified documents cannot be replaced: hide the button). Cancel button calls POST /student/bookings/:id/cancel (only while Held or Pending). When status is Approved show the roommates list with match_score in the existing ring. For Expired or Rejected show a button back to Choose Room.
```
Test: after Task 5, status must be Pending with 2 documents on "Pending".

## Task 7: Warden screens
```
(Rules line above.)
Wire WardenDashboard and WardenBookingDetail (log in as warden.boysa@jklu.test / warden123). Dashboard: list from GET /warden/bookings?status=Pending (use docs_verified and docs_uploaded for the "Docs 1/2 verified" chip); occupancy bars from GET /warden/occupancy; the block-a-bed tool uses PUT /warden/beds/:id/block with {blocked: true or false}. Detail screen: GET /warden/bookings/:id gives booking, preferences, hobbies, receipt_items, student_payment_claim and documents. Show the system total next to the student's paid_amount with a match/mismatch indicator. Document preview: use fetchFileBlobUrl(`/warden/documents/${doc_id}/file`) from api.js, show PDFs in an iframe and images in an img. Verify and Reject call POST /warden/documents/:docId/verify with {status: "Verified" or "Rejected", remarks} (remarks required when rejecting). Approve calls POST /warden/bookings/:id/approve and is disabled until both documents are Verified. Reject booking calls POST /warden/bookings/:id/reject with {remarks}. Reassign loads GET /warden/free-beds and calls POST /warden/bookings/:id/reassign with {new_bed_id, remarks}.
```
Test: the booking from Task 5 appears in the warden list. Approve is disabled until you verify both documents.

## Task 8: Admin screens
```
(Rules line above.)
Wire AdminView (log in as admin@jklu.test / admin123). Overview: GET /admin/stats. Wardens: GET /admin/wardens, POST /admin/wardens {hostel_id, name, email, phone, password}, DELETE /admin/wardens/:id (confirm dialog first). Structure: GET/POST /admin/hostels, POST /admin/floors, POST /admin/rooms {floor_id, room_number, room_type: Double or Quad, is_ac}. Admissions: parse the chosen CSV in the browser (columns admission_no, name, email, phone, course, gender) and POST /admin/admissions/import {records: [...]}. Fees: GET /admin/fees, PUT /admin/fees/:id {hostel_fee, utility_charges, mess_advance, security_deposit}, and PUT /admin/extra-charges/:code {amount, is_active}.
```
Test: stats numbers change after a booking is approved; the Fees page shows 6 fee rows and the window charge 10000.

---
## After all 8 tasks
Run the full demo once from start to finish: register `JKLU2026005` > preferences > pick a window bed > receipt > upload both files > submit > log in as the warden > verify both > approve > log in as the student again and see Approved. Then tell Claude the exact point where anything failed and paste the error text.
