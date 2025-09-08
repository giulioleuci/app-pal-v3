/**
 * Servizio di cache multi-livello
 */
class MyCacheService {
  constructor() {
    this._memoryCache = {};
    this._cacheService = CacheService.getScriptCache();
  }
    
  /**
   * Ottiene un valore dalla cache
   * @param {string} chiave - Chiave del valore da recuperare
   * @param {number} livello - Livello di cache (1 = memoria, 2 = CacheService)
   * @return {*} Valore recuperato o null
   */
  ottieni(chiave, livello = 1) {
    if (livello === 1 && this._memoryCache[chiave] !== undefined) {
      try {
        return JSON.parse(this._memoryCache[chiave]);
      } catch (e) {
        // Dato JSON corrotto in memory cache
        delete this._memoryCache[chiave];
        this._logger.warn(`Dato corrotto nella memory cache per ${chiave}: ${e.message}`);
        return null;
      }
    }
    
    if (livello === 2 || livello === 1) {
      const valore = this._cacheService.get(chiave);
      if (valore !== null) {
        this._memoryCache[chiave] = valore;
        try {
          return JSON.parse(valore);
        } catch (e) {
          // Dato JSON corrotto in script cache
          this._cacheService.remove(chiave);
          this._logger.warn(`Dato corrotto nella script cache per ${chiave}: ${e.message}`);
          return null;
        }
      }
    }
    
    return null;
  }

  /**
   * Imposta un valore nella cache
   * @param {string} chiave - Chiave per memorizzare il valore
   * @param {*} valore - Valore da memorizzare (verrà serializzato)
   * @param {number} scadenzaSecondi - Secondi dopo cui il valore scade (solo per CacheService)
   * @param {number} livello - Livello di cache (1 = memoria, 2 = CacheService, 0 = entrambi)
   * @return {MyCacheService} Istanza corrente per chiamate fluent
   */
  imposta(chiave, valore, scadenzaSecondi = 600, livello = 1) {
    const valoreSerializzato = this._serializeJson(valore);
    
    if (livello === 0 || livello === 1) {
      this._memoryCache[chiave] = valoreSerializzato;
    }
    
    if (livello === 0 || livello === 2) {
      this._cacheService.put(chiave, valoreSerializzato, scadenzaSecondi);
    }
    
    return this;
  }

  /**
   * Rimuove un valore dalla cache
   * @param {string} chiave - Chiave del valore da rimuovere
   * @param {number} livello - Livello di cache (1 = memoria, 2 = CacheService, 0 = entrambi)
   * @return {MyCacheService} Istanza corrente per chiamate fluent
   */
  rimuovi(chiave, livello = 0) {
    if (livello === 0 || livello === 1) {
      delete this._memoryCache[chiave];
    }
    
    if (livello === 0 || livello === 2) {
      this._cacheService.remove(chiave);
    }
    
    return this;
  }

  /**
   * Pulisce tutta la cache
   * @param {number} livello - Livello di cache (1 = memoria, 2 = CacheService, 0 = entrambi)
   * @return {MyCacheService} Istanza corrente per chiamate fluent
   */
  pulisci(livello = 0) {
    if (livello === 0 || livello === 1) {
      this._memoryCache = {};
    }
    
    if (livello === 0 || livello === 2) {
      console.log("WARN: pulizia L2 non implementata!")
      return this
      //this._cacheService.removeAll(); // da implementare
    }
    
    return this;
  }

  /**
   * Serializza in modo sicuro un oggetto JSON, gestendo riferimenti circolari
   * @param {*} obj - Oggetto da serializzare
   * @return {string} Stringa JSON
   * @private
   */
  _serializeJson(obj) {
    try {
      return JSON.stringify(obj);
    } catch (e) {
      if (e instanceof TypeError && e.message.includes('circular')) {
        this._logger.warn('Rilevato riferimento circolare durante la serializzazione JSON');
        
        const seen = new WeakSet();
        return JSON.stringify(obj, (key, value) => {
          if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
              return '[Riferimento Circolare]';
            }
            seen.add(value);
          }
          return value;
        });
      } else {
        throw e;
      }
    }
  }



}

/**
 * Servizio di logging avanzato
 */
class MyLoggerService {
  constructor(opzioni = {}) {
    this._livello = opzioni.livello || 'INFO';
    this._livelliLog = {
      OFF: 0,
      ERROR: 1,
      WARN: 2,
      INFO: 3,
      DEBUG: 4
    };
  }

  /**
   * Imposta il livello di logging
   * @param {string} livello - Livello di logging (OFF, ERROR, WARN, INFO, DEBUG)
   * @return {MyLoggerService} Istanza corrente per chiamate fluent
   */
  impostaLivello(livello) {
    if (this._livelliLog[livello] !== undefined) {
      this._livello = livello;
    }
    return this;
  }

  /**
   * Verifica se un certo livello di log è attivo
   * @param {string} livello - Livello da verificare
   * @return {boolean} True se il livello è attivo
   */
  _isLivelloAttivo(livello) {
    return this._livelliLog[livello] <= this._livelliLog[this._livello];
  }

  /**
   * Formatta il messaggio di log
   * @param {string} livello - Livello di log
   * @param {*} messaggio - Messaggio da loggare
   * @return {string} Messaggio formattato
   */
  _formattaMessaggio(livello, messaggio) {
   
    if (typeof messaggio === 'object') {
      messaggio = JSON.stringify(messaggio);
    }
    
    return `[${livello}] ${messaggio}`;
  }

  /**
   * Logga un messaggio di debug
   * @param {*} messaggio - Messaggio da loggare
   * @return {MyLoggerService} Istanza corrente per chiamate fluent
   */
  debug(messaggio) {
    if (this._isLivelloAttivo('DEBUG')) {
      Logger.log(this._formattaMessaggio('DEBUG', messaggio));
    }
    return this;
  }

  /**
   * Logga un messaggio informativo
   * @param {*} messaggio - Messaggio da loggare
   * @return {MyLoggerService} Istanza corrente per chiamate fluent
   */
  info(messaggio) {
    if (this._isLivelloAttivo('INFO')) {
      Logger.log(this._formattaMessaggio('INFO', messaggio));
    }
    return this;
  }

  /**
   * Logga un avvertimento
   * @param {*} messaggio - Messaggio da loggare
   * @return {MyLoggerService} Istanza corrente per chiamate fluent
   */
  warn(messaggio) {
    if (this._isLivelloAttivo('WARN')) {
      Logger.log(this._formattaMessaggio('WARN', messaggio));
    }
    return this;
  }

  /**
   * Logga un errore
   * @param {*} messaggio - Messaggio da loggare
   * @return {MyLoggerService} Istanza corrente per chiamate fluent
   */
  error(messaggio) {
    if (this._isLivelloAttivo('ERROR')) {
      Logger.log(this._formattaMessaggio('ERROR', messaggio));
    }
    return this;
  }

  /**
   * Ottiene i log attuali
   * @return {string[]} Array di stringhe con i log
   */
  ottieni() {
    return Logger.getLog().split('\n');
  }
  
  /**
   * Pulisce i log
   * @return {MyLoggerService} Istanza corrente per chiamate fluent
   */
  pulisci() {
    Logger.clear();
    return this;
  }
}

/**
 * Servizio di utilità generiche
 */
class MyUtilsService {
  /**
   * Formatta una data nel formato specificato
   * @param {Date} data - Data da formattare
   * @param {string} formato - Formato da utilizzare
   * @param {string} timezone - Timezone da utilizzare
   * @return {string} Data formattata
   */
  formattaData(data, formato = 'yyyy-MM-dd HH:mm:ss', timezone = Session.getScriptTimeZone()) {
    return Utilities.formatDate(data, timezone, formato);
  }

  /**
   * Converte una stringa in camelCase
   * @param {string} testo - Testo da convertire
   * @return {string} Testo in camelCase
   */
  toCamelCase(testo) {
    return testo.toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (m, c) => c.toUpperCase());
  }

  /**
   * Converte una stringa in PascalCase
   * @param {string} testo - Testo da convertire
   * @return {string} Testo in PascalCase
   */
  toPascalCase(testo) {
    const camelCase = this.toCamelCase(testo);
    return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
  }

  /**
   * Converte una stringa in SCREAMING_SNAKE_CASE
   * @param {string} testo - Testo da convertire
   * @return {string} Testo in SCREAMING_SNAKE_CASE
   */
  toScreamingSnakeCase(testo) {
    return testo.toLowerCase()
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .toUpperCase();
  }

  /**
   * Genera un UUID v4
   * @return {string} UUID generato
   */
  generaUuid() {
    return Utilities.getUuid();
  }

  /**
   * Pulisce una stringa rimuovendo spazi, accenti e caratteri speciali
   * @param {string} testo - Testo da pulire
   * @param {boolean} rimuoviAccenti - Se true, rimuove gli accenti
   * @param {boolean} rimuoviSpeciali - Se true, rimuove i caratteri speciali
   * @return {string} Testo pulito
   */
  pulisciStringa(testo, rimuoviAccenti = true, rimuoviSpeciali = true) {
    let risultato = testo.trim();
    
    if (rimuoviAccenti) {
      risultato = risultato
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    }
    
    if (rimuoviSpeciali) {
      risultato = risultato
        .replace(/[^\w\s]/gi, '');
    }
    
    return risultato;
  }

  /**
   * Confronta due stringhe ignorando case e accenti
   * @param {string} stringa1 - Prima stringa
   * @param {string} stringa2 - Seconda stringa
   * @return {boolean} True se le stringhe sono uguali
   */
  confrontaStringhe(stringa1, stringa2) {
    return this.pulisciStringa(stringa1).toLowerCase() === 
           this.pulisciStringa(stringa2).toLowerCase();
  }
}


