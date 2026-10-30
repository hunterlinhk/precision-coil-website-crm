import { site } from '@/lib/site';
import { getCategories, getProducts, getArticles } from '@/lib/content';
import { applications } from '@/lib/applications';

export const dynamic = 'force-dynamic';

// llms.txt: a plain-text summary that AI assistants can read and cite.
export function GET() {
  const f = site.facts;
  const cats = getCategories();
  const products = getProducts();
  const lines = [
    `# ${site.legalName} (${site.brand}, ${site.brandZh})`,
    '',
    `> Precision coil manufacturer founded in ${site.founded}. Makes VCM (voice coil motor) coils, air-core coils, bobbin coils, wireless charging coils, linear motors and wireless chargers. About ${f.vcmShare.replace('≈', '')} of VCM coils shipped worldwide are wound on its lines. Plants in Dongguan, China and Bắc Ninh, Vietnam.`,
    '',
    '## Key facts',
    `- Annual output: ${f.annualCoils} coils`,
    `- Share of global VCM coil shipments: ${f.vcmShare}`,
    `- Automatic winding lines: ${f.windingLines}`,
    `- Finest wire wound in production: ${f.minWire} mm`,
    `- Outgoing quality: ${f.ppm} ppm; on-time delivery ${f.onTimeDelivery}`,
    `- Certifications: ${site.certifications.map((c) => c.code).join(', ')}`,
    `- Services: OEM to drawing, ODM / co-design, custom coil winding, Qi2 charger modules`,
    `- Contact: ${site.email}, ${site.phone}`,
    '',
    '## Product families',
    ...cats.map((c) => `- [${c.name_en}](${site.url}/en/products/${c.slug}): ${c.summary_en}`),
    '',
    '## Products',
    ...products.map((p) => `- [${p.model} ${p.name_en}](${site.url}/en/products/${p.category_slug}/${p.slug}): ${p.summary_en} Specs: ${p.specs.map((s) => `${s.en} ${s.v}${s.u ? ' ' + s.u : ''}`).join('; ')}.`),
    '',
    '## Applications',
    ...applications.map((a) => `- [${a.name_en}](${site.url}/en/applications/${a.slug}): ${a.lead_en}`),
    '',
    '## Technical notes and case studies',
    ...getArticles().map((a) => `- [${a.title_en}](${site.url}/en/resources/${a.slug}): ${a.excerpt_en}`),
    '',
    '## Pages',
    `- [Engineering and custom coils](${site.url}/en/engineering)`,
    `- [Manufacturing and quality](${site.url}/en/manufacturing)`,
    `- [Request a quote](${site.url}/en/contact)`,
    `- Chinese version: ${site.url}/zh`,
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
