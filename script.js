
// Header scroll effect
(function () {
    const mainHeader = document.querySelector('.main-header');
    if (mainHeader) {
        let lastScroll = 0;
        window.addEventListener('scroll', function () {
            const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
            if (currentScroll > 50) {
                mainHeader.classList.add('scrolled');
            } else {
                mainHeader.classList.remove('scrolled');
            }
            lastScroll = currentScroll;
        });
    }
})();

// Initialize theme immediately to prevent flash
(function () {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
})();

// Custom smooth scroll function for sections - responsive and smooth
function smoothScrollTo(element, offset = 0, duration = 600) {
    if (!element) return;
    
    // Stop any ongoing wheel scrolling animation
    if (window.smoothScrollAnimation) {
        cancelAnimationFrame(window.smoothScrollAnimation);
        window.smoothScrollAnimation = null;
    }
    
    // Stop wheel scrolling if active
    if (window.wheelScrollingActive) {
        window.wheelScrollingActive = false;
        if (window.wheelScrollAnimation) {
            cancelAnimationFrame(window.wheelScrollAnimation);
            window.wheelScrollAnimation = null;
        }
    }
    
    const startPosition = window.pageYOffset || document.documentElement.scrollTop;
    const elementPosition = element.getBoundingClientRect().top + startPosition;
    const targetPosition = elementPosition - offset;
    const distance = targetPosition - startPosition;
    
    // If distance is very small, just scroll immediately
    if (Math.abs(distance) < 10) {
        window.scrollTo({ top: targetPosition, behavior: 'auto' });
        return;
    }
    
    let startTime = null;
    let animationFrameId = null;
    
    function easeInOutCubic(t) {
        return t < 0.5 
            ? 4 * t * t * t 
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);
        
        const ease = easeInOutCubic(progress);
        const currentPosition = startPosition + (distance * ease);
        
        window.scrollTo({
            top: Math.round(currentPosition),
            behavior: 'auto'
        });
        
        if (progress < 1) {
            animationFrameId = requestAnimationFrame(animation);
            window.smoothScrollAnimation = animationFrameId;
        } else {
            // Ensure we end exactly at target
            window.scrollTo({ top: targetPosition, behavior: 'auto' });
            window.smoothScrollAnimation = null;
        }
    }
    
    animationFrameId = requestAnimationFrame(animation);
    window.smoothScrollAnimation = animationFrameId;
}

// Make function globally accessible
window.smoothScrollTo = smoothScrollTo;

// Smooth scroll for internal links and section navigation
document.addEventListener('click', function (e) {
    const target = e.target.closest('a[href^="#"]');
    if (!target) return;
    const hash = target.getAttribute('href');
    if (!hash || hash === '#') return;
    
    const el = document.querySelector(hash);
    if (el) {
        e.preventDefault();
        e.stopPropagation();
        
        // Get header height for offset (if header is fixed)
        const header = document.querySelector('.main-header');
        const headerHeight = header ? header.offsetHeight : 80;
        
        // Smooth scroll to section with header offset (faster, more responsive)
        smoothScrollTo(el, headerHeight, 600);
    }
});

// Smooth scrolling for the entire page
(function() {
    // Check if element is in a scrollable container
    function isInScrollableContainer(element) {
        if (!element) return false;
        let parent = element.parentElement;
        while (parent && parent !== document.body) {
            const style = window.getComputedStyle(parent);
            const overflow = style.overflow + style.overflowY + style.overflowX;
            if (overflow.includes('scroll') || overflow.includes('auto')) {
                return true;
            }
            parent = parent.parentElement;
        }
        return false;
    }
    
    let isScrolling = false;
    let scrollTarget = 0;
    let currentScroll = 0;
    let animationFrame = null;
    
    // Expose wheel scrolling state for section scrolling to stop it
    window.wheelScrollingActive = false;
    window.wheelScrollAnimation = null;
    
    function animateScroll() {
        if (!isScrolling) {
            window.wheelScrollingActive = false;
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
                animationFrame = null;
                window.wheelScrollAnimation = null;
            }
            return;
        }
        
        window.wheelScrollingActive = true;
        
        const diff = scrollTarget - currentScroll;
        
        if (Math.abs(diff) < 0.5) {
            window.scrollTo({ top: scrollTarget, behavior: 'auto' });
            currentScroll = scrollTarget;
            isScrolling = false;
            window.wheelScrollingActive = false;
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
                animationFrame = null;
                window.wheelScrollAnimation = null;
            }
            return;
        }
        
        // Smooth interpolation - using exponential easing for natural feel
        const speed = 0.12; // Lower = slower, smoother (0.08-0.15 range works well)
        const step = diff * speed;
        currentScroll += step;
        
        // Use scrollTo with smooth behavior for better browser optimization
        window.scrollTo({ 
            top: Math.round(currentScroll), 
            behavior: 'auto' 
        });
        
        animationFrame = requestAnimationFrame(animateScroll);
        window.wheelScrollAnimation = animationFrame;
    }
    
    // Handle mouse wheel scrolling
    let wheelTimeout = null;
    let accumulatedDelta = 0;
    
    document.addEventListener('wheel', function(e) {
        // Skip if in scrollable container
        if (isInScrollableContainer(e.target)) {
            return;
        }
        
        // Skip horizontal scrolling
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
            return;
        }
        
        // Skip if scrolling inside input/textarea
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
            return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        const now = Date.now();
        const delta = e.deltaY;
        
        // Accumulate small scrolls for smoother experience
        accumulatedDelta += delta;
        
        // Update scroll target
        scrollTarget += delta * 0.6; // Reduce scroll distance
        scrollTarget = Math.max(0, Math.min(scrollTarget, 
            document.documentElement.scrollHeight - window.innerHeight));
        
        // Start animation if not already running
        if (!isScrolling) {
            currentScroll = window.pageYOffset || document.documentElement.scrollTop;
            isScrolling = true;
            animateScroll();
        }
        
        // Reset accumulated delta after a pause
        clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(function() {
            accumulatedDelta = 0;
            // Keep scrolling for a bit after wheel stops for smooth deceleration
            setTimeout(function() {
                if (isScrolling) {
                    isScrolling = false;
                }
            }, 100);
        }, 150);
        
    }, { passive: false, capture: true });
    
    // Sync with manual scrolling (scrollbar, keyboard)
    let syncTimeout = null;
    let lastScrollPos = window.pageYOffset || document.documentElement.scrollTop;
    
    window.addEventListener('scroll', function() {
        const currentPos = window.pageYOffset || document.documentElement.scrollTop;
        
        // If scroll happened without our animation, sync
        if (!isScrolling && Math.abs(currentPos - lastScrollPos) > 1) {
            clearTimeout(syncTimeout);
            syncTimeout = setTimeout(function() {
                currentScroll = currentPos;
                scrollTarget = currentPos;
            }, 50);
        }
        
        lastScrollPos = currentPos;
    }, { passive: true });
})();

// Hide/show top bar on scroll for mobile devices
(function () {
    let lastScrollTop = 0;
    let ticking = false;
    const topBar = document.querySelector('.top-bar');

    if (!topBar) return;

    // Only apply on mobile devices
    function isMobile() {
        return window.innerWidth <= 768;
    }

    function handleScroll() {
        if (!isMobile()) {
            topBar.classList.remove('hidden');
            return;
        }

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Show top bar when at the top of the page
        if (scrollTop <= 10) {
            topBar.classList.remove('hidden');
            lastScrollTop = scrollTop;
            ticking = false;
            return;
        }

        // Hide top bar when scrolling down, show when scrolling up
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down
            topBar.classList.add('hidden');
        } else {
            // Scrolling up
            topBar.classList.remove('hidden');
        }

        lastScrollTop = scrollTop;
        ticking = false;
    }

    window.addEventListener('scroll', function () {
        if (!ticking) {
            window.requestAnimationFrame(handleScroll);
            ticking = true;
        }
    }, { passive: true });

    // Show top bar on window resize if switching from desktop to mobile
    window.addEventListener('resize', function () {
        if (!isMobile()) {
            topBar.classList.remove('hidden');
        }
    });
})();

// Theme Toggle Functionality
(function () {
    // Get theme from localStorage or default to light
    function getTheme() {
        return localStorage.getItem('theme') || 'light';
    }

    // Set theme
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        updateThemeIcons(theme);
    }

    // Update theme toggle button icons
    function updateThemeIcons(theme) {
        const toggleTopBar = document.getElementById('topBarThemeToggle');
        if (toggleTopBar) {
            const thumb = toggleTopBar.querySelector('.theme-toggle-thumb');
            if (thumb) {
                // Sun icon for light mode, moon icon for dark mode
                if (theme === 'light') {
                    thumb.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="5"></circle>
                            <line x1="12" y1="1" x2="12" y2="3"></line>
                            <line x1="12" y1="21" x2="12" y2="23"></line>
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                            <line x1="1" y1="12" x2="3" y2="12"></line>
                            <line x1="21" y1="12" x2="23" y2="12"></line>
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                        </svg>
                    `;
                } else {
                    thumb.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="#fbbf24">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                        </svg>
                    `;
                }
            }
        }
    }

    // Toggle theme
    function toggleTheme() {
        const currentTheme = getTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    }

    // Initialize theme on page load
    document.addEventListener('DOMContentLoaded', function () {
        const savedTheme = getTheme();
        setTheme(savedTheme);

        // Add event listeners to toggle buttons (top bar only)
        const toggleTopBar = document.getElementById('topBarThemeToggle');

        if (toggleTopBar) {
            toggleTopBar.addEventListener('click', toggleTheme);
        }
    });
})();


