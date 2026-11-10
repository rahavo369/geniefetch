# GenieFetch — Cloudflare Free Plan Starter

এটি GenieFetch-এর প্রথম deployable starter project। Public website, product/video/season/upcoming management এবং password-protected admin API অন্তর্ভুক্ত।

## কী আছে
- Cloudflare Pages static website
- Cloudflare Pages Functions API
- Cloudflare D1 database schema
- Admin login (8-hour signed HttpOnly cookie)
- Product serial auto-assignment
- Affiliate ও digital product আলাদা তালিকা
- Seasonal collections এবং upcoming content
- Search/category/season filters

## গুরুত্বপূর্ণ সীমাবদ্ধতা
- এটি প্রথম সংস্করণ। Image upload built-in নয়; image URL দিতে হবে। পরে Cloudflare R2 যুক্ত করা যাবে।
- Digital product payment/checkout built-in নয়; আপনার সমর্থিত storefront/payment provider-এর checkout URL দিতে হবে।
- Cloudflare Free plan-এর quota ও availability সময়ের সঙ্গে বদলাতে পারে। Dashboard-এ বর্তমান limits যাচাই করুন।
- Admin password ও session secret কখনো source code-এ রাখবেন না।
- প্রথম deploy-এর আগে `wrangler.toml`-এ D1 database ID বসাতে হবে।
- Production ব্যবহারের আগে নিজের ডোমেইন, SSL, admin password, secret, backup এবং affiliate disclosure যাচাই করুন।

## Deploy করার ধাপ

### 1) Cloudflare account ও D1 database
1. Cloudflare Dashboard-এ লগইন করুন।
2. Workers & Pages → D1 SQL Database → Create database।
3. Database name দিন `geniefetch-db`।
4. তৈরি হওয়ার পর Database ID কপি করুন।
5. `wrangler.toml`-এর `REPLACE_WITH_YOUR_D1_DATABASE_ID`-এর জায়গায় ID বসান।

### 2) Database schema চালান
Cloudflare Dashboard → D1 → `geniefetch-db` → Console-এ যান।
`migrations/0001_init.sql` ফাইলের সম্পূর্ণ SQL paste করে Execute করুন।

### 3) Pages project deploy
এই ZIP extract করে GitHub repository-তে upload করুন। Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git।
- Framework preset: None
- Build command: ফাঁকা রাখুন
- Build output directory: `public`
- Root directory: `/`
Deploy করুন।

Pages project-এর Settings → Functions → D1 database bindings-এ:
- Variable name: `DB`
- D1 database: `geniefetch-db`

### 4) Admin secrets যোগ করুন
Pages project → Settings → Variables and Secrets → Add:
- `ADMIN_PASSWORD` — শক্তিশালী, unique admin password
- `SESSION_SECRET` — কমপক্ষে 32 random characters-এর secret

এগুলো Secret হিসেবে রাখুন, plain text variable হিসেবে নয়। তারপর নতুন deployment দিন।

উদাহরণ secret তৈরি (নিজের কম্পিউটারে):
`openssl rand -base64 48`

### 5) Admin ব্যবহার
Deploy শেষে:
- Public site: `https://YOUR-PROJECT.pages.dev/`
- Admin: `https://YOUR-PROJECT.pages.dev/admin.html`

Admin password দিয়ে লগইন করুন। Product, Video, Season, Upcoming tab থেকে content যোগ করুন।

## Product serial ও video সম্পর্ক
- Affiliate/Digital product-এর serial number আলাদা global counter নয়; বর্তমানে products table-এর সর্বোচ্চ serial + 1 থেকে auto assign হয়।
- একটি ভিডিওতে একাধিক product যুক্ত করতে একই Video number দিন।
- Product serial field ফাঁকা রাখলে auto serial হবে।
- Video number আগে Videos tab-এ তৈরি করে নিলে content management সহজ হবে।

## Custom domain
Pages project → Custom domains → আপনার কেনা domain যোগ করুন। Cloudflare DNS নির্দেশনা অনুসরণ করুন। Domain-এর DNS Cloudflare-এ active হতে হবে।

## নিরাপত্তা ও রক্ষণাবেক্ষণ
- Admin password কাউকে দেবেন না।
- Session 8 ঘণ্টা পরে expire হবে।
- D1 database নিয়মিত export/backup করুন।
- Affiliate link-এ প্রযোজ্য disclosure দিন এবং affiliate program-এর নিজস্ব policy মেনে চলুন।
- কোনো পণ্য বা ডিজিটাল download প্রকাশের আগে link ও customer access পরীক্ষা করুন।
