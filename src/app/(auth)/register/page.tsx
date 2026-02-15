"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="text-center">
      <p className="font-inconsolata text-muted-foreground">
        Redirecting to sign in...
      </p>
      <Link href="/login" className="font-inconsolata text-sm text-foreground underline mt-4 inline-block">
        Go to sign in
      </Link>
    </div>
  );
}
