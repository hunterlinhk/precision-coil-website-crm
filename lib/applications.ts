export type Application = {
  slug: string;
  name_en: string; name_zh: string;
  lead_en: string; lead_zh: string;
  // the specific coils we make for this field
  uses_en: string[]; uses_zh: string[];
  needs_en: string[]; needs_zh: string[];
  how_en: string; how_zh: string;
};

// Seven fields covering every application the company supplies today.
export const applications: Application[] = [
  {
    slug: 'smartphone-cameras',
    name_en: 'Smartphone cameras', name_zh: '手机摄像头',
    lead_en: 'Autofocus and optical image stabilization actuators move the lens by microns. The coil decides how evenly they move.',
    lead_zh: '自动对焦与光学防抖马达以微米级精度驱动镜头，线圈决定了运动是否均匀一致。',
    uses_en: ['Camera autofocus (AF) coils', 'Optical image stabilization (OIS) coils'],
    uses_zh: ['手机摄像头自动对焦（AF）线圈', '手机摄像头光学防抖（OIS）线圈'],
    needs_en: ['Tight window and outline tolerances so coils fit the lens carrier', 'Consistent resistance from coil to coil', 'Stable quality at very high volume'],
    needs_zh: ['内窗与外形公差严格，可直接装配到镜头载体', '线圈之间电阻一致', '超大批量下品质稳定'],
    how_en: 'About one in ten VCM coils shipped worldwide is wound in our workshop, wound as air-core coils or directly onto the lens carrier.',
    how_zh: '全球约十分之一的 VCM 线圈在我们的车间绕制，可做成空心线圈，也可直接绕制在镜头载体上。',
  },
  {
    slug: 'surveillance-cameras',
    name_en: 'Surveillance cameras', name_zh: '监控摄像头',
    lead_en: 'Auto-tracking security cameras follow movement by driving their lens and mechanism with small coils that have to run reliably around the clock.',
    lead_zh: '自动追踪监控摄像头依靠小型线圈驱动镜头与机构跟随目标，需要全天候可靠运行。',
    uses_en: ['Coils for automatic-tracking surveillance cameras'],
    uses_zh: ['自动追踪监控摄像头线圈'],
    needs_en: ['Long service life in continuous operation', 'Consistent electrical values for smooth tracking', 'Custom shapes to fit each camera design'],
    needs_zh: ['连续运行下寿命长', '电性能一致，追踪平稳', '外形可按摄像头结构定制'],
    how_en: 'We wind these to the camera maker’s drawing on the same machines and inspection equipment as our smartphone camera coils.',
    how_zh: '我们按摄像头厂商图纸绕制，与手机摄像头线圈使用相同的设备与检测流程。',
  },
  {
    slug: 'wireless-power',
    name_en: 'Wireless charging', name_zh: '无线充电',
    lead_en: 'From phones and smartwatches to electric vehicles, the coil and its magnetic shield set how efficiently power crosses the gap and how warm the device gets.',
    lead_zh: '从手机、智能手表到电动汽车，线圈及其导磁片决定了能量传输效率与设备发热。',
    uses_en: ['Wireless charging receiver coils', 'Smartwatch wireless charging transmitter coils', 'Dual-coil wireless charging coils', 'Triple-coil wireless charging coils', 'Electric vehicle charging coils'],
    uses_zh: ['无线充电接收线圈', '智能手表无线充电发射线圈', '双线圈无线充电线圈', '三线圈无线充电线圈', '电动汽车充电线圈'],
    needs_en: ['Controlled inductance and low AC resistance', 'Thin stack-ups, including nanocrystalline sheets under 0.5 mm', 'Single, dual and triple-coil layouts'],
    needs_zh: ['电感受控、交流电阻低', '超薄叠层，纳米晶导磁片方案总厚度可低于 0.5 mm', '单线圈、双线圈与三线圈布局'],
    how_en: 'Receiver coils on nanocrystalline sheet are one of our signature products; we also wind transmitter coils and multi-coil arrays on ferrite.',
    how_zh: '纳米晶片接收线圈是我们的代表产品之一；我们也绕制铁氧体上的发射线圈与多线圈阵列。',
  },
  {
    slug: 'optical-pickup',
    name_en: 'Optical drives', name_zh: '光驱',
    lead_en: 'CD, VCD and DVD laser pickups focus and track the beam with tiny coils that move the objective lens.',
    lead_zh: 'CD、VCD 与 DVD 激光头依靠微型线圈驱动物镜，完成聚焦与循迹。',
    uses_en: ['CD / VCD / DVD laser pickup coils'],
    uses_zh: ['CD / VCD / DVD 激光头线圈'],
    needs_en: ['Very small, light coils', 'Precise dimensions for the lens actuator', 'Fine wire wound without damage'],
    needs_zh: ['线圈小而轻', '尺寸精确，匹配物镜驱动器', '极细线绕制无损伤'],
    how_en: 'These are fine-wire air-core coils, wound and bonded on the same equipment we use for camera coils.',
    how_zh: '这类线圈为细线空心线圈，与摄像头线圈在同一设备上绕制与粘合。',
  },
  {
    slug: 'medical-hearing',
    name_en: 'Medical & hearing', name_zh: '医疗与助听',
    lead_en: 'Ultrasound equipment and hearing aids need coils that are small, consistent and documented.',
    lead_zh: '超声设备与助听器需要体积小、一致性好且资料完整的线圈。',
    uses_en: ['Ultrasound equipment coils', 'Hearing aid coils'],
    uses_zh: ['超声设备线圈', '助听器线圈'],
    needs_en: ['Fine wire and small size', 'Consistent sensitivity and resistance', 'Material compliance documents'],
    needs_zh: ['细线径、小尺寸', '灵敏度与电阻一致', '提供材料合规文件'],
    how_en: 'We wind to the device maker’s drawing and supply RoHS documentation with each part number.',
    how_zh: '我们按设备厂商图纸绕制，并为每个料号提供 RoHS 文件。',
  },
  {
    slug: 'home-devices',
    name_en: 'Home & personal devices', name_zh: '家居与个人电子',
    lead_en: 'Everyday products from robot vacuums to electric toothbrushes rely on small coils for motion, sensing and charging.',
    lead_zh: '从扫地机器人到电动牙刷，日常产品依靠小型线圈实现驱动、感应与充电。',
    uses_en: ['Robot vacuum cleaner coils', 'Electric toothbrush coils', 'Wireless mouse coils', 'Reading pen coils', 'Electronic clock and watch coils', 'Dancing solar flower coils'],
    uses_zh: ['扫地机器人线圈', '电动牙刷线圈', '无线鼠标线圈', '点读笔线圈', '电子钟表线圈', '太阳能摇摆花线圈'],
    needs_en: ['Low cost at volume', 'Reliable operation over the product’s life', 'Air-core or bobbin designs to suit the product'],
    needs_zh: ['大批量下成本低', '产品寿命期内可靠运行', '可按产品选用空心或骨架线圈'],
    how_en: 'We make both air-core and bobbin coils, so the coil type can follow the product’s cost and space rather than our equipment.',
    how_zh: '我们同时生产空心线圈与骨架线圈，线圈类型可按产品的成本与空间选择。',
  },
  {
    slug: 'radio-induction',
    name_en: 'Radio & induction', name_zh: '收音与电磁感应',
    lead_en: 'Radio receivers and electromagnetic induction products pick up or create fields with coils tuned for their frequency.',
    lead_zh: '收音机与电磁感应产品依靠针对工作频率设计的线圈来接收或产生磁场。',
    uses_en: ['Radio receiver coils', 'Electromagnetic induction coils'],
    uses_zh: ['收音机线圈', '电磁感应线圈'],
    needs_en: ['Stable inductance', 'Turns and wire chosen for the operating frequency', 'Bobbin or air-core construction'],
    needs_zh: ['电感稳定', '按工作频率选择圈数与线径', '骨架或空心结构'],
    how_en: 'Send the inductance and frequency you need; we work back to wire, turns and form.',
    how_zh: '告诉我们所需电感与频率，我们反推线径、圈数与结构。',
  },
];

export const getApplication = (slug: string) => applications.find((a) => a.slug === slug);
