/**
 * Test completo per MyPlaceholderService con dati reali del database scolastico
 * Crea documenti di test, esegue sostituzioni e verifica risultati
 */
function testMyPlaceholderServiceDatiReali() {
  // ----------------- INIZIALIZZAZIONE SERVIZI -----------------
  Logger.log("INIZIO TEST: testMyPlaceholderServiceDatiReali");
  
  // Crea logger per il test
  const logger = new MyLoggerService({ livello: 'DEBUG' });
  logger.info("Inizializzazione dei servizi necessari...");
  
  // Servizi di supporto
  const utils = new MyUtilsService();
  const cache = new MyCacheService();
  const mustache = new MyMustache({ logger: logger });
  
  // Crea servizi per documenti, fogli e drive
  const documentService = new MyDocumentService(logger, cache, utils);
  const spreadsheetService = new MySpreadsheetService(logger, cache, utils);
  const driveService = new MyDriveService(logger, cache, utils);
  
  // ----------------- INIZIALIZZAZIONE DATABASE REALE -----------------
  logger.info("Inizializzazione del database con dati reali...");
  
  // Inizializza il gestore database con i dati reali
  const gestoreDB = new GestoreDatabaseAnniScolastici(
    logger,
    cache,
    utils,
    spreadsheetService
  );
  
  // Ottiene la lista di classi reali
  const db = gestoreDB.ottieniDatabaseAnnoAttuale();
  let classiReali = [];
  
  try {
    if (db && db.tables && db.tables["CLASSI"]) {
      const righeClassi = db.tables["CLASSI"].ottieniRighe();
      
      // Filtra solo classi attive
      classiReali = righeClassi
        .filter(classe => classe["ATT"] === true)
        .map(classe => classe["CLASSE"]);
        
      logger.info(`Trovate ${classiReali.length} classi attive nel database`);
    } else {
      throw new Error("Struttura database non valida o tabella CLASSI non trovata");
    }
  } catch (e) {
    logger.error(`Errore nel recupero classi reali: ${e.message}`);
    throw e; // Non proseguiamo se non abbiamo classi reali
  }
  
  // Controlla se abbiamo almeno una classe
  if (classiReali.length === 0) {
    throw new Error("Nessuna classe attiva trovata nel database. Test impossibile.");
  }
  
  // Scegli una classe random per il test
  const classeTest = classiReali[0]; // Utilizziamo la prima per semplicità e riproducibilità
  logger.info(`Selezionata classe di test: ${classeTest}`);
  
  // ----------------- CREAZIONE DOCUMENTI TEST -----------------
  logger.info("Creazione documenti di test...");
  
  // Crea un documento Google di test
  const docModello = DocumentApp.create("Test Placeholder Service - " + new Date().toISOString());
  const docId = docModello.getId();
  
  // Aggiungi contenuto di test al documento
  const docBody = docModello.getBody();
  docBody.appendParagraph("Test documento con placeholder {{nome_classe}}");
  docBody.appendParagraph("Anno scolastico: {{anno_scolastico}}");
  docBody.appendParagraph("Coordinatore: {{elenco_coordinatori}}");
  docBody.appendParagraph("Numero alunni: {{numero_alunni_classe}}");
  
  // Test per tabelle 
  docBody.appendParagraph("{{tabella_materie_docenti[titolo=Docenti e Materie,firma=true]}}");
  docBody.appendParagraph("{{tabella_docenti[titolo=Elenco Docenti,firma=false]}}");
  
  docBody.appendParagraph("Test di placeholder con parametro: {{alunni_religione[tipo=Si]}}");
  docBody.appendParagraph("Rappresentanti studenti: {{elenco_rappr_studenti}}");
  docBody.appendParagraph("URL: {{url_documento}}"); // Placeholder personalizzato
  
  // Salva il documento
  docModello.saveAndClose();
  logger.info(`Documento di test creato con ID: ${docId}`);
  
  // Crea un foglio di calcolo di test
  const sheetModello = SpreadsheetApp.create("Test Placeholder Service Sheet - " + new Date().toISOString());
  const sheetId = sheetModello.getId();
  
  // Aggiungi contenuto di test al foglio
  const sheet = sheetModello.getActiveSheet();
  sheet.getRange("A1").setValue("Classe");
  sheet.getRange("B1").setValue("{{nome_classe}}");
  sheet.getRange("A2").setValue("Anno");
  sheet.getRange("B2").setValue("{{anno_scolastico}}");
  sheet.getRange("A3").setValue("Coordinatore");
  sheet.getRange("B3").setValue("{{elenco_coordinatori}}");
  sheet.getRange("A4").setValue("Alunni");
  sheet.getRange("B4").setValue("{{numero_alunni_classe}}");
  sheet.getRange("A5").setValue("URL");
  sheet.getRange("B5").setValue("{{url_documento}}");
  
  logger.info(`Foglio di calcolo di test creato con ID: ${sheetId}`);
  
  // ----------------- INIZIALIZZAZIONE ARCHIVIO PLACEHOLDER -----------------
  logger.info("Inizializzazione ArchivioPlaceholder con dati reali...");
  
  // Crea l'archivio placeholder usando tutte le componenti reali
  const archivioPlaceholder = new ArchivioPlaceholder(
    gestoreDB,
    logger,
    mustache,
    utils,
    driveService
  );
  
  // ----------------- TEST PLACEHOLDERSERVICE -----------------
  logger.info("Creazione MyPlaceholderService e inizio test...");
  
  // Crea il servizio da testare
  const placeholderService = new MyPlaceholderService(
    archivioPlaceholder,
    documentService,
    spreadsheetService,
    logger,
    mustache,
    utils
  );
  
  // Registra un placeholder personalizzato per il test
  placeholderService.registraPlaceholder("url_documento", (contesto, parametri) => {
    return `https://docs.google.com/document/d/${contesto.documentId}/edit`;
  });
  
  // ----------------- PREPARAZIONE CONTESTO -----------------
  // Ottieni un ID cartella reale per rendere il contesto più realistico
  let idCartella = null;
  try {
    // Cerca una cartella reale associata alla classe
    if (db.tables["FOLDER_GEN"]) {
      const cartelle = db.tables["FOLDER_GEN"].ottieniRighe();
      const cartellaClasse = cartelle.find(c => c["CLASSE"] === classeTest);
      if (cartellaClasse && cartellaClasse["ID_CARTELLA"]) {
        idCartella = cartellaClasse["ID_CARTELLA"];
      }
    }
  } catch(e) {
    logger.warn(`Impossibile trovare una cartella reale: ${e.message}`);
  }
  
  // Se non abbiamo trovato una cartella, crea una temporanea
  if (!idCartella) {
    const tempFolder = DriveApp.createFolder("Test Placeholder " + new Date().toISOString());
    idCartella = tempFolder.getId();
    logger.info(`Creata cartella temporanea: ${idCartella}`);
  }
  
  // Prepara il contesto di test con dati reali
  const contestoTest = {
    classe: classeTest,
    documentId: docId,
    cartella: idCartella
  };
  
  // ----------------- TEST SOSTITUZIONE IN STRINGA -----------------
  logger.info("Test sostituzione in stringa...");
  
  // Test sostituzioni in stringhe
  const stringaTest = "Classe {{nome_classe}}, anno {{anno_scolastico}}, coordinatore {{elenco_coordinatori}}";
  const stringaRisultato = placeholderService.sostituisciInStringa(stringaTest, contestoTest);
  
  logger.info(`Originale: ${stringaTest}`);
  logger.info(`Risultato: ${stringaRisultato}`);
  
  // Test con parametri
  const stringaConParametri = "Alunni religione: {{alunni_religione[tipo=Si]}}";
  const risultatoConParametri = placeholderService.sostituisciInStringa(stringaConParametri, contestoTest);
  
  logger.info(`Originale con parametri: ${stringaConParametri}`);
  logger.info(`Risultato con parametri: ${risultatoConParametri}`);
  
  // Test placeholder personalizzato
  const stringaPersonalizzata = "URL: {{url_documento}}";
  const risultatoPersonalizzato = placeholderService.sostituisciInStringa(stringaPersonalizzata, contestoTest);
  
  logger.info(`Originale personalizzato: ${stringaPersonalizzata}`);
  logger.info(`Risultato personalizzato: ${risultatoPersonalizzato}`);
  
  // ----------------- TEST SOSTITUZIONE IN DOCUMENTO -----------------
  logger.info("Test sostituzione in documento...");
  
  // Crea una copia del documento per il test
  const docCopia = DriveApp.getFileById(docId).makeCopy("Copia documento test placeholder");
  const docCopiaId = docCopia.getId();
  
  logger.info(`Creata copia del documento con ID: ${docCopiaId}`);
  
  // Esegui sostituzione nella copia
  try {
    const risultatoDocumento = placeholderService.elaboraDocumento(docCopiaId, contestoTest);
    logger.info(`Risultato elaborazione documento: ${risultatoDocumento ? "Successo" : "Fallimento"}`);
    logger.info(`URL documento elaborato: https://docs.google.com/document/d/${docCopiaId}/edit`);
  } catch (e) {
    logger.error(`Errore nell'elaborazione del documento: ${e.message}`);
  }
  
// ----------------- TEST SOSTITUZIONE IN FOGLIO -----------------
logger.info("Test sostituzione in foglio di calcolo...");

// Crea una copia del foglio per il test
const sheetCopia = DriveApp.getFileById(sheetId).makeCopy("Copia foglio test placeholder");
const sheetCopiaId = sheetCopia.getId();

logger.info(`Creata copia del foglio con ID: ${sheetCopiaId}`);

// Ottieni il nome effettivo del foglio attivo
const foglioCopia = SpreadsheetApp.openById(sheetCopiaId);
const sheetName = foglioCopia.getActiveSheet().getName();

// Verifica che i dati nel contesto siano completi
logger.debug(`Contesto utilizzato: ${JSON.stringify(contestoTest)}`);

// Assicurati che le celle contengano effettivamente il testo del placeholder
// Riapplica i valori per sicurezza
const activeSheet = foglioCopia.getActiveSheet();
activeSheet.getRange("B1").setValue("{{nome_classe}}");
activeSheet.getRange("B2").setValue("{{anno_scolastico}}");
activeSheet.getRange("B3").setValue("{{elenco_coordinatori}}");
activeSheet.getRange("B4").setValue("{{numero_alunni_classe}}");
activeSheet.getRange("B5").setValue("{{url_documento}}");
SpreadsheetApp.flush(); // Forza l'aggiornamento

// Esegui sostituzione specificando il nome del foglio
try {
  const risultatoFoglio = placeholderService.elaboraFoglio(sheetId, contestoTest, sheetName);
  logger.info(`Risultato elaborazione foglio: ${risultatoFoglio ? "Successo" : "Fallimento"}`);
  logger.info(`URL foglio elaborato: https://docs.google.com/spreadsheets/d/${sheetCopiaId}/edit`);
} catch (e) {
  logger.error(`Errore nell'elaborazione del foglio: ${e.message}`);
}
  
  // ----------------- PULIZIA E RIEPILOGO -----------------
  logger.info("Pulizia e riepilogo test...");
  
  try {
    // Ottieni e visualizza il log completo
    const logCompleto = logger.ottieni();
    Logger.log("LOG COMPLETO DEL TEST:");
    for (const logItem of logCompleto) {
      Logger.log(logItem);
    }
    
    // Riepilogo test
    Logger.log("RIEPILOGO TEST:");
    Logger.log(`- Classe utilizzata: ${classeTest}`);
    Logger.log(`- Documento originale: https://docs.google.com/document/d/${docId}/edit`);
    Logger.log(`- Documento elaborato: https://docs.google.com/document/d/${docCopiaId}/edit`);
    Logger.log(`- Foglio originale: https://docs.google.com/spreadsheets/d/${sheetId}/edit`);
    Logger.log(`- Foglio elaborato: https://docs.google.com/spreadsheets/d/${sheetCopiaId}/edit`);
    
    Logger.log("FINE TEST: testMyPlaceholderServiceDatiReali");
    return {
      success: true,
      classeUtilizzata: classeTest,
      documentoOriginaleId: docId,
      documentoElaboratoId: docCopiaId,
      foglioOriginaleId: sheetId,
      foglioElaboratoId: sheetCopiaId
    };
  } catch (e) {
    Logger.log(`Errore durante il riepilogo: ${e.message}`);
    return {
      success: false,
      error: e.message,
      classeUtilizzata: classeTest
    };
  }
}