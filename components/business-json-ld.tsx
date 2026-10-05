const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CafeOrCoffeeShop",
  name: "Bla Bla Cafe",
  url: siteUrl,
  image: `${siteUrl}/opengraph-image.jpg`,
  telephone: "+38978242666",
  priceRange: "60–800 ден.",
  servesCuisine: "Кафе",
  hasMenu: `${siteUrl}/menu`,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Маршал Тито 146",
    addressLocality: "Струмица",
    postalCode: "2400",
    addressCountry: "MK",
  },
  geo: { "@type": "GeoCoordinates", latitude: 41.4306103, longitude: 22.6447168 },
  // Closing before opening means the café closes after midnight.
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "08:00",
    closes: "01:00",
  },
  sameAs: ["https://www.instagram.com/blablacafe14/"],
};

export function BusinessJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
    />
  );
}
