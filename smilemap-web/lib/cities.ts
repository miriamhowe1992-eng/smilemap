// /lib/cities.ts
export type CityInfo = { slug: string; name: string; intro: string };

export const cities: CityInfo[] = [
  {
    slug: "london",
    name: "London",
    intro:
      "Find NHS and private dentists across Greater London. Availability updates and quick contact.",
  },
  {
    slug: "bristol",
    name: "Bristol",
    intro:
      "Bristol practices with NHS status indicators. Request an appointment in minutes.",
  },
  {
    slug: "manchester",
    name: "Manchester",
    intro:
      "Manchester city centre and suburbs. Compare practices and NHS availability.",
  },
];

export function getCity(slug: string) {
  return cities.find((c) => c.slug === slug);
}
