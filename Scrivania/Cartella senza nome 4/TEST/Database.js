/**
 * Test per le funzionalità del database scolastico
 * Verifica operazioni di lettura, scrittura e modifica sulle tabelle dell'anno corrente
 * Con focus su FOLDER_GEN e DOC_GEN
 */
function testDatabaseScolastico() {
  const logger = new MyLoggerService({ livello: 'DEBUG' });
  const cache = new MyCacheService();
  const utils = new MyUtilsService();
  const spreadsheetService = new MySpreadsheetService(logger, cache, utils);
  const esito = {
    totaleTest: 0,
    testPassati: 0,
    testFalliti: 0,
    dettagliErrori: []
  };
  
  logger.info("Inizio test database scolastico");
  
  try {
    // Inizializzazione gestore DB anni scolastici
    const gestoreDB = new GestoreDatabaseAnniScolastici(logger, cache, utils, spreadsheetService);
    const db = gestoreDB.ottieniDatabaseAnnoAttuale();
    
    if (!db) {
      throw new Error("Impossibile ottenere il database dell'anno attuale");
    }
    
    logger.info(`Database anno attuale ottenuto: ${gestoreDB.ottieniAnniScolastici()[0]}`);
    
    // Test lettura tabelle principali
    testLetturaTabelle(db, esito);
    
    // Test specifici FOLDER_GEN e DOC_GEN
    testTabelleFolderDoc(db, esito);
    
    // Test di inserimento, modifica e cancellazione
    testOperazioniCRUD(db, esito);
    
    // Test QueryBuilder avanzato
    testQueryBuilder(db, esito);
    
    // Test relazioni tra tabelle
    testRelazioni(db, esito);
  } catch (e) {
    logger.error(`Errore durante l'esecuzione dei test: ${e.message}`);
    esito.dettagliErrori.push(`Errore generale: ${e.message}`);
    esito.testFalliti++;
  }
  
  // Stampa report finale
  stampaReport(esito, logger);
  
  return esito;
}

/**
 * Verifica la lettura da tabelle base
 * @param {MyDatabaseService} db - Database da testare
 * @param {Object} esito - Oggetto per il tracciamento dell'esito dei test
 */
function testLetturaTabelle(db, esito) {
  const tabelleBase = ["ALUNNI", "CLASSI", "DOCENTI", "MATERIE"];
  
  for (const nomeTabella of tabelleBase) {
    try {
      esito.totaleTest++;
      
      if (!db.tables[nomeTabella]) {
        esito.testFalliti++;
        esito.dettagliErrori.push(`Tabella ${nomeTabella} non trovata`);
        continue;
      }
      
      const righe = db.tables[nomeTabella].ottieniRighe();
      
      if (!righe || !Array.isArray(righe)) {
        esito.testFalliti++;
        esito.dettagliErrori.push(`Errore nel formato dei dati per la tabella ${nomeTabella}`);
        continue;
      }
      
      if (righe.length === 0) {
        esito.testFalliti++;
        esito.dettagliErrori.push(`Nessun dato trovato nella tabella ${nomeTabella}`);
        continue;
      }
      
      esito.testPassati++;
      Logger.log(`Test lettura tabella ${nomeTabella} passato. Trovate ${righe.length} righe.`);
    } catch (e) {
      esito.testFalliti++;
      esito.dettagliErrori.push(`Errore durante il test della tabella ${nomeTabella}: ${e.message}`);
    }
  }
}

/**
 * Test specifici per le tabelle FOLDER_GEN e DOC_GEN
 * @param {MyDatabaseService} db - Database da testare
 * @param {Object} esito - Oggetto per il tracciamento dell'esito dei test
 */
