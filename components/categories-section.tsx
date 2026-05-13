"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useTranslation } from "@/lib/i18n/language-context"

const categories = [
  {
    key: "bridal",
    description: "Timeless bridal beauty for your most cherished day, from natural radiance to full glam.",
    descriptionMs: "Kecantikan pengantin yang abadi untuk hari yang paling berharga, dari pancaran semula jadi hingga glam penuh.",
    count: 180,
  },
  {
    key: "event",
    description: "Statement-ready glam for dinners, launches, galas, and celebrations that need impact.",
    descriptionMs: "Glam yang sedia untuk kenyataan untuk makan malam, pelancaran, gala, dan sambutan yang memerlukan impak.",
    count: 240,
  },
  {
    key: "photoshoot",
    description: "Camera-ready artistry for campaigns, fashion editorials, and creative productions.",
    descriptionMs: "Kesenian yang sedia untuk kamera untuk kempen, editorial fesyen, dan produksi kreatif.",
    count: 160,
  },
  {
    key: "sfx",
    description: "Transformational special effects artistry for film, cosplay, theatre, and concept shoots.",
    descriptionMs: "Kesenian kesan khas transformasi untuk filem, cosplay, teater, dan penggambaran konsep.",
    count: 90,
  },
  {
    key: "lessons",
    description: "Learn makeup techniques from professional artists in personalized one-on-one sessions.",
    descriptionMs: "Pelajari teknik solek daripada artis profesional dalam sesi peribadi satu-satu.",
    count: 45,
  },
  {
    key: "hari-raya",
    description: "Traditional Hari Raya makeup with elegant, modest looks perfect for festive celebrations.",
    descriptionMs: "Solek Hari Raya tradisional dengan penampilan yang elegan dan sederhana yang sempurna untuk sambutan perayaan.",
    count: 85,
  },
  {
    key: "chinese-new-year",
    description: "Auspicous Chinese New Year makeup featuring red accents and traditional festive styles.",
    descriptionMs: "Solek Tahun Baru Cina yang membawa tuah dengan aksen merah dan gaya perayaan tradisional.",
    count: 75,
  },
  {
    key: "traditional-malay",
    description: "Authentic Malay bridal makeup with traditional henna designs and cultural elements.",
    descriptionMs: "Solek pengantin Melayu yang autentik dengan corak henna tradisional dan elemen budaya.",
    count: 65,
  },
  {
    key: "hijab",
    description: "Beautiful hijab-friendly makeup that complements modest fashion and cultural preferences.",
    descriptionMs: "Solek yang cantik dan sesuai untuk hijab yang melengkapi fesyen sederhana dan pilihan budaya.",
    count: 95,
  },
]

export function CategoriesSection() {
  const { t, lang } = useTranslation()

  return (
    <section className="bg-background py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.2em] sm:tracking-[0.3em] text-accent">
              Specialties
            </p>
            <h2 className="mt-2 sm:mt-3 font-serif text-2xl sm:text-3xl font-medium tracking-tight text-foreground md:text-4xl">
              {t.categories.title}
            </h2>
          </div>
          <Link
            href="/artists"
            className="group flex items-center gap-2 text-xs sm:text-sm font-medium uppercase tracking-widest text-foreground transition-colors hover:text-accent"
          >
            {t.common.viewAll}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-8 sm:mt-12 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.key}
              href={`/artists?category=${cat.key}`}
              className="group border border-border bg-card p-6 sm:p-8 transition-all hover:border-accent hover:shadow-sm lg:p-10"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-serif text-xl sm:text-2xl font-medium text-foreground">
                  {t.categories[cat.key as keyof typeof t.categories]}
                </h3>
                <ArrowRight className="h-5 w-5 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-accent" />
              </div>
              <p className="mt-3 sm:mt-4 text-sm leading-relaxed text-muted-foreground">
                {lang === "ms" ? cat.descriptionMs : cat.description}
              </p>
              <p className="mt-4 sm:mt-6 text-xs uppercase tracking-widest text-accent">
                {cat.count} {t.nav.browseArtists.split(" ").pop()}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
