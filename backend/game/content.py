# -*- coding: utf-8 -*-
"""
محتوای بازی «کشف دنیای توانایی‌ها».

منبع واحد محتوا: هم برای نمایش در فرانت‌اند (public_content) و هم برای امتیازدهی سمت سرور.
کلیدهایی که با «_» شروع می‌شوند فقط سمت سرور می‌مانند (وزن‌ها، پاسخ درست، برچسب رویکرد ...).
همهٔ متن‌ها و فعالیت‌ها اختصاصی نوشته شده‌اند و از هیچ آزمون دارای حق نشری کپی نشده‌اند.
"""
import copy

CONTENT_VERSION = "1.0"

RIASEC = ["R", "I", "A", "S", "E", "C"]
RIASEC_FA = {
    "R": "عملی و فنی",
    "I": "پژوهشی و تحلیلی",
    "A": "هنری و خلاق",
    "S": "اجتماعی و آموزشی",
    "E": "کارآفرینی و رهبری",
    "C": "سازمانی و منظم",
}

# رویکردهای حل مسئله (مرحله ۲)
APPROACHES = {
    "analytic":      {"title": "تحلیلی",       "desc": "اول بررسی و پیدا کردن علت، بعد اقدام", "letter": "I"},
    "hands_on":      {"title": "عمل‌گرا",      "desc": "رفتن سر اصل کار و حل مسئله با دست و ابزار", "letter": "R"},
    "creative":      {"title": "ابتکاری",      "desc": "ساختن راه‌حل تازه به جای راه‌های آماده", "letter": "A"},
    "collaborative": {"title": "همکاری‌محور",  "desc": "حل مسئله از راه جلب همکاری آدم‌ها", "letter": "S"},
    "decisive":      {"title": "هدایت‌گر",     "desc": "تصمیم سریع، تقسیم مسئولیت و رهبری", "letter": "E"},
    "systematic":    {"title": "روش‌مند",      "desc": "حرکت مرحله‌به‌مرحله بر اساس برنامه و ترتیب", "letter": "C"},
}

# نیازهای انگیزشی (نظریه خودتعیین‌گری)
MOTIVES = {
    "autonomy":    {"title": "آزادی و ابتکار",     "desc": "خودم انتخاب کنم و راه خودم را بروم"},
    "competence":  {"title": "تسلط و پیشرفت",       "desc": "مهارتم بیشتر شود و کار را خوب بلد باشم"},
    "relatedness": {"title": "ارتباط و اثرگذاری",   "desc": "با آدم‌ها باشم و برایشان مفید باشم"},
}

STARS = 3          # تعداد ستاره‌های مرحله ۱
WORLD_PICKS = 3    # تعداد دنیاهای مرحله ۴
GEMS = 6           # تعداد جواهرهای قطب‌نمای انگیزه

POINTS = {
    "zone_visit": 10, "star": 15, "motive_chip": 5,
    "clue": 15, "decision": 50, "tools": 40,
    "pattern_first": 100, "pattern_second": 60, "pattern_fail": 10,
    "sort_item": 12, "sort_bonus": 40,
    "design_item": 10, "design_title": 20, "design_revise": 25,
    "circuit_first": 150, "circuit_later": 90, "circuit_try": 20,
    "world": 30, "compass": 30,
    "stage_complete": 50,
}

