export const dashboard = {
  estimatedExpenses: "Tahmini Giderler",
  toInvoice: "Faturalandırılacak",
  worksInProgress: "Devam Eden İşler",
  margin: "Kâr Marjı",
  weeklyOverview: "Haftalık Genel Bakış",
  last7DaysData: "Son 7 günlük veriler",
  newCompanies: "Yeni Şirketler",
  activeCompanies: "Aktif Şirketler",
  newPremiums: "Yeni Premiumlar",
  totalReports: "Toplam Raporlar",
  mostActiveWeekly: "Haftanın En Aktifleri",
  pendingRequestsReminder: "Bekleyen Talepler",
  pendingRequestsDesc: "Onay bekleyen yeni kayıt talepleri var.",
  quickSupport: "Hızlı Destek",
  quickSupportDesc: "Platformda anında yardım için teknik ekiple iletişime geçin.",
  portalError: "Müşteri Portalı açılamadı. Lütfen aktif bir aboneliğiniz olduğunu doğrulayın.",
  companiesManagement: "Şirket Yönetimi",
  createCompanyBtn: "Yeni Şirket Oluştur",
  editCompany: "Şirketi Düzenle",
  companyName: "Şirket Adı",
  companyStatus: "Şirket Durumu",
  demoFieldsLocked: "Bu demo sürümünde bazı veriler değiştirilemez.",
  impersonateUser: "Kullanıcı Erişimini Simüle Et",
  adminAdminName: "Yönetici Adı",
  adminAdminUsername: "Yönetici Kullanıcı Adı",
  adminName: "Şirket Yöneticisi Adı",
  adminUsername: "Yönetici Kullanıcı Adı",
  adminPassword: "Yönetici Şifresi",
  corporateData: "Kurumsal Veriler (PDF Üst Bilgisi)",
  address: "Adres",
  city: "Şehir",
  country: "Ülke",
  phone: "Telefon",
  companyEmail: "Şirket E-postası",
  vatNumber: "Vergi No / CVR",
  premiumPlan: "Premium Plan",
  premiumPlanDesc: "Premium özellikleri etkinleştir (Uygunluk Raporu, Fotoğraflar, İmza)",
  try_demo: "Demoyu Dene",
  companyNamePlaceholder: "Örn. Edilizia Rossi srl",
  tempPasswordPlaceholder: "Geçici şifre",
  italy: "İtalya",
  premium: "Premium",
  upgradeModal: {
    monthly: 'Aylık',
    annually: 'Yıllık',
    billedAnnually: 'Yıllık faturalandırılır',
    twoMonthsFree: '-17%',
    complianceTitle: "Uygunluk Modülü",
    complianceDesc: "Gelişmiş raporlar ve otomatik güvenlik kontrolleri ile yasal uyumluluğu sağlayın.",
    genericTitle: "İşinizi Büyütün",
    genericDesc: "İhtiyaçlarınıza en uygun planı seçin ve Jobs-Report'u bir üst seviyeye taşıyın.",
    loadingPlans: "Planlar yükleniyor...",
    recommended: "Önerilen",
    perMonth: "/ay",
    activateNow: "Şimdi Etkinleştir",
    securePayments: "Stripe ile güvenli ödemeler",
    footerSupport: "JobsReport Professional Edition • 7/24 Destek",
    checkoutError: "Ödeme sayfası açılırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
    communicationsDesc: "Gerçek zamanlı dahili iletişimin kilidini açın ve şirket mesajlarını takip edin."
  },
  missingEmailOrAdminId: "Bu şirket için E-posta veya Yönetici Kimliği eksik.",
  prepareManualEmail: "Manuel E-posta Hazırla",
  sendCredentials: "Kimlik Bilgilerini Gönder",
  activatePremiumDesc: "Bu şirket için premium özellikleri hemen etkinleştirin.",
  sendCredentialsTitle: "Kimlik Bilgileri Gönderiliyor",
  prepareManualEmailBtn: "MANUEL E-POSTA HAZIRLA",
  emailSubject: "Jobs Report Giriş Bilgileri - {company}",
  emailBody: "Merhaba {name},\n\nJobs Report için giriş bilgileriniz aşağıdadır:\n\nURL: https://jobs-report.vercel.app\nKullanıcı Adı: {username}\nŞifre: {password}\n\nİlk girişinizde şifrenizi değiştirmenizi öneririz.\n\nİyi çalışmalar,\nJobsReport Ekibi",
  sendCredentialsHintEdit: "Müşteriye göndermek için yukarıya bir şifre girin.",
  sendCredentialsHintCreate: "Kullanıcı adını ve şifreyi otomatik olarak şirketin e-posta adresine gönder.",
  sendingInProgress: "GÖNDERİLİYOR...",
  autoSendActive: "OTOMATİK GÖNDERİM AKTİF",
  sendInstructionsAuto: "TALİMATLARI GÖNDER (OTOMATİK)",
  plans: {
    free: {
      name: "Free",
      description: "Ürünü şantiyede değerlendirmek için giriş seviyesi test paketi",
      features: {
        "0": "5 kullanıcıya kadar dahil",
        "1": "Temel projeler ve raporlar",
        "2": "Yapay zeka (AI) özellikleri yok",
        "3": "Fotoğraflı/İmzalı rapor dahil değildir",
        "4": "Dahili iletişim dahil değildir"
      }
    },
    starter: {
      name: "Starter",
      description: "Mikro işletmeler ve büyüyen zanaatkarlar için ideal",
      features: {
        "0": "10 kullanıcıya kadar dahil",
        "1": "Sınırsız proje ve raporlar",
        "2": "Eksiksiz zaman ve masraf takibi",
        "3": "Temel PDF/Excel çıktıları",
        "4": "PWA mobil uygulaması + Web",
        "5": "Fotoğraflı/İmzalı rapor dahil değildir",
        "6": "Dahili iletişim dahil değildir"
      }
    },
    business: {
      name: "Business",
      description: "Yapılandırılmış KOBİ'ler için Jobs-Report'un kalbi",
      features: {
        "0": "50 kullanıcıya kadar dahil",
        "1": "Starter planındaki her şey",
        "2": "Fotoğraflı ve imzalı rapor dahildir",
        "3": "Dahili iletişimi içerir",
        "4": "Yapay zeka analizleri ve otomatik raporlar",
        "5": "Gelişmiş maliyet ve gelir analizi"
      }
    },
    growth: {
      name: "Growth",
      description: "Tam kontrole ihtiyaç duyan yapılandırılmış şirketler için",
      features: {
        "0": "150 kullanıcıya kadar dahil",
        "1": "Business planındaki her şey",
        "2": "Fotoğraflı ve imzalı rapor dahildir",
        "3": "Dahili iletişimi içerir",
        "4": "Gelişmiş roller (Yönetici / Supervisor / Çalışan)",
        "5": "Şantiye içi performans analitiği"
      }
    },
    enterprise: {
      name: "Enterprise",
      description: "Sınırsız büyüme için özel çözümler",
      features: {
        "0": "Sınırsız kullanıcı",
        "1": "Gelişmiş özelleştirme",
        "2": "Takvim",
        "3": "İş ilerleme takibi",
        "4": "API erişimi (Sonraki sürüm)",
        "5": "Single Sign-On (SSO / SAML)",
        "6": "White-Label seçeneği (Logonuz ve alan adınız)"
      }
    }
  }
} as const;
