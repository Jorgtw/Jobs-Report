import { allTranslations } from './src/i18n/index';

console.log("IT communications.todo:", allTranslations.it.communications.todo);
console.log("EN communications.todo:", allTranslations.en.communications.todo);
console.log("ES communications.todo:", allTranslations.es.communications.todo);

console.log("EN common checking fallback (should be Italian):", allTranslations.en.common.search);

// Check if objects are references or distinct
console.log("Are it.common and en.common the same reference?", allTranslations.it.common === allTranslations.en.common);
console.log("Are it.communications and en.communications the same reference?", allTranslations.it.communications === allTranslations.en.communications);
