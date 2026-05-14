import { HeroSection } from "@/components/hero-section"
import { CategoriesSection } from "@/components/categories-section"
import { BeautyConciergeSection } from "@/components/beauty-concierge-section"
import { FeaturedArtists } from "@/components/featured-artists"
import { HowItWorks } from "@/components/how-it-works"
import { TestimonialsSection } from "@/components/testimonials-section"
import { AiConcierge } from "@/components/ai-concierge"

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CategoriesSection />
      <BeautyConciergeSection />
      <FeaturedArtists />
      <HowItWorks />
      <TestimonialsSection />
      <AiConcierge />
    </>
  )
}