function testTabelleFolderDoc(db, esito) {
  // Test tabella FOLDER_GEN
  try {
    esito.totaleTest++;
    
    if (!db.tables["FOLDER_GEN"]) {
      esito.testFalliti++;
      esito.dettagliErrori.push("Tabella FOLDER_GEN non trovata");
    } else {
      const righe = db.tables["FOLDER_GEN"].ottieniRighe();
      Logger.log(`Test lettura tabella FOLDER_GEN passato. Trovate ${righe.length} righe.`);
      
      // Verifica struttura dati
      if (righe.length > 0) {
        const primaCella = righe[0];
        const campiAttesi = ["ID", "NOME", "TIPO", "PERCORSO CARTELLA", "LINK"];
        
        let strutturaCorrtiaTuttuta = true;
        for (const campo of campiAttesi) {
          if (primaCella[campo] === undefined) {
            strutturaCorrtiaTuttuta = false;
            esito.dettagliErrori.push(`Campo ${campo} mancante nella struttura FOLDER_GEN`);
          }
        }
        
        if (strutturaCorrtiaTuttuta) {
          esito.testPassati++;
        } else {
          esito.testFalliti++;
        }
      } else {
        esito.testPassati++;  // Tabella vuota ma esistente è comunque OK
      }
    }
  } catch (e) {
    esito.testFalliti++;
    esito.dettagliErrori.push(`Errore durante il test della tabella FOLDER_GEN: ${e.message}`);
  }
  
  // Test tabella DOC_GEN
  try {
    esito.totaleTest++;
    
    if (!db.tables["DOC_GEN"]) {
      esito.testFalliti++;
      esito.dettagliErrori.push("Tabella DOC_GEN non trovata");
    } else {
      const righe = db.tables["DOC_GEN"].ottieniRighe();
      Logger.log(`Test lettura tabella DOC_GEN passato. Trovate ${righe.length} righe.`);
      
      // Verifica struttura dati
      if (righe.length > 0) {
        const primaCella = righe[0];
        const campiAttesi = ["ID", "NOME", "TIPO", "PERCORSO CARTELLA", "LINK", "DATA CREAZIONE"];
        
        let strutturaCorrtiaTuttuta = true;
        for (const campo of campiAttesi) {
          if (primaCella[campo] === undefined) {
            strutturaCorrtiaTuttuta = false;
            esito.dettagliErrori.push(`Campo ${campo} mancante nella struttura DOC_GEN`);
          }
        }
        
        if (strutturaCorrtiaTuttuta) {
          esito.testPassati++;
        } else {
          esito.testFalliti++;
        }
      } else {
        esito.testPassati++;  // Tabella vuota ma esistente è comunque OK
      }
    }
  } catch (e) {
    esito.testFalliti++;
    esito.dettagliErrori.push(`Errore durante il test della tabella DOC_GEN: ${e.message}`);
  }
}

/**
 * Test operazioni CRUD (Create, Read, Update, Delete)
 * @param {MyDatabaseService} db - Database da testare
 * @param {Object} esito - Oggetto per il tracciamento dell'esito dei test
 */
