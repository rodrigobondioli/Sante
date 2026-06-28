import localFont from "next/font/local";
import { Roboto_Mono } from "next/font/google";
import { SiteNav } from "@/components/marketing/site-nav";
import { SmoothScroll } from "@/components/marketing/smooth-scroll";
import { ComandaModalProvider } from "@/components/comanda-modal";

const maxiRound = localFont({
  src: "../../../public/fonts/Maxi/ABC Maxi Round Plus Variable/ABCMaxiRoundPlusVariableTrial.ttf",
  variable: "--font-display",
  weight: "100 900",
  display: "swap",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-roboto-mono",
});

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${maxiRound.variable} ${robotoMono.variable}`}>
      <ComandaModalProvider>
        <SmoothScroll />
        <SiteNav />
        <main>{children}</main>
      </ComandaModalProvider>
    </div>
  );
}