// Language switcher (minimal demo)
(function () {
    var i18n = {
        uz: {
            phone: "+998 93 301 52 18",
            email: "info@ketmon.uz",
            nav_home: "Bosh sahifa",
            nav_destinations: "Yo'nalishlar",
            nav_services: "Xizmatlar",
            nav_about: "Biz haqimizda",
            nav_contact: "Aloqa",
            nav_book: "Bron qilish",
            nav_login: "Kirish",
            nav_register: "Ro'yxatdan o'tish",
            login_email_label: "Email",
            login_email_placeholder: "you@example.com",
            login_password_label: "Parol",
            login_password_placeholder: "••••••••",
            register_switch: "Ro'yxatdan o'tish",
            register_role_label: "Ro'l tanlang",
            register_customer_tab: "Mijoz",
            register_agency_tab: "Agentlik",
            register_name_label: "Ism",
            register_name_placeholder: "Ismingiz",
            register_email_label: "Email",
            register_email_placeholder: "you@example.com",
            register_password_label: "Parol",
            register_password_placeholder: "••••••••",
            register_agency_name_label: "Agentlik nomi",
            register_agency_name_placeholder: "Agentlik nomi",
            register_license_label: "Litsenziya raqami",
            register_license_placeholder: "ABC-123456",
            register_agency_email_label: "Agentlik Email",
            register_agency_email_placeholder: "agency@example.com",
            register_agency_phone_label: "Telefon",
            register_agency_phone_placeholder: "+998 xx xxx xx xx",
            register_agency_password_label: "Parol",
            register_agency_password_placeholder: "••••••••",
            register_submit: "Yaratish",
            hero_title: "Dunyo Bo'ylab Unutilmas Sayohatlar",
            hero_subtitle: "Hayotingizning eng yaxshi tajribasini biz bilan kashf eting",
            hero_btn1: "Yo'nalishlarni Ko'rish",
            hero_btn2: "Maslahat Olish",
            search_destination: "Yo'nalish",
            search_destination_placeholder: "Qayerga bormoqchisiz?",
            search_date: "Sana",
            search_duration: "Davomiyligi",
            duration_3: "3 kun",
            duration_7: "7 kun",
            duration_14: "14 kun",
            duration_custom: "Boshqa",
            search_agency: "Agentlik",
            agency_select_all: "Barcha agentliklar",
            agency_section_title: "Hamkor Agentliklar",
            agency_section_subtitle: "Eng ishonchli sayohat hamkorlarini tanlang",
            agency_filter_all: "Barcha hamkorlar",
            agency_filter_local: "O'zbek sayyohlari uchun",
            agency_filter_global: "Xorijiy sayyohlar uchun",
            agency_badge_verified: "Tasdiqlangan",
            agency_view_tours: "Agentlik turlarini ko'rish",
            license_title: "Sayohat Agentligi Litsenziyasi",
            license_verified: "Tasdiqlangan sayohat agentligi",
            license_number: "Litsenziya raqami:",
            license_issued: "Berilgan sana:",
            license_expires: "Amal qilish muddati:",
            license_authority: "Bergan organ:",
            license_status: "Holati:",
            license_active: "Faol",
            license_note: "Ushbu litsenziya O'zbekiston Respublikasi Turizm va madaniy meros vazirligi tomonidan berilgan va tasdiqlangan. Agentlik barcha qonuniy talablarga javob beradi.",
            agency_atlas_name: "Atlas Travel",
            agency_atlas_desc: "Markaziy Osiyodan dunyoning 40+ manziliga premium paketlar va VIP xizmatlar.",
            agency_samarqand_name: "Samarqand Tours",
            agency_samarqand_desc: "Madaniy sayohatlar, tarixiy gidlar va mahalliy tajribalar bo'yicha mutaxassis.",
            agency_nomad_name: "Nomad Explorer",
            agency_nomad_desc: "Aktiv sayohatlar, tog' yurishlari va ekologik turizm bo'yicha mutaxassis.",
            agency_silk_name: "Silk Road Elite",
            agency_silk_desc: "Luks mehmonxonalar, TNPL rejalar va shaxsiy gidlar bilan premium xizmat.",
            agency_clubtravel_name: "ClubTravel UZ",
            agency_clubtravel_desc: "Oila va guruhlar uchun hamyonbop paketlar, Toshkentdan charter reyslar.",
            agency_azialux_name: "AziaLux Travel",
            agency_azialux_desc: "Osiyo va Yevropadagi eksklyuziv gastro-turlar, premium servis va gidlar.",
            agency_globalvoyage_name: "Global Voyage Hub",
            agency_globalvoyage_desc: "Xalqaro konferensiya va MICE turlar, 24/7 qo'llab-quvvatlash va viza xizmati.",
            about_title: "KETMON haqida",
            about_subtitle: "Markaziy Osiyoning eng ishonchli sayohat marketpleysida agentliklar va sayohatchilar birlashadi.",
            about_story_title: "Missiyamiz",
            about_story_body1: "Ketmon qadriyatlaridan ilhomlanib, biz doimo mehnatsevarlik va taraqqiyot ramzini xizmatlarimiz markaziga qo'yamiz.",
            about_story_body2: "Platformamizda tasdiqlangan agentliklar, shaffof narxlar va TNPL imkoniyatlari yordamida sayohatchilar vaqtini va byudjetini tejashadi.",
            about_bullet_network: "Hamkorlarimiz real vaqt rejimida paketlarni yangilaydi va video-reels orqali yo'nalishlarni jonlantiradi.",
            about_bullet_support: "24/7 yordam, integratsiyalangan chat va Telegram bildirishnomalari bilan agentliklar mijozlar bilan tezkor aloqa qiladi.",
            about_bullet_ai: "AI tavsiyalari shaxsiylashgan marshrutlarni taklif etib, sayohatchilarga tez qaror qabul qilishga yordam beradi.",
            about_stat_partners_value: "120+",
            about_stat_partners_label: "hamkor agentliklar",
            about_stat_tours_value: "650+",
            about_stat_tours_label: "faol tur paketlar",
            about_stat_travelers_value: "45k+",
            about_stat_travelers_label: "mamnun sayohatchilar",
            about_stat_languages_value: "3",
            about_stat_languages_label: "tilda qo'llab-quvvatlash",
            contact_title: "Aloqada bo'laylik",
            contact_subtitle: "Savol va takliflaringizni qoldiring — jamoamiz 24/7 yordam beradi.",
            contact_info_title: "Nega KETMON?",
            contact_info_body: "Ketmon orqali siz tasdiqlangan agentliklar bilan ishlaysiz, narxlarni solishtirasiz va TNPL orqali to'lovlarni bo'lib-bo'lib amalga oshirasiz. Mijozlar va agentliklar uchun yagona panel barcha jarayonlarni bir joyga jamlaydi.",
            contact_phone_label: "Telefon",
            contact_phone_value: "+998 90 765 43 21",
            contact_email_label: "Email",
            contact_email_value: "support@ketmon.uz",
            contact_address_label: "Manzil",
            contact_address_value: "Toshkent, Navoiy ko'chasi 12, KETMON HUB",
            contact_form_name_label: "Ism",
            contact_form_name_placeholder: "Ismingiz",
            contact_form_email_label: "Email",
            contact_form_email_placeholder: "you@example.com",
            contact_form_message_label: "Xabar",
            contact_form_message_placeholder: "Savolingizni yozing...",
            contact_submit_btn: "Yuborish",
            contact_status_placeholder: "Yuborilgan xabarlarimizga odatda 30 daqiqada javob beramiz.",
            contact_success_message: "Xabaringiz qabul qilindi! Tez orada siz bilan bog'lanamiz.",
            contact_error_message: "Iltimos, barcha maydonlarni to'liq kiriting.",
            ai_assistant_title: "Smart AI yordamchi",
            ai_assistant_subtitle: "Budjetingiz, yo'nalishingiz va sanalarga qarab mos tur paketlarni tavsiya qiladi.",
            ai_budget_label: "Budjet (USD)",
            ai_budget_placeholder: "1500",
            ai_destination_label: "Qiziqqan yo'nalish",
            ai_destination_placeholder: "Osiyo, Yevropa...",
            ai_season_label: "Qaysi fasllar",
            ai_season_summer: "Yoz",
            ai_season_autumn: "Kuz",
            ai_season_winter: "Qish",
            ai_season_spring: "Bahor",
            ai_month_label: "Oy",
            ai_month_select: "Tanlang",
            ai_month_january: "Yanvar",
            ai_month_february: "Fevral",
            ai_month_march: "Mart",
            ai_month_april: "Aprel",
            ai_month_may: "May",
            ai_month_june: "Iyun",
            ai_month_july: "Iyul",
            ai_month_august: "Avgust",
            ai_month_september: "Sentabr",
            ai_month_october: "Oktabr",
            ai_month_november: "Noyabr",
            ai_month_december: "Dekabr",
            ai_generate_btn: "Tavsiyalarni ko'rish",
            ai_response_placeholder: "Savolingizni kiriting va AI yordamchidan tavsiyalar oling.",
            search_guests: "Odamlar soni",
            search_btn: "Qidirish",
            late_escape_title: "Yaxshi vaqt o'tkazish, uzoq emas",
            late_escape_subtitle: "Yozning oxirgi kunlarini kamida 15% chegirma bilan foydalaning",
            late_escape_btn: "Topish",
            trending_title: "Trend yo'nalishlar",
            trending_subtitle: "O'zbekiston sayohatchilari uchun eng mashhur tanlovlar",
            explore_uz_title: "O'zbekistanni kashf eting",
            explore_uz_subtitle: "Bu mashhur yo'nalishlar ko'p narsa taklif qiladi",
            explore_properties: "ob'ektlar",
            property_type_title: "Ob'ekt turi bo'yicha qidiruv",
            property_hotels: "Mehmonxonalar",
            property_apartments: "Kvartiralar",
            property_resorts: "Kurortlar",
            property_villas: "Villalar",
            trip_planner_title: "Tez va oson sayohat rejalashtiruvchi",
            trip_planner_subtitle: "Mavzuni tanlang va O'zbekistondagi eng yaxshi yo'nalishlarni kashf eting",
            trip_festivals: "Festivallar",
            trip_shopping: "Sotib olish va hunarmandchilik",
            trip_gastronomic: "Gastronomik sayohatlar",
            trip_cultural: "Madaniy tadqiqot",
            trip_architecture: "Arxitektura turlari",
            trip_historical: "Tarixiy joylar",
            weekend_deals_title: "Dam olish kunlari uchun takliflar",
            weekend_deals_subtitle: "14-16 noyabr kunlari uchun yashash joylarida tejang",
            dest_tashkent: "Toshkent",
            dest_samarkand: "Samarqand",
            dest_istanbul: "Istanbul",
            dest_bukhara: "Buxoro",
            dest_dubai: "Dubai",
            dest_khiva: "Xiva",
            dest_chimgan: "Chimgan",
            dest_fergana: "Farg'ona",
            dest_kokand: "Qo'qon",
            explore_tashkent_props: "1,409 ob'ektlar",
            explore_samarkand_props: "914 ob'ektlar",
            explore_bukhara_props: "587 ob'ektlar",
            explore_khiva_props: "163 ob'ektlar",
            explore_chimgan_props: "20 ob'ektlar",
            explore_fergana_props: "46 ob'ektlar",
            trip_tashkent_distance: "7 km uzoqlikda",
            trip_kokand_distance: "165 km uzoqlikda",
            trip_fergana_distance: "237 km uzoqlikda",
            trip_samarkand_distance: "262 km uzoqlikda",
            trip_bukhara_distance: "438 km uzoqlikda",
            trip_khiva_distance: "739 km uzoqlikda",
            deal_premium_hotel: "Premium mehmonxona",
            deal_luxury_apartment: "Luks kvartira",
            deal_resort_stay: "Kurort mehmonxonasi",
            deal_villa_retreat: "Villa dam olish maskani",
            deal_price_89: "$89/kecha",
            deal_price_75: "$75/kecha",
            deal_price_120: "$120/kecha",
            deal_price_150: "$150/kecha",
            destinations_title: "Mashhur Yo'nalishlar",
            destinations_subtitle: "Eng yaxshi takliflarimiz",
            badge_popular: "Mashhur",
            badge_sale: "Chegirma",
            badge_new: "Yangi",
            btn_details: "Batafsil",
            price_per_person: "kishi uchun",
            dest1_name: "Dubay, BAA",
            dest1_desc: "Zamonaviy arxitektura va qadimiy an'analarning ajoyib uyg'unligi",
            dest2_name: "Parij, Fransiya",
            dest2_desc: "Sevgi va romantika poytaxti, go'zal arxitektura",
            dest3_name: "Istanbul, Turkiya",
            dest3_desc: "Sharq va G'arb madaniyatining ajoyib qo'shilishi",
            dest4_name: "Shveysariya",
            dest4_desc: "Alp tog'lari va kristal toza ko'llar",
            dest5_name: "Tokio, Yaponiya",
            dest5_desc: "Texnologiya va an'analarning noyob uyg'unligi",
            dest6_name: "Rim, Italiya",
            dest6_desc: "Qadimiy tarix va ajoyib arxitektura",
            dest7_name: "Bangkok Gourmet, Tailand",
            dest7_desc: "Gastro sayohatlar, Michelin restoranlari va shaxsiy gidlar.",
            dest8_name: "London Summit, Buyuk Britaniya",
            dest8_desc: "Biznes konferensiya paketi, premium mehmonxona va transferlar.",
            dest9_name: "Boku Weekend, Ozarbayjon",
            dest9_desc: "Toshkentdan to'g'ridan-to'g'ri reys, 4* mehmonxona va shahar sayohati.",
            services_title: "Bizning Xizmatlarimiz",
            services_subtitle: "Nega bizni tanlash kerak? Biz sizga eng yaxshi narxlar, professional xizmat va 24/7 qo'llab-quvvatlashni ta'minlaymiz",
            service1_title: "Aviachiptalar",
            service1_desc: "Eng arzon narxlarda aviachiptalar bron qilish xizmati",
            service2_title: "Mehmonxonalar",
            service2_desc: "Dunyoning istalgan joyida qulay mehmonxonalar",
            service3_title: "Ekskursiyalar",
            service3_desc: "Professional gidlar bilan qiziqarli sayohatlar",
            service4_title: "Viza Xizmati",
            service4_desc: "Viza olish",
            service_why: "Nega biz?",
            service1_advantage_text: "Real vaqtda narxlar, 500+ aviakompaniya, tezkor bron qilish",
            service2_advantage_text: "50,000+ mehmonxona, eng yaxshi narxlar, bepul bekor qilish",
            service3_advantage_text: "Mahalliy gidlar, shaxsiylashtirilgan marshrutlar, 24/7 qo'llab-quvvatlash",
            service4_advantage_text: "Tezkor viza olish, professional yordam, yuqori muvaffaqiyat darajasi"
        },
        ru: {
            phone: "+998 93 301 52 18",
            email: "info@ketmon.uz",
            nav_home: "Главная",
            nav_destinations: "Направления",
            nav_services: "Услуги",
            nav_about: "О нас",
            nav_contact: "Контакты",
            nav_book: "Бронирование",
            nav_login: "Войти",
            nav_register: "Регистрация",
            login_email_label: "Email",
            login_email_placeholder: "you@example.com",
            login_password_label: "Пароль",
            login_password_placeholder: "••••••••",
            register_switch: "Регистрация",
            register_role_label: "Выберите роль",
            register_customer_tab: "Клиент",
            register_agency_tab: "Агентство",
            register_name_label: "Имя",
            register_name_placeholder: "Ваше имя",
            register_email_label: "Email",
            register_email_placeholder: "you@example.com",
            register_password_label: "Пароль",
            register_password_placeholder: "••••••••",
            register_agency_name_label: "Название агентства",
            register_agency_name_placeholder: "Название агентства",
            register_license_label: "Номер лицензии",
            register_license_placeholder: "ABC-123456",
            register_agency_email_label: "Email агентства",
            register_agency_email_placeholder: "agency@example.com",
            register_agency_phone_label: "Телефон",
            register_agency_phone_placeholder: "+998 xx xxx xx xx",
            register_agency_password_label: "Пароль",
            register_agency_password_placeholder: "••••••••",
            register_submit: "Создать",
            hero_title: "Незабываемые путешествия по всему миру",
            hero_subtitle: "Откройте лучшие впечатления вместе с нами",
            hero_btn1: "Смотреть направления",
            hero_btn2: "Получить консультацию",
            search_destination: "Направление",
            search_destination_placeholder: "Куда хотите поехать?",
            search_date: "Дата",
            search_duration: "Продолжительность",
            duration_3: "3 дня",
            duration_7: "7 дней",
            duration_14: "14 дней",
            duration_custom: "Другое",
            search_agency: "Агентство",
            agency_select_all: "Все агентства",
            agency_section_title: "Партнерские агентства",
            agency_section_subtitle: "Выберите надежного партнера для путешествия",
            agency_filter_all: "Все партнеры",
            agency_filter_local: "Для путешественников Узбекистана",
            agency_filter_global: "Для иностранных гостей",
            agency_badge_verified: "Проверено",
            agency_view_tours: "Посмотреть туры агентства",
            license_title: "Лицензия туристического агентства",
            license_verified: "Проверенное туристическое агентство",
            license_number: "Номер лицензии:",
            license_issued: "Дата выдачи:",
            license_expires: "Срок действия:",
            license_authority: "Выдавший орган:",
            license_status: "Статус:",
            license_active: "Активна",
            license_note: "Эта лицензия выдана и подтверждена Министерством туризма и культурного наследия Республики Узбекистан. Агентство соответствует всем правовым требованиям.",
            agency_atlas_name: "Atlas Travel",
            agency_atlas_desc: "Премиальные пакеты и VIP-сервис в 40+ направлениях по всему миру.",
            agency_samarqand_name: "Samarqand Tours",
            agency_samarqand_desc: "Эксперты по культурным путешествиям, историческим гидам и местному опыту.",
            agency_nomad_name: "Nomad Explorer",
            agency_nomad_desc: "Активные туры, треккинг и экологический туризм.",
            agency_silk_name: "Silk Road Elite",
            agency_silk_desc: "Лакшери-отели, TNPL планы и персональные гиды премиум-класса.",
            agency_clubtravel_name: "ClubTravel UZ",
            agency_clubtravel_desc: "Доступные пакеты для семей и групп, чартеры из Ташкента.",
            agency_azialux_name: "AziaLux Travel",
            agency_azialux_desc: "Эксклюзивные гастротуры по Азии и Европе, премиум-сервис.",
            agency_globalvoyage_name: "Global Voyage Hub",
            agency_globalvoyage_desc: "Международные конференции и MICE-туры, поддержка 24/7 и визовая помощь.",
            about_title: "О платформе KETMON",
            about_subtitle: "Надёжный маркетплейс путешествий Центральной Азии, объединяющий агентства и путешественников.",
            about_story_title: "Наша миссия",
            about_story_body1: "Вдохновляясь символом кетмона, мы ставим трудолюбие и рост в основу каждого продукта и сервиса.",
            about_story_body2: "На платформе собраны проверенные агентства, прозрачные цены и TNPL — всё, чтобы экономить время и бюджет путешественников.",
            about_bullet_network: "Партнёры обновляют пакеты в реальном времени и рассказывают о направлениях через видео и сторис.",
            about_bullet_support: "Круглосуточная поддержка, встроенный чат и уведомления в Telegram помогают агентствам оставаться на связи с клиентами.",
            about_bullet_ai: "AI-рекомендации предлагают персональные маршруты и ускоряют выбор тура.",
            about_stat_partners_value: "120+",
            about_stat_partners_label: "партнёрских агентств",
            about_stat_tours_value: "650+",
            about_stat_tours_label: "активных турпакетов",
            about_stat_travelers_value: "45k+",
            about_stat_travelers_label: "довольных путешественников",
            about_stat_languages_value: "3",
            about_stat_languages_label: "языков поддержки",
            contact_title: "Свяжитесь с нами",
            contact_subtitle: "Оставьте вопрос или предложение — мы на связи 24/7.",
            contact_info_title: "Почему KETMON?",
            contact_info_body: "С KETMON вы сотрудничаете только с проверенными агентствами, сравниваете цены и используете TNPL для рассрочки. Единая панель упрощает работу и для клиентов, и для агентств.",
            contact_phone_label: "Телефон",
            contact_phone_value: "+998 90 765 43 21",
            contact_email_label: "Email",
            contact_email_value: "support@ketmon.uz",
            contact_address_label: "Адрес",
            contact_address_value: "Ташкент, ул. Навои 12, KETMON HUB",
            contact_form_name_label: "Имя",
            contact_form_name_placeholder: "Ваше имя",
            contact_form_email_label: "Email",
            contact_form_email_placeholder: "you@example.com",
            contact_form_message_label: "Сообщение",
            contact_form_message_placeholder: "Опишите запрос...",
            contact_submit_btn: "Отправить",
            contact_status_placeholder: "Обычно отвечаем в течение 30 минут.",
            contact_success_message: "Ваше сообщение принято! Мы свяжемся с вами в ближайшее время.",
            contact_error_message: "Заполните, пожалуйста, все поля формы.",
            ai_assistant_title: "Умный AI помощник",
            ai_assistant_subtitle: "Подбирает турпакеты по вашему бюджету, направлениям и датам.",
            ai_budget_label: "Бюджет (USD)",
            ai_budget_placeholder: "1500",
            ai_destination_label: "Интересующие направления",
            ai_destination_placeholder: "Азия, Европа...",
            ai_season_label: "Желаемый сезон",
            ai_season_summer: "Лето",
            ai_season_autumn: "Осень",
            ai_season_winter: "Зима",
            ai_season_spring: "Весна",
            ai_month_label: "Месяц",
            ai_month_select: "Выберите",
            ai_month_january: "Январь",
            ai_month_february: "Февраль",
            ai_month_march: "Март",
            ai_month_april: "Апрель",
            ai_month_may: "Май",
            ai_month_june: "Июнь",
            ai_month_july: "Июль",
            ai_month_august: "Август",
            ai_month_september: "Сентябрь",
            ai_month_october: "Октябрь",
            ai_month_november: "Ноябрь",
            ai_month_december: "Декабрь",
            ai_generate_btn: "Получить рекомендации",
            ai_response_placeholder: "Введите запрос и получите рекомендации от AI помощника.",
            search_guests: "Количество людей",
            search_btn: "Искать",
            late_escape_title: "Хорошее время, а не долгое",
            late_escape_subtitle: "Выжмите последнее из лета со скидкой не менее 15%",
            late_escape_btn: "Найти",
            trending_title: "Популярные направления",
            trending_subtitle: "Самые популярные выборы для путешественников из Узбекистана",
            explore_uz_title: "Исследуйте Узбекистан",
            explore_uz_subtitle: "Эти популярные направления предлагают многое",
            explore_properties: "объектов",
            property_type_title: "Поиск по типу недвижимости",
            property_hotels: "Отели",
            property_apartments: "Апартаменты",
            property_resorts: "Курорты",
            property_villas: "Виллы",
            trip_planner_title: "Быстрый и простой планировщик поездок",
            trip_planner_subtitle: "Выберите настроение и исследуйте лучшие направления в Узбекистане",
            trip_festivals: "Фестивали",
            trip_shopping: "Шопинг и ремесла",
            trip_gastronomic: "Гастрономические путешествия",
            trip_cultural: "Культурное исследование",
            trip_architecture: "Архитектурные туры",
            trip_historical: "Исторические места",
            weekend_deals_title: "Предложения на выходные",
            weekend_deals_subtitle: "Экономьте на проживании с 14 по 16 ноября",
            dest_tashkent: "Ташкент",
            dest_samarkand: "Самарканд",
            dest_istanbul: "Стамбул",
            dest_bukhara: "Бухара",
            dest_dubai: "Дубай",
            dest_khiva: "Хива",
            dest_chimgan: "Чимган",
            dest_fergana: "Фергана",
            dest_kokand: "Коканд",
            explore_tashkent_props: "1,409 объектов",
            explore_samarkand_props: "914 объектов",
            explore_bukhara_props: "587 объектов",
            explore_khiva_props: "163 объекта",
            explore_chimgan_props: "20 объектов",
            explore_fergana_props: "46 объектов",
            trip_tashkent_distance: "7 км",
            trip_kokand_distance: "165 км",
            trip_fergana_distance: "237 км",
            trip_samarkand_distance: "262 км",
            trip_bukhara_distance: "438 км",
            trip_khiva_distance: "739 км",
            deal_premium_hotel: "Премиум отель",
            deal_luxury_apartment: "Роскошная квартира",
            deal_resort_stay: "Курортный отель",
            deal_villa_retreat: "Вилла для отдыха",
            deal_price_89: "$89/ночь",
            deal_price_75: "$75/ночь",
            deal_price_120: "$120/ночь",
            deal_price_150: "$150/ночь",
            destinations_title: "Популярные направления",
            destinations_subtitle: "Наши лучшие предложения",
            badge_popular: "Популярно",
            badge_sale: "Скидка",
            badge_new: "Новинка",
            btn_details: "Подробнее",
            price_per_person: "за человека",
            dest1_name: "Дубай, ОАЭ",
            dest1_desc: "Современная архитектура и древние традиции",
            dest2_name: "Париж, Франция",
            dest2_desc: "Столица любви и романтики, прекрасная архитектура",
            dest3_name: "Стамбул, Турция",
            dest3_desc: "Удивительное сочетание Востока и Запада",
            dest4_name: "Швейцария",
            dest4_desc: "Альпы и кристально чистые озера",
            dest5_name: "Токио, Япония",
            dest5_desc: "Уникальное сочетание технологий и традиций",
            dest6_name: "Рим, Италия",
            dest6_desc: "Древняя история и потрясающая архитектура",
            dest7_name: "Bangkok Gourmet, Таиланд",
            dest7_desc: "Гастротуры, рестораны Michelin и персональные гиды.",
            dest8_name: "London Summit, Великобритания",
            dest8_desc: "Пакет для бизнес-конференции, премиум-отель и трансферы.",
            dest9_name: "Baku Weekend, Азербайджан",
            dest9_desc: "Прямой рейс из Ташкента, 4* отель и обзорная экскурсия по городу.",
            services_title: "Наши услуги",
            services_subtitle: "Почему выбирают нас? Мы предлагаем лучшие цены, профессиональный сервис и поддержку 24/7",
            service1_title: "Авиабилеты",
            service1_desc: "Бронирование авиабилетов по выгодным ценам",
            service2_title: "Отели",
            service2_desc: "Удобные отели по всему миру",
            service3_title: "Экскурсии",
            service3_desc: "Интересные туры с профессиональными гидами",
            service4_title: "Визовая поддержка",
            service4_desc: "Оформление виз",
            service_why: "Почему мы?",
            service1_advantage_text: "Цены в реальном времени, 500+ авиакомпаний, быстрое бронирование",
            service2_advantage_text: "50,000+ отелей, лучшие цены, бесплатная отмена",
            service3_advantage_text: "Местные гиды, персонализированные маршруты, поддержка 24/7",
            service4_advantage_text: "Быстрое оформление виз, профессиональная помощь, высокий процент успеха"
        },
        en: {
            phone: "+998 93 301 52 18",
            email: "info@ketmon.uz",
            nav_home: "Home",
            nav_destinations: "Destinations",
            nav_services: "Services",
            nav_about: "About",
            nav_contact: "Contact",
            nav_book: "Book Now",
            nav_login: "Login",
            nav_register: "Register",
            login_email_label: "Email",
            login_email_placeholder: "you@example.com",
            login_password_label: "Password",
            login_password_placeholder: "••••••••",
            register_switch: "Register",
            register_role_label: "Select role",
            register_customer_tab: "Customer",
            register_agency_tab: "Agency",
            register_name_label: "Full name",
            register_name_placeholder: "Your name",
            register_email_label: "Email",
            register_email_placeholder: "you@example.com",
            register_password_label: "Password",
            register_password_placeholder: "••••••••",
            register_agency_name_label: "Agency name",
            register_agency_name_placeholder: "Agency name",
            register_license_label: "License number",
            register_license_placeholder: "ABC-123456",
            register_agency_email_label: "Agency email",
            register_agency_email_placeholder: "agency@example.com",
            register_agency_phone_label: "Phone",
            register_agency_phone_placeholder: "+998 xx xxx xx xx",
            register_agency_password_label: "Password",
            register_agency_password_placeholder: "••••••••",
            register_submit: "Create",
            hero_title: "Unforgettable Journeys Around the World",
            hero_subtitle: "Discover your best experiences with us",
            hero_btn1: "View Destinations",
            hero_btn2: "Get a Consultation",
            search_destination: "Destination",
            search_destination_placeholder: "Where do you want to go?",
            search_date: "Date",
            search_duration: "Duration",
            duration_3: "3 days",
            duration_7: "7 days",
            duration_14: "14 days",
            duration_custom: "Custom",
            search_agency: "Agency",
            agency_select_all: "All agencies",
            agency_section_title: "Partner Agencies",
            agency_section_subtitle: "Choose the most trusted travel partner for your trip",
            agency_filter_all: "All partners",
            agency_filter_local: "For Uzbek travelers",
            agency_filter_global: "For international visitors",
            agency_badge_verified: "Verified",
            agency_view_tours: "View agency tours",
            license_title: "Travel Agency License",
            license_verified: "Verified travel agency",
            license_number: "License number:",
            license_issued: "Issued date:",
            license_expires: "Expiry date:",
            license_authority: "Issuing authority:",
            license_status: "Status:",
            license_active: "Active",
            license_note: "This license is issued and verified by the Ministry of Tourism and Cultural Heritage of the Republic of Uzbekistan. The agency complies with all legal requirements.",
            agency_atlas_name: "Atlas Travel",
            agency_atlas_desc: "Premium packages and VIP service to 40+ destinations worldwide.",
            agency_samarqand_name: "Samarqand Tours",
            agency_samarqand_desc: "Experts in cultural journeys, historical guides and authentic experiences.",
            agency_nomad_name: "Nomad Explorer",
            agency_nomad_desc: "Adventure tours, mountain trekking and eco experiences.",
            agency_silk_name: "Silk Road Elite",
            agency_silk_desc: "Luxury stays, TNPL plans and personal guides with premium service.",
            agency_clubtravel_name: "ClubTravel UZ",
            agency_clubtravel_desc: "Value-friendly packages for families and groups, charters from Tashkent.",
            agency_azialux_name: "AziaLux Travel",
            agency_azialux_desc: "Exclusive gastro tours across Asia and Europe with premium guides.",
            agency_globalvoyage_name: "Global Voyage Hub",
            agency_globalvoyage_desc: "International conferences and MICE tours with 24/7 support and visa help.",
            about_title: "About KETMON",
            about_subtitle: "The most trusted travel marketplace in Central Asia connecting agencies and travellers.",
            about_story_title: "Our Mission",
            about_story_body1: "Inspired by the ketmon spirit, we put dedication and growth at the heart of our services.",
            about_story_body2: "Verified agencies, transparent pricing, and TNPL financing help travellers save time and budget with confidence.",
            about_bullet_network: "Partners refresh packages in real time and bring destinations to life with reels and stories.",
            about_bullet_support: "24/7 support, integrated chat, and Telegram alerts keep agencies in sync with their customers.",
            about_bullet_ai: "AI recommendations surface personalised itineraries so guests can decide faster.",
            about_stat_partners_value: "120+",
            about_stat_partners_label: "partner agencies",
            about_stat_tours_value: "650+",
            about_stat_tours_label: "active tour packages",
            about_stat_travelers_value: "45k+",
            about_stat_travelers_label: "happy travellers",
            about_stat_languages_value: "3",
            about_stat_languages_label: "languages supported",
            contact_title: "Let's stay in touch",
            contact_subtitle: "Share your questions or ideas — our team replies within minutes.",
            contact_info_title: "Why KETMON?",
            contact_info_body: "Collaborate with verified agencies, compare offers, and split payments via TNPL. A single dashboard streamlines the journey for both travellers and partners.",
            contact_phone_label: "Phone",
            contact_phone_value: "+998 90 765 43 21",
            contact_email_label: "Email",
            contact_email_value: "support@ketmon.uz",
            contact_address_label: "Address",
            contact_address_value: "Tashkent, Navoi Street 12, KETMON HUB",
            contact_form_name_label: "Name",
            contact_form_name_placeholder: "Your name",
            contact_form_email_label: "Email",
            contact_form_email_placeholder: "you@example.com",
            contact_form_message_label: "Message",
            contact_form_message_placeholder: "Tell us how we can help...",
            contact_submit_btn: "Send message",
            contact_status_placeholder: "We usually reply within 30 minutes.",
            contact_success_message: "Thanks for reaching out! We will get back to you shortly.",
            contact_error_message: "Please fill in every field before sending.",
            ai_assistant_title: "Smart AI Assistant",
            ai_assistant_subtitle: "Get tailored tour ideas based on budget, destinations, and travel season.",
            ai_budget_label: "Budget (USD)",
            ai_budget_placeholder: "1500",
            ai_destination_label: "Preferred destinations",
            ai_destination_placeholder: "Asia, Europe...",
            ai_season_label: "Travel season",
            ai_season_summer: "Summer",
            ai_season_autumn: "Autumn",
            ai_season_winter: "Winter",
            ai_season_spring: "Spring",
            ai_month_label: "Month",
            ai_month_select: "Select",
            ai_month_january: "January",
            ai_month_february: "February",
            ai_month_march: "March",
            ai_month_april: "April",
            ai_month_may: "May",
            ai_month_june: "June",
            ai_month_july: "July",
            ai_month_august: "August",
            ai_month_september: "September",
            ai_month_october: "October",
            ai_month_november: "November",
            ai_month_december: "December",
            ai_generate_btn: "Show recommendations",
            ai_response_placeholder: "Ask the AI assistant for personalised tour ideas.",
            search_guests: "Guests",
            search_btn: "Search",
            late_escape_title: "Go for a good time, not a long time",
            late_escape_subtitle: "Squeeze out the last bit of summer at least 15% off",
            late_escape_btn: "Find",
            trending_title: "Trending destinations",
            trending_subtitle: "Most popular choices for travellers from Uzbekistan",
            explore_uz_title: "Explore Uzbekistan",
            explore_uz_subtitle: "These popular destinations have a lot to offer",
            explore_properties: "properties",
            property_type_title: "Browse by property type",
            property_hotels: "Hotels",
            property_apartments: "Apartments",
            property_resorts: "Resorts",
            property_villas: "Villas",
            trip_planner_title: "Quick and easy trip planner",
            trip_planner_subtitle: "Pick a vibe and explore the top destinations in Uzbekistan",
            trip_festivals: "Festivals",
            trip_shopping: "Shopping & Crafts",
            trip_gastronomic: "Gastronomic Journeys",
            trip_cultural: "Cultural Exploration",
            trip_architecture: "Architecture Tours",
            trip_historical: "Historical Sites",
            weekend_deals_title: "Deals for the weekend",
            weekend_deals_subtitle: "Save on stays for 14 November - 16 November",
            dest_tashkent: "Tashkent",
            dest_samarkand: "Samarkand",
            dest_istanbul: "Istanbul",
            dest_bukhara: "Bukhara",
            dest_dubai: "Dubai",
            dest_khiva: "Khiva",
            dest_chimgan: "Chimgan",
            dest_fergana: "Fergana",
            dest_kokand: "Kokand",
            explore_tashkent_props: "1,409 properties",
            explore_samarkand_props: "914 properties",
            explore_bukhara_props: "587 properties",
            explore_khiva_props: "163 properties",
            explore_chimgan_props: "20 properties",
            explore_fergana_props: "46 properties",
            trip_tashkent_distance: "7 km away",
            trip_kokand_distance: "165 km away",
            trip_fergana_distance: "237 km away",
            trip_samarkand_distance: "262 km away",
            trip_bukhara_distance: "438 km away",
            trip_khiva_distance: "739 km away",
            deal_premium_hotel: "Premium Hotel",
            deal_luxury_apartment: "Luxury Apartment",
            deal_resort_stay: "Resort Stay",
            deal_villa_retreat: "Villa Retreat",
            deal_price_89: "$89/night",
            deal_price_75: "$75/night",
            deal_price_120: "$120/night",
            deal_price_150: "$150/night",
            destinations_title: "Popular Destinations",
            destinations_subtitle: "Our best offers",
            badge_popular: "Popular",
            badge_sale: "Sale",
            badge_new: "New",
            btn_details: "Details",
            price_per_person: "per person",
            dest1_name: "Dubai, UAE",
            dest1_desc: "Modern architecture meets ancient traditions",
            dest2_name: "Paris, France",
            dest2_desc: "City of love and romance, beautiful architecture",
            dest3_name: "Istanbul, Turkey",
            dest3_desc: "A stunning blend of East and West",
            dest4_name: "Switzerland",
            dest4_desc: "Alps and crystal-clear lakes",
            dest5_name: "Tokyo, Japan",
            dest5_desc: "A unique mix of technology and tradition",
            dest6_name: "Rome, Italy",
            dest6_desc: "Ancient history and magnificent architecture",
            dest7_name: "Bangkok Gourmet, Thailand",
            dest7_desc: "Gastronomic adventures, Michelin dining and personal guides.",
            dest8_name: "London Summit, United Kingdom",
            dest8_desc: "Business conference package, premium hotel and private transfers.",
            dest9_name: "Baku Weekend, Azerbaijan",
            dest9_desc: "Direct flight from Tashkent, 4* hotel and guided city tour.",
            services_title: "Our Services",
            services_subtitle: "Why choose us? We provide the best prices, professional service, and 24/7 support",
            service1_title: "Flights",
            service1_desc: "Book flight tickets at great prices",
            service2_title: "Hotels",
            service2_desc: "Comfortable hotels worldwide",
            service3_title: "Excursions",
            service3_desc: "Exciting tours with professional guides",
            service4_title: "Visa Service",
            service4_desc: "Visa processing",
            service_why: "Why us?",
            service1_advantage_text: "Real-time prices, 500+ airlines, instant booking",
            service2_advantage_text: "50,000+ hotels, best prices, free cancellation",
            service3_advantage_text: "Local guides, personalized itineraries, 24/7 support",
            service4_advantage_text: "Fast visa processing, professional assistance, high success rate"
        }
    };
    function applyTranslations(lang) {
        var dict = i18n[lang] || i18n.uz;
        // Helper to check whether a user is currently authenticated (local-only check)
        function isAuthenticated() {
            try {
                var u = JSON.parse(localStorage.getItem('ketmon_user') || 'null');
                return !!(u && (u.name || u.email));
            } catch (e) {
                return false;
            }
        }

        // Get all elements with data-text attribute, process from deepest to shallowest
        // This ensures child elements are translated before parent elements
        var allElements = Array.from(document.querySelectorAll('[data-text]'));
        // Sort by depth (deepest first) to avoid overwriting child translations
        allElements.sort(function (a, b) {
            var depthA = 0, depthB = 0;
            var tempA = a, tempB = b;
            while (tempA.parentNode) { depthA++; tempA = tempA.parentNode; }
            while (tempB.parentNode) { depthB++; tempB = tempB.parentNode; }
            return depthB - depthA;
        });

        // Replace inner text for all [data-text] elements
        allElements.forEach(function (el) {
            var key = el.getAttribute('data-text');
            if (key && dict[key] !== undefined) {
                // Only update if this element doesn't have child elements with data-text
                // (to avoid overwriting child translations)
                var hasTranslatableChildren = Array.from(el.children).some(function (child) {
                    return child.hasAttribute('data-text') || child.querySelector('[data-text]') !== null;
                });

                if (!hasTranslatableChildren) {
                    // If the element represents phone/email and the user is NOT authenticated,
                    // show anonymized placeholders instead of real contact details.
                    if (!isAuthenticated() && (key === 'phone' || key === 'email')) {
                        if (key === 'phone') el.textContent = '*** *** ** **';
                        if (key === 'email') el.textContent = '***@******.uz';
                    } else {
                        el.textContent = dict[key];
                    }
                }
            }
        });

        // Replace placeholders for all elements declaring [data-placeholder]
        document.querySelectorAll('[data-placeholder]').forEach(function (el) {
            var key = el.getAttribute('data-placeholder');
            if (key && dict[key] !== undefined && 'placeholder' in el) {
                el.placeholder = dict[key];
            }
        });

        // Update select options
        document.querySelectorAll('select option[data-text]').forEach(function (option) {
            var key = option.getAttribute('data-text');
            if (key && dict[key] !== undefined) {
                option.textContent = dict[key];
            }
        });

        // Force update for header buttons specifically (in case they're in hidden containers)
        var headerBookBtns = document.querySelectorAll('header [data-text="nav_book"]');
        headerBookBtns.forEach(function (btn) {
            if (dict.nav_book) btn.textContent = dict.nav_book;
        });
    }

    function changeLang(lang) {
        // Update current language display
        var langCurrent = document.getElementById('langCurrent');
        if (langCurrent) {
            langCurrent.textContent = lang.toUpperCase();
        }

        // Update dropdown items
        var dropdownItems = document.querySelectorAll('.lang-dropdown-item');
        dropdownItems.forEach(function (item) {
            item.classList.remove('active');
            if (item.textContent.trim().toUpperCase() === lang.toUpperCase()) {
                item.classList.add('active');
            }
        });

        applyTranslations(lang);
        localStorage.setItem('ketmon_lang', lang);
    }

    function toggleLangDropdown(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
            // Prevent double-tap zoom on mobile
            if (e.touches && e.touches.length > 0) {
                e.preventDefault();
            }
        }
        var dropdown = document.getElementById('langDropdown');
        var selector = document.querySelector('.lang-selector');
        var icon = document.getElementById('langDropdownIcon');
        if (dropdown && selector) {
            var isOpen = dropdown.classList.contains('show');
            // Close currency dropdown if open
            var currencyDropdown = document.getElementById('currencyDropdown');
            if (currencyDropdown) currencyDropdown.classList.remove('show');
            var currencySelector = document.querySelector('.currency-selector');
            if (currencySelector) currencySelector.classList.remove('active');
            var currencyIcon = document.getElementById('currencyDropdownIcon');
            if (currencyIcon) currencyIcon.style.transform = 'rotate(0deg)';

            if (isOpen) {
                dropdown.classList.remove('show');
                selector.classList.remove('active');
                if (icon) icon.style.transform = 'rotate(0deg)';
            } else {
                dropdown.classList.add('show');
                selector.classList.add('active');
                if (icon) icon.style.transform = 'rotate(180deg)';
            }
        }
    }

    function closeLangDropdown() {
        var dropdown = document.getElementById('langDropdown');
        var selector = document.querySelector('.lang-selector');
        var icon = document.getElementById('langDropdownIcon');
        if (dropdown) dropdown.classList.remove('show');
        if (selector) selector.classList.remove('active');
        if (icon) icon.style.transform = 'rotate(0deg)';
    }

    function selectLang(lang, e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        // Update current language display
        var langCurrent = document.getElementById('langCurrent');
        if (langCurrent) {
            langCurrent.textContent = lang.toUpperCase();
        }

        // Remove active class from all dropdown items
        document.querySelectorAll('.lang-dropdown-item').forEach(function (btn) {
            btn.classList.remove('active');
        });

        // Add active class to selected item
        var items = document.querySelectorAll('.lang-dropdown-item');
        items.forEach(function (item) {
            if (item.textContent.trim() === lang.toUpperCase()) {
                item.classList.add('active');
            }
        });

        // Close dropdown
        closeLangDropdown();

        // Change language
        changeLang(lang);
    }

    window.changeLang = changeLang;
    window.toggleLangDropdown = toggleLangDropdown;
    window.closeLangDropdown = closeLangDropdown;
    window.selectLang = selectLang;
    window.applyTranslations = applyTranslations;
    window.i18n = i18n;

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        var langDropdown = document.getElementById('langDropdown');
        var langSelector = document.querySelector('.lang-selector');
        var langBtn = document.getElementById('langDropdownBtn');
        
        if (langDropdown && langSelector && langBtn) {
            // Check if click is outside the language selector
            if (!langSelector.contains(e.target) && !langBtn.contains(e.target)) {
                closeLangDropdown();
            }
        }
    });

    // Init language on load
    document.addEventListener('DOMContentLoaded', function () {
        var saved = localStorage.getItem('ketmon_lang') || 'uz';
        changeLang(saved);
        // Update display and active state
        var langCurrent = document.getElementById('langCurrent');
        if (langCurrent) langCurrent.textContent = saved.toUpperCase();
        var items = document.querySelectorAll('.lang-dropdown-item');
        items.forEach(function (item) {
            item.classList.remove('active');
            if (item.textContent.trim() === saved.toUpperCase()) {
                item.classList.add('active');
            }
        });
        
        // Ensure the button has proper event handling
        var langBtn = document.getElementById('langDropdownBtn');
        if (langBtn) {
            // Remove any existing onclick and add event listener
            langBtn.onclick = null;
            langBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                toggleLangDropdown(e);
            });
        }
    });
})();

