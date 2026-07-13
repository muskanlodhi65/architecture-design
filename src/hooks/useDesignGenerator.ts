import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DesignFormData, GenerationResult, GeneratedImage } from "@/types/design";
import { toast } from "sonner";

export type ErrorType = "credits" | "general" | null;

export interface GenerationError {
  type: ErrorType;
  message: string;
}

// ---------- Prompt Builder ----------
// Returns a VERY specific building description to anchor consistency across all views
function buildPrompt(formData: DesignFormData): string {
  const {
    buildingType, designType, numberOfRooms, roomTypes, customRoomType,
    architecturalStyle, colorPreferences, budgetRange, customRequirements,
    plotLength, plotBreadth, plotUnit, facingDirection, floorCount,
    vaastuCompliant, greenFeatures, lightingPreference,
  } = formData;

  const budgetDescriptors: Record<string, string> = {
    low: "budget-friendly, practical materials",
    medium: "balanced quality materials, mid-range finishes",
    high: "luxury materials, premium finishes, high-end details",
  };

  const allRoomTypes = [...(roomTypes || []), customRoomType].filter(Boolean);
  const roomList =
    allRoomTypes.length > 0
      ? allRoomTypes.join(", ")
      : `${numberOfRooms} rooms including bedroom, living room, kitchen, and bathroom`;

  const plotLine =
    plotLength && plotBreadth
      ? `Plot size: ${plotLength} x ${plotBreadth} ${plotUnit || "ft"}.`
      : "";

  const floorLine = floorCount ? `${floorCount}-storey building.` : "";
  const facingLine = facingDirection ? `${facingDirection}-facing entrance.` : "";
  const vaastuLine = vaastuCompliant ? "Vaastu Shastra compliant." : "";
  const ecoLine = greenFeatures && greenFeatures.length > 0 ? `Eco features: ${greenFeatures.join(", ")}.` : "";
  const lightingLine = lightingPreference ? `Lighting style: ${lightingPreference}.` : "";
  const colorLine = colorPreferences ? `Exterior/interior color palette: ${colorPreferences}.` : "";
  const budgetLine = `Build quality: ${budgetDescriptors[budgetRange?.toLowerCase()] || budgetDescriptors.medium}.`;

  if (designType === "Interior") {
    return [
      // CORE ANCHOR — repeated in every view prompt for consistency
      `SUBJECT: A ${architecturalStyle} style ${buildingType} interior.`,
      `ROOMS: ${roomList}.`,
      plotLine, floorLine, facingLine, vaastuLine,
      colorLine, lightingLine, ecoLine, budgetLine,
      customRequirements ? `Special requirements: ${customRequirements}.` : "",
      // Style anchor
      `STYLE ANCHOR: Modern ${architecturalStyle} interior design, warm wood tones, white walls, open-plan, realistic 3D furniture and decor in every room.`,
      "Photorealistic 3D architectural visualization, 8K quality.",
    ].filter(Boolean).join(" ");
  }

  return [
    // CORE ANCHOR — repeated in every view prompt for consistency
    `SUBJECT: A ${architecturalStyle} style ${buildingType} building exterior.`,
    plotLine, floorLine, facingLine, vaastuLine,
    colorLine, lightingLine, ecoLine, budgetLine,
    customRequirements ? `Special requirements: ${customRequirements}.` : "",
    // Style anchor — very specific facade description
    `STYLE ANCHOR: ${architecturalStyle} architecture, flat/sloped roof, large windows, clean lines, ${colorPreferences || "white and grey"} exterior walls, modern landscaping, paved driveway.`,
    "Photorealistic architectural render, 8K quality, professional visualization.",
  ].filter(Boolean).join(" ");
}

