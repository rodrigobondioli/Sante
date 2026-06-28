import Link from "next/link";
import Image from "next/image";

export function SiteNav() {
  return (
    <nav className="relative md:fixed md:left-0 md:right-0 md:top-0 md:z-50">
      <div className="flex items-center justify-between px-4 py-6 md:px-8 lg:px-14">
        <Link href="/">
          <Image
            src="/img-lp/logo-superbar.svg"
            alt="Superbar"
            width={48}
            height={48}
            className="opacity-90"
          />
        </Link>
        <span
          className="text-xs font-bold uppercase tracking-[0.22em] text-white"
          style={{ fontFamily: "var(--font-roboto-mono)" }}
        >
          Superbar Intelligence
        </span>
      </div>
    </nav>
  );
}
