import { DesignFormData } from "@/types/design";
import { Card, CardContent } from "@/components/ui/card";
import { IndianRupee, Home, Zap, Layers, Leaf, Info } from "lucide-react";

interface CostEstimateProps {
  formData: DesignFormData;
}

// ── Cost Engine ──────────────────────────────────────────────
function calcCost(f: DesignFormData) {
  // Base cost per sq ft (INR) by budget
  const baseRates: Record<string, { low: number; high: number }> = {
    low:    { low: 1000, high: 1500 },
    medium: { low: 1500, high: 2500 },
    high:   { low: 2500, high: 5000 },
  };
  const budget = f.budgetRange.toLowerCase();
  const rate = baseRates[budget] ?? baseRates.medium;

  // Area (sq ft)
  let area = 0;
  if (f.plotLength && f.plotBreadth) {
    let l = parseFloat(f.plotLength);
    let b = parseFloat(f.plotBreadth);
    if (f.plotUnit === "m")     { l *= 10.764; b *= 10.764; }
    if (f.plotUnit === "yards") { l *= 9;      b *= 9;      }
    area = l * b;
  } else {
    // Estimate area from room count if plot not given
    area = (f.numberOfRooms || 2) * 200;
  }

  // Floor multiplier
  const floorMultipliers: Record<string, number> = {
    "Ground floor only": 1,
    "G+1": 1.8,
    "G+2": 2.5,
    "G+3": 3.2,
    "G+4 or more": 4.0,
  };
  const floors = floorMultipliers[f.floorCount] ?? 1;

  // Building type multiplier
  const typeMultipliers: Record<string, number> = {
    villa: 1.35, apartment: 1.0, office: 1.1, house: 1.0,
  };
  const typeMul = typeMultipliers[f.buildingType?.toLowerCase()] ?? 1;

  // Style multiplier
  const styleMuls: Record<string, number> = {
    luxury: 1.4, "art deco": 1.3, mediterranean: 1.2, biophilic: 1.2,
    industrial: 1.15, japandi: 1.1, modern: 1.1, bohemian: 1.0,
    minimalist: 1.0, traditional: 0.95,
  };
  const styleMul = styleMuls[f.architecturalStyle?.toLowerCase()] ?? 1.0;

  // Vaastu: small design/engineer cost
  const vaastuAdd = f.vaastuCompliant ? 25000 : 0;

  // Green features cost
  const greenCosts: Record<string, number> = {
    "Solar panels": 180000,
    "Rainwater harvesting": 60000,
    "Green roof": 120000,
    "Natural ventilation": 35000,
    "EV charging": 50000,
    "Composting area": 20000,
  };
  const greenTotal = (f.greenFeatures || []).reduce(
    (sum, g) => sum + (greenCosts[g] ?? 40000), 0
  );

  const totalArea = area * floors;

  const lowTotal  = Math.round(totalArea * rate.low  * typeMul * styleMul + greenTotal + vaastuAdd);
  const highTotal = Math.round(totalArea * rate.high * typeMul * styleMul + greenTotal + vaastuAdd);

  // Cost breakdown percentages (industry standard India)
  const breakdownPct = [
    { label: "Civil & Structure",       icon: "🏗️", pct: 0.45 },
    { label: "Interior Finishing",      icon: "🪟", pct: 0.25 },
    { label: "Electrical & Plumbing",   icon: "⚡", pct: 0.15 },
    { label: "Miscellaneous & Labour",  icon: "🔧", pct: 0.10 },
    { label: "Green / Eco Features",    icon: "🌿", pct: greenTotal > 0 ? greenTotal / highTotal : 0.05 },
  ];

  return {
    lowTotal,
    highTotal,
    totalArea: Math.round(totalArea),
    ratePerSqFt: rate,
    floors,
    breakdownPct,
    greenTotal,
  };
}

function fmt(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

// ── Component ─────────────────────────────────────────────────
export function CostEstimate({ formData }: CostEstimateProps) {
  const c = calcCost(formData);

  return (
    <Card className="mt-6 border border-primary/20 bg-background/80 backdrop-blur-sm shadow-lg">
      <CardContent className="pt-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 bg-primary/10 rounded-lg">
            <IndianRupee className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">Estimated Construction Cost</h3>
            <p className="text-xs text-muted-foreground">Based on your design inputs · Indian market rates 2024</p>
          </div>
        </div>

        {/* Main Cost Range */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-5 text-center">
          <p className="text-sm text-muted-foreground mb-1">Total Estimated Budget Range</p>
          <p className="text-3xl font-bold text-primary">
            {fmt(c.lowTotal)} – {fmt(c.highTotal)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {c.totalArea.toLocaleString("en-IN")} sq ft built-up area ·{" "}
            ₹{c.ratePerSqFt.low.toLocaleString()}–{c.ratePerSqFt.high.toLocaleString()}/sq ft
          </p>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { icon: <Home className="w-4 h-4" />,   label: "Building Type",  val: formData.buildingType },
            { icon: <Layers className="w-4 h-4" />, label: "Floors",         val: formData.floorCount || "Ground only" },
            { icon: <Zap className="w-4 h-4" />,    label: "Budget Grade",   val: formData.budgetRange },
            { icon: <Leaf className="w-4 h-4" />,   label: "Green Features", val: (formData.greenFeatures?.length || 0) + " added" },
          ].map((s) => (
            <div key={s.label} className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="flex justify-center mb-1 text-primary">{s.icon}</div>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
              <p className="text-sm font-semibold truncate">{s.val}</p>
            </div>
          ))}
        </div>

        {/* Cost Breakdown */}
        <div className="space-y-2 mb-4">
          <p className="text-sm font-semibold mb-2">Cost Breakdown</p>
          {c.breakdownPct.map((b) => {
            const itemLow  = Math.round(c.lowTotal  * b.pct);
            const itemHigh = Math.round(c.highTotal * b.pct);
            const pct      = Math.round(b.pct * 100);
            return (
              <div key={b.label} className="flex items-center gap-3">
                <span className="text-base w-6 text-center">{b.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-muted-foreground">{b.label}</span>
                    <span className="font-medium">{fmt(itemLow)} – {fmt(itemHigh)}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/70 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <div className="flex gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
            Estimates are approximate and based on average Indian construction rates. Actual costs may vary by 
            city, contractor, material market prices, and site conditions. Always consult a local architect or contractor for exact quotes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
