/**
 * @fileoverview Registro centrale per tutti gli handler dei job a lunga esecuzione.
 * Questa funzione è fondamentale per permettere alla MyJobQueue di riprendere i job
 * da esecuzioni interrotte, poiché ricarica la conoscenza di tutti i tipi di job.
 */

/**
 * Registra tutti gli handler di job disponibili nell'applicazione.
 * Questa funzione deve essere aggiornata ogni volta che si aggiunge un nuovo tipo di job.
 * 
 * @param {MyJobQueue} jobQueue - L'istanza della coda dei job su cui registrare gli handler.
 */
function registraHandlerJob(jobQueue) {
  
  // Esempio per il job di generazione documenti
  jobQueue.registraJobHandler('generaDocumenti', generaDocumentiHandler);

  // Esempio per il job di creazione fogli PCTO (dal tuo file conv2.js)
  // Assicurati che 'jobHandlerCreazionePCTO' sia accessibile globalmente
  if (typeof jobHandlerCreazionePCTO !== 'undefined') {
    jobQueue.registraJobHandler('CREA_FOGLI_PCTO', jobHandlerCreazionePCTO);
  }

  // --- AGGIUNGI QUI ALTRI JOB HANDLER ---
  // Esempio:
  // jobQueue.registraJobHandler('invioNotificheMassa', invioNotificheHandler);
  // jobQueue.registraJobHandler('sincronizzaDatiEsterni', syncDatiHandler);
}



/**
 * Inizializza tutti i servizi necessari per la generazione documenti e notifiche.
 * @return {Object} Oggetto contenente tutti i servizi inizializzati.
 */
function inizializzaServizi() {
  // Servizi base
  const logger = new MyLoggerService({ livello: 'INFO' });
  const utils = new MyUtilsService();
  const cache = new MyCacheService();
  const exceptionService = new MyExceptionService(logger, utils);
  
  // Servizi Google
  const spreadsheetService = new MySpreadsheetService(logger, cache, utils);
  const documentService = new MyDocumentService(logger, cache, utils);
  const driveService = new MyDriveService(logger, cache, utils);
  const permissionService = new MyPermissionService(logger, cache, utils);
  
  // Mustache per template
  const mustache = new MyMustache({ logger: logger });
  
  // Gestori database
  const gestoreDB = new GestoreDatabaseAnniScolastici(logger, cache, utils, spreadsheetService);
  
  // Gestori entità
  const gestoreDocumenti = new GestoreDocumenti(logger, gestoreDB, cache, utils);
  const gestoreDocumentiGenerati = new GestoreDocumentiGenerati(logger, gestoreDB, cache, utils);
  const gestoreCartelle = new GestoreCartelleGenerate(logger, gestoreDB, cache, utils);
  const gestoreCarenze = new GestoreCarenze(logger, gestoreDB, cache, utils);
  const gestoreClassi = new GestoreClassi(logger, gestoreDB, cache, utils);
  const gestoreAlunni = new GestoreAlunni(logger, gestoreDB, cache, utils);
  const gestoreDocenti = new GestoreDocenti(logger, gestoreDB, cache, utils);
  const gestoreMaterie = new GestoreMaterie(logger, gestoreDB, cache, utils);
  const gestoreRuoli = new GestoreRuoli(logger, gestoreDB, cache, utils);
  

  // Gestori specifici per le notifiche
  // Assicurati che la classe GestoreEmailInviate esista e sia definita correttamente
  const gestoreEmailInviate = new GestoreEmailInviate(logger, gestoreDB, cache, utils); 
  
  const gestorePattern = new GestorePatternEmail(utils, logger, gestoreDB);

  // Inizializza i gestori
  gestoreDocumenti.inizializza();
  gestoreDocumentiGenerati.inizializza();
  gestoreCartelle.inizializza();
  gestoreCarenze.inizializza();
  gestoreClassi.inizializza();
  gestoreAlunni.inizializza();
  gestoreDocenti.inizializza();
  gestoreMaterie.inizializza();
  gestoreRuoli.inizializza();
  
  // Archivio placeholder
  const archivioPlaceholder = new ArchivioPlaceholder(gestoreDB, logger, mustache, utils, driveService);
  
  // Placeholder service
  const placeholderService = new MyPlaceholderService(
    archivioPlaceholder,
    documentService,
    spreadsheetService,
    logger,
    mustache,
    utils
  );

  // Crea il GestoreNotifiche qui, con tutte le dipendenze corrette
  const gestoreNotifiche = new GestoreNotifiche(
      logger,
      utils, 
      gestoreDB, 
      gestorePattern, 
      gestoreEmailInviate, 
      gestoreAlunni,
      gestoreDocenti,
      gestoreMaterie,
      gestoreDocumenti
  );

  // --- FINE MODIFICHE IMPORTANTI ---
  
  return {
    logger,
    utils,
    cache,
    exceptionService,
    spreadsheetService,
    documentService,
    driveService,
    permissionService,
    mustache,
    gestoreDB,
    gestoreDocumenti,
    gestoreDocumentiGenerati,
    gestoreCartelle,
    gestoreCarenze,
    gestoreClassi,
    gestoreAlunni,
    gestoreDocenti,
    gestoreMaterie,
    archivioPlaceholder,
    placeholderService,
    // Aggiungi i nuovi servizi all'oggetto restituito
    gestorePattern,
    gestoreEmailInviate,
    gestoreNotifiche,
    gestoreRuoli,
    myMailService: new MyMailService(logger)
  };
}



/**
 * SVUOTA TUTTE LE PROPRIETÀ DELLO SCRIPT.
 * 
 * ATTENZIONE: Questa funzione è distruttiva e irreversibile.
 * Rimuove TUTTI i dati salvati da PropertiesService.getScriptProperties(),
 * inclusi gli stati di tutti i job in esecuzione o in pausa.
 * 
 * Utile per resettare completamente l'ambiente durante i test.
 * NON eseguire in un ambiente di produzione se non si è sicuri al 100%.
 */
function svuotaTutteLeProprietaDelloScript() {
  const logger = new MyLoggerService({ livello: 'INFO' });
  
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const chiavi = scriptProperties.getKeys();
    
    if (chiavi.length === 0) {
      logger.info("Nessuna proprietà dello script da svuotare.");
      console.log("Nessuna proprietà dello script da svuotare.");
      return "Nessuna proprietà trovata.";
    }

    logger.info(`Trovate ${chiavi.length} proprietà da eliminare. Inizio pulizia...`);
    
    // Elimina tutte le proprietà
    scriptProperties.deleteAllProperties();
    
    // Verifica che la pulizia sia avvenuta
    const chiaviRimanenti = scriptProperties.getKeys();
    
    if (chiaviRimanenti.length === 0) {
      logger.info("Tutte le proprietà dello script sono state eliminate con successo.");
      console.log("Tutte le proprietà dello script sono state eliminate con successo.");
      return `Pulizia completata. Eliminate ${chiavi.length} proprietà.`;
    } else {
      logger.error("ERRORE: Non è stato possibile eliminare tutte le proprietà.");
      console.log("ERRORE: Non è stato possibile eliminare tutte le proprietà.");
      return "Pulizia fallita. Alcune proprietà potrebbero essere rimaste.";
    }
    
  } catch (e) {
    logger.error(`Si è verificato un errore durante la pulizia delle proprietà: ${e.message}`);
    console.log(`Si è verificato un errore durante la pulizia delle proprietà: ${e.message}`);
    return "Errore durante la pulizia.";
  }
}