/**
* Servizio per la gestione automatica di esecuzioni a lunga durata
*/
class MyJobQueue {
/**
 * Costruttore del servizio
 * @param {MyLoggerService} logger - Servizio di logging
 * @param {MyUtilsService} utils - Servizio di utilità
 */
constructor(logger, utils) {
  this._logger = logger;
  this._utils = utils;
  this._nomeClasse = 'MyJobQueue';
  this._durataMaxEsecuzione = 25 * 60 * 1000; // 25 minuti in millisecondi
  this._statoEsecuzione = PropertiesService.getScriptProperties();
  this._jobHandlers = {}; // Registro delle funzioni di gestione dei job
}

/**
 * Imposta la durata massima di esecuzione
 * @param {number} durataMs - Durata massima in millisecondi
 * @return {MyJobQueue} Istanza corrente per chiamate fluent
 */
impostaDurataMassima(durataMs) {
  this._durataMaxEsecuzione = durataMs;
  return this;
}

/**
 * Registra una funzione handler per un tipo di job
 * @param {string} tipoJob - Tipo di job da registrare
 * @param {Function} handler - Funzione generatore che gestisce il job
 * @return {MyJobQueue} Istanza corrente per chiamate fluent
 */
registraJobHandler(tipoJob, handler) {
  if (typeof handler !== 'function') {
    throw new Error(`L'handler per il job ${tipoJob} deve essere una funzione`);
  }
  this._jobHandlers[tipoJob] = handler;
  return this;
}

// In Base/foundation.js, dentro la classe MyJobQueue

/**
 * Esegue un job con gestione automatica della ripresa
 * @param {string} nomeJob - Nome identificativo del job
 * @param {string} tipoJob - Tipo di job da eseguire
 * @param {Object} parametri - Parametri da passare alla funzione
 * @param {boolean} forzaRipartenza - Se true, forza la ripartenza anche se già in esecuzione
 * @return {*} Risultato dell'esecuzione o null se interrotto
 */
esegui(nomeJob, tipoJob, parametri = {}, forzaRipartenza = false) {
  const chiaveJob = `job_${nomeJob}`;
  const chiaveStato = `stato_${nomeJob}`;
  const chiaveAvanzamento = `avanzamento_${nomeJob}`;
  const chiaveTipo = `tipo_${nomeJob}`;
  
  let statoJob = this._statoEsecuzione.getProperty(chiaveJob);
  
  // Se si forza la ripartenza, pulisce lo stato precedente
  if (forzaRipartenza) {
    this._logger.info(`Forzata la ripartenza per il job ${nomeJob}. Reset dello stato.`);
    this.resettaStatoJob(nomeJob);
    statoJob = null;
  }
  
  // CORREZIONE LOGICA: Gestisce il blocco per sovrapposizioni
  if (statoJob === 'in_esecuzione') {
    this._logger.warn(`Il Job ${nomeJob} è già in esecuzione in un altro processo. Esecuzione annullata.`);
    return null; // Esce per evitare esecuzioni parallele
  }
  
  // SE LO STATO È 'da_riprendere' e NON si forza la ripartenza, si procede con la ripresa.
  // Il warning precedente era errato.
  if (statoJob === 'da_riprendere') {
      this._logger.info(`Rilevato stato 'da_riprendere' per il job ${nomeJob}. Si procede con la ripresa.`);
  }

  // Salva il tipo di job per la ripresa (lo fa solo la prima volta o se forzato)
  if (!statoJob) {
    this._statoEsecuzione.setProperty(chiaveTipo, tipoJob);
  }
  
  // Inizio dell'esecuzione
  const tempoInizio = new Date().getTime();
  this._statoEsecuzione.setProperty(chiaveJob, 'in_esecuzione');
  this._logger.info(`Avvio esecuzione job ${nomeJob} (tipo: ${tipoJob})`);
  
  let statoAttuale = null;
  try {
    // Recupera lo stato precedente se esistente e non si forza la ripartenza
    const statoSalvato = this._statoEsecuzione.getProperty(chiaveStato);
    if (statoSalvato && !forzaRipartenza) {
      statoAttuale = JSON.parse(statoSalvato);
      parametri.statoRipresa = statoAttuale;
      this._logger.info(`Ripresa job ${nomeJob} da stato salvato`);
    }
    
    // Ottieni l'handler del job
    const handler = this._jobHandlers[tipoJob];
    if (!handler) {
      throw new Error(`Nessun handler registrato per il tipo di job ${tipoJob}`);
    }
    
    // Esecuzione con controllo periodico del tempo
    return this._eseguiConControlloTempo(nomeJob, handler, parametri, tempoInizio);
  } catch (errore) {
    this._logger.error(`Errore durante l'esecuzione del job ${nomeJob}: ${errore.stack}`);
    this._statoEsecuzione.setProperty(chiaveJob, 'errore');
    throw errore;
  }
}

/**
 * Esegue la funzione controllando periodicamente il tempo trascorso
 * @param {string} nomeJob - Nome identificativo del job
 * @param {Function} handler - Funzione generatore che gestisce il job
 * @param {Object} parametri - Parametri da passare alla funzione
 * @param {number} tempoInizio - Timestamp di inizio esecuzione
 * @return {*} Risultato dell'esecuzione o null se interrotto
 * @private
 */
_eseguiConControlloTempo(nomeJob, handler, parametri, tempoInizio) {
  const chiaveJob = `job_${nomeJob}`;
  const chiaveStato = `stato_${nomeJob}`;
  const chiaveAvanzamento = `avanzamento_${nomeJob}`;
  const chiaveParametri = `parametri_${nomeJob}`;
  
  // Salva i parametri per la ripresa (solo quelli serializzabili)
  const paramsSerializzabili = this._preparaParametriSalvataggio(parametri);
  this._statoEsecuzione.setProperty(chiaveParametri, JSON.stringify(paramsSerializzabili));
  
  try {
    // Inizializza il generatore
    const generatore = handler(parametri);
    
    // Verifica che sia un generatore
    if (!generatore || typeof generatore.next !== 'function') {
      throw new Error(`L'handler del job ${nomeJob} non è un generatore valido`);
    }
    
    let risultato = null;
    let avanzamento = parametri.statoRipresa || null;
    
    // Ciclo di esecuzione con controllo del tempo
    while (true) {
      // Controlla il tempo trascorso
      const tempoAttuale = new Date().getTime();
      const tempoTrascorso = tempoAttuale - tempoInizio;
      
      if (tempoTrascorso >= this._durataMaxEsecuzione) {
        // Salva lo stato e programma la ripresa, usando 'da_riprendere' anziché 'in_esecuzione'
        this._logger.info(`Interruzione job ${nomeJob} per timeout. Stato salvato.`);
        this._statoEsecuzione.setProperty(chiaveJob, 'da_riprendere');
        this._statoEsecuzione.setProperty(chiaveStato, JSON.stringify(avanzamento));
        this._statoEsecuzione.setProperty(chiaveAvanzamento, JSON.stringify({
          completato: false,
          percentuale: avanzamento ? avanzamento.percentuale || 0 : 0,
          timestamp: new Date().getTime()
        }));
        
        // Crea un trigger per la ripresa
        this._creaTriggerRipresa(nomeJob);
        return null;
      }
      
      try {
        // Esegue un passo del generatore
        const passo = generatore.next(avanzamento);
        avanzamento = passo.value || avanzamento;
        
        // Aggiorna lo stato di avanzamento
        if (avanzamento) {
          this._statoEsecuzione.setProperty(chiaveAvanzamento, JSON.stringify({
            completato: false,
            percentuale: avanzamento.percentuale || 0,
            timestamp: new Date().getTime()
          }));
        }
        
        // Se il generatore ha finito, esce dal ciclo
        if (passo.done) {
          risultato = avanzamento;
          break;
        }
      } catch (errore) {
        this._logger.error(`Errore durante l'esecuzione del job ${nomeJob}: ${errore.message}`);
        this._statoEsecuzione.setProperty(chiaveJob, 'errore');
        throw errore;
      }
    }
    
    // Job completato con successo
    this._statoEsecuzione.setProperty(chiaveJob, 'completato');
    this._statoEsecuzione.deleteProperty(chiaveStato);
    this._statoEsecuzione.setProperty(chiaveAvanzamento, JSON.stringify({
      completato: true,
      percentuale: 100,
      timestamp: new Date().getTime()
    }));
    
    this._logger.info(`Job ${nomeJob} completato con successo`);
    return risultato;
  } catch (errore) {
    this._logger.error(`Errore nell'esecuzione del job ${nomeJob}: ${errore.message}`);
    this._statoEsecuzione.setProperty(chiaveJob, 'errore');
    throw errore;
  }
}

/**
 * Crea un trigger per la ripresa automatica del job
 * @param {string} nomeJob - Nome del job
 * @private
 */
_creaTriggerRipresa(nomeJob) {
  // Elimina eventuali trigger esistenti per lo stesso job
  this._eliminaTriggerEsistenti(nomeJob);
  
  // Crea un nuovo trigger tra 1 minuto
  const trigger = ScriptApp.newTrigger('riprendiJob')
    .timeBased()
    .after(60 * 1000) // 1 minuto
    .create();
  
  // Salva l'ID del trigger con il nome del job
  const chiaveTrigger = `trigger_${nomeJob}`;
  this._statoEsecuzione.setProperty(chiaveTrigger, trigger.getUniqueId());
  
  // Salva il nome del job per il trigger
  const chiaveJobPerTrigger = `job_per_trigger_${trigger.getUniqueId()}`;
  this._statoEsecuzione.setProperty(chiaveJobPerTrigger, nomeJob);
}

/**
 * Elimina i trigger esistenti per un job
 * @param {string} nomeJob - Nome del job
 * @private
 */
_eliminaTriggerEsistenti(nomeJob) {
  const chiaveTrigger = `trigger_${nomeJob}`;
  const triggerId = this._statoEsecuzione.getProperty(chiaveTrigger);
  
  if (triggerId) {
    // Trova e elimina il trigger
    const triggers = ScriptApp.getProjectTriggers();
    for (let i = 0; i < triggers.length; i++) {
      if (triggers[i].getUniqueId() === triggerId) {
        ScriptApp.deleteTrigger(triggers[i]);
        break;
      }
    }
    
    // Rimuove le proprietà del trigger
    this._statoEsecuzione.deleteProperty(chiaveTrigger);
    this._statoEsecuzione.deleteProperty(`job_per_trigger_${triggerId}`);
  }
}

/**
 * Resetta completamente lo stato di un job
 * @param {string} nomeJob - Nome del job
 * @return {boolean} True se l'operazione è riuscita
 */
resettaStatoJob(nomeJob) {
  try {
    // Elenco di tutte le chiavi da eliminare
    const chiavi = [
      `job_${nomeJob}`,
      `stato_${nomeJob}`,
      `avanzamento_${nomeJob}`,
      `tipo_${nomeJob}`,
      `parametri_${nomeJob}`
    ];

    // Elimina gli eventuali trigger associati al job
    this._eliminaTriggerEsistenti(nomeJob);

    // Elimina tutte le proprietà associate al job
    for (const chiave of chiavi) {
      this._statoEsecuzione.deleteProperty(chiave);
    }

    this._logger.info(`Stato del job ${nomeJob} resettato completamente`);
    return true;
  } catch (e) {
    this._logger.error(`Errore nel reset dello stato del job ${nomeJob}: ${e.message}`);
    return false;
  }
}

/**
 * Riprende un job interrotto
 * @param {string} nomeJob - Nome del job da riprendere
 * @return {*} Risultato dell'esecuzione o null
 */
riprendiJob(nomeJob) {
  const chiaveTipo = `tipo_${nomeJob}`;
  const chiaveParametri = `parametri_${nomeJob}`;
  
  // Recupera il tipo di job
  const tipoJob = this._statoEsecuzione.getProperty(chiaveTipo);
  if (!tipoJob) {
    this._logger.error(`Tipo di job non trovato per ${nomeJob}`);
    return null;
  }
  
  // Recupera i parametri
  let parametri = {};
  const parametriSalvati = this._statoEsecuzione.getProperty(chiaveParametri);
  if (parametriSalvati) {
    try {
      parametri = JSON.parse(parametriSalvati);
    } catch (e) {
      this._logger.warn(`Impossibile parsare i parametri per ${nomeJob}`);
    }
  }
  
  // Riprendi il job con i parametri salvati
  return this.esegui(nomeJob, tipoJob, parametri, true);
}

/**
 * Ottiene lo stato di avanzamento di un job
 * @param {string} nomeJob - Nome del job
 * @return {Object} Stato di avanzamento
 */
ottieniStato(nomeJob) {
  const chiaveJob = `job_${nomeJob}`;
  const chiaveAvanzamento = `avanzamento_${nomeJob}`;
  const chiaveTipo = `tipo_${nomeJob}`;
  
  const statoJob = this._statoEsecuzione.getProperty(chiaveJob) || 'non_avviato';
  const tipoJob = this._statoEsecuzione.getProperty(chiaveTipo) || 'sconosciuto';
  let avanzamento = this._statoEsecuzione.getProperty(chiaveAvanzamento);
  
  if (avanzamento) {
    try {
      avanzamento = JSON.parse(avanzamento);
    } catch (e) {
      avanzamento = { completato: false, percentuale: 0 };
    }
  } else {
    avanzamento = { completato: false, percentuale: 0 };
  }
  
  return {
    nome: nomeJob,
    tipo: tipoJob,
    stato: statoJob,
    ...avanzamento
  };
}

/**
 * Serializza i parametri in modo sicuro per la memorizzazione
 * @param {Object} parametri - Parametri da serializzare
 * @return {Object} Parametri serializzabili
 * @private
 */
_preparaParametriSalvataggio(parametri) {
  // Crea una copia dei parametri, rimuovendo oggetti non serializzabili
  const params = {};
  
  // Copia solo proprietà serializzabili
  for (const key in parametri) {
    if (key !== 'gestoreDB' && key !== 'db' && key !== 'logger' && 
        key !== 'utils' && key !== 'cache' && key !== 'spreadsheetService') {
      params[key] = parametri[key];
    }
  }
  
  return params;
}
}

