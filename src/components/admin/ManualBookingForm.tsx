"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { VEHICLE_TIERS, type Service, type VehicleTier } from "@/lib/types";

export default function ManualBookingForm() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [tier, setTier] = useState<VehicleTier>("mid_suv");
  const [start, setStart] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("confirmed");
  const [source, setSource] = useState("phone");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((d) => {
        setServices(d.services ?? []);
        if (d.services?.[0]) setServiceId(d.services[0].id);
      })
      .catch(() => {});
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          tier,
          start: new Date(start).toISOString(),
          address,
          status,
          source,
          customer: { name, phone, email },
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      router.push(`/admin/bookings/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setBusy(false);
    }
  };

  const input =
    "w-full rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2 text-sm";

  return (
    <form onSubmit={submit} className="grid gap-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          <span className="text-muted">Service</span>
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className={`mt-1 ${input}`}
            required
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="text-muted">Vehicle</span>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as VehicleTier)}
            className={`mt-1 ${input}`}
          >
            {VEHICLE_TIERS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="text-sm">
        <span className="text-muted">Date & time</span>
        <input
          type="datetime-local"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className={`mt-1 ${input}`}
          required
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <input className={input} placeholder="Customer name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className={input} placeholder="Mobile" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      </div>
      <input className={input} placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className={input} placeholder="Service address" value={address} onChange={(e) => setAddress(e.target.value)} required />

      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          <span className="text-muted">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={`mt-1 ${input}`}>
            <option value="confirmed">Confirmed</option>
            <option value="requested">Requested</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="text-muted">Source</span>
          <select value={source} onChange={(e) => setSource(e.target.value)} className={`mt-1 ${input}`}>
            <option value="phone">Phone</option>
            <option value="instagram">Instagram</option>
            <option value="manual">Manual</option>
            <option value="referral">Referral</option>
          </select>
        </label>
      </div>

      <textarea className={`${input} min-h-16`} placeholder="Internal notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="tap rounded-[var(--radius-md)] bg-accent px-5 font-bold text-white disabled:opacity-50"
      >
        {busy ? "Creating…" : "Create booking"}
      </button>
      <p className="text-xs text-muted">
        Confirmed bookings that overlap an existing job are rejected — pick a
        clear time.
      </p>
    </form>
  );
}
