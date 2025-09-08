/**
 * File di test per le funzionalità principali del sistema
 * Contiene test completi per le classi core del progetto
 */

// ======= COSTANTI PER I TEST =======
const TEST_DB_ID = '1EoBVcf1Ynm925M2x6rO76XgQWHeNpX1pO-csb5ypJOI'; // ID dello spreadsheet del database
const TEST_FOLDER_ID = '1M96iu3gcz6IT3uFOJL1cViSesbULoOAQ'; // ID cartella in cui creare elementi di test
const TEST_EMAIL_1 = 'leuci.giulio@pietroaldi.com'; // Email docente per test permessi
const TEST_EMAIL_2 = 'leuci.giulio@gmail.com'; // Email docente alternativo per test permessi
const TEST_EMAIL_3 = 'kruja.jenisen@pietroaldi.com'; // Email alunno per test permessi
const TEST_ANNO_SCOLASTICO = '2032-2033'; // Anno scolastico di default per test

/**
 * Esegue tutti i test del sistema
 */
function eseguiTuttiITest() {
  Logger.log("Inizio test completo del sistema...");
  
  testServiziBasi();
  testServizioCache();
  testServizioDrive();
  testServizioPermessi();
  testServizioSpreadsheet();
  testServizioDocumento();
  testServizioDB();
  testGestoreAnniScolastici();
  testJobQueue();
  
  Logger.log("Test del sistema completati!");
}

/**
 * Test dei servizi base: Logger
 */
function testServiziBasi() {
  Logger.log("Inizio test servizi base...");
  
  // Test MyLoggerService
  testMyLoggerService();
  
  Logger.log("Test servizi base completati!");
}

/**
 * Test del servizio di logging
 */
function testMyLoggerService() {
  Logger.log("Test MyLoggerService...");
  
  // Instanzia il logger con livello INFO
  const logger = new MyLoggerService({ livello: 'INFO' });
  
  // Test impostazione livello
  logger.impostaLivello('DEBUG');
  logger.impostaLivello('ERROR');
  logger.impostaLivello('INFO');
  
  // Test vari livelli di log
  logger.debug('Questo è un messaggio di debug');
  logger.info('Questo è un messaggio informativo');
  logger.warn('Questo è un avvertimento');
  logger.error('Questo è un errore');
  
  // Test ottenimento log
  const logs = logger.ottieni();
  if (logs && logs.length > 0) {
    Logger.log(`Test MyLoggerService: Ottenuti ${logs.length} log`);
  } else {
    Logger.log('Test MyLoggerService: Errore - Nessun log ottenuto');
  }
  
  // Test pulizia log
  logger.pulisci();
  const logsDopoReset = logger.ottieni();
  if (logsDopoReset.length === 0) {
    Logger.log('Test MyLoggerService: Reset log avvenuto con successo');
  } else {
    Logger.log('Test MyLoggerService: Errore - Reset log non riuscito');
  }
}

/**
 * Test del servizio cache
 */
function testServizioCache() {
  Logger.log("Test MyCacheService...");
  
  const cache = new MyCacheService();
  
  // Test memorizzazione e recupero
  const chiaveTest = 'test_chiave';
  const valoreTest = { nome: 'Test', valore: 123, array: [1, 2, 3] };
  
  cache.imposta(chiaveTest, valoreTest, 60);
  
  const valoreRecuperato = cache.ottieni(chiaveTest);
  
  if (valoreRecuperato && valoreRecuperato.nome === valoreTest.nome && 
      valoreRecuperato.valore === valoreTest.valore) {
    Logger.log('Test Cache: Memorizzazione e recupero avvenuti con successo');
  } else {
    Logger.log('Test Cache: Errore nella memorizzazione o recupero');
  }
  
  // Test rimozione
  cache.rimuovi(chiaveTest);
  const valoreDopoRimozione = cache.ottieni(chiaveTest);
  
  if (valoreDopoRimozione === null) {
    Logger.log('Test Cache: Rimozione avvenuta con successo');
  } else {
    Logger.log('Test Cache: Errore nella rimozione');
  }
  
  // Test pulizia
  const chiaveTest2 = 'test_chiave_2';
  cache.imposta(chiaveTest2, 'test', 60);
  cache.pulisci();
  
  const valoreDopoReset = cache.ottieni(chiaveTest2);
  if (valoreDopoReset === null) {
    Logger.log('Test Cache: Reset avvenuto con successo');
  } else {
    Logger.log('Test Cache: Errore nel reset');
  }
}

/**
 * Test del servizio Drive
 */
function testServizioDrive() {
  Logger.log("Test MyDriveService...");
  
  const logger = new MyLoggerService({ livello: 'INFO' });
  const cache = new MyCacheService();
  const utils = new MyUtilsService();
  
  const driveService = new MyDriveService(logger, cache, utils);
  
  // Test ottieni info file/cartella
  testOttieniInfoFileDaId(driveService);
  
  // Test creazione cartella
  testCreazioneCartella(driveService);
  
  // Test creazione albero cartelle
  testCreazioneAlberoCartelle(driveService);
  
  // Test copia file
  testCopiaFile(driveService);
  
  // Test copia cartella
  testCopiaCartella(driveService);
  
  // Test backup
  testBackupFile(driveService);
  
  // Test spostamento file
  testSpostaFile(driveService);
  
  // Test rinomina file
  testRinominaFile(driveService);
}

/**
 * Test ottieni info file/cartella da ID
 */
function testOttieniInfoFileDaId(driveService) {
  try {
    const infoFile = driveService.ottieni(TEST_FOLDER_ID);
    
    if (infoFile && infoFile.id === TEST_FOLDER_ID) {
      Logger.log(`Test ottieni file: Ottenute informazioni per ${infoFile.name}`);
    } else {
      Logger.log('Test ottieni file: Errore - Nessuna informazione ottenuta');
    }
  } catch (e) {
    Logger.log(`Test ottieni file: Errore - ${e.message}`);
  }
}

/**
 * Test creazione cartella
 */
function testCreazioneCartella(driveService) {
  try {
    const nomeCartella = 'Test_Cartella_' + new Date().getTime();
    
    const cartella = driveService.creaCartella(nomeCartella, TEST_FOLDER_ID, true);
    
    if (cartella && cartella.name === nomeCartella) {
      Logger.log(`Test creazione cartella: Cartella ${nomeCartella} creata con ID ${cartella.id}`);
      
      // Recupero cartella per nome per test
      const cartellaRecuperata = driveService.ottieniCartellaPerNome(nomeCartella, TEST_FOLDER_ID);
      
      if (cartellaRecuperata && cartellaRecuperata.id === cartella.id) {
        Logger.log('Test recupero cartella per nome: Avvenuto con successo');
      } else {
        Logger.log('Test recupero cartella per nome: Errore - Non trovata');
      }
      
      return cartella.id; // Torna utile per altri test
    } else {
      Logger.log('Test creazione cartella: Errore - Creazione fallita');
      return null;
    }
  } catch (e) {
    Logger.log(`Test creazione cartella: Errore - ${e.message}`);
    return null;
  }
}

/**
 * Test creazione albero cartelle
 */
function testCreazioneAlberoCartelle(driveService) {
  try {
    const percorsoCartelle = 'Test/Albero/Cartelle/' + new Date().getTime();
    
    const ultimaCartella = driveService.creaAlberoCartelle(percorsoCartelle, TEST_FOLDER_ID);
    
    if (ultimaCartella) {
      Logger.log(`Test creazione albero cartelle: Percorso ${percorsoCartelle} creato con successo`);
      
      // Test ottenimento albero cartelle
      const alberoCartelle = driveService.ottieniAlberoCartelle(TEST_FOLDER_ID, true);
      
      if (alberoCartelle && alberoCartelle.length > 0) {
        Logger.log(`Test ottenimento albero cartelle: Trovate ${alberoCartelle.length} cartelle`);
      } else {
        Logger.log('Test ottenimento albero cartelle: Errore - Nessuna cartella trovata');
      }
      
      return ultimaCartella.id;
    } else {
      Logger.log('Test creazione albero cartelle: Errore - Creazione fallita');
      return null;
    }
  } catch (e) {
    Logger.log(`Test creazione albero cartelle: Errore - ${e.message}`);
    return null;
  }
}

