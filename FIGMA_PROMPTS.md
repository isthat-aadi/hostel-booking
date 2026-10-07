# Figma AI prompts (English only) - paste ONE at a time, review, then the next

Attach your AARAMBH screenshot to Prompt 1. For every later prompt start with:
"Continue the same app and keep exactly the same design system."

Design system (taken from your screenshot, already inside Prompt 1): light blue-grey background,
white cards with ~24px radius and soft shadow, navy + orange brand colors, orange-to-navy gradient
pill button, Inter font, small uppercase letter-spaced labels above bold headings, tinted icon
squares on stat cards, thin progress bars, sun icon for light/dark, hamburger menu.

---------------------------------------------------------------------------------------------------
## PROMPT 1 - Login, Student Home, Roommate Preferences
---------------------------------------------------------------------------------------------------
Build a mobile-first, responsive web app prototype called "JKLU Hostel Booking".
Use the attached screenshot as the exact visual reference: light blue-grey page background, white
rounded cards (about 24px radius) with soft shadows, navy and orange brand colors, an
orange-to-navy gradient pill button for primary actions, Inter font, small uppercase
letter-spaced labels above big bold headings, stat cards with a tinted icon square, a thin
progress bar, a sun icon for light/dark toggle, and a hamburger menu in the top bar.
This is a prototype only: hardcoded mock data, no backend. English only.

Build ONLY these 3 screens now:
1. Login: tabs for Student, Warden, Admin. Student logs in with Admission No + password. Warden
   and Admin log in with email + password.
2. Student Home: eyebrow "STUDENT VIEW", heading "Hello, Rohan". A 5-step tracker: Profile,
   Roommate Preferences, Choose Room, Payment, Warden Approval (step 1 done, step 2 current).
   Then 4 stat cards: Hostel (Not chosen), Room (Not chosen), Amount Due (Rs 0), Booking Status
   (Not started). Then a gradient button "Continue: Roommate Preferences".
3. Roommate Preferences form: preferred course, sleep schedule (Early Bird / Night Owl /
   Flexible), cleanliness (Very Tidy / Average / Relaxed), study style (Quiet / Group / Flexible),
   hobbies as selectable chips (Cricket, Football, Basketball, Gaming, Music, Reading, Coding,
   Movies, Dancing, Gym, Art, Travelling), preferred floor type (Regular / Quiet / Any), room type
   (Double / Quad / Any), AC or Non-AC or Any, bed level (Lower / Upper / Any), and a toggle
   "I want a window-side bed (extra Rs 10,000)". A Save button at the bottom.
Do not build anything else yet.

---------------------------------------------------------------------------------------------------
## PROMPT 2 - The room picker (the showpiece screen)
---------------------------------------------------------------------------------------------------
Continue the same app and keep exactly the same design system.
Build the "Choose Room" flow as 4 connected steps with a breadcrumb at the top
(Hostel > Floor > Room > Bed). Mock data below uses the same shape as our real API.

STEP 1 - Hostel: the student is male, so show 2 cards: "Boys Hostel A" and "Boys Hostel B". Each
card shows a simple illustrated building made of stacked floor bars, total floors (8), and
"480 beds free". Tapping a card makes it turn darker (navy) with a smooth transition, then
slides to Step 2.

STEP 2 - Floor: draw the hostel as a vertical building cross-section with 8 stacked floor slabs,
floor 8 at the top, each slab labelled "Floor 1..8", showing a free-beds count and a small
"Quiet floor" tag on floor 8. Floors animate upward one by one when the step opens. Selecting a
floor darkens it.

STEP 3 - Room: a grid of 20 door tiles (101-120). Quad rooms (01-10) and Double rooms (11-20) are
visibly different (Quad tile shows 4 dots, Double shows 2 dots), AC rooms have a snowflake icon.
Dots are filled for taken seats. A room with 0 free seats is greyed out and not tappable.
Selected room darkens. Include filter chips: All / Quad / Double / AC / Non-AC.

STEP 4 - Bed: a top-down room drawing with a WINDOW drawn on the top wall.
 - Quad room: two bunk beds side by side, the left bunk nearest the window. Each bunk is drawn as
   two stacked layers (Upper on top with an offset shadow, Lower below), labelled bed 1-4.
 - Double room: two single beds.
Bed states: Available (white, green outline), Held (amber), Pending (amber striped), Booked (grey),
Blocked (hatched), Selected (dark navy). Beds near the window get a sun icon and a badge
"+Rs 10,000 window bed". Tapping a bed selects it (turns darker, small bounce); a bottom sheet
slides up with: bed details, base fee, window extra, total, and a gradient button
"Hold this bed for 10 minutes".

Mock data shapes (use these exact field names):
hostel: {hostel_id, hostel_name, gender, total_floors, total_beds, free_beds}
floor:  {floor_id, floor_number, floor_type, total_beds, free_beds}
room:   {room_id, room_number, room_type, is_ac, capacity, status, occupied_seats, in_progress_seats, free_seats}
bed:    {bed_id, bed_number, bed_level, near_window, bed_status, base_semester_fee, window_charge, price_total}
bed_status is one of Available, Held, Pending, Booked, Blocked.
Example Quad AC room 101: bed1 Lower window 96750 | bed2 Upper window 94250 | bed3 Lower 86750 | bed4 Upper 84250.

