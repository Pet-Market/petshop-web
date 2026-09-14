import { Helmet, HelmetProvider } from 'react-helmet-async'

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://petshop.uz'
const SITE_NAME = 'PetShop'

interface SeoProps {
  title: string
  description: string
  path: string
  type?: 'website' | 'article' | 'product' | 'profile'
  image?: string
  noindex?: boolean
}

export function Seo({
  title,
  description,
  path,
  type = 'website',
  image,
  noindex = false,
}: SeoProps) {
  const canonical = `${SITE_URL}${path}`
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      {image ? <meta property="og:image" content={image} /> : null}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image ? <meta name="twitter:image" content={image} /> : null}
    </Helmet>
  )
}

export { HelmetProvider }