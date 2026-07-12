import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Building,
  Palette,
  DollarSign,
  Sparkles,
  Home,
  Building2,
  Briefcase,
  Castle,
  ArrowLeft,
  ArrowRight,
  Ruler,
  Compass,
  Layers,
  Leaf,
  Sun,
} from "lucide-react";
import {
  DesignFormData,
  BUILDING_TYPES,
  DESIGN_TYPES,
  ARCHITECTURAL_STYLES,
  BUDGET_RANGES,
  ROOM_TYPES,
  PLOT_UNITS,
  FACING_DIRECTIONS,
  FLOOR_COUNT_OPTIONS,
  GREEN_FEATURES,
  LIGHTING_PREFERENCES,
} from "@/types/design";

interface DesignFormProps {
  onSubmit: (data: DesignFormData) => void;
  isLoading: boolean;
  initialData?: DesignFormData;
}

const buildingIcons = {
  House: Home,
  Apartment: Building2,
  Office: Briefcase,
  Villa: Castle,
};

const defaultFormData: DesignFormData = {
  buildingType: "",
  designType: "",
  numberOfRooms: 3,
  roomTypes: [],
  customRoomType: "",
  architecturalStyle: "",
  colorPreferences: "",
  budgetRange: "",
  customRequirements: "",
  plotLength: "",
  plotBreadth: "",
  plotUnit: "ft",
  facingDirection: "",
  floorCount: "",
  vaastuCompliant: false,
  greenFeatures: [],
  lightingPreference: "",
};

