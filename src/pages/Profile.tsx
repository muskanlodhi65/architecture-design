import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  ArrowLeft, Save, Download, Trash2, Filter, X, User,
  LayoutGrid, List, Calendar, Building2, Sparkles,
  BookmarkCheck, LogOut, ImageIcon, Eye
} from "lucide-react";
import { BUILDING_TYPES, ARCHITECTURAL_STYLES } from "@/types/design";

interface Generation {
  id: string;
  building_type: string;
  design_type: string;
  rooms: number;
  style: string;
  colors: string | null;
  budget: string;
  images: string[];
  prompt: string;
  created_at: string;
}

export default function Profile() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);

  // Filter states
  const [filterBuildingType, setFilterBuildingType] = useState("all");
  const [filterStyle, setFilterStyle] = useState("all");
  const [filterDesignType, setFilterDesignType] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchGenerations();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (data) {
        setDisplayName(data.display_name || "");
      } else {
        await supabase.from("profiles").insert({ user_id: user!.id });
      }
    } catch (err) {
      console.error("fetchProfile error:", err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const fetchGenerations = async () => {
    try {
      const { data } = await supabase
        .from("generations")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      setGenerations(data || []);
    } catch (err) {
      console.error("fetchGenerations error:", err);
    }
  };

  const filteredGenerations = useMemo(() => {
    return generations.filter((gen) => {
      if (filterBuildingType !== "all" && gen.building_type !== filterBuildingType) return false;
      if (filterStyle !== "all" && gen.style !== filterStyle) return false;
      if (filterDesignType !== "all" && gen.design_type !== filterDesignType) return false;
      return true;
    });
  }, [generations, filterBuildingType, filterStyle, filterDesignType]);

  const hasActiveFilters = filterBuildingType !== "all" || filterStyle !== "all" || filterDesignType !== "all";

  const clearFilters = () => {
    setFilterBuildingType("all");
    setFilterStyle("all");
    setFilterDesignType("all");
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("user_id", user!.id);
      if (error) throw error;
      toast.success("Profile saved! ✅");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGeneration = async (id: string) => {
    try {
      const { error } = await supabase.from("generations").delete().eq("id", id);
      if (error) throw error;
      setGenerations((prev) => prev.filter((g) => g.id !== id));
      toast.success("Design deleted from collection");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleDownload = (imageUrl: string, index: number) => {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `design-${index + 1}.png`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const avatarInitial = displayName
    ? displayName[0].toUpperCase()
    : user?.email?.[0].toUpperCase() || "U";

  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "";

  if (loading || isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg,#06060f,#0b0b20)" }}>
        <div className="w-12 h-12 rounded-full border-4 border-transparent" style={{ borderTopColor: "#7c6ff7", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .page-bg { background: linear-gradient(135deg, #06060f 0%, #0b0b20 60%, #08081a 100%); min-height: 100vh; }
        .glass { background: rgba(255,255,255,0.05); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.1); }
        .glass-dark { background: rgba(0,0,0,0.3); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.08); }
        .card-anim { animation: fadeIn 0.5s ease forwards; }
        .stat-box { background: rgba(124,111,247,0.1); border: 1px solid rgba(124,111,247,0.25); border-radius: 14px; padding: 16px; text-align: center; }
        .gen-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; overflow: hidden; transition: all 0.3s ease; }
        .gen-card:hover { border-color: rgba(124,111,247,0.4); background: rgba(124,111,247,0.06); transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0,0,0,0.4); }
        .img-thumb { width:100%; height:100px; object-fit:cover; border-radius:8px; cursor:pointer; transition: transform 0.2s; }
        .img-thumb:hover { transform: scale(1.04); }
        .avatar { width:72px; height:72px; border-radius:50%; background: linear-gradient(135deg,#7c6ff7,#a78bfa); display:flex; align-items:center; justify-content:center; font-size:28px; font-weight:700; color:white; border: 3px solid rgba(167,139,250,0.4); }
        .pill { display:inline-flex; align-items:center; gap:6px; padding: 4px 12px; border-radius:999px; font-size:12px; font-weight:600; }
        .filter-select { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: white; border-radius: 10px; padding: 8px 12px; font-size:13px; width:100%; outline:none; }
        .filter-select option { background: #1a1a2e; color: white; }
        .input-field { background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.12); color: white; border-radius: 10px; padding: 10px 14px; font-size:14px; width:100%; outline:none; transition: border-color 0.3s; }
        .input-field:focus { border-color: rgba(124,111,247,0.6); }
        .input-field::placeholder { color: rgba(255,255,255,0.3); }
        .btn-primary { background: linear-gradient(135deg,#7c6ff7,#a78bfa); border:none; color:white; border-radius:10px; padding:10px 20px; font-weight:600; font-size:14px; cursor:pointer; transition: all 0.2s; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(124,111,247,0.4); }
        .btn-primary:disabled { opacity:0.5; cursor:not-allowed; transform:none; }
        .btn-ghost { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); border-radius:10px; padding:8px 16px; font-size:13px; cursor:pointer; transition:all 0.2s; }
        .btn-ghost:hover { background: rgba(255,255,255,0.12); color:white; }
        .btn-danger { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color:#f87171; border-radius:8px; padding:6px 10px; cursor:pointer; transition:all 0.2s; }
        .btn-danger:hover { background: rgba(239,68,68,0.25); }
        .modal-bg { position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:100; display:flex; align-items:center; justify-content:center; padding:20px; }
        .modal-content { max-width:90vw; max-height:90vh; border-radius:16px; overflow:hidden; position:relative; }
        .tab-btn { padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s; }
        .tab-btn.active { background: rgba(124,111,247,0.25); color: #a78bfa; border: 1px solid rgba(124,111,247,0.4); }
        .tab-btn.inactive { background: transparent; color: rgba(255,255,255,0.4); border: 1px solid transparent; }
        .tab-btn.inactive:hover { color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.06); }
        .badge { padding:2px 10px; border-radius:999px; font-size:11px; font-weight:600; }
      `}</style>

      <div className="page-bg" style={{ fontFamily: "'Lato',sans-serif" }}>

        {/* Header */}
        <header className="glass-dark sticky top-0 z-50" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button className="btn-ghost" onClick={() => navigate("/dashboard")} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ArrowLeft size={16} /> Dashboard
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Building2 size={20} color="#a78bfa" />
              <span style={{ color: "white", fontWeight: 700, fontSize: 16, fontFamily: "'EB Garamond',serif" }}>ArchDesign AI</span>
            </div>
            <button className="btn-ghost" onClick={handleSignOut} style={{ display: "flex", alignItems: "center", gap: 8, color: "#f87171", borderColor: "rgba(239,68,68,0.3)" }}>
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </header>

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24, alignItems: "start" }}>

            {/* ── Left: Profile Card ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }} className="card-anim">

              {/* Avatar + Info */}
              <div className="glass" style={{ borderRadius: 20, padding: 24, textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                  <div className="avatar">{avatarInitial}</div>
                </div>
                <h2 style={{ color: "white", fontWeight: 700, fontSize: 18, margin: 0 }}>
                  {displayName || "Your Name"}
                </h2>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: "4px 0 0" }}>{user?.email}</p>
                {joinedDate && (
                  <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    <Calendar size={12} /> Joined {joinedDate}
                  </p>
                )}

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 20 }}>
                  <div className="stat-box">
                    <div style={{ color: "#a78bfa", fontWeight: 700, fontSize: 22 }}>{generations.length}</div>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>Designs</div>
                  </div>
                  <div className="stat-box">
                    <div style={{ color: "#a78bfa", fontWeight: 700, fontSize: 22 }}>
                      {generations.reduce((acc, g) => acc + (g.images?.length || 0), 0)}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>Images</div>
                  </div>
                </div>
              </div>

              {/* Edit Profile */}
              <div className="glass" style={{ borderRadius: 20, padding: 24 }}>
                <h3 style={{ color: "white", fontWeight: 700, fontSize: 14, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <User size={15} color="#a78bfa" /> Edit Profile
                </h3>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, display: "block", marginBottom: 6 }}>Display Name</label>
                  <input
                    className="input-field"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name..."
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, display: "block", marginBottom: 6 }}>Email</label>
                  <input className="input-field" value={user?.email || ""} disabled style={{ opacity: 0.5, cursor: "not-allowed" }} />
                </div>
                <button className="btn-primary" onClick={handleSaveProfile} disabled={isSaving} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Save size={14} /> {isSaving ? "Saving..." : "Save Profile"}
                </button>
              </div>

              {/* Quick nav */}
              <div className="glass" style={{ borderRadius: 20, padding: 20 }}>
                <button
                  className="btn-primary"
                  onClick={() => navigate("/dashboard")}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  <Sparkles size={14} /> Generate New Design
                </button>
              </div>
            </div>

            {/* ── Right: Collection ── */}
            <div className="card-anim" style={{ animationDelay: "0.1s" }}>
              <div className="glass" style={{ borderRadius: 20, padding: 24 }}>

                {/* Top bar */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <h2 style={{ color: "white", fontWeight: 700, fontSize: 20, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                      <BookmarkCheck size={20} color="#a78bfa" /> My Collection
                    </h2>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 4 }}>
                      {filteredGenerations.length} design{filteredGenerations.length !== 1 ? "s" : ""} saved
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {/* Filter toggle */}
                    <button
                      className={`tab-btn ${showFilters ? "active" : "inactive"}`}
                      onClick={() => setShowFilters((v) => !v)}
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <Filter size={13} /> Filters
                      {hasActiveFilters && (
                        <span className="badge" style={{ background: "rgba(124,111,247,0.4)", color: "#a78bfa" }}>ON</span>
                      )}
                    </button>
                    {/* View mode */}
                    <button className={`tab-btn ${viewMode === "grid" ? "active" : "inactive"}`} onClick={() => setViewMode("grid")}>
                      <LayoutGrid size={14} />
                    </button>
                    <button className={`tab-btn ${viewMode === "list" ? "active" : "inactive"}`} onClick={() => setViewMode("list")}>
                      <List size={14} />
                    </button>
                  </div>
                </div>

                {/* Filters panel */}
                {showFilters && (
                  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 16, marginBottom: 20 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, display: "block", marginBottom: 6 }}>Building Type</label>
                        <select className="filter-select" value={filterBuildingType} onChange={(e) => setFilterBuildingType(e.target.value)}>
                          <option value="all">All Types</option>
                          {BUILDING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, display: "block", marginBottom: 6 }}>Style</label>
                        <select className="filter-select" value={filterStyle} onChange={(e) => setFilterStyle(e.target.value)}>
                          <option value="all">All Styles</option>
                          {ARCHITECTURAL_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, display: "block", marginBottom: 6 }}>Design Type</label>
                        <select className="filter-select" value={filterDesignType} onChange={(e) => setFilterDesignType(e.target.value)}>
                          <option value="all">All</option>
                          <option value="Interior">Interior</option>
                          <option value="Exterior">Exterior</option>
                        </select>
                      </div>
                    </div>
                    {hasActiveFilters && (
                      <button className="btn-ghost" onClick={clearFilters} style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                        <X size={12} /> Clear all filters
                      </button>
                    )}
                  </div>
                )}

                {/* Generation cards */}
                {generations.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 20px" }}>
                    <ImageIcon size={48} color="rgba(255,255,255,0.15)" style={{ margin: "0 auto 16px" }} />
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, marginBottom: 8 }}>No designs saved yet</p>
                    <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>Generate your first design to start your collection!</p>
                    <button className="btn-primary" onClick={() => navigate("/dashboard")} style={{ marginTop: 20, display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <Sparkles size={14} /> Start Creating
                    </button>
                  </div>
                ) : filteredGenerations.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 20px" }}>
                    <p style={{ color: "rgba(255,255,255,0.4)" }}>No designs match your filters.</p>
                    <button className="btn-ghost" onClick={clearFilters} style={{ marginTop: 12 }}>Clear filters</button>
                  </div>
                ) : (
                  <div style={{
                    display: viewMode === "grid" ? "grid" : "flex",
                    gridTemplateColumns: viewMode === "grid" ? "repeat(auto-fill, minmax(280px, 1fr))" : undefined,
                    flexDirection: viewMode === "list" ? "column" : undefined,
                    gap: 16,
                  }}>
                    {filteredGenerations.map((gen) => (
                      <div key={gen.id} className="gen-card">
                        {/* Images */}
                        {viewMode === "grid" ? (
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, padding: 8 }}>
                            {gen.images.slice(0, 4).map((img, idx) => (
                              <div key={idx} style={{ position: "relative" }}>
                                <img
                                  src={img}
                                  alt={`view ${idx + 1}`}
                                  className="img-thumb"
                                  onClick={() => setSelectedImage({ url: img, title: `${gen.style} ${gen.building_type} — View ${idx + 1}` })}
                                />
                                <div style={{ position: "absolute", top: 4, right: 4, opacity: 0 }} className="hover-btns">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDownload(img, idx); }}
                                    style={{ background: "rgba(0,0,0,0.7)", border: "none", borderRadius: 6, padding: "4px 6px", cursor: "pointer", color: "white" }}
                                  >
                                    <Download size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: 6, padding: "12px 12px 0", overflowX: "auto" }}>
                            {gen.images.slice(0, 4).map((img, idx) => (
                              <img
                                key={idx}
                                src={img}
                                alt={`view ${idx + 1}`}
                                style={{ width: 80, height: 64, objectFit: "cover", borderRadius: 8, cursor: "pointer", flexShrink: 0 }}
                                onClick={() => setSelectedImage({ url: img, title: `${gen.style} ${gen.building_type}` })}
                              />
                            ))}
                          </div>
                        )}

                        {/* Info */}
                        <div style={{ padding: "12px 14px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <h3 style={{ color: "white", fontWeight: 700, fontSize: 14, margin: 0 }}>
                                {gen.style} {gen.building_type}
                              </h3>
                              <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                                <span className="badge" style={{ background: gen.design_type === "Interior" ? "rgba(124,111,247,0.2)" : "rgba(34,197,94,0.15)", color: gen.design_type === "Interior" ? "#a78bfa" : "#86efac" }}>
                                  {gen.design_type}
                                </span>
                                <span className="badge" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                                  {gen.rooms} rooms
                                </span>
                                <span className="badge" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                                  {gen.budget}
                                </span>
                              </div>
                              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                                <Calendar size={10} />
                                {new Date(gen.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                onClick={() => setSelectedImage({ url: gen.images[0], title: `${gen.style} ${gen.building_type}` })}
                                style={{ background: "rgba(124,111,247,0.15)", border: "1px solid rgba(124,111,247,0.3)", borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: "#a78bfa" }}
                              >
                                <Eye size={13} />
                              </button>
                              <button className="btn-danger" onClick={() => handleDeleteGeneration(gen.id)}>
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="modal-bg" onClick={() => setSelectedImage(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImage(null)}
              style={{ position: "absolute", top: 12, right: 12, zIndex: 10, background: "rgba(0,0,0,0.7)", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "white", fontSize: 16 }}
            >
              ✕
            </button>
            <img src={selectedImage.url} alt={selectedImage.title} style={{ maxWidth: "85vw", maxHeight: "85vh", objectFit: "contain", display: "block" }} />
            <div style={{ background: "rgba(0,0,0,0.8)", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "white", fontSize: 13, fontWeight: 600 }}>{selectedImage.title}</span>
              <button
                className="btn-primary"
                onClick={() => handleDownload(selectedImage.url, 0)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", fontSize: 13 }}
              >
                <Download size={13} /> Download
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
