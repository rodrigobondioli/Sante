import { SiteNav } from "@/components/marketing/site-nav";
import { SmoothScroll } from "@/components/marketing/smooth-scroll";
import { ComandaModalProvider } from "@/components/comanda-modal";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <ComandaModalProvider>
        <SmoothScroll />
        <SiteNav />
        <main>{children}</main>
      </ComandaModalProvider>
    </div>
  );
}