/**
 * Test copia file
 */
function testCopiaFile(driveService) {
  try {
    // Utilizziamo il database come file da copiare
    const idFileDaCopiare = TEST_DB_ID;
    const cartellaIdTest = testCreazioneCartella(driveService);
    
    if (!cartellaIdTest) {
      Logger.log('Test copia file: Errore - Impossibile creare cartella di test');
      return;
    }
    
    const nuovoNome = 'Copia_Test_' + new Date().getTime();
    
    const fileCopia = driveService.copiaFile(idFileDaCopiare, nuovoNome, cartellaIdTest);
    
    if (fileCopia && fileCopia.name === nuovoNome) {
      Logger.log(`Test copia file: File copiato con successo come ${nuovoNome}`);
    } else {
      Logger.log('Test copia file: Errore - Copia fallita');
    }
  } catch (e) {
    Logger.log(`Test copia file: Errore - ${e.message}`);
  }
}

/**
 * Test copia cartella
 */
function testCopiaCartella(driveService) {
  try {
    // Prima creiamo una cartella di test con sottocartelle
    const cartellaOrigineId = testCreazioneAlberoCartelle(driveService);
    
    if (!cartellaOrigineId) {
      Logger.log('Test copia cartella: Errore - Impossibile creare cartella origine');
      return;
    }
    
    const nuovoNome = 'Copia_Cartella_' + new Date().getTime();
    
    const cartellaCopia = driveService.copiaCartella(cartellaOrigineId, nuovoNome, TEST_FOLDER_ID);
    
    if (cartellaCopia && cartellaCopia.name === nuovoNome) {
      Logger.log(`Test copia cartella: Cartella copiata con successo come ${nuovoNome}`);
    } else {
      Logger.log('Test copia cartella: Errore - Copia fallita');
    }
  } catch (e) {
    Logger.log(`Test copia cartella: Errore - ${e.message}`);
  }
}

/**
 * Test backup file
 */
function testBackupFile(driveService) {
  try {
    // Utilizziamo il database come file da backuppare
    const idFileDaBackuppare = TEST_DB_ID;
    
    const fileBackup = driveService.creaBackup(idFileDaBackuppare, TEST_FOLDER_ID, true);
    
    if (fileBackup) {
      Logger.log(`Test backup file: Backup creato con successo come ${fileBackup.name}`);
    } else {
      Logger.log('Test backup file: Errore - Backup fallito');
    }
  } catch (e) {
    Logger.log(`Test backup file: Errore - ${e.message}`);
  }
}

/**
 * Test spostamento file
 */
function testSpostaFile(driveService) {
  try {
    // Prima creiamo una copia di un file da spostare
    const idFileDaCopiare = TEST_DB_ID;
    const cartellaOrigineId = testCreazioneCartella(driveService);
    const cartellaDestinazioneId = testCreazioneCartella(driveService);
    
    if (!cartellaOrigineId || !cartellaDestinazioneId) {
      Logger.log('Test sposta file: Errore - Impossibile creare cartelle di test');
      return;
    }
    
    const nuovoNome = 'File_Da_Spostare_' + new Date().getTime();
    
    const fileCopia = driveService.copiaFile(idFileDaCopiare, nuovoNome, cartellaOrigineId);
    
    if (!fileCopia) {
      Logger.log('Test sposta file: Errore - Impossibile creare file di test');
      return;
    }
    
    const fileSpostato = driveService.sposta(fileCopia.id, cartellaDestinazioneId, true);
    
    if (fileSpostato) {
      Logger.log(`Test sposta file: File ${nuovoNome} spostato con successo`);
    } else {
      Logger.log('Test sposta file: Errore - Spostamento fallito');
    }
  } catch (e) {
    Logger.log(`Test sposta file: Errore - ${e.message}`);
  }
}

/**
 * Test rinomina file
 */
function testRinominaFile(driveService) {
  try {
    // Prima creiamo una copia di un file da rinominare
    const idFileDaCopiare = TEST_DB_ID;
    const cartellaOrigineId = testCreazioneCartella(driveService);
    
    if (!cartellaOrigineId) {
      Logger.log('Test rinomina file: Errore - Impossibile creare cartella di test');
      return;
    }
    
    const nuovoNome = 'File_Da_Rinominare_' + new Date().getTime();
    
    const fileCopia = driveService.copiaFile(idFileDaCopiare, nuovoNome, cartellaOrigineId);
    
    if (!fileCopia) {
      Logger.log('Test rinomina file: Errore - Impossibile creare file di test');
      return;
    }
    
    const nomeRinominato = 'File_Rinominato_' + new Date().getTime();
    const fileRinominato = driveService.rinomina(fileCopia.id, nomeRinominato);
    
    if (fileRinominato && fileRinominato.name === nomeRinominato) {
      Logger.log(`Test rinomina file: File rinominato con successo in ${nomeRinominato}`);
    } else {
      Logger.log('Test rinomina file: Errore - Rinomina fallita');
    }
  } catch (e) {
    Logger.log(`Test rinomina file: Errore - ${e.message}`);
  }
}

/**
 * Test del servizio permessi
 */
function testServizioPermessi() {
  Logger.log("Test MyPermissionService...");
  
  const logger = new MyLoggerService({ livello: 'INFO' });
  const cache = new MyCacheService();
  const utils = new MyUtilsService();
  
  const permissionService = new MyPermissionService(logger, cache, utils);
  const driveService = new MyDriveService(logger, cache, utils);
  
  // Test ottieni permessi
  testOttieniPermessi(permissionService);
  
  // Test condivisione file
  testCondividiFile(permissionService, driveService);
  
  // Test permessi ricorsivi
  testPermessiRicorsivi(permissionService, driveService);
  
  // Test link condivisione
  testLinkCondivisione(permissionService, driveService);
}

/**
 * Test ottieni permessi
 */
function testOttieniPermessi(permissionService) {
  try {
    const permessi = permissionService.ottieniPermessi(TEST_FOLDER_ID);
    
    if (permessi) {
      Logger.log(`Test ottieni permessi: Ottenuti ${permessi.length} permessi`);
    } else {
      Logger.log('Test ottieni permessi: Errore - Nessun permesso ottenuto');
    }
  } catch (e) {
    Logger.log(`Test ottieni permessi: Errore - ${e.message}`);
  }
}

/**
 * Test condivisione file
 */
function testCondividiFile(permissionService, driveService) {
  try {
    // Prima creiamo una cartella di test
    const idCartellaDaCondividere = testCreazioneCartella(driveService);
    
    if (!idCartellaDaCondividere) {
      Logger.log('Test condividi file: Errore - Impossibile creare cartella di test');
      return;
    }
    
    // Condividi in lettura
    const permessoLettura = permissionService.condividi(
      idCartellaDaCondividere, 
      TEST_EMAIL_1, 
      'reader', 
      'user', 
      false
    );
    
    if (permessoLettura) {
      Logger.log(`Test condividi file: Permesso di lettura assegnato a ${TEST_EMAIL_1}`);
      
      // Ora modifichiamo il permesso
      const permessoModificato = permissionService.modificaPermessi(
        idCartellaDaCondividere, 
        TEST_EMAIL_1, 
        'writer'
      );
      
      if (permessoModificato && permessoModificato.role === 'writer') {
        Logger.log(`Test modifica permessi: Permesso modificato a writer per ${TEST_EMAIL_1}`);
      } else {
        Logger.log('Test modifica permessi: Errore - Modifica fallita');
      }
      
      // Infine rimuoviamo il permesso
      const permessoRimosso = permissionService.rimuoviPermessi(
        idCartellaDaCondividere, 
        TEST_EMAIL_1
      );
      
      if (permessoRimosso) {
        Logger.log(`Test rimuovi permessi: Permesso rimosso per ${TEST_EMAIL_1}`);
      } else {
        Logger.log('Test rimuovi permessi: Errore - Rimozione fallita');
      }
    } else {
      Logger.log('Test condividi file: Errore - Condivisione fallita');
    }
  } catch (e) {
    Logger.log(`Test condividi file: Errore - ${e.message}`);
  }
}

/**
 * Test permessi ricorsivi
 */
