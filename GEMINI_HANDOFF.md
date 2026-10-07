# HANDOFF: continue my DBMS project with me (read everything before answering)

You are taking over as my project partner. Another AI (Claude) designed and built the database and backend with me. You will help me with the FRONTEND, the integration, testing, fixes and my viva preparation. This message is the full context. I should not have to re-explain anything.

---

## 1. About me and how to talk to me
- I am Aadi, B.Tech CSE student (2nd year, Semester 3) at JK Lakshmipat University (JKLU), Jaipur. My teammate is Nikita Bhatia.
- I know SQL from my DBMS course. I am a BEGINNER with Node.js, React and APIs. I know basic HTML, CSS and JavaScript.
- Style: blunt and direct, no motivational fluff. Start explanations with a short real-life analogy, then give practice steps. Give exact commands and exact clicks. I use Windows (PowerShell / Command Prompt).
- Always double-check numbers (fees, counts, prices) before you state them.
- If something I ask will break the database or the API, tell me bluntly instead of just doing it.
- The app is English only.

## 2. The project
**Hostel Room Booking & Roommate Selection System** for my DBMS course. The teacher (Rohit Sir) said any tech stack is allowed. He will check the BACKEND/DATABASE first and check everything. Demo is on my laptop first, online hosting only after he approves.

Roles: **Student (new admission), Warden, Admin.**
Goal: a new student registers, fills roommate preferences, picks an exact bed through a visual picker, pays the hostel fee outside the app, uploads the proofs, and the warden manually verifies the documents and approves.

