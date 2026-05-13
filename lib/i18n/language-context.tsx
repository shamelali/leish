"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
// Translation datasets imported for future use
// import { malayDatasetExtended, beautySpecificTranslations } from "./malay-dataset-extended"

export type Language = "en" | "ms"

interface LanguageContextType {
  lang: Language
  setLang: (lang: Language) => void
  isEnglish: boolean
}

const STORAGE_KEY = "leish:lang"

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "en"
  const raw = window.localStorage.getItem(STORAGE_KEY)
  return raw === "ms" ? "ms" : "en"
}

function setDocumentLanguage(lang: Language) {
  if (typeof document === "undefined") return
  document.documentElement.lang = lang === "ms" ? "ms-MY" : "en"
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => getInitialLanguage())

  useEffect(() => {
    setDocumentLanguage(lang)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setLang = (newLang: Language) => {
    setLangState(newLang)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, newLang)
      setDocumentLanguage(newLang)
      window.dispatchEvent(new CustomEvent("leish:lang-changed", { detail: newLang }))
    }
  }

  const value: LanguageContextType = {
    lang,
    setLang,
    isEnglish: lang === "en",
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  // Return default values during SSR if context is not available
  if (context === undefined) {
    return {
      lang: "en" as Language,
      setLang: () => {},
      isEnglish: true,
    }
  }
  return context
}

export function useTranslation() {
  const { lang, isEnglish } = useLanguage()
  return { lang, isEnglish, t: translations[lang] }
}

