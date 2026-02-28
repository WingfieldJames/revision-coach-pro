import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
}

const BASE_URL = 'https://astarai.co.uk';
const DEFAULT_IMAGE = `${BASE_URL}/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png`;

export const SEOHead = ({
  title = "A* AI - the AI that actually understands your exam board",
  description = "Join 2000+ students using A* AI for A-Level revision. Economics, Maths, Physics, Chemistry, Computer Science & more. Trained on past papers & mark schemes.",
  canonical = BASE_URL,
  ogImage = DEFAULT_IMAGE,
}: SEOHeadProps) => {
  // Ensure canonical URL is absolute
  const fullCanonical = canonical.startsWith('http') ? canonical : `${BASE_URL}${canonical}`;
  
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <link rel="canonical" href={fullCanonical} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullCanonical} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
};
