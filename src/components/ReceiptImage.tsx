import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ReceiptImageProps {
  src: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
}

// Regenerates a signed URL when the stored URL is an old public-bucket URL
// (uploaded before the bucket was made private)
async function ensureSignedUrl(url: string): Promise<string> {
  if (url.includes("/object/sign/") || url.includes("token=")) return url;

  const match = url.match(/\/object\/public\/receipts\/(.+)$/);
  if (!match) return url;

  const path = match[1];
  const { data } = await supabase.storage
    .from("receipts")
    .createSignedUrl(path, 60 * 60 * 24 * 365);

  return data?.signedUrl ?? url;
}

export function ReceiptImage({ src, alt = "Kvittering", className, onClick }: ReceiptImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    ensureSignedUrl(src).then(setResolvedSrc);
  }, [src]);

  if (failed) return null;

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      onClick={onClick}
      onError={() => setFailed(true)}
    />
  );
}