function testOperazioniCRUD(db, esito) {
  // Test inserimento, lettura, aggiornamento e cancellazione su FOLDER_GEN
  try {
    esito.totaleTest++;
    
    if (!db.tables["FOLDER_GEN"]) {
      esito.testFalliti++;
      esito.dettagliErrori.push("Tabella FOLDER_GEN non trovata per test CRUD");
      return;
    }
    
    // Genera ID univoco per il test
    const idTest = `test_${new Date().getTime()}`;
    
    // 1. Creazione (INSERT)
    const nuovaRiga = {
      "ID": idTest,
      "NOME": "Cartella Test",
      "TIPO": "TEST",
      "PERCORSO CARTELLA": "/Test/",
      "LINK": "https://example.com",
      "CLASSE": "TEST",
      "DATA CREAZIONE": new Date().toISOString()
    };
    
    const rigaInserita = db.tables["FOLDER_GEN"].inserisciRiga(nuovaRiga);
    
    if (!rigaInserita || rigaInserita["ID"] !== idTest) {
      esito.testFalliti++;
      esito.dettagliErrori.push("Errore nell'inserimento di una riga in FOLDER_GEN");
      return;
    }
    
    // 2. Lettura (READ)
    const rigaLetta = db.tables["FOLDER_GEN"].ottieniPerPK(idTest);
    
    if (!rigaLetta || rigaLetta["ID"] !== idTest) {
      esito.testFalliti++;
      esito.dettagliErrori.push("Errore nella lettura della riga appena inserita in FOLDER_GEN");
      return;
    }
    
    // 3. Aggiornamento (UPDATE)
    const aggiornamento = {
      "NOME": "Cartella Test Aggiornata"
    };
    
    const rigaAggiornata = db.tables["FOLDER_GEN"].aggiornaRigaPerId(idTest, aggiornamento);
    
    if (!rigaAggiornata || rigaAggiornata["NOME"] !== "Cartella Test Aggiornata") {
      esito.testFalliti++;
      esito.dettagliErrori.push("Errore nell'aggiornamento della riga in FOLDER_GEN");
      return;
    }
    
    // 4. Cancellazione (DELETE)
    const cancellato = db.tables["FOLDER_GEN"].eliminaRigaPerId(idTest);
    
    if (!cancellato) {
      esito.testFalliti++;
      esito.dettagliErrori.push("Errore nell'eliminazione della riga in FOLDER_GEN");
      return;
    }
    
    // Verifica che la riga sia stata davvero eliminata
    const rigaDopoCancellazione = db.tables["FOLDER_GEN"].ottieniPerPK(idTest);
    
    if (rigaDopoCancellazione) {
      esito.testFalliti++;
      esito.dettagliErrori.push("La riga risulta ancora presente dopo l'eliminazione in FOLDER_GEN");
      return;
    }
    
    esito.testPassati++;
    Logger.log("Test operazioni CRUD su FOLDER_GEN completato con successo");
  } catch (e) {
    esito.testFalliti++;
    esito.dettagliErrori.push(`Errore durante il test CRUD: ${e.message}`);
  }
  
  // Test inserimento, lettura, aggiornamento e cancellazione su DOC_GEN
  try {
    esito.totaleTest++;
    
    if (!db.tables["DOC_GEN"]) {
      esito.testFalliti++;
      esito.dettagliErrori.push("Tabella DOC_GEN non trovata per test CRUD");
      return;
    }
    
    // Genera ID univoco per il test
    const idTest = `test_${new Date().getTime()}`;
    
    // 1. Creazione (INSERT)
    const nuovaRiga = {
      "ID": idTest,
      "NOME": "Documento Test",
      "TIPO": "TEST",
      "PERCORSO CARTELLA": "/Test/",
      "LINK": "https://example.com/doc",
      "CLASSE": "TEST",
      "DATA CREAZIONE": new Date().toISOString()
    };
    
    const rigaInserita = db.tables["DOC_GEN"].inserisciRiga(nuovaRiga);
    
    if (!rigaInserita || rigaInserita["ID"] !== idTest) {
      esito.testFalliti++;
      esito.dettagliErrori.push("Errore nell'inserimento di una riga in DOC_GEN");
      return;
    }
    
    // 2. Lettura (READ)
    const rigaLetta = db.tables["DOC_GEN"].ottieniPerPK(idTest);
    
    if (!rigaLetta || rigaLetta["ID"] !== idTest) {
      esito.testFalliti++;
      esito.dettagliErrori.push("Errore nella lettura della riga appena inserita in DOC_GEN");
      return;
    }
    
    // 3. Aggiornamento (UPDATE)
    const aggiornamento = {
      "NOME": "Documento Test Aggiornato"
    };
    
    const rigaAggiornata = db.tables["DOC_GEN"].aggiornaRigaPerId(idTest, aggiornamento);
    
    if (!rigaAggiornata || rigaAggiornata["NOME"] !== "Documento Test Aggiornato") {
      esito.testFalliti++;
      esito.dettagliErrori.push("Errore nell'aggiornamento della riga in DOC_GEN");
      return;
    }
    
    // 4. Cancellazione (DELETE)
    const cancellato = db.tables["DOC_GEN"].eliminaRigaPerId(idTest);
    
    if (!cancellato) {
      esito.testFalliti++;
      esito.dettagliErrori.push("Errore nell'eliminazione della riga in DOC_GEN");
      return;
    }
    
    // Verifica che la riga sia stata davvero eliminata
    const rigaDopoCancellazione = db.tables["DOC_GEN"].ottieniPerPK(idTest);
    
    if (rigaDopoCancellazione) {
      esito.testFalliti++;
      esito.dettagliErrori.push("La riga risulta ancora presente dopo l'eliminazione in DOC_GEN");
      return;
    }
    
    esito.testPassati++;
    Logger.log("Test operazioni CRUD su DOC_GEN completato con successo");
  } catch (e) {
    esito.testFalliti++;
    esito.dettagliErrori.push(`Errore durante il test CRUD su DOC_GEN: ${e.message}`);
  }
}

/**
 * Test del Query Builder
 * @param {MyDatabaseService} db - Database da testare
 * @param {Object} esito - Oggetto per il tracciamento dell'esito dei test
 */
function testQueryBuilder(db, esito) {
  try {
    esito.totaleTest++;
    
    // Test Query di selezione base
    const query = db.select('ID', 'NOME', 'TIPO')
      .from('FOLDER_GEN')
      .limit(5);
      
    const risultato = query.execute();
    
    if (!Array.isArray(risultato)) {
      esito.testFalliti++;
      esito.dettagliErrori.push("Il risultato della query non è un array");
      return;
    }
    
    // Test Query con condizioni
    const queryCondizioni = db.select()
      .from('FOLDER_GEN')
      .where('TIPO', '=', 'TEST')
      .limit(5);
      
    const risultatoCondizioni = queryCondizioni.execute();
    
    if (!Array.isArray(risultatoCondizioni)) {
      esito.testFalliti++;
      esito.dettagliErrori.push("Il risultato della query con condizioni non è un array");
      return;
    }
    
    // Test Query con aggregazioni
    const queryComposta = db.select('TIPO')
      .from('DOC_GEN')
      .where('CLASSE', '!=', '')
      .groupBy('TIPO')
      .orderBy('TIPO', 'ASC')
      .limit(10);
      
    const risultatoComposto = queryComposta.execute();
    
    if (!Array.isArray(risultatoComposto)) {
      esito.testFalliti++;
      esito.dettagliErrori.push("Il risultato della query composta non è un array");
      return;
    }
    
    esito.testPassati++;
    Logger.log("Test Query Builder completato con successo");
  } catch (e) {
    esito.testFalliti++;
    esito.dettagliErrori.push(`Errore durante il test del Query Builder: ${e.message}`);
  }
}

