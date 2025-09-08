/**
 * Funzione per testare JobQueue con dati delle classi
 */
function testJobQueueConClassi() {
  // Inizializza i servizi necessari
  const logger = new MyLoggerService({ livello: 'INFO' });
  const utils = new MyUtilsService();
  const cache = new MyCacheService();
  const spreadsheetService = new MySpreadsheetService(logger, cache, utils);
  
  // Inizializza la coda dei job
  const jobQueue = new MyJobQueue(logger, utils);

  // Imposta una durata molto breve per forzare l'interruzione e la ripresa
  jobQueue.impostaDurataMassima(2 * 1000); // 2 secondi
  
  // Recupera il gestore database con tutti i parametri richiesti
  const gestoreDB = new GestoreDatabaseAnniScolastici(logger, cache, utils, spreadsheetService);
  
  // Registra l'handler per il job di generazione documenti
  // Assicurati che esista un file `Base/JobRegistry.js` con questa funzione
  registraHandlerJob(jobQueue);
  
  // Esegui il job
  jobQueue.esegui(
    'generaDocClassi', 
    'generaDocumenti', 
    {
      // CORREZIONE: Passiamo l'oggetto gestoreDB per la prima esecuzione.
      // Verrà rimosso automaticamente al salvataggio dello stato e
      // re-iniettato dalla funzione riprendiJob.
      gestoreDB: gestoreDB,
      annoScolastico: null // Usa anno corrente
    }, 
    true // Forza la ripartenza per pulire lo stato di test precedenti
  );
  
  return "Job avviato. Controlla i log per vedere l'interruzione e la ripresa.";
}


/**
 * Handler per il job di generazione documenti
 * Implementato come generatore per permettere pause e riprese
 * @param {Object} parametri - Parametri del job
 * @yields {Object} Stato di avanzamento
 */
function* generaDocumentiHandler(parametri) {
  const logger = new MyLoggerService({ livello: 'INFO' });
  const utils = new MyUtilsService();
  
  // CORREZIONE 1: Controlla che il gestoreDB sia stato passato correttamente
  const gestoreDB = parametri.gestoreDB;
  if (!gestoreDB) {
    throw new Error("Il gestore del database (gestoreDB) non è stato fornito nei parametri del job.");
  }
  
  const annoScolastico = parametri.annoScolastico;
  
  // Recupera il database dell'anno scolastico
  const db = annoScolastico ? 
    gestoreDB.ottieniDatabaseAnno(annoScolastico) : 
    gestoreDB.ottieniDatabaseAnnoAttuale();
  
  // CORREZIONE 2: Filtra per classi attive, più robusto
  const classi = db.select()
    .from('CLASSI')
    .where('ATT', '=', true)
    .execute();
  
  const totaleClassi = classi.length;
  logger.info(`Trovate ${totaleClassi} classi da elaborare`);
  
  // CORREZIONE 3: Accede correttamente allo stato di ripresa
  let indiceIniziale = 0;
  if (parametri.statoRipresa && parametri.statoRipresa.statoCorrente && parametri.statoRipresa.statoCorrente.indiceCorrente) {
    indiceIniziale = parametri.statoRipresa.statoCorrente.indiceCorrente;
    logger.info(`Ripresa elaborazione dall'indice ${indiceIniziale}`);
  }
  
  for (let i = indiceIniziale; i < totaleClassi; i++) {
    const classe = classi[i];
    
    try {
      const docGen = {
        TIPO: 'TEST_JOBQUEUE',
        NOME: `Test JobQueue per ${classe.CLASSE}`,
        PERCORSO_CARTELLA: '/Test/JobQueue',
        ID: utils.generaUuid(),
        LINK: 'https://example.com',
        CLASSE: classe.CLASSE,
        DATA_CREAZIONE: new Date().toISOString(),
        DATA_ULTIMA_MODIFICA: new Date().toISOString()
      };
      
      db.tables['DOC_GEN'].inserisciRiga(docGen);
      
      logger.info(`Elaborata classe ${classe.CLASSE} (${i+1}/${totaleClassi})`);
      
      const percentuale = Math.round(((i + 1) / totaleClassi) * 100);
      
      // CORREZIONE 4: Restituisce uno stato compatibile con l'architettura
      yield {
        statoCorrente: {
          indiceCorrente: i + 1
        },
        percentuale: percentuale,
        elementoCorrente: classe.CLASSE,
        totale: totaleClassi,
        elaborati: i + 1
      };
      
      Utilities.sleep(500);
      
    } catch (errore) {
      logger.error(`Errore nell'elaborazione della classe ${classe.CLASSE}: ${errore.message}`);
      throw errore; // Lancia l'errore per farlo gestire correttamente dalla JobQueue
    }
  }
  
  return {
    percentuale: 100,
    completato: true,
    totaleElaborati: totaleClassi,
    messaggio: 'Elaborazione completata con successo'
  };
}