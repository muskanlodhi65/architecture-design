import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Save, Download, Trash2, Filter, X } from "lucide-react";
import { Header } from "@/components/Header";
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
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Filter states
  const [filterBuildingType, setFilterBuildingType] = useState<string>("all");
  const [filterStyle, setFilterStyle] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchGenerations();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setDisplayName(data.display_name || "");
      } else {
        await supabase.from("profiles").insert({ user_id: user!.id });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const fetchGenerations = async () => {
    try {
      const { data, error } = await supabase
        .from("generations")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGenerations(data || []);
    } catch (error) {
      console.error("Error fetching generations:", error);
    }
  };

  const filteredGenerations = useMemo(() => {
    return generations.filter((gen) => {
      if (filterBuildingType !== "all" && gen.building_type !== filterBuildingType) {
        return false;
      }
      if (filterStyle !== "all" && gen.style !== filterStyle) {
        return false;
      }
      if (filterDateFrom) {
        const genDate = new Date(gen.created_at);
        const fromDate = new Date(filterDateFrom);
        if (genDate < fromDate) return false;
      }
      if (filterDateTo) {
        const genDate = new Date(gen.created_at);
        const toDate = new Date(filterDateTo);
        toDate.setHours(23, 59, 59, 999);
        if (genDate > toDate) return false;
      }
      return true;
    });
  }, [generations, filterBuildingType, filterStyle, filterDateFrom, filterDateTo]);

  const clearFilters = () => {
    setFilterBuildingType("all");
    setFilterStyle("all");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  const hasActiveFilters =
    filterBuildingType !== "all" ||
    filterStyle !== "all" ||
    filterDateFrom !== "" ||
    filterDateTo !== "";

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("user_id", user!.id);

      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGeneration = async (id: string) => {
    try {
      const { error } = await supabase
        .from("generations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setGenerations(generations.filter((g) => g.id !== id));
      toast.success("Generation deleted");
    } catch (error) {
      console.error("Error deleting generation:", error);
      toast.error("Failed to delete generation");
    }
  };

  const handleDownload = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `design-${index + 1}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error("Failed to download image");
    }
  };

  if (loading || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Generator
        </Button>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Profile Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                />
              </div>
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save Profile"}
              </Button>
            </CardContent>
          </Card>

          {/* Generation History Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Generation History</CardTitle>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="mr-1 h-4 w-4" />
                    Clear filters
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="mb-6 p-4 bg-muted/50 rounded-lg space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Filter className="h-4 w-4" />
                  Filters
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="filterBuildingType">Building Type</Label>
                    <Select
                      value={filterBuildingType}
                      onValueChange={setFilterBuildingType}
                    >
                      <SelectTrigger id="filterBuildingType">
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        {BUILDING_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="filterStyle">Style</Label>
                    <Select value={filterStyle} onValueChange={setFilterStyle}>
                      <SelectTrigger id="filterStyle">
                        <SelectValue placeholder="All styles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All styles</SelectItem>
                        {ARCHITECTURAL_STYLES.map((style) => (
                          <SelectItem key={style} value={style}>
                            {style}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="filterDateFrom">From Date</Label>
                    <Input
                      id="filterDateFrom"
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="filterDateTo">To Date</Label>
                    <Input
                      id="filterDateTo"
                      type="date"
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {generations.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No generations yet. Start creating designs!
                </p>
              ) : filteredGenerations.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No generations match your filters.
                </p>
              ) : (
                <div className="space-y-6">
                  {filteredGenerations.map((gen) => (
                    <div
                      key={gen.id}
                      className="border rounded-lg p-4 space-y-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">
                            {gen.style} {gen.building_type} - {gen.design_type}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {gen.rooms} rooms • {gen.budget} budget
                            {gen.colors && ` • ${gen.colors}`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(gen.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteGeneration(gen.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {gen.images.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={img}
                              alt={`Design ${idx + 1}`}
                              className="w-full h-24 object-cover rounded-md"
                            />
                            <Button
                              variant="secondary"
                              size="icon"
                              className="absolute bottom-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDownload(img, idx)}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
