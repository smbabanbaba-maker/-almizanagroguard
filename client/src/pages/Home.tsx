import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { prepareImageDataUrl } from "@/lib/imagePreparation";
import { humanizeClientError } from "@/lib/clientErrors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Activity,
  ArrowRight,
  Camera,
  Check,
  ChevronRight,
  CloudSun,
  Droplets,
  FileImage,
  Leaf,
  Loader2,
  LogIn,
  MapPin,
  Menu,
  MessageCircle,
  ShieldCheck,
  Sprout,
  ThermometerSun,
  Upload,
  UserRound,
  Wind,
  Moon,
  Sun,
  Volume2,
  Square,
  ClipboardCopy,
  AlertTriangle,
  X,
  Zap,
} from "lucide-react";

type Section = "home" | "crop-health" | "weather" | "ask" | "farm";

const navItems: { id: Section; label: string; icon: typeof Leaf }[] = [
  { id: "home", label: "Home", icon: Activity },
  { id: "crop-health", label: "Crop Health", icon: Leaf },
  { id: "weather", label: "Weather / Climate", icon: CloudSun },
  { id: "ask", label: "Ask AgroGuard", icon: MessageCircle },
  { id: "farm", label: "My Farm", icon: Sprout },
];

const confidenceLabel = (value: number) =>
  value >= 70 ? "High" : value >= 50 ? "Medium" : "Low";

const weatherFallback = {
  location: "Your farm area",
  condition: "Weather update unavailable",
  temperature: "29°",
  feelsLike: "Feels like 31°",
  rain: "24%",
  humidity: "68%",
  wind: "11 km/h",
  fieldNote:
    "Use local conditions and avoid spraying when leaves are wet or wind increases.",
  source: "Planning fallback · live weather is reconnecting",
  alerts: [] as string[],
  isLive: false,
};

function weatherDisplay(weather: any, loading = false) {
  if (loading) {
    return {
      ...weatherFallback,
      condition: "Loading field conditions",
      source: "Connecting to live weather",
    };
  }
  if (!weather) return weatherFallback;
  return {
    location: weather.location,
    condition: weather.condition,
    temperature: `${weather.temperatureC}°`,
    feelsLike: `Feels like ${weather.feelsLikeC}°`,
    rain: `${weather.rainProbability}%`,
    humidity: `${weather.humidity}%`,
    wind: `${weather.windKmh} km/h`,
    fieldNote: weather.fieldNote,
    source: weather.source,
    alerts: weather.alerts ?? [],
    isLive: true,
  };
}

export function buildSpokenAssessment(result: any) {
  const steps = Array.isArray(result.careSteps)
    ? result.careSteps.slice(0, 3).join(". ")
    : "";
  return [
    `Crop Health assessment for ${result.crop || "the selected plant"}.`,
    `Health status: ${result.healthStatus || "uncertain"}.`,
    `Possible condition: ${result.possibleCondition || "unable to determine"}.`,
    result.recommendation,
    steps ? `Recommended next steps: ${steps}.` : "",
    result.expertRequired
      ? "An agricultural expert review is recommended before treatment."
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildReferralNote(result: any) {
  return [
    "AgroGuard crop review request",
    `Crop: ${result.crop || "Plant not identified"}`,
    `Health status: ${result.healthStatus || "Uncertain"}`,
    `Possible condition: ${result.possibleCondition || "Unable to determine"}`,
    `Severity: ${result.severity || "Undetermined"}`,
    `AI confidence: ${Number(result.confidence || 0)}%`,
    `Observed symptoms: ${(result.visibleSymptoms || []).join("; ") || "None listed"}`,
    `AI guidance: ${result.expertGuidance || result.uncertaintyReason || "Please review the uploaded crop image."}`,
    "Please review this alongside the original crop photo before recommending any treatment.",
  ].join("\n");
}

function AppMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <svg className="brand-logo" viewBox="0 0 128 128" focusable="false">
        <rect width="128" height="128" rx="28" fill="#c7ed78" />
        <path
          d="M64 18 101 31v27c0 24-15 41-37 51C42 99 27 82 27 58V31l37-13Z"
          fill="#0d4f43"
        />
        <path
          d="M64 29 90 38v19c0 17-10 29-26 37-16-8-26-20-26-37V38l26-9Z"
          fill="#a8d95d"
        />
        <path
          d="M42 73c12-1 28-8 39-24M42 73c2-10 7-17 16-22M42 73c4 5 10 8 17 9"
          fill="none"
          stroke="#0d4f43"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="82" cy="45" r="4" fill="#0d4f43" />
      </svg>
    </div>
  );
}

