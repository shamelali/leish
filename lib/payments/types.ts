export type PaymentProvider = "billplz"
export type BookingPaymentType = "full" | "deposit"

export type CreatePaymentInput = {
  bookingId: string
  amountMyr: number
  customerName: string
  customerEmail: string
  customerPhone?: string
  paymentType?: BookingPaymentType
  description?: string
}

export type CreatePaymentResult = {
  provider: PaymentProvider
  referenceId: string
  checkoutUrl: string
  qrCode?: string
}
