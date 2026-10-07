import { FormEvent, ReactNode, useEffect, useState } from "react";
import { apiRequest, setToken, setUser, getToken, getUser, removeToken } from "./api";
import "./index.css"; // Ensures CSS stays attached!

type Screen =
  | "login"
  | "home"
  | "preferences"
  | "choose-room"
  | "fee-receipt"
  | "documents"
  | "submitted"
  | "booking-status"
  | "warden"
  | "warden-booking"
  | "admin";
type LoginMode = "student" | "staff";
type Theme = "light" | "dark";
type UserRole = "student" | "warden" | "admin";

type Hostel = {
  hostel_id: number;
  hostel_name: string;
  gender: string;
  total_floors: number;
  total_beds: number;
  free_beds: number;
};

type Floor = {
  floor_id: number;
  floor_number: number;
  floor_type: string;
  total_beds: number;
  free_beds: number;
};

type Room = {
  room_id: number;
  room_number: string;
  room_type: "Quad" | "Double";
  is_ac: boolean;
  capacity: number;
  status: string;
  occupied_seats: number;
  in_progress_seats: number;
  free_seats: number;
};

type BedStatus = "Available" | "Held" | "Pending" | "Booked" | "Blocked";

type Bed = {
  bed_id: number;
  bed_number: number;
  bed_level: "Lower" | "Upper" | "Single";
  near_window: boolean;
  bed_status: BedStatus;
  base_semester_fee: number;
  window_charge: number;
  price_total: number;
};

type DocumentStatus = "Pending" | "Verified" | "Rejected";

type BookingDocument = {
  doc_id: number;
  doc_type: "PAYMENT_RECEIPT" | "ALLOTMENT_FORM";
  file_name: string;
  verification_status: DocumentStatus;
  remarks: string;
};

type BookingState = "Pending" | "Approved" | "Rejected" | "Expired";

type WardenBooking = {
  booking_id: string;
  student_name: string;
  course: string;
  floor_number: number;
  room_number: string;
  bed_number: number;
  bed_level: string;
  near_window: boolean;
  total_amount: number;
  docs_uploaded: number;
  docs_verified: number;
  status: string;
};

const hobbies = [
  "Cricket",
  "Football",
  "Basketball",
  "Gaming",
  "Music",
  "Reading",
  "Coding",
  "Movies",
  "Dancing",
  "Gym",
  "Art",
  "Travelling",
];

function Icon({
  name,
  size = 22,
}: {
  name: string;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  const paths: Record<string, ReactNode> = {
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" />
      </>
    ),
    moon: (
      <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.7 6.7 0 0 0 21 12.8Z" />
    ),
    menu: (
      <>
        <path d="M4 6h16M4 12h16M4 18h16" />
      </>
    ),
    building: (
      <>
        <path d="M4 21h16M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3" />
      </>
    ),
    bed: (
      <>
        <path d="M3 20v-8M21 20v-6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v3M3 17h18M7 12V8H5a2 2 0 0 0-2 2v4" />
      </>
    ),
    wallet: (
      <>
        <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H19v16H6.5A2.5 2.5 0 0 1 4 17.5zM4 7h13" />
        <path d="M15 11h6v5h-6a2.5 2.5 0 0 1 0-5z" />
      </>
    ),
    clipboard: (
      <>
        <rect x="5" y="4" width="14" height="17" rx="2" />
        <path d="M9 4.5V3h6v1.5M9 9h6M9 13h6M9 17h4" />
      </>
    ),
    arrow: <path d="M5 12h14M14 7l5 5-5 5" />,
    check: <path d="m5 12 4 4L19 6" />,
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.7-7.5 1.1-1.1a5.5 5.5 0 0 0 0-7.8Z" />
    ),
    snowflake: (
      <>
        <path d="M12 2v20M4.93 6l14.14 12M4.93 18 19.07 6M8 4l4 2 4-2M8 20l4-2 4 2M3.5 10 7 12l-.5 4M20.5 10 17 12l.5 4" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    upload: (
      <>
        <path d="M12 16V4M7 9l5-5 5 5M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
      </>
    ),
    file: (
      <>
        <path d="M6 2h8l4 4v16H6z" />
        <path d="M14 2v5h5M9 13h6M9 17h6" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    circleCheck: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16 9" />
      </>
    ),
    alert: (
      <>
        <path d="M12 3 2.5 20h19z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5v1" />
      </>
    ),
    money: (
      <>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <circle cx="12" cy="12" r="3" />
        <path d="M7 9H6v1M17 15h1v-1" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6" />
      </>
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
}

function Header({
  screen,
  onNavigate,
  theme,
  onToggleTheme,
  role,
}: {
  screen: Screen;
  onNavigate: (screen: Screen) => void;
  theme: Theme;
  onToggleTheme: () => void;
  role: UserRole | null;
}) {
  const [open, setOpen] = useState(false);

  const go = (next: Screen) => {
    onNavigate(next);
    setOpen(false);
  };
  const roleHome: Screen =
    role === "admin" ? "admin" : role === "warden" ? "warden" : role === "student" ? "home" : "login";

  return (
    <header className="topbar">
      <button className="brand" onClick={() => go(roleHome)} aria-label="Go to home">
        <span className="brand-mark">
          <span>J</span>
          <span>K</span>
        </span>
        <span className="brand-copy">
          <strong>JKLU</strong>
          <small>HOSTEL BOOKING</small>
        </span>
      </button>

      <div className="top-actions">
        <button
          className="icon-button sun-button"
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          onClick={onToggleTheme}
        >
          <Icon name={theme === "light" ? "moon" : "sun"} size={25} />
        </button>
        <button
          className="icon-button"
          aria-label="Open navigation"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <Icon name="menu" size={28} />
        </button>
      </div>

      {open && (
        <nav className="nav-menu" aria-label="Prototype screens">
          <button className={screen === "login" ? "active" : ""} onClick={() => go("login")}>
            {role ? "Sign out" : "Login"}
          </button>
          {role === "student" && (
            <>
              <button className={screen === "home" ? "active" : ""} onClick={() => go("home")}>
                Student Home
              </button>
              <button
                className={screen === "preferences" ? "active" : ""}
                onClick={() => go("preferences")}
              >
                Preferences
              </button>
              <button
                className={screen === "choose-room" ? "active" : ""}
                onClick={() => go("choose-room")}
              >
                Choose Room
              </button>
              <button
                className={screen === "booking-status" ? "active" : ""}
                onClick={() => go("booking-status")}
              >
                Booking Status
              </button>
            </>
          )}
          {role === "warden" && (
            <button
              className={screen === "warden" || screen === "warden-booking" ? "active" : ""}
              onClick={() => go("warden")}
            >
              Warden View
            </button>
          )}
          {role === "admin" && (
            <button
              className={screen === "admin" ? "active" : ""}
              onClick={() => go("admin")}
            >
              Admin View
            </button>
          )}
        </nav>
      )}
    </header>
  );
}

function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button className="primary-button" type={type} onClick={onClick} disabled={disabled}>
      <span>{children}</span>
      <span className="button-arrow">
        <Icon name="arrow" size={19} />
      </span>
    </button>
  );
}

function ScreenSkeleton() {
  return (
    <main className="page-shell skeleton-page" aria-label="Loading screen" aria-busy="true">
      <div className="skeleton-heading">
        <span />
        <i />
        <b />
      </div>
      <div className="skeleton-card-row">
        {[1, 2, 3, 4].map((item) => <span key={item} />)}
      </div>
      <div className="skeleton-panel">
        <i />
        <i />
        <i />
        <i />
      </div>
    </main>
  );
}

function EmptyState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="empty-state">
      <span><Icon name="clipboard" size={24} /></span>
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}

function ErrorToast({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 4200);
    return () => window.clearTimeout(timer);
  }, [message, onClose]);

  return (
    <div className="error-toast" role="alert">
      <span><Icon name="alert" size={18} /></span>
      <div><strong>Something needs attention</strong><p>{message}</p></div>
      <button onClick={onClose} aria-label="Dismiss error">×</button>
    </div>
  );
}

function Login({ onLogin }: { onLogin: (role: UserRole, user: any) => void }) {
  const [mode, setMode] = useState<LoginMode>("student");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const selectedRole = mode === "student" ? "student" : identifier.toLowerCase().includes("admin") ? "admin" : "warden";
      
      const data = await apiRequest("/auth/login", "POST", {
        role: selectedRole,
        identifier: identifier.trim(),
        password: password,
      });

      setToken(data.token);
      setUser(data.user);
      onLogin(data.user.role, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-intro">
        <p className="eyebrow">WELCOME TO JKLU</p>
        <h1>Your room, your comfort, your campus.</h1>
        <p>A simple and transparent way to find your place at JK Lakshmipat University.</p>
        <div className="intro-art" aria-hidden="true"><span className="art-circle art-circle-one" /><span className="art-circle art-circle-two" /><div className="art-building"><span /><span /><span /><span /><span /><span /></div></div>
      </section>

      <section className="login-card">
        <div className="login-heading">
          <p className="eyebrow">{mode === "student" ? "STUDENT ACCESS" : "STAFF ACCESS"}</p>
          <h2>{mode === "student" ? "Student sign in" : "JKLU staff sign in"}</h2>
          <p>{mode === "student" ? "Enter your admission number to continue." : "Authorised wardens and administrators sign in with official email."}</p>
        </div>

        <form onSubmit={submit}>
          <label className="field-label" htmlFor="identifier">
            {mode === "student" ? "Admission number" : "JKLU email address"}
          </label>
          <div className="input-wrap">
            <Icon name={mode === "student" ? "user" : "mail"} size={20} />
            <input id="identifier" type={mode === "student" ? "text" : "email"} value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder={mode === "student" ? "e.g. JKLU2026001" : "e.g. warden.boysa@jklu.test"} required />
          </div>

          <div className="password-row">
            <label className="field-label" htmlFor="password">Password</label>
          </div>
          <div className="input-wrap">
            <Icon name="lock" size={20} />
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
          </div>

          {error && <ErrorToast message={error} onClose={() => setError("")} />}

          <PrimaryButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : mode === "student" ? "Sign in as a student" : "Continue to staff portal"}
          </PrimaryButton>
        </form>

        <p className="help-text">
          {mode === "student" ? "JKLU warden or administrator? " : "Are you a student? "}
          <button onClick={() => { setMode(mode === "student" ? "staff" : "student"); setError(""); }}>
            {mode === "student" ? "Access the staff portal" : "Return to student sign in"}
          </button>
        </p>
      </section>
    </main>
  );
}

const trackerSteps = [
  "Profile",
  "Roommate Preferences",
  "Choose Room",
  "Payment",
  "Warden Approval",
];