### Final decisions (do not change these)
- 4 hostels: 2 boys (Boys Hostel A, B), 2 girls (Girls Hostel A, B). 8 floors each, 20 rooms per floor. 640 rooms, 1920 beds.
- Only 2 room types: **Double** (2 single beds) and **Quad** (2 bunk beds = 4 beds, upper/lower, bunk nearest the window = beds 1 and 2). AC and Non-AC.
- A window-side bed costs **Rs 10,000 extra**, shown as a separate line on the receipt.
- Boys see only boys hostels, girls only girls hostels (enforced by a database trigger).
- A student can book ONLY after uploading BOTH: (1) the hostel fee payment receipt, (2) the hostel allotment form, and typing the payment reference number. The warden opens each document in the warden interface, marks it Verified or Rejected (reason required), and can approve only when both are Verified.
- Roommate preferences come BEFORE booking.
- My submitted ER diagram (9 entities) is FINAL. We only ADDED extension tables, nothing removed. I will tell Rohit Sir: "The synopsis ER is the core; we extended it with Bed, Fee, Payment and Document tables."
- Payment is NOT processed by the app. The student pays at the college/online, uploads proof, warden checks by eye.
- Admissions come from a table filled by CSV import (stand-in for the college's official admission system; a real connection needs college IT permission and is a later step).

## 3. Status RIGHT NOW
DONE and tested:
- Database (19 tables + 4 views, triggers, stored procedures, functions). I ran the 3 SQL files in MySQL 8.0 on my Windows laptop with no errors.
- Backend API (Node.js + Express) in `backend\`. Full flow was tested end to end through the API by Claude: login, preferences, hostel>floor>room>bed, hold bed, receipt, document upload, submit, warden verify, approve, reassign, reject, expiry, cancel. It runs on my laptop (`http://localhost:4000/api/health` returns `{"ok":true}`).
- Frontend screens: designed with Figma Make and exported to `frontend\` (React 19 + Vite + Tailwind v4, plain JS fetch, no router library). ALL screens exist visually: Login, Home, Preferences, Choose Room (hostel, floor, room, bed), Fee Receipt, Upload Documents, Submitted, Booking Status, Warden Dashboard, Warden Booking Detail, Admin (Overview, Wardens, Structure, Admissions, Fees).

NOT DONE (this is your job):
- The frontend is a PROTOTYPE. Only ONE thing is wired to the real backend: Login (`POST /auth/login`) and the hostel list on the Choose Room first step (`GET /student/hostels`). EVERYTHING else still uses hardcoded mock data inside `frontend/src/App.tsx`.
- No Register screen is wired yet (backend `POST /auth/register` exists).
- I have not yet personally tested document upload and warden verification on my own machine.
- Demo rehearsal for Rohit Sir.

Frontend file facts:
- `frontend/src/App.tsx` is ONE file (~2,870 lines) with all components. `frontend/src/api.js` is the helper (`apiRequest(endpoint, method, body, isFormData)`, `fetchFileBlobUrl(endpoint)`, token helpers using localStorage, base URL `http://localhost:4000/api`).
- Approximate component start lines in App.tsx: Login 428, Home 552, Preferences 631, HostelStep 933, FloorStep 1011, RoomStep 1060, BedStep 1206, ChooseRoom 1333, FeeReceipt 1397, UploadDocuments 1587, SubmittedConfirmation 1690, BookingStatus 1766, WardenDashboard 1991, DocumentReviewCard 2176, WardenBookingDetail 2245, Admin: AdminOverview 2464, WardensAdmin 2523, StructureAdmin 2585, AdmissionsAdmin 2658, FeesAdmin 2712, AdminView 2754, App 2784.
- Screens are switched by a `screen` state in `App()` (no URL routes). Dev server: run `npm run dev` inside `frontend\`, it opens on `http://localhost:8443` (fixed port).
- The mock data field names already match the API field names in section 7. Replace mock data with API calls, do not redesign.

My folder: `hostel-booking\` containing the 4 SQL files, `START_HERE.md`, `ANTIGRAVITY_TASKS.md`, `FIGMA_PROMPTS.md`, `README.md`, `backend\` (Node project) and `frontend\` (React project).

## 4. Tech stack
- DB: MySQL 8.0. Backend: Node 22 + Express + mysql2 + bcryptjs + jsonwebtoken + multer + cors + dotenv. Port 4000, CORS enabled.
- Frontend (already exported from Figma Make into `frontend\`): React 19 + Vite + Tailwind v4. Run it with `npm run dev` inside `frontend\` and open `http://localhost:8443`.
- Start backend: in `backend\` run `npm start`. Re-seed demo users: `npm run seed`. Rebuild database from scratch: run the 3 SQL files again in order, in the MySQL 8.0 Command Line Client: `source C:/Users/LENOVO/Desktop/hostel-booking/01_schema.sql` (then 02, 03).

Demo logins (after `npm run seed`):
- Admin: `admin@jklu.test` / `admin123`
- Wardens: `warden.boysa@jklu.test`, `warden.boysb@jklu.test`, `warden.girlsa@jklu.test`, `warden.girlsb@jklu.test` / `warden123`
- Students (password `student123`, log in with Admission No): boys `JKLU2026001` to `JKLU2026004`, girls `JKLU2026013` to `JKLU2026016`.
- Admission numbers `JKLU2026005` to `JKLU2026012` (boys) and `JKLU2026017` to `JKLU2026024` (girls) exist in the college list but are NOT registered: use them to demo registration.

## 5. Database summary (source of truth = `01_schema.sql` and `03_logic.sql`, I will attach them)
Original 9 ER entities (names kept): admin, hostel, floor, room, warden, student, roommate_preference, roommate_match, booking.
Added: bed, fee_structure, extra_charge, payment, payment_item, booking_document, admission_record, hobby, student_hobby, booking_log.
Views: v_bed_availability, v_room_occupancy, v_receipt, v_booking_details.

Key rules already enforced INSIDE the database (do not re-implement in the frontend, just show the error message):
- One live booking per bed and one per student (unique keys on generated columns). Double booking is impossible.
- Bed is held for `HOLD_MINUTES` (default 120) after the student picks it, then expires.
- `sp_submit_booking` refuses unless both documents are uploaded and a payment reference is given.
- `sp_warden_approve` refuses unless both documents are Verified.
- Trigger blocks boys booking girls hostels. Trigger keeps `room.occupied_seats` correct and writes `booking_log`.
- Match score (0 to 100) by function `fn_match_score`: course 30, sleep schedule 25, hobbies 20, cleanliness 15, study style 10.

Official Semester I fee sheet (in `fee_structure`; total = hostel fee + utility + mess advance 31,250 + security deposit 5,000):
| Room | AC/Non-AC | Bed | Total |
|---|---|---|---|
| Double | AC | Standard | 100250 |
| Double | Non-AC | Standard | 83250 |
| Quad | AC | Lower | 86750 |
| Quad | AC | Upper | 84250 |
| Quad | Non-AC | Lower | 76250 |
| Quad | Non-AC | Upper | 74750 |
Window bed adds 10000. Optional transport: 26250 per semester or 52500 yearly.

## 6. The booking flow (this is the user journey the frontend must follow)
1. Register (only if admission number exists in the college list) then Login.
2. Student Home with 5-step tracker: Profile, Roommate Preferences, Choose Room, Documents, Warden Approval.
3. Save roommate preferences (hobbies chips etc.).
4. Choose room: Hostel > Floor > Room > Bed (animated visual picker; selected item turns darker; bunk beds drawn as upper/lower; window beds marked "+Rs 10,000").
5. Hold the bed (timer starts).
6. Fee receipt screen (line items + optional transport) = the amount to pay.
7. Upload payment receipt + allotment form, enter payment mode, reference number, amount paid, press Submit (disabled until both files and reference are present).
8. Booking status screen: Pending / Approved / Rejected / Expired; document chips Pending / Verified / Rejected with warden remark and Re-upload button (not allowed for Verified documents). When Approved: show roommates with match-score.
9. Warden: list of pending bookings for HIS hostel, detail page with student preferences, system receipt vs student's claim (amount match indicator), document preview, Verify/Reject per document, Approve (disabled until both Verified), Reject booking, Reassign to another free bed (price difference shown), occupancy per floor, block a bed.
10. Admin: stats, add/remove wardens, add hostels/floors/rooms, import admissions, edit fees and extra charges.

## 7. API contract (base URL `http://localhost:4000/api`)
General rules:
- Send `Authorization: Bearer <token>` on everything except login and register. Token lasts 8 hours. Roles: student, warden, admin (wrong role gives 403).
- Errors always look like `{ "error": "readable message" }` with HTTP 400/401/403/404/409. Show `error` in a toast.
- DECIMAL money fields (amount, total_amount, price_total, base_semester_fee, window_charge) arrive as STRINGS like `"96750.00"`: convert with Number(). Booleans (is_ac, near_window, wants_window_bed) arrive as 0/1. Dates arrive as strings `YYYY-MM-DD HH:MM:SS`.
- Document files are protected: an `<img src>` or `<iframe src>` cannot send the Authorization header. Fetch the file with the header, turn it into a blob, then `URL.createObjectURL(blob)` for preview.

### Auth
- `POST /auth/register` body `{admission_no, email, phone, password (min 6), year_semester?, hobbies:[hobby_id,...]}` returns 201 `{student_id, message}`. Name, course, gender come from the college list.
- `POST /auth/login` body `{role:'student'|'warden'|'admin', identifier, password}` (identifier = admission_no for students, email for warden/admin) returns `{token, user:{id, role, name, gender? (student), hostel_id? (warden)}}`.

### Student
- `GET /student/me` returns `{student_id, admission_no, name, email, phone, course, year_semester, gender}`
- `GET /student/hobbies` returns `[{hobby_id, hobby_name}]`
- `GET /student/preferences` returns `{preferences: {...}|null, hobbies:[{hobby_id,hobby_name}]}`
- `PUT /student/preferences` body: `sleep_schedule` ('Early Bird'|'Night Owl'|'Flexible') REQUIRED, `cleanliness` ('Very Tidy'|'Average'|'Relaxed') REQUIRED, `study_style` ('Quiet'|'Group'|'Flexible') REQUIRED, optional `preferred_course`, `preferred_floor_type` ('Regular'|'Quiet'|'Any'), `preferred_room_type` ('Double'|'Quad'|'Any'), `wants_ac` ('AC'|'Non-AC'|'Any'), `preferred_bed_level` ('Lower'|'Upper'|'Any'), `wants_window_bed` (true/false), `notes`, `hobbies:[ids]`.
- `GET /student/roommate-suggestions` returns `[{student_id, name, course, match_score}]`
- Room picker (only hostels of the student's gender are returned):
  - `GET /student/hostels` returns `[{hostel_id, hostel_name, gender, total_floors, total_beds, free_beds}]`
  - `GET /student/hostels/:id/floors` returns `[{floor_id, floor_number, floor_type ('Regular'|'Quiet'), total_beds, free_beds}]`
  - `GET /student/floors/:id/rooms` returns `[{room_id, room_number, room_type ('Double'|'Quad'), is_ac, capacity, status, occupied_seats, in_progress_seats, free_seats}]`
  - `GET /student/rooms/:id/beds` returns `[{bed_id, bed_number, bed_level ('Lower'|'Upper'|'Standard'), near_window, bed_status ('Available'|'Held'|'Pending'|'Booked'|'Blocked'), base_semester_fee, window_charge, price_total}]`
- `POST /student/bookings` body `{bed_id}` returns 201 `{booking_id, hold_minutes}` (bed is now held)
- `POST /student/bookings/:id/receipt` body `{transport:'NONE'|'SEM'|'YEAR'}` returns 201 `{payment_id, receipt_no, booking_id, payment_status, payment_mode, paid_at, total_amount, items:[{item_type, description, amount}]}`. item_type is one of HOSTEL_FEE, UTILITY, MESS_ADVANCE, SECURITY_DEPOSIT, WINDOW_PREFERENCE, TRANSPORT, ADJUSTMENT.
- `POST /student/bookings/:id/documents/payment-receipt` and `/documents/allotment-form`: multipart/form-data, field name `file`, PDF/JPG/PNG, max 5 MB. Returns 201 `{message, doc_type}`. Re-upload replaces the file, allowed unless it is already Verified.
- `GET /student/bookings/:id/documents` returns `[{doc_id, doc_type ('PAYMENT_RECEIPT'|'ALLOTMENT_FORM'), file_name, uploaded_at, verification_status ('Pending'|'Verified'|'Rejected'), remarks}]`
- `GET /student/documents/:docId/file` returns the file (needs Authorization, see blob note)
- `POST /student/bookings/:id/submit` body `{payment_mode:'Online'|'UPI'|'Card'|'Cash', payment_reference, amount_paid}` returns `{message}`
- `POST /student/bookings/:id/cancel` (only while Held or Pending)
- `GET /student/booking` returns `null` or `{booking, receipt, documents, roommates}`. `booking` fields: booking_id, status ('Held'|'Pending'|'Approved'|'Rejected'|'Cancelled'|'Expired'), booking_date, hold_expires_at, reviewed_at, remarks, student_id, student_name, course, year_semester, phone, hostel_id, hostel_name, floor_number, room_id, room_number, room_type, is_ac, bed_id, bed_number, bed_level, near_window, original_bed_id, payment_id, receipt_no, payment_status, total_amount, docs_uploaded, docs_verified. `roommates` (only when Approved): `[{student_id, name, course, bed_number, bed_level, match_score}]`.

### Warden (sees only his own hostel)
- `GET /warden/bookings?status=Pending|Approved|Rejected|all` returns array of the booking fields above
- `GET /warden/bookings/:id` returns `{booking, preferences, hobbies:[names], receipt_items:[...], student_payment_claim:{payment_mode, payment_reference, paid_amount}, documents:[...]}`
- `GET /warden/documents/:docId/file` (blob note applies)
- `POST /warden/documents/:docId/verify` body `{status:'Verified'|'Rejected', remarks}` (remarks required when Rejected)
- `POST /warden/bookings/:id/approve` (fails unless both documents are Verified)
- `POST /warden/bookings/:id/reject` body `{remarks}`
- `POST /warden/bookings/:id/reassign` body `{new_bed_id, remarks}`
- `GET /warden/free-beds` returns `[{bed_id, floor_number, room_number, room_type, is_ac, bed_number, bed_level, near_window, price_total}]`
- `GET /warden/occupancy` returns per floor `{floor_number, total_beds, booked, in_progress, available, blocked}`
- `PUT /warden/beds/:id/block` body `{blocked:true|false}`

### Admin
- `GET /admin/stats` returns `{students_registered, admissions_total, pending_bookings, approved_bookings, total_beds, money_collected, per_hostel:[{hostel_name,total_beds,booked,available}]}`
- Wardens: `GET /admin/wardens`, `POST /admin/wardens` body `{hostel_id,name,email,phone,password}`, `DELETE /admin/wardens/:id`
- Structure: `GET/POST /admin/hostels` (`{hostel_name, gender:'Male'|'Female', total_floors}`), `POST /admin/floors` (`{hostel_id, floor_number, floor_type}`), `POST /admin/rooms` (`{floor_id, room_number, room_type:'Double'|'Quad', is_ac}`, beds are created automatically)
- `POST /admin/admissions/import` body `{records:[{admission_no,name,email,phone,course,gender,admission_status?}]}`
- `GET /admin/fees` returns `{fees:[...], extras:[...]}`, `PUT /admin/fees/:id` body `{hostel_fee, utility_charges, mess_advance, security_deposit}`, `PUT /admin/extra-charges/:code` body `{amount, is_active}`

## 8. Your work plan (do ONE task at a time, I test after each)
Follow `ANTIGRAVITY_TASKS.md` task order: 1 Register + Login polish, 2 Preferences, 3 Choose Room (floors, rooms, beds, hold), 4 Fee Receipt, 5 Upload Documents + Submit, 6 Booking Status, 7 Warden dashboard + detail (document preview, verify, approve, reject, reassign), 8 Admin screens.
Rules for every task:
- Keep the design exactly as it is. Only replace mock data with real API calls and add loading and error states (show the backend `error` text in the existing error toast).
- Keep new logic readable. Feel free to split App.tsx into several files under `frontend/src/` as you go, but only if it does not change how the app looks or behaves.
- Use the shared helpers in `src/api.js`. For file previews use `fetchFileBlobUrl`. For uploads send FormData with field name `file` and `isFormData = true`.
- Hold timer: use `hold_minutes` from `POST /student/bookings` or `hold_expires_at` from `GET /student/booking`.
- Do NOT change `backend\` or any `.sql` file. If the frontend truly needs a new field or endpoint, stop and tell me exactly what you need, and I will take that request to Claude (the backend author).
- After finishing a task, tell me: what files you changed, how to test it, and the exact login to use.

## 9. Also help me with
- Testing document upload and the warden flow (I will use Thunder Client or Postman).
- Preparing the demo for Rohit Sir: backend first (ER diagram, SQL, stored procedures, triggers, constraints, transactions, then the API flow), then the screens. The ready viva queries are in `04_demo_queries.sql`.

## 10. First thing to do now
Read this whole file and `START_HERE.md`. Reply in at most 8 lines: confirm you understood, list what is done and what is left, and say which task from `ANTIGRAVITY_TASKS.md` you will do first. Then wait for me to say go. Do not change any file until I say go.
