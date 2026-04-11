import React from 'react';
import { ArrowLeft, Scale, ShieldCheck, Mail, Building2, AlertTriangle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const termsFeatures = [
  {
    icon: <Scale className="text-blue-500" />,
    title: "1. Oggetto del Servizio",
    content: "Jobs-Report è un software SaaS (Software as a Service) fornito \"as is\" volto alla gestione dei rapportini di lavoro, progetti e personale. L'uso è riservato esclusivamente a scopi B2B (Business to Business). L'utente si impegna a utilizzare il servizio in conformità con la legge applicabile."
  },
  {
    icon: <Building2 className="text-indigo-500" />,
    title: "2. Obblighi delle Parti",
    content: "L'Utente è l'unico responsabile della veridicità e legalità dei dati caricati nel sistema, incluse le informazioni sui propri dipendenti. Il Fornitore (Jobs-Report) si impegna a mantenere l'infrastruttura attiva, ma si riserva il diritto di sospendere l'accesso in caso di abuso o mancato pagamento."
  },
  {
    icon: <AlertTriangle className="text-amber-500" />,
    title: "3. Limitazione di Responsabilità",
    content: "Il Fornitore non sarà responsabile per danni diretti, indiretti, perdita di profitto, perdita di dati o interruzioni operative derivanti dall'utilizzo o dall'impossibilità di usare la piattaforma, inclusi malfunzionamenti di rete o cyber-attacchi, salvi i casi di dolo o colpa grave."
  },
  {
    icon: <Clock className="text-rose-500" />,
    title: "4. Durata e Recesso",
    content: "Il contratto ha validità legata al piano in abbonamento scelto. Entrambe le parti possono recedere con un preavviso di 30 giorni. In caso di recesso, l'utente avrà il diritto di esportare i propri dati prima della cancellazione dell'account, che avverrà entro 60 giorni dal termine."
  },
  {
    icon: <ShieldCheck className="text-emerald-500" />,
    title: "5. Uso Accettabile",
    content: "L'Utente si impegna a non tentare di violare la sicurezza del sistema (reverse engineering, accessi non autorizzati), a non rivendere il servizio e a non inserire malware, pena la risoluzione immediata del contratto e segnalazione alle autorità competenti."
  },
  {
    icon: <Mail className="text-slate-500" />,
    title: "6. Legge Applicabile e Foro Competente",
    content: "I presenti Termini sono disciplinati dalla legge italiana. Qualsiasi controversia derivante da o in connessione con i presenti Termini sarà sottoposta alla giurisdizione esclusiva del Foro ove ha sede il Fornitore, fatte salve le disposizioni inderogabili di legge territoriale europea."
  }
];

const TermsView: React.FC = () => {
  const navigate = useNavigate();

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
            Stampa Documento
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Termini di Servizio</h1>
          <p className="text-slate-500 text-lg">Ultimo aggiornamento: Aprile 2026</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden mb-12">
          <div className="p-8 sm:p-12 space-y-10">
            {termsFeatures.map((feature, idx) => (
              <div key={idx} className="flex gap-6">
                <div className="mt-1 shrink-0 p-3 bg-slate-50 rounded-2xl border border-slate-100 h-fit">
                  {feature.icon}
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
            <h3 className="text-lg font-bold text-slate-900 mb-4">Contatti Legali</h3>
            <p className="text-slate-600 mb-2">Per eventuali comunicazioni legali, privacy o richieste in merito ai presenti termini:</p>
            <a href="mailto:jtw@live.it" className="text-blue-600 font-bold hover:underline">jtw@live.it</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsView;
