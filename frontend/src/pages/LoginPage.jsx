import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, User, RadioTower } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) setError("");
  };

  const formatError = (detail) => {
    if (!detail) return "Login failed. Please try again.";
    if (typeof detail === "string") return detail;

    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (typeof item === "string") return item;
          if (item?.msg) return item.msg;
          return "Invalid input";
        })
        .join(", ");
    }

    if (typeof detail === "object") {
      if (detail?.msg) return detail.msg;
      return "Invalid input";
    }

    return "Login failed. Please try again.";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const username = form.username.trim();
    const password = form.password.trim();

    if (!username && !password) {
      setError("Please enter username and password.");
      return;
    }
    if (!username) {
      setError("Please enter username.");
      return;
    }
    if (!password) {
      setError("Please enter password.");
      return;
    }

    try {
      setLoading(true);
      const user = await login(username, password);
      const role =
        typeof user?.role === "string" ? user.role.trim().toLowerCase() : user?.role;

      if (role === "admin") {
        navigate("/admin");
      } else {
        navigate("/client");
      }
    } catch (err) {
      console.error("Login error:", err);
      console.error("Login response:", err?.response?.data);

      const detail = err?.response?.data?.detail;
      setError(formatError(detail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#dbeefe]">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-3 lg:py-4">
        <div className="grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.2fr_420px] xl:gap-12">
          <div className="relative hidden h-[430px] lg:block">
            <div className="absolute inset-0 rounded-[40px] bg-[radial-gradient(circle_at_20%_20%,_rgba(56,189,248,0.18),_transparent_24%),radial-gradient(circle_at_80%_28%,_rgba(59,130,246,0.14),_transparent_22%),radial-gradient(circle_at_50%_90%,_rgba(14,165,233,0.10),_transparent_28%)]" />

            <svg
              viewBox="0 0 860 430"
              className="h-full w-full"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="earthFillStrong" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#eff8ff" stopOpacity="0.18" />
                  <stop offset="45%" stopColor="#7dd3fc" stopOpacity="0.30" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.42" />
                </linearGradient>

                <linearGradient id="horizonStrong" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.10" />
                  <stop offset="18%" stopColor="#67e8f9" stopOpacity="0.75" />
                  <stop offset="50%" stopColor="#ffffff" stopOpacity="0.98" />
                  <stop offset="82%" stopColor="#67e8f9" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.10" />
                </linearGradient>

                <filter id="nodeGlowStrong" x="-300%" y="-300%" width="600%" height="600%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                <clipPath id="earthClipStrong">
                  <path d="M70 320 C 180 210, 680 210, 790 320 L 790 430 L 70 430 Z" />
                </clipPath>
              </defs>

              <path
                d="M70 320 C 180 210, 680 210, 790 320"
                stroke="url(#horizonStrong)"
                strokeWidth="5"
                strokeLinecap="round"
              />

              <path
                d="M70 320 C 180 210, 680 210, 790 320 L 790 430 L 70 430 Z"
                fill="url(#earthFillStrong)"
              />

              <g clipPath="url(#earthClipStrong)" opacity="0.68">
                <path d="M120 410 C 220 285, 640 285, 740 410" stroke="#b3e9ff" strokeWidth="1.6" opacity="0.35" />
                <path d="M150 390 C 245 295, 615 295, 710 390" stroke="#b3e9ff" strokeWidth="1.6" opacity="0.35" />
                <path d="M185 365 C 275 300, 585 300, 675 365" stroke="#b3e9ff" strokeWidth="1.6" opacity="0.35" />
                <path d="M225 340 C 305 305, 555 305, 635 340" stroke="#b3e9ff" strokeWidth="1.6" opacity="0.35" />

                <path d="M430 238 L 430 430" stroke="#c9f2ff" strokeWidth="1.2" opacity="0.34" />
                <path d="M350 246 C 365 300, 368 360, 360 430" stroke="#c9f2ff" strokeWidth="1.2" opacity="0.28" />
                <path d="M510 246 C 495 300, 492 360, 500 430" stroke="#c9f2ff" strokeWidth="1.2" opacity="0.28" />
                <path d="M280 260 C 310 320, 320 372, 320 430" stroke="#c9f2ff" strokeWidth="1.2" opacity="0.22" />
                <path d="M580 260 C 550 320, 540 372, 540 430" stroke="#c9f2ff" strokeWidth="1.2" opacity="0.22" />
              </g>

              <g clipPath="url(#earthClipStrong)">
                <path
                  d="M180 330 C 220 280, 300 270, 350 300 C 320 340, 280 360, 215 355 C 195 350, 185 342, 180 330 Z"
                  fill="#0f8fd3"
                  opacity="0.34"
                />
                <path
                  d="M370 300 C 420 275, 470 282, 510 318 C 490 360, 442 378, 392 365 C 374 350, 366 330, 370 300 Z"
                  fill="#0aa6d8"
                  opacity="0.34"
                />
                <path
                  d="M540 312 C 592 286, 650 290, 700 328 C 670 360, 615 374, 560 360 C 542 346, 536 330, 540 312 Z"
                  fill="#1da7f0"
                  opacity="0.34"
                />
                <path
                  d="M455 360 C 492 350, 524 360, 548 385 C 520 406, 484 412, 452 402 C 444 390, 445 374, 455 360 Z"
                  fill="#0f8fd3"
                  opacity="0.30"
                />
              </g>

              <path
                d="M185 330 C 260 268, 365 252, 470 285"
                stroke="#8ce8ff"
                strokeWidth="2.2"
                strokeLinecap="round"
                opacity="0.95"
              />
              <path
                d="M245 350 C 340 280, 490 270, 620 330"
                stroke="#7dd3fc"
                strokeWidth="2.2"
                strokeLinecap="round"
                opacity="0.92"
              />
              <path
                d="M470 285 C 560 250, 650 262, 720 326"
                stroke="#8ce8ff"
                strokeWidth="2.2"
                strokeLinecap="round"
                opacity="0.96"
              />
              <path
                d="M215 355 C 330 390, 490 392, 610 350"
                stroke="#67e8f9"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.85"
              />
              <path
                d="M392 365 C 450 325, 515 320, 560 360"
                stroke="#93c5fd"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.88"
              />
              <path
                d="M350 300 C 420 265, 525 262, 620 330"
                stroke="#c4f4ff"
                strokeWidth="1.9"
                strokeLinecap="round"
                opacity="0.72"
              />

              <circle r="4.8" fill="#67e8f9" filter="url(#nodeGlowStrong)">
                <animateMotion
                  dur="4.8s"
                  repeatCount="indefinite"
                  path="M185 330 C 260 268, 365 252, 470 285"
                />
              </circle>

              <circle r="4.4" fill="#38bdf8" filter="url(#nodeGlowStrong)">
                <animateMotion
                  dur="5.5s"
                  begin="0.8s"
                  repeatCount="indefinite"
                  path="M245 350 C 340 280, 490 270, 620 330"
                />
              </circle>

              <circle r="4.4" fill="#60a5fa" filter="url(#nodeGlowStrong)">
                <animateMotion
                  dur="5.2s"
                  begin="1.6s"
                  repeatCount="indefinite"
                  path="M470 285 C 560 250, 650 262, 720 326"
                />
              </circle>

              <circle r="4.2" fill="#a5f3fc" filter="url(#nodeGlowStrong)">
                <animateMotion
                  dur="5.8s"
                  begin="2.1s"
                  repeatCount="indefinite"
                  path="M215 355 C 330 390, 490 392, 610 350"
                />
              </circle>

              <TowerNode x={185} y={330} />
              <NetworkNode x={245} y={350} />
              <TowerNode x={350} y={300} />
              <NetworkNode x={470} y={285} />
              <TowerNode x={392} y={365} />
              <NetworkNode x={560} y={360} />
              <TowerNode x={620} y={330} />
              <NetworkNode x={720} y={326} />
              <TowerNode x={610} y={350} />

              <circle cx="120" cy="90" r="2.2" fill="#e0f7ff" opacity="0.9" />
              <circle cx="250" cy="60" r="2.6" fill="#7dd3fc" opacity="0.75" />
              <circle cx="690" cy="80" r="2.1" fill="#e0f7ff" opacity="0.85" />
              <circle cx="760" cy="110" r="1.9" fill="#67e8f9" opacity="0.75" />
              <circle cx="590" cy="52" r="1.9" fill="#bae6fd" opacity="0.78" />
            </svg>
          </div>

          <div className="flex min-h-[430px] items-center justify-center">
            <div className="w-full max-w-[400px] rounded-3xl border border-sky-200 bg-white p-8 shadow-[0_18px_48px_rgba(14,116,144,0.10)]">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                  <RadioTower className="h-7 w-7" />
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                  Network Monitoring System
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  Sign in to access the operations dashboard
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Username
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-sky-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-200">
                    <User className="h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      name="username"
                      value={form.username}
                      onChange={handleChange}
                      placeholder="Enter username"
                      autoComplete="username"
                      className="w-full bg-transparent py-3.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-sky-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-200">
                    <LockKeyhole className="h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Enter password"
                      autoComplete="current-password"
                      className="w-full bg-transparent py-3.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="text-slate-400 transition hover:text-sky-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-sky-500 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Signing In..." : "Sign In"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NetworkNode({ x, y }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle r="12" fill="rgba(103,232,249,0.16)" />
      <circle r="6" fill="#67e8f9" filter="url(#nodeGlowStrong)" />
      <circle r="2.4" fill="#ffffff" opacity="1" />
    </g>
  );
}

function TowerNode({ x, y }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle r="14" fill="rgba(56,189,248,0.18)" />
      <circle r="7.5" fill="#38bdf8" filter="url(#nodeGlowStrong)" />

      <line
        x1="0"
        y1="-4"
        x2="0"
        y2="11"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="-4.5"
        y1="11"
        x2="0"
        y2="-4"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="4.5"
        y1="11"
        x2="0"
        y2="-4"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="-3"
        y1="11"
        x2="3"
        y2="11"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M-6 -1 C-8 -3 -8 -7 -6 -9"
        stroke="#ffffff"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M6 -1 C8 -3 8 -7 6 -9"
        stroke="#ffffff"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </g>
  );
}

export default LoginPage;
