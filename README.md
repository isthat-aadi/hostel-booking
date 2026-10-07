# Hostel Room Booking - Backend Package

Tested on MariaDB 10.11 + Node 22. MySQL 8 uses the same SQL features, but I could not
test on real MySQL here, so run the three SQL files once and tell me if anything errors.

## 1. Setup (about 10 minutes)
1. Open MySQL Workbench and run these files IN ORDER:
   `01_schema.sql` -> `02_seed_structure.sql` -> `03_logic.sql`
   (they create the DB, 4 hostels / 32 floors / 640 rooms / 1920 beds, and all the rules)
2. In a terminal:
   ```
   cd backend
   npm install
   copy .env.example .env      (Mac/Linux: cp .env.example .env)  -> put your MySQL password in .env
   npm run seed                (creates demo logins)
   npm start                   (API on http://localhost:4000)
   ```
3. Demo logins (password in brackets):
   admin@jklu.test (admin123) | warden.boysa@jklu.test, warden.girlsa@jklu.test (warden123)
   students JKLU2026001..004 boys, JKLU2026013..016 girls (student123)
   Admission numbers JKLU2026005+ exist in the college list but are NOT registered: use them to
   demo the Register screen.
4. `04_demo_queries.sql` = ready queries for the viva.

## 2. Your ER diagram stays as submitted
All 9 entities and every attribute from the synopsis are in the database with the same names.
Because bunk beds, the window-bed fee and receipts cannot be stored in those 9 tables, I only ADDED:

| Added | Why |
|---|---|
| BED | each room's individual beds (upper/lower, near window) |
| BOOKING.BedID | which exact bed (BOOKING.RoomID stays; a composite foreign key proves the bed belongs to that room) |
| FEE_STRUCTURE, EXTRA_CHARGE | the official fee sheet and the Rs 10,000 window charge |
| PAYMENT, PAYMENT_ITEM | receipt with one line per fee, plus the student's payment reference |
| BOOKING_DOCUMENT | the uploaded fee receipt + allotment form and the warden's verdict on each |
| ADMISSION_RECORD | stand-in for the college's admission system |
| HOBBY, STUDENT_HOBBY | the standard ER-to-relational rule for the multi-valued attribute STUDENT.Hobbies |
| BOOKING_LOG | audit trail written by a trigger |
| extra columns in ROOMMATE_PREFERENCE | cleanliness, study style, AC, bed level, window wish |

Say it like this to Rohit sir: "The synopsis ER is the core design. The synopsis already lists fee
payment as future work, so we extended it with these tables." Tell him before the demo so it is not
a surprise.

ROOM.OccupiedSeats is kept correct by a trigger. ROOMMATE_MATCH is (student, room, score) exactly as
in the ER; the score is the average compatibility with the room's other approved students.

## 3. How a booking flows (and which database feature does the work)
1. Student picks a bed -> `sp_hold_bed` (transaction + row lock + 10-minute hold)
2. Fee receipt built -> `sp_create_receipt` (fees + window Rs 10,000 + optional transport) = the amount the student must pay
3. Student pays at the college / online, then uploads BOTH documents: hostel fee payment receipt + hostel allotment form (PDF/JPG/PNG, max 5 MB), types the payment reference and amount
4. `sp_submit_booking` refuses to move the booking to the warden unless both documents are uploaded and the reference is filled
5. Warden opens each document in the warden interface, marks it Verified or Rejected (reason required). A rejected document goes back to the student for re-upload; a verified one is locked
6. `sp_warden_approve` refuses unless BOTH documents are Verified; on approval the payment becomes Paid
7. Warden can also `sp_warden_reject` / `sp_warden_reassign` (price difference becomes an ADJUSTMENT line)
8. Double booking is impossible: two UNIQUE keys on generated columns (one live booking per bed, one per student)
9. Boys cannot book girls hostels: trigger `trg_booking_gender`

Notes: the app does not take money. The student pays outside (college counter / bank / UPI) and the warden checks the proof by eye. The bed is held for 2 hours (change HOLD_MINUTES in .env); admissions come from CSV/import until your college IT
allows a real connection; when the warden reassigns to a pricier bed the extra amount shows on the
receipt but collecting it is not modelled.

## 4. API map (what each frontend screen calls)
Send `Authorization: Bearer <token>` on everything except login/register.

| Screen | Call |
|---|---|
| Register | POST /api/auth/register |
| Login (all roles) | POST /api/auth/login  {role, identifier, password} |
| Student home | GET /api/student/me , GET /api/student/booking |
| Preferences | GET/PUT /api/student/preferences , GET /api/student/hobbies |
| Roommate suggestions | GET /api/student/roommate-suggestions |
| Room picker | GET /api/student/hostels -> /hostels/:id/floors -> /floors/:id/rooms -> /rooms/:id/beds |
| Hold bed | POST /api/student/bookings {bed_id} |
| Fee receipt | POST /api/student/bookings/:id/receipt {transport: NONE/SEM/YEAR} |
| Upload documents | POST /api/student/bookings/:id/documents/payment-receipt  and  /documents/allotment-form  (multipart, field "file") |
| See / open my documents | GET /api/student/bookings/:id/documents , GET /api/student/documents/:docId/file |
| Submit for approval | POST /api/student/bookings/:id/submit {payment_mode, payment_reference, amount_paid} |
| Cancel | POST /api/student/bookings/:id/cancel |
| Warden | GET /api/warden/bookings?status=Pending , GET /bookings/:id (includes documents + student's payment claim) , GET /documents/:docId/file , POST /documents/:docId/verify {status: Verified/Rejected, remarks} , POST /bookings/:id/approve, /reject, /reassign , GET /free-beds , GET /occupancy , PUT /beds/:id/block |
| Admin | GET /api/admin/stats , wardens (GET/POST/DELETE), hostels, floors, rooms, POST /admissions/import , GET/PUT /fees , PUT /extra-charges/:code |

Errors come back as `{ "error": "message" }` with a normal HTTP status: show `error` in a toast.

## 5. Who to use for what
| Tool | Use it for | Don't use it for |
|---|---|---|
| Claude | database, SQL, backend logic, finding bugs, preparing viva answers | pixel-level UI |
| Gemini Pro | fixing/refactoring the React code Figma gives you, UI polish ideas, a second opinion, explaining a concept differently | redesigning the database |
| Figma AI | the screens, using FIGMA_PROMPTS.md | any logic |

Rule: the SQL files are the single source of truth. Paste `01_schema.sql` (and the API map above)
into Gemini whenever it works on the frontend.

## 6. Order of work
1. Run the 3 SQL files, read `01_schema.sql` once, run `04_demo_queries.sql`, redraw the extended ER
2. Start the backend, test in the browser/Postman using the API map
3. Nikita builds screens with FIGMA_PROMPTS.md (Prompts 1-5). Real files are sent as multipart form data, so tell Gemini that when it wires the upload screen
4. Replace mock data in the frontend with calls from the API map
5. Rehearse: register -> preferences -> pick a window bed -> upload receipt + form -> warden verifies both -> approves -> roommates shown
