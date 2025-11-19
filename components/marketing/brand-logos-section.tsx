"use client";

import Image from "next/image";
import Link from "next/link";
import { brandToUrl } from "@/lib/brands";

const brandLogos = [
  { name: "Bürstner", src: "/buerstern-wohnmobile-logo.jpg" },
  { name: "Carado", src: "/carado-wohnmobile-mieten-logo.jpg" },
  { name: "Carthago", src: "/carthago-reisemobile-logo.jpg" },
  { name: "Dethleffs", src: "/dethleffs-reisemobile-logo.jpg" },
  { name: "Forster", src: "/forster-wohnmobile-mieten.jpg" },
  { name: "Hymer", src: "/hymer-reisemobile.jpg" },
  { name: "Knaus", src: "/knaus-wohnmobile-mieten.jpg" },
  { name: "Malibu", src: "/malibu-wohnmobile-logo.jpg" },
  { name: "Mobilvetta", src: "/mobilvetta-wohnmobile-mieten.jpg" },
  { name: "Poessl", src: "/poessl-reisemobil-logo.jpg" },
  { name: "Sunlight", src: "/sunlight-wohnmobile-mieten.jpg" },
  { name: "Weinsberg", src: "/weinsberg-wohnmobile-mieten.jpg" },
];

// Dupliziere die Logos für nahtloses Scrolling
const duplicatedLogos = [...brandLogos, ...brandLogos];

export function BrandLogosSection() {
  return (
    <section className="border-t bg-muted/30 py-7">
      <div className="container mx-auto px-4">
        <div className="overflow-hidden">
          <div className="flex gap-8 items-center animate-scroll-logos w-fit">
            {duplicatedLogos.map((brand, index) => (
              <Link
                key={`${brand.name}-${index}`}
                href={`/wohnmobile/${brandToUrl(brand.name)}`}
                className="flex items-center justify-center h-24 flex-shrink-0 transition-all duration-300 opacity-80 hover:opacity-100 cursor-pointer"
                style={{ width: "200px" }}
              >
                <Image
                  src={brand.src}
                  alt={brand.name}
                  width={180}
                  height={90}
                  className="object-contain max-h-24 w-auto"
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