// Currency switcher
(function () {
    // Exchange rates (approximate, update as needed)
    var exchangeRates = {
        usd: {
            sum: 12500,  // 1 USD = 12500 UZS
            rub: 90      // 1 USD = 90 RUB
        },
        rub: {
            sum: 139,    // 1 RUB = 139 UZS
            usd: 0.011   // 1 RUB = 0.011 USD
        },
        sum: {
            usd: 0.00008, // 1 UZS = 0.00008 USD
            rub: 0.0072   // 1 UZS = 0.0072 RUB
        }
    };

    // Store original prices in data attributes
    function initPrices() {
        document.querySelectorAll('.price').forEach(function (priceEl) {
            if (!priceEl.hasAttribute('data-original-price')) {
                var text = priceEl.textContent.trim();
                // Extract number from price (e.g., "$1,200" -> 1200)
                var match = text.match(/[\d,]+/);
                if (match) {
                    var num = parseFloat(match[0].replace(/,/g, ''));
                    priceEl.setAttribute('data-original-price', num);
                    priceEl.setAttribute('data-original-currency', 'usd');
                }
            }
        });
    }

    // Convert price based on currency
    function convertPrice(originalPrice, fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) return originalPrice;

        if (fromCurrency === 'usd') {
            if (toCurrency === 'sum') {
                return originalPrice * exchangeRates.usd.sum;
            } else if (toCurrency === 'rub') {
                return originalPrice * exchangeRates.usd.rub;
            }
        } else if (fromCurrency === 'rub') {
            if (toCurrency === 'sum') {
                return originalPrice * exchangeRates.rub.sum;
            } else if (toCurrency === 'usd') {
                return originalPrice * exchangeRates.rub.usd;
            }
        } else if (fromCurrency === 'sum') {
            if (toCurrency === 'usd') {
                return originalPrice * exchangeRates.sum.usd;
            } else if (toCurrency === 'rub') {
                return originalPrice * exchangeRates.sum.rub;
            }
        }
        return originalPrice;
    }

    // Format price with currency symbol
    function formatPrice(amount, currency) {
        var symbols = {
            usd: '$',
            rub: '₽',
            sum: 'so\'m'
        };
        var symbol = symbols[currency] || '';

        if (currency === 'sum') {
            // Format SUM with spaces (e.g., 15 000 000 so'm)
            return Math.round(amount).toLocaleString('uz-UZ').replace(/,/g, ' ') + ' ' + symbol;
        } else {
            // Format USD and RUB with commas
            return symbol + Math.round(amount).toLocaleString('en-US');
        }
    }

    // Update all prices on the page
    function updatePrices(currency) {
        document.querySelectorAll('.price').forEach(function (priceEl) {
            var originalPrice = parseFloat(priceEl.getAttribute('data-original-price'));
            var originalCurrency = priceEl.getAttribute('data-original-currency') || 'usd';

            if (!isNaN(originalPrice)) {
                var convertedPrice = convertPrice(originalPrice, originalCurrency, currency);
                priceEl.textContent = formatPrice(convertedPrice, currency);
            }
        });
    }

    function changeCurrency(currency) {
        var currencyMap = {
            'sum': 'SUM',
            'usd': 'USD',
            'rub': 'RUB'
        };

        // Update current currency display
        var currencyCurrent = document.getElementById('currencyCurrent');
        if (currencyCurrent) {
            currencyCurrent.textContent = currencyMap[currency] || 'SUM';
        }

        // Update dropdown items
        var dropdownItems = document.querySelectorAll('.currency-dropdown-item');
        dropdownItems.forEach(function (item) {
            item.classList.remove('active');
            if (item.textContent.trim() === currencyMap[currency]) {
                item.classList.add('active');
            }
        });

        initPrices();
        updatePrices(currency);
        localStorage.setItem('ketmon_currency', currency);
    }

    function toggleCurrencyDropdown(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
            // Prevent double-tap zoom on mobile
            if (e.touches && e.touches.length > 0) {
                e.preventDefault();
            }
        }
        var dropdown = document.getElementById('currencyDropdown');
        var selector = document.querySelector('.currency-selector');
        var icon = document.getElementById('currencyDropdownIcon');
        if (dropdown && selector) {
            var isOpen = dropdown.classList.contains('show');
            // Close language dropdown if open
            var langDropdown = document.getElementById('langDropdown');
            if (langDropdown) langDropdown.classList.remove('show');
            var langSelector = document.querySelector('.lang-selector');
            if (langSelector) langSelector.classList.remove('active');
            var langIcon = document.getElementById('langDropdownIcon');
            if (langIcon) langIcon.style.transform = 'rotate(0deg)';

            if (isOpen) {
                dropdown.classList.remove('show');
                selector.classList.remove('active');
                if (icon) icon.style.transform = 'rotate(0deg)';
            } else {
                dropdown.classList.add('show');
                selector.classList.add('active');
                if (icon) icon.style.transform = 'rotate(180deg)';
            }
        }
    }

    function closeCurrencyDropdown() {
        var dropdown = document.getElementById('currencyDropdown');
        var selector = document.querySelector('.currency-selector');
        var icon = document.getElementById('currencyDropdownIcon');
        if (dropdown) dropdown.classList.remove('show');
        if (selector) selector.classList.remove('active');
        if (icon) icon.style.transform = 'rotate(0deg)';
    }

    function selectCurrency(curr, e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        // Update current currency display
        var currencyCurrent = document.getElementById('currencyCurrent');
        if (currencyCurrent) {
            currencyCurrent.textContent = curr.toUpperCase();
        }

        // Remove active class from all dropdown items
        document.querySelectorAll('.currency-dropdown-item').forEach(function (btn) {
            btn.classList.remove('active');
        });

        // Add active class to selected item
        var items = document.querySelectorAll('.currency-dropdown-item');
        items.forEach(function (item) {
            if (item.textContent.trim() === curr.toUpperCase()) {
                item.classList.add('active');
            }
        });

        // Close dropdown
        closeCurrencyDropdown();

        // Update currency via existing function
        if (typeof changeCurrency === 'function') {
            changeCurrency(curr);
        }
    }

    // Make functions globally accessible
    window.changeCurrency = changeCurrency;
    window.toggleCurrencyDropdown = toggleCurrencyDropdown;
    window.closeCurrencyDropdown = closeCurrencyDropdown;
    window.selectCurrency = selectCurrency;

    // Close dropdowns when clicking outside
    document.addEventListener('click', function (e) {
        var langSelector = document.querySelector('.lang-selector');
        var langDropdown = document.getElementById('langDropdown');
        var currencySelector = document.querySelector('.currency-selector');
        var currencyDropdown = document.getElementById('currencyDropdown');
        var userAccountSelector = document.querySelector('.user-account-selector');
        var userAccountDropdown = document.getElementById('userAccountDropdown');

        if (langSelector && langDropdown) {
            if (!langSelector.contains(e.target) && langDropdown.classList.contains('show')) {
                closeLangDropdown();
            }
        }

        if (currencySelector && currencyDropdown) {
            if (!currencySelector.contains(e.target) && currencyDropdown.classList.contains('show')) {
                closeCurrencyDropdown();
            }
        }

        if (userAccountSelector && userAccountDropdown) {
            if (!userAccountSelector.contains(e.target) && userAccountDropdown.classList.contains('show')) {
                closeUserAccountDropdown();
            }
        }
    });
    
    // User Account Dropdown Functions
    function toggleUserAccountDropdown(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        var dropdown = document.getElementById('userAccountDropdown');
        var selector = document.querySelector('.user-account-selector');
        if (dropdown && selector) {
            var isOpen = dropdown.classList.contains('show');
            // Close other dropdowns if open
            var langDropdown = document.getElementById('langDropdown');
            if (langDropdown) langDropdown.classList.remove('show');
            var langSelector = document.querySelector('.lang-selector');
            if (langSelector) langSelector.classList.remove('active');
            var currencyDropdown = document.getElementById('currencyDropdown');
            if (currencyDropdown) currencyDropdown.classList.remove('show');
            var currencySelector = document.querySelector('.currency-selector');
            if (currencySelector) currencySelector.classList.remove('active');
            
            if (isOpen) {
                dropdown.classList.remove('show');
                selector.classList.remove('active');
            } else {
                // Show dropdown first, then add show class for animation
                dropdown.style.display = 'flex';
                // Force reflow
                dropdown.offsetHeight;
                // Add show class for animation
                setTimeout(function() {
                    dropdown.classList.add('show');
                    selector.classList.add('active');
                }, 10);
            }
        }
    }

    function closeUserAccountDropdown() {
        var dropdown = document.getElementById('userAccountDropdown');
        var selector = document.querySelector('.user-account-selector');
        if (dropdown) {
            dropdown.classList.remove('show');
            // Hide after animation completes
            setTimeout(function() {
                if (!dropdown.classList.contains('show')) {
                    dropdown.style.display = 'none';
                }
            }, 300);
        }
        if (selector) selector.classList.remove('active');
    }

    // Make functions globally accessible
    window.toggleUserAccountDropdown = toggleUserAccountDropdown;
    window.closeUserAccountDropdown = closeUserAccountDropdown;

    // Init currency on load
    document.addEventListener('DOMContentLoaded', function () {
        initPrices();
        var saved = localStorage.getItem('ketmon_currency') || 'sum';
        changeCurrency(saved);
        // Update display and active state
        var currencyCurrent = document.getElementById('currencyCurrent');
        if (currencyCurrent) currencyCurrent.textContent = saved.toUpperCase();
        var items = document.querySelectorAll('.currency-dropdown-item');
        items.forEach(function (item) {
            item.classList.remove('active');
            if (item.textContent.trim() === saved.toUpperCase()) {
                item.classList.add('active');
            }
        });
    });
})();

