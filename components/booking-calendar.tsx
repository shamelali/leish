"use client";

import { useState, useCallback, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Smartphone,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type Artist, type Studio } from "@/lib/data";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";

type BookingStep = 1 | 2 | 3 | 4;

const stepLabels = ["Select Service", "Choose Date", "Your Details", "Payment"];

interface BookingEntity {
  id: string;
  name: string;
  services: { name: string; price: number; duration: string }[];
  bookedSlots: Record<string, string[]>;
}
interface AvailableSlot {
  id: string;
  slot: string;
  startsAt: string;
  endsAt: string;
  available: boolean;
}

function generateCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type PaymentOption = "full" | "deposit" | "bnpl";

export function BookingCalendar({
  artist,
  studio,
}: {
  artist?: Artist;
  studio?: Studio;
}) {
  const entity: BookingEntity = artist ?? studio!;
  const entityLabel = artist ? "Artist" : "Studio";
  const [step, setStep] = useState<BookingStep>(1);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTimeId, setSelectedTimeId] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [bookingRef, setBookingRef] = useState("");

  // Contact form
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactNotes, setContactNotes] = useState("");

  // Payment
  const [paymentOption, setPaymentOption] = useState<PaymentOption>("full");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [, setAuthError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [searchingNextSlots, setSearchingNextSlots] = useState(false);
  const [nextAvailableDates, setNextAvailableDates] = useState<string[]>([]);

  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const calendarDays = generateCalendarDays(viewYear, viewMonth);

  const dateKey = selectedDate
    ? `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(selectedDate).padStart(2, "0")}`
    : "";

  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setIsAuthenticated(!!data.user);
      setAuthUserId(data.user?.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
      setAuthUserId(session?.user?.id ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // fetch availability when dateKey changes
  useEffect(() => {
    if (!dateKey) return;

    let active = true;

    const fetchSlots = async () => {
      const res = await fetch(
        `/api/availability?providerId=${entity.id}&date=${encodeURIComponent(dateKey)}`,
      );
      if (!active) return;
      if (res.ok) {
        const slots = (await res.json()) as AvailableSlot[];
        setAvailableSlots(slots);
        const firstAvailable = slots.find((slot) => slot.available);
        setSelectedTimeId((current) => {
          if (
            current &&
            slots.some((slot) => slot.id === current && slot.available)
          ) {
            return current;
          }
          return firstAvailable?.id ?? null;
        });
      } else {
        setAvailableSlots([]);
        setSelectedTimeId(null);
      }
    };
    fetchSlots();

    return () => { active = false };
  }, [dateKey, entity.id]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else setViewMonth(viewMonth - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else setViewMonth(viewMonth + 1);
  };

  const isPastDay = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return d < t;
  };

  const contactValid =
    contactName.trim() !== "" &&
    contactEmail.trim() !== "" &&
    contactEmail.includes("@");

  const formatCardNumber = useCallback((value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  }, []);

  const findNextAvailableDates = useCallback(async () => {
    if (!selectedDate) return;
    setSearchingNextSlots(true);
    try {
      const suggestions: string[] = [];
      const start = new Date(viewYear, viewMonth, selectedDate);
      for (
        let offset = 1;
        offset <= 45 && suggestions.length < 3;
        offset += 1
      ) {
        const candidate = new Date(start);
        candidate.setDate(start.getDate() + offset);
        const candidateKey = `${candidate.getFullYear()}-${String(candidate.getMonth() + 1).padStart(2, "0")}-${String(candidate.getDate()).padStart(2, "0")}`;
        const res = await fetch(
          `/api/availability?providerId=${entity.id}&date=${encodeURIComponent(candidateKey)}`,
        );
        if (!res.ok) continue;
        const slots = (await res.json()) as AvailableSlot[];
        if (slots.some((slot) => slot.available)) {
          suggestions.push(candidateKey);
        }
      }
      setNextAvailableDates(suggestions);
    } finally {
      setSearchingNextSlots(false);
    }
  }, [entity.id, selectedDate, viewMonth, viewYear]);

  const handlePayment = async () => {
    setProcessing(true);
    setAuthError(null);
    setPaymentError(null);

    if (!authUserId) {
      setProcessing(false);
      setAuthError("Please sign in to continue to payment.");
      return;
    }
    if (!contactEmail || !contactName) {
      setProcessing(false);
      setPaymentError("Please provide your name and email.");
      return;
    }

    // first create booking record on server
    let createdBookingId = "";
    try {
      const bookingResp = await fetch(`/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: authUserId,
          providerId: entity.id,
          serviceId: service?.name ?? "",
          slotId: selectedTimeId || "",
          notes: contactNotes,
          totalAmountMyr: totalPrice,
        }),
      });
      const bookingData = await bookingResp.json();
      if (!bookingData.ok) {
        throw new Error(bookingData.error || "booking creation failed");
      }
      createdBookingId = bookingData.bookingId as string;
      setBookingRef(createdBookingId);
    } catch (err: unknown) {
      console.error("booking creation error", err);
      setProcessing(false);
      setPaymentError(
        err instanceof Error
          ? err.message
          : "Could not create booking. Please try again.",
      );
      return;
    }

    const payableAmount =
      paymentOption === "full"
        ? totalPrice
        : paymentOption === "deposit"
          ? depositAmount
          : bnplAmount;

    try {
      const response = await fetch(`/api/payments/billplz/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: createdBookingId,
          amountMyr: payableAmount,
          customerName: contactName || "Guest Customer",
          customerEmail: contactEmail,
          customerPhone: contactPhone || undefined,
          description: `${entity.name} - ${service?.name ?? "Booking"}`,
        }),
      });
      const data = await response.json();
      if (response.ok && data?.checkoutUrl) {
        window.location.assign(data.checkoutUrl as string);
        return;
      }
    } catch {
      setProcessing(false);
      setPaymentError(
        "Payment initialization failed. Please try a different payment method.",
      );
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1200));
    setProcessing(false);
    setConfirmed(true);
  };

  const handleReset = () => {
    setStep(1);
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTimeId(null);
    setConfirmed(false);
    setProcessing(false);
    setContactName("");
    setContactEmail("");
    setContactPhone("");
    setContactNotes("");
    setPaymentOption("full");
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
    setBookingRef("");
    setPaymentError(null);
  };

  const service =
    selectedService !== null ? entity.services[selectedService] : null;
  const totalPrice = service?.price ?? 0;
  const depositAmount = Math.round(totalPrice * 0.3);
  const bnplAmount = Math.round(totalPrice / 4);
  const selectedSlot =
    availableSlots.find((slot) => slot.id === selectedTimeId) ?? null;

  // ── Confirmation screen ──
  if (confirmed && service) {
    return (
      <div className="border border-border bg-card p-5 sm:p-8 text-center">
        <div className="mx-auto flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center border-2 border-accent">
          <Check className="h-8 w-8 sm:h-10 sm:w-10 text-accent" />
        </div>
        <h3 className="mt-4 sm:mt-6 font-serif text-xl sm:text-2xl font-medium text-foreground">
          Booking Confirmed
        </h3>
        <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">
          Reference: {bookingRef}
        </p>
        <div className="mx-auto mt-4 sm:mt-6 max-w-xs border border-border bg-secondary p-4 sm:p-5 text-left">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Service</span>
            <span className="font-medium text-foreground">{service.name}</span>
          </div>
          <div className="my-2 border-t border-border" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{entityLabel}</span>
            <span className="font-medium text-foreground">{entity.name}</span>
          </div>
          <div className="my-2 border-t border-border" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Date</span>
            <span className="font-medium text-foreground">
              {monthNames[viewMonth]} {selectedDate}, {viewYear}
            </span>
          </div>
          <div className="my-2 border-t border-border" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Time</span>
            <span className="font-medium text-foreground">
              {selectedSlot?.slot ?? "-"}
            </span>
          </div>
          <div className="my-2 border-t border-border" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {paymentOption === "full"
                ? "Paid"
                : paymentOption === "deposit"
                  ? "Deposit Paid"
                  : "1st Installment"}
            </span>
            <span className="font-serif text-base sm:text-lg font-medium text-accent">
              MYR{" "}
              {paymentOption === "full"
                ? totalPrice
                : paymentOption === "deposit"
                  ? depositAmount
                  : bnplAmount}
            </span>
          </div>
        </div>
        <p className="mt-4 sm:mt-6 text-sm text-muted-foreground">
          A confirmation email has been sent to{" "}
          <span className="font-medium text-foreground">{contactEmail}</span>
        </p>
        <button
          onClick={handleReset}
          className="mt-6 sm:mt-8 border border-foreground px-4 sm:px-6 py-2.5 sm:py-3 text-xs font-medium uppercase tracking-widest text-foreground transition-all hover:bg-foreground hover:text-primary-foreground"
        >
          Book Another
        </button>
      </div>
    );
  }

  return (
    <div className="border border-border bg-card">
      {/* ── Step indicator ── */}
      <div className="flex border-b border-border">
        {stepLabels.map((label, i) => (
          <div
            key={label}
            className={cn(
              "flex flex-1 flex-col items-center justify-center px-0.5 py-3 sm:px-1 sm:py-4 text-center",
              i < stepLabels.length - 1 && "border-r border-border",
            )}
          >
            <div
              className={cn(
                "flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center text-xs font-medium",
                step > i + 1
                  ? "bg-accent text-accent-foreground"
                  : step === i + 1
                    ? "border border-foreground bg-foreground text-primary-foreground"
                    : "border border-border text-muted-foreground",
              )}
            >
              {step > i + 1 ? (
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                i + 1
              )}
            </div>
            <span
              className={cn(
                "mt-1.5 sm:mt-2 text-[10px] sm:text-xs uppercase tracking-widest",
                step === i + 1 ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        {/* ── Step 1: Select Service ── */}
        {step === 1 && (
          <div>
            <h3 className="font-serif text-lg font-medium text-foreground">
              Select a service
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose from {entity.name}&apos;s available services.
            </p>
            <div className="mt-4 sm:mt-6 flex flex-col gap-2 sm:gap-3">
              {entity.services.map((svc, i) => (
                <button
                  key={svc.name}
                  onClick={() => setSelectedService(i)}
                  className={cn(
                    "flex min-h-12 sm:min-h-14 items-center justify-between border p-3 sm:p-4 text-left transition-all",
                    selectedService === i
                      ? "border-accent bg-secondary"
                      : "border-border hover:border-accent",
                  )}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-sm font-medium text-foreground truncate">
                      {svc.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {svc.duration}
                    </p>
                  </div>
                  <p className="font-serif text-base sm:text-lg text-foreground shrink-0">
                    MYR {svc.price}
                  </p>
                </button>
              ))}
            </div>
            <button
              onClick={() => selectedService !== null && setStep(2)}
              disabled={selectedService === null}
              className={cn(
                "mt-6 w-full min-h-12 py-3 text-xs font-medium uppercase tracking-widest transition-all",
                selectedService !== null
                  ? "bg-foreground text-primary-foreground hover:bg-accent hover:text-accent-foreground"
                  : "cursor-not-allowed bg-muted text-muted-foreground",
              )}
            >
              Continue
            </button>

            {/* Sign-in prompt for unauthenticated users */}
            {!isAuthenticated && selectedService !== null && (
              <div className="mt-4 rounded-xl border border-accent/30 bg-accent/5 p-4">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Sign in</span>{" "}
                  to save your booking and track it easily.
                </p>
                <Link
                  href="/sign-in"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-accent bg-accent px-4 py-2 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/90"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Choose Date & Time ── */}
        {step === 2 && (
          <div>
            <h3 className="font-serif text-lg font-medium text-foreground">
              Choose a date & time
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Select your preferred appointment date and time slot. Grayed-out
              slots are already booked.
            </p>

            {/* Calendar */}
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={prevMonth}
                  className="p-2 text-muted-foreground hover:text-foreground"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="font-serif text-sm font-medium text-foreground">
                  {monthNames[viewMonth]} {viewYear}
                </span>
                <button
                  onClick={nextMonth}
                  className="p-2 text-muted-foreground hover:text-foreground"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-3 sm:mt-4 grid grid-cols-7 gap-0.5 sm:gap-1 text-center">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <span
                    key={d}
                    className="py-1 text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground"
                  >
                    {d}
                  </span>
                ))}
                {calendarDays.map((day, i) =>
                  day === null ? (
                    <span key={`empty-${i}`} />
                  ) : (
                    <button
                      key={day}
                      disabled={isPastDay(day)}
                      onClick={() => {
                        setSelectedDate(day);
                        setSelectedTimeId(null);
                      }}
                      className={cn(
                        "flex min-h-11 min-w-11 items-center justify-center text-xs sm:text-sm transition-all",
                        isPastDay(day)
                          ? "cursor-not-allowed text-muted-foreground/40"
                          : selectedDate === day
                            ? "bg-foreground text-primary-foreground"
                            : "text-foreground hover:bg-secondary",
                      )}
                    >
                      {day}
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* Time slots with availability */}
            {selectedDate && (
              <div className="mt-4 sm:mt-6">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Available Times
                </p>
                <div className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2 sm:grid-cols-4">
                  {availableSlots.map(({ id, slot, available }) => (
                    <button
                      key={id}
                      disabled={!available}
                      onClick={() => setSelectedTimeId(id)}
                      className={cn(
                        "border min-h-11 py-3 sm:py-3.5 text-xs transition-all",
                        !available
                          ? "cursor-not-allowed border-border bg-muted opacity-50 line-through text-muted-foreground"
                          : selectedTimeId === id
                            ? "border-foreground bg-foreground text-primary-foreground"
                            : "border-border text-muted-foreground hover:border-accent hover:text-foreground",
                      )}
                    >
                      {available ? (
                        slot
                      ) : (
                        <span className="hidden sm:inline">
                          {slot} (Unavailable)
                        </span>
                      )}
                      {!available && <span className="sm:hidden">{slot}</span>}
                    </button>
                  ))}
                </div>
                {availableSlots.length === 0 ? (
                  <div className="mt-3 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      No slots published for this date yet. Please select
                      another date.
                    </p>
                    <button
                      type="button"
                      onClick={() => void findNextAvailableDates()}
                      disabled={searchingNextSlots}
                      className={cn(
                        "inline-flex min-h-9 items-center border px-3 text-[11px] font-medium uppercase tracking-widest transition-all",
                        searchingNextSlots
                          ? "cursor-not-allowed border-border text-muted-foreground/60"
                          : "border-foreground text-foreground hover:bg-foreground hover:text-primary-foreground",
                      )}
                    >
                      {searchingNextSlots
                        ? "Checking..."
                        : "Find Next Available Dates"}
                    </button>
                    {nextAvailableDates.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {nextAvailableDates.map((key) => {
                          const [y, m, d] = key.split("-").map(Number);
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                setViewYear(y);
                                setViewMonth(m - 1);
                                setSelectedDate(d);
                                setSelectedTimeId(null);
                              }}
                              className="border border-border px-3 py-2 text-[11px] text-foreground transition-all hover:border-accent hover:bg-secondary"
                            >
                              {monthNames[m - 1]} {d}, {y}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <p className="mt-3 text-xs text-muted-foreground">
                  Slots are 30-minute intervals. Same-day and next-24-hour slots
                  are unavailable.
                </p>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 min-h-12 border border-border py-3 text-xs font-medium uppercase tracking-widest text-muted-foreground transition-all hover:border-foreground hover:text-foreground"
              >
                Back
              </button>
              <button
                onClick={() => selectedDate && selectedTimeId && setStep(3)}
                disabled={!selectedDate || !selectedTimeId}
                className={cn(
                  "flex-1 min-h-12 py-3 text-xs font-medium uppercase tracking-widest transition-all",
                  selectedDate && selectedTimeId
                    ? "bg-foreground text-primary-foreground hover:bg-accent hover:text-accent-foreground"
                    : "cursor-not-allowed bg-muted text-muted-foreground",
                )}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Your Details ── */}
        {step === 3 && (
          <div>
            <h3 className="font-serif text-lg font-medium text-foreground">
              Your details
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your contact information so {entity.name} can reach you.
            </p>

            {/* Sign-in required */}
            {!isAuthenticated && (
              <div className="mt-6 rounded-xl border border-accent/30 bg-accent/5 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Please sign in to complete your booking
                </p>
                <Link
                  href="/sign-in"
                  className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-accent bg-accent px-4 py-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
                >
                  Sign In
                </Link>
                <p className="mt-3 text-xs text-muted-foreground">
                  Already have an account? Sign in to auto-fill your details
                </p>
              </div>
            )}

            {isAuthenticated && (
              <div className="mt-4 sm:mt-6 flex flex-col gap-3 sm:gap-4">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="block text-xs font-medium uppercase tracking-widest text-muted-foreground"
                  >
                    Full Name <span className="text-accent">*</span>
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Your full name"
                    className="mt-1.5 sm:mt-2 w-full border border-border bg-background px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-xs font-medium uppercase tracking-widest text-muted-foreground"
                  >
                    Email <span className="text-accent">*</span>
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="mt-1.5 sm:mt-2 w-full border border-border bg-background px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-phone"
                    className="block text-xs font-medium uppercase tracking-widest text-muted-foreground"
                  >
                    Phone
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+60 12 345 6789"
                    className="mt-1.5 sm:mt-2 w-full border border-border bg-background px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-notes"
                    className="block text-xs font-medium uppercase tracking-widest text-muted-foreground"
                  >
                    Event Notes
                  </label>
                  <textarea
                    id="contact-notes"
                    value={contactNotes}
                    onChange={(e) => setContactNotes(e.target.value)}
                    placeholder="Tell us about your event, inspiration, or any special requests..."
                    rows={3}
                    className="mt-1.5 sm:mt-2 w-full resize-none border border-border bg-background px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none"
                  />
                </div>
              </div>
            )}

            {isAuthenticated && (
              <div className="mt-4 sm:mt-6 flex gap-2 sm:gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 min-h-10 sm:min-h-12 border border-border py-2.5 sm:py-3 text-xs font-medium uppercase tracking-widest text-muted-foreground transition-all hover:border-foreground hover:text-foreground"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    if (!contactValid) return;
                    setStep(4);
                  }}
                  disabled={!contactValid}
                  className={cn(
                    "flex-1 min-h-10 sm:min-h-12 py-2.5 sm:py-3 text-xs font-medium uppercase tracking-widest transition-all",
                    contactValid
                      ? "bg-foreground text-primary-foreground hover:bg-accent hover:text-accent-foreground"
                      : "cursor-not-allowed bg-muted text-muted-foreground",
                  )}
                >
                  Continue to Payment
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Step 4: Payment ── */}
        {step === 4 && service && (
          <div>
            <h3 className="font-serif text-lg font-medium text-foreground">
              Payment
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Review your booking and choose a payment option.
            </p>

            {/* Order summary */}
            <div className="mt-4 sm:mt-6 border border-border bg-secondary p-4 sm:p-5">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Order Summary
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{service.name}</span>
                  <span className="text-foreground">MYR {service.price}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{entityLabel}</span>
                  <span className="text-foreground">{entity.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span className="text-foreground">
                    {monthNames[viewMonth]} {selectedDate}, {viewYear}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Time</span>
                  <span className="text-foreground">
                    {selectedSlot?.slot ?? "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment options */}
            <div className="mt-4 sm:mt-6">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Payment Option
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <button
                  onClick={() => setPaymentOption("full")}
                  className={cn(
                    "flex min-h-12 sm:min-h-14 items-center justify-between border p-3 sm:p-4 text-left transition-all",
                    paymentOption === "full"
                      ? "border-accent bg-secondary"
                      : "border-border hover:border-accent",
                  )}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-sm font-medium text-foreground">
                      Pay Full Amount
                    </p>
                    <p className="text-xs text-muted-foreground">
                      One-time payment
                    </p>
                  </div>
                  <span className="font-serif text-base sm:text-lg text-foreground shrink-0">
                    MYR {totalPrice}
                  </span>
                </button>
                <button
                  onClick={() => setPaymentOption("deposit")}
                  className={cn(
                    "flex min-h-12 sm:min-h-14 items-center justify-between border p-3 sm:p-4 text-left transition-all",
                    paymentOption === "deposit"
                      ? "border-accent bg-secondary"
                      : "border-border hover:border-accent",
                  )}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-sm font-medium text-foreground">
                      Pay 30% Deposit
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Remaining MYR {totalPrice - depositAmount} due on
                      appointment day
                    </p>
                  </div>
                  <span className="font-serif text-base sm:text-lg text-foreground shrink-0">
                    MYR {depositAmount}
                  </span>
                </button>
                <button
                  onClick={() => setPaymentOption("bnpl")}
                  className={cn(
                    "flex min-h-12 sm:min-h-14 items-center justify-between border p-3 sm:p-4 text-left transition-all",
                    paymentOption === "bnpl"
                      ? "border-accent bg-secondary"
                      : "border-border hover:border-accent",
                  )}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-sm font-medium text-foreground">
                      Pay in 4 Installments
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Interest-free, bi-weekly payments
                    </p>
                  </div>
                  <span className="font-serif text-base sm:text-lg text-foreground shrink-0">
                    4 x MYR {bnplAmount}
                  </span>
                </button>
              </div>
            </div>

            {/* Payment method */}
            <div className="mt-4 sm:mt-6">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Payment Method
              </p>
              <div className="mt-3">
                <div className="flex items-center gap-2 border border-accent bg-secondary px-3 sm:px-4 py-2.5 sm:py-3 text-foreground">
                  <Smartphone className="h-4 w-4" />
                  <span className="text-xs font-medium">Billplz</span>
                </div>
              </div>
              <div className="mt-3 sm:mt-4 flex flex-col gap-2 sm:gap-3">
                <p className="text-xs text-muted-foreground">
                  You will be redirected to Billplz to complete payment
                  securely.
                </p>
                <div>
                  <label htmlFor="card-number" className="sr-only">
                    Reference
                  </label>
                  <input
                    id="card-number"
                    type="text"
                    value={cardNumber}
                    onChange={(e) =>
                      setCardNumber(formatCardNumber(e.target.value))
                    }
                    placeholder="Optional reference"
                    maxLength={19}
                    className="w-full border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label htmlFor="card-expiry" className="sr-only">
                      Promo code
                    </label>
                    <input
                      id="card-expiry"
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="Optional"
                      maxLength={20}
                      className="w-full border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="card-cvv" className="sr-only">
                      Notes
                    </label>
                    <input
                      id="card-cvv"
                      type="text"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.slice(0, 20))}
                      placeholder="Optional"
                      maxLength={20}
                      className="w-full border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="flex-1 min-h-12 border border-border py-3 text-xs font-medium uppercase tracking-widest text-muted-foreground transition-all hover:border-foreground hover:text-foreground"
              >
                Back
              </button>
              <button
                onClick={handlePayment}
                disabled={processing}
                className="flex-1 min-h-12 flex items-center justify-center gap-2 bg-foreground py-3 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-all hover:bg-accent hover:text-accent-foreground disabled:opacity-70"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay MYR ${paymentOption === "full" ? totalPrice : paymentOption === "deposit" ? depositAmount : bnplAmount}`
                )}
              </button>
            </div>
            {paymentError ? (
              <p className="mt-3 text-xs text-destructive">{paymentError}</p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