/**
* Funzione globale per registrare tutti gli handler di job
* @param {MyJobQueue} jobQueue - Istanza della coda job
*/
function registraHandlerJob(jobQueue) {
// Registra tutti gli handler di job disponibili
jobQueue.registraJobHandler('generaDocumenti', generaDocumentiHandler);
// Aggiungi qui altri handler...
}

/**
* Funzione globale per riprendere un job interrotto
* Deve essere esposta a livello globale per i trigger
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
  logger.error(`Nessun job trovato per il trigger ${triggerId}`);
  return;
}

// Crea l'istanza della coda job
const jobQueue = new MyJobQueue(logger, utils);

// Registra tutti gli handler prima della ripresa
registraHandlerJob(jobQueue);

// Ottieni il gestore database per questo job specifico
const gestoreDB = new GestoreDatabaseAnniScolastici(logger, cache, utils, spreadsheetService);

// Ottieni il tipo di job dalle proprietà
const chiaveTipo = `tipo_${nomeJob}`;
const tipoJob = servizioProps.getProperty(chiaveTipo);

if (!tipoJob) {
  logger.error(`Tipo di job non trovato per ${nomeJob}`);
  return;
}

// Recupera i parametri salvati
const chiaveParametri = `parametri_${nomeJob}`;
let parametri = { gestoreDB: gestoreDB };
const parametriSalvati = servizioProps.getProperty(chiaveParametri);

if (parametriSalvati) {
  try {
    const paramsObj = JSON.parse(parametriSalvati);
    // Aggiungi il gestoreDB aggiornato ai parametri salvati
    parametri = { ...paramsObj, gestoreDB: gestoreDB };
  } catch (e) {
    logger.warn(`Impossibile parsare i parametri per ${nomeJob}: ${e.message}`);
  }
}

// Riprendi il job
jobQueue.esegui(nomeJob, tipoJob, parametri, true);
}

/**
 * Servizio avanzato per la gestione centralizzata delle eccezioni
 * Implementa classificazione errori, strategie di recupero e analisi locale
 */
class MyExceptionService {
  /**
   * @param {MyLoggerService} logger - Servizio di logging
   * @param {MyUtilsService} utils - Servizio utilità
   */
  constructor(logger, utils) {
    this._logger = logger;
    this._utils = utils;
    
    // Configurazione retry
    this._maxTentativi = 5;
    this._intervalloBasi = [1000, 2000, 5000, 10000, 30000]; // ms
    
    // Storage locale per errori della sessione corrente
    this._erroriSessione = [];
    this._contatoriErrori = {
      totale: 0,
      perTipo: {},
      perMetodo: {},
      perStep: {},
      recuperati: 0,
      nonRecuperati: 0
    };
    
    // Inizializza classificatori e strategie
    this._inizializzaClassificatori();
    this._inizializzaStrategie();
    this._inizializzaSuggerimenti();
  }

