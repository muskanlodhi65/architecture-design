import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DesignRequest {
  buildingType: string;
  designType: string;
  numberOfRooms: number;
  roomTypes: string[];
  customRoomType: string;
  architecturalStyle: string;
  colorPreferences: string;
  budgetRange: string;
  customRequirements: string;
  // New fields
  plotLength?: string;
  plotBreadth?: string;
  plotUnit?: string;
  facingDirection?: string;
  floorCount?: string;
  vaastuCompliant?: boolean;
  greenFeatures?: string[];
  lightingPreference?: string;
}

function buildPrompt(req: DesignRequest): string {
  const {
    buildingType, designType, numberOfRooms, roomTypes, customRoomType,
    architecturalStyle, colorPreferences, budgetRange, customRequirements,
    plotLength, plotBreadth, plotUnit, facingDirection, floorCount,
    vaastuCompliant, greenFeatures, lightingPreference,
  } = req;

  const budgetDescriptors: Record<string, string> = {
    low: "budget-friendly, practical materials",
    medium: "balanced quality materials, mid-range finishes",
    high: "luxury materials, premium finishes, high-end details",
  };

  const allRoomTypes = [...(roomTypes || []), customRoomType].filter(Boolean);
  const roomDescription =
    allRoomTypes.length > 0
      ? `featuring ${allRoomTypes.join(", ")}`
      : `with ${numberOfRooms} rooms`;

  // Plot size line
  const plotLine =
    plotLength && plotBreadth
      ? `Plot dimensions: ${plotLength} × ${plotBreadth} ${plotUnit || "ft"} (${(
          parseFloat(plotLength) * parseFloat(plotBreadth)
        ).toFixed(1)} ${plotUnit || "ft"}² total area).`
      : "";

  // Site details
  const siteDetails = [
    facingDirection ? `${facingDirection}-facing entrance.` : "",
    floorCount ? `${floorCount} storey structure.` : "",
    vaastuCompliant ? "Vaastu Shastra compliant layout with correct room placements." : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Eco features
  const ecoLine =
    greenFeatures && greenFeatures.length > 0
      ? `Eco/green features visible: ${greenFeatures.join(", ")}.`
      : "";

  // Lighting
  const lightingLine = lightingPreference
    ? `Lighting mood: ${lightingPreference.toLowerCase()}.`
    : "";

  const prompt = `Professional architectural visualization of a ${architecturalStyle.toLowerCase()} style ${buildingType.toLowerCase()} ${designType.toLowerCase()} design.
${designType === "Interior"
  ? `The space ${roomDescription} with elegant open flow.`
  : `A stunning exterior view showcasing the building's full facade and surroundings.`}
${plotLine}
${siteDetails}
Color palette: ${colorPreferences || "neutral and elegant tones"}.
${lightingLine}
${ecoLine}
Design quality: ${budgetDescriptors[budgetRange.toLowerCase()] || budgetDescriptors.medium}.
${customRequirements ? `Additional details: ${customRequirements}.` : ""}
Photorealistic rendering, 8K quality, professional architectural photography, perfect lighting, clean lines, magazine-worthy composition.`.replace(/\n{2,}/g, "\n");

  return prompt;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const designRequest: DesignRequest = await req.json();
    console.log("Received design request:", designRequest);

    const prompt = buildPrompt(designRequest);
    console.log("Generated prompt:", prompt);

    // View definitions: 3 standard variations + 1 isometric view
    const viewDefinitions = [
      {
        label: "Front View",
        suffix: "",
      },
      {
        label: "Alternative View",
        suffix: " Variation 2: alternative angle and different lighting conditions, slightly different perspective.",
      },
      {
        label: "Detail View",
        suffix: " Variation 3: close-up detail perspective highlighting unique architectural features and materials.",
      },
      {
        label: "Isometric View",
        suffix: ` Isometric architectural illustration: a clean 45-degree isometric projection of the entire ${designRequest.buildingType.toLowerCase()} showing all sides simultaneously — roof, facade, and side walls visible at once. Flat isometric render style, precise geometric lines, architectural drawing quality, no perspective distortion, bird's-eye isometric angle, detailed 3D cutaway view, technical illustration aesthetic.`,
      },
    ];

    // Generate all 4 images in parallel using DALL-E 3
    const imagePromises = viewDefinitions.map(async ({ label, suffix }, index) => {
      const variationPrompt = `${prompt}${suffix}`;

      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: variationPrompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
          response_format: "url",
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: { message: response.statusText } }));
        const errorMessage = errorBody?.error?.message || response.statusText;
        console.error(`Image generation ${index + 1} (${label}) failed:`, response.status, errorMessage);

        if (response.status === 429) throw new Error("Rate limit exceeded. Please try again later.");
        if (response.status === 402) throw new Error("Payment required. Please add funds to your OpenAI account.");
        if (response.status === 401) throw new Error("Invalid OpenAI API key. Please check your OPENAI_API_KEY secret.");
        throw new Error(`Failed to generate image: ${errorMessage}`);
      }

      const data = await response.json();
      const imageUrl = data.data?.[0]?.url;
      if (!imageUrl) throw new Error("No image URL in response from OpenAI");
      return { imageUrl, variationNumber: index + 1, viewLabel: label };
    });

    const images = await Promise.all(imagePromises);

    const plotStr =
      designRequest.plotLength && designRequest.plotBreadth
        ? `, ${designRequest.plotLength}×${designRequest.plotBreadth} ${designRequest.plotUnit || "ft"}`
        : "";

    return new Response(
      JSON.stringify({
        success: true,
        images,
        prompt,
        designDescription: `${designRequest.architecturalStyle} ${designRequest.buildingType} ${designRequest.designType} Design${plotStr}. Style: ${designRequest.architecturalStyle}. Budget: ${designRequest.budgetRange}.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-design function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