/* Removed mobile navigation toggle */

// Search button interaction
(function () {
    var btn = document.querySelector('.search-btn');
    if (!btn) return;
    btn.addEventListener('click', function () {
        var destination = document.querySelector('[data-placeholder=\"search_destination_placeholder\"]')?.value || '';
        var date = document.querySelector('.search-input input[type=\"date\"]')?.value || '';
        var duration = document.querySelectorAll('.search-input select')[0]?.value || '';
        var guests = document.querySelectorAll('.search-input select')[1]?.value || '';
        console.log('Search:', { destination, date, duration, guests });
        // Navigate to destinations
        var dest = document.getElementById('destinations');
        if (dest) {
            const header = document.querySelector('.main-header');
            const headerHeight = header ? header.offsetHeight : 80;
            smoothScrollTo(dest, headerHeight, 600);
        }
    });
})();

// Tour Modal functionality
(function () {
    var modal = document.getElementById('tourModal');
    var closeBtn = document.getElementById('tourModalClose');
    var titleEl = document.getElementById('tourModalTitle');
    var imgEl = document.getElementById('tourModalImage');
    var descEl = document.getElementById('tourModalDescription');
    var metaEl = document.getElementById('tourModalMeta');
    var bookBtn = document.getElementById('tourBookBtn');

    function openModal() {
        if (!modal) modal = document.getElementById('tourModal');
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    function closeModal() {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) closeModal();
        });
    }
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });

    // Delegated handler so it works for dynamically cloned cards
    function handleCard(card) {
        var titleNode = card.querySelector('.destination-title');
        var descNode = card.querySelector('.destination-desc');
        var priceNode = card.querySelector('.price');
        var badgeNode = card.querySelector('.destination-badge');
        var imgNode = card.querySelector('.destination-img img');

        var title = (titleNode ? titleNode.textContent : 'Tour').trim();
        var desc = (descNode ? descNode.textContent : 'Tour description').trim();
        var price = (priceNode ? priceNode.textContent : '').trim();
        var badge = (badgeNode ? badgeNode.textContent : '').trim();
        var agencyValue = card.getAttribute('data-agency');
        var agencyNameEl = document.querySelector('.agency-card[data-agency="' + agencyValue + '"] h3');
        var agencyName = agencyNameEl ? agencyNameEl.textContent.trim() : '';
        var imgSrc = imgNode ? imgNode.getAttribute('src') : '';

        titleEl.textContent = title;
        descEl.textContent = desc + (price ? ' • ' + price : '');
        metaEl.innerHTML = '';
        if (badge) {
            var chip = document.createElement('span');
            chip.className = 'meta-chip';
            chip.textContent = badge;
            metaEl.appendChild(chip);
        }
        if (price) {
            var chip2 = document.createElement('span');
            chip2.className = 'meta-chip';
            chip2.textContent = price;
            metaEl.appendChild(chip2);
        }
        if (agencyName) {
            var chip3 = document.createElement('span');
            chip3.className = 'meta-chip';
            chip3.textContent = agencyName;
            metaEl.appendChild(chip3);
        }
        if (imgSrc) {
            imgEl.src = imgSrc;
            imgEl.alt = title + ' image';
        } else {
            imgEl.src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop';
            imgEl.alt = 'Tour image';
        }

        // Booking button opens payment modal
        bookBtn.onclick = function () {
            window.currentTourBooking = {
                title: title,
                price: price,
                description: desc,
                agency: agencyName,
                image: imgSrc || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop'
            };
            closeModal();
            var paymentModal = document.getElementById('paymentModal');
            if (paymentModal) {
                var paymentTourName = document.getElementById('paymentTourName');
                var paymentTourPrice = document.getElementById('paymentTourPrice');
                if (paymentTourName) paymentTourName.textContent = title;
                if (paymentTourPrice) paymentTourPrice.textContent = price || 'Narx aniqlanmoqda';
                paymentModal.classList.add('open');
                document.body.style.overflow = 'hidden';
            }
        };

        openModal();
    }

    var destGrid = document.querySelector('.destinations .destination-grid');
    if (destGrid) {
        destGrid.addEventListener('click', function (e) {
            var card = e.target.closest('.destination-card');
            if (!card || !destGrid.contains(card)) return;
            handleCard(card);
        });
    }
})();

/* Repeat "Popular Destinations" horizontally on demand so users can keep scrolling on mobile */
(function () {
    var grid = document.querySelector('.destinations .destination-grid');
    if (!grid) return;
    var originals = Array.prototype.slice.call(grid.querySelectorAll('.destination-card'));
    if (!originals.length) return;

    function appendBatch() {
        var frag = document.createDocumentFragment();
        for (var i = 0; i < originals.length; i++) {
            frag.appendChild(originals[i].cloneNode(true));
        }
        grid.appendChild(frag);
    }

    function ensureLength() {
        var rounds = 0;
        while (grid.scrollWidth < grid.clientWidth * 3 && rounds < 4) {
            appendBatch();
            rounds++;
        }
    }

    function maybeExtend() {
        var remaining = grid.scrollWidth - (grid.scrollLeft + grid.clientWidth);
        if (remaining < 80) {
            appendBatch();
        }
    }

    function enable() {
        ensureLength();
        grid.addEventListener('scroll', maybeExtend, { passive: true });
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        enable();
    } else {
        document.addEventListener('DOMContentLoaded', enable);
    }
    window.addEventListener('resize', ensureLength);
})();

