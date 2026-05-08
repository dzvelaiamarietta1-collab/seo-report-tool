# SEO შემოწმებების სპეციფიკაცია

ეს დოკუმენტი არის SEO Report Tool-ის ცოდნის ბაზა — რას ვამოწმებთ, რატომ და როგორ.

## ფილოსოფია

- **E-E-A-T ჩარჩო** — Experience, Expertise, Authoritativeness, Trustworthiness
- **Search Intent** — ყოველი გვერდი მომხმარებლის განზრახვას უნდა ემთხვეოდეს
- **Helpful Content** — რეალური პრობლემის გადაჭრა
- **არანაირი ხრიკი** — Google 2026-ში მანქანური სწავლების მოდელებს იყენებს

## შემოწმებების კატეგორიები

### 🔧 ტექნიკური SEO

| შემოწმება | პრინციპი |
|-----------|----------|
| HTTPS | SSL სერტიფიკატი — Google-ის რანკინგის ფაქტორი |
| HTTP სტატუსი | 200 OK; 4xx/5xx გვერდები ინდექსაციიდან გამოირიცხება |
| robots.txt | crawler-ების სამართავი |
| XML Sitemap | სტრუქტურის რუკა Google-სთვის |
| Canonical Tag | დუბლირებული კონტენტის თავიდან აცილება |
| Meta Robots | noindex/nofollow კონტროლი |
| Security Headers | CSP, X-Frame-Options, HSTS |
| hreflang | მრავალენოვანი საიტებისთვის |

### 📄 On-Page SEO

| შემოწმება | ოპტიმალური |
|-----------|------------|
| Title Tag | 50-60 სიმბოლო, საკვანძო სიტყვა დასაწყისში |
| Meta Description | 140-160 სიმბოლო, აქტიური ხმა |
| H1 სათაური | მხოლოდ ერთი |
| H2-H6 იერარქია | ლოგიკური თანმიმდევრობა (არ გამოტოვო H2→H4) |
| ALT ტექსტები | აღწერითი, არა keyword stuffing |
| Lazy Loading | ყველა below-the-fold სურათზე |
| Image Format | WebP/AVIF (30-50% უფრო მცირე) |
| შიდა ბმულები | minimum 3, pillar+cluster მოდელი |
| გარე ბმულები | ავტორიტეტულ წყაროებზე |
| კონტენტის სიღრმე | 1500+ სიტყვა საფუძვლიანი თემებისთვის |

### ⚡ Performance (Core Web Vitals)

| მეტრიკა | კარგი | საშუალო | სუსტი |
|---------|-------|---------|-------|
| **LCP** (Largest Contentful Paint) | <2.5წ | 2.5-4წ | >4წ |
| **INP** (Interaction to Next Paint) | <200ms | 200-500ms | >500ms |
| **CLS** (Cumulative Layout Shift) | <0.1 | 0.1-0.25 | >0.25 |
| **TBT** (Total Blocking Time) | <200ms | 200-600ms | >600ms |
| **FCP** (First Contentful Paint) | <1.8წ | 1.8-3წ | >3წ |

**LCP-ის გამოსწორება:**
- სურათების ოპტიმიზაცია (WebP, სწორი ზომები)
- preload LCP გამოსახულებისთვის
- render-blocking CSS/JS-ის მოშორება

**INP-ის გამოსწორება:**
- JavaScript-ის გაყოფა მცირე ფრაგმენტებად
- third-party სკრიპტების მოშორება
- web workers მძიმე გამოთვლებისთვის

**CLS-ის გამოსწორება:**
- width/height ატრიბუტები სურათებსა და iframe-ებზე
- font-display: swap ან optional
- რეკლამის სლოტების წინასწარ დაჯავშნა

### 🏷️ Schema & სოც.მედია

| შემოწმება | მნიშვნელობა |
|-----------|-------------|
| JSON-LD Schema | Article, Product, FAQ, Organization, Recipe, HowTo |
| Open Graph | Facebook/LinkedIn გაზიარებისთვის |
| Twitter Card | Twitter/X გაზიარებისთვის |
| Schema Drift | JSON-LD და visible content უნდა ემთხვეოდეს |

### 🤖 AI ეპოქა (2026)

| შემოწმება | პრინციპი |
|-----------|----------|
| **llms.txt** | ახალი 2026 სტანდარტი AI კრაულერებისთვის |
| FAQ Schema | AI Overviews-ში ციტირების სიგნალი |
| Organization Schema | ბრენდის ცნობადობა LLM-ებისთვის |
| **SSR/SSG** | AI კრაულერები JS-ს არ ასრულებენ — SSR აუცილებელია |
| sameAs რგოლები | Wikipedia, სოც.მედია — ბრენდის graph-ისთვის |
| **BLUF format** | Bottom Line Up Front — AI-სთვის ციტირებადი |

## რას **ვერ** ვამოწმებთ ავტომატურად (MVP)

- **Backlinks** — საჭიროა Ahrefs/Moz API (ფასიანი)
- **Brand Mentions** — საჭიროა გარე API
- **E-E-A-T qualitative** — ადამიანის შეფასება
- **Search Intent** — კონტექსტის ანალიზი
- **Topical Authority** — გრძელვადიანი ანალიზი
- **Local SEO** (Google Business Profile) — ცალკე API

## მომავალი ფაზები

### ფაზა 2
- PDF/PPT ექსპორტი
- შაბლონები (Canva-სტილში)
- Word დოკუმენტი
- Visual diagrams

### ფაზა 3
- Backlinks (Moz Free API)
- კონკურენტების შედარება
- ისტორია (გასული აუდიტები)
- რეგულარული ავტო-აუდიტი

### ფაზა 4 (Pro)
- Claude API ქართული ტექსტისთვის
- Custom branding რეპორტებში
- Multi-page crawl (არა მხოლოდ მთავარი)
