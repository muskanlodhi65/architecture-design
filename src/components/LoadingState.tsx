import { Sparkles, CheckCircle2, Loader2, Image } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface LoadingStateProps {
  progress?: { current: number; total: number; label: string } | null;
  completedImages?: { viewLabel: string }[];
}

const VIEW_LABELS = ["Front View", "Side View", "Top View", "Isometric View"];

export function LoadingState({ progress, completedImages = [] }: LoadingStateProps) {
  const completedLabels = completedImages.map((img) => img.viewLabel);
  const currentLabel = progress?.label ?? "Starting...";
  const currentIndex = progress?.current ?? 0;
  const total = progress?.total ?? 4;
  const percentage = Math.round((completedLabels.length / total) * 100);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="py-12 px-8 text-center">
        {/* Spinner */}
        <div className="relative mx-auto w-20 h-20 mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-muted animate-pulse" />
          <div className="absolute inset-2 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <Sparkles className="absolute inset-0 m-auto w-7 h-7 text-primary" />
        </div>

        <h3 className="text-xl font-semibold mb-1">Generating Your Designs</h3>
        <p className="text-muted-foreground text-sm mb-6">
          Currently generating: <span className="font-semibold text-primary">{currentLabel}</span>
        </p>

        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2 mb-6 overflow-hidden">
          <div
            className="h-2 rounded-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Per-view status list */}
        <div className="space-y-2 text-left max-w-xs mx-auto">
          {VIEW_LABELS.map((label, i) => {
            const isDone = completedLabels.includes(label);
            const isActive = !isDone && label === currentLabel;
            return (
              <div key={label} className="flex items-center gap-3 py-1">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                ) : isActive ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
                ) : (
                  <Image className="w-5 h-5 text-muted-foreground/40 shrink-0" />
                )}
                <span
                  className={`text-sm font-medium ${
                    isDone
                      ? "text-green-600"
                      : isActive
                      ? "text-primary"
                      : "text-muted-foreground/50"
                  }`}
                >
                  {label}
                </span>
                {isDone && (
                  <span className="ml-auto text-xs text-green-500 font-semibold">Done</span>
                )}
                {isActive && (
                  <span className="ml-auto text-xs text-primary font-semibold animate-pulse">Generating...</span>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-muted-foreground text-xs mt-6">
          {completedLabels.length} of {total} views ready · Please wait, this may take ~30–60s per view
        </p>
      </CardContent>
    </Card>
  );
}
