-- ===========================================================================
-- CampusEduX — database seed
-- ===========================================================================
-- Converts the sample content in src/data/sample*.ts into real rows so the app
-- renders identically whether it is reading Supabase or falling back to the
-- bundled sample data.
--
-- Run automatically by `supabase db reset`, or manually:
--   psql "$DATABASE_URL" -f supabase/seed.sql
--
-- Demo login (created below):
--   email    demo@campusedux.app   (or mobile 9999999999)
--   password CampusEduXDemo!23
--
-- A few denormalised counters (categories.project_count,
-- companies.open_jobs_count, projects.rating/review_count, referral_codes
-- totals) are written to the *display* numbers from the mockups at the very end
-- of this file, AFTER the triggers from the migrations have recomputed them
-- from the (smaller) seeded row counts. Once real rows are added the triggers
-- take over and keep them live.
-- ===========================================================================

create extension if not exists pgcrypto;
-- crypt()/gen_salt() live in the `extensions` schema on Supabase; make sure both
-- it and public are on the path however this file is run.
set search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- 0. Auth users + profiles
--    handle_new_user() (0001) creates the public.profiles row from
--    raw_user_meta_data; ensure_referral_code() (0021) creates referral_codes.
-- ---------------------------------------------------------------------------
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
   confirmation_token, email_change, email_change_token_new, recovery_token)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated',
   'demo@campusedux.app', crypt('CampusEduXDemo!23', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Rohan Verma","mobile_number":"9999999999"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated',
   'amitkumar@email.com', crypt('CampusEduXDemo!23', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Amit Kumar"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated',
   'nehasingh@email.com', crypt('CampusEduXDemo!23', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Neha Singh"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', 'authenticated', 'authenticated',
   'rahulsharma@email.com', crypt('CampusEduXDemo!23', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Rahul Sharma"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555555', 'authenticated', 'authenticated',
   'poojaverma@email.com', crypt('CampusEduXDemo!23', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Pooja Verma"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '66666666-6666-6666-6666-666666666666', 'authenticated', 'authenticated',
   'vikashpatel@email.com', crypt('CampusEduXDemo!23', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Vikash Patel"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '77777777-7777-7777-7777-777777777777', 'authenticated', 'authenticated',
   'manojgupta@email.com', crypt('CampusEduXDemo!23', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Manoj Gupta"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '88888888-8888-8888-8888-888888888888', 'authenticated', 'authenticated',
   'priyaverma@email.com', crypt('CampusEduXDemo!23', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Priya Verma"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '99999999-9999-9999-9999-999999999999', 'authenticated', 'authenticated',
   'snehareddy@email.com', crypt('CampusEduXDemo!23', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Sneha Reddy"}', now(), now(), '', '', '', '')
on conflict (id) do nothing;

-- Email/password identity for the demo user (required by GoTrue for sign-in).
insert into auth.identities
  (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
values
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
   '{"sub":"11111111-1111-1111-1111-111111111111","email":"demo@campusedux.app"}',
   'email', '11111111-1111-1111-1111-111111111111', now(), now(), now())
on conflict do nothing;

-- Demo user's academic details (Auth -> SelectCourse / SelectBranch / SelectYear).
update public.profiles
   set course = 'B.Tech',
       branch = 'Computer Science Engineering',
       year   = 'Final Year',
       location = 'Bangalore, India'
 where id = '11111111-1111-1111-1111-111111111111';

-- ---------------------------------------------------------------------------
-- 1. Categories   (src/data/sampleHomeContent.ts -> SAMPLE_CATEGORIES)
-- ---------------------------------------------------------------------------
insert into public.categories (id, name, icon, project_count, sort_order) values
  ('web-development',    'Web Development',     'globe-outline',              1200,  1),
  ('mobile-development', 'Mobile Development',  'phone-portrait-outline',      850,  2),
  ('data-science',       'Data Science',        'bar-chart-outline',           650,  3),
  ('machine-learning',   'Machine Learning',    'hardware-chip-outline',       420,  4),
  ('ui-ux-design',       'UI/UX Design',        'color-palette-outline',       530,  5),
  ('devops',             'DevOps',              'git-branch-outline',          310,  6),
  ('dsa-algorithms',     'DSA & Algorithms',    'git-network-outline',         740,  7),
  ('database',           'Database',            'server-outline',              380,  8),
  ('cloud-computing',    'Cloud Computing',     'cloud-outline',               290,  9),
  ('cyber-security',     'Cyber Security',      'shield-checkmark-outline',    260, 10)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Projects   (dedup of SAMPLE_TRENDING/PREMIUM/BEST_SELLERS/NEW_ARRIVALS/
--    SEARCH_PROJECTS by title -> SAMPLE_ALL_PROJECTS). salesCount = reviewCount*2.
--    Shared detail fields come from sampleProjectDetail() / sampleOwnedProjectDetail().
-- ---------------------------------------------------------------------------
-- [2026-09-07] Marketplace/Jobs/Companies demo data removed — block disabled.
/*
insert into public.projects
  (id, title, category_id, category_name, tech_stack, price, rating, review_count,
   is_premium, is_best_seller, sales_count, description, live_demo_url,
   source_code_size_mb, documentation_size_mb, platform_fee_percent,
   developer_name, created_at)
select v.id, v.title, v.category_id, v.category_name, v.tech_stack, v.price, v.rating,
       v.review_count, v.is_premium, v.is_best_seller, v.review_count * 2,
       'A complete, well-documented project with clean source code, an admin panel, '
       || 'responsive UI and step-by-step setup instructions. Ideal for final-year '
       || 'submissions and for learning production patterns.',
       'https://demo.campusedux.app/ecommerce', 45.6, 2.7, 2,
       case when v.id = 'tr-1' then 'CodeCraft Solutions' else 'CampusEduX Studio' end,
       now() - (v.age_days || ' days')::interval
from (values
  ('tr-1', 'E-Commerce Website',              'web-development',    'Web Development',    array['React','Node.js','MongoDB'],       499, 4.6, 122, false, true,  44),
  ('tr-2', 'Hospital Management System',      'web-development',    'Web Development',    array['PHP','MySQL'],                     299, 4.5,  98, false, false, 40),
  ('tr-3', 'Portfolio Website',              'web-development',    'Web Development',    array['HTML','CSS','JavaScript'],         199, 4.4,  86, false, true,  38),
  ('tr-4', 'Chat Application',               'web-development',    'Web Development',    array['Node.js','Socket.io'],            349, 4.6,  74, false, false, 36),
  ('tr-5', 'Task Management App',            'mobile-development', 'Mobile Development', array['React','Firebase'],               249, 4.3,  68, false, false, 34),
  ('pr-1', 'Real Estate Platform',           'web-development',    'Web Development',    array['MERN Stack'],                     699, 4.7, 132, true,  false, 22),
  ('pr-2', 'Crypto Trading Platform',        'web-development',    'Web Development',    array['Next.js','Web3','Node.js'],       799, 4.8,  98, true,  false, 18),
  ('pr-3', 'AI Chat Application',            'machine-learning',  'Machine Learning',  array['Python','FastAPI','React'],       599, 4.6,  76, true,  false, 26),
  ('pr-4', 'SaaS Project Starter',           'web-development',    'Web Development',    array['Next.js','Stripe','Tailwind'],    649, 4.7,  64, true,  false, 30),
  ('bs-2', 'Blog Website',                   'web-development',    'Web Development',    array['WordPress','PHP','MySQL'],        299, 4.4, 102, false, true,  46),
  ('bs-4', 'School Management System',       'web-development',    'Web Development',    array['PHP','MySQL'],                     249, 4.5,  78, false, true,  48),
  ('bs-5', 'Food Delivery App',              'mobile-development', 'Mobile Development', array['Flutter','Firebase'],            349, 4.3,  66, false, true,  50),
  ('na-1', 'NFT Marketplace',                'web-development',    'Web Development',    array['Next.js','Solidity'],            599, 4.5,  28, false, false,  3),
  ('na-2', 'Fitness Website',                'web-development',    'Web Development',    array['React','Tailwind CSS'],          199, 4.4,  20, false, false,  5),
  ('na-3', 'Weather App',                    'mobile-development', 'Mobile Development', array['Flutter','OpenWeather API'],     149, 4.3,  18, false, false,  7),
  ('na-4', 'Movie Recommendation',           'machine-learning',  'Machine Learning',  array['Python','ML'],                    249, 4.5,  16, false, false,  9),
  ('na-5', 'Notes App',                      'mobile-development', 'Mobile Development', array['React','Firebase'],               149, 4.2,  12, false, false, 11),
  ('se-2', 'E-Commerce App',                 'mobile-development', 'Mobile Development', array['Flutter','Firebase'],            399, 4.4,  96, false, false, 20),
  ('se-3', 'E-Commerce Admin Panel',         'web-development',    'Web Development',    array['React','Node.js','MongoDB'],      449, 4.5,  72, false, false, 24),
  ('se-4', 'E-Commerce API',                 'web-development',    'Web Development',    array['Node.js','Express','MongoDB'],    299, 4.3,  54, false, false, 26),
  ('se-5', 'E-Commerce with Payment Gateway','web-development',    'Web Development',    array['React','Node.js','Razorpay'],     549, 4.6, 102, false, false, 28)
) as v(id, title, category_id, category_name, tech_stack, price, rating, review_count, is_premium, is_best_seller, age_days)
on conflict (id) do nothing;
*/

-- GitHub / repo metadata for the "owned project" flow (sampleOwnedProjectDetail).
update public.projects set
  github_url = 'https://github.com/codecraft-solutions/ecommerce-web-app',
  repo_owner = 'codecraft-solutions', repo_name = 'ecommerce-web-app',
  repo_language = 'JavaScript', repo_stars = 128, repo_forks = 45,
  repo_updated_at = now() - interval '15 days',
  license = 'Regular License'
where id = 'tr-1';

-- ---------------------------------------------------------------------------
-- 3. Project deliverables for the demo "owned" project tr-1
--    (sampleProjectFiles / sampleVersionHistory)
-- ---------------------------------------------------------------------------
-- [2026-09-07] Marketplace/Jobs/Companies demo data removed — block disabled.
/*
insert into public.project_files (id, project_id, category, label, file_name, size_mb, storage_path, sort_order) values
  ('tr-1-main-1', 'tr-1', 'main',          'Source Code (Full Project)',        'source-code.zip',        245,   'tr-1/source-code.zip',        1),
  ('tr-1-main-2', 'tr-1', 'main',          'Admin Panel',                       'admin-panel.zip',         89,   'tr-1/admin-panel.zip',        2),
  ('tr-1-main-3', 'tr-1', 'main',          'User Panel',                        'user-panel.zip',          72,   'tr-1/user-panel.zip',         3),
  ('tr-1-main-4', 'tr-1', 'main',          'Database Files (SQL)',              'database.sql',            15,   'tr-1/database.sql',           4),
  ('tr-1-main-5', 'tr-1', 'main',          'Documentation (PDF)',               'documentation.pdf',        3.2, 'tr-1/documentation.pdf',      5),
  ('tr-1-main-6', 'tr-1', 'main',          'Environment Setup',                 'env-setup.zip',            1.1, 'tr-1/env-setup.zip',          6),
  ('tr-1-doc-1',  'tr-1', 'documentation', 'Installation Guide.pdf',            'installation-guide.pdf',   2.4, 'tr-1/installation-guide.pdf', 1),
  ('tr-1-doc-2',  'tr-1', 'documentation', 'User Manual.pdf',                   'user-manual.pdf',          3.1, 'tr-1/user-manual.pdf',        2),
  ('tr-1-doc-3',  'tr-1', 'documentation', 'Admin Panel Guide.pdf',            'admin-panel-guide.pdf',    2.8, 'tr-1/admin-panel-guide.pdf',  3),
  ('tr-1-doc-4',  'tr-1', 'documentation', 'API Documentation.pdf',             'api-documentation.pdf',    1.6, 'tr-1/api-documentation.pdf',  4),
  ('tr-1-doc-5',  'tr-1', 'documentation', 'Environment Setup.pdf',             'environment-setup.pdf',    1.2, 'tr-1/environment-setup.pdf',  5),
  ('tr-1-doc-6',  'tr-1', 'documentation', 'Frequently Asked Questions.pdf',    'faq.pdf',                  0.9, 'tr-1/faq.pdf',                6)
on conflict (id) do nothing;

insert into public.project_versions (id, project_id, version, is_latest, released_at, size_mb, changelog, sort_order) values
  ('a1000000-0000-0000-0000-000000000022', 'tr-1', '2.2', true,  now() - interval '3 days',  256,
   '["New Payment Gateway Integration","Improved UI/UX","Bug Fixes and Performance Improvements","Added Dark Mode"]', 1),
  ('a1000000-0000-0000-0000-000000000021', 'tr-1', '2.1', false, now() - interval '13 days', 245,
   '["Added Product Reviews","Improved Checkout Flow","Minor Bug Fixes"]', 2),
  ('a1000000-0000-0000-0000-000000000020', 'tr-1', '2.0', false, now() - interval '28 days', 230,
   '["Initial Release","User & Admin Panel","Basic E-Commerce Features"]', 3),
  ('a1000000-0000-0000-0000-000000000010', 'tr-1', '1.0', false, now() - interval '43 days', 120,
   '["Project Setup","Basic Structure"]', 4)
on conflict (id) do nothing;
*/

-- ---------------------------------------------------------------------------
-- 4. Reviews for tr-1   (sampleReviews)
-- ---------------------------------------------------------------------------
-- [2026-09-07] Marketplace/Jobs/Companies demo data removed — block disabled.
/*
insert into public.reviews (id, project_id, user_id, rating, comment, created_at) values
  ('b1000000-0000-0000-0000-000000000001', 'tr-1', '44444444-4444-4444-4444-444444444444', 5,
   'Great project! Well structured and easy to customize.', now() - interval '2 days'),
  ('b1000000-0000-0000-0000-000000000002', 'tr-1', '88888888-8888-8888-8888-888888888888', 4,
   'Nice work. Documentation is helpful.', now() - interval '7 days'),
  ('b1000000-0000-0000-0000-000000000003', 'tr-1', '22222222-2222-2222-2222-222222222222', 5,
   'Perfect for learning. Recommended!', now() - interval '14 days')
on conflict (id) do nothing;
*/

-- ---------------------------------------------------------------------------
-- 5. Wishlist / purchases / downloads for the demo user
--    (sampleWishlist / samplePurchased / sampleDownloads)
-- ---------------------------------------------------------------------------
-- [2026-09-07] Marketplace/Jobs/Companies demo data removed — block disabled.
/*
insert into public.wishlists (user_id, project_id, created_at) values
  ('11111111-1111-1111-1111-111111111111', 'tr-1', now() - interval '5 days'),
  ('11111111-1111-1111-1111-111111111111', 'pr-3', now() - interval '8 days'),
  ('11111111-1111-1111-1111-111111111111', 'tr-3', now() - interval '11 days'),
  ('11111111-1111-1111-1111-111111111111', 'tr-4', now() - interval '15 days')
on conflict (user_id, project_id) do nothing;

insert into public.purchases
  (id, user_id, project_id, status, price, platform_fee, discount, total_amount,
   purchased_version, razorpay_order_id, razorpay_payment_id, created_at)
values
  ('d1000000-0000-0000-0000-000000001001', '11111111-1111-1111-1111-111111111111', 'tr-1', 'success', 499, 9.98, 0, 508.98, '2.1', 'order_seed1001', 'pay_seed1001', now() - interval '9 days'),
  ('d1000000-0000-0000-0000-000000001002', '11111111-1111-1111-1111-111111111111', 'tr-4', 'success', 349, 6.98, 0, 355.98, '1.0', 'order_seed1002', 'pay_seed1002', now() - interval '22 days'),
  ('d1000000-0000-0000-0000-000000001003', '11111111-1111-1111-1111-111111111111', 'pr-3', 'success', 599, 11.98, 0, 610.98, '1.0', 'order_seed1003', 'pay_seed1003', now() - interval '32 days'),
  ('d1000000-0000-0000-0000-000000001004', '11111111-1111-1111-1111-111111111111', 'tr-3', 'success', 199, 3.98, 0, 202.98, '1.0', 'order_seed1004', 'pay_seed1004', now() - interval '47 days')
on conflict (id) do nothing;

insert into public.downloads (id, user_id, project_id, file_label, file_size_mb, downloaded_at) values
  ('d2000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'tr-1', 'Source Code (ZIP)',    25.4, now() - interval '9 days'),
  ('d2000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'tr-4', 'Source Code (ZIP)',    18.7, now() - interval '22 days'),
  ('d2000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'pr-3', 'Documentation (PDF)',  12.1, now() - interval '32 days'),
  ('d2000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'tr-3', 'Source Code (ZIP)',     8.9, now() - interval '47 days')
on conflict (id) do nothing;
*/

-- ---------------------------------------------------------------------------
-- 6. Companies + recruiter   (SAMPLE_COMPANIES + SAMPLE_PLACEMENT_COMPANIES)
-- ---------------------------------------------------------------------------
-- [2026-09-07] Marketplace/Jobs/Companies demo data removed — block disabled.
/*
insert into public.companies (id, name, logo_url, website, rating, review_count, employee_count, about, open_jobs_count) values
  ('google',    'Google',    null, 'www.google.com',    4.4, 12500, '10k+', 'Google''s mission is to organize the world''s information and make it universally accessible and useful.', 123),
  ('microsoft', 'Microsoft', null, 'www.microsoft.com', 4.3,  9800, '10k+', 'Microsoft empowers every person and organization on the planet to achieve more.', 98),
  ('tcs',       'TCS',       null, 'www.tcs.com',       4.1,  8700, '10k+', 'Tata Consultancy Services is an IT services, consulting and business solutions organization.', 87),
  ('infosys',   'Infosys',   null, 'www.infosys.com',   4.0,  7400, '10k+', 'Infosys is a global leader in next-generation digital services and consulting.', 74),
  ('wipro',     'Wipro',     null, 'www.wipro.com',     3.9,  6500, '10k+', 'Wipro is a leading technology services and consulting company.', 65),
  ('amazon',    'Amazon',    null, 'www.amazon.jobs',   4.2, 11200, '10k+', 'Amazon is guided by customer obsession, passion for invention, operational excellence, and long-term thinking.', 60),
  ('deloitte',  'Deloitte',  null, 'www.deloitte.com',  4.0,  5100, '10k+', 'Deloitte provides audit, consulting, tax and advisory services.', 51),
  ('accenture', 'Accenture', null, 'www.accenture.com', 4.1,  8900, '10k+', 'Accenture is a global professional services company with leading capabilities in digital, cloud and security.', 45),
  ('capgemini', 'Capgemini', null, 'www.capgemini.com', 3.9,  4300, '10k+', 'Capgemini is a global leader in partnering with companies to transform and manage their business.', 32),
  ('cognizant', 'Cognizant', null, 'www.cognizant.com', 3.9,  4100, '10k+', 'Cognizant engineers modern businesses to improve everyday life.', 40)
on conflict (id) do nothing;

insert into public.recruiters (id, company_id, name, title, rating, review_count, email, phone, location, about) values
  ('rec-1', 'infosys', 'Neha Verma', 'Senior Talent Acquisition Specialist', 4.6, 320,
   'neha.verma@example.com', '+91 98765 12345', 'Mumbai, India',
   'Neha has 6+ years of experience in hiring top tech talent across India. She specializes in full-cycle recruitment for IT roles.')
on conflict (id) do nothing;
*/

-- ---------------------------------------------------------------------------
-- 7. Jobs   (SAMPLE_JOBS + generic detail from sampleJobDetail)
-- ---------------------------------------------------------------------------
-- [2026-09-07] Marketplace/Jobs/Companies demo data removed — block disabled.
/*
insert into public.jobs
  (id, title, company_id, company_name, recruiter_id, location, salary_range,
   salary_min_lpa, salary_max_lpa, job_type, description, requirements, skills,
   experience, posted_at)
select v.id, v.title, v.company_id, v.company_name, v.recruiter_id, v.location,
       v.salary_range, v.smin, v.smax, 'Full Time',
       'We are looking for a skilled developer to build responsive and user-friendly '
       || 'web applications. You will work with a cross-functional team to design, '
       || 'build and ship new features end to end.',
       array['2-4 years of experience','Strong in HTML, CSS, JavaScript','Experience with React.js','Good problem solving skills'],
       array['HTML','CSS','JavaScript','React','Git'],
       '2-4 Yrs Exp',
       now() - (v.age_days || ' days')::interval
from (values
  ('job-1',  'Full Stack Developer', 'infosys',   'Infosys',   'rec-1', 'Bangalore, India', '₹6-10 LPA',   6, 10, 2),
  ('job-2',  'React Developer',      'tcs',       'TCS',       null,    'Hyderabad, India', '₹5-9 LPA',    5,  9, 1),
  ('job-3',  'UI/UX Designer',       'wipro',     'Wipro',     null,    'Pune, India',      '₹4-8 LPA',    4,  8, 3),
  ('job-4',  'Java Developer',       'capgemini', 'Capgemini', null,    'Chennai, India',   '₹4-7 LPA',    4,  7, 2),
  ('job-5',  'Data Analyst',         'accenture', 'Accenture', null,    'Bangalore, India', '₹5-8 LPA',    5,  8, 4),
  ('job-6',  'Frontend Developer',   'tcs',       'TCS',       null,    'Mumbai, India',    '₹5-9 LPA',    5,  9, 2),
  ('job-7',  'Backend Developer',    'amazon',    'Amazon',    null,    'Bangalore, India', '₹10-18 LPA', 10, 18, 5),
  ('job-8',  'Product Manager',      'google',    'Google',    null,    'Bangalore, India', '₹20-35 LPA', 20, 35, 1),
  ('job-9',  'Software Engineer',    'microsoft', 'Microsoft', null,    'Hyderabad, India', '₹15-25 LPA', 15, 25, 3),
  ('job-10', 'Data Scientist',       'microsoft', 'Microsoft', null,    'Hyderabad, India', '₹12-20 LPA', 12, 20, 5)
) as v(id, title, company_id, company_name, recruiter_id, location, salary_range, smin, smax, age_days)
on conflict (id) do nothing;
*/

-- ---------------------------------------------------------------------------
-- 8. Uploaded resume + job applications for the demo user
--    (sampleResumes / sampleAppliedJobs)
-- ---------------------------------------------------------------------------
insert into public.resumes (id, user_id, file_name, file_url, uploaded_at) values
  ('bb000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'My Resume.pdf', '', now() - interval '8 days')
on conflict (id) do nothing;

-- [2026-09-07] Marketplace/Jobs/Companies demo data removed — block disabled.
/*
insert into public.applications (id, user_id, job_id, resume_id, status, created_at) values
  ('cc000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'job-6', 'bb000000-0000-0000-0000-000000000001', 'in_review',   now() - interval '7 days'),
  ('cc000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'job-5', 'bb000000-0000-0000-0000-000000000001', 'shortlisted', now() - interval '12 days'),
  ('cc000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'job-3', 'bb000000-0000-0000-0000-000000000001', 'rejected',    now() - interval '20 days')
on conflict (id) do nothing;

insert into public.application_stages (application_id, label, status, occurred_at, sort_order) values
  ('cc000000-0000-0000-0000-000000000001', 'Application Submitted', 'completed',   now() - interval '7 days',  0),
  ('cc000000-0000-0000-0000-000000000001', 'HR Review',             'completed',   now() - interval '5 days',  1),
  ('cc000000-0000-0000-0000-000000000001', 'Technical Round',       'in_progress', null,                        2),
  ('cc000000-0000-0000-0000-000000000001', 'HR Interview',          'pending',     null,                        3),
  ('cc000000-0000-0000-0000-000000000001', 'Final Decision',        'pending',     null,                        4),
  ('cc000000-0000-0000-0000-000000000002', 'Application Submitted', 'completed',   now() - interval '12 days', 0),
  ('cc000000-0000-0000-0000-000000000002', 'HR Review',             'completed',   now() - interval '10 days', 1),
  ('cc000000-0000-0000-0000-000000000002', 'Technical Round',       'completed',   now() - interval '6 days',  2),
  ('cc000000-0000-0000-0000-000000000002', 'HR Interview',          'in_progress', null,                        3),
  ('cc000000-0000-0000-0000-000000000002', 'Final Decision',        'pending',     null,                        4),
  ('cc000000-0000-0000-0000-000000000003', 'Application Submitted', 'completed',   now() - interval '20 days', 0),
  ('cc000000-0000-0000-0000-000000000003', 'HR Review',             'completed',   now() - interval '18 days', 1),
  ('cc000000-0000-0000-0000-000000000003', 'Technical Round',       'completed',   now() - interval '14 days', 2),
  ('cc000000-0000-0000-0000-000000000003', 'Final Decision',        'completed',   now() - interval '10 days', 3)
on conflict do nothing;

insert into public.saved_jobs (user_id, job_id, created_at) values
  ('11111111-1111-1111-1111-111111111111', 'job-3', now() - interval '3 days'),
  ('11111111-1111-1111-1111-111111111111', 'job-5', now() - interval '6 days'),
  ('11111111-1111-1111-1111-111111111111', 'job-7', now() - interval '9 days'),
  ('11111111-1111-1111-1111-111111111111', 'job-8', now() - interval '10 days'),
  ('11111111-1111-1111-1111-111111111111', 'job-9', now() - interval '14 days')
on conflict (user_id, job_id) do nothing;
*/

insert into public.job_alerts (user_id, enabled, job_role, location, experience, salary_range, job_type) values
  ('11111111-1111-1111-1111-111111111111', true, 'Frontend Developer', 'Bangalore, India', '1 - 5 Years', '₹5 LPA - ₹15 LPA', 'Full Time')
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------
-- 9. Resume Builder   (resume_templates + SAMPLE_RESUME_LIST + sampleResumeDetail)
-- ---------------------------------------------------------------------------
insert into public.resume_templates (id, name, accent_color, description, sort_order) values
  ('modern',       'Modern',       '#4F39F6', 'Clean two-column layout with a bold accent header.',   1),
  ('professional', 'Professional', '#1E3A8A', 'Traditional single-column layout for corporate roles.', 2),
  ('minimal',      'Minimal',      '#374151', 'Understated typography-first layout, ATS friendly.',    3),
  ('creative',     'Creative',     '#DB2777', 'Colourful accents for design and product roles.',       4)
on conflict (id) do nothing;

insert into public.resumes_builder
  (id, user_id, title, template, personal_details, education, skills, sections, ats_score, updated_at)
select v.id, '11111111-1111-1111-1111-111111111111', v.title, v.template,
  '{"fullName":"Alex Johnson","jobTitle":"Software Engineer","email":"alex.johnson@email.com","phone":"+91 98765 43210","location":"Bangalore, India","linkedin":"linkedin.com/in/alexjohnson","website":"alexjohnson.dev","photoUrl":null}'::jsonb,
  '[{"id":"edu-1","degree":"Bachelor of Technology, Computer Science Engineering","institution":"R V College of Engineering, Bangalore","startYear":"2020","endYear":"2024","percentage":"8.2"},{"id":"edu-2","degree":"Higher Secondary (12th)","institution":"Kendriya Vidyalaya, Bangalore","startYear":"2018","endYear":"2020","percentage":"92"}]'::jsonb,
  '{"technical":["JavaScript","TypeScript","React.js","Node.js","Express.js","MongoDB","Python","SQL","Git","Docker"],"soft":["Problem Solving","Communication","Teamwork","Time Management","Adaptability","Leadership"]}'::jsonb,
  ('{"experience":"Software Engineer Intern — Acme Corp (Jun 2023 - Dec 2023)\n- Built responsive UI components with React and TypeScript\n- Implemented REST APIs in Node.js and Express, reducing average response time by 30%\n- Wrote unit and integration tests, raising coverage from 55% to 85%",'
   || '"projects":"E-Commerce Website — React, Node.js, MongoDB\n- Developed a full-stack shopping app with cart, checkout and payment integration\n- Designed the admin panel and product management flow",'
   || '"certifications":"AWS Certified Cloud Practitioner (2024)",'
   || '"achievements":"Winner, Smart India Hackathon 2023",'
   || '"languages":"English (Fluent), Hindi (Native)",'
   || '"references":"",'
   || '"summary":"Software Engineer with a strong foundation in full-stack web development and a track record of shipping clean, well-tested features. Passionate about building products that scale and mentoring newer teammates."}')::jsonb,
  v.ats, now() - (v.age_days || ' days')::interval
from (values
  ('aa000000-0000-0000-0000-000000000001'::uuid, 'Software Engineer Resume',      'modern',       85, 2),
  ('aa000000-0000-0000-0000-000000000002'::uuid, 'Full Stack Developer Resume',   'professional', 78, 4),
  ('aa000000-0000-0000-0000-000000000003'::uuid, 'Data Analyst Resume',           'minimal',      72, 7),
  ('aa000000-0000-0000-0000-000000000004'::uuid, 'Frontend Developer Resume',     'creative',     80, 12),
  ('aa000000-0000-0000-0000-000000000005'::uuid, 'Backend Developer Resume',      'modern',       75, 20)
) as v(id, title, template, ats, age_days)
on conflict (id) do nothing;

insert into public.resume_downloads (id, user_id, resume_id, resume_title, file_url, downloaded_at) values
  ('af000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'aa000000-0000-0000-0000-000000000001', 'Software Engineer Resume',    '', now() - interval '2 days'),
  ('af000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'aa000000-0000-0000-0000-000000000002', 'Full Stack Developer Resume', '', now() - interval '9 days'),
  ('af000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'aa000000-0000-0000-0000-000000000003', 'Data Analyst Resume',         '', now() - interval '15 days')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 10. Placement — aptitude topics   (SAMPLE_APTITUDE_TOPICS)
-- ---------------------------------------------------------------------------
insert into public.aptitude_topics (id, category, name, total_questions, sort_order) values
  ('q-1','quantitative','Number System',20,1),('q-2','quantitative','Algebra',25,2),
  ('q-3','quantitative','Geometry',20,3),('q-4','quantitative','Mensuration',20,4),
  ('q-5','quantitative','Data Interpretation',20,5),('q-6','quantitative','Arithmetic',15,6),
  ('q-7','quantitative','Modern Maths',15,7),
  ('l-1','logical','Syllogism',20,1),('l-2','logical','Coding - Decoding',18,2),
  ('l-3','logical','Blood Relations',20,3),('l-4','logical','Puzzles',25,4),
  ('l-5','logical','Seating Arrangement',20,5),('l-6','logical','Direction Sense',15,6),
  ('l-7','logical','Statement - Assumption',15,7),
  ('v-1','verbal','Reading Comprehension',20,1),('v-2','verbal','Spotting Errors',15,2),
  ('v-3','verbal','Fill in the Blanks',20,3),('v-4','verbal','Para Jumbles',15,4),
  ('v-5','verbal','Synonyms & Antonyms',20,5),('v-6','verbal','Idioms & Phrases',15,6),
  ('v-7','verbal','One Word Substitution',15,7)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 11. Placement — practice tests + questions   (samplePracticeTests / sampleTestQuestions)
-- ---------------------------------------------------------------------------
insert into public.practice_tests (id, title, category, company_id, question_count, duration_minutes, description) values
  ('aptitude-test-1','Aptitude Test - 01','aptitude',null,5,60,'30 Questions · 60 mins'),
  ('aptitude-test-2','Aptitude Test - 02','aptitude',null,30,60,'30 Questions · 60 mins'),
  ('aptitude-test-3','Aptitude Test - 03','aptitude',null,30,60,'30 Questions · 60 mins'),
  ('logical-test-1','Logical Test - 01','logical',null,5,60,'30 Questions · 60 mins'),
  ('logical-test-2','Logical Test - 02','logical',null,30,60,'30 Questions · 60 mins'),
  ('verbal-test-1','Verbal Test - 01','verbal',null,5,60,'30 Questions · 60 mins'),
  ('verbal-test-2','Verbal Test - 02','verbal',null,30,60,'30 Questions · 60 mins'),
  ('tcs-mock-1','TCS Mock Test - 01','company','tcs',5,90,'Aptitude, Coding, Reasoning'),
  ('tcs-mock-2','TCS Mock Test - 02','company','tcs',60,90,'Full length company pattern test'),
  ('tcs-mock-3','TCS NQT Practice','company','tcs',45,60,'National Qualifier Test pattern'),
  ('infosys-mock-1','Infosys Mock Test - 01','company','infosys',60,90,'Aptitude, Reasoning, Verbal'),
  ('infosys-mock-2','Infosys Mock Test - 02','company','infosys',60,90,'Full length company pattern test'),
  ('wipro-mock-1','Wipro Mock Test - 01','company','wipro',55,80,'Aptitude, Coding, Essay'),
  ('accenture-mock-1','Accenture Mock Test - 01','company','accenture',50,75,'Cognitive + Technical'),
  ('cognizant-mock-1','Cognizant Mock Test - 01','company','cognizant',55,80,'GenC pattern practice'),
  ('capgemini-mock-1','Capgemini Mock Test - 01','company','capgemini',50,90,'Game-based aptitude + Pseudo code')
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
select t.test_id || '-' || q.id, t.test_id, q.question_text, q.options::jsonb, q.correct_index, q.explanation, 1, q.sort_order
from (values ('aptitude-test-1'),('logical-test-1'),('verbal-test-1'),('tcs-mock-1')) as t(test_id)
cross join (values
  ('tq-1','If 3x + 5 = 20, what is the value of 2x + 7?','["15","17","19","21"]',1,'3x = 15 so x = 5; 2(5) + 7 = 17.',1),
  ('tq-2','A train 120 m long crosses a pole in 6 seconds. Its speed is:','["60 km/h","72 km/h","48 km/h","90 km/h"]',1,'Speed = 120/6 = 20 m/s = 72 km/h.',2),
  ('tq-3','Find the odd one out: 2, 3, 5, 7, 9, 11','["3","5","9","11"]',2,'9 is the only non-prime.',3),
  ('tq-4','Choose the synonym of ''Diligent'':','["Lazy","Hardworking","Careless","Slow"]',1,'Diligent means hardworking and careful.',4),
  ('tq-5','The average of 5 numbers is 20. If one number is removed, the average becomes 22. The removed number is:','["10","12","14","16"]',1,'Sum = 100; remaining sum = 88; removed = 12.',5)
) as q(id, question_text, options, correct_index, explanation, sort_order)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 12. Placement — demo user's test attempts (trend mirrors SAMPLE_PERFORMANCE)
-- ---------------------------------------------------------------------------
insert into public.test_attempts (id, user_id, test_id, score, total_marks, correct_count, incorrect_count, time_taken_seconds, created_at) values
  ('ee000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','aptitude-test-1',18,30,18,12,2400, now() - interval '40 days'),
  ('ee000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','logical-test-1', 21,30,21, 9,2500, now() - interval '33 days'),
  ('ee000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','verbal-test-1',  20,30,20,10,2600, now() - interval '26 days'),
  ('ee000000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','aptitude-test-2',23,30,23, 7,2700, now() - interval '18 days'),
  ('ee000000-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','tcs-mock-1',     25,30,25, 5,2650, now() - interval '10 days'),
  ('ee000000-0000-0000-0000-000000000006','11111111-1111-1111-1111-111111111111','tcs-mock-2',     24,30,24, 6,2550, now() - interval '4 days'),
  ('ee000000-0000-0000-0000-000000000007','11111111-1111-1111-1111-111111111111','logical-test-2', 22,30,22, 8,2580, now() - interval '2 days'),
  ('ee000000-0000-0000-0000-000000000008','11111111-1111-1111-1111-111111111111','verbal-test-2',  26,30,26, 4,2450, now() - interval '1 days')
on conflict (id) do nothing;

insert into public.test_attempt_answers (attempt_id, question_id, selected_index, is_correct) values
  ('ee000000-0000-0000-0000-000000000005','tcs-mock-1-tq-1',1,true),
  ('ee000000-0000-0000-0000-000000000005','tcs-mock-1-tq-2',1,true),
  ('ee000000-0000-0000-0000-000000000005','tcs-mock-1-tq-3',0,false),
  ('ee000000-0000-0000-0000-000000000005','tcs-mock-1-tq-4',1,true),
  ('ee000000-0000-0000-0000-000000000005','tcs-mock-1-tq-5',1,true)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 13. Placement — DSA   (SAMPLE_DSA_TOPICS / sampleDSAProblems / sampleDSAProblemDetail)
--     Catalog is a representative subset; per-topic totals shown in the app are
--     computed from these rows, not the mockup's large numbers.
-- ---------------------------------------------------------------------------
insert into public.dsa_topics (id, name, sort_order) values
  ('dsa-arrays','Arrays',1),('dsa-strings','Strings',2),('dsa-linked-list','Linked List',3),
  ('dsa-trees','Trees',4),('dsa-graphs','Graphs',5),('dsa-dp','Dynamic Programming',6),
  ('dsa-stack-queue','Stack & Queue',7),('dsa-sorting','Sorting & Searching',8)
on conflict (id) do nothing;

insert into public.dsa_problems
  (id, topic_id, title, difficulty, sort_order, description, examples, constraints,
   starter_code, time_complexity, space_complexity, solution_approach, solution_code)
select v.id, 'dsa-arrays', v.title, v.difficulty, v.sort_order,
  'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input has exactly one solution, and you may not use the same element twice.',
  '[{"input":"nums = [2,7,11,15], target = 9","output":"[0,1]","explanation":"nums[0] + nums[1] == 9, so we return [0, 1]."},{"input":"nums = [3,2,4], target = 6","output":"[1,2]"}]'::jsonb,
  '["2 <= nums.length <= 10^4","-10^9 <= nums[i] <= 10^9","-10^9 <= target <= 10^9","Only one valid answer exists."]'::jsonb,
  '{"python":"class Solution:\n    def twoSum(self, nums, target):\n        # write your code here\n        pass","javascript":"function twoSum(nums, target) {\n  // write your code here\n}","java":"class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // write your code here\n        return new int[]{};\n    }\n}","cpp":"class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // write your code here\n        return {};\n    }\n};"}'::jsonb,
  'O(n)', 'O(n)',
  'Use a hash map to store each number''s index as you iterate. For each number, check if its complement (target - num) already exists in the map; if so, return the stored index and the current index.',
  '{"python":"class Solution:\n    def twoSum(self, nums, target):\n        seen = {}\n        for i, num in enumerate(nums):\n            if target - num in seen:\n                return [seen[target - num], i]\n            seen[num] = i","javascript":"function twoSum(nums, target) {\n  const seen = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    if (seen.has(target - nums[i])) return [seen.get(target - nums[i]), i];\n    seen.set(nums[i], i);\n  }\n}"}'::jsonb
from (values
  ('p-two-sum','Two Sum','Easy',1),
  ('p-best-time','Best Time to Buy and Sell Stock','Easy',2),
  ('p-contains-dup','Contains Duplicate','Easy',3),
  ('p-max-subarray','Maximum Subarray','Medium',4),
  ('p-product-except','Product of Array Except Self','Medium',5),
  ('p-rotate-array','Rotate Array','Medium',6),
  ('p-merge-intervals','Merge Intervals','Hard',7)
) as v(id, title, difficulty, sort_order)
on conflict (id) do nothing;

insert into public.user_dsa_progress (user_id, problem_id, status, solved_at) values
  ('11111111-1111-1111-1111-111111111111','p-two-sum','solved',   now() - interval '30 days'),
  ('11111111-1111-1111-1111-111111111111','p-best-time','solved', now() - interval '24 days'),
  ('11111111-1111-1111-1111-111111111111','p-max-subarray','solved', now() - interval '9 days')
on conflict (user_id, problem_id) do nothing;

-- ---------------------------------------------------------------------------
-- 14. Placement — HR / company questions   (SAMPLE_HR_QUESTIONS / sampleCompanyQuestions)
-- ---------------------------------------------------------------------------
insert into public.hr_questions (id, company_id, category, question, answer_tips, sample_answer) values
  ('hr-1', null, 'General Questions', 'Tell me about yourself.',
   '["Start with your name and background.","Talk about your education and skills.","Mention your achievements.","End with your career goals."]',
   'I am a final year B.Tech student in Computer Science. I have a strong foundation in Data Structures and Algorithms and have built several projects using Python and React. I am looking forward to working in a challenging environment where I can grow and contribute.'),
  ('hr-2', null, 'General Questions', 'What are your strengths?',
   '["Pick 2-3 relevant strengths.","Back each with a short example.","Tie them to the role."]',
   'My key strengths are problem solving and consistency. During my last project I debugged a performance issue that halved page load time, and I practice DSA daily which keeps my fundamentals sharp.'),
  ('hr-3', null, 'General Questions', 'What is your weakness?',
   '["Choose a real but non-critical weakness.","Show the steps you take to improve it."]',
   'I used to hesitate to ask for help early. I now set a 30-minute rule: if I am stuck beyond that, I reach out, which has made me much more efficient.'),
  ('hr-4', null, 'General Questions', 'Why should we hire you?',
   '["Match your skills to the job description.","Show enthusiasm for the company.","Be confident, not arrogant."]',
   'I bring strong fundamentals, hands-on project experience and a genuine eagerness to learn. I have followed your company''s engineering culture and I am confident I can add value quickly.'),
  ('hr-5', null, 'Career Questions', 'Where do you see yourself in 5 years?',
   '["Show ambition aligned with the company.","Focus on growth and contribution, not titles."]',
   'In five years I see myself as a strong engineer who has grown into leading small features end to end and mentoring newer teammates, while continuing to deepen my technical expertise.'),
  ('tcs-hr-1', 'tcs', 'Technical', 'Tell me about yourself.',
   '["Start with your name and background.","Talk about your education and skills.","Mention your achievements.","End with your career goals."]',
   'I am a final year B.Tech student in Computer Science with a strong foundation in DSA and hands-on project experience in Python and React.'),
  ('tcs-hr-2', 'tcs', 'HR', 'What are your strengths?',
   '["Pick 2-3 relevant strengths.","Back each with a short example.","Tie them to the role."]',
   'Problem solving and consistency — I practice DSA daily and shipped a performance fix that halved page load time.'),
  ('tcs-hr-3', 'tcs', 'Technical', 'What is your weakness?',
   '["Choose a real but non-critical weakness.","Show the steps you take to improve it."]',
   'I used to hesitate to ask for help early; I now use a 30-minute rule before reaching out.'),
  ('tcs-hr-4', 'tcs', 'HR', 'Why should we hire you?',
   '["Match your skills to the job description.","Show enthusiasm for the company."]',
   'Strong fundamentals, project experience and eagerness to learn — I can add value quickly.'),
  ('tcs-hr-5', 'tcs', 'Technical', 'Where do you see yourself in 5 years?',
   '["Show ambition aligned with the company.","Focus on growth and contribution."]',
   'Growing into owning features end to end and mentoring newer teammates while deepening my technical expertise.'),
  ('infosys-hr-1', 'infosys', 'HR', 'Why Infosys?',
   '["Reference their training program.","Mention scale and learning opportunities."]',
   'Infosys'' structured training and the breadth of projects would let me build strong fundamentals fast.'),
  ('infosys-hr-2', 'infosys', 'Technical', 'Explain OOP concepts with examples.',
   '["Define each of the four pillars.","Give a one-line code-level example for each."]',
   'Encapsulation, abstraction, inheritance and polymorphism — e.g. a Shape base class with area() overridden by Circle and Square.')
on conflict (id) do nothing;

insert into public.user_favorite_questions (user_id, question_id) values
  ('11111111-1111-1111-1111-111111111111', 'hr-1')
on conflict (user_id, question_id) do nothing;

-- ---------------------------------------------------------------------------
-- 15. Wallet   (SAMPLE_WALLET_TRANSACTIONS)
--     The referral_bonus rows are NOT seeded here — sync_referral_totals()
--     (migration 0021) inserts one wallet credit per successful referral in
--     section 16 below, so the demo wallet's "Referral Earnings" total is
--     derived from real referral rows, not hard-coded.
-- ---------------------------------------------------------------------------
insert into public.wallet_transactions (id, user_id, type, category, amount, description, created_at) values
  ('c1000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','credit','added_money',        500,  'Added Money',          now() - interval '2 days'),
  ('c1000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','debit', 'project_purchase',   299,  'Project Purchase',     now() - interval '4 days'),
  ('c1000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','debit', 'mock_test_purchase',  49,  'Mock Test Purchase',   now() - interval '5 days'),
  ('c1000000-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','credit','added_money',       1000,  'Added Money',          now() - interval '12 days'),
  ('c1000000-0000-0000-0000-000000000006','11111111-1111-1111-1111-111111111111','credit','cashback',            50,  'Cashback',             now() - interval '14 days'),
  ('c1000000-0000-0000-0000-000000000007','11111111-1111-1111-1111-111111111111','debit', 'project_purchase',   402,  'Project Purchase',     now() - interval '18 days')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 16. Referrals   (SAMPLE_REFERRAL_HISTORY -> referrals; sync_referral_totals
--     trigger auto-fills referral_earnings and referral_codes rollups)
-- ---------------------------------------------------------------------------
insert into public.referrals (id, referrer_id, referred_user_id, status, reward_amount, created_at, completed_at) values
  ('40000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','successful',100, now() - interval '2 days',  now() - interval '1 days'),
  ('40000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','33333333-3333-3333-3333-333333333333','successful',100, now() - interval '4 days',  now() - interval '3 days'),
  ('40000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','44444444-4444-4444-4444-444444444444','successful',100, now() - interval '7 days',  now() - interval '6 days'),
  ('40000000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','55555555-5555-5555-5555-555555555555','successful',100, now() - interval '10 days', now() - interval '9 days'),
  ('40000000-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','66666666-6666-6666-6666-666666666666','pending',    0,   now() - interval '12 days', null),
  ('40000000-0000-0000-0000-000000000006','11111111-1111-1111-1111-111111111111','77777777-7777-7777-7777-777777777777','cancelled',  0,   now() - interval '17 days', null)
on conflict (id) do nothing;

-- Extra successful referrals by other members so the Leaderboard has more than
-- one ranked row (sampleReferralContent.ALL_TIME).
insert into public.referrals (id, referrer_id, referred_user_id, status, reward_amount, created_at, completed_at) values
  ('41000000-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222','88888888-8888-8888-8888-888888888888','successful',100, now() - interval '20 days', now() - interval '19 days'),
  ('41000000-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','99999999-9999-9999-9999-999999999999','successful',100, now() - interval '25 days', now() - interval '24 days'),
  ('41000000-0000-0000-0000-000000000003','33333333-3333-3333-3333-333333333333','66666666-6666-6666-6666-666666666666','successful',100, now() - interval '30 days', now() - interval '29 days')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 17. Premium   (SAMPLE_PREMIUM_PLANS / SAMPLE_PREMIUM_FEATURES / SAMPLE_MEMBERSHIP)
-- ---------------------------------------------------------------------------
insert into public.premium_plans (id, name, tier, monthly_price, yearly_price, yearly_discount_percent, is_popular, features, sort_order) values
  ('plan-basic', 'Basic', 'basic', 199, 1433, 40, false,
   '["Access to limited projects","5 Mock Tests / month","Basic Support"]', 1),
  ('plan-premium', 'Premium', 'premium', 499, 3593, 40, true,
   '["Access to all projects","Unlimited Mock Tests","ATS Resume Analyzer","Priority Support"]', 2),
  ('plan-premium-plus', 'Premium Plus', 'premium_plus', 999, 7193, 40, false,
   '["Everything in Premium","1-on-1 Career Guidance","Personalized Roadmap","Early Access to New Features"]', 3)
on conflict (id) do nothing;

insert into public.premium_features (id, icon, title, subtitle, sort_order) values
  ('pf-1','infinite-outline',        'Unlimited Access',           'Access all projects, notes, and resources',      1),
  ('pf-2','document-text-outline',   'Premium Mock Tests',         'Unlimited placement & aptitude tests',           2),
  ('pf-3','reader-outline',          'Resume Analyzer (ATS)',      'Advanced ATS score & suggestions',               3),
  ('pf-4','business-outline',        'Company Specific Prep',      'Get company-wise questions & tests',             4),
  ('pf-5','flash-outline',           'Priority Support',           'Faster response from our support team',          5),
  ('pf-6','ban-outline',             'Ad-Free Experience',         'Learn without any interruptions',                6),
  ('pf-7','rocket-outline',          'Early Access',               'Be the first to access new features',            7),
  ('pf-8','cloud-download-outline',  'Download & Offline Access',  'Download notes & watch videos offline',          8),
  ('pf-9','book-outline',            'Exclusive Content',          'Premium guides, e-books & more',                 9)
on conflict (id) do nothing;

insert into public.premium_subscriptions
  (id, user_id, plan_id, status, billing_cycle, price, started_at, current_period_end, payment_method, auto_renew)
values
  ('50000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','plan-premium','active','monthly',499,
   now() - interval '20 days', now() + interval '10 days', 'UPI', true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 18. Notifications + offer banners   (buildSampleNotifications / SAMPLE_OFFERS)
-- ---------------------------------------------------------------------------
insert into public.notifications (id, user_id, title, body, category, is_read, created_at) values
  ('60000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Special Offer!',    'Get 40% OFF on all Premium Projects.',            'offers',   false, now() - interval '2 hours'),
  ('60000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','New Project Added', 'E-Commerce Flutter App has been added.',          'updates',  false, now() - interval '5 hours'),
  ('60000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','Price Drop Alert',  'React Portfolio Project is now at ₹199 only!',    'offers',   true,  now() - interval '7 hours'),
  ('60000000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','New Job Match',     'Full Stack Developer at TCS',                     'updates',  true,  now() - interval '1 days'),
  ('60000000-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','Weekly Report',     'You solved 12 MCQs this week.',                   'messages', true,  now() - interval '1 days')
on conflict (id) do nothing;

insert into public.offer_banners (id, title, description, discount_label, coupon_code, is_active, sort_order) values
  ('of-1','Flat 40% OFF','On All Premium Projects','40%','PREMIUM40', true, 1),
  ('of-2','Flat 30% OFF','On New Arrivals',        '30%','NEW30',     true, 2),
  ('of-3','Flat 20% OFF','On Best Sellers',        '20%','BEST20',    true, 3)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 19. Settings for the demo user   (settingsStore defaults)
-- ---------------------------------------------------------------------------
insert into public.user_preferences (user_id, theme, accent_color, use_amoled_dark, reduce_animations, language_code, has_agreed_to_terms) values
  ('11111111-1111-1111-1111-111111111111', 'light', '#4F39F6', false, false, 'en', true)
on conflict (user_id) do nothing;

insert into public.notification_preferences (user_id) values
  ('11111111-1111-1111-1111-111111111111')
on conflict (user_id) do nothing;

-- ===========================================================================
-- 20. Display-number overrides
--     The migration triggers have by now recomputed these counters from the
--     seeded rows. Reset them to the figures shown in the mockups; the triggers
--     keep them live again from the next real insert onward.
-- ===========================================================================
update public.categories c set project_count = v.n from (values
  ('web-development',1200),('mobile-development',850),('data-science',650),('machine-learning',420),
  ('ui-ux-design',530),('devops',310),('dsa-algorithms',740),('database',380),
  ('cloud-computing',290),('cyber-security',260)
) as v(id,n) where c.id = v.id;

update public.companies co set open_jobs_count = v.n from (values
  ('google',123),('microsoft',98),('tcs',87),('infosys',74),('wipro',65),('amazon',60),
  ('deloitte',51),('accenture',45),('capgemini',32),('cognizant',40)
) as v(id,n) where co.id = v.id;

-- tr-1's headline rating/review count (sampleProjectDetail: 4.6 / 122).
update public.projects set rating = 4.6, review_count = 122 where id = 'tr-1';

-- Referral overview headline numbers (SAMPLE_REFERRAL_OVERVIEW: 25 / 1250).
update public.referral_codes
   set code = 'ROHAN21', total_referrals = 25, total_earned = 1250
 where user_id = '11111111-1111-1111-1111-111111111111';

-- ===========================================================================
-- 21. Preparation Notes (Prep -> Notes). Needs migration 0028 / admin 010.
-- ===========================================================================
insert into public.prep_notes (title, category, topic, tags, content, is_premium, is_published) values
  ('Percentages — Core Formulas & Shortcuts', 'Aptitude', 'Percentages', '{percentage,quant,shortcut}',
   E'x% of y = y% of x.\nSuccessive change a% then b% = a + b + ab/100 (%).\n1/8 = 12.5%, 1/6 ≈ 16.67%, 1/3 ≈ 33.33%.', false, true),
  ('Blood Relations — Solving Approach', 'Logical Reasoning', 'Blood Relations', '{reasoning,family-tree}',
   E'Draw a top-down family tree. + male, − female, = married. Work outward from the fixed point.', false, true),
  ('Reading Comprehension — Time Strategy', 'Verbal', 'Reading Comprehension', '{verbal,rc,strategy}',
   E'Skim for structure, read questions, scan back for exact lines. Avoid extreme-word options.', false, true),
  ('Two Pointers & Sliding Window', 'DSA', 'Arrays', '{dsa,arrays,patterns}',
   E'Sliding window: expand r, shrink l while a constraint breaks. O(n). Longest substring w/o repeats, min window substring.', false, true),
  ('Big-O Cheat Sheet', 'Coding', 'Complexity', '{complexity,interview}',
   E'Array access O(1), search O(n). HashMap avg O(1). Sorting O(n log n). BFS/DFS O(V+E).', false, true),
  ('STAR Method for HR Answers', 'HR', 'Behavioural', '{hr,star,behavioural}',
   E'Situation → Task → Action → Result. Most time on Action; always end with a measurable Result.', false, true),
  ('OOP — Interview Quick Revision', 'Technical Interview', 'OOP', '{oop,cs-fundamentals}',
   E'Encapsulation, Abstraction, Inheritance, Polymorphism. Overloading = compile-time, Overriding = run-time.', true, true),
  ('TCS NQT — Pattern & Sections', 'Company Preparation', 'TCS', '{tcs,nqt,pattern}',
   E'Numerical, Verbal, Reasoning, Programming Logic, Coding (2 Qs). Sectional cut-offs apply.', true, true),
  ('Placement Prep — 8 Week Plan', 'General Placement', 'Roadmap', '{roadmap,plan}',
   E'Wk 1-2 Quant+Reasoning. Wk 3-5 DSA + 2 problems/day. Wk 6-7 CS fundamentals. Wk 8 mocks + HR + resume.', false, true)
on conflict do nothing;

-- ===========================================================================
-- 22. Academic content targeting demo  (migration 0035 — Global/Course/Branch)
--     The demo student is B.Tech · Computer Science Engineering · Final Year.
--       * a few rows target the CSE branch  -> visible + ranked to the top
--       * a few target the B.Tech course    -> visible to all, ranked up for B.Tech
--       * two target the Pharmacy branch    -> hidden from the demo student by
--                                              the RLS branch safety net
--     Everything left untagged stays 'global' and is always shown.
--     Both the *_id and *_name columns are set (0035 seeds courses/branches).
-- ===========================================================================
update public.projects
   set target_type = 'branch',
       target_course_id = 'btech',   target_course_name = 'B.Tech',
       target_branch_id = 'btech-cse', target_branch_name = 'Computer Science Engineering',
       target_branch_ids = array['btech-cse'],
       target_branch_names = array['Computer Science Engineering']
 where id in ('pr-3', 'na-4', 'se-3');            -- AI Chat, Movie Recommendation, E-Commerce Admin Panel
update public.projects
   set target_type = 'branch',
       target_course_id = 'bpharm',  target_course_name = 'B.Pharm',
       target_branch_id = 'bpharm-pharm', target_branch_name = 'Pharmacy',
       target_branch_ids = array['bpharm-pharm'],
       target_branch_names = array['Pharmacy']
 where id = 'tr-2';                               -- Hospital Management System (off-branch → hidden for demo)

update public.jobs
   set target_type = 'course',
       target_course_id = 'btech', target_course_name = 'B.Tech'
 where id in ('job-2', 'job-6', 'job-9');         -- React / Frontend / Software Engineer
update public.jobs
   set target_type = 'branch',
       target_course_id = 'bpharm', target_course_name = 'B.Pharm',
       target_branch_id = 'bpharm-pharm', target_branch_name = 'Pharmacy',
       target_branch_ids = array['bpharm-pharm'],
       target_branch_names = array['Pharmacy']
 where id = 'job-5';                              -- Data Analyst (off-branch → hidden for demo)

update public.prep_notes
   set target_type = 'branch',
       target_course_id = 'btech', target_course_name = 'B.Tech',
       target_branch_id = 'btech-cse', target_branch_name = 'Computer Science Engineering',
       target_branch_ids = array['btech-cse'],
       target_branch_names = array['Computer Science Engineering']
 where topic in ('Arrays', 'Complexity', 'OOP');

-- ===========================================================================
-- 23. Custom Project Builder demo  (migration 0033 / admin 013)
--     Three paid requests for the demo student across the lifecycle so both
--     "My Custom Projects" (mobile) and the admin "Custom Projects" list show
--     populated. request_code is set explicitly (900-block) to stay clear of
--     the live sequence.
-- ===========================================================================
insert into public.custom_project_requests
  (id, request_code, user_id, title, objective, description, technology_preference,
   project_type, project_level, platform, custom_requirements,
   base_price, platform_charge, feature_total, estimated_total, token_amount, pricing_version,
   token_payment_status, payment_id, payment_order_id, status, created_at) values
  ('c1000000-0000-0000-0000-000000000001', 'CPR-2026-000901', '11111111-1111-1111-1111-111111111111',
   'Campus Marketplace App', 'Let students buy and sell used books and gadgets on campus.',
   'Listings with images, chat between buyer and seller, UPI payments, admin moderation.',
   'React Native + Supabase', 'personal', 'advanced', 'web_android',
   '[{"text":"Match our college brand colours"},{"text":"Weekly email digest of new listings"}]'::jsonb,
   19999, 3000, 10000, 32999, 3000, 1,
   'paid', 'pay_seed_cpr901', 'order_seed_cpr901', 'delivered', now() - interval '24 days'),
  ('c1000000-0000-0000-0000-000000000002', 'CPR-2026-000902', '11111111-1111-1111-1111-111111111111',
   'Coaching Institute CRM', 'Manage batches, attendance, fees and staff for a coaching business.',
   'Multi-role access, fee reminders, reports, dashboards.',
   'Next.js + PostgreSQL', 'business', 'standard', 'web',
   '[]'::jsonb,
   29999, 0, 6300, 36299, 6000, 1,
   'paid', 'pay_seed_cpr902', 'order_seed_cpr902', 'in_development', now() - interval '9 days'),
  ('c1000000-0000-0000-0000-000000000003', 'CPR-2026-000903', '11111111-1111-1111-1111-111111111111',
   'Final-Year Attendance System', 'Face-recognition based classroom attendance for a minor project.',
   'Basic auth, CRUD, dashboard, reports, full academic documentation package.',
   'Java + Spring Boot', 'academic', 'advanced', 'web',
   '[{"text":"Include a viva questions PDF"}]'::jsonb,
   9999, 0, 3300, 13299, 1500, 1,
   'paid', 'pay_seed_cpr903', 'order_seed_cpr903', 'new', now() - interval '2 days')
on conflict (id) do nothing;

insert into public.custom_project_request_features
  (request_id, feature_id, feature_name, feature_price, category) values
  ('c1000000-0000-0000-0000-000000000001', 'rt-live-chat', 'Live chat', 3000, 'Real-Time'),
  ('c1000000-0000-0000-0000-000000000001', 'pay-razorpay', 'Razorpay integration', 2000, 'Payments'),
  ('c1000000-0000-0000-0000-000000000001', 'media-multi-image', 'Multiple image upload', 800, 'Files & Media'),
  ('c1000000-0000-0000-0000-000000000001', 'admin-dashboard-advanced', 'Advanced admin dashboard', 3000, 'Admin'),
  ('c1000000-0000-0000-0000-000000000001', 'notif-email', 'Email notifications', 1000, 'Notifications'),
  ('c1000000-0000-0000-0000-000000000002', 'auth-multi-role', 'Multi-role authentication', 2500, 'Authentication'),
  ('c1000000-0000-0000-0000-000000000002', 'admin-reports', 'Admin reports', 2000, 'Admin'),
  ('c1000000-0000-0000-0000-000000000002', 'notif-sms', 'SMS / OTP notifications', 1500, 'Notifications'),
  ('c1000000-0000-0000-0000-000000000003', 'admin-dashboard-basic', 'Basic admin dashboard', 1500, 'Admin'),
  ('c1000000-0000-0000-0000-000000000003', 'doc-academic-package', 'Complete academic package', 2500, 'Documentation')
on conflict do nothing;

insert into public.custom_project_request_history
  (request_id, old_status, new_status, changed_by_role, note, created_at) values
  ('c1000000-0000-0000-0000-000000000001', null, 'new', 'system', 'Token paid', now() - interval '24 days'),
  ('c1000000-0000-0000-0000-000000000001', 'new', 'in_development', 'admin', 'Kickoff call done', now() - interval '20 days'),
  ('c1000000-0000-0000-0000-000000000001', 'in_development', 'testing', 'admin', null, now() - interval '9 days'),
  ('c1000000-0000-0000-0000-000000000001', 'testing', 'ready', 'admin', null, now() - interval '5 days'),
  ('c1000000-0000-0000-0000-000000000001', 'ready', 'delivered', 'admin', 'Handover complete', now() - interval '3 days'),
  ('c1000000-0000-0000-0000-000000000002', null, 'new', 'system', 'Token paid', now() - interval '9 days'),
  ('c1000000-0000-0000-0000-000000000002', 'new', 'in_development', 'admin', 'Started build', now() - interval '6 days'),
  ('c1000000-0000-0000-0000-000000000003', null, 'new', 'system', 'Token paid', now() - interval '2 days')
on conflict do nothing;

insert into public.custom_project_deliveries (id, request_id, demo_url, notes, delivered_at) values
  ('c2000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001',
   'https://demo.campusedux.app/marketplace',
   'Web + Android builds attached. Admin login is on the last slide of the docs.',
   now() - interval '3 days')
on conflict (id) do nothing;

insert into public.custom_project_delivery_assets
  (delivery_id, kind, label, storage_path, file_name, size_mb, sort_order) values
  ('c2000000-0000-0000-0000-000000000001', 'source_code', 'Source code (ZIP)',
   '11111111-1111-1111-1111-111111111111/c1000000-0000-0000-0000-000000000001/source.zip', 'source.zip', 42.6, 0),
  ('c2000000-0000-0000-0000-000000000001', 'apk', 'Android APK',
   '11111111-1111-1111-1111-111111111111/c1000000-0000-0000-0000-000000000001/app-release.apk', 'app-release.apk', 28.4, 1),
  ('c2000000-0000-0000-0000-000000000001', 'documentation', 'Project documentation (PDF)',
   '11111111-1111-1111-1111-111111111111/c1000000-0000-0000-0000-000000000001/docs.pdf', 'docs.pdf', 3.1, 2)
on conflict do nothing;

insert into public.custom_project_admin_inbox (request_id, title, body, is_read, created_at) values
  ('c1000000-0000-0000-0000-000000000003', 'New Paid Custom Project Request',
   'CPR-2026-000903 · academic/advanced · Est ₹13299 · Token ₹1500', false, now() - interval '2 days'),
  ('c1000000-0000-0000-0000-000000000002', 'New Paid Custom Project Request',
   'CPR-2026-000902 · business/standard · Est ₹36299 · Token ₹6000', true, now() - interval '9 days')
on conflict do nothing;

insert into public.custom_project_messages (request_id, sender_id, sender_role, body, created_at) values
  ('c1000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'student',
   'Can we add a fee-defaulters report to the dashboard?', now() - interval '5 days'),
  ('c1000000-0000-0000-0000-000000000002', null, 'admin',
   'Yes — it is in scope under Admin reports. We will include it in the first testing build.', now() - interval '5 days')
on conflict do nothing;

notify pgrst, 'reload schema';
