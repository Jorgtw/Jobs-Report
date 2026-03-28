const fs = require('fs');
let content = fs.readFileSync('src/translations.ts', 'utf8');

const reps = [
  { term: '    terms: "Termini di Servizio",', val: '\n    impersonating: "Impersonando",\n    backToAdmin: "Torna ad Admin",\n    backToApp: "Torna all\'app",\n    registrationDesc: "Invia la tua richiesta per registrare una nuova azienda su JobsReport.",\n    requestSentDesc: "Ti contatteremo al più presto. Grazie per aver scelto JobsReport.",\n    sending: "Invio in corso..."' },
  { term: '    terms: "Terms of Service",', val: '\n    impersonating: "Impersonating",\n    backToAdmin: "Back to Admin",\n    backToApp: "Back to app",\n    registrationDesc: "Send your request to register a new company on JobsReport.",\n    requestSentDesc: "We will contact you as soon as possible. Thank you for choosing JobsReport.",\n    sending: "Sending..."' },
  { term: '    terms: "Términos de Servicio",', val: '\n    impersonating: "Suplantando a",\n    backToAdmin: "Volver a Admin",\n    backToApp: "Volver a la app",\n    registrationDesc: "Envíe su solicitud para registrar una nueva empresa en JobsReport.",\n    requestSentDesc: "Nos pondremos en contacto con usted lo antes posible. Gracias por elegir JobsReport.",\n    sending: "Enviando..."' },
  { term: '    terms: "Polityka prywatności",', val: '\n    impersonating: "Wcielanie się w",\n    backToAdmin: "Wróć do Admina",\n    backToApp: "Wróć do aplikacji",\n    registrationDesc: "Wyślij prośbę o rejestrację nowej firmy w JobsReport.",\n    requestSentDesc: "Skontaktujemy się z Tobą najszybciej jak to możliwe. Dziękujemy za wybór JobsReport.",\n    sending: "Wysyłanie..."' },
  { term: '    terms: "Hizmet Şartları",', val: '\n    impersonating: "Taklit ediliyor",\n    backToAdmin: "Yöneticiye Dön",\n    backToApp: "Uygulamaya dön",\n    registrationDesc: "JobsReport\\'ta yeni bir şirket kaydetmek için isteğinizi gönderin.",\n    requestSentDesc: "En kısa sürede sizinle iletişime geçeceğiz. JobsReport\\'u seçtiğiniz için teşekkür ederiz.",\n    sending: "Gönderiliyor..."' },
  { term: '    terms: "Servicevilkår",', val: '\n    impersonating: "Udgiver sig for at være",\n    backToAdmin: "Tilbage til Admin",\n    backToApp: "Tilbage til appen",\n    registrationDesc: "Send din anmodning om at registrere et nyt firma på JobsReport.",\n    requestSentDesc: "Vi kontakter dig hurtigst muligt. Tak fordi du valgte JobsReport.",\n    sending: "Sender..."' }
];

// Fallback search since terms translation vary in different languages
for (const r of reps) {
  content = content.replace(r.term, r.term + r.val);
}

fs.writeFileSync('src/translations.ts', content);
console.log('Update finished.');
