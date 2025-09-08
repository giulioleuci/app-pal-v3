/**
 * Genera il piano di lavoro per la classe 1A LC
 * @return {Object} Risultato della generazione
 */
function generaPianoLavoro1ALC() {
  const servizi = inizializzaServizi();
  
  const pianoLavoro = new PianoLavoro({
    ...servizi,
    parametriAggiuntivi: {
      // Parametri da PARAMETRI AGGIUNTIVI GENERAZIONE nel CSV
    }
  });
  
  const risultato = pianoLavoro.genera({
    classe: '1A LC'
  });
  
  if (risultato.documentoCreato) {
    servizi.logger.info(`Piano di lavoro generato: ${risultato.documentoCreato.name}`);
  } else if (risultato.errorePipeline) {
    servizi.logger.error(`Errore: ${risultato.errorePipeline.messaggio}`);
  }
  
  return risultato;
}

/**
 * Genera il verbale di ottobre per la classe 1A
 * @return {Object} Risultato della generazione
 */
function generaVerbaleOttobre1A() {
  const servizi = inizializzaServizi();
  
  const verbale = new VerbaleCDC({
    ...servizi,
    parametriAggiuntivi: {
      // Parametri da PARAMETRI AGGIUNTIVI GENERAZIONE nel CSV
    }
  });
  
  const risultato = verbale.genera({
    classe: '1A LC',
    mese: 'OTTOBRE' // o '10'
  });
  
  if (risultato.documentoCreato) {
    servizi.logger.info(`Verbale generato: ${risultato.documentoCreato.name}`);
  } else if (risultato.errorePipeline) {
    servizi.logger.error(`Errore: ${risultato.errorePipeline.messaggio}`);
  }
  
  return risultato;
}

/**
 * JobHandler per generare verbali di ottobre per tutte le classi attive
 * @generator
 * @param {Object} parametri - Parametri del job
 * @yields {Object} Stato di avanzamento
 */
function* jobGeneraVerbaliOttobreTutti(parametri) {
  const servizi = inizializzaServizi();
  const { statoRipresa = {} } = parametri;
  
  // Ottieni classi attive
  const classi = servizi.gestoreClassi.ottieniClassiAttive();
  const totaleClassi = classi.length;
  
  // Ripresa da dove si era interrotto
  let indiceInizio = statoRipresa.ultimoIndice || 0;
  let completati = statoRipresa.completati || 0;
  let errori = statoRipresa.errori || 0;
  
  servizi.logger.info(`Generazione verbali ottobre: ${totaleClassi} classi da processare`);
  
  for (let i = indiceInizio; i < totaleClassi; i++) {
    const classe = classi[i];
    const nomeClasse = classe.ottieniNome();
    
    try {
      const verbale = new VerbaleCDC(servizi);
      
      const risultato = verbale.genera({
        classe: nomeClasse,
        mese: 'ottobre'
      });
      
      if (risultato.documentoCreato) {
        completati++;
        servizi.logger.info(`Verbale ottobre generato per classe ${nomeClasse}`);
      } else {
        errori++;
        servizi.logger.error(`Errore verbale ottobre per classe ${nomeClasse}`);
      }
    } catch (e) {
      errori++;
      servizi.logger.error(`Errore classe ${nomeClasse}: ${e.message}`);
    }
    
    // Yield dello stato per permettere interruzione/ripresa
    yield {
      ultimoIndice: i + 1,
      completati: completati,
      errori: errori,
      percentuale: Math.round(((i + 1) / totaleClassi) * 100)
    };
  }
  
  return {
    completati: completati,
    errori: errori,
    totale: totaleClassi
  };
}

/**
 * Funzione per avviare la generazione batch dei piani di lavoro
 */
function avviaGenerazionePianiLavoro() {
  const servizi = inizializzaServizi();
  const jobQueue = new MyJobQueue(servizi.logger, servizi.utils);
  
  // Registra il job handler
  jobQueue.registraJobHandler('generaPianiLavoro', jobGeneraPianiLavoroTutti);
  
  // Avvia il job
  const risultato = jobQueue.esegui(
    'job_piani_lavoro_tutti',
    'generaPianiLavoro',
    {},
    false // Non forzare ripartenza
  );
  
  return risultato;
}

/**
 * Funzione per avviare la generazione batch dei verbali di ottobre
 */
function avviaGenerazioneVerbaliOttobre() {
  const servizi = inizializzaServizi();
  const jobQueue = new MyJobQueue(servizi.logger, servizi.utils);
  
  // Registra il job handler
  jobQueue.registraJobHandler('generaVerbaliOttobre', jobGeneraVerbaliOttobreTutti);
  
  // Avvia il job
  const risultato = jobQueue.esegui(
    'job_verbali_ottobre_tutti',
    'generaVerbaliOttobre',
    {},
    false // Non forzare ripartenza
  );
  
  return risultato;
}



/**
 * Genera il documento Condotta per la classe 1A
 * @return {Object} Risultato della generazione
 */
function generaCondotta1A() {
  try {
    // Inizializza i servizi
    const servizi = inizializzaServizi();
    
    // Configura il documento Condotta
    const configurazione = {
      logger: servizi.logger,
      utils: servizi.utils,
      cache: servizi.cache,
      exceptionService: servizi.exceptionService,
      spreadsheetService: servizi.spreadsheetService,
      documentService: servizi.documentService,
      driveService: servizi.driveService,
      permissionService: servizi.permissionService,
      mustache: servizi.mustache,
      gestoreDB: servizi.gestoreDB,
      gestoreDocumenti: servizi.gestoreDocumenti,
      gestoreClassi: servizi.gestoreClassi,
      gestoreAlunni: servizi.gestoreAlunni,
      gestoreDocenti: servizi.gestoreDocenti,
      archivioPlaceholder: servizi.archivioPlaceholder,
      placeholderService: servizi.placeholderService
    };
    
    // Crea istanza di Condotta
    const condotta = new Condotta(configurazione);
    
    // Parametri per la generazione
    const parametri = {
      classe: '1A LC'
    };
    
    // Genera il documento
    const risultato = condotta.genera(parametri);
    
    // Log del risultato
    if (risultato.errorePipeline) {
      servizi.logger.error(`Errore generazione Condotta 1A: ${risultato.errorePipeline.messaggio}`);
    } else if (risultato.documentoCreato) {
      servizi.logger.info(`Condotta 1A generata con successo: ${risultato.documentoCreato.name}`);
      servizi.logger.info(`ID documento: ${risultato.documentoCreato.id}`);
      servizi.logger.info(`URL: ${risultato.documentoCreato.url}`);
    }
    
    return risultato;
    
  } catch (errore) {
    console.error('Errore nella generazione della Condotta:', errore);
    throw errore;
  }
}