import type { Metadata } from "next";

interface LayoutProps {
  children: React.ReactNode;
  params: { city: string };
}

export async function generateMetadata({
  params,
}: {
  params: { city: string };
}): Promise<Metadata> {
  const city = decodeURIComponent(params.city);
  const title = `${city} · Limelight`;
  const description = `News coverage intensity and top stories for ${city}. See how loudly the world is reporting from this city today.`;

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

export default function RegionLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
