import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
}

export default function SEOHead({
  title = "Hup - The Social App",
  description = "Join Hup to discover local mixers, value-based matching, and authentic real-world connections.",
  keywords = "social networking, community, local events, value-based matching, social app, Hup",
  ogImage = "https://hup.social/og-image.png",
  ogType = "website",
  canonicalUrl,
  noIndex = false,
}: SEOHeadProps) {
  const siteUrl = "https://hup.social";
  const fullOgImage = ogImage.startsWith("http") ? ogImage : `${siteUrl}${ogImage}`;
  const fullCanonical = canonicalUrl ? `${siteUrl}${canonicalUrl}` : undefined;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Canonical */}
      {fullCanonical && <link rel="canonical" href={fullCanonical} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonical || siteUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:site_name" content="Hup" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullCanonical || siteUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={fullOgImage} />

      {/* Additional SEO Tags */}
      <meta name="author" content="Hup" />
      <meta name="theme-color" content="#6366f1" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

      <meta name="apple-mobile-web-app-title" content="Hup" />
    </Helmet>
  );
}
