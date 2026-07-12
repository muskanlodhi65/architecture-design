import { Building2, Sparkles } from "lucide-react";

export function Header() {
  return (
    <header className="w-full py-6 px-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <Building2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-bold">ArchDesign AI</h1>
            <p className="text-sm text-muted-foreground">Generate stunning designs</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="hidden sm:inline">Powered by Generative AI</span>
        </div>
      </div>
    </header>
  );
}