function testPermessiRicorsivi(permissionService, driveService) {
  try {
    // Prima creiamo un albero di cartelle
    const percorsoCartelle = 'Test/Permessi/Ricorsivi/' + new Date().getTime();
    const cartellaRoot = driveService.creaAlberoCartelle(percorsoCartelle, TEST_FOLDER_ID);
    
    if (!cartellaRoot) {
      Logger.log('Test permessi ricorsivi: Errore - Impossibile creare cartelle di test');
      return;
    }
    
    // Assegniamo permessi ricorsivi
    const permessiAggiunti = permissionService.impostaPermessiRicorsivi(
      cartellaRoot.id,
      TEST_EMAIL_2,
      'reader',
      'user',
      true
    );
    
    if (permessiAggiunti && permessiAggiunti.length > 0) {
      Logger.log(`Test permessi ricorsivi: Aggiunti ${permessiAggiunti.length} permessi ricorsivamente`);
    } else {
      Logger.log('Test permessi ricorsivi: Errore - Nessun permesso aggiunto');
    }
  } catch (e) {
    Logger.log(`Test permessi ricorsivi: Errore - ${e.message}`);
  }
}

/**
 * Test scenario permessi misti per una cartella e subfolder
 */
function testScenarioPermessiMisti(permissionService, driveService) {
  try {
    // Creiamo una cartella principale
    const nomeCartellaPrincipale = 'Test_Permessi_Misti_' + new Date().getTime();
    const cartellaPrincipale = driveService.creaCartella(nomeCartellaPrincipale, TEST_FOLDER_ID, true);
    
    if (!cartellaPrincipale) {
      Logger.log('Test scenario permessi misti: Errore - Impossibile creare cartella principale');
      return;
    }
    
    // Creiamo due file interni copiando il database
    const nomeFile1 = 'File1_PermessiMisti_' + new Date().getTime();
    const nomeFile2 = 'File2_PermessiMisti_' + new Date().getTime();
    
    const file1 = driveService.copiaFile(TEST_DB_ID, nomeFile1, cartellaPrincipale.id);
    const file2 = driveService.copiaFile(TEST_DB_ID, nomeFile2, cartellaPrincipale.id);
    
    if (!file1 || !file2) {
      Logger.log('Test scenario permessi misti: Errore - Impossibile creare file interni');
      return;
    }
    
    // Assegniamo permessi di scrittura alla cartella principale per TEST_EMAIL_1
    permissionService.condividi(
      cartellaPrincipale.id,
      TEST_EMAIL_1,
      'writer',
      'user',
      false
    );
    
    // Assegniamo permessi di lettura al primo file per TEST_EMAIL_2
    permissionService.condividi(
      file1.id,
      TEST_EMAIL_2,
      'reader',
      'user',
      false
    );
    
    // Assegniamo permessi di lettura al secondo file per TEST_EMAIL_3
    permissionService.condividi(
      file2.id,
      TEST_EMAIL_3,
      'reader',
      'user',
      false
    );
    
    Logger.log('Test scenario permessi misti: Completato con successo');
    Logger.log(`- Cartella "${nomeCartellaPrincipale}" condivisa in scrittura con ${TEST_EMAIL_1}`);
    Logger.log(`- File "${nomeFile1}" condiviso in lettura con ${TEST_EMAIL_2}`);
    Logger.log(`- File "${nomeFile2}" condiviso in lettura con ${TEST_EMAIL_3}`);
  } catch (e) {
    Logger.log(`Test scenario permessi misti: Errore - ${e.message}`);
  }
}

/**
 * Test link condivisione
 */
function testLinkCondivisione(permissionService, driveService) {
  try {
    // Prima creiamo una cartella di test
    const idCartellaDaCondividere = testCreazioneCartella(driveService);
    
    if (!idCartellaDaCondividere) {
      Logger.log('Test link condivisione: Errore - Impossibile creare cartella di test');
      return;
    }
    
    // Ottieni link di condivisione
    const linkCondivisione = permissionService.ottieniLinkCondivisione(
      idCartellaDaCondividere,
      'view'
    );
    
    if (linkCondivisione) {
      Logger.log(`Test link condivisione: Link ottenuto - ${linkCondivisione}`);
    } else {
      Logger.log('Test link condivisione: Errore - Impossibile ottenere link');
    }
  } catch (e) {
    Logger.log(`Test link condivisione: Errore - ${e.message}`);
  }
}

/**
 * Test del servizio spreadsheet
 */
function testServizioSpreadsheet() {
  Logger.log("Test MySpreadsheetService...");
  
  const logger = new MyLoggerService({ livello: 'INFO' });
  const cache = new MyCacheService();
  const utils = new MyUtilsService();
  
  const spreadsheetService = new MySpreadsheetService(logger, cache, utils);
  
  // Test apertura foglio
  testAperturaFoglio(spreadsheetService);
  
  // Test ottenimento schede
  testOttenimentoSchede(spreadsheetService);
  
  // Test ottenimento valori
  testOttenimentoValori(spreadsheetService);
  
  // Test impostazione valori
  testImpostazioneValori(spreadsheetService);
  
  // Test cancellazione valori
  testCancellazioneValori(spreadsheetService);
  
  // Test flush batch
  testFlushBatch(spreadsheetService);
}

/**
 * Test apertura foglio
 */
function testAperturaFoglio(spreadsheetService) {
  try {
    const foglio = spreadsheetService.apri(TEST_DB_ID);
    
    if (foglio && foglio.getId() === TEST_DB_ID) {
      Logger.log('Test apertura foglio: Foglio aperto con successo');
    } else {
      Logger.log('Test apertura foglio: Errore - Apertura fallita');
    }
    
    return foglio;
  } catch (e) {
    Logger.log(`Test apertura foglio: Errore - ${e.message}`);
    return null;
  }
}

/**
 * Test ottenimento schede
 */
function testOttenimentoSchede(spreadsheetService) {
  try {
    const foglio = testAperturaFoglio(spreadsheetService);
    
    if (!foglio) {
      Logger.log('Test ottenimento schede: Errore - Impossibile aprire foglio');
      return;
    }
    
    const schede = spreadsheetService.ottieniSchede(foglio);
    
    if (schede && schede.length > 0) {
      Logger.log(`Test ottenimento schede: Ottenute ${schede.length} schede`);
      
      // Test ottenimento scheda per nome
      const schedaTest = spreadsheetService.ottieniSchedaPerNome(foglio, schede[0].nome);
      
      if (schedaTest && schedaTest.id === schede[0].id) {
        Logger.log(`Test ottenimento scheda per nome: Scheda "${schedaTest.nome}" trovata`);
      } else {
        Logger.log('Test ottenimento scheda per nome: Errore - Scheda non trovata');
      }
    } else {
      Logger.log('Test ottenimento schede: Errore - Nessuna scheda trovata');
    }
  } catch (e) {
    Logger.log(`Test ottenimento schede: Errore - ${e.message}`);
  }
}

/**
 * Test ottenimento valori
 */
function testOttenimentoValori(spreadsheetService) {
  try {
    const foglio = testAperturaFoglio(spreadsheetService);
    
    if (!foglio) {
      Logger.log('Test ottenimento valori: Errore - Impossibile aprire foglio');
      return;
    }
    
    const schede = spreadsheetService.ottieniSchede(foglio);
    
    if (!schede || schede.length === 0) {
      Logger.log('Test ottenimento valori: Errore - Nessuna scheda trovata');
      return;
    }
    
    const valori = spreadsheetService.ottieniValori(foglio, schede[0].nome, "A1:B10");
    
    if (valori) {
      Logger.log(`Test ottenimento valori: Ottenuti ${valori.length} righe di valori`);
    } else {
      Logger.log('Test ottenimento valori: Errore - Nessun valore ottenuto');
    }
  } catch (e) {
    Logger.log(`Test ottenimento valori: Errore - ${e.message}`);
  }
}

/**
 * Test impostazione valori
 */
