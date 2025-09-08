/**
 * Test completo per la gestione delle protezioni delle colonne
 * Crea un nuovo foglio, lo popola e applica protezioni granulari
 */
function testCompletoProtezioniColonne() {
  const logger = new MyLoggerService();
  const cache = new MyCacheService(logger);
  const utils = new MyUtilsService();
  const spreadsheetService = new MySpreadsheetService(logger, cache, utils);
  
  const emailGmail = "leuci.giulio@gmail.com";
  const emailPietroaldi = "leuci.giulio@pietroaldi.com";
  const proprietario = Session.getActiveUser().getEmail();
  
  logger.info("=== INIZIO TEST PROTEZIONI COLONNE COMPLETE ===");
  
  try {
    // FASE 1: Creazione e setup iniziale
    logger.info("Fase 1: Creazione nuovo foglio di calcolo...");
    
    const nuovoFoglio = SpreadsheetApp.create(`Test Protezioni Colonne - ${new Date().toISOString()}`);
    const idFoglio = nuovoFoglio.getId();
    const urlFoglio = nuovoFoglio.getUrl();
    
    logger.info(`Foglio creato - ID: ${idFoglio}`);
    logger.info(`URL: ${urlFoglio}`);
    
    // FASE 2: Popolamento con dati demo
    logger.info("Fase 2: Popolamento dati demo...");
    
    popolaDatiDemo(nuovoFoglio);
    
    // FASE 3: Condivisione con utenti
    logger.info("Fase 3: Condivisione file con utenti...");
    
    condividiFoglio(nuovoFoglio, [emailGmail, emailPietroaldi]);
    
    // FASE 4: Applicazione protezioni
    logger.info("Fase 4: Applicazione protezioni colonne...");
    
    applicaProtezioniColonne(spreadsheetService, idFoglio, emailGmail, emailPietroaldi, proprietario);
    
    // FASE 5: Verifica protezioni
    logger.info("Fase 5: Verifica protezioni applicate...");
    
    const risultatoVerifica = verificaProtezioniApplicate(spreadsheetService, idFoglio);
    
    // FASE 6: Report finale
    logger.info("Fase 6: Generazione report finale...");
    
    generaReportFinale(risultatoVerifica, urlFoglio, emailGmail, emailPietroaldi, proprietario);
    
    logger.info("=== TEST COMPLETATO CON SUCCESSO ===");
    
    return {
      successo: true,
      idFoglio: idFoglio,
      urlFoglio: urlFoglio,
      protezioni: risultatoVerifica
    };
    
  } catch (errore) {
    logger.error(`Errore durante il test: ${errore.message}`);
    logger.error(`Stack trace: ${errore.stack}`);
    
    return {
      successo: false,
      errore: errore.message,
      stack: errore.stack
    };
  }
}

/**
 * Popola il foglio con dati demo per il test
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} foglio - Foglio da popolare
 */
function popolaDatiDemo(foglio) {
  const scheda = foglio.getActiveSheet();
  scheda.setName("Test Protezioni");
  
  // Header
  const intestazioni = [
    ["ID", "Colonna B (Gmail)", "Colonna C", "Colonna D (Pietroaldi)", "Colonna E", "Colonna F (Tutti)", "Note"]
  ];
  
  // Dati demo
  const datiDemo = [
    [1, "Dato B1", "Libero C1", "Dato D1", "Libero E1", "Dato F1", "Riga esempio 1"],
    [2, "Dato B2", "Libero C2", "Dato D2", "Libero E2", "Dato F2", "Riga esempio 2"],
    [3, "Dato B3", "Libero C3", "Dato D3", "Libero E3", "Dato F3", "Riga esempio 3"],
    [4, "Dato B4", "Libero C4", "Dato D4", "Libero E4", "Dato F4", "Riga esempio 4"],
    [5, "Dato B5", "Libero C5", "Dato D5", "Libero E5", "Dato F5", "Riga esempio 5"]
  ];
  
  // Scrivi intestazioni
  scheda.getRange(1, 1, 1, intestazioni[0].length).setValues(intestazioni);
  
  // Formattazione intestazioni
  scheda.getRange(1, 1, 1, intestazioni[0].length)
    .setFontWeight("bold")
    .setBackground("#4285f4")
    .setFontColor("white");
  
  // Scrivi dati
  scheda.getRange(2, 1, datiDemo.length, datiDemo[0].length).setValues(datiDemo);
  
  // Formattazione colonne protette
  scheda.getRange("B:B").setBackground("#fff2cc"); // Giallo per Gmail
  scheda.getRange("D:D").setBackground("#fce5cd"); // Arancione per Pietroaldi
  scheda.getRange("F:F").setBackground("#d9ead3"); // Verde per tutti
  
  // Aggiungi note esplicative
  scheda.getRange("A8").setValue("LEGENDA PROTEZIONI:");
  scheda.getRange("A9").setValue("• Colonna B (gialla): Solo leuci.giulio@gmail.com");
  scheda.getRange("A10").setValue("• Colonna D (arancione): Solo leuci.giulio@pietroaldi.com");
  scheda.getRange("A11").setValue("• Colonna F (verde): Tutti e tre gli utenti");
  scheda.getRange("A12").setValue("• Altre colonne: Libere per tutti");
  
  // Formattazione note
  scheda.getRange("A8:A12")
    .setFontWeight("bold")
    .setFontColor("#666666");
  
  // Auto-resize colonne
  scheda.autoResizeColumns(1, 7);
  
  console.log("Dati demo popolati con successo");
}

