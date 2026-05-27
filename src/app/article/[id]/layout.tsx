import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";

interface LayoutProps {
  children: React.ReactNode;
  params: { id: string };
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const fallbackTitle = "Article · Limelight";
  const fallbackDescription = "Read this story in context on Limelight, the global news intensity map.";

  try {
    const { data } = await supabase
      .from("articles")
      .select("title")
      .eq("id", params.id)
      .single();

    const title = data?.title ? `${data.title} · Limelight` : fallbackTitle;

    return {
      title,
      description: fallbackDescription,
      openGraph: {
        title,
        description: fallbackDescription,
        type: "article",
      },
      twitter: {
        card: "summary",
        title,
        description: fallbackDescription,
      },
    };
  } catch {
    return {
      title: fallbackTitle,
      description: fallbackDescription,
    };
  }
}

export default function ArticleLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
