import { useRef } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { DesignForm } from "@/components/DesignForm";
import { DesignGallery } from "@/components/DesignGallery";
import { LoadingState } from "@/components/LoadingState";
import { CreditsExhaustedError } from "@/components/CreditsExhaustedError";
import { CostEstimate } from "@/components/CostEstimate";
import { useDesignGenerator } from "@/hooks/useDesignGenerator";

const Index = () => {
  const formRef = useRef<HTMLDivElement>(null);
  const { isLoading, result, lastFormData, error, progress, generateDesigns, regenerate, reset, clearError } = useDesignGenerator();

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleModifyFromError = () => {
    clearError();
  };

  const renderContent = () => {
    // Show credits error
    if (error?.type === "credits") {
      return (
        <CreditsExhaustedError
          onRetry={regenerate}
          onModify={handleModifyFromError}
          isLoading={isLoading}
        />
      );
    }

    // While loading: show progress state, and if some images are already ready, show them below
    if (isLoading) {
      return (
        <div className="space-y-8">
          {/* Progress indicator */}
          <LoadingState
            progress={progress}
            completedImages={result?.images ?? []}
          />

          {/* Show partial results as they come in */}
          {result && result.images.length > 0 && (
            <div className="max-w-4xl mx-auto">
              <p className="text-center text-white/60 text-sm mb-4">
                ✅ {result.images.length} view{result.images.length > 1 ? "s" : ""} ready so far — more generating below...
              </p>
              <DesignGallery
                images={result.images}
                prompt={result.prompt}
                designDescription={result.designDescription}
                onRegenerate={regenerate}
                onModify={reset}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>
      );
    }

    // All done — show full gallery
    if (result) {
      return (
        <div className="max-w-4xl mx-auto">
          <DesignGallery
            images={result.images}
            prompt={result.prompt}
            designDescription={result.designDescription}
            onRegenerate={regenerate}
            onModify={reset}
            isLoading={isLoading}
          />
          {lastFormData && <CostEstimate formData={lastFormData} />}
        </div>
      );
    }

    // Default: show form
    return (
      <DesignForm
        onSubmit={generateDesigns}
        isLoading={isLoading}
        initialData={lastFormData || undefined}
      />
    );
  };

  return (
    <div className="min-h-screen relative">

      {/* ── Fixed Full-Page Video Background ── */}
      <div className="fixed inset-0 w-full h-full overflow-hidden -z-10">
        <iframe
          src="https://www.youtube.com/embed/PkL-4RQaAX8?autoplay=1&mute=1&loop=1&playlist=PkL-4RQaAX8&controls=0&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&playsinline=1&enablejsapi=1&modestbranding=1"
          allow="autoplay; fullscreen"
          allowFullScreen
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: "100vw",
            height: "56.25vw",
            minHeight: "177.78vw",
            minWidth: "100vw",
            border: "none",
          }}
          title="Background video"
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* ── Page Content ── */}
      <Header />

      <main>
        <HeroSection onGetStarted={scrollToForm} />

        <section ref={formRef} className="py-16 px-4">
          <div className="container mx-auto">
            {renderContent()}
          </div>
        </section>
      </main>

      <footer className="py-8 px-4 border-t border-white/10">
        <div className="container mx-auto text-center text-sm text-white/60">
          <p>© 2024 ArchDesign AI. Powered by Generative AI.</p>
          <p className="mt-1">Perfect for students, homeowners, and design enthusiasts.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
