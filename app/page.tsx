import { Hero } from "@/components/sections/Hero";
import { ToolsShowcase } from "@/components/sections/ToolsShowcase";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { SocialProof } from "@/components/sections/SocialProof";
import { Pricing } from "@/components/sections/Pricing";
import { CtaBanner } from "@/components/sections/CtaBanner";

export default function Home() {
  return (
    <>
      <Hero />
      <ToolsShowcase />
      <HowItWorks />
      <SocialProof />
      <Pricing />
      <CtaBanner />
    </>
  );
}
