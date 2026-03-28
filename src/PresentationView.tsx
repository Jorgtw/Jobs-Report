import React, { useState, useContext, useEffect } from 'react';

import { LanguageContext } from './App';

const useTranslation = () => {
  const context = useContext(LanguageContext);
  return { 
    t: context.t, 
    i18n: { 
      language: context.lang, 
      changeLanguage: context.setLang 
    } 
  };
};

// --- Mockup Translation Dictionary ---
const MOCK_I18N: any = {
  it: {
    sidebar: { clienti:'Clienti', personale:'Personale', progetti:'Progetti', subappalti:'Subappalti', rapportini:'Rapportini', sommario:'Sommario Lavori', profilo:'Profilo', assistenza:'Assistenza', esci:'Esci' },
    hero: { tag:'Il valore dell\'esperienza', title:'Rapportini e controllo costi in tempo reale', desc:'Realizzato dopo oltre 30 anni di esperienza vissuta in prima persona sul campo: prima come operaio e poi come amministratore. JobsReport è lo strumento concreto nato dall\'esigenza reale di chi gestisce il cantiere ogni giorno.' },
    ui: { key_features:'Funzionalità Chiave', request_demo:'Richiedi una demo gratuita →', footer_rights:'Tutti i diritti riservati', overlay_title:'Benvenuto in JobsReport', overlay_sub:'Scegli la tua lingua per iniziare la presentazione' },
    sections: {
      clienti: { icon:'👥', color:'#10b981', title:'Clienti', desc:'Anagrafica essenziale per la gestione dei tuoi cantieri.', groups:[ {title:'Dati Aziendali', color:'#10b981', items:[ {name:'Scheda essenziale', desc:'Nome ditta, P.IVA e contatti.'}, {name:'Stato Cliente', desc:'Gestione Attivi/Non attivi.'} ]} ] },
      personale: { icon:'🛡️', color:'#ef4444', title:'Il Tuo Team', desc:'Gestione e onboarding del personale interno ed esterno.', groups:[ {title:'Ruoli e Lingua', color:'#ef4444', items:[ {name:'Onboarding', desc:'Invia istruzioni app nella lingua del lavoratore.'}, {name:'Ruoli', desc:'Operaio, Incaricato o Amministrativo.'} ]} ] },
      progetti: { icon:'💼', color:'#f59e0b', title:'Progetti', desc:'Configurazione dei cantieri e delle attività interne.', groups:[ {title:'Tipologia', color:'#f59e0b', items:[ {name:'Clienti vs Interni', desc:'Gestione commesse o attività come Assenze/Ferie.'}, {name:'Budgeting', desc:'Supporto per lavori a ore o a corpo.'} ]} ] },
      subappalti: { icon:'📋', color:'#06b6d4', title:'Subappalti', desc:'Collabora con ditte esterne mantenendo il controllo sui costi.', groups:[ {title:'Partner', color:'#06b6d4', items:[ {name:'Gestione Ditte', desc:'Anagrafica subappaltatori e referenti.'}, {name:'Costi Esterni', desc:'Monitoraggio lavori a corpo o a ore.'} ]} ] },
      rapportini: { icon:'📄', color:'#3b82f6', title:'Rapportini', desc:'Rendicontazione giornaliera veloce e professionale.', groups:[ {title:'Esecuzione', color:'#3b82f6', items:[ {name:'Tempi Reali', desc:'Tracciamento preciso Inizio/Fine/Pausa o ore dirette.'}, {name:'Spese', desc:'Inserimento pasti, materiali e parcheggi.'} ]}, {title:'Gestione', color:'#3b82f6', items:[ {name:'Caposquadra', desc:'L\'Incaricato inserisce i dati per tutto il team.'} ]} ] },
      sommario: { icon:'📑', color:'#8b5cf6', title:'Analisi Economica', desc:'Il Sommario Lavori: il cuore del controllo margini.', groups:[ {title:'Analisi', color:'#8b5cf6', items:[ {name:'Real-Time', desc:'Margini netti e costi calcolati all\'istante.'}, {name:'Filtri ed Export', desc:'Filtra e scarica dati in Excel o PDF.'} ]} ] },
      profilo: { icon:'👤', color:'#6b7280', title:'Il tuo Account', desc:'Personalizza la tua esperienza di lavoro.', groups:[ {title:'Account', color:'#6b7280', items:[ {name:'Sicurezza', desc:'Gestione accessi e preferenze lingua.'} ]} ] },
      assistenza: { icon:'❓', color:'#2563eb', title:'Centro Assistenza', desc:'Guide e istruzioni rapide per l\'utilizzo ottimale dell\'app.', groups:[ {title:'Guida Rapida', color:'#2563eb', items:[ {name:'Installazione', desc:'Aggiungi l\'app alla home screen (iPhone: "Aggiungi a Home", Android: "Installa App").'}, {name:'Filtri', desc:'Usa il "Sommario Lavori" per monitorare margini e costi in tempo reale.'} ]}, {title:'Supporto', color:'#2563eb', items:[ {name:'Admin', desc:'Per assistenza tecnica, contatta direttamente l\'amministratore di sistema.'} ]} ] }
    }
  },
  en: {
    sidebar: { clienti:'Clients', personale:'Personnel', progetti:'Projects', subappalti:'Subcontracts', rapportini:'Timesheets', sommario:'Work Summary', profilo:'Profile', assistenza:'Support', esci:'Exit' },
    hero: { tag:'The value of experience', title:'Timesheets and real-time cost control', desc:'Created after more than 30 years of first-hand field experience: first as a worker and then as an administrator. JobsReport is the practical tool born from the real needs of those who manage construction sites every day.' },
    ui: { key_features:'Key Features', request_demo:'Request a free demo →', footer_rights:'All rights reserved', overlay_title:'Welcome to JobsReport', overlay_sub:'Choose your language to start the presentation' },
    sections: {
      clienti: { icon:'👥', color:'#10b981', title:'Clients', desc:'Essential registry for managing your construction sites.', groups:[ {title:'Company Data', color:'#10b981', items:[ {name:'Essential Form', desc:'Company name, VAT and contacts.'}, {name:'Client Status', desc:'Easily manage Active/Inactive clients.'} ]} ] },
      personale: { icon:'🛡️', color:'#ef4444', title:'Your Team', desc:'Management and onboarding of internal and external personnel.', groups:[ {title:'Roles and Language', color:'#ef4444', items:[ {name:'Onboarding', desc:'Send app instructions in the worker\'s language.'}, {name:'Roles', desc:'Worker, Supervisor or Administrator.'} ]} ] },
      progetti: { icon:'💼', color:'#f59e0b', title:'Projects', desc:'Configuration and monitoring of sites and internal activities.', groups:[ {title:'Type', color:'#f59e0b', items:[ {name:'Clients vs Internal', desc:'Manage external orders or activities like Absence/Leave.'}, {name:'Budgeting', desc:'Support for hourly or lump-sum work.'} ]} ] },
      subappalti: { icon:'📋', color:'#06b6d4', title:'Subcontracts', desc:'Collaborate with external firms while maintaining full cost control.', groups:[ {title:'Partners', color:'#06b6d4', items:[ {name:'Firm Management', desc:'Subcontractor registry and contacts.'}, {name:'External Costs', desc:'Monitoring of lump-sum or hourly jobs.'} ]} ] },
      rapportini: { icon:'📄', color:'#3b82f6', title:'Timesheets', desc:'Make daily reporting fast, precise and professional.', groups:[ {title:'Execution', color:'#3b82f6', items:[ {name:'Real Time', desc:'Precise Start/End/Break tracking or direct hours.'}, {name:'Expenses', desc:'Field entries for meals, materials and parking.'} ]}, {title:'Management', color:'#3b82f6', items:[ {name:'Team Leader', desc:'Supervisors can enter data for the whole team.'} ]} ] },
      sommario: { icon:'📑', color:'#8b5cf6', title:'Economic Analysis', desc:'Work Summary: the core of margin control.', groups:[ {title:'Analysis', color:'#8b5cf6', items:[ {name:'Real-Time', desc:'Net margins and costs calculated instantly.'}, {name:'Filters and Export', desc:'Filter and download data in Excel or PDF.'} ]} ] },
      profilo: { icon:'👤', color:'#6b7280', title:'Your Account', desc:'Personalize your work experience.', groups:[ {title:'Account', color:'#6b7280', items:[ {name:'Security', desc:'Access management and language preferences.'} ]} ] },
      assistenza: { icon:'❓', color:'#2563eb', title:'Support Center', desc:'Quick guides and instructions for optimal app usage.', groups:[ {title:'Quick Guide', color:'#2563eb', items:[ {name:'Installation', desc:'Add the app to your home screen (iPhone: "Add to Home", Android: "Install App").'}, {name:'Filters', desc:'Use "Work Summary" to monitor margins and costs in real-time.'} ]}, {title:'Support', color:'#2563eb', items:[ {name:'Admin', desc:'For technical support, contact the system administrator directly.'} ]} ] }
    }
  },
  es: {
    sidebar: { clienti:'Clientes', personale:'Personal', progetti:'Proyectos', subappalti:'Subcontratas', rapportini:'Partes de Trabajo', sommario:'Resumen de Obra', profilo:'Perfil', assistenza:'Asistencia', esci:'Salir' },
    hero: { tag:'El valor de la experiencia', title:'Partes de trabajo y control de costes en tiempo real', desc:'Creado tras más de 30 años de experiencia directa en el campo: primero como operario y luego como administrador. JobsReport es la herramienta práctica nacida de las necesidades reales de quienes gestionan la obra cada día.' },
    ui: { key_features:'Funcionalidades Clave', request_demo:'Solicitar demo gratuita →', footer_rights:'Todos los derechos reservados', overlay_title:'Bienvenido a JobsReport', overlay_sub:'Elige tu idioma para comenzar la presentación' },
    sections: {
      clienti: { icon:'👥', color:'#10b981', title:'Clientes', desc:'Registro esencial para la gestión de tus obras.', groups:[ {title:'Datos de Empresa', color:'#10b981', items:[ {name:'Ficha esencial', desc:'Nombre, CIF y contactos.'}, {name:'Estado', desc:'Gestión de Activos/Inactivos.'} ]} ] },
      personale: { icon:'🛡️', color:'#ef4444', title:'Tu Equipo', desc:'Gestión e incorporación de personal interno y externo.', groups:[ {title:'Roles e Idioma', color:'#ef4444', items:[ {name:'Incorporación', desc:'Envía instrucciones de la app en el idioma del trabajador.'}, {name:'Roles', desc:'Operario, Encargado o Administrador.'} ]} ] },
      progetti: { icon:'💼', color:'#f59e0b', title:'Proyectos', desc:'Configuración y seguimiento de obras y actividades internas.', groups:[ {title:'Tipologia', color:'#f59e0b', items:[ {name:'Clientes vs Interno', desc:'Gestión de pedidos externos o actividades como Ausencias.'}, {name:'Presupuesto', desc:'Soporte para trabajos por horas o ajuste.'} ]} ] },
      subappalti: { icon:'📋', color:'#06b6d4', title:'Subcontratas', desc:'Colabora con empresas externas manteniendo el control total.', groups:[ {title:'Socios', color:'#06b6d4', items:[ {name:'Gestione Empresas', desc:'Registro de subcontratistas y contactos.'}, {name:'Costes Externos', desc:'Seguimiento de trabajos por horas o forfait.'} ]} ] },
      rapportini: { icon:'📄', color:'#3b82f6', title:'Partes de Trabajo', desc:'Reporte diario rápido, preciso y profesional.', groups:[ {title:'Ejecución', color:'#3b82f6', items:[ {name:'Tiempo Real', desc:'Seguimiento preciso Inicio/Fin o horas directas.'}, {name:'Gastos', desc:'Entrada de comidas, materiales y parking.'} ]}, {title:'Gestión', color:'#3b82f6', items:[ {name:'Capataz', desc:'Los encargados pueden meter dati de todo el equipo.'} ]} ] },
      sommario: { icon:'📑', color:'#8b5cf6', title:'Análisis Económico', desc:'Resumen de Obra: el corazón del control de márgenes.', groups:[ {title:'Análisis', color:'#8b5cf6', items:[ {name:'Tiempo Real', desc:'Márgenes netos y costes calculados al instante.'}, {name:'Filtros y Export', desc:'Filtra y descarga datos en Excel o PDF.'} ]} ] },
      profilo: { icon:'👤', color:'#6b7280', title:'Tu Cuenta', desc:'Personaliza tu experiencia de trabajo.', groups:[ {title:'Account', color:'#6b7280', items:[ {name:'Seguridad', desc:'Gestión de accesos y preferencias de idioma.'} ]} ] },
      assistenza: { icon:'❓', color:'#2563eb', title:'Centro de Ayuda', desc:'Guías e instrucciones rápidas para el uso óptimo de la app.', groups:[ {title:'Guía Rápida', color:'#2563eb', items:[ {name:'Instalación', desc:'Añade la app a la pantalla de inicio (iPhone: "Añadir a Inicio", Android: "Instalar App").'}, {name:'Filtros', desc:'Usa el "Resumen de Obra" para controlar márgenes e costes en tiempo real.'} ]}, {title:'Soporte', color:'#2563eb', items:[ {name:'Admin', desc:'Para soporte técnico, contacta directamente con el administrador de sistema.'} ]} ] }
    }
  },
  pl: {
    sidebar: { clienti:'Klienci', personale:'Personel', progetti:'Projekty', subappalti:'Podwykonawcy', rapportini:'Raporty pracy', sommario:'Podsumowanie prac', profilo:'Profil', assistenza:'Pomoc', esci:'Wyjdź' },
    hero: { tag:'Wartość doświadczenia', title:'Raporty i kontrola kosztów w czasie rzeczywistym', desc:'Stworzony na podstawie ponad 30-letniego doświadczenia zdobytego bezpośrednio w terenie: najpierw jako pracownik, a potem jako administrator. JobsReport to praktyczne narzędzie zrodzone z realnych potrzeb osób codziennie zarządzających budową.' },
    ui: { key_features:'Kluczowe funkcje', request_demo:'Poproś o darmowe demo →', footer_rights:'Wszelkie prawa zastrzeżone', overlay_title:'Witaj w JobsReport', overlay_sub:'Wybierz język, aby rozpocząć prezentację' },
    sections: {
      clienti: { icon:'👥', color:'#10b981', title:'Klienci', desc:'Niezbędny rejestr do zarządzania budowami.', groups:[ {title:'Dane firmy', color:'#10b981', items:[ {name:'Podstawowa karta', desc:'Nazwa firmy, NIP i kontakty.'}, {name:'Status klienta', desc:'Zarządzaj aktywnymi/nieaktywnymi klientami.'} ]} ] },
      personale: { icon:'🛡️', color:'#ef4444', title:'Twój zespół', desc:'Zarządzanie i wdrażanie personelu wewnętrznego i zewnętrznego.', groups:[ {title:'Role i język', color:'#ef4444', items:[ {name:'Wdrożenie', desc:'Wyślij instrukcje aplikacji w języku pracownika.'}, {name:'Role', desc:'Pracownik, Brygadzista lub Administrator.'} ]} ] },
      progetti: { icon:'💼', color:'#f59e0b', title:'Projekty', desc:'Konfiguracja i monitorowanie budów oraz działań wewnętrznych.', groups:[ {title:'Typologia', color:'#f59e0b', items:[ {name:'Klienci vs Wewnętrzne', desc:'Zarządzaj zleceniami lub nieobecnościami.'}, {name:'Budżet', desc:'Wsparcie dla prac godzinowych lub ryczałtowych.'} ]} ] },
      subappalti: { icon:'📋', color:'#06b6d4', title:'Podwykonawcy', desc:'Współpracuj z firmami zewnętrznymi, zachowując kontrolę nad kosztami.', groups:[ {title:'Partnerzy', color:'#06b6d4', items:[ {name:'Zarządzanie firmami', desc:'Rejestr podwykonawców i kontakty.'}, {name:'Koszty zewnętrzne', desc:'Monitorowanie prac ryczałtowych lub godzinowych.'} ]} ] },
      rapportini: { icon:'📄', color:'#3b82f6', title:'Raporty pracy', desc:'Szybkie, precyzyjne i profesjonalne raportowanie dzienne.', groups:[ {title:'Wykonanie', color:'#3b82f6', items:[ {name:'Czas rzeczywisty', desc:'Precyzyjne śledzenie początku/końca lub godziny.'}, {name:'Wydatki', desc:'Wprowadzanie posiłków, materiałów i parkingów.'} ]}, {title:'Zarządzanie', color:'#3b82f6', items:[ {name:'Kierownik zespołu', desc:'Brygadzista może wpisywać dane dla całego zespołu.'} ]} ] },
      sommario: { icon:'📑', color:'#8b5cf6', title:'Analiza ekonomiczna', desc:'Podsumowanie prac: serce kontroli marży.', groups:[ {title:'Analiza', color:'#8b5cf6', items:[ {name:'Czas rzeczywisty', desc:'Marże netto i koszty obliczane błyskawicznie.'}, {name:'Filtry i eksport', desc:'Filtruj i pobieraj dane w formacie Excel lub PDF.'} ]} ] },
      profilo: { icon:'👤', color:'#6b7280', title:'Twoje konto', desc:'Spersonalizuj swoje doświadczenie pracy.', groups:[ {title:'Konto', color:'#6b7280', items:[ {name:'Bezpieczeństwo', desc:'Zarządzanie dostępem i preferencje językowe.'} ]} ] },
      assistenza: { icon:'❓', color:'#2563eb', title:'Centrum pomocy', desc:'Szybkie przewodniki i instrukcje dla optymalnego użycia aplikacji.', groups:[ {title:'Szybki start', color:'#2563eb', items:[ {name:'Instalacja', desc:'Dodaj aplikację do ekranu głównego (iPhone: "Dodaj do ekranu", Android: "Zainstaluj").'}, {name:'Filtry', desc:'Użyj "Podsumowania prac", aby monitorować marże i koszty w czasie rzeczywistym.'} ]}, {title:'Wsparcie', color:'#2563eb', items:[ {name:'Admin', desc:'W celu uzyskania pomocy technicznej skontaktuj się z administratorem systemu.'} ]} ] }
    }
  },
  tr: {
    sidebar: { clienti:'Müşteriler', personale:'Personel', progetti:'Projeler', subappalti:'Alt Yükleniciler', rapportini:'Günlük Raporlar', sommario:'İş Özeti', profilo:'Profil', assistenza:'Destek', esci:'Çıkış' },
    hero: { tag:'Deneyimin değeri', title:'Günlük raporlar ve gerçek zamanlı maliyet kontrolü', desc:'30 yılı aşkın sahada edinilen deneyimle oluşturuldu: önce işçi, sonra yönetici olarak. JobsReport, her gün şantiyeyi yönetenlerin gerçek ihtiyaçlarından doğan pratik bir araçtır.' },
    ui: { key_features:'Temel Özellikler', request_demo:'Ücretsiz demo iste →', footer_rights:'Tüm hakları saklıdır', overlay_title:'JobsReport\'a Hoş Geldiniz', overlay_sub:'Sunuma başlamak için dilinizi seçin' },
    sections: {
      clienti: { icon:'👥', color:'#10b981', title:'Müşteriler', desc:'Şantiyelerinizi yönetmek için temel kayıt defteri.', groups:[ {title:'Şirket Bilgileri', color:'#10b981', items:[ {name:'Temel Kart', desc:'Şirket adı, Vergi No ve iletişim.'}, {name:'Müşteri Durumu', desc:'Aktif/Pasif müşterileri kolayca yönetin.'} ]} ] },
      personale: { icon:'🛡️', color:'#ef4444', title:'Ekibiniz', desc:'İç ve dış personelin yönetimi ve işe alımı.', groups:[ {title:'Roller ve Dil', color:'#ef4444', items:[ {name:'İşe Alım', desc:'Çalışanın dilinde uygulama talimatlarını gönderin.'}, {name:'Roller', desc:'İşçi, Sorumlu veya Yönetici.'} ]} ] },
      progetti: { icon:'💼', color:'#f59e0b', title:'Projeler', desc:'Şantiyelerin ve iç faaliyetlerin yapılandırılması ve izlenmesi.', groups:[ {title:'Tür', color:'#f59e0b', items:[ {name:'Müşteriler vs İç', desc:'Dış siparişleri veya izin gibi faaliyetleri yönetin.'}, {name:'Bütçeleme', desc:'Saatlik veya götürü işler için destek.'} ]} ] },
      subappalti: { icon:'📋', color:'#06b6d4', title:'Alt Yükleniciler', desc:'Maliyetlerde tam kontrolü korurken dış firmalarla iş birliği yapın.', groups:[ {title:'Ortaklar', color:'#06b6d4', items:[ {name:'Firma Yönetimi', desc:'Alt yüklenici sicili ve iletişim.'}, {name:'Dış Maliyetler', desc:'Götürü veya saatlik işlerin izlenmesi.'} ]} ] },
      rapportini: { icon:'📄', color:'#3b82f6', title:'Günlük Raporlar', desc:'Günlük raporlamayı hızlı, hassas ve profesyonel hale getirin.', groups:[ {title:'Uygulama', color:'#3b82f6', items:[ {name:'Gerçek Zamanlı', desc:'Hassas Başlangıç/Bitiş veya doğrudan saat takibi.'}, {name:'Giderler', desc:'Yemek, malzeme ve otopark girişleri.'} ]}, {title:'Yönetim', color:'#3b82f6', items:[ {name:'Ekip Lideri', desc:'Sorumlular tüm ekip için veri girişi yapabilir.'} ]} ] },
      sommario: { icon:'📑', color:'#8b5cf6', title:'Ekonomik Analiz', desc:'İş Özeti: kar marjı kontrolünün kalbi.', groups:[ {title:'Analiz', color:'#8b5cf6', items:[ {name:'Gerçek Zamanlı', desc:'Net marjlar ve maliyetler anında hesaplanır.'}, {name:'Filtreler ve Dışa Aktarma', desc:'Verileri filtreleyin ve Excel veya PDF olarak indirin.'} ]} ] },
      profilo: { icon:'👤', color:'#6b7280', title:'Hesabınız', desc:'Çalışma deneyiminizi kişiselleştirin.', groups:[ {title:'Hesap', color:'#6b7280', items:[ {name:'Güvenlik', desc:'Erişim yönetimi ve dil tercihleri.'} ]} ] },
      assistenza: { icon:'❓', color:'#2563eb', title:'Destek Merkezi', desc:'Uygulamanın en iyi kullanımı için hızlı rehberler ve talimatlar.', groups:[ {title:'Hızlı Rehber', color:'#2563eb', items:[ {name:'Kurulum', desc:'Uygulamayı ana ekrana ekleyin (iPhone: "Ana Ekrana Ekle", Android: "Yükle").'}, {name:'Filtreler', desc:'Maliyetleri gerçek zamanlı izlemek için "İş Özeti"ni kullanın.'} ]}, {title:'Support', color:'#2563eb', items:[ {name:'Yönetici', desc:'Teknik destek için doğrudan sistem yöneticisiyle iletişime geçin.'} ]} ] }
    }
  },
  da: {
    sidebar: { clienti:'Klienter', personale:'Personale', progetti:'Projekter', subappalti:'Underentreprenører', rapportini:'Dagsrapporter', sommario:'Arbejdsoversigt', profilo:'Profil', assistenza:'Support', esci:'Slet' },
    hero: { tag:'Værdien af erfaring', title:'Dagsrapporter og omkostningskontrol i realtid', desc:'Skabt efter more than 30 års erfaring på feltet: først som arbejder og derefter som administrator. JobsReport er det praktiske værktøj født af de reelle behov hos dem, der administrerer byggepladser hver dag.' },
    ui: { key_features:'Nøglefunktioner', request_demo:'Anmod om gratis demo →', footer_rights:'Alle rettigheder forbeholdes', overlay_title:'Velkommen til JobsReport', overlay_sub:'Vælg dit sprog for at starte præsentationen' },
    sections: {
      clienti: { icon:'👥', color:'#10b981', title:'Klienter', desc:'Nødvendigt register til administration af dine byggepladser.', groups:[ {title:'Virksomhedsdata', color:'#10b981', items:[ {name:'Vigtig formular', desc:'Firmanavn, CVR og kontakter.'}, {name:'Klientstatus', desc:'Administrer aktive/inaktive klienter.'} ]} ] },
      personale: { icon:'🛡️', color:'#ef4444', title:'Dit Team', desc:'Ledelse og onboarding af internt og eksternt personale.', groups:[ {title:'Roller og sprog', color:'#ef4444', items:[ {name:'Onboarding', desc:'Send app-instruktioner på arbejderens sprog.'}, {name:'Roller', desc:'Arbejder, Leder eller Administrator.'} ]} ] },
      progetti: { icon:'💼', color:'#f59e0b', title:'Projekter', desc:'Konfiguration og overvågning af pladser og interne aktiviteter.', groups:[ {title:'Typologi', color:'#f59e0b', items:[ {name:'Klienter vs Intern', desc:'Administrer eksterne ordrer eller fravær.'}, {name:'Budgettering', desc:'Støtte til timeløns- eller fastprisarbejde.'} ]} ] },
      subappalti: { icon:'📋', color:'#06b6d4', title:'Underentreprenører', desc:'Samarbejd med eksterne firmaer og bevar fuld kontrol over omkostningerne.', groups:[ {title:'Partnere', color:'#06b6d4', items:[ {name:'Firmaadministration', desc:'Register over underentreprenører og kontakter.'}, {name:'Eksterne omkostninger', desc:'Overvågning af timeløns- eller fastprisarbejde.'} ]} ] },
      rapportini: { icon:'📄', color:'#3b82f6', title:'Dagsrapporter', desc:'Gør daglig rapportering hurtig, præcis og professionel.', groups:[ {title:'Udførelse', color:'#3b82f6', items:[ {name:'Realtid', desc:'Præcis sporing af Start/Slut eller direkte timer.'}, {name:'Udgifter', desc:'Indtastning af måltider, materialer og parkering.'} ]}, {title:'Ledelse', color:'#3b82f6', items:[ {name:'Teamleder', desc:'Ledere kan indtaste data for hele teamet.'} ]} ] },
      sommario: { icon:'📑', color:'#8b5cf6', title:'Økonomisk analyse', desc:'Arbejdsoversigt: hjertet i dækningsgradskontrol.', groups:[ {title:'Analyse', color:'#8b5cf6', items:[ {name:'Realtid', desc:'Nettomarginer og omkostninger beregnet øjeblikkeligt.'}, {name:'Filtre og eksport', desc:'Filtrer og download data i Excel oder PDF.'} ]} ] },
      profilo: { icon:'👤', color:'#6b7280', title:'Din konto', desc:'Personliggør din arbejdsoplevelse.', groups:[ {title:'Konto', color:'#6b7280', items:[ {name:'Sikkerhed', desc:'Adgangsstyring og sprogindstillinger.'} ]} ] },
      assistenza: { icon:'❓', color:'#2563eb', title:'Hjælpecenter', desc:'Hurtige guides og instruktioner til optimal app-brug.', groups:[ {title:'Hurtig guide', color:'#2563eb', items:[ {name:'Installation', desc:'Tilføj appen til startskærmen (iPhone: "Føj til hjemmeskærm", Android: "Installer app").'}, {name:'Filtre', desc:'Brug "Arbejdsoversigt" til at overvåge marginer og omkostninger i realtid.'} ]}, {title:'Support', color:'#2563eb', items:[ {name:'Admin', desc:'Kontakt systemadministratoren direkte for teknisk support.'} ]} ] }
    }
  }
};