# ---------------------------------------------------------------- مراحل
STAGES = [
    {"id": 1, "key": "island", "title": "جزیره انتخاب‌ها",
     "subtitle": "کدام محیط‌ها تو را به سمت خودشان می‌کشند؟",
     "story": "به جزیره‌ی انتخاب‌ها خوش آمدی! شش محیط پر از ماجرا اینجا هست. به هر کدام سر بزن، ببین چه خبر است و سه ستاره‌ی طلایی‌ات را روی جاهایی بگذار که بیشتر دوستشان داری.",
     "guide": "من «مهاری» هستم، راهنمای تو. هیچ جواب درست یا غلطی وجود ندارد؛ فقط خودت باش!"},
    {"id": 2, "key": "rescue", "title": "مأموریت نجات",
     "subtitle": "شهر هوشمند نورآباد به کمک تو نیاز دارد",
     "story": "ناگهان برق نورآباد رفته، چراغ‌های ترافیک دیوانه شده‌اند و مردم سردرگم‌اند. تنها تو آن‌جا هستی؛ هر تصمیمی بگیری مسیر داستان عوض می‌شود. راه‌های زیادی برای نجات شهر وجود دارد.",
     "guide": "هر راهی که انتخاب کنی می‌تواند شهر را نجات بدهد. فقط ببین کدام شیوه به تو نزدیک‌تر است."},
    {"id": 3, "key": "workshop", "title": "کارگاه خلاقیت",
     "subtitle": "دست‌به‌کار شو و مأموریت‌ها را انجام بده",
     "story": "شهر نجات پیدا کرد و حالا مهندس‌های نورآباد تو را به کارگاهشان دعوت کرده‌اند. چند ایستگاه آماده است؛ هر ترتیبی که دوست داری انجامشان بده. اگر اشتباه کردی نگران نباش، بازخورد می‌گیری و دوباره امتحان می‌کنی.",
     "guide": "اینجا می‌خواهم ببینم چطور کار می‌کنی، نه این‌که نمره بدهم. یادگرفتن از بازخورد هم بخشی از بازی است."},
    {"id": 4, "key": "future", "title": "سرزمین آینده",
     "subtitle": "دنیای کاری آینده‌ات را انتخاب کن",
     "story": "آخرین ایستگاه! شش جزیره‌ی شناور در آسمان می‌درخشند؛ هر کدام یک دنیای کاری متفاوت است. سه دنیایی را که دوست داری در آن‌ها فعالیت کنی انتخاب کن؛ بعد گزارش اختصاصی‌ات ساخته می‌شود.",
     "guide": "تقریباً رسیدیم! بعد از این انتخاب، گزارش تو آماده می‌شود."},
]

# ---------------------------------------------------------------- مرحله ۱
ZONES = [
    {"id": "workshop", "title": "کارگاه ساخت و تعمیر",
     "blurb": "بوی روغن و فلز، صدای ابزار و دستگاه‌هایی که منتظر تعمیرند.",
     "activities": ["باز کردن یک دستگاه خراب و پیدا کردن عیب آن", "ساختن یک ماکت متحرک با چوب و موتور", "تنظیم و راه‌اندازی یک ابزار کار"],
     "_weights": {"R": 1.0}},
    {"id": "lab", "title": "آزمایشگاه کشف و تحلیل",
     "blurb": "میکروسکوپ، نمودار و پرسش‌هایی که جواب ساده‌ای ندارند.",
     "activities": ["مقایسه‌ی نتیجه‌ی چند آزمایش و پیدا کردن دلیل تفاوت", "کشف الگو در عدد و داده", "تحقیق درباره‌ی این‌که یک پدیده چرا رخ می‌دهد"],
     "_weights": {"I": 1.0}},
    {"id": "studio", "title": "استودیوی طراحی",
     "blurb": "رنگ، بوم، تصویر و ایده‌هایی که از هیچ ساخته می‌شوند.",
     "activities": ["طراحی یک پوستر یا شخصیت تازه", "انتخاب رنگ و فرم برای یک برند", "ساختن یک ویدیو یا داستان تصویری"],
     "_weights": {"A": 1.0}},
    {"id": "hub", "title": "فضای تعامل و آموزش",
     "blurb": "کلاس، گفت‌وگو و لحظه‌ای که کسی چیزی را برای اولین بار می‌فهمد.",
     "activities": ["توضیح یک موضوع سخت به زبان ساده", "گوش دادن به مشکل یک نفر و کمک به او", "اداره‌ی یک کارگاه گروهی"],
     "_weights": {"S": 1.0}},
    {"id": "command", "title": "مرکز مدیریت و برنامه‌ریزی",
     "blurb": "نقشه، جدول زمانی، تیم و تصمیم‌هایی که کل پروژه را جلو می‌برند.",
     "activities": ["تقسیم وظایف بین یک تیم و پیگیری آن‌ها", "راه‌اندازی یک کسب‌وکار کوچک", "تنظیم بودجه و زمان‌بندی یک رویداد"],
     "_weights": {"E": 0.8, "C": 0.5}},
    {"id": "tech", "title": "اتاق فناوری و برنامه‌نویسی",
     "blurb": "صفحه‌هایی پر از کد، ربات‌ها و برنامه‌هایی که کارها را خودکار می‌کنند.",
     "activities": ["نوشتن یک برنامه‌ی کوچک که کاری را خودکار کند", "پیدا کردن خطا در یک کد", "ساختن یک ربات یا وب‌سایت ساده"],
     "_weights": {"I": 0.5, "C": 0.5, "R": 0.4}},
]