/* Scroll by 4 destinations at a time */
(function () {
    var grid = document.querySelector('.destinations .destination-grid');
    if (!grid) return;

    var isScrolling = false;
    var scrollTimeout = null;
    var cardWidth = 320; // Card width in pixels
    var gap = 25; // Gap between cards in pixels
    var cardsPerScroll = 4; // Number of cards to scroll at once
    var scrollDistance = (cardWidth * cardsPerScroll) + (gap * (cardsPerScroll - 1)); // 1355px for 4 cards

    // Calculate the nearest snap position for a group of 4 cards
    function getNearestSnapPosition(currentScroll) {
        // Calculate which group of 4 we're closest to
        var groupIndex = Math.round(currentScroll / scrollDistance);
        return groupIndex * scrollDistance;
    }

    // Handle wheel scroll events
    function handleWheelScroll(e) {
        // Only handle horizontal scrolling
        if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
            return; // Vertical scroll, let it pass through
        }

        // Prevent default horizontal scroll
        e.preventDefault();

        if (isScrolling) return;

        var currentScroll = grid.scrollLeft;
        var direction = e.deltaX > 0 ? 1 : -1; // 1 for right, -1 for left
        var targetScroll = currentScroll + (direction * scrollDistance);

        // Clamp to valid scroll range
        var maxScroll = grid.scrollWidth - grid.clientWidth;
        targetScroll = Math.max(0, Math.min(targetScroll, maxScroll));

        // Snap to nearest group of 4
        targetScroll = getNearestSnapPosition(targetScroll);

        // Smooth scroll to target position
        isScrolling = true;
        grid.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
        });

        // Reset scrolling flag after animation
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(function () {
            isScrolling = false;
        }, 500);
    }

    // Handle touch/swipe scrolling
    var touchStartX = 0;
    var touchStartScroll = 0;
    var isTouching = false;

    function handleTouchStart(e) {
        touchStartX = e.touches[0].clientX;
        touchStartScroll = grid.scrollLeft;
        isTouching = true;
    }

    function handleTouchEnd(e) {
        if (!isTouching) return;
        isTouching = false;

        var touchEndX = e.changedTouches[0].clientX;
        var deltaX = touchStartX - touchEndX;
        var minSwipeDistance = 50; // Minimum swipe distance to trigger scroll

        if (Math.abs(deltaX) < minSwipeDistance) {
            // Small swipe, snap to nearest group
            var currentScroll = grid.scrollLeft;
            var targetScroll = getNearestSnapPosition(currentScroll);
            grid.scrollTo({
                left: targetScroll,
                behavior: 'smooth'
            });
        } else {
            // Large swipe, scroll by 4 cards in swipe direction
            var direction = deltaX > 0 ? 1 : -1;
            var currentScroll = grid.scrollLeft;
            var targetScroll = currentScroll + (direction * scrollDistance);
            var maxScroll = grid.scrollWidth - grid.clientWidth;
            targetScroll = Math.max(0, Math.min(targetScroll, maxScroll));
            targetScroll = getNearestSnapPosition(targetScroll);

            grid.scrollTo({
                left: targetScroll,
                behavior: 'smooth'
            });
        }
    }

    // Handle scroll end to snap to nearest group of 4
    function handleScrollEnd() {
        if (isScrolling) return;

        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(function () {
            var currentScroll = grid.scrollLeft;
            var targetScroll = getNearestSnapPosition(currentScroll);
            
            // Only snap if we're not already at a snap position (within 10px tolerance)
            if (Math.abs(currentScroll - targetScroll) > 10) {
                grid.scrollTo({
                    left: targetScroll,
                    behavior: 'smooth'
                });
            }
        }, 150);
    }

    // Add event listeners
    grid.addEventListener('wheel', handleWheelScroll, { passive: false });
    grid.addEventListener('touchstart', handleTouchStart, { passive: true });
    grid.addEventListener('touchend', handleTouchEnd, { passive: true });
    grid.addEventListener('scroll', handleScrollEnd, { passive: true });

    // Also handle mouse drag scrolling
    var isMouseDown = false;
    var mouseStartX = 0;
    var mouseStartScroll = 0;

    grid.addEventListener('mousedown', function (e) {
        isMouseDown = true;
        mouseStartX = e.clientX;
        mouseStartScroll = grid.scrollLeft;
    });

    document.addEventListener('mousemove', function (e) {
        if (!isMouseDown) return;
        var deltaX = mouseStartX - e.clientX;
        grid.scrollLeft = mouseStartScroll + deltaX;
    });

    document.addEventListener('mouseup', function () {
        if (isMouseDown) {
            isMouseDown = false;
            handleScrollEnd();
        }
    });
})();

// Agency filter interactions
(function () {
    var agencySelect = document.getElementById('agencyFilter');
    var tourCards = Array.from(document.querySelectorAll('.destination-card'));
    var agencyTypeButtons = Array.from(document.querySelectorAll('.agency-toolbar button'));
    var currentAgency = 'all';
    var currentType = 'all';

    function syncToolbar() {
        agencyTypeButtons.forEach(function (btn) {
            btn.classList.toggle('active', (btn.getAttribute('data-filter') || 'all') === currentType);
        });
    }

    function applyFilter() {
        // Filter tours
        tourCards.forEach(function (card) {
            var agency = card.getAttribute('data-agency');
            var type = card.getAttribute('data-type') || 'all';
            var agencyMatch = currentAgency === 'all' || agency === currentAgency;
            var typeMatch = currentType === 'all' || type === currentType;
            var shouldShow = agencyMatch && typeMatch;
            card.classList.toggle('hidden', !shouldShow);
        });

        // Filter agencies (query current cards to include any clones)
        var allAgencyCards = Array.from(document.querySelectorAll('.agency-card'));
        allAgencyCards.forEach(function (card) {
            var agency = card.getAttribute('data-agency');
            var type = card.getAttribute('data-type') || 'all';
            var typeAllowed = currentType === 'all' || type === currentType;
            var agencyMatch = currentAgency === 'all' || agency === currentAgency;
            var shouldShow = typeAllowed && (currentAgency === 'all' || agencyMatch);
            card.classList.toggle('hidden', !shouldShow);
            card.classList.toggle('active', agencyMatch);
        });
    }

    if (agencySelect) {
        agencySelect.addEventListener('change', function () {
            currentAgency = agencySelect.value || 'all';
            applyFilter();
        });
        currentAgency = agencySelect.value || 'all';
    }

    agencyTypeButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            currentType = btn.getAttribute('data-filter') || 'all';
            currentAgency = 'all';
            if (agencySelect) agencySelect.value = 'all';
            syncToolbar();
            applyFilter();
        });
    });

    // Per-card click for existing cards (kept)
    Array.from(document.querySelectorAll('.agency-card')).forEach(function (card) {
        card.addEventListener('click', function () {
            var value = card.getAttribute('data-agency');
            var type = card.getAttribute('data-type') || 'all';
            currentAgency = value;
            currentType = type;
            if (agencySelect) {
                agencySelect.value = value;
            }
            syncToolbar();
            applyFilter();
            var destEl = document.getElementById('destinations');
            if (destEl) {
                const header = document.querySelector('.main-header');
                const headerHeight = header ? header.offsetHeight : 80;
                smoothScrollTo(destEl, headerHeight, 600);
            }
        });
    });

    // Delegated click so cloned cards behave the same
    var agencyGrid = document.querySelector('.agency-section .agency-grid');
    if (agencyGrid) {
        agencyGrid.addEventListener('click', function (e) {
            var card = e.target.closest('.agency-card');
            if (!card || !agencyGrid.contains(card)) return;
            var value = card.getAttribute('data-agency');
            var type = card.getAttribute('data-type') || 'all';
            currentAgency = value;
            currentType = type;
            if (agencySelect) agencySelect.value = value;
            syncToolbar();
            applyFilter();
            var destEl = document.getElementById('destinations');
            if (destEl) {
                const header = document.querySelector('.main-header');
                const headerHeight = header ? header.offsetHeight : 80;
                smoothScrollTo(destEl, headerHeight, 600);
            }
        });
    }

    // Initialize filter state
    if (agencyTypeButtons.length) {
        var defaultBtn = agencyTypeButtons.find(function (btn) { return btn.classList.contains('active'); }) || agencyTypeButtons[0];
        currentType = defaultBtn ? defaultBtn.getAttribute('data-filter') || 'all' : 'all';
        syncToolbar();
    }
    applyFilter();
})();

/* Infinite horizontal scroll for Agency grid (Hamkor Agentliklar) */
(function () {
    var grid = document.querySelector('.agency-section .agency-grid');
    if (!grid) return;
    var originals = Array.prototype.slice.call(grid.querySelectorAll('.agency-card'));
    if (!originals.length) return;

    function appendBatch() {
        var frag = document.createDocumentFragment();
        for (var i = 0; i < originals.length; i++) {
            frag.appendChild(originals[i].cloneNode(true));
        }
        grid.appendChild(frag);
    }

    function ensureLength() {
        var rounds = 0;
        while (grid.scrollWidth < grid.clientWidth * 3 && rounds < 4) {
            appendBatch();
            rounds++;
        }
    }

    function maybeExtend() {
        var remaining = grid.scrollWidth - (grid.scrollLeft + grid.clientWidth);
        if (remaining < 80) appendBatch();
    }

    function enable() {
        ensureLength();
        grid.addEventListener('scroll', maybeExtend, { passive: true });
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        enable();
    } else {
        document.addEventListener('DOMContentLoaded', enable);
    }
    window.addEventListener('resize', ensureLength);
})();

// Payment Modal functionality
// Payment Modal functionality
(function () {
    var paymentModal = document.getElementById('paymentModal');
    var paymentCloseBtn = document.getElementById('paymentModalClose');
    var paymentCancelBtn = document.getElementById('paymentCancel');
    var paymentForm = document.getElementById('paymentForm');
    var cardNumberInput = document.getElementById('paymentCardNumber');
    var expiryInput = document.getElementById('paymentExpiry');
    var cvvInput = document.getElementById('paymentCVV');

    function openPaymentModal() {
        paymentModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closePaymentModal() {
        paymentModal.classList.remove('open');
        document.body.style.overflow = '';
        paymentForm.reset();
    }

    // Close handlers
    if (paymentCloseBtn) {
        paymentCloseBtn.addEventListener('click', closePaymentModal);
    }
    if (paymentCancelBtn) {
        paymentCancelBtn.addEventListener('click', closePaymentModal);
    }
    if (paymentModal) {
        paymentModal.addEventListener('click', function (e) {
            if (e.target === paymentModal) closePaymentModal();
        });
    }
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && paymentModal.classList.contains('open')) {
            closePaymentModal();
        }
    });

    // Format card number (add spaces every 4 digits)
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function (e) {
            var value = e.target.value.replace(/\s/g, '');
            var formatted = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formatted;
        });
    }

    // Format expiry date (MM/YY)
    if (expiryInput) {
        expiryInput.addEventListener('input', function (e) {
            var value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }

    // Only allow numbers for CVV
    if (cvvInput) {
        cvvInput.addEventListener('input', function (e) {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }

    // Handle form submission
    if (paymentForm) {
        paymentForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Get form data
            var formData = {
                name: document.getElementById('paymentName').value,
                email: document.getElementById('paymentEmail').value,
                phone: document.getElementById('paymentPhone').value,
                cardNumber: document.getElementById('paymentCardNumber').value.replace(/\s/g, ''),
                expiry: document.getElementById('paymentExpiry').value,
                cvv: document.getElementById('paymentCVV').value,
                address: document.getElementById('paymentAddress').value,
                tour: window.currentTourBooking || {}
            };

            console.log('Payment submitted:', formData);

            // Simulate payment processing
            var submitBtn = paymentForm.querySelector('button[type="submit"]');
            var originalText = submitBtn.textContent;
            submitBtn.textContent = 'To\'lov amalga oshirilmoqda...';
            submitBtn.disabled = true;

            // Simulate API call
            setTimeout(function () {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;

                // Show success message
                alert('To\'lov muvaffaqiyatli amalga oshirildi! Batafsil ma\'lumot email orqali yuboriladi.');

                // Close modal and reset form
                closePaymentModal();

                // Optional: Redirect or show confirmation
                // window.location.href = '/confirmation';
            }, 2000);
        });
    }

    // Make openPaymentModal available globally if needed
    window.openPaymentModal = openPaymentModal;
    window.closePaymentModal = closePaymentModal;
})();