function testImpostazioneValori(spreadsheetService) {
  try {
    const foglio = testAperturaFoglio(spreadsheetService);
    
    if (!foglio) {
      Logger.log('Test impostazione valori: Errore - Impossibile aprire foglio');
      return;
    }
    
    // Creiamo una scheda di test
    let schedaTest;
    
    try {
      schedaTest = spreadsheetService.creaScheda(foglio, "TEST_" + new Date().getTime());
      Logger.log(`Test creazione scheda: Scheda "${schedaTest.nome}" creata con ID ${schedaTest.id}`);
    } catch (e) {
      Logger.log(`Test creazione scheda: Errore - ${e.message}`);
      return;
    }
    
    // Impostiamo dei valori di test
    const valoriTest = [
      ["ID", "Nome", "Valore"],
      [1, "Test 1", 100],
      [2, "Test 2", 200],
      [3, "Test 3", 300]
    ];
    
    const risultato = spreadsheetService.impostaValori(foglio, schedaTest.nome, "A1:C4", valoriTest);
    
    if (risultato) {
      Logger.log('Test impostazione valori: Valori impostati con successo');
    } else {
      Logger.log('Test impostazione valori: Errore - Impossibile impostare valori');
    }
    
    // Eliminiamo la scheda di test
    try {
      const risultatoEliminazione = spreadsheetService.eliminaScheda(foglio, schedaTest.nome);
      
      if (risultatoEliminazione) {
        Logger.log(`Test eliminazione scheda: Scheda "${schedaTest.nome}" eliminata con successo`);
      } else {
        Logger.log(`Test eliminazione scheda: Errore - Impossibile eliminare scheda "${schedaTest.nome}"`);
      }
    } catch (e) {
      Logger.log(`Test eliminazione scheda: Errore - ${e.message}`);
    }
  } catch (e) {
    Logger.log(`Test impostazione valori: Errore - ${e.message}`);
  }
}

/**
 * Test cancellazione valori
 */
function testCancellazioneValori(spreadsheetService) {
  try {
    const foglio = testAperturaFoglio(spreadsheetService);
    
    if (!foglio) {
      Logger.log('Test cancellazione valori: Errore - Impossibile aprire foglio');
      return;
    }
    
    // Creiamo una scheda di test
    let schedaTest;
    
    try {
      schedaTest = spreadsheetService.creaScheda(foglio, "TEST_CANC_" + new Date().getTime());
      Logger.log(`Test cancellazione: Scheda "${schedaTest.nome}" creata con ID ${schedaTest.id}`);
    } catch (e) {
      Logger.log(`Test cancellazione: Errore creazione scheda - ${e.message}`);
      return;
    }
    
    // Impostiamo dei valori di test
    const valoriTest = [
      ["ID", "Nome", "Valore"],
      [1, "Test 1", 100],
      [2, "Test 2", 200],
      [3, "Test 3", 300]
    ];
    
    spreadsheetService.impostaValori(foglio, schedaTest.nome, "A1:C4", valoriTest);
    
    // Cancelliamo i valori
    const risultato = spreadsheetService.cancellaValori(foglio, schedaTest.nome, "B2:C4");
    
    if (risultato) {
      Logger.log('Test cancellazione valori: Valori cancellati con successo');
    } else {
      Logger.log('Test cancellazione valori: Errore - Impossibile cancellare valori');
    }
    
    // Eliminiamo la scheda di test
    try {
      spreadsheetService.eliminaScheda(foglio, schedaTest.nome);
    } catch (e) {
      Logger.log(`Test cancellazione: Errore eliminazione scheda - ${e.message}`);
    }
  } catch (e) {
    Logger.log(`Test cancellazione valori: Errore - ${e.message}`);
  }
}

/**
 * Test flush batch
 */
function testFlushBatch(spreadsheetService) {
  try {
    const foglio = testAperturaFoglio(spreadsheetService);
    
    if (!foglio) {
      Logger.log('Test flush batch: Errore - Impossibile aprire foglio');
      return;
    }
    
    // Creiamo una scheda di test
    let schedaTest;
    
    try {
      schedaTest = spreadsheetService.creaScheda(foglio, "TEST_BATCH_" + new Date().getTime());
      Logger.log(`Test flush batch: Scheda "${schedaTest.nome}" creata con ID ${schedaTest.id}`);
    } catch (e) {
      Logger.log(`Test flush batch: Errore creazione scheda - ${e.message}`);
      return;
    }
    
    // Impostiamo diversi valori in batch
    for (let i = 0; i < 10; i++) {
      const valoriRiga = [
        [i, `Riga ${i}`, i * 100]
      ];
      
      spreadsheetService.impostaValori(foglio, schedaTest.nome, `A${i+1}:C${i+1}`, valoriRiga);
    }
    
    // Forziamo il flush dei batch
    const risultato = spreadsheetService.flushBatch();
    
    if (risultato) {
      Logger.log('Test flush batch: Flush batch eseguito con successo');
    } else {
      Logger.log('Test flush batch: Errore - Impossibile eseguire flush batch');
    }
    
    // Eliminiamo la scheda di test
    try {
      spreadsheetService.eliminaScheda(foglio, schedaTest.nome);
    } catch (e) {
      Logger.log(`Test flush batch: Errore eliminazione scheda - ${e.message}`);
    }
  } catch (e) {
    Logger.log(`Test flush batch: Errore - ${e.message}`);
  }
}

/**
 * Test del servizio documento
 */
function testServizioDocumento() {
  Logger.log("Test MyDocumentService...");
  
  const logger = new MyLoggerService({ livello: 'INFO' });
  const cache = new MyCacheService();
  const utils = new MyUtilsService();
  
  const documentService = new MyDocumentService(logger, cache, utils);
  
  // Test ottenimento corpo documento
  testOttenimentoCorpoDocumento(documentService);
  
  // Test impostazione testo
  testImpostazioneTesto(documentService);
  
  // Test creazione tabella
  testCreazioneTabella(documentService);
  
  // Test aggiornamento cella tabella
  testAggiornamentoCellaTabella(documentService);
  
  // Test aggiunta intestazione
  testAggiuntaIntestazione(documentService);
  
  // Test aggiunta piè di pagina
  testAggiuntaPieDiPagina(documentService);
  
  // Test impostazione testo formattato
  testImpostazioneTestoFormattato(documentService);
  
  // Test aggiunta sezione con intestazione
  testAggiuntaSezione(documentService);
  
  // Test ottenimento titoli
  testOttenimentoTitoli(documentService);
}

/**
 * Crea un documento di test per le operazioni documento
 * @return {Document} Documento di test
 */
function _creaDocumentoTest() {
  try {
    const nomeDoc = "TEST_DOC_" + new Date().getTime();
    const doc = DocumentApp.create(nomeDoc);
    
    Logger.log(`Documento di test "${nomeDoc}" creato con ID ${doc.getId()}`);
    return doc;
  } catch (e) {
    Logger.log(`Errore nella creazione del documento di test: ${e.message}`);
    return null;
  }
}

/**
 * Test ottenimento corpo documento
 */
function testOttenimentoCorpoDocumento(documentService) {
  try {
    const doc = _creaDocumentoTest();
    
    if (!doc) {
      Logger.log('Test ottenimento corpo documento: Errore - Impossibile creare documento di test');
      return;
    }
    
    const corpo = documentService.ottieniCorpo(doc);
    
    if (corpo) {
      Logger.log('Test ottenimento corpo documento: Corpo ottenuto con successo');
    } else {
      Logger.log('Test ottenimento corpo documento: Errore - Impossibile ottenere il corpo');
    }
    
    // Eliminiamo il documento di test
    try {
      DriveApp.getFileById(doc.getId()).setTrashed(true);
    } catch (e) {
      Logger.log(`Errore nell'eliminazione del documento di test: ${e.message}`);
    }
  } catch (e) {
    Logger.log(`Test ottenimento corpo documento: Errore - ${e.message}`);
  }
}

/**
 * Test impostazione testo
 */