REACTIONS = {
    "love": {"title": "عاشقشم!", "value": 2},
    "ok":   {"title": "بد نیست", "value": 1},
    "no":   {"title": "برای من نیست", "value": 0},
}

# ---------------------------------------------------------------- مرحله ۲
CLUES = [
    {"id": "control", "title": "مرکز کنترل", "text": "صفحه‌ها پر از پیغام خطای تکراری‌اند. آخرین به‌روزرسانی سامانه ساعت ۰۶:۰۲ نصب شده است."},
    {"id": "power", "title": "پست برق", "text": "بوی سوختگی می‌آید؛ یک فیوز ذوب شده و چند کابل خیس است."},
    {"id": "square", "title": "میدان شهر", "text": "مردم گروه‌گروه جمع شده‌اند و هر کس خبر متفاوتی می‌گوید؛ هیچ‌کس هماهنگ نیست."},
]

SCENE1 = {
    "id": "scene1",
    "title": "اولین قدم",
    "prompt": "شهر در تاریکی فرو رفته است. اولین کاری که می‌کنی چیست؟",
    "options": [
        {"id": "s1_analytic", "title": "بررسی گزارش‌های مرکز کنترل", "desc": "قبل از هر اقدامی داده‌ها و لاگ‌ها را می‌خوانم تا علت واقعی را پیدا کنم.",
         "cause": "software", "icon": "analytic", "fx": {"light": 8, "calm": 4}, "_tag": "analytic", "_risk": 0.3},
        {"id": "s1_hands", "title": "رفتن به پست برق", "desc": "خودم به محل می‌روم و با ابزار، دستگاه‌ها را بازرسی و تعمیر می‌کنم.",
         "cause": "hardware", "icon": "hands_on", "fx": {"light": 12, "calm": 2}, "_tag": "hands_on", "_risk": 0.6},
        {"id": "s1_creative", "title": "ساختن روشنایی ابتکاری", "desc": "با پهپادها و قطعات موجود یک روشنایی اضطراری تازه می‌سازم، حتی اگر کسی قبلاً نساخته باشد.",
         "cause": "hardware", "icon": "creative", "fx": {"light": 10, "calm": 6}, "_tag": "creative", "_risk": 0.8},
        {"id": "s1_collab", "title": "جمع کردن مردم", "desc": "از ساکنان و فنی‌کارهای محله کمک می‌گیرم و گروه‌های امدادی می‌سازم.",
         "cause": "people", "icon": "collaborative", "fx": {"light": 4, "calm": 14}, "_tag": "collaborative", "_risk": 0.4},
        {"id": "s1_decisive", "title": "اعلام وضعیت اضطراری", "desc": "سریع مسئولیت‌ها را بین تیم‌ها تقسیم می‌کنم و فرمان می‌دهم.",
         "cause": "people", "icon": "decisive", "fx": {"light": 6, "calm": 10}, "_tag": "decisive", "_risk": 0.7},
        {"id": "s1_system", "title": "اجرای پروتکل بحران", "desc": "برگه‌ی روش اضطراری را برمی‌دارم و مرحله به مرحله جلو می‌روم.",
         "cause": "software", "icon": "systematic", "fx": {"light": 7, "calm": 8}, "_tag": "systematic", "_risk": 0.1},
    ],
}

