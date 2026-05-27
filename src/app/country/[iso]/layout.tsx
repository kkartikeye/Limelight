import type { Metadata } from "next";
import { countryName } from "@/lib/utils/countries";

interface LayoutProps {
  children: React.ReactNode;
  params: { iso: string };
}

export async function generateMetadata({ params }: { params: { iso: string } }): Promise<Metadata> {
  const name = countryName(params.iso);
  const title = `${name} · Limelight`;
  const description = `Coverage intensity and top headlines for ${name}. See how loudly the world is reporting from this country today.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default function CountryLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