/**
 * Condivide il foglio con gli utenti specificati
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} foglio - Foglio da condividere
 * @param {Array<string>} emailUtenti - Array degli email degli utenti
 */
function condividiFoglio(foglio, emailUtenti) {
  emailUtenti.forEach(email => {
    try {
      foglio.addEditor(email);
      console.log(`Foglio condiviso con: ${email}`);
    } catch (errore) {
      console.warn(`Impossibile condividere con ${email}: ${errore.message}`);
    }
  });
  
  // Breve pausa per permettere la propagazione dei permessi
  Utilities.sleep(2000);
}

/**
 * Applica le protezioni alle colonne specificate
 * @param {MySpreadsheetService} service - Servizio spreadsheet
 * @param {string} idFoglio - ID del foglio
 * @param {string} emailGmail - Email Gmail
 * @param {string} emailPietroaldi - Email Pietroaldi
 * @param {string} proprietario - Email proprietario
 */
function applicaProtezioniColonne(service, idFoglio, emailGmail, emailPietroaldi, proprietario) {
  // Apri il foglio nel servizio usando il pattern fluent
  console.log("Apertura foglio nel servizio...");
  service.apri(idFoglio);
  
  // Verifica che il foglio sia stato aperto
  const spreadsheet = service.ottieniSpreadsheet();
  if (!spreadsheet) {
    throw new Error("Impossibile aprire il foglio nel servizio");
  }
  console.log(`Foglio aperto correttamente: ${spreadsheet.getName()}`);
  
  // Protezione Colonna B: Solo Gmail + Proprietario
  console.log("Applicazione protezione colonna B...");
  service
    .apri(idFoglio)  // Riapri per sicurezza
    .proteggiRange("B:B", [emailGmail, proprietario], "Colonna B - Solo Gmail");
  
  // Piccola pausa tra le operazioni
  Utilities.sleep(1000);
  
  // Protezione Colonna D: Solo Pietroaldi + Proprietario
  console.log("Applicazione protezione colonna D...");
  service
    .apri(idFoglio)  // Riapri per sicurezza
    .proteggiRange("D:D", [emailPietroaldi, proprietario], "Colonna D - Solo Pietroaldi");
  
  // Piccola pausa tra le operazioni
  Utilities.sleep(1000);
  
  // Protezione Colonna F: Tutti e tre
  console.log("Applicazione protezione colonna F...");
  service
    .apri(idFoglio)  // Riapri per sicurezza
    .proteggiRange("F:F", [emailGmail, emailPietroaldi, proprietario], "Colonna F - Tutti");
  
  console.log("Protezioni colonne applicate con successo");
}

/**
 * Verifica che le protezioni siano state applicate correttamente
 * @param {MySpreadsheetService} service - Servizio spreadsheet
 * @param {string} idFoglio - ID del foglio
 * @returns {Object} Risultato della verifica
 */