SCENE2 = {
    "id": "scene2",
    "title": "گره اصلی",
    "causes": {
        "software": {
            "discovery": "ماجرا روشن شد: یک به‌روزرسانی ناقص، سامانه‌ی ترافیک و روشنایی را هم‌زمان قفل کرده است.",
            "prompt": "حالا باید با این مشکل نرم‌افزاری چه کنی؟",
            "options": [
                {"id": "s2_sw_trace", "title": "ردیابی خط‌به‌خطِ خطا", "desc": "ماژول معیوب را دقیق پیدا می‌کنم تا فقط همان را درست کنم.", "icon": "analytic", "fx": {"light": 12, "calm": 4}, "_tag": "analytic", "_risk": 0.3},
                {"id": "s2_sw_rollback", "title": "بازگردانی به نسخه‌ی پایدار", "desc": "طبق دستورالعمل، گام‌به‌گام سامانه را به نسخه‌ی قبلی برمی‌گردانم.", "icon": "systematic", "fx": {"light": 12, "calm": 6}, "_tag": "systematic", "_risk": 0.1},
                {"id": "s2_sw_patch", "title": "نوشتن یک وصله‌ی تازه", "desc": "به جای برگشتن، یک راه‌حل هوشمندتر و جدید برای کل سامانه می‌سازم.", "icon": "creative", "fx": {"light": 14, "calm": 2}, "_tag": "creative", "_risk": 0.8},
                {"id": "s2_sw_team", "title": "تماس با برنامه‌نویسان شهر", "desc": "چند نفر را خبر می‌کنم و کار را بین‌شان تقسیم می‌کنم.", "icon": "collaborative", "fx": {"light": 10, "calm": 10}, "_tag": "collaborative", "_risk": 0.4},
            ],
        },
        "hardware": {
            "discovery": "ماجرا روشن شد: ترانسفورماتور اصلی داغ کرده، فیوز سوخته و بخشی از شبکه آب‌گرفته است.",
            "prompt": "حالا با این خرابی فنی چه می‌کنی؟",
            "options": [
                {"id": "s2_hw_fix", "title": "تعویض فیوز و خنک‌سازی", "desc": "با دست خودم فیوز را عوض می‌کنم و ترانس را خنک می‌کنم.", "icon": "hands_on", "fx": {"light": 14, "calm": 3}, "_tag": "hands_on", "_risk": 0.6},
                {"id": "s2_hw_measure", "title": "اندازه‌گیری دقیق بار شبکه", "desc": "پیش از هر تعویض، بار و ولتاژ را اندازه می‌گیرم و جدول می‌کنم.", "icon": "analytic", "fx": {"light": 10, "calm": 6}, "_tag": "analytic", "_risk": 0.2},
                {"id": "s2_hw_bypass", "title": "ساختن مسیر برق جایگزین", "desc": "با قطعات موجود یک مسیر موقت و ابتکاری برای عبور برق می‌سازم.", "icon": "creative", "fx": {"light": 13, "calm": 3}, "_tag": "creative", "_risk": 0.8},
                {"id": "s2_hw_prior", "title": "قطع بخش خراب و اولویت‌بندی", "desc": "سریع تصمیم می‌گیرم کدام بخش اول برق‌دار شود: بیمارستان و مدرسه‌ها.", "icon": "decisive", "fx": {"light": 9, "calm": 10}, "_tag": "decisive", "_risk": 0.6},
            ],
        },
        "people": {
            "discovery": "ماجرا روشن شد: شایعه پخش شده، گروه‌ها دستورهای ضد و نقیض گرفته‌اند و ایستگاه مرکزی بی‌صاحب مانده است.",
            "prompt": "حالا با این بی‌نظمی چه می‌کنی؟",
            "options": [
                {"id": "s2_pp_talk", "title": "گفت‌وگو با نماینده‌ی محله‌ها", "desc": "با آدم‌ها حرف می‌زنم و یک تیم مشترک می‌سازم.", "icon": "collaborative", "fx": {"light": 6, "calm": 16}, "_tag": "collaborative", "_risk": 0.3},
                {"id": "s2_pp_command", "title": "تعیین فرمانده برای هر منطقه", "desc": "یک دستور واحد صادر می‌کنم و مسئول هر بخش را مشخص می‌کنم.", "icon": "decisive", "fx": {"light": 8, "calm": 12}, "_tag": "decisive", "_risk": 0.7},
                {"id": "s2_pp_table", "title": "ساختن جدول وظایف", "desc": "فهرست و جدول کارها را می‌نویسم تا هر کس بداند چه باید بکند.", "icon": "systematic", "fx": {"light": 8, "calm": 12}, "_tag": "systematic", "_risk": 0.1},
                {"id": "s2_pp_board", "title": "تابلوی اطلاع‌رسانی ابتکاری", "desc": "با پروژکتور، پیام‌های شفاف را روی ساختمان‌ها نمایش می‌دهم.", "icon": "creative", "fx": {"light": 8, "calm": 12}, "_tag": "creative", "_risk": 0.6},
            ],
        },
    },
}