  /**
   * Inizializza i classificatori di errori
   * @private
   */
/**
 * Correzioni per l'implementazione attuale di MyExceptionService
 */

// 1. SOSTITUIRE _inizializzaClassificatori() con questa versione corretta
_inizializzaClassificatori() {
  this._classificatori = {
    // Errori Google API
    QUOTA_EXCEEDED: {
      pattern: /quota|limit.*exceeded|too many requests|service invoked too many times/i,
      categoria: 'QUOTA',
      gravita: 'MEDIA',
      recuperabile: true
    },
    
    PERMISSION_DENIED: {
      pattern: /permission.*denied|unauthorized|forbidden|do not have.*permission|not have.*access/i,
      categoria: 'PERMESSI',
      gravita: 'ALTA',
      recuperabile: false
    },
    
    INVALID_ARGUMENT: {
      pattern: /invalid.*argument|invalid.*parameter|spreadsheetId/i,
      categoria: 'ARGOMENTO',
      gravita: 'ALTA',
      recuperabile: false
    },
    
    SERVICE_UNAVAILABLE: {
      pattern: /service.*unavailable|503|temporarily unavailable/i,
      categoria: 'SERVIZIO',
      gravita: 'MEDIA',
      recuperabile: true
    },
    
    NOT_FOUND: {
      pattern: /not found|404|file.*not.*exist|documento.*non.*trovato/i,
      categoria: 'RISORSA_MANCANTE',
      gravita: 'MEDIA',
      recuperabile: false
    },
    
    // Errori dati
    INVALID_FORMAT: {
      pattern: /invalid.*format|formato.*non.*valido|type.*error/i,
      categoria: 'FORMATO',
      gravita: 'BASSA',
      recuperabile: false
    },
    
    MISSING_DATA: {
      pattern: /missing.*data|dati.*mancanti|undefined|null.*reference/i,
      categoria: 'DATI_MANCANTI',
      gravita: 'MEDIA',
      recuperabile: false
    },
    
    // Errori database
    DB_CONNECTION: {
      pattern: /database.*connection|connessione.*database/i,
      categoria: 'DATABASE',
      gravita: 'CRITICA',
      recuperabile: true
    },
    
    INTEGRITY_ERROR: {
      pattern: /integrity.*constraint|chiave.*duplicata|foreign.*key/i,
      categoria: 'INTEGRITA',
      gravita: 'ALTA',
      recuperabile: false
    },
    
    // Errori timeout
    TIMEOUT: {
      pattern: /timeout|execution.*time.*exceeded|tempo.*esecuzione/i,
      categoria: 'TIMEOUT',
      gravita: 'ALTA',
      recuperabile: false
    },
    
    // Errori generici
    NETWORK_ERROR: {
      pattern: /network.*error|connection.*refused|errore.*rete/i,
      categoria: 'RETE',
      gravita: 'MEDIA',
      recuperabile: true
    }
  };
}

  /**
   * Inizializza le strategie di recupero per categoria
   * @private
   */
  _inizializzaStrategie() {
    this._strategie = {
      // Strategia di default per errori non classificati
      DEFAULT: {
        azione: 'RETRY_BACKOFF',
        maxTentativi: 3,
        intervalloIniziale: 2000,
        fattoreMoltiplicativo: 2
      },
      
      QUOTA: {
        azione: 'RETRY_BACKOFF_LUNGO',
        maxTentativi: 3,
        intervalloIniziale: 60000, // 1 minuto
        fattoreMoltiplicativo: 2
      },
      
      SERVIZIO: {
        azione: 'RETRY_BACKOFF',
        maxTentativi: 5,
        intervalloIniziale: 5000,
        fattoreMoltiplicativo: 1.5
      },
      
      RETE: {
        azione: 'RETRY_IMMEDIATO',
        maxTentativi: 3,
        intervalloIniziale: 2000,
        fattoreMoltiplicativo: 1
      },
      
      PERMESSI: {
        azione: 'NOTIFICA_ADMIN',
        maxTentativi: 1,
        intervalloIniziale: 0,
        fattoreMoltiplicativo: 0
      },
      
      RISORSA_MANCANTE: {
        azione: 'CREA_RISORSA',
        maxTentativi: 1,
        intervalloIniziale: 0,
        fattoreMoltiplicativo: 0
      },
      
      FORMATO: {
        azione: 'CONVERTI_FORMATO',
        maxTentativi: 2,
        intervalloIniziale: 0,
        fattoreMoltiplicativo: 0
      },

      ARGOMENTO: {
        azione: 'LOG_DETTAGLIATO',
        maxTentativi: 1,
        intervalloIniziale: 0,
        fattoreMoltiplicativo: 0
      },
      
      DATI_MANCANTI: {
        azione: 'USA_DEFAULT',
        maxTentativi: 1,
        intervalloIniziale: 0,
        fattoreMoltiplicativo: 0
      },
      
      DATABASE: {
        azione: 'RETRY_BACKOFF',
        maxTentativi: 3,
        intervalloIniziale: 10000,
        fattoreMoltiplicativo: 2
      },
      
      INTEGRITA: {
        azione: 'LOG_DETTAGLIATO',
        maxTentativi: 1,
        intervalloIniziale: 0,
        fattoreMoltiplicativo: 0
      },
      
      TIMEOUT: {
        azione: 'DIVIDI_OPERAZIONE',
        maxTentativi: 1,
        intervalloIniziale: 0,
        fattoreMoltiplicativo: 0
      },
      
      // Categoria per errori non classificati
      GENERICO: {
        azione: 'RETRY_BACKOFF',
        maxTentativi: 3,
        intervalloIniziale: 2000,
        fattoreMoltiplicativo: 2
      }
    };
  }

  /**
   * Inizializza i suggerimenti di risoluzione
   * @private
   */
  _inizializzaSuggerimenti() {
    this._suggerimenti = {
      DEFAULT: [
        "Errore generico non classificato",
        "Verificare i log per maggiori dettagli",
        "Controllare la validità dei dati in input"
      ],
      
      QUOTA: [
        "Attendere il reset della quota giornaliera",
        "Ottimizzare le chiamate API con batch operations",
        "Implementare caching più aggressivo",
        "Schedulare l'operazione in orari non di punta"
      ],
      
      PERMESSI: [
        "Verificare i permessi del file/cartella su Drive",
        "Controllare che l'utente sia autenticato correttamente",
        "Verificare i ruoli assegnati nell'applicazione",
        "Contattare l'amministratore del dominio"
      ],
      
      SERVIZIO: [
        "Il servizio Google è temporaneamente non disponibile",
        "Riprovare tra qualche minuto",
        "Verificare lo stato dei servizi Google",
        "Considerare un approccio alternativo"
      ],
      
      RISORSA_MANCANTE: [
        "Verificare l'ID del documento/cartella",
        "Controllare che la risorsa non sia stata eliminata",
        "Creare una nuova risorsa se necessario",
        "Verificare i percorsi e i riferimenti"
      ],
      
      FORMATO: [
        "Verificare il formato dei dati in input",
        "Controllare la codifica dei caratteri",
        "Validare i dati prima dell'elaborazione",
        "Implementare conversioni automatiche"
      ],
      
      
      DATI_MANCANTI: [
        "Verificare la completezza dei dati nel database",
        "Controllare i campi obbligatori",
        "Implementare valori di default appropriati",
        "Validare i dati in input"
      ],
      
      DATABASE: [
        "Verificare la connessione al database",
        "Controllare i limiti di connessioni simultanee",
        "Verificare le credenziali di accesso",
        "Controllare lo stato del servizio database"
      ],
      
      INTEGRITA: [
        "Verificare l'unicità dei dati",
        "Controllare le relazioni tra tabelle",
        "Validare i dati prima dell'inserimento",
        "Correggere i dati duplicati o inconsistenti"
      ],
      
      TIMEOUT: [
        "Ridurre la dimensione del batch di elaborazione",
        "Implementare elaborazione incrementale",
        "Ottimizzare le query e gli algoritmi",
        "Considerare l'uso di trigger time-based"
      ],
      
      RETE: [
        "Verificare la connessione internet",
        "Controllare firewall e proxy",
        "Riprovare con backoff esponenziale",
        "Implementare meccanismi di retry robusti"
      ],
      
      GENERICO: [
        "Errore non classificato",
        "Verificare stack trace completo",
        "Contattare il supporto tecnico"
      ]
    };
  }

  /**
   * Classifica un errore in base ai pattern definiti
   * @param {Error} errore - Errore da classificare
   * @return {Object} Classificazione dell'errore
   */
classificaErrore(errore) {
  const messaggio = errore.message || '';
  const stack = errore.stack || '';
  const testoCompleto = `${messaggio} ${stack}`;
  
  // Cerca corrispondenza nei pattern
  for (const [tipo, config] of Object.entries(this._classificatori)) {
    if (config.pattern.test(testoCompleto)) {
      return {
        tipo: tipo.replace('_EXCEEDED', '_LIMIT'), // Normalizza il nome del tipo
        categoria: config.categoria,
        gravita: config.gravita,
        recuperabile: config.recuperabile,
        timestamp: new Date(),
        messaggioOriginale: messaggio,
        stack: stack
      };
    }
  }
  
  // Classificazione di default per errori non riconosciuti
  return {
    tipo: 'SCONOSCIUTO',
    categoria: 'GENERICO',
    gravita: 'MEDIA',
    recuperabile: true,
    timestamp: new Date(),
    messaggioOriginale: messaggio,
    stack: stack
  };
}