function testImpostazioneTesto(documentService) {
  try {
    const doc = _creaDocumentoTest();
    
    if (!doc) {
      Logger.log('Test impostazione testo: Errore - Impossibile creare documento di test');
      return;
    }
    
    const testo = "Questo è un testo di prova per il test di impostazione testo.";
    const risultato = documentService.impostaTesto(doc, testo);
    
    if (risultato) {
      Logger.log('Test impostazione testo: Testo impostato con successo');
      
      // Test con append mode
      const testoAggiuntivo = "\nQuesto è un testo aggiuntivo.";
      const risultatoAppend = documentService.impostaTesto(doc, testoAggiuntivo, true);
      
      if (risultatoAppend) {
        Logger.log('Test impostazione testo append: Testo aggiunto con successo');
      } else {
        Logger.log('Test impostazione testo append: Errore - Impossibile aggiungere testo');
      }
    } else {
      Logger.log('Test impostazione testo: Errore - Impossibile impostare il testo');
    }
    
    // Eliminiamo il documento di test
    try {
      DriveApp.getFileById(doc.getId()).setTrashed(true);
    } catch (e) {
      Logger.log(`Errore nell'eliminazione del documento di test: ${e.message}`);
    }
  } catch (e) {
    Logger.log(`Test impostazione testo: Errore - ${e.message}`);
  }
}

/**
 * Test creazione tabella
 */
function testCreazioneTabella(documentService) {
  try {
    const doc = _creaDocumentoTest();
    
    if (!doc) {
      Logger.log('Test creazione tabella: Errore - Impossibile creare documento di test');
      return;
    }
    
    const dati = [
      ["ID", "Nome", "Valore"],
      [1, "Test 1", 100],
      [2, "Test 2", 200],
      [3, "Test 3", 300]
    ];
    
    const risultato = documentService.creaTabella(doc, dati, true);
    
    if (risultato) {
      Logger.log(`Test creazione tabella: Tabella creata con successo (${risultato.righe} righe, ${risultato.colonne} colonne)`);
    } else {
      Logger.log('Test creazione tabella: Errore - Impossibile creare la tabella');
    }
    
    // Eliminiamo il documento di test
    try {
      DriveApp.getFileById(doc.getId()).setTrashed(true);
    } catch (e) {
      Logger.log(`Errore nell'eliminazione del documento di test: ${e.message}`);
    }
  } catch (e) {
    Logger.log(`Test creazione tabella: Errore - ${e.message}`);
  }
}

/**
 * Test aggiornamento cella tabella
 */
function testAggiornamentoCellaTabella(documentService) {
  try {
    const doc = _creaDocumentoTest();
    
    if (!doc) {
      Logger.log('Test aggiornamento cella: Errore - Impossibile creare documento di test');
      return;
    }
    
    // Prima creiamo una tabella
    const dati = [
      ["ID", "Nome", "Valore"],
      [1, "Test 1", 100],
      [2, "Test 2", 200],
      [3, "Test 3", 300]
    ];
    
    const tabella = documentService.creaTabella(doc, dati, true);
    
    if (!tabella) {
      Logger.log('Test aggiornamento cella: Errore - Impossibile creare tabella');
      return;
    }
    
    // Ora aggiorniamo una cella
    const risultato = documentService.aggiornaCellaTabella(
      doc, 
      0, // Prima tabella
      1, // Seconda riga
      2, // Terza colonna
      "NUOVO VALORE",
      { bold: true }
    );
    
    if (risultato) {
      Logger.log('Test aggiornamento cella: Cella aggiornata con successo');
    } else {
      Logger.log('Test aggiornamento cella: Errore - Impossibile aggiornare la cella');
    }
    
    // Eliminiamo il documento di test
    try {
      DriveApp.getFileById(doc.getId()).setTrashed(true);
    } catch (e) {
      Logger.log(`Errore nell'eliminazione del documento di test: ${e.message}`);
    }
  } catch (e) {
    Logger.log(`Test aggiornamento cella: Errore - ${e.message}`);
  }
}

/**
 * Test aggiunta intestazione
 */
function testAggiuntaIntestazione(documentService) {
  try {
    const doc = _creaDocumentoTest();
    
    if (!doc) {
      Logger.log('Test aggiunta intestazione: Errore - Impossibile creare documento di test');
      return;
    }
    
    const testoIntestazione = "Intestazione di Test";
    const risultato = documentService.aggiungiIntestazione(doc, testoIntestazione);
    
    if (risultato) {
      Logger.log('Test aggiunta intestazione: Intestazione aggiunta con successo');
    } else {
      Logger.log('Test aggiunta intestazione: Errore - Impossibile aggiungere intestazione');
    }
    
    // Eliminiamo il documento di test
    try {
      DriveApp.getFileById(doc.getId()).setTrashed(true);
    } catch (e) {
      Logger.log(`Errore nell'eliminazione del documento di test: ${e.message}`);
    }
  } catch (e) {
    Logger.log(`Test aggiunta intestazione: Errore - ${e.message}`);
  }
}

/**
 * Test aggiunta piè di pagina
 */
function testAggiuntaPieDiPagina(documentService) {
  try {
    const doc = _creaDocumentoTest();
    
    if (!doc) {
      Logger.log('Test aggiunta piè di pagina: Errore - Impossibile creare documento di test');
      return;
    }
    
    const testoPieDiPagina = "Piè di pagina di Test";
    const risultato = documentService.aggiungiPieDiPagina(doc, testoPieDiPagina);
    
    if (risultato) {
      Logger.log('Test aggiunta piè di pagina: Piè di pagina aggiunto con successo');
    } else {
      Logger.log('Test aggiunta piè di pagina: Errore - Impossibile aggiungere piè di pagina');
    }
    
    // Eliminiamo il documento di test
    try {
      DriveApp.getFileById(doc.getId()).setTrashed(true);
    } catch (e) {
      Logger.log(`Errore nell'eliminazione del documento di test: ${e.message}`);
    }
  } catch (e) {
    Logger.log(`Test aggiunta piè di pagina: Errore - ${e.message}`);
  }
}

/**
 * Test impostazione testo formattato
 */
function testImpostazioneTestoFormattato(documentService) {
  try {
    const doc = _creaDocumentoTest();
    
    if (!doc) {
      Logger.log('Test impostazione testo formattato: Errore - Impossibile creare documento di test');
      return;
    }
    
    const elementiFormattati = [
      { testo: "Titolo del documento", stile: { bold: true, fontSize: 18 } },
      { testo: "\nQuesto è un paragrafo normale.", stile: {} },
      { testo: "\nQuesto è un paragrafo in corsivo.", stile: { italic: true } },
      { testo: "\nQuesto è un paragrafo sottolineato.", stile: { underline: true } }
    ];
    
    const risultato = documentService.impostaTestoFormattato(doc, elementiFormattati);
    
    if (risultato) {
      Logger.log('Test impostazione testo formattato: Testo formattato impostato con successo');
    } else {
      Logger.log('Test impostazione testo formattato: Errore - Impossibile impostare testo formattato');
    }
    
    // Eliminiamo il documento di test
    try {
      DriveApp.getFileById(doc.getId()).setTrashed(true);
    } catch (e) {
      Logger.log(`Errore nell'eliminazione del documento di test: ${e.message}`);
    }
  } catch (e) {
    Logger.log(`Test impostazione testo formattato: Errore - ${e.message}`);
  }
}

/**
 * Test aggiunta sezione
 */
function testAggiuntaSezione(documentService) {
  try {
    const doc = _creaDocumentoTest();
    
    if (!doc) {
      Logger.log('Test aggiunta sezione: Errore - Impossibile creare documento di test');
      return;
    }
    
    const titoloSezione = "Sezione di Test";
    const contenutoSezione = "Questo è il contenuto della sezione di test.";
    const risultato = documentService.aggiungiSezione(doc, titoloSezione, 1, contenutoSezione);
    
    if (risultato) {
      Logger.log('Test aggiunta sezione: Sezione aggiunta con successo');
      
      // Aggiungiamo una seconda sezione con livello diverso
      const risultato2 = documentService.aggiungiSezione(doc, "Sottosezione", 2, "Contenuto sottosezione");
      
      if (risultato2) {
        Logger.log('Test aggiunta sottosezione: Sottosezione aggiunta con successo');
      }
    } else {
      Logger.log('Test aggiunta sezione: Errore - Impossibile aggiungere sezione');
    }
    
    // Eliminiamo il documento di test
    try {
      DriveApp.getFileById(doc.getId()).setTrashed(true);
    } catch (e) {
      Logger.log(`Errore nell'eliminazione del documento di test: ${e.message}`);
    }
  } catch (e) {
    Logger.log(`Test aggiunta sezione: Errore - ${e.message}`);
  }
}

/**
 * Test ottenimento titoli
 */