TOOLS = {
    "id": "scene3",
    "title": "کوله‌ی مأموریت",
    "prompt": "جا برای همه‌چیز نیست! فقط ۲ ابزار را در کوله‌ات بگذار.",
    "pick": 2,
    "options": [
        {"id": "t_scanner", "title": "اسکنر داده", "desc": "الگوی خطا را نشان می‌دهد", "icon": "scanner", "_tag": "analytic"},
        {"id": "t_toolbox", "title": "جعبه‌ابزار مهندسی", "desc": "برای تعمیر مستقیم", "icon": "toolbox", "_tag": "hands_on"},
        {"id": "t_ideas", "title": "تخته‌ی ایده", "desc": "برای ساختن راه‌حل تازه", "icon": "ideaboard", "_tag": "creative"},
        {"id": "t_radio", "title": "بی‌سیم گروهی", "desc": "برای هماهنگی با آدم‌ها", "icon": "radio", "_tag": "collaborative"},
        {"id": "t_map", "title": "نقشه‌ی فرماندهی", "desc": "برای تصمیم و تقسیم وظیفه", "icon": "commandmap", "_tag": "decisive"},
        {"id": "t_checklist", "title": "چک‌لیست ایمنی", "desc": "برای رعایت ترتیب و دقت", "icon": "checklist", "_tag": "systematic"},
    ],
}

SCENE4 = {
    "id": "scene4",
    "title": "طرح نهایی",
    "prompt": "پنجره‌ی زمانی دارد بسته می‌شود. طرح نهایی برای روشن کردن کل شهر کدام است؟",
    "options": [
        {"id": "s4_fast", "title": "اجرای فوری", "desc": "همین حالا اجرا می‌کنم؛ خطاها را حین کار اصلاح می‌کنم.", "icon": "decisive", "fx": {"light": 30, "calm": 8},
         "ending": "شهر در چند دقیقه روشن شد. چند خطای کوچک پیش آمد، اما چون سریع تصمیم گرفتی، همه را در لحظه جمع‌وجور کردی.",
         "_tag": "decisive", "_risk": 0.9},
        {"id": "s4_safe", "title": "اجرای کند و آزمایش‌شده", "desc": "هر مرحله را قبل از اجرا آزمایش می‌کنم، حتی اگر دیرتر تمام شود.", "icon": "systematic", "fx": {"light": 30, "calm": 14},
         "ending": "اجرا ساعتی بیشتر طول کشید، اما شهر بدون حتی یک خطا و کاملاً پایدار روشن شد.",
         "_tag": "systematic", "_risk": 0.1},
        {"id": "s4_novel", "title": "طرح نوآورانه", "desc": "از روشی استفاده می‌کنم که قبلاً امتحان نشده، اما می‌تواند عالی باشد.", "icon": "creative", "fx": {"light": 30, "calm": 10},
         "ending": "طرح تازه‌ات برای اولین بار جواب داد! مهندس‌های نورآباد اسمش را «روش تازه‌ی نورآباد» گذاشتند.",
         "_tag": "creative", "_risk": 0.9},
        {"id": "s4_team", "title": "اجرای مشترک", "desc": "چند تیم را هم‌زمان هماهنگ می‌کنم؛ زمان بیشتری لازم دارد اما همه سهیم‌اند.", "icon": "collaborative", "fx": {"light": 30, "calm": 18},
         "ending": "همه کنار هم کار کردند. کمی زمان بیشتری لازم شد، اما شهر با اعتماد مردم روشن شد.",
         "_tag": "collaborative", "_risk": 0.4},
        {"id": "s4_sim", "title": "شبیه‌سازی، بعد اجرا", "desc": "اول در یک مدل رایانه‌ای امتحان می‌کنم و بر اساس نتیجه اجرا می‌کنم.", "icon": "analytic", "fx": {"light": 30, "calm": 12},
         "ending": "شبیه‌سازی دو خطای پنهان را نشان داد. با اصلاحشان، اجرای نهایی بی‌نقص بود.",
         "_tag": "analytic", "_risk": 0.3},
        {"id": "s4_hands", "title": "کار مستقیم روی دستگاه‌ها", "desc": "خودم کنار دستگاه‌ها می‌ایستم و با آزمون زنده، کار را جلو می‌برم.", "icon": "hands_on", "fx": {"light": 30, "calm": 8},
         "ending": "با دست‌های خودت دستگاه‌ها را یکی‌یکی راه انداختی و با هر کلید، یک محله روشن شد.",
         "_tag": "hands_on", "_risk": 0.6},
    ],
}

# ---------------------------------------------------------------- مرحله ۳
def _shape(shape, color, size="m", rot=0, ring=False):
    return {"shape": shape, "color": color, "size": size, "rot": rot, "ring": ring}

_C = {"o": "#F97316", "b": "#38BDF8", "g": "#34D399", "p": "#A78BFA", "y": "#FACC15"}