// Header CTAs interactions
(function () {
    var book = document.querySelector('header [data-text=\"nav_book\"]');

    if (book) book.addEventListener('click', function (e) {
        // Scroll to search section as a booking entry point
        var anchor = document.getElementById('search');
        if (anchor) {
            e.preventDefault();
            const header = document.querySelector('.main-header');
            const headerHeight = header ? header.offsetHeight : 80;
            smoothScrollTo(anchor, headerHeight, 600);
        }
    });
    // Open login/register modals
    var loginModal = document.getElementById('loginModal');
    var registerModal = document.getElementById('registerModal');
    function open(el) { el.classList.add('open'); document.body.style.overflow = 'hidden'; }
    function close(el) { el.classList.remove('open'); document.body.style.overflow = ''; }

    // Update header actions according to auth state
    function updateHeaderAuth() {
        var acc = document.getElementById('accountLink');
        var logoutBtn = document.getElementById('logoutBtn');
        var loginBtn = document.getElementById('topBarLoginBtn');
        var regBtn = document.getElementById('topBarRegisterBtn');
        // Mobile menu buttons
        var mobileAcc = document.getElementById('mobileAccountLink');
        var mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
        var mobileLoginBtn = document.getElementById('mobileLoginBtn');
        var mobileRegBtn = document.getElementById('mobileRegisterBtn');
        // User account dropdown buttons
        var userAcc = document.getElementById('userAccountLink');
        var userLogoutBtn = document.getElementById('userAccountLogoutBtn');
        var userLoginBtn = document.getElementById('userAccountLoginBtn');
        var userRegBtn = document.getElementById('userAccountRegisterBtn');
        var user = null;
        try { user = JSON.parse(localStorage.getItem('ketmon_user') || 'null'); } catch (e) { }
        if (user && (user.name || user.email)) {
            if (acc) {
                acc.style.display = 'inline-flex';
                acc.textContent = user.name ? (user.name.split(' ')[0]) : 'Profil';
            }
            if (logoutBtn) logoutBtn.style.display = 'inline-flex';
            if (loginBtn) loginBtn.style.display = 'none';
            if (regBtn) regBtn.style.display = 'none';
            // Update mobile menu
            if (mobileAcc) {
                mobileAcc.style.display = 'block';
                mobileAcc.textContent = user.name ? (user.name.split(' ')[0]) : 'Profil';
            }
            if (mobileLogoutBtn) mobileLogoutBtn.style.display = 'block';
            if (mobileLoginBtn) mobileLoginBtn.style.display = 'none';
            if (mobileRegBtn) mobileRegBtn.style.display = 'none';
            // Update user account dropdown
            if (userAcc) {
                userAcc.style.display = 'block';
                userAcc.textContent = user.name ? (user.name.split(' ')[0]) : 'Profil';
            }
            if (userLogoutBtn) userLogoutBtn.style.display = 'block';
            if (userLoginBtn) userLoginBtn.style.display = 'none';
            if (userRegBtn) userRegBtn.style.display = 'none';
        } else {
            if (acc) acc.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (loginBtn) loginBtn.style.display = '';
            if (regBtn) regBtn.style.display = '';
            // Update mobile menu
            if (mobileAcc) mobileAcc.style.display = 'none';
            if (mobileLogoutBtn) mobileLogoutBtn.style.display = 'none';
            if (mobileLoginBtn) mobileLoginBtn.style.display = 'block';
            if (mobileRegBtn) mobileRegBtn.style.display = 'block';
            // Update user account dropdown
            if (userAcc) userAcc.style.display = 'none';
            if (userLogoutBtn) userLogoutBtn.style.display = 'none';
            if (userLoginBtn) userLoginBtn.style.display = 'block';
            if (userRegBtn) userRegBtn.style.display = 'block';
        }
    }

    // Logout function - clears auth data and updates header
    window.logout = function () {
        try {
            localStorage.removeItem('ketmon_user');
            localStorage.removeItem('ketmon_token');
            localStorage.removeItem('ketmon_avatar');
            localStorage.removeItem('ketmon_agency');
        } catch (e) {
            console.error('Logout error:', e);
        }
        updateHeaderAuth();
        // If on profile page, redirect to home
        if (window.location.pathname.includes('profile.html')) {
            window.location.href = 'index.html';
        }
    };
    document.addEventListener('DOMContentLoaded', updateHeaderAuth);
    updateHeaderAuth();

    // Add event listeners to all login/register buttons (top bar only)
    var topBarLoginBtn = document.getElementById('topBarLoginBtn');
    var topBarRegisterBtn = document.getElementById('topBarRegisterBtn');

    // Note: topBarLoginBtn handler will be updated later to include saved account functionality
    if (topBarLoginBtn) {
        topBarLoginBtn.addEventListener('click', function (e) { e.preventDefault(); open(loginModal); });
    }
    if (topBarRegisterBtn) {
        topBarRegisterBtn.addEventListener('click', function (e) { e.preventDefault(); open(registerModal); });
    }

    // Mobile menu login/register buttons
    var mobileLoginBtn = document.getElementById('mobileLoginBtn');
    var mobileRegisterBtn = document.getElementById('mobileRegisterBtn');
    if (mobileLoginBtn) {
        mobileLoginBtn.addEventListener('click', function (e) { e.preventDefault(); open(loginModal); });
    }
    if (mobileRegisterBtn) {
        mobileRegisterBtn.addEventListener('click', function (e) { e.preventDefault(); open(registerModal); });
    }
    
    // User account dropdown login/register buttons
    var userAccountLoginBtn = document.getElementById('userAccountLoginBtn');
    var userAccountRegisterBtn = document.getElementById('userAccountRegisterBtn');
    var loginModal = document.getElementById('loginModal');
    var registerModal = document.getElementById('registerModal');
    
    if (userAccountLoginBtn) {
        userAccountLoginBtn.addEventListener('click', function (e) { 
            e.preventDefault(); 
            e.stopPropagation();
            closeUserAccountDropdown();
            if (loginModal) {
                setTimeout(function() {
                    loginModal.classList.add('open');
                    document.body.style.overflow = 'hidden';
                }, 100);
            }
        });
    }
    if (userAccountRegisterBtn) {
        userAccountRegisterBtn.addEventListener('click', function (e) { 
            e.preventDefault(); 
            e.stopPropagation();
            closeUserAccountDropdown();
            if (registerModal) {
                setTimeout(function() {
                    registerModal.classList.add('open');
                    document.body.style.overflow = 'hidden';
                }, 100);
            }
        });
    }

    const hamburgerBtn = document.getElementById('hamburgerBtn');
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            var mobileNav = document.getElementById('mobileNav');
            if (mobileNav) {
                var isOpen = mobileNav.classList.contains('open');
                if (isOpen) {
                    // Close menu
                    mobileNav.classList.remove('open');
                    mobileNav.setAttribute('aria-hidden', 'true');
                    hamburgerBtn.classList.remove('active');
                    document.body.style.overflow = '';
                } else {
                    // Open menu
                    mobileNav.classList.add('open');
                    mobileNav.setAttribute('aria-hidden', 'false');
                    hamburgerBtn.classList.add('active');
                    document.body.style.overflow = 'hidden';
                    // adjust panel top to match header height
                    // var panel = mobileNav.querySelector('.mobile-nav-panel');
                    // try {
                    //     var hdr = document.querySelector('.main-header');
                    //     if (panel && hdr) panel.style.top = (hdr.offsetHeight || 64) + 'px';
                    // } catch (e) {}
                }
            }
        });
    }

    // Hamburger menu toggle functions
    // window.toggleMobileMenu = function(e) {
    //     if (e) {
    //         e.preventDefault();
    //         e.stopPropagation();
    //     }
    //     var mobileNav = document.getElementById('mobileNav');
    //     var hamburgerBtn = document.getElementById('hamburgerBtn');
    //     if (mobileNav && hamburgerBtn) {
    //         var isOpen = mobileNav.classList.contains('open');
    //         if (isOpen) {
    //             // Close menu
    //             mobileNav.classList.remove('open');
    //             mobileNav.setAttribute('aria-hidden', 'true');
    //             hamburgerBtn.classList.remove('active');
    //             document.body.style.overflow = '';
    //             // Remove backdrop
    //             setTimeout(function() {
    //                 if (!mobileNav.classList.contains('open')) {
    //                     mobileNav.style.display = 'none';
    //                 }
    //             }, 300);
    //         } else {
    //             // Open menu
    //             mobileNav.style.display = 'block';
    //             setTimeout(function() {
    //                 mobileNav.classList.add('open');
    //                 mobileNav.setAttribute('aria-hidden', 'false');
    //                 hamburgerBtn.classList.add('active');
    //                 document.body.style.overflow = 'hidden';
    //             }, 10);
    //         }
    //     }
    // };

    // window.closeMobileMenu = function() {
    //     var mobileNav = document.getElementById('mobileNav');
    //     var hamburgerBtn = document.getElementById('hamburgerBtn');
    //     if (mobileNav && hamburgerBtn) {
    //         mobileNav.classList.remove('open');
    //         mobileNav.setAttribute('aria-hidden', 'true');
    //         hamburgerBtn.classList.remove('active');
    //         document.body.style.overflow = '';
    //         // Remove backdrop after animation
    //         setTimeout(function() {
    //             if (!mobileNav.classList.contains('open')) {
    //                 mobileNav.style.display = 'none';
    //             }
    //         }, 300);
    //     }
    // };

    // // Close mobile menu when clicking on backdrop or outside
    // document.addEventListener('click', function(e) {
    //     var mobileNav = document.getElementById('mobileNav');
    //     var hamburgerBtn = document.getElementById('hamburgerBtn');
    //     var mobileNavList = mobileNav && mobileNav.querySelector('.mobile-nav-list');
    //     if (mobileNav && hamburgerBtn && mobileNav.classList.contains('open')) {
    //         // Close if clicking on backdrop (mobile-nav but not on the list) or outside
    //         if (mobileNav === e.target || (!mobileNavList.contains(e.target) && !hamburgerBtn.contains(e.target))) {
    //             window.closeMobileMenu();
    //         }
    //     }
    // });

    // // Add touch event listener for hamburger button (mobile support)
    // document.addEventListener('DOMContentLoaded', function() {
    //     var hamburgerBtn = document.getElementById('hamburgerBtn');
    //     if (hamburgerBtn) {
    //         // Use click event instead of touchstart to avoid conflicts
    //         hamburgerBtn.addEventListener('click', function(e) {
    //             e.preventDefault();
    //             e.stopPropagation();
    //             window.toggleMobileMenu(e);
    //         });
    //     }
    // });

    // Mobile menu toggle: clone desktop nav into mobile panel and handle open/close
    var mobileToggle = document.getElementById('mobileMenuToggle');
    var mobileNav = document.getElementById('mobileNav');
    var mobileNavList = mobileNav && mobileNav.querySelector('.mobile-nav-list');

    function closeMobileNav() {
        if (mobileNav) {
            document.body.style.overflow = '';
            if (mobileToggle) mobileToggle.classList.remove('active');
            mobileNav.classList.remove('open');
            mobileNav.setAttribute('aria-hidden', 'true');
            if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
            // allow body scroll again
            document.body.classList.remove('no-scroll');
        }
    }

    function openMobileNav() {
        if (mobileNav) {
            mobileNav.classList.add('open');
            mobileNav.setAttribute('aria-hidden', 'false');
            if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'true');
            // prevent page scroll while menu is open
            document.body.classList.add('no-scroll');
            // adjust panel top to match header height
            var panel = mobileNav.querySelector('.mobile-nav-panel');
            try {
                var hdr = document.querySelector('.main-header');
                if (panel && hdr) panel.style.top = (hdr.offsetHeight || 64) + 'px';
            } catch (e) { }
        }
    }

    function toggleMobileNav(e) {
        if (!mobileNav) return;
        var isOpen = mobileNav.classList.contains('open');
        if (isOpen) closeMobileNav(); else openMobileNav();
    }

    if (mobileToggle && mobileNavList) {
        // Generate mobile nav links from desktop nav
        var desktopNav = document.querySelector('.desktop-nav ul');
        if (desktopNav) {
            mobileNavList.innerHTML = desktopNav.innerHTML;
            // Remove any tooltips or desktop-specific attributes
            mobileNavList.querySelectorAll('[data-text]').forEach(function (el) { el.removeAttribute('data-text'); });
        }
        mobileToggle.addEventListener('click', function (e) {
            e.stopPropagation(); toggleMobileNav(e);
            mobileToggle.setAttribute('aria-expanded', mobileNav.classList.contains('open') ? 'true' : 'false');
        });

        // Backdrop click closes menu
        var mobileNavBackdrop = document.querySelector('.mobile-nav-backdrop');
        if (mobileNavBackdrop) {
            mobileNavBackdrop.addEventListener('click', function () { closeMobileNav(); });
        }

        // Close mobile nav when clicking a nav link
        mobileNavList.addEventListener('click', function (e) {
            var a = e.target.closest('a');
            if (a) { closeMobileNav(); }
        });

        // Close when clicking outside
        document.addEventListener('click', function (e) {
            if (!mobileNav.contains(e.target) && !mobileToggle.contains(e.target)) {
                closeMobileNav();
            }
        });

        // Close on resize to larger screens
        window.addEventListener('resize', function () {
            if (window.innerWidth > 768) closeMobileNav();
            // Also refresh panel top when resizing
            var panel = mobileNav && mobileNav.querySelector('.mobile-nav-panel');
            var hdr = document.querySelector('.main-header');
            try { if (panel && hdr) panel.style.top = (hdr.offsetHeight || 64) + 'px'; } catch (e) { }
        });

        // Close with ESC
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMobileNav(); });
    }

    // Expose a friendly alias used by inline onclick attributes
    window.closeMobileMenu = function () { closeMobileNav(); };

    // Close buttons and backdrop clicks
    document.getElementById('loginModalClose').addEventListener('click', function () { close(loginModal); });
    document.getElementById('registerModalClose').addEventListener('click', function () { close(registerModal); });
    loginModal.addEventListener('click', function (e) { if (e.target === loginModal) close(loginModal); });
    registerModal.addEventListener('click', function (e) { if (e.target === registerModal) close(registerModal); });

    // License Modal
    var licenseModal = document.getElementById('licenseModal');
    var licenseData = {
        'atlas': {
            name: 'Atlas Travel',
            number: 'UZ-TA-2021-AT-001234',
            issued: '2021-03-15',
            expires: '2026-03-15',
            authority: 'O\'zbekiston Respublikasi Turizm va madaniy meros vazirligi'
        },
        'samarqand': {
            name: 'Samarqand Tours',
            number: 'UZ-TA-2019-ST-005678',
            issued: '2019-06-20',
            expires: '2024-06-20',
            authority: 'O\'zbekiston Respublikasi Turizm va madaniy meros vazirligi'
        },
        'nomad': {
            name: 'Nomad Explorer',
            number: 'UZ-TA-2020-NE-003456',
            issued: '2020-09-10',
            expires: '2025-09-10',
            authority: 'O\'zbekiston Respublikasi Turizm va madaniy meros vazirligi'
        },
        'clubtravel': {
            name: 'ClubTravel UZ',
            number: 'UZ-TA-2018-CT-007890',
            issued: '2018-11-25',
            expires: '2023-11-25',
            authority: 'O\'zbekiston Respublikasi Turizm va madaniy meros vazirligi'
        },
        'silk': {
            name: 'Silk Road Elite',
            number: 'UZ-TA-2022-SR-009012',
            issued: '2022-01-18',
            expires: '2027-01-18',
            authority: 'O\'zbekiston Respublikasi Turizm va madaniy meros vazirligi'
        },
        'azialux': {
            name: 'AziaLux Travel',
            number: 'UZ-TA-2021-AL-004567',
            issued: '2021-05-12',
            expires: '2026-05-12',
            authority: 'O\'zbekiston Respublikasi Turizm va madaniy meros vazirligi'
        },
        'globalvoyage': {
            name: 'Global Voyage Hub',
            number: 'UZ-TA-2020-GV-008901',
            issued: '2020-08-30',
            expires: '2025-08-30',
            authority: 'O\'zbekiston Respublikasi Turizm va madaniy meros vazirligi'
        }
    };

    window.showLicense = function (agencyId) {
        var data = licenseData[agencyId];
        if (!data) return;

        document.getElementById('licenseAgencyName').textContent = data.name;
        document.getElementById('licenseNumber').textContent = data.number;
        document.getElementById('licenseIssued').textContent = data.issued;
        document.getElementById('licenseExpires').textContent = data.expires;
        document.getElementById('licenseAuthority').textContent = data.authority;

        // Apply translations
        var lang = localStorage.getItem('ketmon_lang') || 'uz';
        var dict = window.i18n && window.i18n[lang] || {};

        // Apply translations to all license modal elements
        var titleEl = document.getElementById('licenseModalTitle');
        if (titleEl && dict.license_title) titleEl.textContent = dict.license_title;

        document.querySelectorAll('[data-text^="license_"]').forEach(function (el) {
            var key = el.getAttribute('data-text');
            if (key && dict[key] !== undefined) {
                el.textContent = dict[key];
            }
        });

        open(licenseModal);
    };

    document.getElementById('licenseModalClose').addEventListener('click', function () { close(licenseModal); });
    licenseModal.addEventListener('click', function (e) { if (e.target === licenseModal) close(licenseModal); });

    // All Destinations Modal
    var allDestinationsModal = document.getElementById('allDestinationsModal');
    var allDestinationsGrid = document.getElementById('allDestinationsGrid');

    window.showAllDestinations = function () {
        // Clear previous content
        allDestinationsGrid.innerHTML = '';

        // Get all destination cards from the page
        var destinationCards = document.querySelectorAll('.destination-card');

        // Clone and add each destination card to the modal
        destinationCards.forEach(function (card) {
            var clonedCard = card.cloneNode(true);
            allDestinationsGrid.appendChild(clonedCard);
        });

        // Apply translations
        var lang = localStorage.getItem('ketmon_lang') || 'uz';
        var dict = window.i18n && window.i18n[lang] || {};
        if (dict.destinations_title) {
            document.getElementById('allDestinationsModalTitle').textContent = dict.destinations_title;
        }

        // Apply translations to cloned cards
        if (window.applyTranslations) {
            window.applyTranslations(lang);
        }

        open(allDestinationsModal);
    };

    document.getElementById('allDestinationsModalClose').addEventListener('click', function () { close(allDestinationsModal); });
    allDestinationsModal.addEventListener('click', function (e) { if (e.target === allDestinationsModal) close(allDestinationsModal); });

    // All Agencies Modal
    var allAgenciesModal = document.getElementById('allAgenciesModal');
    var allAgenciesGrid = document.getElementById('allAgenciesGrid');

    window.showAllAgencies = function () {
        // Clear previous content
        allAgenciesGrid.innerHTML = '';

        // Get all agency cards from the page
        var agencyCards = document.querySelectorAll('.agency-card');

        // Clone and add each agency card to the modal
        agencyCards.forEach(function (card) {
            var clonedCard = card.cloneNode(true);
            allAgenciesGrid.appendChild(clonedCard);
        });

        // Apply translations
        var lang = localStorage.getItem('ketmon_lang') || 'uz';
        var dict = window.i18n && window.i18n[lang] || {};
        if (dict.agency_section_title) {
            document.getElementById('allAgenciesModalTitle').textContent = dict.agency_section_title;
        }

        // Apply translations to cloned cards
        if (window.applyTranslations) {
            window.applyTranslations(lang);
        }

        open(allAgenciesModal);
    };

    document.getElementById('allAgenciesModalClose').addEventListener('click', function () { close(allAgenciesModal); });
    allAgenciesModal.addEventListener('click', function (e) { if (e.target === allAgenciesModal) close(allAgenciesModal); });

    // Saved account functionality
    function loadSavedAccount() {
        var savedAccount = localStorage.getItem('ketmon_saved_account');
        var savedAccountDisplay = document.getElementById('savedAccountDisplay');
        var loginFormFields = document.getElementById('loginFormFields');
        var savedAccountEmail = document.getElementById('savedAccountEmail');

        if (savedAccount) {
            var accountData = JSON.parse(savedAccount);
            savedAccountEmail.textContent = accountData.email;
            savedAccountDisplay.style.display = 'block';
            loginFormFields.style.display = 'none';
        } else {
            savedAccountDisplay.style.display = 'none';
            loginFormFields.style.display = 'block';
        }
    }

    function useSavedAccount() {
        var savedAccount = localStorage.getItem('ketmon_saved_account');
        if (!savedAccount) return;

        var accountData = JSON.parse(savedAccount);

        // Auto-fill email only - user must still enter password
        document.getElementById('loginEmail').value = accountData.email;
        document.getElementById('loginPassword').focus();

        // Hide saved account display and show login form
        var savedAccountDisplay = document.getElementById('savedAccountDisplay');
        var loginFormFields = document.getElementById('loginFormFields');
        if (savedAccountDisplay) savedAccountDisplay.style.display = 'none';
        if (loginFormFields) loginFormFields.style.display = 'block';
    }

    function forgetSavedAccount() {
        if (confirm('Saqlangan akkauntni o\'chirishni xohlaysizmi?')) {
            localStorage.removeItem('ketmon_saved_account');
            loadSavedAccount();
        }
    }

    function enterNewAccount() {
        var savedAccountDisplay = document.getElementById('savedAccountDisplay');
        var loginFormFields = document.getElementById('loginFormFields');
        savedAccountDisplay.style.display = 'none';
        loginFormFields.style.display = 'block';
        document.getElementById('loginEmail').focus();
    }

    // Load saved account when login modal opens
    function originalOpenLogin() {
        open(loginModal);
        loadSavedAccount();
    }

    // Update login button handler to load saved account (replaces earlier handler)
    if (topBarLoginBtn) {
        // Clone node to remove all event listeners
        var newLoginBtn = topBarLoginBtn.cloneNode(true);
        topBarLoginBtn.parentNode.replaceChild(newLoginBtn, topBarLoginBtn);
        topBarLoginBtn = newLoginBtn;
        topBarLoginBtn.addEventListener('click', function (e) {
            e.preventDefault();
            originalOpenLogin();
        });
    }

    document.getElementById('loginToRegister').addEventListener('click', function () {
        close(loginModal);
        open(registerModal);
    });

    document.getElementById('registerToLogin').addEventListener('click', function () {
        close(registerModal);
        originalOpenLogin();
    });

    // Saved account button handlers
    document.getElementById('useSavedAccountBtn').addEventListener('click', useSavedAccount);
    document.getElementById('forgetAccountBtn').addEventListener('click', forgetSavedAccount);
    document.getElementById('enterNewAccountBtn').addEventListener('click', enterNewAccount);

    // Handle submit - Backend API
    document.getElementById('loginForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        var email = document.getElementById('loginEmail').value.trim().toLowerCase();
        var password = document.getElementById('loginPassword').value || '';
        var rememberMe = document.getElementById('rememberMe').checked;

        // Validate inputs
        if (!email || !password) {
            alert('Iltimos, email va parolni kiriting.');
            return;
        }

        try {
            // Call backend API
            var response = await authAPI.login(email, password);
            
            if (response.success) {
                // Store token and user data
                setAuthToken(response.token);
                localStorage.setItem('ketmon_user', JSON.stringify(response.user));

                // Save account if "remember me" is checked
                if (rememberMe) {
                    localStorage.setItem('ketmon_saved_account', JSON.stringify({ email: email }));
                }

                close(loginModal);
                updateHeaderAuth();
                window.location.href = 'profile.html';
            }
        } catch (error) {
            alert(error.message || 'Noto\'g\'ri email yoki parol. Iltimos, qayta urinib ko\'ring.');
            document.getElementById('loginPassword').value = '';
        }
    });
    document.getElementById('registerForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        var role = document.getElementById('regRole').value;
        
        try {
            var response;
            
            if (role === 'agency') {
                var aname = document.getElementById('regAgencyName').value.trim() || '';
                var lic = document.getElementById('regLicense').value.trim() || '';
                var email = document.getElementById('regAgencyEmail').value.trim().toLowerCase() || '';
                var phone = document.getElementById('regAgencyPhone').value.trim() || '';
                var password = document.getElementById('regAgencyPassword').value || '';

                // Validate required fields
                if (!aname || !email || !password) {
                    alert('Iltimos, barcha majburiy maydonlarni to\'ldiring.');
                    return;
                }

                if (password.length < 6) {
                    alert('Parol kamida 6 ta belgidan iborat bo\'lishi kerak.');
                    return;
                }

                // Call backend API
                response = await authAPI.registerAgency({
                    name: aname,
                    email: email,
                    password: password,
                    license: lic,
                    phone: phone
                });
            } else {
                var name = document.getElementById('regName').value.trim() || '';
                var email = document.getElementById('regEmail').value.trim().toLowerCase() || '';
                var password = document.getElementById('regPassword').value || '';

                // Validate required fields
                if (!name || !email || !password) {
                    alert('Iltimos, barcha maydonlarni to\'ldiring.');
                    return;
                }

                if (password.length < 6) {
                    alert('Parol kamida 6 ta belgidan iborat bo\'lishi kerak.');
                    return;
                }

                // Call backend API
                response = await authAPI.registerCustomer({
                    name: name,
                    email: email,
                    password: password
                });
            }

            if (response.success) {
                // Store token and user data
                setAuthToken(response.token);
                localStorage.setItem('ketmon_user', JSON.stringify(response.user));
                
                if (response.agency) {
                    localStorage.setItem('ketmon_agency', JSON.stringify(response.agency));
                }

                close(registerModal);
                updateHeaderAuth();
                window.location.href = 'profile.html';
            }
        } catch (error) {
            alert(error.message || 'Ro\'yxatdan o\'tishda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
        }
    });

    // Esc key to close auth modals
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            if (loginModal.classList.contains('open')) close(loginModal);
            if (registerModal.classList.contains('open')) close(registerModal);
        }
    });

    // Register tabs toggle
    var regRoleInput = document.getElementById('regRole');
    var tabCustomer = document.getElementById('regTabCustomer');
    var tabAgency = document.getElementById('regTabAgency');
    var fieldsCustomer = document.getElementById('regFieldsCustomer');
    var fieldsAgency = document.getElementById('regFieldsAgency');
    function setRole(role) {
        regRoleInput.value = role;
        if (role === 'agency') {
            tabAgency.classList.add('active'); tabAgency.setAttribute('aria-selected', 'true');
            tabCustomer.classList.remove('active'); tabCustomer.setAttribute('aria-selected', 'false');
            fieldsAgency.classList.remove('hidden'); fieldsCustomer.classList.add('hidden');
            // Relax required on hidden fields
            document.getElementById('regName').required = false;
            document.getElementById('regEmail').required = false;
            document.getElementById('regPassword').required = false;
            // Agency fields not strictly required for demo
        } else {
            tabCustomer.classList.add('active'); tabCustomer.setAttribute('aria-selected', 'true');
            tabAgency.classList.remove('active'); tabAgency.setAttribute('aria-selected', 'false');
            fieldsCustomer.classList.remove('hidden'); fieldsAgency.classList.add('hidden');
            document.getElementById('regName').required = true;
            document.getElementById('regEmail').required = true;
            document.getElementById('regPassword').required = true;
        }
    }
    tabCustomer.addEventListener('click', function () { setRole('customer'); });
    tabAgency.addEventListener('click', function () { setRole('agency'); });
    // ensure default state
    setRole('customer');
})();
// Agency filter interactions
(function () {
    var agencySelect = document.getElementById('agencyFilter');
    var tourCards = Array.from(document.querySelectorAll('.destination-card'));
    var agencyTypeButtons = Array.from(document.querySelectorAll('.agency-toolbar button'));
    var currentAgency = 'all';
    var currentType = 'all';

    function syncToolbar() {
        agencyTypeButtons.forEach(function (btn) {
            btn.classList.toggle('active', (btn.getAttribute('data-filter') || 'all') === currentType);
        });
    }

    function applyFilter() {
        // Filter tours
        tourCards.forEach(function (card) {
            var agency = card.getAttribute('data-agency');
            var type = card.getAttribute('data-type') || 'all';
            var agencyMatch = currentAgency === 'all' || agency === currentAgency;
            var typeMatch = currentType === 'all' || type === currentType;
            var shouldShow = agencyMatch && typeMatch;
            card.classList.toggle('hidden', !shouldShow);
        });

        // Filter agencies (query current cards to include any clones)
        var allAgencyCards = Array.from(document.querySelectorAll('.agency-card'));
        allAgencyCards.forEach(function (card) {
            var agency = card.getAttribute('data-agency');
            var type = card.getAttribute('data-type') || 'all';
            var typeAllowed = currentType === 'all' || type === currentType;
            var agencyMatch = currentAgency === 'all' || agency === currentAgency;
            var shouldShow = typeAllowed && (currentAgency === 'all' || agencyMatch);
            card.classList.toggle('hidden', !shouldShow);
            card.classList.toggle('active', agencyMatch);
        });
    }

    if (agencySelect) {
        agencySelect.addEventListener('change', function () {
            currentAgency = agencySelect.value || 'all';
            applyFilter();
        });
        currentAgency = agencySelect.value || 'all';
    }

    agencyTypeButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            currentType = btn.getAttribute('data-filter') || 'all';
            currentAgency = 'all';
            if (agencySelect) agencySelect.value = 'all';
            syncToolbar();
            applyFilter();
        });
    });

    // Per-card click for existing cards (kept)
    Array.from(document.querySelectorAll('.agency-card')).forEach(function (card) {
        card.addEventListener('click', function () {
            var value = card.getAttribute('data-agency');
            var type = card.getAttribute('data-type') || 'all';
            currentAgency = value;
            currentType = type;
            if (agencySelect) {
                agencySelect.value = value;
            }
            syncToolbar();
            applyFilter();
            var destEl = document.getElementById('destinations');
            if (destEl) {
                const header = document.querySelector('.main-header');
                const headerHeight = header ? header.offsetHeight : 80;
                smoothScrollTo(destEl, headerHeight, 600);
            }
        });
    });

    // Delegated click so cloned cards behave the same
    var agencyGrid = document.querySelector('.agency-section .agency-grid');
    if (agencyGrid) {
        agencyGrid.addEventListener('click', function (e) {
            var card = e.target.closest('.agency-card');
            if (!card || !agencyGrid.contains(card)) return;
            var value = card.getAttribute('data-agency');
            var type = card.getAttribute('data-type') || 'all';
            currentAgency = value;
            currentType = type;
            if (agencySelect) agencySelect.value = value;
            syncToolbar();
            applyFilter();
            var destEl = document.getElementById('destinations');
            if (destEl) {
                const header = document.querySelector('.main-header');
                const headerHeight = header ? header.offsetHeight : 80;
                smoothScrollTo(destEl, headerHeight, 600);
            }
        });
    }

    // Initialize filter state
    if (agencyTypeButtons.length) {
        var defaultBtn = agencyTypeButtons.find(function (btn) { return btn.classList.contains('active'); }) || agencyTypeButtons[0];
        currentType = defaultBtn ? defaultBtn.getAttribute('data-filter') || 'all' : 'all';
        syncToolbar();
    }
    applyFilter();
})();

