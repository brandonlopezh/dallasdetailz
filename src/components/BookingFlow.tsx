"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Service } from "@/lib/types";
import type { DaySlots } from "@/lib/availability";

// Simplified flow: no vehicle-tier step, no add-ons. Three flat-price
// services, a spot for custom requests, address + time, then a request
// (not an instant confirmation) goes to the brothers for approval.
const STORAGE_KEY = "dd-booking-v2";

// Pricing is flat across vehicle sizes in the catalog already (every tier
// prices the same for a given service) — this is just which tier's
// duration we use to size the calendar slot, since we no longer ask.
const DEFAULT_TIER = "mid_suv" as const;

interface Draft {
  serviceId: string | null;
  customRequest: string;
  address: string;
  waterAccess: boolean;
  outletAccess: boolean;
  slotStart: string | null;
  name: string;
  phone: string;
  email: string;
}

const EMPTY: Draft = {
  serviceId: null,
  customRequest: "",
  address: "",
  waterAccess: true,
  outletAccess: true,
  slotStart: null,
  name: "",
  phone: "",
  email: "",
};

function money(n: number) {
  return `$${Math.round(n)}`;
}

export default function BookingFlow() {
  const params = useSearchParams();
  const [step, setStep] = useState(1);
  // Lazy init (not an effect) so restoring from localStorage doesn't cause an
  // extra render; window is undefined during SSR, so this only ever reads on
  // the client.
  const [draft, setDraft] = useState<Draft>(() => {
    let restored = EMPTY;
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) restored = { ...EMPTY, ...JSON.parse(raw) };
      } catch {}
    }
    const svc = params.get("service");
    return svc ? { ...restored, serviceId: svc } : restored;
  });
  const [services, setServices] = useState<Service[]>([]);

  // Persist on every change. draft is already correctly seeded on first
  // render (see the lazy initializer above), so there's no "wait for
  // restore" step needed here.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  useEffect(() => {
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((d) => setServices(d.services ?? []))
      .catch(() => {});
  }, []);

  const service = services.find((s) => s.id === draft.serviceId) ?? null;
  const pricing = service?.pricing.find((p) => p.tier === DEFAULT_TIER) ?? null;

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <div>
      <Stepper step={step} />
      {step === 1 && (
        <StepService
          draft={draft}
          set={set}
          services={services}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && service && (
        <StepWhereWhen
          draft={draft}
          set={set}
          serviceName={service.name}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}
      {step === 3 && service && pricing && (
        <StepConfirm
          draft={draft}
          set={set}
          service={service}
          price={pricing.price}
          onBack={() => setStep(2)}
        />
      )}
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  const labels = ["Service", "When", "Your info"];
  return (
    <div className="mb-6 flex items-center gap-2">
      {labels.map((l, i) => (
        <div key={l} className="flex flex-1 flex-col gap-1">
          <div
            className={`h-1.5 rounded-full ${i + 1 <= step ? "bg-accent" : "bg-border"}`}
          />
          <span
            className={`text-[11px] ${i + 1 === step ? "text-ink" : "text-muted"}`}
          >
            {l}
          </span>
        </div>
      ))}
    </div>
  );
}

function PrimaryBtn({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="tap w-full rounded-[var(--radius-md)] bg-accent px-5 font-bold text-white transition-colors hover:bg-accent-hi disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="tap rounded-[var(--radius-md)] border border-border px-5 font-semibold text-muted hover:text-ink"
    >
      Back
    </button>
  );
}

// STEP 1 — service --------------------------------------------------------
function StepService({
  draft,
  set,
  services,
  onNext,
}: {
  draft: Draft;
  set: (p: Partial<Draft>) => void;
  services: Service[];
  onNext: () => void;
}) {
  return (
    <section>
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold">
        Choose your service
      </h1>
      <p className="mt-1 text-sm text-muted">
        Prices shown are final. We accept Zelle and Cash only.
      </p>
      <div className="mt-5 grid gap-3">
        {services.map((s) => {
          const p = s.pricing.find((x) => x.tier === DEFAULT_TIER);
          const selected = draft.serviceId === s.id;
          return (
            <button
              key={s.id}
              onClick={() => set({ serviceId: s.id })}
              className={`rounded-[var(--radius-md)] border p-4 text-left transition-colors ${
                selected ? "border-accent bg-accent/10" : "border-border bg-surface hover:border-accent/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold">{s.name}</span>
                <span className="font-[family-name:var(--font-display)] text-lg font-extrabold">
                  {p ? money(p.price) : "TBD"}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">{s.description}</p>
            </button>
          );
        })}
      </div>

      <label className="mt-6 block text-sm font-semibold">
        Need something custom?
      </label>
      <textarea
        className="input mt-2 min-h-24"
        placeholder="Tell us what you're looking for and we'll follow up (optional)"
        value={draft.customRequest}
        onChange={(e) => set({ customRequest: e.target.value })}
      />

      <div className="mt-6">
        <PrimaryBtn onClick={onNext} disabled={!draft.serviceId}>
          Continue
        </PrimaryBtn>
      </div>
      <InputStyles />
    </section>
  );
}

// STEP 2 — where & when -----------------------------------------------------
function StepWhereWhen({
  draft,
  set,
  serviceName,
  onBack,
  onNext,
}: {
  draft: Draft;
  set: (p: Partial<Draft>) => void;
  serviceName: string;
  onBack: () => void;
  onNext: () => void;
}) {
  const [days, setDays] = useState<DaySlots[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeDay, setActiveDay] = useState(0);

  const loadSlots = () => {
    setLoading(true);
    const qs = new URLSearchParams({
      serviceId: draft.serviceId!,
      tier: DEFAULT_TIER,
    });
    fetch(`/api/availability?${qs}`)
      .then((r) => r.json())
      .then((d) => setDays(d.days ?? []))
      .finally(() => setLoading(false));
  };

  return (
    <section className="pb-4">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold">
        Where & when
      </h1>
      <p className="mt-1 text-sm text-muted">{serviceName}</p>

      <label className="mt-5 block text-sm font-semibold">Service address</label>
      <input
        className="input mt-1 w-full"
        placeholder="Street, city, ZIP"
        value={draft.address}
        onChange={(e) => set({ address: e.target.value })}
      />

      <div className="mt-4 rounded-[var(--radius-md)] border border-warning/40 bg-warning/10 p-3 text-sm">
        <span className="font-semibold">Required:</span> outdoor water access
        and a working power outlet at the address. We can&apos;t detail
        without both.
      </div>

      <button
        onClick={loadSlots}
        disabled={draft.address.length < 4}
        className="tap mt-5 w-full rounded-[var(--radius-md)] border border-accent px-5 font-semibold text-accent-hi disabled:opacity-40"
      >
        {days ? "Refresh times" : "Show open times"}
      </button>

      {loading && <p className="mt-4 text-muted">Finding open slots…</p>}

      {days && !loading && (
        <div className="mt-5">
          {days.length === 0 ? (
            <div className="rounded-[var(--radius-md)] border border-warning/40 bg-warning/10 p-4 text-sm">
              No open times in the next few weeks. Leave your info on the next
              step and we&apos;ll text you a time.
            </div>
          ) : (
            <>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {days.map((d, i) => (
                  <button
                    key={d.date}
                    onClick={() => setActiveDay(i)}
                    className={`shrink-0 rounded-[var(--radius-sm)] border px-3 py-2 text-sm ${
                      activeDay === i ? "border-accent bg-accent/10" : "border-border"
                    }`}
                  >
                    {new Date(d.date + "T12:00:00").toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </button>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {days[activeDay]?.slots.map((s) => (
                  <button
                    key={s.start}
                    onClick={() => set({ slotStart: s.start })}
                    className={`rounded-[var(--radius-sm)] border py-2 text-sm ${
                      draft.slotStart === s.start
                        ? "border-accent bg-accent text-white"
                        : "border-border"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <BackBtn onClick={onBack} />
        <PrimaryBtn
          onClick={onNext}
          disabled={draft.address.length < 4 || (!!days && days.length > 0 && !draft.slotStart)}
        >
          Continue
        </PrimaryBtn>
      </div>
      <InputStyles />
    </section>
  );
}

// STEP 3 — your info / request to book ---------------------------------------
function StepConfirm({
  draft,
  set,
  service,
  price,
  onBack,
}: {
  draft: Draft;
  set: (p: Partial<Draft>) => void;
  service: Service;
  price: number;
  onBack: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ ref: string } | null>(null);

  const canSubmit = draft.name.length > 0 && draft.phone.length >= 7 && draft.slotStart;

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          tier: DEFAULT_TIER,
          addonIds: [],
          slotStart: draft.slotStart,
          address: draft.address,
          waterAccess: draft.waterAccess,
          outletAccess: draft.outletAccess,
          customer: { name: draft.name, phone: draft.phone, email: draft.email },
          notes: draft.customRequest || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setDone({ ref: data.ref });
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <section className="text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/20 text-3xl">
          ✓
        </div>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-extrabold">
          Thank you for requesting service!
        </h1>
        <p className="mt-2 text-muted">
          We will confirm your appointment shortly. Reference{" "}
          <span className="font-mono text-ink">{done.ref}</span>.
        </p>
        <Link href="/" className="tap mt-6 inline-flex rounded-[var(--radius-md)] bg-accent px-6 font-bold text-white">
          Done
        </Link>
      </section>
    );
  }

  const slot = draft.slotStart ? new Date(draft.slotStart) : null;

  return (
    <section>
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold">
        Your info
      </h1>
      <div className="mt-4 grid gap-2">
        <input className="input" placeholder="Full name" value={draft.name} onChange={(e) => set({ name: e.target.value })} />
        <input className="input" placeholder="Mobile number" inputMode="tel" value={draft.phone} onChange={(e) => set({ phone: e.target.value })} />
        <input className="input" placeholder="Email (optional)" inputMode="email" value={draft.email} onChange={(e) => set({ email: e.target.value })} />
      </div>

      {/* Summary card */}
      <div className="mt-5 rounded-[var(--radius-md)] border border-border bg-surface p-4 text-sm">
        <Row label={service.name} value={money(price)} />
        {draft.customRequest && <Row label="Custom request" value={draft.customRequest} muted />}
        <div className="my-2 border-t border-border" />
        <Row
          label="When"
          value={
            slot
              ? slot.toLocaleString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "Not selected"
          }
        />
        <Row label="Where" value={draft.address || "Not entered"} />
        <div className="my-2 border-t border-border" />
        <Row label="Total" value={money(price)} bold />
        <p className="mt-1 text-xs text-muted">
          Zelle or Cash in person. This is a request, not a confirmed booking.
        </p>
      </div>

      {error && (
        <p className="mt-3 rounded-[var(--radius-sm)] border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <BackBtn onClick={onBack} />
        <PrimaryBtn onClick={submit} disabled={!canSubmit || submitting}>
          {submitting ? "Sending…" : "Request to Book"}
        </PrimaryBtn>
      </div>
      <InputStyles />
    </section>
  );
}

function Row({
  label,
  value,
  bold,
  muted,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 py-0.5 ${muted ? "text-muted" : ""}`}>
      <span className={bold ? "font-bold" : ""}>{label}</span>
      <span className={`text-right ${bold ? "font-[family-name:var(--font-display)] text-lg font-extrabold" : ""}`}>
        {value}
      </span>
    </div>
  );
}

// Shared input styling injected once per step (avoids a global .input in CSS).
function InputStyles() {
  return (
    <style>{`
      .input {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        padding: 0.7rem 0.9rem;
        color: var(--color-ink);
        min-height: 48px;
        width: 100%;
      }
      .input:focus { outline: 2px solid var(--color-accent); border-color: transparent; }
      .input::placeholder { color: var(--color-muted); }
    `}</style>
  );
}
