// Brand + company facts in one place. Every value here is a placeholder:
// replace with the client's real name, figures and certifications before launch.

export const site = {
  brand: 'Arcwind',
  brandZh: '精绕科技',
  legalName: 'Arcwind Precision Coil Co., Ltd.',
  legalNameZh: '精绕精密线圈有限公司',
  url: process.env.SITE_URL || 'https://www.arcwind.example',
  email: 'sales@arcwind.example',
  engineeringEmail: 'engineering@arcwind.example',
  phone: '+86 769 0000 0000',
  whatsapp: '+86 138 0000 0000',
  founded: 2021,
  address: {
    en: 'Songshan Lake Hi-tech Zone, Dongguan, Guangdong, China',
    zh: '中国广东省东莞市松山湖高新技术产业开发区',
  },
  // One workshop. (Location kept as a placeholder until confirmed.)
  plants: [
    { en: 'Dongguan, China — workshop and engineering: VCM, air-core, bobbin and wireless charging coils, linear motors and chargers', zh: '中国东莞 — 生产车间与工程团队：VCM、空心、骨架与无线充电线圈，线性马达与充电器' },
  ],
  // Headline facts used across the site, in JSON-LD and in llms.txt.
  facts: {
    vcmShare: '≈10%',
    monthlyCoils: '20M',
    windingMachines: '50+',
    supportMachines: '30+',
    employees: '90+',
    floorArea: '1,800',
    minWire: '0.012',
  },
  certifications: [
    { code: 'ISO 9001', en: 'Quality management system', zh: '质量管理体系' },
    { code: 'RoHS', en: 'RoHS-compliant materials', zh: '材料符合 RoHS 要求' },
  ],
};

export type Locale = 'en' | 'zh';
export const locales: Locale[] = ['en', 'zh'];
export const isLocale = (l: string): l is Locale => (locales as string[]).includes(l);