function verificaProtezioniApplicate(service, idFoglio) {
  // Assicurati che il foglio sia aperto nel servizio
  service.apri(idFoglio);
  
  // Verifica che il foglio sia stato aperto
  const spreadsheet = service.ottieniSpreadsheet();
  if (!spreadsheet) {
    throw new Error("Impossibile aprire il foglio nel servizio per la verifica");
  }
  console.log(`Foglio aperto per verifica: ${spreadsheet.getName()}`);
  
  // Ottieni tutte le protezioni di tipo RANGE
  let protezioni;
  try {
    protezioni = service.ottieniProtezioni('RANGE');
    
    // Se il risultato è undefined o null, prova ad ottenere il risultato dall'ultima operazione
    if (!protezioni) {
      const ultimoRisultato = service.ottieniRisultato();
      protezioni = ultimoRisultato || [];
    }
    
  } catch (errore) {
    console.error(`Errore ottenimento protezioni: ${errore.message}`);
    protezioni = [];
  }
  
  // Assicurati che protezioni sia un array
  if (!Array.isArray(protezioni)) {
    console.warn(`Protezioni non è un array, ricevuto: ${typeof protezioni}`);
    protezioni = [];
  }
  
  console.log(`Trovate ${protezioni.length} protezioni RANGE`);
  
  const risultato = {
    totaleProtezioni: protezioni.length,
    protezioniDettaglio: [],
    verificaCompleta: true,
    errori: []
  };
  
  // Se non ci sono protezioni, segnala errore
  if (protezioni.length === 0) {
    risultato.verificaCompleta = false;
    risultato.errori.push("Nessuna protezione trovata");
    return risultato;
  }
  
  // Analizza ogni protezione
  protezioni.forEach((protezione, index) => {
    console.log(`Protezione ${index + 1}:`);
    console.log(`  Range: ${protezione.range || 'N/A'}`);
    console.log(`  Descrizione: ${protezione.descrizione || 'N/A'}`);
    console.log(`  Editor: ${Array.isArray(protezione.editor) ? protezione.editor.join(', ') : 'N/A'}`);
    
    risultato.protezioniDettaglio.push({
      range: protezione.range || 'N/A',
      descrizione: protezione.descrizione || 'N/A',
      editor: Array.isArray(protezione.editor) ? protezione.editor : [],
      numeroEditor: Array.isArray(protezione.editor) ? protezione.editor.length : 0
    });
  });
  
  // Verifica specifica per le colonne attese
  const colonneAttese = ['B:B', 'D:D', 'F:F'];
  colonneAttese.forEach(colonna => {
    const protezioneColonna = protezioni.find(p => p.range === colonna);
    if (!protezioneColonna) {
      risultato.verificaCompleta = false;
      risultato.errori.push(`Protezione mancante per colonna ${colonna}`);
    }
  });
  
  return risultato;
}

/**
 * Genera il report finale del test
 * @param {Object} risultatoVerifica - Risultato della verifica
 * @param {string} urlFoglio - URL del foglio creato
 * @param {string} emailGmail - Email Gmail
 * @param {string} emailPietroaldi - Email Pietroaldi
 * @param {string} proprietario - Email proprietario
 */
function generaReportFinale(risultatoVerifica, urlFoglio, emailGmail, emailPietroaldi, proprietario) {
  console.log("\n" + "=".repeat(60));
  console.log("📊 REPORT FINALE TEST PROTEZIONI");
  console.log("=".repeat(60));
  
  console.log(`🔗 URL Foglio: ${urlFoglio}`);
  console.log(`👤 Proprietario: ${proprietario}`);
  console.log(`📧 Utente Gmail: ${emailGmail}`);
  console.log(`🏢 Utente Pietroaldi: ${emailPietroaldi}`);
  
  console.log("\n📋 PROTEZIONI APPLICATE:");
  console.log(`   Totale: ${risultatoVerifica.totaleProtezioni}`);
  
  risultatoVerifica.protezioniDettaglio.forEach((protezione, index) => {
    console.log(`   ${index + 1}. ${protezione.range}:`);
    console.log(`      📝 ${protezione.descrizione}`);
    console.log(`      👥 Editor (${protezione.numeroEditor}): ${protezione.editor.join(', ')}`);
  });
  
  console.log("\n✅ STATO VERIFICA:");
  if (risultatoVerifica.verificaCompleta) {
    console.log("   ✓ Tutte le protezioni applicate correttamente");
  } else {
    console.log("   ❌ Errori rilevati:");
    risultatoVerifica.errori.forEach(errore => {
      console.log(`     • ${errore}`);
    });
  }
  
  console.log("\n🧪 VERIFICHE MANUALI CONSIGLIATE:");
  console.log("   1. Aprire il foglio con l'account Gmail");
  console.log("      → Dovrebbe poter modificare solo colonna B e F");
  console.log("   2. Aprire il foglio con l'account Pietroaldi");
  console.log("      → Dovrebbe poter modificare solo colonna D e F");
  console.log("   3. Verificare che le altre colonne siano libere");
  console.log("   4. Testare che gli utenti non autorizzati ricevano errori");
  
  console.log("\n" + "=".repeat(60));
}

