import Link from "next/link";
import { BOOKING_FLOW_LIVE, INSTAGRAM_URL, bookHref } from "@/lib/site-config";

interface BookNowLinkProps {
  serviceId?: string;
  className?: string;
  children: React.ReactNode;
  "aria-label"?: string;
}

/**
 * Every "Book Now" CTA on the public site routes through here so the
 * BOOKING_FLOW_LIVE switch in site-config.ts only has to be flipped once.
 * Live: goes to /book (optionally pre-selecting a service). Not live: goes
 * to Instagram DMs in a new tab, since that's the flow people can actually
 * see and respond to right now.
 */
export default function BookNowLink({
  serviceId,
  className,
  children,
  ...rest
}: BookNowLinkProps) {
  if (!BOOKING_FLOW_LIVE) {
    return (
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        {...rest}
      >
        {children}
      </a>
    );
  }

  const href = bookHref(serviceId);
  return (
    <Link href={href} className={className} {...rest}>
      {children}
    </Link>
  );
}
