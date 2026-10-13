import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { apiRequest, setToken, setUser, getToken, getUser, removeToken, fetchFileBlobUrl } from "./api";
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
const HOLD_DEFAULT_MINUTES = 30;

type LoginMode = "student" | "staff" | "register";
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
  same_course_count?: number;
};

type BedStatus = "Available" | "Held" | "Pending" | "Booked" | "Blocked";

type Bed = {
  bed_id: number;
  bed_number: number;
  bed_level: "Lower" | "Upper" | "Single";
  near_window: boolean;
  bed_status: BedStatus;
  occupant_name?: string | null;
  occupant_course?: string | null;
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

type BookingState = "Held" | "Pending" | "Approved" | "Rejected" | "Cancelled" | "Expired";

type WardenBooking = {
  booking_id: number;
  receipt_no?: string | null;
  student_name: string;
  course: string;
  floor_number: number;
  room_number: string;
  bed_number: number;
  bed_level: string;
  near_window: boolean;
  room_type?: string;
  is_ac?: boolean;
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
    arrowLeft: <path d="M19 12H5M10 17l-5-5 5-5" />,
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
    bedDown: (
      <>
        <g transform="translate(0 5) scale(0.78)">
          <path d="M3 20v-8M21 20v-6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v3M3 17h18M7 12V8H5a2 2 0 0 0-2 2v4" />
        </g>
        <path d="M20.5 2.5v7M18 7l2.5 2.5L23 7" />
      </>
    ),
    bedUp: (
      <>
        <g transform="translate(0 5) scale(0.78)">
          <path d="M3 20v-8M21 20v-6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v3M3 17h18M7 12V8H5a2 2 0 0 0-2 2v4" />
        </g>
        <path d="M20.5 9.5v-7M18 5l2.5-2.5L23 5" />
      </>
    ),
    speakerOff: (
      <>
        <path d="M11 5 6.5 9H3v6h3.5L11 19z" />
        <path d="m22 9-6 6M16 9l6 6" />
      </>
    ),
    sparkle: (
      <>
        <path d="M11 3l1.9 5.6L18.5 10.5l-5.6 1.9L11 18l-1.9-5.6L3.5 10.5l5.6-1.9z" />
        <path d="M19 16l.8 2.2 2.2.8-2.2.8L19 22l-.8-2.2-2.2-.8 2.2-.8z" />
      </>
    ),
    layers: <path d="M12 3 3 8l9 5 9-5zM3 13l9 5 9-5" />,
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

function PeopleGlyph({ count, size = 16 }: { count: number; size?: number }) {
  const width = count * 11;
  return (
    <svg
      width={(size * width) / 20}
      height={size}
      viewBox={`0 0 ${width} 20`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, index) => (
        <g key={index} transform={`translate(${index * 11} 0)`}>
          <circle cx="5.5" cy="6" r="3" />
          <path d="M0.8 19a4.7 4.7 0 0 1 9.4 0" />
        </g>
      ))}
    </svg>
  );
}

type TagKind = "room" | "ac" | "bed" | "floor";

function TagIcon({ kind, value, size = 16 }: { kind: TagKind; value: string; size?: number }) {
  if (kind === "room") {
    if (value === "Double") return <PeopleGlyph count={2} size={size} />;
    if (value === "Quad") return <PeopleGlyph count={4} size={size} />;
  }
  if (kind === "ac") {
    if (value === "AC") return <Icon name="snowflake" size={size} />;
    if (value === "Non-AC") return <Icon name="sun" size={size} />;
  }
  if (kind === "bed") {
    if (value === "Lower") return <Icon name="bedDown" size={size} />;
    if (value === "Upper") return <Icon name="bedUp" size={size} />;
    if (value === "Single" || value === "Standard") return <Icon name="bed" size={size} />;
  }
  if (kind === "floor") {
    if (value === "Regular") return <Icon name="building" size={size} />;
    if (value === "Quiet") return <Icon name="speakerOff" size={size} />;
  }
  return <Icon name={value === "All" ? "layers" : "sparkle"} size={size} />;
}

function TagLabel({
  kind,
  value,
  text,
  size = 16,
}: {
  kind: TagKind;
  value: string;
  text?: string;
  size?: number;
}) {
  return (
    <span className="tag-label">
      <TagIcon kind={kind} value={value} size={size} />
      <span>{text ?? value}</span>
    </span>
  );
}