# معما ۱: شکل هر سه تا یک‌بار تکرار می‌شود، رنگ یک‌درمیان عوض می‌شود. خانه‌ی ششم گم شده است.
_P1_SEQ = [_shape(["circle", "square", "triangle"][i % 3], [_C["o"], _C["b"]][i % 2]) for i in range(5)]
_P1_ANS = _shape("triangle", _C["b"])
# معما ۲: شکل هر ۴ تا، اندازه هر ۳ تا و رنگ هر ۲ تا تکرار می‌شود. خانه‌ی هشتم گم شده است.
_P2_SHAPES = ["diamond", "star", "hex", "circle"]
_P2_SIZES = ["s", "m", "l"]
_P2_COLORS = [_C["g"], _C["p"]]
_P2_SEQ = [_shape(_P2_SHAPES[i % 4], _P2_COLORS[i % 2], _P2_SIZES[i % 3]) for i in range(7)]
_P2_ANS = _shape("circle", _P2_COLORS[7 % 2], _P2_SIZES[7 % 3])

PATTERNS = [
    {"id": "p1", "title": "الگوی اول", "prompt": "کدام شکل جای خالی را کامل می‌کند؟",
     "sequence": _P1_SEQ,
     "options": [
         {"id": "a", "spec": _shape("triangle", _C["o"])},
         {"id": "b", "spec": _P1_ANS},
         {"id": "c", "spec": _shape("square", _C["b"])},
         {"id": "d", "spec": _shape("circle", _C["o"])},
     ],
     "hint": "به شکل‌ها و رنگ‌ها جداگانه نگاه کن؛ هر کدام الگوی خودش را دارد.",
     "_correct": "b", "_weight": 1.0},
    {"id": "p2", "title": "الگوی دوم", "prompt": "این بار سه ویژگی هم‌زمان تغییر می‌کند. کدام شکل درست است؟",
     "sequence": _P2_SEQ,
     "options": [
         {"id": "a", "spec": _shape("circle", _P2_COLORS[0], _P2_SIZES[1])},
         {"id": "b", "spec": _shape("star", _P2_COLORS[1], _P2_SIZES[1])},
         {"id": "c", "spec": _P2_ANS},
         {"id": "d", "spec": _shape("circle", _P2_COLORS[1], _P2_SIZES[2])},
     ],
     "hint": "شکل، اندازه و رنگ هر کدام با دوره‌ی متفاوتی تکرار می‌شوند. یکی‌یکی بررسی‌شان کن.",
     "_correct": "c", "_weight": 1.5},
]

SORT_BINS = [
    {"id": "measure", "title": "اندازه‌گیری و کنترل", "icon": "bin_measure"},
    {"id": "build", "title": "ساخت، برش و اتصال", "icon": "bin_build"},
    {"id": "plan", "title": "ثبت و برنامه‌ریزی", "icon": "bin_plan"},
]
SORT_ITEMS = [
    {"id": "ruler", "title": "متر", "icon": "ruler", "_bin": "measure"},
    {"id": "scale", "title": "ترازو", "icon": "scale", "_bin": "measure"},
    {"id": "thermo", "title": "دماسنج", "icon": "thermo", "_bin": "measure"},
    {"id": "hammer", "title": "چکش", "icon": "hammer", "_bin": "build"},
    {"id": "screwdriver", "title": "پیچ‌گوشتی", "icon": "screwdriver", "_bin": "build"},
    {"id": "scissors", "title": "قیچی", "icon": "scissors", "_bin": "build"},
    {"id": "notebook", "title": "دفترچه‌ی یادداشت", "icon": "notebook", "_bin": "plan"},
    {"id": "calendar", "title": "تقویم", "icon": "calendar", "_bin": "plan"},
    {"id": "checklist", "title": "فهرست کارها", "icon": "checklist", "_bin": "plan"},
]

