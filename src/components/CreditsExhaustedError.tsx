import { AlertCircle, RefreshCw, ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CreditsExhaustedErrorProps {
  onRetry: () => void;
  onModify: () => void;
  isLoading: boolean;
}

export function CreditsExhaustedError({ onRetry, onModify, isLoading }: CreditsExhaustedErrorProps) {
  return (
    <div className="max-w-xl mx-auto">
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">Generation Credits Exhausted</CardTitle>
          <CardDescription className="text-base">
            We couldn't generate your designs because the AI credits have been used up.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-background rounded-lg p-4 space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              What can you do?
            </h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">1.</span>
                <span>Wait a while and try again later when credits may be refreshed.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">2.</span>
                <span>Contact the app administrator to add more credits.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">3.</span>
                <span>Modify your design parameters and try a simpler configuration.</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={onModify}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Modify Design
            </Button>
            <Button
              onClick={onRetry}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
