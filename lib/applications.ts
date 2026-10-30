export type Application = {
  slug: string;
  name_en: string; name_zh: string;
  lead_en: string; lead_zh: string;
  needs_en: string[]; needs_zh: string[];
  how_en: string; how_zh: string;
};

export const applications: Application[] = [
  {
    slug: 'smartphone-cameras',
    name_en: 'Smartphone cameras', name_zh: '手机摄像头',
    lead_en: 'Autofocus, OIS and periscope actuators move lenses by microns, thousands of times a second. The coil decides how evenly they move.',
    lead_zh: '自动对焦、光学防抖与潜望式马达以微米级精度、每秒数千次地驱动镜头，线圈决定了运动是否均匀一致。',
    needs_en: ['Window tolerance of ±0.02 mm so coils drop onto carriers', 'Matched sets for four-axis OIS', 'Volumes of tens of millions per month with flat yield'],
    needs_zh: ['内窗公差 ±0.02 mm，可直接装配到载体', '四轴 OIS 线圈成套配对', '每月数千万颗的产量下良率保持稳定'],
    how_en: 'We wind about one in ten VCM coils shipped worldwide. Module makers send a drawing; we return first articles with a full dimensional and electrical report.',
    how_zh: '全球约十分之一的 VCM 线圈由我们绕制。模组厂提供图纸，我们交付首件并附完整尺寸与电性能报告。',
  },
  {
    slug: 'wireless-power',
    name_en: 'Wireless charging', name_zh: '无线充电',
    lead_en: 'From 2 W wearables to 15 W Qi2 magnetic chargers and in-car pads, the coil, ferrite and magnets set efficiency and heat.',
    lead_zh: '从 2 W 可穿戴设备到 15 W Qi2 磁吸充电器与车载充电板，线圈、磁片与磁铁决定了效率与发热。',
    needs_en: ['Tight inductance and Q for certification', 'Magnet arrays aligned to the Qi2 profile', 'Coil-only, sub-assembly or finished charger'],
    needs_zh: ['电感与 Q 值严格受控，便于通过认证', '磁铁阵列符合 Qi2 对位规范', '可供应线圈、组件或成品充电器'],
    how_en: 'Because we wind the coils ourselves, we can supply anything from a bare Tx coil to a finished, branded charger.',
    how_zh: '由于线圈为自产，我们可以提供从裸发射线圈到品牌成品充电器的全部形态。',
  },
  {
    slug: 'wearables-haptics',
    name_en: 'Wearables & haptics', name_zh: '可穿戴与触觉反馈',
    lead_en: 'Watches, rings, controllers and phones depend on small linear motors and coils that fit where nothing else does.',
    lead_zh: '手表、戒指、手柄与手机依赖能放进极小空间的线性马达与线圈。',
    needs_en: ['Consistent resonant frequency across lots', 'Tiny coils from 0.012 mm wire', 'Custom brackets and contacts'],
    needs_zh: ['各批次谐振频率一致', '0.012 mm 极细线小线圈', '定制支架与触点'],
    how_en: 'Our LRAs use drive coils from our own lines, so the electrical spread that causes haptic inconsistency is controlled at the source.',
    how_zh: '我们的线性马达采用自产驱动线圈，从源头控制导致振感不一致的电性能偏差。',
  },
  {
    slug: 'automotive',
    name_en: 'Automotive', name_zh: '汽车电子',
    lead_en: 'Sensors, relays, ADAS cameras and in-cabin chargers need coils that survive −40 to +150 °C and come with full documentation.',
    lead_zh: '传感器、继电器、ADAS 摄像头与车内无线充电需要能承受 −40 至 +150 °C 且文件齐全的线圈。',
    needs_en: ['IATF 16949 production and PPAP', 'Traceability to wire lot and spindle', 'High-temperature wire and bobbin materials'],
    needs_zh: ['IATF 16949 生产及 PPAP', '可追溯至线材批次与主轴', '耐高温线材与骨架材料'],
    how_en: 'Automotive parts run on segregated IATF lines with lot-level traceability and PPAP level 3 as standard.',
    how_zh: '车规零件在独立 IATF 产线生产，具备批次级追溯，标准提供 PPAP 3 级文件。',
  },
  {
    slug: 'industrial-sensing',
    name_en: 'Industrial & sensing', name_zh: '工业与传感',
    lead_en: 'Valves, encoders, proximity sensors and RF front ends rely on coils with stable resistance and long service life.',
    lead_zh: '电磁阀、编码器、接近传感器与射频前端依赖电阻稳定、寿命长的线圈。',
    needs_en: ['Encapsulated coils to IP67', '100% hipot testing', 'Lower volumes, more variants'],
    needs_zh: ['IP67 包封线圈', '100% 耐压测试', '小批量、多品种'],
    how_en: 'Our Vietnam plant runs flexible cells for mid-volume industrial programmes, with tooling shared from Dongguan.',
    how_zh: '越南工厂以柔性产线承接中批量工业项目，模具与东莞共享。',
  },
  {
    slug: 'medical-hearing',
    name_en: 'Medical & hearing', name_zh: '医疗与助听',
    lead_en: 'Hearing aids, implant chargers and diagnostic probes need the finest wire we wind, with documentation to match.',
    lead_zh: '助听器、植入设备充电与诊断探头需要我们最细线径的绕制能力，以及相匹配的文件体系。',
    needs_en: ['0.012 mm wire wound at under 1 gf tension', 'Sensitivity binning', 'Clean packaging and lot records'],
    needs_zh: ['以低于 1 gf 的张力绕制 0.012 mm 线材', '灵敏度分档', '洁净包装与批次记录'],
    how_en: 'Fine-wire coils are built in a separate controlled-humidity room with dedicated tension control.',
    how_zh: '极细线线圈在独立恒湿车间生产，并配备专用张力控制。',
  },
  {
    slug: 'consumer-audio',
    name_en: 'Consumer audio', name_zh: '消费音频',
    lead_en: 'Micro-speakers and receivers live or die by voice-coil roundness and moving mass.',
    lead_zh: '微型扬声器与受话器的表现取决于音圈的圆度与振动质量。',
    needs_en: ['Roundness within 0.03 mm', 'CCA or copper wire to hit mass targets', 'Lead-out position to drawing'],
    needs_zh: ['圆度控制在 0.03 mm 以内', '可选铜包铝或纯铜以满足质量目标', '出线位置按图纸'],
    how_en: 'Voice coils are wound on the same precision platforms as our camera coils.',
    how_zh: '音圈与摄像头线圈共用同一精密绕线平台。',
  },
];

export const getApplication = (slug: string) => applications.find((a) => a.slug === slug);
