import { FormEvent, ReactNode, useEffect, useState } from "react";
import { api, ApiError, sendJson } from "./api";
import type {
  CalculatorResult,
  DashboardData,
  Expenses,
  Income,
  Insight,
  Loan,
  LoanInput,
  Profile,
  Scenario,
  ScenarioInput,
  Score,
  TaxEstimate,
} from "./types";

type IconName =
  | "grid" | "wallet" | "score" | "calculator" | "insights" | "tax"
  | "report" | "user" | "settings" | "help" | "logout" | "bell"
  | "arrow" | "check" | "plus" | "trend" | "home" | "car" | "education"
  | "shield" | "clock" | "download" | "print" | "menu" | "close";

const paths: Record<IconName, ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
  wallet: <><path d="M4 7h16v12H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h13v4"/><path d="M16 12h6v4h-6a2 2 0 0 1 0-4Z"/></>,
  score: <><path d="M4 18a8 8 0 1 1 16 0"/><path d="m12 14 4-4"/><path d="M12 18h.01"/></>,
  calculator: <><rect x="4" y="2" width="16" height="20" rx="3"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h4"/></>,
  insights: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></>,
  tax: <><path d="M6 2h9l4 4v16H6z"/><path d="M14 2v5h5M9 13h6M9 17h6M9 9h1"/></>,
  report: <><path d="M4 3h16v18H4z"/><path d="M8 7h8M8 11h8M8 15h5"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1 1.55V21h-4v-.08a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3v-4h.08a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3h4v.08a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.55 1H21v4h-.08a1.7 1.7 0 0 0-1.52 1Z"/></>,
  help: <><circle cx="12" cy="12" r="10"/><path d="M9.5 9a2.5 2.5 0 1 1 3.3 2.37c-.8.28-.8.88-.8 1.63M12 17h.01"/></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3M15 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  plus: <path d="M12 5v14M5 12h14"/>,
  trend: <><path d="m3 17 6-6 4 4 8-9"/><path d="M15 6h6v6"/></>,
  home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v11h14V10M9 21v-7h6v7"/></>,
  car: <><path d="m5 11 2-5h10l2 5M3 11h18v7H3z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></>,
  education: <><path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5M22 9v6"/></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-5"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  download: <><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/></>,
  print: <><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v7H6z"/></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
};

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Logo({ light = false }: { light?: boolean }) {
  return <div className={`logo ${light ? "logo-light" : ""}`}><span className="logo-mark"><span /></span><span>Credora</span></div>;
}

function Button({ children, variant = "primary", icon, onClick, type = "button", className = "", disabled = false, form }: {
  children: ReactNode; variant?: "primary" | "secondary" | "ghost" | "dark"; icon?: IconName;
  onClick?: () => void; type?: "button" | "submit"; className?: string; disabled?: boolean; form?: string;
}) {
  return <button type={type} form={form} className={`btn btn-${variant} ${className}`} onClick={onClick} disabled={disabled}>{children}{icon && <Icon name={icon} size={16}/>}</button>;
}

const Disclaimer = ({ compact = false }: { compact?: boolean }) => (
  <div className={`disclaimer ${compact ? "compact" : ""}`}><Icon name="shield" size={16}/><span><b>Credora Score</b> is an educational, project-specific financial health score calculated using information provided by the user. It is not an official credit bureau score and does not represent a bank's actual lending decision.</span></div>
);

function ScoreRing({ score, small = false }: { score: number | null | undefined; small?: boolean }) {
  const pct = score == null ? 0 : ((score - 300) / 600) * 100;
  return <div className={`score-ring ${small ? "small" : ""}`} style={{ "--score": `${pct * 3.6}deg` } as React.CSSProperties}>
    <div className="score-ring-inner"><strong>{score ?? "—"}</strong><span>/ 900</span></div>
  </div>;
}

const money = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;
const percentage = (value: number) => `${Math.round(value)}%`;
const fullDate = (value: string | Date) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value));
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
};

function Notice({ children, tone = "error" }: { children: ReactNode; tone?: "error" | "success" | "info" }) {
  return <div className={`notice notice-${tone}`} role={tone === "error" ? "alert" : "status"}>{children}</div>;
}

