import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  onGetStarted: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  return (
    <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
      {/* Content — video is on the full page level */}
      <div className="relative z-10 container mx-auto px-4 text-center py-16">
        <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6 max-w-4xl mx-auto leading-tight text-white drop-shadow-lg">
          Transform Your Vision Into{" "}
          <span className="text-primary drop-shadow-lg">Stunning Designs</span>
        </h1>
        <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto drop-shadow-md">
          Generate professional architectural and interior design concepts in seconds using the power of AI.
          Perfect for homeowners, students, and design enthusiasts.
        </p>
        <Button size="lg" onClick={onGetStarted} className="gap-2 text-lg px-8 py-6 shadow-xl">
          Start Designing
          <ArrowDown className="w-5 h-5" />
        </Button>
      </div>
    </section>
  );
}
