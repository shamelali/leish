export interface PortfolioItem {
  type: "image" | "video" | "beforeAfter"
  src: string
  alt: string
  before?: string
}

export interface Service {
  name: string
  duration: string
  price: number
}