function testOttenimentoTitoli(documentService) {
  try {
    const doc = _creaDocumentoTest();
    
    if (!doc) {
      Logger.log('Test ottenimento titoli: Errore - Impossibile creare documento di test');
      return;
    }
    
    // Aggiungiamo alcune sezioni per creare titoli
    documentService.aggiungiSezione(doc, "Titolo 1", 1, "Contenuto 1");
    documentService.aggiungiSezione(doc, "Titolo 2", 2, "Contenuto 2");
    documentService.aggiungiSezione(doc, "Titolo 3", 3, "Contenuto 3");
    
    // Ora otteniamo i titoli
    const titoli = documentService.ottieniTitoli(doc);
    
    if (titoli && titoli.length > 0) {
      Logger.log(`Test ottenimento titoli: Ottenuti ${titoli.length} titoli`);
      for (let i = 0; i < titoli.length; i++) {
        Logger.log(`  - Titolo ${i+1}: "${titoli[i].testo}" (livello ${titoli[i].livello})`);
      }
    } else {
      Logger.log('Test ottenimento titoli: Errore - Nessun titolo ottenuto');
    }
    
    // Eliminiamo il documento di test
    try {
      DriveApp.getFileById(doc.getId()).setTrashed(true);
    } catch (e) {
      Logger.log(`Errore nell'eliminazione del documento di test: ${e.message}`);
    }
  } catch (e) {
    Logger.log(`Test ottenimento titoli: Errore - ${e.message}`);
  }
}





/**
 * Test per la classe GestoreDatabaseAnniScolastici
 * @param {GestoreDatabaseAnniScolastici} gestoreDB - Istanza del gestore
 * @param {MyLoggerService} logger - Servizio logger
 */
function testGestoreDatabaseAnniScolastici(gestoreDB, logger) {
  logger.info("Test GestoreDatabaseAnniScolastici iniziato");
  
  try {
    // Test ottieniAnniScolastici
    const anni = gestoreDB.ottieniAnniScolastici();
    assertArray(anni, "Lista anni scolastici deve essere un array", logger);
    
    // Test ottieniDatabaseAnnoAttuale
    const dbAttuale = gestoreDB.ottieniDatabaseAnnoAttuale();
    assertNotNull(dbAttuale, "Database anno attuale non deve essere null", logger);
    assertTrue(dbAttuale instanceof MyDatabaseService, "Database anno attuale deve essere istanza di MyDatabaseService", logger);
    
    // Se ci sono anni disponibili, testiamo ottieniDatabaseAnno
    if (anni.length > 0) {
      const anno = anni[0];
      const db = gestoreDB.ottieniDatabaseAnno(anno);
      assertNotNull(db, `Database per l'anno ${anno} non deve essere null`, logger);
      assertTrue(db instanceof MyDatabaseService, `Database per l'anno ${anno} deve essere istanza di MyDatabaseService`, logger);
    }
    
    logger.info("Test GestoreDatabaseAnniScolastici completato con successo");
  } catch (e) {
    logger.error(`Test GestoreDatabaseAnniScolastici fallito: ${e.message}`);
    throw e;
  }
}

/**
 * Test per la classe MyDatabaseService
 * @param {GestoreDatabaseAnniScolastici} gestoreDB - Istanza del gestore
 * @param {MyLoggerService} logger - Servizio logger
 */
function testMyDatabaseService(gestoreDB, logger) {
  logger.info("Test MyDatabaseService iniziato");
  
  try {
    // Ottieni il database dell'anno attuale
    const db = gestoreDB.ottieniDatabaseAnnoAttuale();
    
    // Test tables
    assertNotNull(db.tables, "Tables non deve essere null", logger);
    assertObject(db.tables, "Tables deve essere un oggetto", logger);
    
    // Test select
    const qb = db.select();
    assertNotNull(qb, "Query builder non deve essere null", logger);
    assertTrue(qb instanceof AdvancedQueryBuilder, "Query builder deve essere istanza di AdvancedQueryBuilder", logger);
    
    // Test select con colonne
    const qbColonne = db.select(['ALUNNO', 'CLASSE']);
    assertEquals(qbColonne.selectedColumns.length, 2, "Query builder deve avere 2 colonne selezionate", logger);
    
    // Test verificaSchema
    const schema = db.verificaSchema();
    assertObject(schema, "Schema deve essere un oggetto", logger);
    assertNotNull(schema.valido, "Schema.valido non deve essere null", logger);
    assertArray(schema.errori, "Schema.errori deve essere un array", logger);
    
    logger.info("Test MyDatabaseService completato con successo");
  } catch (e) {
    logger.error(`Test MyDatabaseService fallito: ${e.message}`);
    throw e;
  }
}


/**
 * Test per la classe MyTableService
 * @param {GestoreDatabaseAnniScolastici} gestoreDB - Istanza del gestore
 * @param {MyLoggerService} logger - Servizio logger
 */
function testMyTableService(gestoreDB, logger) {
  logger.info("Test MyTableService iniziato");
  
  try {
    // Ottieni il database dell'anno attuale
    const db = gestoreDB.ottieniDatabaseAnnoAttuale();
    
    // Troviamo una tabella per i test
    const nomiTabelle = Object.keys(db.tables);
    if (nomiTabelle.length === 0) {
      logger.error("Nessuna tabella disponibile per il test");
      return;
    }
    
    const nomeTabella = nomiTabelle[0];
    const tabella = db.tables[nomeTabella];
    
    // Test colonne
    assertNotNull(tabella.colonne, "Colonne non deve essere null", logger);
    assertArray(tabella.colonne, "Colonne deve essere un array", logger);
    
    // Test ottieniDatiTutti
    const dati = tabella.ottieniDatiTutti();
    assertArray(dati, "Dati deve essere un array", logger);
    
    // Test ottieniRighe
    const righe = tabella.ottieniRighe();
    assertArray(righe, "Righe deve essere un array", logger);
    
    // Test che i campi delle righe corrispondano alle colonne
    if (righe.length > 0) {
      const prima = righe[0];
      for (const colonna of tabella.colonne) {
        assertTrue(colonna in prima, `Colonna ${colonna} deve esistere nella riga`, logger);
      }
    }
    
    logger.info("Test MyTableService completato con successo");
  } catch (e) {
    logger.error(`Test MyTableService fallito: ${e.message}`);
    throw e;
  }
}


/**
 * Test per la classe AdvancedQueryBuilder
 * @param {GestoreDatabaseAnniScolastici} gestoreDB - Istanza del gestore
 * @param {MyLoggerService} logger - Servizio logger
 */
function testAdvancedQueryBuilder(gestoreDB, logger) {
  logger.info("Test AdvancedQueryBuilder iniziato");
  
  try {
    // Ottieni il database dell'anno attuale
    const db = gestoreDB.ottieniDatabaseAnnoAttuale();
    
    // Troviamo una tabella per i test
    const nomiTabelle = Object.keys(db.tables);
    if (nomiTabelle.length === 0) {
      logger.error("Nessuna tabella disponibile per il test");
      return;
    }
    
    const nomeTabella = nomiTabelle[0];
    
    // Test costruzione query base
    const qb = db.select().from(nomeTabella);
    assertNotNull(qb, "Query builder non deve essere null", logger);
    assertEquals(qb.tableName, nomeTabella, `Query builder deve avere tabella ${nomeTabella}`, logger);
    
    // Test execute
    const risultati = qb.execute();
    assertArray(risultati, "Risultati deve essere un array", logger);
    
    // Test where
    const campoTest = db.tables[nomeTabella].colonne[0];
    const qbWhere = db.select().from(nomeTabella).where(campoTest, '!=', null);
    const risultatiWhere = qbWhere.execute();
    assertArray(risultatiWhere, "Risultati where deve essere un array", logger);
    
    // Test limit
    const qbLimit = db.select().from(nomeTabella).limit(5);
    const risultatiLimit = qbLimit.execute();
    assertArray(risultatiLimit, "Risultati limit deve essere un array", logger);
    assertTrue(risultatiLimit.length <= 5, "Risultati limit deve avere massimo 5 elementi", logger);
    
    // Test count
    const count = qb.conta();
    assertNumber(count, "Count deve essere un numero", logger);
    
    logger.info("Test AdvancedQueryBuilder completato con successo");
  } catch (e) {
    logger.error(`Test AdvancedQueryBuilder fallito: ${e.message}`);
    throw e;
  }
}