  /**
   * Esegue una funzione con gestione avanzata degli errori
   * @param {Function} funzione - Funzione da eseguire
   * @param {Object} parametri - Parametri da passare alla funzione
   * @param {Object} opzioni - Opzioni di esecuzione
   * @return {Object} Risultato con metadati di esecuzione
   */
  eseguiConGestioneAvanzata(funzione, parametri = {}, opzioni = {}) {
    const nomeOperazione = opzioni.nomeOperazione || 'Operazione';
    const contestoErrore = opzioni.contestoErrore || {};
    const modalita = opzioni.modalita || 'STRICT'; // STRICT, LENIENT, RECOVERY
    const stepCorrente = opzioni.step || 'Non specificato';
    
    let tentativo = 0;
    let ultimoErrore = null;
    let classificazione = null;
    let strategiaUsata = null;
    
    // Estrae informazioni sul chiamante
    const infoChiamante = this._estraiInfoChiamante();
    
    while (tentativo < this._maxTentativi) {
      tentativo++;
      
      try {
        // Esegue la funzione
        const risultato = funzione(parametri);
        
        // Se c'erano stati errori prima del successo, registra il recupero
        if (tentativo > 1) {
          this._contatoriErrori.recuperati++;
          this._registraErrore({
            tipo: 'RECUPERATO',
            operazione: nomeOperazione,
            step: stepCorrente,
            tentativo: tentativo,
            classificazione: classificazione,
            strategia: strategiaUsata,
            chiamante: infoChiamante,
            contesto: contestoErrore
          });
        }
        
        return {
          successo: true,
          risultato: risultato,
          tentativi: tentativo,
          errore: null,
          suggerimenti: []
        };
        
      } catch (e) {
        ultimoErrore = e;
        classificazione = this.classificaErrore(e);
        
        // Determina strategia di recupero
        const strategia = this._strategie[classificazione.categoria] || this._strategie.DEFAULT;
        strategiaUsata = strategia.azione;
        
        // Registra l'errore
        this._registraErrore({
          tipo: 'ERRORE',
          operazione: nomeOperazione,
          step: stepCorrente,
          tentativo: tentativo,
          classificazione: classificazione,
          strategia: strategia.azione,
          chiamante: infoChiamante,
          contesto: contestoErrore,
          erroreOriginale: e
        });
        
        if (tentativo >= strategia.maxTentativi) {
          break;
        }
        
        // Applica strategia di recupero
        const continuare = this._applicaStrategia(
          strategia,
          classificazione,
          tentativo,
          modalita,
          contestoErrore
        );
        
        if (!continuare) {
          break;
        }
        
        // Calcola tempo di attesa se necessario
        if (strategia.intervalloIniziale > 0) {
          const attesa = this._calcolaTempoAttesa(
            tentativo,
            strategia.intervalloIniziale,
            strategia.fattoreMoltiplicativo
          );
          Utilities.sleep(attesa);
        }
      }
    }
    
    // Registra fallimento finale
    this._contatoriErrori.nonRecuperati++;
    this._registraErrore({
      tipo: 'FALLIMENTO',
      operazione: nomeOperazione,
      step: stepCorrente,
      tentativo: tentativo,
      classificazione: classificazione,
      strategia: strategiaUsata,
      chiamante: infoChiamante,
      contesto: contestoErrore,
      erroreOriginale: ultimoErrore
    });
    
    // Prepara risposta di errore
    return {
      successo: false,
      risultato: null,
      tentativi: tentativo,
      errore: {
        messaggio: ultimoErrore.message,
        tipo: classificazione.tipo,
        categoria: classificazione.categoria,
        gravita: classificazione.gravita,
        stack: ultimoErrore.stack
      },
      suggerimenti: this._ottieniSuggerimenti(classificazione.categoria)
    };
  }

  /**
   * Estrae informazioni sul metodo chiamante dallo stack trace
   * @return {Object} Informazioni sul chiamante
   * @private
   */
  _estraiInfoChiamante() {
    try {
      const errore = new Error();
      const stack = errore.stack || '';
      const linee = stack.split('\n');
      
      // Salta le prime linee che sono di questo servizio
      for (let i = 3; i < linee.length && i < 10; i++) {
        const linea = linee[i];
        if (!linea.includes('MyExceptionService')) {
          // Estrae nome funzione e posizione
          const matchFunzione = linea.match(/at\s+([^\s(]+)/);
          const matchPosizione = linea.match(/\(([^)]+)\)/);
          
          return {
            funzione: matchFunzione ? matchFunzione[1] : 'Sconosciuta',
            posizione: matchPosizione ? matchPosizione[1] : linea.trim(),
            lineaStack: i
          };
        }
      }
    } catch (e) {
      // Se fallisce l'estrazione, ritorna info di default
    }
    
    return {
      funzione: 'Non determinabile',
      posizione: 'Posizione sconosciuta',
      lineaStack: -1
    };
  }

  /**
   * Registra un errore nella sessione corrente
   * @param {Object} dettagliErrore - Dettagli dell'errore da registrare
   * @private
   */
_registraErrore(dettagliErrore) {
  // Registra sempre nei dettagli
  this._erroriSessione.push({
    timestamp: new Date(),
    ...dettagliErrore
  });
  
  // Incrementa contatori solo per eventi finali (non retry intermedi)
  if (dettagliErrore.tipo === 'RECUPERATO' || dettagliErrore.tipo === 'FALLIMENTO') {
    this._contatoriErrori.totale++;
    
    if (dettagliErrore.classificazione) {
      const tipo = dettagliErrore.classificazione.tipo;
      this._contatoriErrori.perTipo[tipo] = (this._contatoriErrori.perTipo[tipo] || 0) + 1;
    }
    
    if (dettagliErrore.chiamante) {
      const metodo = dettagliErrore.chiamante.funzione;
      this._contatoriErrori.perMetodo[metodo] = (this._contatoriErrori.perMetodo[metodo] || 0) + 1;
    }
    
    if (dettagliErrore.step) {
      this._contatoriErrori.perStep[dettagliErrore.step] = (this._contatoriErrori.perStep[dettagliErrore.step] || 0) + 1;
    }
  }
  
  // Log immediato per debugging
  if (dettagliErrore.tipo === 'ERRORE' || dettagliErrore.tipo === 'FALLIMENTO') {
    this._logger.error(`[${dettagliErrore.tipo}] ${dettagliErrore.operazione} - Tentativo ${dettagliErrore.tentativo}: ${dettagliErrore.classificazione.messaggioOriginale}`);
  }
}


  /**
   * Applica una strategia di recupero
   * @param {Object} strategia - Strategia da applicare
   * @param {Object} classificazione - Classificazione dell'errore
   * @param {number} tentativo - Numero del tentativo corrente
   * @param {string} modalita - Modalità di esecuzione
   * @param {Object} contesto - Contesto dell'operazione
   * @return {boolean} True se continuare con retry
   * @private
   */
  _applicaStrategia(strategia, classificazione, tentativo, modalita, contesto) {
    switch (strategia.azione) {
      case 'RETRY_BACKOFF':
      case 'RETRY_BACKOFF_LUNGO':
        return modalita !== 'STRICT' && classificazione.recuperabile;
        
      case 'RETRY_IMMEDIATO':
        return modalita === 'RECOVERY' && classificazione.recuperabile;
        
      case 'NOTIFICA_ADMIN':
        this._logger.error(`NOTIFICA ADMIN RICHIESTA: ${classificazione.tipo} - ${classificazione.messaggioOriginale}`);
        return false;
        
      case 'CREA_RISORSA':
        if (modalita === 'RECOVERY' && contesto.creaRisorsaMancante) {
          try {
            contesto.creaRisorsaMancante();
            return true;
          } catch (e) {
            this._logger.error(`Impossibile creare risorsa mancante: ${e.message}`);
          }
        }
        return false;
        
      case 'CONVERTI_FORMATO':
        if (modalita !== 'STRICT' && contesto.convertiFormato) {
          try {
            contesto.convertiFormato();
            return true;
          } catch (e) {
            this._logger.error(`Impossibile convertire formato: ${e.message}`);
          }
        }
        return false;
        
      case 'USA_DEFAULT':
        if (modalita === 'LENIENT' && contesto.usaValoriDefault) {
          contesto.usaValoriDefault();
          return true;
        }
        return false;
        
      case 'LOG_DETTAGLIATO':
        this._logger.error(`ERRORE INTEGRITA: ${JSON.stringify(classificazione)}`);
        return false;
        
      case 'DIVIDI_OPERAZIONE':
        if (modalita === 'RECOVERY' && contesto.dividiOperazione) {
          try {
            contesto.dividiOperazione();
            return true;
          } catch (e) {
            this._logger.error(`Impossibile dividere operazione: ${e.message}`);
          }
        }
        return false;
        
      default:
        return false;
    }
  }

