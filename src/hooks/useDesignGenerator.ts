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
      ? `Total floor area: ${plotLength} x ${plotBreadth} ${plotUnit || "ft"}.`
      : "";

  const siteDetails = [
    facingDirection ? `${facingDirection}-facing entrance.` : "",
    floorCount ? `${floorCount} storey structure.` : "",
    vaastuCompliant ? "Vaastu Shastra compliant layout." : "",
  ]
    .filter(Boolean)
    .join(" ");

  const ecoLine =
    greenFeatures && greenFeatures.length > 0
      ? `Eco features: ${greenFeatures.join(", ")}.`
      : "";

  const lightingLine = lightingPreference ? `Lighting: ${lightingPreference}.` : "";

  if (designType === "Interior") {
    return [
      `3D isometric cutaway floor plan of a ${architecturalStyle} style ${buildingType}.`,
      `Bird's-eye 45-degree isometric view with walls cut away at the top to reveal all interior rooms simultaneously: ${roomList}.`,
      `Each room fully furnished with realistic 3D furniture, appliances, and decor visible from above.`,
      `Hardwood or tiled flooring, white and grey walls, open-plan layout, realistic shadows and materials.`,
      plotLine,
      siteDetails,
      `Color palette: ${colorPreferences || "warm wood tones, white walls, neutral tones"}.`,
      lightingLine,
      ecoLine,
      `Design quality: ${budgetDescriptors[budgetRange.toLowerCase()] || budgetDescriptors.medium}.`,
      customRequirements ? `Additional details: ${customRequirements}.` : "",
      "Photorealistic 3D rendering, high detail, clean lines, professional architectural visualization, no perspective distortion, isometric projection style, 8K quality.",
    ]
      .filter(Boolean)
      .join(" ");
  }

  return [
    `Professional architectural visualization of a ${architecturalStyle} style ${buildingType} exterior design.`,
    `Stunning exterior view showcasing the building full facade and surroundings.`,
    plotLine,
    siteDetails,
    `Color palette: ${colorPreferences || "neutral and elegant tones"}.`,
    lightingLine,
    ecoLine,
    `Design quality: ${budgetDescriptors[budgetRange.toLowerCase()] || budgetDescriptors.medium}.`,
    customRequirements ? `Additional details: ${customRequirements}.` : "",
    "Photorealistic rendering, 8K quality, professional architectural photography, perfect lighting, clean lines, magazine-worthy composition.",
  ]
    .filter(Boolean)
    .join(" ");
}

// ---------- View Definitions ----------
interface ViewDefinition {
  label: string;
  getSuffix: (buildingType: string, designType: string) => string;
}

const VIEW_DEFINITIONS: ViewDefinition[] = [
  {
    label: "Front View",
    getSuffix: (_b, designType) =>
      designType === "Interior"
        ? " FRONT VIEW: Complete 3D isometric cutaway floor plan showing all rooms from above, walls cut at top, fully furnished with realistic furniture and decor. High-detail architectural visualization."
        : " FRONT ELEVATION: Straight-on front facade, main entrance visible, symmetrical composition, same architectural style and colors as specified. Professional architectural photography.",
  },
  {
    label: "Side View",
    getSuffix: (_b, designType) =>
      designType === "Interior"
        ? " SIDE VIEW: 3D isometric cutaway from a 90-degree side angle showing living room and dining area in detail. Furniture, appliances, floor materials all clearly visible. Warm interior lighting."
        : " SIDE ELEVATION: 90-degree side profile of the building, full side wall visible, side windows and doors detailed, same architectural style, materials, and color scheme.",
  },
  {
    label: "Top View",
    getSuffix: (_b, designType) =>
      designType === "Interior"
        ? " TOP-DOWN VIEW: Perfect aerial top-down view from 90 degrees above, showing all furniture layout, room arrangement, walls and floor tiles from directly above. Clean architectural visualization."
        : " AERIAL TOP-DOWN: Perfect bird's-eye 90-degree top-down view of the building roof and property. Rooftop, garden, driveway, landscaping visible from directly above. Drone photography perspective.",
  },
  {
    label: "Isometric View",
    getSuffix: (buildingType, designType) =>
      designType === "Interior"
        ? " ISOMETRIC 3D VIEW: Full 3D isometric bird's-eye cutaway at 45-degree angle, all rooms open and furnished simultaneously, three walls cut away. Precise isometric projection."
        : ` ISOMETRIC 3D VIEW: Classic 45-degree isometric three-quarter view of the ${buildingType}, front, side wall, and roof all visible simultaneously. Same architectural style and color palette. Professional 3D render.`,
  },
];

