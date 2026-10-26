"use client";

import Sheet, { BigButton } from "./Sheet";

/** The customer's number with Call / Text, for after a decline, cancel or new-time offer. */
export default function ContactSheet({
  title,
  hint,
  name,
  phone,
  smsBody,
  onClose,
}: {
  title: string;
  hint: string;
  name: string;
  phone: string;
  smsBody: string;
  onClose: () => void;
}) {
  const dial = phone.replace(/[^\d+]/g, "");
  return (
    <Sheet title={title} onClose={onClose}>
      <div className="text-center">
        <p className="mt-1 text-sm text-muted">{hint}</p>
        <p className="mt-5 text-sm text-muted">{name}</p>
        <p className="break-all font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-wide">
          {phone || "No number on file"}
        </p>
      </div>
      {phone && (
        <div className="mt-5 grid grid-cols-2 gap-2">
          <BigButton href={`tel:${dial}`} tone="primary">
            <span aria-hidden="true">📞</span> Call
          </BigButton>
          <BigButton href={`sms:${dial}?&body=${encodeURIComponent(smsBody)}`} tone="primary">
            <span aria-hidden="true">💬</span> Text
          </BigButton>
        </div>
      )}
      <div className="mt-2">
        <BigButton onClick={onClose}>Done</BigButton>
      </div>
    </Sheet>
  );
}
