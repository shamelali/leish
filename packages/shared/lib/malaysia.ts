export const MALAYSIAN_STATES = [
  "Johor",
  "Kedah",
  "Kelantan",
  "Kuala Lumpur",
  "Labuan",
  "Melaka",
  "Negeri Sembilan",
  "Pahang",
  "Penang",
  "Perak",
  "Perlis",
  "Putrajaya",
  "Sabah",
  "Sarawak",
  "Selangor",
  "Terengganu",
] as const

export const MALAYSIA_DISTRICTS: Record<string, string[]> = {
  Johor: [
    "Batu Pahat", "Johor Bahru", "Kluang", "Kota Tinggi", "Kulai",
    "Mersing", "Muar", "Pontian", "Segamat", "Tangkak",
    "Labis", "Bukit Gambir", "Parit Sulong", "Rengit", "Yong Peng",
  ],
  Kedah: [
    "Baling", "Bandar Baharu", "Kota Setar", "Kuala Muda", "Kubang Pasu",
    "Kulim", "Langkawi", "Padang Terap", "Pendang", "Pokok Sena",
    "Sik", "Yan",
  ],
  Kelantan: [
    "Bachok", "Gua Musang", "Jeli", "Kota Bharu", "Kuala Krai",
    "Machang", "Pasir Mas", "Pasir Puteh", "Tanah Merah", "Tumpat",
    "Lojing",
  ],
  "Kuala Lumpur": [
    "Bukit Bintang", "Cheras", "Kepong", "Kuala Lumpur City Centre",
    "Segambut", "Setapak", "Sentul", "Titiwangsa", "Wangsa Maju",
    "Bandar Tun Razak", "Lembah Pantai",
  ],
  Labuan: ["Labuan", "Victoria"],
  Melaka: [
    "Alor Gajah", "Jasin", "Melaka Tengah", "Masjid Tanah",
    "Merlimau", "Sungai Udang",
  ],
  "Negeri Sembilan": [
    "Jelebu", "Jempol", "Kuala Pilah", "Port Dickson", "Rembau",
    "Seremban", "Tampin", "Gemas",
  ],
  Pahang: [
    "Bentong", "Bera", "Cameron Highlands", "Jerantut", "Kuantan",
    "Lipis", "Maran", "Pekan", "Raub", "Rompin",
    "Temerloh",
  ],
  Penang: [
    "Barat Daya", "Timur Laut", "Seberang Perai Utara",
    "Seberang Perai Tengah", "Seberang Perai Selatan",
    "George Town", "Bukit Mertajam", "Butterworth",
  ],
  Perak: [
    "Bagan Datuk", "Batang Padang", "Hilir Perak", "Hulu Perak",
    "Kamar", "Kerian", "Kinta", "Kuala Kangsar", "Larut, Matang dan Selama",
    "Manjung", "Muallim", "Perak Tengah", "Sungai Siput",
    "Taiping", "Teluk Intan", "Ipoh",
  ],
  Perlis: ["Kangar", "Arau", "Padang Besar", "Simpang Empat"],
  Putrajaya: ["Putrajaya"],
  Sabah: [
    "Beaufort", "Beluran", "Keningau", "Kinabatangan", "Kota Belud",
    "Kota Kinabalu", "Kota Marudu", "Kuala Penyu", "Kudat", "Kunak",
    "Lahad Datu", "Nabawan", "Papar", "Penampang", "Pitas",
    "Putatan", "Ranau", "Sandakan", "Semporna", "Sipitang",
    "Tambunan", "Tawau", "Telupid", "Tenom", "Tongod",
    "Tuaran",
  ],
  Sarawak: [
    "Asajaya", "Bau", "Belaga", "Betong", "Bintulu",
    "Dalat", "Daro", "Julau", "Kanowit", "Kapit",
    "Kuching", "Lawas", "Limbang", "Lubok Antu", "Lundu",
    "Maran", "Matu", "Miri", "Mukah", "Padawan",
    "Pakan", "Samarahan", "Saratok", "Sarikei", "Sebauh",
    "Serian", "Sibu", "Simunjan", "Song", "Sri Aman",
    "Tatau", "Tebedu",
  ],
  Selangor: [
    "Ampang", "Bangi", "Banting", "Batang Kali", "Beranang",
    "Bukit Beruntung", "Cheras", "Cyberjaya", "Dengkil", "Gombak",
    "Hulu Langat", "Hulu Selangor", "Kajang", "Klang", "Kuala Kubu Bharu",
    "Kuala Langat", "Kuala Selangor", "Petaling Jaya", "Puchong", "Rawang",
    "Sabak Bernam", "Salak Tinggi", "Semenyih", "Sepang", "Serdang",
    "Seri Kembangan", "Shah Alam", "Subang Jaya", "Sungai Buloh", "Tanjung Karang",
  ],
  Terengganu: [
    "Besut", "Dungun", "Hulu Terengganu", "Kemaman", "Kuala Nerus",
    "Kuala Terengganu", "Marang", "Setiu",
  ],
}

export const SERVICE_NAMES = [
  "Bridal Makeup",
  "Event Glam",
  "Hijab Makeup",
  "Editorial Makeup",
  "Airbrush Makeup",
  "SFX Makeup",
  "Hairstyling",
  "Lash Extensions & Lift",
  "Natural Glam",
  "Touch-up Session",
  "Custom Makeup",
  "Body Painting",
  "Airbrushing",
  "Fashion Show",
  "Film & TV",
] as const

export const MALAYSIA_LANGUAGES = [
  "English",
  "Malay (Bahasa Melayu)",
  "Mandarin Chinese",
  "Tamil",
] as const

export const DURATION_MINUTES_OPTIONS = [
  15, 30, 45, 60, 90, 120, 180, 240, 300, 360, 420, 480, 540, 600, 660, 720,
] as const

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h} hr${h > 1 ? "s" : ""}`
  return `${h} hr ${m} min`
}

export function formatDurationShort(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}