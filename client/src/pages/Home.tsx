import { useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { startLogin } from "@/const";
import { prepareImageDataUrl } from "@/lib/imagePreparation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
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

const weatherSnapshot = {
  location: "Your farm area",
  condition: "Clear skies",
  temperature: "29°",
  feelsLike: "Feels like 31°",
  rain: "24%",
  humidity: "68%",
  wind: "11 km/h",
  fieldNote: "Good window for scouting and light field work.",
  source: "Local preview · connect a live provider for updates",
};

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
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const analyze = trpc.cropHealth.analyze.useMutation({
    onSuccess: data => {
      setScanResult(data);
      toast.success("Crop analysis complete");
    },
    onError: error =>
      toast.error(
        error.message ||
          "We couldn't analyze this image. Please try again with a clear crop photo."
      ),
  });
  const { data: recentScans = [] } = trpc.cropHealth.recent.useQuery(
    undefined,
    { enabled: Boolean(user) }
  );
  const { data: farmOverview } = trpc.farm.overview.useQuery(undefined, {
    enabled: Boolean(user),
  });
  const profileUpdate = trpc.profile.update.useMutation({
    onSuccess: () => {
      setProfileEditing(false);
      toast.success("Profile updated");
    },
    onError: () => toast.error("We couldn't update your profile right now."),
  });
  const ask = trpc.agroguard.ask.useMutation({
    onSuccess: data =>
      setChatMessages(messages => [
        ...messages,
        { role: "assistant", content: data.answer },
      ]),
    onError: error => {
      const message = error.message || "AgroGuard is temporarily unavailable.";
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
      return toast.error("Upload a clear tomato leaf photo first.");
    try {
      const imageDataUrl = await prepareImageDataUrl(scanFile);
      analyze.mutate({ imageDataUrl, cropType: "tomato" });
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

  return (
    <div className="app-shell">
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
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={startLogin}>
              <LogIn size={15} /> Sign in
            </Button>
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
            <HomeSection setSection={setSection} recentScans={recentScans} />
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
            />
          )}
          {current === "weather" && <WeatherSection />}
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
              profileEditing={profileEditing}
              setProfileEditing={setProfileEditing}
              profileName={profileName || user?.name || ""}
              setProfileName={setProfileName}
              profileEmail={profileEmail || user?.email || ""}
              setProfileEmail={setProfileEmail}
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
}: {
  setSection: (id: Section) => void;
  recentScans?: any[];
}) {
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
}: any) {
  return (
    <div className="page-stack narrow-page">
      <div className="feature-intro">
        <span className="pill pill-green">
          <Leaf size={13} /> TOMATO FIRST
        </span>
        <h2>Check your crop health</h2>
        <p>
          Take or upload a clear photo of a tomato leaf or plant. AgroGuard will
          return an AI-assisted preliminary assessment, not a final diagnosis.
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
                  <img src={scanPreview} alt="Selected tomato crop" />
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
        <ResultCard result={scanResult} onReset={() => setScanResult(null)} />
      )}
    </div>
  );
}

function ResultCard({ result, onReset }: { result: any; onReset: () => void }) {
  const confidence = Number(result.confidence || 0);
  const level = confidenceLabel(confidence);
  return (
    <div className="result-stack">
      <Card className="result-card">
        <CardHeader>
          <div className="result-head">
            <div>
              <span className="eyebrow">AI-ASSISTED ASSESSMENT</span>
              <CardTitle>{result.crop || "Tomato"}</CardTitle>
            </div>
            <Badge className={`confidence-${level.toLowerCase()}`}>
              {level} confidence
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="condition-row">
            <div>
              <span className="result-label">Possible condition</span>
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
                  Please take a clearer image or consult an agricultural expert
                  before acting.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="recommendation-card">
        <CardHeader>
          <CardTitle>What you should do</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            {result.recommendation ||
              "Retake the image in good light and seek local expert guidance."}
          </p>
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

function WeatherSection() {
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
                <strong>No active alerts</strong>
                <p>
                  AgroGuard will flag heat, heavy rain, wind, and dry-spell
                  risks when a live provider is connected.
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
          <strong>Ready for live weather</strong> Connect a trusted local
          weather API to replace this preview without changing the dashboard
          components.
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
  profileEditing,
  setProfileEditing,
  profileName,
  setProfileName,
  profileEmail,
  setProfileEmail,
  saveProfile,
  recentScans = [],
  analyses = [],
  recommendations = [],
  farms = [],
}: any) {
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
            {farms[0]?.name ||
              (user?.name ? `${user.name}'s farm` : "Your farm profile")}
          </h3>
          <p>
            <MapPin size={14} /> {farms[0]?.location || "Location not set"}
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
          <Button variant="outline" onClick={startLogin}>
            Sign in to save
          </Button>
        )}
      </div>
      {user && profileEditing && (
        <Card className="profile-edit-card">
          <CardContent>
            <div className="profile-edit-grid">
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
              <Button className="primary-btn" onClick={saveProfile}>
                Save profile
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
            "No crops added",
            "Add tomato and other field crops",
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
            "Not set",
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
    </div>
  );
}
