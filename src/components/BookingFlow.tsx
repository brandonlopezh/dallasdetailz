"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { VEHICLE_TIERS, type Addon, type Service, type VehicleTier } from "@/lib/types";
import type { DaySlots } from "@/lib/availability";

// PRD §5.1: four screens, no login, price updates live, state persists (R4),
// back preserves input (R3).
const STORAGE_KEY = "dd-booking-v1";

interface Draft {
  tier: VehicleTier;
  year: string;
  make: string;
  model: string;
  serviceId: string | null;
  addonIds: string[];
  address: string;
  waterAccess: boolean;
  outletAccess: boolean;
  slotStart: string | null;
  name: string;
  phone: string;
  email: string;
  notes: string;
}

const EMPTY: Draft = {
  tier: "mid_suv",
  year: "",
  make: "",
  model: "",
  serviceId: null,
  addonIds: [],
  address: "",
  waterAccess: true,
  outletAccess: true,
  slotStart: null,
  name: "",
  phone: "",
  email: "",
  notes: "",
};

function money(n: number) {
  return `$${Math.round(n)}`;
}

export default function BookingFlow() {
  const params = useSearchParams();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [services, setServices] = useState<Service[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Restore persisted draft (R4), then apply ?service= deep link from homepage.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setDraft({ ...EMPTY, ...JSON.parse(raw) });
    } catch {}
    const svc = params.get("service");
    if (svc) setDraft((d) => ({ ...d, serviceId: svc }));
    setLoaded(true);
  }, [params]);

  // Persist on every change.
  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft, loaded]);

  useEffect(() => {
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((d) => {
        setServices(d.services ?? []);
        setAddons(d.addons ?? []);
      })
      .catch(() => {});
  }, []);

  const service = services.find((s) => s.id === draft.serviceId) ?? null;
  const pricing = service?.pricing.find((p) => p.tier === draft.tier) ?? null;
  const chosenAddons = addons.filter((a) => draft.addonIds.includes(a.id));

  const total = useMemo(() => {
    const base = pricing?.price ?? 0;
    const add = chosenAddons.reduce((s, a) => s + a.price, 0);
    return base + add;
  }, [pricing, chosenAddons]);

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <div>
      <Stepper step={step} />
      {step === 1 && (
        <StepVehicle draft={draft} set={set} onNext={() => setStep(2)} />
      )}
      {step === 2 && (
        <StepService
          draft={draft}
          set={set}
          services={services}
          addons={addons}
          total={total}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}
      {step === 3 && service && (
        <StepWhereWhen
          draft={draft}
          set={set}
          serviceName={service.name}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
        />
      )}
      {step === 4 && service && pricing && (
        <StepConfirm
          draft={draft}
          set={set}
          service={service}
          basePrice={pricing.price}
          addons={chosenAddons}
          total={total}
          onBack={() => setStep(3)}
        />
      )}
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  const labels = ["Vehicle", "Service", "When", "Confirm"];
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

// STEP 1 --------------------------------------------------------------------
function StepVehicle({
  draft,
  set,
  onNext,
}: {
  draft: Draft;
  set: (p: Partial<Draft>) => void;
  onNext: () => void;
}) {
  return (
    <section>
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold">
        What are we detailing?
      </h1>
      <p className="mt-1 text-sm text-muted">Bigger vehicle, bigger job — pick the closest match.</p>
      <div className="mt-5 grid gap-3">
        {VEHICLE_TIERS.map((t) => (
          <button
            key={t.id}
            onClick={() => set({ tier: t.id })}
            className={`rounded-[var(--radius-md)] border p-4 text-left transition-colors ${
              draft.tier === t.id
                ? "border-accent bg-accent/10"
                : "border-border bg-surface hover:border-accent/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold">{t.label}</span>
              {t.isDefault && (
                <span className="rounded-full bg-surface-alt px-2 py-0.5 text-[10px] uppercase text-muted">
                  Most common
                </span>
              )}
            </div>
            <span className="text-sm text-muted">{t.hint}</span>
          </button>
        ))}
      </div>

      <details className="mt-4 rounded-[var(--radius-md)] border border-border bg-surface p-4">
        <summary className="cursor-pointer text-sm font-semibold">
          Add year / make / model (optional)
        </summary>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <input className="input" placeholder="Year" value={draft.year} onChange={(e) => set({ year: e.target.value })} />
          <input className="input" placeholder="Make" value={draft.make} onChange={(e) => set({ make: e.target.value })} />
          <input className="input" placeholder="Model" value={draft.model} onChange={(e) => set({ model: e.target.value })} />
        </div>
      </details>

      <div className="mt-6">
        <PrimaryBtn onClick={onNext}>Continue</PrimaryBtn>
      </div>
      <InputStyles />
    </section>
  );
}

// STEP 2 --------------------------------------------------------------------
function StepService({
  draft,
  set,
  services,
  addons,
  total,
  onBack,
  onNext,
}: {
  draft: Draft;
  set: (p: Partial<Draft>) => void;
  services: Service[];
  addons: Addon[];
  total: number;
  onBack: () => void;
  onNext: () => void;
}) {
  const toggleAddon = (id: string) =>
    set({
      addonIds: draft.addonIds.includes(id)
        ? draft.addonIds.filter((a) => a !== id)
        : [...draft.addonIds, id],
    });

  return (
    <section className="pb-24">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold">
        Choose your package
      </h1>
      <div className="mt-5 grid gap-3">
        {services.map((s) => {
          const p = s.pricing.find((x) => x.tier === draft.tier);
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
                  {p ? money(p.price) : "—"}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">{s.description}</p>
              {p && (
                <p className="mt-1 text-xs text-muted">
                  ≈ {Math.round(p.duration_min / 60 * 10) / 10} hrs
                </p>
              )}
            </button>
          );
        })}
      </div>

      {draft.serviceId && (
        <>
          <h2 className="mt-6 font-bold">Add-ons</h2>
          <div className="mt-3 grid gap-2">
            {addons.map((a) => {
              const on = draft.addonIds.includes(a.id);
              return (
                <button
                  key={a.id}
                  onClick={() => toggleAddon(a.id)}
                  className={`flex items-center justify-between rounded-[var(--radius-sm)] border p-3 text-left transition-colors ${
                    on ? "border-accent bg-accent/10" : "border-border bg-surface"
                  }`}
                >
                  <span className="text-sm">
                    <span className="mr-2">{on ? "☑" : "☐"}</span>
                    {a.name}
                  </span>
                  <span className="text-sm font-semibold">+{money(a.price)}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Running total (PRD §5.1 step 2) */}
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-base/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-muted">Total</p>
            <p className="font-[family-name:var(--font-display)] text-xl font-extrabold">
              {money(total)}
            </p>
          </div>
          <BackBtn onClick={onBack} />
          <button
            onClick={onNext}
            disabled={!draft.serviceId}
            className="tap rounded-[var(--radius-md)] bg-accent px-6 font-bold text-white disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      </div>
    </section>
  );
}

// STEP 3 --------------------------------------------------------------------
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
      tier: draft.tier,
      addons: draft.addonIds.join(","),
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
      <p className="mt-1 text-xs text-muted">
        Google Places autocomplete + radius check plugs in here (PRD §5.1 step 3).
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Toggle label="Water access?" on={draft.waterAccess} onChange={(v) => set({ waterAccess: v })} />
        <Toggle label="Outlet access?" on={draft.outletAccess} onChange={(v) => set({ outletAccess: v })} />
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
              step and we&apos;ll text you a time (PRD §5.1 R2 fallback).
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

function Toggle({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`flex items-center justify-between rounded-[var(--radius-md)] border px-4 py-3 text-sm ${
        on ? "border-accent bg-accent/10" : "border-border bg-surface"
      }`}
    >
      {label}
      <span className="font-bold">{on ? "Yes" : "No"}</span>
    </button>
  );
}

// STEP 4 --------------------------------------------------------------------
function StepConfirm({
  draft,
  set,
  service,
  basePrice,
  addons,
  total,
  onBack,
}: {
  draft: Draft;
  set: (p: Partial<Draft>) => void;
  service: Service;
  basePrice: number;
  addons: Addon[];
  total: number;
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
          tier: draft.tier,
          addonIds: draft.addonIds,
          slotStart: draft.slotStart,
          address: draft.address,
          waterAccess: draft.waterAccess,
          outletAccess: draft.outletAccess,
          customer: { name: draft.name, phone: draft.phone, email: draft.email },
          vehicle: {
            year: draft.year ? Number(draft.year) : undefined,
            make: draft.make || undefined,
            model: draft.model || undefined,
          },
          notes: draft.notes,
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
          You&apos;re booked!
        </h1>
        <p className="mt-2 text-muted">
          Confirmation ref <span className="font-mono text-ink">{done.ref}</span>.
          We&apos;ll text and email you the details.
        </p>
        <a href="/" className="tap mt-6 inline-flex rounded-[var(--radius-md)] bg-accent px-6 font-bold text-white">
          Done
        </a>
      </section>
    );
  }

  const slot = draft.slotStart ? new Date(draft.slotStart) : null;

  return (
    <section>
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold">
        Your details
      </h1>
      <div className="mt-4 grid gap-2">
        <input className="input" placeholder="Full name" value={draft.name} onChange={(e) => set({ name: e.target.value })} />
        <input className="input" placeholder="Mobile number" inputMode="tel" value={draft.phone} onChange={(e) => set({ phone: e.target.value })} />
        <input className="input" placeholder="Email (optional)" inputMode="email" value={draft.email} onChange={(e) => set({ email: e.target.value })} />
        <textarea className="input min-h-20" placeholder="Anything we should know? (optional)" value={draft.notes} onChange={(e) => set({ notes: e.target.value })} />
      </div>

      {/* Summary card */}
      <div className="mt-5 rounded-[var(--radius-md)] border border-border bg-surface p-4 text-sm">
        <Row label={service.name} value={money(basePrice)} />
        {addons.map((a) => (
          <Row key={a.id} label={a.name} value={`+${money(a.price)}`} muted />
        ))}
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
              : "—"
          }
        />
        <Row label="Where" value={draft.address || "—"} />
        <div className="my-2 border-t border-border" />
        <Row label="Total" value={money(total)} bold />
        <p className="mt-1 text-xs text-muted">Paid in person. No deposit required.</p>
      </div>

      {error && (
        <p className="mt-3 rounded-[var(--radius-sm)] border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <BackBtn onClick={onBack} />
        <PrimaryBtn onClick={submit} disabled={!canSubmit || submitting}>
          {submitting ? "Booking…" : "Confirm booking"}
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
    <div className={`flex items-center justify-between py-0.5 ${muted ? "text-muted" : ""}`}>
      <span className={bold ? "font-bold" : ""}>{label}</span>
      <span className={bold ? "font-[family-name:var(--font-display)] text-lg font-extrabold" : ""}>
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