---------------------------------------------------------------------------------------------------
## PROMPT 3 - Fee receipt, document upload, submit, booking status
---------------------------------------------------------------------------------------------------
Continue the same app and keep exactly the same design system. Build 4 screens:
1. Fee receipt: a countdown card "Your bed is held for 01:59:59". Below it a receipt card listing
   line items (item_type, description, amount): HOSTEL_FEE 38000, UTILITY 12500, MESS_ADVANCE 31250,
   SECURITY_DEPOSIT 5000, WINDOW_PREFERENCE 10000 (small orange "Preference" tag). Transport radio
   group: None / Per semester 26,250 / Yearly 52,500 that adds a TRANSPORT line live. Bold total row
   labelled "Amount to pay at the college hostel fee counter / online". Button "Next: Upload documents".
2. Upload documents + submit: a checklist of 2 required items, each an upload card with drag-and-drop,
   accepted types PDF/JPG/PNG up to 5 MB, file name once chosen, and a status chip:
   (a) "Hostel fee payment receipt"  (b) "Hostel allotment form". Under them 3 fields: payment mode
   (UPI / Card / Online / Cash), payment reference number (UTR or receipt no), amount paid.
   The gradient button "Submit for warden approval" stays DISABLED until both files are uploaded and
   the reference number is filled; show a helper text listing what is still missing.
3. Submitted confirmation: animated tick, receipt number "RCPT-20261005-00001", chip "Waiting for
   warden to verify your documents", and a button "Track my booking".
4. Booking status: the 5-step tracker (Profile, Roommate Preferences, Choose Room, Documents,
   Warden Approval) with the current step highlighted; a card with hostel, floor, room, bed, level,
   window yes/no; a "Documents" card showing each document with a chip Pending / Verified / Rejected.
   If a document is Rejected show the warden's remark in red and a "Re-upload" button (Verified
   documents cannot be replaced). Booking states: Pending / Approved / Rejected (with remarks) /
   Expired. When Approved show "Your roommates" cards: name, course, bed, circular match-score ring
   (for example 90%). "Cancel booking" outline button only while Pending.
Mock fields: document {doc_id, doc_type: PAYMENT_RECEIPT|ALLOTMENT_FORM, file_name,
verification_status: Pending|Verified|Rejected, remarks}.

---------------------------------------------------------------------------------------------------
## PROMPT 4 - Warden dashboard (manual document checking)
---------------------------------------------------------------------------------------------------
Continue the same app and keep exactly the same design system. Build the Warden view
("WARDEN VIEW - Boys Hostel A"):
- 4 stat cards: Pending requests, Approved, Free beds, Blocked beds.
- A "Pending bookings" list (search box on top). Each card: student name, course, floor/room/bed,
  window badge, and a "Docs 1/2 verified" chip (orange when incomplete, green when 2/2).
  Fields: booking_id, student_name, course, floor_number, room_number, bed_number, bed_level,
  near_window, total_amount, docs_uploaded, docs_verified, status.
- Tapping a card opens a full detail screen with 3 sections:
  1) Student: preferences (sleep schedule, cleanliness, study style, hobby chips).
  2) Payment check: the system-calculated receipt lines and total, NEXT TO the student's claim
     (payment mode, reference number, amount paid) with a green "Amount matches" or red
     "Amount does not match" indicator.
  3) Documents: two cards (Hostel fee payment receipt, Hostel allotment form), each with an inline
     preview of the uploaded PDF/image, an "Open full size" button, and two buttons: Verify (green)
     and Reject (red, opens a required "reason" box). Chip shows Pending / Verified / Rejected.
  Bottom action bar: Approve (disabled until BOTH documents are Verified, with helper text
  "Verify both documents to approve"), Reject booking (asks for a remark), Reassign (picker of free
  beds with floor, room, bed and price; if price differs show "Student will be charged +Rs X /
  refunded Rs X").
- An "Occupancy by floor" section: 8 horizontal stacked bars (Booked / In progress / Available /
  Blocked).
- A "Block a bed" tool: choose floor, room, bed, and toggle blocked.

---------------------------------------------------------------------------------------------------
## PROMPT 5 - Admin dashboard
---------------------------------------------------------------------------------------------------
Continue the same app and keep exactly the same design system. Build the Admin view
("ADMIN VIEW"):
- Stat cards: Students registered / Admissions on record, Pending bookings, Approved bookings,
  Money collected (Rs), Total beds.
- Per-hostel table with total beds, booked, available (small progress bars).
- Wardens page: list (name, email, hostel) with Add warden form and Remove button (confirm dialog).
- Structure page: hostels list, add hostel, add floor, add room (room type Double or Quad, AC
  toggle; note "beds are created automatically").
- Admissions import page: drag-and-drop CSV area with columns admission_no, name, email, phone,
  course, gender and a preview table.
- Fees page: editable table of the 6 fee rows (room type, AC, bed level, hostel fee, utility,
  mess advance, security deposit, computed total) and an "Extra charges" card with Window bed
  Rs 10,000 and Transport Rs 26,250 / Rs 52,500.

---------------------------------------------------------------------------------------------------
## AFTER ALL 5: polish prompt
---------------------------------------------------------------------------------------------------
Continue the same app. Add loading skeletons, empty states, error toasts, a working light/dark
toggle on every screen, consistent spacing, and make sure every screen works at 390px width and
on a laptop. Do not change features.