DESIGN_CATEGORIES = {
    "tech": "فناوری", "art": "هنر", "nature": "علم و طبیعت", "talk": "ارتباط", "layout": "چیدمان",
}
DESIGN_THEMES = [
    {"id": "tech", "title": "غرفه‌ی فناوری", "cats": ["tech", "layout"], "bg": ["#0F172A", "#1E3A8A"]},
    {"id": "art", "title": "غرفه‌ی هنر", "cats": ["art", "talk"], "bg": ["#4C1D95", "#BE185D"]},
    {"id": "nature", "title": "غرفه‌ی علم و طبیعت", "cats": ["nature", "layout"], "bg": ["#064E3B", "#0E7490"]},
    {"id": "talk", "title": "غرفه‌ی گفت‌وگو", "cats": ["talk", "layout"], "bg": ["#7C2D12", "#B45309"]},
]
DESIGN_ITEMS = [
    {"id": "screen", "title": "نمایشگر", "icon": "d_screen", "cat": "tech", "_rarity": 2},
    {"id": "robot", "title": "ربات", "icon": "d_robot", "cat": "tech", "_rarity": 3},
    {"id": "rocket", "title": "ماکت موشک", "icon": "d_rocket", "cat": "tech", "_rarity": 3},
    {"id": "gears", "title": "چرخ‌دنده", "icon": "d_gears", "cat": "tech", "_rarity": 2},
    {"id": "painting", "title": "تابلو", "icon": "d_painting", "cat": "art", "_rarity": 2},
    {"id": "balloons", "title": "بادکنک", "icon": "d_balloons", "cat": "art", "_rarity": 3},
    {"id": "banner", "title": "بنر رنگی", "icon": "d_banner", "cat": "art", "_rarity": 1},
    {"id": "plant", "title": "گیاه", "icon": "d_plant", "cat": "nature", "_rarity": 1},
    {"id": "globe", "title": "کره‌ی زمین", "icon": "d_globe", "cat": "nature", "_rarity": 3},
    {"id": "mic", "title": "میکروفون", "icon": "d_mic", "cat": "talk", "_rarity": 2},
    {"id": "chairs", "title": "صندلی‌ها", "icon": "d_chairs", "cat": "talk", "_rarity": 1},
    {"id": "lamp", "title": "چراغ", "icon": "d_lamp", "cat": "layout", "_rarity": 1},
    {"id": "table", "title": "میز", "icon": "d_table", "cat": "layout", "_rarity": 1},
    {"id": "shelf", "title": "قفسه", "icon": "d_shelf", "cat": "layout", "_rarity": 1},
]
DESIGN = {"min_items": 3, "max_items": 14, "canvas": {"w": 600, "h": 360}}

# مدار برقی: ۴×۴. نوع هر کاشی و چرخش شروع (۰ تا ۳، ساعت‌گرد). مسیر درست در _solution.
# جهت‌ها: 0=بالا 1=راست 2=پایین 3=چپ. باتری سمت چپِ خانه‌ی (0,0)، لامپ سمت راستِ خانه‌ی (3,3).
CIRCUIT = {
    "id": "circuit", "rows": 4, "cols": 4,
    "tiles": [
        # ردیف ۰
        {"type": "straight", "rot": 0}, {"type": "corner", "rot": 0}, {"type": "tee", "rot": 1}, {"type": "corner", "rot": 3},
        # ردیف ۱
        {"type": "straight", "rot": 1}, {"type": "corner", "rot": 1}, {"type": "corner", "rot": 3}, {"type": "straight", "rot": 0},
        # ردیف ۲
        {"type": "tee", "rot": 2}, {"type": "straight", "rot": 0}, {"type": "corner", "rot": 2}, {"type": "corner", "rot": 0},
        # ردیف ۳
        {"type": "corner", "rot": 1}, {"type": "straight", "rot": 1}, {"type": "tee", "rot": 3}, {"type": "corner", "rot": 3},
    ],
    "hint": "از باتری شروع کن و لوله‌ها را طوری بچرخان که پشت هم قرار بگیرند تا به لامپ برسند.",
    "_solution": {0: 1, 1: 2, 5: 0, 6: 2, 10: 0, 11: 2, 15: 0},
}

# ---------------------------------------------------------------- مرحله ۴
WORLDS = [
    {"id": "code", "title": "دنیای برنامه‌نویسی", "blurb": "ساخت برنامه، سایت و ابزارهای هوشمند.",
     "samples": ["توسعه‌دهنده‌ی وب", "برنامه‌نویس موبایل"], "_weights": {"I": 0.5, "C": 0.3, "R": 0.2}},
    {"id": "design", "title": "دنیای طراحی", "blurb": "تصویر، رنگ، رابط کاربری و روایت بصری.",
     "samples": ["طراح گرافیک", "طراح تجربه‌ی کاربری"], "_weights": {"A": 1.0}},
    {"id": "data", "title": "دنیای تحلیل داده", "blurb": "پیدا کردن معنا و الگو در انبوه اعداد.",
     "samples": ["تحلیلگر داده", "کارشناس گزارش‌سازی"], "_weights": {"I": 0.6, "C": 0.4}},
    {"id": "make", "title": "دنیای ساخت و فناوری", "blurb": "دستگاه، مدار، ابزار و تعمیر.",
     "samples": ["تکنسین برق و الکترونیک", "تعمیرکار دستگاه‌ها"], "_weights": {"R": 0.8, "I": 0.2}},
    {"id": "teach", "title": "دنیای آموزش و ارتباطات", "blurb": "یاد دادن، راهنمایی و ساختن ارتباط.",
     "samples": ["مربی و معلم", "مشاور"], "_weights": {"S": 0.8, "A": 0.1, "E": 0.1}},
    {"id": "biz", "title": "دنیای مدیریت و کسب‌وکار", "blurb": "راه‌اندازی، مدیریت تیم و رشد پروژه‌ها.",
     "samples": ["مدیر پروژه", "کارآفرین"], "_weights": {"E": 0.7, "C": 0.3}},
]