export default function Home() {
  const [location, setLocation] = useLocation();
  const current = (location.replace("/", "") || "home") as Section;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanPreview, setScanPreview] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const [chatInput, setChatInput] = useState("");
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [farmName, setFarmName] = useState("");
  const [farmLocation, setFarmLocation] = useState("");
  const [farmCropsText, setFarmCropsText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([
    {
      role: "assistant",
      content:
        "Hello. I can help with general crop-care questions, field preparation, and climate-smart practices. For disease identification, use Crop Health so an image can be assessed separately.",
    },
  ]);
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const { user, logout } = useAuth();
  const utils = trpc.useUtils();
  const { theme, toggleTheme } = useTheme();
  const analyze = trpc.cropHealth.analyze.useMutation({
    onSuccess: data => {
      setScanResult(data);
      toast.success("Crop analysis complete");
    },
    onError: error =>
      toast.error(
        humanizeClientError(
          error,
          "We couldn't analyze this image. Please try again with a clear crop photo."
        )
      ),
  });
  const { data: recentScans = [] } = trpc.cropHealth.recent.useQuery(
    undefined,
    { enabled: Boolean(user) }
  );
  const { data: farmOverview } = trpc.farm.overview.useQuery(undefined, {
    enabled: Boolean(user),
  });
  const farmProfile = trpc.farm.profile.useQuery(undefined, {
    enabled: Boolean(user),
  });
  const notifications = trpc.notifications.list.useQuery(undefined, {
    enabled: Boolean(user),
    refetchOnWindowFocus: false,
  });
  const weather = trpc.weather.current.useQuery(undefined, {
    staleTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  const profileUpdate = trpc.profile.update.useMutation({
    onSuccess: () => {
      setProfileEditing(false);
      toast.success("Profile updated");
    },
    onError: () => toast.error("We couldn't update your profile right now."),
  });
  const farmProfileUpdate = trpc.farm.saveProfile.useMutation({
    onSuccess: () => {
      farmProfile.refetch();
      toast.success("Farm profile saved");
    },
    onError: () => toast.error("We couldn't save your farm profile right now."),
  });
  const completeAuth = (name: string) => {
    setAuthPassword("");
    setAuthOpen(false);
    utils.auth.me.invalidate();
    utils.cropHealth.recent.invalidate();
    utils.farm.overview.invalidate();
    toast.success(`Welcome, ${name || "farmer"}`);
  };
  const register = trpc.auth.register.useMutation({
    onSuccess: data => completeAuth(data.user.name || "farmer"),
    onError: error =>
      toast.error(
        humanizeClientError(
          error,
          "We couldn't create your account right now. Please try again."
        )
      ),
  });
  const login = trpc.auth.login.useMutation({
    onSuccess: data => completeAuth(data.user.name || "farmer"),
    onError: error =>
      toast.error(humanizeClientError(error, "Incorrect email or password.")),
  });
  const markNotificationsRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => notifications.refetch(),
  });

  useEffect(() => {
    if (profileEditing || !farmProfile.data?.farm) return;
    setFarmName(farmProfile.data.farm.name || "");
    setFarmLocation(farmProfile.data.farm.location || "");
    setFarmCropsText(farmProfile.data.crops.map(crop => crop.name).join(", "));
  }, [farmProfile.data, profileEditing]);
  const ask = trpc.agroguard.ask.useMutation({
    onSuccess: data =>
      setChatMessages(messages => [
        ...messages,
        { role: "assistant", content: data.answer },
      ]),
    onError: error => {
      const message = humanizeClientError(
        error,
        "AgroGuard is temporarily unavailable."
      );
      toast.error(message);
      setChatMessages(messages => [
        ...messages,
        { role: "assistant", content: message },
      ]);
    },
  });

  const setSection = (id: Section) => {
    setLocation(id === "home" ? "/" : `/${id}`);
    setMobileOpen(false);
  };
  const handleFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return toast.error("Please choose a JPG, PNG, WEBP, or HEIC image.");
    if (file.size > 8 * 1024 * 1024)
      return toast.error("Images must be smaller than 8 MB.");
    setScanFile(file);
    setScanResult(null);
    setScanPreview(URL.createObjectURL(file));
  };
  const analyzeImage = async () => {
    if (!scanFile || !scanPreview)
      return toast.error("Upload a clear photo of a crop or plant first.");
    try {
      const imageDataUrl = await prepareImageDataUrl(scanFile);
      analyze.mutate({ imageDataUrl, cropType: "auto-detect" });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not prepare this image. Please try again."
      );
    }
  };
  const sendQuestion = () => {
    const question = chatInput.trim();
    if (!question || ask.isPending) return;
    setChatMessages(messages => [
      ...messages,
      { role: "user", content: question },
    ]);
    setChatInput("");
    ask.mutate({ question });
  };
  const openAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };
  const submitAuth = () => {
    if (authMode === "register") {
      register.mutate({
        name: authName.trim(),
        email: authEmail.trim(),
        password: authPassword,
      });
      return;
    }
    login.mutate({
      email: authEmail.trim(),
      password: authPassword,
    });
  };
  const voiceSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;
  const speakAssessment = (result: any) => {
    if (!voiceSupported) {
      toast.error("Voice playback is not supported in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      buildSpokenAssessment(result)
    );
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      toast.error("Voice playback could not start. Please try again.");
    };
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };
  const stopSpeaking = () => {
    if (!voiceSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };
  const copyReferralNote = async (result: any) => {
    const note = buildReferralNote(result);
    try {
      await navigator.clipboard.writeText(note);
      toast.success(
        "Review note copied. Share it with a local agronomist or extension officer."
      );
    } catch {
      toast.error("Copy is unavailable in this browser. Please try again.");
    }
  };

  return (
    <div className="app-shell">
      <Dialog
        open={authOpen}
        onOpenChange={open => {
          setAuthOpen(open);
          if (!open) setAuthPassword("");
        }}
      >
        <DialogContent className="auth-dialog">
          <DialogHeader>
            <span className="pill pill-green">FARMER ACCOUNT</span>
            <DialogTitle>
              {authMode === "register"
                ? "Create your AgroGuard account"
                : "Welcome back"}
            </DialogTitle>
            <DialogDescription>
              {authMode === "register"
                ? "Save farm details, scan history, and field guidance in one secure workspace."
                : "Log in to continue with your farm records and scan history."}
            </DialogDescription>
          </DialogHeader>
          <form
            className="auth-form"
            onSubmit={event => {
              event.preventDefault();
              submitAuth();
            }}
          >
            {authMode === "register" && (
              <label>
                Full name
                <input
                  value={authName}
                  onChange={event => setAuthName(event.target.value)}
                  placeholder="Your name"
                  minLength={2}
                  required
                />
              </label>
            )}
            <label>
              Email address
              <input
                type="email"
                value={authEmail}
                onChange={event => setAuthEmail(event.target.value)}
                placeholder="farmer@example.com"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={authPassword}
                onChange={event => setAuthPassword(event.target.value)}
                placeholder={
                  authMode === "register"
                    ? "At least 10 characters"
                    : "Your password"
                }
                minLength={authMode === "register" ? 10 : 1}
                required
              />
            </label>
            <Button
              type="submit"
              className="primary-btn"
              disabled={register.isPending || login.isPending}
            >
              {register.isPending || login.isPending
                ? "Please wait..."
                : authMode === "register"
                  ? "Create account"
                  : "Log in"}
            </Button>
          </form>
          <p className="auth-switch">
            {authMode === "register"
              ? "Already have an account?"
              : "New to AgroGuard?"}{" "}
            <button
              type="button"
              onClick={() =>
                setAuthMode(authMode === "register" ? "login" : "register")
              }
            >
              {authMode === "register" ? "Log in" : "Create an account"}
            </button>
          </p>
        </DialogContent>
      </Dialog>
      <aside className={`side-nav ${mobileOpen ? "is-open" : ""}`}>
        <div className="brand-row">
          <AppMark />
          <div>
            <div className="brand-name">AL-MIZAN</div>
            <div className="brand-sub">AI AGROGUARD</div>
          </div>
          <button
            className="close-mobile"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${current === id ? "active" : ""}`}
              onClick={() => setSection(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {current === id && (
                <ChevronRight className="nav-chevron" size={15} />
              )}
            </button>
          ))}
        </nav>
        <div className="side-spacer" />
        <div className="trust-card">
          <ShieldCheck size={18} />
          <div>
            <strong>Built for better decisions</strong>
            <span>AI-assisted, farmer-first tools.</span>
          </div>
        </div>
        <div className="user-row">
          {user ? (
            <>
              <div className="avatar">
                <UserRound size={16} />
              </div>
              <div>
                <strong>{user.name || "Farmer profile"}</strong>
                <span>Active workspace</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => logout()}>
                Log out
              </Button>
            </>
          ) : (
            <div className="account-entry-actions">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openAuth("login")}
              >
                <LogIn size={15} /> Log in
              </Button>
              <Button size="sm" onClick={() => openAuth("register")}>
                Register
              </Button>
            </div>
          )}
        </div>
      </aside>
      {mobileOpen && (
        <button
          className="mobile-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <main className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={21} />
          </button>
          <div className="topbar-brand">
            <AppMark />
            <div>
              <p className="eyebrow">AL-MIZAN AI AGROGUARD</p>
              <h1>
                {navItems.find(item => item.id === current)?.label || "Home"}
              </h1>
            </div>
          </div>
          <div className="topbar-right">
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              title={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
            >
              <span>{theme === "dark" ? "LIGHT" : "DARK"}</span>
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <span className="status-dot" />{" "}
            <span className="live-label">AI services ready</span>
            <div className="top-avatar">
              <UserRound size={16} />
            </div>
          </div>
        </header>
        <div className="content-wrap">
          {current === "home" && (
            <HomeSection
              setSection={setSection}
              recentScans={recentScans}
              weather={weather.data}
              weatherLoading={weather.isLoading}
            />
          )}
          {current === "crop-health" && (
            <CropHealthSection
              scanPreview={scanPreview}
              setScanPreview={setScanPreview}
              scanResult={scanResult}
              scanFile={scanFile}
              setScanFile={setScanFile}
              setScanResult={setScanResult}
              fileInput={fileInput}
              cameraInput={cameraInput}
              handleFile={handleFile}
              analyzeImage={analyzeImage}
              isAnalyzing={analyze.isPending}
              voiceSupported={voiceSupported}
              isSpeaking={isSpeaking}
              speakAssessment={speakAssessment}
              stopSpeaking={stopSpeaking}
              copyReferralNote={copyReferralNote}
            />
          )}
          {current === "weather" && (
            <WeatherSection
              weather={weather.data}
              weatherLoading={weather.isLoading}
            />
          )}
          {current === "ask" && (
            <AskSection
              messages={chatMessages}
              input={chatInput}
              setInput={setChatInput}
              send={sendQuestion}
              pending={ask.isPending}
            />
          )}
          {current === "farm" && (
            <FarmSection
              user={user}
              openAuth={openAuth}
              profileEditing={profileEditing}
              setProfileEditing={setProfileEditing}
              profileName={profileName || user?.name || ""}
              setProfileName={setProfileName}
              profileEmail={profileEmail || user?.email || ""}
              setProfileEmail={setProfileEmail}
              farmName={farmName}
              setFarmName={setFarmName}
              farmLocation={farmLocation}
              setFarmLocation={setFarmLocation}
              farmCropsText={farmCropsText}
              setFarmCropsText={setFarmCropsText}
              saveFarmProfile={() =>
                farmProfileUpdate.mutate({
                  name: farmName || `${user?.name || "My"} farm`,
                  location: farmLocation || undefined,
                  crops: farmCropsText
                    .split(",")
                    .map(crop => crop.trim())
                    .filter(Boolean),
                })
              }
              savingFarmProfile={farmProfileUpdate.isPending}
              saveProfile={() =>
                profileUpdate.mutate({
                  name: profileName || user?.name || "",
                  email: profileEmail || user?.email || "",
                })
              }
              recentScans={farmOverview?.scans ?? recentScans}
              analyses={farmOverview?.analyses ?? []}
              recommendations={farmOverview?.recommendations ?? []}
              farms={farmOverview?.farms ?? []}
              farmProfile={farmProfile.data}
              notifications={notifications.data ?? []}
              markNotificationsRead={() => markNotificationsRead.mutate()}
              markingNotificationsRead={markNotificationsRead.isPending}
            />
          )}
        </div>
      </main>
      <nav className="bottom-nav">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={current === id ? "active" : ""}
            onClick={() => setSection(id)}
          >
            <Icon size={18} />
            <span>{label.split(" ")[0]}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function HomeSection({
  setSection,
  recentScans = [],
  weather,
  weatherLoading,
}: {
  setSection: (id: Section) => void;
  recentScans?: any[];
  weather?: any;
  weatherLoading?: boolean;
}) {
  const weatherSnapshot = weatherDisplay(weather, weatherLoading);
  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="pill pill-light">
            <Zap size={13} /> FIELD INTELLIGENCE, SIMPLIFIED
          </span>
          <h2>
            Healthier crops.
            <br />
            <em>Smarter decisions.</em>
          </h2>
          <p>
            AI-powered agricultural intelligence for farmers who want to see
            what is happening in the field and act with confidence.
          </p>
          <div className="hero-actions">
            <Button
              onClick={() => setSection("crop-health")}
              className="primary-btn"
            >
              Check crop health <ArrowRight size={16} />
            </Button>
            <Button
              variant="outline"
              onClick={() => setSection("ask")}
              className="hero-secondary"
            >
              Ask AgroGuard
            </Button>
          </div>
        </div>
        <div className="hero-orbit">
          <div className="orbit-ring ring-one" />
          <div className="orbit-ring ring-two" />
          <div className="hero-leaf">
            <Leaf size={86} strokeWidth={1.1} />
          </div>
          <span className="orbit-label one">TOMATO</span>
          <span className="orbit-label two">AI INSIGHT</span>
          <span className="orbit-label three">FIELD READY</span>
        </div>
      </section>
      <div className="section-heading">
        <div>
          <span className="eyebrow">YOUR WORKSPACE</span>
          <h3>Good morning, farmer</h3>
        </div>
        <span className="date-stamp">Today · Growing season</span>
      </div>
      <div className="quick-grid">
        {[
          ["crop-health", Leaf, "Check crop health", "Upload a leaf photo"],
          ["weather", CloudSun, "Weather & climate", "Plan around conditions"],
          ["ask", MessageCircle, "Ask AgroGuard", "Get practical guidance"],
          ["farm", Sprout, "My farm", "Your field overview"],
        ].map(([id, Icon, title, text]: any) => (
          <button
            className="quick-card"
            key={id}
            onClick={() => setSection(id)}
          >
            <div className="quick-icon">
              <Icon size={19} />
            </div>
            <div>
              <strong>{title}</strong>
              <span>{text}</span>
            </div>
            <ArrowRight size={16} className="quick-arrow" />
          </button>
        ))}
      </div>
      {weatherSnapshot.alerts.length > 0 && (
        <Card className="dashboard-alert-card">
          <CardContent>
            <AlertTriangle size={19} />
            <div>
              <strong>Weather alert for field work</strong>
              <p>{weatherSnapshot.alerts.join(" ")}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSection("weather")}
            >
              View guidance <ArrowRight size={14} />
            </Button>
          </CardContent>
        </Card>
      )}
      <Card className="activity-card">
        <CardHeader>
          <div className="card-title-row">
            <div>
              <span className="eyebrow">RECENT ACTIVITY</span>
              <CardTitle>Field timeline</CardTitle>
            </div>
            <Activity size={20} className="muted-icon" />
          </div>
        </CardHeader>
        <CardContent>
          {recentScans.length ? (
            <div className="activity-list">
              {recentScans.slice(0, 3).map((scan: any) => (
                <div className="activity-row" key={scan.id}>
                  <div className="activity-dot" />
                  <div>
                    <strong>{scan.cropType} crop scan</strong>
                    <p>
                      {scan.status === "complete"
                        ? "AI assessment saved"
                        : "Analysis in progress"}
                    </p>
                  </div>
                  <time>{new Date(scan.createdAt).toLocaleDateString()}</time>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-insight">
              <div className="empty-icon">
                <Activity size={21} />
              </div>
              <div>
                <strong>No activity yet</strong>
                <p>Saved scans and recommendations will appear here.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="two-col">
        <Card className="insight-card">
          <CardHeader>
            <div className="card-title-row">
              <div>
                <span className="eyebrow">CROP HEALTH</span>
                <CardTitle>Latest field insight</CardTitle>
              </div>
              <Badge className="badge-muted">Ready to scan</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="empty-insight">
              <div className="empty-icon">
                <Leaf size={22} />
              </div>
              <div>
                <strong>No crop scans yet</strong>
                <p>Your first image analysis will appear here.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSection("crop-health")}
              >
                Start a scan <ArrowRight size={14} />
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="weather-card">
          <CardHeader>
            <div className="card-title-row">
              <div>
                <span className="eyebrow">WEATHER / CLIMATE</span>
                <CardTitle>Field conditions</CardTitle>
              </div>
              <CloudSun size={20} className="muted-icon" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="weather-summary">
              <div>
                <span className="weather-location">
                  <MapPin size={13} /> {weatherSnapshot.location}
                </span>
                <strong className="weather-temperature">
                  {weatherSnapshot.temperature}
                </strong>
                <span className="weather-condition">
                  {weatherSnapshot.condition} · {weatherSnapshot.feelsLike}
                </span>
              </div>
              <div className="weather-orb">
                <CloudSun size={30} />
              </div>
            </div>
            <div className="weather-metrics-inline">
              <span>
                <Droplets size={14} /> {weatherSnapshot.rain} rain
              </span>
              <span>
                <Droplets size={14} /> {weatherSnapshot.humidity} humidity
              </span>
              <span>
                <Wind size={14} /> {weatherSnapshot.wind}
              </span>
            </div>
            <div className="weather-field-note">
              <Sprout size={15} /> {weatherSnapshot.fieldNote}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSection("weather")}
            >
              Explore climate tools <ArrowRight size={14} />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CropHealthSection({
  scanPreview,
  setScanPreview,
  scanResult,
  scanFile,
  setScanFile,
  setScanResult,
  fileInput,
  cameraInput,
  handleFile,
  analyzeImage,
  isAnalyzing,
  voiceSupported,
  isSpeaking,
  speakAssessment,
  stopSpeaking,
  copyReferralNote,
}: any) {
  return (
    <div className="page-stack narrow-page">
      <div className="feature-intro">
        <span className="pill pill-green">
          <Leaf size={13} /> MULTI-CROP CHECK
        </span>
        <h2>Check your crop health</h2>
        <p>
          Take or upload a clear photo of any crop or plant. AgroGuard will
          identify what it can see, explain the crop-health status, and give
          practical next steps. It is a preliminary assessment, not a final
          diagnosis.
        </p>
      </div>
      <div className="step-strip">
        <span className="step-active">
          <b>01</b> Add photo
        </span>
        <span>
          <b>02</b> Analyze
        </span>
        <span>
          <b>03</b> Act on insight
        </span>
      </div>
      {!scanResult ? (
        <Card className="scan-card">
          <CardContent>
            <div
              className={`upload-zone ${scanPreview ? "has-preview" : ""}`}
              onClick={() => !scanPreview && fileInput.current?.click()}
              onDragOver={event => event.preventDefault()}
              onDrop={event => {
                event.preventDefault();
                handleFile(event.dataTransfer.files?.[0]);
              }}
            >
              {scanPreview ? (
                <>
                  <img src={scanPreview} alt="Selected crop or plant" />
                  <button
                    className="remove-image"
                    onClick={event => {
                      event.stopPropagation();
                      setScanResult(null);
                      setScanPreview(null);
                      setScanFile(null);
                      if (fileInput.current) fileInput.current.value = "";
                      if (cameraInput.current) cameraInput.current.value = "";
                    }}
                  >
                    <X size={15} />
                  </button>
                </>
              ) : (
                <>
                  <div className="upload-icon">
                    <Camera size={26} />
                  </div>
                  <strong>Take a photo or upload an image</strong>
                  <span>Clear JPG, PNG, WEBP, or HEIC · Max 8 MB</span>
                  <div className="upload-buttons">
                    <Button
                      onClick={event => {
                        event.stopPropagation();
                        fileInput.current?.click();
                      }}
                      className="primary-btn"
                    >
                      <Upload size={16} /> Upload photo
                    </Button>
                    <Button
                      variant="outline"
                      onClick={event => {
                        event.stopPropagation();
                        cameraInput.current?.click();
                      }}
                    >
                      <Camera size={16} /> Take photo
                    </Button>
                  </div>
                </>
              )}
            </div>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden-input"
              onChange={event => handleFile(event.target.files?.[0])}
            />
            <input
              ref={cameraInput}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden-input"
              onChange={event => handleFile(event.target.files?.[0])}
            />
            {scanPreview && (
              <div className="scan-ready">
                <div>
                  <strong>{scanFile?.name}</strong>
                  <span>Ready for secure analysis</span>
                </div>
                <Button
                  onClick={analyzeImage}
                  disabled={isAnalyzing}
                  className="primary-btn"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="spin" size={16} /> AgroGuard AI is
                      analyzing...
                    </>
                  ) : (
                    <>
                      Analyze crop <ArrowRight size={16} />
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <ResultCard
          result={scanResult}
          onReset={() => setScanResult(null)}
          voiceSupported={voiceSupported}
          isSpeaking={isSpeaking}
          onSpeak={() => speakAssessment(scanResult)}
          onStopSpeaking={stopSpeaking}
          onCopyReferral={() => copyReferralNote(scanResult)}
        />
      )}
    </div>
  );
}

function ResultCard({
  result,
  onReset,
  voiceSupported,
  isSpeaking,
  onSpeak,
  onStopSpeaking,
  onCopyReferral,
}: any) {
  const confidence = Number(result.confidence || 0);
  const level = confidenceLabel(confidence);
  const symptoms = Array.isArray(result.visibleSymptoms)
    ? result.visibleSymptoms
    : [];
  const careSteps = Array.isArray(result.careSteps) ? result.careSteps : [];
  const preventionActions = Array.isArray(result.preventionActions)
    ? result.preventionActions
    : [];
  return (
    <div className="result-stack">
      <Card className="result-card">
        <CardHeader>
          <div className="result-head">
            <div>
              <span className="eyebrow">AI-ASSISTED ASSESSMENT</span>
              <CardTitle>{result.crop || "Plant not identified"}</CardTitle>
            </div>
            <Badge className={`confidence-${level.toLowerCase()}`}>
              {level} confidence
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="condition-row">
            <div>
              <span className="result-label">Health assessment</span>
              <h3>{result.possibleCondition || "Unable to determine"}</h3>
            </div>
            <div className="confidence-score">
              <strong>{confidence}%</strong>
              <span>AI confidence</span>
            </div>
          </div>
          <Progress value={confidence} className="confidence-bar" />
          <div className="result-metrics">
            <div>
              <span className="result-label">Plant identity</span>
              <strong>
                {result.plantIdentified === false
                  ? "Not identified"
                  : `${Number(result.plantIdentityConfidence || 0)}% match`}
              </strong>
            </div>
            <div>
              <span className="result-label">Health status</span>
              <strong>{result.healthStatus || "Uncertain"}</strong>
            </div>
            <div>
              <span className="result-label">Severity</span>
              <strong className="severity-text">
                {result.severity || "Undetermined"}
              </strong>
            </div>
            <div>
              <span className="result-label">Expert review</span>
              <strong>
                {result.expertRequired ? "Recommended" : "Not indicated"}
              </strong>
            </div>
          </div>
          {level === "Low" && (
            <div className="uncertainty-warning">
              <Zap size={17} />
              <div>
                <strong>AgroGuard AI is not sufficiently confident.</strong>
                <p>
                  {result.uncertaintyReason ||
                    "Please take a clearer image or consult an agricultural expert before acting."}
                </p>
              </div>
            </div>
          )}
          <div className="assessment-actions">
            {voiceSupported && (
              <Button
                variant="outline"
                size="sm"
                onClick={isSpeaking ? onStopSpeaking : onSpeak}
                aria-pressed={isSpeaking}
              >
                {isSpeaking ? <Square size={14} /> : <Volume2 size={15} />}
                {isSpeaking ? "Stop voice" : "Listen to this result"}
              </Button>
            )}
            {(result.expertRequired ||
              level === "Low" ||
              /high|severe/i.test(result.severity || "")) && (
              <Button variant="outline" size="sm" onClick={onCopyReferral}>
                <ClipboardCopy size={15} /> Copy agronomist review note
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      {symptoms.length > 0 && (
        <Card className="guidance-card">
          <CardHeader>
            <CardTitle>What AgroGuard observed</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="guidance-list">
              {symptoms.map((symptom: string, index: number) => (
                <li key={`${symptom}-${index}`}>
                  <Check size={16} />
                  <span>{symptom}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      <Card className="recommendation-card">
        <CardHeader>
          <CardTitle>What you should do next</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            {result.recommendation ||
              "Retake the image in good light and seek local expert guidance."}
          </p>
          {careSteps.length > 0 && (
            <ol className="guidance-list numbered-list">
              {careSteps.map((step: string, index: number) => (
                <li key={`${step}-${index}`}>
                  <b>{index + 1}</b>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          )}
          {preventionActions.length > 0 && (
            <div className="prevention-panel">
              <span className="result-label">
                Prevent the problem from spreading
              </span>
              <ul className="guidance-list">
                {preventionActions.map((action: string, index: number) => (
                  <li key={`${action}-${index}`}>
                    <Check size={16} />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="treatment-panel">
            <div className="treatment-title">
              <ShieldCheck size={18} />
              <div>
                <span className="result-label">Treatment check</span>
                <strong>
                  {result.treatmentCategory ||
                    "No treatment recommendation yet"}
                </strong>
              </div>
            </div>
            <p>
              {result.treatmentGuidance ||
                "Confirm the crop and problem with a local agricultural extension professional before selecting any treatment."}
            </p>
            <small>
              Only use a locally registered product whose label lists the crop
              and confirmed problem. Follow the label and local extension
              advice.
            </small>
          </div>
          <div className="expert-note">
            <ShieldCheck size={18} />
            <span>
              <strong>When to seek an agricultural expert</strong>
              {result.expertGuidance ||
                "Consult a qualified agricultural expert if symptoms spread, the crop is declining quickly, or the result is unclear."}
            </span>
          </div>
          <p className="disclaimer">
            This result is an AI-assisted preliminary assessment and should not
            replace professional agricultural diagnosis. Consult a qualified
            agricultural expert when necessary.
          </p>
          <Button variant="outline" onClick={onReset}>
            Start another scan <ArrowRight size={15} />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function WeatherSection({
  weather,
  weatherLoading,
}: {
  weather?: any;
  weatherLoading?: boolean;
}) {
  const weatherSnapshot = weatherDisplay(weather, weatherLoading);
  const metrics = [
    [
      ThermometerSun,
      "Temperature",
      weatherSnapshot.temperature,
      weatherSnapshot.feelsLike,
    ],
    [
      Droplets,
      "Rain probability",
      weatherSnapshot.rain,
      "Plan irrigation early",
    ],
    [Droplets, "Humidity", weatherSnapshot.humidity, "Watch leaf wetness"],
    [Wind, "Wind speed", weatherSnapshot.wind, "Safe for scouting"],
  ] as const;

  return (
    <div className="page-stack">
      <div className="feature-intro">
        <span className="pill pill-blue">
          <CloudSun size={13} /> CLIMATE INTELLIGENCE
        </span>
        <h2>Weather / Climate</h2>
        <p>
          See the conditions that shape field decisions, from scouting windows
          to irrigation planning.
        </p>
      </div>
      <Card className="weather-hero-card">
        <CardContent>
          <div className="weather-hero-copy">
            <span className="weather-location">
              <MapPin size={14} /> {weatherSnapshot.location}
            </span>
            <strong>{weatherSnapshot.temperature}</strong>
            <h3>{weatherSnapshot.condition}</h3>
            <p>
              {weatherSnapshot.feelsLike} · {weatherSnapshot.fieldNote}
            </p>
          </div>
          <div className="weather-hero-orb">
            <CloudSun size={54} />
          </div>
          <span className="weather-source">{weatherSnapshot.source}</span>
        </CardContent>
      </Card>
      <div className="weather-grid">
        {metrics.map(([Icon, label, value, sub]) => (
          <Card className="metric-card" key={label}>
            <CardContent>
              <div className="metric-icon">
                <Icon size={18} />
              </div>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{sub}</small>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="two-col">
        <Card>
          <CardHeader>
            <CardTitle>Weather alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="weather-alert">
              <ShieldCheck size={19} />
              <div>
                <strong>
                  {weatherSnapshot.alerts.length
                    ? "Field attention needed"
                    : weatherSnapshot.isLive
                      ? "No active alerts"
                      : "Using planning fallback"}
                </strong>
                <p>
                  {weatherSnapshot.alerts.length
                    ? weatherSnapshot.alerts.join(" ")
                    : weatherSnapshot.isLive
                      ? "No high-risk heat, rain, wind, or thunderstorm conditions are flagged in the current forecast."
                      : "Live weather will return automatically when the provider is available."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Field guidance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="risk-placeholder">
              <span>FIELD WINDOW</span>
              <p>
                {weatherSnapshot.fieldNote} Avoid spraying when wind increases
                or leaf surfaces are wet.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="weather-connect-note">
        <CloudSun size={17} />
        <span>
          <strong>
            {weatherSnapshot.isLive
              ? "Live weather connected"
              : "Weather fallback active"}
          </strong>{" "}
          {weatherSnapshot.isLive
            ? "Forecast conditions are supplied through the AgroGuard weather service."
            : "Please check local field conditions while AgroGuard reconnects to the weather service."}
        </span>
      </div>
    </div>
  );
}

function AskSection({ messages, input, setInput, send, pending }: any) {
  return (
    <div className="page-stack narrow-page">
      <div className="feature-intro">
        <span className="pill pill-purple">
          <MessageCircle size={13} /> GENERAL GUIDANCE
        </span>
        <h2>Ask AgroGuard</h2>
        <p>
          Ask practical questions about crop care, field preparation, and
          climate-smart practices. This assistant does not diagnose disease from
          text.
        </p>
      </div>
      <Card className="chat-card">
        <CardContent>
          <div className="chat-notice">
            <ShieldCheck size={16} />
            <span>
              Guidance only — use <strong>Crop Health</strong> for image-based
              assessments.
            </span>
          </div>
          <div className="chat-window">
            {messages.map((message: any, index: number) => (
              <div
                className={`chat-message ${message.role}`}
                key={`${message.role}-${index}`}
              >
                <div className="chat-avatar">
                  {message.role === "assistant" ? (
                    <AppMark />
                  ) : (
                    <UserRound size={15} />
                  )}
                </div>
                <div className="chat-bubble">{message.content}</div>
              </div>
            ))}
            {pending && (
              <div className="chat-message assistant">
                <div className="chat-avatar">
                  <AppMark />
                </div>
                <div className="chat-bubble">
                  <Loader2 className="spin" size={16} /> Thinking about your
                  field question...
                </div>
              </div>
            )}
          </div>
          <div className="chat-compose">
            <Textarea
              value={input}
              onChange={event => setInput(event.target.value)}
              onKeyDown={event => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  send();
                }
              }}
              placeholder="Ask about tomato care, soil, watering, or field preparation..."
            />
            <Button
              onClick={send}
              disabled={pending || !input.trim()}
              className="primary-btn"
            >
              <ArrowRight size={17} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FarmSection({
  user,
  openAuth,
  profileEditing,
  setProfileEditing,
  profileName,
  setProfileName,
  profileEmail,
  setProfileEmail,
  farmName,
  setFarmName,
  farmLocation,
  setFarmLocation,
  farmCropsText,
  setFarmCropsText,
  saveFarmProfile,
  savingFarmProfile,
  saveProfile,
  recentScans = [],
  analyses = [],
  recommendations = [],
  farms = [],
  farmProfile,
  notifications = [],
  markNotificationsRead,
  markingNotificationsRead,
}: any) {
  const savedFarm = farmProfile?.farm || farms[0];
  const savedCrops = farmProfile?.crops || [];
  const scansById = new Map<number, any>(
    recentScans.map((scan: any) => [scan.id, scan])
  );
  const unreadNotifications = notifications.filter(
    (notification: any) => !notification.isRead
  ).length;
  return (
    <div className="page-stack">
      <div className="feature-intro">
        <span className="pill pill-green">
          <Sprout size={13} /> FARM OVERVIEW
        </span>
        <h2>My Farm</h2>
        <p>
          A simple home for your farm profile, crop history, and
          recommendations. Add details as your field records grow.
        </p>
      </div>
      <div className="farm-profile">
        <div className="farm-avatar">
          <Sprout size={28} />
        </div>
        <div>
          <span className="eyebrow">FARM PROFILE</span>
          <h3>
            {savedFarm?.name ||
              (user?.name ? `${user.name}'s farm` : "Your farm profile")}
          </h3>
          <p>
            <MapPin size={14} /> {savedFarm?.location || "Location not set"}
          </p>
        </div>
        {user ? (
          <Button
            variant="outline"
            onClick={() => setProfileEditing(!profileEditing)}
          >
            {profileEditing ? "Close editor" : "Edit profile"}
          </Button>
        ) : (
          <Button variant="outline" onClick={() => openAuth("login")}>
            Log in to save
          </Button>
        )}
      </div>
      {user && profileEditing && (
        <Card className="profile-edit-card">
          <CardContent>
            <div className="profile-edit-grid">
              <label>
                Farm name
                <input
                  value={farmName}
                  onChange={event => setFarmName(event.target.value)}
                  placeholder="e.g. Green Valley Farm"
                />
              </label>
              <label>
                Farm location
                <input
                  value={farmLocation}
                  onChange={event => setFarmLocation(event.target.value)}
                  placeholder="e.g. Kano, Nigeria"
                />
              </label>
              <label className="profile-edit-wide">
                Crops on this farm
                <input
                  value={farmCropsText}
                  onChange={event => setFarmCropsText(event.target.value)}
                  placeholder="e.g. Tomato, Maize, Cassava"
                />
              </label>
              <label>
                Name
                <input
                  value={profileName}
                  onChange={event => setProfileName(event.target.value)}
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={profileEmail}
                  onChange={event => setProfileEmail(event.target.value)}
                />
              </label>
              <Button
                className="primary-btn"
                onClick={saveFarmProfile}
                disabled={savingFarmProfile}
              >
                {savingFarmProfile ? "Saving farm..." : "Save farm details"}
              </Button>
              <Button variant="outline" onClick={saveProfile}>
                Save account details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="farm-grid">
        {[
          [
            Sprout,
            "Crops",
            savedCrops.length
              ? `${savedCrops.length} crop${savedCrops.length === 1 ? "" : "s"} saved`
              : "No crops added",
            savedCrops.length
              ? savedCrops.map((crop: any) => crop.name).join(" · ")
              : "Add tomato and other field crops",
          ],
          [
            Activity,
            "Crop health history",
            analyses.length
              ? `${analyses.length} saved result${analyses.length === 1 ? "" : "s"}`
              : recentScans.length
                ? `${recentScans.length} saved scan${recentScans.length === 1 ? "" : "s"}`
                : "No scans yet",
            analyses[0]
              ? `${analyses[0].possibleCondition} · ${analyses[0].confidence}% confidence`
              : "Your AI-assisted analyses will live here",
          ],
          [
            MessageCircle,
            "Recommendations",
            recommendations.length
              ? `${recommendations.length} saved`
              : "No recommendations yet",
            recommendations[0]?.title || "Guidance from your field activity",
          ],
          [
            MapPin,
            "Farm location",
            savedFarm?.location || "Not set",
            "Use location to personalize insights",
          ],
        ].map(([Icon, title, value, sub]: any) => (
          <Card className="farm-card" key={title}>
            <CardContent>
              <div className="farm-icon">
                <Icon size={18} />
              </div>
              <span>{title}</span>
              <strong>{value}</strong>
              <small>{sub}</small>
            </CardContent>
          </Card>
        ))}
      </div>
      {user && (
        <div className="two-col farm-detail-grid">
          <Card className="history-card">
            <CardHeader>
              <div className="card-title-row">
                <div>
                  <span className="eyebrow">SAVED SCANS</span>
                  <CardTitle>Crop health history</CardTitle>
                </div>
                <Badge className="badge-muted">{analyses.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {analyses.length ? (
                <div className="history-list">
                  {analyses.slice(0, 8).map((analysis: any) => {
                    const scan = scansById.get(analysis.scanId);
                    return (
                      <div className="history-row" key={analysis.id}>
                        <div className="history-icon">
                          <Leaf size={16} />
                        </div>
                        <div>
                          <strong>{analysis.crop}</strong>
                          <p>
                            {analysis.possibleCondition} · {analysis.severity}
                          </p>
                          <small>
                            {scan?.createdAt
                              ? new Date(scan.createdAt).toLocaleString()
                              : "Saved crop assessment"}
                          </small>
                        </div>
                        <div className="history-confidence">
                          <strong>{Number(analysis.confidence)}%</strong>
                          <span>confidence</span>
                        </div>
                        <p className="history-guidance">
                          {analysis.recommendation}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-insight">
                  <div className="empty-icon">
                    <Activity size={20} />
                  </div>
                  <div>
                    <strong>No saved scans yet</strong>
                    <p>Your completed crop checks will appear here.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="notification-card">
            <CardHeader>
              <div className="card-title-row">
                <div>
                  <span className="eyebrow">ACCOUNT ACTIVITY</span>
                  <CardTitle>Notifications</CardTitle>
                </div>
                {unreadNotifications > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={markNotificationsRead}
                    disabled={markingNotificationsRead}
                  >
                    Mark read
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {notifications.length ? (
                <div className="notification-list">
                  {notifications.slice(0, 8).map((notification: any) => (
                    <div
                      className={`notification-row ${notification.isRead ? "" : "unread"}`}
                      key={notification.id}
                    >
                      <div className="notification-dot" />
                      <div>
                        <strong>{notification.title}</strong>
                        <p>{notification.body}</p>
                        <small>
                          {new Date(notification.createdAt).toLocaleString()}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-insight">
                  <div className="empty-icon">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <strong>You are all caught up</strong>
                    <p>
                      Scan updates and expert-review prompts will appear here.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
