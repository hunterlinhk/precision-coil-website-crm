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
    `> Precision coil manufacturer founded in ${site.founded}. Makes VCM (voice coil motor) coils, air-core coils, bobbin coils, wireless charging coils, linear motors and wireless chargers. About ${f.vcmShare.replace('≈', '')} of VCM coils shipped worldwide are wound in its workshop.`,
    '',
    '## Key facts',
    `- Capacity: about 20 million coils a month across all types`,
    `- Share of global VCM coil shipments: ${f.vcmShare}`,
    `- Workshop: ${f.floorArea} m², ${f.employees} employees`,
    `- Equipment: ${f.windingMachines} winding machines, mostly Nittoku machines imported from Japan; ${f.supportMachines} supporting machines for soldering, tray loading, visual inspection, automated assembly and quality testing`,
    `- Quality: ISO 9001 certified quality management system; RoHS-compliant materials`,
    `- Signature product: wireless charging receiver coils on nanocrystalline sheet, under 0.5 mm total thickness`,
    `- Services: OEM to drawing, ODM / co-design, custom coil winding, wireless charger modules`,
    `- Contact: ${site.email}, ${site.phone}`,
    '',
    '## Product families',
    ...cats.map((c) => `- [${c.name_en}](${site.url}/en/products/${c.slug}): ${c.summary_en}`),
    '',
    '## Products',
    ...products.map((p) => `- [${p.model} ${p.name_en}](${site.url}/en/products/${p.category_slug}/${p.slug}): ${p.summary_en} Specs: ${p.specs.map((s) => `${s.en} ${s.v}${s.u ? ' ' + s.u : ''}`).join('; ')}.`),
    '',
    '## Applications',
    ...applications.map((a) => `- [${a.name_en}](${site.url}/en/applications/${a.slug}): ${a.lead_en} Coils supplied: ${a.uses_en.join('; ')}.`),
    '',
    '## Articles',
    ...getArticles().map((a) => `- [${a.title_en}](${site.url}/en/resources/${a.slug}): ${(a as any).takeaways_en || a.excerpt_en}`),
    '',
    '## Pages',
    `- [Engineering and custom coils](${site.url}/en/engineering)`,
    `- [Manufacturing and quality](${site.url}/en/manufacturing)`,
    `- [Request a quote](${site.url}/en/contact)`,
    `- Chinese version: ${site.url}/zh`,
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
