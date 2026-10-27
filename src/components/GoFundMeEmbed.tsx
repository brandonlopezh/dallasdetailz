"use client";

import { useEffect, useRef, useState } from "react";

interface GoFundMeEmbedProps {
  url: string;
  title: string;
}

// GoFundMe's embed.js only builds its iframe on DOMContentLoaded, which has
// already fired by the time Next hydrates, so we render the iframe directly
// and mirror its resize handshake.
export default function GoFundMeEmbed({ url, title }: GoFundMeEmbedProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(500);
  const [src, setSrc] = useState<string>();

  useEffect(() => {
    const parsed = new URL(url);
    parsed.searchParams.set("utm_content", window.location.hostname || "none");
    parsed.searchParams.set("utm_medium", "referral");
    parsed.searchParams.set("utm_source", "widget");
    setSrc(parsed.toString());
  }, [url]);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.source !== frameRef.current?.contentWindow) return;
      if (e.data?.type === "gfm-embed-widget-resize" && typeof e.data.offsetHeight === "number") {
        setHeight(e.data.offsetHeight);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <iframe
      ref={frameRef}
      src={src}
      title={title}
      width="100%"
      height={height}
      scrolling="no"
      loading="lazy"
      className="block border-0"
    />
  );
}