# ---------------------------------------------------------------- نشان‌ها
BADGES = [
    {"key": "explorer", "title": "کاشف جزیره", "desc": "حداقل ۵ محیط جزیره را بررسی کردی", "icon": "compass", "color": "#38BDF8"},
    {"key": "city_savior", "title": "نجات‌دهنده‌ی نورآباد", "desc": "شهر را روشن کردی", "icon": "bolt", "color": "#FACC15"},
    {"key": "detective", "title": "کارآگاه", "desc": "هر سه سرنخ شهر را بررسی کردی", "icon": "magnifier", "color": "#A78BFA"},
    {"key": "pattern_hunter", "title": "شکارچی الگو", "desc": "هر دو الگو را حل کردی", "icon": "pattern", "color": "#34D399"},
    {"key": "sharp_eye", "title": "چشم تیزبین", "desc": "هر دو الگو را در تلاش اول حل کردی", "icon": "eye", "color": "#F97316"},
    {"key": "organizer", "title": "استاد نظم", "desc": "انبار را کامل مرتب کردی", "icon": "shelf", "color": "#22D3EE"},
    {"key": "idea_designer", "title": "طراح ایده‌پرداز", "desc": "غرفه‌ای با ۶ آیتم یا بیشتر ساختی", "icon": "palette", "color": "#F472B6"},
    {"key": "bounce_back", "title": "بازگشت قهرمانانه", "desc": "با کمک بازخورد نتیجه‌ات را بهتر کردی", "icon": "rebound", "color": "#FB923C"},
    {"key": "circuit_fixer", "title": "برق‌رسان", "desc": "مدار اختیاری را روشن کردی", "icon": "plug", "color": "#FDE047"},
    {"key": "future_seeker", "title": "کاشف آینده", "desc": "سرزمین آینده را به پایان رساندی", "icon": "rocket", "color": "#C084FC"},
    {"key": "full_journey", "title": "سفر کامل", "desc": "هر چهار مرحله را تمام کردی", "icon": "trophy", "color": "#F59E0B"},
]
BADGE_BY_KEY = {b["key"]: b for b in BADGES}


def _strip_private(obj):
    if isinstance(obj, dict):
        return {k: _strip_private(v) for k, v in obj.items() if not str(k).startswith("_")}
    if isinstance(obj, list):
        return [_strip_private(v) for v in obj]
    return obj


def public_content():
    """محتوای قابل نمایش برای فرانت‌اند؛ بدون وزن‌ها و پاسخ‌های درست."""
    data = {
        "version": CONTENT_VERSION,
        "riasec": RIASEC, "riasec_fa": RIASEC_FA,
        "approaches": APPROACHES, "motives": MOTIVES,
        "limits": {"stars": STARS, "world_picks": WORLD_PICKS, "gems": GEMS},
        "points": POINTS,
        "stages": STAGES,
        "stage1": {"zones": ZONES, "reactions": REACTIONS},
        "stage2": {"clues": CLUES, "scene1": SCENE1, "scene2": SCENE2, "tools": TOOLS, "scene4": SCENE4},
        "stage3": {"patterns": PATTERNS, "sort": {"bins": SORT_BINS, "items": SORT_ITEMS},
                   "design": {"themes": DESIGN_THEMES, "items": DESIGN_ITEMS, "categories": DESIGN_CATEGORIES, **DESIGN},
                   "circuit": CIRCUIT},
        "stage4": {"worlds": WORLDS},
        "badges": BADGES,
    }
    return _strip_private(copy.deepcopy(data))