function ProgressTracker() {
  return (
    <section className="tracker-card">
      <div className="tracker-top">
        <div>
          <p className="card-label">YOUR BOOKING JOURNEY</p>
          <h2>Let’s get you settled</h2>
        </div>
        <span>Step 2 of 5</span>
      </div>
      <div className="progress-track">
        <span />
      </div>
      <div className="steps">
        {trackerSteps.map((step, index) => (
          <div className={`step ${index === 0 ? "done" : ""} ${index === 1 ? "current" : ""}`} key={step}>
            <div className="step-dot">
              {index === 0 ? <Icon name="check" size={15} /> : index + 1}
            </div>
            <span>{step}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

const stats = [
  { label: "Hostel", value: "Not chosen", icon: "building", theme: "orange" },
  { label: "Room", value: "Not chosen", icon: "bed", theme: "green" },
  { label: "Amount Due", value: "Rs 0", icon: "wallet", theme: "purple" },
  { label: "Booking Status", value: "Not started", icon: "clipboard", theme: "red" },
];

function Home({ onContinue }: { onContinue: () => void }) {
  const user = getUser(); 

  return (
    <main className="page-shell student-dashboard">
      <section className="welcome-header">
        <p className="eyebrow">STUDENT DASHBOARD</p>
        <h1>Welcome, {user?.name || "Student"}!</h1>
        <p>Admission No: {user?.identifier || user?.admission_no || "N/A"}</p>
      </section>

      {/* Put the beautiful Progress Tracker back! */}
      <ProgressTracker />

      {/* Put the beautiful Stat Cards back! */}
      <section className="stats-grid">
        {stats.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <div className={`stat-icon ${stat.theme}`}>
              <Icon name={stat.icon} size={24} />
            </div>
            <div>
              <p className="card-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {stat.label.toUpperCase()}
              </p>
              <h2>{stat.value}</h2>
            </div>
          </article>
        ))}
      </section>

      <section className="dashboard-cards" style={{ marginTop: "2rem" }}>
        <div className="card action-card">
          <div className="card-content">
            <Icon name="home" size={24} />
            <h3>Hostel Booking 2026-27</h3>
            <p>Select your preferences and book your room for the upcoming academic session.</p>
          </div>
          <PrimaryButton onClick={onContinue}>
            Start Booking Application
          </PrimaryButton>
        </div>
      </section>
    </main>
  );
}

function ChoiceGroup({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="choice-field">
      <legend>{title}</legend>
      <div className="segmented-control">
        {options.map((option) => (
          <button
            type="button"
            className={value === option ? "active" : ""}
            onClick={() => onChange(option)}
            key={option}
          >
            {value === option && <Icon name="check" size={14} />}
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

// RESTORED your beautiful Preferences form exactly how it was!
function Preferences({ onSave }: { onSave: () => void }) {
  const [course, setCourse] = useState("B.Tech");
  const [sleep, setSleep] = useState("Flexible");
  const [cleanliness, setCleanliness] = useState("Average");
  const [study, setStudy] = useState("Quiet");
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>(["Coding", "Music"]);
  const [floor, setFloor] = useState("Any");
  const [room, setRoom] = useState("Double");
  const [ac, setAc] = useState("Any");
  const [bed, setBed] = useState("Any");
  const [windowBed, setWindowBed] = useState(false);

  const toggleHobby = (hobby: string) => {
    setSelectedHobbies((current) =>
      current.includes(hobby)
        ? current.filter((item) => item !== hobby)
        : [...current, hobby],
    );
  };

  return (
    <main className="page-shell preferences-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">STEP 2 OF 5</p>
          <h1>Roommate Preferences</h1>
          <p>Help us find someone whose lifestyle fits well with yours.</p>
        </div>
        <span className="completion-badge">About 3 minutes</span>
      </section>

      <div className="preference-progress">
        <span />
      </div>

      <form
        className="preferences-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <section className="form-card">
          <div className="section-heading">
            <span>01</span>
            <div>
              <h2>Academic & lifestyle</h2>
              <p>Start with the basics of your daily routine.</p>
            </div>
          </div>

          <label className="select-field">
            <span>Preferred course</span>
            <select value={course} onChange={(event) => setCourse(event.target.value)}>
              <option>B.Tech</option>
              <option>BBA</option>
              <option>B.Des</option>
              <option>M.Tech</option>
              <option>MBA</option>
              <option>Any course</option>
            </select>
          </label>

          <div className="choice-grid">
            <ChoiceGroup
              title="Sleep schedule"
              options={["Early Bird", "Night Owl", "Flexible"]}
              value={sleep}
              onChange={setSleep}
            />
            <ChoiceGroup
              title="Cleanliness"
              options={["Very Tidy", "Average", "Relaxed"]}
              value={cleanliness}
              onChange={setCleanliness}
            />
            <ChoiceGroup
              title="Study style"
              options={["Quiet", "Group", "Flexible"]}
              value={study}
              onChange={setStudy}
            />
          </div>
        </section>

        <section className="form-card">
          <div className="section-heading">
            <span>02</span>
            <div>
              <h2>Interests & hobbies</h2>
              <p>Select as many as you like.</p>
            </div>
          </div>
          <div className="hobby-chips">
            {hobbies.map((hobby) => (
              <button
                type="button"
                key={hobby}
                className={selectedHobbies.includes(hobby) ? "active" : ""}
                onClick={() => toggleHobby(hobby)}
              >
                {selectedHobbies.includes(hobby) && <Icon name="check" size={14} />}
                {hobby}
              </button>
            ))}
          </div>
        </section>

        <section className="form-card">
          <div className="section-heading">
            <span>03</span>
            <div>
              <h2>Room preferences</h2>
              <p>Choose the room setup that works for you.</p>
            </div>
          </div>

          <div className="choice-grid room-grid">
            <ChoiceGroup
              title="Preferred floor type"
              options={["Regular", "Quiet", "Any"]}
              value={floor}
              onChange={setFloor}
            />
            <ChoiceGroup
              title="Room type"
              options={["Double", "Quad", "Any"]}
              value={room}
              onChange={setRoom}
            />
            <ChoiceGroup
              title="Cooling"
              options={["AC", "Non-AC", "Any"]}
              value={ac}
              onChange={setAc}
            />
            <ChoiceGroup
              title="Bed level"
              options={["Lower", "Upper", "Any"]}
              value={bed}
              onChange={setBed}
            />
          </div>

          <label className="toggle-row">
            <span className="toggle-copy">
              <strong>I want a window-side bed</strong>
              <small>Extra Rs 10,000 will be added to your hostel fee</small>
            </span>
            <input
              type="checkbox"
              checked={windowBed}
              onChange={(event) => setWindowBed(event.target.checked)}
            />
            <span className="toggle" aria-hidden="true">
              <span />
            </span>
          </label>
        </section>

        <div className="save-row">
          <p>Your choices can be updated until you select a room.</p>
          <PrimaryButton type="submit">Save preferences</PrimaryButton>
        </div>
      </form>
    </main>
  );
}

const hostels: Hostel[] = [
  {
    hostel_id: 1,
    hostel_name: "Boys Hostel A",
    gender: "Male",
    total_floors: 8,
    total_beds: 640,
    free_beds: 480,
  },
  {
    hostel_id: 2,
    hostel_name: "Boys Hostel B",
    gender: "Male",
    total_floors: 8,
    total_beds: 640,
    free_beds: 480,
  },
  {
    hostel_id: 3,
    hostel_name: "Girls Hostel A",
    gender: "Female",
    total_floors: 8,
    total_beds: 640,
    free_beds: 480,
  },
  {
    hostel_id: 4,
    hostel_name: "Girls Hostel B",
    gender: "Female",
    total_floors: 8,
    total_beds: 640,
    free_beds: 480,
  },
];

const floors: Floor[] = Array.from({ length: 8 }, (_, index) => ({
  floor_id: index + 1,
  floor_number: index + 1,
  floor_type: index === 7 ? "Quiet" : "Regular",
  total_beds: 80,
  free_beds: [52, 61, 48, 57, 63, 44, 56, 39][index],
}));

const rooms: Room[] = Array.from({ length: 20 }, (_, index) => {
  const capacity = index < 10 ? 4 : 2;
  const occupied = [0, 1, 2, 4, 3, 1, 4, 2, 0, 3, 0, 1, 2, 1, 0, 2, 1, 0, 2, 1][index];
  const inProgress = occupied < capacity && index % 6 === 2 ? 1 : 0;
  const free = Math.max(0, capacity - occupied - inProgress);
  return {
    room_id: index + 1,
    room_number: String(101 + index),
    room_type: index < 10 ? "Quad" : "Double",
    is_ac: index % 3 !== 1,
    capacity,
    status: free === 0 ? "Full" : "Available",
    occupied_seats: occupied,
    in_progress_seats: inProgress,
    free_seats: free,
  };
});

const room101Beds: Bed[] = [
  {
    bed_id: 1,
    bed_number: 1,
    bed_level: "Lower",
    near_window: true,
    bed_status: "Available",
    base_semester_fee: 86750,
    window_charge: 10000,
    price_total: 96750,
  },
  {
    bed_id: 2,
    bed_number: 2,
    bed_level: "Upper",
    near_window: true,
    bed_status: "Pending",
    base_semester_fee: 84250,
    window_charge: 10000,
    price_total: 94250,
  },
  {
    bed_id: 3,
    bed_number: 3,
    bed_level: "Lower",
    near_window: false,
    bed_status: "Available",
    base_semester_fee: 86750,
    window_charge: 0,
    price_total: 86750,
  },
  {
    bed_id: 4,
    bed_number: 4,
    bed_level: "Upper",
    near_window: false,
    bed_status: "Booked",
    base_semester_fee: 84250,
    window_charge: 0,
    price_total: 84250,
  },
];

const formatMoney = (value: number) => `Rs ${value.toLocaleString("en-IN")}`;

function BookingBreadcrumb({
  step,
  onStep,
}: {
  step: number;
  onStep: (step: number) => void;
}) {
  return (
    <nav className="booking-breadcrumb" aria-label="Room selection progress">
      {["Hostel", "Floor", "Room", "Bed"].map((label, index) => (
        <div key={label}>
          <button
            className={index + 1 === step ? "active" : index + 1 < step ? "complete" : ""}
            onClick={() => index + 1 < step && onStep(index + 1)}
            disabled={index + 1 > step}
          >
            <span>{index + 1 < step ? <Icon name="check" size={13} /> : index + 1}</span>
            {label}
          </button>
          {index < 3 && <Icon name="chevron" size={15} />}
        </div>
      ))}
    </nav>
  );
}

// THIS IS THE CORRECT PLACE to fetch real hostel data!
function HostelStep({ onSelect }: { onSelect: (hostel: Hostel) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [liveHostels, setLiveHostels] = useState<Hostel[]>(hostels); // defaults to hardcoded
  
  const user = getUser();
  const studentGender = user?.gender || "Male";

  useEffect(() => {
    async function fetchHostels() {
      try {
        const data = await apiRequest("/student/hostels", "GET");
        if (data && data.length > 0) {
          setLiveHostels(data);
        }
      } catch (err) {
        console.error("Could not load live hostels, using fallback data.");
      }
    }
    fetchHostels();
  }, []);

  const choose = (hostel: Hostel) => {
    if (hostel.gender !== studentGender) return;
    setSelected(hostel.hostel_id);
    window.setTimeout(() => onSelect(hostel), 420);
  };

  return (
    <section className="booking-step step-enter">
      <div className="room-step-heading">
        <p className="eyebrow">CHOOSE YOUR BUILDING</p>
        <h1>Which hostel feels like home?</h1>
        <p>All JKLU hostels are shown below. Eligibility comes from your verified profile.</p>
        <span className="student-gender-note">
          <Icon name="user" size={14} />
          Profile gender: {studentGender}
        </span>
      </div>
      <div className="hostel-grid">
        {liveHostels.map((hostel) => {
          const eligible = hostel.gender === studentGender;
          return (
            <button
              className={`hostel-card ${selected === hostel.hostel_id ? "selected" : ""} ${
                !eligible ? "ineligible" : ""
              }`}
              onClick={() => choose(hostel)}
              disabled={!eligible}
              key={hostel.hostel_id}
            >
            <div className="hostel-building" aria-hidden="true">
              {Array.from({ length: hostel.total_floors }, (_, index) => (
                <span key={index}>
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
              ))}
            </div>
            <div className="hostel-card-copy">
              <span className="availability-dot" />
              <div>
                <h2>{hostel.hostel_name}</h2>
                <p>
                  {hostel.gender} • {hostel.total_floors} floors
                </p>
              </div>
              <strong>{eligible ? `${hostel.free_beds} beds free` : "Not eligible"}</strong>
            </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function FloorStep({
  hostel,
  onSelect,
}: {
  hostel: Hostel;
  onSelect: (floor: Floor) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  const choose = (floor: Floor) => {
    setSelected(floor.floor_id);
    window.setTimeout(() => onSelect(floor), 350);
  };

  return (
    <section className="booking-step step-enter">
      <div className="room-step-heading compact">
        <p className="eyebrow">{hostel.hostel_name.toUpperCase()}</p>
        <h1>Choose a floor</h1>
        <p>Select a floor to see its available rooms.</p>
      </div>
      <div className="floor-layout">
        <div className="building-side-label">
          <span>ROOFTOP</span>
          <i />
          <span>GROUND</span>
        </div>
        <div className="floor-building">
          {[...floors].reverse().map((floor, index) => (
            <button
              className={`floor-slab ${selected === floor.floor_id ? "selected" : ""}`}
              style={{ "--floor-delay": `${index * 65}ms` } as React.CSSProperties}
              onClick={() => choose(floor)}
              key={floor.floor_id}
            >
              <span className="floor-number">{String(floor.floor_number).padStart(2, "0")}</span>
              <strong>Floor {floor.floor_number}</strong>
              {floor.floor_type === "Quiet" && <em>Quiet floor</em>}
              <span className="floor-free">{floor.free_beds} beds free</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

type RoomFilter = "All" | "Quad" | "Double" | "AC" | "Non-AC";

function RoomStep({
  hostel,
  floor,
  onSelect,
}: {
  hostel: Hostel;
  floor: Floor;
  onSelect: (room: Room) => void;
}) {
  const [filter, setFilter] = useState<RoomFilter>("All");
  const [selected, setSelected] = useState<number | null>(null);
  const filters: RoomFilter[] = ["All", "Quad", "Double", "AC", "Non-AC"];
  const visibleRooms = rooms.filter((room) => {
    if (filter === "Quad" || filter === "Double") return room.room_type === filter;
    if (filter === "AC") return room.is_ac;
    if (filter === "Non-AC") return !room.is_ac;
    return true;
  });

  const choose = (room: Room) => {
    if (room.free_seats === 0) return;
    setSelected(room.room_id);
    window.setTimeout(() => onSelect(room), 350);
  };

  return (
    <section className="booking-step step-enter">
      <div className="room-step-heading compact">
        <p className="eyebrow">
          {hostel.hostel_name.toUpperCase()} • FLOOR {floor.floor_number}
        </p>
        <h1>Pick a room</h1>
        <p>Filled dots show occupied seats. Choose any room with a free bed.</p>
      </div>

      <div className="room-filters" aria-label="Filter rooms">
        {filters.map((item) => (
          <button
            className={filter === item ? "active" : ""}
            onClick={() => setFilter(item)}
            key={item}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="room-grid-tiles">
        {visibleRooms.map((room) => (
          <button
            className={`room-tile ${room.free_seats === 0 ? "full" : ""} ${
              selected === room.room_id ? "selected" : ""
            }`}
            disabled={room.free_seats === 0}
            onClick={() => choose(room)}
            key={room.room_id}
          >
            <span className="room-type">{room.room_type}</span>
            {room.is_ac && (
              <span className="ac-icon" title="Air conditioned">
                <Icon name="snowflake" size={15} />
              </span>
            )}
            <strong>{room.room_number}</strong>
            <span className="seat-dots" aria-label={`${room.occupied_seats} occupied seats`}>
              {Array.from({ length: room.capacity }, (_, index) => (
                <i
                  className={
                    index < room.occupied_seats
                      ? "taken"
                      : index < room.occupied_seats + room.in_progress_seats
                        ? "pending"
                        : ""
                  }
                  key={index}
                />
              ))}
            </span>
            <small>{room.free_seats === 0 ? "Full" : `${room.free_seats} free`}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

function makeBeds(room: Room): Bed[] {
  if (room.room_number === "101") return room101Beds;
  return Array.from({ length: room.capacity }, (_, index) => {
    const nearWindow = index < (room.room_type === "Quad" ? 2 : 1);
    const level =
      room.room_type === "Double" ? "Single" : index % 2 === 0 ? "Lower" : "Upper";
    const statuses: BedStatus[] = ["Available", "Held", "Pending", "Booked", "Blocked"];
    const bedStatus =
      index < room.occupied_seats
        ? index % 2
          ? "Blocked"
          : "Booked"
        : index < room.occupied_seats + room.in_progress_seats
          ? statuses[(room.room_id + index) % 2 + 1]
          : "Available";
    const baseFee = level === "Upper" ? 84250 : 86750;
    const windowCharge = nearWindow ? 10000 : 0;
    return {
      bed_id: room.room_id * 10 + index + 1,
      bed_number: index + 1,
      bed_level: level,
      near_window: nearWindow,
      bed_status: bedStatus,
      base_semester_fee: baseFee,
      window_charge: windowCharge,
      price_total: baseFee + windowCharge,
    };
  });
}

function BedCard({
  bed,
  selected,
  onSelect,
}: {
  bed: Bed;
  selected: boolean;
  onSelect: (bed: Bed) => void;
}) {
  const selectable = bed.bed_status === "Available";
  return (
    <button
      className={`bed-card ${bed.bed_status.toLowerCase()} ${selected ? "selected" : ""}`}
      disabled={!selectable}
      onClick={() => onSelect(bed)}
    >
      <span className="bed-pillow" />
      <span className="bed-copy">
        <strong>Bed {bed.bed_number}</strong>
        <small>{bed.bed_level}</small>
      </span>
      {bed.near_window && (
        <span className="window-bed-icon">
          <Icon name="sun" size={15} />
        </span>
      )}
    </button>
  );
}

function BedStep({
  hostel,
  floor,
  room,
  onHold,
}: {
  hostel: Hostel;
  floor: Floor;
  room: Room;
  onHold: () => void;
}) {
  const beds = makeBeds(room);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);

  useEffect(() => setSelectedBed(null), [room.room_id]);

  return (
    <section className="booking-step bed-step step-enter">
      <div className="room-step-heading compact">
        <p className="eyebrow">
          {hostel.hostel_name.toUpperCase()} • FLOOR {floor.floor_number} • ROOM{" "}
          {room.room_number}
        </p>
        <h1>Choose your bed</h1>
        <p>
          {room.room_type} {room.is_ac ? "AC" : "Non-AC"} room • Select an available bed.
        </p>
      </div>

      <div className="bed-legend">
        {(["Available", "Held", "Pending", "Booked", "Blocked"] as BedStatus[]).map(
          (status) => (
            <span key={status}>
              <i className={status.toLowerCase()} />
              {status}
            </span>
          ),
        )}
      </div>

      <div className={`room-plan ${room.room_type.toLowerCase()}`}>
        <div className="window-fixture">
          <Icon name="sun" size={18} />
          <span>WINDOW</span>
        </div>
        <span className="room-plan-label">ROOM {room.room_number}</span>
        <div className="beds-layout">
          {room.room_type === "Quad" ? (
            <>
              <div className="bunk window-bunk">
                <span className="window-price">+Rs 10,000 window bed</span>
                <BedCard
                  bed={beds[1]}
                  selected={selectedBed?.bed_id === beds[1].bed_id}
                  onSelect={setSelectedBed}
                />
                <BedCard
                  bed={beds[0]}
                  selected={selectedBed?.bed_id === beds[0].bed_id}
                  onSelect={setSelectedBed}
                />
              </div>
              <div className="bunk">
                <BedCard
                  bed={beds[3]}
                  selected={selectedBed?.bed_id === beds[3].bed_id}
                  onSelect={setSelectedBed}
                />
                <BedCard
                  bed={beds[2]}
                  selected={selectedBed?.bed_id === beds[2].bed_id}
                  onSelect={setSelectedBed}
                />
              </div>
            </>
          ) : (
            beds.map((bed, index) => (
              <div className={index === 0 ? "single-bed window-bunk" : "single-bed"} key={bed.bed_id}>
                {index === 0 && <span className="window-price">+Rs 10,000 window bed</span>}
                <BedCard
                  bed={bed}
                  selected={selectedBed?.bed_id === bed.bed_id}
                  onSelect={setSelectedBed}
                />
              </div>
            ))
          )}
        </div>
        <div className="room-door">
          <span />
          DOOR
        </div>
      </div>

      {selectedBed && (
        <aside className="bed-sheet" aria-live="polite">
          <div className="sheet-handle" />
          <div className="bed-details">
            <span className="selected-bed-number">B{selectedBed.bed_number}</span>
            <div>
              <p className="card-label">YOUR SELECTION</p>
              <h2>
                Bed {selectedBed.bed_number} • {selectedBed.bed_level}
              </h2>
              <p>
                Room {room.room_number}, Floor {floor.floor_number}, {hostel.hostel_name}
              </p>
            </div>
          </div>
          <div className="price-breakdown">
            <span>
              Base semester fee <strong>{formatMoney(selectedBed.base_semester_fee)}</strong>
            </span>
            <span>
              Window-side extra <strong>{formatMoney(selectedBed.window_charge)}</strong>
            </span>
            <span className="price-total">
              Total <strong>{formatMoney(selectedBed.price_total)}</strong>
            </span>
          </div>
          <PrimaryButton onClick={onHold}>Hold this bed for 10 minutes</PrimaryButton>
        </aside>
      )}
    </section>
  );
}

function ChooseRoom({ onHold }: { onHold: () => void }) {
  const [step, setStep] = useState(1);
  const [hostel, setHostel] = useState<Hostel | null>(null);
  const [floor, setFloor] = useState<Floor | null>(null);
  const [room, setRoom] = useState<Room | null>(null);

  const navigateBack = (nextStep: number) => {
    setStep(nextStep);
    if (nextStep < 4) setRoom(null);
    if (nextStep < 3) setFloor(null);
    if (nextStep < 2) setHostel(null);
  };

  return (
    <main className="page-shell room-booking-page">
      <BookingBreadcrumb step={step} onStep={navigateBack} />
      {step === 1 && (
        <HostelStep
          onSelect={(selected) => {
            setHostel(selected);
            setStep(2);
          }}
        />
      )}
      {step === 2 && hostel && (
        <FloorStep
          hostel={hostel}
          onSelect={(selected) => {
            setFloor(selected);
            setStep(3);
          }}
        />
      )}
      {step === 3 && hostel && floor && (
        <RoomStep
          hostel={hostel}
          floor={floor}
          onSelect={(selected) => {
            setRoom(selected);
            setStep(4);
          }}
        />
      )}
      {step === 4 && hostel && floor && room && (
        <BedStep hostel={hostel} floor={floor} room={room} onHold={onHold} />
      )}
    </main>
  );
}

const feeItems = [
  { item_type: "HOSTEL_FEE", description: "Hostel semester fee", amount: 38000 },
  { item_type: "UTILITY", description: "Utilities and maintenance", amount: 12500 },
  { item_type: "MESS_ADVANCE", description: "Mess advance", amount: 31250 },
  { item_type: "SECURITY_DEPOSIT", description: "Refundable security deposit", amount: 5000 },
  {
    item_type: "WINDOW_PREFERENCE",
    description: "Window-side bed preference",
    amount: 10000,
  },
];

type TransportChoice = "none" | "semester" | "yearly";

function FeeReceipt({ onNext }: { onNext: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState(2 * 60 * 60 - 1);
  const [transport, setTransport] = useState<TransportChoice>("none");

  useEffect(() => {
    const timer = window.setInterval(
      () => setSecondsLeft((current) => Math.max(0, current - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, []);

  const transportAmount =
    transport === "semester" ? 26250 : transport === "yearly" ? 52500 : 0;
  const total =
    feeItems.reduce((sum, item) => sum + item.amount, 0) + transportAmount;
  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;
  const countdown = [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");

  return (
    <main className="page-shell payment-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">PAYMENT SUMMARY</p>
          <h1>Fee receipt</h1>
          <p>Review the amount due before uploading your payment documents.</p>
        </div>
        <span className="receipt-number">Room 101 • Bed 1</span>
      </section>

      <section className="hold-countdown">
        <span className="countdown-icon">
          <Icon name="clock" size={25} />
        </span>
        <div>
          <p>Your bed is held for</p>
          <strong>{countdown}</strong>
        </div>
        <small>Complete payment before the timer expires</small>
      </section>

      <section className="receipt-card">
        <div className="receipt-header">
          <div>
            <p className="card-label">JKLU HOSTEL BOOKING</p>
            <h2>Fee breakdown</h2>
          </div>
          <span>2025–26</span>
        </div>

        <div className="receipt-lines">
          {feeItems.map((item) => (
            <div className="receipt-line" key={item.item_type}>
              <div>
                <span className="item-code">{item.item_type}</span>
                <p>{item.description}</p>
              </div>
              {item.item_type === "WINDOW_PREFERENCE" && (
                <em className="preference-tag">Preference</em>
              )}
              <strong>{formatMoney(item.amount)}</strong>
            </div>
          ))}
          {transport !== "none" && (
            <div className="receipt-line transport-line">
              <div>
                <span className="item-code">TRANSPORT</span>
                <p>
                  {transport === "semester"
                    ? "Transport — per semester"
                    : "Transport — yearly"}
                </p>
              </div>
              <strong>{formatMoney(transportAmount)}</strong>
            </div>
          )}
        </div>

        <fieldset className="transport-options">
          <legend>Transport option</legend>
          {[
            { value: "none", label: "None", price: "No transport" },
            { value: "semester", label: "Per semester", price: "Rs 26,250" },
            { value: "yearly", label: "Yearly", price: "Rs 52,500" },
          ].map((option) => (
            <label className={transport === option.value ? "active" : ""} key={option.value}>
              <input
                type="radio"
                name="transport"
                value={option.value}
                checked={transport === option.value}
                onChange={() => setTransport(option.value as TransportChoice)}
              />
              <span className="radio-dot" />
              <span>
                <strong>{option.label}</strong>
                <small>{option.price}</small>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="receipt-total">
          <span>Amount to pay at the college hostel fee counter / online</span>
          <strong>{formatMoney(total)}</strong>
        </div>
      </section>

      <div className="receipt-action">
        <p>Payment is completed outside this prototype.</p>
        <PrimaryButton onClick={onNext}>Next: Upload documents</PrimaryButton>
      </div>
    </main>
  );
}

function UploadCard({
  title,
  file,
  onFile,
}: {
  title: string;
  file: File | null;
  onFile: (file: File | null) => void;
}) {
  const [error, setError] = useState("");
  const inputId = title.toLowerCase().replaceAll(" ", "-");

  const validateFile = (nextFile?: File) => {
    if (!nextFile) return;
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowed.includes(nextFile.type) || nextFile.size > 5 * 1024 * 1024) {
      setError("Use a PDF, JPG, or PNG file up to 5 MB.");
      return;
    }
    setError("");
    onFile(nextFile);
  };

  return (
    <div
      className={`upload-card ${file ? "uploaded" : ""}`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        validateFile(event.dataTransfer.files[0]);
      }}
    >
      <div className="upload-title">
        <span className="upload-icon">
          <Icon name={file ? "file" : "upload"} size={22} />
        </span>
        <div>
          <h3>{title}</h3>
          <p>Required document</p>
        </div>
        <span className={`document-chip ${file ? "verified" : "pending"}`}>
          {file ? "Ready" : "Missing"}
        </span>
      </div>
      <label htmlFor={inputId} className="drop-zone">
        <input
          id={inputId}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(event) => validateFile(event.target.files?.[0])}
        />
        {file ? (
          <>
            <Icon name="circleCheck" size={24} />
            <strong>{file.name}</strong>
            <span>Click or drop another file to replace</span>
          </>
        ) : (
          <>
            <Icon name="upload" size={24} />
            <strong>Drop your file here or browse</strong>
            <span>PDF, JPG or PNG • Maximum 5 MB</span>
          </>
        )}
      </label>
      {error && <ErrorToast message={error} onClose={() => setError("")} />}
    </div>
  );
}

function UploadDocuments({ onSubmit }: { onSubmit: () => void }) {
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [allotmentFile, setAllotmentFile] = useState<File | null>(null);
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState("96750");
  const missing = [
    !receiptFile && "payment receipt",
    !allotmentFile && "allotment form",
    !reference.trim() && "payment reference number",
  ].filter(Boolean) as string[];
  const canSubmit = missing.length === 0;

  return (
    <main className="page-shell documents-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">DOCUMENTS • STEP 4 OF 5</p>
          <h1>Upload & submit</h1>
          <p>Upload clear copies so the warden can verify your booking.</p>
        </div>
        <span className="completion-badge">2 required items</span>
      </section>

      <section className="document-checklist">
        <div className="checklist-heading">
          <span>01</span>
          <div>
            <h2>Required documents</h2>
            <p>Both files must be uploaded before submission.</p>
          </div>
        </div>
        <div className="upload-grid">
          <UploadCard
            title="Hostel fee payment receipt"
            file={receiptFile}
            onFile={setReceiptFile}
          />
          <UploadCard
            title="Hostel allotment form"
            file={allotmentFile}
            onFile={setAllotmentFile}
          />
        </div>
      </section>

      <section className="payment-details-card">
        <div className="checklist-heading">
          <span>02</span>
          <div>
            <h2>Payment details</h2>
            <p>Enter the details exactly as shown on your receipt.</p>
          </div>
        </div>
        <div className="payment-fields">
          <label className="select-field">
            <span>Payment mode</span>
            <select value={paymentMode} onChange={(event) => setPaymentMode(event.target.value)}>
              <option>UPI</option>
              <option>Card</option>
              <option>Online</option>
              <option>Cash</option>
            </select>
          </label>
          <label className="plain-field">
            <span>Payment reference number</span>
            <input
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="UTR or receipt number"
            />
          </label>
          <label className="plain-field">
            <span>Amount paid</span>
            <div className="amount-input">
              <i>Rs</i>
              <input
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
          </label>
        </div>
      </section>

      <div className="submission-bar">
        <div className={canSubmit ? "ready" : ""}>
          <Icon name={canSubmit ? "circleCheck" : "alert"} size={19} />
          <p>
            {canSubmit
              ? "Everything is ready for submission."
              : `Still needed: ${missing.join(", ")}.`}
          </p>
        </div>
        <PrimaryButton disabled={!canSubmit} onClick={onSubmit}>
          Submit for warden approval
        </PrimaryButton>
      </div>
    </main>
  );
}

function SubmittedConfirmation({ onTrack }: { onTrack: () => void }) {
  return (
    <main className="confirmation-page">
      <section className="confirmation-card">
        <div className="success-rings">
          <span className="success-check">
            <Icon name="check" size={34} />
          </span>
        </div>
        <p className="eyebrow">SUBMISSION COMPLETE</p>
        <h1>Your documents are with the warden</h1>
        <p>
          We’ll update your booking as soon as both documents have been reviewed.
        </p>
        <div className="confirmation-receipt">
          <span>Receipt number</span>
          <strong>RCPT-20261005-00001</strong>
        </div>
        <span className="waiting-chip">
          <i />
          Waiting for warden to verify your documents
        </span>
        <PrimaryButton onClick={onTrack}>Track my booking</PrimaryButton>
      </section>
    </main>
  );
}

const bookingDocuments: BookingDocument[] = [
  {
    doc_id: 1,
    doc_type: "PAYMENT_RECEIPT",
    file_name: "hostel-fee-receipt.pdf",
    verification_status: "Pending",
    remarks: "",
  },
  {
    doc_id: 2,
    doc_type: "ALLOTMENT_FORM",
    file_name: "hostel-allotment-form.pdf",
    verification_status: "Pending",
    remarks: "",
  },
];

function StatusTracker({ state }: { state: BookingState }) {
  const steps = ["Profile", "Roommate Preferences", "Choose Room", "Documents", "Warden Approval"];
  const current = state === "Approved" ? 5 : 4;
  return (
    <section className="status-tracker">
      <div className="status-progress">
        <span style={{ width: `${current * 20}%` }} />
      </div>
      <div className="status-steps">
        {steps.map((step, index) => (
          <div className={index + 1 < current ? "done" : index + 1 === current ? "current" : ""} key={step}>
            <span>{index + 1 < current ? <Icon name="check" size={13} /> : index + 1}</span>
            <strong>{step}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function MatchRing({ score }: { score: number }) {
  return (
    <span
      className="match-ring"
      style={{ "--match": `${score * 3.6}deg` } as React.CSSProperties}
    >
      <i>{score}%</i>
    </span>
  );
}

function BookingStatus() {
  const [state, setState] = useState<BookingState>("Pending");
  const documents: BookingDocument[] = bookingDocuments.map((document, index) => {
    if (state === "Approved") return { ...document, verification_status: "Verified" };
    if (state === "Rejected" && index === 0)
      return { ...document, verification_status: "Verified" };
    if (state === "Rejected" && index === 1)
      return {
        ...document,
        verification_status: "Rejected",
        remarks: "The student signature is missing on page 2. Please sign and upload again.",
      };
    return document;
  });

  return (
    <main className="page-shell booking-status-page">
      <section className="page-heading status-heading">
        <div>
          <p className="eyebrow">BOOKING RCPT-20261005-00001</p>
          <h1>Booking status</h1>
          <p>Track your room and document verification in one place.</p>
        </div>
        <span className={`booking-state ${state.toLowerCase()}`}>{state}</span>
      </section>

      <div className="prototype-state">
        <span>Prototype state</span>
        {(["Pending", "Approved", "Rejected", "Expired"] as BookingState[]).map((item) => (
          <button className={state === item ? "active" : ""} onClick={() => setState(item)} key={item}>
            {item}
          </button>
        ))}
      </div>

      <StatusTracker state={state} />

      {state === "Rejected" && (
        <div className="state-message rejected">
          <Icon name="alert" size={20} />
          <div>
            <strong>Your documents need attention</strong>
            <p>Review the warden’s remark and re-upload the rejected document.</p>
          </div>
        </div>
      )}
      {state === "Expired" && (
        <div className="state-message expired">
          <Icon name="clock" size={20} />
          <div>
            <strong>This booking has expired</strong>
            <p>The payment or document deadline passed. Start a new room selection to continue.</p>
          </div>
        </div>
      )}

      <div className="status-content-grid">
        <section className="booking-detail-card">
          <div className="status-card-heading">
            <span className="stat-icon orange">
              <Icon name="bed" size={23} />
            </span>
            <div>
              <p className="card-label">YOUR SELECTION</p>
              <h2>Room details</h2>
            </div>
          </div>
          <dl className="booking-details">
            <div><dt>Hostel</dt><dd>Boys Hostel A</dd></div>
            <div><dt>Floor</dt><dd>Floor 1</dd></div>
            <div><dt>Room</dt><dd>101 • Quad AC</dd></div>
            <div><dt>Bed</dt><dd>Bed 1</dd></div>
            <div><dt>Level</dt><dd>Lower</dd></div>
            <div><dt>Window</dt><dd>Yes</dd></div>
          </dl>
        </section>

        <section className="documents-status-card">
          <div className="status-card-heading">
            <span className="stat-icon purple">
              <Icon name="clipboard" size={23} />
            </span>
            <div>
              <p className="card-label">VERIFICATION</p>
              <h2>Documents</h2>
            </div>
          </div>
          <div className="status-documents">
            {documents.map((document) => (
              <div className="status-document" key={document.doc_id}>
                <span className="file-square"><Icon name="file" size={20} /></span>
                <div>
                  <strong>
                    {document.doc_type === "PAYMENT_RECEIPT"
                      ? "Hostel fee payment receipt"
                      : "Hostel allotment form"}
                  </strong>
                  <p>{document.file_name}</p>
                  {document.verification_status === "Rejected" && (
                    <div className="warden-remark">
                      <b>Warden’s remark</b>
                      <span>{document.remarks}</span>
                    </div>
                  )}
                </div>
                <div className="document-actions">
                  <span className={`document-chip ${document.verification_status.toLowerCase()}`}>
                    {document.verification_status}
                  </span>
                  {document.verification_status === "Rejected" && (
                    <button>Re-upload</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {state === "Approved" && (
        <section className="roommates-section">
          <div className="roommates-heading">
            <div>
              <p className="card-label">ROOM 101</p>
              <h2>Your roommates</h2>
            </div>
            <span>Booking approved</span>
          </div>
          <div className="roommate-grid">
            {[
              { name: "Arjun Mehta", course: "B.Tech CSE", bed: "Bed 2 • Upper", score: 90 },
              { name: "Kabir Sharma", course: "B.Tech AI", bed: "Bed 3 • Lower", score: 84 },
              { name: "Dev Malhotra", course: "B.Des", bed: "Bed 4 • Upper", score: 76 },
            ].map((roommate) => (
              <article className="roommate-card" key={roommate.name}>
                <span className="roommate-avatar">
                  {roommate.name.split(" ").map((part) => part[0]).join("")}
                </span>
                <div>
                  <h3>{roommate.name}</h3>
                  <p>{roommate.course}</p>
                  <span>{roommate.bed}</span>
                </div>
                <MatchRing score={roommate.score} />
              </article>
            ))}
          </div>
        </section>
      )}

      {state === "Pending" && <button className="cancel-booking">Cancel booking</button>}
    </main>
  );
}

const wardenBookings: WardenBooking[] = [
  {
    booking_id: "BKG-2026-0105",
    student_name: "Rohan Sharma",
    course: "B.Tech CSE",
    floor_number: 1,
    room_number: "101",
    bed_number: 1,
    bed_level: "Lower",
    near_window: true,
    total_amount: 96750,
    docs_uploaded: 2,
    docs_verified: 1,
    status: "Pending",
  },
  {
    booking_id: "BKG-2026-0112",
    student_name: "Aarav Mehta",
    course: "B.Tech AI",
    floor_number: 3,
    room_number: "307",
    bed_number: 2,
    bed_level: "Upper",
    near_window: false,
    total_amount: 84250,
    docs_uploaded: 2,
    docs_verified: 2,
    status: "Pending",
  },
  {
    booking_id: "BKG-2026-0118",
    student_name: "Vihaan Gupta",
    course: "BBA",
    floor_number: 5,
    room_number: "514",
    bed_number: 1,
    bed_level: "Single",
    near_window: true,
    total_amount: 96750,
    docs_uploaded: 2,
    docs_verified: 0,
    status: "Pending",
  },
  {
    booking_id: "BKG-2026-0124",
    student_name: "Aditya Kapoor",
    course: "B.Des",
    floor_number: 8,
    room_number: "806",
    bed_number: 4,
    bed_level: "Upper",
    near_window: false,
    total_amount: 84250,
    docs_uploaded: 2,
    docs_verified: 1,
    status: "Pending",
  },
];

const occupancyByFloor = [
  { floor: 1, booked: 48, progress: 10, available: 18, blocked: 4 },
  { floor: 2, booked: 44, progress: 8, available: 24, blocked: 4 },
  { floor: 3, booked: 52, progress: 9, available: 16, blocked: 3 },
  { floor: 4, booked: 39, progress: 12, available: 26, blocked: 3 },
  { floor: 5, booked: 46, progress: 7, available: 22, blocked: 5 },
  { floor: 6, booked: 35, progress: 11, available: 30, blocked: 4 },
  { floor: 7, booked: 41, progress: 9, available: 27, blocked: 3 },
  { floor: 8, booked: 29, progress: 8, available: 39, blocked: 4 },
];

function WardenDashboard({ onOpen }: { onOpen: (booking: WardenBooking) => void }) {
  const [search, setSearch] = useState("");
  const [blockFloor, setBlockFloor] = useState("1");
  const [blockRoom, setBlockRoom] = useState("101");
  const [blockBed, setBlockBed] = useState("1");
  const [blocked, setBlocked] = useState(false);
  const filteredBookings = wardenBookings.filter((booking) =>
    `${booking.student_name} ${booking.course} ${booking.room_number} ${booking.booking_id}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const wardenStats = [
    { label: "Pending requests", value: "12", icon: "clipboard", theme: "orange" },
    { label: "Approved", value: "186", icon: "circleCheck", theme: "green" },
    { label: "Free beds", value: "480", icon: "bed", theme: "purple" },
    { label: "Blocked beds", value: "30", icon: "alert", theme: "red" },
  ];

  return (
    <main className="page-shell warden-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">WARDEN VIEW • BOYS HOSTEL A</p>
          <h1>Good morning, Mr. Verma</h1>
          <p>Review bookings, verify documents, and manage hostel occupancy.</p>
        </div>
        <span className="session-pill"><span />Admissions active</span>
      </section>

      <section className="stats-grid warden-stats" aria-label="Hostel overview">
        {wardenStats.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <div className={`stat-icon ${stat.theme}`}><Icon name={stat.icon} size={24} /></div>
            <div className="warden-stat-copy">
              <p>{stat.label}</p>
              <strong>{stat.value}</strong>
            </div>
            <div className="mini-progress"><span /></div>
            <small>Updated just now</small>
          </article>
        ))}
      </section>

      <section className="pending-bookings-section">
        <div className="warden-section-heading">
          <div>
            <p className="card-label">REQUIRES ATTENTION</p>
            <h2>Pending bookings</h2>
          </div>
          <span>{filteredBookings.length} shown</span>
        </div>
        <div className="warden-search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search student, course, room, or booking ID..."
          />
        </div>
        <div className="warden-booking-list">
          {filteredBookings.map((booking) => (
            <button
              className="warden-booking-card"
              onClick={() => onOpen(booking)}
              key={booking.booking_id}
            >
              <span className="student-initials">
                {booking.student_name.split(" ").map((name) => name[0]).join("")}
              </span>
              <div className="booking-student">
                <span>{booking.booking_id}</span>
                <h3>{booking.student_name}</h3>
                <p>{booking.course}</p>
              </div>
              <div className="booking-location">
                <small>ALLOTMENT</small>
                <strong>
                  Floor {booking.floor_number} • Room {booking.room_number} • Bed{" "}
                  {booking.bed_number}
                </strong>
                <span>{booking.bed_level} level</span>
              </div>
              <div className="booking-card-chips">
                {booking.near_window && <span className="window-chip"><Icon name="sun" size={13} />Window</span>}
                <span className={`docs-chip ${booking.docs_verified === 2 ? "complete" : ""}`}>
                  Docs {booking.docs_verified}/{booking.docs_uploaded} verified
                </span>
              </div>
              <span className="booking-chevron"><Icon name="chevron" size={19} /></span>
            </button>
          ))}
          {filteredBookings.length === 0 && (
            <EmptyState
              title="No matching bookings"
              message="Try another student name, course, room, or booking ID."
            />
          )}
        </div>
      </section>

      <div className="warden-tools-grid">
        <section className="occupancy-card">
          <div className="warden-section-heading">
            <div>
              <p className="card-label">LIVE CAPACITY</p>
              <h2>Occupancy by floor</h2>
            </div>
          </div>
          <div className="occupancy-legend">
            <span><i className="booked" />Booked</span>
            <span><i className="progress" />In progress</span>
            <span><i className="available" />Available</span>
            <span><i className="blocked" />Blocked</span>
          </div>
          <div className="floor-bars">
            {occupancyByFloor.map((item) => {
              const total = item.booked + item.progress + item.available + item.blocked;
              return (
                <div className="floor-bar-row" key={item.floor}>
                  <strong>F{item.floor}</strong>
                  <div className="stacked-bar">
                    <span className="booked" style={{ width: `${(item.booked / total) * 100}%` }} />
                    <span className="progress" style={{ width: `${(item.progress / total) * 100}%` }} />
                    <span className="available" style={{ width: `${(item.available / total) * 100}%` }} />
                    <span className="blocked" style={{ width: `${(item.blocked / total) * 100}%` }} />
                  </div>
                  <small>{item.available} free</small>
                </div>
              );
            })}
          </div>
        </section>

        <section className="block-bed-card">
          <div className="warden-section-heading">
            <div>
              <p className="card-label">BED CONTROL</p>
              <h2>Block a bed</h2>
            </div>
          </div>
          <p>Blocked beds cannot be selected by students.</p>
          <div className="block-selects">
            <label>
              <span>Floor</span>
              <select value={blockFloor} onChange={(event) => setBlockFloor(event.target.value)}>
                {floors.map((floor) => <option key={floor.floor_id}>{floor.floor_number}</option>)}
              </select>
            </label>
            <label>
              <span>Room</span>
              <select value={blockRoom} onChange={(event) => setBlockRoom(event.target.value)}>
                {rooms.slice(0, 10).map((room) => <option key={room.room_id}>{room.room_number}</option>)}
              </select>
            </label>
            <label>
              <span>Bed</span>
              <select value={blockBed} onChange={(event) => setBlockBed(event.target.value)}>
                {[1, 2, 3, 4].map((bed) => <option key={bed}>{bed}</option>)}
              </select>
            </label>
          </div>
          <label className="block-toggle-row">
            <div>
              <strong>Bed {blockBed}, Room {blockRoom}</strong>
              <small>{blocked ? "Currently blocked" : "Currently available"}</small>
            </div>
            <input type="checkbox" checked={blocked} onChange={(event) => setBlocked(event.target.checked)} />
            <span className="toggle" aria-hidden="true"><span /></span>
          </label>
        </section>
      </div>
    </main>
  );
}

const freeBedOptions = [
  { id: "1-104-2", label: "Floor 1 • Room 104 • Bed 2", price: 84250 },
  { id: "2-211-1", label: "Floor 2 • Room 211 • Bed 1", price: 86750 },
  { id: "3-307-3", label: "Floor 3 • Room 307 • Bed 3", price: 96750 },
  { id: "8-806-4", label: "Floor 8 • Room 806 • Bed 4", price: 94250 },
];

function DocumentReviewCard({
  title,
  fileName,
  status,
  onStatus,
}: {
  title: string;
  fileName: string;
  status: DocumentStatus;
  onStatus: (status: DocumentStatus) => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <article className="review-document-card">
      <div className="review-document-header">
        <div>
          <h3>{title}</h3>
          <p>{fileName}</p>
        </div>
        <span className={`document-chip ${status.toLowerCase()}`}>{status}</span>
      </div>
      <div className="document-preview">
        <div className="preview-page">
          <span className="preview-logo">JKLU</span>
          <strong>{title}</strong>
          <i />
          <i />
          <i />
          <i className="short" />
          <em>Uploaded copy</em>
        </div>
      </div>
      <div className="document-review-actions">
        <button className="open-document"><Icon name="file" size={15} />Open full size</button>
        <div>
          <button className="verify-document" onClick={() => { onStatus("Verified"); setRejecting(false); }}>
            <Icon name="check" size={14} />Verify
          </button>
          <button className="reject-document" onClick={() => setRejecting(true)}>
            Reject
          </button>
        </div>
      </div>
      {rejecting && (
        <div className="document-reason">
          <label htmlFor={`${fileName}-reason`}>Reason for rejection</label>
          <textarea
            id={`${fileName}-reason`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Explain what the student needs to correct..."
          />
          <div>
            <button onClick={() => setRejecting(false)}>Cancel</button>
            <button
              disabled={!reason.trim()}
              onClick={() => { onStatus("Rejected"); setRejecting(false); }}
            >
              Confirm rejection
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function WardenBookingDetail({
  booking,
  onBack,
}: {
  booking: WardenBooking;
  onBack: () => void;
}) {
  const [documentStatuses, setDocumentStatuses] = useState<[DocumentStatus, DocumentStatus]>([
    booking.docs_verified > 0 ? "Verified" : "Pending",
    booking.docs_verified > 1 ? "Verified" : "Pending",
  ]);
  const [showBookingReject, setShowBookingReject] = useState(false);
  const [bookingRemark, setBookingRemark] = useState("");
  const [showReassign, setShowReassign] = useState(false);
  const [replacementBed, setReplacementBed] = useState(freeBedOptions[0].id);
  const bothVerified = documentStatuses.every((status) => status === "Verified");
  const calculatedTotal = feeItems.reduce((sum, item) => sum + item.amount, 0);
  const claimedAmount = booking.booking_id === "BKG-2026-0118"
    ? booking.total_amount - 10000
    : booking.total_amount;
  const amountMatches = calculatedTotal === claimedAmount;
  const replacement = freeBedOptions.find((bed) => bed.id === replacementBed)!;
  const priceDifference = replacement.price - booking.total_amount;

  const setDocumentStatus = (index: number, status: DocumentStatus) => {
    setDocumentStatuses((current) => {
      const next = [...current] as [DocumentStatus, DocumentStatus];
      next[index] = status;
      return next;
    });
  };

  return (
    <main className="page-shell warden-detail-page">
      <button className="back-button" onClick={onBack}>
        <span>‹</span>Back to pending bookings
      </button>
      <section className="page-heading warden-detail-heading">
        <div>
          <p className="eyebrow">WARDEN REVIEW • {booking.booking_id}</p>
          <h1>{booking.student_name}</h1>
          <p>
            {booking.course} • Floor {booking.floor_number}, Room {booking.room_number}, Bed{" "}
            {booking.bed_number}
          </p>
        </div>
        <span className="booking-state pending">{booking.status}</span>
      </section>

      <section className="warden-detail-section student-review">
        <div className="numbered-heading">
          <span>01</span>
          <div><p className="card-label">STUDENT</p><h2>Profile & preferences</h2></div>
        </div>
        <div className="student-review-grid">
          <div className="review-student-profile">
            <span className="student-initials large">
              {booking.student_name.split(" ").map((name) => name[0]).join("")}
            </span>
            <div>
              <h3>{booking.student_name}</h3>
              <p>{booking.course}</p>
              <span>{booking.booking_id}</span>
            </div>
          </div>
          <div className="preference-summary">
            <div><span>Sleep schedule</span><strong>Flexible</strong></div>
            <div><span>Cleanliness</span><strong>Average</strong></div>
            <div><span>Study style</span><strong>Quiet</strong></div>
          </div>
          <div className="review-hobbies">
            <span>Hobbies</span>
            <div><i>Coding</i><i>Music</i><i>Cricket</i><i>Reading</i></div>
          </div>
        </div>
      </section>

      <section className="warden-detail-section payment-review">
        <div className="numbered-heading">
          <span>02</span>
          <div><p className="card-label">PAYMENT CHECK</p><h2>Receipt vs student claim</h2></div>
        </div>
        <div className="payment-comparison">
          <div className="system-receipt">
            <p className="comparison-label">SYSTEM CALCULATION</p>
            {feeItems.map((item) => (
              <div key={item.item_type}>
                <span>{item.description}</span><strong>{formatMoney(item.amount)}</strong>
              </div>
            ))}
            <div className="comparison-total"><span>Calculated total</span><strong>{formatMoney(calculatedTotal)}</strong></div>
          </div>
          <div className="student-claim">
            <p className="comparison-label">STUDENT’S CLAIM</p>
            <dl>
              <div><dt>Payment mode</dt><dd>UPI</dd></div>
              <div><dt>Reference number</dt><dd>UTR9081726354</dd></div>
              <div><dt>Amount paid</dt><dd>{formatMoney(claimedAmount)}</dd></div>
            </dl>
            <span className={`amount-match ${amountMatches ? "" : "mismatch"}`}>
              <Icon name={amountMatches ? "circleCheck" : "alert"} size={17} />
              {amountMatches ? "Amount matches" : "Amount does not match"}
            </span>
          </div>
        </div>
      </section>

      <section className="warden-detail-section documents-review">
        <div className="numbered-heading">
          <span>03</span>
          <div><p className="card-label">DOCUMENTS</p><h2>Verify uploaded files</h2></div>
        </div>
        <div className="review-documents-grid">
          <DocumentReviewCard
            title="Hostel fee payment receipt"
            fileName="hostel-fee-receipt.pdf"
            status={documentStatuses[0]}
            onStatus={(status) => setDocumentStatus(0, status)}
          />
          <DocumentReviewCard
            title="Hostel allotment form"
            fileName="hostel-allotment-form.pdf"
            status={documentStatuses[1]}
            onStatus={(status) => setDocumentStatus(1, status)}
          />
        </div>
      </section>

      {showBookingReject && (
        <section className="booking-action-panel reject-panel">
          <div>
            <h3>Reject this booking</h3>
            <p>The student will see this remark in their booking status.</p>
          </div>
          <textarea
            value={bookingRemark}
            onChange={(event) => setBookingRemark(event.target.value)}
            placeholder="Required rejection remark..."
          />
          <button disabled={!bookingRemark.trim()}>Confirm booking rejection</button>
        </section>
      )}

      {showReassign && (
        <section className="booking-action-panel reassign-panel">
          <div>
            <h3>Reassign to a free bed</h3>
            <p>Choose another available bed before confirming.</p>
          </div>
          <select value={replacementBed} onChange={(event) => setReplacementBed(event.target.value)}>
            {freeBedOptions.map((bed) => (
              <option value={bed.id} key={bed.id}>{bed.label} • {formatMoney(bed.price)}</option>
            ))}
          </select>
          <span className={`price-change ${priceDifference < 0 ? "refund" : ""}`}>
            {priceDifference > 0
              ? `Student will be charged +${formatMoney(priceDifference)}`
              : priceDifference < 0
                ? `Student will be refunded ${formatMoney(Math.abs(priceDifference))}`
                : "No price adjustment required"}
          </span>
          <button>Confirm reassignment</button>
        </section>
      )}

      <div className="warden-action-bar">
        <div>
          <button className="reject-booking-button" onClick={() => { setShowBookingReject(!showBookingReject); setShowReassign(false); }}>
            Reject booking
          </button>
          <button className="reassign-button" onClick={() => { setShowReassign(!showReassign); setShowBookingReject(false); }}>
            Reassign
          </button>
        </div>
        <div className="approve-action">
          {!bothVerified && <span>Verify both documents to approve</span>}
          <PrimaryButton disabled={!bothVerified}>Approve booking</PrimaryButton>
        </div>
      </div>
    </main>
  );
}

type AdminPage = "overview" | "wardens" | "structure" | "admissions" | "fees";

type WardenRecord = {
  id: number;
  name: string;
  email: string;
  hostel: string;
};

type FeeRow = {
  id: number;
  roomType: "Double" | "Quad";
  ac: boolean;
  bedLevel: "Lower" | "Upper" | "Single";
  hostelFee: number;
  utility: number;
  messAdvance: number;
  securityDeposit: number;
};

const initialWardens: WardenRecord[] = [
  { id: 1, name: "Rajesh Verma", email: "rajesh.verma@jklu.edu.in", hostel: "Boys Hostel A" },
  { id: 2, name: "Amit Joshi", email: "amit.joshi@jklu.edu.in", hostel: "Boys Hostel B" },
  { id: 3, name: "Neha Kapoor", email: "neha.kapoor@jklu.edu.in", hostel: "Girls Hostel A" },
  { id: 4, name: "Priya Menon", email: "priya.menon@jklu.edu.in", hostel: "Girls Hostel B" },
];

const initialFeeRows: FeeRow[] = [
  { id: 1, roomType: "Quad", ac: true, bedLevel: "Lower", hostelFee: 38000, utility: 12500, messAdvance: 31250, securityDeposit: 5000 },
  { id: 2, roomType: "Quad", ac: true, bedLevel: "Upper", hostelFee: 35500, utility: 12500, messAdvance: 31250, securityDeposit: 5000 },
  { id: 3, roomType: "Quad", ac: false, bedLevel: "Lower", hostelFee: 33000, utility: 10000, messAdvance: 31250, securityDeposit: 5000 },
  { id: 4, roomType: "Quad", ac: false, bedLevel: "Upper", hostelFee: 30500, utility: 10000, messAdvance: 31250, securityDeposit: 5000 },
  { id: 5, roomType: "Double", ac: true, bedLevel: "Single", hostelFee: 46000, utility: 12500, messAdvance: 31250, securityDeposit: 5000 },
  { id: 6, roomType: "Double", ac: false, bedLevel: "Single", hostelFee: 41000, utility: 10000, messAdvance: 31250, securityDeposit: 5000 },
];

function AdminOverview() {
  const stats = [
    { label: "Students registered", value: "1,248", note: "1,310 admissions on record", icon: "users", theme: "orange" },
    { label: "Pending bookings", value: "86", note: "Awaiting warden review", icon: "clipboard", theme: "purple" },
    { label: "Approved bookings", value: "702", note: "56% of registered students", icon: "circleCheck", theme: "green" },
    { label: "Money collected", value: "Rs 6.8 Cr", note: "Current academic session", icon: "money", theme: "orange" },
    { label: "Total beds", value: "2,560", note: "Across four hostels", icon: "bed", theme: "red" },
  ];
  const hostelRows = [
    { name: "Boys Hostel A", total: 640, booked: 502, available: 108, blocked: 30 },
    { name: "Boys Hostel B", total: 640, booked: 476, available: 137, blocked: 27 },
    { name: "Girls Hostel A", total: 640, booked: 521, available: 96, blocked: 23 },
    { name: "Girls Hostel B", total: 640, booked: 493, available: 121, blocked: 26 },
  ];

  return (
    <>
      <section className="admin-stats">
        {stats.map((stat) => (
          <article className="stat-card admin-stat-card" key={stat.label}>
            <div className={`stat-icon ${stat.theme}`}><Icon name={stat.icon} size={23} /></div>
            <div className="admin-stat-value"><strong>{stat.value}</strong><p>{stat.label}</p></div>
            <div className="mini-progress"><span /></div>
            <small>{stat.note}</small>
          </article>
        ))}
      </section>
      <section className="admin-card hostel-capacity-card">
        <div className="admin-card-heading">
          <div><p className="card-label">CAPACITY OVERVIEW</p><h2>Hostels</h2></div>
          <span>Academic session 2025–26</span>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table hostel-table">
            <thead><tr><th>Hostel</th><th>Total beds</th><th>Booked</th><th>Available</th><th>Occupancy</th></tr></thead>
            <tbody>
              {hostelRows.map((hostel) => {
                const percentage = Math.round((hostel.booked / hostel.total) * 100);
                return (
                  <tr key={hostel.name}>
                    <td><strong>{hostel.name}</strong><span>{hostel.blocked} beds blocked</span></td>
                    <td>{hostel.total}</td>
                    <td>{hostel.booked}</td>
                    <td><b>{hostel.available}</b></td>
                    <td>
                      <div className="table-progress"><span style={{ width: `${percentage}%` }} /></div>
                      <small>{percentage}%</small>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function WardensAdmin() {
  const [wardens, setWardens] = useState(initialWardens);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [hostel, setHostel] = useState("Boys Hostel A");
  const [removeTarget, setRemoveTarget] = useState<WardenRecord | null>(null);

  const addWarden = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setWardens((current) => [...current, { id: Date.now(), name, email, hostel }]);
    setName("");
    setEmail("");
  };

  return (
    <div className="admin-split-page">
      <section className="admin-card warden-admin-list">
        <div className="admin-card-heading">
          <div><p className="card-label">ACCESS CONTROL</p><h2>Wardens</h2></div>
          <span>{wardens.length} active</span>
        </div>
        <div className="warden-admin-rows">
          {wardens.map((warden) => (
            <div className="warden-admin-row" key={warden.id}>
              <span className="student-initials">{warden.name.split(" ").map((part) => part[0]).join("")}</span>
              <div><strong>{warden.name}</strong><p>{warden.email}</p></div>
              <span className="warden-hostel">{warden.hostel}</span>
              <button onClick={() => setRemoveTarget(warden)}><Icon name="trash" size={16} />Remove</button>
            </div>
          ))}
          {wardens.length === 0 && (
            <EmptyState
              title="No wardens assigned"
              message="Add a warden to give them access to a hostel."
            />
          )}
        </div>
      </section>
      <section className="admin-card add-warden-card">
        <div className="admin-card-heading"><div><p className="card-label">NEW ACCOUNT</p><h2>Add warden</h2></div></div>
        <form onSubmit={addWarden}>
          <label className="plain-field"><span>Full name</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Warden’s name" required /></label>
          <label className="plain-field"><span>Official email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@jklu.edu.in" required /></label>
          <label className="select-field"><span>Assigned hostel</span><select value={hostel} onChange={(event) => setHostel(event.target.value)}>{hostels.map((item) => <option key={item.hostel_id}>{item.hostel_name}</option>)}</select></label>
          <PrimaryButton type="submit">Add warden</PrimaryButton>
        </form>
      </section>
      {removeTarget && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm-dialog">
            <span className="confirm-icon"><Icon name="trash" size={24} /></span>
            <h2>Remove {removeTarget.name}?</h2>
            <p>They will immediately lose access to {removeTarget.hostel}. This action cannot be undone.</p>
            <div><button onClick={() => setRemoveTarget(null)}>Keep warden</button><button onClick={() => { setWardens((current) => current.filter((warden) => warden.id !== removeTarget.id)); setRemoveTarget(null); }}>Remove access</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function StructureAdmin() {
  const [hostelList, setHostelList] = useState(
    hostels.map((item) => ({ name: item.hostel_name, gender: item.gender })),
  );
  const [hostelName, setHostelName] = useState("");
  const [hostelGender, setHostelGender] = useState("Male");
  const [floorHostel, setFloorHostel] = useState(hostelList[0].name);
  const [floorNumber, setFloorNumber] = useState("9");
  const [floorType, setFloorType] = useState("Regular");
  const [roomHostel, setRoomHostel] = useState(hostelList[0].name);
  const [roomFloor, setRoomFloor] = useState("1");
  const [roomNumber, setRoomNumber] = useState("");
  const [roomType, setRoomType] = useState("Double");
  const [roomAc, setRoomAc] = useState(true);
  const [notice, setNotice] = useState("");

  const finish = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };

  return (
    <>
      <section className="admin-card structure-hostels">
        <div className="admin-card-heading"><div><p className="card-label">CURRENT STRUCTURE</p><h2>Hostels</h2></div><span>{hostelList.length} buildings</span></div>
        <div className="structure-hostel-grid">
          {hostelList.map((hostel) => (
            <article key={hostel.name}><span className="stat-icon orange"><Icon name="building" size={22} /></span><div><h3>{hostel.name}</h3><p>8 floors • 640 beds</p></div><strong>{hostel.gender}</strong></article>
          ))}
        </div>
      </section>
      <div className="structure-forms">
        <form className="admin-card structure-form" onSubmit={(event) => { event.preventDefault(); if (!hostelName.trim()) return; setHostelList((current) => [...current, { name: hostelName, gender: hostelGender }]); setHostelName(""); finish("Hostel added successfully."); }}>
          <div className="structure-form-number">01</div><h2>Add hostel</h2>
          <label className="plain-field"><span>Hostel name</span><input value={hostelName} onChange={(event) => setHostelName(event.target.value)} placeholder="e.g. Boys Hostel C" required /></label>
          <label className="select-field"><span>Gender</span><select value={hostelGender} onChange={(event) => setHostelGender(event.target.value)}><option>Male</option><option>Female</option></select></label>
          <button type="submit"><Icon name="plus" size={15} />Add hostel</button>
        </form>
        <form className="admin-card structure-form" onSubmit={(event) => { event.preventDefault(); finish(`Floor ${floorNumber} added to ${floorHostel}.`); }}>
          <div className="structure-form-number">02</div><h2>Add floor</h2>
          <label className="select-field"><span>Hostel</span><select value={floorHostel} onChange={(event) => setFloorHostel(event.target.value)}>{hostelList.map((hostel) => <option key={hostel.name}>{hostel.name}</option>)}</select></label>
          <div className="inline-form-fields"><label className="plain-field"><span>Floor number</span><input type="number" value={floorNumber} onChange={(event) => setFloorNumber(event.target.value)} /></label><label className="select-field"><span>Floor type</span><select value={floorType} onChange={(event) => setFloorType(event.target.value)}><option>Regular</option><option>Quiet</option></select></label></div>
          <button type="submit"><Icon name="plus" size={15} />Add floor</button>
        </form>
        <form className="admin-card structure-form" onSubmit={(event) => { event.preventDefault(); if (!roomNumber.trim()) return; finish(`Room ${roomNumber} added. Beds created automatically.`); }}>
          <div className="structure-form-number">03</div><h2>Add room</h2>
          <label className="select-field"><span>Hostel</span><select value={roomHostel} onChange={(event) => setRoomHostel(event.target.value)}>{hostelList.map((hostel) => <option key={hostel.name}>{hostel.name}</option>)}</select></label>
          <div className="inline-form-fields"><label className="select-field"><span>Floor</span><select value={roomFloor} onChange={(event) => setRoomFloor(event.target.value)}>{[1,2,3,4,5,6,7,8].map((floor) => <option key={floor}>{floor}</option>)}</select></label><label className="plain-field"><span>Room number</span><input value={roomNumber} onChange={(event) => setRoomNumber(event.target.value)} placeholder="e.g. 121" required /></label></div>
          <div className="inline-form-fields"><label className="select-field"><span>Room type</span><select value={roomType} onChange={(event) => setRoomType(event.target.value)}><option>Double</option><option>Quad</option></select></label><label className="compact-toggle"><span><strong>Air conditioned</strong><small>{roomAc ? "AC room" : "Non-AC room"}</small></span><input type="checkbox" checked={roomAc} onChange={(event) => setRoomAc(event.target.checked)} /><i><b /></i></label></div>
          <p className="auto-bed-note"><Icon name="circleCheck" size={14} />Beds are created automatically based on room type.</p>
          <button type="submit"><Icon name="plus" size={15} />Add room</button>
        </form>
      </div>
      {notice && <div className="admin-toast"><Icon name="circleCheck" size={17} />{notice}</div>}
    </>
  );
}

type AdmissionRow = {
  admission_no: string;
  name: string;
  email: string;
  phone: string;
  course: string;
  gender: string;
};

const sampleAdmissions: AdmissionRow[] = [
  { admission_no: "2025/BT/0142", name: "Rohan Sharma", email: "rohan.sharma@example.com", phone: "9876543210", course: "B.Tech CSE", gender: "Male" },
  { admission_no: "2025/BD/0087", name: "Ananya Mehta", email: "ananya.mehta@example.com", phone: "9823456710", course: "B.Des", gender: "Female" },
  { admission_no: "2025/BB/0054", name: "Kabir Singh", email: "kabir.singh@example.com", phone: "9765432108", course: "BBA", gender: "Male" },
];

function AdmissionsAdmin() {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<AdmissionRow[]>(sampleAdmissions);
  const [error, setError] = useState("");

  const parseCsv = async (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) { setError("Please upload a CSV file."); return; }
    const text = await file.text();
    const lines = text.trim().split(/\r?\n/);
    const headers = lines[0]?.split(",").map((header) => header.trim());
    const required = ["admission_no", "name", "email", "phone", "course", "gender"];
    if (!required.every((field) => headers?.includes(field))) { setError(`CSV must include: ${required.join(", ")}`); return; }
    const parsed = lines.slice(1).filter(Boolean).map((line) => {
      const values = line.split(",").map((value) => value.trim());
      return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])) as AdmissionRow;
    });
    setRows(parsed);
    setFileName(file.name);
    setError("");
  };

  return (
    <section className="admin-card admissions-import">
      <div className="admin-card-heading"><div><p className="card-label">BULK IMPORT</p><h2>Admissions records</h2></div><span>{rows.length} records in preview</span></div>
      <div className="csv-columns"><strong>Required columns</strong>{["admission_no", "name", "email", "phone", "course", "gender"].map((column) => <span key={column}>{column}</span>)}</div>
      <label
        className={`csv-drop-zone ${fileName ? "uploaded" : ""}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => { event.preventDefault(); parseCsv(event.dataTransfer.files[0]); }}
      >
        <input type="file" accept=".csv,text/csv" onChange={(event) => parseCsv(event.target.files?.[0])} />
        <span><Icon name={fileName ? "circleCheck" : "upload"} size={27} /></span>
        <strong>{fileName || "Drop admissions CSV here or browse"}</strong>
        <p>{fileName ? `${rows.length} records ready to import` : "CSV files only • First row must contain column headers"}</p>
      </label>
      {error && <ErrorToast message={error} onClose={() => setError("")} />}
      <div className="preview-heading"><div><p className="card-label">DATA CHECK</p><h3>Preview</h3></div>{fileName && <button>Import {rows.length} records</button>}</div>
      <div className="admin-table-wrap">
        <table className="admin-table admissions-table">
          <thead><tr><th>Admission no.</th><th>Name</th><th>Email</th><th>Phone</th><th>Course</th><th>Gender</th></tr></thead>
          <tbody>{rows.slice(0, 8).map((row, index) => <tr key={`${row.admission_no}-${index}`}><td><strong>{row.admission_no}</strong></td><td>{row.name}</td><td>{row.email}</td><td>{row.phone}</td><td>{row.course}</td><td><span className="gender-chip">{row.gender}</span></td></tr>)}</tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <EmptyState
          title="No admission records"
          message="Upload a CSV file containing at least one student record."
        />
      )}
    </section>
  );
}

function FeesAdmin() {
  const [rows, setRows] = useState(initialFeeRows);
  const updateFee = (id: number, field: keyof FeeRow, value: string | number | boolean) => {
    setRows((current) => current.map((row) => row.id === id ? { ...row, [field]: value } : row));
  };

  return (
    <>
      <section className="admin-card fees-admin-card">
        <div className="admin-card-heading"><div><p className="card-label">ACADEMIC SESSION 2025–26</p><h2>Hostel fee matrix</h2></div><button className="save-fees">Save changes</button></div>
        <div className="admin-table-wrap">
          <table className="admin-table fees-table">
            <thead><tr><th>Room type</th><th>AC</th><th>Bed level</th><th>Hostel fee</th><th>Utility</th><th>Mess advance</th><th>Security</th><th>Computed total</th></tr></thead>
            <tbody>
              {rows.map((row) => {
                const total = row.hostelFee + row.utility + row.messAdvance + row.securityDeposit;
                return (
                  <tr key={row.id}>
                    <td><select value={row.roomType} onChange={(event) => updateFee(row.id, "roomType", event.target.value)}><option>Double</option><option>Quad</option></select></td>
                    <td><label className="table-toggle"><input type="checkbox" checked={row.ac} onChange={(event) => updateFee(row.id, "ac", event.target.checked)} /><span>{row.ac ? "AC" : "Non-AC"}</span></label></td>
                    <td><select value={row.bedLevel} onChange={(event) => updateFee(row.id, "bedLevel", event.target.value)}><option>Lower</option><option>Upper</option><option>Single</option></select></td>
                    {(["hostelFee", "utility", "messAdvance", "securityDeposit"] as const).map((field) => <td key={field}><div className="fee-input"><span>Rs</span><input type="number" value={row[field]} onChange={(event) => updateFee(row.id, field, Number(event.target.value))} /></div></td>)}
                    <td><strong>{formatMoney(total)}</strong></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section className="admin-card extra-charges-card">
        <div className="admin-card-heading"><div><p className="card-label">OPTIONAL ADD-ONS</p><h2>Extra charges</h2></div></div>
        <div className="extra-charge-grid">
          <article><span className="stat-icon orange"><Icon name="sun" size={22} /></span><div><p>Window-side bed</p><strong>Rs 10,000</strong><small>Per academic year</small></div></article>
          <article><span className="stat-icon purple"><Icon name="building" size={22} /></span><div><p>Transport • Per semester</p><strong>Rs 26,250</strong><small>Optional</small></div></article>
          <article><span className="stat-icon green"><Icon name="building" size={22} /></span><div><p>Transport • Yearly</p><strong>Rs 52,500</strong><small>Optional</small></div></article>
        </div>
      </section>
    </>
  );
}

function AdminView() {
  const [page, setPage] = useState<AdminPage>("overview");
  const pages: { id: AdminPage; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "wardens", label: "Wardens" },
    { id: "structure", label: "Structure" },
    { id: "admissions", label: "Admissions import" },
    { id: "fees", label: "Fees" },
  ];

  return (
    <main className="page-shell admin-page">
      <section className="page-heading admin-heading">
        <div><p className="eyebrow">ADMIN VIEW</p><h1>Hostel administration</h1><p>Manage capacity, staff, admissions, and fees across JKLU hostels.</p></div>
        <span className="session-pill"><span />System operational</span>
      </section>
      <nav className="admin-tabs" aria-label="Admin sections">
        {pages.map((item) => <button className={page === item.id ? "active" : ""} onClick={() => setPage(item.id)} key={item.id}>{item.label}</button>)}
      </nav>
      <div className="admin-page-content" key={page}>
        {page === "overview" && <AdminOverview />}
        {page === "wardens" && <WardensAdmin />}
        {page === "structure" && <StructureAdmin />}
        {page === "admissions" && <AdmissionsAdmin />}
        {page === "fees" && <FeesAdmin />}
      </div>
    </main>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [role, setRole] = useState<UserRole | null>(() => {
    const user = getUser();
    return user ? user.role : null;
  });
  const [currentUser, setCurrentUser] = useState<any>(() => getUser());
  const [isLoading, setIsLoading] = useState(false);
  const [wardenBooking, setWardenBooking] = useState<WardenBooking | null>(null);
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = window.localStorage.getItem("jklu-theme");
    return savedTheme === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("jklu-theme", theme);
  }, [theme]);

  useEffect(() => {
    const user = getUser();
    const token = getToken();
    if (user && token) {
      setRole(user.role);
      setCurrentUser(user);
      setScreen(user.role === "student" ? "home" : user.role === "warden" ? "warden" : "admin");
    }
  }, []);

  const transitionTo = (nextScreen: Screen) => {
    setIsLoading(true);
    window.setTimeout(() => {
      setScreen(nextScreen);
      setIsLoading(false);
    }, 360);
  };

  const navigate = (nextScreen: Screen) => {
    if (nextScreen === "login") {
      removeToken();
      localStorage.removeItem("user");
      setRole(null);
      setCurrentUser(null);
      transitionTo("login");
      return;
    }
    const studentScreens: Screen[] = ["home", "preferences", "choose-room", "fee-receipt", "documents", "submitted", "booking-status"];
    if (role === "student" && studentScreens.includes(nextScreen)) transitionTo(nextScreen);
    if (role === "warden" && ["warden", "warden-booking"].includes(nextScreen)) transitionTo(nextScreen);
    if (role === "admin" && nextScreen === "admin") transitionTo(nextScreen);
  };

  return (
    <div className="app">
      <Header screen={screen} onNavigate={navigate} theme={theme} onToggleTheme={() => setTheme(theme === "light" ? "dark" : "light")} role={role} />
      <div className="screen-transition" key={isLoading ? "loading" : screen}>
        {isLoading && <ScreenSkeleton />}
        {!isLoading && (
          <>
            {screen === "login" && (
              <Login
                onLogin={(nextRole, user) => {
                  setRole(nextRole);
                  setCurrentUser(user);
                  transitionTo(nextRole === "student" ? "home" : nextRole === "warden" ? "warden" : "admin");
                }}
              />
            )}
            {role === "student" && screen === "home" && <Home onContinue={() => transitionTo("preferences")} />}
            {role === "student" && screen === "preferences" && <Preferences onSave={() => transitionTo("choose-room")} />}
            {role === "student" && screen === "choose-room" && <ChooseRoom onHold={() => transitionTo("fee-receipt")} />}
            {role === "student" && screen === "fee-receipt" && <FeeReceipt onNext={() => transitionTo("documents")} />}
            {role === "student" && screen === "documents" && <UploadDocuments onSubmit={() => transitionTo("submitted")} />}
            {role === "student" && screen === "submitted" && <SubmittedConfirmation onTrack={() => transitionTo("booking-status")} />}
            {role === "student" && screen === "booking-status" && <BookingStatus />}
            {role === "warden" && screen === "warden" && <WardenDashboard onOpen={(booking) => { setWardenBooking(booking); transitionTo("warden-booking"); }} />}
            {role === "warden" && screen === "warden-booking" && wardenBooking && <WardenBookingDetail booking={wardenBooking} onBack={() => transitionTo("warden")} />}
            {role === "admin" && screen === "admin" && <AdminView />}
          </>
        )}
      </div>
      <footer>
        <span>JKLU Hostel Booking</span>
        <span>Prototype • 2025–26</span>
      </footer>
    </div>
  );
}