  /**
   * Calcola il tempo di attesa per retry con backoff
   * @param {number} tentativo - Numero del tentativo
   * @param {number} intervalloIniziale - Intervallo iniziale in ms
   * @param {number} fattore - Fattore moltiplicativo
   * @return {number} Tempo di attesa in millisecondi
   * @private
   */
  _calcolaTempoAttesa(tentativo, intervalloIniziale, fattore) {
    const attesaBase = intervalloIniziale * Math.pow(fattore, tentativo - 1);
    // Aggiunge jitter del 10% per evitare thundering herd
    const jitter = attesaBase * 0.1 * Math.random();
    return Math.min(attesaBase + jitter, 300000); // Max 5 minuti
  }

  /**
   * Ottiene i suggerimenti per una categoria di errore
   * @param {string} categoria - Categoria dell'errore
   * @return {string[]} Array di suggerimenti
   * @private
   */
  _ottieniSuggerimenti(categoria) {
    return this._suggerimenti[categoria] || this._suggerimenti.DEFAULT;
  }

  /**
   * Resetta le statistiche degli errori per una nuova sessione
   */
  resetStatistiche() {
    this._erroriSessione = [];
    this._contatoriErrori = {
      totale: 0,
      perTipo: {},
      perMetodo: {},
      perStep: {},
      recuperati: 0,
      nonRecuperati: 0
    };
  }

  /**
   * Ottiene un riepilogo degli errori della sessione corrente
   * @return {Object} Riepilogo strutturato degli errori
   */
  ottieniRiepilogoErrori() {
    return {
      contatori: this._contatoriErrori,
      erroriDettagliati: this._erroriSessione,
      tassoRecupero: this._contatoriErrori.totale > 0 ? 
        Math.round((this._contatoriErrori.recuperati / this._contatoriErrori.totale) * 100) : 0
    };
  }

