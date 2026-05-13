import crypto from "crypto"
import type { CreatePaymentInput, CreatePaymentResult } from "@/lib/payments/types"

const BILLPLZ_API = process.env.BILLPLZ_API_URL ?? "https://www.billplz.com/api/v3"

function required(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function authHeader() {
  const apiKey = required("BILLPLZ_API_KEY")
  return `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`
}

function getCollectionId(paymentType: CreatePaymentInput["paymentType"]) {
  if (paymentType === "deposit") {
    return (
      process.env.BILLPLZ_COLLECTION_ID_DEPOSIT ??
      process.env.BILLPLZ_COLLECTION_ID
    )
  }

  return (
    process.env.BILLPLZ_COLLECTION_ID_FULL ??
    process.env.BILLPLZ_COLLECTION_ID
  )
}

export async function createBillplzPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
  const collectionId = getCollectionId(input.paymentType)
  if (!collectionId) throw new Error("Missing BILLPLZ_COLLECTION_ID_FULL/BILLPLZ_COLLECTION_ID_DEPOSIT")
  const callbackUrl = required("BILLPLZ_CALLBACK_URL")
  const redirectUrl = required("PAYMENT_SUCCESS_URL")
  const paymentType = input.paymentType ?? "full"

  const body = new URLSearchParams({
    collection_id: collectionId,
    email: input.customerEmail,
    name: input.customerName,
    amount: String(Math.round(input.amountMyr * 100)),
    callback_url: callbackUrl,
    redirect_url: redirectUrl,
    description: input.description ?? `Booking ${input.bookingId}`,
    reference_1_label: "booking_id",
    reference_1: input.bookingId,
    reference_2_label: "payment_type",
    reference_2: paymentType,
  })

  const response = await fetch(`${BILLPLZ_API}/bills`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Billplz create failed: ${text}`)
  }

  const data = (await response.json()) as { id: string; url: string }
  return {
    provider: "billplz",
    referenceId: data.id,
    checkoutUrl: data.url,
  }
}

export function verifyBillplzXSignature(rawBody: string, signature: string) {
  const xSignatureKey = required("BILLPLZ_X_SIGNATURE")
  const digest = crypto.createHmac("sha256", xSignatureKey).update(rawBody).digest("hex")
  return digest === signature
}
