import React from 'react';
import { ArrowLeft, Scale, ShieldCheck, Mail, Building2, AlertTriangle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';

const termsFeaturesIcons = [
  <Scale className="text-blue-500" />,
  <Building2 className="text-indigo-500" />,
  <AlertTriangle className="text-amber-500" />,
  <Clock className="text-rose-500" />,
  <ShieldCheck className="text-emerald-500" />,
  <Mail className="text-slate-500" />
];

const termsContent: Record<string, {
  print: string;
  title: string;
  lastUpdated: string;
  legalContacts: string;
  legalDesc: string;
  features: { title: string; content: string }[];
}> = {
  it: {
    print: "Stampa Documento",
    title: "Termini di Servizio",
    lastUpdated: "Ultimo aggiornamento: Aprile 2026",
    legalContacts: "Contatti Legali",
    legalDesc: "Per eventuali comunicazioni legali, privacy o richieste in merito ai presenti termini:",
    features: [
      {
        title: "1. Oggetto del Servizio",
        content: "Jobs-Report è un software SaaS (Software as a Service) fornito \"as is\" volto alla gestione dei rapportini di lavoro, progetti e personale. L'uso è riservato esclusivamente a scopi B2B (Business to Business). L'utente si impegna a utilizzare il servizio in conformità con la legge applicabile."
      },
      {
        title: "2. Obblighi delle Parti",
        content: "L'Utente è l'unico responsabile della veridicità e legalità dei dati caricati nel sistema, incluse le informazioni sui propri dipendenti. Il Fornitore (Jobs-Report) si impegna a mantenere l'infrastruttura attiva, ma si riserva il diritto di sospendere l'accesso in caso di abuso o mancato pagamento."
      },
      {
        title: "3. Limitazione di Responsabilità",
        content: "Il Fornitore non sarà responsabile per danni diretti, indiretti, perdita di profitto, perdita di dati o interruzioni operative derivanti dall'utilizzo o dall'impossibilità di usare la piattaforma, inclusi malfunzionamenti di rete o cyber-attacchi, salvi i casi di dolo o colpa grave."
      },
      {
        title: "4. Durata e Recesso",
        content: "Il contratto ha validità legata al piano in abbonamento scelto. Entrambe le parti possono recedere con un preavviso di 30 giorni. In caso di recesso, l'utente avrà il diritto di esportare i propri dati prima della cancellazione dell'account, che avverrà entro 60 giorni dal termine."
      },
      {
        title: "5. Uso Accettabile",
        content: "L'Utente si impegna a non tentare di violare la sicurezza del sistema (reverse engineering, accessi non autorizzati), a non rivendere il servizio e a non inserire malware, pena la risoluzione immediata del contratto e segnalazione alle autorità competenti."
      },
      {
        title: "6. Legge Applicabile e Foro Competente",
        content: "I presenti Termini sono disciplinati dalla legge italiana. Qualsiasi controversia derivante da o in connessione con i presenti Termini sarà sottoposta alla giurisdizione esclusiva del Foro ove ha sede il Fornitore, fatte salve le disposizioni inderogabili di legge territoriale europea."
      }
    ]
  },
  en: {
    print: "Print Document",
    title: "Terms of Service",
    lastUpdated: "Last updated: April 2026",
    legalContacts: "Legal Contacts",
    legalDesc: "For any legal communications, privacy or requests regarding these terms:",
    features: [
      {
        title: "1. Subject of the Service",
        content: "Jobs-Report is a SaaS (Software as a Service) software provided \"as is\" for managing work reports, projects and personnel. Use is exclusively reserved for B2B (Business to Business) purposes. The user agrees to use the service in compliance with applicable law."
      },
      {
        title: "2. Obligations of the Parties",
        content: "The User is solely responsible for the accuracy and legality of the data loaded into the system, including information about their employees. The Supplier (Jobs-Report) agrees to maintain the infrastructure active, but reserves the right to suspend access in case of abuse or non-payment."
      },
      {
        title: "3. Limitation of Liability",
        content: "The Supplier shall not be liable for direct, indirect damages, loss of profit, loss of data or operational interruptions resulting from the use or inability to use the platform, including network malfunctions or cyber-attacks, except in cases of willful misconduct or gross negligence."
      },
      {
        title: "4. Duration and Termination",
        content: "The contract's validity is linked to the chosen subscription plan. Both parties may terminate with a 30-day notice. In case of termination, the user will have the right to export their data before account deletion, which will occur within 60 days from the end date."
      },
      {
        title: "5. Acceptable Use",
        content: "The User agrees not to attempt to violate the system security (reverse engineering, unauthorized access), not to resell the service, and not to insert malware, under penalty of immediate termination of the contract and reporting to the competent authorities."
      },
      {
        title: "6. Applicable Law and Competent Jurisdiction",
        content: "These Terms are governed by Italian law. Any dispute arising out of or in connection with these Terms shall be submitted to the exclusive jurisdiction of the Court where the Supplier is based, without prejudice to the mandatory provisions of European territorial law."
      }
    ]
  },
  es: {
    print: "Imprimir Documento",
    title: "Términos del Servicio",
    lastUpdated: "Última actualización: Abril de 2026",
    legalContacts: "Contactos Legales",
    legalDesc: "Para cualquier comunicación legal, privacidad o solicitudes respecto a estos términos:",
    features: [
      {
        title: "1. Objeto del Servicio",
        content: "Jobs-Report es un software SaaS (Software como Servicio) proporcionado \"tal cual\" para gestionar informes de trabajo, proyectos y personal. El uso está reservado exclusivamente para fines B2B (Business to Business). El usuario se compromete a utilizar el servicio de conformidad con la ley aplicable."
      },
      {
        title: "2. Obligaciones de las Partes",
        content: "El Usuario es el único responsable de la veracidad y legalidad de los datos cargados en el sistema, incluida la información sobre sus empleados. El Proveedor (Jobs-Report) se compromete a mantener la infraestructura activa, pero se reserva el derecho de suspender el acceso en caso de abuso o falta de pago."
      },
      {
        title: "3. Limitación de Responsabilidad",
        content: "El Proveedor no será responsable de los daños directos, indirectos, pérdida de beneficios, pérdida de datos o interrupciones operativas resultantes del uso o la imposibilidad de usar la plataforma, incluidos fallos de red o ciberataques, excepto en casos de dolo o negligencia grave."
      },
      {
        title: "4. Duración y Rescisión",
        content: "La validez del contrato está vinculada al plan de suscripción elegido. Ambas partes pueden rescindir con un aviso de 30 días. En caso de rescisión, el usuario tendrá derecho a exportar sus datos antes de la eliminación de la cuenta, que se provocará dentro de los 60 días posteriores a la fecha de finalización."
      },
      {
        title: "5. Uso Aceptable",
        content: "El Usuario se compromete a no intentar violar la seguridad del sistema (ingeniería inversa, acceso no autorizado), no revender el servicio y no insertar software malicioso, bajo pena de rescisión inmediata del contrato y denuncia ante las autoridades competentes."
      },
      {
        title: "6. Ley Aplicable y Jurisdicción Competente",
        content: "Estos Términos se rigen por la ley italiana. Cualquier controversia que surja de o en relación con estos Términos se someterá a la jurisdicción exclusiva del Tribunal donde tenga su sede el Proveedor, sin perjuicio de las disposiciones obligatorias de la ley territorial europea."
      }
    ]
  },
  pl: {
    print: "Drukuj dokument",
    title: "Regulamin świadczenia usług",
    lastUpdated: "Ostatnia aktualizacja: kwiecień 2026",
    legalContacts: "Kontakty prawne",
    legalDesc: "Wszelka komunikacja prawna, prywatność lub zapytania dotyczące niniejszych warunków:",
    features: [
      {
        title: "1. Przedmiot usługi",
        content: "Jobs-Report to oprogramowanie SaaS (Software as a Service) dostarczane w stanie \"takim, jakim jest\" do zarządzania raportami pracy, projektami i personelem. Korzystanie z niego jest zarezerwowane wyłącznie do celów B2B (Business to Business). Użytkownik zobowiązuje się do korzystania z serwisu zgodnie z obowiązującym prawem."
      },
      {
        title: "2. Obowiązki stron",
        content: "Użytkownik ponosi wyłączną odpowiedzialność za prawdziwość i legalność danych wprowadzonych do systemu, w tym informacji o swoich pracownikach. Dostawca (Jobs-Report) zobowiązuje się do utrzymania aktywności infrastruktury, zastrzega sobie jednak prawo do zawieszenia dostępu w przypadku nadużyć lub braku płatności."
      },
      {
        title: "3. Ograniczenie odpowiedzialności",
        content: "Dostawca nie ponosi odpowiedzialności za szkody bezpośrednie, pośrednie, utratę zysku, utratę danych lub przerwy w działalności wynikające z korzystania lub braku możliwości korzystania z platformy, w tym awarii sieci lub cyberataków, z wyjątkiem przypadków umyślnego działania lub rażącego niedbalstwa."
      },
      {
        title: "4. Czas trwania i wypowiedzenie",
        content: "Ważność umowy jest powiązana z wybranym planem subskrypcyjnym. Każda ze stron może wypowiedzieć umowę z zachowaniem 30-dniowego okresu wypowiedzenia. W przypadku wypowiedzenia użytkownik ma prawo do eksportu swoich danych przed usunięciem konta, co nastąpi w ciągu 60 dni od daty zakończenia."
      },
      {
        title: "5. Dopuszczalne użytkowanie",
        content: "Użytkownik zobowiązuje się nie podejmować prób naruszenia bezpieczeństwa systemu (inżynieria wsteczna, nieautoryzowany dostęp), nie odsprzedawać usługi oraz nie wprowadzać złośliwego oprogramowania pod rygorem natychmiastowego rozwiązania umowy i zgłoszenia sprawy właściwym organom."
      },
      {
        title: "6. Prawo właściwe i jurysdykcja",
        content: "Niniejsze Warunki podlegają prawu włoskiemu. Wszelkie spory wynikające z niniejszych Warunków lub z nimi związane będą poddawane wyłącznej jurysdykcji Sądu właściwego dla siedziby Dostawcy, bez uszczerbku dla bezwzględnie obowiązujących przepisów europejskiego prawa terytorialnego."
      }
    ]
  },
  tr: {
    print: "Belgeyi Yazdır",
    title: "Hizmet Şartları",
    lastUpdated: "Son güncelleme: Nisan 2026",
    legalContacts: "Yasal İletişim",
    legalDesc: "Bu şartlarla ilgili her türlü yasal iletişim, gizlilik veya talepler için:",
    features: [
      {
        title: "1. Hizmetin Konusu",
        content: "Jobs-Report, iş raporlarını, projeleri ve personeli yönetmek için \"olduğu gibi\" sağlanan bir SaaS (Hizmet Olarak Yazılım) yazılımıdır. Kullanım yalnızca B2B (İşletmeden İşletmeye) amaçlarına ayrılmıştır. Kullanıcı, hizmeti yürürlükteki yasalara uygun olarak kullanmayı kabul eder."
      },
      {
        title: "2. Tarafların Yükümlülükleri",
        content: "Sisteme yüklenen verilerin, çalışanlarıyla ilgili bilgiler de dahil olmak üzere, doğruluğu ve yasallığından yalnızca Kullanıcı sorumludur. Sağlayıcı (Jobs-Report), altyapıyı aktif tutmayı taahhüt eder ancak kötüye kullanım veya ödeme yapılmaması durumunda erişimi askıya alma hakkını saklı tutar."
      },
      {
        title: "3. Sorumluluğun Sınırlandırılması",
        content: "Sağlayıcı; kasıt veya ağır ihmal durumları hariç, ağ arızaları veya siber saldırılar dahil olmak üzere platformun kullanılmasından veya kullanılamamasından kaynaklanan doğrudan, dolaylı zararlardan, kar kayıplarından, veri kayıplarından veya operasyonel kesintilerden sorumlu olmayacaktır."
      },
      {
        title: "4. Süre ve Fesih",
        content: "Sözleşmenin geçerliliği seçilen abonelik planına bağlıdır. Her iki taraf da 30 gün önceden bildirimde bulunarak sözleşmeyi feshedebilir. Fesih durumunda, kullanıcı bitiş tarihinden itibaren 60 gün içinde gerçekleşecek olan hesap silme işleminden önce verilerini ihraç etme hakkına sahip olacaktır."
      },
      {
        title: "5. Kabul Edilebilir Kullanım",
        content: "Kullanıcı; sözleşmenin derhal feshedilmesi ve yetkili makamlara bildirilmesi cezası altında, sistem güvenliğini ihlal etmeye çalışmamayı (tersine mühendislik, yetkisiz erişim), hizmeti yeniden satmamayı ve kötü amaçlı yazılım eklememeyi kabul eder."
      },
      {
        title: "6. Uygulanacak Hukuk ve Yetkili Mahkeme",
        content: "Bu Şartlar İtalyan yasalarına tabidir. Bu Şartlardan kaynaklanan veya bu Şartlarla bağlantılı olarak ortaya çıkan her türlü uyuşmazlık, Avrupa bölgesel yasalarının emredici hükümleri saklı kalmak kaydıyla, Sağlayıcının yerleşik olduğu yerdeki Mahkemenin münhasır yargı yetkisine sunulacaktır."
      }
    ]
  },
  da: {
    print: "Print Dokument",
    title: "Vilkår for Service",
    lastUpdated: "Sidst opdateret: April 2026",
    legalContacts: "Juridisk Kontakt",
    legalDesc: "For enhver juridisk kommunikation, privatliv eller forespørgsler vedrørende disse vilkår:",
    features: [
      {
        title: "1. Tjenestens emne",
        content: "Jobs-Report er en SaaS-software (Software as a Service) leveret \"som den er\" til styring af arbejdsrapporter, projekter og personale. Brug er udelukkende forbeholdt B2B-formål (Business to Business). Brugeren indvilger i at bruge tjenesten i overensstemmelse med gældende lovgivning."
      },
      {
        title: "2. Parternes forpligtelser",
        content: "Brugeren er eneansvarlig for nøjagtigheden og lovligheden af de data, der indlæses i systemet, herunder oplysninger om deres medarbejdere. Leverandøren (Jobs-Report) forpligter sig til at holde infrastrukturen aktiv, men forbeholder sig retten til at suspendere adgangen i tilfælde af misbrug eller manglende betaling."
      },
      {
        title: "3. Ansvarsbegrænsning",
        content: "Leverandøren er ikke ansvarlig for direkte, indirekte skader, tab af fortjeneste, tab af data eller driftsforstyrrelser som følge af brug eller manglende evne til at bruge platformen, herunder netværksfejl eller cyberangreb, undtagen i tilfælde af forsætlig misligholdelse eller grov uagtsomhed."
      },
      {
        title: "4. Varighed og opsigelse",
        content: "Kontraktens gyldighed er knyttet til den valgte abonnementsplan. Begge parter kan opsige med et varsel på 30 dage. I tilfælde af opsigelse vil brugeren have ret til at eksportere sine data inden sletning af kontoen, hvilket sker inden for 60 dage fra slutdatoen."
      },
      {
        title: "5. Acceptabel brug",
        content: "Brugeren indvilger i ikke at forsøge at overtræde systemsikkerheden (reverse engineering, uautoriseret adgang), ikke at videresælge tjenesten og ikke at indsætte malware, under straf af øjeblikkelig opsigelse af kontrakten og indberetning til de kompetente myndigheder."
      },
      {
        title: "6. Lovvalg og værneting",
        content: "De vilkår er underlagt italiensk lov. Enhver tvist, der opstår som følge af eller i forbindelse med disse vilkår, skal indbringes for den eksklusive domstol, hvor leverandøren har hjemsted, uden at det berører de præceptive bestemmelser i europæisk territorial lovgivning."
      }
    ]
  }
};

const TermsView: React.FC = () => {
  const navigate = useNavigate();
  const { lang } = useTranslation();
  const content = termsContent[lang] || termsContent['it'];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Scale className="text-blue-500" size={24} />
              <span className="font-bold text-white tracking-wide">Jobs-Report Legal</span>
            </div>
          </div>
          <button 
            onClick={() => window.print()}
            className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            {content.print}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">{content.title}</h1>
          <p className="text-slate-500 text-lg">{content.lastUpdated}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden mb-12">
          <div className="p-8 sm:p-12 space-y-10">
            {content.features.map((feature, idx) => (
              <div key={idx} className="flex gap-6">
                <div className="mt-1 shrink-0 p-3 bg-slate-50 rounded-2xl border border-slate-100 h-fit">
                  {termsFeaturesIcons[idx] || <Scale className="text-blue-500" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-[15px]">
                    {feature.content}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 p-8 sm:p-12 border-t border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">{content.legalContacts}</h3>
            <p className="text-slate-600 mb-2">{content.legalDesc}</p>
            <a href="mailto:jtw@live.it" className="text-blue-600 font-bold hover:underline">jtw@live.it</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsView;
