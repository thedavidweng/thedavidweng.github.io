// 简体中文文案：结构与英文版一致，事实和链接共用 data.typ。
#import "../data.typ": hub, hairline
#let t = (
  lang: "zh", region: "cn",
  doc: (
    title: "DAVID — 使用说明书",
    description: "以五个模块组装成的工作柜，图解 David Weng 的工作、技能与项目。简历的作品集补充。",
    keywords: ("David Weng", "作品集", "产品工程师", "创意技术", "使用说明书"),
  ),
  footer: [DAVID — 使用说明书],
  role: [产品工程师与创意技术专家],
  labels: (website: "网站", source: "源代码", uses: "使用模块", seen: "应用实例"),
  modules: (
    ([框架], [系统思维]),
    ([水平仪], [产品思维]),
    ([内六角扳手], [软件工程]),
    ([抽屉], [体验与视觉设计]),
    ([洞洞板], [开源工具]),
  ),
  cover: (
    subtitle: [使用说明书],
    tagline: [一座用来构建软件的工作台。五个模块，组装完成。],
    edition: [第 1 版 \ 2026 年 10 月],
  ),
  parts: (
    kicker: "包装内容", title: [包装里有什么？],
    lede: [五个模块。后面的每个项目，都会再次用到这里的部件。],
    items: (
      ([撑住整个系统。找到唯一可信的数据来源，再围绕它构建。], [tg-drive 以 Telegram 频道为准，数据库只是缓存。]),
      ([改动前先看哪里偏了，也明确产品不该做什么。], [ADP Shifts 只写入自己创建的那个日历。]),
      ([对准眼前的螺栓：选择适合平台的技术栈。], [Sukiru 用 Swift，OpenKara 用 Rust 和 Tauri，tg-drive 用 Go 和 Wails。]),
      ([按预期打开，清楚地展示里面有什么。], [Sukiru 只用系统控件，用平实的语言报告技能库健康状况。]),
      ([把工具挂在人和 AI 智能体够得到的地方，并设好操作关卡。], [canvas-cli 提供 `--json`、`--dry-run` 和 `--confirm`。]),
    ),
  ),
  steps: (
    kicker: "组装说明", title: [我的工作方式],
    lede: [四步，按顺序进行。每一步都是同一座工作柜。],
    items: (
      ([找到阻力], [先放下水平仪。改动前，量清楚哪里不对。], [一份只存在于 ADP 里的排班表。]),
      ([理清系统], [把框架扶正。写代码前，先明确各个部分归谁负责。], [Sukiru 判断每个技能归哪个安装器管理。]),
      ([做对的东西], [用匹配的扳手：选适合平台和用户的工具。], [Mac 应用用 Swift 和 AppKit，单文件程序用 Go。]),
      ([测试、学习、改进], [拉开抽屉，再推回去。检查结果，并想好如何撤销改动。], [Sukiru 每批修复前拍快照；tg-drive 修改操作需 `--confirm`。]),
    ),
  ),
  sukiru: (
    kicker: "项目 · Sukiru", title: [让复杂变得可控],
    lede: [编程智能体从共享文件夹加载技能。两个官方安装器 `npx skills` 和 `gh skill` 都往里面写入，却各记各的账，谁也不读对方的记录。],
    before: (head: [修复前], items: (
      [锁定记录指向已不存在的内容。],
      [文件夹移动后，链接失效。],
      [同一技能的副本逐渐分叉。],
      [两个安装器同时认领同一技能。],
    )),
    after: (head: [修复后], items: (
      [一份用平实语言写成的健康报告。],
      [每项修复交给负责该技能的安装器。],
      [确认后，所有修复作为一批统一执行。],
      [自己不另记一本可能失调的账。],
    )),
    check: (head: [最后检查], body: [每批修复前先拍快照，可以整批回滚。命令行工具的 `--dry-run` 会在改动前展示同样的修复。]),
    built: [用 Swift、SwiftUI 和 AppKit 构建的原生 macOS 应用，只用系统控件。],
  ),
  openkara: (
    kicker: "项目 · OpenKara", title: [你的音乐，\ 你的舞台。],
    lede: [OpenKara 把你已经拥有的歌曲，在你自己的电脑上变成卡拉 OK。],
    flow: (
      ([歌曲], [曲库里的任意一首歌。]),
      ([二轨], [人声与伴奏。]),
      ([四轨], [人声、鼓、贝斯、其他。]),
      ([混音], [调低人声，开始唱。]),
    ),
    alternative: [或],
    local: (
      yes: [开源 AI 模型 Demucs 在本机完成音轨分离。],
      no: [无需上传、账号或订阅。],
    ),
    facts: (
      ([平台], [支持 macOS、Windows 和 Linux，使用 Tauri 和 Rust 构建。]),
      ([歌词], [来自在线来源、内嵌标签、`.lrc` 文件或 CD+G。]),
      ([曲库], [可以随身携带，放在 NAS 或 U 盘上也能用。]),
    ),
  ),
  tgdrive: (
    kicker: "项目 · tg-drive", title: [一个引擎，两种界面],
    lede: [Telegram 频道能存放大文件，但它是一条时间线。tg-drive 将它变成桌面和终端都能浏览的文件树。],
    callouts: (
      channel: [*唯一可信来源。*Telegram 频道中的消息。],
      engine: [*一个引擎*，服务两个前端。],
      cache: [*缓存。*本地 SQLite 索引，可以丢失。],
      cli: [终端里的 `td`。],
      gui: [`td-gui`，用 Wails 构建的桌面应用。],
    ),
    rebuild: (
      head: [如果缓存丢了],
      steps: (
        [通过索引浏览文件。],
        [数据库丢了，文件没有丢。],
        [`td scan --full` 读取频道，重建索引。],
      ),
    ),
    guards: [破坏性命令需 `--confirm`。操作锁避免两次运行冲突。每条命令都能输出稳定的 JSON。],
  ),
  adp: (
    kicker: "项目 · ADP Shifts", title: [让例行公事消失],
    lede: [在使用 ADP Workforce Now 的单位，排班表只存在于 ADP 里。ADP Shifts 把它复制到你自己的日历中，并保持更新。],
    howto: (
      [从 Chrome 应用商店添加 ADP Shifts。],
      [在 ADP 里打开一次 Calendar。],
      [连接 Google。],
      [班次出现在名为 ADP Shifts 的日历里。],
    ),
    yes: (
      [复用浏览器里已有的 ADP 登录会话。],
      [只写入自己创建的那个日历，申请 Google 范围最小的日历权限。],
      [每天和打开 Workforce Now 时检查变化。取消的班次在下次同步时删除。],
    ),
    no: (
      [从不索要 ADP 密码。],
      [无法读取或修改其他任何日历。],
      [没有服务器，也没有数据统计。],
    ),
    others: [不用 Google？可以导出 `.ics`，或使用无需 Google 账号的用户脚本。],
  ),
  catalogue: (
    kicker: "产品目录", title: [兼容产品],
    lede: [截至 2026 年 10 月，软件中心上的全部十五个产品，全部开源。],
    kicker2: "产品目录 · 续", title2: [桌面应用],
    lede2: [七款应用，各自面向适合的平台。],
    docs: "文档",
    more: [完整的最新列表：#link(hub)[thedavidweng.github.io/site]],
    groups: (
      cli: (head: [命令行工具], items: (
        [Canvas LMS 的课程、作业、提交与评分。],
        [Zenodo 的研究记录与文件上传。],
        [Monarch Money 的账户、交易、预算与现金流。],
        [Flickr 照片备份、上传、相册及 Piwigo 导入。],
        [Qualtrics 问卷、答卷导出及离线问卷编译器。],
        [本地优先的财务后端，加密 SQLite，稳定 JSON。],
      )),
      plugin: (head: [插件], items: (
        [把 Steam Deck 变成电脑、手机或平板的蓝牙手柄。],
      )),
      ext: (head: [浏览器扩展], items: (
        [将 ADP Workforce Now 的排班同步到专属 Google 日历。],
      )),
      app: (head: [桌面应用], items: (
        [用自己的音乐唱卡拉 OK，在本机分离音轨。],
        [在 macOS 上检查并修复编程智能体的技能库。],
        [原生 macOS 语音合成，附带时间轴文本，完全本地。],
        [备份、刷写和恢复 MT1959 蓝光光驱固件。],
        [Telegram 频道上的可恢复文件树，附带 `td` CLI。],
        [将 Steam 游戏库整理为播放列表，提供推荐与清理。],
        [用 ACE-Step 在 Mac 上生成音乐，完全本地。Alpha。],
      )),
    ),
  ),
  care: (
    kicker: "使用与保养", title: [正确与错误示范],
    lede: [三个让柜体保持方正的习惯，每个都有已交付的项目作证。],
    items: (
      ([用负责这件事的工具], [从外部强行修复。], [交给负责它的工具。], [Sukiru 通过负责技能的安装器修复，并使用 Mac 自己的控件。]),
      ([改动前先预览], [先钻孔，后测量。], [先标记，再对准标记钻孔。], [canvas-cli 和 qualtrics-cli 提供 `--dry-run` 和 `--confirm`；SDF Flash GUI 写固件前要求手动输入确认。]),
      ([留好退路], [胶粘接头，无法拆开。], [螺栓接头，可以拆开。], [Sukiru 每批拍快照；tg-drive 从频道重建索引；Vapourfly 写入 Steam 文件前先备份。]),
    ),
    local: (head: [能在本地就在本地], body: [OpenKara 在本机分离音轨；Apple Say 和 OpenLoop 在 Mac 上运行；money 将数据存放在加密 SQLite 中。]),
  ),
  together: (
    kicker: "协作指南", title: [联系支持之前],
    lede: [怎样带来一个问题、会得到什么，以及最浪费时间的误区。],
    cols: (
      (head: [请带来], items: (
        [用平实的话描述浪费时间的时刻，以及谁遇到了它。],
        [现在唯一可信的数据来源在哪里。],
        [哪些不能改变：平台、数据、预算、期限。],
        [一个真实例子：文件、截图或日志。],
      )),
      (head: [你会得到], items: (
        [写代码前，先用短计划明确各部分及其负责人。],
        [尽早可以试用的原型、试运行或命令行工具。],
        [可以预览和撤销的改动。],
        [用平实的话说明取舍，包括哪些没有做。],
      )),
      (head: [请避免], items: (
        [从功能清单出发，而不是从阻力出发。],
        [两个系统都认为自己拥有同一份数据。],
        [改动无法预览，也没有退路。],
        [要求第一版就做完所有事情。],
      )),
    ),
  ),
  contact: (
    kicker: "组装完成", title: [可以开始使用了。],
    next: (head: [下一步], body: [发给我一个阻力：一个浪费时间的时刻。我会回复先做什么，以及哪些先不做。]),
    place: [加拿大不列颠哥伦比亚省温哥华],
    labels: (email: "邮箱", website: "个人网站", software: "软件", github: "GitHub", linkedin: "LinkedIn", resume: "简历"),
    colophon: [*版本说明。*第 1 版，2026 年 10 月。Mona Sans 和 Noto Sans SC 均采用 SIL 开源字体许可证 1.1。插图使用 Lucas Marques 的 #link(hairline)[Hairline]（MIT 许可证）绘制并导出为矢量图。使用 Typst 排版。项目信息于 2026 年 10 月对照公开仓库和网站核实。本手册由 David Weng 独立出版，与宜家（IKEA）没有关联，也未获其赞助或认可。],
  ),
)