  /**
   * Stampa un'analisi dettagliata degli errori della sessione
   * @param {boolean} includiDettagli - Se true, include i dettagli di ogni errore
   * @return {string} Report formattato degli errori
   */
stampaAnalisiErrori(includiDettagli = true) {
  const riepilogo = this.ottieniRiepilogoErrori();
  let report = [];
  
  report.push("=== ANALISI ERRORI SESSIONE ===");
  report.push(`Timestamp analisi: ${this._utils.formattaData(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
  report.push("");
  
  // Statistiche generali - CORREZIONE QUI
  report.push("STATISTICHE GENERALI:");
  report.push(`Totale errori: ${riepilogo.contatori.totale}`); // Cambiato da "- Errori totali:"
  report.push(`- Errori recuperati: ${riepilogo.contatori.recuperati}`);
  report.push(`- Errori non recuperati: ${riepilogo.contatori.nonRecuperati}`);
  report.push(`- Tasso di recupero: ${riepilogo.tassoRecupero}%`);
  report.push("");
  
  // Errori per tipo
  if (Object.keys(riepilogo.contatori.perTipo).length > 0) {
    report.push("ERRORI PER TIPO:");
    const tipiOrdinati = Object.entries(riepilogo.contatori.perTipo)
      .sort((a, b) => b[1] - a[1]);
    for (const [tipo, count] of tipiOrdinati) {
      report.push(`- ${tipo}: ${count} occorrenze`);
    }
    report.push("");
  }
  
  // Errori per step
  if (Object.keys(riepilogo.contatori.perStep).length > 0) {
    report.push("ERRORI PER STEP:");
    const stepOrdinati = Object.entries(riepilogo.contatori.perStep)
      .sort((a, b) => b[1] - a[1]);
    for (const [step, count] of stepOrdinati) {
      report.push(`- ${step}: ${count} errori`);
    }
    report.push("");
  }
  
  // Metodi più problematici
  if (Object.keys(riepilogo.contatori.perMetodo).length > 0) {
    report.push("METODI PIÙ PROBLEMATICI:");
    const metodiOrdinati = Object.entries(riepilogo.contatori.perMetodo)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10); // Top 10
    for (const [metodo, count] of metodiOrdinati) {
      report.push(`- ${metodo}: ${count} errori`);
    }
    report.push("");
  }
  
  // Dettagli errori se richiesto
  if (includiDettagli && riepilogo.erroriDettagliati.length > 0) {
    report.push("DETTAGLI ERRORI:");
    report.push("");
    
    // Raggruppa per step per migliore leggibilità
    const erroriPerStep = {};
    for (const errore of riepilogo.erroriDettagliati) {
      if (errore.tipo === 'ERRORE' || errore.tipo === 'FALLIMENTO') {
        const step = errore.step || 'Non specificato';
        if (!erroriPerStep[step]) erroriPerStep[step] = [];
        erroriPerStep[step].push(errore);
      }
    }
    
    for (const [step, errori] of Object.entries(erroriPerStep)) {
      report.push(`[STEP: ${step}]`);
      for (const errore of errori) {
        report.push(`  ${this._utils.formattaData(errore.timestamp, 'HH:mm:ss')} - ${errore.operazione}`);
        report.push(`    Tipo: ${errore.classificazione.tipo} (${errore.classificazione.categoria})`);
        report.push(`    Metodo: ${errore.chiamante.funzione}`);
        report.push(`    Posizione: ${errore.chiamante.posizione}`);
        report.push(`    Strategia: ${errore.strategia} (tentativo ${errore.tentativo})`);
        if (errore.classificazione.messaggioOriginale) {
          report.push(`    Messaggio: ${errore.classificazione.messaggioOriginale}`);
        }
        report.push("");
      }
    }
  }
  
  // Suggerimenti finali
  if (riepilogo.contatori.nonRecuperati > 0) {
    report.push("SUGGERIMENTI:");
    const tipiErroriFrequenti = Object.entries(riepilogo.contatori.perTipo)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tipo]) => tipo);
    
    for (const tipo of tipiErroriFrequenti) {
      // Trova il classificatore usando il tipo
      const classificatore = Object.entries(this._classificatori).find(([key, config]) => key === tipo || key.replace('_EXCEEDED', '_LIMIT') === tipo);
      if (classificatore) {
        const suggerimenti = this._ottieniSuggerimenti(classificatore[1].categoria);
        report.push(`\nPer errori ${tipo}:`);
        suggerimenti.forEach(s => report.push(`  - ${s}`));
      }
    }
  }
  
  report.push("");
  report.push("=== FINE ANALISI ===");
  
  return report.join("\n");
}

  /**
   * Metodo di compatibilità con versione precedente
   * @param {Function} funzione - Funzione da eseguire
   * @param {Object} parametri - Parametri da passare alla funzione
   * @param {number} maxTentativi - Numero massimo di tentativi
   * @return {*} Risultato dell'esecuzione
   */
  eseguiConRetry(funzione, parametri = {}, maxTentativi = null) {
    const risultato = this.eseguiConGestioneAvanzata(funzione, parametri, {
      nomeOperazione: 'Operazione legacy',
      modalita: 'RECOVERY'
    });
    
    if (risultato.successo) {
      return risultato.risultato;
    } else {
      throw new Error(risultato.errore.messaggio);
    }
  }

  /**
   * Metodo di compatibilità con versione precedente
   * @param {Function} funzione - Funzione da eseguire
   * @param {Object} parametri - Parametri da passare alla funzione
   * @param {*} valoreDefault - Valore da restituire in caso di errore
   * @return {*} Risultato dell'esecuzione o valoreDefault
   */
  eseguiConBypass(funzione, parametri = {}, valoreDefault = null) {
    try {
      const risultato = this.eseguiConGestioneAvanzata(funzione, parametri, {
        nomeOperazione: 'Operazione bypass',
        modalita: 'LENIENT'
      });
      
      return risultato.successo ? risultato.risultato : valoreDefault;
    } catch (e) {
      return valoreDefault;
    }
  }

  /**
   * Analizza un errore e restituisce informazioni dettagliate
   * @param {Error} errore - Errore da analizzare
   * @return {Object} Informazioni sull'errore
   */
  analizzaErrore(errore) {
    const classificazione = this.classificaErrore(errore);
    const strategia = this._strategie[classificazione.categoria] || this._strategie.DEFAULT;
    
    return {
      classificazione: classificazione,
      strategiaConsigliata: strategia,
      suggerimenti: this._ottieniSuggerimenti(classificazione.categoria),
      recuperabile: classificazione.recuperabile,
      gravitaNumero: this._mappaGravita(classificazione.gravita)
    };
  }

  /**
   * Mappa la gravità testuale in valore numerico
   * @param {string} gravita - Gravità testuale
   * @return {number} Valore numerico (1-4)
   * @private
   */
  _mappaGravita(gravita) {
    const mappa = {
      'BASSA': 1,
      'MEDIA': 2,
      'ALTA': 3,
      'CRITICA': 4
    };
    return mappa[gravita] || 2;
  }
}

/**
 * Classe base astratta per i servizi Google
 */
class MyGoogleService {
  constructor(logger, cache, utils) {
    this._logger = logger;
    this._cache = cache;
    this._utils = utils;
    
    if (this.constructor === MyGoogleService) {
      throw new Error('MyGoogleService è una classe astratta e non può essere istanziata direttamente');
    }
  }

  /**
   * Verifica se il servizio avanzato è abilitato
   * @param {string} nomeServizio - Nome del servizio da verificare
   * @return {boolean} True se il servizio è disponibile
   */
  _verificaServizioAvanzato(nomeServizio) {
    try {
      return typeof this[nomeServizio] !== 'undefined';
    } catch (e) {
      this._logger.warn(`Servizio avanzato ${nomeServizio} non disponibile: ${e.message}`);
      return false;
    }
  }

/**
 * Genera una chiave di cache per l'oggetto/metodo specificato
 * @param {string} prefisso
 * @param {string} id
 * @param {string} metodo
 * @return {string} chiave di cache
 */
_generaChiaveCache(prefisso, id, metodo) {
  return `${prefisso}_${id}_${metodo}`;
}

/**
 * Ottiene un risultato dalla cache o esegue la funzione e lo memorizza
 * @param {string} chiave - Chiave di cache
 * @param {Function} funzione - Funzione da eseguire
 * @param {number} scadenzaSecondi - Tempo di validità della cache in secondi
 * @return {*} Risultato
 */
_ottieniOEsegui(chiave, funzione, scadenzaSecondi = 600) {
  // ERRORE: se avevi scritto "this._cache.get(chiave)"
  //         devi sostituirlo con "this._cache.ottieni(chiave)"
  const risultatoCache = this._cache.ottieni(chiave);
  if (risultatoCache !== null) {
    return risultatoCache;
  }

  // Esegui la funzione per ottenere il dato
  const risultato = funzione();

  // ERRORE: se avevi scritto "this._cache.set(chiave, risultato, scadenzaSecondi)"
  //         devi sostituirlo con "this._cache.imposta(chiave, risultato, scadenzaSecondi)"
  this._cache.imposta(chiave, risultato, scadenzaSecondi);

  return risultato;
}
}


/**
* Servizio per la gestione e l'invio di email
*/
class MyMailService {
  constructor(logger) {
    this._logger = logger;
    this._reset(); // Chiama il reset all'inizio
  }

  /**
   * Resetta l'email draft allo stato iniziale.
   * @private
   */
  _reset() {
    this._emailDraft = {
      to: [],
      cc: [],
      bcc: [],
      subject: '',
      body: '',
      htmlBody: '',
      attachments: [],
      inlineImages: {},
      name: '',
      replyTo: '',
      noReply: false
    };
  }


  /**
   * Imposta i destinatari principali
   * @param {string|string[]} destinatari - Email destinatari
   * @return {MyMailService} Istanza corrente per chiamate fluent
   */
  destinatari(destinatari) {
    if (Array.isArray(destinatari)) {
      this._emailDraft.to = [...destinatari];
    } else {
      this._emailDraft.to = [destinatari];
    }
    return this;
  }

  /**
   * Aggiunge destinatari principali
   * @param {string|string[]} destinatari - Email destinatari
   * @return {MyMailService} Istanza corrente per chiamate fluent
   */
  aggiungiDestinatari(destinatari) {
    if (Array.isArray(destinatari)) {
      this._emailDraft.to = [...this._emailDraft.to, ...destinatari];
    } else {
      this._emailDraft.to.push(destinatari);
    }
    return this;
  }

  /**
   * Imposta i destinatari in copia carbone
   * @param {string|string[]} destinatariCC - Email destinatari in CC
   * @return {MyMailService} Istanza corrente per chiamate fluent
   */
  cc(destinatariCC) {
    if (Array.isArray(destinatariCC)) {
      this._emailDraft.cc = [...destinatariCC];
    } else {
      this._emailDraft.cc = [destinatariCC];
    }
    return this;
  }

  /**
   * Aggiunge destinatari in copia carbone
   * @param {string|string[]} destinatariCC - Email destinatari in CC
   * @return {MyMailService} Istanza corrente per chiamate fluent
   */
  aggiungiCC(destinatariCC) {
    if (Array.isArray(destinatariCC)) {
      this._emailDraft.cc = [...this._emailDraft.cc, ...destinatariCC];
    } else {
      this._emailDraft.cc.push(destinatariCC);
    }
    return this;
  }

  /**
   * Imposta i destinatari in copia carbone nascosta
   * @param {string|string[]} destinatariBCC - Email destinatari in BCC
   * @return {MyMailService} Istanza corrente per chiamate fluent
   */
  ccn(destinatariBCC) {
    if (Array.isArray(destinatariBCC)) {
      this._emailDraft.bcc = [...destinatariBCC];
    } else {
      this._emailDraft.bcc = [destinatariBCC];
    }
    return this;
  }

  /**
   * Aggiunge destinatari in copia carbone nascosta
   * @param {string|string[]} destinatariBCC - Email destinatari in BCC
   * @return {MyMailService} Istanza corrente per chiamate fluent
   */
  aggiungiCCN(destinatariBCC) {
    if (Array.isArray(destinatariBCC)) {
      this._emailDraft.bcc = [...this._emailDraft.bcc, ...destinatariBCC];
    } else {
      this._emailDraft.bcc.push(destinatariBCC);
    }
    return this;
  }

  /**
   * Imposta l'oggetto dell'email
   * @param {string} oggetto - Oggetto dell'email
   * @return {MyMailService} Istanza corrente per chiamate fluent
   */
  oggetto(oggetto) {
    this._emailDraft.subject = oggetto;
    return this;
  }

  /**
   * Imposta il corpo dell'email in testo semplice
   * @param {string} corpo - Corpo dell'email
   * @return {MyMailService} Istanza corrente per chiamate fluent
   */
  corpo(corpo) {
    this._emailDraft.body = corpo;
    return this;
  }

  /**
   * Imposta il corpo dell'email in HTML
   * @param {string} corpoHTML - Corpo dell'email in HTML
   * @return {MyMailService} Istanza corrente per chiamate fluent
   */
  corpoHTML(corpoHTML) {
    this._emailDraft.htmlBody = corpoHTML;
    return this;
  }

  /**
   * Imposta il nome del mittente
   * @param {string} nome - Nome del mittente
   * @return {MyMailService} Istanza corrente per chiamate fluent
   */
  nomeMittente(nome) {
    this._emailDraft.name = nome;
    return this;
  }

  /**
   * Imposta l'indirizzo di risposta
   * @param {string} email - Email di risposta
   * @return {MyMailService} Istanza corrente per chiamate fluent
   */
  rispondiA(email) {
    this._emailDraft.replyTo = email;
    return this;
  }

  /**
   * Imposta l'opzione di no-reply
   * @param {boolean} noReply - True per impostare no-reply
   * @return {MyMailService} Istanza corrente per chiamate fluent
   */
  nonRispondere(noReply = true) {
    this._emailDraft.noReply = noReply;
    return this;
  }

  /**
   * Aggiunge un allegato all'email
   * @param {BlobSource} allegato - Allegato da aggiungere
   * @return {MyMailService} Istanza corrente per chiamate fluent
   */
  aggiungiAllegato(allegato) {
    this._emailDraft.attachments.push(allegato);
    return this;
  }

  /**
   * Aggiunge più allegati all'email
   * @param {BlobSource[]} allegati - Array di allegati
   * @return {MyMailService} Istanza corrente per chiamate fluent
   */
  aggiungiAllegati(allegati) {
    this._emailDraft.attachments = [...this._emailDraft.attachments, ...allegati];
    return this;
  }

  /**
   * Aggiunge un'immagine inline
   * @param {string} id - ID dell'immagine
   * @param {BlobSource} immagine - Immagine da inserire
   * @return {MyMailService} Istanza corrente per chiamate fluent
   */
  aggiungiImmagineInline(id, immagine) {
    this._emailDraft.inlineImages[id] = immagine;
    return this;
  }

  /**
   * Aggiunge un file di Google Drive come allegato
   * @param {string} idFile - ID del file in Google Drive
   * @return {MyMailService} Istanza corrente per chiamate fluent
   */
  aggiungiAllegatoDaDrive(idFile) {
    try {
      const file = DriveApp.getFileById(idFile);
      this._emailDraft.attachments.push(file.getBlob());
      return this;
    } catch (e) {
      this._logger.error(`Errore nell'aggiungere l'allegato da Drive: ${e.message}`);
      return this;
    }
  }

  /**
   * Invia l'email
   * @return {boolean} True se l'invio è riuscito
   */
  /**
   * Invia l'email.
   * @return {boolean} True se l'invio è riuscito
   */
  invia() {
    try {
      // Se per qualche motivo _emailDraft non esiste, lo reinizializziamo.
      // Questa è una rete di sicurezza.
      if (!this._emailDraft) {
          this._logger.warn("MyMailService._emailDraft non era inizializzato. Eseguo reset forzato.");
          this._reset();
      }

      if (!this._emailDraft.to || this._emailDraft.to.length === 0) {
        throw new Error("Nessun destinatario specificato");
      }
      
      if (!this._emailDraft.subject) {
        throw new Error("Oggetto dell'email non specificato");
      }
      
      if (!this._emailDraft.body && !this._emailDraft.htmlBody) {
        throw new Error("Corpo dell'email non specificato");
      }
      
      const opzioni = {};
      
      if (this._emailDraft.cc.length > 0) opzioni.cc = this._emailDraft.cc.join(',');
      if (this._emailDraft.bcc.length > 0) opzioni.bcc = this._emailDraft.bcc.join(',');
      if (this._emailDraft.name) opzioni.name = this._emailDraft.name;
      if (this._emailDraft.replyTo) opzioni.replyTo = this._emailDraft.replyTo;
      if (this._emailDraft.noReply) opzioni.noReply = true;
      if (this._emailDraft.attachments.length > 0) opzioni.attachments = this._emailDraft.attachments;
      if (Object.keys(this._emailDraft.inlineImages).length > 0) opzioni.inlineImages = this._emailDraft.inlineImages;
      
      const destinatari = this._emailDraft.to.join(',');
      
      let corpoTestuale = this._emailDraft.body;
      if (this._emailDraft.htmlBody) {
        opzioni.htmlBody = this._emailDraft.htmlBody;
        if (!corpoTestuale) {
          corpoTestuale = this._convertiHTMLInTesto(this._emailDraft.htmlBody);
        }
      }
      
      MailApp.sendEmail(destinatari, this._emailDraft.subject, corpoTestuale, opzioni);
      
      this._reset(); // Resetta dopo l'invio
      
      return true;
    } catch (e) {
      this._logger.error(`Errore nell'invio dell'email: ${e.message}\nStack: ${e.stack}`);
      this._reset(); // Resetta anche in caso di errore
      return false;
    }
  }

  /**
   * Crea una bozza in Gmail
   * @return {boolean} True se la creazione della bozza è riuscita
   */
  creaBozza() {
    try {
      // Verifica che ci siano i campi obbligatori
      if (!this._emailDraft.to.length) {
        throw new Error("Nessun destinatario specificato");
      }
      
      if (!this._emailDraft.subject) {
        throw new Error("Oggetto dell'email non specificato");
      }
      
      if (!this._emailDraft.body && !this._emailDraft.htmlBody) {
        throw new Error("Corpo dell'email non specificato");
      }
      
      // Prepara le opzioni
      const opzioni = {};
      
      if (this._emailDraft.cc.length > 0) {
        opzioni.cc = this._emailDraft.cc.join(',');
      }
      
      if (this._emailDraft.bcc.length > 0) {
        opzioni.bcc = this._emailDraft.bcc.join(',');
      }
      
      if (this._emailDraft.name) {
        opzioni.name = this._emailDraft.name;
      }
      
      if (this._emailDraft.replyTo) {
        opzioni.replyTo = this._emailDraft.replyTo;
      }
      
      if (this._emailDraft.attachments.length > 0) {
        opzioni.attachments = this._emailDraft.attachments;
      }
      
      if (Object.keys(this._emailDraft.inlineImages).length > 0) {
        opzioni.inlineImages = this._emailDraft.inlineImages;
      }
      
      // Crea la bozza
      const destinatari = this._emailDraft.to.join(',');
      
      if (this._emailDraft.htmlBody) {
        opzioni.htmlBody = this._emailDraft.htmlBody;
        
        if (!this._emailDraft.body) {
          // Genera automaticamente una versione testuale dal corpo HTML
          this._emailDraft.body = this._convertiHTMLInTesto(this._emailDraft.htmlBody);
        }
      }
      
      GmailApp.createDraft(
        destinatari,
        this._emailDraft.subject,
        this._emailDraft.body,
        opzioni
      );
      
      // Resetta l'email draft
      this._reset();
      
      return true;
    } catch (e) {
      this._logger.error(`Errore nella creazione della bozza: ${e.message}`);
      return false;
    }
  }

  /**
   * Crea un modello di email con variabili sostituibili
   * @param {string} corpoHTML - Corpo HTML con variabili {{nome_variabile}}
   * @return {MyMailService} Istanza corrente per chiamate fluent
   */
  creaModelloEmail(corpoHTML) {
    this._emailDraft.htmlBody = corpoHTML;
    return this;
  }

  /**
   * Sostituisce le variabili nel modello di email
   * @param {Object} variabili - Oggetto con le variabili da sostituire
   * @return {MyMailService} Istanza corrente per chiamate fluent
   */
  sostituisciVariabili(variabili) {
    if (!this._emailDraft.htmlBody) {
      return this;
    }
    
    let corpoConVariabili = this._emailDraft.htmlBody;
    
    // Sostituisce tutte le variabili nel formato {{nome_variabile}}
    for (const key in variabili) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      corpoConVariabili = corpoConVariabili.replace(regex, variabili[key]);
    }
    
    this._emailDraft.htmlBody = corpoConVariabili;
    return this;
  }

  /**
   * Invia email in blocco a più destinatari con contenuto personalizzato
   * @param {Object[]} datiDestinatari - Array di oggetti con dati dei destinatari
   * @param {Function} generatoreCorpo - Funzione che genera il corpo per ogni destinatario
   * @param {string} oggetto - Oggetto dell'email
   * @param {boolean} invioHTML - Se true, invia in formato HTML
   * @return {number} Numero di email inviate con successo
   */
  inviaInBlocco(datiDestinatari, generatoreCorpo, oggetto, invioHTML = true) {
    if (!datiDestinatari || !datiDestinatari.length) {
      return 0;
    }
    
    let emailInviate = 0;
    
    for (const destinatario of datiDestinatari) {
      try {
        // Resetta l'email draft
        this._reset();
        
        // Imposta il destinatario e l'oggetto
        this.destinatari(destinatario.email);
        this.oggetto(oggetto);
        
        // Genera il corpo
        const corpo = generatoreCorpo(destinatario);
        
        if (invioHTML) {
          this.corpoHTML(corpo);
        } else {
          this.corpo(corpo);
        }
        
        // Invia l'email
        const risultato = this.invia();
        
        if (risultato) {
          emailInviate++;
        }
        
        // Attendi un po' per evitare limiti di quota
        Utilities.sleep(100);
      } catch (e) {
        this._logger.error(`Errore nell'invio dell'email a ${destinatario.email}: ${e.message}`);
      }
    }
    
    return emailInviate;
  }

  /**
   * Converte HTML in testo semplice
   * @param {string} html - HTML da convertire
   * @return {string} Testo semplice
   */
  _convertiHTMLInTesto(html) {
    // Rimuove i tag HTML e converte alcune entità
    return html
      .replace(/<[^>]*>/g, ' ') // Rimuove i tag HTML
      .replace(/&nbsp;/g, ' ') // Converte gli spazi
      .replace(/&lt;/g, '<') // Converte <
      .replace(/&gt;/g, '>') // Converte >
      .replace(/&amp;/g, '&') // Converte &
      .replace(/&quot;/g, '"') // Converte "
      .replace(/&apos;/g, "'") // Converte '
      .replace(/\s+/g, ' ') // Rimuove spazi multipli
      .trim(); // Rimuove spazi iniziali e finali
  }

  /**
   * Resetta l'email draft
   */
  _reset() {
    this._emailDraft = {
      to: [],
      cc: [],
      bcc: [],
      subject: '',
      body: '',
      htmlBody: '',
      attachments: [],
      inlineImages: {},
      name: '',
      replyTo: '',
      noReply: false
    };
  }

  /**
   * Crea e invia una notifica a un gruppo di utenti
   * @param {string[]} emailUtenti - Email degli utenti
   * @param {string} titolo - Titolo della notifica
   * @param {string} messaggio - Messaggio della notifica
   * @param {Object} opzioni - Opzioni aggiuntive
   * @return {boolean} True se l'invio è riuscito
   */
  inviaNotifica(emailUtenti, titolo, messaggio, opzioni = {}) {
    try {
      this._reset();
      
      // Imposta i destinatari
      if (Array.isArray(emailUtenti)) {
        this.destinatari(emailUtenti);
      } else {
        this.destinatari([emailUtenti]);
      }
      
      // Imposta l'oggetto
      this.oggetto(titolo);
      
      // Crea il corpo HTML se non specificato
      let corpoHTML = opzioni.corpoHTML;
      
      if (!corpoHTML) {
        corpoHTML = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #333;">${titolo}</h2>
            <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
              ${messaggio.replace(/\n/g, '<br>')}
            </div>
            <p style="color: #666; font-size: 12px;">Questa è una notifica automatica, si prega di non rispondere a questa email.</p>
          </div>
        `;
      }
      
      // Imposta il corpo HTML
      this.corpoHTML(corpoHTML);
      
      // Imposta le opzioni aggiuntive
      if (opzioni.cc) {
        this.cc(opzioni.cc);
      }
      
      if (opzioni.bcc) {
        this.ccn(opzioni.bcc);
      }
      
      if (opzioni.nomeMittente) {
        this.nomeMittente(opzioni.nomeMittente);
      }
      
      if (opzioni.nonRispondere) {
        this.nonRispondere(true);
      }
      
      if (opzioni.allegati) {
        this.aggiungiAllegati(opzioni.allegati);
      }
      
      // Invia l'email
      return this.invia();
    } catch (e) {
      this._logger.error(`Errore nell'invio della notifica: ${e.message}`);
      return false;
    }
  }

  /**
   * Verifica se un indirizzo email è valido
   * @param {string} email - Indirizzo email da verificare
   * @return {boolean} True se l'email è valida
   */
  verificaEmail(email) {
    const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    return regex.test(email);
  }

}
