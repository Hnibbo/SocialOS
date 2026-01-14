import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    type?: string;
    noindex?: boolean;
    structuredData?: Record<string, unknown> | object;
}

const DEFAULT_TITLE = "Hup – The Social OS";
const DEFAULT_DESCRIPTION = "The first AI-Native Social OS. Sovereign identity, viral connections, and real-world ascension. Join the HUP revolution.";
const DEFAULT_IMAGE = "/logo.png";
const SITE_URL = "https://hup.xyz";

export default function SEO({
    title,
    description = DEFAULT_DESCRIPTION,
    image = DEFAULT_IMAGE,
    type = "website",
    noindex = false,
    structuredData
}: SEOProps) {
    const location = useLocation();
    const canonicalUrl = `${SITE_URL}${location.pathname}`;
    const fullTitle = title ? `${title} | Hup` : DEFAULT_TITLE;

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={canonicalUrl} />
            {noindex && <meta name="robots" content="noindex, nofollow" />}

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:site_name" content="Hup" />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={canonicalUrl} />
            <meta property="twitter:title" content={fullTitle} />
            <meta property="twitter:description" content={description} />
            <meta property="twitter:image" content={image} />

            {/* Structured Data */}
            {structuredData && (
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            )}
        </Helmet>
    );
}
