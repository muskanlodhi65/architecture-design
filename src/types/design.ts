export interface DesignFormData {
  buildingType: string;
  designType: string;
  numberOfRooms: number;
  roomTypes: string[];
  customRoomType: string;
  architecturalStyle: string;
  colorPreferences: string;
  budgetRange: string;
  customRequirements: string;
  // Plot size
  plotLength: string;
  plotBreadth: string;
  plotUnit: "ft" | "m" | "yards";
  // New expanded preferences
  facingDirection: string;
  floorCount: string;
  vaastuCompliant: boolean;
  greenFeatures: string[];
  lightingPreference: string;
}

export interface GeneratedImage {
  imageUrl: string;
  variationNumber: number;
  viewLabel?: string;
}

export interface GenerationResult {
  success: boolean;
  images: GeneratedImage[];
  prompt: string;
  designDescription: string;
}

export const BUILDING_TYPES = ["House", "Apartment", "Office", "Villa"] as const;
export const DESIGN_TYPES = ["Interior", "Exterior"] as const;
export const ARCHITECTURAL_STYLES = [
  "Modern",
  "Minimalist",
  "Traditional",
  "Luxury",
  "Industrial",
  "Biophilic",
  "Japandi",
  "Bohemian",
  "Mediterranean",
  "Art Deco",
] as const;
export const BUDGET_RANGES = ["Low", "Medium", "High"] as const;
export const ROOM_TYPES = [
  "Living Room",
  "Bedroom",
  "Kitchen",
  "Bathroom",
  "Dining Room",
  "Home Office",
  "Kids Room",
  "Master Suite",
  "Pooja Room",
  "Study Room",
  "Guest Room",
  "Balcony",
] as const;
export const PLOT_UNITS = ["ft", "m", "yards"] as const;
export const FACING_DIRECTIONS = ["North", "South", "East", "West", "North-East", "North-West", "South-East", "South-West"] as const;
export const FLOOR_COUNT_OPTIONS = ["Ground floor only", "G+1", "G+2", "G+3", "G+4 or more"] as const;
export const GREEN_FEATURES = [
  "Solar panels",
  "Rainwater harvesting",
  "Green roof",
  "Natural ventilation",
  "EV charging",
  "Composting area",
] as const;
export const LIGHTING_PREFERENCES = ["Warm & cozy", "Bright & airy", "Natural daylight", "Dramatic / accent"] as const;
