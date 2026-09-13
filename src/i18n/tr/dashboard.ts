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
  managePlan: "Plan Yönetimi",
  commercialOverrideNotice: "Bu şirketin planı doğrudan yönetim tarafından yönetilmektedir. Değiştirmek için lütfen destek ile iletişime geçin.",
  onlineManagementUnavailable: "Bu hesap için çevrimiçi abonelik yönetimi kullanılamıyor. Lütfen destek ile iletişime geçin.",
  contactSupport: "Destek ile iletişime geçin",
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
    teamTitle: 'Ekibiniz için doğru planı seçin',
    complianceTitle: 'Raporlar ve İmzalar',
    complianceDesc: 'Tüm operasyonel özellikler her plana dahildir.',
    genericTitle: 'Ekibiniz için doğru planı seçin',
    genericDesc: 'Tüm operasyonel özellikler her plana dahildir. Ekip büyüklüğünüze göre seçim yapın.',
    loadingPlans: 'Planlar yükleniyor...',
    recommended: 'Önerilen',
    perMonth: '/ay',
    activateNow: 'Şimdi Etkinleştir',
    securePayments: 'Stripe ile güvenli ödemeler',
    footerSupport: 'JobsReport Professional Edition • 7/24 Destek',
    checkoutError: 'Ödeme sayfası açılırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
    communicationsDesc: 'Tüm operasyonel özellikler her plana dahildir.'
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
  freeSupportBanner: {
    title: "Jobs-Report'u Destekleyin",
    description: "Tüm özellikler 5 kullanıcıya kadar ücretsiz olarak sunulmaya devam eder. Jobs-Report sizin için faydalıysa, Starter planına geçerek uygulamanın gelişimini destekleyebilir ve 10 kullanıcıya kadar kullanabilirsiniz.",
    button: "Starter'a Geç"
  },
  plans: {
    free: {
      name: "Free",
      description: "Mikro ekipler ve serbest çalışan profesyoneller için ideal",
      features: {
        "0": "5 kullanıcıya kadar dahil",
        "1": "Tüm operasyonel özellikler dahil",
        "2": "Sınırsız proje ve raporlar",
        "3": "Fotoğraflı ve İmzalı Raporlar",
        "4": "Dahili iletişim",
        "5": "PDF ve Excel çıktıları"
      }
    },
    starter: {
      name: "Starter",
      description: "Küçük işletmeler ve 10 kişiye kadar olan ekipler için ideal",
      features: {
        "0": "10 kullanıcıya kadar dahil",
        "1": "Tüm operasyonel özellikler dahil",
        "2": "Sınırsız proje ve raporlar",
        "3": "Fotoğraflı ve İmzalı Raporlar",
        "4": "Dahili iletişim",
        "5": "PDF ve Excel çıktıları"
      }
    },
    business: {
      name: "Business",
      description: "KOBİ'ler ve 50 kişiye kadar olan yapılandırılmış ekipler için mükemmel çözüm",
      features: {
        "0": "50 kullanıcıya kadar dahil",
        "1": "Tüm operasyonel özellikler dahil",
        "2": "Sınırsız proje ve raporlar",
        "3": "Fotoğraflı ve İmzalı Raporlar",
        "4": "Dahili iletişim",
        "5": "PDF ve Excel çıktıları"
      }
    },
    growth: {
      name: "Growth",
      description: "150 kişiye kadar hızla büyüyen şirketler için",
      features: {
        "0": "150 kullanıcıya kadar dahil",
        "1": "Tüm operasyonel özellikler dahil",
        "2": "Sınırsız proje ve raporlar",
        "3": "Fotoğraflı ve İmzalı Raporlar",
        "4": "Dahili iletişim",
        "5": "PDF ve Excel çıktıları"
      }
    },
    enterprise: {
      name: "Enterprise",
      description: "150 kişiden fazla büyük organizasyonlar için özel çözüm",
      features: {
        "0": "150'den fazla kullanıcı (sınırsız)",
        "1": "Tüm operasyonel özellikler dahil",
        "2": "Sınırsız proje ve raporlar",
        "3": "Öncelikli destek ve özel başlangıç eğitimi",
        "4": "İsteğe göre özelleştirme"
      }
    }
  }
} as const;