/* Infinite horizontal scroll for Agency grid (Hamkor Agentliklar) */
(function () {
    var grid = document.querySelector('.agency-section .agency-grid');
    if (!grid) return;
    var originals = Array.prototype.slice.call(grid.querySelectorAll('.agency-card'));
    if (!originals.length) return;

    function appendBatch() {
        var frag = document.createDocumentFragment();
        for (var i = 0; i < originals.length; i++) {
            frag.appendChild(originals[i].cloneNode(true));
        }
        grid.appendChild(frag);
    }

    function ensureLength() {
        var rounds = 0;
        while (grid.scrollWidth < grid.clientWidth * 3 && rounds < 4) {
            appendBatch();
            rounds++;
        }
    }

    function maybeExtend() {
        var remaining = grid.scrollWidth - (grid.scrollLeft + grid.clientWidth);
        if (remaining < 80) appendBatch();
    }

    function enable() {
        ensureLength();
        grid.addEventListener('scroll', maybeExtend, { passive: true });
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        enable();
    } else {
        document.addEventListener('DOMContentLoaded', enable);
    }
    window.addEventListener('resize', ensureLength);
})();
// Trip category buttons
(function () {
    var categoryBtns = document.querySelectorAll('.trip-category-btn');
    var destinationCards = document.querySelectorAll('.trip-destination-card');

    function filterDestinations(category) {
        destinationCards.forEach(function (card) {
            var categories = card.getAttribute('data-categories');
            if (categories && categories.includes(category)) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });
    }

    categoryBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            categoryBtns.forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            var category = btn.getAttribute('data-category');
            filterDestinations(category);
        });
    });

    // Initialize with festivals category (active by default)
    filterDestinations('festivals');
})();

// AI Assistant functionality
(function () {
    var aiForm = document.getElementById('aiForm');
    var aiResponse = document.getElementById('aiResponse');
    var aiSeason = document.getElementById('aiSeason');
    var aiMonthField = document.getElementById('aiMonthField');
    var aiMonth = document.getElementById('aiMonth');

    // Season to months mapping
    var seasonMonths = {
        'summer': ['june', 'july', 'august'],      // Yoz: Iyun, Iyul, Avgust
        'autumn': ['september', 'october', 'november'], // Kuz: Sentabr, Oktabr, Noyabr
        'winter': ['december', 'january', 'february'],  // Qish: Dekabr, Yanvar, Fevral
        'spring': ['march', 'april', 'may']        // Bahor: Mart, Aprel, May
    };

    // Store all month options
    var allMonthOptions = [];
    if (aiMonth) {
        var options = aiMonth.querySelectorAll('option');
        options.forEach(function (opt) {
            allMonthOptions.push({
                value: opt.value,
                text: opt.textContent,
                dataText: opt.getAttribute('data-text'),
                element: opt.cloneNode(true)
            });
        });
    }

    function filterMonthsBySeason(season) {
        if (!aiMonth) return;

        // Clear current options except the first (default "Tanlang")
        aiMonth.innerHTML = '';

        // Add default option
        var defaultOption = allMonthOptions[0];
        if (defaultOption) {
            var opt = defaultOption.element.cloneNode(true);
            aiMonth.appendChild(opt);
        }

        // Get months for selected season
        var monthsForSeason = seasonMonths[season] || [];

        // Add filtered month options
        allMonthOptions.forEach(function (month) {
            if (month.value && monthsForSeason.includes(month.value)) {
                var opt = month.element.cloneNode(true);
                aiMonth.appendChild(opt);
            }
        });
    }

    // Show/hide month field based on season selection
    if (aiSeason && aiMonthField) {
        aiSeason.addEventListener('change', function () {
            var season = this.value;
            // Show month field for any season selection
            if (season) {
                aiMonthField.style.display = 'block';
                // Filter months based on selected season
                filterMonthsBySeason(season);
                // Reset month to default empty value when season changes
                if (aiMonth) {
                    aiMonth.value = '';
                }
            } else {
                aiMonthField.style.display = 'none';
                // Reset month to default empty value
                if (aiMonth) {
                    aiMonth.value = '';
                }
            }
        });
    }

    // Handle form submission
    if (aiForm && aiResponse) {
        aiForm.addEventListener('submit', function (e) {
            e.preventDefault();

            var budget = document.getElementById('aiBudget').value;
            var destination = document.getElementById('aiDestination').value;
            var season = aiSeason ? aiSeason.value : '';
            var month = aiMonth ? aiMonth.value : '';

            // Validation
            if (!budget || parseFloat(budget) < 100) {
                aiResponse.textContent = 'Iltimos, budjetni kiriting (minimal 100 USD).';
                aiResponse.style.color = '#e74c3c';
                return;
            }

            // Show loading state
            aiResponse.innerHTML = '<div style="text-align: center; padding: 20px;">⏳ Tavsiyalar tayyorlanmoqda...</div>';
            aiResponse.style.color = '#0a4d68';

            // Simulate AI processing (in a real app, this would call an API)
            setTimeout(function () {
                var recommendations = generateRecommendations({
                    budget: parseFloat(budget),
                    destination: destination,
                    season: season,
                    month: month
                });

                displayRecommendations(recommendations);
            }, 1500);
        });
    }

    function generateRecommendations(params) {
        var recommendations = [];
        var basePrice = params.budget;
        var destinations = ['Dubai', 'Istanbul', 'Bali', 'Thailand', 'Malaysia', 'Singapore', 'Maldives', 'Egypt', 'Türkiye', 'UAE'];

        // Filter destinations if specified
        if (params.destination) {
            var searchDest = params.destination.toLowerCase();
            destinations = destinations.filter(function (d) {
                return d.toLowerCase().includes(searchDest) ||
                    (searchDest.includes('osiyo') && ['Bali', 'Thailand', 'Malaysia', 'Singapore', 'Maldives'].includes(d)) ||
                    (searchDest.includes('yevropa') && ['Istanbul', 'Türkiye'].includes(d)) ||
                    (searchDest.includes('o\'rta sharq') && ['Dubai', 'UAE', 'Egypt'].includes(d));
            });
            if (destinations.length === 0) {
                destinations = ['Dubai', 'Istanbul', 'Bali', 'Thailand'];
            }
        }

        // Generate 3-5 recommendations within budget
        var numRecs = Math.min(Math.max(3, Math.floor(basePrice / 500)), 5);
        var usedDests = {};

        for (var i = 0; i < numRecs; i++) {
            var dest = destinations[Math.floor(Math.random() * destinations.length)];
            var attempts = 0;
            while (usedDests[dest] && attempts < 20) {
                dest = destinations[Math.floor(Math.random() * destinations.length)];
                attempts++;
            }
            usedDests[dest] = true;

            var price = Math.round((basePrice * (0.7 + Math.random() * 0.6)) / 100) * 100;
            var duration = [3, 5, 7, 10, 14][Math.floor(Math.random() * 5)];

            recommendations.push({
                destination: dest,
                price: price,
                duration: duration + ' kun',
                description: getDestinationDescription(dest, params.season)
            });
        }

        // Sort by price closest to budget
        recommendations.sort(function (a, b) {
            return Math.abs(a.price - basePrice) - Math.abs(b.price - basePrice);
        });

        return recommendations;
    }

    function getDestinationDescription(dest, season) {
        var descriptions = {
            'Dubai': 'Zamonaviy shaharlar, qumli cho\'llar va hashamatli mehmonxonalar',
            'Istanbul': 'Tarixiy joylar, Bo\'g\'az ko\'rfazi va ajoyib oshxona',
            'Bali': 'Tropik plyajlar, mevali bog\'lar va madaniy meros',
            'Thailand': 'Jannat plyajlari, buddist ibodatxonalari va zamonaviy shaharlar',
            'Malaysia': 'Tropik orollar, ekologik turizm va xilma-xil madaniyat',
            'Singapore': 'Zamonaviy shahar, chiroyli parklar va xilma-xil oshxona',
            'Maldives': 'Kristal suvlar, baliq tutish va hashamatli kurortlar',
            'Egypt': 'Piramidalar, Suez kanali va qadimiy tarix',
            'Türkiye': 'Mediterranean qirg\'oqlari, tarixiy joylar va ajoyib oshxona',
            'UAE': 'Hashamatli shaharlar, qumli cho\'llar va yuqori darajadagi xizmatlar'
        };
        return descriptions[dest] || 'Ajoyib sayohat imkoniyati';
    }

    function displayRecommendations(recommendations) {
        if (!aiResponse) return;

        if (recommendations.length === 0) {
            aiResponse.innerHTML = '<div style="color: #e74c3c;">Sizning kiritilgan ma\'lumotlar bo\'yicha tavsiyalar topilmadi. Iltimos, budjetni yoki yo\'nalishni o\'zgartiring.</div>';
            return;
        }

        var html = '<div style="margin-top: 20px;"><h4 style="color: #0a4d68; margin-bottom: 15px;">Tavsiya etilgan yo\'nalishlar:</h4>';

        recommendations.forEach(function (rec) {
            html += '<div style="background: var(--bg-secondary); padding: 15px; margin-bottom: 12px; border-radius: 8px; border-left: 4px solid var(--accent-primary);">';
            html += '<div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 10px;">';
            html += '<div style="flex: 1; min-width: 200px;">';
            html += '<h5 style="margin: 0 0 8px 0; color: #0a4d68; font-size: 18px;">' + rec.destination + '</h5>';
            html += '<p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">' + rec.description + '</p>';
            html += '<div style="display: flex; gap: 15px; font-size: 14px; color: #888;">';
            html += '<span>⏱️ ' + rec.duration + '</span>';
            html += '<span>💰 $' + rec.price.toLocaleString() + '</span>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
        });

        html += '</div>';
        aiResponse.innerHTML = html;
        aiResponse.style.color = '#333';
    }
})();

// Password Toggle Functionality
function togglePasswordVisibility(inputId, button) {
    var input = document.getElementById(inputId);
    if (!input) return;
    
    var eyeOpen = button.querySelector('.eye-open');
    var eyeClosed = button.querySelector('.eye-closed');
    
    if (input.type === 'password') {
        input.type = 'text';
        if (eyeOpen) eyeOpen.style.display = 'none';
        if (eyeClosed) eyeClosed.style.display = 'block';
        button.setAttribute('aria-label', 'Hide password');
    } else {
        input.type = 'password';
        if (eyeOpen) eyeOpen.style.display = 'block';
        if (eyeClosed) eyeClosed.style.display = 'none';
        button.setAttribute('aria-label', 'Show password');
    }
}

// Make function globally accessible
window.togglePasswordVisibility = togglePasswordVisibility;

// Social Login Functions
// Configuration - Replace these with your actual credentials
// IMPORTANT: Use your CLIENT ID (looks like: 123456789-xxxxx.apps.googleusercontent.com)
// NOT the Client Secret (which starts with GOCSPX-)
var GOOGLE_CLIENT_ID = '735852390296-378bisf38fhib67o72rjmdm5spv945cs.apps.googleusercontent.com'; // Replace with your Google Client ID
var FACEBOOK_APP_ID = 'YOUR_FACEBOOK_APP_ID'; // Replace with your Facebook App ID

