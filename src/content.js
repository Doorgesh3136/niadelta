/* =====================================================================
   NiaDelta content + page templates (CORE builder)
   All copy is verbatim from niadelta.com (scraped into ref/) or from the
   previous site (ref/original.html). Do not invent facts here.
   Exposes window.NIA_CONTENT = {nav, routes, titles, labels, scenesFallback, pages, bios, team, util}
   ===================================================================== */
(function () {
'use strict';
var IMG = window.NIA_IMG || {};
// assets.json reports 226x150 for the logos; the real files are 400x60.
var DIM = { LOGO: [400, 60], LOGOD: [400, 60] };

/* ---------- tiny template helpers ---------- */
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function img(k, alt, o) {
  o = o || {};
  var a = IMG[k];
  if (!a || !a.src) return '';
  var d = DIM[k] || [a.w, a.h];
  return '<img src="' + a.src + '" width="' + d[0] + '" height="' + d[1] + '" alt="' + esc(alt) + '"' +
    (o.cls ? ' class="' + o.cls + '"' : '') +
    (o.eager ? ' decoding="async" fetchpriority="high"' : ' loading="lazy" decoding="async"') + '>';
}
function ph(k, alt, cls, o) { return '<div class="ph gr ' + (cls || '') + '">' + img(k, alt, o) + '</div>'; }
function ic(n, cls) { return '<svg class="ic' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; }
var SQ = '<svg class="sq" viewBox="0 0 200 16" preserveAspectRatio="none" aria-hidden="true"><path d="M3 11c28-9 50 3 78-2s52-7 116 0" pathLength="1"/></svg>';
function u(w) { return '<em class="it u">' + w + SQ + '</em>'; }
function it(w) { return '<em class="it">' + w + '</em>'; }
var ARROW = '<svg class="doodle arr" viewBox="0 0 120 80" aria-hidden="true"><path d="M6 10c22 2 48 12 62 30s22 26 42 28" pathLength="1"/><path d="M96 56l14 12-17 6" pathLength="1"/></svg>';
var STAR = '<svg class="doodle star" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c.9 5.6 3.6 8.6 10 10-6.4 1.4-9.1 4.4-10 10-.9-5.6-3.6-8.6-10-10 6.4-1.4 9.1-4.4 10-10z" pathLength="1"/></svg>';
function head(eyebrow, title, lede, cls) {
  return '<header class="sh2 ' + (cls || '') + '">' + (eyebrow ? '<p class="eyebrow rv">' + eyebrow + '</p>' : '') +
    (title ? '<h2 class="rv">' + title + '</h2>' : '') + (lede ? '<p class="lede rv">' + lede + '</p>' : '') + '</header>';
}
function list(items, cls) { return '<ul class="ck ' + (cls || '') + '">' + items.map(function (x) { return '<li>' + ic('check') + '<span>' + x + '</span></li>'; }).join('') + '</ul>'; }
function acc(summary, body, o) {
  o = o || {};
  return '<details class="acc ' + (o.cls || '') + '"' + (o.open ? ' open' : '') + '><summary>' + summary +
    '<span class="acc-x" aria-hidden="true"><i></i><i></i></span></summary><div class="acc-b"><div class="acc-i">' + body + '</div></div></details>';
}
function ext(href, label, cls, cur) { return '<a class="' + (cls || 'lk') + '" href="' + esc(href) + '" target="_blank" rel="noopener"' + (cur ? ' data-cursor="' + cur + '"' : '') + '>' + label + ic('out', 'sm-ic') + '</a>'; }
function btn(href, label, cls, cur) { return '<a class="btn mag ' + (cls || '') + '" href="' + esc(href) + '"' + (/^https?:/.test(href) ? ' target="_blank" rel="noopener"' : '') + (cur ? ' data-cursor="' + cur + '"' : '') + '><span>' + label + '</span>' + ic(/^https?:/.test(href) ? 'out' : 'arrow') + '</a>'; }
function sec(id, ch, cls, inner, attrs) { return '<section class="sec ' + (cls || '') + '"' + (id ? ' id="s-' + id + '"' : '') + ' data-ch="' + ch + '"' + (attrs || '') + '>' + inner + '</section>'; }

/* ---------- navigation ---------- */
var NAV = [
  ['About us', 'about', [['Our story', 'story'], ['Mission and vision', 'mission'], ['Values', 'values'], ['2024 reflections', 'reflections'], ['The team', 'team'], ['Careers', 'careers']]],
  ['What we do', 'work', [['Core competencies', 'competencies'], ['Services', 'services'], ['Leadership development', 'leadership'], ['Organisational culture', 'culture'], ['Culture Identity Kit', 'kit']]],
  ['Say hello', 'contact']
];
var ROUTES = {
  home: 'home', hero: 'home', approach: 'home', offer: 'home', design: 'home', apart: 'home', partners: 'home', impact: 'home',
  about: 'about', story: 'about', mission: 'about', values: 'about', reflections: 'about', team: 'about', careers: 'about', blog: 'about',
  work: 'work', competencies: 'work', services: 'work', align: 'work', leadership: 'work', culture: 'work', kit: 'work',
  contact: 'contact'
};
var TITLES = { home: 'Home', about: 'Who we are', work: 'What we do', contact: 'Say hello' };
var LABELS = { home: 'Home', approach: 'Our approach', offer: 'Our services', design: 'Experience design', apart: 'What sets us apart', partners: 'Our partners', impact: 'Impact stories', blog: 'Blog', align: 'How we drive transformation' };
NAV.forEach(function (n) { LABELS[n[1]] = LABELS[n[1]] || (n[2] ? TITLES[n[1]] : n[0]); (n[2] || []).forEach(function (s) { LABELS[s[1]] = s[0]; }); });

/* ---------- scene fallbacks (static chapter list if a scene is missing) ---------- */
var SCENES_FALLBACK = {
  approach: { eyebrow: 'Our approach', title: 'Our ' + it('Approach'),
    lede: 'When it comes to leadership development and creating enabling cultures and environments, every client experiences a different problem. With every client, we find a unique solution that gives them a competitive edge.',
    chapters: [
      { at: 0, label: 'We partner in the process', text: 'We do not treat our clients as clients, but as partners. We get intentionally & heartily involved in the intricacies; we walk alongside you through the challenges you are facing & celebrate with you when the solutions are successful.' },
      { at: .25, label: 'We think outside the box', text: 'We approach our work as artists and are constantly pushing ourselves to reimagine what the possibilities could be. We provide fresh perspectives and insights and bring creativity and imagination to our work.' },
      { at: .5, label: 'We are committed to the delta', text: 'The experiences we co-create with our clients are driven by the north star of transformation and impact. We are intentional about creating experiences that optimize for the desired outcomes.' },
      { at: .75, label: 'We build transformative experiences', text: 'We believe that transformation happens best in thoughtfully crafted experiences. We have spent years mastering the art of creating spaces that are highly engaging and lead to deep human connections.' }
    ] },
  story: { eyebrow: 'Our story', title: 'How NiaDelta ' + it('began'), lede: 'One question, asked in Nigeria in 2020.',
    chapters: [
      { at: 0, label: 'January 2020', text: 'Two friends working together on a project in Nigeria, with a shared passion for organisational leadership and people development.' },
      { at: .28, label: 'The question', text: 'What would the world look like if every human being was flourishing and doing their best work?' },
      { at: .55, label: 'The hypothesis', text: 'With a simple yet audacious hypothesis—It is possible—NiaDelta was born.' },
      { at: .8, label: 'Today', text: 'We blend our design and facilitation expertise with organisational development to create purposeful, enduring culture shifts.' }
    ] },
  values: { eyebrow: 'Our values', title: 'What we hold ' + it('ourselves') + ' to', lede: 'Five values.<span class="scn-mo"> Scroll to meet them.</span>',
    chapters: [
      { at: 0, label: 'Excellence', text: 'We set a high bar for everything we do. We are thorough and strive for perfection.' },
      { at: .2, label: 'Creativity', text: 'We approach our work as artists. We think outside the box and constantly reimagine what is possible.' },
      { at: .4, label: 'Co-creation', text: 'We believe in the power of collaboration. We constantly seek opportunities to partner with others in order to learn and grow together.' },
      { at: .6, label: 'Service', text: 'We appreciate the importance of serving. We seek to provide exceptional service and experience, and we are deeply involved in our work.' },
      { at: .8, label: 'Fun and joy', text: 'We believe that doing great work can also be fun. We aim to bring fun and joy into every experience we put together.' }
    ] },
  align: { eyebrow: 'Five interconnected pillars', title: 'How We Drive ' + it('Transformation'),
    lede: 'We design and deliver integrated, human-centred solutions across five interconnected pillars, helping organisations evolve from the inside out and achieve lasting impact.',
    chapters: [
      { at: 0, label: 'Purpose Alignment', text: 'Clarify your “why” and embed it into everything you do.' },
      { at: .2, label: 'Strategy Activation', text: 'Turn strategy from a static document into an execution-ready roadmap.' },
      { at: .4, label: 'Culture Transformation', text: 'Shape a thriving workplace culture—by design, not by default.' },
      { at: .6, label: 'Leadership Transformation', text: 'Define what great leadership looks like, and grow it at every level.' },
      { at: .8, label: 'On-boarding Transformation', text: 'Connect people to purpose, culture, and clarity – from day one and every change point.' }
    ] }
};

/* Scroll-story wrapper, per SPEC contract. Uses NIA_SCENES[key] copy when present. */
function story(key, anchor, ch) {
  var S = (window.NIA_SCENES || {})[key];
  var ok = !!(S && typeof S.mount === 'function');
  var F = SCENES_FALLBACK[key];
  var c = {
    eyebrow: (S && S.eyebrow) || F.eyebrow, title: (S && S.title) || F.title, lede: (S && S.lede) || F.lede,
    chapters: (S && Array.isArray(S.chapters) && S.chapters.length) ? S.chapters : F.chapters
  };
  return '<section class="story' + (ok ? '' : ' static noscene') + '" data-scene="' + key + '" id="s-' + anchor + '" data-ch="' + ch + '">' +
    /* short phones in motion mode: the heading scrolls by before the stage pins, so the pinned
       stage gets the full screen (CSS displays only one of the two header copies at a time) */
    '<header class="wrap sh sh-pre"><p class="eyebrow">' + c.eyebrow + '</p><h2>' + c.title + '</h2><p class="lede">' + c.lede + '</p></header>' +
    '<div class="pin"><header class="wrap sh"><p class="eyebrow">' + c.eyebrow + '</p><h2>' + c.title + '</h2><p class="lede">' + c.lede + '</p></header>' +
    /* the scrubbed caption is visual only; the chapter list (.tl) carries the copy for screen readers */
    '<div class="stage scn" data-stage></div><p class="wrap cap" aria-hidden="true"></p><div class="wrap prog" aria-hidden="true"><span class="pn">01</span><span class="pt">/ ' + String(c.chapters.length).padStart(2, '0') + '</span><i class="pb"><b></b></i></div></div>' +
    '<ol class="wrap tl" data-n="' + c.chapters.length + '">' + c.chapters.map(function (x, i) { return '<li><span class="tl-n">' + String(i + 1).padStart(2, '0') + '</span><b>' + x.label + '</b><span>' + x.text + '</span></li>'; }).join('') + '</ol></section>';
}

/* ---------- people ---------- */
var FOUNDERS = [
  { name: 'Katleho Mohono', role: 'Co-Founder & Chief Executive Officer', img: 'F_KATLEHO' },
  { name: 'Veda Sunassee', role: 'Co-Founder', img: 'F_VEDA' }
];
var CORE = [
  ['Mbali Gushu', 'Director of Operations and Leadership Coach'], ['Soumaya Zaadoud', 'Organisational Culture Senior Associate'],
  ['Ataba Anyangwe', 'Learning Experience Designer Senior Associate'], ['Oba-anu Oladipupo', 'Learning Experience Designer Senior Associate'],
  ['Rudorwashe Mugabe', 'Junior Associate'], ['Xolani Nkosi', 'Junior Associate'], ['Clement Ngosong', 'Senior Analyst'],
  ['Amanda Waruima', 'Senior Analyst'], ['Timothy Yapilami Jr.', 'Senior Analyst']
];
var ADJUNCT = [
  ['Sila Ogidi', 'Adjunct Facilitator and Learning Experience Designer'], ['Julie Munyi Ogwapit', 'Adjunct Facilitator and Consultant'],
  ['Dikatso Sephoti', 'Entrepreneurial Leadership Coach & Consultant'], ['Syria Rama', 'Adjunct Facilitator and Strengths Coach'],
  ['Kiana Sosa', 'Adjunct Facilitator and Learning Experience Designer'], ['Nyambura Mwangi', 'Adjunct Facilitator and Project Manager'],
  ['Julie Muriuki', 'Adjunct Facilitator and Consultant'], ['Kahaso Mtana', 'Senior Leadership Consultant'],
  ['Demilade Oluwasina', 'Adjunct Facilitator and Consultant'], ['William Mutua', 'Adjunct Facilitator and Consultant'],
  ['Lyndon Rego', 'Senior Leadership Consultant'], ['Simon Kagwe', 'Adjunct Facilitator and Project Manager'], ['Rufaro Mudimu', 'Adjunct Facilitator']
];
var ADVISORS = [
  ['Fred Swaniker', 'CEO & Founder - African Leadership Group'], ['Dr Zukiswa Mthimunye', 'Leadership, Organizational Development & Education Consultant'],
  ['Khurram Masood', 'Chief Product Officer at Sharpist'], ['Penny Handscomb', 'Sr Advisor to the AL Group & Executive in Residence'],
  ['Steve Boehlke', 'Founder & President - SFB Associates']
];
/* Extended bios (ref/bios.json, cleaned: headers removed, Xolane->Xolani, Warima->Waruima) */
var BIOS={"veda-sunassee":["Veda Sunassee has spent a decade in several roles with the African Leadership (AL) Group, first as an Entrepreneurial Leadership Faculty at the African Leadership Academy before later serving as the Founding Dean of the African Leadership University (ALU), Rwanda for 2 years.","Veda is a facilitator, emcee and moderator and has worked with the likes of the Allan Gray Orbis Foundation, ELMA Philanthropies and Facebook.","Veda is a graduate of Princeton University and was selected among the inaugural Obama Leaders in 2018.","Veda recently re-joined ALU as its Executive Director."],
"katleho-mohono":["Katleho Mohono is a leadership development facilitator, coach and consultant with a passion for youth development and unlocking human potential. He has close to 10 years of experience in student leadership development, corporate education, organizational leadership and coaching. He holds a Bachelor of Arts degree in Organizational Psychology and Human Resource Management from the University of the Witwatersrand.","Katleho is a founding member of the African Leadership University. Katleho was part of the pioneering team of ALX in Nairobi, Kenya, where he served as the Community Manager/Lead of ALX.","Katleho co-founded NiaDelta, and sits on the board of the Leadership Forum, a global leadership community."],
"mbali-gushu":["Mbali believes in supporting others to reach their full potential and achieve immense success. Mbali empowers individuals, teams, and organisations to conquer their challenges and redefine the boundaries of achievement. Throughout her 10-year professional journey, Mbali has honed her skills in social entrepreneurship, consistently delivering exceptional results and driving impactful change in various roles in start-up organisations. Mbali has coached senior leadership and teams for over six years to achieve scalable results through self-mastery.","Mbali holds a BSc in Economics from Columbia University, an Advanced Certificate in Leadership and Management from the London School of Business Administration and is trained by the University of Cape Town in Executive & Management Coaching. As a Founder and coach, Mbali comprehensively understands leadership, management, influential organisational development trends, and best practices. Mbali is seasoned to equip leaders with the knowledge and confidence to navigate complex landscapes and seize unprecedented opportunities. Mbali is the Founder of multiple businesses including her Executive Coaching Firm, Pilily and a flower and gift shop in Johannesburg, South Africa."],
"soumaya-zaadoud":["Soumaya Zaadoud is a dedicated professional with extensive experience in People Operations. She excels in creating efficient systems and fostering a positive organizational culture, consistently driving success through strategic talent management and employee engagement.","Prior to her role at NiaDelta, Soumaya served as the Talent Practice Leader at Procter & Gamble, where she was instrumental in developing and implementing talent strategies that aligned with the company's objectives. Her leadership in this role helped to cultivate a high-performing workforce and foster a culture of continuous improvement.","Soumaya's journey in people operations began at Cornell University, where she worked as an Assistant in the Office of the Dean of Students. During her time at Cornell, she supported various initiatives aimed at improving student life and contributed to the overall efficiency of the Dean's office.","She holds a Bachelor's degree from Cornell University, where she developed a strong academic foundation and honed her skills in organizational management and interpersonal communication.","Soumaya's diverse experience and dedication to excellence make her a valuable asset to any organization she is a part of. She continues to drive positive change and inspire those around her with her passion for people operations."],
"ataba-anyangwe":["Ataba is a dedicated Learning Experience Designer with a strong passion for youth development and fostering leadership across the African continent. He is committed to creating transformative learning experiences that drive meaningful change and empower individuals. He holds a distinguished academic background, having graduated from the African Leadership University (ALU) and Glasgow Caledonian University, Scotland.","Ataba's commitment to driving positive change through impactful learning experiences is evident in his work at NiaDelta, where he plays a pivotal role in the Learning Experience Design (LED) team. His expertise in creativity and systemic thinking allows him to design bespoke and impact-driven solutions tailored to the unique needs of our partners.","With extensive experience in creating and curating learning experiences for a wide range of audiences, Ataba has successfully collaborated with both governmental bodies and corporate organizations across Africa. His innovative approach and strategic vision have consistently delivered transformative educational programs, empowering individuals and institutions alike to achieve their full potential."],
"rudorwashe-mugabe":["Rudorwashe Mugabe, a dedicated professional, holds an Honours degree in Business Management from the African Leadership University. Currently serving as an Analyst at NiaDelta, she plays a pivotal role in delivering transformational experiences to partners, providing crucial project management support and conducting comprehensive data analysis and reporting.","With a keen entrepreneurial spirit, Rudorwashe founded Nguva and Nako Virtual Assistants, an agency dedicated to supporting C-Suite Executives with seamless administration, including scheduling and email management. Her commitment to organisational efficiency extends to her past role as the Administrative Manager for Trusts Motion, a mental health organisation committed to connecting individuals with essential mental health services.","Passionate about the circular economy and environmental sustainability, Rudorwashe brings a holistic perspective to her work, aligning seamlessly with the commitment to purposeful change. Beyond her professional endeavours, she channels her energy into supporting individuals on their journey to becoming the best versions of themselves, reflecting her dedication to personal and professional growth.","Rudorwashe embodies the essence of a streamlined professional, contributing to both the success of organisations and the development of individuals with unwavering passion and expertise."],
"xolani-nkosi":["Xolani Nkosi is a BA(Hons) graduate from the African Leadership University. He studied International Business and Trade. While in school, he earned the Nelson Mandela Centennial Scholarship and served on the academic council. Xolani is passionate about data analytics, economics, and education. He has experience in various sectors, including financial services, development, health, FMCG, and education."],
"clement-ngosong":["A dynamic and motivated young professional dedicated to making a positive impact through his analytical skills and problem-solving acumen.","As an integral part of the Youth Development Team, Clement brings his passion for driving change to the forefront. His primary responsibilities involve conducting comprehensive market and product research, performing competitor analysis, and offering valuable support in the development of impactful strategies.","In addition to his role with the Youth Development Team, Clement lends his analytical expertise to the Monitoring and Evaluation Team. Through diligent research and analysis, he assists in providing valuable insights that contribute to the continuous improvement of organizational processes.","Clement's commitment to impact-focused organizations, coupled with his proactive approach and diverse skill set, makes him an invaluable asset to the team. His contributions not only enhance the effectiveness of ongoing programs but also play a crucial role in shaping the future strategies and initiatives of the organization."],
"amanda-waruima":["Amanda is a dedicated professional with a Bachelor of Science (Honours) in Biochemistry from the University of Pretoria. Currently serving as an Analyst at NiaDelta, she excels in integrating her scientific background with effective team leadership.","Passionate about project management, Amanda plays a crucial role in supporting the leadership team, particularly the CEO and Director of Operation, by ensuring smooth operations and facilitating communication across departments. Known for her meticulous and proactive approach to challenges, she consistently exceeds project expectations.","Outside of work, Amanda enjoys staying updated with industry trends and actively contributes to community initiatives promoting education and development."],
"sila-ogidi":["Sila Ogidi graduated from Bryn Mawr College in 2015 with a BA in English Language and Literature. Since then, she has worked at the African Leadership University in various roles and currently serves as a cross-campus Learning Experience Designer. Sila’s professional experience spans marketing, teaching, leadership and professional development, instructional and program, and learning ecosystems design.","Sila is passionate about creating transformative learning experiences that act as enablers for self- actualization and liberation from oppressive systems."],
"julie-munyi-ogwapit":["Julie is currently the Principal Consultant at JMO Impact consultants.","Her 15 years of multi-sector corporate leadership experience span learning & development, SME advisory & business development, import-export logistics, operations management and event production.","Julie has been involved in project management, learning experience design, curriculum development and facilitation for multiple youth, managerial and leadership development programs including the USAID Young African Leaders Initiative (YALI) Regional Leadership Center for East Africa where she spent 4 years working with 800+ young Africans from 14 countries as Lead Facilitator; at Lehigh University - Iacocca Institute where she was a Mandela Washington Fellow and later Academic Director for entrepreneurial summer programs; and at ALX (part of the Africa Leadership Group) as Global Lead for Management Programs.","Julie holds a B.A International Business Administration & Marketing from United States International University - Africa"],
"dikatso-sephoti":["Dikatso Sephoti is an Entrepreneurial Leadership Coach and Consultant. She served with the African Leadership Group for two years under the Entrepreneurial Leadership Faculty in Mauritius and later under the International Business and Trade Faculty in Rwanda. Dikatso is completing her Masters of Management degree in Entrepreneurship and New Venture Creation at Wits Business School and holds a Bachelor of Commerce degree in Economics and Marketing from the University of the Witwatersrand.","Dikatso is an experienced facilitator and has worked with other institutions such as the Allan Gray Orbis Foundation, EU: Africa, Cyril Ramaphosa Foundation, Nelson Mandela Foundation, SA Innovation Summit as well as the Annual Investments Meeting Summit in Dubai and Abu Dhabi."],
"kiana-sosa":["Kiana is a social impact professional who is passionate about supporting the growth and development of others. Kiana holds a Bachelor’s Degree in Africana Studies from Hamilton College and a Master’s Degree in Pedagogy from New York University. She enjoys cultivating spaces for critical thinking, professional development, and artistic expression. As a Posse Foundation Leadership Scholar Alumna, Kiana takes pride in dedicating her career to higher education and leadership development."],
"nyambura-mwangi":["Nyambura is a multi- skilled experiential Facilitator and a learning designer with a broad International working experience in non-profit-making organizations spanning over ten years both in urban and rural Kenya, Uganda, Tanzania, Rwanda and the U.S.A (TN). She is a well-seasoned management consultant with over 10 years’ multicultural experience as a consultant in corporate team building, experiential education (E.E), adventure trips and outdoor camping. She is passionate about building thriving communities within her networks.","In recent times, she has trained well over 40 organizations and over 3,500 individuals in Systems thinking, Leadership, Teamwork, Cohesion and customer service, in a span of 10 years in Nairobi and around the Country. Some of the Institutions she trained include: Cooperative bank, Standard Chartered Bank, Family group, CFC Group, N.I.C. Bank, Equity bank, A.P.A Insurance, Jubilee Insurance, C.I.C Group, U.A.P Old Mutual, NCBA bank, Mayfair bank among others. (2011-date). Her most recent and impactful work is with Imaginable futures on systems thinking for six months, focused on the power of communities and uncovering the patterns that allow for these systems to thrive.","Besides training experiences, Nyambura is equipped in curriculum design and has designed and implemented the onboarding curriculum for three full cohorts of 60 entrepreneurs for the African Young Entrepreneur Support Program, designed and facilitated a leadership cohort of 120 young leaders within the Africa Leadership space, designed a one year leadership curriculum for Pace international all of which were grounded on experiential training.","Nyambura is passionate about creating innovative spaces that will drive learning with a key focus on Leadership, Education, people and culture. On a normal day, you will constantly find her curating unique experiences, both virtually and in-person that will drive Impactful learning outcomes."],
"julie-muriuki":["Julie Muriuki is passionate about entrepreneurship, curriculum design and facilitation, and advocating for inclusive opportunities for women and youth in Africa. Over the last ten years, she has facilitated international cross-cultural and education institutes for startups, public and private sector institutions across Africa, and worked alongside communities to understand their needs and create practical and sustainable solutions through training and development services.","Julie obtained her Masters Degree in Public Administration with a Concentration in International Public Service & Development, and her Bachelor of Social Sciences Degree in Government and Politics from the United States of America."],
"kahaso-mtana":["Kahaso Mtana is an experienced leadership facilitator and master trainer with a passion for unlocking the full potential of talent. He’s currently the Regional Lead for East Africa at The ROOM and previously run the African Leadership (ALX) Xcelerator program in Nairobi.","He is a certified master trainer and enterprise counsellor with the International Labor Organisation (ILO) under various technical assistance programs supporting SME development through workplace cooperation interventions. Kahaso is a graduate of Finance and Business Administration (Dual Honors) from Keele University, Staffordshire, England and is currently completing his EMBA with Quantic School of Business and Technology. He has 15+years’ experience working within the private and social sectors across the African continent and in the United Kingdom and previously run his own training consultancy company in East Africa."],
"demilade-oluwasina":["Demilade is an educator, entrepreneur and coach. He serves as Faculty for International Business & Trade and Entrepreneurship at the African Leadership University. He is also the Lead for the ALU-Alibaba Global E-Commerce Talent Programme. Prior to this, he was involved in designing and teaching the Entrepreneurial Leadership Course at ALU and before that, a Programme Manager at The Bridge Program, a youth development and capacity building organization.","He started IMW Creative enterprise, a design, media and publishing company which he ran before transitioning into the Education space. He is also Founder of Amplyfy Works, a Digital, Business Strategy and Marketing Agency based in Kigali, Rwanda. He is a Learning Designer, a Corporate Trainer who has written/spoken on a wide variety of platforms like ITM Africa, UNCTAD, eTrade for Women, UPEX. He holds a Digital Business Transformation Management Certificate from CXO Transform, is a certified Global E-Commerce Talent Trainer with the Alibaba Business School and a certified BUILD Entrepreneurial Leadership Educator."],
"william-mutua":["William Mutua has been involved in training, coaching, and consulting for more than 8 years around profit, productivity, and the performance of people. Prior to starting his own businesses, he worked as a lecturer and consultant in the education sector. He is a trained facilitator and coach in the field of Human Change and is also a trainer in coaching and delivery, Business Writing & Customer Service, Leadership Within, Power Packed Presentation Skills & Public Speaking and Applying Emotional Excellence at Workplace, to name a few. He was formerly the Head of Department at Matric Institute of Professional Studies where he was in charge of business and community development studies. William holds an MBA in Entrepreneurship and a B.A. in Integrated Community Development and currently pursuing his PhD in Entrepreneurship"],
"lyndon-rego":["Lyndon Rego focuses at the nexus of leadership, innovation and transformation. He has worked across Asia, the Americas, Europe, and Africa on individual, organization, and community efforts. A present-day focus is nurturing inclusive innovation ecosystems to foster sustained economic and social outcomes. Lyndon is the founding head of the Center for Entrepreneurial Leadership at the African Leadership University. This Center is focused on shaping an integrated approach to leadership and entrepreneurial development that encompasses all stakeholders -- from students to staff to executive education participants.","Prior to ALU, Lyndon spent nearly 15 years at the Center for Creative Leadership (CCL), the world’s oldest, largest and foremost institution singularly dedicated to leadership development. He played a number of innovation, management, and faculty roles at the institution, and launched the Innovation Incubator, the global Leadership Beyond Boundaries initiative, and the Future Leadership Lab focused on organizational transformation. Lyndon has an M.B.A and, an M.A. in Communication. He writes and speaks internationally on issues at the intersection of organizational transformation, social innovation, complexity, and leadership. His work has been recognized with awards from North and South America, Africa, and Asia."],
"simon-kagwe":["Simon's life's mission is to be a positive change agent through engaging, developing, and connecting people from all walks of life.","He has been fortunate enough to live a true leadership experience with notable examples like President of AIESEC in Kenya, ALX Launchpad Lead with African Leadership Group (ALG), and Co-founder and Managing Director of You and I. Simon has received several awards including an Associate Fellowship Award of the Royal Commonwealth Society (RCS) and the United Nations Global School Ambassador of Sustainable Development Solutions Network (SDSN).","He is a life-long learner and believes that great leaders read. He did pursue and graduate with a Bachelor of Commerce at the University of Nairobi, a Certified Public Accountant (CPAK) from Strathmore University. He is an Associate Member of the Institute of Certified Public Accountants of Kenya. Simon has a Masters in Business Administration (MBA) from the African Leadership University School of Business (ALUSB).","He is very passionate about leadership and community development and the Sustainable Development Goals (SDGs) by the United Nations particularly SDG 4,8 and 17. He is a firm believer in service leadership and that leadership is about character, integrity, and positive influence. The world is counting on 'You and I\" to make a difference. Simon is a Youth, Education, and Leadership (E+L) expert and constantly engages in Youth events, forums, conferences, and summits as a speaker, chair, moderator, or facilitator. He is also a coach, mentor, and role model to many young leaders and has authored a book on Youth Developed called Youth on a Mission. He is big on family, loves children, adventure, traveling, board games, movies, and making new connections.","He is also currently serving at the African Leadership University (ALU), School of Business, MBA program, as a Subject Matter Expert in the Leadership Course where he is developing Virtuous, Value-driven and Visionary Leaders for the African Century. He formerly worked at The Room by African Leadership International (ALI) as a Pathfinder for Young Professionals."],
"rufaro-mudimu":["Rufaro is a social impact strategist and leadership development specialist with over 17 years’ experience designing and facilitating transformative programmes. A Yale World Fellow and Obama Foundation Leaders: Africa alumna, she has worked with diverse audiences — from youth leaders to executives — to build skills, foster collaboration, and unlock potential.","Her career spans senior leadership roles, including nearly a decade as CEO of enke: Make Your Mark (an award-winning South African youth leadership development organisation), and advisory work with networks such as the Youth Development Collaboration Lab South Africa. In her consulting work, she partners with organisations to strengthen strategy, leadership capacity, and operational effectiveness. Rufaro brings a dynamic, participatory approach to facilitation, drawing on expertise in strategy development, leadership training, and cross-sector engagement to create environments where people can connect, learn, and thrive."],
"fred-swaniker":["Fred Swaniker is on a mission to bring better leadership to Africa and the world. He is the founder and CEO of the African Leadership Group – an ecosystem of organizations that are catalyzing a new era of ethical, entrepreneurial African leaders. Over the past 15 years, he has founded and led the pre-university African Leadership Academy, the African Leadership University, the African Leadership Network and ALX — a next-generation leadership development and talent sourcing platform. Collectively, these endeavours aim to transform Africa by developing 3 million African leaders by 2035. He is also the founder of The Room, a talent agency for the world’s ambitious doers.","Fred previously worked as a McKinsey consultant before earning an MBA from Stanford and becoming an entrepreneur. He is an Echoing Green Fellow; Aspen Institute Fellow; and most recently, was recognized as one of TIME Magazine’s most influential people of 2019. He holds honorary doctorate degrees from Macalester College, Middlebury College and Nelson Mandela University."],
"dr-zukiswa-mthimunye":["Dr. Mthimunye is a leadership, organizational development and education consultant working across the private, for-benefit, and public education sectors. Her work is informed by a fundamental belief that leaders must be developed and prepared for the specific places, people, systems, and competitive environments within which they lead to fully thrive, and transform society- essentially, contextual leadership.","As a facilitator and consultant, she enables executive teams in diverse areas including personal leadership; growing sustainable innovative cultures (telecommunications; financial services); developing and leading inclusive cultures (healthcare; transport); and change management in the era of digitization (financial services; independent schools). She also consults to international corporate foundations on education and youth development, including program design (curriculum design), program delivery, MnE and impact analysis.","She holds a Doctor of Education (Ed.D.) from Columbia University; Master of Science (MSc.) in International Business from the University of London; a Postgraduate Diploma in Business Administration (PDBA) from the Gordon Institute of Business Science (GIBS); and a Bachelor of Arts degree (B.A) in Industrial Psychology from the University of the Witwatersrand"],
"khurram-masood":["Khurram is currently the Chief Product Officer at Sharpist, a mobile-first digital learning and development ecosystem with a vision to bring personalised learning for every employee everywhere.","Over the last 6 years, Khurram Co-founded African Leadership University (life-long and corporate learning) across Rwanda, Kenya, Mauritius and South Africa with a total of over 2,000 students and 250 employees. As COO and Head of College, Khurram led operations, product development, technology, sales and marketing and talent and culture for ALU and ALX.","Before ALU, Khurram was an Associate Partner at McKinsey & Company where he led 17 transformation projects in Telecom, Banking, Healthcare and Education across 12 countries in the Middle East, South East Asia, Africa and Europe.","Khurram holds a Masters from Stanford University, USA in MS&E with a focus on Operations Research, Design Thinking, Decision Analysis and Entrepreneurship."],
"penny-handscomb":["Penny Handscomb has lived and worked in the UK, US, Canada, Israel, and Africa, and has spent a significant amount of time in a variety of emerging markets. She has helped build businesses as well as support organizations as they have scaled and managed change.","Penny spent over 5 years working for a social impact Venture Capital organization, Omidyar Network, where she was a partner of the firm and the leader of the Human Capital practice. She advised another investment firm focused on entrepreneurs in emerging markets, was on the board for one of Africa’s fastest growing Edtech organizations, and spent most of her career working in entrepreneurial environments across various industries from technology, ecommerce, gaming, e-fashion, telecommunications to many non-profits in the open data space to independent media, education, microfinance and think tanks.","Penny graduated from both University of Waterloo, and Wilfrid Laurier University in Waterloo Canada, has her Senior Professional (SPHR) and Certified Human Relations (CHRP) designations in the Human Resource field. She worked as adjunct faculty in California for four years and is a Certified Professional Coach through the Hudson Institute of Santa Barbara, where she also received her Master Coach Certificate, and is a PCC credentialed coach through the ICF."],
"steve-boehlke":["A master facilitator of leadership learning, Steve Boehlke has more than 30 years experience developing leaders globally. For the past ten years he has served as Sr. Advisor to the African Leadership Group, supporting the various organizations and leaders affiliated with ALG. His work in the non-profit sector in recent years has included private independent schools, philanthropic foundations, and local charities.","As founder and president of SFB Associates, Steve managed a diverse group of consultants to optimize leadership effectiveness in multinational corporations. His corporate clients have included senior executives at Cargill, ExxonMobil, General Mills, HP, Medtronic, Merck & Co, and Nestlé among others. He is the author of 50 Lessons on Leading for Those with Little Time for Reading. Steve is committed to equipping the next generation of leaders to serve globally by asking the difficult questions by which excellent leadership grows and develops."]};

var PEOPLE = {};
function person(name, role, imgKey) {
  var s = slug(name);
  var p = { id: s, name: name, role: role, img: imgKey || ('T_' + s), bio: BIOS[s] || null };
  PEOPLE[s] = p; return p;
}
FOUNDERS = FOUNDERS.map(function (f) { return person(f.name, f.role, f.img); });
CORE = CORE.map(function (x) { return person(x[0], x[1]); });
ADJUNCT = ADJUNCT.map(function (x) { return person(x[0], x[1]); });
ADVISORS = ADVISORS.map(function (x) { return person(x[0], x[1]); });

function personCard(p, cls) {
  var hasImg = IMG[p.img];
  var pic = hasImg ? ph(p.img, 'Portrait of ' + p.name, 'pp') : '<div class="ph pp ini" aria-hidden="true"><span>' + p.name.split(' ').map(function (w) { return w[0]; }).slice(0, 2).join('') + '</span></div>';
  var inner = pic + '<span class="pc-t"><b class="pc-n">' + p.name + '</b><span class="pc-r">' + p.role + '</span></span>' + (p.bio ? '<span class="pc-o" aria-hidden="true">' + ic('plus') + '</span>' : '');
  return p.bio ? '<button type="button" class="pc ' + (cls || '') + ' rv" data-bio="' + p.id + '" data-cursor="Read" aria-haspopup="dialog">' + inner + '<span class="vh"> &ndash; read extended bio</span></button>'
    : '<div class="pc ' + (cls || '') + ' nobio rv">' + inner + '</div>';
}

/* ---------- testimonials ---------- */
var TESTI_HOME = [
  { who: 'Liz Berry Gips', role: 'Executive Director', org: 'Kigutu International Academy', c: 'var(--gold)',
    lead: '“Working with NiaDelta has been an outstanding experience. They have provided outstanding assistance with curriculum and leadership development.”', more: '' },
  { who: 'Suzanne Hunter', role: 'Director, Scholar Search and Selection', org: 'African Leadership Academy', c: 'var(--coral)',
    lead: '“The African Leadership Academy engaged NiaDelta to design virtual sessions for a group of young people from around the world that we selected for a leadership development program.',
    more: '<p>I remember early in the process the team explaining that they ‘craft experiences’ and that is a spot-on way of describing their work. They have an uncanny ability to build a community using thought-provoking, engaging experientials, while challenging the participants to think critically about issues facing the world.</p><p>Heading into the program, one of our biggest goals was to build a community amongst the participants. After six virtual sessions, the 40 participants (who spanned 24 countries from Peru to Singapore and have never met in person) felt like a community. They had made lifelong friends and that is a result of the thoughtful, careful planning from the NiaDelta Team.</p><p>Working with NiaDelta is an absolute joy, as you are working with people who are deeply passionate about the work they are doing—and the passion comes through in all that they do.”</p>' },
  { who: 'Laura Kaub', role: 'ExCo Member and 2018-19 Chair', org: 'HALI Network', c: 'var(--teal)',
    lead: '“NiaDelta helped the HALI Access Network design and deliver a highly engaging and effective virtual conference - an online version of our annual ‘Indaba’ - that left everyone feeling energized, re-engaged, and re-connected to each other and to our work.',
    more: '<p>Their team met regularly with ours to ensure that they understood our needs and community, and kept well on top of the project’s needs and timeline. They provided clever and innovative ways for us to deliver content and really connect with each other despite the screens and brought such energy and enthusiasm to the project that even the planning process was fun.</p><p>NiaDelta’s facilitation was top-notch and made our extremely diverse membership feel seen, understood, and engaged. With everything from multilingual greetings and pan-African music during social times to thoughtful stewardship of our crucial conversations in a way that demonstrated a real depth of understanding and commitment to supporting HALI’s work, NiaDelta’s team made our first-ever virtual gathering a powerful one.”</p>' }
];
var Q_ELIE = '“I reached out to NiaDelta because we were at an intersection where we were asking our “Why” and developing a 5-year vision for the company. We really wanted to double down on our purpose as a team and then map that into what the next 5 years look like. I’d like to make this an ongoing thing—to have future engagements to ensure our team stays motivated and focused on the impact we can have in this market.”';
var TESTI_ODC = [
  { who: 'Elie Habimana', role: 'Managing Director East Africa', org: 'Norrsken House Kigali', q: Q_ELIE },
  { who: 'Steve Cumming', role: 'Director of Strategy and Planning', org: 'MEDA', q: '“It’s almost as if you get a management consulting firm to help with the strategy, and then you get NiaDelta to help with the culture—matching the culture to the strategy and helping us through a change and transformation process; really at that intersection of strategy and culture. It’s a great team and it’s been a super positive experience.”' },
  { who: 'Irene Gitau', role: 'People and Culture', org: 'Mastercard Foundation', q: '“NiaDelta’s programmes transformed our approach to team dynamics and hiring. The Team Management Profile has been a crucial tool and is somewhat a prerequisite in our team coaching.”' },
  { who: 'Tarik Ward', role: 'Director, Global Strategic Operations', org: 'ELMA Philanthropies', q: '“NiaDelta expertly provided the time and space we needed to step back, reconnect, and re-energize — essential when you’re deeply committed to mission-driven work.”' }
];
function who(t) { return '<figcaption class="who"><b>' + t.who + '</b><span>' + t.role + ' &middot; ' + t.org + '</span></figcaption>'; }

var PARTNERS = ['ALU School of Wildlife Conservation', 'African Leadership Academy', 'ALU School of Business', 'ELMA Philanthropies', 'filamujani', 'Morehead-Cain', 'Kigutu International Academy', 'Rwanda National Police', 'Gavi', 'Chatham House', 'The Afara Initiative', 'APA Insurance', 'BAOBAB', 'HALI Access Network', 'YouthConnekt Africa', 'THE ROOM', 'FirstWave Group', 'Teach For Kenya', 'Fingo Africa'];

var BLOG = [
  ['2026-03-27', '27 March 2026', 'Five Lessons from Five Years of NiaDelta'],
  ['2026-03-24', '24 March 2026', 'Beyond the Break: Why Retreats Are Strategic Moments, Not Just a Luxury'],
  ['2026-03-09', '9 March 2026', 'Democratising Coaching: A Space for Every Person to Thrive'],
  ['2026-02-09', '9 February 2026', 'The Grief We Don’t Name'],
  ['2025-06-30', '30 June 2025', 'Connection Before Content: A Simple Habit to Transform Your Teams'],
  ['2025-02-20', '20 February 2025', 'Leadership is Evolving—Are You?'],
  ['2025-02-19', '19 February 2025', 'The Hidden Crisis in Workplaces Today and How Leaders Can Fix It'],
  ['2019-03-25', '25 March 2019', 'Developing Inclusive Leadership Skills: The Key to Thriving Teams and Organizations']
];

/* ---------- shared blocks ---------- */
var OK_TRAIL = 'M12 100C30 92 48 78 62 62S88 32 84 22 64 16 64 32 84 50 108 36 150 6 203 31';
function okArt(k) { return '<svg class="okart draw" viewBox="0 0 260 170" aria-hidden="true">' +
  '<path class="d1" d="M20 140c40-4 80 3 120-1s70-3 100 1" pathLength="1"/>' +
  '<g class="ok-sun"><path class="d2 fillg" d="M101 120a29 29 0 0 1 58 0" pathLength="1"/>' +
  '<path class="d3" d="M130 78v-12M104 88l-8-8M156 88l8-8M92 112H80M168 112h12" pathLength="1"/></g>' +
  '<path class="d4" d="M62 140L130 34l68 106" pathLength="1"/>' +
  '<path class="d5" d="M96 140c10-6 22-14 34-14s24 8 34 14M110 140c6-3 13-6 20-6s14 3 20 6" pathLength="1"/>' +
  /* looping dotted flight trail: the dots show through a solid mask stroke that is drawn on once */
  '<mask id="okm-' + k + '" maskUnits="userSpaceOnUse" x="0" y="0" width="260" height="170"><path class="okm" d="' + OK_TRAIL + '" pathLength="1"/></mask>' +
  '<path class="ok-tr" d="' + OK_TRAIL + '" mask="url(#okm-' + k + ')"/>' +
  /* hand-drawn paper plane that glides in and settles at the end of the trail */
  '<g class="ok-plane"><path class="pl-a" d="M203 31L251 11 224 34z"/><path class="pl-b" d="M224 34L251 11 231 45z"/><path class="pl-c" d="M224 34L220 44 231 45"/></g>' +
  '</svg>'; }

function fld(id, label, type, o) {
  o = o || {};
  var tag = type === 'textarea' ? '<textarea id="' + id + '" name="' + o.name + '" rows="4" placeholder=" "' + (o.req ? ' required' : '') + ' aria-describedby="' + id + '-e"></textarea>'
    : '<input id="' + id + '" name="' + o.name + '" type="' + type + '" placeholder=" "' + (o.req ? ' required' : '') + (o.ac ? ' autocomplete="' + o.ac + '"' : '') + (type === 'email' ? ' inputmode="email" autocapitalize="off" spellcheck="false"' : '') + ' aria-describedby="' + id + '-e">';
  return '<div class="fld' + (type === 'textarea' ? ' ta' : '') + '"><div class="fc">' + tag + '<label for="' + id + '">' + label + (o.req ? '' : ' <span class="opt">(optional)</span>') + '</label><i class="ink" aria-hidden="true"></i></div><span class="er" id="' + id + '-e"></span></div>';
}
function contactForm() {
  return '<form class="fm rv" id="fm" data-form="contact" novalidate>' +
    '<div class="fm-g">' + fld('f-name', 'Name', 'text', { name: 'name', req: 1, ac: 'name' }) + fld('f-email', 'Email', 'email', { name: 'email', req: 1, ac: 'email' }) + '</div>' +
    fld('f-org', 'Organisation', 'text', { name: 'organisation', ac: 'organization' }) +
    fld('f-msg', 'Message', 'textarea', { name: 'message', req: 1 }) +
    '<div class="fm-a"><button class="btn mag" type="submit"><span>Send message</span>' + ic('arrow') + '</button></div></form>' +
    '<div class="ok" id="ok" role="status" tabindex="-1" hidden>' + okArt('c') + '<h3>Thank <em class="it">you</em>.</h3><p>We will be in touch soon.</p><p class="ok-m"></p></div>';
}
function newsForm() {
  return '<form class="nl" data-form="news" novalidate><h2 class="ft-h">Stay in the loop</h2><p>Stay ahead in leadership excellence. Subscribe to our newsletter for expert insights, practical strategies, and the latest trends in leadership development and capacity-building.</p>' +
    '<div class="nl-r">' + fld('n-email-' + Math.random().toString(36).slice(2, 7), 'Email', 'email', { name: 'email', req: 1, ac: 'email' }) +
    '<button class="btn g mag" type="submit"><span>Subscribe Now</span></button></div></form>' +
    '<div class="ok nl-ok" role="status" tabindex="-1" hidden>' + okArt('n') + '<h3>Thank <em class="it">you</em>.</h3><p>We will be in touch soon.</p><p class="ok-m"></p></div>';
}
function contactLinks(C, cls) {
  var o = [];
  if (C.email) o.push('<a class="cl-a" href="mailto:' + esc(C.email) + '" data-cursor="Write">' + ic('mail') + '<span>' + esc(C.email) + '</span></a>');
  if (C.phone) o.push('<a class="cl-a" href="tel:' + esc(C.phone.replace(/[^+\d]/g, '')) + '">' + ic('chat') + '<span>' + esc(C.phone) + '</span></a>');
  if (C.whatsapp) o.push('<a class="cl-a" href="https://wa.me/' + esc(C.whatsapp.replace(/\D/g, '')) + '" target="_blank" rel="noopener">' + ic('chat') + '<span>WhatsApp</span></a>');
  if (C.linkedin) o.push('<a class="cl-a" href="' + esc(C.linkedin) + '" target="_blank" rel="noopener" data-cursor="Visit">' + ic('in') + '<span>LinkedIn</span></a>');
  return o.length ? '<div class="cl ' + (cls || '') + '">' + o.join('') + '</div>' : '';
}
function footer(C) {
  var q = [['Who we are', '#about'], ['Our team', '#team'], ['Careers', '#careers']];
  // rendered inside #app for the page swap; role restores the contentinfo landmark
  return '<footer class="ft" role="contentinfo"><div class="wrap ft-g">' +
    '<div class="ft-a"><a class="ft-logo" href="#home" aria-label="NiaDelta home">' + img('LOGO', 'NiaDelta') + '</a>' +
    '<p class="ft-m">Nia is Swahili for ' + it('purpose') + '. Delta is Greek for change.</p><p class="ft-s">Our mission is simple: to enable human flourishing in every organisation.</p></div>' +
    '<nav class="ft-n" aria-label="Quick links"><h2 class="ft-h">Quick links</h2><ul>' + q.map(function (x) { return '<li><a href="' + x[1] + '">' + x[0] + '</a></li>'; }).join('') +
    (C.blog ? '<li><a href="' + esc(C.blog) + '" target="_blank" rel="noopener">Blog ' + ic('out', 'sm-ic') + '</a></li>' : '') + '<li><a href="#contact">Say hello</a></li></ul></nav>' +
    '<div class="ft-e"><h2 class="ft-h">Engage with us</h2>' + contactLinks({ email: C.email, linkedin: C.linkedin, phone: C.phone, whatsapp: C.whatsapp }, 'ft-cl') + '</div>' +
    '<div class="ft-nl">' + newsForm() + '</div>' +
    '</div><div class="wrap ft-b"><span>&copy; NiaDelta</span><a href="#home" class="ft-top">Back to top ' + ic('arrow', 'up') + '</a></div>' +
    '<div class="ft-word" aria-hidden="true"><span>Nia</span>' + ic('delta') + '<span>Delta</span></div></footer>';
}

/* =====================================================================
   PAGES  (ctx = {C: CONTACT})
   ===================================================================== */
function hero() {
  var rays = '';
  for (var i = 0; i < 24; i++) rays += '<path d="M0 -' + (i % 2 ? 136 : 132) + 'V-' + (i % 2 ? 152 : 176) + '" transform="rotate(' + (i * 15) + ')"/>';
  return '<section class="hero" id="s-hero" data-ch="Welcome">' +
    '<div class="wrap hg"><div class="hcopy">' +
    '<p class="eyebrow hi">Your partner in purposeful transformative experiences</p>' +
    /* verbatim tagline ("purposeful shifts"); the accent word gets a one-shot hand-drawn underline after the intro */
    '<h1 class="hh" data-split>We help organisations make ' + u('purposeful') + ' shifts.</h1>' +
    '<p class="lede hi">NiaDelta is a Leadership and Organizational Culture Change Consulting firm that designs and facilitates corporate leadership development programs for rising leaders and executives around the world.</p>' +
    '<div class="cta hi">' + btn('#contact', 'Talk to us', '') + '<a class="lk" href="#story">Read our story</a>' + ARROW + '</div>' +
    '</div>' +
    '<figure class="harch">' +
    '<div class="hsun hl" data-d="26" aria-hidden="true"><svg viewBox="-220 -220 440 440"><circle r="210" fill="url(#g-glow)"/><g class="hrays">' + rays + '</g><circle class="hsun-c" r="118"/></svg></div>' +
    '<div class="hsh" aria-hidden="true"></div>' +
    '<div class="ph gr hph">' + img('E_TEAM', 'The NiaDelta team celebrating together on a staircase in branded navy t-shirts', { eager: 1 }) + '</div>' +
    '<span class="fl hl f1" data-d="-18" aria-hidden="true"><span class="flb">' + ic('book') + '</span></span><span class="fl hl f2" data-d="22" aria-hidden="true"><span class="flb">' + ic('pencil') + '</span></span>' +
    '<span class="fl hl f3" data-d="-12" aria-hidden="true"><span class="flb">' + ic('sprout') + '</span></span><span class="fl hl f4" data-d="16" aria-hidden="true"><span class="flb">' + ic('spark') + '</span></span>' +
    '<figcaption class="stk hi"><b>Nia</b> Swahili for purpose<br><b>Delta</b> Greek for change</figcaption>' +
    '</figure></div>' +
    '<svg class="birds hl" data-d="34" viewBox="0 0 120 40" aria-hidden="true"><path d="M4 18q8-9 15 0q7-9 15 0M60 8q6-7 12 0q6-7 12 0M92 30q5-5 10 0q5-5 10 0"/></svg>' +
    '<div class="hills" aria-hidden="true"><svg viewBox="0 0 1440 240" preserveAspectRatio="none">' +
    '<g class="hl" data-d="10"><path class="hh1" d="M-40 260V96C120 52 260 40 420 78S700 150 900 112 1220 30 1480 64V260Z"/></g>' +
    '<g class="hl" data-d="6"><path class="hh2" d="M-40 260V150C160 104 360 98 560 136S920 196 1120 150 1340 112 1480 124V260Z"/></g>' +
    '<g class="hl" data-d="3"><path class="hh3" d="M-40 260V196C220 168 440 164 680 188S1080 226 1260 200 1420 184 1480 188V260Z"/></g>' +
    '</svg></div></section>';
}

function home(ctx) {
  var C = ctx.C;
  var svc = [
    ['heart', 'Coaching, Leadership Development & Purpose Alignment', 'Sustainable performance is built on leaders and teams who are clear, aligned, and intentional in how they show up. We combine coaching, leadership development, and purpose alignment to strengthen capability, deepen self-awareness, and connect daily work to a shared sense of meaning. The result is leaders who lead with clarity and teams that contribute with purpose and ownership.', '#leadership', 't1'],
    ['mount', 'Retreats & Convenings', 'In fast-moving organisations, alignment does not happen by default. It requires intentional space to pause, reflect, and reconnect. We design and facilitate retreats and convenings that bring teams together around what matters most, creating the conditions for honest dialogue, shared understanding, and clear direction. The result is stronger relationships, sharper priorities, and teams that move forward with focus and cohesion.', '#services', 't2'],
    ['door', 'Onboarding', 'Onboarding is more than a process. It shapes how people connect, contribute, and grow within your organisation. We design onboarding experiences that go beyond orientation, helping new joiners build meaningful relationships, understand their role in the bigger mission & vision, and align with your culture from the start. This creates a strong foundation for early engagement, faster contribution, and long-term performance.', '#services', 't3'],
    ['search', 'Culture Assessments', 'You cannot transform what you do not understand. Our culture assessments provide a clear, practical view of how your culture is experienced day to day. We help organisations uncover the behaviours and dynamics shaping performance, identify gaps between values and reality, and focus on the levers that matter most. This creates a strong foundation for targeted, meaningful culture change.', '#culture', 't4']
  ];
  var apart = [
    ['We employ tried-and-tested best practices', 'With over 30 years of combined experience in the industry, we have developed a dynamic tried-and-tested 5-step framework to diagnose and design solutions to develop leaders and build healthy cultures. Our programs have been rated an average of 4.5/5 by over 550 participants across several venues, such as classrooms, boardrooms, and virtual platforms.'],
    ['We are client-centred', 'We appreciate the fact that you know your business better than anyone else, so our first step is to listen and deeply understand your needs. We also ensure that all our experiences are user-centred and focus on ensuring that every participant is fully engaged.'],
    ['We incorporate global benchmark approaches in our designs', 'The experiences we co-create with our clients are built on the foundations of the latest research by world-class thought leaders in the fields of leadership and organisational culture to ensure long-lasting impact.'],
    ['We build engaging transformational experiences', 'We believe that experiential learning is the best way to transfer skills and ensure transformative learning and thus our learning experiences are built on that premise.'],
    ['We are artists', 'We approach our work as artists, constantly innovating and bringing new ideas and perspectives to the work that we do.']
  ];
  var stats = [['5', '', 'different continents in the world where our programs have been used'], ['30', '+', 'years of combined experience in the industry'], ['4.5', '/5', 'average rating by over 550 participants'], ['2000', '+', 'hours of classroom and workshop sessions']];
  var row = function (cls) { return '<div class="mq-r ' + cls + '"><div class="mq-t">' + PARTNERS.concat(PARTNERS).map(function (n, i) { return '<span class="mq-i' + (i % 3 === 1 ? ' it' : '') + '"' + (i >= PARTNERS.length ? ' aria-hidden="true"' : '') + '>' + n + '</span>' + ic('star', 'mq-s'); }).join('') + '</div></div>'; };
  return hero() +
    story('approach', 'approach', 'Our approach') +
    sec('offer', 'Our services', 'offer', '<div class="wrap">' +
      '<div class="split-h">' + head('What we do', 'Our ' + u('services'), 'While our clients’ needs are always unique, our services are focused on the following key areas:') + '</div>' +
      '<div class="svc">' + svc.map(function (s, i) {
        return '<a class="card svc-c ' + s[4] + ' rv" href="' + s[3] + '" data-tilt data-cursor="Explore"><span class="card-n">0' + (i + 1) + '</span>' + ic(s[0], 'card-i') + '<h3>' + s[1] + '</h3><p>' + s[2] + '</p><b class="card-l">Explore ' + ic('arrow') + '</b></a>';
      }).join('') + '</div></div>') +
    sec('design', 'Experience design', 'xd', '<div class="wrap xd-g">' +
      '<div class="xd-v rv"><div class="blob-w">' + ph('E_WORKSHOP', 'Workshop participants applauding around a table', 'bl1') + '<svg class="bo" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true"><use href="#bp1"/></svg></div>' +
      '<p class="stk xd-s">In-person, hybrid and virtual forums</p>' + STAR + '</div>' +
      '<div class="xd-t">' + head('Experience design', 'We are all about Experience ' + u('Design'), '') +
      '<p class="rv">All our services are built on a foundation of world-class Experience Design practices that have been proven to be effective for in-person, hybrid and virtual forums. We design transformative experiences that are unique to each organization’s objectives and needs.</p>' +
      '<p class="rv"><a class="lk" href="#competencies">Learn more</a></p></div></div>') +
    sec('apart', 'What sets us apart', 'apart', '<div class="wrap">' +
      head('Why NiaDelta', 'What sets us ' + u('apart') + '?', '') +
      '<div class="stats rv">' + stats.map(function (s) { return '<div class="st"><b class="st-n"><span data-count="' + s[0] + '">' + s[0] + '</span><small>' + s[1] + '</small></b><span class="st-l">' + s[2] + '</span></div>'; }).join('') + '</div>' +
      '<ol class="num">' + apart.map(function (a, i) { return '<li class="num-i rv"><span class="num-n" aria-hidden="true">0' + (i + 1) + '</span><div><h3>' + a[0] + '</h3><p>' + a[1] + '</p></div></li>'; }).join('') + '</ol></div>') +
    sec('partners', 'Our partners', 'partners', '<div class="wrap">' + head('Trusted by', 'Our ' + u('Partners'), 'Here are some of the brands that we have worked with') + '</div>' +
      '<div class="mq" aria-hidden="true">' + row('a') + row('b') + '</div>' +
      '<ul class="vh">' + PARTNERS.map(function (n) { return '<li>' + n + '</li>'; }).join('') + '</ul>') +
    sec('impact', 'Impact stories', 'impact', '<div class="wrap">' + head('In their words', 'Our impact ' + u('stories'), '') +
      '<div class="tq-g">' + TESTI_HOME.map(function (t, i) {
        return '<figure class="tq rv" style="--c:' + t.c + '" data-tilt><span class="tq-m" aria-hidden="true">“</span><blockquote><p>' + t.lead + '</p>' +
          (t.more ? acc('<span class="tq-rm">Read the full story</span>', t.more, { cls: 'tq-more' }) : '') + '</blockquote>' + who(t) + '</figure>';
      }).join('') + '</div></div>') +
    sec('cta', 'Say hello', 'cta', '<div class="wrap"><div class="band rv">' + ph('SIL', 'People silhouetted on a headland at sunset', 'band-ph') +
      '<div class="band-t"><h2>Tell us the shift you are working ' + it('toward') + '.</h2><div class="cta">' + btn('#contact', 'Talk to us', 'g') +
      '<a class="lk lk-l" href="#competencies">Want to learn more about our approach?</a></div></div></div></div>') +
    footer(C);
}

function about(ctx) {
  var C = ctx.C;
  var grid = function (arr, cls) { return '<div class="' + cls + '">' + arr.map(function (p) { return personCard(p, cls === 'tg' ? '' : 'sm'); }).join('') + '</div>'; };
  return '<section class="ph2" id="s-intro" data-ch="Who we are"><div class="wrap">' +
    '<p class="eyebrow hi">Who we are</p><h1 class="hh" data-split>Get to ' + it('know') + ' us</h1>' +
    '<div class="ph2-g"><p class="lede hi">As our name connotes, we at Nia (Swahili-purpose) Delta (Greek-change), are driven by our vision to help organizations make purposeful shifts by creating transformational and impactful experiences.</p>' +
    '<p class="hi">We exist to create environments where individuals and teams are able to develop their fullest potential. With clients ranging from global foundations, international schools, and government entities, we are a rapidly growing leader in the leadership development, education and culture spaces. In this fast-shifting world, the key to a successful organisation lies in its teams and organisational culture.</p></div>' +
    '<div class="lbx hi">' + ph('MEET', 'Colleagues in conversation on a bench', 'wide', { eager: 1 }) +
    '<dl class="dict"><div><dt>Nia</dt><dd><i>Swahili</i> purpose</dd></div><div><dt>Delta</dt><dd><i>Greek</i> change</dd></div></dl></div>' +
    '</div></section>' +
    story('story', 'story', 'Our story') +
    sec('origin', 'Our story', 'origin', '<div class="wrap og">' +
      '<div class="og-q"><span class="stk og-s rv">January 2020</span><blockquote class="bq rv">What would the world look like if every human being was ' + u('flourishing') + ' and doing their best work?</blockquote></div>' +
      '<div class="og-t prose">' +
      '<p class="rv">Inspired by this vision, the founding team (initially designers and facilitators) built a leadership and organisational culture change consulting firm that was set to design and facilitate corporate culture and leadership development programmes for rising leaders and executives around the world.</p>' +
      '<p class="rv">Our mission is simple: to enable human flourishing in every organisation. We believe when people thrive, organisations excel, revenue grows, and positive impact multiplies. Flourishing is not just a nice-to-have; it is a critical enabler for organisations to make a positive difference in the world.</p>' +
      '<p class="rv">NiaDelta’s story is about more than just a company; it is about a vision for a world where organisations are spaces where people flourish and are able to discover, develop and unleash their fullest potential. We are committed to making this vision a reality, one purposeful shift and one transformative experience at a time.</p>' +
      '</div></div>') +
    sec('mission', 'Mission and vision', 'mv tint', '<div class="wrap">' + head('Vision and Mission Statements', '', '', 'only-eb') +
      '<div class="mv-g"><article class="mv-c rv"><div class="disc d1">' + img('VIS', 'A hand holding a glowing sun inside a triangle') + '</div><div><h2>Our ' + it('vision') + '</h2><p class="lede">Our Vision is to help organizations make purposeful shifts by creating transformational and impactful experiences.</p></div></article>' +
      '<article class="mv-c alt rv"><div class="disc d2">' + img('MIS', 'An astronaut inside a triangle') + '</div><div><h2>Our ' + it('mission') + '</h2><p class="lede">Our Mission is to create environments where individuals and teams are able to develop their fullest potential</p></div></article></div></div>') +
    story('values', 'values', 'Values') +
    sec('reflections', '2024 reflections', 'refl', '<div class="wrap refl-g">' +
      '<div>' + head('2024 reflections', 'See what we were up to in ' + u('2024'), 'Thank you for being part of our journey!') + '</div>' +
      '<a class="vid rv" href="' + esc(C.video) + '" target="_blank" rel="noopener" data-cursor="Play" aria-label="Watch the 2024 reflections video on YouTube (opens in a new tab)">' + ph('APP', 'The NiaDelta team applauding', 'vid-ph') + '<span class="vid-b" aria-hidden="true">' + ic('play') + '</span><span class="vid-t" aria-hidden="true">Watch on YouTube</span></a></div>') +
    sec('team', 'The team', 'team tint', '<div class="wrap">' +
      head('The team', 'Meet Our ' + u('Team'), 'With over 3 decades of collective experience, NiaDelta blends leadership and organisational culture expertise to build bold leaders and healthy cultures. With over 2000 hours of classroom and workshop sessions under our belt, our superpower lies in diagnosing leadership and culture-related problems and then designing and facilitating transformative experiences to address those issues.') +
      '<h3 class="tg-h rv">The Founders</h3><div class="fd">' + FOUNDERS.map(function (p) { return personCard(p, 'big'); }).join('') +
      '<p class="fd-q rv">Whether you’re an organisation seeking to transform your business by unleashing the leadership potential of your people and building a powerful culture, or you’re a leader who finds yourself trying to navigate tectonic shifts, we partner with you to hit your business objectives.</p></div>' +
      '<h3 class="tg-h rv">The Core Team</h3>' + grid(CORE, 'tg') +
      '<h3 class="tg-h rv">Adjunct Facilitators and Learning Experience Designers</h3>' + grid(ADJUNCT, 'tg2') +
      '<h3 class="tg-h rv">The Strategic Advisors</h3>' + grid(ADVISORS, 'tg2') + '</div>') +
    sec('careers', 'Careers', 'careers', '<div class="wrap car-g">' +
      '<div>' + head('Careers', 'Join our ' + u('team'), 'We are a team of dynamic and entrepreneurial individuals who are passionate about Africa, education and leadership development.') +
      '<p class="rv">We have an inclusive work culture and are a values-based community. Professional growth and development are guaranteed through exciting and challenging projects, coupled with frequent coaching and mentoring from the senior leaders of the organization.</p></div>' +
      '<article class="rr rv" data-tilt><p class="eyebrow">Open Positions</p><h3>Rockstar Radar</h3><p>Rockstar radar is our spontaneous application to work with NiaDelta. We’re always on the lookout for outstanding skills and talent, which are not necessarily advertised on our website. Are you the rock star we’ve been missing and haven’t realised yet? Then this might be your opportunity.</p>' +
      '<p>The ideal candidate should be comfortable in a fast-paced, multitasking, startup environment and should display creative and analytical problem-solving skills with an unrelenting passion for excellence.</p>' +
      '<p><b>How to apply</b> We welcome applications all year round.</p><p class="rr-d"><b>Deadline</b> Ongoing</p>' + ext('https://www.niadelta.com/rockstar-radar', 'Learn More', 'btn mag') + '</article></div>') +
    sec('blog', 'Blog', 'blog', '<div class="wrap">' + head('From the blog', 'Latest ' + u('writing'), '') +
      '<ol class="bl">' + BLOG.map(function (b) { return '<li class="rv"><a href="' + esc(C.blog) + '" target="_blank" rel="noopener" data-cursor="Read"><time datetime="' + b[0] + '">' + b[1] + '</time><span class="bl-t">' + b[2] + '</span>' + ic('out') + '</a></li>'; }).join('') + '</ol>' +
      '<p class="rv bl-more">' + ext(C.blog, 'Visit the blog', 'lk') + '</p></div>') +
    footer(C);
}

function work(ctx) {
  var C = ctx.C;
  var comp = [
    ['pencil', 'Learning Experience Design', 'FLOE model', 'We excel in creating transformative learning experiences that are engaging, impactful, and aligned with the culture and strategic goals of our clients, based on our unique FLOE model and design process.', 'Our solutions are designed to be effective across in-person, hybrid, and virtual forums, fostering long-term culture shifts within organisations.'],
    ['users', 'Learning Experience Facilitation/<wbr>Delivery', 'ELE-VATE framework', 'We pride ourselves on our ability to convene teams, functions, and organisations around a shared purpose in an elevated and immersive manner, using our ELE-VATE framework.', 'Our facilitation style is praised for its authenticity and ability to foster meaningful conversations, enabling participants to connect deeply with the content and each other.'],
    ['tree', 'Organisational Development and Culture', 'Culture strategy', 'We partner with our clients to align their organisational practices with their strategic goals, ensuring that their culture supports and enhances their overall mission and vision.', 'Our approach integrates culture strategy, leadership development, and systemic interventions to create cohesive, adaptive, and high-performing workplaces.']
  ];
  var services = [
    ['mount', 'Retreats & Convenings', 'In fast-moving organisations, alignment does not happen by default. It requires intentional space.', ['Our retreats and convenings are designed as strategic moments where teams step out of the day-to-day to reconnect, reflect, and realign around what matters most. Grounded in our Connect–Reflect–Align framework, we create experiences that surface what is true, strengthen relationships, and translate insight into clear, shared direction.', 'Whether you are navigating a strategic shift, leadership transition, or need to renew team cohesion, we design and facilitate retreats that go beyond conversation. They build clarity, strengthen culture, and accelerate execution long after the room has closed.', 'Our solutions are designed to be effective across in-person, hybrid, and virtual forums, fostering long-term culture shifts within organisations.']],
    ['door', 'Onboarding', 'Onboarding is not a moment. It is the foundation of how people show up, contribute, and grow.', ['We design onboarding experiences that move beyond information sharing to true cultural integration. Our approach ensures that new joiners do not just understand their roles, but also connect to purpose, build meaningful relationships, and see how their work contributes to the bigger picture from the start.', 'Through immersive, experiential design, we help organisations turn onboarding into a strategic lever for engagement, alignment, and long-term performance. The result is teams that feel connected earlier, contribute faster, and carry a shared sense of ownership from day one.']],
    ['search', 'Culture Assessments', 'You cannot transform what you do not understand.', ['Our culture assessments provide organisations with a clear, practical view of how culture is experienced day to day. We go beyond surface-level diagnostics to uncover the behaviours, norms, and dynamics that shape how work actually happens.', 'By combining data with insight, we help you identify gaps between intention and reality, and pinpoint the levers that matter most for change. This creates a strong foundation for targeted, meaningful culture transformation that is grounded in evidence, not assumption.']],
    ['heart', 'Coaching, Leadership Development & Purpose Alignment', 'Sustainable performance is built on leaders who are clear, intentional, and aligned.', ['We work with leaders and teams to deepen self-awareness, strengthen leadership capability, and anchor their work in purpose. Through coaching, leadership development experiences, and purpose alignment interventions, we create space for reflection, challenge, and growth.', 'Our approach supports leaders to think more clearly, lead more effectively, and create environments where others can contribute and thrive. At the same time, we help teams align around a shared sense of purpose, ensuring that strategy is not just understood, but lived through daily behaviours and decisions.']]
  ];
  var gains = [
    ['Stronger Team Alignment', 'Leaders cultivate a shared vision, ensuring every team member understands their role in achieving business goals, leading to increased synergy and efficiency.'],
    ['Increased Productivity & Engagement', 'Employees thrive under empowered leadership, feeling motivated, valued, and connected to their work, which drives greater commitment and higher performance.'],
    ['Improved Decision-Making', 'Leaders gain the ability to assess situations strategically, weigh risks effectively, and make confident, data-driven decisions that align with organizational objectives.'],
    ['Sustainable Growth & Innovation', 'Organizations that develop leadership talent from within create a culture of adaptability, innovation, and resilience, ensuring long-term success and a competitive edge.']
  ];
  var scale = [['S', 'Sustainable', 'Built for long-term impact, not one-off events.'], ['C', 'Creative', 'Designed to challenge thinking and unlock new possibilities.'], ['A', 'Adaptive', 'Tailored to context, ready to evolve as needs shift.'], ['L', 'Learning-Driven', 'Grounded in practice, reflection, and real growth.'], ['E', 'Engaging', 'Human-centered, immersive, and built for active participation.']];
  var progs = [
    ['Leadership Blueprint: Emerging Leaders Accelerator', ['For high-potential professionals, first-time managers, and experts stepping into leadership roles with confidence and key skills.', 'Strengthens leadership agility, decision-making, and strategic thinking through real-world challenges and collaboration.', 'Combines live sessions, on-demand content, simulations, and applied projects for lasting impact.']],
    ['The Resilience Blueprint: Mastering Change and Agility', ['For leaders and teams building resilience, emotional agility, and focus in high-pressure, uncertain environments.', 'Explores stress management, emotional intelligence, and mindset shifts to sustain performance.', 'Includes self-assessments, guided reflection, and real-world resilience techniques for immediate application.']],
    ['The Collaboration Blueprint: Building High Performing Teams', ['For team leaders and managers fostering high-performing, trust-based teams through shared ownership.', 'Covers collaborative leadership models, accountability frameworks, and inclusive decision-making techniques.', 'Uses role-playing, team alignment exercises, and practical tools to enhance engagement and group dynamics.']],
    ['The NexGen Blueprint: Future-Ready Fellowship', ['For young professionals stepping into their first roles and building confidence, collaboration, and workplace acumen.', 'Explores foundational leadership principles, professional communication, and career navigation to accelerate growth.', 'Includes hands-on exercises, peer learning, and personalized feedback to help participants apply leadership concepts in real-world scenarios.']],
    ['The Facilitation Blueprint: Mastering Engagement and Influence', ['For leaders, trainers, and facilitators designing and leading high-impact discussions and meetings.', 'Covers facilitation techniques, structured dialogue, and managing group dynamics in critical conversations.', 'Features hands-on practice, expert feedback, and a toolkit for delivering engaging, results-driven sessions.']],
    ['The Strategy Blueprint: High Impact Leadership and Innovation', ['For mid-to-senior leaders refining strategic thinking, decision-making, and adaptability in complex environments.', 'Develops systems thinking, scenario planning, and high-stakes problem-solving to drive organizational success.', 'Features expert-led simulations, real-time challenges, and applied frameworks for immediate leadership impact.']]
  ];
  var tiers = [
    ['Open Cohort', ['<b>Flexible Enrollment:</b> Join rolling courses for personal leadership growth.', '<b>Leader Community:</b> Build networks and support systems with peers.', '<b>Lifetime Access:</b> Access ongoing resources to fuel your leadership journey.']],
    ['Standard', ['Pre-designed solutions using generic case studies and exercises applicable across industries.', 'Delivered virtually or in-person, covering key frameworks, theories and concepts.', 'Includes a post-training toolkit for ongoing application but no follow-up coaching.']],
    ['Premium', ['Training activities incorporate your specific challenges and real-world scenarios to deepen learning.', 'Includes a post-workshop facilitated discussion to help teams apply insights immediately.', 'Participants gain access to resilience-building resources and follow-up exercises for sustained impact.']],
    ['Enterprise', ['Bespoke trainings based on a detailed assessment of organizational needs and leadership gaps.', 'Role-specific modules & personalized leadership development plans for each participant.', 'Includes ongoing coaching sessions and tailored action plans for long-term leadership impact.']]
  ];
  var pillars = [
    ['heart', 'Purpose Alignment', 'Clarify your “why” and embed it into everything you do.', 'Purpose is more than a statement. It’s your organisation’s heartbeat. We help you uncover, articulate, and embed your unique reason for being, transforming purpose into a shared compass that drives strategy and culture.', ['Purpose audit, discovery, and articulation labs', 'Organisational storytelling and narrative development', 'Purpose alignment workshops for teams and individuals', 'Purpose embedding tools and coaching frameworks']],
    ['compass', 'Strategy Activation', 'Turn strategy from a static document into an execution-ready roadmap.', 'A great strategy is only as good as your team’s ability to align and execute. We support you in co-creating or refining strategy, aligning it with purpose, and ensuring teams can execute with clarity, rhythm, and accountability.', ['Strategy co-creation and alignment workshops', 'Theory of Change and strategic pillars design', 'Strategy cascading and operational planning', 'Execution rhythms, scorecards & reviews', 'Strengths-based and executive coaching']],
    ['tree', 'Culture Transformation', 'Shape a thriving workplace culture—by design, not by default.', 'We help you intentionally design culture using our Culture Tree Assessment and SHINE Framework. From diagnosing to embedding, we create cultures that align with your purpose and ambitions—turning culture into a strategic enabler, not a barrier.', ['Culture assessment and archetype mapping', 'Culture visioning and identity design', 'Values-to-behaviours translation', 'Culture Book and behavioural competency framework development', 'Culture implementation roadmaps & rituals toolkit', 'Immersive retreats and team-building experiences', 'Change management and culture reset or integration post-change', 'Coaching for leaders as culture carriers']],
    ['users', 'Leadership Transformation', 'Define what great leadership looks like, and grow it at every level.', 'We go beyond training to build leadership clarity and accountability at every level. Together, we define great leadership for your organisation and design systems, experiences, and coaching to grow leaders from within.', ['Leadership profile and framework development', '360° leadership reviews and feedback', 'Leadership development and alignment labs', 'Accountability systems and scorecards', 'Strengths-based and executive coaching']],
    ['door', 'On-boarding Transformation', 'Connect people to purpose, culture, and clarity – from day one and every change point.', 'We design immersive, transformative experiences that help people connect deeply to your organisation, whether they are new hires or long-serving staff navigating change. Our frameworks create meaningful moments that accelerate belonging, clarity, and contribution.', ['Purpose and culture-driven onboarding journeys', 'Re-onboarding experiences post-restructure or transformation', 'Manager-led onboarding playbooks', 'Employee experience mapping across key touchpoints']]
  ];
  var problems = [['Scaling Challenges', 'Misalignment and inefficiencies as teams grow.'], ['Talent Retention Issues', 'Culture is a top driver of employee engagement and loyalty.'], ['Leadership Misalignment', 'Lack of a unified vision weakens decision-making and trust.'], ['Lost Opportunities', 'Investors, customers, and top talent are drawn to organisations with strong, authentic cultures.']];
  var pkgs = [
    ['The Culture Essentials Package', 'For founders & leaders who need a clear culture foundation from Day 1.', 'Your fastest path to defining and integrating your core culture into daily operations.', '', ['<b>Culture Identity Workshop</b> – Clarify your company’s vision, mission, values & behaviours.', '<b>Strategic Culture Guide</b> – Practical strategies to embed culture into daily operations.'], 'Ideal for startups and small teams looking to build a strong culture foundation that scales with growth.'],
    ['The Culture Blueprint Package', 'For growing companies ready to document & scale their culture.', 'A structured way to define and communicate your company’s DNA.', 'Includes Everything in The Culture Essentials, PLUS:', ['<b>Culture Book</b> – A professionally designed artefact of your culture to align employees, attract top talent, and ensure culture consistency as you scale.'], 'Perfect for leaders who want to solidify their culture as a competitive advantage.'],
    ['The Culture Compass Package', 'For companies looking to measure and refine their culture with data-driven insights.', 'Understand what’s working, what’s not, and how to bridge the gaps.', 'Includes Everything in The Culture Blueprint, PLUS:', ['<b>Culture Audit</b> – Surveys, focus groups & leadership interviews to assess your current culture.', '<b>Culture Audit Report</b> – Identifies strengths, gaps & actionable steps for transformation.'], 'For HR leaders and executives who want to align company culture with business strategy.'],
    ['The Culture Amplifier Enterprise Package', 'For fast-scaling and enterprise organisations embedding culture for long-term success.', 'Ensure your culture is a driver of performance, innovation, and retention.', 'Includes Everything in The Culture Compass, PLUS:', ['<b>Communication Strategy</b> – Amplify your culture through messaging.', '<b>Coaching & Advisory</b> – 3-12 months of hands-on guidance.', '<b>Impact & ROI Measurement</b> – Track the business impact of a strong culture.'], 'For CEOs, founders & HR leaders who see culture as a key driver of business success.']
  ];
  var toc = [['competencies', 'Core competencies'], ['services', 'Core services'], ['leadership', 'Leadership development'], ['culture', 'Organisational culture'], ['kit', 'Culture Identity Kit']];
  var bpRings = '<svg class="bp" viewBox="0 0 320 320" role="img" aria-label="The Blueprint: mission at the heart, expanding outward to leading ourselves, developing others, transforming systems and executing strategy for impact">' +
    '<circle class="bp4" cx="160" cy="160" r="150"/><circle class="bp3" cx="160" cy="160" r="118"/><circle class="bp2" cx="160" cy="160" r="86"/><circle class="bp1" cx="160" cy="160" r="54"/><circle class="bp0" cx="160" cy="160" r="26"/>' +
    '<g class="bp-l"><path d="M160 160L160 8" pathLength="1"/></g></svg>' +
    '<ul class="bp-k"><li><i style="--c:var(--coral)"></i>Mission</li><li><i style="--c:var(--gold)"></i>Lead ourselves</li><li><i style="--c:var(--peach)"></i>Develop others</li><li><i style="--c:var(--teal)"></i>Transform systems</li><li><i style="--c:var(--ink)"></i>Execute strategy for impact</li></ul>';
  return '<section class="ph2" id="s-what" data-ch="What we do"><div class="wrap ph2-w">' +
    '<div><p class="eyebrow hi">What we do</p><h1 class="hh sm-h" data-split>We believe in a world where everyone is ' + it('flourishing') + ' and fulfilled in the work they do.</h1>' +
    '</div>' +
    '<nav class="toc hi" aria-label="On this page"><p class="eyebrow">On this page</p><ol>' + toc.map(function (t, i) { return '<li><a href="#' + t[0] + '"><span>0' + (i + 1) + '</span>' + t[1] + ic('arrow') + '</a></li>'; }).join('') + '</ol></nav>' +
    '</div></section>' +
    sec('competencies', 'Core competencies', 'comp', '<div class="wrap">' + head('What we do', 'Our Core ' + u('Competencies'), '') +
      '<div class="cg">' + comp.map(function (c, i) { return '<article class="card cc c' + i + ' rv" data-tilt>' + ic(c[0], 'card-i') + '<span class="tag-b">' + c[2] + '</span><h3>' + c[1] + '</h3><p>' + c[3] + '</p><p>' + c[4] + '</p></article>'; }).join('') + '</div></div>') +
    sec('services', 'Core services', 'svcs tint', '<div class="wrap sv-g"><div class="sv-h">' + head('What we do', 'Core ' + u('Services'), '') +
      '<div class="lbx sv-ph rv">' + ph('E_WORKSHOP', 'Workshop participants applauding at a table', 'tall') + '</div></div>' +
      '<div class="accs">' + services.map(function (s, i) { return acc('<span class="acc-n">0' + (i + 1) + '</span><span class="acc-h">' + ic(s[0]) + '<span><b>' + s[1] + '</b><span class="acc-s">' + s[2] + '</span></span></span>', s[3].map(function (p) { return '<p>' + p + '</p>'; }).join(''), { cls: 'rv' }); }).join('') + '</div></div>') +
    /* ---- Leadership development ---- */
    sec('leadership', 'Leadership development', 'lead', '<div class="wrap">' +
      head('Leadership development', 'Lead with Clarity, Purpose and ' + u('Confidence') + '.', '') +
      '<div class="ldp"><h3 class="rv">Most leadership programmes fall short—not because people aren’t learning, but because what they’re learning doesn’t stick.</h3>' +
      '<div class="prose"><p class="rv">Too often, leadership development is disconnected from the realities leaders face day to day. It’s overly theoretical, one-size-fits-all, and short-lived. What’s missing is a deeper, more integrated approach that builds the habits, mindsets, and shared practices needed to lead well over time.</p>' +
      '<p class="rv">At NiaDelta, we design leadership solutions that are practical, personalised, and embedded in the real work of leadership. Our programmes are anchored in each organisation’s context and culture, with built-in reinforcement and reflection to drive lasting change. We don’t just build capability, we grow the kind of leadership that transforms people, teams, and systems.</p></div></div>' +
      '<p class="eyebrow rv sub-eb">What Organizations Gain from Investing in the Right Leadership Development</p>' +
      '<div class="gains">' + gains.map(function (g, i) { return '<article class="gain rv"><span class="gain-n">0' + (i + 1) + '</span><h4>' + g[0] + '</h4><p>' + g[1] + '</p></article>'; }).join('') + '</div>' +
      '<div class="bpw"><div class="bp-v rv">' + bpRings + '</div><div class="prose"><h3 class="rv">Our Leadership Development ' + it('Blueprint') + '</h3>' +
      '<p class="rv">Leadership development is not a one-size-fits-all approach. It requires a holistic approach that recognizes both the personal and collective nature of leading.</p>' +
      '<p class="rv">At the heart of leadership is mission, a clear purpose that guides every decision, action, and interaction. From this foundation, leadership expands outward, shaping how we lead ourselves, develop others, transform systems, and execute strategy for impact.</p>' +
      '<p class="rv">This Blueprint serves as a guide to help leaders develop themselves, empower others, transform organizations, and execute strategy for real impact.</p></div></div>' +
      '<div class="scale"><div class="scale-h"><h3 class="rv">Bringing Leadership to ' + it('Life') + '.</h3><p class="rv">Leadership needs the right environment to take root, evolve, and thrive. That’s where SCALE comes in. It’s our design approach for translating the Blueprint into practical, high-impact learning experiences. Every experience, programme, and journey we create is shaped by these five principles:</p></div>' +
      '<ol class="sc-l">' + scale.map(function (s) { return '<li class="rv"><b class="sc-x" aria-hidden="true">' + s[0] + '</b><span><b>' + s[1] + '</b>' + s[2] + '</span></li>'; }).join('') + '</ol></div>' +
      '<div class="progs"><div class="progs-h"><p class="eyebrow rv">Programmes</p><h3 class="rv">Our ' + it('programmes') + '</h3></div><div class="accs">' +
      progs.map(function (p, i) { return acc('<span class="acc-n">0' + (i + 1) + '</span><span class="acc-h"><span><b>' + p[0] + '</b></span></span>', list(p[1]), { cls: 'rv' }); }).join('') + '</div></div>' +
      '<div class="tiers-w"><h3 class="rv">Tiers of ' + it('Engagement') + '</h3><p class="rv tiers-i">We offer four levels of engagement to fit your individual, team or organization’s needs, from ready-to-go solutions to fully customized leadership development programmes.</p>' +
      '<ol class="tiers">' + tiers.map(function (t, i) { return '<li class="tier tr' + i + ' rv"><span class="tier-n">Tier 0' + (i + 1) + '</span><h4>' + t[0] + '</h4>' + list(t[1]) + '</li>'; }).join('') + '</ol></div>' +
      '<div class="fmt">' + acc('<span class="acc-h">' + ic('cal') + '<span><b>A Learning Experience Designed to Fit Your Needs.</b><span class="acc-s">Virtual, in-person, and hybrid options.</span></span></span>',
        '<p>NiaDelta offers a range of delivery approaches to ensure that leadership development is accessible, engaging, and tailored to both individuals and organizations. Whether you’re seeking personal leadership growth or enterprise-wide transformation, our flexible formats ensure seamless integration into your schedule and priorities.</p><p>We provide virtual, in-person, and hybrid options to fit different logistical needs. Open enrollment opportunities allow individuals to participate in scheduled leadership experiences, while organizations can select from customizable solutions aligned with their goals.</p><p>Our programs are designed to be adaptive and scalable, meeting leaders where they are and providing the right level of support for sustainable impact.</p>', { cls: 'rv' }) + '</div>' +
      '<div class="stmt rv"><h3>At NiaDelta, We Don’t Just Teach Leadership. <span>We Develop ' + it('Leaders') + '.</span></h3><p>Our programmes go beyond theory; leaders apply what they learn to real-world challenges, ensuring confidence, adaptability, and measurable impact.</p></div>' +
      '<figure class="bigq rv"><span class="tq-m" aria-hidden="true">“</span><blockquote><p>NiaDelta’s expertise in leadership development is unmatched. Their comprehensive approach, blending activities, personalized learning, peer interaction, and continuous feedback, is truly empowering. Their swift delivery and organizational discipline, especially in managing stakeholders, were remarkable.</p></blockquote><figcaption class="who"><b>Dr. Nhlanhla Thwala</b><span>Provost &middot; African Leadership University (ALU)</span></figcaption></figure>' +
      /* source page also has "Your Return on Investment (ROI)": its intro ends in a list the scrape does not contain, so it is left out
         rather than invented. "Take Our Leadership Assessment" CTAs are omitted too: no assessment URL exists in ref/. */
      '<blockquote class="ownq rv"><p>“The future belongs to those who lead boldly today—visionaries who act with purpose, embrace change, and inspire others to ' + it('rise') + '. Tomorrow is shaped by the decisions we make now.”</p></blockquote>' +
      '<div class="ctab rv"><div><h3>Are you ready to unlock your leadership ' + it('potential') + '?</h3><p>Looking to build leadership capacity in your organization? Schedule a call to explore how our tailored solutions can help you create impact.</p></div>' + btn(C.calLeadership, 'Speak with one of our Leadership Experts', 'g') + '</div>' +
      '</div>') +
    /* ---- ODC ---- */
    /* the align scene tells "Discover How" paragraph one (disconnected teams -> one integrated system)
       and introduces the five pillars, so it sits between the ODC heading and the detail below */
    sec('culture', 'Organisational culture', 'odc odc-h tint', '<div class="wrap">' +
      head('Organisational culture', 'Organisational Development & Culture (ODC) ' + u('Consulting'), 'We partner with organisations to unlock purpose, align strategy, shape culture, and elevate leadership, enabling lasting, human-centred transformation.') + '</div>') +
    story('align', 'align', 'Organisational culture') +
    sec('', 'Organisational culture', 'odc odc-b tint', '<div class="wrap">' +
      '<div class="two-t pil-w"><h3 class="rv">Discover ' + it('How') + '</h3><div><div class="prose">' +
      '<p class="rv">At NiaDelta, our Organisational Development & Culture (ODC) Consulting Practice leads systems-level transformation across purpose, strategy, culture, and leadership. We believe high-performing institutions are built from the inside out. That’s why we focus on what matters most: a clear purpose, aligned strategy, values-driven culture, and elevated, accountable leadership.</p>' +
      '<p class="rv">From boardrooms to frontline teams, we help shift mindsets, rewire structures, and build institutions where people flourish, strategy is realised, and impact is sustained.</p></div><div class="accs">' +
      pillars.map(function (p, i) { return acc('<span class="acc-n">0' + (i + 1) + '</span><span class="acc-h">' + ic(p[0]) + '<span><b>' + p[1] + '</b><span class="acc-s">' + p[2] + '</span></span></span>', '<p>' + p[3] + '</p><p class="eyebrow">Our Services Include:</p>' + list(p[4], 'two-c'), { cls: 'rv' }); }).join('') + '</div></div></div>' +
      '<div class="hw"><div class="hw-a"><h3 class="rv">How We ' + it('Work') + '</h3><p class="rv">Our approach is grounded in behavioural science, systems thinking, and a deep understanding of human motivation in organisations.</p><p class="rv">We co-create every step with you, designing solutions that reflect your realities, build ownership, and create lasting change. And we stay with you through implementation because real transformation is not a one-off event; it’s a sustained journey.</p></div>' +
      '<div class="hw-b card rv"><p class="eyebrow">We work best with institutions that are:</p>' + list(['Experiencing rapid growth or transformation', 'Struggling with internal alignment or accountability', 'Merging legacy with a new strategic direction', 'Seeking to embed culture and leadership into operations', 'Ready to move from inspiration to implementation', 'Looking to go from good… to flourishing']) + '</div></div>' +
      '<div class="mi"><div class="mi-a"><h3 class="rv">Measurable Impact, Lasting ' + it('Change') + '</h3><p class="rv">We measure progress in both tangible and human terms:</p>' + list(['Culture health assessments & re-measurement', 'Leadership behaviour shifts via 360° feedback', 'Strategy alignment and execution metrics', 'Staff clarity, engagement, and sentiment data', 'Qualitative stories of change and renewal'], 'rv') +
      '<p class="rv">Our clients span development organisations, philanthropic foundations, universities, multinationals, and high-growth ventures across Africa, North America, and Europe.</p></div>' +
      '<div class="mi-b rv"><p class="eyebrow">Showcasing transformative impact across mission-driven organisations</p><p>At NiaDelta, we partner with visionary organisations to cultivate environments where people flourish and purpose aligns with impact. Our case study compilation demonstrates how we drive measurable change through:</p>' + list(['Culture transformation initiatives that drive meaningful and lasting change', 'Purpose-led leadership development programs designed to inspire and empower leaders', 'Strategic team alignment to enhance collaboration and achieve business objectives', 'Immersive onboarding experiences that fully engage new hires and accelerate their integration']) + '<p class="eyebrow mi-q">Why explore our case studies?</p><p>Discover how we help our partners achieve:</p><div class="cs">' +
      [['92', '%+', 'engagement satisfaction'], ['4.8', '+/5', 'rated experiences'], ['88', '%+', 'purpose alignment']].map(function (s) { return '<div class="st"><b class="st-n"><span data-count="' + s[0] + '">' + s[0] + '</span><small>' + s[1] + '</small></b><span class="st-l">' + s[2] + '</span></div>'; }).join('') +
      '</div>' + btn(C.caseStudies, 'Download Our Full Case Study Compilation', '') + '</div></div>' +
      '<div class="tq-g g4">' + TESTI_ODC.map(function (t, i) { return '<figure class="tq sm rv" style="--c:' + ['var(--gold)', 'var(--coral)', 'var(--teal)', 'var(--peach)'][i] + '"><span class="tq-m" aria-hidden="true">“</span><blockquote><p>' + t.q + '</p></blockquote>' + who(t) + '</figure>'; }).join('') + '</div>' +
      '<div class="ctab alt rv"><div><h3>Where Do You ' + it('Begin') + '?</h3><p>Every organisation’s starting point is different. Some begin with a culture assessment. Others with a leadership framework. Or strategy realignment.</p><p>Whether you’re reimagining who you are or strengthening what already works, we’ll help you find the right entry point and walk the journey with you. Contact us to explore a partnership. Let’s build your next version, together.</p></div>' + btn(C.calCulture, 'Connect With Us', 'g') + '</div>' +
      '</div>') +
    /* ---- Culture Identity Kit ---- */
    sec('kit', 'Culture Identity Kit', 'kit', '<div class="wrap">' +
      head('Culture Identity Kit', 'The Culture Identity Kit: Unlocking Your Organisation’s Greatest Advantage—' + u('Culture'), '') +
      '<div class="two-t"><h3 class="rv">Your Culture is More Than Words—It’s How You ' + it('Win') + '</h3><div class="prose"><p class="rv">In today’s dynamic business landscape, culture isn’t just a “nice-to-have”—it’s your greatest strategic asset. A strong culture aligns teams, fuels innovation, attracts top talent, and drives long-term success. Yet, many organisations struggle to define and embed a culture that truly reflects who they are and how they operate.</p></div></div>' +
      '<p class="eyebrow rv sub-eb">Without a clear culture identity, organisations face:</p>' +
      '<div class="probs">' + problems.map(function (p, i) { return '<article class="prob rv"><span class="prob-n">0' + (i + 1) + '</span><h4>' + p[0] + '</h4><p>' + p[1] + '</p></article>'; }).join('') + '</div>' +
      '<div class="intro-k"><div class="ik-v rv"><svg class="tree" viewBox="0 0 200 200" aria-hidden="true"><path class="tr-t" d="M100 190V112M100 140l-24-20M100 128l22-18" pathLength="1"/><path class="tr-c" d="M100 118c-44 0-74-20-74-48 0-22 19-36 40-31 7-15 20-25 34-25s27 10 34 25c21-5 40 9 40 31 0 28-30 48-74 48z" pathLength="1"/><circle cx="62" cy="70" r="7"/><circle cx="96" cy="48" r="7"/><circle cx="134" cy="66" r="7"/><circle cx="80" cy="94" r="7"/><circle cx="120" cy="92" r="7"/><path class="tr-g" d="M40 190h120" pathLength="1"/></svg></div>' +
      '<div><h3 class="rv">Introducing The Culture Identity ' + it('Kit') + '</h3><p class="rv">Your culture is the DNA of your organisation. It shapes decisions, motivates teams, and strengthens your brand. Our Culture Identity Kit helps you define, align, and embed your vision, mission, values, and behaviours—turning culture into a powerful driver of performance and engagement.</p>' +
      '<p class="rv"><b>With our proven Culture Tree Framework, we help you:</b></p>' + list(['Align leadership and teams around a shared culture identity.', 'Embed culture into daily operations through actionable behaviours and rituals.', 'Strengthen decision-making and collaboration with a unified purpose.', 'Attract and retain top talent who resonate with your values.', 'Build trust with employees, investors, and customers.'], 'rv') + '</div></div>' +
      '<h3 class="rv pk-h">Choose the Package That Fits Your ' + it('Organisation') + '</h3>' +
      '<ol class="pkgs">' + pkgs.map(function (p, i) {
        return '<li class="pkg pk' + i + ' rv"><span class="pkg-s" aria-hidden="true">Step 0' + (i + 1) + '</span><h4>' + p[0] + '</h4><p class="pkg-f">' + p[1] + '</p>' +
          '<p class="pkg-w"><b>Why Choose This?</b> ' + p[2] + '</p>' + (p[3] ? '<p class="pkg-p">' + p[3] + '</p>' : '<p class="pkg-p">What’s Included:</p>') + list(p[4]) +
          '<p class="pkg-m"><b>Why It Matters:</b> ' + p[5] + '</p>' + ext(C.kitForm, 'Sign Up Now', 'lk pkg-l') + '</li>';
      }).join('') + '</ol>' +
      '<div class="ctab rv"><div><h3>For a Custom ' + it('Proposal') + '</h3><p>Pricing may vary based on the size of your organisation, scope of engagement, and specific needs. For larger teams or customised solutions, we’re happy to provide a tailored quote to ensure the best fit for your goals.</p></div><div class="ctab-a">' + btn(C.calCulture, 'Book a call now', 'g') + '<a class="lk lk-l" href="#contact">Contact us here</a></div></div>' +
      '<div class="cst"><h3 class="rv">Client Success ' + it('Stories') + '</h3><div class="tq-g g2">' +
      '<figure class="tq sm rv" style="--c:var(--gold)"><span class="tq-m" aria-hidden="true">“</span><blockquote><p>' + Q_ELIE + '</p></blockquote>' + who(TESTI_ODC[0]) + '</figure>' +
      '<figure class="tq sm rv" style="--c:var(--teal)"><span class="tq-m" aria-hidden="true">“</span><blockquote><p>NiaDelta’s Culture Identity Programme was instrumental in guiding Fingo through a strategic culture-building process. By blending personal reflection with collaborative engagement, NiaDelta not only defined Fingo’s culture identity but also equipped the organisation with the tools to foster a thriving culture environment.</p></blockquote><figcaption class="who"><b>Fingo Africa</b></figcaption></figure>' +
      '</div></div></div>') +
    footer(C);
}

function contact(ctx) {
  var C = ctx.C;
  var cal = [];
  if (C.calLeadership) cal.push('<a class="calc rv" href="' + esc(C.calLeadership) + '" target="_blank" rel="noopener" data-tilt data-cursor="Book">' + ic('cal', 'card-i') + '<span><b>Leadership development</b><span>Speak with one of our Leadership Experts</span></span>' + ic('out') + '</a>');
  if (C.calCulture) cal.push('<a class="calc t rv" href="' + esc(C.calCulture) + '" target="_blank" rel="noopener" data-tilt data-cursor="Book">' + ic('cal', 'card-i') + '<span><b>Organisational culture &amp; Culture Identity Kit</b><span>Book a call now</span></span>' + ic('out') + '</a>');
  return '<section class="ph2 ct" id="s-say" data-ch="Say hello"><div class="wrap ct-g">' +
    '<div class="ct-a"><p class="eyebrow hi">Let’s connect. Reach out</p><h1 class="hh" data-split>How can we ' + it('help') + ' you?</h1>' +
    '<p class="lede hi">At the core of how we work with you is a human centred approach that seeks to understand your needs &amp; motivations for maximum impact. Be a part of the leading global organizations utilizing our solutions today.</p>' +
    '<div class="ct-blob hi"><div class="blob-w">' + ph('SIL', 'People silhouetted on a headland at sunset', 'bl3', { eager: 1 }) + '<svg class="bo" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true"><use href="#bp3"/></svg></div></div></div>' +
    '<div class="ct-b"><div class="ct-f">' + contactForm() + '</div>' +
    '<div class="ct-d hi"><p class="eyebrow">Engage with us</p>' + contactLinks(C) + (cal.length ? '<p class="eyebrow ct-e2">Book a call</p><div class="cals">' + cal.join('') + '</div>' : '') + '</div></div>' +
    '</div></section>' + footer(C);
}

window.NIA_CONTENT = {
  nav: NAV, routes: ROUTES, titles: TITLES, labels: LABELS, scenesFallback: SCENES_FALLBACK,
  pages: { home: home, about: about, work: work, contact: contact },
  people: PEOPLE,
  util: { img: img, ic: ic, esc: esc, slug: slug, ph: ph }
};
})();
