import { Building2, Sparkles, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function Header() {
  const navigate = useNavigate();

  return (
    <header className="w-full py-5 px-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/dashboard")}>
          <div className="p-2 bg-primary rounded-lg">
            <Building2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-bold text-white">ArchDesign AI</h1>
            <p className="text-xs text-white/40">Generate stunning designs</p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-white/40 hidden sm:flex">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Powered by AI</span>
          </div>

          {/* Profile button */}
          <button
            onClick={() => navigate("/profile")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(124,111,247,0.15)",
              border: "1px solid rgba(124,111,247,0.35)",
              borderRadius: 10,
              padding: "8px 14px",
              color: "#a78bfa",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(124,111,247,0.25)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(124,111,247,0.15)";
            }}
          >
            <User size={14} />
            <span className="hidden sm:inline">My Profile</span>
          </button>
        </div>
      </div>
    </header>
  );
}
