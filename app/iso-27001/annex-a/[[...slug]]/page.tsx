import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  AnnexAControlPage,
  AnnexAIndexPage,
  AnnexAThemePage,
} from "@/components/public-iso27001/public-annex";
import { getAnnexControlRoutes, getAnnexThemeRoutes, getPublicAnnexPageData, publicAnnexControls, publicAnnexThemes } from "@/content/public-iso27001";

type Params = { slug?: string[] };

export function generateStaticParams() {
  return [
    { slug: [] },
    ...getAnnexThemeRoutes().map((theme) => ({ slug: [theme.slug] })),
    ...getAnnexControlRoutes().map((control) => ({ slug: [control.slug] })),
  ];
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const resolvedParams = await params;
  const page = getPublicAnnexPageData(resolvedParams.slug);
  if (page.kind === "index") {
    return {
      title: "ISO 27001 Annex A Controls | NormCore",
      description:
        "Explore the 93 ISO/IEC 27001:2022 Annex A controls across four themes and understand what each control addresses, why it matters, and the practical areas organisations should consider.",
      alternates: { canonical: "/iso-27001/annex-a" },
      openGraph: {
        title: "ISO 27001 Annex A Controls | NormCore",
        description:
          "Explore the 93 ISO/IEC 27001:2022 Annex A controls across four themes and understand what each control addresses, why it matters, and the practical areas organisations should consider.",
        url: "/iso-27001/annex-a",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: "ISO 27001 Annex A Controls | NormCore",
        description:
          "Explore the 93 ISO/IEC 27001:2022 Annex A controls across four themes and understand what each control addresses, why it matters, and the practical areas organisations should consider.",
      },
    };
  }

  if (page.kind === "theme") {
    const theme = publicAnnexThemes.find((item) => item.slug === page.themeSlug);
    return {
      title: `${theme?.title ?? "Theme"} | ISO 27001 Annex A | NormCore`,
      description: theme?.description,
      alternates: { canonical: `/iso-27001/annex-a/${page.themeSlug}` },
      openGraph: {
        title: `${theme?.title ?? "Theme"} | ISO 27001 Annex A | NormCore`,
        description: theme?.description,
        url: `/iso-27001/annex-a/${page.themeSlug}`,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${theme?.title ?? "Theme"} | ISO 27001 Annex A | NormCore`,
        description: theme?.description,
      },
    };
  }

  if (page.kind === "control") {
    const control = publicAnnexControls.find((item) => item.slug === page.controlSlug);
    return {
      title: `${control?.code ?? "Control"} ${control?.title ?? ""} | NormCore`,
      description: control?.shortDescription,
      alternates: { canonical: `/iso-27001/annex-a/${page.controlSlug}` },
      openGraph: {
        title: `${control?.code ?? "Control"} ${control?.title ?? ""} | NormCore`,
        description: control?.shortDescription,
        url: `/iso-27001/annex-a/${page.controlSlug}`,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${control?.code ?? "Control"} ${control?.title ?? ""} | NormCore`,
        description: control?.shortDescription,
      },
    };
  }

  return { title: "ISO 27001 Annex A | NormCore" };
}

export default async function AnnexAPage({ params }: { params: Promise<Params> }) {
  const resolvedParams = await params;
  const page = getPublicAnnexPageData(resolvedParams.slug);
  if (page.kind === "index") return <AnnexAIndexPage />;
  if (page.kind === "theme") return <AnnexAThemePage themeSlug={page.themeSlug} />;
  if (page.kind === "control") return <AnnexAControlPage controlSlug={page.controlSlug} />;
  notFound();
}