/**
 * Funzione di utilità per eseguire solo la verifica su un foglio esistente
 * @param {string} idFoglio - ID del foglio da verificare
 */
function verificaFoglioEsistente(idFoglio) {
  const logger = new MyLoggerService();
  const cache = new MyCacheService(logger);
  const utils = new MyUtilsService();
  const spreadsheetService = new MySpreadsheetService(logger, cache, utils);
  
  console.log(`Verifica protezioni per foglio: ${idFoglio}`);
  
  try {
    const risultato = verificaProtezioniApplicate(spreadsheetService, idFoglio);
    
    console.log("\n📊 RISULTATO VERIFICA:");
    console.log(`Protezioni trovate: ${risultato.totaleProtezioni}`);
    console.log(`Verifica completa: ${risultato.verificaCompleta ? 'SÌ' : 'NO'}`);
    
    if (!risultato.verificaCompleta) {
      console.log("Errori:");
      risultato.errori.forEach(errore => console.log(`  • ${errore}`));
    }
    
    return risultato;
    
  } catch (errore) {
    console.error(`Errore durante la verifica: ${errore.message}`);
    return null;
  }
}

/**
 * Funzione di cleanup per rimuovere tutte le protezioni da un foglio
 * @param {string} idFoglio - ID del foglio da pulire
 */
function rimuoviTutteProtezioni(idFoglio) {
  const logger = new MyLoggerService();
  const cache = new MyCacheService(logger);
  const utils = new MyUtilsService();
  const spreadsheetService = new MySpreadsheetService(logger, cache, utils);
  
  console.log(`Rimozione protezioni da foglio: ${idFoglio}`);
  
  try {
    spreadsheetService.apri(idFoglio);
    
    // Verifica che il foglio sia stato aperto
    const spreadsheet = spreadsheetService.ottieniSpreadsheet();
    if (!spreadsheet) {
      throw new Error("Impossibile aprire il foglio per la rimozione");
    }
    
    // Ottieni tutte le protezioni
    let protezioni;
    try {
      protezioni = spreadsheetService.ottieniProtezioni();
      
      // Se il risultato è undefined, prova ad ottenere dall'ultima operazione
      if (!protezioni) {
        const ultimoRisultato = spreadsheetService.ottieniRisultato();
        protezioni = ultimoRisultato || [];
      }
      
    } catch (errore) {
      console.error(`Errore ottenimento protezioni: ${errore.message}`);
      protezioni = [];
    }
    
    // Assicurati che protezioni sia un array
    if (!Array.isArray(protezioni)) {
      console.warn(`Protezioni non è un array, ricevuto: ${typeof protezioni}`);
      protezioni = [];
    }
    
    console.log(`Trovate ${protezioni.length} protezioni da rimuovere`);
    
    if (protezioni.length === 0) {
      console.log("Nessuna protezione da rimuovere");
      return;
    }
    
    // Rimuovi ogni protezione usando gli ID
    protezioni.forEach((protezione, index) => {
      console.log(`Rimozione protezione ${index + 1}: ${protezione.range || protezione.foglio || 'N/A'}`);
      
      try {
        if (protezione.range) {
          // Protezione range - riapri il foglio per sicurezza
          spreadsheetService
            .apri(idFoglio)
            .rimuoviProtezioneRange(protezione.range);
        } else if (protezione.foglio) {
          // Protezione foglio - riapri il foglio per sicurezza
          spreadsheetService
            .apri(idFoglio)
            .rimuoviProtezioneFoglio(protezione.foglio);
        }
        
        // Pausa tra rimozioni
        Utilities.sleep(500);
        
      } catch (errore) {
        console.error(`Errore rimozione protezione ${index + 1}: ${errore.message}`);
      }
    });
    
    console.log("✅ Processo rimozione protezioni completato");
    
  } catch (errore) {
    console.error(`Errore durante la rimozione: ${errore.message}`);
  }
}

// Esempi di utilizzo:
// testCompletoProtezioniColonne();  // Crea nuovo foglio e testa tutto
// verificaFoglioEsistente("ID_FOGLIO");  // Verifica foglio esistente
// rimuoviTutteProtezioni("ID_FOGLIO");  // Pulisce foglio esistente