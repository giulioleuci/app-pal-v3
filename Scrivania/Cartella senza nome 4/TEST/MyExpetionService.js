/**
 * Test completo per MyExceptionService
 * Verifica tutte le funzionalità del servizio di gestione eccezioni
 */
function testMyExceptionService() {
  console.log("=== INIZIO TEST MyExceptionService ===\n");
  
  // Inizializzazione servizi
  const logger = new MyLoggerService({ livello: 'DEBUG' });
  const utils = new MyUtilsService();
  const exceptionService = new MyExceptionService(logger, utils);
  
  let testPassati = 0;
  let testFalliti = 0;
  
  // Helper per confronto risultati
  function verificaTest(nomeTest, valoreOttenuto, valoreAtteso, confrontoCustom) {
    console.log(`\n--- Test: ${nomeTest} ---`);
    
    let successo = false;
    if (confrontoCustom) {
      successo = confrontoCustom(valoreOttenuto, valoreAtteso);
    } else {
      successo = JSON.stringify(valoreOttenuto) === JSON.stringify(valoreAtteso);
    }
    
    console.log(`Valore atteso: ${JSON.stringify(valoreAtteso, null, 2)}`);
    console.log(`Valore ottenuto: ${JSON.stringify(valoreOttenuto, null, 2)}`);
    console.log(`Risultato: ${successo ? '✓ PASSATO' : '✗ FALLITO'}`);
    
    if (successo) {
      testPassati++;
    } else {
      testFalliti++;
    }
    
    return successo;
  }
  
  // Test 1: Classificazione errore QUOTA
  console.log("\n=== TEST 1: CLASSIFICAZIONE ERRORI ===");
  
  const erroreQuota = new Error("Service invoked too many times in a short time: spreadsheet");
  const classificazioneQuota = exceptionService.classificaErrore(erroreQuota);
  
  verificaTest(
    "Classificazione errore QUOTA",
    {
      tipo: classificazioneQuota.tipo,
      categoria: classificazioneQuota.categoria,
      gravita: classificazioneQuota.gravita,
      recuperabile: classificazioneQuota.recuperabile
    },
    {
      tipo: "QUOTA_LIMIT",
      categoria: "QUOTA",
      gravita: "MEDIA",
      recuperabile: true
    }
  );
  
  // Test 2: Classificazione errore PERMESSI
  const errorePermessi = new Error("You do not have permission to access the requested document");
  const classificazionePermessi = exceptionService.classificaErrore(errorePermessi);
  
  verificaTest(
    "Classificazione errore PERMESSI",
    {
      tipo: classificazionePermessi.tipo,
      categoria: classificazionePermessi.categoria,
      gravita: classificazionePermessi.gravita,
      recuperabile: classificazionePermessi.recuperabile
    },
    {
      tipo: "PERMISSION_DENIED",
      categoria: "PERMESSI",
      gravita: "ALTA",
      recuperabile: false
    }
  );
  
  // Test 3: Classificazione errore SCONOSCIUTO
  const erroreSconosciuto = new Error("Errore generico non mappato");
  const classificazioneSconosciuta = exceptionService.classificaErrore(erroreSconosciuto);
  
  verificaTest(
    "Classificazione errore SCONOSCIUTO",
    classificazioneSconosciuta.tipo,
    "SCONOSCIUTO"
  );
  
  // Test 4: Esecuzione con successo
  console.log("\n=== TEST 2: ESECUZIONE CON GESTIONE ===");
  
  const funzioneSuccesso = (params) => {
    return params.valore * 2;
  };
  
  const risultatoSuccesso = exceptionService.eseguiConGestioneAvanzata(
    funzioneSuccesso,
    { valore: 10 },
    { nomeOperazione: 'TestSuccesso' }
  );
  
  verificaTest(
    "Esecuzione con successo",
    {
      successo: risultatoSuccesso.successo,
      risultato: risultatoSuccesso.risultato,
      tentativi: risultatoSuccesso.tentativi,
      errore: risultatoSuccesso.errore
    },
    {
      successo: true,
      risultato: 20,
      tentativi: 1,
      errore: null
    }
  );
  
  // Test 5: Esecuzione con retry (simula errore temporaneo)
  let contatoreChiamate = 0;
  const funzioneRetry = () => {
    contatoreChiamate++;
    if (contatoreChiamate < 3) {
      throw new Error("Service temporarily unavailable");
    }
    return "Successo dopo retry";
  };
  
  const risultatoRetry = exceptionService.eseguiConGestioneAvanzata(
    funzioneRetry,
    {},
    { 
      nomeOperazione: 'TestRetry',
      modalita: 'RECOVERY'
    }
  );
  
  verificaTest(
    "Esecuzione con retry automatico",
    {
      successo: risultatoRetry.successo,
      risultato: risultatoRetry.risultato,
      tentativi: risultatoRetry.tentativi
    },
    {
      successo: true,
      risultato: "Successo dopo retry",
      tentativi: 3
    }
  );
  
  // Test 6: Esecuzione con errore non recuperabile
  const funzioneErroreGrave = () => {
    throw new Error("Invalid argument: spreadsheetId");
  };
  
  const risultatoErroreGrave = exceptionService.eseguiConGestioneAvanzata(
    funzioneErroreGrave,
    {},
    { 
      nomeOperazione: 'TestErroreGrave',
      modalita: 'STRICT'
    }
  );
  
  verificaTest(
    "Esecuzione con errore non recuperabile",
    {
      successo: risultatoErroreGrave.successo,
      categoria: risultatoErroreGrave.errore?.categoria,
      tentativiEffettuati: risultatoErroreGrave.tentativi
    },
    {
      successo: false,
      categoria: "ARGOMENTO",
      tentativiEffettuati: 1
    }
  );
  
  // Test 7: Statistiche errori
  console.log("\n=== TEST 3: STATISTICHE ERRORI ===");
  
  // Reset statistiche per test pulito
  exceptionService.resetStatistiche();
  
  // Genera alcuni errori di test
  exceptionService.eseguiConGestioneAvanzata(() => { throw new Error("Test error 1"); }, {}, { nomeOperazione: 'Test1', step: 'Step1' });
  exceptionService.eseguiConGestioneAvanzata(() => { throw new Error("Test error 2"); }, {}, { nomeOperazione: 'Test2', step: 'Step1' });
  exceptionService.eseguiConGestioneAvanzata(() => { return "ok"; }, {}, { nomeOperazione: 'Test3' });
  
  const riepilogo = exceptionService.ottieniRiepilogoErrori();
  
  verificaTest(
    "Conteggio statistiche errori",
    {
      totale: riepilogo.contatori.totale,
      recuperati: riepilogo.contatori.recuperati,
      nonRecuperati: riepilogo.contatori.nonRecuperati
    },
    {
      totale: 2,
      recuperati: 0,
      nonRecuperati: 2
    },
    (ottenuto, atteso) => {
      // Confronto meno rigido per le statistiche
      return ottenuto.totale === atteso.totale &&
             ottenuto.recuperati === atteso.recuperati &&
             ottenuto.nonRecuperati === atteso.nonRecuperati;
    }
  );
  
  // Test 8: Metodo compatibilità eseguiConRetry
  console.log("\n=== TEST 4: METODI COMPATIBILITÀ ===");
  
  let tentativiCompatibilita = 0;
  const funzioneCompatibilita = () => {
    tentativiCompatibilita++;
    if (tentativiCompatibilita < 2) {
      throw new Error("Errore temporaneo");
    }
    return "OK dopo retry";
  };
  
  let risultatoCompat;
  let erroreCompat = null;
  try {
    risultatoCompat = exceptionService.eseguiConRetry(funzioneCompatibilita, {}, 3);
  } catch (e) {
    erroreCompat = e;
  }
  
  verificaTest(
    "eseguiConRetry - successo dopo retry",
    {
      risultato: risultatoCompat,
      errore: erroreCompat
    },
    {
      risultato: "OK dopo retry",
      errore: null
    }
  );
  
  // Test 9: eseguiConBypass
  const funzioneBypass = () => {
    throw new Error("Errore permanente");
  };
  
  const risultatoBypass = exceptionService.eseguiConBypass(
    funzioneBypass,
    {},
    "valore di default"
  );
  
  verificaTest(
    "eseguiConBypass - ritorna valore default",
    risultatoBypass,
    "valore di default"
  );
  
  // Test 10: Analisi errore dettagliata
  console.log("\n=== TEST 5: ANALISI ERRORE ===");
  
  const erroreAnalisi = new Error("Service invoked too many times");
  const analisi = exceptionService.analizzaErrore(erroreAnalisi);
  
  verificaTest(
    "Analisi errore - proprietà principali",
    {
      haClassificazione: !!analisi.classificazione,
      haStrategia: !!analisi.strategiaConsigliata,
      haSuggerimenti: Array.isArray(analisi.suggerimenti) && analisi.suggerimenti.length > 0,
      recuperabile: analisi.recuperabile
    },
    {
      haClassificazione: true,
      haStrategia: true,
      haSuggerimenti: true,
      recuperabile: true
    }
  );
  
  // Test 11: Report testuale
  console.log("\n=== TEST 6: REPORT ERRORI ===");
  
  const report = exceptionService.stampaAnalisiErrori(false);
  
  verificaTest(
    "Generazione report testuale",
    {
      isString: typeof report === 'string',
      contieneIntestazione: report.includes("ANALISI ERRORI"),
      contieneTotale: report.includes("Totale errori:")
    },
    {
      isString: true,
      contieneIntestazione: true,
      contieneTotale: true
    }
  );
  
  // Test 12: Calcolo tempo attesa backoff
  console.log("\n=== TEST 7: BACKOFF ESPONENZIALE ===");
  
  // Accediamo al metodo privato per testarlo
  const tempoAttesa1 = exceptionService._calcolaTempoAttesa(1, 1000, 2);
  const tempoAttesa2 = exceptionService._calcolaTempoAttesa(2, 1000, 2);
  const tempoAttesa3 = exceptionService._calcolaTempoAttesa(3, 1000, 2);
  
  verificaTest(
    "Calcolo backoff esponenziale",
    {
      primoTentativo: tempoAttesa1 >= 1000 && tempoAttesa1 <= 1500,
      secondoTentativo: tempoAttesa2 >= 2000 && tempoAttesa2 <= 3000,
      terzoTentativo: tempoAttesa3 >= 4000 && tempoAttesa3 <= 6000
    },
    {
      primoTentativo: true,
      secondoTentativo: true,
      terzoTentativo: true
    }
  );
  
  // Test 13: Modalità LENIENT
  console.log("\n=== TEST 8: MODALITÀ ESECUZIONE ===");
  
  const funzioneModalita = () => {
    throw new Error("Errore di test");
  };
  
  const risultatoLenient = exceptionService.eseguiConGestioneAvanzata(
    funzioneModalita,
    {},
    { 
      nomeOperazione: 'TestLenient',
      modalita: 'LENIENT'
    }
  );
  
  verificaTest(
    "Modalità LENIENT - gestione permissiva",
    risultatoLenient.successo,
    false
  );
  
  // Riepilogo finale
  console.log("\n=== RIEPILOGO TEST ===");
  console.log(`Test passati: ${testPassati}`);
  console.log(`Test falliti: ${testFalliti}`);
  console.log(`Totale test: ${testPassati + testFalliti}`);
  console.log(`Percentuale successo: ${((testPassati / (testPassati + testFalliti)) * 100).toFixed(2)}%`);
  
  // Cleanup finale
  logger.pulisci();
  
  return {
    passati: testPassati,
    falliti: testFalliti,
    totale: testPassati + testFalliti
  };
}