export function DesignForm({ onSubmit, isLoading, initialData }: DesignFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<DesignFormData>(initialData || defaultFormData);

  const totalSteps = 5;

  const updateField = <K extends keyof DesignFormData>(field: K, value: DesignFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleRoomType = (room: string) => {
    setFormData((prev) => {
      const current = prev.roomTypes;
      return {
        ...prev,
        roomTypes: current.includes(room) ? current.filter((r) => r !== room) : [...current, room],
      };
    });
  };

  const toggleGreenFeature = (feature: string) => {
    setFormData((prev) => {
      const current = prev.greenFeatures;
      return {
        ...prev,
        greenFeatures: current.includes(feature) ? current.filter((f) => f !== feature) : [...current, feature],
      };
    });
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        if (formData.designType === "Interior") {
          const hasRoom = formData.roomTypes.length > 0 || formData.customRoomType.trim() !== "";
          return formData.buildingType && formData.designType && hasRoom;
        }
        return formData.buildingType && formData.designType;
      case 2:
        return true; // Plot size, facing, floors — all optional
      case 3:
        return !!formData.architecturalStyle;
      case 4:
        return !!formData.budgetRange;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const plotSizeLabel =
    formData.plotLength && formData.plotBreadth
      ? `${formData.plotLength} × ${formData.plotBreadth} ${formData.plotUnit}`
      : "Not specified";

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-serif">Design Your Space</CardTitle>
          <Badge variant="outline" className="text-sm">
            Step {step} of {totalSteps}
          </Badge>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* ── STEP 1: Building type, design type, rooms ── */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base">
                <Building className="w-4 h-4 text-primary" />
                Building Type
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {BUILDING_TYPES.map((type) => {
                  const Icon = buildingIcons[type];
                  return (
                    <Button
                      key={type}
                      variant={formData.buildingType === type ? "default" : "outline"}
                      className="h-20 flex flex-col gap-2"
                      onClick={() => updateField("buildingType", type)}
                    >
                      <Icon className="w-6 h-6" />
                      {type}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base">Design Type</Label>
              <div className="grid grid-cols-2 gap-3">
                {DESIGN_TYPES.map((type) => (
                  <Button
                    key={type}
                    variant={formData.designType === type ? "default" : "outline"}
                    className="h-16"
                    onClick={() => updateField("designType", type)}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            {/* Number of Rooms — only for Interior */}
            {formData.designType === "Interior" && (
              <div className="space-y-3">
                <Label className="text-base">Number of Rooms: {formData.numberOfRooms}</Label>
                <Slider
                  value={[formData.numberOfRooms]}
                  onValueChange={(value) => updateField("numberOfRooms", value[0])}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
              </div>
            )}

            {formData.designType === "Interior" && (
              <div className="space-y-3">
                <Label className="text-base">Room Types (select multiple)</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {ROOM_TYPES.map((room) => (
                    <Button
                      key={room}
                      variant={formData.roomTypes.includes(room) ? "default" : "outline"}
                      className="h-12 text-sm"
                      onClick={() => toggleRoomType(room)}
                    >
                      {room}
                    </Button>
                  ))}
                </div>
                <div className="pt-2">
                  <Label className="text-sm text-muted-foreground">Other room type</Label>
                  <Input
                    placeholder="e.g., Home Theater, Wine Cellar..."
                    value={formData.customRoomType}
                    onChange={(e) => updateField("customRoomType", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Plot size + site details ── */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Plot size */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base">
                <Ruler className="w-4 h-4 text-primary" />
                Plot Size (Length × Breadth)
              </Label>
              <div className="flex gap-3 items-center">
                <Input
                  placeholder="Length"
                  type="number"
                  min={1}
                  value={formData.plotLength}
                  onChange={(e) => updateField("plotLength", e.target.value)}
                  className="flex-1"
                />
                <span className="text-muted-foreground font-medium">×</span>
                <Input
                  placeholder="Breadth"
                  type="number"
                  min={1}
                  value={formData.plotBreadth}
                  onChange={(e) => updateField("plotBreadth", e.target.value)}
                  className="flex-1"
                />
                <Select
                  value={formData.plotUnit}
                  onValueChange={(val) => updateField("plotUnit", val as DesignFormData["plotUnit"])}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLOT_UNITS.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.plotLength && formData.plotBreadth && (
                <p className="text-sm text-muted-foreground">
                  Total area: {(parseFloat(formData.plotLength) * parseFloat(formData.plotBreadth)).toFixed(1)} {formData.plotUnit}²
                </p>
              )}
            </div>

            {/* Facing direction */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base">
                <Compass className="w-4 h-4 text-primary" />
                Facing Direction
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {FACING_DIRECTIONS.map((dir) => (
                  <Button
                    key={dir}
                    variant={formData.facingDirection === dir ? "default" : "outline"}
                    className="h-10 text-sm"
                    onClick={() => updateField("facingDirection", dir)}
                  >
                    {dir}
                  </Button>
                ))}
              </div>
            </div>

            {/* Floor count */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base">
                <Layers className="w-4 h-4 text-primary" />
                Number of Floors
              </Label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {FLOOR_COUNT_OPTIONS.map((opt) => (
                  <Button
                    key={opt}
                    variant={formData.floorCount === opt ? "default" : "outline"}
                    className="h-12 text-xs"
                    onClick={() => updateField("floorCount", opt)}
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            </div>

            {/* Vaastu */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label className="text-base">Vaastu Compliant Design</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Follow traditional Vaastu Shastra principles</p>
              </div>
              <Switch
                checked={formData.vaastuCompliant}
                onCheckedChange={(val) => updateField("vaastuCompliant", val)}
              />
            </div>
          </div>
        )}

        {/* ── STEP 3: Style ── */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base">
                <Sparkles className="w-4 h-4 text-primary" />
                Architectural Style
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {ARCHITECTURAL_STYLES.map((style) => (
                  <Button
                    key={style}
                    variant={formData.architecturalStyle === style ? "default" : "outline"}
                    className="h-14"
                    onClick={() => updateField("architecturalStyle", style)}
                  >
                    {style}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: Colors, budget, lighting, green features ── */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base">
                <Palette className="w-4 h-4 text-primary" />
                Color Preferences
              </Label>
              <Input
                placeholder="e.g., Warm earth tones, Blue and white, Neutral with gold accents..."
                value={formData.colorPreferences}
                onChange={(e) => updateField("colorPreferences", e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base">
                <Sun className="w-4 h-4 text-primary" />
                Lighting Preference
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {LIGHTING_PREFERENCES.map((opt) => (
                  <Button
                    key={opt}
                    variant={formData.lightingPreference === opt ? "default" : "outline"}
                    className="h-12 text-sm"
                    onClick={() => updateField("lightingPreference", opt)}
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base">
                <DollarSign className="w-4 h-4 text-primary" />
                Budget Range
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {BUDGET_RANGES.map((budget) => (
                  <Button
                    key={budget}
                    variant={formData.budgetRange === budget ? "default" : "outline"}
                    className="h-14"
                    onClick={() => updateField("budgetRange", budget)}
                  >
                    {budget}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base">
                <Leaf className="w-4 h-4 text-primary" />
                Green / Eco Features (optional)
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {GREEN_FEATURES.map((f) => (
                  <Button
                    key={f}
                    variant={formData.greenFeatures.includes(f) ? "default" : "outline"}
                    className="h-10 text-sm"
                    onClick={() => toggleGreenFeature(f)}
                  >
                    {f}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 5: Custom requirements + summary ── */}
        {step === 5 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-3">
              <Label className="text-base">Additional Requirements (Optional)</Label>
              <Textarea
                placeholder="Describe any specific features, materials, or requirements you'd like to see..."
                value={formData.customRequirements}
                onChange={(e) => updateField("customRequirements", e.target.value)}
                rows={4}
              />
            </div>

            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <h4 className="font-semibold mb-3">Your Design Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Building:</span>
                  <span>{formData.buildingType || "—"}</span>

                  <span className="text-muted-foreground">Type:</span>
                  <span>{formData.designType || "—"}</span>

                  {formData.designType === "Interior" && (
                    <>
                      <span className="text-muted-foreground">Rooms:</span>
                      <span>
                        {[...formData.roomTypes, formData.customRoomType].filter(Boolean).join(", ") || "Not specified"}
                      </span>
                    </>
                  )}

                  {formData.designType === "Interior" && (
                    <>
                      <span className="text-muted-foreground">No. of rooms:</span>
                      <span>{formData.numberOfRooms}</span>
                    </>
                  )}

                  <span className="text-muted-foreground">Plot size:</span>
                  <span>{plotSizeLabel}</span>

                  {formData.facingDirection && (
                    <>
                      <span className="text-muted-foreground">Facing:</span>
                      <span>{formData.facingDirection}</span>
                    </>
                  )}

                  {formData.floorCount && (
                    <>
                      <span className="text-muted-foreground">Floors:</span>
                      <span>{formData.floorCount}</span>
                    </>
                  )}

                  <span className="text-muted-foreground">Vaastu:</span>
                  <span>{formData.vaastuCompliant ? "Yes" : "No"}</span>

                  <span className="text-muted-foreground">Style:</span>
                  <span>{formData.architecturalStyle || "—"}</span>

                  <span className="text-muted-foreground">Colors:</span>
                  <span>{formData.colorPreferences || "Not specified"}</span>

                  <span className="text-muted-foreground">Lighting:</span>
                  <span>{formData.lightingPreference || "Not specified"}</span>

                  <span className="text-muted-foreground">Budget:</span>
                  <span>{formData.budgetRange || "—"}</span>

                  {formData.greenFeatures.length > 0 && (
                    <>
                      <span className="text-muted-foreground">Eco features:</span>
                      <span>{formData.greenFeatures.join(", ")}</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => setStep((prev) => prev - 1)}
            disabled={step === 1}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          {step < totalSteps ? (
            <Button
              onClick={() => setStep((prev) => prev + 1)}
              disabled={!canProceed()}
              className="gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={() => onSubmit(formData)} disabled={isLoading} className="gap-2">
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Designs
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
