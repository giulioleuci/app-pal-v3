// File: Base/JobHandler.js

/**
 * Crea un job handler per iterare su una o più collezioni di dati
 * @param {Object} configurazione - Configurazione del job
 * @return {Function} L'handler del job da registrare con MyJobQueue
 */
function creaJobIterativo(configurazione) {
  // Validazione configurazione
  if (!configurazione || !configurazione.livelli || !configurazione.azione) {
    throw new Error("Configurazione job incompleta: servono livelli e azione");
  }

  const livelli = configurazione.livelli;
  const azione = configurazione.azione;
  const azioneFinale = configurazione.azioneFinale;
  const gestioneErrore = configurazione.gestioneErrore;
  const intervalloAttesa = configurazione.intervalloAttesa || 0;

  // Restituisce un generatore che implementa il job
  return function* jobHandler(parametri) {
    const logger = new MyLoggerService({ livello: 'INFO' });
    logger.info("Avvio job iterativo");

    // Strutture per lo stato
    let statoCorrente = {};
    let risultati = [];

    // Recupera stato di ripresa
    if (parametri.statoRipresa) {
      statoCorrente = parametri.statoRipresa.statoCorrente || {};
      risultati = parametri.statoRipresa.risultati || [];
      logger.info(`Ripresa job da: ${JSON.stringify(statoCorrente)}`);
    }

    // Inizializzazione
    let indici = [];
    let elementi = [];
    let totaleCombinazioni = 1;

    try {
      // Inizializza gli elementi per ogni livello
      for (let i = 0; i < livelli.length; i++) {
        const livello = livelli[i];
        const elementiLivello = livello.generatore(parametri, statoCorrente);
        const elementiLivelloFiltrati = livello.filtro ?
          elementiLivello.filter(el => livello.filtro(el, parametri, statoCorrente)) :
          elementiLivello;

        totaleCombinazioni *= elementiLivelloFiltrati.length;
        elementi.push(elementiLivelloFiltrati);
        indici.push(statoCorrente[livello.nome] || 0);
      }
      logger.info(`Totale combinazioni: ${totaleCombinazioni}`);
    } catch (errore) {
      logger.error(`Errore nell'inizializzazione: ${errore.message}`);
      if (gestioneErrore) gestioneErrore(errore, "inizializzazione", statoCorrente);
      throw errore;
    }

    let combinazioniElaborate = 0;
    for (let i = 0; i < livelli.length; i++) {
      combinazioniElaborate += indici[i] * (i === 0 ? 1 : elementi.slice(0, i).reduce((prod, el) => prod * el.length, 1));
    }

    // Iterazione
    let completato = false;
    let datiIterazione = {};

    while (!completato) {
      try {
        for (let i = 0; i < livelli.length; i++) {
          if (elementi[i].length > 0) datiIterazione[livelli[i].nome] = elementi[i][indici[i]];
        }
        
        const risultatoAzione = azione(datiIterazione, parametri);
        risultati.push({ timestamp: new Date().toISOString(), datiIterazione: JSON.parse(JSON.stringify(datiIterazione)), risultato: risultatoAzione });
        combinazioniElaborate++;
        if (intervalloAttesa > 0) Utilities.sleep(intervalloAttesa);
        
        for (let i = 0; i < livelli.length; i++) statoCorrente[livelli[i].nome] = indici[i];

        yield {
          statoCorrente: statoCorrente,
          risultati: risultati,
          percentuale: Math.round((combinazioniElaborate / totaleCombinazioni) * 100),
          elementoCorrente: datiIterazione,
          combinazioniElaborate: combinazioniElaborate,
          totaleCombinazioni: totaleCombinazioni
        };

        let livelloCorrente = livelli.length - 1;
        let incrementoCompletato = false;
        while (!incrementoCompletato && livelloCorrente >= 0) {
          indici[livelloCorrente]++;
          if (indici[livelloCorrente] >= elementi[livelloCorrente].length) {
            indici[livelloCorrente] = 0;
            livelloCorrente--;
          } else {
            incrementoCompletato = true;
          }
        }
        if (livelloCorrente < 0) completato = true;
      } catch (errore) {
        logger.error(`Errore: ${errore.message}`);
        risultati.push({ timestamp: new Date().toISOString(), datiIterazione: JSON.parse(JSON.stringify(datiIterazione)), errore: errore.message });
        if (gestioneErrore) gestioneErrore(errore, "esecuzione", datiIterazione);
        
        // Passa alla prossima iterazione
        let livelloCorrente = livelli.length - 1;
        let incrementoCompletato = false;
        while (!incrementoCompletato && livelloCorrente >= 0) {
          indici[livelloCorrente]++;
          if (indici[livelloCorrente] >= elementi[livelloCorrente].length) {
            indici[livelloCorrente] = 0;
            livelloCorrente--;
          } else {
            incrementoCompletato = true;
          }
        }
        if (livelloCorrente < 0) completato = true;

        yield {
          statoCorrente: statoCorrente,
          risultati: risultati,
          percentuale: Math.round((combinazioniElaborate / totaleCombinazioni) * 100),
          elementoCorrente: datiIterazione,
          ultimoErrore: errore.message,
          combinazioniElaborate: combinazioniElaborate,
          totaleCombinazioni: totaleCombinazioni
        };
      }
    }

    if (azioneFinale) {
      try {
        const risultatoFinale = azioneFinale(risultati, parametri);
        return { completato: true, percentuale: 100, risultati: risultati, totaleElaborati: combinazioniElaborate, risultatoFinale: risultatoFinale };
      } catch (errore) {
        logger.error(`Errore nell'azione finale: ${errore.message}`);
        if (gestioneErrore) gestioneErrore(errore, "completamento", null);
        return { completato: true, percentuale: 100, risultati: risultati, erroreFinale: errore.message, totaleElaborati: combinazioniElaborate };
      }
    }

    return { completato: true, percentuale: 100, risultati: risultati, totaleElaborati: combinazioniElaborate };
  };
}