// ---------- Helpers ----------
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Verify an image URL actually loads using HTMLImageElement (no CORS issue).
 * Resolves true if image loaded, false if it errored.
 */
function preloadImage(url: string, timeoutMs = 60000): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const timer = setTimeout(() => {
      img.src = ""; // cancel
      resolve(false);
    }, timeoutMs);

    img.onload = () => {
      clearTimeout(timer);
      resolve(true);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(false);
    };

    img.src = url;
  });
}

/**
 * Build the Pollinations.ai URL for a given prompt.
 * Each view uses a unique seed and slightly different dimensions.
 */
function buildPollinationsUrl(prompt: string, index: number): string {
  const seed = (Date.now() % 900000) + index * 111111;
  const dims = [
    { w: 1024, h: 1024 },
    { w: 1152, h: 896 },
    { w: 896, h: 1152 },
    { w: 1024, h: 768 },
  ];
  const { w, h } = dims[index % dims.length];
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=${w}&height=${h}&model=flux&seed=${seed}&nologo=true&enhance=true`;
}

/**
 * Generate a single image with retries.
 * Uses Image.onload to verify (no fetch/CORS issues).
 */
async function generateSingleImage(
  prompt: string,
  label: string,
  index: number,
  retries = 2
): Promise<GeneratedImage> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const url = buildPollinationsUrl(prompt, index + attempt * 7); // shift seed on retry
    console.log(`[${label}] attempt ${attempt + 1} — URL: ${url}`);

    const loaded = await preloadImage(url, 90000); // 90s timeout per image

    if (loaded) {
      console.log(`✅ [${label}] loaded successfully`);
      return { imageUrl: url, variationNumber: index + 1, viewLabel: label };
    }

    console.warn(`⚠️ [${label}] attempt ${attempt + 1} failed to load`);

    if (attempt < retries) {
      await delay(4000); // wait before retrying
    }
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
    setProgress({ current: 0, total: VIEW_DEFINITIONS.length, label: "Starting..." });

    const basePrompt = buildPrompt(formData);
    console.log("Base prompt:", basePrompt);

    const images: GeneratedImage[] = [];

    try {
      for (let i = 0; i < VIEW_DEFINITIONS.length; i++) {
        const view = VIEW_DEFINITIONS[i];
        setProgress({ current: i, total: VIEW_DEFINITIONS.length, label: view.label });

        const fullPrompt = basePrompt + view.getSuffix(formData.buildingType, formData.designType);
        const image = await generateSingleImage(fullPrompt, view.label, i);
        images.push(image);

        // Show partial results as they arrive
        setResult({
          success: false,
          images: [...images],
          prompt: basePrompt,
          designDescription: `${formData.architecturalStyle} ${formData.buildingType} — ${formData.designType} Design`,
        });

        // Delay between requests to avoid Pollinations.ai caching the same result
        if (i < VIEW_DEFINITIONS.length - 1) {
          await delay(3000);
        }
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
      toast.success(`All ${VIEW_DEFINITIONS.length} views generated! 🎉`);
    } catch (err) {
      console.error("Generation error:", err);
      setProgress(null);

      // If some images already loaded, keep them visible
      if (images.length > 0) {
        setResult({
          success: false,
          images,
          prompt: basePrompt,
          designDescription: `${formData.architecturalStyle} ${formData.buildingType} — partial result`,
        });
        toast.error(`Only ${images.length} of ${VIEW_DEFINITIONS.length} views could be generated. You can try regenerating.`);
      } else {
        const msg = err instanceof Error ? err.message : "Failed to generate designs. Please try again.";
        setError({ type: "general", message: msg });
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const regenerate = async () => {
    if (lastFormData) {
      await generateDesigns(lastFormData);
    }
  };

  const reset = () => {
    setResult(null);
    setLastFormData(null);
    setError(null);
    setProgress(null);
  };

  const clearError = () => {
    setError(null);
  };

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