function HostelPhoto({ name }: { name: string }) {
  const match = name.match(/(boys|girls)\s+hostel\s+([a-z])/i);
  const specific = match ? `/hostels/${match[1].toLowerCase()}-${match[2].toLowerCase()}.jpg` : null;
  const sources = [specific, "/hostels/hostel.jpg"].filter(Boolean) as string[];
  const [index, setIndex] = useState(0);

  if (index >= sources.length) {
    return (
      <div className="hostel-photo hostel-photo-fallback" role="img" aria-label={`${name} building`}>
        <Icon name="building" size={46} />
      </div>
    );
  }

  return (
    <div className="hostel-photo">
      <img
        src={sources[index]}
        alt={`${name} building exterior`}
        loading="lazy"
        onError={() => setIndex((current) => current + 1)}
      />
    </div>
  );
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
        <nav className="nav-menu" aria-label="Main menu">
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

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="icon-button page-back-button"
      onClick={onClick}
      aria-label="Go back"
      title="Go back"
    >
      <Icon name="arrowLeft" size={22} />
    </button>
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
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register fields
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [courseSelection, setCourseSelection] = useState("");
  const [otherCourse, setOtherCourse] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      if (mode === "register") {
        const finalCourse = courseSelection === "Other" ? otherCourse : courseSelection;
        await apiRequest("/auth/register", "POST", {
          name: name.trim(),
          gender,
          course: finalCourse.trim(),
          admission_no: identifier.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
        });
        setSuccess("You are registered. Sign in to begin.");
        setMode("student");
        setPassword("");
      } else {
        const selectedRole = mode === "student" ? "student" : identifier.toLowerCase().includes("admin") ? "admin" : "warden";
        
        const data = await apiRequest("/auth/login", "POST", {
          role: selectedRole,
          identifier: identifier.trim(),
          password: password,
        });

        setToken(data.token);
        setUser(data.user);
        onLogin(data.user.role, data.user);
      }
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
          <p className="eyebrow">{mode === "staff" ? "STAFF ACCESS" : "STUDENT ACCESS"}</p>
          <h2>{mode === "register" ? "Student sign up" : mode === "student" ? "Student sign in" : "JKLU staff sign in"}</h2>
          <p>{mode === "register" ? "Create your account to book a room." : mode === "student" ? "Enter your admission number to continue." : "Authorised wardens and administrators sign in with official email."}</p>
        </div>

        {success && <div style={{ background: '#dcfce7', color: '#166534', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>{success}</div>}

        <form onSubmit={submit}>
          {mode === "register" && (
            <>
              <label className="field-label" htmlFor="name">Full name</label>
              <div className="input-wrap">
                <Icon name="user" size={20} />
                <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Doe" style={{ paddingLeft: '35px' }} required />
              </div>

              <label className="field-label" htmlFor="gender">Gender</label>
              <div className="input-wrap">
                <Icon name="user" size={20} />
                <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', paddingLeft: '35px' }} required>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <label className="field-label" htmlFor="courseSelection">Course</label>
              <div className="input-wrap">
                <Icon name="building" size={20} />
                <select id="courseSelection" value={courseSelection} onChange={(e) => setCourseSelection(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', paddingLeft: '35px' }} required>
                  <option value="">Select Course</option>
                  <option value="B.Tech CSE">B.Tech CSE</option>
                  <option value="B.Tech ECE">B.Tech ECE</option>
                  <option value="B.Tech ME">B.Tech ME</option>
                  <option value="BBA">BBA</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {courseSelection === "Other" && (
                <>
                  <label className="field-label" htmlFor="otherCourse">Specify Course</label>
                  <div className="input-wrap">
                    <Icon name="clipboard" size={20} />
                    <input id="otherCourse" type="text" value={otherCourse} onChange={(e) => setOtherCourse(e.target.value)} placeholder="e.g. B.Des" style={{ paddingLeft: '35px' }} required />
                  </div>
                </>
              )}
            </>
          )}

          <label className="field-label" htmlFor="identifier">
            {mode === "staff" ? "JKLU email address" : "Admission number"}
          </label>
          <div className="input-wrap">
            <Icon name={mode === "staff" ? "mail" : "user"} size={20} />
            <input id="identifier" type={mode === "staff" ? "email" : "text"} value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder={mode === "staff" ? "e.g. warden.boysa@jklu.test" : "e.g. JKLU2026001"} style={{ paddingLeft: '35px' }} required />
          </div>

          {mode === "register" && (
            <>
              <label className="field-label" htmlFor="email">Email</label>
              <div className="input-wrap">
                <Icon name="mail" size={20} />
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. student@jklu.edu.in" style={{ paddingLeft: '35px' }} required />
              </div>

              <label className="field-label" htmlFor="phone">Phone (10 digits)</label>
              <div className="input-wrap">
                <Icon name="user" size={20} style={{ visibility: 'hidden' }} />
                <input id="phone" type="tel" pattern="[0-9]{10}" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 9876543210" style={{ paddingLeft: '35px' }} required />
              </div>
            </>
          )}

          <div className="password-row">
            <label className="field-label" htmlFor="password">Password {mode === "register" && "(min 6)"}</label>
          </div>
          <div className="input-wrap">
            <Icon name="lock" size={20} />
            <input id="password" type="password" minLength={mode === "register" ? 6 : undefined} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" style={{ paddingLeft: '35px' }} required />
          </div>

          {error && <ErrorToast message={error} onClose={() => setError("")} />}

          <PrimaryButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? (mode === "register" ? "Registering..." : "Signing in...") : mode === "register" ? "Sign up" : mode === "student" ? "Sign in as a student" : "Continue to staff portal"}
          </PrimaryButton>
        </form>

        <p className="help-text" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          {mode === "student" && (
            <>
              <span>New student? <button onClick={() => { setMode("register"); setError(""); setSuccess(""); }} type="button">Sign up here</button></span>
              <span>JKLU warden or administrator? <button onClick={() => { setMode("staff"); setError(""); setSuccess(""); }} type="button">Access the staff portal</button></span>
            </>
          )}
          {mode === "register" && (
            <span>Already registered? <button onClick={() => { setMode("student"); setError(""); setSuccess(""); }} type="button">Sign in here</button></span>
          )}
          {mode === "staff" && (
            <span>Are you a student? <button onClick={() => { setMode("student"); setError(""); setSuccess(""); }} type="button">Return to student sign in</button></span>
          )}
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

function ProgressTracker({ current, title }: { current: number; title: string }) {
  // current: 1-5 = the step in progress, 6 = everything finished
  const percent = current >= 6 ? 100 : current * 20;
  return (
    <section className="tracker-card">
      <div className="tracker-top">
        <div>
          <p className="card-label">YOUR BOOKING JOURNEY</p>
          <h2>{title}</h2>
        </div>
        <span>{current >= 6 ? "All steps done" : `Step ${current} of 5`}</span>
      </div>
      <div className="progress-track">
        <span style={{ width: `${percent}%` }} />
      </div>
      <div className="steps">
        {trackerSteps.map((step, index) => (
          <div
            className={`step ${index + 1 < current ? "done" : ""} ${index + 1 === current ? "current" : ""}`}
            key={step}
          >
            <div className="step-dot">
              {index + 1 < current ? <Icon name="check" size={15} /> : index + 1}
            </div>
            <span>{step}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Home({ onGo }: { onGo: (screen: Screen) => void }) {
  const cached = getUser();
  const [me, setMe] = useState<any>(null);
  const [data, setData] = useState<BookingData>(null);
  const [hasPrefs, setHasPrefs] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [meData, bookingData, prefData] = await Promise.all([
          apiRequest("/student/me", "GET"),
          loadBooking(),
          apiRequest("/student/preferences", "GET"),
        ]);
        if (!alive) return;
        setMe(meData);
        setData(bookingData);
        setHasPrefs(Boolean(prefData?.preferences));
      } catch (err: any) {
        if (alive) setError(err.message);
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => { alive = false; };
  }, []);

  const fullName: string = me?.name || cached?.name || "";
  const firstName = fullName.trim().split(/\s+/)[0];
  const admissionNo: string = me?.admission_no || "";
  const subline = admissionNo
    ? [admissionNo, me?.course].filter(Boolean).join(" · ")
    : error
      ? "Details unavailable right now"
      : "Loading your details...";

  const booking = data?.booking;
  const status: string = booking?.status || "";
  const live = ["Held", "Pending", "Approved"].includes(status);
  const total = data?.receipt?.total_amount ? Number(data.receipt.total_amount) : 0;
  const paid = booking?.payment_status === "Paid";

  const current = status === "Approved" ? 6 : status === "Pending" ? 5 : status === "Held" ? 4 : hasPrefs ? 3 : 2;
  const trackerTitle =
    status === "Approved"
      ? "You are all set"
      : status === "Pending"
        ? "Waiting for the warden"
        : status === "Held"
          ? "Your bed is waiting for you"
          : "Let’s get you settled";

  const stats = [
    { label: "Hostel", value: live ? booking.hostel_name : "Not chosen", icon: "building", theme: "orange" },
    {
      label: "Room",
      value: live ? `${booking.room_number} • Bed ${booking.bed_number}` : "Not chosen",
      icon: "bed",
      theme: "green",
    },
    {
      label: "Amount Due",
      value: formatMoney(status === "Held" && !paid ? total : 0),
      icon: "wallet",
      theme: "purple",
    },
    {
      label: "Booking Status",
      value: ["Rejected", "Expired", "Cancelled"].includes(status) ? status : status || "Not started",
      icon: "clipboard",
      theme: "red",
    },
  ];

  const next: { screen: Screen; label: string } =
    status === "Held"
      ? { screen: "fee-receipt", label: "Continue to payment" }
      : status === "Pending" || status === "Approved"
        ? { screen: "booking-status", label: "See my booking" }
        : hasPrefs
          ? { screen: "choose-room", label: "Choose my room" }
          : { screen: "preferences", label: "Start my booking" };

  return (
    <main className="page-shell student-dashboard">
      <section className="welcome-header">
        <p className="eyebrow">YOUR HOSTEL JOURNEY</p>
        <h1>{firstName ? `Welcome back, ${firstName}` : "Welcome back"}</h1>
        <p>{subline}</p>
      </section>

      <ProgressTracker current={current} title={trackerTitle} />

      <section className="stats-grid">
        {stats.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <div className={`stat-icon ${stat.theme}`}>
              <Icon name={stat.icon} size={24} />
            </div>
            <div>
              <p className="card-label" style={{ fontSize: '11px', color: 'var(--muted)' }}>
                {stat.label.toUpperCase()}
              </p>
              <h2>{ready ? stat.value : "..."}</h2>
            </div>
          </article>
        ))}
      </section>

      <section className="dashboard-cards" style={{ marginTop: "2rem" }}>
        <div className="card action-card">
          <div className="card-content">
            <Icon name="building" size={24} />
            <h3>Find your place at JKLU</h3>
            <p>Tell us how you like to live, choose your exact bed and get matched with roommates who fit. Session 2026-27.</p>
            {hasPrefs && (
              <button type="button" className="text-link" onClick={() => onGo("preferences")}>
                Update my preferences
              </button>
            )}
          </div>
          <PrimaryButton disabled={!ready} onClick={() => onGo(next.screen)}>
            {next.label}
          </PrimaryButton>
        </div>
      </section>
      {error && <ErrorToast message={error} onClose={() => setError("")} />}
    </main>
  );
}

function ChoiceGroup({
  title,
  options,
  value,
  onChange,
  kind,
}: {
  title: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  kind?: TagKind;
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
            {kind ? <TagLabel kind={kind} value={option} size={15} /> : option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

// RESTORED your beautiful Preferences form exactly how it was!
function Preferences({ onSave }: { onSave: () => void; onBack: () => void }) {
  const [course, setCourse] = useState("B.Tech");
  const [sleep, setSleep] = useState("Flexible");
  const [cleanliness, setCleanliness] = useState("Average");
  const [study, setStudy] = useState("Quiet");
  const [hobbyList, setHobbyList] = useState<{ hobby_id: number; hobby_name: string }[]>([]);
  const [selectedHobbies, setSelectedHobbies] = useState<number[]>([]);
  const [floor, setFloor] = useState("Any");
  const [room, setRoom] = useState("Double");
  const [ac, setAc] = useState("Any");
  const [bed, setBed] = useState("Any");
  const [windowBed, setWindowBed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [hobbyRows, saved] = await Promise.all([
          apiRequest("/student/hobbies", "GET"),
          apiRequest("/student/preferences", "GET"),
        ]);
        if (!alive) return;
        setHobbyList(hobbyRows);
        const p = saved?.preferences;
        if (p) {
          setCourse(p.preferred_course || "Any course");
          setSleep(p.sleep_schedule);
          setCleanliness(p.cleanliness);
          setStudy(p.study_style);
          setFloor(p.preferred_floor_type);
          setRoom(p.preferred_room_type);
          setAc(p.wants_ac);
          setBed(p.preferred_bed_level);
          setWindowBed(Boolean(Number(p.wants_window_bed)));
        }
        setSelectedHobbies((saved?.hobbies || []).map((h: any) => Number(h.hobby_id)));
      } catch (err: any) {
        if (alive) setError(err.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const toggleHobby = (hobbyId: number) => {
    setSelectedHobbies((current) =>
      current.includes(hobbyId)
        ? current.filter((item) => item !== hobbyId)
        : [...current, hobbyId],
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      await apiRequest("/student/preferences", "PUT", {
        sleep_schedule: sleep,
        cleanliness,
        study_style: study,
        preferred_course: course === "Any course" ? null : course,
        preferred_floor_type: floor,
        preferred_room_type: room,
        wants_ac: ac,
        preferred_bed_level: bed,
        wants_window_bed: windowBed,
        hobbies: selectedHobbies,
      });
      onSave();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) return <ScreenSkeleton />;

  return (
    <main className="page-shell preferences-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">STEP 2 OF 5</p>
          <h1>Tell us how you live</h1>
          <p>A few quick choices help us match you with roommates who fit your routine.</p>
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
          save();
        }}
      >
        <section className="form-card">
          <div className="section-heading">
            <span>01</span>
            <div>
              <h2>Your daily routine</h2>
              <p>When you sleep, how you study and how tidy you like things.</p>
            </div>
          </div>

          <label className="select-field">
            <span>Preferred course</span>
            <select value={course} onChange={(event) => setCourse(event.target.value)}>
              {["B.Tech", "BBA", "B.Des", "M.Tech", "MBA", "Any course"].map((item) => (
                <option key={item}>{item}</option>
              ))}
              {!["B.Tech", "BBA", "B.Des", "M.Tech", "MBA", "Any course"].includes(course) && (
                <option>{course}</option>
              )}
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
              <h2>What you enjoy</h2>
              <p>Pick as many hobbies as you like. Shared interests raise your match score.</p>
            </div>
          </div>
          <div className="hobby-chips">
            {hobbyList.map((hobby) => (
              <button
                type="button"
                key={hobby.hobby_id}
                className={selectedHobbies.includes(hobby.hobby_id) ? "active" : ""}
                onClick={() => toggleHobby(hobby.hobby_id)}
              >
                {selectedHobbies.includes(hobby.hobby_id) && <Icon name="check" size={14} />}
                {hobby.hobby_name}
              </button>
            ))}
          </div>
        </section>

        <section className="form-card">
          <div className="section-heading">
            <span>03</span>
            <div>
              <h2>Your ideal room</h2>
              <p>Tell us what you would like. You still choose the exact bed yourself.</p>
            </div>
          </div>

          <div className="choice-grid room-grid">
            <ChoiceGroup
              title="Preferred floor type"
              kind="floor"
              options={["Regular", "Quiet", "Any"]}
              value={floor}
              onChange={setFloor}
            />
            <ChoiceGroup
              title="Room type"
              kind="room"
              options={["Double", "Quad", "Any"]}
              value={room}
              onChange={setRoom}
            />
            <ChoiceGroup
              title="Cooling"
              kind="ac"
              options={["AC", "Non-AC", "Any"]}
              value={ac}
              onChange={setAc}
            />
            <ChoiceGroup
              title="Bed level"
              kind="bed"
              options={["Lower", "Upper", "Any"]}
              value={bed}
              onChange={setBed}
            />
          </div>

          <label className="toggle-row">
            <span className="toggle-copy">
              <strong>I want a window-side bed</strong>
              <small>A window bed adds Rs 10,000 to your hostel fee</small>
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
          <p>You can change these any time before you hold a bed.</p>
          <PrimaryButton type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save and choose my room"}
          </PrimaryButton>
        </div>
      </form>
      {error && <ErrorToast message={error} onClose={() => setError("")} />}
    </main>
  );
}

const formatMoney = (value: number) => `Rs ${Number(value).toLocaleString("en-IN")}`;

type BookingData = {
  booking: any;
  receipt: any;
  documents: any[];
  roommates: any[];
} | null;

const loadBooking = (): Promise<BookingData> => apiRequest("/student/booking", "GET");

const rememberBooking = (bookingId: number, holdMinutes?: number) => {
  window.localStorage.setItem("booking_id", String(bookingId));
  if (holdMinutes) window.localStorage.setItem("hold_minutes", String(holdMinutes));
};

// Parses "YYYY-MM-DD HH:MM:SS" (or ISO) into seconds left from now
const secondsUntil = (value: string): number | null => {
  const when = new Date(String(value).replace(" ", "T")).getTime();
  if (!Number.isFinite(when)) return null;
  return Math.max(0, Math.round((when - Date.now()) / 1000));
};

const DOC_LABELS: Record<string, string> = {
  PAYMENT_RECEIPT: "Hostel fee payment receipt",
  ALLOTMENT_FORM: "Hostel allotment form",
};
const DOC_ENDPOINTS: Record<string, string> = {
  PAYMENT_RECEIPT: "payment-receipt",
  ALLOTMENT_FORM: "allotment-form",
};

// Checks the file, then uploads it. Throws an Error with a readable message.
async function uploadDocumentFile(bookingId: number, docType: string, file: File) {
  const allowed = ["application/pdf", "image/jpeg", "image/png"];
  if (!allowed.includes(file.type) || file.size > 5 * 1024 * 1024) {
    throw new Error("Use a PDF, JPG, or PNG file up to 5 MB.");
  }
  const form = new FormData();
  form.append("file", file);
  return apiRequest(`/student/bookings/${bookingId}/documents/${DOC_ENDPOINTS[docType]}`, "POST", form, true);
}

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
  const [liveHostels, setLiveHostels] = useState<Hostel[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  
  const user = getUser();
  const studentGender = user?.gender || "Male";

  useEffect(() => {
    let alive = true;
    apiRequest("/student/hostels", "GET")
      .then((data) => {
        if (!alive) return;
        setLiveHostels(
          data.map((h: any) => ({
            ...h,
            total_floors: Number(h.total_floors),
            total_beds: Number(h.total_beds),
            free_beds: Number(h.free_beds),
          })),
        );
      })
      .catch((err) => { if (alive) setError(err.message); })
      .finally(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
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
        <p>Pick the building you want to live in. Only the hostels that match your profile can be chosen.</p>
        <span className="student-gender-note">
          <Icon name="user" size={14} />
          Profile gender: {studentGender}
        </span>
      </div>
      {loaded && liveHostels.length === 0 && !error && (
        <EmptyState title="No hostels to show" message="We could not find a hostel for your profile. Please contact the hostel office." />
      )}
      {error && <ErrorToast message={error} onClose={() => setError("")} />}
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
            <HostelPhoto name={hostel.hostel_name} />
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
  const [floors, setFloors] = useState<Floor[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    apiRequest(`/student/hostels/${hostel.hostel_id}/floors`, "GET")
      .then((data) => {
        if (!alive) return;
        setFloors(
          data.map((f: any) => ({
            ...f,
            floor_number: Number(f.floor_number),
            total_beds: Number(f.total_beds),
            free_beds: Number(f.free_beds),
          })),
        );
      })
      .catch((err) => { if (alive) setError(err.message); });
    return () => { alive = false; };
  }, [hostel.hostel_id]);

  const choose = (floor: Floor) => {
    setSelected(floor.floor_id);
    window.setTimeout(() => onSelect(floor), 350);
  };

  return (
    <section className="booking-step step-enter">
      <div className="room-step-heading compact">
        <p className="eyebrow">{hostel.hostel_name.toUpperCase()}</p>
        <h1>Pick your floor</h1>
        <p>Tap a floor to see which rooms still have free beds.</p>
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
              <em className={floor.floor_type === "Quiet" ? "floor-quiet" : "floor-regular"}>
                <TagIcon kind="floor" value={floor.floor_type} size={11} />
                {floor.floor_type === "Quiet" ? "Quiet floor" : "Regular floor"}
              </em>
              <span className="floor-free">{floor.free_beds} beds free</span>
            </button>
          ))}
        </div>
      </div>
      {error && <ErrorToast message={error} onClose={() => setError("")} />}
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
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const filters: RoomFilter[] = ["All", "Quad", "Double", "AC", "Non-AC"];

  useEffect(() => {
    let alive = true;
    apiRequest(`/student/floors/${floor.floor_id}/rooms`, "GET")
      .then((data) => {
        if (!alive) return;
        setRooms(
          data.map((r: any) => ({
            ...r,
            is_ac: Boolean(Number(r.is_ac)),
            capacity: Number(r.capacity),
            occupied_seats: Number(r.occupied_seats),
            in_progress_seats: Number(r.in_progress_seats),
            free_seats: Number(r.free_seats),
            same_course_count: Number(r.same_course_count || 0),
          })),
        );
      })
      .catch((err) => { if (alive) setError(err.message); })
      .finally(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, [floor.floor_id]);

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
        <h1>Find your room</h1>
        <p>Filled dots are taken beds. Choose any room that still has a free bed.</p>
      </div>

      <div className="room-filters" aria-label="Filter rooms">
        {filters.map((item) => (
          <button
            className={filter === item ? "active" : ""}
            onClick={() => setFilter(item)}
            key={item}
          >
            {item === "All" || item === "Quad" || item === "Double" ? (
              <TagLabel kind="room" value={item} size={14} />
            ) : (
              <TagLabel kind="ac" value={item} size={14} />
            )}
          </button>
        ))}
      </div>

      {loaded && visibleRooms.length === 0 && !error && (
        <EmptyState title="No rooms match" message="Try another filter to see more rooms on this floor." />
      )}
      {error && <ErrorToast message={error} onClose={() => setError("")} />}
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
            <span className="room-type">
              <TagIcon kind="room" value={room.room_type} size={11} />
              {room.room_type}
            </span>
            <span className="ac-icon" title={room.is_ac ? "Air conditioned" : "Non-AC"}>
              <TagIcon kind="ac" value={room.is_ac ? "AC" : "Non-AC"} size={15} />
            </span>
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
            {Number(room.same_course_count) > 0 && (
              <span className="course-match">
                <Icon name="user" size={11} />
                {room.same_course_count} from your course
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
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
        <small className="tag-label">
          <TagIcon kind="bed" value={bed.bed_level} size={15} />
          {bed.bed_level}
        </small>
        {bed.occupant_name && (
          <span className="bed-occupant">
            <b title={bed.occupant_name}>{bed.occupant_name}</b>
            <i title={bed.occupant_course || ""}>{bed.occupant_course}</i>
            <em>{bed.bed_status === "Booked" ? "Booked" : "Being processed"}</em>
          </span>
        )}
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
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [holding, setHolding] = useState(false);
  const [error, setError] = useState("");
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);

  useEffect(() => {
    setSelectedBed(null);
    setLoaded(false);
    let alive = true;
    apiRequest(`/student/rooms/${room.room_id}/beds`, "GET")
      .then((data) => {
        if (!alive) return;
        setBeds(
          data.map((b: any) => ({
            ...b,
            bed_id: Number(b.bed_id),
            bed_number: Number(b.bed_number),
            near_window: Boolean(Number(b.near_window)),
            base_semester_fee: Number(b.base_semester_fee),
            window_charge: Number(b.window_charge),
            price_total: Number(b.price_total),
          })),
        );
      })
      .catch((err) => { if (alive) setError(err.message); })
      .finally(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, [room.room_id]);

  const holdBed = async () => {
    if (!selectedBed || holding) return;
    setHolding(true);
    try {
      const result = await apiRequest("/student/bookings", "POST", { bed_id: selectedBed.bed_id });
      rememberBooking(Number(result.booking_id), Number(result.hold_minutes));
      onHold();
    } catch (err: any) {
      setError(err.message);
      setHolding(false);
    }
  };

  const needed = room.room_type === "Quad" ? 4 : 2;
  const layoutReady = loaded && beds.length >= needed;

  return (
    <section className="booking-step bed-step step-enter">
      <div className="room-step-heading compact">
        <p className="eyebrow">
          {hostel.hostel_name.toUpperCase()} • FLOOR {floor.floor_number} • ROOM{" "}
          {room.room_number}
        </p>
        <h1>Choose your bed</h1>
        <p className="room-meta-line">
          <TagLabel kind="room" value={room.room_type} text={`${room.room_type} room`} size={15} />
          <TagLabel kind="ac" value={room.is_ac ? "AC" : "Non-AC"} size={15} />
          <span>Tap a free bed to see its price.</span>
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

      {loaded && !layoutReady && !error && (
        <EmptyState title="Beds are not available" message="This room has no bed layout yet. Please pick another room." />
      )}
      {error && <ErrorToast message={error} onClose={() => setError("")} />}
      {layoutReady && (
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
      )}

      {selectedBed && (
        <aside className="bed-sheet" aria-live="polite">
          <div className="sheet-handle" />
          <div className="bed-details">
            <span className="selected-bed-number">B{selectedBed.bed_number}</span>
            <div>
              <p className="card-label">YOUR SELECTION</p>
              <h2>
                Bed {selectedBed.bed_number}
              </h2>
              <div className="sheet-tags">
                <TagLabel kind="room" value={room.room_type} size={15} />
                <TagLabel kind="ac" value={room.is_ac ? "AC" : "Non-AC"} size={15} />
                <TagLabel kind="bed" value={selectedBed.bed_level} text={`${selectedBed.bed_level} bed`} size={15} />
                {selectedBed.near_window && (
                  <span className="tag-label"><Icon name="sun" size={15} /><span>Window side</span></span>
                )}
              </div>
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
          <PrimaryButton onClick={holdBed} disabled={holding}>
            {holding ? "Holding your bed..." : `Hold this bed for ${HOLD_DEFAULT_MINUTES} minutes`}
          </PrimaryButton>
        </aside>
      )}
    </section>
  );
}

function ChooseRoom({ onHold, onExisting, registerBackHandler }: { onHold: () => void; onExisting: (screen: Screen) => void; registerBackHandler: (fn: (() => boolean) | null) => void }) {
  const [checking, setChecking] = useState(true);
  const [checkError, setCheckError] = useState("");
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

  // A student with a live booking must not pick again: send them to the right screen
  useEffect(() => {
    let alive = true;
    loadBooking()
      .then((data) => {
        if (!alive) return;
        const booking = data?.booking;
        if (booking?.status === "Held") {
          rememberBooking(Number(booking.booking_id));
          onExisting("fee-receipt");
        } else if (booking?.status === "Pending" || booking?.status === "Approved") {
          onExisting("booking-status");
        } else {
          setChecking(false);
        }
      })
      .catch((err) => {
        if (!alive) return;
        setCheckError(err.message);
        setChecking(false);
      });
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Register/unregister internal back handler with parent
  useEffect(() => {
    registerBackHandler(() => {
      if (step > 1) {
        navigateBack(step - 1);
        return true; // handled internally
      }
      return false; // let parent handle (go to home)
    });
    return () => registerBackHandler(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  if (checking) return <ScreenSkeleton />;

  return (
    <main className="page-shell room-booking-page">
      {checkError && <ErrorToast message={checkError} onClose={() => setCheckError("")} />}
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

type TransportChoice = "none" | "semester" | "yearly";

const TRANSPORT_CODE: Record<TransportChoice, string> = { none: "NONE", semester: "SEM", yearly: "YEAR" };

function FeeReceipt({ onNext, onGo }: { onNext: () => void; onGo: (screen: Screen) => void; onBack: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [receipt, setReceipt] = useState<any>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [transport, setTransport] = useState<TransportChoice>("none");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const buildReceipt = async (bookingId: number, choice: TransportChoice) => {
    const result = await apiRequest(`/student/bookings/${bookingId}/receipt`, "POST", {
      transport: TRANSPORT_CODE[choice],
    });
    setReceipt(result);
    return result;
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await loadBooking();
        if (!alive) return;
        const b = data?.booking;
        if (b && (b.status === "Pending" || b.status === "Approved")) {
          onGo("booking-status");
          return;
        }
        setBooking(b || null);
        if (b?.status === "Held") {
          rememberBooking(Number(b.booking_id));
          const left = b.hold_expires_at ? secondsUntil(b.hold_expires_at) : null;
          const fallback = Number(window.localStorage.getItem("hold_minutes")) || HOLD_DEFAULT_MINUTES;
          setSecondsLeft(left ?? fallback * 60);
          if (data?.receipt) {
            // Keep the transport choice the student made earlier
            const transportLine = (data.receipt.items || []).find((i: any) => i.item_type === "TRANSPORT");
            const amount = transportLine ? Number(transportLine.amount) : 0;
            setTransport(amount === 52500 ? "yearly" : amount > 0 ? "semester" : "none");
            setReceipt(data.receipt);
          } else {
            await buildReceipt(Number(b.booking_id), "none");
          }
        }
      } catch (err: any) {
        if (alive) setError(err.message);
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (secondsLeft === null) return;
    const timer = window.setInterval(
      () => setSecondsLeft((current) => (current === null ? null : Math.max(0, current - 1))),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [secondsLeft === null]);

  const changeTransport = async (choice: TransportChoice) => {
    if (!booking || busy || choice === transport) return;
    setBusy(true);
    try {
      await buildReceipt(Number(booking.booking_id), choice);
      setTransport(choice);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) return <ScreenSkeleton />;

  const expired = !booking || booking.status !== "Held" || secondsLeft === 0;
  if (expired) {
    return (
      <main className="page-shell payment-page">
        <div className="state-message expired">
          <Icon name="clock" size={20} />
          <div>
            <strong>Hold expired, pick again</strong>
            <p>Your bed was released because time ran out. Choose a bed to continue.</p>
          </div>
        </div>
        <div className="receipt-action">
          <p>Your preferences are saved. Nothing else to redo.</p>
          <PrimaryButton onClick={() => onGo("choose-room")}>Choose a bed again</PrimaryButton>
        </div>
        {error && <ErrorToast message={error} onClose={() => setError("")} />}
      </main>
    );
  }

  const left = secondsLeft ?? 0;
  const hours = Math.floor(left / 3600);
  const minutes = Math.floor((left % 3600) / 60);
  const seconds = left % 60;
  const countdown = (hours > 0 ? [hours, minutes, seconds] : [minutes, seconds])
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
  const items: { item_type: string; description: string; amount: string | number }[] = receipt?.items || [];
  const total = Number(receipt?.total_amount || 0);
  const isAc = Boolean(Number(booking.is_ac));

  return (
    <main className="page-shell payment-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">PAYMENT SUMMARY</p>
          <h1>Your fee receipt</h1>
          <p>This is exactly what you need to pay. Pay it, then upload your proof on the next step.</p>
          <div className="receipt-tags">
            <TagLabel kind="room" value={booking.room_type} size={15} />
            <TagLabel kind="ac" value={isAc ? "AC" : "Non-AC"} size={15} />
            <TagLabel kind="bed" value={booking.bed_level} text={`${booking.bed_level} bed`} size={15} />
            {Boolean(Number(booking.near_window)) && (
              <span className="tag-label"><Icon name="sun" size={15} /><span>Window side</span></span>
            )}
          </div>
        </div>
        <span className="receipt-number">Room {booking.room_number} • Bed {booking.bed_number}</span>
      </section>

      <section className="hold-countdown">
        <span className="countdown-icon">
          <Icon name="clock" size={25} />
        </span>
        <div>
          <p>Your bed is reserved for</p>
          <strong>{countdown}</strong>
        </div>
        <small>Pay the fee and upload both documents before time runs out</small>
      </section>

      <section className="receipt-card">
        <div className="receipt-header">
          <div>
            <p className="card-label">{receipt?.receipt_no || "JKLU HOSTEL BOOKING"}</p>
            <h2>Fee breakdown</h2>
          </div>
          <span>2026–27</span>
        </div>

        <div className="receipt-lines">
          {items.map((item) => (
            <div className="receipt-line" key={item.item_type + item.description}>
              <div>
                <span className="item-code">{item.item_type}</span>
                <p>{item.description}</p>
              </div>
              {item.item_type === "WINDOW_PREFERENCE" && (
                <em className="preference-tag">Preference</em>
              )}
              <strong>{formatMoney(Number(item.amount))}</strong>
            </div>
          ))}
        </div>

        <fieldset className="transport-options" disabled={busy}>
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
                onChange={() => changeTransport(option.value as TransportChoice)}
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
        <p>You pay outside this app, then upload your proof.</p>
        <PrimaryButton onClick={onNext} disabled={busy || !receipt}>Next: upload my documents</PrimaryButton>
      </div>
      {error && <ErrorToast message={error} onClose={() => setError("")} />}
    </main>
  );
}

function UploadCard({
  title,
  uploadedName,
  uploading,
  onPick,
}: {
  title: string;
  uploadedName: string | null;
  uploading: boolean;
  onPick: (file: File) => void;
}) {
  const inputId = title.toLowerCase().replaceAll(" ", "-");
  const chip = uploading ? "Uploading..." : uploadedName ? "Uploaded" : "Missing";

  return (
    <div
      className={`upload-card ${uploadedName ? "uploaded" : ""}`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const dropped = event.dataTransfer.files[0];
        if (dropped) onPick(dropped);
      }}
    >
      <div className="upload-title">
        <span className="upload-icon">
          <Icon name={uploadedName ? "file" : "upload"} size={22} />
        </span>
        <div>
          <h3>{title}</h3>
          <p>Required</p>
        </div>
        <span className={`document-chip ${uploadedName ? "verified" : "pending"}`}>{chip}</span>
      </div>
      <label htmlFor={inputId} className="drop-zone">
        <input
          id={inputId}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          disabled={uploading}
          onChange={(event) => {
            const picked = event.target.files?.[0];
            if (picked) onPick(picked);
            event.target.value = "";
          }}
        />
        {uploadedName ? (
          <>
            <Icon name="circleCheck" size={24} />
            <strong>{uploadedName}</strong>
            <span>Click or drop another file to replace</span>
          </>
        ) : (
          <>
            <Icon name="upload" size={24} />
            <strong>Drop your file here, or tap to browse</strong>
            <span>PDF, JPG or PNG • Maximum 5 MB</span>
          </>
        )}
      </label>
    </div>
  );
}

function UploadDocuments({ onSubmit, onGo }: { onSubmit: () => void; onGo: (screen: Screen) => void; onBack: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [names, setNames] = useState<Record<string, string | null>>({ PAYMENT_RECEIPT: null, ALLOTMENT_FORM: null });
  const [uploading, setUploading] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await loadBooking();
        if (!alive) return;
        const b = data?.booking;
        if (b && (b.status === "Pending" || b.status === "Approved")) {
          onGo("booking-status");
          return;
        }
        setBooking(b || null);
        if (b?.status === "Held") {
          rememberBooking(Number(b.booking_id));
          const found: Record<string, string | null> = { PAYMENT_RECEIPT: null, ALLOTMENT_FORM: null };
          (data?.documents || []).forEach((d: any) => { found[d.doc_type] = d.file_name; });
          setNames(found);
          if (data?.receipt?.total_amount) setAmount(String(Number(data.receipt.total_amount)));
        }
      } catch (err: any) {
        if (alive) setError(err.message);
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = async (docType: string, file: File) => {
    if (!booking) return;
    setUploading(docType);
    try {
      await uploadDocumentFile(Number(booking.booking_id), docType, file);
      setNames((current) => ({ ...current, [docType]: file.name }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(null);
    }
  };

  const submit = async () => {
    if (!booking || submitting) return;
    setSubmitting(true);
    try {
      await apiRequest(`/student/bookings/${booking.booking_id}/submit`, "POST", {
        payment_mode: paymentMode,
        payment_reference: reference.trim(),
        amount_paid: Number(amount),
      });
      onSubmit();
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (!loaded) return <ScreenSkeleton />;

  if (!booking || booking.status !== "Held") {
    return (
      <main className="page-shell documents-page">
        <div className="state-message expired">
          <Icon name="clock" size={20} />
          <div>
            <strong>Hold expired, pick again</strong>
            <p>You have no bed on hold right now. Choose a bed to continue.</p>
          </div>
        </div>
        <div className="receipt-action">
          <p>Your preferences are saved.</p>
          <PrimaryButton onClick={() => onGo("choose-room")}>Choose a bed again</PrimaryButton>
        </div>
        {error && <ErrorToast message={error} onClose={() => setError("")} />}
      </main>
    );
  }

  const missing = [
    !names.PAYMENT_RECEIPT && "payment receipt",
    !names.ALLOTMENT_FORM && "allotment form",
    !reference.trim() && "payment reference number",
    !(Number(amount) > 0) && "amount paid",
  ].filter(Boolean) as string[];
  const canSubmit = missing.length === 0 && !uploading && !submitting;

  return (
    <main className="page-shell documents-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">DOCUMENTS • STEP 4 OF 5</p>
          <h1>Upload your documents</h1>
          <p>Clear, readable copies help the warden approve your booking faster.</p>
        </div>
        <span className="completion-badge">2 required items</span>
      </section>

      <section className="document-checklist">
        <div className="checklist-heading">
          <span>01</span>
          <div>
            <h2>Your two documents</h2>
            <p>Both files are needed before you can submit.</p>
          </div>
        </div>
        <div className="upload-grid">
          <UploadCard
            title="Hostel fee payment receipt"
            uploadedName={names.PAYMENT_RECEIPT}
            uploading={uploading === "PAYMENT_RECEIPT"}
            onPick={(file) => pick("PAYMENT_RECEIPT", file)}
          />
          <UploadCard
            title="Hostel allotment form"
            uploadedName={names.ALLOTMENT_FORM}
            uploading={uploading === "ALLOTMENT_FORM"}
            onPick={(file) => pick("ALLOTMENT_FORM", file)}
          />
        </div>
      </section>

      <section className="payment-details-card">
        <div className="checklist-heading">
          <span>02</span>
          <div>
            <h2>About your payment</h2>
            <p>Copy these details exactly as they appear on your receipt.</p>
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
              : uploading
                ? "Uploading your file..."
                : `Still needed: ${missing.join(", ")}.`}
          </p>
        </div>
        <PrimaryButton disabled={!canSubmit} onClick={submit}>
          {submitting ? "Submitting..." : "Submit for warden approval"}
        </PrimaryButton>
      </div>
      {error && <ErrorToast message={error} onClose={() => setError("")} />}
    </main>
  );
}

function SubmittedConfirmation({ onTrack }: { onTrack: () => void }) {
  const [receiptNo, setReceiptNo] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    loadBooking()
      .then((data) => { if (alive) setReceiptNo(data?.receipt?.receipt_no || data?.booking?.receipt_no || ""); })
      .catch((err) => { if (alive) setError(err.message); });
    return () => { alive = false; };
  }, []);

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
          Relax for now. Your booking updates here as soon as both documents are checked.
        </p>
        <div className="confirmation-receipt">
          <span>Receipt number</span>
          <strong>{receiptNo || "..."}</strong>
        </div>
        <span className="waiting-chip">
          <i />
          Waiting for warden to verify your documents
        </span>
        <PrimaryButton onClick={onTrack}>Track my booking</PrimaryButton>
      </section>
      {error && <ErrorToast message={error} onClose={() => setError("")} />}
    </main>
  );
}

function StatusTracker({ state }: { state: BookingState }) {
  const steps = ["Profile", "Roommate Preferences", "Choose Room", "Documents", "Warden Approval"];
  const current =
    state === "Approved" ? 5 : state === "Held" || state === "Pending" ? 4 : 3;
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

function BookingStatus({ onGo }: { onGo: (screen: Screen) => void; onBack: () => void }) {
  const [data, setData] = useState<BookingData>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reuploadType, setReuploadType] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    try {
      setData(await loadBooking());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => { refresh(); }, []);

  if (!loaded) return <ScreenSkeleton />;

  const booking = data?.booking;
  if (!booking) {
    return (
      <main className="page-shell booking-status-page">
        <EmptyState title="No booking yet" message="Once you hold a bed, you can follow it here." />
        <div className="receipt-action">
          <p>Start with your preferences, then pick a bed.</p>
          <PrimaryButton onClick={() => onGo("home")}>Back to my dashboard</PrimaryButton>
        </div>
        {error && <ErrorToast message={error} onClose={() => setError("")} />}
      </main>
    );
  }

  const state = booking.status as BookingState;
  const editable = state === "Held" || state === "Pending";
  const isAc = Boolean(Number(booking.is_ac));
  const documents = ["PAYMENT_RECEIPT", "ALLOTMENT_FORM"].map((type) => {
    const found = (data?.documents || []).find((d: any) => d.doc_type === type);
    return found || { doc_id: type, doc_type: type, file_name: "", verification_status: "Missing", remarks: "" };
  });

  const cancelBooking = async () => {
    if (!window.confirm("Cancel this booking? Your bed will be released.")) return;
    setBusy(true);
    try {
      await apiRequest(`/student/bookings/${booking.booking_id}/cancel`, "POST");
      await refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const reupload = async (file: File | undefined) => {
    if (!file || !reuploadType) return;
    setBusy(true);
    try {
      await uploadDocumentFile(Number(booking.booking_id), reuploadType, file);
      await refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
      setReuploadType(null);
    }
  };

  return (
    <main className="page-shell booking-status-page">
      <section className="page-heading status-heading">
        <div>
          <p className="eyebrow">{booking.receipt_no ? `RECEIPT ${booking.receipt_no}` : `BOOKING #${booking.booking_id}`}</p>
          <h1>Where your booking stands</h1>
          <p>See your bed, your documents and the warden’s decision in one place.</p>
        </div>
        <span className={`booking-state ${state.toLowerCase()}`}>{state}</span>
      </section>

      <StatusTracker state={state} />

      {state === "Held" && (
        <div className="state-message">
          <Icon name="clock" size={20} />
          <div>
            <strong>Your bed is on hold</strong>
            <p>Upload both documents and submit before the hold ends.</p>
          </div>
          <button className="inline-action" onClick={() => onGo("fee-receipt")}>Continue to payment</button>
        </div>
      )}
      {state === "Rejected" && (
        <div className="state-message rejected">
          <Icon name="alert" size={20} />
          <div>
            <strong>Your booking was not approved</strong>
            <p>{booking.remarks ? `Warden’s note: ${booking.remarks}` : "Please choose a bed again."}</p>
          </div>
        </div>
      )}
      {state === "Expired" && (
        <div className="state-message expired">
          <Icon name="clock" size={20} />
          <div>
            <strong>Your hold ran out</strong>
            <p>The bed was released because time ran out. Pick a bed again to continue.</p>
          </div>
        </div>
      )}
      {state === "Cancelled" && (
        <div className="state-message expired">
          <Icon name="alert" size={20} />
          <div>
            <strong>This booking was cancelled</strong>
            <p>Your bed has been released. You can pick a new one any time.</p>
          </div>
        </div>
      )}
      {state === "Pending" && documents.some((d: any) => d.verification_status === "Rejected") && (
        <div className="state-message rejected">
          <Icon name="alert" size={20} />
          <div>
            <strong>One document needs a fix</strong>
            <p>Read the warden’s note below and upload that document again.</p>
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
            <div><dt>Hostel</dt><dd>{booking.hostel_name}</dd></div>
            <div><dt>Floor</dt><dd>Floor {booking.floor_number}</dd></div>
            <div><dt>Room</dt><dd>{booking.room_number} <TagLabel kind="room" value={booking.room_type} size={15} /> <TagLabel kind="ac" value={isAc ? "AC" : "Non-AC"} size={15} /></dd></div>
            <div><dt>Bed</dt><dd>Bed {booking.bed_number}</dd></div>
            <div><dt>Level</dt><dd><TagLabel kind="bed" value={booking.bed_level} size={15} /></dd></div>
            <div><dt>Window</dt><dd><span className="tag-label"><Icon name="sun" size={15} /><span>{Number(booking.near_window) ? "Yes" : "No"}</span></span></dd></div>
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
            {documents.map((document: any) => (
              <div className="status-document" key={document.doc_id}>
                <span className="file-square"><Icon name="file" size={20} /></span>
                <div>
                  <strong>{DOC_LABELS[document.doc_type]}</strong>
                  <p>{document.file_name || "Not uploaded yet"}</p>
                  {document.verification_status === "Rejected" && document.remarks && (
                    <div className="warden-remark">
                      <b>Warden’s remark</b>
                      <span>{document.remarks}</span>
                    </div>
                  )}
                </div>
                <div className="document-actions">
                  <span className={`document-chip ${document.verification_status === "Missing" ? "pending" : document.verification_status.toLowerCase()}`}>
                    {document.verification_status === "Missing" ? "Not uploaded" : document.verification_status}
                  </span>
                  {document.verification_status === "Rejected" && editable && (
                    <button
                      disabled={busy}
                      onClick={() => {
                        setReuploadType(document.doc_type);
                        window.setTimeout(() => fileInput.current?.click(), 0);
                      }}
                    >
                      Re-upload
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            style={{ display: "none" }}
            onChange={(event) => {
              reupload(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </section>
      </div>

      {state === "Approved" && (
        <section className="roommates-section">
          <div className="roommates-heading">
            <div>
              <p className="card-label">ROOM {booking.room_number}</p>
              <h2>Your roommates</h2>
            </div>
            <span>Booking approved</span>
          </div>
          {(data?.roommates || []).length === 0 ? (
            <EmptyState title="No roommates yet" message="Your roommates will appear here once they are approved too." />
          ) : (
            <div className="roommate-grid">
              {(data?.roommates || []).map((roommate: any) => (
                <article className="roommate-card" key={roommate.student_id}>
                  <span className="roommate-avatar">
                    {String(roommate.name).split(" ").map((part: string) => part[0]).join("").slice(0, 2)}
                  </span>
                  <div>
                    <h3>{roommate.name}</h3>
                    <p>{roommate.course}</p>
                    <span>Bed {roommate.bed_number} • {roommate.bed_level}</span>
                  </div>
                  <MatchRing score={Math.round(Number(roommate.match_score) || 0)} />
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {editable && (
        <button className="cancel-booking" disabled={busy} onClick={cancelBooking}>
          Cancel booking
        </button>
      )}
      {(state === "Rejected" || state === "Expired" || state === "Cancelled") && (
        <div className="receipt-action">
          <p>Ready to try again?</p>
          <PrimaryButton onClick={() => onGo("choose-room")}>Choose a room again</PrimaryButton>
        </div>
      )}
      {error && <ErrorToast message={error} onClose={() => setError("")} />}
    </main>
  );
}

const greetingForNow = () => {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
};

function WardenDashboard({
  onOpen,
  notice,
  onDismissNotice,
}: {
  onOpen: (bookingId: number) => void;
  notice: string;
  onDismissNotice: () => void;
}) {
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<WardenBooking[]>([]);
  const [approvedCount, setApprovedCount] = useState(0);
  const [occupancy, setOccupancy] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [blockFloor, setBlockFloor] = useState("");
  const [blockRoom, setBlockRoom] = useState("");
  const [blockBed, setBlockBed] = useState("");
  const wardenName = getUser()?.name || "";

  const refresh = async () => {
    // Load each part on its own, so one failing call never hides the pending bookings
    const results = await Promise.allSettled([
      apiRequest("/warden/bookings?status=Pending", "GET"),
      apiRequest("/warden/bookings?status=Approved", "GET"),
      apiRequest("/warden/occupancy", "GET"),
      apiRequest("/warden/beds", "GET"),
    ]);
    const [pendingRes, approvedRes, occupancyRes, bedsRes] = results;
    if (pendingRes.status === "fulfilled") {
      setPending(
        pendingRes.value.map((b: any) => ({
          ...b,
          near_window: Boolean(Number(b.near_window)),
          is_ac: Boolean(Number(b.is_ac)),
          total_amount: Number(b.total_amount || 0),
          docs_uploaded: Number(b.docs_uploaded),
          docs_verified: Number(b.docs_verified),
        })),
      );
    }
    if (approvedRes.status === "fulfilled") setApprovedCount(approvedRes.value.length);
    if (occupancyRes.status === "fulfilled") {
      setOccupancy(
        occupancyRes.value.map((o: any) => ({
          floor: Number(o.floor_number),
          booked: Number(o.booked),
          progress: Number(o.in_progress),
          available: Number(o.available),
          blocked: Number(o.blocked),
        })),
      );
    }
    if (bedsRes.status === "fulfilled") setBeds(bedsRes.value);
    const failed = results.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;
    if (failed) setError(failed.reason?.message || "Something went wrong");
    setLoaded(true);
  };

  useEffect(() => { refresh(); }, []);

  // Block tool: floors -> rooms -> beds, all from the hostel's real beds
  const floorOptions = Array.from(new Set(beds.map((b) => b.floor_number))) as number[];
  const roomOptions = Array.from(
    new Set(beds.filter((b) => String(b.floor_number) === blockFloor).map((b) => b.room_number)),
  ) as string[];
  const bedOptions = beds.filter(
    (b) => String(b.floor_number) === blockFloor && b.room_number === blockRoom,
  );

  useEffect(() => {
    if (beds.length && !blockFloor) setBlockFloor(String(beds[0].floor_number));
  }, [beds, blockFloor]);
  useEffect(() => {
    if (roomOptions.length && !roomOptions.includes(blockRoom)) setBlockRoom(roomOptions[0]);
  }, [blockFloor, beds]);
  useEffect(() => {
    if (bedOptions.length && !bedOptions.some((b) => String(b.bed_number) === blockBed)) {
      setBlockBed(String(bedOptions[0].bed_number));
    }
  }, [blockRoom, blockFloor, beds]);

  const selectedBed = bedOptions.find((b) => String(b.bed_number) === blockBed);
  const isBlocked = selectedBed?.bed_status === "Blocked";
  const inUse = selectedBed && ["Held", "Pending", "Booked"].includes(selectedBed.bed_status);

  const toggleBlock = async (blocked: boolean) => {
    if (!selectedBed || busy) return;
    setBusy(true);
    try {
      await apiRequest(`/warden/beds/${selectedBed.bed_id}/block`, "PUT", { blocked });
      await refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const filteredBookings = pending.filter((booking) =>
    `${booking.student_name} ${booking.course} ${booking.room_number} ${booking.booking_id}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const totalBeds = beds.length || 1;
  const freeBeds = occupancy.reduce((sum, o) => sum + o.available, 0);
  const blockedBeds = occupancy.reduce((sum, o) => sum + o.blocked, 0);
  const wardenStats = [
    { label: "Pending requests", value: pending.length, fill: pending.length / Math.max(1, pending.length + approvedCount), icon: "clipboard", theme: "orange" },
    { label: "Approved", value: approvedCount, fill: approvedCount / totalBeds, icon: "circleCheck", theme: "green" },
    { label: "Free beds", value: freeBeds, fill: freeBeds / totalBeds, icon: "bed", theme: "purple" },
    { label: "Blocked beds", value: blockedBeds, fill: blockedBeds / totalBeds, icon: "alert", theme: "red" },
  ];

  if (!loaded) return <ScreenSkeleton />;

  return (
    <main className="page-shell warden-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">WARDEN VIEW • {beds[0]?.hostel_name?.toUpperCase() || "YOUR HOSTEL"}</p>
          <h1>{greetingForNow()}{wardenName ? `, ${wardenName}` : ""}</h1>
          <p>Check documents, approve bookings and keep an eye on your hostel.</p>
        </div>
        <span className="session-pill"><span />Admissions active</span>
      </section>

      {notice && (
        <div className="notice-banner" role="status">
          <Icon name="circleCheck" size={18} />
          <span>{notice}</span>
          <button onClick={onDismissNotice} aria-label="Dismiss">×</button>
        </div>
      )}

      <section className="stats-grid warden-stats" aria-label="Hostel overview">
        {wardenStats.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <div className={`stat-icon ${stat.theme}`}><Icon name={stat.icon} size={24} /></div>
            <div className="warden-stat-copy">
              <p>{stat.label}</p>
              <strong>{stat.value}</strong>
            </div>
            <div className="mini-progress"><span style={{ width: `${Math.min(100, Math.max(4, stat.fill * 100))}%` }} /></div>
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
              onClick={() => onOpen(Number(booking.booking_id))}
              key={booking.booking_id}
            >
              <span className="student-initials">
                {booking.student_name.split(" ").map((name) => name[0]).join("").slice(0, 2)}
              </span>
              <div className="booking-student">
                <span>{booking.receipt_no || `#${booking.booking_id}`}</span>
                <h3>{booking.student_name}</h3>
                <p>{booking.course}</p>
              </div>
              <div className="booking-location">
                <small>ALLOTMENT</small>
                <strong>
                  Floor {booking.floor_number} • Room {booking.room_number} • Bed{" "}
                  {booking.bed_number}
                </strong>
                <span className="tag-row">
                  {booking.room_type && <TagLabel kind="room" value={booking.room_type} size={14} />}
                  {booking.room_type && <TagLabel kind="ac" value={booking.is_ac ? "AC" : "Non-AC"} size={14} />}
                  <TagLabel kind="bed" value={booking.bed_level} text={`${booking.bed_level} bed`} size={14} />
                </span>
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
              title={pending.length === 0 ? "No pending bookings" : "Nothing matches your search"}
              message={
                pending.length === 0
                  ? "New requests will show up here as soon as students submit their documents."
                  : "Try a different name, course, room or booking ID."
              }
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
            {occupancy.map((item) => {
              const total = item.booked + item.progress + item.available + item.blocked || 1;
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
                {floorOptions.map((floor) => <option key={floor}>{floor}</option>)}
              </select>
            </label>
            <label>
              <span>Room</span>
              <select value={blockRoom} onChange={(event) => setBlockRoom(event.target.value)}>
                {roomOptions.map((room) => <option key={room}>{room}</option>)}
              </select>
            </label>
            <label>
              <span>Bed</span>
              <select value={blockBed} onChange={(event) => setBlockBed(event.target.value)}>
                {bedOptions.map((bed) => <option key={bed.bed_id}>{bed.bed_number}</option>)}
              </select>
            </label>
          </div>
          <label className="block-toggle-row">
            <div>
              <strong>Bed {blockBed}, Room {blockRoom}</strong>
              <small>
                {inUse
                  ? `In use (${selectedBed.bed_status === "Booked" ? "booked" : "being processed"}), cannot be blocked`
                  : isBlocked
                    ? "Currently blocked"
                    : "Currently available"}
              </small>
            </div>
            <input
              type="checkbox"
              checked={isBlocked}
              disabled={busy || !selectedBed || Boolean(inUse)}
              onChange={(event) => toggleBlock(event.target.checked)}
            />
            <span className="toggle" aria-hidden="true"><span /></span>
          </label>
        </section>
      </div>
      {error && <ErrorToast message={error} onClose={() => setError("")} />}
    </main>
  );
}

function DocumentReviewCard({
  title,
  doc,
  canReview,
  busy,
  onVerify,
  onReject,
}: {
  title: string;
  doc: any | null;
  canReview: boolean;
  busy: boolean;
  onVerify: () => void;
  onReject: (remarks: string) => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewError, setPreviewError] = useState("");
  const isPdf = /\.pdf$/i.test(doc?.file_name || "");

  useEffect(() => {
    if (!doc) return;
    let alive = true;
    let url = "";
    fetchFileBlobUrl(`/warden/documents/${doc.doc_id}/file`)
      .then((blobUrl: string) => {
        url = blobUrl;
        if (alive) setPreviewUrl(blobUrl);
      })
      .catch((err: any) => { if (alive) setPreviewError(err.message); });
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [doc?.doc_id, doc?.file_name]);

  if (!doc) {
    return (
      <article className="review-document-card">
        <div className="review-document-header">
          <div>
            <h3>{title}</h3>
            <p>Not uploaded yet</p>
          </div>
          <span className="document-chip pending">Missing</span>
        </div>
      </article>
    );
  }

  const status: string = doc.verification_status;

  return (
    <article className="review-document-card">
      <div className="review-document-header">
        <div>
          <h3>{title}</h3>
          <p>{doc.file_name}</p>
        </div>
        <span className={`document-chip ${status.toLowerCase()}`}>{status}</span>
      </div>
      <div className="document-preview">
        {previewError ? (
          <p className="preview-note">{previewError}</p>
        ) : !previewUrl ? (
          <p className="preview-note">Loading preview...</p>
        ) : isPdf ? (
          <iframe src={previewUrl} title={`${title} preview`} />
        ) : (
          <img src={previewUrl} alt={`${title} uploaded by the student`} />
        )}
      </div>
      {status === "Rejected" && doc.remarks && (
        <p className="preview-note">Your remark: {doc.remarks}</p>
      )}
      <div className="document-review-actions">
        <button
          className="open-document"
          disabled={!previewUrl}
          onClick={() => window.open(previewUrl, "_blank")}
        >
          <Icon name="file" size={15} />Open full size
        </button>
        {canReview && (
          <div>
            <button
              className="verify-document"
              disabled={busy || status === "Verified"}
              onClick={() => { setRejecting(false); onVerify(); }}
            >
              <Icon name="check" size={14} />Verify
            </button>
            <button className="reject-document" disabled={busy} onClick={() => setRejecting(true)}>
              Reject
            </button>
          </div>
        )}
      </div>
      {rejecting && (
        <div className="document-reason">
          <label htmlFor={`reason-${doc.doc_id}`}>Reason for rejection</label>
          <textarea
            id={`reason-${doc.doc_id}`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Explain what the student needs to correct..."
          />
          <div>
            <button onClick={() => setRejecting(false)}>Cancel</button>
            <button
              disabled={!reason.trim() || busy}
              onClick={() => { onReject(reason.trim()); setRejecting(false); setReason(""); }}
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
  bookingId,
  onDone,
}: {
  bookingId: number;
  onDone: (message: string) => void;
  onBack: () => void;
}) {
  const [detail, setDetail] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showBookingReject, setShowBookingReject] = useState(false);
  const [bookingRemark, setBookingRemark] = useState("");
  const [showReassign, setShowReassign] = useState(false);
  const [freeBeds, setFreeBeds] = useState<any[]>([]);
  const [replacementBed, setReplacementBed] = useState("");
  const [reassignRemark, setReassignRemark] = useState("");

  const load = async () => {
    try {
      setDetail(await apiRequest(`/warden/bookings/${bookingId}`, "GET"));
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => { load(); }, [bookingId]);

  const openReassign = async () => {
    setShowReassign(!showReassign);
    setShowBookingReject(false);
    if (freeBeds.length === 0) {
      try {
        const rows = await apiRequest("/warden/free-beds", "GET");
        setFreeBeds(rows);
        if (rows.length) setReplacementBed(String(rows[0].bed_id));
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const run = async (action: () => Promise<any>, afterMessage?: string) => {
    setBusy(true);
    try {
      await action();
      if (afterMessage) onDone(afterMessage);
      else await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!detail) {
    return (
      <>
        <ScreenSkeleton />
        {error && <ErrorToast message={error} onClose={() => setError("")} />}
      </>
    );
  }

  const booking = detail.booking;
  const documents: any[] = detail.documents || [];
  const docOf = (type: string) => documents.find((d) => d.doc_type === type) || null;
  const items: any[] = detail.receipt_items || [];
  const claim = detail.student_payment_claim;
  const prefs = detail.preferences;
  const isPending = booking.status === "Pending";
  const calculatedTotal = items.reduce((sum, item) => sum + Number(item.amount), 0);
  const amountMatches = claim ? Number(claim.paid_amount) === calculatedTotal : false;
  const bothVerified =
    documents.length === 2 && documents.every((d) => d.verification_status === "Verified");
  const currentTotal = Number(booking.total_amount || calculatedTotal);
  const replacement = freeBeds.find((bed) => String(bed.bed_id) === replacementBed);
  const priceDifference = replacement ? Number(replacement.price_total) - currentTotal : 0;
  const isAc = Boolean(Number(booking.is_ac));
  const initials = String(booking.student_name).split(" ").map((n: string) => n[0]).join("").slice(0, 2);

  return (
    <main className="page-shell warden-detail-page">
      <section className="page-heading warden-detail-heading">
        <div>
          <p className="eyebrow">WARDEN REVIEW • {booking.receipt_no || `BOOKING #${booking.booking_id}`}</p>
          <h1>{booking.student_name}</h1>
          <p>
            {booking.course} • Floor {booking.floor_number}, Room {booking.room_number}, Bed{" "}
            {booking.bed_number}
          </p>
          <div className="receipt-tags">
            <TagLabel kind="room" value={booking.room_type} size={15} />
            <TagLabel kind="ac" value={isAc ? "AC" : "Non-AC"} size={15} />
            <TagLabel kind="bed" value={booking.bed_level} text={`${booking.bed_level} bed`} size={15} />
            {Boolean(Number(booking.near_window)) && (
              <span className="tag-label"><Icon name="sun" size={15} /><span>Window side</span></span>
            )}
          </div>
        </div>
        <span className={`booking-state ${String(booking.status).toLowerCase()}`}>{booking.status}</span>
      </section>

      <section className="warden-detail-section student-review">
        <div className="numbered-heading">
          <span>01</span>
          <div><p className="card-label">STUDENT</p><h2>Profile & preferences</h2></div>
        </div>
        <div className="student-review-grid">
          <div className="review-student-profile">
            <span className="student-initials large">{initials}</span>
            <div>
              <h3>{booking.student_name}</h3>
              <p>{booking.course}</p>
              <span>{booking.phone}</span>
            </div>
          </div>
          <div className="preference-summary">
            {prefs ? (
              <>
                <div><span>Sleep schedule</span><strong>{prefs.sleep_schedule}</strong></div>
                <div><span>Cleanliness</span><strong>{prefs.cleanliness}</strong></div>
                <div><span>Study style</span><strong>{prefs.study_style}</strong></div>
              </>
            ) : (
              <div><span>Preferences</span><strong>Not saved yet</strong></div>
            )}
          </div>
          <div className="review-hobbies">
            <span>Hobbies</span>
            <div>
              {(detail.hobbies || []).length === 0 ? <i>None chosen</i> : detail.hobbies.map((h: string) => <i key={h}>{h}</i>)}
            </div>
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
            {items.map((item) => (
              <div key={item.item_type + item.description}>
                <span>{item.description}</span><strong>{formatMoney(Number(item.amount))}</strong>
              </div>
            ))}
            <div className="comparison-total"><span>Calculated total</span><strong>{formatMoney(calculatedTotal)}</strong></div>
          </div>
          <div className="student-claim">
            <p className="comparison-label">STUDENT’S CLAIM</p>
            {claim ? (
              <>
                <dl>
                  <div><dt>Payment mode</dt><dd>{claim.payment_mode}</dd></div>
                  <div><dt>Reference number</dt><dd>{claim.payment_reference}</dd></div>
                  <div><dt>Amount paid</dt><dd>{formatMoney(Number(claim.paid_amount))}</dd></div>
                </dl>
                <span className={`amount-match ${amountMatches ? "" : "mismatch"}`}>
                  <Icon name={amountMatches ? "circleCheck" : "alert"} size={17} />
                  {amountMatches ? "Amount matches" : "Amount does not match"}
                </span>
              </>
            ) : (
              <p className="preview-note">The student has not entered payment details yet.</p>
            )}
          </div>
        </div>
      </section>

      <section className="warden-detail-section documents-review">
        <div className="numbered-heading">
          <span>03</span>
          <div><p className="card-label">DOCUMENTS</p><h2>Verify uploaded files</h2></div>
        </div>
        <div className="review-documents-grid">
          {["PAYMENT_RECEIPT", "ALLOTMENT_FORM"].map((type) => {
            const doc = docOf(type);
            return (
              <DocumentReviewCard
                key={type}
                title={DOC_LABELS[type]}
                doc={doc}
                canReview={isPending}
                busy={busy}
                onVerify={() =>
                  run(() => apiRequest(`/warden/documents/${doc.doc_id}/verify`, "POST", { status: "Verified", remarks: "" }))
                }
                onReject={(remarks) =>
                  run(() => apiRequest(`/warden/documents/${doc.doc_id}/verify`, "POST", { status: "Rejected", remarks }))
                }
              />
            );
          })}
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
          <button
            disabled={!bookingRemark.trim() || busy}
            onClick={() =>
              run(
                () => apiRequest(`/warden/bookings/${bookingId}/reject`, "POST", { remarks: bookingRemark.trim() }),
                `Booking rejected. The bed is free again.`,
              )
            }
          >
            Confirm booking rejection
          </button>
        </section>
      )}

      {showReassign && (
        <section className="booking-action-panel reassign-panel">
          <div>
            <h3>Reassign to a free bed</h3>
            <p>Choose another available bed before confirming.</p>
          </div>
          {freeBeds.length === 0 ? (
            <p className="preview-note">No free beds in your hostel right now.</p>
          ) : (
            <>
              <select value={replacementBed} onChange={(event) => setReplacementBed(event.target.value)}>
                {freeBeds.map((bed) => (
                  <option value={bed.bed_id} key={bed.bed_id}>
                    Floor {bed.floor_number} • Room {bed.room_number} • Bed {bed.bed_number} • {bed.room_type}{" "}
                    {Number(bed.is_ac) ? "AC" : "Non-AC"} {bed.bed_level}
                    {Number(bed.near_window) ? " • Window" : ""} • {formatMoney(Number(bed.price_total))}
                  </option>
                ))}
              </select>
              <input
                className="reassign-remark"
                value={reassignRemark}
                onChange={(event) => setReassignRemark(event.target.value)}
                placeholder="Reason (optional)"
              />
              <span className={`price-change ${priceDifference < 0 ? "refund" : ""}`}>
                {priceDifference > 0
                  ? `Student will be charged +${formatMoney(priceDifference)}`
                  : priceDifference < 0
                    ? `Student will be refunded ${formatMoney(Math.abs(priceDifference))}`
                    : "No price adjustment required"}
              </span>
            </>
          )}
          <button
            disabled={!replacement || busy}
            onClick={() =>
              run(
                () =>
                  apiRequest(`/warden/bookings/${bookingId}/reassign`, "POST", {
                    new_bed_id: Number(replacementBed),
                    remarks: reassignRemark.trim() || "Reassigned by warden",
                  }),
                `${booking.student_name} was moved to the new bed.`,
              )
            }
          >
            Confirm reassignment
          </button>
        </section>
      )}

      {isPending ? (
        <div className="warden-action-bar">
          <div>
            <button
              className="reject-booking-button"
              disabled={busy}
              onClick={() => { setShowBookingReject(!showBookingReject); setShowReassign(false); }}
            >
              Reject booking
            </button>
            <button className="reassign-button" disabled={busy} onClick={openReassign}>
              Reassign
            </button>
          </div>
          <div className="approve-action">
            {!bothVerified && <span>Verify both documents to approve</span>}
            <PrimaryButton
              disabled={!bothVerified || busy}
              onClick={() =>
                run(
                  () => apiRequest(`/warden/bookings/${bookingId}/approve`, "POST"),
                  `${booking.student_name}’s booking is approved.`,
                )
              }
            >
              Approve booking
            </PrimaryButton>
          </div>
        </div>
      ) : (
        <div className="state-message expired">
          <Icon name="clock" size={20} />
          <div>
            <strong>This booking is {String(booking.status).toLowerCase()}</strong>
            <p>Only pending bookings can be reviewed.</p>
          </div>
        </div>
      )}
      {error && <ErrorToast message={error} onClose={() => setError("")} />}
    </main>
  );
}

type AdminPage = "overview" | "wardens" | "structure" | "admissions" | "fees";

type WardenRecord = {
  warden_id: number;
  name: string;
  email: string;
  phone: string | null;
  hostel_id: number;
  hostel_name: string;
};

type AdminHelpers = {
  notify: (message: string) => void;
  fail: (message: string) => void;
};

const crore = (value: number) => `Rs ${Number(value).toLocaleString("en-IN")}`;

function AdminOverview({ fail }: AdminHelpers) {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    let alive = true;
    apiRequest("/admin/stats", "GET")
      .then((data) => { if (alive) setStats(data); })
      .catch((err) => { if (alive) fail(err.message); });
    return () => { alive = false; };
  }, []);

  if (!stats) return <ScreenSkeleton />;

  const registered = Number(stats.students_registered);
  const approved = Number(stats.approved_bookings);
  const totalBeds = Number(stats.total_beds);
  const hostelRows = (stats.per_hostel || []).map((h: any) => ({
    name: h.hostel_name,
    total: Number(h.total_beds),
    booked: Number(h.booked),
    inProgress: Number(h.in_progress || 0),
    available: Number(h.available),
    blocked: Number(h.blocked || 0),
  }));
  const cards = [
    { label: "Students registered", value: registered.toLocaleString("en-IN"), note: `${Number(stats.admissions_total).toLocaleString("en-IN")} admissions on record`, icon: "users", theme: "orange", fill: registered / Math.max(1, Number(stats.admissions_total)) },
    { label: "Pending bookings", value: Number(stats.pending_bookings).toLocaleString("en-IN"), note: "Awaiting warden review", icon: "clipboard", theme: "purple", fill: Number(stats.pending_bookings) / Math.max(1, registered) },
    { label: "Approved bookings", value: approved.toLocaleString("en-IN"), note: registered ? `${Math.round((approved / registered) * 100)}% of registered students` : "No students yet", icon: "circleCheck", theme: "green", fill: approved / Math.max(1, registered) },
    { label: "Money collected", value: crore(Number(stats.money_collected)), note: "Current academic session", icon: "money", theme: "orange", fill: 1 },
    { label: "Total beds", value: totalBeds.toLocaleString("en-IN"), note: `Across ${hostelRows.length} hostels`, icon: "bed", theme: "red", fill: 1 },
  ];

  return (
    <>
      <section className="admin-stats">
        {cards.map((stat) => (
          <article className="stat-card admin-stat-card" key={stat.label}>
            <div className={`stat-icon ${stat.theme}`}><Icon name={stat.icon} size={23} /></div>
            <div className="admin-stat-value"><strong>{stat.value}</strong><p>{stat.label}</p></div>
            <div className="mini-progress"><span style={{ width: `${Math.min(100, Math.max(4, stat.fill * 100))}%` }} /></div>
            <small>{stat.note}</small>
          </article>
        ))}
      </section>
      <section className="admin-card hostel-capacity-card">
        <div className="admin-card-heading">
          <div><p className="card-label">CAPACITY OVERVIEW</p><h2>Hostels</h2></div>
          <span>Academic session 2026–27</span>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table hostel-table">
            <thead><tr><th>Hostel</th><th>Total beds</th><th>Booked</th><th>Available</th><th>Occupancy</th></tr></thead>
            <tbody>
              {hostelRows.map((hostel: any) => {
                const percentage = hostel.total ? Math.round((hostel.booked / hostel.total) * 100) : 0;
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

function WardensAdmin({ notify, fail }: AdminHelpers) {
  const [wardens, setWardens] = useState<WardenRecord[]>([]);
  const [hostelOptions, setHostelOptions] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [hostelId, setHostelId] = useState("");
  const [saving, setSaving] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<WardenRecord | null>(null);

  const load = async () => {
    try {
      const [wardenRows, hostelRows] = await Promise.all([
        apiRequest("/admin/wardens", "GET"),
        apiRequest("/admin/hostels", "GET"),
      ]);
      setWardens(wardenRows);
      setHostelOptions(hostelRows);
    } catch (err: any) {
      fail(err.message);
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => { load(); }, []);

  // Each hostel has exactly one warden, so only hostels without one can be chosen
  const freeHostels = hostelOptions.filter((h) => !wardens.some((w) => w.hostel_id === h.hostel_id));
  useEffect(() => {
    if (!freeHostels.some((h) => String(h.hostel_id) === hostelId)) {
      setHostelId(freeHostels[0] ? String(freeHostels[0].hostel_id) : "");
    }
  }, [wardens, hostelOptions]);

  const addWarden = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await apiRequest("/admin/wardens", "POST", {
        hostel_id: Number(hostelId),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        password,
      });
      setName(""); setEmail(""); setPhone(""); setPassword("");
      notify("Warden added. They can sign in now.");
      await load();
    } catch (err: any) {
      fail(err.message);
    } finally {
      setSaving(false);
    }
  };

  const removeWarden = async () => {
    if (!removeTarget) return;
    try {
      await apiRequest(`/admin/wardens/${removeTarget.warden_id}`, "DELETE");
      notify(`${removeTarget.name} was removed.`);
      setRemoveTarget(null);
      await load();
    } catch (err: any) {
      fail(err.message);
      setRemoveTarget(null);
    }
  };

  if (!loaded) return <ScreenSkeleton />;

  return (
    <div className="admin-split-page">
      <section className="admin-card warden-admin-list">
        <div className="admin-card-heading">
          <div><p className="card-label">ACCESS CONTROL</p><h2>Wardens</h2></div>
          <span>{wardens.length} active</span>
        </div>
        <div className="warden-admin-rows">
          {wardens.map((warden) => (
            <div className="warden-admin-row" key={warden.warden_id}>
              <span className="student-initials">{warden.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
              <div><strong>{warden.name}</strong><p>{warden.email}</p></div>
              <span className="warden-hostel">{warden.hostel_name}</span>
              <button onClick={() => setRemoveTarget(warden)}><Icon name="trash" size={16} />Remove</button>
            </div>
          ))}
          {wardens.length === 0 && (
            <EmptyState
              title="No wardens yet"
              message="Add a warden so someone can review bookings for each hostel."
            />
          )}
        </div>
      </section>
      <section className="admin-card add-warden-card">
        <div className="admin-card-heading"><div><p className="card-label">NEW ACCOUNT</p><h2>Add warden</h2></div></div>
        <form onSubmit={addWarden}>
          <label className="plain-field"><span>Full name</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Warden’s name" required /></label>
          <label className="plain-field"><span>Official email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@jklu.edu.in" required /></label>
          <label className="plain-field"><span>Phone (optional)</span><input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="10 digit number" /></label>
          <label className="plain-field"><span>Temporary password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" minLength={6} required /></label>
          <label className="select-field"><span>Assigned hostel</span><select value={hostelId} onChange={(event) => setHostelId(event.target.value)}>{freeHostels.length === 0 && <option value="">All hostels have a warden</option>}{freeHostels.map((item) => <option key={item.hostel_id} value={item.hostel_id}>{item.hostel_name}</option>)}</select></label>
          {freeHostels.length === 0 && <p className="preview-note">Each hostel has one warden. Remove a warden or add a new hostel first.</p>}
          <PrimaryButton type="submit" disabled={saving || !hostelId}>{saving ? "Adding..." : "Add warden"}</PrimaryButton>
        </form>
      </section>
      {removeTarget && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm-dialog">
            <span className="confirm-icon"><Icon name="trash" size={24} /></span>
            <h2>Remove {removeTarget.name}?</h2>
            <p>They will immediately lose access to {removeTarget.hostel_name}. This action cannot be undone.</p>
            <div><button onClick={() => setRemoveTarget(null)}>Keep warden</button><button onClick={removeWarden}>Remove access</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function StructureAdmin({ notify, fail }: AdminHelpers) {
  const [hostelList, setHostelList] = useState<any[]>([]);
  const [floorList, setFloorList] = useState<any[]>([]);
  const [bedCounts, setBedCounts] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hostelName, setHostelName] = useState("");
  const [hostelGender, setHostelGender] = useState("Male");
  const [hostelFloors, setHostelFloors] = useState("8");
  const [floorHostel, setFloorHostel] = useState("");
  const [floorNumber, setFloorNumber] = useState("1");
  const [floorType, setFloorType] = useState("Regular");
  const [roomHostel, setRoomHostel] = useState("");
  const [roomFloor, setRoomFloor] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [roomType, setRoomType] = useState("Double");
  const [roomAc, setRoomAc] = useState(true);

  const load = async () => {
    try {
      const [hostelRows, floorRows, stats] = await Promise.all([
        apiRequest("/admin/hostels", "GET"),
        apiRequest("/admin/floors", "GET"),
        apiRequest("/admin/stats", "GET"),
      ]);
      setHostelList(hostelRows);
      setFloorList(floorRows);
      const counts: Record<string, number> = {};
      (stats.per_hostel || []).forEach((h: any) => { counts[h.hostel_name] = Number(h.total_beds); });
      setBedCounts(counts);
      setFloorHostel((current) => current || (hostelRows[0] ? String(hostelRows[0].hostel_id) : ""));
      setRoomHostel((current) => current || (hostelRows[0] ? String(hostelRows[0].hostel_id) : ""));
    } catch (err: any) {
      fail(err.message);
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => { load(); }, []);

  // Suggest the next floor number for the chosen hostel
  useEffect(() => {
    const numbers = floorList.filter((f) => String(f.hostel_id) === floorHostel).map((f) => Number(f.floor_number));
    setFloorNumber(String((numbers.length ? Math.max(...numbers) : 0) + 1));
  }, [floorHostel, floorList]);

  const roomFloors = floorList.filter((f) => String(f.hostel_id) === roomHostel);
  useEffect(() => {
    if (roomFloors.length && !roomFloors.some((f) => String(f.floor_id) === roomFloor)) {
      setRoomFloor(String(roomFloors[0].floor_id));
    }
    if (!roomFloors.length) setRoomFloor("");
  }, [roomHostel, floorList]);

  const submit = async (action: () => Promise<any>, message: string, done?: () => void) => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      done?.();
      notify(message);
      await load();
    } catch (err: any) {
      fail(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) return <ScreenSkeleton />;

  const floorHostelName = hostelList.find((h) => String(h.hostel_id) === floorHostel)?.hostel_name;

  return (
    <>
      <section className="admin-card structure-hostels">
        <div className="admin-card-heading"><div><p className="card-label">CURRENT STRUCTURE</p><h2>Hostels</h2></div><span>{hostelList.length} buildings</span></div>
        <div className="structure-hostel-grid">
          {hostelList.map((hostel) => {
            const floorsBuilt = floorList.filter((f) => f.hostel_id === hostel.hostel_id).length;
            return (
              <article key={hostel.hostel_id}>
                <span className="stat-icon orange"><Icon name="building" size={22} /></span>
                <div><h3>{hostel.hostel_name}</h3><p>{floorsBuilt} floors • {bedCounts[hostel.hostel_name] || 0} beds</p></div>
                <strong>{hostel.gender}</strong>
              </article>
            );
          })}
        </div>
      </section>
      <div className="structure-forms">
        <form
          className="admin-card structure-form"
          onSubmit={(event) => {
            event.preventDefault();
            submit(
              () => apiRequest("/admin/hostels", "POST", { hostel_name: hostelName.trim(), gender: hostelGender, total_floors: Number(hostelFloors) }),
              "Hostel added. Now add its floors and rooms.",
              () => setHostelName(""),
            );
          }}
        >
          <div className="structure-form-number">01</div><h2>Add hostel</h2>
          <label className="plain-field"><span>Hostel name</span><input value={hostelName} onChange={(event) => setHostelName(event.target.value)} placeholder="e.g. Boys Hostel C" required /></label>
          <div className="inline-form-fields">
            <label className="select-field"><span>Gender</span><select value={hostelGender} onChange={(event) => setHostelGender(event.target.value)}><option>Male</option><option>Female</option></select></label>
            <label className="plain-field"><span>Planned floors</span><input type="number" min={1} value={hostelFloors} onChange={(event) => setHostelFloors(event.target.value)} required /></label>
          </div>
          <button type="submit" disabled={busy}><Icon name="plus" size={15} />Add hostel</button>
        </form>
        <form
          className="admin-card structure-form"
          onSubmit={(event) => {
            event.preventDefault();
            submit(
              () => apiRequest("/admin/floors", "POST", { hostel_id: Number(floorHostel), floor_number: Number(floorNumber), floor_type: floorType }),
              `Floor ${floorNumber} added to ${floorHostelName}.`,
            );
          }}
        >
          <div className="structure-form-number">02</div><h2>Add floor</h2>
          <label className="select-field"><span>Hostel</span><select value={floorHostel} onChange={(event) => setFloorHostel(event.target.value)}>{hostelList.map((hostel) => <option key={hostel.hostel_id} value={hostel.hostel_id}>{hostel.hostel_name}</option>)}</select></label>
          <div className="inline-form-fields"><label className="plain-field"><span>Floor number</span><input type="number" min={1} value={floorNumber} onChange={(event) => setFloorNumber(event.target.value)} /></label><label className="select-field"><span>Floor type</span><select value={floorType} onChange={(event) => setFloorType(event.target.value)}><option>Regular</option><option>Quiet</option></select></label></div>
          <button type="submit" disabled={busy}><Icon name="plus" size={15} />Add floor</button>
        </form>
        <form
          className="admin-card structure-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!roomFloor) return;
            submit(
              () => apiRequest("/admin/rooms", "POST", { floor_id: Number(roomFloor), room_number: roomNumber.trim(), room_type: roomType, is_ac: roomAc }),
              `Room ${roomNumber.trim()} added. Beds were created automatically.`,
              () => setRoomNumber(""),
            );
          }}
        >
          <div className="structure-form-number">03</div><h2>Add room</h2>
          <label className="select-field"><span>Hostel</span><select value={roomHostel} onChange={(event) => setRoomHostel(event.target.value)}>{hostelList.map((hostel) => <option key={hostel.hostel_id} value={hostel.hostel_id}>{hostel.hostel_name}</option>)}</select></label>
          <div className="inline-form-fields"><label className="select-field"><span>Floor</span><select value={roomFloor} onChange={(event) => setRoomFloor(event.target.value)}>{roomFloors.length === 0 && <option value="">No floors yet</option>}{roomFloors.map((floor) => <option key={floor.floor_id} value={floor.floor_id}>{floor.floor_number}</option>)}</select></label><label className="plain-field"><span>Room number</span><input value={roomNumber} onChange={(event) => setRoomNumber(event.target.value)} placeholder="e.g. 121" required /></label></div>
          <div className="inline-form-fields"><label className="select-field"><span>Room type</span><select value={roomType} onChange={(event) => setRoomType(event.target.value)}><option>Double</option><option>Quad</option></select></label><label className="compact-toggle"><span><strong>Air conditioned</strong><small>{roomAc ? "AC room" : "Non-AC room"}</small></span><input type="checkbox" checked={roomAc} onChange={(event) => setRoomAc(event.target.checked)} /><i><b /></i></label></div>
          <p className="auto-bed-note"><Icon name="circleCheck" size={14} />Beds are created automatically based on room type.</p>
          <button type="submit" disabled={busy || !roomFloor}><Icon name="plus" size={15} />Add room</button>
        </form>
      </div>
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

// Splits one CSV line and understands "quoted, values"
const splitCsvLine = (line: string): string[] => {
  const out: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') { current += '"'; i++; } else quoted = !quoted;
    } else if (ch === "," && !quoted) {
      out.push(current.trim());
      current = "";
    } else current += ch;
  }
  out.push(current.trim());
  return out;
};

function AdmissionsAdmin({ notify, fail }: AdminHelpers) {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<AdmissionRow[]>([]);
  const [importing, setImporting] = useState(false);

  const parseCsv = async (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) { fail("Please upload a CSV file."); return; }
    const text = (await file.text()).replace(/^\uFEFF/, "");
    const lines = text.trim().split(/\r?\n/).filter((line) => line.trim());
    const headers = splitCsvLine(lines[0] || "").map((header) => header.toLowerCase());
    const required = ["admission_no", "name", "email", "phone", "course", "gender"];
    if (!required.every((field) => headers.includes(field))) { fail(`CSV must include: ${required.join(", ")}`); return; }
    const parsed = lines.slice(1).map((line) => {
      const values = splitCsvLine(line);
      const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])) as AdmissionRow;
      const gender = row.gender.trim().toLowerCase();
      row.gender = gender.startsWith("m") ? "Male" : gender.startsWith("f") ? "Female" : row.gender;
      return row;
    });
    const bad = parsed.filter((r) => !r.admission_no || !r.name || !r.course || !["Male", "Female"].includes(r.gender));
    if (bad.length) {
      fail(`${bad.length} row(s) are missing admission_no, name or course, or gender is not Male/Female. Fix the file and upload again.`);
      return;
    }
    setRows(parsed);
    setFileName(file.name);
  };

  const importRows = async () => {
    if (importing || rows.length === 0) return;
    setImporting(true);
    try {
      const result = await apiRequest("/admin/admissions/import", "POST", { records: rows });
      notify(`${result.imported} admission records imported.`);
      setRows([]);
      setFileName("");
    } catch (err: any) {
      fail(err.message);
    } finally {
      setImporting(false);
    }
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
        <input type="file" accept=".csv,text/csv" onChange={(event) => { parseCsv(event.target.files?.[0]); event.target.value = ""; }} />
        <span><Icon name={fileName ? "circleCheck" : "upload"} size={27} /></span>
        <strong>{fileName || "Drop admissions CSV here or browse"}</strong>
        <p>{fileName ? `${rows.length} records ready to import` : "CSV files only • First row must contain column headers"}</p>
      </label>
      <div className="preview-heading"><div><p className="card-label">DATA CHECK</p><h3>Preview</h3></div>{rows.length > 0 && <button disabled={importing} onClick={importRows}>{importing ? "Importing..." : `Import ${rows.length} records`}</button>}</div>
      {rows.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table admissions-table">
            <thead><tr><th>Admission no.</th><th>Name</th><th>Email</th><th>Phone</th><th>Course</th><th>Gender</th></tr></thead>
            <tbody>{rows.slice(0, 8).map((row, index) => <tr key={`${row.admission_no}-${index}`}><td><strong>{row.admission_no}</strong></td><td>{row.name}</td><td>{row.email}</td><td>{row.phone}</td><td>{row.course}</td><td><span className="gender-chip">{row.gender}</span></td></tr>)}</tbody>
          </table>
        </div>
      )}
      {rows.length === 0 && (
        <EmptyState
          title="No records to show yet"
          message="Upload a CSV file with at least one student to see a preview."
        />
      )}
    </section>
  );
}

const FEE_FIELDS = [
  ["hostel_fee", "Hostel fee"],
  ["utility_charges", "Utility"],
  ["mess_advance", "Mess advance"],
  ["security_deposit", "Security"],
] as const;

function FeesAdmin({ notify, fail }: AdminHelpers) {
  const [rows, setRows] = useState<any[]>([]);
  const [extras, setExtras] = useState<any[]>([]);
  const [dirty, setDirty] = useState<number[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const data = await apiRequest("/admin/fees", "GET");
      setRows(data.fees.map((f: any) => ({
        ...f,
        is_ac: Boolean(Number(f.is_ac)),
        hostel_fee: Number(f.hostel_fee),
        utility_charges: Number(f.utility_charges),
        mess_advance: Number(f.mess_advance),
        security_deposit: Number(f.security_deposit),
      })));
      setExtras(data.extras.map((e: any) => ({ ...e, amount: Number(e.amount), is_active: Boolean(Number(e.is_active)) })));
      setDirty([]);
    } catch (err: any) {
      fail(err.message);
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => { load(); }, []);

  const updateFee = (id: number, field: string, value: number) => {
    setRows((current) => current.map((row) => row.fee_id === id ? { ...row, [field]: value } : row));
    setDirty((current) => (current.includes(id) ? current : [...current, id]));
  };

  const saveFees = async () => {
    if (saving || dirty.length === 0) return;
    setSaving(true);
    try {
      for (const id of dirty) {
        const row = rows.find((r) => r.fee_id === id);
        await apiRequest(`/admin/fees/${id}`, "PUT", {
          hostel_fee: row.hostel_fee,
          utility_charges: row.utility_charges,
          mess_advance: row.mess_advance,
          security_deposit: row.security_deposit,
        });
      }
      notify("Fees saved. New receipts use these amounts.");
      await load();
    } catch (err: any) {
      fail(err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveExtra = async (extra: any) => {
    try {
      await apiRequest(`/admin/extra-charges/${extra.code}`, "PUT", { amount: extra.amount, is_active: extra.is_active });
      notify(`${extra.description} updated.`);
      await load();
    } catch (err: any) {
      fail(err.message);
    }
  };

  const changeExtra = (code: string, patch: any) =>
    setExtras((current) => current.map((e) => (e.code === code ? { ...e, ...patch } : e)));

  if (!loaded) return <ScreenSkeleton />;

  const extraIcons: Record<string, { icon: string; theme: string; note: string }> = {
    WINDOW_BED: { icon: "sun", theme: "orange", note: "Added when a student picks a window bed" },
    TRANSPORT_SEM: { icon: "building", theme: "purple", note: "Optional" },
    TRANSPORT_YEAR: { icon: "building", theme: "green", note: "Optional" },
  };

  return (
    <>
      <section className="admin-card fees-admin-card">
        <div className="admin-card-heading"><div><p className="card-label">ACADEMIC SESSION 2026–27</p><h2>Hostel fee matrix</h2></div><button className="save-fees" disabled={saving || dirty.length === 0} onClick={saveFees}>{saving ? "Saving..." : "Save changes"}</button></div>
        <div className="admin-table-wrap">
          <table className="admin-table fees-table">
            <thead><tr><th>Room type</th><th>AC</th><th>Bed level</th>{FEE_FIELDS.map(([, label]) => <th key={label}>{label}</th>)}<th>Computed total</th></tr></thead>
            <tbody>
              {rows.map((row) => {
                const total = row.hostel_fee + row.utility_charges + row.mess_advance + row.security_deposit;
                return (
                  <tr key={row.fee_id}>
                    <td><TagLabel kind="room" value={row.room_type} size={15} /></td>
                    <td><TagLabel kind="ac" value={row.is_ac ? "AC" : "Non-AC"} size={15} /></td>
                    <td><TagLabel kind="bed" value={row.bed_level} size={15} /></td>
                    {FEE_FIELDS.map(([field]) => <td key={field}><div className="fee-input"><span>Rs</span><input type="number" min={0} value={row[field]} onChange={(event) => updateFee(row.fee_id, field, Number(event.target.value))} /></div></td>)}
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
          {extras.map((extra) => {
            const look = extraIcons[extra.code] || { icon: "building", theme: "orange", note: "" };
            return (
              <article key={extra.code}>
                <span className={`stat-icon ${look.theme}`}><Icon name={look.icon} size={22} /></span>
                <div>
                  <p>{extra.description}</p>
                  <div className="fee-input extra-input"><span>Rs</span><input type="number" min={0} value={extra.amount} onChange={(event) => changeExtra(extra.code, { amount: Number(event.target.value) })} /></div>
                  <label className="extra-active"><input type="checkbox" checked={extra.is_active} onChange={(event) => changeExtra(extra.code, { is_active: event.target.checked })} />Offered to students</label>
                  <small>{look.note}</small>
                  <button className="extra-save" onClick={() => saveExtra(extra)}>Save</button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}

function AdminView() {
  const [page, setPage] = useState<AdminPage>("overview");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const pages: { id: AdminPage; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "wardens", label: "Wardens" },
    { id: "structure", label: "Structure" },
    { id: "admissions", label: "Admissions import" },
    { id: "fees", label: "Fees" },
  ];

  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3200);
  };
  const helpers: AdminHelpers = { notify, fail: setError };

  return (
    <main className="page-shell admin-page">
      <section className="page-heading admin-heading">
        <div><p className="eyebrow">ADMIN VIEW</p><h1>Run the hostels</h1><p>Keep an eye on beds, wardens, admissions and fees in one place.</p></div>
        <span className="session-pill"><span />System operational</span>
      </section>
      <nav className="admin-tabs" aria-label="Admin sections">
        {pages.map((item) => <button className={page === item.id ? "active" : ""} onClick={() => setPage(item.id)} key={item.id}>{item.label}</button>)}
      </nav>
      <div className="admin-page-content" key={page}>
        {page === "overview" && <AdminOverview {...helpers} />}
        {page === "wardens" && <WardensAdmin {...helpers} />}
        {page === "structure" && <StructureAdmin {...helpers} />}
        {page === "admissions" && <AdmissionsAdmin {...helpers} />}
        {page === "fees" && <FeesAdmin {...helpers} />}
      </div>
      {notice && <div className="admin-toast"><Icon name="circleCheck" size={17} />{notice}</div>}
      {error && <ErrorToast message={error} onClose={() => setError("")} />}
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
  const [wardenBookingId, setWardenBookingId] = useState<number | null>(null);
  const [wardenNotice, setWardenNotice] = useState("");
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = window.localStorage.getItem("jklu-theme");
    return savedTheme === "dark" ? "dark" : "light";
  });

  // History stack: screens you can go back to
  const [history, setHistory] = useState<Screen[]>([]);

  // ChooseRoom registers a handler here so the global back can step it internally
  const chooseRoomBackRef = useRef<(() => boolean) | null>(null);

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
      const homeScreen: Screen = user.role === "student" ? "home" : user.role === "warden" ? "warden" : "admin";
      setScreen(homeScreen);
      setHistory([]); // fresh start, no back
    }
  }, []);

  // Screens where Back is NEVER shown (login + the three home screens)
  const noBackScreens: Screen[] = ["login", "home", "warden", "admin"];
  const homeFor = (r: UserRole | null): Screen =>
    r === "admin" ? "admin" : r === "warden" ? "warden" : r === "student" ? "home" : "login";

  const showScreen = (nextScreen: Screen) => {
    setIsLoading(true);
    window.setTimeout(() => {
      setScreen(nextScreen);
      setIsLoading(false);
    }, 360);
  };

  // Go forward: remember where we came from so Back can return there
  const pushScreen = (nextScreen: Screen) => {
    if (nextScreen === screen) return;
    if (noBackScreens.includes(nextScreen)) {
      setHistory([]); // arriving at a home screen starts fresh
    } else {
      setHistory((prev) => {
        const seen = prev.lastIndexOf(nextScreen);
        if (seen >= 0) return prev.slice(0, seen); // going back to a screen we already visited
        return noBackScreens.includes(screen) ? prev : [...prev, screen];
      });
    }
    showScreen(nextScreen);
  };

  // Back: Choose Room steps first, then the history stack, then the role's home
  const goBack = () => {
    if (screen === "fee-receipt") {
      // A held bed cannot be re-picked, so Back from payment returns to Student Home
      setHistory([]);
      showScreen("home");
      return;
    }
    if (screen === "choose-room") {
      if (chooseRoomBackRef.current && chooseRoomBackRef.current()) return; // Bed -> Room -> Floor -> Hostel
      setHistory([]);
      showScreen("home"); // Hostel step goes to Student Home
      return;
    }
    const target = history.length > 0 ? history[history.length - 1] : homeFor(role);
    setHistory(history.slice(0, -1));
    showScreen(target);
  };

  const navigate = (nextScreen: Screen) => {
    if (nextScreen === "login") {
      removeToken();
      localStorage.removeItem("user");
      setRole(null);
      setCurrentUser(null);
      setHistory([]); // clear history on logout
      setIsLoading(true);
      window.setTimeout(() => {
        setScreen("login");
        setIsLoading(false);
      }, 360);
      return;
    }
    const studentScreens: Screen[] = ["home", "preferences", "choose-room", "fee-receipt", "documents", "submitted", "booking-status"];
    if (role === "student" && studentScreens.includes(nextScreen)) pushScreen(nextScreen);
    if (role === "warden" && ["warden", "warden-booking"].includes(nextScreen)) pushScreen(nextScreen);
    if (role === "admin" && nextScreen === "admin") pushScreen(nextScreen);
  };

  return (
    <div className="app">
      <Header screen={screen} onNavigate={navigate} theme={theme} onToggleTheme={() => setTheme(theme === "light" ? "dark" : "light")} role={role} />
      <div className="screen-transition" key={isLoading ? "loading" : screen}>
        {isLoading && <ScreenSkeleton />}
        {!isLoading && (
          <>
            {role && !noBackScreens.includes(screen) && (
              <div className="global-back-row">
                <BackButton onClick={goBack} />
              </div>
            )}
            {screen === "login" && (
              <Login
                onLogin={(nextRole, user) => {
                  setRole(nextRole);
                  setCurrentUser(user);
                  setHistory([]); // clear history on login
                  const homeScreen: Screen = nextRole === "student" ? "home" : nextRole === "warden" ? "warden" : "admin";
                  setIsLoading(true);
                  window.setTimeout(() => { setScreen(homeScreen); setIsLoading(false); }, 360);
                }}
              />
            )}
            {role === "student" && screen === "home" && <Home onGo={(next) => pushScreen(next)} />}
            {role === "student" && screen === "preferences" && (
              <Preferences
                onSave={() => pushScreen("choose-room")}
                onBack={goBack}
              />
            )}
            {role === "student" && screen === "choose-room" && (
              <ChooseRoom
                onHold={() => pushScreen("fee-receipt")}
                onExisting={(next) => showScreen(next)}
                registerBackHandler={(fn) => { chooseRoomBackRef.current = fn; }}
              />
            )}
            {role === "student" && screen === "fee-receipt" && (
              <FeeReceipt
                onNext={() => pushScreen("documents")}
                onGo={(next) => pushScreen(next)}
                onBack={goBack}
              />
            )}
            {role === "student" && screen === "documents" && (
              <UploadDocuments
                onSubmit={() => {
                  // After submit: go to "submitted" but clear history so Back never returns here
                  setHistory([]);
                  setIsLoading(true);
                  window.setTimeout(() => { setScreen("submitted"); setIsLoading(false); }, 360);
                }}
                onGo={(next) => pushScreen(next)}
                onBack={goBack}
              />
            )}
            {role === "student" && screen === "submitted" && (
              <SubmittedConfirmation
                onTrack={() => {
                  // From submitted → booking-status; but back from booking-status goes to home
                  setHistory([]);
                  showScreen("booking-status");
                }}
              />
            )}
            {role === "student" && screen === "booking-status" && (
              <BookingStatus onGo={(next) => pushScreen(next)} onBack={goBack} />
            )}
            {role === "warden" && screen === "warden" && <WardenDashboard onOpen={(id) => { setWardenNotice(""); setWardenBookingId(id); pushScreen("warden-booking"); }} notice={wardenNotice} onDismissNotice={() => setWardenNotice("")} />}
            {role === "warden" && screen === "warden-booking" && wardenBookingId !== null && <WardenBookingDetail bookingId={wardenBookingId} onDone={(message) => { setWardenNotice(message); pushScreen("warden"); }} onBack={goBack} />}
            {role === "admin" && screen === "admin" && <AdminView />}
          </>
        )}
      </div>
      <footer>
        <span>JKLU Hostel Booking</span>
        <span>Session 2026–27</span>
      </footer>
    </div>
  );
}