// Comprehensive translations object
const translations = {
  en: {
    // Navigation
    nav: {
      home: "Home",
      browseArtists: "Browse Artists",
      browseStudios: "Browse Studios",
      signIn: "Sign In",
      signOut: "Sign Out",
      dashboard: "Dashboard",
      profile: "Profile",
      bookings: "Bookings",
      payments: "Payments",
      reviews: "Reviews",
      availability: "Availability",
      charges: "Charges & Fees",
      admin: "Admin",
      pro: "Pro",
    },
    // Hero Section
    hero: {
      title: "Book Beauty. Anywhere.",
      subtitle: "Discover makeup artists and studios, view real-time availability, and secure your booking in minutes.",
      ctaBrowse: "Browse Artists",
      ctaStudios: "Browse Studios",
      ctaJoin: "Join as MUA",
      luxuryMarketplace: "Luxury Beauty Marketplace",
    },
    // Auth
    auth: {
      signInTitle: "Sign In",
      signInSubtitle: "Access your account to manage bookings and availability.",
      registerTitle: "Register",
      registerSubtitle: "Create an account to book artists or offer your services.",
      email: "Email",
      password: "Password",
      fullName: "Full Name",
      phone: "Phone Number",
      role: "I am a...",
      roleCustomer: "Customer",
      roleArtist: "Makeup Artist",
      roleStudio: "Studio Owner",
      continueWithGoogle: "Continue with Google",
      secureSignIn: "Secure sign-in for clients and beauty professionals",
      forgotPassword: "Forgot password?",
      noAccount: "Don't have an account?",
      hasAccount: "Already have an account?",
      signUp: "Sign Up",
      signInButton: "Sign In",
      passwordMinLength: "Password must be at least 6 characters",
      invalidEmail: "Please enter a valid email address",
      nameRequired: "Please enter your full name",
      nameMinLength: "Name must be at least 2 characters",
      signingIn: "Signing in...",
      creatingAccount: "Creating account...",
      success: "Success! Redirecting...",
    },
    // Booking
    booking: {
      title: "Book Your Appointment",
      step1: "Select Service",
      step2: "Choose Date",
      step3: "Your Details",
      step4: "Payment",
      selectService: "Select a service",
      selectDate: "Select a date",
      selectTime: "Select a time",
      noSlotsAvailable: "No slots available for this date",
      nextAvailable: "Find next available",
      searching: "Searching...",
      yourName: "Your Name",
      yourEmail: "Your Email",
      yourPhone: "Your Phone",
      notes: "Special Requests (optional)",
      paymentOption: "Payment Option",
      payFull: "Pay Full Amount",
      payDeposit: "Pay 30% Deposit",
      payBnpl: "Pay in 4 Installments",
      total: "Total",
      deposit: "Deposit",
      balance: "Balance due on appointment day",
      confirmBooking: "Confirm Booking",
      processing: "Processing...",
      signInRequired: "Please sign in to complete your booking",
      mustBe24Hours: "Bookings must be made at least 24 hours in advance",
      slotAlreadyBooked: "This slot has just been booked by someone else",
      bookingConfirmed: "Booking Confirmed",
      bookingPending: "Booking Pending",
      bookingCancelled: "Booking Cancelled",
    },
    // Dashboard
    dashboard: {
      title: "Pro Dashboard",
      subtitle: "Operational workspace for artists and studios to manage services, bookings, reviews, and payouts.",
      overview: "Overview",
      upcomingBookings: "Upcoming Bookings",
      recentReviews: "Recent Reviews",
      providerSnapshot: "Provider Snapshot",
      stats: {
        totalBookings: "Total Bookings",
        pendingConfirmations: "Pending Confirmations",
        thisMonthRevenue: "This Month Revenue",
        averageRating: "Average Rating",
      },
      confirm: "Confirm",
      cancel: "Cancel",
      completed: "Completed",
      pending: "Pending",
      confirmed: "Confirmed",
      paidDeposit: "Paid (Deposit)",
      paidFull: "Paid (Full)",
      noBookings: "No bookings yet",
      noReviews: "No reviews yet",
    },
    // Charges & Fees
    charges: {
      title: "Charges & Fees",
      subtitle: "Configure additional charges, travel fees, and surcharges for your services.",
      travelFeeConfig: "Travel Fee Configuration",
      freeTravelRadius: "Free Travel Radius",
      travelFeePerKm: "Travel Fee per km",
      maxDistance: "Maximum Distance",
      outstationFee: "Outstation Flat Fee",
      activeSurcharges: "Active Surcharges",
      addSurcharge: "Add Surcharge",
      presetSurcharges: "Quick Add Presets",
      earlyMorning: "Early Morning Surcharge",
      lateNight: "Late Night Surcharge",
      weekend: "Weekend Surcharge",
      publicHoliday: "Public Holiday Surcharge",
      lastMinute: "Last-Minute Booking",
      additionalPerson: "Additional Person",
      touchUp: "Touch-Up Service",
      changeOfLook: "Change of Look",
      perPerson: "per person",
      fixed: "Fixed",
      percentage: "Percentage",
      save: "Save Configuration",
      noSurcharges: "No surcharges configured yet",
    },
    // Categories
    categories: {
      title: "Browse by Category",
      bridal: "Bridal Makeup",
      event: "Event Makeup",
      photoshoot: "Photoshoot Makeup",
      editorial: "Editorial Makeup",
      sfx: "SFX Makeup",
      lessons: "Makeup Lessons",
      "hari-raya": "Hari Raya Makeup",
      "chinese-new-year": "Chinese New Year Makeup",
      "traditional-malay": "Traditional Malay Makeup",
      hijab: "Hijab-Friendly Makeup",
    },
    // How it Works
    howItWorks: {
      title: "How It Works",
      step1: {
        title: "Discover",
        description: "Browse portfolios and find your perfect artist",
      },
      step2: {
        title: "Book",
        description: "Select your service and preferred time slot",
      },
      step3: {
        title: "Confirm",
        description: "Secure your booking with flexible payment options",
      },
    },
    // Testimonials
    testimonials: {
      title: "What Our Clients Say",
      subtitle: "Real experiences from real customers",
    },
    // Footer
    footer: {
      tagline: "Your beauty, perfected. Connecting you with Malaysia's most talented freelance makeup artists.",
      explore: "Explore",
      company: "Company",
      stayInTouch: "Stay in Touch",
      newsletterPlaceholder: "Your email",
      join: "Join",
      newsletterText: "Receive beauty tips and exclusive artist features.",
      copyright: "All rights reserved.",
      aboutUs: "About Us",
      careers: "Careers",
      press: "Press",
      contact: "Contact",
      browseArtists: "Browse Artists",
      bridalMakeup: "Bridal Makeup",
      photoshootMakeup: "Photoshoot Makeup",
      sfxLooks: "SFX Looks",
      privacyPolicy: "Privacy Policy",
      termsOfService: "Terms of Service",
    },
    // Common
    common: {
      loading: "Loading...",
      save: "Save",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete",
      create: "Create",
      update: "Update",
      search: "Search",
      filter: "Filter",
      sort: "Sort",
      showMore: "Show More",
      showLess: "Show Less",
      readMore: "Read More",
      viewAll: "View All",
      back: "Back",
      next: "Next",
      previous: "Previous",
      submit: "Submit",
      close: "Close",
      open: "Open",
      yes: "Yes",
      no: "No",
      or: "or",
      and: "and",
      at: "at",
      on: "on",
      in: "in",
      by: "by",
      for: "for",
      with: "with",
      from: "from",
      to: "to",
      of: "of",
      km: "km",
      myr: "MYR",
      hour: "hour",
      hours: "hours",
      minute: "minute",
      minutes: "minutes",
    },
    // Errors
    errors: {
      generic: "Something went wrong. Please try again.",
      notFound: "Page not found",
      unauthorized: "Unauthorized access",
      forbidden: "Access forbidden",
      serverError: "Server error. Please try again later.",
      networkError: "Network error. Please check your connection.",
    },
    // Chat
    chat: {
      title: "Messages",
      placeholder: "Type a message...",
      send: "Send",
      noMessages: "No messages yet",
      typeMessage: "Type your message",
    },
  },
  ms: {
    // Navigation
    nav: {
      home: "Laman Utama",
      browseArtists: "Semak Senarai Artis",
      browseStudios: "Semak Senarai Studio",
      signIn: "Log Masuk",
      signOut: "Log Keluar",
      dashboard: "Papan Pemuka",
      profile: "Profil",
      bookings: "Tempahan",
      payments: "Pembayaran",
      reviews: "Ulasan",
      availability: "Ketersediaan",
      charges: "Caj & Yuran",
      admin: "Pentadbir",
      pro: "Pro",
    },
    // Hero Section
    hero: {
      title: "Tempah Kecantikan. Di Mana-mana.",
      subtitle: "Cari jurusolek dan studio, lihat ketersediaan masa nyata, dan sahkan tempahan anda dalam beberapa minit.",
      ctaBrowse: "Cari Jurusolek",
      ctaStudios: "Cari Studio",
      ctaJoin: "Sertai sebagai MUA",
      luxuryMarketplace: "Pasaran Kecantikan Mewah",
    },
    // Auth
    auth: {
      signInTitle: "Log Masuk",
      signInSubtitle: "Akses akaun anda untuk menguruskan tempahan dan ketersediaan.",
      registerTitle: "Daftar",
      registerSubtitle: "Buat akaun untuk menempah artis atau menawarkan perkhidmatan anda.",
      email: "Emel",
      password: "Kata Laluan",
      fullName: "Nama Penuh",
      phone: "Nombor Telefon",
      role: "Saya adalah...",
      roleCustomer: "Pelanggan",
      roleArtist: "Artis Solek",
      roleStudio: "Pemilik Studio",
      continueWithGoogle: "Teruskan dengan Google",
      secureSignIn: "Log masuk selamat untuk pelanggan dan profesional kecantikan",
      forgotPassword: "Lupa kata laluan?",
      noAccount: "Tiada akaun?",
      hasAccount: "Sudah ada akaun?",
      signUp: "Daftar",
      signInButton: "Log Masuk",
      passwordMinLength: "Kata laluan mesti sekurang-kurangnya 6 aksara",
      invalidEmail: "Sila masukkan alamat emel yang sah",
      nameRequired: "Sila masukkan nama penuh anda",
      nameMinLength: "Nama mesti sekurang-kurangnya 2 aksara",
      signingIn: "Sedang log masuk...",
      creatingAccount: "Sedang mewujudkan akaun...",
      success: "Berjaya! Sedang mengalihkan...",
    },
    // Booking
    booking: {
      title: "Tempah Temujanji Anda",
      step1: "Pilih Perkhidmatan",
      step2: "Pilih Tarikh",
      step3: "Butiran Anda",
      step4: "Pembayaran",
      selectService: "Pilih perkhidmatan",
      selectDate: "Pilih tarikh",
      selectTime: "Pilih masa",
      noSlotsAvailable: "Tiada slot tersedia untuk tarikh ini",
      nextAvailable: "Cari slot seterusnya",
      searching: "Sedang mencari...",
      yourName: "Nama Anda",
      yourEmail: "Emel Anda",
      yourPhone: "Telefon Anda",
      notes: "Permintaan Khas (pilihan)",
      paymentOption: "Pilihan Pembayaran",
      payFull: "Bayar Penuh",
      payDeposit: "Bayar Deposit 30%",
      payBnpl: "Bayar dalam 4 Ansuran",
      total: "Jumlah",
      deposit: "Deposit",
      balance: "Baki perlu dibayar pada hari temujanji",
      confirmBooking: "Sahkan Tempahan",
      processing: "Sedang memproses...",
      signInRequired: "Sila log masuk untuk melengkapkan tempahan anda",
      mustBe24Hours: "Tempahan mesti dibuat sekurang-kurangnya 24 jam sebelumnya",
      slotAlreadyBooked: "Slot ini baru sahaja ditempah oleh orang lain",
      bookingConfirmed: "Tempahan Disahkan",
      bookingPending: "Tempahan Tertangguh",
      bookingCancelled: "Tempahan Dibatalkan",
    },
    // Dashboard
    dashboard: {
      title: "Papan Pemuka Pro",
      subtitle: "Ruang kerja operasi untuk artis dan studio untuk menguruskan perkhidmatan, tempahan, ulasan, dan pembayaran.",
      overview: "Gambaran Keseluruhan",
      upcomingBookings: "Tempahan Akan Datang",
      recentReviews: "Ulasan Terkini",
      providerSnapshot: "Gambaran Penyedia",
      stats: {
        totalBookings: "Jumlah Tempahan",
        pendingConfirmations: "Pengesahan Tertangguh",
        thisMonthRevenue: "Hasil Bulan Ini",
        averageRating: "Penarafan Purata",
      },
      confirm: "Sahkan",
      cancel: "Batal",
      completed: "Selesai",
      pending: "Tertangguh",
      confirmed: "Disahkan",
      paidDeposit: "Dibayar (Deposit)",
      paidFull: "Dibayar (Penuh)",
      noBookings: "Tiada tempahan lagi",
      noReviews: "Tiada ulasan lagi",
    },
    // Charges & Fees
    charges: {
      title: "Caj & Yuran",
      subtitle: "Konfigurasi caj tambahan, yuran perjalanan, dan surcaj untuk perkhidmatan anda.",
      travelFeeConfig: "Konfigurasi Yuran Perjalanan",
      freeTravelRadius: "Radius Perjalanan Percuma",
      travelFeePerKm: "Yuran Perjalanan per km",
      maxDistance: "Jarak Maksimum",
      outstationFee: "Yuran Luar Kawasan",
      activeSurcharges: "Surcaj Aktif",
      addSurcharge: "Tambah Surcaj",
      presetSurcharges: "Pratetap Surcaj Pantas",
      earlyMorning: "Surcaj Pagi Awal",
      lateNight: "Surcaj Lewat Malam",
      weekend: "Surcaj Hujung Minggu",
      publicHoliday: "Surcaj Cuti Umum",
      lastMinute: "Tempahan Masa Akhir",
      additionalPerson: "Orang Tambahan",
      touchUp: "Perkhidmatan Sentuhan",
      changeOfLook: "Tukar Rupa",
      perPerson: "setiap orang",
      fixed: "Tetap",
      percentage: "Peratusan",
      save: "Simpan Konfigurasi",
      noSurcharges: "Tiada surcaj dikonfigurasi lagi",
    },
    // Categories
    categories: {
      title: "Semak Mengikut Kategori",
      bridal: "Solek Pengantin",
      event: "Solek Acara",
      photoshoot: "Solek Fotografi",
      editorial: "Solek Editorial",
      sfx: "Solek Kesan Khas",
      lessons: "Kelas Solek",
      "hari-raya": "Solek Hari Raya",
      "chinese-new-year": "Solek Tahun Baru Cina",
      "traditional-malay": "Solek Melayu Tradisional",
      hijab: "Solek Mesra Hijab",
    },
    // How it Works
    howItWorks: {
      title: "Cara Ia Berfungsi",
      step1: {
        title: "Temui",
        description: "Semak portfolio dan cari artis yang sesuai",
      },
      step2: {
        title: "Tempah",
        description: "Pilih perkhidmatan dan slot masa pilihan anda",
      },
      step3: {
        title: "Sahkan",
        description: "Sahkan tempahan anda dengan pilihan pembayaran fleksibel",
      },
    },
    // Testimonials
    testimonials: {
      title: "Apa Kata Pelanggan Kami",
      subtitle: "Pengalaman sebenar daripada pelanggan sebenar",
    },
    // Footer
    footer: {
      tagline: "Kecantikan anda, sempurna. Menghubungkan anda dengan artis solek freelance Malaysia yang paling berbakat.",
      explore: "Terokai",
      company: "Syarikat",
      stayInTouch: "Kekal Berhubung",
      newsletterPlaceholder: "Emel anda",
      join: "Sertai",
      newsletterText: "Terima tips kecantikan dan ciri artis eksklusif.",
      copyright: "Hak cipta terpelihara.",
      aboutUs: "Tentang Kami",
      careers: "Kerjaya",
      press: "Media",
      contact: "Hubungi",
      browseArtists: "Semak Senarai Artis",
      bridalMakeup: "Solek Pengantin",
      photoshootMakeup: "Solek Fotografi",
      sfxLooks: "Rupa SFX",
      privacyPolicy: "Dasar Privasi",
      termsOfService: "Syarat Perkhidmatan",
    },
    // Common
    common: {
      loading: "Sedang memuat...",
      save: "Simpan",
      cancel: "Batal",
      edit: "Sunting",
      delete: "Padam",
      create: "Cipta",
      update: "Kemas Kini",
      search: "Cari",
      filter: "Tapis",
      sort: "Isih",
      showMore: "Tunjuk Lagi",
      showLess: "Tunjuk Kurang",
      readMore: "Baca Lagi",
      viewAll: "Lihat Semua",
      back: "Kembali",
      next: "Seterusnya",
      previous: "Sebelumnya",
      submit: "Hantar",
      close: "Tutup",
      open: "Buka",
      yes: "Ya",
      no: "Tidak",
      or: "atau",
      and: "dan",
      at: "pada",
      on: "pada",
      in: "di",
      by: "oleh",
      for: "untuk",
      with: "dengan",
      from: "dari",
      to: "ke",
      of: "dari",
      km: "km",
      myr: "MYR",
      hour: "jam",
      hours: "jam",
      minute: "minit",
      minutes: "minit",
    },
    // Errors
    errors: {
      generic: "Sesuatu telah berlaku salah. Sila cuba lagi.",
      notFound: "Halaman tidak dijumpai",
      unauthorized: "Akses tidak dibenarkan",
      forbidden: "Akses dilarang",
      serverError: "Ralat pelayan. Sila cuba lagi nanti.",
      networkError: "Ralat rangkaian. Sila periksa sambungan anda.",
    },
    // Chat
    chat: {
      title: "Mesej",
      placeholder: "Taip mesej...",
      send: "Hantar",
      noMessages: "Tiada mesej lagi",
      typeMessage: "Taip mesej anda",
    },
  },
} as const

export type Translations = typeof translations.en
