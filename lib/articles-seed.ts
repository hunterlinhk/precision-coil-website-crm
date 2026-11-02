// Seed articles: technical notes based on general coil-engineering practice, and one company news item
// based on figures supplied by the company. Replace or extend them from the admin.

export const articles = [
  {
    slug: 'how-to-specify-a-vcm-coil', type: 'tech', days: 6, reading_min: 6,
    products: ['aw-vcm-af0806', 'aw-vcm-cw0940', 'aw-vcm-ois1210'], applications: ['smartphone-cameras'],
    title_en: 'How to specify a VCM coil so the first sample is right',
    title_zh: '如何定义 VCM 线圈规格，让首次打样即达标',
    excerpt_en: 'Seven values decide whether a voice-coil-motor coil fits, moves evenly and survives reflow. Put them on the drawing and you can skip a sampling round.',
    excerpt_zh: '七个参数决定了 VCM 线圈能否装配到位、运动均匀并经受回流焊。在图纸上写清它们，可以省去一轮打样。',
    takeaways_en: 'Specify inner window and tolerance, outline, maximum height, wire and bond type, DC resistance at a stated temperature, lead details and inductance test conditions. Let the turn count follow from resistance.',
    takeaways_zh: '请注明内窗及公差、外形、最大高度、线径与自粘类型、注明温度的直流电阻、引线要求以及电感测试条件。圈数可由电阻推导。',
    body_en: `Most coil sampling delays come from drawings that leave something open. A coil maker will fill the gap with a sensible default, and the default is often not what the actuator designer had in mind.

## The seven values that matter

1. **Inner window and its tolerance.** This is the dimension that meets the lens carrier or magnet. State the tolerance you need: it drives fixture design and cost.
2. **Outer outline.** Usually less critical, but it sets the clearance to the magnet.
3. **Height.** Give a maximum, not only a nominal. Bonding pressure trades height against side-wall bulge.
4. **Wire diameter and bond type.** Hot-air, solvent and heat-cured bond coats behave differently in reflow.
5. **DC resistance with a temperature.** Copper resistance changes by about 0.39% per °C, so a value without a temperature is ambiguous. 20 °C is the usual reference.
6. **Lead length, position and finish.** Many first-sample rejects are lead issues, not coil issues.
7. **Inductance test conditions.** Frequency and signal level change the reading.

## What you can leave to the coil maker

The turn count follows from resistance, wire and window. If you specify resistance, let the turn count float; specifying both over-constrains the part.

## Coils wound on the lens carrier

If the coil is wound directly onto the carrier, add the carrier drawing and say which surfaces are datums. The winding then shares the carrier's tolerances, which usually removes a separate coil-placement step.

## Sending the drawing

Upload a PDF or STEP file with your inquiry. Engineering reviews it and returns manufacturability notes before quoting.`,
    body_zh: `大多数线圈打样延误，源于图纸上留有未定义的项目。线圈厂会用合理的默认值补齐，但默认值往往不是马达设计者的本意。

## 七个关键参数

1. **内窗尺寸及公差。** 这是与镜头载体或磁铁配合的尺寸。请注明所需公差：它决定治具设计与成本。
2. **外形尺寸。** 通常不那么关键，但决定与磁铁的间隙。
3. **高度。** 请给出最大值，而不仅是名义值。粘合压力会在高度与侧壁鼓胀之间取舍。
4. **线径与自粘类型。** 热风、溶剂与热固化型粘合层在回流焊中的表现不同。
5. **直流电阻及测试温度。** 铜的电阻温度系数约为每摄氏度 0.39%，不注明温度的电阻值存在歧义，通常以 20 °C 为基准。
6. **引线长度、位置与处理方式。** 许多首样不良是引线问题，而非线圈本身。
7. **电感测试条件。** 频率与测试电平会改变读数。

## 可以交给线圈厂的部分

圈数由电阻、线径与内窗推导得出。如果规定了电阻，请让圈数浮动；同时规定两者会造成过约束。

## 直接绕制在镜头载体上的线圈

如果线圈直接绕制在载体上，请一并提供载体图纸并注明基准面。绕线随载体公差定位，通常可省去单独的线圈装配工序。

## 提交图纸

询价时上传 PDF 或 STEP 文件即可。工程团队审阅后，会在报价前反馈可制造性意见。`,
    faq: [
      ['Should I specify turns or resistance?', 'Resistance, at a stated temperature. The turn count then follows from the wire and window; specifying both over-constrains the coil.', '应该规定圈数还是电阻？', '规定电阻并注明温度。圈数由线径与内窗推导；同时规定两者会造成过约束。'],
      ['Why does the resistance temperature matter?', 'Copper resistance rises by about 0.39% per °C, so the same coil reads differently at 20 °C and 25 °C.', '为什么电阻要注明温度？', '铜的电阻每升高 1 °C 约增加 0.39%，同一线圈在 20 °C 与 25 °C 下的读数不同。'],
    ],
  },
  {
    slug: 'orthocyclic-vs-random-winding', type: 'tech', days: 21, reading_min: 5,
    products: ['aw-vcm-af0806', 'aw-ac-tc0402'], applications: ['smartphone-cameras', 'medical-hearing'],
    title_en: 'Orthocyclic versus random winding: what changes in the part',
    title_zh: '正交排绕与乱绕：零件会有什么不同',
    excerpt_en: 'Orthocyclic winding fills up to 90.7% of the winding cross-section with wire. Here is what that buys you, and when random winding is the better call.',
    excerpt_zh: '正交排绕可使绕线截面的线材填充率最高达到 90.7%。本文说明它带来的好处，以及乱绕更合适的场合。',
    takeaways_en: 'Orthocyclic winding nests each turn in the groove of the layer below, reaching the hexagonal packing limit of about 90.7% wire fill. It gives smaller, more repeatable coils; random winding is cheaper for high-turn bobbin coils with loose tolerances.',
    takeaways_zh: '正交排绕使每一圈落在下层两圈之间的凹槽中，可达约 90.7% 的六角密排线材填充率，线圈更小、一致性更好；对于高圈数、公差宽松的骨架线圈，乱绕成本更低。',
    body_en: `In an orthocyclic coil each turn of the second layer sits in the groove between two turns of the first. The cross-section becomes a hexagonal packing, the densest arrangement round wire allows.

## Why it matters

- **More wire in the same space.** The theoretical fill is π/(2√3), about 90.7% of the winding cross-section. That figure counts the whole wire including its enamel, so the copper share is lower and depends on the insulation thickness. Random windings fill noticeably less.
- **Predictable geometry.** Every turn has a known position, so outline and height repeat from part to part.
- **Better heat path.** Fewer air gaps mean lower thermal resistance from the inner turns.

## What it costs

Orthocyclic winding needs precise wire guidance, steady tension and a defined crossover zone where each layer steps over. Winding is slower and setup takes longer.

## When random winding wins

For bobbin coils with thousands of turns, where the outline tolerance is generous and cost dominates, a controlled random winding is usually the sensible choice.`,
    body_zh: `在正交排绕线圈中，第二层的每一圈都落在第一层两圈之间的凹槽里，截面形成六角密排，这是圆线所能达到的最密排列。

## 为什么重要

- **相同空间内更多线材。** 理论填充率为 π/(2√3)，约为绕线截面的 90.7%。该数值包括漆膜在内的整根线材，因此铜的占比更低，并取决于漆膜厚度。乱绕的填充率明显更低。
- **几何可预测。** 每一圈的位置都是确定的，外形与高度在零件之间可重复。
- **散热路径更好。** 气隙更少，内层线圈的热阻更低。

## 代价

正交排绕需要精确的排线、稳定的张力，以及每层跨越的确定换层区。绕线速度更低，调机时间更长。

## 乱绕何时更优

对于数千圈、外形公差宽松且成本敏感的骨架线圈，受控乱绕通常是更合理的选择。`,
    faq: [
      ['Is 90.7% the copper fill factor?', 'No. 90.7% is the share of the cross-section occupied by round wire in hexagonal packing, including the enamel. The copper fill is lower and depends on wire size and insulation grade.', '90.7% 是铜填充率吗？', '不是。90.7% 是圆线六角密排时线材（含漆膜）占截面的比例，铜的填充率更低，取决于线径与漆膜等级。'],
    ],
  },
  {
    slug: 'nanocrystalline-vs-ferrite-shields', type: 'tech', days: 3, reading_min: 5,
    products: ['aw-wc-rx43'], applications: ['wireless-power'],
    title_en: 'Nanocrystalline or ferrite: choosing the shield for a thin wireless receiver',
    title_zh: '纳米晶还是铁氧体：超薄无线充电接收端的导磁片选择',
    excerpt_en: 'The shield behind a receiver coil guides the field and keeps it out of the battery. Nanocrystalline sheet does that job in a fraction of the thickness of ferrite.',
    excerpt_zh: '接收线圈背后的导磁片负责引导磁场并阻止其进入电池。纳米晶片能以远小于铁氧体的厚度完成这一任务。',
    takeaways_en: 'Nanocrystalline alloys saturate at roughly two to three times the flux density of Mn-Zn ferrite, so a much thinner sheet carries the same flux. The ribbon is laminated and deliberately cracked into small flakes to limit eddy currents at charging frequencies. It suits phones and other devices where every tenth of a millimetre counts.',
    takeaways_zh: '纳米晶合金的饱和磁通密度约为锰锌铁氧体的两到三倍，因此更薄的片材即可承载相同磁通。带材经叠层并刻意碎化成小片，以抑制充电频率下的涡流。适用于手机等对厚度极其敏感的设备。',
    body_en: `A wireless charging receiver is more than a coil. Behind it sits a magnetic sheet that guides the field back to the coil, raises its inductance and shields the battery and electronics behind it. The choice of sheet sets most of the receiver's thickness.

## Why nanocrystalline sheet is thinner

Iron-based nanocrystalline alloys saturate at around 1.2 T, compared with roughly 0.4–0.5 T for the Mn-Zn ferrites used in charging coils. Because each layer can carry more flux before it saturates, the same coupling needs far less material. Individual ribbons are only around 20 µm thick, so even a multi-layer laminate stays very thin.

## Taming eddy currents

The alloy is a metal, so a continuous ribbon would carry eddy currents at charging frequencies and heat up. The laminated sheet is therefore fractured into small flakes before use. The flakes stay magnetically coupled but break the current paths, keeping losses in check.

## When ferrite is still the better choice

Ferrite is inexpensive, has low losses and is easy to shape. Transmitter pads, larger coils and products with room to spare usually use ferrite. Our dual- and triple-coil transmitters, for example, sit on ferrite plates.

## What to specify

- Outline and number of layers of the sheet
- Coil outer and inner diameter, inductance and test frequency
- Total stack thickness, including adhesive
- Lead exit position and length`,
    body_zh: `无线充电接收端不只是一个线圈。线圈背后的导磁片将磁场引回线圈、提高电感，并屏蔽其后的电池与电路。导磁片的选择决定了接收端的大部分厚度。

## 为什么纳米晶片更薄

铁基纳米晶合金的饱和磁通密度约为 1.2 T，而充电线圈常用的锰锌铁氧体约为 0.4–0.5 T。每层材料在饱和前能承载更多磁通，因此达到相同耦合所需的材料少得多。单层带材厚度仅约 20 µm，多层叠合后依然很薄。

## 抑制涡流

纳米晶合金是金属，连续的带材在充电频率下会产生涡流并发热。因此叠层片材在使用前会被碎化成细小片块：片块之间保持磁耦合，但电流路径被切断，损耗得到控制。

## 铁氧体何时更合适

铁氧体价格低、损耗低、易于成型。发射端充电板、较大的线圈以及空间充裕的产品通常采用铁氧体。例如我们的双线圈与三线圈发射器就采用铁氧体底板。

## 需要提供的规格

- 导磁片外形与层数
- 线圈外径、内径、电感及测试频率
- 含胶层在内的总厚度
- 引线出线位置与长度`,
    faq: [
      ['How thin can a receiver on nanocrystalline sheet be?', 'Our thinnest receivers with coil and nanocrystalline sheet are under 0.5 mm in total.', '纳米晶接收线圈能做到多薄？', '我们最薄的接收线圈（含线圈与纳米晶片）总厚度低于 0.5 mm。'],
      ['Why is the nanocrystalline sheet cracked?', 'Fracturing the laminated ribbon into small flakes interrupts eddy-current paths, which keeps losses and heating low at charging frequencies.', '纳米晶片为什么要碎化？', '将叠层带材碎化成小片可以切断涡流路径，在充电频率下降低损耗与发热。'],
    ],
  },
  {
    slug: 'wireless-charging-tx-coil-notes', type: 'tech', days: 38, reading_min: 6,
    products: ['aw-wc-mpp50', 'aw-wc-dt7650', 'aw-wc-tt9850'], applications: ['wireless-power'],
    title_en: 'Wireless charging transmitter coils: what drives efficiency and heat',
    title_zh: '无线充电发射线圈：影响效率与发热的因素',
    excerpt_en: 'Litz strand size, the shield behind the coil, magnet alignment and the real stack-up all change how a transmitter coil performs. What to decide, and why.',
    excerpt_zh: '利兹线股径、线圈背后的导磁片、磁吸对位以及实际叠层，都会改变发射线圈的表现。需要决定什么，以及原因。',
    takeaways_en: 'Choose litz strands well below the skin depth at the operating frequency (about 0.18 mm at 128 kHz, 0.11 mm at 360 kHz), back the coil with a shield sized for the flux, and test inductance in the real stack-up. Multi-coil arrays widen the area where a phone charges.',
    takeaways_zh: '选择远小于工作频率下趋肤深度的利兹线股径（128 kHz 约 0.18 mm，360 kHz 约 0.11 mm），为线圈配置与磁通匹配的导磁片，并在实际叠层中测试电感。多线圈阵列可扩大手机可充电的区域。',
    body_en: `A transmitter coil looks simple: a flat spiral of litz wire on a magnetic plate. Most of its performance is decided by a few choices.

## 1. Strand size follows the frequency

Current crowds towards the surface of a conductor as frequency rises. In copper the skin depth is about 0.18 mm at 128 kHz and about 0.11 mm at 360 kHz, the fixed frequency used by the Qi2 Magnetic Power Profile. Litz strands well below the skin depth keep the AC resistance, and the heat, down. More, finer strands help, but cost more and are harder to terminate.

## 2. The shield sets the floor

The plate behind the coil guides the field and protects the electronics underneath. Too thin a plate saturates or lets the field leak into the board, lowering the coil's quality factor and making foreign-object detection less dependable.

## 3. Alignment matters as much as the coil

Poor alignment wastes power as heat. Qi2 uses a magnet ring to snap the phone into place; single-coil pads without magnets leave alignment to the user.

## 4. More coils, more placement freedom

Dual- and triple-coil arrays overlap several coils so a phone charges across a wider area. The controller picks the best-coupled coil, so coil positions must match what the firmware expects.

## 5. Test in the real stack-up

The distance from coil to charging surface, and every material in between, changes inductance. Quote and test the coil in the stack-up it will be used in.`,
    body_zh: `发射线圈看起来很简单：铺在导磁板上的利兹线平面螺旋。它的大部分表现由几个关键选择决定。

## 1. 股径取决于频率

频率越高，电流越集中在导体表面。铜在 128 kHz 下的趋肤深度约为 0.18 mm，在 360 kHz（Qi2 磁吸功率规范 MPP 采用的固定频率）下约为 0.11 mm。股径远小于趋肤深度的利兹线可以降低交流电阻与发热。股数更多、股径更细会更好，但成本更高、端接更难。

## 2. 导磁片决定下限

线圈背后的导磁板负责引导磁场并保护下方电路。导磁板过薄会饱和或使磁场泄漏到电路板上，降低线圈品质因数，并使异物检测不够可靠。

## 3. 对位与线圈同样重要

对位不良会把能量变成热量。Qi2 通过磁环让手机自动吸附到位；没有磁铁的单线圈充电板则需要用户自行对准。

## 4. 线圈越多，摆放越自由

双线圈与三线圈阵列将多个线圈重叠排布，使手机在更大区域内都能充电。主控会选择耦合最好的线圈，因此线圈位置必须与固件预期一致。

## 5. 在实际叠层中测试

线圈到充电面的距离以及中间的每一层材料都会改变电感。请在实际使用的叠层中报价与测试线圈。`,
    faq: [
      ['What frequency does Qi2 MPP use?', 'The Qi2 Magnetic Power Profile operates at a fixed 360 kHz, so litz strands are chosen for a skin depth of about 0.11 mm.', 'Qi2 MPP 的工作频率是多少？', 'Qi2 磁吸功率规范（MPP）采用 360 kHz 固定频率，利兹线股径需按约 0.11 mm 的趋肤深度选择。'],
    ],
  },
  {
    slug: 'self-bonding-wire-explained', type: 'tech', days: 64, reading_min: 4,
    products: ['aw-ac-vc1200', 'aw-vcm-pr1604'], applications: ['smartphone-cameras', 'home-devices'],
    title_en: 'Self-bonding wire: hot air, solvent or current?',
    title_zh: '自粘线：热风、溶剂还是通电粘合？',
    excerpt_en: 'Bobbinless coils hold their shape because the wire bonds to itself. The bonding method affects strength, cycle time and how the coil behaves in reflow.',
    excerpt_zh: '无骨架线圈之所以能保持形状，是因为线材自身相互粘合。粘合方式影响强度、节拍以及线圈在回流焊中的表现。',
    takeaways_en: 'Self-bonding wire has a bond coat over its insulation. Hot air, solvent or resistance heating activates it so the turns fuse into a solid coil. For coils that see reflow, confirm the bond coat’s softening temperature or use a heat-curing type.',
    takeaways_zh: '自粘线在绝缘层外还有一层粘合层，通过热风、溶剂或通电加热激活后，各圈熔合为整体。需经回流焊的线圈，应确认粘合层的软化温度或选用热固化型。',
    body_en: `Self-bonding wire carries an extra bond coat over the insulation. Activate it and adjacent turns fuse into a solid coil that needs no bobbin.

## Hot air
Hot air is blown onto the wire as it is wound. Fast and clean, and widely used for small air-core coils.

## Solvent
A solvent such as alcohol activates the bond coat during winding. Useful for very fine wire where hot air could disturb the turns.

## Resistance heating
Current through the finished coil heats it from inside. It gives an even bond through thick coils, at a slower cycle.

## Reflow behaviour
Most bond coats are thermoplastic and soften again when reheated; heat-curing types set permanently. If the coil goes through lead-free reflow, check the bond coat’s rating and confirm with a reflow test on samples.`,
    body_zh: `自粘线在绝缘层外多了一层粘合层。激活后，相邻各圈熔合为无需骨架的整体线圈。

## 热风
绕线时向线材吹送热风。速度快、洁净，广泛用于小型空心线圈。

## 溶剂
绕线时以酒精等溶剂激活粘合层，适合热风可能扰动线圈的极细线。

## 通电加热
对成品线圈通电，由内部加热。厚线圈粘合均匀，但节拍较慢。

## 回流焊表现
大多数粘合层为热塑性，再次加热会软化；热固化型粘合后则不再软化。需经无铅回流焊的线圈，请确认粘合层的耐温等级，并用样品做回流焊验证。`,
    faq: [],
  },
  {
    slug: 'workshop-capacity-2026', type: 'news', days: 2, reading_min: 2,
    products: [], applications: [],
    title_en: 'Our workshop: 50+ Nittoku winding machines and 20 million coils a month',
    title_zh: '我们的车间：五十余台日特绕线机，月产能两千万颗线圈',
    excerpt_en: 'A short profile of where our coils are made: 1,800 m², more than 90 people, more than 50 winding machines and more than 30 supporting machines.',
    excerpt_zh: '简要介绍我们的生产车间：1,800 平方米、九十余名员工、五十余台绕线机与三十余台配套设备。',
    takeaways_en: 'The workshop covers 1,800 m² and employs more than 90 people. It runs more than 50 winding machines, most of them Nittoku machines imported from Japan, and more than 30 supporting machines. Capacity across all coil types is 20 million units a month.',
    takeaways_zh: '车间面积 1,800 平方米，员工九十余人，拥有五十余台绕线机（大部分为日本进口日特设备）与三十余台配套设备，全品类线圈月产能两千万颗。',
    body_en: `Buyers qualifying a new coil supplier usually ask the same questions first: how big is the operation, what equipment does it run, and how much can it make. Here are the answers.

## The workshop

- **Area:** 1,800 m²
- **People:** more than 90 employees
- **Founded:** 2021

## Equipment

- **Winding:** more than 50 winding machines of several types. Most are Nittoku machines imported from Japan.
- **Supporting machines:** more than 30, covering soldering, tray loading, visual inspection, automated assembly and quality testing.

## Capacity

Current capacity across all coil types is **20 million units a month**. About one in ten VCM coils shipped worldwide is wound here.

## Quality

The quality management system is certified to ISO 9001, and our materials are RoHS compliant. Certificates are available on request.`,
    body_zh: `采购方在认证新的线圈供应商时，通常先问几个同样的问题：规模多大、用什么设备、能生产多少。以下是答案。

## 车间

- **面积：** 1,800 平方米
- **人员：** 九十余名员工
- **成立：** 2021 年

## 设备

- **绕线：** 五十余台多种类型的绕线机，大部分为日本进口的日特（Nittoku）设备。
- **配套设备：** 三十余台，涵盖焊锡、摆盘、视觉检测、自动组装与品质测试。

## 产能

目前全品类线圈月产能为 **两千万颗**。全球约十分之一的 VCM 线圈在这里绕制。

## 品质

质量管理体系通过 ISO 9001 认证，材料符合 RoHS 要求。如需证书，欢迎索取。`,
    faq: [
      ['How many coils can you make per month?', 'About 20 million units a month across all coil types.', '月产能是多少？', '全品类线圈月产能约两千万颗。'],
      ['What winding machines do you use?', 'More than 50 winding machines, most of them Nittoku machines imported from Japan.', '使用什么绕线设备？', '五十余台绕线机，大部分为日本进口的日特（Nittoku）设备。'],
    ],
  },
];
