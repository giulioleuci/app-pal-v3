/**
 * Funzione per testare MyDocumentService con dati reali
 * Usa la classe 1A LC dal database scolastico
 */
function testMyDocumentService() {
  // Inizializzazione servizi di base
  const logger = new MyLoggerService({ livello: 'INFO' });
  const cache = new MyCacheService();
  const utils = new MyUtilsService();
  const spreadsheetService = new MySpreadsheetService(logger, cache, utils);
  
  // Inizializzazione GestoreDatabaseAnniScolastici
  const gestoreDB = new GestoreDatabaseAnniScolastici(logger, cache, utils, spreadsheetService);
  
  // Inizializzazione servizio documento da testare
  const documentService = new MyDocumentService(logger, cache, utils);
  
  // Inizio test
  logger.info("=== INIZIO TEST MyDocumentService ===");
  
  // Ottieni dati reali della classe 1A LC
  logger.info("Preparazione: ottenimento dati classe 1A LC");
  const db = gestoreDB.ottieniDatabaseAnnoAttuale();
  const classeDesiderata = "1A LC";
  
  // Verifica disponibilità della classe nel database
  const classi = db.select()
    .from("CLASSI")
    .where("CLASSE", "=", classeDesiderata)
    .execute();
  
  if (!classi || classi.length === 0) {
    logger.error(`Classe ${classeDesiderata} non trovata nel database`);
    return logger.ottieni();
  }
  
  // Ottieni alunni della classe
  const alunni = db.select()
    .from("ALUNNI")
    .where("CLASSE", "=", classeDesiderata)
    .execute();
  
  logger.info(`Trovati ${alunni.length} alunni per la classe ${classeDesiderata}`);
  
  // TEST 1: Creazione documento
  logger.info("TEST 1: Creazione documento");
  const doc = documentService
    .crea(`Test Report Classe ${classeDesiderata}`)
    .ottieniRisultato();
  
  const idDocumento = doc ? doc.getId() : null;
  logger.info(`Creazione documento: ${doc ? "SUCCESSO" : "FALLIMENTO"} - ID: ${idDocumento}`);
  
  // TEST 2: Ottieni corpo documento
  logger.info("TEST 2: Ottieni corpo documento");
  const corpo = documentService
    .ottieniCorpo()
    .ottieniRisultato();
  
  logger.info(`Ottenimento corpo: ${corpo ? "SUCCESSO" : "FALLIMENTO"}`);
  
  // TEST 3: Aggiungi intestazione documento
  logger.info("TEST 3: Aggiungi intestazione");
  const intestazione = documentService
    .aggiungiIntestazione(`Istituto Scolastico - Report ${classeDesiderata} - ${utils.formattaData(new Date())}`)
    .ottieniRisultato();
  
  logger.info(`Aggiunta intestazione: ${intestazione ? "SUCCESSO" : "FALLIMENTO"}`);
  
  // TEST 4: Aggiungi sezioni
  logger.info("TEST 4: Aggiungi sezioni");
  const sezione1 = documentService
    .aggiungiSezione(`Riepilogo Classe ${classeDesiderata}`, 1, "Documento generato automaticamente.")
    .ottieniRisultato();
  
  logger.info(`Aggiunta sezione titolo: ${sezione1 ? "SUCCESSO" : "FALLIMENTO"}`);
  
  // TEST 5: Aggiungi testo formattato
  logger.info("TEST 5: Aggiungi testo formattato");
  const testoFormattato = documentService
    .impostaTestoFormattato([
      {
        testo: `La classe ${classeDesiderata} è composta da ${alunni.length} alunni.`,
        stile: { bold: true, fontSize: 12 }
      },
      {
        testo: `Anno scolastico: ${gestoreDB.ottieniAnniScolastici()[0] || "corrente"}`,
        stile: { italic: true, fontSize: 10 }
      }
    ], true)
    .ottieniRisultato();
  
  logger.info(`Aggiunta testo formattato: ${testoFormattato !== null ? "SUCCESSO" : "FALLIMENTO"}`);
  
  // TEST 6: Aggiungi una seconda sezione
  logger.info("TEST 6: Aggiungi sezione elenco alunni");
  const sezione2 = documentService
    .aggiungiSezione("Elenco Alunni", 2)
    .ottieniRisultato();
  
  logger.info(`Aggiunta sezione alunni: ${sezione2 ? "SUCCESSO" : "FALLIMENTO"}`);
  
  // TEST 7: Crea tabella con alunni
  logger.info("TEST 7: Crea tabella alunni");
  
  // Prepara dati tabella
  const intestazioneTabella = ["N.", "Alunno", "Email"];
  const righeTabella = [intestazioneTabella];
  
  // Aggiungi alunni alla tabella
  alunni.forEach((alunno, index) => {
    righeTabella.push([
      (index + 1).toString(),
      alunno.ALUNNO || "",
      alunno.EMAIL || ""
    ]);
  });
  
  // Crea la tabella
  const tabella = documentService
    .creaTabella(doc, righeTabella, true)
    .ottieniRisultato();
  
  logger.info(`Creazione tabella alunni: ${tabella ? "SUCCESSO" : "FALLIMENTO"}`);
  
  // TEST 8: Formatta la tabella
  logger.info("TEST 8: Formatta tabella");
  const tabellaFormattata = documentService
    .formattaTabella(null, {
      righeAlternate: true,
      headerRow: true,
      coloreHeader: "#4a86e8",
      coloreTesto: "#ffffff",
      centraIntestazione: true
    })
    .ottieniRisultato();
  
  logger.info(`Formattazione tabella: ${tabellaFormattata ? "SUCCESSO" : "FALLIMENTO"}`);
  
  // TEST 9: Aggiungi sezione note
  logger.info("TEST 9: Aggiungi sezione note");
  const sezione3 = documentService
    .aggiungiSezione("Note sulla classe", 2)
    .ottieniRisultato();
  
  logger.info(`Aggiunta sezione note: ${sezione3 ? "SUCCESSO" : "FALLIMENTO"}`);
  
  // TEST 10: Aggiungi testo semplice
  logger.info("TEST 10: Aggiungi testo semplice");
  const testoSemplice = documentService
    .impostaTesto("Inserire eventuali note sulla classe e sugli alunni.", true)
    .ottieniRisultato();
  
  logger.info(`Aggiunta testo semplice: ${testoSemplice !== null ? "SUCCESSO" : "FALLIMENTO"}`);
  
  // TEST 11: Ottieni numero di figli del corpo
  logger.info("TEST 11: Ottieni numero figli corpo");
  const numFigli = documentService
    .ottieniNumeroFigli(corpo)
    .ottieniRisultato();
  
  logger.info(`Numero figli corpo: ${numFigli} - ${numFigli > 0 ? "SUCCESSO" : "FALLIMENTO"}`);
  
  // TEST 12: Ottieni primo figlio (dovrebbe essere una sezione)
  logger.info("TEST 12: Ottieni primo figlio");
  const primoFiglio = documentService
    .ottieniFiglio(corpo, 0)
    .ottieniRisultato();
  
  logger.info(`Ottenimento primo figlio: ${primoFiglio ? "SUCCESSO" : "FALLIMENTO"}`);
  
  // TEST 13: Verifica se è un paragrafo
  logger.info("TEST 13: Verifica se primo figlio è paragrafo");
  const isParagrafo = documentService
    .isParagrafo(primoFiglio)
    .ottieniRisultato();
  
  logger.info(`Verifica paragrafo: ${isParagrafo ? "È paragrafo" : "Non è paragrafo"} - ${isParagrafo !== null ? "SUCCESSO" : "FALLIMENTO"}`);
  
  // TEST 14: Aggiungi piè di pagina
  logger.info("TEST 14: Aggiungi piè di pagina");
  const piedipagina = documentService
    .aggiungiPieDiPagina("Documento generato automaticamente - " + new Date().toLocaleString())
    .ottieniRisultato();
  
  logger.info(`Aggiunta piè di pagina: ${piedipagina ? "SUCCESSO" : "FALLIMENTO"}`);
  
  // TEST 15: Trova tabella per intestazione
  logger.info("TEST 15: Trova tabella per intestazione");
  const tabellaPerIntestazione = documentService
    .trovaTabellaPerIntestazione("Elenco Alunni", 0, false)
    .ottieniRisultato();
  
  logger.info(`Ricerca tabella per intestazione: ${tabellaPerIntestazione ? "SUCCESSO" : "FALLIMENTO"}`);
  
  // TEST 16: Ottieni titoli documento
  logger.info("TEST 16: Ottieni titoli documento");
  const titoli = documentService
    .ottieniTitoli()
    .ottieniRisultato();
  
  logger.info(`Ottenimento titoli: ${titoli && titoli.length > 0 ? "SUCCESSO" : "FALLIMENTO"} - Trovati ${titoli ? titoli.length : 0} titoli`);
  
  // TEST 17: Salva e chiudi documento
  logger.info("TEST 17: Salva e chiudi documento");
  const salvataggio = documentService
    .salvaEChiudi()
    .ottieniRisultato();
  
  logger.info(`Salvataggio documento: ${salvataggio ? "SUCCESSO" : "FALLIMENTO"}`);
  
  // Conclusione test
  logger.info(`=== FINE TEST MyDocumentService ===`);
  logger.info(`Documento creato con ID: ${idDocumento}`);
  logger.info(`Per visualizzare il documento: https://docs.google.com/document/d/${idDocumento}/edit`);
  
  return {
    logs: logger.ottieni(),
    documentId: idDocumento
  };
}

// Usa questa funzione per eseguire il test
function eseguiTestDocumentService() {
  return testMyDocumentService();
}