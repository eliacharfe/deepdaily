// apps/web/components/navbar-brand.tsx

"use client";

import Image from "next/image";
import Link from "next/link";

export default function NavbarBrand() {
    return (
        <Link
            href="/"
            className="flex items-center gap-3 rounded-full px-2 py-1 transition hover:bg-white/5"
        >
            <div className="relative h-10 w-10 overflow-hidden rounded-full ring-1 ring-white/10">
                <Image
                    src="/deepdaily-logo.png"
                    alt="DeepDaily"
                    fill
                    className="object-cover"
                    sizes="40px"
                    priority
                />
            </div>

            <div className="hidden sm:block">
                <p className="text-sm font-semibold tracking-[0.18em] text-teal-300">
                    DEEPDAILY
                </p>
            </div>
        </Link>
    );
}