/**
 * Test per la classe QueryCondition
 * @param {MyLoggerService} logger - Servizio logger
 */
function testQueryCondition(logger) {
  logger.info("Test QueryCondition iniziato");
  
  try {
    // Test operatore =
    const condizEq = new QueryCondition('test', '=', 'valore');
    assertTrue(condizEq.confrontaValore('valore'), "Condizione = deve essere true", logger);
    assertFalse(condizEq.confrontaValore('altro'), "Condizione = deve essere false", logger);
    
    // Test operatore !=
    const condizNeq = new QueryCondition('test', '!=', 'valore');
    assertTrue(condizNeq.confrontaValore('altro'), "Condizione != deve essere true", logger);
    assertFalse(condizNeq.confrontaValore('valore'), "Condizione != deve essere false", logger);
    
    // Test operatore >
    const condizGt = new QueryCondition('test', '>', 10);
    assertTrue(condizGt.confrontaValore(20), "Condizione > deve essere true", logger);
    assertFalse(condizGt.confrontaValore(5), "Condizione > deve essere false", logger);
    
    // Test operatore LIKE
    const condizLike = new QueryCondition('test', 'LIKE', 'va%');
    assertTrue(condizLike.confrontaValore('valore'), "Condizione LIKE deve essere true", logger);
    assertFalse(condizLike.confrontaValore('altro'), "Condizione LIKE deve essere false", logger);
    
    // Test valutazione riga
    const riga = { test: 'valore', altro: 123 };
    assertTrue(condizEq.valuta(riga), "Valutazione riga deve essere true", logger);
    
    // Test condizioni annidate AND
    const condizAnd = new QueryCondition(null, null, null, 'AND');
    condizAnd.aggiungiSottoCondizione(new QueryCondition('test', '=', 'valore'));
    condizAnd.aggiungiSottoCondizione(new QueryCondition('altro', '>', 100));
    assertTrue(condizAnd.valuta(riga), "Valutazione AND deve essere true", logger);
    
    logger.info("Test QueryCondition completato con successo");
  } catch (e) {
    logger.error(`Test QueryCondition fallito: ${e.message}`);
    throw e;
  }
}

/**
 * Test per la classe QueryAggregation
 * @param {MyLoggerService} logger - Servizio logger
 */
function testQueryAggregation(logger) {
  logger.info("Test QueryAggregation iniziato");
  
  try {
    // Dati di test
    const dati = [
      { valore: 10, tipo: 'A' },
      { valore: 20, tipo: 'A' },
      { valore: 30, tipo: 'B' },
      { valore: 40, tipo: 'B' },
      { valore: 50, tipo: 'C' }
    ];
    
    // Test COUNT
    const aggCount = new QueryAggregation('COUNT', 'valore');
    assertEquals(aggCount.calcola(dati), 5, "Aggregazione COUNT deve essere 5", logger);
    
    // Test SUM
    const aggSum = new QueryAggregation('SUM', 'valore');
    assertEquals(aggSum.calcola(dati), 150, "Aggregazione SUM deve essere 150", logger);
    
    // Test AVG
    const aggAvg = new QueryAggregation('AVG', 'valore');
    assertEquals(aggAvg.calcola(dati), 30, "Aggregazione AVG deve essere 30", logger);
    
    logger.info("Test QueryAggregation completato con successo");
  } catch (e) {
    logger.error(`Test QueryAggregation fallito: ${e.message}`);
    throw e;
  }
}

/**
 * Test per la classe QueryGruppo
 * @param {MyLoggerService} logger - Servizio logger
 */
function testQueryGruppo(logger) {
  logger.info("Test QueryGruppo iniziato");
  
  try {
    // Dati di test
    const dati = [
      { tipo: 'A', valore: 10 },
      { tipo: 'A', valore: 20 },
      { tipo: 'B', valore: 30 },
      { tipo: 'B', valore: 40 },
      { tipo: 'C', valore: 50 }
    ];
    
    // Test raggruppamento base
    const gruppo = new QueryGruppo(['tipo']);
    
    // Aggiunta aggregazioni
    const aggSomma = new QueryAggregation('SUM', 'valore', 'totale');
    gruppo.aggiungiAggregazione(aggSomma);
    
    // Test risultato
    const risultato = gruppo.raggruppa(dati);
    assertArray(risultato, "Risultato raggruppamento deve essere un array", logger);
    assertEquals(risultato.length, 3, "Risultato deve avere 3 gruppi", logger);
    
    // Verifica contenuto gruppi
    const gruppoA = risultato.find(g => g.tipo === 'A');
    assertNotNull(gruppoA, "Gruppo A deve esistere", logger);
    assertEquals(gruppoA.totale, 30, "Totale gruppo A deve essere 30", logger);
    
    logger.info("Test QueryGruppo completato con successo");
  } catch (e) {
    logger.error(`Test QueryGruppo fallito: ${e.message}`);
    throw e;
  }
}


/**
 * Verifica che un valore sia vero
 * @param {boolean} valore - Valore da verificare
 * @param {string} messaggio - Messaggio in caso di errore
 * @param {MyLoggerService} logger - Servizio logger
 */
function assertTrue(valore, messaggio, logger) {
  if (valore !== true) {
    logger.error(`Asserzione fallita: ${messaggio}`);
    throw new Error(messaggio);
  }
}

/**
 * Verifica che un valore sia falso
 * @param {boolean} valore - Valore da verificare
 * @param {string} messaggio - Messaggio in caso di errore
 * @param {MyLoggerService} logger - Servizio logger
 */
function assertFalse(valore, messaggio, logger) {
  if (valore !== false) {
    logger.error(`Asserzione fallita: ${messaggio}`);
    throw new Error(messaggio);
  }
}

/**
 * Verifica che due valori siano uguali
 * @param {*} valore1 - Primo valore
 * @param {*} valore2 - Secondo valore
 * @param {string} messaggio - Messaggio in caso di errore
 * @param {MyLoggerService} logger - Servizio logger
 */
function assertEquals(valore1, valore2, messaggio, logger) {
  if (valore1 !== valore2) {
    logger.error(`Asserzione fallita: ${messaggio} (${valore1} !== ${valore2})`);
    throw new Error(`${messaggio} (${valore1} !== ${valore2})`);
  }
}

/**
 * Verifica che un valore non sia null o undefined
 * @param {*} valore - Valore da verificare
 * @param {string} messaggio - Messaggio in caso di errore
 * @param {MyLoggerService} logger - Servizio logger
 */
function assertNotNull(valore, messaggio, logger) {
  if (valore === null || valore === undefined) {
    logger.error(`Asserzione fallita: ${messaggio}`);
    throw new Error(messaggio);
  }
}

/**
 * Verifica che un valore sia un array
 * @param {*} valore - Valore da verificare
 * @param {string} messaggio - Messaggio in caso di errore
 * @param {MyLoggerService} logger - Servizio logger
 */
function assertArray(valore, messaggio, logger) {
  if (!Array.isArray(valore)) {
    logger.error(`Asserzione fallita: ${messaggio}`);
    throw new Error(messaggio);
  }
}

/**
 * Verifica che un valore sia un oggetto
 * @param {*} valore - Valore da verificare
 * @param {string} messaggio - Messaggio in caso di errore
 * @param {MyLoggerService} logger - Servizio logger
 */
function assertObject(valore, messaggio, logger) {
  if (typeof valore !== 'object' || valore === null || Array.isArray(valore)) {
    logger.error(`Asserzione fallita: ${messaggio}`);
    throw new Error(messaggio);
  }
}

/**
 * Verifica che un valore sia un numero
 * @param {*} valore - Valore da verificare
 * @param {string} messaggio - Messaggio in caso di errore
 * @param {MyLoggerService} logger - Servizio logger
 */
function assertNumber(valore, messaggio, logger) {
  if (typeof valore !== 'number' || isNaN(valore)) {
    logger.error(`Asserzione fallita: ${messaggio}`);
    throw new Error(messaggio);
  }
}


/**
 * Esegue tutti i test interattivamente con aggiornamento UI
 */
