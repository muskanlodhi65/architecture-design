import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Building2, Eye, EyeOff, Sparkles, ArrowRight, Mail, Lock, UserPlus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const authSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export default function Auth() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [focused, setFocused] = useState<string | null>(null);

  const { user, loading, signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (mode === "forgot") {
      const emailResult = z.string().trim().email({ message: "Invalid email address" }).safeParse(email);
      if (!emailResult.success) {
        setErrors({ email: emailResult.error.errors[0].message });
        return;
      }
      setIsSubmitting(true);
      try {
        const { error } = await resetPassword(email);
        if (error) {
          toast({ title: "Reset failed", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Check your email", description: "We've sent you a password reset link." });
          setMode("login");
        }
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const result = authSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) {
          const msg = error.message;
          if (msg.includes("Email not confirmed") || msg.includes("not confirmed")) {
            toast({
              title: "Email not verified",
              description: "Please check your inbox and click the confirmation link we sent you.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Login failed",
              description: msg === "Invalid login credentials"
                ? "Invalid email or password. Please try again."
                : msg,
              variant: "destructive",
            });
          }
        } else {
          toast({ title: "Welcome back! 🎉", description: "You have successfully logged in." });
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          toast({
            title: "Sign up failed",
            description: error.message.includes("already registered")
              ? "This email is already registered. Please log in instead."
              : error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Account created! ✉️",
            description: "Please check your email inbox and click the confirmation link to activate your account.",
          });
          setMode("login");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0a0a1a 0%, #0d0d2b 50%, #0a0a1a 100%)" }}>
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-transparent" style={{ borderTopColor: "#7c6ff7", borderRightColor: "#a78bfa", animation: "spin 1s linear infinite" }} />
          <div className="absolute inset-2 w-12 h-12 rounded-full border-2 border-transparent" style={{ borderBottomColor: "#6d5be6", animation: "spin 0.7s linear infinite reverse" }} />
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-40px, 30px) scale(1.08); }
          66% { transform: translate(25px, -40px) scale(0.92); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, 40px) scale(1.06); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes borderGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(124, 111, 247, 0.3); }
          50% { box-shadow: 0 0 40px rgba(124, 111, 247, 0.6); }
        }
        .auth-card {
          animation: fadeSlideUp 0.6s ease forwards;
        }
        .gradient-text {
          background: linear-gradient(135deg, #a78bfa 0%, #7c6ff7 50%, #6d5be6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .shimmer-btn {
          background: linear-gradient(90deg, #7c6ff7 0%, #a78bfa 25%, #7c6ff7 50%, #6d5be6 75%, #7c6ff7 100%);
          background-size: 200% auto;
          transition: background-position 0.5s ease, transform 0.2s ease, box-shadow 0.2s ease;
        }
        .shimmer-btn:hover {
          background-position: right center;
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(124, 111, 247, 0.5);
        }
        .shimmer-btn:active {
          transform: translateY(0);
        }
        .input-field {
          background: rgba(255,255,255,0.04);
          border: 1.5px solid rgba(255,255,255,0.1);
          color: white;
          transition: all 0.3s ease;
          border-radius: 12px;
        }
        .input-field:focus {
          background: rgba(124, 111, 247, 0.08);
          border-color: rgba(124, 111, 247, 0.6);
          box-shadow: 0 0 0 3px rgba(124, 111, 247, 0.15);
          outline: none;
        }
        .input-field::placeholder {
          color: rgba(255,255,255,0.25);
        }
        .feature-chip {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }
        .feature-chip:hover {
          background: rgba(124, 111, 247, 0.15);
          border-color: rgba(124, 111, 247, 0.3);
        }
        .mode-tab {
          transition: all 0.3s ease;
          cursor: pointer;
          border-radius: 10px;
          padding: 8px 20px;
          font-size: 14px;
          font-weight: 500;
        }
        .mode-tab.active {
          background: rgba(124, 111, 247, 0.2);
          color: #a78bfa;
          border: 1px solid rgba(124, 111, 247, 0.4);
        }
        .mode-tab.inactive {
          color: rgba(255,255,255,0.4);
          border: 1px solid transparent;
        }
        .mode-tab.inactive:hover {
          color: rgba(255,255,255,0.7);
          background: rgba(255,255,255,0.05);
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.1);
        }
        .left-panel {
          background: linear-gradient(145deg, rgba(124, 111, 247, 0.15) 0%, rgba(109, 91, 230, 0.08) 100%);
          border-right: 1px solid rgba(255,255,255,0.08);
        }
        .stat-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 16px;
          transition: all 0.3s ease;
        }
        .stat-card:hover {
          background: rgba(124, 111, 247, 0.1);
          border-color: rgba(124, 111, 247, 0.25);
          transform: translateY(-2px);
        }
        .link-btn {
          color: #a78bfa;
          font-weight: 600;
          transition: all 0.2s ease;
          background: none;
          border: none;
          cursor: pointer;
          text-decoration: none;
        }
        .link-btn:hover {
          color: #c4b5fd;
          text-decoration: underline;
        }
        .error-text {
          color: #f87171;
          font-size: 12px;
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .logo-ring {
          animation: borderGlow 3s ease-in-out infinite;
        }
      `}</style>

      <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #06060f 0%, #0b0b20 40%, #08081a 100%)", fontFamily: "'Lato', sans-serif" }}>

        {/* Animated gradient orbs */}
        <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
          <div style={{ position: "absolute", top: "-10%", left: "-5%", width: "50vw", height: "50vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(124,111,247,0.18) 0%, transparent 70%)", animation: "float1 12s ease-in-out infinite" }} />
          <div style={{ position: "absolute", bottom: "-15%", right: "-10%", width: "60vw", height: "60vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(109,91,230,0.14) 0%, transparent 70%)", animation: "float2 15s ease-in-out infinite" }} />
          <div style={{ position: "absolute", top: "40%", left: "30%", width: "35vw", height: "35vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)", animation: "float3 10s ease-in-out infinite" }} />
        </div>

        {/* ── Left panel (hero) – hidden on mobile ── */}
        <div className="left-panel hidden lg:flex flex-col justify-between p-12 relative z-10" style={{ width: "50%", minWidth: 480 }}>
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="logo-ring flex items-center justify-center w-11 h-11 rounded-xl" style={{ background: "linear-gradient(135deg, rgba(124,111,247,0.3) 0%, rgba(109,91,230,0.2) 100%)", border: "1.5px solid rgba(124,111,247,0.5)" }}>
              <Building2 className="w-5 h-5" style={{ color: "#a78bfa" }} />
            </div>
            <span className="text-white font-bold text-lg tracking-tight" style={{ fontFamily: "'EB Garamond', serif" }}>ArchDesign AI</span>
          </div>

          {/* Center hero text */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6" style={{ background: "rgba(124,111,247,0.15)", border: "1px solid rgba(124,111,247,0.3)" }}>
              <Sparkles className="w-3.5 h-3.5" style={{ color: "#a78bfa" }} />
              <span className="text-xs font-semibold" style={{ color: "#a78bfa" }}>AI-Powered Design Platform</span>
            </div>

            <h1 className="text-5xl font-bold text-white leading-tight mb-4" style={{ fontFamily: "'EB Garamond', serif", lineHeight: 1.15 }}>
              Transform your<br />
              vision into<br />
              <span className="gradient-text">stunning designs</span>
            </h1>
            <p className="text-lg" style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.7, maxWidth: 400 }}>
              Generate professional architectural & interior designs instantly with the power of AI. No design skills required.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-10">
              {[
                { value: "50K+", label: "Designs created" },
                { value: "98%", label: "Satisfaction rate" },
                { value: "< 30s", label: "Generation time" },
              ].map((s) => (
                <div key={s.label} className="stat-card text-center">
                  <div className="text-xl font-bold" style={{ color: "#a78bfa" }}>{s.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Feature chips */}
          <div>
            <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>What you get</p>
            <div className="flex flex-wrap gap-2">
              {["🏠 Interior Design", "🏗️ Architecture", "🎨 Style Transfer", "📐 Floor Plans", "🌿 Landscape", "🖼️ 3D Rendering"].map((f) => (
                <span key={f} className="feature-chip text-xs px-3 py-1.5 rounded-full" style={{ color: "rgba(255,255,255,0.7)" }}>{f}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right panel (auth form) ── */}
        <div className="flex-1 flex items-center justify-center p-6 relative z-10">
          <div className="w-full max-w-[420px] auth-card">

            {/* Mobile logo */}
            <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: "linear-gradient(135deg, rgba(124,111,247,0.3) 0%, rgba(109,91,230,0.2) 100%)", border: "1.5px solid rgba(124,111,247,0.5)" }}>
                <Building2 className="w-5 h-5" style={{ color: "#a78bfa" }} />
              </div>
              <span className="text-white font-bold text-lg" style={{ fontFamily: "'EB Garamond', serif" }}>ArchDesign AI</span>
            </div>

            {/* Glass card */}
            <div className="glass-card rounded-2xl overflow-hidden">
              {/* Top colored bar */}
              <div style={{ height: 3, background: "linear-gradient(90deg, #7c6ff7, #a78bfa, #6d5be6)" }} />

              <div className="p-8">
                {/* Mode toggle tabs */}
                {mode !== "forgot" && (
                  <div className="flex gap-2 mb-8 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <button
                      type="button"
                      className={`mode-tab flex-1 flex items-center justify-center gap-2 ${mode === "login" ? "active" : "inactive"}`}
                      onClick={() => { setMode("login"); setErrors({}); }}
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      Sign In
                    </button>
                    <button
                      type="button"
                      className={`mode-tab flex-1 flex items-center justify-center gap-2 ${mode === "signup" ? "active" : "inactive"}`}
                      onClick={() => { setMode("signup"); setErrors({}); }}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Sign Up
                    </button>
                  </div>
                )}

                {/* Header text */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'EB Garamond', serif" }}>
                    {mode === "forgot" ? "Forgot password?" : mode === "login" ? "Welcome back 👋" : "Create account ✨"}
                  </h2>
                  <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {mode === "forgot"
                      ? "No worries! Enter your email and we'll send a reset link."
                      : mode === "login"
                      ? "Sign in to continue generating stunning designs."
                      : "Join thousands of designers using ArchDesign AI."}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: focused === "email" ? "#a78bfa" : "rgba(255,255,255,0.3)", transition: "color 0.3s" }} />
                      <input
                        id="auth-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocused("email")}
                        onBlur={() => setFocused(null)}
                        disabled={isSubmitting}
                        className="input-field w-full h-11 pl-10 pr-4 text-sm"
                        autoComplete="email"
                      />
                    </div>
                    {errors.email && <p className="error-text">⚠ {errors.email}</p>}
                  </div>

                  {/* Password */}
                  {mode !== "forgot" && (
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: focused === "password" ? "#a78bfa" : "rgba(255,255,255,0.3)", transition: "color 0.3s" }} />
                        <input
                          id="auth-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={() => setFocused("password")}
                          onBlur={() => setFocused(null)}
                          disabled={isSubmitting}
                          className="input-field w-full h-11 pl-10 pr-11 text-sm"
                          autoComplete={mode === "login" ? "current-password" : "new-password"}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                          style={{ color: "rgba(255,255,255,0.35)", background: "none", border: "none", cursor: "pointer" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="error-text">⚠ {errors.password}</p>}
                    </div>
                  )}

                  {/* Forgot password link */}
                  {mode === "login" && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => { setMode("forgot"); setErrors({}); }}
                        className="link-btn text-xs"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  {/* Submit button */}
                  <button
                    id="auth-submit"
                    type="submit"
                    disabled={isSubmitting}
                    className="shimmer-btn w-full h-12 rounded-xl font-semibold text-white flex items-center justify-center gap-2 mt-2"
                    style={{
                      background: isSubmitting ? "rgba(124,111,247,0.5)" : undefined,
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      border: "none",
                      fontSize: 15,
                      letterSpacing: "0.01em",
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <div style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                        Please wait...
                      </>
                    ) : mode === "forgot" ? (
                      <>Send Reset Link <ArrowRight className="w-4 h-4" /></>
                    ) : mode === "login" ? (
                      <>Sign In <ArrowRight className="w-4 h-4" /></>
                    ) : (
                      <>Create Account <Sparkles className="w-4 h-4" /></>
                    )}
                  </button>
                </form>

                {/* Footer link */}
                <div className="mt-6 text-center text-sm">
                  {mode === "forgot" ? (
                    <button type="button" onClick={() => { setMode("login"); setErrors({}); }} className="link-btn text-sm">
                      ← Back to sign in
                    </button>
                  ) : (
                    <span style={{ color: "rgba(255,255,255,0.4)" }}>
                      {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                      <button
                        type="button"
                        onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErrors({}); }}
                        className="link-btn"
                      >
                        {mode === "login" ? "Sign up free" : "Sign in"}
                      </button>
                    </span>
                  )}
                </div>

                {/* Terms */}
                {mode === "signup" && (
                  <p className="text-center mt-4 text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
                    By creating an account, you agree to our{" "}
                    <span style={{ color: "rgba(167,139,250,0.6)" }}>Terms of Service</span> and{" "}
                    <span style={{ color: "rgba(167,139,250,0.6)" }}>Privacy Policy</span>.
                  </p>
                )}
              </div>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-6 mt-6">
              {["🔒 Secure & encrypted", "✦ No credit card", "⚡ Instant access"].map((t) => (
                <span key={t} className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
