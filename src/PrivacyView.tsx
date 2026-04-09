import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from './App';

const privacyContent: Record<string, {
  title: string;
  lastUpdated: string;
  sections: { heading: string; body: string }[];
}> = {
  it: {
    title: 'Informativa sulla Privacy',
    lastUpdated: 'Ultimo aggiornamento: 21 marzo 2026',
    sections: [
      {
        heading: '1. Titolare del Trattamento',
        body: 'Jorg Thomas Wilkesmann — sviluppatore indipendente. Email: jtw@live.it'
      },
      {
        heading: '2. Dati Raccolti',
        body: 'Raccogliamo i seguenti dati personali: nome e cognome, indirizzo email, username, dati relativi alle ore lavorate e ai progetti gestiti.'
      },
      {
        heading: '3. Finalità del Trattamento',
        body: "I dati sono trattati per: gestione degli accessi all'applicazione, registrazione delle attività lavorative, generazione di report e analisi economiche."
      },
      {
        heading: '4. Base Giuridica',
        body: "Il trattamento è basato sul contratto tra l'utente e il titolare (art. 6, par. 1, lett. b del GDPR) e sul legittimo interesse del titolare."
      },
      {
        heading: '5. Conservazione dei Dati',
        body: 'I dati sono conservati per tutta la durata del contratto e per i successivi 10 anni ai fini fiscali e contabili.'
      },
      {
        heading: '6. Destinatari',
        body: 'I dati possono essere condivisi con Supabase Inc. (fornitore dell\'infrastruttura cloud) in qualità di responsabile del trattamento, con sede negli USA con garanzie adeguate (Standard Contractual Clauses).'
      },
      {
        heading: "7. Diritti dell'Interessato",
        body: 'Hai il diritto di accedere, rettificare, cancellare i tuoi dati, opporti al trattamento e richiedere la portabilità dei dati. Per esercitare questi diritti, contatta il titolare all\'indirizzo: jtw@live.it'
      },
      {
        heading: '8. Cookie',
        body: "L'applicazione utilizza esclusivamente cookie tecnici e di sessione necessari al funzionamento. Non vengono utilizzati cookie di profilazione o di terze parti a fini pubblicitari."
      },
    ]
  },
  en: {
    title: 'Privacy Policy',
    lastUpdated: 'Last updated: March 21, 2026',
    sections: [
      { heading: '1. Data Controller', body: 'Jorg Thomas Wilkesmann — independent developer. Email: jtw@live.it' },
      { heading: '2. Data Collected', body: 'We collect: full name, email address, username, data related to hours worked and managed projects.' },
      { heading: '3. Purpose of Processing', body: 'Data is processed for: application access management, recording work activities, generating reports and economic analyses.' },
      { heading: '4. Legal Basis', body: "Processing is based on the contract between the user and the controller (Art. 6(1)(b) GDPR) and the controller's legitimate interest." },
      { heading: '5. Data Retention', body: 'Data is retained for the duration of the contract and for the following 10 years for tax and accounting purposes.' },
      { heading: '6. Recipients', body: 'Data may be shared with Supabase Inc. (cloud infrastructure provider) as data processor, based in the USA with adequate safeguards (Standard Contractual Clauses).' },
      { heading: '7. Your Rights', body: 'You have the right to access, rectify, delete your data, object to processing and request data portability. Contact the controller at: jtw@live.it' },
      { heading: '8. Cookies', body: 'The application uses only technical session cookies necessary for operation. No profiling or third-party advertising cookies are used.' },
    ]
  },
  es: {
    title: 'Política de Privacidad',
    lastUpdated: 'Última actualización: 21 de marzo de 2026',
    sections: [
      { heading: '1. Responsable del Tratamiento', body: 'Jorg Thomas Wilkesmann — desarrollador independiente. Email: jtw@live.it' },
      { heading: '2. Datos Recopilados', body: 'Recopilamos: nombre completo, dirección de correo electrónico, nombre de usuario, datos relacionados con las horas trabajadas y los proyectos gestionados.' },
      { heading: '3. Finalidad del Tratamiento', body: 'Los datos se tratan para: gestión de accesos a la aplicación, registro de actividades laborales, generación de informes y análisis económicos.' },
      { heading: '4. Base Legal', body: 'El tratamiento se basa en el contrato entre el usuario y el responsable (Art. 6(1)(b) RGPD) y el interés legítimo del responsable.' },
      { heading: '5. Conservación de Datos', body: 'Los datos se conservan durante la vigencia del contrato y los 10 años siguientes con fines fiscales y contables.' },
      { heading: '6. Destinatarios', body: 'Los datos pueden compartirse con Supabase Inc. (proveedor de infraestructura cloud) como encargado del tratamiento, con sede en EE.UU. con garantías adecuadas (Cláusulas Contractuales Estándar).' },
      { heading: '7. Sus Derechos', body: 'Tiene derecho a acceder, rectificar, suprimir sus datos, oponerse al tratamiento y solicitar la portabilidad. Contacte al responsable en: jtw@live.it' },
      { heading: '8. Cookies', body: 'La aplicación utiliza únicamente cookies técnicas de sesión necesarias para su funcionamiento. No se utilizan cookies de perfilado ni publicitarias de terceros.' },
    ]
  },
  pl: {
    title: 'Polityka Prywatności',
    lastUpdated: 'Ostatnia aktualizacja: 21 marca 2026',
    sections: [
      { heading: '1. Administrator Danych', body: 'Jorg Thomas Wilkesmann — niezależny deweloper. Email: jtw@live.it' },
      { heading: '2. Zbierane Dane', body: 'Zbieramy: imię i nazwisko, adres e-mail, nazwę użytkownika, dane dotyczące przepracowanych godzin i zarządzanych projektów.' },
      { heading: '3. Cel Przetwarzania', body: 'Dane są przetwarzane w celu: zarządzania dostępem do aplikacji, rejestrowania aktywności zawodowej, generowania raportów i analiz ekonomicznych.' },
      { heading: '4. Podstawa Prawna', body: 'Przetwarzanie odbywa się na podstawie umowy między użytkownikiem a administratorem (art. 6 ust. 1 lit. b RODO) oraz uzasadnionego interesu administratora.' },
      { heading: '5. Okres Przechowywania', body: 'Dane są przechowywane przez czas trwania umowy i przez kolejne 10 lat do celów podatkowych i księgowych.' },
      { heading: '6. Odbiorcy', body: 'Dane mogą być udostępniane Supabase Inc. (dostawca infrastruktury chmurowej) jako podmiotowi przetwarzającemu, z siedzibą w USA z odpowiednimi zabezpieczeniami (Standardowe Klauzule Umowne).' },
      { heading: '7. Prawa Użytkownika', body: 'Masz prawo do dostępu, sprostowania, usunięcia danych, sprzeciwu wobec przetwarzania i przenoszenia danych. Skontaktuj się z administratorem: jtw@live.it' },
      { heading: '8. Pliki Cookie', body: 'Aplikacja używa wyłącznie technicznych plików cookie sesji niezbędnych do działania. Nie są używane pliki cookie profilujące ani reklamowe stron trzecich.' },
    ]
  },
  tr: {
    title: 'Gizlilik Politikası',
    lastUpdated: 'Son güncelleme: 21 Mart 2026',
    sections: [
      { heading: '1. Veri Sorumlusu', body: 'Jorg Thomas Wilkesmann — bağımsız geliştirici. E-posta: jtw@live.it' },
      { heading: '2. Toplanan Veriler', body: 'Şunları topluyoruz: ad ve soyad, e-posta adresi, kullanıcı adı, çalışılan saatler ve yönetilen projelerle ilgili veriler.' },
      { heading: '3. İşleme Amacı', body: 'Veriler şunlar için işlenir: uygulama erişim yönetimi, iş faaliyetlerinin kaydı, rapor ve ekonomik analiz üretimi.' },
      { heading: '4. Hukuki Dayanak', body: 'İşleme, kullanıcı ile veri sorumlusu arasındaki sözleşmeye (GDPR Madde 6(1)(b)) ve veri sorumlusunun meşru menfaatine dayanmaktadır.' },
      { heading: '5. Saklama Süresi', body: 'Veriler sözleşme süresince ve vergi ve muhasebe amaçları için sonraki 10 yıl boyunca saklanır.' },
      { heading: '6. Alıcılar', body: 'Veriler, uygun güvencelerle (Standart Sözleşme Maddeleri) ABD merkezli Supabase Inc. ile (bulut altyapı sağlayıcısı) paylaşılabilir.' },
      { heading: '7. Haklarınız', body: 'Verilerinize erişme, düzeltme, silme, işlemeye itiraz etme ve taşınabilirlik talep etme hakkınız vardır. Veri sorumlusuyla iletişime geçin: jtw@live.it' },
      { heading: '8. Çerezler', body: 'Uygulama yalnızca çalışması için gerekli teknik oturum çerezleri kullanır. Profil oluşturma veya üçüncü taraf reklam çerezleri kullanılmamaktadır.' },
    ]
  },
  da: {
    title: 'Privatlivspolitik',
    lastUpdated: 'Sidst opdateret: 21. marts 2026',
    sections: [
      { heading: '1. Dataansvarlig', body: 'Jorg Thomas Wilkesmann — uafhængig udvikler. E-mail: jtw@live.it' },
      { heading: '2. Indsamlede Data', body: 'Vi indsamler: fuldt navn, e-mailadresse, brugernavn, data vedrørende arbejdede timer og administrerede projekter.' },
      { heading: '3. Behandlingsformål', body: 'Data behandles til: administration af adgang til applikationen, registrering af arbejdsaktiviteter, generering af rapporter og økonomiske analyser.' },
      { heading: '4. Retsgrundlag', body: 'Behandlingen er baseret på kontrakten mellem brugeren og den dataansvarlige (GDPR art. 6(1)(b)) og den dataansvarliges legitime interesse.' },
      { heading: '5. Opbevaringsperiode', body: 'Data opbevares i kontraktens løbetid og de efterfølgende 10 år til skatte- og regnskabsformål.' },
      { heading: '6. Modtagere', body: 'Data kan deles med Supabase Inc. (udbyder af cloud-infrastruktur) som databehandler, med hjemsted i USA med passende garantier (Standardkontraktbestemmelser).' },
      { heading: '7. Dine Rettigheder', body: 'Du har ret til at få adgang til, berigtige, slette dine data, gøre indsigelse mod behandlingen og anmode om dataportabilitet. Kontakt den dataansvarlige: jtw@live.it' },
      { heading: '8. Cookies', body: 'Applikationen bruger udelukkende tekniske sessionscookies, der er nødvendige for driften. Der bruges ingen profileringscookies eller tredjeparts reklamecookies.' },
    ]
  },
};

const PrivacyView: React.FC = () => {
  const { lang, t } = useTranslation();
  const content = privacyContent[lang] || privacyContent['it'];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="text-sm text-blue-600 hover:underline font-medium">
            ← Jobs Report
          </Link>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-2xl font-black text-slate-900 mb-2">{content.title}</h1>
          <p className="text-xs text-slate-400 mb-8 font-medium">{content.lastUpdated}</p>
          <div className="space-y-6">
            {content.sections.map((section, i) => (
              <div key={i}>
                <h2 className="text-sm font-black text-slate-800 mb-2 uppercase tracking-wide">
                  {section.heading}
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">{section.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 pt-6 border-t border-slate-100 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors"
            >
              ← {t('backToApp')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyView;