function EmptyState({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return <div className="empty-state"><div><Icon name="insights" size={22}/></div><p>{children}</p>{action}</div>;
}

function Landing({ navigate }: { navigate: (page: string) => void }) {
  const features = [
    ["score", "Credora Score", "Understand your financial health through a transparent, project-specific score."],
    ["wallet", "Loan Tracker", "Track existing loans, EMIs, interest rates and outstanding balances."],
    ["calculator", "What-If Calculator", "Simulate a potential loan before making a financial commitment."],
    ["insights", "Financial Insights", "Understand EMI burden, debt-to-income ratio and disposable income."],
    ["tax", "Tax & Planning", "View estimated financial and tax implications based on your information."],
  ] as [IconName, string, string][];
  return <div className="landing">
    <header className="marketing-nav">
      <Logo/>
      <nav><a href="#features">Features</a><a href="#how">How it works</a><a href="#calculator">What-if calculator</a><a href="#about">About</a></nav>
      <div className="nav-actions"><Button variant="ghost" onClick={() => navigate("login")}>Log in</Button><Button onClick={() => navigate("signup")}>Get started</Button></div>
    </header>
    <main>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span/> Personal finance, made clearer</div>
          <h1>Understand your financial health before taking your next loan.</h1>
          <p>Credora helps you analyse your current financial position, understand your credit health and simulate how a new loan could affect your finances.</p>
          <div className="hero-actions"><Button onClick={() => navigate("signup")} icon="arrow">Calculate my score</Button><Button variant="secondary" onClick={() => navigate("signup")}>Try what-if calculator</Button></div>
          <div className="trust-row"><span><Icon name="shield" size={17}/> Private by design</span><span><Icon name="check" size={17}/> Transparent calculations</span></div>
        </div>
        <div className="preview-wrap">
          <div className="preview-top"><div><span className="muted-label">YOUR FINANCIAL OVERVIEW</span><strong>Personal finance, made clearer</strong></div><div className="avatar"><Icon name="user"/></div></div>
          <div className="preview-score">
            <div><div className="muted-label">CREDORA SCORE</div><div className="preview-score-number">— <small>/ 900</small></div><span className="status">Based on your information</span></div>
            <div className="mini-chart"><svg viewBox="0 0 180 70" preserveAspectRatio="none"><path className="chart-area" d="M0 60 C25 50 31 53 50 38 S85 50 105 29 S141 30 180 7 V70 H0Z"/><path className="chart-line" d="M0 60 C25 50 31 53 50 38 S85 50 105 29 S141 30 180 7"/></svg><span>Your data stays yours</span></div>
          </div>
          <div className="preview-stats"><div><Icon name="wallet"/><span>Income<strong>Personalised</strong></span></div><div><Icon name="insights"/><span>Loan insights<strong>Transparent</strong></span></div><div><Icon name="trend"/><span>Planning<strong>For your goals</strong></span></div></div>
          <div className="preview-foot"><span>Financial profile</span><div className="tiny-bars"><i/><i/><i/><i/><i/></div><b>Private</b></div>
        </div>
      </section>

      <section className="trust-strip"><span>Built for clearer financial decisions</span><div/><span>Indian loan & EMI planning</span><div/><span>Educational, transparent scoring</span></section>

      <section className="section" id="features">
        <div className="section-head"><div><span className="kicker">EVERYTHING IN ONE PLACE</span><h2>Know where you stand. Plan what comes next.</h2></div><p>From your current loan obligations to a possible next step, Credora turns your financial details into a clear, usable picture.</p></div>
        <div className="feature-grid">{features.map(([icon, title, text], i) => <article className={`feature-card ${i === 2 ? "featured" : ""}`} key={title}><div className="feature-icon"><Icon name={icon}/></div><h3>{title}</h3><p>{text}</p><button onClick={() => navigate("signup")}>Explore feature <Icon name="arrow" size={15}/></button></article>)}</div>
      </section>

      <section className="how-section" id="how">
        <div className="how-copy"><span className="kicker">HOW CREDORA WORKS</span><h2>Three steps to a more informed decision.</h2><p>No jargon. No opaque formula. Just structured financial inputs and a clear view of what they mean for you.</p><Disclaimer compact/></div>
        <div className="steps">{[["01","Enter","Add your income, expenses, existing loans and repayment details."],["02","Analyse","See your Credora Score and a transparent financial breakdown."],["03","Plan","Test new loans, compare scenarios and make a more informed choice."]].map(([n,t,d],i)=><div className="step" key={n}><span>{n}</span><div><h3>{t}</h3><p>{d}</p></div>{i<2&&<Icon name="arrow"/>}</div>)}</div>
      </section>

      <section className="cta-section"><div><span className="kicker">MAKE YOUR NEXT MOVE WITH CONTEXT</span><h2>Build a clearer picture of your finances today.</h2><p>Start with a few details. Credora will organise the numbers and show you what matters.</p></div><Button variant="secondary" onClick={() => navigate("signup")} icon="arrow">Calculate my score</Button></section>
    </main>
    <footer><Logo light/><p>Understand your credit. Plan your next move.</p><span>Credora · Educational project</span></footer>
  </div>;
}

function Auth({ mode, navigate, onSuccess, onDemo }: {
  mode: "login" | "signup";
  navigate: (page: string) => void;
  onSuccess: (profile: Profile, signup: boolean) => Promise<void>;
  onDemo: () => void;
}) {
  const signup = mode === "signup";
  const [values, setValues] = useState({ fullName: "", phone: "", employmentType: "Salaried", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const change = (key: keyof typeof values) => (value: string) => setValues((previous) => ({ ...previous, [key]: value }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (signup && values.password !== values.confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const result = await sendJson<{ user: Profile }>("/auth/" + (signup ? "signup" : "login"), "POST", signup
        ? { fullName: values.fullName, phone: values.phone, employmentType: values.employmentType, email: values.email, password: values.password }
        : { email: values.email, password: values.password });
      await onSuccess(result.user, signup);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to authenticate.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="auth-page">
    <div className="auth-visual">
      <Logo light/>
      <div className="auth-message"><span className="kicker light">YOUR FINANCES, IN PERSPECTIVE</span><h1>{signup ? "A clearer financial future starts with the full picture." : "Make financial decisions with more confidence."}</h1><p>See how your income, expenses, loans and future plans work together.</p></div>
      <div className="finance-art"><div className="art-card art-a"><Icon name="trend"/><span>Financial health</span><strong>Built around you</strong></div><div className="art-ring"><Icon name="score" size={42}/></div><div className="art-card art-b"><span>Financial profile</span><strong>Your information</strong><div className="art-bar"><i/></div></div></div>
      <span className="auth-foot">Educational financial planning platform</span>
    </div>
    <div className="auth-form-wrap">
      <button className="back-link" onClick={() => navigate("landing")}>← Back to home</button>
      <form className="auth-form" onSubmit={submit}>
        <span className="mobile-logo"><Logo/></span>
        <h2>{signup ? "Create your account" : "Welcome back"}</h2>
        <p>{signup ? "Start building your personal financial profile." : "Enter your details to access your financial dashboard."}</p>
        {error && <Notice>{error}</Notice>}
        {signup && <><Field label="Full name" placeholder="Enter your full name" value={values.fullName} onChange={change("fullName")} autoComplete="name" required/><div className="field-row"><Field label="Phone number" placeholder="Enter your phone number" value={values.phone} onChange={change("phone")} inputType="tel" autoComplete="tel"/><Field label="Employment type" type="select" value={values.employmentType} onChange={change("employmentType")} options={["Salaried","Self-employed","Business owner","Student"]}/></div></>}
        <Field label="Email address" placeholder="you@example.com" value={values.email} onChange={change("email")} inputType="email" autoComplete="email" required/>
        <Field label="Password" placeholder={signup ? "Use at least 10 characters" : "Enter your password"} value={values.password} onChange={change("password")} inputType="password" autoComplete={signup ? "new-password" : "current-password"} minLength={signup ? 10 : 1} required/>
        {signup && <Field label="Confirm password" placeholder="Re-enter your password" value={values.confirmPassword} onChange={change("confirmPassword")} inputType="password" autoComplete="new-password" required/>}
        <div className="form-meta"><label><input type="checkbox" required={signup} defaultChecked={!signup}/><span>{signup ? "I agree to the Terms and Privacy Policy." : "Remember me"}</span></label></div>
        <Button type="submit" className="full" disabled={loading}>{loading ? "Please wait..." : signup ? "Create account" : "Log in"}</Button>
        {!signup && <Button variant="secondary" className="full demo-user-button" onClick={onDemo}>DEMO USER</Button>}
        {signup && <div className="security-note"><Icon name="shield" size={17}/> Your financial information is used only to generate your Credora analysis.</div>}
        <div className="auth-switch">{signup ? "Already have an account?" : "Don’t have an account?"} <button type="button" onClick={() => navigate(signup ? "login" : "signup")}>{signup ? "Log in" : "Create one"}</button></div>
      </form>
    </div>
  </div>;
}

function Field({ label, placeholder, type, options, inputType = "text", value, onChange, suffix, required = false, min, max, step, autoComplete, minLength }: {
  label: string; placeholder?: string; type?: "select"; options?: string[]; inputType?: string;
  value?: string | number; onChange?: (value: string) => void; suffix?: string; required?: boolean;
  min?: number; max?: number; step?: number | string; autoComplete?: string; minLength?: number;
}) {
  return <label className="field"><span>{label}</span><div className="input-wrap">{type === "select"
    ? <select value={value ?? options?.[0] ?? ""} onChange={(event) => onChange?.(event.target.value)} required={required}>{options?.map((option) => <option key={option}>{option}</option>)}</select>
    : <input type={inputType} placeholder={placeholder} value={value ?? ""} onChange={(event) => onChange?.(event.target.value)} required={required} min={min} max={max} step={step} autoComplete={autoComplete} minLength={minLength}/>} {suffix && <i>{suffix}</i>}</div></label>;
}

interface LoanDraft {
  loanType: string;
  loanName: string;
  principalAmount: string;
  outstandingAmount: string;
  interestRate: string;
  originalTenureMonths: string;
  remainingTenureMonths: string;
  monthlyEmi: string;
  startDate: string;
  status: "ACTIVE" | "CLOSED";
  missedPayments: string;
}

const emptyLoan = (): LoanDraft => ({
  loanType: "Home Loan", loanName: "", principalAmount: "", outstandingAmount: "",
  interestRate: "", originalTenureMonths: "", remainingTenureMonths: "",
  monthlyEmi: "", startDate: "", status: "ACTIVE", missedPayments: "",
});

const loanToDraft = (loan: Loan): LoanDraft => ({
  loanType: loan.loanType,
  loanName: loan.loanName,
  principalAmount: String(loan.principalAmount),
  outstandingAmount: String(loan.outstandingAmount),
  interestRate: String(loan.interestRate),
  originalTenureMonths: String(loan.originalTenureMonths),
  remainingTenureMonths: String(loan.remainingTenureMonths),
  monthlyEmi: String(loan.monthlyEmi),
  startDate: loan.startDate.slice(0, 10),
  status: loan.status,
  missedPayments: loan.missedPayments == null ? "" : String(loan.missedPayments),
});

const draftToLoan = (draft: LoanDraft): LoanInput => ({
  loanType: draft.loanType,
  loanName: draft.loanName.trim(),
  principalAmount: Number(draft.principalAmount),
  outstandingAmount: Number(draft.outstandingAmount),
  interestRate: Number(draft.interestRate),
  originalTenureMonths: Number(draft.originalTenureMonths),
  remainingTenureMonths: Number(draft.remainingTenureMonths),
  monthlyEmi: Number(draft.monthlyEmi),
  startDate: draft.startDate,
  status: draft.status,
  missedPayments: draft.missedPayments.trim() ? Number(draft.missedPayments) : null,
});

function LoanFields({ value, onChange }: { value: LoanDraft; onChange: (value: LoanDraft) => void }) {
  const field = (key: keyof LoanDraft) => (entry: string) => onChange({ ...value, [key]: entry });
  return <div className="form-grid loan-fields">
    <Field label="Loan type" type="select" value={value.loanType} onChange={field("loanType")} options={["Home Loan","Personal Loan","Education Loan","Vehicle Loan","Other"]}/>
    <Field label="Loan name" placeholder="A name to identify this loan" value={value.loanName} onChange={field("loanName")} required/>
    <Field label="Principal amount" placeholder="Enter principal" value={value.principalAmount} onChange={field("principalAmount")} inputType="number" min={0.01} step="0.01" suffix="₹" required/>
    <Field label="Outstanding amount" placeholder="Enter current balance" value={value.outstandingAmount} onChange={field("outstandingAmount")} inputType="number" min={0} step="0.01" suffix="₹" required/>
    <Field label="Interest rate" placeholder="Annual rate" value={value.interestRate} onChange={field("interestRate")} inputType="number" min={0} max={100} step="0.01" suffix="%" required/>
    <Field label="Original tenure" placeholder="Months" value={value.originalTenureMonths} onChange={field("originalTenureMonths")} inputType="number" min={1} suffix="months" required/>
    <Field label="Remaining tenure" placeholder="Months" value={value.remainingTenureMonths} onChange={field("remainingTenureMonths")} inputType="number" min={0} suffix="months" required/>
    <Field label="Monthly EMI" placeholder="Enter monthly EMI" value={value.monthlyEmi} onChange={field("monthlyEmi")} inputType="number" min={0} step="0.01" suffix="₹" required/>
    <Field label="Start date" value={value.startDate} onChange={field("startDate")} inputType="date" required/>
    <Field label="Loan status" type="select" value={value.status === "CLOSED" ? "Closed" : "Active"} onChange={(status) => onChange({ ...value, status: status === "Closed" ? "CLOSED" : "ACTIVE" })} options={["Active","Closed"]}/>
    <Field label="Missed payments (optional)" value={value.missedPayments} onChange={field("missedPayments")} inputType="number" min={0} step={1}/>
  </div>;
}

interface OnboardingValues {
  age: string;
  city: string;
  employmentType: string;
  dependents: string;
  monthlyIncome: string;
  otherMonthlyIncome: string;
  annualIncome: string;
  expenses: Expenses;
  loans: LoanDraft[];
}

const onboardingDefaults = (data: DashboardData): OnboardingValues => ({
  age: data.profile.age == null ? "" : String(data.profile.age),
  city: data.profile.city ?? "",
  employmentType: data.profile.employmentType ?? "Salaried",
  dependents: data.profile.dependents == null ? "" : String(data.profile.dependents),
  monthlyIncome: data.income ? String(data.income.monthlyIncome) : "",
  otherMonthlyIncome: data.income ? String(data.income.otherMonthlyIncome) : "",
  annualIncome: data.income ? String(data.income.annualIncome) : "",
  expenses: data.expenses ?? { rent: 0, utilities: 0, food: 0, transportation: 0, insurance: 0, otherExpenses: 0 },
  loans: data.loans.map(loanToDraft),
});

function Onboarding({ data, navigate, onComplete, onLogout }: {
  data: DashboardData; navigate: (page: string) => void; onComplete: () => Promise<void>; onLogout: () => Promise<void>;
}) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(() => onboardingDefaults(data));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const labels = ["Personal","Income","Loans","Expenses","Review"];

  function advance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (step < 4) {
      if (step === 1 && Number(values.monthlyIncome) + Number(values.otherMonthlyIncome) <= 0) {
        setError("Enter a monthly income to continue.");
        return;
      }
      setStep((previous) => previous + 1);
      return;
    }
    void save();
  }

  async function save() {
    setLoading(true);
    setError("");
    try {
      await sendJson("/onboarding", "POST", {
        profile: {
          age: values.age ? Number(values.age) : null,
          city: values.city || null,
          employmentType: values.employmentType || null,
          dependents: values.dependents ? Number(values.dependents) : null,
        },
        income: {
          monthlyIncome: Number(values.monthlyIncome),
          otherMonthlyIncome: Number(values.otherMonthlyIncome || 0),
          annualIncome: Number(values.annualIncome || (Number(values.monthlyIncome) + Number(values.otherMonthlyIncome || 0)) * 12),
        },
        expenses: Object.fromEntries(Object.entries(values.expenses).map(([key, entry]) => [key, Number(entry) || 0])),
        loans: values.loans.map(draftToLoan),
      });
      await onComplete();
      navigate("dashboard");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your profile could not be saved.");
    } finally {
      setLoading(false);
    }
  }

  const change = (key: "age" | "city" | "employmentType" | "dependents" | "monthlyIncome" | "otherMonthlyIncome" | "annualIncome") =>
    (value: string) => setValues((previous) => ({ ...previous, [key]: value }));
  const expenseField = (key: keyof Expenses) => (value: string) =>
    setValues((previous) => ({ ...previous, expenses: { ...previous.expenses, [key]: Number(value) || 0 } }));
  const panel = [
    <div className="form-grid" key="p">
      <Field label="Age" placeholder="Your age" value={values.age} onChange={change("age")} inputType="number" min={13} max={120}/>
      <Field label="Employment type" type="select" value={values.employmentType} onChange={change("employmentType")} options={["Salaried","Self-employed","Business owner","Student","Other"]}/>
      <Field label="City" placeholder="Your city" value={values.city} onChange={change("city")}/>
      <Field label="Number of dependents" placeholder="Number of dependents" value={values.dependents} onChange={change("dependents")} inputType="number" min={0}/>
    </div>,
    <div className="form-grid" key="i">
      <Field label="Monthly income" placeholder="Enter monthly income" value={values.monthlyIncome} onChange={change("monthlyIncome")} inputType="number" min={0} step="0.01" suffix="₹" required/>
      <Field label="Other monthly income" placeholder="Enter other monthly income" value={values.otherMonthlyIncome} onChange={change("otherMonthlyIncome")} inputType="number" min={0} step="0.01" suffix="₹"/>
      <Field label="Annual income" placeholder="Calculated from your monthly income if blank" value={values.annualIncome} onChange={change("annualIncome")} inputType="number" min={0} step="0.01" suffix="₹"/>
      <div className="form-tip"><Icon name="insights"/><span>We use your entered income to calculate debt-to-income and EMI burden ratios.</span></div>
    </div>,
    <div key="l">
      {!values.loans.length && <EmptyState>No loans entered. You can add them later from My loans.</EmptyState>}
      {values.loans.map((loan, index) => <div className="onboard-loan" key={index}>
        <div className="loan-form-head"><div><span className="loan-number">{String(index + 1).padStart(2, "0")}</span><strong>{loan.loanName || loan.loanType}</strong></div><button type="button" onClick={() => setValues((previous) => ({ ...previous, loans: previous.loans.filter((_, i) => i !== index) }))}>Remove</button></div>
        <LoanFields value={loan} onChange={(updated) => setValues((previous) => ({ ...previous, loans: previous.loans.map((item, i) => i === index ? updated : item) }))}/>
      </div>)}
      <Button variant="secondary" icon="plus" onClick={() => setValues((previous) => ({ ...previous, loans: [...previous.loans, emptyLoan()] }))}>Add another loan</Button>
    </div>,
    <div className="form-grid" key="e">
      {([["rent","Rent"],["utilities","Utilities"],["food","Food"],["transportation","Transportation"],["insurance","Insurance"],["otherExpenses","Other expenses"]] as [keyof Expenses,string][]).map(([key,label]) =>
        <Field key={key} label={label} placeholder={`Enter monthly ${label.toLowerCase()}`} value={values.expenses[key]} onChange={expenseField(key)} inputType="number" min={0} step="0.01" suffix="₹"/>)}
    </div>,
    <div className="review-grid" key="r">
      <ReviewBlock title="Personal details" rows={[["Age", values.age ? `${values.age} years` : "Not provided"],["Employment", values.employmentType || "Not provided"],["City", values.city || "Not provided"],["Dependents", values.dependents || "Not provided"]]}/>
      <ReviewBlock title="Income" rows={[["Monthly income", money(Number(values.monthlyIncome || 0))],["Other income", money(Number(values.otherMonthlyIncome || 0))],["Annual income", money(Number(values.annualIncome || (Number(values.monthlyIncome) + Number(values.otherMonthlyIncome || 0)) * 12))]]}/>
      <ReviewBlock title="Existing loans" rows={values.loans.length ? values.loans.map((loan, index) => [`${loan.loanName || loan.loanType || `Loan ${index + 1}`} · EMI`, money(Number(loan.monthlyEmi || 0))]) : [["Loans", "None entered"]]}/>
      <ReviewBlock title="Monthly expenses" rows={[["Household total", money(Object.values(values.expenses).reduce((total, value) => total + Number(value || 0), 0))],["Available before EMI", money(Number(values.monthlyIncome || 0) + Number(values.otherMonthlyIncome || 0) - Object.values(values.expenses).reduce((total, value) => total + Number(value || 0), 0))]]}/>
    </div>,
  ];

  return <div className="onboarding">
    <header><Logo/><span>Financial profile setup</span><button onClick={() => void onLogout()}>Log out</button></header>
    <div className="onboard-shell">
      <div className="onboard-title"><span>STEP {step + 1} OF 5</span><h1>{step === 4 ? "Review your financial profile" : `Tell us about your ${labels[step].toLowerCase()}`}</h1><p>{step === 4 ? "Check that everything looks right before calculating your score." : "Your information helps us build a more accurate, transparent financial picture."}</p></div>
      <div className="stepper">{labels.map((label,index) => <div className={`${index <= step ? "active" : ""} ${index < step ? "done" : ""}`} key={label}><i>{index < step ? <Icon name="check" size={14}/> : index + 1}</i><span>{label}</span></div>)}</div>
      <form className="onboard-card" onSubmit={advance}>
        {error && <Notice>{error}</Notice>}
        {panel[step]}
        <div className="onboard-actions"><Button variant="ghost" onClick={() => step === 0 ? navigate("dashboard") : setStep((previous) => previous - 1)}>{step === 0 ? "Cancel" : "Back"}</Button><Button type="submit" disabled={loading} icon={step === 4 ? undefined : "arrow"}>{loading ? "Saving..." : step === 4 ? "Calculate my Credora Score" : "Continue"}</Button></div>
      </form>
      <div className="privacy-line"><Icon name="shield" size={15}/> Your information stays private and is only used for this analysis.</div>
    </div>
  </div>;
}

function ReviewBlock({ title, rows }: { title: string; rows: string[][] }) {
  return <div className="review-block"><div><strong>{title}</strong></div>{rows.map((row) => <p key={row[0]}><span>{row[0]}</span><b>{row[1]}</b></p>)}</div>;
}

const navItems: [string, IconName, string][] = [
  ["Dashboard","grid","dashboard"],["My loans","wallet","loans"],["Credora score","score","score"],
  ["What-if calculator","calculator","calculator"],["Financial insights","insights","insights"],
  ["Tax overview","tax","tax"],["Reports","report","reports"],["Profile","user","profile"],["Settings","settings","settings"],
];

function AppShell({ page, navigate, data, refresh, profile, onProfileChange, onLogout, isDemo }: {
  page: string; navigate: (page: string) => void; data: DashboardData; refresh: () => Promise<void>;
  profile: Profile; onProfileChange: (profile: Profile) => void; onLogout: () => Promise<void>;
  isDemo: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sectionError, setSectionError] = useState("");
  const [tax, setTax] = useState<TaxEstimate | null>(null);
  const [report, setReport] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const titles: Record<string,string> = { dashboard:"Dashboard", loans:"My loans", score:"Credora score", calculator:"What-if calculator", insights:"Financial insights", tax:"Tax overview", reports:"Reports", profile:"Profile", settings:"Settings" };
  const showMonthlySummary = isDemo || localStorage.getItem(`credora:${profile.id}:monthly-summary`) !== "false";
  const showScoreBreakdown = isDemo || localStorage.getItem(`credora:${profile.id}:score-breakdown`) !== "false";

  useEffect(() => {
    let active = true;
    setSectionError("");
    if (isDemo) return () => { active = false; };
    if (page !== "tax" && page !== "reports") return () => { active = false; };
    setLoading(true);
    const load = page === "tax" ? api<TaxEstimate>("/tax") : api<DashboardData>("/reports");
    void load.then((result) => {
      if (!active) return;
      if (page === "tax") setTax(result as TaxEstimate);
      else setReport(result as DashboardData);
    }).catch((cause: unknown) => {
      if (active) setSectionError(cause instanceof Error ? cause.message : "This page could not be loaded.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, data.score?.id, data.scenarios.length, isDemo]);

  const content = page === "dashboard" ? <Dashboard data={data} navigate={navigate} showMonthlySummary={showMonthlySummary} showScoreBreakdown={showScoreBreakdown} isDemo={isDemo}/>
    : page === "loans" ? <Loans data={data} afterMutation={refresh}/>
    : page === "score" ? <ScorePage data={data} afterMutation={refresh}/>
    : page === "calculator" ? <Calculator data={data} afterSave={refresh} isDemo={isDemo}/>
    : page === "insights" ? <Insights data={data} navigate={navigate}/>
    : page === "tax" ? <TaxPage data={data} estimate={tax} loading={loading} navigate={navigate}/>
    : page === "reports" ? <Reports data={report ?? data} loading={loading}/>
    : <SettingsPage section={page} profile={profile} navigate={navigate} refresh={refresh} onProfileChange={onProfileChange} onLogout={onLogout}/>;

  return <div className="app-shell">
    <aside className={mobileOpen ? "open" : ""}>
      <div className="side-logo"><Logo light/><button onClick={() => setMobileOpen(false)}><Icon name="close"/></button></div>
      <nav>{(isDemo ? navItems.filter(([, , key]) => key === "dashboard" || key === "calculator") : navItems).map(([label,icon,key]) => <button className={page === key ? "active" : ""} onClick={() => { navigate(key); setMobileOpen(false); }} key={key}><Icon name={icon}/><span>{isDemo && key === "calculator" ? "What-if demo" : label}</span>{key === "calculator" && !isDemo && <i>NEW</i>}</button>)}</nav>
      <div className="sidebar-foot">{!isDemo && <button onClick={() => navigate("profile")}><Icon name="help"/><span>Help & support</span></button>}<button onClick={() => void onLogout()}><Icon name="logout"/><span>{isDemo ? "Exit demo" : "Log out"}</span></button></div>
    </aside>
    <div className="app-main">
      <header className="app-header"><div className="app-heading"><button className="mobile-menu" onClick={() => setMobileOpen(true)}><Icon name="menu"/></button><div><span>OVERVIEW</span><h1>{titles[page] || "Dashboard"}</h1></div></div><div className="header-actions">{!isDemo && <><button className="notify" onClick={() => navigate("insights")} aria-label="View insights"><Icon name="bell"/><i/></button><button className="profile-chip" onClick={() => navigate("profile")}><div className="avatar">{initials(profile.fullName)}</div><span><strong>{profile.fullName}</strong><small>Personal account</small></span><b>⌄</b></button></>}</div></header>
      <main className="app-content">{isDemo && <div className="demo-banner" role="status"><strong>Demo mode</strong><span>You’re viewing sample data. Nothing you enter is saved.</span></div>}{sectionError && <Notice>{sectionError}</Notice>}{content}</main>
    </div>
  </div>;
}

const StatCard = ({ label, value, note, icon, tone }: { label:string; value:string; note:string; icon:IconName; tone?:string }) =>
  <div className="stat-card"><div className={`stat-icon ${tone || ""}`}><Icon name={icon}/></div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></div>;

function Dashboard({ data, navigate, showMonthlySummary, showScoreBreakdown, isDemo }: { data: DashboardData; navigate: (page: string) => void; showMonthlySummary: boolean; showScoreBreakdown: boolean; isDemo: boolean }) {
  const { metrics, score, previousScore } = data;
  const delta = score && previousScore ? score.score - previousScore.score : null;
  const activeLoans = data.loans.filter((loan) => loan.status === "ACTIVE");
  const factors = score ? [
    ["Payment history", score.paymentHistoryScore, data.loans.some((loan) => loan.missedPayments != null) ? "Based on missed payments you reported" : "No payment history supplied; neutral baseline"],
    ["Credit utilisation", score.creditUtilisationScore, "Outstanding vs original principal"],
    ["Debt burden", score.debtBurdenScore, "EMIs relative to monthly income"],
    ["Credit history", score.creditHistoryScore, "Time since oldest loan"],
    ["Recent activity", score.recentActivityScore, "Loans opened in the last year"],
  ] as [string, number, string][] : [];
  const allocationBase = Math.max(metrics.monthlyIncome, metrics.monthlyEmi + metrics.monthlyExpenses);
  const emiShare = allocationBase ? metrics.monthlyEmi / allocationBase * 100 : 0;
  const expenseShare = allocationBase ? metrics.monthlyExpenses / allocationBase * 100 : 0;
  const donutBackground = `conic-gradient(var(--blue) 0 ${emiShare}%,#67b8b0 ${emiShare}% ${emiShare + expenseShare}%,#dbe5eb ${emiShare + expenseShare}% 100%)`;

  return <div className="dashboard">
    <div className="welcome-row"><div><h2>{greeting()}, {data.profile.fullName.split(/\s+/)[0]}</h2><p>Your financial overview · {fullDate(new Date())}</p></div><div className="quick-actions">{isDemo ? <Button icon="calculator" onClick={() => navigate("calculator")}>Try what-if demo</Button> : <><Button variant="secondary" icon="plus" onClick={() => navigate("loans")}>Add loan</Button><Button icon="calculator" onClick={() => navigate("calculator")}>Try what-if</Button></>}</div></div>
    {!data.hasFinancialProfile ? <EmptyState action={<Button onClick={() => navigate("onboarding")}>Complete financial profile</Button>}>Complete your financial profile to calculate your Credora Score.</EmptyState> : <>
      <div className="hero-grid">
        <section className="score-card"><div className="card-title"><div><span>CREDORA SCORE</span><h3>Your financial health</h3></div>{!isDemo && <button onClick={() => navigate("score")}>View details <Icon name="arrow" size={14}/></button>}</div><div className="score-body"><ScoreRing score={score?.score}/><div className="score-summary"><span className={`status ${score && score.score >= 720 ? "healthy" : "warning"}`}>{score ? score.score >= 720 ? "Healthy" : score.score >= 600 ? "Building" : "Needs attention" : "Not calculated"}</span><p>{score ? "Your educational score reflects the financial information entered in your profile." : "Recalculate your score after adding your income and loan information."}</p><div className="score-meta"><div><span>Previous score</span><strong>{previousScore?.score ?? "—"}</strong></div><div><span>Score change</span><strong className={delta != null && delta >= 0 ? "positive" : ""}>{delta == null ? "—" : `${delta >= 0 ? "↑" : "↓"} ${Math.abs(delta)} pts`}</strong></div><div><span>Last calculated</span><strong>{score ? fullDate(score.calculatedAt) : "—"}</strong></div></div></div></div><Disclaimer compact/></section>
        {showMonthlySummary && <section className="snapshot-card"><div className="card-title"><div><span>MONTHLY SNAPSHOT</span><h3>Income allocation</h3></div><span>{new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date())}</span></div><div className="donut-row"><div className="donut" style={{ background: donutBackground }}><div><b>{money(metrics.monthlyIncome)}</b><span>Income</span></div></div><div className="legend"><p><i className="emi"/>EMIs <b>{money(metrics.monthlyEmi)}</b></p><p><i className="expense"/>Expenses <b>{money(metrics.monthlyExpenses)}</b></p><p><i className="available"/>Available <b>{money(metrics.disposableIncome)}</b></p></div></div>{!isDemo && <button className="link-btn" onClick={() => navigate("insights")}>View financial insights <Icon name="arrow" size={14}/></button>}</section>}
      </div>
      <div className="stats-grid"><StatCard label="Monthly income" value={money(metrics.monthlyIncome)} note={metrics.otherMonthlyIncome ? `${money(metrics.otherMonthlyIncome)} other income` : "Including other monthly income"} icon="wallet"/><StatCard label="Total monthly EMI" value={money(metrics.monthlyEmi)} note={`${percentage(metrics.emiToIncome)} of monthly income`} icon="calculator" tone="amber"/><StatCard label="Outstanding debt" value={money(metrics.outstandingDebt)} note={`Across ${metrics.activeLoanCount} active loans`} icon="report" tone="purple"/><StatCard label="Disposable income" value={money(metrics.disposableIncome)} note="After entered expenses and EMIs" icon="trend" tone="green"/></div>
      <section className="analytics-section">
        <div className="analytics-heading"><div><span className="kicker">YOUR FINANCIAL PICTURE</span><h2>Understand where you stand</h2><p>A visual breakdown of your monthly cash flow, loans and Credora Score factors.</p></div></div>
        <div className="analytics-grid">
          <section className="analytics-card cashflow-card">
            <div className="card-title"><div><span>MONTHLY CASH FLOW</span><h3>Where your income goes</h3></div><span>{money(metrics.monthlyIncome)} / month</span></div>
            <CashFlowChart income={metrics.monthlyIncome} expenses={metrics.monthlyExpenses} emi={metrics.monthlyEmi} disposable={metrics.disposableIncome}/>
          </section>
          <section className="analytics-card loan-chart-card">
            <div className="card-title"><div><span>LOAN PORTFOLIO</span><h3>Balances and repayment</h3></div><span>{activeLoans.length} active</span></div>
            <LoanBalanceChart loans={activeLoans}/>
          </section>
          {showScoreBreakdown && <section className="analytics-card score-chart-card">
            <div className="card-title"><div><span>CREDORA SCORE</span><h3>What shapes your score</h3></div><span>{score ? `${score.score} / 900` : "Not calculated"}</span></div>
            {score ? <ScoreFactorsChart factors={factors}/> : <EmptyState>Complete your financial profile to see your score factor analysis.</EmptyState>}
          </section>}
          <section className="insight-card analytics-insight"><div className="insight-head"><span>FINANCIAL INSIGHTS</span><div><Icon name="insights"/></div></div><h3>{data.insights[0]?.title ?? "Your profile is ready for analysis."}</h3><p>{data.insights[0]?.detail ?? "Add financial information to see personalised observations."}</p>{!isDemo && <button onClick={() => navigate("insights")}>View insights <Icon name="arrow" size={14}/></button>}</section>
        </div>
      </section>
    </>}
  </div>;
}

function CashFlowChart({ income, expenses, emi, disposable }: { income: number; expenses: number; emi: number; disposable: number }) {
  const available = Math.max(0, disposable);
  const total = Math.max(income, expenses + emi + available, 1);
  const segments = [
    { label: "Household expenses", value: expenses, color: "expense" },
    { label: "Loan repayments", value: emi, color: "repayment" },
    { label: "Left after expenses & EMIs", value: available, color: "available" },
  ];
  return <div className="cashflow-chart">
    {income > 0 ? <>
      <div className="cashflow-bar" role="img" aria-label={`Monthly income allocation: ${money(expenses)} household expenses, ${money(emi)} loan repayments, ${money(disposable)} remaining.`}>
        {segments.filter((segment) => segment.value > 0).map((segment) => <div key={segment.label} className={`cashflow-segment ${segment.color}`} style={{ width: `${segment.value / total * 100}%` }} title={`${segment.label}: ${money(segment.value)}`}/>)}
      </div>
      <div className="cashflow-legend">{segments.map((segment) => <div key={segment.label}><span><i className={segment.color}/>{segment.label}</span><strong>{money(segment.value)}</strong><small>{percentage(segment.value / income * 100)}</small></div>)}</div>
      {disposable < 0 && <p className="chart-note negative">Your listed expenses and EMIs exceed monthly income by {money(Math.abs(disposable))}.</p>}
    </> : <EmptyState>Add income details to see your monthly cash flow.</EmptyState>}
  </div>;
}

function LoanBalanceChart({ loans }: { loans: Loan[] }) {
  const largestPrincipal = Math.max(...loans.map((loan) => loan.principalAmount), 0);
  return loans.length ? <div className="loan-balance-chart">
    <p className="chart-explainer">Bar length compares original loan size. The darker portion is still outstanding.</p>
    {loans.map((loan) => {
      const principalWidth = loan.principalAmount / largestPrincipal * 100;
      const outstandingWidth = loan.principalAmount ? loan.outstandingAmount / loan.principalAmount * 100 : 0;
      const repaid = Math.max(0, loan.principalAmount - loan.outstandingAmount);
      return <div className="loan-chart-row" key={loan.id}>
        <div className="loan-chart-label"><strong>{loan.loanName}</strong><span>{money(loan.outstandingAmount)} left of {money(loan.principalAmount)}</span></div>
        <div className="loan-chart-track" role="img" aria-label={`${loan.loanName}: ${money(loan.outstandingAmount)} outstanding of ${money(loan.principalAmount)}`}>
          <div className="loan-chart-principal" style={{ width: `${principalWidth}%` }}><i style={{ width: `${Math.min(100, Math.max(0, outstandingWidth))}%` }}/></div>
        </div>
        <small>{money(repaid)} repaid</small>
      </div>;
    })}
    <div className="chart-legend"><span><i className="outstanding-key"/>Outstanding</span><span><i className="repaid-key"/>Repaid</span></div>
  </div> : <EmptyState>No active loans. If you add a loan, its outstanding balance and repayment progress will appear here.</EmptyState>;
}

function ScoreFactorsChart({ factors }: { factors: [string, number, string][] }) {
  const rating = (value: number) => value >= 80 ? "Strong" : value >= 60 ? "Good" : value >= 40 ? "Fair" : "Needs work";
  return <div className="score-factors-chart">
    <p className="chart-explainer">Each bar shows a factor rating out of 100. Higher bars indicate a stronger factor.</p>
    <div className="factor-bars">{factors.map(([name, value, description]) => <div className="factor-bar-item" key={name} title={description}>
      <div className="factor-bar-value">{value}<small>/100</small></div>
      <div className="factor-bar-track" role="img" aria-label={`${name}: ${value} out of 100`}><i style={{ height: `${Math.min(100, Math.max(0, value))}%` }}/></div>
      <strong>{name}</strong><span>{rating(value)}</span>
    </div>)}</div>
  </div>;
}

function rating(value: number) {
  return value >= 80 ? "Strong" : value >= 60 ? "Good" : value >= 40 ? "Average" : "Needs attention";
}

function Loans({ data, afterMutation }: { data: DashboardData; afterMutation: () => Promise<void> }) {
  const [draft, setDraft] = useState<LoanDraft | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [details, setDetails] = useState<Loan | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const active = data.loans.filter((loan) => loan.status === "ACTIVE");
  const principal = active.reduce((sum, loan) => sum + loan.principalAmount, 0);
  const repaid = Math.max(0, principal - data.metrics.outstandingDebt);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    setBusy(true);
    setError("");
    try {
      await sendJson(`/loans${editing ? `/${editing}` : ""}`, editing ? "PUT" : "POST", draftToLoan(draft));
      await afterMutation();
      setMessage(editing ? "Loan updated." : "Loan added.");
      setDraft(null);
      setEditing(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The loan could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(loan: Loan) {
    if (!window.confirm(`Delete “${loan.loanName}”? This action cannot be undone.`)) return;
    setError("");
    try {
      await api(`/loans/${loan.id}`, { method: "DELETE" });
      await afterMutation();
      setMessage("Loan deleted.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The loan could not be deleted.");
    }
  }

  const startEdit = (loan?: Loan) => {
    setEditing(loan?.id ?? null);
    setDraft(loan ? loanToDraft(loan) : emptyLoan());
    setError("");
  };

  return <div><div className="page-intro"><div><h2>My loans</h2><p>Track your active loans, repayment progress and monthly commitments.</p></div><Button icon="plus" onClick={() => startEdit()}>Add new loan</Button></div>
    {error && <Notice>{error}</Notice>}{message && <Notice tone="success">{message}</Notice>}
    <div className="loan-summary"><div><span>Total outstanding debt</span><strong>{money(data.metrics.outstandingDebt)}</strong><small>Across {data.metrics.activeLoanCount} active loans</small></div><div><span>Total monthly EMI</span><strong>{money(data.metrics.monthlyEmi)}</strong><small>{percentage(data.metrics.debtToIncome)} of monthly income</small></div><div><span>Average interest rate</span><strong>{active.length ? `${data.metrics.averageInterestRate.toFixed(1)}%` : "—"}</strong><small>Weighted across active loans</small></div></div>
    <section className="table-card"><div className="table-title"><div><h3>Loans</h3><span>{data.loans.length} recorded</span></div></div>
      {!data.loans.length ? <EmptyState action={<Button icon="plus" onClick={() => startEdit()}>Add your first loan</Button>}>Your recorded loans will appear here.</EmptyState>
        : <div className="loan-table"><div className="table-row table-head"><span>Loan</span><span>Outstanding</span><span>Interest rate</span><span>Monthly EMI</span><span>Remaining</span><span>Status</span><span>Actions</span></div>{data.loans.map((loan) => <div className="table-row" key={loan.id}><span className="loan-name"><i><Icon name={loan.loanType.toLowerCase().includes("home") ? "home" : loan.loanType.toLowerCase().includes("vehicle") ? "car" : loan.loanType.toLowerCase().includes("education") ? "education" : "wallet"}/></i><b>{loan.loanName}<small>{loan.loanType}</small></b></span><span><b>{money(loan.outstandingAmount)}</b><small>of {money(loan.principalAmount)}</small></span><span>{loan.interestRate}%</span><span>{money(loan.monthlyEmi)}</span><span>{loan.remainingTenureMonths} months</span><span><em className={loan.status === "ACTIVE" ? "" : "closed-status"}>{loan.status === "ACTIVE" ? "Active" : "Closed"}</em></span><span className="row-actions inline-actions"><button onClick={() => setDetails(loan)}>View</button><button onClick={() => startEdit(loan)}>Edit</button><button onClick={() => void remove(loan)} aria-label={`Delete ${loan.loanName}`}>Delete</button></span></div>)}</div>}
    </section>
    <section className="repayment-card"><div className="card-title"><div><span>REPAYMENT PROGRESS</span><h3>Overall loan repayment</h3></div><strong>{percentage(data.metrics.repaymentProgress)} repaid</strong></div><div className="repayment-progress"><i style={{width:`${Math.max(0, Math.min(100, data.metrics.repaymentProgress))}%`}}/></div><div><span>Original principal <b>{money(principal)}</b></span><span>Amount repaid <b>{money(repaid)}</b></span><span>Current outstanding <b>{money(data.metrics.outstandingDebt)}</b></span></div></section>
    {draft && <Modal title={editing ? "Edit loan" : "Add a new loan"} close={() => { setDraft(null); setEditing(null); }}><form onSubmit={save}><LoanFields value={draft} onChange={setDraft}/><div className="modal-actions"><Button variant="ghost" onClick={() => setDraft(null)}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? "Saving..." : "Save loan"}</Button></div></form></Modal>}
    {details && <Modal title={details.loanName} close={() => setDetails(null)}><div className="loan-details"><ReviewBlock title="Loan details" rows={[["Type",details.loanType],["Status",details.status],["Principal",money(details.principalAmount)],["Outstanding",money(details.outstandingAmount)],["Interest rate",`${details.interestRate}%`],["Monthly EMI",money(details.monthlyEmi)],["Original tenure",`${details.originalTenureMonths} months`],["Remaining tenure",`${details.remainingTenureMonths} months`],["Start date",fullDate(details.startDate)],["Reported missed payments",String(details.missedPayments)]]}/></div></Modal>}
  </div>;
}

function Modal({title,close,children}:{title:string;close:()=>void;children:ReactNode}) {
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><div className="modal" role="dialog" aria-modal="true" aria-label={title}><div className="modal-head"><h3>{title}</h3><button type="button" onClick={close} aria-label="Close"><Icon name="close"/></button></div>{children}</div></div>;
}

function ScorePage({ data, afterMutation }: { data: DashboardData; afterMutation: () => Promise<void> }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const score = data.score;
  const factors = score ? [
    ["Payment history",score.paymentHistoryScore,data.loans.some((loan) => loan.missedPayments != null) ? "Uses the missed-payment counts you reported for your loans." : "No payment history was supplied, so this factor uses a neutral baseline.","Add or update a loan's reported missed-payment count when known."],
    ["Credit utilisation",score.creditUtilisationScore,"An educational loan-balance proxy: outstanding balance relative to original principal, not bureau-reported revolving credit utilisation.","Reducing outstanding balances improves this proxy."],
    ["Debt burden",score.debtBurdenScore,"Monthly loan EMIs relative to monthly income.","Consider affordability before adding another EMI."],
    ["Credit history",score.creditHistoryScore,"Based on the age of your oldest active recorded loan.","Maintaining older accounts increases this factor over time."],
    ["Recent credit activity",score.recentActivityScore,"Based on loans opened in the last 12 months.","Space new borrowing decisions where possible."],
  ] as [string,number,string,string][] : [];

  async function recalculate() {
    setBusy(true);
    setError("");
    try {
      await api<Score | null>("/score", { method: "POST" });
      await afterMutation();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your score could not be recalculated.");
    } finally {
      setBusy(false);
    }
  }

  return <div><div className="page-intro"><div><h2>Your Credora score</h2><p>A transparent view of the factors shaping your financial health.</p></div><Button variant="secondary" icon="clock" onClick={() => void recalculate()} disabled={busy}>{busy ? "Calculating..." : "Recalculate score"}</Button></div>
    {error && <Notice>{error}</Notice>}
    {!data.hasFinancialProfile || !score ? <EmptyState>Complete your financial profile to calculate your Credora Score.</EmptyState> : <>
      <section className="score-hero"><div><span className="kicker">CALCULATED {fullDate(score.calculatedAt).toUpperCase()}</span><ScoreRing score={score.score}/></div><div className="score-hero-copy"><span className={`status ${score.score >= 720 ? "healthy" : "warning"}`}>{score.score >= 720 ? "Healthy financial profile" : score.score >= 600 ? "Building financial profile" : "Profile needs attention"}</span><h2>Your score reflects your entered financial information.</h2><p>This educational score uses the income and active-loan details in your profile. It is not an official credit bureau score.</p><div className="score-scale"><div className="scale-bar"><i/><i/><i/><i/></div><div><span>Needs attention</span><span>Fair</span><span>Good</span><span>Healthy</span></div></div></div><div className="score-change"><Icon name="trend"/><span>Since last calculation<strong>{data.previousScore ? `${score.score - data.previousScore.score >= 0 ? "+" : ""}${score.score - data.previousScore.score} points` : "No previous calculation"}</strong></span><small>{data.previousScore ? "Compared with previous score" : "First calculation"}</small></div></section>
      <Disclaimer/>
      <div className="factor-card-grid">{factors.map(([name,value,description,tip]) => <section className="factor-detail" key={name}><div className="factor-detail-head"><div className="feature-icon"><Icon name={name === "Payment history" ? "clock" : name === "Debt burden" ? "wallet" : name === "Recent credit activity" ? "trend" : "insights"}/></div><span><h3>{name}</h3><small>{rating(value)}</small></span><strong>{value}<i>/100</i></strong></div><div className="progress large"><i style={{width:`${value}%`}}/></div><p>{description}</p><div className="tip"><Icon name="trend" size={15}/><span><b>How to improve</b>{tip}</span></div></section>)}</div>
      <p className="scoring-weights">Project weights: payment history 30%, credit utilisation 20%, debt burden 20%, credit history 15%, and recent credit activity 15%.</p>
    </>}
  </div>;
}

function Calculator({ data, afterSave, isDemo }: { data: DashboardData; afterSave: () => Promise<void>; isDemo: boolean }) {
  const [loanType, setLoanType] = useState("Personal Loan");
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("");
  const [years, setYears] = useState("");
  const [processingFee, setProcessingFee] = useState("");
  const [name, setName] = useState("");
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const loanAmount = Number(amount);
      const interestRate = Number(rate);
      const tenureMonths = Number(years) * 12;
      const fee = Number(processingFee || 0);
      let value: CalculatorResult;
      if (isDemo) {
        const monthlyIncome = data.metrics.monthlyIncome;
        const monthlyRate = interestRate / 1200;
        const factor = (1 + monthlyRate) ** tenureMonths;
        const calculatedEmi = monthlyRate
          ? (loanAmount * monthlyRate * factor) / (factor - 1)
          : loanAmount / tenureMonths;
        const projectedMonthlyEmi = data.metrics.monthlyEmi + calculatedEmi;
        const currentFactors = data.score ? {
          paymentHistory: data.score.paymentHistoryScore,
          creditUtilisation: data.score.creditUtilisationScore,
          debtBurden: data.score.debtBurdenScore,
          creditHistory: data.score.creditHistoryScore,
          recentActivity: data.score.recentActivityScore,
        } : { paymentHistory: 50, creditUtilisation: 50, debtBurden: 50, creditHistory: 50, recentActivity: 50 };
        const totalPrincipal = data.loans.reduce((sum, loan) => sum + loan.principalAmount, 0);
        const projectedFactors = {
          ...currentFactors,
          creditUtilisation: Math.max(0, currentFactors.creditUtilisation - (loanAmount / Math.max(loanAmount, totalPrincipal + loanAmount)) * 100),
          debtBurden: Math.max(0, currentFactors.debtBurden - (calculatedEmi / monthlyIncome) * 100),
          recentActivity: Math.max(0, currentFactors.recentActivity - 20),
        };
        const projectedScore = Math.round(300 + (
          projectedFactors.paymentHistory * 0.3 +
          projectedFactors.creditUtilisation * 0.2 +
          projectedFactors.debtBurden * 0.2 +
          projectedFactors.creditHistory * 0.15 +
          projectedFactors.recentActivity * 0.15
        ) * 6);
        value = {
          loanType,
          loanAmount,
          interestRate,
          tenureMonths,
          processingFee: fee,
          calculatedEmi,
          current: {
            score: data.score?.score ?? null,
            monthlyEmi: data.metrics.monthlyEmi,
            dti: data.metrics.debtToIncome,
            disposableIncome: data.metrics.disposableIncome,
            outstandingDebt: data.metrics.outstandingDebt,
          },
          projected: {
            score: projectedScore,
            scoreFactors: projectedFactors,
            monthlyEmi: projectedMonthlyEmi,
            dti: (projectedMonthlyEmi / monthlyIncome) * 100,
            disposableIncome: data.metrics.disposableIncome - calculatedEmi,
            outstandingDebt: data.metrics.outstandingDebt + loanAmount,
            totalInterest: Math.max(0, calculatedEmi * tenureMonths - loanAmount),
          },
        };
      } else {
        value = await sendJson<CalculatorResult>("/calculator/calculate", "POST", {
          loanType, loanAmount, interestRate, tenureMonths, processingFee: fee,
        });
      }
      setResult(value);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The calculation could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  async function saveScenario() {
    if (!result) return;
    if (!name.trim()) {
      setError("Enter a name for this scenario before saving.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await sendJson<Scenario>("/scenarios", "POST", {
        name: name.trim(), loanType, loanAmount: Number(amount), interestRate: Number(rate),
        tenureMonths: Number(years) * 12, processingFee: Number(processingFee || 0),
      } satisfies ScenarioInput);
      await afterSave();
      setMessage("Scenario saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The scenario could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteScenario(scenario: Scenario) {
    if (!window.confirm(`Delete “${scenario.name}”?`)) return;
    setError("");
    try {
      await api(`/scenarios/${scenario.id}`, { method: "DELETE" });
      await afterSave();
      setMessage("Scenario deleted.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The scenario could not be deleted.");
    }
  }

  return <div><div className="page-intro"><div><h2>What happens if I take another loan?</h2><p>{isDemo ? "Try the calculator with sample data. Your inputs stay in this session and are not saved." : "Simulate a potential loan using your saved financial profile."}</p></div>{!isDemo && <span className="saved"><Icon name="report" size={15}/> {data.scenarios.length} saved scenarios</span>}</div>
    {error && <Notice>{error}</Notice>}{message && <Notice tone="success">{message}</Notice>}
    {!data.hasFinancialProfile ? <EmptyState>Complete your financial profile before using the loan calculator.</EmptyState> : <div className="calculator-layout">
      <form className="calculator-form" onSubmit={calculate}><div className="card-title"><div><span>NEW LOAN DETAILS</span><h3>Build your scenario</h3></div><span className="step-chip">{isDemo ? "Sample profile" : "Your profile"}</span></div>
        <Field label="Loan type" type="select" value={loanType} onChange={setLoanType} options={["Personal Loan","Home Loan","Vehicle Loan","Education Loan","Other"]}/>
        <Field label="Loan amount" value={amount} onChange={setAmount} inputType="number" min={1} step="0.01" suffix="₹" required/>
        <div className="range-label"><span>₹50,000</span><span>₹25,00,000</span></div><input aria-label="Loan amount range" className="range" type="range" min="50000" max="2500000" step="10000" value={amount ? Math.max(50000, Math.min(2500000, Number(amount))) : 50000} onChange={(event) => setAmount(event.target.value)}/>
        <div className="field-row"><Field label="Interest rate" value={rate} onChange={setRate} inputType="number" min={0} max={100} step="0.01" suffix="% p.a." required/><Field label="Loan tenure" value={years} onChange={setYears} inputType="number" min={1} max={100} step={1} suffix="years" required/></div>
        <Field label="Processing fee" value={processingFee} onChange={setProcessingFee} inputType="number" min={0} step="0.01" suffix="₹"/>
        {!isDemo && <Field label="Scenario name" placeholder="Optional until you save" value={name} onChange={setName}/>}
        <Button type="submit" className="full" icon="calculator" disabled={busy}>{busy ? "Calculating..." : isDemo ? "Calculate demo impact" : "Calculate impact"}</Button><small className="form-caveat"><Icon name="shield" size={14}/> Results are estimates based on the details you enter.</small>
      </form>
      <section className="impact-panel"><div className="impact-head"><div><span>IMPACT PREVIEW</span><h3>Your financial position</h3></div><span className="status warning">{result ? result.projected.dti >= 40 ? "Review affordability" : "Projected estimate" : "Awaiting details"}</span></div>
        {result ? <><div className="comparison-head"><span>Current</span><Icon name="arrow"/><span>After new loan</span></div><div className="comparison-list">
          <Compare label="Credora score" before={result.current.score == null ? "—" : String(result.current.score)} after={String(result.projected.score)} delta={result.current.score == null ? "—" : `${result.projected.score - result.current.score >= 0 ? "+" : ""}${result.projected.score - result.current.score} pts`} bad={result.current.score != null && result.projected.score < result.current.score}/>
          <Compare label="Monthly EMI" before={money(result.current.monthlyEmi)} after={money(result.projected.monthlyEmi)} delta={`+${money(result.calculatedEmi)}`} bad/>
          <Compare label="Debt-to-income" before={percentage(result.current.dti)} after={percentage(result.projected.dti)} delta={`${result.projected.dti - result.current.dti >= 0 ? "+" : ""}${percentage(result.projected.dti - result.current.dti)}`} bad={result.projected.dti > result.current.dti}/>
          <Compare label="Disposable income" before={money(result.current.disposableIncome)} after={money(result.projected.disposableIncome)} delta={`${money(result.projected.disposableIncome - result.current.disposableIncome)}`} bad={result.projected.disposableIncome < result.current.disposableIncome}/>
        </div><div className="risk-note"><div><Icon name="insights"/></div><span><strong>{result.projected.dti >= 40 ? "This scenario may create a high EMI burden." : "Review this estimate alongside your other goals."}</strong><p>{isDemo ? "Projected figures use sample data; this calculation is not saved." : "Projected figures use your recorded income, expenses and active loans."}</p></span></div><div className="impact-totals"><div><span>Total debt after loan</span><strong>{money(result.projected.outstandingDebt)}</strong></div><div><span>Est. annual EMI outflow</span><strong>{money(result.projected.monthlyEmi * 12)}</strong></div><div><span>Interest + processing fee</span><strong>{money(result.projected.totalInterest + result.processingFee)}</strong></div></div>{!isDemo && <div className="impact-actions"><Button variant="secondary" onClick={() => void saveScenario()} disabled={busy}>Save scenario</Button><Button onClick={() => document.getElementById("saved-scenarios")?.scrollIntoView({ behavior: "smooth" })}>Compare scenarios</Button></div>}</> : <EmptyState>Enter loan details and calculate to compare your current and projected position.</EmptyState>}
      </section>
    </div>}
    {!isDemo && <ScenarioComparison scenarios={data.scenarios} onDelete={(scenario) => void deleteScenario(scenario)}/>}
  </div>;
}

function Compare({label,before,after,delta,bad}:{label:string;before:string;after:string;delta:string;bad?:boolean}) {
  return <div className="compare-row"><span>{label}</span><b>{before}</b><Icon name="arrow" size={15}/><strong>{after}</strong><em className={bad ? "bad" : ""}>{delta}</em></div>;
}

function ScenarioComparison({ scenarios, onDelete }: { scenarios: Scenario[]; onDelete: (scenario: Scenario) => void }) {
  return <section className="scenario-section" id="saved-scenarios"><div className="card-title"><div><span>SAVED SCENARIOS</span><h3>Compare your options</h3></div><span>{scenarios.length} saved</span></div>{scenarios.length ? <div className="scenario-grid">{scenarios.map((scenario) => <div className="scenario" key={scenario.id}><div><strong>{scenario.name}</strong><button aria-label={`Delete ${scenario.name}`} onClick={() => onDelete(scenario)}>×</button></div><h3>{money(scenario.loanAmount)}</h3><p>{scenario.loanType} · {fullDate(scenario.createdAt)}</p><dl><div><dt>New EMI</dt><dd>{money(scenario.calculatedEmi)}</dd></div><div><dt>Processing fee</dt><dd>{money(scenario.processingFee)}</dd></div><div><dt>Projected DTI</dt><dd>{percentage(scenario.projectedDti)}</dd></div><div><dt>Projected score</dt><dd>{scenario.projectedScore}</dd></div></dl></div>)}</div> : <EmptyState>Saved scenarios will appear here for comparison.</EmptyState>}</section>;
}

function Insights({ data, navigate }: { data: DashboardData; navigate: (page: string) => void }) {
  const iconFor = (item: Insight): IconName => item.tone === "positive" ? "check" : item.tone === "important" ? "shield" : "insights";
  return <div><div className="page-intro"><div><h2>Financial insights</h2><p>Rule-based observations from your income, debt and repayment information.</p></div><Button variant="secondary" onClick={() => navigate("reports")}>View report</Button></div>
    {!data.hasFinancialProfile ? <EmptyState action={<Button onClick={() => navigate("onboarding")}>Complete financial profile</Button>}>Complete your financial profile to receive relevant financial insights.</EmptyState> : <><div className="insights-grid">{data.insights.map((item, index) => <section className={`insight-item i${index % 4}`} key={item.title}><div className="insight-icon"><Icon name={iconFor(item)}/></div><span className="insight-tag">{item.tone === "positive" ? "Positive" : item.tone === "important" ? "Important" : "Review"}</span><h3>{item.title}</h3><p>{item.detail}</p><button onClick={() => navigate(item.tone === "important" ? "loans" : "calculator")}>{item.tone === "important" ? "Review my loans" : "Explore a scenario"} <Icon name="arrow" size={14}/></button></section>)}</div><section className="action-plan"><div><span className="kicker">YOUR NEXT BEST STEPS</span><h2>Make an informed plan from your recorded finances.</h2></div><ol><li><i>1</i><span><b>Review loan details when they change</b><small>Your ratios and score use the information you record.</small></span></li><li><i>2</i><span><b>Compare new loan scenarios</b><small>Check a potential EMI against your income and expenses.</small></span></li><li><i>3</i><span><b>Keep your financial profile current</b><small>Updated information makes estimates more relevant.</small></span></li></ol></section></>}
  </div>;
}

function TaxPage({ data, estimate, loading, navigate }: { data: DashboardData; estimate: TaxEstimate | null; loading: boolean; navigate: (page: string) => void }) {
  const values = estimate ?? { annualIncome: 0, estimatedTax: 0, annualEmi: 0, annualExpenses: 0, estimatedDisposableIncome: 0, taxRate: 0, estimateBasis: "" };
  const total = Math.max(values.annualIncome, 0);
  const share = (amount: number) => total ? Math.min(100, Math.max(0, amount / total * 100)) : 0;
  const remaining = Math.max(0, values.annualIncome - values.estimatedTax - values.annualEmi - values.annualExpenses);
  return <div><div className="page-intro"><div><h2>Tax & financial overview</h2><p>An estimated annual view based on the information you provided.</p></div><div className="quick-actions"><Button variant="secondary" onClick={() => navigate("onboarding")}>Update information</Button><Button variant="ghost" onClick={() => window.print()}>Print estimate</Button></div></div>
    {loading ? <EmptyState>Loading your estimate...</EmptyState> : !data.hasFinancialProfile || !estimate ? <EmptyState>Complete your financial profile to see an estimated tax overview.</EmptyState> : <>
      <div className="tax-stats"><StatCard label="Annual income" value={money(values.annualIncome)} note="From your recorded income" icon="wallet"/><StatCard label="Estimated tax" value={money(values.estimatedTax)} note={`${percentage(values.taxRate)} effective estimate`} icon="tax" tone="amber"/><StatCard label="Annual EMI outflow" value={money(values.annualEmi)} note="From active recorded loans" icon="calculator" tone="purple"/><StatCard label="Est. disposable income" value={money(values.estimatedDisposableIncome)} note="After estimate, EMIs and expenses" icon="trend" tone="green"/></div>
      <section className="allocation-card"><div className="card-title"><div><span>ANNUAL ALLOCATION</span><h3>Where your income goes</h3></div><span>Illustrative estimate</span></div><div className="allocation-bar"><i style={{width:`${share(values.estimatedTax)}%`}}/><i style={{width:`${share(values.annualEmi)}%`}}/><i style={{width:`${share(values.annualExpenses)}%`}}/><i style={{width:`${share(remaining)}%`}}/></div><div className="allocation-legend"><div><i className="a1"/><span>Estimated taxes<b>{money(values.estimatedTax)} · {percentage(share(values.estimatedTax))}</b></span></div><div><i className="a2"/><span>Loan EMIs<b>{money(values.annualEmi)} · {percentage(share(values.annualEmi))}</b></span></div><div><i className="a3"/><span>Living expenses<b>{money(values.annualExpenses)} · {percentage(share(values.annualExpenses))}</b></span></div><div><i className="a4"/><span>Remaining<b>{money(remaining)} · {percentage(share(remaining))}</b></span></div></div></section>
      <div className="estimate-note"><Icon name="help"/><div><b>About this estimate</b><p>{values.estimateBasis} This is not official tax advice; consult a qualified professional about your actual liability.</p></div></div>
    </>}
  </div>;
}

function Reports({ data, loading }: { data: DashboardData; loading: boolean }) {
  const sections = [
    ["Credora score & breakdown", data.score ? `Score ${data.score.score} · Calculated ${fullDate(data.score.calculatedAt)}` : "Score not calculated"],
    ["Income and expense summary", data.income ? `${money(data.metrics.monthlyIncome)} monthly income · ${money(data.metrics.monthlyExpenses)} expenses` : "No income details recorded"],
    ["Existing loans & EMI schedule", `${data.metrics.activeLoanCount} active loans · ${money(data.metrics.monthlyEmi)} monthly EMI`],
    ["Debt-to-income analysis", data.hasFinancialProfile ? `${percentage(data.metrics.debtToIncome)} current DTI` : "Income details required"],
    ["What-if loan scenarios", `${data.scenarios.length} saved scenarios`],
    ["Financial insights & next steps", `${data.insights.length} observations from your profile`],
  ];
  function download() {
    const file = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "credora-financial-report.json";
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div><div className="page-intro"><div><h2>Financial report</h2><p>A complete summary of your current Credora financial profile.</p></div><div className="quick-actions"><Button variant="secondary" icon="print" onClick={() => window.print()}>Print</Button><Button icon="download" onClick={download} disabled={loading}>Download report</Button></div></div>
    {loading ? <EmptyState>Loading your report...</EmptyState> : <><section className="report-cover"><div><Logo/><span>PERSONAL FINANCIAL HEALTH REPORT</span><h2>{data.profile.fullName}</h2><p>Prepared on {fullDate(new Date())}</p></div><div className="report-score"><ScoreRing score={data.score?.score ?? null} small/><span><b>{data.score ? rating(data.score.score) : "Not calculated"}</b>Credora Score</span></div></section><div className="report-sections">{sections.map(([title,summary],index) => <button key={title} onClick={() => document.getElementById(`report-section-${index}`)?.scrollIntoView({ behavior: "smooth" })}><i>{String(index + 1).padStart(2,"0")}</i><span><b>{title}</b><small>{summary}</small></span><Icon name="arrow"/></button>)}</div><div className="report-detail-grid">{sections.map(([title],index) => <section className="settings-card" id={`report-section-${index}`} key={title}><h3>{title}</h3><p>{summaryForReport(index, data)}</p></section>)}</div><Disclaimer/></>}
  </div>;
}

function summaryForReport(index: number, data: DashboardData) {
  if (index === 0) return data.score ? `Project score: ${data.score.score}/900. Factor scores: payment ${data.score.paymentHistoryScore}, utilisation ${data.score.creditUtilisationScore}, debt burden ${data.score.debtBurdenScore}, credit history ${data.score.creditHistoryScore}, recent activity ${data.score.recentActivityScore}.` : "Complete your financial profile to calculate your score.";
  if (index === 1) return data.income ? `Monthly income ${money(data.metrics.monthlyIncome)}; recorded monthly expenses ${money(data.metrics.monthlyExpenses)}.` : "No income or expense information has been recorded.";
  if (index === 2) return data.loans.length ? data.loans.map((loan) => `${loan.loanName}: ${money(loan.outstandingAmount)} outstanding, ${money(loan.monthlyEmi)} monthly EMI.`).join(" ") : "No loans have been recorded.";
  if (index === 3) return `Monthly EMIs ${money(data.metrics.monthlyEmi)}; debt-to-income ${percentage(data.metrics.debtToIncome)}; disposable income ${money(data.metrics.disposableIncome)}.`;
  if (index === 4) return data.scenarios.length ? data.scenarios.map((scenario) => `${scenario.name}: EMI ${money(scenario.calculatedEmi)}, projected score ${scenario.projectedScore}.`).join(" ") : "No saved scenarios.";
  return data.insights.length ? data.insights.map((item) => `${item.title}: ${item.detail}`).join(" ") : "No insights available until financial information is entered.";
}

function SettingsPage({ section, profile, navigate, refresh, onProfileChange, onLogout }: {
  section: string; profile: Profile; navigate: (page: string) => void; refresh: () => Promise<void>; onProfileChange: (profile: Profile) => void; onLogout: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    fullName: profile.fullName, email: profile.email, phone: profile.phone ?? "",
    age: profile.age == null ? "" : String(profile.age), city: profile.city ?? "",
    employmentType: profile.employmentType ?? "Salaried",
    dependents: profile.dependents == null ? "" : String(profile.dependents),
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [monthlySummary, setMonthlySummary] = useState(() => localStorage.getItem(`credora:${profile.id}:monthly-summary`) !== "false");
  const [scoreBreakdown, setScoreBreakdown] = useState(() => localStorage.getItem(`credora:${profile.id}:score-breakdown`) !== "false");

  useEffect(() => {
    setForm({
      fullName: profile.fullName, email: profile.email, phone: profile.phone ?? "",
      age: profile.age == null ? "" : String(profile.age), city: profile.city ?? "",
      employmentType: profile.employmentType ?? "Salaried",
      dependents: profile.dependents == null ? "" : String(profile.dependents),
    });
  }, [profile]);

  function setValue(key: keyof typeof form) {
    return (value: string) => setForm((previous) => ({ ...previous, [key]: value }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await sendJson<Profile>("/profile", "PUT", {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone || null,
        age: form.age ? Number(form.age) : null,
        city: form.city || null,
        employmentType: form.employmentType || null,
        dependents: form.dependents ? Number(form.dependents) : null,
      });
      onProfileChange(updated);
      await refresh();
      setMessage("Your profile has been updated.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your profile could not be updated.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAccount() {
    if (!window.confirm("Permanently delete your account and all associated financial data? This cannot be undone.")) return;
    try {
      await api("/profile", { method: "DELETE" });
      await onLogout();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your account could not be deleted.");
    }
  }

  function savePreference(key: "monthly-summary" | "score-breakdown", enabled: boolean) {
    localStorage.setItem(`credora:${profile.id}:${key}`, String(enabled));
  }

  return <div><div className="page-intro"><div><h2>{section === "profile" ? "Profile" : "Settings"}</h2><p>Manage your personal information and account preferences.</p></div>{section === "profile" && <Button type="submit" form="profile-form" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>}</div>
    {error && <Notice>{error}</Notice>}{message && <Notice tone="success">{message}</Notice>}
    <div className="settings-layout"><nav><button className={section === "profile" ? "active" : ""} onClick={() => navigate("profile")}><Icon name="user"/>Personal profile</button><button className={section === "settings" ? "active" : ""} onClick={() => navigate("settings")}><Icon name="settings"/>Preferences</button><button onClick={() => navigate("insights")}><Icon name="bell"/>Insights</button><button onClick={() => navigate("profile")}><Icon name="shield"/>Privacy & security</button></nav>
      <section className="settings-card">{section === "profile" ? <><form id="profile-form" onSubmit={save}><div className="settings-head"><div className="avatar large">{initials(profile.fullName)}</div><div><h3>{profile.fullName}</h3><p>Personal account · Member since {fullDate(profile.createdAt)}</p></div></div><div className="form-grid"><Field label="Full name" value={form.fullName} onChange={setValue("fullName")} autoComplete="name" required/><Field label="Email address" value={form.email} onChange={setValue("email")} inputType="email" autoComplete="email" required/><Field label="Phone number" value={form.phone} onChange={setValue("phone")} inputType="tel" autoComplete="tel"/><Field label="Employment type" type="select" value={form.employmentType} onChange={setValue("employmentType")} options={["Salaried","Self-employed","Business owner","Student","Other"]}/><Field label="Age" value={form.age} onChange={setValue("age")} inputType="number" min={13} max={120}/><Field label="City" value={form.city} onChange={setValue("city")}/><Field label="Dependents" value={form.dependents} onChange={setValue("dependents")} inputType="number" min={0}/></div></form><div className="setting-row"><span><b>Financial information</b><small>Update your income, expenses and loan profile</small></span><button onClick={() => navigate("onboarding")}>Update profile</button></div></> : <><h3>General preferences</h3><p className="settings-copy">Choose how Credora displays information and communicates with you. Preferences are stored in this browser for your account.</p><div className="setting-row"><span><b>Display currency</b><small>Used across calculations and reports</small></span><select aria-label="Display currency" disabled><option>Indian Rupee (₹)</option></select></div><div className="setting-row"><span><b>Show monthly summary</b><small>Display income and spending totals on the dashboard</small></span><input type="checkbox" checked={monthlySummary} onChange={(event) => { setMonthlySummary(event.target.checked); savePreference("monthly-summary", event.target.checked); }}/></div><div className="setting-row"><span><b>Show score breakdown</b><small>Display the weighted score factors on the dashboard</small></span><input type="checkbox" checked={scoreBreakdown} onChange={(event) => { setScoreBreakdown(event.target.checked); savePreference("score-breakdown", event.target.checked); }}/></div><div className="setting-row danger"><span><b>Delete account</b><small>Permanently delete your profile and financial data</small></span><button onClick={() => void deleteAccount()}>Delete account</button></div><div className="setting-row"><span><b>Sign out</b><small>End your Credora session on this device</small></span><button onClick={() => void onLogout()}>Log out</button></div></>}</section>
    </div>
  </div>;
}

function createDemoWorkspace(): DashboardData {
  const profile: Profile = {
    id: "demo-user",
    fullName: "Aarav Mehta",
    email: "demo@credora.local",
    phone: null,
    age: 32,
    city: "Bengaluru",
    employmentType: "Salaried",
    dependents: 1,
    createdAt: "2024-01-15T00:00:00.000Z",
  };
  const now = new Date().toISOString();
  const score: Score = {
    id: "demo-score",
    userId: profile.id,
    score: 742,
    paymentHistoryScore: 84,
    creditUtilisationScore: 67,
    debtBurdenScore: 72,
    creditHistoryScore: 78,
    recentActivityScore: 85,
    calculatedAt: now,
  };
  const loans: Loan[] = [
    {
      id: "demo-home-loan",
      loanType: "Home Loan",
      loanName: "Home loan",
      principalAmount: 2_800_000,
      outstandingAmount: 2_050_000,
      interestRate: 8.4,
      originalTenureMonths: 240,
      remainingTenureMonths: 176,
      monthlyEmi: 31_250,
      startDate: "2021-02-01T00:00:00.000Z",
      status: "ACTIVE",
      missedPayments: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "demo-car-loan",
      loanType: "Vehicle Loan",
      loanName: "Car loan",
      principalAmount: 900_000,
      outstandingAmount: 640_000,
      interestRate: 9.1,
      originalTenureMonths: 60,
      remainingTenureMonths: 42,
      monthlyEmi: 17_350,
      startDate: "2024-10-01T00:00:00.000Z",
      status: "ACTIVE",
      missedPayments: 0,
      createdAt: now,
      updatedAt: now,
    },
  ];

  return {
    profile,
    income: { monthlyIncome: 120_000, otherMonthlyIncome: 15_000, annualIncome: 1_620_000 },
    expenses: { rent: 18_000, utilities: 3_500, food: 11_000, transportation: 5_000, insurance: 2_500, otherExpenses: 2_000 },
    loans,
    score,
    previousScore: { ...score, id: "demo-previous-score", score: 728, calculatedAt: "2025-10-01T00:00:00.000Z" },
    scenarios: [],
    hasFinancialProfile: true,
    metrics: {
      monthlyIncome: 135_000,
      baseMonthlyIncome: 120_000,
      otherMonthlyIncome: 15_000,
      annualIncome: 1_620_000,
      monthlyExpenses: 42_000,
      monthlyEmi: 48_600,
      outstandingDebt: 2_690_000,
      activeLoanCount: 2,
      debtToIncome: 36,
      emiToIncome: 36,
      disposableIncome: 44_400,
      repaymentProgress: 27,
      averageInterestRate: 8.7,
    },
    insights: [
      { tone: "positive", title: "Your EMI burden is manageable", detail: "Monthly EMIs account for 36% of the sample monthly income. Keep future borrowing within a comfortable budget." },
      { tone: "warning", title: "Keep building your repayment history", detail: "Consistent, on-time repayments can help strengthen your financial profile over time." },
      { tone: "positive", title: "You have room to plan ahead", detail: "This sample profile has ₹44,400 in estimated disposable income each month after listed expenses and EMIs." },
    ],
  };
}

export default function App() {
  const [page, setPage] = useState("landing");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [starting, setStarting] = useState(true);
  const [startupError, setStartupError] = useState("");

  async function loadWorkspace(): Promise<void> {
    const workspace = await api<DashboardData>("/dashboard");
    setData(workspace);
    setProfile(workspace.profile);
  }

  useEffect(() => {
    let active = true;
    void api<{ user: Profile }>("/auth/me").then(async ({ user }) => {
      if (!active) return;
      const workspace = await api<DashboardData>("/dashboard");
      if (active) {
        setData(workspace);
        setProfile(workspace.profile);
        setPage(workspace.hasFinancialProfile ? "dashboard" : "onboarding");
      }
    }).catch((cause: unknown) => {
      if (!active) return;
      if (!(cause instanceof ApiError) || cause.status !== 401) {
        setStartupError(cause instanceof Error ? cause.message : "Credora could not be reached.");
      }
    }).finally(() => { if (active) setStarting(false); });
    return () => { active = false; };
  }, []);

  const navigate = (destination: string) => {
    if (isDemo && destination !== "dashboard" && destination !== "calculator") return;
    const protectedPages = ["dashboard","loans","score","calculator","insights","tax","reports","profile","settings","onboarding"];
    if (protectedPages.includes(destination) && !profile) {
      setPage("login");
      return;
    }
    setPage(destination);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  async function authenticated(_profileFromAuth: Profile, signup: boolean) {
    const workspace = await api<DashboardData>("/dashboard");
    setIsDemo(false);
    setData(workspace);
    setProfile(workspace.profile);
    setStartupError("");
    setPage(signup || !workspace.hasFinancialProfile ? "onboarding" : "dashboard");
  }

  async function logout() {
    let logoutError = "";
    if (!isDemo) {
      try {
        await api<void>("/auth/logout", { method: "POST" });
      } catch (cause) {
        logoutError = cause instanceof Error ? cause.message : "The server could not end your session.";
      }
    }
    setProfile(null);
    setData(null);
    setIsDemo(false);
    setPage("landing");
    if (logoutError) setStartupError(logoutError);
  }

  if (starting) return <div className="startup-state">Loading your Credora session...</div>;
  if ((page === "login" || page === "signup") && !profile) return <Auth mode={page} navigate={navigate} onSuccess={authenticated} onDemo={() => {
    const demoWorkspace = createDemoWorkspace();
    setIsDemo(true);
    setProfile(demoWorkspace.profile);
    setData(demoWorkspace);
    setStartupError("");
    setPage("dashboard");
  }}/>;
  if (page === "landing" || !profile) return <><Landing navigate={navigate}/>{startupError && <div className="startup-notice"><Notice>{startupError}</Notice></div>}</>;
  if (!data) return <div className="startup-state"><Notice>Loading your financial profile...</Notice></div>;
  if (page === "onboarding") return <Onboarding data={data} navigate={navigate} onComplete={async () => { await loadWorkspace(); }} onLogout={logout}/>;
  return <AppShell page={page} navigate={navigate} data={data} refresh={loadWorkspace} profile={profile} onProfileChange={setProfile} onLogout={logout} isDemo={isDemo}/>;
}
