// Translation dictionary for the landing page.
// All visible strings live here; components consume them via useLocale().

export type Locale = "ka" | "en";

export const LOCALES: { code: Locale; label: string }[] = [
  { code: "ka", label: "KA" },
  { code: "en", label: "EN" },
];

export const dict = {
  ka: {
    nav: {
      brand: "INFINITY",
      features: "ფუნქციები",
      process: "პროცესი",
      compare: "შედარება",
      faq: "კითხვები",
      cta: "ანალიზის დაწყება",
      menu: "მენიუ",
      langLabel: "ენა",
    },
    hero: {
      eyebrow: "INFINITY · SEO AUDIT · 2026",
      h1Line1: "ვებგვერდის სრული",
      cycle: ["აუდიტი", "ანალიზი", "ანგარიში", "ოპტიმიზაცია"],
      sub: "ტექნიკური, On-Page, წარმადობისა და AI-ეპოქის სრული აუდიტი - 90 წამში, უფასოდ, ქართულად. ჩვენი ხელსაწყო 50+ პუნქტს ამოწმებს და გაძლევთ გაყიდვებზე ორიენტირებულ ანგარიშს.",
      freeNote: "უფასოა · რეგისტრაცია არ სჭირდება · შედეგი 90 წამში",
      sampleLink: "ნახე ნიმუშის ანალიზი",
      modeSingle: "ერთი საიტი",
      modeCompare: "კონკურენტებთან შედარება",
      placeholder: "example.com",
      analyzeBtn: "ანალიზი",
      compareBtn: "შედარების დაწყება",
      depthLabel: "ანალიზის სიღრმე",
      depth: [
        { label: "მთავარი", hint: "5-15წ · მხოლოდ მთავარი" },
        { label: "ღრმა (5)", hint: "30-60წ · მთავარი + 4" },
        { label: "სრული (10)", hint: "60-120წ · მთავარი + 9" },
      ],
      yourSite: "თქვენი საიტი",
      yourSitePlaceholder: "yoursite.ge",
      competitorsLabel: "კონკურენტები",
      competitor: "კონკურენტი",
      removeAria: "წაშლა",
      errors: {
        empty: "გთხოვთ, შეიყვანოთ ვებგვერდის მისამართი",
        invalidFormat: "არასწორი მისამართის ფორმატი",
        invalidUrl: "არასწორი URL",
      },
      stats: [
        { value: "500+", label: "გაანალიზებული საიტი" },
        { value: "6+", label: "წელი ბაზარზე" },
        { value: "50+", label: "შემოწმების პუნქტი" },
        { value: "90წმ", label: "საშუალო დრო" },
        { value: "96%", label: "კმაყოფილი კლიენტი" },
      ],
    },
    capabilities: {
      eyebrow: "შესაძლებლობები",
      h2Line1: "ყველაფერი, რაც გჭირდება.",
      h2Line2: "არაფერი ზედმეტი.",
      sub: "50-ზე მეტი შემოწმების კატეგორია ერთ ანგარიშში - ტექნიკური საფუძვლიდან კონტენტის სტრუქტურამდე. გასაგებია როგორც დეველოპერისთვის, ისე ბიზნესის მფლობელისთვის.",
      items: [
        {
          title: "ტექნიკური SEO",
          body: "HTTPS, robots.txt, XML sitemap, canonical, hreflang, security headers, soft 404, cache-control, URL/lang შესაბამისობა - საფუძველი, რომელიც ლამაზ კონტენტს კარგად ამუშავებინებს.",
        },
        {
          title: "On-Page SEO",
          body: "Title, meta description, H1-H6 სტრუქტურა, ALT ტექსტები, შიდა/გარე ბმულები, კონტენტის სიღრმე. რა მუშაობს, რა აკლია, რა უნდა დაემატოს.",
        },
        {
          title: "Performance / Core Web Vitals",
          body: "LCP, INP, CLS - Google-ის რეალური UX მეტრიკები. სად ნელდება გვერდი, რა ანელებს მობილურ ვერსიას, რას ხედავს მომხმარებელი ჩატვირთვამდე.",
        },
        {
          title: "Schema Markup & Open Graph",
          body: "JSON-LD, Organization, Product, FAQ, Article schema-ს ვალიდაცია. OG/Twitter Card - როგორ ჩანს საიტი სოციალურ ქსელებში.",
        },
      ],
    },
    process: {
      eyebrow: "PROCESS",
      h2Line1: "სამი ნაბიჯი.",
      h2Line2: "90 წამი.",
      sub: "გასაგები პროცესი. დაიწყე ერთი URL-ით, დაასრულე კლიენტისთვის გასაგზავნი ანგარიშით.",
      steps: [
        {
          title: "შეიყვანე საიტი",
          body: "მთავარი გვერდის URL ან მთლიანი დომენი. ანალიზის სიღრმე შენ ირჩევ - მთავარი ერთი წამში, ან 9 ქვეგვერდი ღრმად.",
        },
        {
          title: "ჩვენ ვამოწმებთ",
          body: "50+ ტექნიკური და კონტენტური პუნქტი, რეალური Headless Chrome-ით რენდერი, Core Web Vitals და კონკურენტებთან შედარება - ერთდროულად.",
        },
        {
          title: "გადმოწერე ანგარიში",
          body: "PDF, PPTX ან AI Executive Summary ქართულად. კლიენტისთვის მზად - INFINITY SOLUTIONS-ის ბრენდირებით.",
        },
      ],
    },
    metrics: {
      eyebrow: "ᲨᲔᲡᲐᲫᲚᲔᲑᲚᲝᲑᲔᲑᲘ",
      h2Line1: "რა ამოწმებს",
      h2Line2: "ეს ინსტრუმენტი",
      sub: "ავტომატური SEO აუდიტი - ტექნიკური შემოწმებიდან კონტენტის ანალიზამდე, წუთებში.",
      cards: [
        { label: "ᲢᲔᲥᲜᲘᲙᲣᲠᲘ CHECKS", value: "50+", delta: "HTTPS, robots, sitemap..." },
        { label: "ON-PAGE ანალიზი", value: "სრული", delta: "Title, H1, Meta, ALT..." },
        { label: "PERFORMANCE", value: "Core Web Vitals", delta: "Google PageSpeed API" },
        { label: "ᲐᲜᲒᲐᲠᲘᲨᲘ", value: "PDF + PPTX", delta: "კლიენტისთვის მზა" },
      ],
    },
    platforms: {
      eyebrow: "PLATFORMS",
      h2Line1: "ნებისმიერი",
      h2Line2: "პლატფორმისთვის",
    },
    about: {
      eyebrow: "ABOUT",
      h2Line1: "INFINITY",
      h2Line2: "SOLUTIONS",
      p1: "თბილისში დაფუძნებული ციფრული მარკეტინგის სააგენტო. 2019 წლიდან ვმუშაობთ ქართულ ბიზნესთან SEO-ს, კონტენტ მარკეტინგისა და დიგიტალური სტრატეგიის მიმართულებით.",
      p2: "ჩვენი მიდგომა ტექნიკურ სიღრმეს მარტივ ენასთან აერთიანებს. ანგარიში არ რჩება გაუგებარ ტექნიკურ ენად - ის გადადის კონკრეტულ მოქმედებებში.",
      details: [
        {
          kicker: "01",
          title: "6 წელი ბაზარზე",
          body: "2019 წლიდან ვმუშაობთ ქართულ მცირე და საშუალო ბიზნესთან, კლინიკებიდან ონლაინ მაღაზიამდე.",
        },
        {
          kicker: "02",
          title: "50+ შემოწმების წერტილი",
          body: "WordPress, Shopify, Webflow, Wix, Magento და custom-coded პლატფორმები.",
        },
        {
          kicker: "03",
          title: "კლიენტზე მორგებული ანგარიში",
          body: "კლიენტების უმეტესობა გრძელვადიან თანამშრომლობას ირჩევს - დიაგნოზიდან SEO სტრატეგიამდე.",
        },
      ],
    },
    comparison: {
      eyebrow: "COMPARE",
      h2Line1: "კონკურენტებთან",
      h2Line2: "side-by-side",
      sub: "შეადარეთ თქვენი საიტი 1-3 კონკურენტს. ნახეთ ზუსტად სად გჯობნით კონკურენტი, სად უსწრებთ თქვენ და რომელი ერთი ცვლილება მოგცემთ ყველაზე დიდ შედეგს.",
      points: [
        "ტექნიკური მდგომარეობის შედარება",
        "Core Web Vitals-ის გვერდიგვერდ შედარება",
        "Schema Markup სრულყოფა",
        "Heading სტრუქტურა და კონტენტის სიღრმე",
        "Action Plan: რა გავაკეთოთ პირველ რიგში",
      ],
      cta: "შედარების დაწყება",
      scoreboardLabel: "Scoreboard · 4 sites",
      gapAnalysis: "Gap analysis",
      gapNote: "+6 ქულა Schema-ით",
    },
    ai: {
      eyebrow: "AI SEARCH",
      h2Line1: "AI Search-ი არ ცვლის SEO-ს.",
      h2Line2: "ის მას ეყრდნობა.",
      body: "Google-ის AI Overviews, ChatGPT, Claude, Perplexity - ყველა მათგანი Google Search-ის ინდექსსა და ხარისხის სისტემებს ეყრდნობა. თუ საიტი ტექნიკურად არ არის გამართული, არ ინდექსირდება ან არ აქვს სტრუქტურირებული კონტენტი, AI ძიებაშიც წარმატების შანსი მცირდება.",
    },
    testimonials: {
      eyebrow: "TESTIMONIALS",
      h2Line1: "რას ამბობენ",
      h2Line2: "ჩვენი კლიენტები",
      sub: "",
      items: [],
    },
    pricing: {
      eyebrow: "PRICING",
      h2Line1: "გასაგები",
      h2Line2: "ფასები",
      sub: "უფასოდ დაიწყე. გადახდი მხოლოდ მაშინ, როცა SEO-მ უკვე მოუტანა ღირებულება თქვენს ბიზნესს.",
      footnote:
        "ყველა გეგმა მოიცავს ქართულენოვან მხარდაჭერას · უსაფრთხო HTTPS · გაუქმება ნებისმიერ დროს · ფასები ეროვნულ ვალუტაში.",
      popular: "პოპულარული",
      tiers: [
        {
          kicker: "00",
          name: "Free Audit",
          price: "0₾",
          unit: "/ მუდამ",
          description: "Self-service ანალიზი ნებისმიერ საიტზე.",
          features: [
            "მთავარი გვერდის audit",
            "50+ SEO check",
            "PDF download",
            "შედეგების საჯარო URL",
            "Email მხარდაჭერა",
          ],
          cta: "დაიწყე უფასოდ",
          ctaHref: "#hero",
        },
        {
          kicker: "01",
          name: "Pro Audit",
          price: "199₾",
          unit: "/ ერთჯერადი",
          description: "ღრმა site review + კონკურენტთან შედარება.",
          features: [
            "სრული საიტი (10 გვერდამდე)",
            "კონკურენტთან შედარება (1-3)",
            "AI Executive Summary",
            "Custom PowerPoint",
            "1 კონსულტაცია (60 წთ)",
            "პრიორიტეტული მხარდაჭერა",
          ],
          cta: "შეუკვეთე Pro",
          ctaHref: "/seo-offer",
          highlighted: true,
        },
        {
          kicker: "02",
          name: "Enterprise SEO",
          price: "Custom",
          unit: "",
          description: "გრძელვადიანი SEO პარტნიორობა.",
          features: [
            "ყველაფერი Pro პაკეტიდან",
            "ყოველთვიური მონიტორინგი",
            "SEO სტრატეგია + roadmap",
            "On-call მხარდაჭერა",
            "გამოყოფილი სპეციალისტი",
            "კონტენტ-სტრატეგია",
          ],
          cta: "დაგვიკავშირდი",
          ctaHref: "mailto:info@infinity.ge",
        },
      ],
    },
    faq: {
      eyebrow: "FAQ",
      h2Line1: "ხშირი",
      h2Line2: "კითხვები",
      items: [
        {
          q: "რა არის SEO ანალიზი?",
          a: "SEO ანალიზი არის ვებგვერდის დეტალური შემოწმება, რომელიც აჩვენებს, რამდენად კარგად არის საიტი მომზადებული Google-ისთვის და მომხმარებლისთვის. ის მოიცავს ტექნიკურ SEO-ს, On-Page ოპტიმიზაციას, სიჩქარეს, სტრუქტურირებულ მონაცემებს, შიდა ბმულებს და სხვა მნიშვნელოვან ელემენტებს.",
        },
        {
          q: "უფასოა SEO აუდიტი?",
          a: "დიახ, ჩვენი SEO აუდიტის გამოყენება შესაძლებელია უფასოდ. თქვენ შეგყავთ საიტის მისამართი და იღებთ ანგარიშს, სადაც ჩანს ძირითადი პრობლემები, ძლიერი მხარეები და რეკომენდაციები.",
        },
        {
          q: "რა განსხვავებაა ამ ხელსაწყოსა და სხვა SEO checker-ებს შორის?",
          a: "მთავარი განსხვავება არის ის, რომ ჩვენი ხელსაწყო ტექნიკურ შემოწმებას აერთიანებს მარტივ ახსნასთან. ანგარიში არ არის მხოლოდ კოდებისა და სტატუსების ჩამონათვალი - ის გაჩვენებთ, რას ნიშნავს კონკრეტული პრობლემა და რატომ არის მნიშვნელოვანი მისი გასწორება.",
        },
        {
          q: "მუშაობს თუ არა ხელსაწყო ქართულ საიტებზე?",
          a: "დიახ, ხელსაწყო გათვლილია ქართულ საიტებზეც. მისი გამოყენება შესაძლებელია WordPress, Shopify, Webflow, Wix, Magento, custom build და სხვა ტიპის ვებგვერდებზე.",
        },
        {
          q: "რა არის Core Web Vitals?",
          a: "Core Web Vitals არის Google-ის მეტრიკები, რომლებიც აფასებს მომხმარებლის რეალურ გამოცდილებას საიტზე. ისინი ამოწმებს ჩატვირთვის სიჩქარეს, ინტერაქციის სისწრაფეს და ვიზუალურ სტაბილურობას. ეს მონაცემები მნიშვნელოვანია როგორც SEO-სთვის, ისე მომხმარებლის კომფორტისთვის.",
        },
        {
          q: "რა არის Schema Markup?",
          a: "Schema Markup არის სტრუქტურირებული მონაცემები, რომელიც Google-ს ეხმარება გვერდის შინაარსის უკეთ გაგებაში. მაგალითად, მისი საშუალებით შეიძლება საძიებო სისტემამ უკეთ აღიქვას ორგანიზაცია, პროდუქტი, სტატია, FAQ ან სხვა ტიპის ინფორმაცია.",
        },
        {
          q: "საჭიროა თუ არა llms.txt SEO-სთვის?",
          a: "llms.txt შეიძლება საინტერესო დამატებითი მიმართულება იყოს AI სისტემებისთვის კონტენტის გასაგებად, მაგრამ ის არ უნდა წარმოვაჩინოთ როგორც Google-ის ოფიციალური SEO მოთხოვნა. Google-ის AI Search-ისთვის მთავარი ისევ ხარისხიანი კონტენტი, ინდექსირებადი გვერდები და SEO-ს ძირითადი პრინციპებია.",
        },
        {
          q: "რატომ უნდა შევადარო ჩემი საიტი კონკურენტებს?",
          a: "კონკურენტებთან შედარება გაჩვენებთ, სად დგახართ ბაზარზე. შეიძლება თქვენი საიტი კარგ მდგომარეობაში იყოს, მაგრამ კონკურენტს ჰქონდეს უკეთესი სიჩქარე, კონტენტი, სტრუქტურა ან Schema Markup. შედარება გეხმარებათ გაიგოთ, რა გჭირდებათ მათ გადასასწრებად.",
        },
        {
          q: "რას მოიცავს SEO შეთავაზება?",
          a: "SEO შეთავაზება მოიცავს სამუშაო გეგმას - ტექნიკური SEO, On-Page ოპტიმიზაცია, კონტენტ სტრატეგია, Schema Markup, სიჩქარის გაუმჯობესება, მონიტორინგი და რეპორტინგი. მიზანია, კლიენტმა დაინახოს არა მხოლოდ პრობლემა, არამედ მისი გადაჭრის გზა.",
        },
        {
          q: "როდის უნდა გაკეთდეს SEO აუდიტი?",
          a: "SEO აუდიტი სასურველია გაკეთდეს საიტის გაშვების წინ, რედიზაინის შემდეგ, SEO კამპანიის დაწყებამდე, Google Ads-ის გაშვებამდე ან მაშინ, როცა საიტი კარგავს ტრაფიკს და პოზიციებს. ასევე სასარგებლოა მისი პერიოდულად ჩატარება.",
        },
      ],
    },
    finalCta: {
      h2Line1: "დაიწყე ანალიზი",
      h2Line2: "90 წამში.",
      sub: "შეიყვანე საიტი და მიიღე სრული ანგარიში - უფასოდ, რეგისტრაციის გარეშე.",
      placeholder: "example.com",
      btn: "ანალიზის დაწყება",
    },
    footer: {
      tagline:
        "ციფრული მარკეტინგის სააგენტო. SEO აუდიტი, კონტენტ სტრატეგია და დიგიტალური ზრდა ქართულ ბაზარზე 2019 წლიდან.",
      columns: [
        {
          title: "ხელსაწყო",
          links: [
            { label: "ფუნქციები", href: "#capabilities" },
            { label: "პროცესი", href: "#process" },
            { label: "ფასები", href: "#pricing" },
            { label: "შედარება", href: "/compare" },
            { label: "სამოქმედო გეგმა", href: "/action-plan" },
            { label: "კლიენტისთვის", href: "/seo-process" },
          ],
        },
        {
          title: "რესურსები",
          links: [
            { label: "FAQ", href: "#faq" },
            { label: "SEO შეთავაზება", href: "/seo-offer" },
            { label: "ანგარიშის ნიმუში", href: "#hero" },
            { label: "სტატუსი", href: "#" },
          ],
        },
        {
          title: "სააგენტო",
          links: [
            { label: "ჩვენ შესახებ", href: "#process" },
            { label: "ბლოგი", href: "#" },
            { label: "კარიერა", href: "#", badge: "ვაკანსია" },
            { label: "კონტაქტი", href: "mailto:info@infinity.ge" },
          ],
        },
        {
          title: "სამართლებრივი",
          links: [
            { label: "კონფიდენციალურობა", href: "#" },
            { label: "სარგებლობის წესები", href: "#" },
            { label: "უსაფრთხოება", href: "#" },
          ],
        },
      ],
      social: [
        { label: "Email", href: "mailto:info@infinity.ge" },
        { label: "Facebook", href: "#" },
        { label: "Instagram", href: "#" },
      ],
      copyright: "© 2026 INFINITY SOLUTIONS · ყველა უფლება დაცულია",
      status: "Made in Tbilisi · ყველა სისტემა მუშაობს",
    },
  },
  en: {
    nav: {
      brand: "INFINITY",
      features: "Features",
      process: "Process",
      compare: "Compare",
      faq: "FAQ",
      cta: "Start audit",
      menu: "Menu",
      langLabel: "Language",
    },
    hero: {
      eyebrow: "INFINITY · SEO AUDIT · 2026",
      h1Line1: "Complete website",
      cycle: ["audit", "analysis", "report", "optimization"],
      sub: "A full technical, on-page, performance, and AI-era audit - in 90 seconds, free. Our tool checks 50+ points and delivers a conversion-focused report.",
      freeNote: "Free · No signup · Results in 90 seconds",
      sampleLink: "See a sample audit",
      modeSingle: "Single site",
      modeCompare: "Compare with competitors",
      placeholder: "example.com",
      analyzeBtn: "Audit",
      compareBtn: "Run compare",
      depthLabel: "Audit depth",
      depth: [
        { label: "Home", hint: "5-15s · Home only" },
        { label: "Deep (5)", hint: "30-60s · Home + 4" },
        { label: "Full (10)", hint: "60-120s · Home + 9" },
      ],
      yourSite: "Your site",
      yourSitePlaceholder: "yoursite.com",
      competitorsLabel: "Competitors",
      competitor: "Competitor",
      removeAria: "Remove",
      errors: {
        empty: "Please enter a website URL",
        invalidFormat: "Invalid URL format",
        invalidUrl: "Invalid URL",
      },
      stats: [
        { value: "500+", label: "sites analyzed" },
        { value: "6+", label: "years on the market" },
        { value: "50+", label: "checkpoints" },
        { value: "90s", label: "average runtime" },
        { value: "96%", label: "client satisfaction" },
      ],
    },
    capabilities: {
      eyebrow: "Capabilities",
      h2Line1: "Everything you need.",
      h2Line2: "Nothing you don't.",
      sub: "50+ check categories in one report - from technical foundation to content structure. Readable for developers and business owners alike.",
      items: [
        {
          title: "Technical SEO",
          body: "HTTPS, robots.txt, XML sitemap, canonical, hreflang, security headers, soft 404s, cache-control, URL/lang consistency - the foundation that makes great content rank.",
        },
        {
          title: "On-Page SEO",
          body: "Title, meta description, H1-H6 structure, ALT text, internal/external links, content depth. What works, what's missing, what to add.",
        },
        {
          title: "Performance / Core Web Vitals",
          body: "LCP, INP, CLS - Google's real UX metrics. Where the page lags, what slows it down on mobile, and what users see before the page finishes loading.",
        },
        {
          title: "Schema Markup & Open Graph",
          body: "JSON-LD, Organization, Product, FAQ, Article schema validation. OG/Twitter Card - how the site appears when shared on social.",
        },
      ],
    },
    process: {
      eyebrow: "PROCESS",
      h2Line1: "Three steps.",
      h2Line2: "90 seconds.",
      sub: "A clear process. Start with one URL, finish with a client-ready report.",
      steps: [
        {
          title: "Enter your site",
          body: "Enter the homepage URL or the full domain. You pick the audit depth - one page in seconds, or up to 9 subpages deep.",
        },
        {
          title: "We run the checks",
          body: "50+ technical and content checks, real Headless Chrome rendering, Core Web Vitals, and competitor comparison - all in parallel.",
        },
        {
          title: "Download the report",
          body: "PDF, PPTX, or an AI Executive Summary. Client-ready - with INFINITY SOLUTIONS branding.",
        },
      ],
    },
    metrics: {
      eyebrow: "CAPABILITIES",
      h2Line1: "What this",
      h2Line2: "tool checks",
      sub: "Automated SEO audit - from technical checks to content analysis, in minutes.",
      cards: [
        { label: "TECHNICAL CHECKS", value: "50+", delta: "HTTPS, robots, sitemap..." },
        { label: "ON-PAGE ANALYSIS", value: "Full", delta: "Title, H1, Meta, ALT..." },
        { label: "PERFORMANCE", value: "Core Web Vitals", delta: "Google PageSpeed API" },
        { label: "REPORT", value: "PDF + PPTX", delta: "Client-ready" },
      ],
    },
    platforms: {
      eyebrow: "PLATFORMS",
      h2Line1: "Any",
      h2Line2: "platform",
    },
    about: {
      eyebrow: "ABOUT",
      h2Line1: "INFINITY",
      h2Line2: "SOLUTIONS",
      p1: "Tbilisi-based digital marketing agency. Since 2019, we've worked with Georgian businesses on SEO, content marketing, and digital strategy.",
      p2: "Our approach combines technical depth with plain language. The report doesn't get stuck in technical jargon - it translates into concrete actions.",
      details: [
        {
          kicker: "01",
          title: "6 years on the market",
          body: "Working with Georgian SMBs since 2019, from clinics to online stores.",
        },
        {
          kicker: "02",
          title: "50+ checkpoints",
          body: "WordPress, Shopify, Webflow, Wix, Magento, and custom-coded platforms.",
        },
        {
          kicker: "03",
          title: "Client-ready reports",
          body: "Most clients move to long-term partnerships - from diagnosis to SEO strategy.",
        },
      ],
    },
    comparison: {
      eyebrow: "COMPARE",
      h2Line1: "Competitors",
      h2Line2: "side-by-side",
      sub: "Compare your site against 1-3 competitors. See exactly where you win, where you trail, and which single change moves the needle most.",
      points: [
        "Technical health comparison",
        "Core Web Vitals side-by-side",
        "Schema Markup coverage",
        "Heading structure and content depth",
        "Action plan: what to fix first",
      ],
      cta: "Start a comparison",
      scoreboardLabel: "Scoreboard · 4 sites",
      gapAnalysis: "Gap analysis",
      gapNote: "+6 points with Schema",
    },
    ai: {
      eyebrow: "AI SEARCH",
      h2Line1: "AI Search doesn't replace SEO.",
      h2Line2: "It depends on it.",
      body: "Google's AI Overviews, ChatGPT, Claude, and Perplexity - all of them rely on Google Search's index and quality systems. If a site isn't technically sound, isn't indexed, or lacks structured content, its chances in AI search shrink too.",
    },
    testimonials: {
      eyebrow: "TESTIMONIALS",
      h2Line1: "What our",
      h2Line2: "clients say",
      sub: "",
      items: [],
    },
    pricing: {
      eyebrow: "PRICING",
      h2Line1: "Simple",
      h2Line2: "pricing",
      sub: "Start free. Pay only when SEO has already delivered value to your business.",
      footnote:
        "All plans include Georgian-language support · secure HTTPS · cancel anytime · prices in local currency.",
      popular: "Most popular",
      tiers: [
        {
          kicker: "00",
          name: "Free Audit",
          price: "₾0",
          unit: "/ forever",
          description: "Self-service analysis for any site.",
          features: [
            "Homepage audit",
            "50+ SEO checks",
            "PDF download",
            "Public results URL",
            "Email support",
          ],
          cta: "Start free",
          ctaHref: "#hero",
        },
        {
          kicker: "01",
          name: "Pro Audit",
          price: "₾199",
          unit: "/ one-time",
          description: "Deep site review + competitor comparison.",
          features: [
            "Full site (up to 10 pages)",
            "Competitor comparison (1-3)",
            "AI Executive Summary",
            "Custom PowerPoint presentation",
            "1 consultation (60 min)",
            "Priority support",
          ],
          cta: "Get Pro",
          ctaHref: "/seo-offer",
          highlighted: true,
        },
        {
          kicker: "02",
          name: "Enterprise SEO",
          price: "Custom",
          unit: "",
          description: "Long-term SEO partnership.",
          features: [
            "Everything in Pro",
            "Monthly monitoring",
            "SEO strategy + roadmap",
            "On-call support",
            "Dedicated specialist",
            "Content strategy",
          ],
          cta: "Contact us",
          ctaHref: "mailto:info@infinity.ge",
        },
      ],
    },
    faq: {
      eyebrow: "FAQ",
      h2Line1: "Frequently asked",
      h2Line2: "questions",
      items: [
        {
          q: "What is SEO analysis?",
          a: "SEO analysis is a detailed check of a website that shows how well prepared it is for Google and for users. It covers technical SEO, On-Page optimization, speed, structured data, internal links, and other key elements.",
        },
        {
          q: "Is the SEO audit free?",
          a: "Yes, our SEO audit is free to use. You enter a site URL and receive a report covering the main issues, strong points, and recommendations.",
        },
        {
          q: "How is this tool different from other SEO checkers?",
          a: "The key difference is that our tool combines technical inspection with plain-language explanation. The report isn't just a list of codes and statuses - it shows what each issue means and why fixing it matters.",
        },
        {
          q: "Does the tool work on Georgian sites?",
          a: "Yes, the tool is tuned for Georgian sites too. It works with WordPress, Shopify, Webflow, Wix, Magento, custom builds, and other types of websites.",
        },
        {
          q: "What are Core Web Vitals?",
          a: "Core Web Vitals are Google's metrics that measure real user experience on a site. They check loading speed, interaction responsiveness, and visual stability. These signals matter for SEO and for user comfort alike.",
        },
        {
          q: "What is Schema Markup?",
          a: "Schema Markup is structured data that helps Google understand page content better. With it, a search engine can better recognize an organization, product, article, FAQ, or other types of information.",
        },
        {
          q: "Is llms.txt required for SEO?",
          a: "llms.txt can be an interesting extra signal for AI systems to understand content, but it shouldn't be presented as an official Google SEO requirement. For Google's AI Search, the main drivers are still quality content, indexable pages, and core SEO principles.",
        },
        {
          q: "Why should I compare my site against competitors?",
          a: "Comparison shows where you stand in the market. Your site may be in good shape, but a competitor might have better speed, content, structure, or Schema Markup. Comparison helps you understand what you need to overtake them.",
        },
        {
          q: "What does the SEO offer include?",
          a: "The SEO offer includes a work plan - technical SEO, On-Page optimization, content strategy, Schema Markup, speed improvement, monitoring, and reporting. The goal is for the client to see not just the problem, but the path to solve it.",
        },
        {
          q: "When should an SEO audit be done?",
          a: "An SEO audit is best done before a site launch, after a redesign, before starting an SEO campaign, before launching Google Ads, or when a site is losing traffic and positions. It's also useful to run one periodically.",
        },
      ],
    },
    finalCta: {
      h2Line1: "Start your audit",
      h2Line2: "in 90 seconds.",
      sub: "Enter a site and receive the full report - free, no signup.",
      placeholder: "example.com",
      btn: "Start audit",
    },
    footer: {
      tagline:
        "Digital marketing agency. SEO audits, content strategy, and digital growth in the Georgian market since 2019.",
      columns: [
        {
          title: "Tool",
          links: [
            { label: "Features", href: "#capabilities" },
            { label: "Process", href: "#process" },
            { label: "Pricing", href: "#pricing" },
            { label: "Compare", href: "/compare" },
            { label: "Action Plan", href: "/action-plan" },
            { label: "Client overview", href: "/seo-process" },
          ],
        },
        {
          title: "Resources",
          links: [
            { label: "FAQ", href: "#faq" },
            { label: "SEO Offer", href: "/seo-offer" },
            { label: "Sample report", href: "#hero" },
            { label: "Status", href: "#" },
          ],
        },
        {
          title: "Agency",
          links: [
            { label: "About", href: "#process" },
            { label: "Blog", href: "#" },
            { label: "Careers", href: "#", badge: "Hiring" },
            { label: "Contact", href: "mailto:info@infinity.ge" },
          ],
        },
        {
          title: "Legal",
          links: [
            { label: "Privacy", href: "#" },
            { label: "Terms", href: "#" },
            { label: "Security", href: "#" },
          ],
        },
      ],
      social: [
        { label: "Email", href: "mailto:info@infinity.ge" },
        { label: "Facebook", href: "#" },
        { label: "Instagram", href: "#" },
      ],
      copyright: "© 2026 INFINITY SOLUTIONS · All rights reserved",
      status: "Made in Tbilisi · All systems operational",
    },
  },
} as const;

export type Dict = typeof dict.ka;
