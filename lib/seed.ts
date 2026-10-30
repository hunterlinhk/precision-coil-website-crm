import type Database from 'better-sqlite3';
import { hashPassword } from './password';
import { categories, products } from './catalog-seed';
import { articles } from './articles-seed';

// Deterministic PRNG so every fresh install looks the same.
function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const r = rng(20261030);
const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
const weighted = <T,>(pairs: [T, number][]) => {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let x = r() * total;
  for (const [v, w] of pairs) { if ((x -= w) <= 0) return v; }
  return pairs[0][0];
};
const daysAgo = (d: number, h = 9 + Math.floor(r() * 9)) => {
  const t = new Date(Date.now() - d * 86400000);
  t.setUTCHours(h, Math.floor(r() * 60), 0, 0);
  return t.toISOString().slice(0, 19).replace('T', ' ');
};
const daysAhead = (d: number) => daysAgo(-d, 10);

export function seed(db: Database.Database) {
  const pw = hashPassword(process.env.ADMIN_PASSWORD || 'arcwind-demo');
  const tx = db.transaction(() => {
    // ---------- Users ----------
    const users = [
      ['Mei Chen', 'admin@arcwind.example', 'admin', ''],
      ['Daniel Wu', 'daniel.wu@arcwind.example', 'manager', ''],
      ['Kevin Zhang', 'kevin.zhang@arcwind.example', 'sales', 'CN,TW,HK,KR,JP'],
      ['Laura Martín', 'laura.martin@arcwind.example', 'sales', 'US,CA,MX,DE,FR,IT,ES,GB,NL,DK,SE,CH,PL'],
      ['Anh Nguyen', 'anh.nguyen@arcwind.example', 'sales', 'VN,TH,MY,SG,IN,ID,PH,AU'],
      ['Grace Liu', 'grace.liu@arcwind.example', 'editor', ''],
    ];
    const insUser = db.prepare('INSERT INTO users (name,email,password_hash,role,regions) VALUES (?,?,?,?,?)');
    users.forEach((u) => insUser.run(u[0], u[1], pw, u[2], u[3]));
    const repFor = (country: string) => (['CN', 'TW', 'HK', 'KR', 'JP'].includes(country) ? 3 : ['VN', 'TH', 'MY', 'SG', 'IN', 'ID', 'PH', 'AU'].includes(country) ? 5 : 4);

    // ---------- Catalogue ----------
    const insCat = db.prepare('INSERT INTO categories (slug,sort,name_en,name_zh,short_en,short_zh,summary_en,summary_zh,shape) VALUES (@slug,@sort,@name_en,@name_zh,@short_en,@short_zh,@summary_en,@summary_zh,@shape)');
    const catId: Record<string, number> = {};
    categories.forEach((c) => { catId[c.slug] = Number(insCat.run(c).lastInsertRowid); });

    const insProd = db.prepare(`INSERT INTO products (slug,category_id,model,name_en,name_zh,summary_en,summary_zh,body_en,body_zh,custom_en,custom_zh,specs,params,dims,applications,status,featured,sort,seo_title_en,seo_title_zh,seo_desc_en,seo_desc_zh,created_at,updated_at,published_at)
      VALUES (@slug,@category_id,@model,@name_en,@name_zh,@summary_en,@summary_zh,@body_en,@body_zh,@custom_en,@custom_zh,@specs,@params,@dims,@applications,@status,@featured,@sort,@seo_title_en,@seo_title_zh,@seo_desc_en,@seo_desc_zh,@created_at,@updated_at,@published_at)`);
    products.forEach((p, i) => {
      const at = daysAgo(200 - i * 7);
      insProd.run({
        slug: p.slug, category_id: catId[p.cat], model: p.model, name_en: p.name_en, name_zh: p.name_zh,
        summary_en: p.summary_en, summary_zh: p.summary_zh, body_en: p.body_en, body_zh: p.body_zh,
        custom_en: p.custom_en, custom_zh: p.custom_zh, specs: JSON.stringify(p.specs), params: JSON.stringify(p.params),
        dims: JSON.stringify(p.dims), applications: JSON.stringify(p.applications),
        status: p.slug === 'aw-ch-st3' ? 'draft' : 'published', featured: (p as any).featured || 0, sort: i,
        seo_title_en: `${p.model} ${p.name_en}`, seo_title_zh: `${p.model} ${p.name_zh}`,
        seo_desc_en: p.summary_en, seo_desc_zh: p.summary_zh,
        created_at: at, updated_at: at, published_at: p.slug === 'aw-ch-st3' ? null : at,
      });
    });

    const insArt = db.prepare(`INSERT INTO articles (slug,type,title_en,title_zh,excerpt_en,excerpt_zh,body_en,body_zh,products,applications,reading_min,status,seo_title_en,seo_title_zh,seo_desc_en,seo_desc_zh,created_at,updated_at,published_at)
      VALUES (@slug,@type,@title_en,@title_zh,@excerpt_en,@excerpt_zh,@body_en,@body_zh,@products,@applications,@reading_min,'published',@title_en,@title_zh,@excerpt_en,@excerpt_zh,@at,@at,@at)`);
    articles.forEach((a) => insArt.run({ ...a, products: JSON.stringify(a.products), applications: JSON.stringify(a.applications), at: daysAgo(a.days) }));

    // ---------- Accounts & contacts ----------
    const accounts = [
      ['Lumora Optics', 'lumora-optics.example', 'TW', 'Camera modules', 'customer', 'Trade show', '40M coils / yr'],
      ['Kaiyo Imaging', 'kaiyo-imaging.example', 'JP', 'Camera modules', 'customer', 'Referral', '18M coils / yr'],
      ['Brightlane Mobile', 'brightlane.example', 'US', 'Smartphones', 'prospect', 'AI search', '6M units / yr'],
      ['Vossberg Sensorik GmbH', 'vossberg.example', 'DE', 'Automotive sensors', 'customer', 'Google organic', '3.5M coils / yr'],
      ['Nordhaven Audio', 'nordhaven.example', 'DK', 'Consumer audio', 'prospect', 'LinkedIn', '1.2M units / yr'],
      ['Pulseform Wearables', 'pulseform.example', 'US', 'Wearables', 'customer', 'Google organic', '2M units / yr'],
      ['Hanbit Mobility', 'hanbit-mobility.example', 'KR', 'Automotive', 'prospect', 'Trade show', '800k units / yr'],
      ['Corelink Charging', 'corelink.example', 'US', 'Consumer electronics brand', 'prospect', 'AI search', '500k units / yr'],
      ['Meridian Fluid Systems', 'meridian-fluid.example', 'IT', 'Industrial valves', 'customer', 'Referral', '900k coils / yr'],
      ['Auralis Hearing', 'auralis.example', 'CH', 'Medical devices', 'prospect', 'Google organic', '300k units / yr'],
      ['Qiyu Electronics', 'qiyu-elec.example', 'CN', 'Wireless chargers', 'customer', 'Baidu', '1.5M units / yr'],
      ['Sundaram Auto Components', 'sundaram-auto.example', 'IN', 'Automotive', 'prospect', 'LinkedIn', '1M coils / yr'],
      ['Velo Interactive', 'velo-interactive.example', 'SE', 'Gaming hardware', 'prospect', 'AI search', '700k units / yr'],
      ['Tân Phát Electronics', 'tanphat.example', 'VN', 'EMS', 'partner', 'Direct', '—'],
    ];
    const contacts: Record<number, [string, string][]> = {
      1: [['Jason Lin', 'Sourcing manager'], ['Yvonne Tsai', 'Actuator engineer']],
      2: [['Haruto Sato', 'Purchasing'], ['Aiko Mori', 'Mechanical design lead']],
      3: [['Rachel Kim', 'Camera hardware lead']],
      4: [['Jonas Weber', 'Commodity buyer'], ['Katrin Vogel', 'Supplier quality']],
      5: [['Mads Holm', 'Acoustic engineer']],
      6: [['Priya Raman', 'Hardware PM'], ['Tom Becker', 'Supply chain']],
      7: [['Minjun Park', 'Electrical engineer']],
      8: [['Alex Rivera', 'Founder']],
      9: [['Giulia Romano', 'Purchasing']],
      10: [['Lukas Meier', 'R&D engineer']],
      11: [['Wang Hao', '采购经理']],
      12: [['Arjun Mehta', 'Sourcing']],
      13: [['Elin Berg', 'Hardware engineer']],
      14: [['Trần Minh', 'Operations']],
    };
    const insAcc = db.prepare('INSERT INTO accounts (name,domain,country,industry,stage,source,owner_id,website,annual_volume,notes,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
    const insCon = db.prepare('INSERT INTO contacts (account_id,name,title,email,phone,messenger,created_at) VALUES (?,?,?,?,?,?,?)');
    accounts.forEach((a, i) => {
      const id = Number(insAcc.run(a[0], a[1], a[2], a[3], a[4], a[5], repFor(a[2]), `https://${a[1]}`, a[6], '', daysAgo(400 - i * 20)).lastInsertRowid);
      (contacts[id] || []).forEach(([n, t]) => {
        const email = n.toLowerCase().replace(/[^a-z ]/g, '').trim().replace(/\s+/, '.') + '@' + a[1];
        insCon.run(id, n, t, email.startsWith('@') ? `contact@${a[1]}` : email, '', '', daysAgo(380 - i * 20));
      });
    });

    // ---------- Opportunities ----------
    const opps: [number, string, string, number, string[], number][] = [
      [1, 'AF coil for 2027 main camera', 'won', 1240000, ['AW-VCM-AF0806'], 40],
      [1, 'Periscope coil, telephoto programme', 'negotiation', 420000, ['AW-VCM-PR1604'], -20],
      [2, 'OIS matched sets, Q1 build', 'quoted', 310000, ['AW-VCM-OIS1210'], -35],
      [3, 'Second-source VCM coils', 'sampling', 260000, ['AW-VCM-AF0806', 'AW-VCM-OIS1210'], -60],
      [4, 'Wheel-speed sensor coil, new platform', 'won', 185000, ['AW-BB-SN0812'], 70],
      [4, 'Relay coil cost-down', 'quoted', 64000, ['AW-BB-RL1612'], -25],
      [5, 'Micro-speaker voice coils', 'sampling', 48000, ['AW-AC-VC1200'], -50],
      [6, 'Coin LRA, next-gen band', 'negotiation', 220000, ['AW-LM-Z0825'], -15],
      [6, 'Charging coil for ring', 'qualifying', 36000, ['AW-WC-WR20'], -80],
      [7, 'In-cabin Qi2 module', 'qualifying', 150000, ['AW-WC-MPP50'], -95],
      [8, 'Qi2 magnetic charger, private label', 'quoted', 95000, ['AW-CH-Q2M15'], -30],
      [9, 'Solenoid coils IP67 range', 'won', 120000, ['AW-BB-SV2230'], 110],
      [10, 'Telecoil for BTE platform', 'sampling', 52000, ['AW-AC-TC0402'], -70],
      [11, 'MPP Tx coils, 2027 contract', 'negotiation', 380000, ['AW-WC-MPP50'], -10],
      [12, 'Sensor coils, two-wheeler ABS', 'lost', 70000, ['AW-BB-SN0812'], 20],
      [13, 'X-axis LRA for controller', 'qualifying', 88000, ['AW-LM-X0835'], -90],
      [2, 'AF coil price review', 'lost', 140000, ['AW-VCM-AF0806'], 45],
      [9, 'Valve coil, food-grade line', 'qualifying', 42000, ['AW-BB-SV2230'], -100],
    ];
    const insOpp = db.prepare('INSERT INTO opportunities (account_id,title,stage,value,products,owner_id,expected_close,lost_reason,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)');
    const insQuote = db.prepare('INSERT INTO quotes (number,account_id,opportunity_id,status,items,total,valid_until,owner_id,created_at) VALUES (?,?,?,?,?,?,?,?,?)');
    const insSample = db.prepare('INSERT INTO samples (account_id,opportunity_id,model,qty,status,courier,tracking,feedback,owner_id,requested_at,shipped_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
    let qn = 1;
    opps.forEach(([acc, title, stage, value, prods, closeOffset], i) => {
      const country = accounts[acc - 1][2];
      const owner = repFor(country);
      const created = daysAgo(Math.max(10, 120 - i * 5));
      const closeDate = closeOffset > 0 ? daysAgo(closeOffset) : daysAhead(-closeOffset);
      const oid = Number(insOpp.run(acc, title, stage, value, JSON.stringify(prods), owner, closeDate.slice(0, 10), stage === 'lost' ? (i % 2 ? 'Price' : 'Lead time') : null, created, daysAgo(Math.floor(r() * 10))).lastInsertRowid);
      if (['sampling', 'quoted', 'negotiation', 'won', 'lost'].includes(stage)) {
        const status = stage === 'sampling' ? pick(['in_production', 'shipped', 'requested']) : pick(['delivered', 'feedback']);
        insSample.run(acc, oid, prods[0], pick([10, 20, 50, 100]), status, status === 'requested' ? null : pick(['DHL', 'FedEx', 'SF Express']),
          status === 'requested' ? null : String(1000000000 + Math.floor(r() * 8999999999)),
          status === 'feedback' ? 'Dimensions and resistance within spec; approved for PPAP.' : null, owner, daysAgo(60 - i), status === 'requested' ? null : daysAgo(50 - i));
      }
      if (['quoted', 'negotiation', 'won', 'lost'].includes(stage)) {
        const qty = Math.round(value / 0.18 / 1000) * 1000;
        const unit = +(value / qty).toFixed(4);
        insQuote.run(`Q-2026-${String(qn++).padStart(4, '0')}`, acc, oid, stage === 'won' ? 'accepted' : stage === 'lost' ? 'rejected' : 'sent',
          JSON.stringify([{ model: prods[0], qty, unit }]), value, daysAhead(30).slice(0, 10), owner, daysAgo(30 - (i % 20)));
      }
    });
    // A draft quote, to show the workflow
    insQuote.run(`Q-2026-${String(qn++).padStart(4, '0')}`, 3, 4, 'draft', JSON.stringify([{ model: 'AW-VCM-AF0806', qty: 500000, unit: 0.168 }, { model: 'AW-VCM-OIS1210', qty: 500000, unit: 0.21 }]), 189000, daysAhead(30).slice(0, 10), 4, daysAgo(1));

    // ---------- Inquiries (12 weeks) ----------
    const people = [
      ['Emma Fischer', 'DE'], ['Noah Bennett', 'US'], ['Chloe Martin', 'FR'], ['Lucas Silva', 'BR'], ['Sakura Ito', 'JP'],
      ['Ji-woo Choi', 'KR'], ['Rohan Gupta', 'IN'], ['Olivia Brown', 'GB'], ['Mateo García', 'ES'], ['Liam Wilson', 'CA'],
      ['Chen Jie', 'CN'], ['Lin Yu-ting', 'TW'], ['Nguyen Thao', 'VN'], ['Isabella Rossi', 'IT'], ['Daan de Vries', 'NL'],
      ['Ethan Clarke', 'AU'], ['Siti Rahman', 'MY'], ['Hugo Larsson', 'SE'], ['Zofia Nowak', 'PL'], ['Ava Thompson', 'US'],
      ['Ming Zhou', 'CN'], ['Kenji Yamada', 'JP'], ['Mia Schneider', 'CH'], ['James Carter', 'US'], ['Ana López', 'MX'],
    ];
    const companies = ['Helio Devices', 'Arcturus Labs', 'Brightway Tech', 'Kinetiq Robotics', 'Vantor Medical', 'Lumen Fit', 'Orbitel', 'Fernmark Audio', 'Quanta Sense', 'Halden Motors', 'Sora Optics', 'Pinecrest Power', 'Nova Haptics', 'Tessera Automation', 'Bluefin Charging'];
    const sources: [string, number][] = [['Google organic', 30], ['AI search', 16], ['LinkedIn', 12], ['Trade show', 10], ['Direct', 12], ['Referral', 8], ['Email campaign', 6], ['Baidu', 6]];
    const refFor: Record<string, string> = { 'Google organic': 'https://www.google.com/', 'AI search': pick(['https://chatgpt.com/', 'https://www.perplexity.ai/', 'https://gemini.google.com/']), LinkedIn: 'https://www.linkedin.com/', Baidu: 'https://www.baidu.com/', 'Email campaign': '', Direct: '', Referral: '', 'Trade show': '' };
    const messages = {
      quote: ['Please quote 500k pcs/yr against the attached drawing. Target price below USD 0.20.', 'Looking for a second source for our AF coil. Can you quote 3 volume tiers?', 'Need pricing for the listed parts, FOB Shenzhen, MOQ and lead time please.', 'Requesting quotation for annual volume shown, plus tooling cost if any.'],
      sample: ['Could you send 20 samples for evaluation? Shipping to our lab in Munich.', 'We would like samples of the listed models for a design-in starting next month.', 'Please send evaluation kit and datasheets.'],
      drawing: ['Attached is our coil drawing. Is the window tolerance achievable?', 'Can you review this design for manufacturability before we freeze it?', 'We need a custom coil similar to the AF part but 0.2 mm thinner. Drawing attached.'],
      general: ['Do you have IATF 16949 certificate and can you share the audit report?', 'Is production available in Vietnam for our US programme?', 'Can we visit the factory in November?'],
    };
    const models = products.map((p) => p.model);
    const insInq = db.prepare(`INSERT INTO inquiries (type,status,name,email,company,country,phone,role,message,items,annual_volume,target_date,files,nda,source,referrer,landing,utm,locale,owner_id,account_id,first_response_at,created_at)
      VALUES (@type,@status,@name,@email,@company,@country,@phone,@role,@message,@items,@annual_volume,@target_date,@files,@nda,@source,@referrer,@landing,@utm,@locale,@owner_id,@account_id,@first_response_at,@created_at)`);
    for (let i = 0; i < 78; i++) {
      // More recent weeks get more inquiries (growth from SEO/GEO work)
      const d = Math.floor(Math.pow(r(), 1.25) * 84);
      const type = weighted<keyof typeof messages>([['quote', 45], ['sample', 20], ['drawing', 20], ['general', 15]]);
      const linked = r() < 0.3 ? 1 + Math.floor(r() * 13) : null;
      const [name, pcountry] = linked ? [(contacts[linked] || [['Buyer', '']])[0][0], accounts[linked - 1][2]] : pick(people);
      const company = linked ? accounts[linked - 1][0] : pick(companies);
      const domain = linked ? accounts[linked - 1][1] : company.toLowerCase().replace(/[^a-z]/g, '') + '.example';
      const source = weighted(sources);
      const status = d < 3 ? 'new' : d < 10 ? weighted([['new', 2], ['qualified', 5], ['converted', 2], ['spam', 1]]) : weighted([['qualified', 3], ['converted', 4], ['closed', 3], ['spam', 1]]);
      const created = daysAgo(d);
      const respH = 1 + Math.floor(r() * (status === 'new' ? 0 : 30));
      const items = type === 'general' ? [] : Array.from({ length: 1 + Math.floor(r() * 2) }, () => ({ model: pick(models), qty: pick([10, 50, 100000, 250000, 500000, 2000000]) }));
      insInq.run({
        type, status, name, email: name.toLowerCase().replace(/[^a-z ]/g, '').trim().split(/\s+/).join('.') + '@' + domain,
        company, country: pcountry, phone: '', role: pick(['Purchasing', 'Engineering', 'Engineering', 'Management', 'Quality']),
        message: pick(messages[type]), items: JSON.stringify(items), annual_volume: pick(['< 100k', '100k – 1M', '1M – 10M', '> 10M']),
        target_date: pick(['Q1 2027', 'Q2 2027', 'ASAP', '']), files: JSON.stringify(type === 'drawing' ? [{ name: 'coil-drawing-rev' + pick(['A', 'B', 'C']) + '.pdf', id: '' }] : []),
        nda: type === 'drawing' ? 1 : 0, source,
        referrer: source === 'AI search' ? pick(['https://chatgpt.com/', 'https://www.perplexity.ai/', 'https://gemini.google.com/', 'https://copilot.microsoft.com/']) : refFor[source] || '', landing: pick(['/en/products/vcm-coils', '/en', '/en/resources/how-to-specify-a-vcm-coil', '/zh/products/wireless-charging-coils', '/en/engineering', '/en/products/linear-motors/aw-lm-x0835']),
        utm: source === 'Email campaign' ? 'utm_source=newsletter&utm_campaign=q4-qi2' : '', locale: ['CN', 'TW'].includes(pcountry) ? 'zh' : 'en',
        owner_id: status === 'new' && r() < 0.4 ? null : repFor(pcountry), account_id: linked,
        first_response_at: status === 'new' ? null : daysAgo(d, 9 + Math.min(respH, 14)), created_at: created,
      });
    }

    // Converted inquiries from known customers point at that customer's opportunity.
    db.prepare(`UPDATE inquiries SET opportunity_id = (SELECT id FROM opportunities o WHERE o.account_id = inquiries.account_id ORDER BY o.stage = 'won' DESC, o.created_at LIMIT 1)
      WHERE status = 'converted' AND account_id IS NOT NULL`).run();

    // ---------- Activities ----------
    const insAct = db.prepare('INSERT INTO activities (account_id,opportunity_id,user_id,kind,body,created_at) VALUES (?,?,?,?,?,?)');
    const acts: [number, number | null, string, string, number][] = [
      [1, 1, 'meeting', 'Quarterly business review in Hsinchu. Forecast for 2027 confirmed at 40M; asked for periscope coil roadmap.', 35],
      [1, 2, 'email', 'Sent periscope coil first-article report (FAI) and Cpk data for window dimension.', 12],
      [1, 2, 'call', 'Price discussion: customer targets 6% below quote for >5M/month. Checking wire cost with purchasing.', 4],
      [2, 3, 'email', 'Quote Q-2026-0003 sent with matched-set option.', 20],
      [3, 4, 'call', 'Intro call. Found us through ChatGPT answer about VCM coil suppliers. Wants dual source outside current vendor.', 58],
      [3, 4, 'note', 'Samples shipped via FedEx. Follow up on lab results in two weeks.', 18],
      [4, 5, 'meeting', 'Supplier audit by Katrin Vogel, no major findings. Two minor on ESD wrist-strap logging.', 80],
      [6, 8, 'email', 'Revised LRA drawing rev C received. Height reduced to 2.4 mm.', 9],
      [8, 11, 'call', 'Founder wants private-label Qi2 charger, 5k MOQ. Shared reference module pre-scan report.', 26],
      [11, 14, 'meeting', '在东莞工厂会面，讨论 2027 年度框架合同与阶梯价格。', 6],
      [9, 12, 'note', 'PO received for 120k solenoid coils, first delivery week 46.', 105],
      [10, 13, 'email', 'Telecoil samples shipped with sensitivity bins labelled.', 15],
      [13, 16, 'call', 'Discovery call. Controller launch Q3 2027; needs X-axis LRA with 160 Hz resonance.', 3],
    ];
    acts.forEach(([acc, opp, kind, body, d]) => {
      const owner = repFor(accounts[acc - 1][2]);
      insAct.run(acc, opp, owner, kind, body, daysAgo(d));
    });

    // ---------- Tasks / follow-ups ----------
    const insTask = db.prepare('INSERT INTO tasks (title,due_at,done,user_id,account_id,opportunity_id,created_at) VALUES (?,?,?,?,?,?,?)');
    const tasks: [string, number, number, number | null, number | null, number][] = [
      ['Reply to Lumora on periscope pricing', -1, 3, 1, 2, 0],
      ['Chase Kaiyo for quote decision', 2, 3, 2, 3, 0],
      ['Follow up Brightlane sample lab results', 0, 4, 3, 4, 0],
      ['Send IATF certificate to Hanbit', -3, 3, 7, 10, 0],
      ['Book electronica drawing reviews', 5, 4, null, null, 0],
      ['Prepare Pulseform LRA contract draft', 1, 4, 6, 8, 0],
      ['Corelink: send evaluation kit invoice', 3, 4, 8, 11, 0],
      ['Qiyu 框架合同条款确认', 2, 3, 11, 14, 0],
      ['Call Sundaram re: lost deal feedback', 7, 5, 12, 15, 0],
      ['Auralis sensitivity bin report', -2, 4, 10, 13, 0],
      ['Velo: share X-axis LRA datasheet', 0, 4, 13, 16, 0],
      ['Update Q4 forecast', 4, 2, null, null, 0],
      ['Send Meridian food-grade material certs', 6, 4, 9, 18, 0],
      ['Vossberg relay coil cost-down proposal', -5, 4, 4, 6, 1],
    ];
    tasks.forEach(([t, due, user, acc, opp, done]) => insTask.run(t, due >= 0 ? daysAhead(due) : daysAgo(-due), done, user, acc, opp, daysAgo(10)));
  });
  tx();
}
