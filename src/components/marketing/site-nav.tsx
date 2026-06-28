import Link from "next/link";
import Image from "next/image";

export function SiteNav() {
  return (
    <nav className="absolute left-0 right-0 top-0 z-50 md:fixed">
      <div className="flex items-start justify-between px-4 md:px-8 lg:px-14" style={{ paddingTop: 32, paddingBottom: 20 }}>
        <Link href="/">
          <Image
            src="/img-lp/logo-superbar.svg"
            alt="Superbar"
            width={84}
            height={84}
            className="opacity-90"
          />
        </Link>
        <span
          className="text-white"
          style={{ fontFamily: "var(--font-sans)", fontWeight: 400, fontSize: 12 }}
        >
          Superbar Intelligence
        </span>
      </div>
    </nav>
  );
}
