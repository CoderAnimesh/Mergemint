import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { LiveDemoWidget } from "@/components/landing/live-demo-widget";
import { TerminalQuickstart } from "@/components/landing/terminal-quickstart";
import { BentoGrid } from "@/components/landing/bento-grid";
import { PricingSection } from "@/components/landing/pricing-section";
import { Footer } from "@/components/landing/footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#09090B]">
      <Navbar />
      <main>
        <HeroSection />
        <LiveDemoWidget />
        <TerminalQuickstart />
        <BentoGrid />
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
}