/**
 * Funzione globale per la ripresa dei job interrotti.
 * VIENE ESEGUITA DAI TRIGGER. QUESTA È LA VERSIONE CORRETTA.
 * @param {Object} evento - L'oggetto evento del trigger.
 */
function riprendiJob(evento) {
  const logger = new MyLoggerService({ livello: 'INFO' });
  const utils = new MyUtilsService();
  const cache = new MyCacheService();
  const spreadsheetService = new MySpreadsheetService(logger, cache, utils);
  const servizioProps = PropertiesService.getScriptProperties();
  const triggerId = evento.triggerUid;
  const chiaveJobPerTrigger = `job_per_trigger_${triggerId}`;

  // Recupera il nome del job associato al trigger
  const nomeJob = servizioProps.getProperty(chiaveJobPerTrigger);
  if (!nomeJob) {
    logger.error(`Nessun job trovato per il trigger ${triggerId}. Il trigger verrà rimosso.`);
    const triggers = ScriptApp.getProjectTriggers();
    for (const trigger of triggers) {
      if (trigger.getUniqueId() === triggerId) {
        ScriptApp.deleteTrigger(trigger);
        break;
      }
    }
    return;
  }
  
  logger.info(`Ripresa job '${nomeJob}'`);

  // Recupera tipo e parametri del job
  const chiaveTipo = `tipo_${nomeJob}`;
  const chiaveParametri = `parametri_${nomeJob}`;
  const tipoJob = servizioProps.getProperty(chiaveTipo);
  const parametriSalvati = servizioProps.getProperty(chiaveParametri);

  if (!tipoJob) {
    logger.error(`Tipo di job non trovato per ${nomeJob}. Impossibile riprendere.`);
    return;
  }

  let parametri = {};
  if (parametriSalvati) {
    try {
      parametri = JSON.parse(parametriSalvati);
    } catch (e) {
      logger.warn(`Impossibile parsare i parametri per ${nomeJob}: ${e.message}`);
    }
  }
  
  // RE-INIETTA I SERVIZI NON SERIALIZZABILI
  parametri.gestoreDB = new GestoreDatabaseAnniScolastici(logger, cache, utils, spreadsheetService);

  // Crea l'istanza della coda job
  const jobQueue = new MyJobQueue(logger, utils);

  // REGISTRA TUTTI GLI HANDLER DISPONIBILI
  // Assicurati che esista la funzione `registraHandlerJob`
  if (typeof registraHandlerJob === 'function') {
    registraHandlerJob(jobQueue);
  } else {
    logger.error("La funzione 'registraHandlerJob' non è definita. Impossibile riprendere il job.");
    return;
  }

  // ESEGUI IL JOB CON LA FIRMA CORRETTA
  jobQueue.esegui(
    nomeJob,
    tipoJob,
    parametri,
    false // forzaRipartenza è false per permettere la ripresa
  );
}