// Helper function to handle successful social login - Backend API
async function handleSocialLoginSuccess(userData, provider) {
    console.log('handleSocialLoginSuccess called with provider:', provider, 'userData:', userData);
    try {
        var response;
        
        if (provider === 'google') {
            // For Google, send the credential token to backend
            if (userData.credential) {
                console.log('Calling authAPI.loginWithGoogle with credential...');
                response = await authAPI.loginWithGoogle(userData.credential);
                console.log('Backend response:', response);
            } else {
                // Fallback: if we have user data but no credential, create user manually
                // This shouldn't happen, but handle it gracefully
                console.error('Google credential not found in userData');
                throw new Error('Google credential not found');
            }
        } else if (provider === 'facebook') {
            // For Facebook, send access token and user ID
            if (userData.accessToken && userData.userID) {
                console.log('Calling authAPI.loginWithFacebook...');
                response = await authAPI.loginWithFacebook(userData.accessToken, userData.userID);
                console.log('Backend response:', response);
            } else {
                console.error('Facebook access token not found');
                throw new Error('Facebook access token not found');
            }
        } else {
            console.error('Unknown provider:', provider);
            throw new Error('Unknown provider');
        }
        
        if (response && response.success) {
            console.log('Login successful, updating UI...');
            // Store token and user data
            setAuthToken(response.token);
            localStorage.setItem('ketmon_user', JSON.stringify(response.user));
            
            // Update header
            if (typeof updateHeaderAuth === 'function') {
                updateHeaderAuth();
            }
            
            // Close login modal
            var loginModal = document.getElementById('loginModal');
            if (loginModal) {
                loginModal.classList.remove('open');
                document.body.style.overflow = '';
            }
            
            // Close user account dropdown
            if (typeof closeUserAccountDropdown === 'function') {
                closeUserAccountDropdown();
            }
            
            // Show success message
            alert('Muvaffaqiyatli kirdingiz! ' + (response.user.name || response.user.email));
            
            // Redirect to profile or refresh page
            if (window.location.pathname.includes('profile.html')) {
                window.location.reload();
            } else {
                window.location.href = 'profile.html';
            }
        }
    } catch (error) {
        console.error('Error handling social login:', error);
        var errorMsg = error.message || 'Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.';
        
        // Provide more specific error messages
        if (error.message && error.message.includes('400')) {
            errorMsg = '400 xatolik: Google Client ID noto\'g\'ri yoki backend sozlamalari xato.\n\nIltimos, tekshiring:\n1. Google Client ID to\'g\'ri sozlanganligini\n2. Backend server ishlamoqda va GOOGLE_CLIENT_ID sozlanganligini\n3. Authorized JavaScript origins ga sahifangiz URL qo\'shilganligini';
        } else if (error.message && (error.message.includes('NetworkError') || error.message.includes('Failed to fetch'))) {
            errorMsg = 'Backend serverga ulanib bo\'lmadi.\n\nIltimos, tekshiring:\n1. Backend server ishlamoqda (http://localhost:3000)\n2. API_BASE_URL to\'g\'ri sozlanganligini';
        }
        
        alert(errorMsg);
    }
}

// Google Sign-In Function
function loginWithGoogle() {
    console.log('Google login function called');
    
    // Check if Google Identity Services is loaded
    if (typeof google === 'undefined' || !google.accounts) {
        console.error('Google Identity Services not loaded');
        alert('Google Identity Services yuklanmagan. Iltimos, sahifani yangilang va qayta urinib ko\'ring.');
        return;
    }
    
    console.log('Google Identity Services loaded, Client ID:', GOOGLE_CLIENT_ID);
    
    // Check if client ID is configured
    if (GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID' || !GOOGLE_CLIENT_ID) {
        alert('Google Client ID sozlanmagan. Iltimos, script.js faylida GOOGLE_CLIENT_ID ni o\'rnating.\n\nGoogle Cloud Console dan Client ID olish:\n1. https://console.cloud.google.com ga kiring\n2. API & Services > Credentials\n3. Create Credentials > OAuth client ID\n4. Web application tanlang va Client ID ni oling\n\nMUHIM: Client ID (123456789-xxxxx.apps.googleusercontent.com) ishlatish kerak, Client Secret (GOCSPX-...) emas!');
        return;
    }
    
    // Validate Client ID format (should end with .apps.googleusercontent.com)
    // If it looks like a Client Secret (starts with GOCSPX-), show error
    if (GOOGLE_CLIENT_ID.startsWith('GOCSPX-')) {
        alert('XATO: Siz Client Secret ishlatyapsiz, Client ID emas!\n\nClient ID shunday ko\'rinadi: 123456789-xxxxx.apps.googleusercontent.com\nClient Secret esa shunday: GOCSPX-xxxxx\n\nIltimos, Google Cloud Console dan to\'g\'ri Client ID ni oling va qo\'ying.');
        return;
    }
    
    // Warn if Client ID doesn't look like a valid format
    if (!GOOGLE_CLIENT_ID.includes('.apps.googleusercontent.com')) {
        console.warn('Google Client ID format noto\'g\'ri ko\'rinadi. To\'g\'ri format: 123456789-xxxxx.apps.googleusercontent.com');
    }
    
    // Use Google Sign-In with proper ID token flow
    try {
        // Initialize Google Identity Services with callback
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: function(response) {
                console.log('Google callback received:', response);
                // Handle the credential (ID token) response
                if (response.credential) {
                    console.log('Google credential received, sending to backend...');
                    // Send credential to backend
                    handleSocialLoginSuccess({ credential: response.credential }, 'google');
                } else {
                    console.error('No credential in Google response:', response);
                    alert('Google kirish bekor qilindi yoki xatolik yuz berdi.');
                }
            },
            auto_select: false,
            cancel_on_tap_outside: true
        });
        
        // Find or create button container in the login modal
        var loginModal = document.getElementById('loginModal');
        var buttonContainer = null;
        
        if (loginModal) {
            // Check if container already exists
            buttonContainer = loginModal.querySelector('#google-signin-button-container');
            
            if (!buttonContainer) {
                // Find the existing Google button
                var existingGoogleBtn = loginModal.querySelector('.google-btn');
                if (existingGoogleBtn) {
                    // Create container next to existing button
                    buttonContainer = document.createElement('div');
                    buttonContainer.id = 'google-signin-button-container';
                    buttonContainer.style.display = 'inline-block';
                    buttonContainer.style.verticalAlign = 'middle';
                    
                    // Insert before or replace the existing button
                    var parent = existingGoogleBtn.parentNode;
                    if (parent) {
                        parent.insertBefore(buttonContainer, existingGoogleBtn);
                        existingGoogleBtn.style.display = 'none'; // Hide the old button
                    }
                } else {
                    // Create new container in social login section
                    var socialSection = loginModal.querySelector('.social-login-section');
                    if (socialSection) {
                        buttonContainer = document.createElement('div');
                        buttonContainer.id = 'google-signin-button-container';
                        buttonContainer.style.textAlign = 'center';
                        buttonContainer.style.marginTop = '10px';
                        socialSection.appendChild(buttonContainer);
                    }
                }
            }
        }
        
        // If no modal or container found, create a temporary one
        if (!buttonContainer) {
            buttonContainer = document.createElement('div');
            buttonContainer.id = 'google-signin-button-container';
            buttonContainer.style.position = 'fixed';
            buttonContainer.style.left = '-9999px';
            buttonContainer.style.opacity = '0';
            document.body.appendChild(buttonContainer);
        }
        
        // Render Google Sign-In button
        google.accounts.id.renderButton(
            buttonContainer,
            {
                theme: 'outline',
                size: 'large',
                type: 'standard',
                text: 'signin_with',
                shape: 'rectangular',
                logo_alignment: 'left',
                width: '300'
            }
        );
        
        // If it's a hidden temporary container, try to trigger it
        if (buttonContainer.style.position === 'fixed') {
            setTimeout(function() {
                var googleButton = buttonContainer.querySelector('div[role="button"]');
                if (googleButton) {
                    // Try to trigger the button
                    try {
                        googleButton.click();
                    } catch (e) {
                        // If click doesn't work, show One Tap as fallback
                        google.accounts.id.prompt();
                    }
                    
                    // Clean up after delay
                    setTimeout(function() {
                        if (buttonContainer.parentNode && buttonContainer.style.position === 'fixed') {
                            document.body.removeChild(buttonContainer);
                        }
                    }, 2000);
                } else {
                    // Button didn't render, try One Tap
                    google.accounts.id.prompt();
                }
            }, 300);
        } else {
            // For visible buttons, also try One Tap as a convenience
            google.accounts.id.prompt();
        }
        
    } catch (error) {
        console.error('Error initializing Google Sign-In:', error);
        alert('Google kirishni boshlashda xatolik yuz berdi: ' + error.message + '\n\nIltimos, sahifani yangilang va qayta urinib ko\'ring.');
    }
}

// Facebook Login Function
function loginWithFacebook() {
    // Check if Facebook SDK is loaded
    if (typeof FB === 'undefined') {
        alert('Facebook SDK yuklanmagan. Iltimos, sahifani yangilang.');
        return;
    }
    
    // Check if App ID is configured
    if (FACEBOOK_APP_ID === 'YOUR_FACEBOOK_APP_ID') {
        alert('Facebook App ID sozlanmagan. Iltimos, index.html va script.js fayllarida FACEBOOK_APP_ID ni o\'rnating.\n\nFacebook App ID olish:\n1. https://developers.facebook.com ga kiring\n2. My Apps > Create App\n3. App ID ni oling va sozlang');
        return;
    }
    
    // Check login status
    FB.getLoginStatus(function(response) {
        if (response.status === 'connected') {
            // Already logged in, get user info
            getFacebookUserInfo(response.authResponse.accessToken);
        } else {
            // Not logged in, trigger login
            FB.login(function(response) {
                if (response.authResponse) {
                    // User logged in, get user info
                    getFacebookUserInfo(response.authResponse.accessToken);
                } else {
                    alert('Facebook bilan kirish bekor qilindi.');
                }
            }, {
                scope: 'email,public_profile',
                return_scopes: true
            });
        }
    });
}

// Helper function to get Facebook user info
function getFacebookUserInfo(accessToken) {
    FB.api('/me', {
        fields: 'id,name,email,picture',
        access_token: accessToken
    }, function(response) {
        if (response.error) {
            console.error('Facebook API error:', response.error);
            alert('Facebook ma\'lumotlarini olishda xatolik yuz berdi.');
            return;
        }
        
        // Send access token and userID to backend
        handleSocialLoginSuccess({
            accessToken: accessToken,
            userID: response.id
        }, 'facebook');
    });
}

// Make functions globally accessible
window.loginWithGoogle = loginWithGoogle;
window.loginWithFacebook = loginWithFacebook;
window.handleSocialLoginSuccess = handleSocialLoginSuccess;

// Forgot Password Modal Functions
function openForgotPasswordModal() {
    var modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closeForgotPasswordModal() {
    var modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
}

// Reset Password Modal Functions
function openResetPasswordModal() {
    var modal = document.getElementById('resetPasswordModal');
    if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closeResetPasswordModal() {
    var modal = document.getElementById('resetPasswordModal');
    if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
}

// Make functions globally accessible
window.openForgotPasswordModal = openForgotPasswordModal;
window.closeForgotPasswordModal = closeForgotPasswordModal;
window.openResetPasswordModal = openResetPasswordModal;
window.closeResetPasswordModal = closeResetPasswordModal;

// Forgot Password Form Handler
document.addEventListener('DOMContentLoaded', function() {
    var forgotPasswordForm = document.getElementById('forgotPasswordForm');
    var forgotPasswordModal = document.getElementById('forgotPasswordModal');
    var forgotPasswordModalClose = document.getElementById('forgotPasswordModalClose');
    var resetPasswordForm = document.getElementById('resetPasswordForm');
    var resetPasswordModal = document.getElementById('resetPasswordModal');
    var resetPasswordModalClose = document.getElementById('resetPasswordModalClose');
    
    // Forgot Password Form Submission - Backend API
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            var email = document.getElementById('forgotPasswordEmail').value.trim().toLowerCase();
            
            if (!email) {
                alert('Iltimos, email manzilingizni kiriting.');
                return;
            }
            
            try {
                var response = await passwordAPI.forgotPassword(email);
                alert(response.message || 'Parolni tiklash haqida xabar emailga yuborildi');
                closeForgotPasswordModal();
            } catch (error) {
                alert(error.message || 'Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
            }
        });
    }
    
    // Close Forgot Password Modal
    if (forgotPasswordModalClose) {
        forgotPasswordModalClose.addEventListener('click', closeForgotPasswordModal);
    }
    
    if (forgotPasswordModal) {
        forgotPasswordModal.addEventListener('click', function(e) {
            if (e.target === forgotPasswordModal) {
                closeForgotPasswordModal();
            }
        });
    }
    
    // Reset Password Form Submission - Backend API
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            var newPassword = document.getElementById('resetPasswordNew').value;
            var confirmPassword = document.getElementById('resetPasswordConfirm').value;
            var token = new URLSearchParams(window.location.search).get('token') || 
                       document.getElementById('resetPasswordToken')?.value || '';
            
            if (newPassword.length < 6) {
                alert('Parol kamida 6 ta belgidan iborat bo\'lishi kerak.');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                alert('Parollar mos kelmaydi. Iltimos, qayta kiriting.');
                return;
            }
            
            if (!token) {
                alert('Parolni tiklash tokeni topilmadi. Iltimos, emaildagi havolani ishlating.');
                return;
            }
            
            try {
                var response = await passwordAPI.resetPassword(token, newPassword);
                alert(response.message || 'Parol muvaffaqiyatli yangilandi!');
                closeResetPasswordModal();
                
                // Optionally redirect to login
                setTimeout(function() {
                    var loginModal = document.getElementById('loginModal');
                    if (loginModal) {
                        loginModal.classList.add('open');
                        document.body.style.overflow = 'hidden';
                    }
                }, 500);
            } catch (error) {
                alert(error.message || 'Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
            }
        });
    }
    
    // Close Reset Password Modal
    if (resetPasswordModalClose) {
        resetPasswordModalClose.addEventListener('click', closeResetPasswordModal);
    }
    
    if (resetPasswordModal) {
        resetPasswordModal.addEventListener('click', function(e) {
            if (e.target === resetPasswordModal) {
                closeResetPasswordModal();
            }
        });
    }
});

// Voice Search Functionality
(function() {
    const voiceSearchBtn = document.getElementById('voiceSearchBtn');
    const voiceSearchInput = document.getElementById('voiceSearchInput');
    const voiceStatus = document.getElementById('voiceStatus');
    
    let recognition = null;
    let isRecording = false;

    // Check if browser supports Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'uz-UZ'; // Uzbek language, can be changed to 'en-US' or other languages

        recognition.onstart = function() {
            isRecording = true;
            voiceSearchBtn.classList.add('recording');
            voiceStatus.textContent = 'Listening...';
            voiceStatus.classList.add('recording');
            voiceStatus.style.display = 'block';
        };

        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            voiceSearchInput.value = transcript;
            voiceStatus.textContent = 'Voice input received';
            voiceStatus.classList.remove('recording');
            
            // Trigger search if needed
            setTimeout(() => {
                voiceStatus.style.display = 'none';
            }, 2000);
        };

        recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            voiceStatus.textContent = 'Error: ' + event.error;
            voiceStatus.classList.remove('recording');
            voiceSearchBtn.classList.remove('recording');
            isRecording = false;
            
            setTimeout(() => {
                voiceStatus.style.display = 'none';
            }, 3000);
        };

        recognition.onend = function() {
            isRecording = false;
            voiceSearchBtn.classList.remove('recording');
            if (voiceStatus.textContent === 'Listening...') {
                voiceStatus.textContent = 'Recording stopped';
                voiceStatus.classList.remove('recording');
                setTimeout(() => {
                    voiceStatus.style.display = 'none';
                }, 2000);
            }
        };

        if (voiceSearchBtn) {
            voiceSearchBtn.addEventListener('click', function() {
                if (!isRecording) {
                    try {
                        recognition.start();
                    } catch (error) {
                        console.error('Error starting recognition:', error);
                        voiceStatus.textContent = 'Could not start voice recognition';
                        voiceStatus.style.display = 'block';
                        setTimeout(() => {
                            voiceStatus.style.display = 'none';
                        }, 3000);
                    }
                } else {
                    recognition.stop();
                }
            });
        }
    } else {
        // Browser doesn't support speech recognition
        if (voiceSearchBtn) {
            voiceSearchBtn.style.opacity = '0.5';
            voiceSearchBtn.style.cursor = 'not-allowed';
            voiceSearchBtn.title = 'Voice search not supported in this browser';
            voiceSearchBtn.addEventListener('click', function() {
                voiceStatus.textContent = 'Voice search is not supported in your browser';
                voiceStatus.style.display = 'block';
                setTimeout(() => {
                    voiceStatus.style.display = 'none';
                }, 3000);
            });
        }
    }

})();

// Detailed Search Section Toggle
(function() {
    const detailedSearchToggle = document.getElementById('detailedSearchToggle');
    const detailedSearchSection = document.getElementById('detailedSearchSection');
    
    if (detailedSearchToggle && detailedSearchSection) {
        detailedSearchToggle.addEventListener('click', function() {
            const isVisible = detailedSearchSection.style.display === 'block';
            
            if (isVisible) {
                detailedSearchSection.style.display = 'none';
                detailedSearchToggle.classList.remove('active');
            } else {
                detailedSearchSection.style.display = 'block';
                detailedSearchToggle.classList.add('active');
            }
        });
    }

    // Handle search button click
    const detailedSearchBtn = document.getElementById('detailedSearchBtn');
    if (detailedSearchBtn) {
        detailedSearchBtn.addEventListener('click', function() {
            const destination = document.getElementById('voiceSearchInput').value;
            const date = document.getElementById('searchDate').value;
            const duration = document.getElementById('searchDuration').value;
            const agency = document.getElementById('searchAgency').value;
            const guests = document.getElementById('searchGuests').value;
            
            // Here you can add your search logic
            console.log('Search parameters:', {
                destination,
                date,
                duration,
                agency,
                guests
            });
            
            // You can trigger your search function here
            // performSearch({ destination, date, duration, agency, guests });
        });
    }
})();

// Search Icon Button Handler
(function() {
    const searchIconBtn = document.getElementById('searchIconBtn');
    const voiceSearchInput = document.getElementById('voiceSearchInput');
    
    if (searchIconBtn && voiceSearchInput) {
        searchIconBtn.addEventListener('click', function() {
            const searchQuery = voiceSearchInput.value.trim();
            
            if (searchQuery) {
                // Perform search action
                console.log('Searching for:', searchQuery);
                // You can add your search logic here
                // For example: performSearch(searchQuery);
            } else {
                // Focus the input if empty
                voiceSearchInput.focus();
            }
        });
        
        // Also trigger search on Enter key
        if (voiceSearchInput) {
            voiceSearchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    searchIconBtn.click();
                }
            });
        }
    }
})();