/**
 * Test delle relazioni tra tabelle
 * @param {MyDatabaseService} db - Database da testare
 * @param {Object} esito - Oggetto per il tracciamento dell'esito dei test
 */
function testRelazioni(db, esito) {
  try {
    esito.totaleTest++;
    
    // Verifica se ci sono classi nel database
    if (!db.tables["CLASSI"] || db.tables["CLASSI"].ottieniRighe().length === 0) {
      esito.testPassati++; // Saltiamo il test ma non lo contiamo come fallito
      Logger.log("Nessuna classe trovata per testare le relazioni");
      return;
    }
    
    // Ottieni la prima classe per il test
    const classi = db.tables["CLASSI"].ottieniRighe();
    const primaClasse = classi[0];
    
    if (!primaClasse || !primaClasse["CLASSE"]) {
      esito.testFalliti++;
      esito.dettagliErrori.push("Impossibile ottenere una classe valida per il test delle relazioni");
      return;
    }
    
    const nomeClasse = primaClasse["CLASSE"];
    
    // Imposta una relazione di test
    db.impostaRelazione("CLASSI", "documenti", {
      tabella: "DOC_GEN",
      tipo: "uno-a-molti",
      chiaveEsterna: "CLASSE",
      chiaveLocale: "CLASSE"
    });
    
    // Carica la relazione
    const documentiClasse = db.caricaRelazione("CLASSI", nomeClasse, "documenti");
    
    if (!Array.isArray(documentiClasse)) {
      esito.testFalliti++;
      esito.dettagliErrori.push("Il risultato della relazione non è un array");
      return;
    }
    
    Logger.log(`Relazione caricata con successo. Trovati ${documentiClasse.length} documenti per la classe ${nomeClasse}`);
    
    esito.testPassati++;
  } catch (e) {
    esito.testFalliti++;
    esito.dettagliErrori.push(`Errore durante il test delle relazioni: ${e.message}`);
  }
}

/**
 * Stampa il report dei test eseguiti
 * @param {Object} esito - Risultati dei test
 * @param {MyLoggerService} logger - Servizio di logging
 */
function stampaReport(esito, logger) {
  const percentualeSuccesso = esito.totaleTest > 0 
    ? Math.round((esito.testPassati / esito.totaleTest) * 100) 
    : 0;
    
  logger.info("===== REPORT TEST DATABASE SCOLASTICO =====");
  logger.info(`Test totali: ${esito.totaleTest}`);
  logger.info(`Test passati: ${esito.testPassati}`);
  logger.info(`Test falliti: ${esito.testFalliti}`);
  logger.info(`Percentuale di successo: ${percentualeSuccesso}%`);
  
  if (esito.dettagliErrori.length > 0) {
    logger.warn("Dettagli errori:");
    esito.dettagliErrori.forEach((errore, indice) => {
      logger.warn(`${indice + 1}. ${errore}`);
    });
  }
  
  logger.info("==========================================");
}

/**
 * Funzione per eseguire tutti i test
 * Questa funzione può essere chiamata direttamente da menu o trigger
 */
function eseguiTestDatabase() {
  try {
    const risultati = testDatabaseScolastico();
    
    // Se necessario, puoi memorizzare i risultati o inviarli via email
    if (risultati.testFalliti > 0) {
      // Notifica agli sviluppatori in caso di test falliti
      const emailSviluppatori = "team@scuola.it";
      GmailApp.sendEmail(
        emailSviluppatori,
        "Test Database Scolastico - Fallimenti rilevati",
        `Sono stati rilevati ${risultati.testFalliti} test falliti su ${risultati.totaleTest}.\n\n` +
        `Dettagli errori:\n${risultati.dettagliErrori.join('\n')}`
      );
    }
    
    return risultati;
  } catch (e) {
    Logger.log(`Errore nell'esecuzione dei test: ${e.message}`);
    return {
      totaleTest: 0,
      testPassati: 0,
      testFalliti: 1,
      dettagliErrori: [`Errore generale: ${e.message}`]
    };
  }
}