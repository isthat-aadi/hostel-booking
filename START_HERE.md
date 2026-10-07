# START HERE

## Where you are (checklist)
- [x] Database designed and built (4 SQL files). You ran it in MySQL 8.0 with no errors.
- [x] Backend API built and tested (Node + Express). It runs and logs in.
- [x] All screens designed in Figma Make and exported into the `frontend` folder. They look finished.
- [ ] **Frontend is NOT connected yet.** Only the login talks to the backend. Every other screen shows fake hardcoded data. This is the main work left.
- [ ] Student registration screen not connected.
- [ ] Document upload + warden verification not yet tested by you on your own laptop.
- [ ] Demo rehearsal for Rohit Sir.

## What was wrong in the folder you sent (already fixed in this clean copy)
1. `backend/src/seed.js` had been overwritten with React Login code (a copy-paste accident). `npm run seed` would crash. Restored the correct file.
2. The frontend asked for `/hostels`, which does not exist. The correct address is `/student/hostels`. It silently fell back to fake data, so you would never have seen the error. Fixed.
3. `Antigravity-x64.exe` (164 MB installer) was sitting inside `frontend`. Removed. Keep installers OUTSIDE your project.
4. A duplicate folder `hostel-booking\hostel-booking` was inside the project. Removed.
5. `node_modules` and your `.env` file were inside the zip. Removed from this copy. Your `.env` holds your MySQL password. Never upload or share it.

The build itself is healthy: the frontend compiles with no errors, and the backend answers correctly.

## How to run everything (do this every time you work)
You need TWO windows open at the same time. MySQL runs by itself in the background.

**Window 1: backend**
```
cd C:\Users\LENOVO\Desktop\hostel-booking\backend
npm install          (only the first time)
copy .env.example .env     (only the first time, then put your MySQL password after DB_PASSWORD=)
npm run seed         (only once, makes the demo logins)
npm start
```
Leave it open. You should see: `Hostel API running on http://localhost:4000`

**Window 2: frontend**
```
cd C:\Users\LENOVO\Desktop\hostel-booking\frontend
npm install          (only the first time)
npm run dev
```
Leave it open. Open **http://localhost:8443** in Chrome.

## Demo logins
| Role | Login | Password |
|---|---|---|
| Student (boy) | JKLU2026001 ... JKLU2026004 | student123 |
| Student (girl) | JKLU2026013 ... JKLU2026016 | student123 |
| Warden | warden.boysa@jklu.test (also boysb, girlsa, girlsb) | warden123 |
| Admin | admin@jklu.test | admin123 |
To demo registration use admission numbers JKLU2026005 to 012 (boys) or 017 to 024 (girls). They are in the college list but not registered yet.

## Errors you may see
| What you see | What it means | Fix |
|---|---|---|
| `Access denied for user 'root'` | wrong MySQL password in `backend\.env` | `type .env`, fix the line after `DB_PASSWORD=`, save |
| `EADDRINUSE ... 4000` | backend is already running in another window | close the other window, or just use it |
| `EADDRINUSE ... 8443` | frontend already running | same |
| Login says "Failed to fetch" | backend window is not running | start Window 1 |
| Login says "Wrong ID or password" | demo users missing | run `npm run seed` in backend |
| `Cannot find module ...` | packages not installed | run `npm install` in that folder |
| Session suddenly logs out | login token lasts 8 hours | log in again |
| `ERROR 1007 database exists` or foreign key errors when re-running SQL | old data in the way | the 01 file drops and rebuilds the database, so just run 01, 02, 03 again in order |

## Rules so nothing breaks again
- Do not let any AI edit the `backend` folder or the `.sql` files. If the screen needs something new from the backend, bring that request to Claude.
- Make a Git save point before every AI task (steps in `ANTIGRAVITY_TASKS.md`), so you can undo.
- Test each screen yourself after each task. Do not stack five tasks before testing.
