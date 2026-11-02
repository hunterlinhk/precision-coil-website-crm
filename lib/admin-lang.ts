import 'server-only';
import { cookies } from 'next/headers';

// Admin interface language. Stored in a cookie (and on the user) so each colleague keeps their choice.
export type AL = 'en' | 'zh';
export const ADMIN_LANG_COOKIE = 'aw_admin_lang';

export async function adminLang(): Promise<AL> {
  const c = (await cookies()).get(ADMIN_LANG_COOKIE)?.value;
  return c === 'zh' ? 'zh' : 'en';
}

// tr(en, zh): pick the string for the current language.
export async function translator() {
  const l = await adminLang();
  return { l, tr: (en: string, zh: string) => (l === 'zh' ? zh : en) };
}

// Labels used across the CRM.
const LABELS: Record<string, [string, string]> = {
  // inquiry status
  new: ['New', '新询盘'], qualified: ['Replied', '已回复'], converted: ['Converted', '已转化'], closed: ['Closed', '已关闭'], spam: ['Spam', '垃圾'],
  // deal stages
  qualifying: ['Qualifying', '初步沟通'], sampling: ['Sampling', '送样'], quoted: ['Quoted', '已报价'], negotiation: ['Negotiation', '谈判'], won: ['Won', '赢单'], lost: ['Lost', '丢单'],
  // content
  draft: ['Draft', '草稿'], published: ['Published', '已发布'],
  // quotes
  sent: ['Sent', '已发送'], accepted: ['Accepted', '已接受'], rejected: ['Rejected', '已拒绝'],
  // samples
  requested: ['Requested', '已申请'], in_production: ['In production', '制作中'], shipped: ['Shipped', '已发货'], delivered: ['Delivered', '已送达'], feedback: ['Feedback', '已反馈'],
  // accounts
  customer: ['Customer', '客户'], prospect: ['Prospect', '潜在客户'], partner: ['Partner', '合作伙伴'], lead: ['Lead', '线索'],
  // misc
  overdue: ['Overdue', '已逾期'], failed: ['Failed', '发送失败'], received: ['Received', '已收到'],
  // inquiry types
  quote: ['Quotation', '报价'], sample: ['Samples', '样品'], drawing: ['Drawing review', '图纸评审'], general: ['Question', '咨询'],
  // activity kinds
  note: ['Note', '备注'], call: ['Call', '电话'], email: ['Email', '邮件'], meeting: ['Meeting', '会议'],
  // roles
  admin: ['Administrator', '管理员'], manager: ['Sales manager', '销售经理'], sales: ['Sales rep', '销售'], editor: ['Content editor', '内容编辑'],
  // article types
  news: ['News', '新闻'], tech: ['Technical note', '技术笔记'], case: ['Case study', '案例'],
};
export const label = (key: string, l: AL) => (LABELS[key] ? LABELS[key][l === 'zh' ? 1 : 0] : key.replace(/_/g, ' '));

// Lead channels as stored on inquiries.
const CHANNELS: Record<string, string> = {
  'Google organic': '搜索引擎', 'AI search': 'AI 搜索', LinkedIn: '领英', Baidu: '百度', 'Email campaign': '邮件营销', 'Trade show': '展会',
  'Paid / campaign': '付费推广', Referral: '外部链接', Direct: '直接访问', Email: '邮件',
};
export const channel = (c: string, l: AL) => (l === 'zh' ? CHANNELS[c] || c : c);

// Dates and relative time in the admin language.
const toDate = (s: string) => new Date(s.includes('T') ? s : s.replace(' ', 'T') + (s.length > 10 ? 'Z' : 'T00:00:00Z'));
export const fmtDate = (s: string | null | undefined, l: AL) => (s ? toDate(s).toLocaleDateString(l === 'zh' ? 'zh-CN' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
export const fmtDateTime = (s: string | null | undefined, l: AL) => (s ? toDate(s).toLocaleString(l === 'zh' ? 'zh-CN' : 'en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
export function fmtAgo(s: string | null | undefined, l: AL) {
  if (!s) return '—';
  const diff = (Date.now() - toDate(s).getTime()) / 1000;
  const a = Math.abs(diff);
  const [v, u] = a < 3600 ? [Math.max(1, Math.round(a / 60)), l === 'zh' ? '分钟' : 'min'] : a < 86400 ? [Math.round(a / 3600), l === 'zh' ? '小时' : 'h'] : [Math.round(a / 86400), l === 'zh' ? '天' : 'd'];
  if (l === 'zh') return diff < 0 ? `${v} ${u}后` : `${v} ${u}前`;
  return diff < 0 ? `in ${v} ${u}` : `${v} ${u} ago`;
}