function eseguiTestInterattivi() {
  // Crea un foglio temporaneo per la visualizzazione dei risultati
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Test Results");
  
  if (sheet) {
    ss.deleteSheet(sheet);
  }
  
  sheet = ss.insertSheet("Test Results");
  
  // Formatta il foglio
  sheet.getRange("A1:B1").setValues([["Test", "Risultato"]]);
  sheet.getRange("A1:B1").setFontWeight("bold");
  sheet.setColumnWidth(1, 300);
  sheet.setColumnWidth(2, 500);
  
  let riga = 2;
  
  // Setup logger con output su foglio di calcolo
  const logger = new MyLoggerService({
    livello: 'INFO',
    logCallback: function(livello, messaggio) {
      sheet.getRange(riga, 1, 1, 2).setValues([[`${livello}`, messaggio]]);
      
      if (livello === "ERROR") {
        sheet.getRange(riga, 1, 1, 2).setBackground("#ffcccc");
      } else if (livello === "INFO") {
        sheet.getRange(riga, 1, 1, 2).setBackground("#ccffcc");
      }
      
      riga++;
    }
  });
  
  const cache = new MyCacheService();
  const utils = new MyUtilsService();
  const spreadsheetService = new MySpreadsheetService(logger, cache, utils);
  
  // Esegui l'inizializzazione e i test
  try {
    const gestoreDB = new GestoreDatabaseAnniScolastici(logger, cache, utils, spreadsheetService);
    
    // Esegui i test singolarmente con visualizzazione risultati
    eseguiTestConRisultati("GestoreDatabaseAnniScolastici", () => testGestoreDatabaseAnniScolastici(gestoreDB, logger), sheet, riga++);
    eseguiTestConRisultati("MyDatabaseService", () => testMyDatabaseService(gestoreDB, logger), sheet, riga++);
    eseguiTestConRisultati("MyTableService", () => testMyTableService(gestoreDB, logger), sheet, riga++);
    eseguiTestConRisultati("AdvancedQueryBuilder", () => testAdvancedQueryBuilder(gestoreDB, logger), sheet, riga++);
    eseguiTestConRisultati("QueryCondition", () => testQueryCondition(logger), sheet, riga++);
    eseguiTestConRisultati("QueryAggregation", () => testQueryAggregation(logger), sheet, riga++);
    eseguiTestConRisultati("QueryGruppo", () => testQueryGruppo(logger), sheet, riga++);
  } catch (e) {
    sheet.getRange(riga, 1, 1, 2).setValues([["ERRORE INIZIALIZZAZIONE", e.message]]);
    sheet.getRange(riga, 1, 1, 2).setBackground("#ffcccc");
  }
}

/**
 * Esegue un singolo test e aggiorna l'UI con il risultato
 * @param {string} nomeTest - Nome del test
 * @param {Function} testFn - Funzione test da eseguire
 * @param {Sheet} sheet - Foglio per i risultati
 * @param {number} riga - Riga su cui scrivere
 */
function eseguiTestConRisultati(nomeTest, testFn, sheet, riga) {
  try {
    testFn();
    sheet.getRange(riga, 1, 1, 2).setValues([[nomeTest, "SUCCESSO"]]);
    sheet.getRange(riga, 1, 1, 2).setBackground("#ccffcc");
  } catch (e) {
    sheet.getRange(riga, 1, 1, 2).setValues([[nomeTest, `FALLITO: ${e.message}`]]);
    sheet.getRange(riga, 1, 1, 2).setBackground("#ffcccc");
  }
}










/**
 * Test delle capacità del JobQueue per task a lunga durata
 */
function testJobQueue() {
  Logger.log("Test MyJobQueue...");
  
  const logger = new MyLoggerService({ livello: 'INFO' });
  const utils = new MyUtilsService();
  
  const jobQueue = new MyJobQueue(logger, utils);
  
  // Test di un job rapido che completa subito
  testJobRapido(jobQueue);
  
  // Test di un job che viene interrotto e ripreso
  testJobInterrottoERipreso(jobQueue);
  
  // Test ottenimento stato
  testOttenimentoStatoJob(jobQueue);
}

/**
 * Test di un job rapido che completa in una esecuzione
 */
function testJobRapido(jobQueue) {
  try {
    Logger.log("Test job rapido...");
    
    // Definiamo un generatore di job che completa velocemente
    function* jobRapido(parametri) {
      const totaleIterazioni = 10;
      
      for (let i = 0; i < totaleIterazioni; i++) {
        const percentuale = Math.round((i + 1) / totaleIterazioni * 100);
        
        yield {
          percentuale: percentuale,
          indice: i,
          messaggio: `Iterazione ${i+1}/${totaleIterazioni}`
        };
      }
      
      return {
        percentuale: 100,
        messaggio: "Job completato con successo",
        risultato: "Successo"
      };
    }
    
    // Eseguiamo il job
    const risultato = jobQueue.esegui("test_job_rapido", jobRapido);
    
    if (risultato) {
      Logger.log(`Job rapido completato: ${risultato.messaggio}`);
    } else {
      Logger.log("Job rapido: Job interrotto o non completato");
    }
  } catch (e) {
    Logger.log(`Test job rapido: Errore - ${e.message}`);
  }
}

/**
 * Test di un job che viene interrotto e ripreso
 */
function testJobInterrottoERipreso(jobQueue) {
  try {
    Logger.log("Test job interrotto e ripreso...");
    
    // Impostiamo una durata massima molto breve per simulare l'interruzione
    jobQueue.impostaDurataMassima(100); // 100ms
    
    // Definiamo un generatore di job che richiede molto tempo
    function* jobLungo(parametri) {
      const totaleIterazioni = 50;
      let inizioIndice = 0;
      
      // Recuperiamo lo stato precedente se disponibile
      if (parametri.statoRipresa) {
        inizioIndice = parametri.statoRipresa.indice || 0;
        Logger.log(`Job lungo: Ripresa dalla iterazione ${inizioIndice}`);
      }
      
      for (let i = inizioIndice; i < totaleIterazioni; i++) {
        // Simuliamo un'operazione che richiede tempo
        Utilities.sleep(30); // 30ms per iterazione
        
        const percentuale = Math.round((i + 1) / totaleIterazioni * 100);
        
        yield {
          percentuale: percentuale,
          indice: i,
          messaggio: `Iterazione ${i+1}/${totaleIterazioni}`
        };
      }
      
      return {
        percentuale: 100,
        messaggio: "Job lungo completato con successo",
        risultato: "Successo"
      };
    }
    
    // Eseguiamo il job - ci aspettiamo che venga interrotto
    const risultato = jobQueue.esegui("test_job_lungo", jobLungo);
    
    if (risultato === null) {
      Logger.log("Job lungo: Job interrotto come previsto, programmata ripresa");
    } else {
      Logger.log("Job lungo: Errore - Il job è completato invece di essere interrotto");
    }
  } catch (e) {
    Logger.log(`Test job interrotto: Errore - ${e.message}`);
  } finally {
    // Ripristiniamo la durata massima default
    jobQueue.impostaDurataMassima(5 * 60 * 1000); // 5 minuti
  }
}

/**
 * Test ottenimento stato job
 */
function testOttenimentoStatoJob(jobQueue) {
  try {
    Logger.log("Test ottenimento stato job...");
    
    // Verifichiamo lo stato del job rapido
    const statoJobRapido = jobQueue.ottieniStato("test_job_rapido");
    
    if (statoJobRapido) {
      Logger.log(`Stato job rapido: ${JSON.stringify(statoJobRapido)}`);
    } else {
      Logger.log("Stato job rapido: Errore - Impossibile ottenere stato");
    }
    
    // Verifichiamo lo stato del job lungo
    const statoJobLungo = jobQueue.ottieniStato("test_job_lungo");
    
    if (statoJobLungo) {
      Logger.log(`Stato job lungo: ${JSON.stringify(statoJobLungo)}`);
    } else {
      Logger.log("Stato job lungo: Errore - Impossibile ottenere stato");
    }
  } catch (e) {
    Logger.log(`Test ottenimento stato: Errore - ${e.message}`);
  }
}

/**
 * Funzione di utilità per generare un UUID
 * @return {string} UUID generato
 */
function _generaUuid() {
  return Utilities.getUuid();
}