// ---------- View Definitions ----------
// Each view re-states the full building description + adds only the camera angle instruction
const VIEW_ANGLES = {
  frontExterior: (anchor: string) =>
    `${anchor} CAMERA ANGLE: Straight-on FRONT ELEVATION view. Looking directly at the front facade. Main entrance door centered. Same building, same colors, same materials. Eye-level perspective. DO NOT change the building design.`,

  sideExterior: (anchor: string) =>
    `${anchor} CAMERA ANGLE: 90-DEGREE SIDE ELEVATION view. Looking at the exact side wall of the same building. Same architectural style, same colors, same roof, same windows. Side profile view only. DO NOT change the building design.`,

  topExterior: (anchor: string) =>
    `${anchor} CAMERA ANGLE: AERIAL TOP-DOWN view looking straight down from above at the roof of the same building. Same roof style, same building footprint, surrounding garden and driveway visible. Bird's-eye drone view. DO NOT change the building design.`,

  isometricExterior: (anchor: string) =>
    `${anchor} CAMERA ANGLE: 45-DEGREE ISOMETRIC VIEW showing front face, one side wall, and roof simultaneously. Three-quarter perspective of the exact same building. Same colors, same style, same materials. Classic isometric projection. DO NOT change the building design.`,

  frontInterior: (anchor: string) =>
    `${anchor} CAMERA ANGLE: 3D ISOMETRIC CUTAWAY floor plan viewed from above at 45 degrees. All room walls cut at the top to reveal all rooms simultaneously. Each room fully furnished. DO NOT change the building design.`,

  sideInterior: (anchor: string) =>
    `${anchor} CAMERA ANGLE: 3D ISOMETRIC VIEW from the SIDE showing living room and dining area in detail. Same furniture, same color palette, same interior style. Walls cut to reveal interior. DO NOT change the building design.`,

  topInterior: (anchor: string) =>
    `${anchor} CAMERA ANGLE: TOP-DOWN FLOOR PLAN VIEW looking straight down at 90 degrees. All rooms visible from directly above, furniture layout clearly shown, same rooms and same color palette. DO NOT change the building design.`,

  isometricInterior: (anchor: string) =>
    `${anchor} CAMERA ANGLE: FULL 3D ISOMETRIC BIRD'S-EYE VIEW at 45 degrees, entire apartment/building layout with all rooms open, all three walls cut away. Same furniture, same colors, same interior design. DO NOT change the building design.`,
};

// ---------- Helpers ----------
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function preloadImage(url: string, timeoutMs = 90000): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const timer = setTimeout(() => {
      img.src = "";
      resolve(false);
    }, timeoutMs);
    img.onload = () => { clearTimeout(timer); resolve(true); };
    img.onerror = () => { clearTimeout(timer); resolve(false); };
    img.src = url;
  });
}

// ALL views share the SAME seed so the AI model produces consistent results
function buildPollinationsUrl(prompt: string, sharedSeed: number, attemptOffset = 0): string {
  const seed = sharedSeed + attemptOffset;
  const encoded = encodeURIComponent(prompt);
  // All views use same 1024x1024 size to maintain consistency
  return `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&model=flux&seed=${seed}&nologo=true&enhance=true`;
}

async function generateSingleImage(
  prompt: string,
  label: string,
  sharedSeed: number,
  indexOffset: number,
  retries = 2
): Promise<GeneratedImage> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    // Same seed base for all views — only shift slightly on retry
    const url = buildPollinationsUrl(prompt, sharedSeed, attempt * 500 + indexOffset);
    console.log(`[${label}] attempt ${attempt + 1} — seed: ${sharedSeed + attempt * 500 + indexOffset}`);

    const loaded = await preloadImage(url, 90000);
    if (loaded) {
      console.log(`✅ [${label}] loaded successfully`);
      return { imageUrl: url, variationNumber: indexOffset + 1, viewLabel: label };
    }

    console.warn(`⚠️ [${label}] attempt ${attempt + 1} failed`);
    if (attempt < retries) await delay(3000);
  }

  throw new Error(`Could not generate "${label}" after ${retries + 1} attempts. Please try again.`);
}

