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
  founded: 2006,
  address: {
    en: 'Songshan Lake Hi-tech Zone, Dongguan, Guangdong, China',
    zh: '中国广东省东莞市松山湖高新技术产业开发区',
  },
  plants: [
    { en: 'Dongguan, China — HQ, R&D, VCM and wireless charging coils', zh: '中国东莞 — 总部、研发中心、VCM 与无线充电线圈' },
    { en: 'Bắc Ninh, Vietnam — air-core, bobbin coils and linear motors', zh: '越南北宁 — 空心线圈、骨架线圈与线性马达' },
  ],
  // Headline facts used across the site, in JSON-LD and in llms.txt.
  facts: {
    vcmShare: '≈10%',
    annualCoils: '600M+',
    windingLines: '180',
    minWire: '0.012',
    engineers: '85',
    floorArea: '42,000',
    onTimeDelivery: '98.6%',
    ppm: '< 30',
  },
  certifications: [
    { code: 'IATF 16949', en: 'Automotive quality management', zh: '汽车行业质量管理体系' },
    { code: 'ISO 9001', en: 'Quality management', zh: '质量管理体系' },
    { code: 'ISO 14001', en: 'Environmental management', zh: '环境管理体系' },
    { code: 'ISO 45001', en: 'Occupational health & safety', zh: '职业健康安全管理体系' },
    { code: 'Qi2 / WPC', en: 'Wireless Power Consortium member, Qi2 MPP coils', zh: '无线充电联盟成员，Qi2 MPP 线圈' },
    { code: 'RoHS · REACH', en: 'Material compliance on every part number', zh: '全部料号符合材料合规要求' },
  ],
};

export type Locale = 'en' | 'zh';
export const locales: Locale[] = ['en', 'zh'];
export const isLocale = (l: string): l is Locale => (locales as string[]).includes(l);
