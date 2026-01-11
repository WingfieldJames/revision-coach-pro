import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
}

const BASE_URL = 'https://astarai.co.uk';
const DEFAULT_IMAGE = `${BASE_URL}/lovable-uploads/fa6e3eef-a0ca-4e4b-ae8e-a54b14afc7f9.png`;

export const SEOHead = ({
  title = "A* AI – the AI BUILT for your exam board. A-Level Economics, Computer Science, Physics & more",
  description = "Join 1000+ students using A* AI for A-Level revision. Economics (Edexcel, AQA, CIE), Computer Science (OCR) & Physics (OCR). Trained on past papers (2017-2025). Free to try.",
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