// ---------- Hook ----------
export function useDesignGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [lastFormData, setLastFormData] = useState<DesignFormData | null>(null);
  const [error, setError] = useState<GenerationError | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number; label: string } | null>(null);

  const saveGeneration = async (formData: DesignFormData, data: GenerationResult) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("generations").insert({
        user_id: user.id,
        building_type: formData.buildingType,
        design_type: formData.designType,
        rooms: formData.numberOfRooms,
        style: formData.architecturalStyle,
        colors: formData.colorPreferences || null,
        budget: formData.budgetRange,
        requirements: formData.customRequirements || null,
        images: data.images.map((img) => img.imageUrl),
        prompt: data.prompt,
      });
    } catch (err) {
      console.error("Error saving generation:", err);
    }
  };

  const generateDesigns = async (formData: DesignFormData) => {
    setIsLoading(true);
    setLastFormData(formData);
    setError(null);
    setResult(null);

    const isInterior = formData.designType === "Interior";

    // ONE shared seed for the entire session — key to consistency!
    const sharedSeed = Math.floor(Math.random() * 500000) + 100000;
    console.log(`🌱 Shared seed for all views: ${sharedSeed}`);

    const basePrompt = buildPrompt(formData);
    console.log("Base prompt:", basePrompt);

    // Build the 4 view prompts — each re-states the full anchor description
    const views: { label: string; prompt: string }[] = isInterior
      ? [
          { label: "Front View",      prompt: VIEW_ANGLES.frontInterior(basePrompt) },
          { label: "Side View",       prompt: VIEW_ANGLES.sideInterior(basePrompt) },
          { label: "Top View",        prompt: VIEW_ANGLES.topInterior(basePrompt) },
          { label: "Isometric View",  prompt: VIEW_ANGLES.isometricInterior(basePrompt) },
        ]
      : [
          { label: "Front View",      prompt: VIEW_ANGLES.frontExterior(basePrompt) },
          { label: "Side View",       prompt: VIEW_ANGLES.sideExterior(basePrompt) },
          { label: "Top View",        prompt: VIEW_ANGLES.topExterior(basePrompt) },
          { label: "Isometric View",  prompt: VIEW_ANGLES.isometricExterior(basePrompt) },
        ];

    setProgress({ current: 0, total: views.length, label: "Starting..." });

    const images: GeneratedImage[] = [];

    try {
      for (let i = 0; i < views.length; i++) {
        const view = views[i];
        setProgress({ current: i, total: views.length, label: view.label });

        // Pass sharedSeed — same for all views, tiny offset (i*10) to avoid identical URL cache
        const image = await generateSingleImage(view.prompt, view.label, sharedSeed, i * 10);
        images.push(image);

        setResult({
          success: false,
          images: [...images],
          prompt: basePrompt,
          designDescription: `${formData.architecturalStyle} ${formData.buildingType} — ${formData.designType} Design`,
        });

        if (i < views.length - 1) await delay(2500);
      }

      const plotStr =
        formData.plotLength && formData.plotBreadth
          ? `, ${formData.plotLength}×${formData.plotBreadth} ${formData.plotUnit || "ft"}`
          : "";

      const finalResult: GenerationResult = {
        success: true,
        images,
        prompt: basePrompt,
        designDescription: `${formData.architecturalStyle} ${formData.buildingType} ${formData.designType} Design${plotStr}. Style: ${formData.architecturalStyle}. Budget: ${formData.budgetRange}.`,
      };

      setResult(finalResult);
      setProgress(null);
      await saveGeneration(formData, finalResult);
      toast.success(`All 4 views of the same design generated! 🎉`);
    } catch (err) {
      console.error("Generation error:", err);
      setProgress(null);

      if (images.length > 0) {
        setResult({
          success: false,
          images,
          prompt: basePrompt,
          designDescription: `${formData.architecturalStyle} ${formData.buildingType} — partial result`,
        });
        toast.error(`${images.length} of ${views.length} views generated. Try regenerating for remaining.`);
      } else {
        const msg = err instanceof Error ? err.message : "Failed to generate. Please try again.";
        setError({ type: "general", message: msg });
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const regenerate = async () => {
    if (lastFormData) await generateDesigns(lastFormData);
  };

  const reset = () => {
    setResult(null);
    setLastFormData(null);
    setError(null);
    setProgress(null);
  };

  const clearError = () => setError(null);

  return {
    isLoading,
    result,
    lastFormData,
    error,
    progress,
    generateDesigns,
    regenerate,
    reset,
    clearError,
  };
}
