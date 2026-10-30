// Seed articles: news, technical notes and case studies (illustrative content).

export const articles = [
  {
    slug: 'how-to-specify-a-vcm-coil', type: 'tech', days: 6, reading_min: 7,
    products: ['aw-vcm-af0806', 'aw-vcm-ois1210'], applications: ['smartphone-cameras'],
    title_en: 'How to specify a VCM coil so the first sample is right',
    title_zh: '如何定义 VCM 线圈规格，让首次打样即达标',
    excerpt_en: 'Seven values decide whether a voice-coil-motor coil fits, moves evenly and survives reflow. Put them on the drawing and you skip a sampling round.',
    excerpt_zh: '七个参数决定了 VCM 线圈能否装配到位、运动均匀并经受回流焊。在图纸上写清它们，可以省去一轮打样。',
    body_en: `Most coil sampling delays come from drawings that leave something open. A coil maker will fill the gap with a sensible default, and the default is often not what the actuator designer had in mind.

## The seven values that matter

1. **Inner window and its tolerance.** This is the dimension that meets your lens carrier. We hold ±0.02 mm on standard parts; say so if you need tighter.
2. **Outer outline.** Usually less critical, but it sets clearance to the magnet.
3. **Height.** Give a maximum, not only a nominal. Bonding pressure trades height against side-wall bulge.
4. **Wire diameter and bonding type.** Hot-air, solvent or heat-bonding wire behave differently in reflow.
5. **DC resistance with a temperature.** Resistance is quoted at 20 °C unless you state otherwise.
6. **Lead length, position and finish.** Most first-sample rejects are lead issues, not coil issues.
7. **Test conditions for inductance.** Frequency and level change the reading by several percent.

## What you can leave to us

Turn count follows from resistance and window. If you specify resistance, let the turn count float; specifying both over-constrains the part.

## Sending the drawing

Upload a PDF or STEP file with your inquiry. Engineering reviews every drawing within two working days and returns a manufacturability note before quoting.`,
    body_zh: `大多数线圈打样延误，源于图纸上留有未定义的项目。线圈厂会用合理的默认值补齐，但默认值往往不是马达设计者的本意。

## 七个关键参数

1. **内窗尺寸及公差。** 这是与镜头载体配合的尺寸。标准件可控制在 ±0.02 mm；如需更严，请注明。
2. **外形尺寸。** 通常不那么关键，但决定与磁铁的间隙。
3. **高度。** 请给出最大值，而不仅是名义值。粘合压力会在高度与侧壁鼓胀之间取舍。
4. **线径与自粘类型。** 热风、溶剂或热粘型线材在回流焊中的表现不同。
5. **直流电阻及测试温度。** 未注明时，电阻按 20 °C 标注。
6. **引线长度、位置与处理方式。** 大多数首样不良是引线问题，而非线圈本身。
7. **电感测试条件。** 频率与电平会使读数相差数个百分点。

## 可以交给我们的部分

圈数由电阻与内窗推导得出。如果规定了电阻，请让圈数浮动；同时规定两者会造成过约束。

## 提交图纸

询价时上传 PDF 或 STEP 文件即可。工程团队会在两个工作日内审阅每份图纸，并在报价前反馈可制造性意见。`,
  },
  {
    slug: 'orthocyclic-vs-random-winding', type: 'tech', days: 21, reading_min: 6,
    products: ['aw-vcm-af0806', 'aw-ac-tc0402'], applications: ['smartphone-cameras', 'medical-hearing'],
    title_en: 'Orthocyclic versus random winding: what changes in the part',
    title_zh: '正交排绕与乱绕：零件会有哪些不同',
    excerpt_en: 'Orthocyclic winding packs up to 90.7% copper into the cross-section. Here is what that buys you, and when random winding is the better call.',
    excerpt_zh: '正交排绕可使截面铜填充率达到 90.7%。本文说明它带来的好处，以及何时乱绕反而更合适。',
    body_en: `In an orthocyclic coil each turn of the second layer sits in the groove between two turns of the first. The cross-section becomes a hexagonal packing, the densest arrangement round wire allows.

## Why it matters

- **More copper in the same space.** Theoretical fill factor is 90.7%, against roughly 70–75% for a good random winding. For the same resistance the coil gets smaller, or for the same size it gets stronger.
- **Predictable geometry.** Every turn has a known position, so outline and height are repeatable from part to part.
- **Better heat path.** Fewer air gaps mean lower thermal resistance from the inner turns.

## What it costs

Orthocyclic winding needs precise wire guidance, constant tension and a defined crossover zone where each layer steps over. Line speed is lower and setup is longer.

## When random winding wins

For bobbin coils with thousands of turns, where outline tolerance is generous and cost dominates, a controlled random winding is the sensible choice. Most of our relay and valve coils are wound this way.`,
    body_zh: `在正交排绕线圈中，第二层的每一圈都嵌在第一层两圈之间的凹槽里，截面形成六角密排，这是圆线所能达到的最紧密排列。

## 为什么重要

- **相同空间内更多铜。** 理论填充率为 90.7%，而良好的乱绕约为 70–75%。在相同电阻下线圈更小，或在相同尺寸下推力更大。
- **几何可预测。** 每一圈的位置都是确定的，外形与高度在零件之间可重复。
- **散热路径更好。** 气隙更少，内层线圈的热阻更低。

## 代价

正交排绕需要精确的排线、恒定张力，以及每层跨越的确定换层区。线速更低，调机时间更长。

## 乱绕何时更优

对于数千圈、外形公差宽松且成本敏感的骨架线圈，受控乱绕是合理选择。我们的大多数继电器与阀线圈都采用这种方式。`,
  },
  {
    slug: 'qi2-coil-design-notes', type: 'tech', days: 38, reading_min: 8,
    products: ['aw-wc-mpp50', 'aw-ch-q2m15'], applications: ['wireless-power'],
    title_en: 'Qi2 transmitter coils: five design notes from production',
    title_zh: 'Qi2 发射线圈：来自量产的五条设计笔记',
    excerpt_en: 'Litz strand count, ferrite thickness and magnet segmentation all move efficiency and surface temperature. Notes from our first two years of MPP production.',
    excerpt_zh: '利兹线股数、铁氧体厚度与磁铁分段都会影响效率与表面温度。这是我们两年 MPP 量产的经验总结。',
    body_en: `Qi2 brought magnetic alignment to the mainstream, and with it a new set of trade-offs for the transmitter coil.

## 1. Strand count is a heat decision
More, thinner strands reduce AC resistance at 128 kHz but cost more and are harder to terminate. 105 × 0.08 mm is our default for 15 W.

## 2. Ferrite thickness sets the floor for Q
Below 0.8 mm Mn-Zn ferrite, Q drops quickly and foreign-object detection becomes less reliable.

## 3. Segment the magnet ring
A segmented ring reduces eddy losses in the magnets themselves, which shows up as a 2–3 K lower surface temperature.

## 4. Specify the stack-up, not just the coil
The distance from coil to charging surface changes inductance. Quote and test the coil in its real stack-up.

## 5. Plan certification samples early
Certification labs want production-representative parts. We build pre-scan samples from the production line, not the lab.`,
    body_zh: `Qi2 让磁吸对位成为主流，也为发射线圈带来了一系列新的取舍。

## 1. 股数是散热决策
更多、更细的股线可降低 128 kHz 下的交流电阻，但成本更高、端接更难。15 W 产品我们默认采用 105 × 0.08 mm。

## 2. 铁氧体厚度决定 Q 值下限
锰锌铁氧体低于 0.8 mm 时，Q 值迅速下降，异物检测的可靠性也随之降低。

## 3. 磁环要分段
分段磁环可降低磁铁自身的涡流损耗，表面温度可因此降低 2–3 K。

## 4. 规定叠层，而不只是线圈
线圈到充电面的距离会改变电感。请在真实叠层中报价与测试线圈。

## 5. 尽早规划认证样品
认证实验室需要能代表量产的样品。我们的预扫描样品来自量产线，而非实验室。`,
  },
  {
    slug: 'case-ois-coils-flagship-camera', type: 'case', days: 14, reading_min: 5,
    products: ['aw-vcm-ois1210'], applications: ['smartphone-cameras'],
    title_en: 'Cutting OIS calibration time with matched coil sets',
    title_zh: '以配对线圈组缩短 OIS 校准时间',
    excerpt_en: 'A camera-module maker was spending 40 seconds per module on OIS calibration. Matched coil sets brought it to 26.',
    excerpt_zh: '一家摄像头模组厂每个模组的 OIS 校准耗时 40 秒，采用配对线圈组后降至 26 秒。',
    body_en: `## The problem
A tier-one camera-module maker producing main cameras for a flagship phone found that OIS calibration had become their bottleneck. Coil-to-coil resistance spread forced the calibration routine to iterate.

## What we changed
We introduced resistance binning after 100% electrical test and shipped coils as matched sets of four, with set spread at or below 1.5%. Trays were labelled by set so the line could load them without sorting.

## Result
- Calibration time fell from 40 to 26 seconds per module.
- First-pass yield at calibration rose from 96.1% to 98.9%.
- The customer moved a second module programme to matched sets within the quarter.`,
    body_zh: `## 问题
一家为旗舰手机生产主摄的一级模组厂发现，OIS 校准已成为产线瓶颈。线圈之间的电阻偏差迫使校准程序反复迭代。

## 我们的改变
在 100% 电性能测试后引入电阻分档，以四颗为一组配对出货，组内偏差不超过 1.5%。托盘按组标识，产线无需分拣即可上料。

## 结果
- 每个模组的校准时间由 40 秒降至 26 秒。
- 校准工序一次通过率由 96.1% 提升至 98.9%。
- 客户在同一季度内将第二个模组项目也切换为配对线圈组。`,
  },
  {
    slug: 'case-haptics-wearable', type: 'case', days: 52, reading_min: 4,
    products: ['aw-lm-z0825'], applications: ['wearables-haptics'],
    title_en: 'A coin LRA for a fitness band, from sketch to 2M units',
    title_zh: '为运动手环打造硬币型线性马达：从草图到 200 万台',
    excerpt_en: 'A wearable brand needed a Z-axis motor 0.3 mm thinner than anything in their supply base. Eleven weeks later it was in production.',
    excerpt_zh: '一家可穿戴品牌需要一款比现有供应商更薄 0.3 mm 的 Z 轴马达，十一周后即投入量产。',
    body_en: `## Brief
The band's new enclosure left 2.5 mm for the haptic motor. Off-the-shelf coin LRAs were 2.8 mm.

## Approach
We rewound the drive coil with finer wire and more layers to keep force constant in less height, and retuned the spring to hold the resonant frequency at 235 Hz.

## Outcome
First samples in four weeks, PPAP-style validation in nine, production in eleven. Two million units shipped in the first year with field returns under 50 ppm.`,
    body_zh: `## 需求
手环的新外壳只为触觉马达留出 2.5 mm 空间，而市售硬币型马达为 2.8 mm。

## 方法
我们以更细的线径与更多层数重新设计驱动线圈，在更低高度下保持推力不变，并重新调校弹片使谐振频率保持在 235 Hz。

## 结果
四周交付首样，九周完成类 PPAP 验证，十一周量产。首年出货两百万台，市场退货率低于 50 ppm。`,
  },
  {
    slug: 'vietnam-plant-second-phase', type: 'news', days: 9, reading_min: 3,
    products: [], applications: ['industrial-sensing'],
    title_en: 'Bắc Ninh plant opens its second production hall',
    title_zh: '越南北宁工厂第二生产车间投产',
    excerpt_en: 'Forty additional winding lines give customers a second source for air-core, bobbin coils and linear motors outside China.',
    excerpt_zh: '新增四十条绕线产线，为客户提供中国以外的空心线圈、骨架线圈与线性马达第二货源。',
    body_en: `Our Vietnam plant has opened its second hall, adding forty automatic winding lines and an LRA assembly cell.

Customers can now qualify the same part numbers in Dongguan and Bắc Ninh, with shared tooling, the same process specifications and one quality system. Several programmes have already moved to dual-site supply.

Engineering support for Vietnam production remains in Dongguan, so drawings, changes and failure analysis go through the same team.`,
    body_zh: `越南工厂第二车间正式投产，新增四十条自动绕线产线与一条线性马达组装线。

客户现在可以在东莞与北宁两地认证相同料号，共享模具、工艺规范与同一质量体系。已有多个项目转为双基地供货。

越南生产的工程支持仍由东莞团队负责，图纸、变更与失效分析均由同一团队处理。`,
  },
  {
    slug: 'qi2-certified-reference-module', type: 'news', days: 30, reading_min: 2,
    products: ['aw-ch-q2m15'], applications: ['wireless-power'],
    title_en: 'Qi2 15 W reference module passes certification pre-scan',
    title_zh: 'Qi2 15 W 参考模块通过认证预扫描',
    excerpt_en: 'Brands building magnetic chargers can now start from a pre-scanned module and shorten their certification path.',
    excerpt_zh: '开发磁吸充电器的品牌现在可以基于已完成预扫描的模块起步，缩短认证周期。',
    body_en: `Our AW-CH-Q2M15 module has completed a full Qi2 pre-scan at an authorised test lab with no open items.

Brands can order evaluation kits now. Each kit includes five modules, the pre-scan report and the thermal test data at 15 W.`,
    body_zh: `我们的 AW-CH-Q2M15 模块已在授权实验室完成完整的 Qi2 预扫描，无遗留问题。

品牌方现可订购评估套件，每套含五个模块、预扫描报告及 15 W 下的热测试数据。`,
  },
  {
    slug: 'electronica-2026', type: 'news', days: 3, reading_min: 2,
    products: [], applications: [],
    title_en: 'Meet our engineers at electronica 2026, Munich',
    title_zh: '2026 慕尼黑电子展，与我们的工程师面对面',
    excerpt_en: 'Bring your drawings. Our coil engineers will review them on the stand, 10–13 November.',
    excerpt_zh: '带上您的图纸，11 月 10–13 日我们的线圈工程师将在展台现场审阅。',
    body_en: `We will be in Munich from 10 to 13 November with live winding demonstrations of 0.012 mm wire and the new periscope coil platform.

Book a 30-minute drawing review with an engineer through the contact form, and choose "Meeting at a trade show" as the request type.`,
    body_zh: `11 月 10 日至 13 日我们将亮相慕尼黑，现场演示 0.012 mm 极细线绕制与全新潜望式线圈平台。

可通过联系表单预约与工程师 30 分钟的图纸评审，请求类型选择“展会会面”。`,
  },
  {
    slug: 'self-bonding-wire-explained', type: 'tech', days: 64, reading_min: 5,
    products: ['aw-ac-vc1200', 'aw-vcm-pr1604'], applications: ['consumer-audio', 'smartphone-cameras'],
    title_en: 'Self-bonding wire: hot air, solvent or current?',
    title_zh: '自粘线：热风、溶剂还是通电粘合？',
    excerpt_en: 'Bobbinless coils hold their shape because the wire bonds to itself. The bonding method affects strength, cycle time and how the coil behaves in reflow.',
    excerpt_zh: '无骨架线圈之所以能保持形状，是因为线材自身相互粘合。粘合方式影响强度、节拍以及线圈在回流焊中的表现。',
    body_en: `Self-bonding wire carries a thermoplastic or thermoset layer over the insulation. Activate it and adjacent turns fuse into a solid coil.

## Hot air
Bonded during winding. Fast and clean; our default for VCM coils.

## Solvent
Alcohol activates the bond layer during winding. Good for very fine wire where hot air would disturb the turns.

## Resistance heating
Current through the finished coil heats it from inside. Uniform bond in thick coils, slower cycle.

## Reflow behaviour
Thermoset bond layers hold above 200 °C; thermoplastic ones can soften. For coils that see lead-free reflow, specify a thermoset bond coat.`,
    body_zh: `自粘线在绝缘层外附有一层热塑性或热固性粘合层，激活后相邻线圈融合为整体。

## 热风
绕制过程中同步粘合，快速、洁净，是 VCM 线圈的默认工艺。

## 溶剂
绕线时以酒精激活粘合层，适合热风会扰动线圈的极细线。

## 通电加热
对成品线圈通电，由内部加热。厚线圈粘合均匀，但节拍较慢。

## 回流焊表现
热固性粘合层在 200 °C 以上仍能保持；热塑性粘合层可能软化。需经无铅回流焊的线圈，请指定热固性粘合层。`,
  },
];