const PresentationView: React.FC = () => {
  const { i18n } = useTranslation();
  const langContext = useContext(LanguageContext);
  
  const [openPanelKey, setOpenPanelKey] = useState<string | null>(null);
  const [showLangOverlay, setShowLangOverlay] = useState(!localStorage.getItem('ws_lang'));
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ws_lang');
    if (saved) {
      i18n.changeLanguage(saved as any);
      if (langContext) langContext.setLang(saved as any);
    }
  }, []);

  const setLanguage = (lang: string) => {
    i18n.changeLanguage(lang as any);
    if (langContext) langContext.setLang(lang as any);
    localStorage.setItem('ws_lang', lang);
    setShowLangOverlay(false);
    setIsLangDropdownOpen(false);
  };

  const currentLang = (i18n.language || 'it') as keyof typeof MOCK_I18N;
  const L = MOCK_I18N[currentLang] || MOCK_I18N['it'];

  const SidebarItem = ({ id, icon, label }: { id: string, icon: string, label: string }) => (
    <div 
      onClick={() => setOpenPanelKey(id)}
      className={`sidebar-item flex items-center gap-3 px-6 py-[10px] text-[14px] cursor-pointer transition-all border-r-2 ${
        openPanelKey === id 
          ? 'text-[#2563eb] font-semibold bg-[#eff6ff] border-[#2563eb]' 
          : 'text-[#6b7280] hover:bg-[#f0f2f5] hover:text-[#1a1a2e] border-transparent'
      }`}
    >
      <span className="sidebar-icon w-5 text-center text-[16px]">{icon as React.ReactNode}</span>
      {label}
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f2f5] font-['Inter',sans-serif] text-[#1a1a2e]">
      
      {/* CSS CUSTOM CLONE */}
      <style>{`
        .shadow-sm { box-shadow: 0 1px 3px rgba(0,0,0,0.07); }
        .shadow-lg { box-shadow: 0 10px 30px rgba(0,0,0,0.12); }
        .bg-white { background: #ffffff; }
        .border-gray { border: 1px solid #e5e7eb; }
      `}</style>

      {/* TOPNAV */}
      <nav className="sticky top-0 z-[300] h-[60px] bg-white border-b border-[#e5e7eb] px-8 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-[10px] text-[18px] font-bold">
          <div className="w-[34px] h-[34px] bg-gradient-to-br from-[#2563eb] to-[#3b82f6] rounded-lg flex items-center justify-center text-white text-[16px]">📊</div>
          <div>Jobs<span className="text-[#2563eb]">Report</span></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="flex items-center gap-1.5 border border-[#e5e7eb] bg-white rounded-full px-3 py-1.5 text-[13px] font-medium text-[#6b7280] cursor-pointer"
            >
              🌐 <span className="uppercase">{String(currentLang)}</span>
            </button>
            {isLangDropdownOpen && (
              <div className="absolute top-[calc(100%+10px)] right-0 bg-white border border-[#e5e7eb] rounded-xl shadow-lg w-[160px] p-1.5 z-[400]">
                {['it', 'en', 'es', 'pl', 'tr', 'da'].map((l) => (
                  <div 
                    key={l} 
                    onClick={() => setLanguage(l)}
                    className={`flex items-center gap-2 p-2 rounded-lg text-[13px] cursor-pointer hover:bg-[#f0f2f5] ${currentLang === l ? 'bg-[#eff6ff] text-[#2563eb] font-medium' : 'text-[#6b7280]'}`}
                  >
                    <span>{l === 'it' ? '🇮🇹' : l === 'en' ? '🇬🇧' : l === 'es' ? '🇪🇸' : l === 'pl' ? '🇵🇱' : l === 'tr' ? '🇹🇷' : '🇩🇰'}</span>
                    {l === 'it' ? 'Italiano' : l === 'en' ? 'English' : l === 'es' ? 'Español' : l === 'pl' ? 'Polski' : l === 'tr' ? 'Türkçe' : 'Dansk'}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <div className="text-right">
              <div className="text-[13px] font-semibold">Thomas Demo</div>
              <div className="text-[11px] text-[#9ca3af]">Admin</div>
            </div>
            <div className="w-[34px] h-[34px] bg-[#eff6ff] rounded-full flex items-center justify-center text-[15px]">👤</div>
          </div>
        </div>
      </nav>

      <div className="flex flex-1">
        
        {/* SIDEBAR */}
        <aside className="w-[220px] bg-white border-r border-[#e5e7eb] py-6 sticky top-[60px] h-[calc(100vh-60px)] flex flex-col shrink-0">
          <div className="flex-1">
            {['clienti', 'personale', 'progetti', 'subappalti', 'rapportini', 'sommario', 'profilo', 'assistenza'].map((key) => {
              const sec = L.sections[key];
              return (
                <SidebarItem 
                  key={key} 
                  id={key} 
                  icon={sec.icon} 
                  label={L.sidebar[key]} 
                />
              );
            })}
          </div>
          <div className="border-t border-[#e5e7eb] mt-3 pt-3">
            <div 
              onClick={() => window.open('https://www.jobs-report.com','_blank')}
              className="flex items-center gap-3 px-6 py-[10px] text-[14px] text-[#9ca3af] cursor-pointer hover:bg-[#f0f2f5] hover:text-[#1a1a2e]"
            >
              <span className="sidebar-icon w-5 text-center text-[16px]">↪️</span> {L.sidebar.esci}
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className={`flex-1 p-[40px] px-[48px] transition-all duration-300 ${openPanelKey ? 'mr-[360px]' : ''}`}>
          
          <div className="flex flex-col gap-3 mb-8 bg-gradient-to-br from-[#1e40af] to-[#3b82f6] p-6 px-8 rounded-2xl text-white shadow-sm">
            <div className="inline-block self-start bg-white/15 px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wider">{L.hero.tag}</div>
            <h2 className="text-[22px] font-bold leading-tight">{L.hero.title}</h2>
            <p className="text-[14px] opacity-95 leading-relaxed">{L.hero.desc}</p>
          </div>

          <div className="text-[11px] font-semibold tracking-[1.5px] uppercase text-[#9ca3af] mb-3">{L.ui.key_features}</div>
          
          <div className="flex flex-col gap-2">
            {['clienti', 'personale', 'progetti', 'subappalti', 'rapportini', 'sommario'].map((key) => {
              const sec = L.sections[key];
              return (
                <div 
                  key={key}
                  onClick={() => setOpenPanelKey(key)}
                  className={`flex items-center gap-4 bg-white border border-[#e5e7eb] rounded-xl p-4 px-5 cursor-pointer shadow-sm transition-all hover:shadow-md hover:border-[#d1d5db] ${openPanelKey === key ? 'border-[#2563eb] ring-[3px] ring-[#2563eb]/10' : ''}`}
                >
                  <div className={`w-[44px] h-[44px] rounded-xl flex items-center justify-center text-[20px] shrink-0 text-white shadow-inner`} style={{ backgroundColor: sec.color }}>
                    {sec.icon as React.ReactNode}
                  </div>
                  <div className="flex-1">
                    <strong className="text-[13px] font-semibold tracking-[0.5px] uppercase">{sec.title}</strong>
                    <p className="text-[12px] text-[#9ca3af] mt-0.5">{sec.desc}</p>
                  </div>
                   <span className={`text-[#9ca3af] text-[18px] transition-transform ${openPanelKey === key ? 'rotate-90 text-[#2563eb]' : ''}`}>›</span>
                </div>
              );
            })}
          </div>
        </main>

        {/* DETAIL PANEL */}
        <aside className={`fixed top-[60px] right-0 w-[360px] h-[calc(100vh-60px)] bg-white border-l border-[#e5e7eb] shadow-lg flex flex-col transition-transform duration-300 z-[200] ${
          openPanelKey ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {openPanelKey && (
            <>
              <div className="p-6 px-6 pb-5 border-b border-[#e5e7eb] flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-[46px] h-[46px] rounded-xl flex items-center justify-center text-[22px] shrink-0 text-white" style={{ background: L.sections[openPanelKey].color }}>
                    {L.sections[openPanelKey].icon as React.ReactNode}
                  </div>
                  <div>
                    <div className="text-[16px] font-bold leading-tight">{L.sections[openPanelKey].title}</div>
                    <div className="text-[12px] text-[#9ca3af] mt-0.5 leading-tight">{L.sections[openPanelKey].desc}</div>
                  </div>
                </div>
                <button 
                  onClick={() => setOpenPanelKey(null)}
                  className="w-[30px] h-[30px] bg-[#f0f2f5] text-[#9ca3af] hover:bg-[#e5e7eb] hover:text-[#1a1a2e] rounded-lg flex items-center justify-center transition-colors"
                >✕</button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 px-6 space-y-6 scrollbar-thin">
                {L.sections[openPanelKey].groups.map((g: any, i: number) => (
                  <div key={i} className="space-y-2.5">
                    <div className="text-[11px] font-semibold tracking-[1.2px] uppercase text-[#9ca3af] mb-2.5">{g.title}</div>
                    {g.items.map((it: any, j: number) => (
                      <div key={j} className="flex items-start gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: g.color }}></div>
                        <p className="text-[13px] text-[#6b7280] leading-[1.5]">
                          <strong className="text-[#1a1a2e] font-medium">{it.name}</strong> — {it.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="p-4 px-6 border-t border-[#e5e7eb]">
                <button 
                  onClick={() => window.location.hash = '/richiesta-registrazione'}
                  className="w-full text-center bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium text-[14px] py-3 rounded-lg transition-all"
                >
                  {L.ui.request_demo}
                </button>
              </div>
            </>
          )}
        </aside>

      </div>

      <footer className="bg-white border-t border-[#e5e7eb] text-center p-3.5 text-[12px] text-[#9ca3af]">
        © 2025 JobsReport · {L.ui.footer_rights}
      </footer>

      {/* LANGUAGE OVERLAY */}
      {showLangOverlay && (
        <div className="fixed inset-0 z-[2000] bg-[#1a1a2e]/95 backdrop-blur-[8px] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white p-10 rounded-[24px] text-center max-w-[500px] w-full shadow-lg animate-in slide-in-from-bottom-8 duration-500">
            <div className="text-[48px] mb-5">🌐</div>
            <h2 className="text-[24px] font-bold mb-2">{L.ui.overlay_title}</h2>
            <p className="text-[#6b7280] text-[15px] mb-6 leading-tight">{L.ui.overlay_sub}</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'it', label: 'Italiano', flag: '🇮🇹' },
                { id: 'en', label: 'English', flag: '🇬🇧' },
                { id: 'es', label: 'Español', flag: '🇪🇸' },
                { id: 'pl', label: 'Polski', flag: '🇵🇱' },
                { id: 'tr', label: 'Türkçe', flag: '🇹🇷' },
                { id: 'da', label: 'Dansk', flag: '🇩🇰' }
              ].map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setLanguage(lang.id)}
                  className="flex items-center justify-center gap-2 p-3 border border-[#e5e7eb] rounded-xl hover:border-[#2563eb] hover:bg-[#eff6ff] hover:text-[#2563eb] transition-all text-[15px] font-medium"
                >
                  <span>{lang.flag}</span> {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PresentationView;
