"use client";

import { useBookingModal } from "./BookingModal";

interface BookNowLinkProps {
  serviceId?: string;
  className?: string;
  children: React.ReactNode;
  "aria-label"?: string;
}

/**
 * Every "Book Now" CTA on the public site routes through here: it opens the
 * request form popup (see BookingModal), optionally preselecting a service.
 */
export default function BookNowLink({
  serviceId,
  className,
  children,
  ...rest
}: BookNowLinkProps) {
  const { open } = useBookingModal();
  return (
    <button type="button" className={className} onClick={() => open(serviceId)} {...rest}>
      {children}
    </button>
  );
}
