/**
 * @file DOC/Base.js
 * @description Definisce l'architettura fondamentale per la pipeline di generazione dei documenti.
 *              Include le classi:
 *              - DocumentoPipeline: Orchestra l'esecuzione sequenziale degli step.
 *              - StepDocumento: Classe base astratta per tutti gli step, con gestione centralizzata degli errori.
 *              - Step predefiniti: Implementazioni concrete per un flusso di generazione standard.
 *              - DocumentoBase: Classe orchestratrice che assembla e avvia la pipeline per un tipo di documento.
 * @version 2.0.0 - Refactoring con integrazione di MyExceptionService in StepDocumento.
 */

// ===================================================================================
// CLASSE PIPELINE
// ===================================================================================

/**
 * Gestisce l'esecuzione sequenziale e resiliente di una serie di step per la generazione di un documento.
 * Ogni step viene eseguito in un contesto protetto fornito dalla classe base StepDocumento.
 */
class DocumentoPipeline {
  /**
   * Crea una nuova istanza della pipeline.
   * @param {string} nome - Nome identificativo della pipeline (es. "Generazione Verbale CDC").
   * @param {MyLoggerService} logger - Servizio di logging condiviso.
   * @param {MyExceptionService} exceptionService - Servizio per la gestione centralizzata delle eccezioni.
   */
  constructor(nome, logger, exceptionService) {
    /** @type {string} */
    this.nome = nome;
    /** @type {MyLoggerService} */
    this.logger = logger;
    /** @type {MyExceptionService} */
    this.exceptionService = exceptionService;
    /** @type {StepDocumento[]} */
    this.steps = [];
    /** @type {Object} */
    this.configurazioneGlobale = {};

    this.logger.info(`Pipeline '${this.nome}' creata.`);
  }

  /**
   * Aggiunge uno step alla fine della pipeline.
   * @param {StepDocumento} step - Istanza dello step da aggiungere.
   * @returns {DocumentoPipeline} L'istanza della pipeline per consentire il chaining.
   */
  aggiungiStep(step) {
    if (!(step instanceof StepDocumento)) {
      const errorMessage = "Lo step aggiunto deve essere un'istanza di StepDocumento.";
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
    this.steps.push(step);
    this.logger.debug(`Step '${step.nome}' aggiunto alla pipeline '${this.nome}'.`);
    return this;
  }

  /**
   * Aggiunge uno step in una posizione specifica della pipeline.
   * @param {StepDocumento} step - Istanza dello step da aggiungere.
   * @param {number} posizione - Indice (0-based) a cui inserire lo step.
   * @returns {DocumentoPipeline} L'istanza della pipeline per consentire il chaining.
   */
  aggiungiStepInPosizione(step, posizione) {
    if (!(step instanceof StepDocumento)) {
      const errorMessage = "Lo step aggiunto deve essere un'istanza di StepDocumento.";
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
    if (posizione < 0 || posizione > this.steps.length) {
      const errorMessage = `Posizione ${posizione} non valida per l'inserimento dello step.`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
    this.steps.splice(posizione, 0, step);
    this.logger.debug(`Step '${step.nome}' aggiunto alla posizione ${posizione} nella pipeline '${this.nome}'.`);
    return this;
  }

  /**
   * Imposta una configurazione globale che sarà disponibile per tutti gli step.
   * Le configurazioni specifiche di uno step hanno la precedenza su quella globale.
   * @param {Object} configurazione - Oggetto di configurazione.
   * @returns {DocumentoPipeline} L'istanza della pipeline per consentire il chaining.
   */
  impostaConfigurazione(configurazione) {
    this.configurazioneGlobale = configurazione || {};
    this.logger.debug(`Configurazione globale della pipeline '${this.nome}' impostata.`);
    return this;
  }

  /**
   * Esegue l'intera pipeline in modo sequenziale.
   * Se uno step fallisce e l'errore non è recuperabile, la pipeline si interrompe.
   * @param {Object} contestoIniziale - Il contesto iniziale per l'esecuzione, contenente dati e servizi.
   * @returns {Object} Il contesto finale, arricchito con i risultati di ogni step e eventuali informazioni di errore.
   */
  esegui(contestoIniziale) {
    this.logger.info(`Avvio esecuzione pipeline '${this.nome}'.`);
    
    // Clona il contesto per evitare effetti collaterali sull'oggetto originale.
    let contestoCorrente = { ...contestoIniziale };

    // Inizializza le strutture dati del contesto se non presenti.
    contestoCorrente.logPipeline = contestoCorrente.logPipeline || [];
    contestoCorrente.configurazionePipeline = { ...this.configurazioneGlobale, ...(contestoCorrente.configurazionePipeline || {}) };

    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];
      this.logger.info(`Esecuzione step ${i + 1}/${this.steps.length}: '${step.nome}'`);

      // Il metodo esegui() dello step ora gestisce internamente gli errori.
      // Restituisce 'false' solo se l'esecuzione deve essere interrotta definitivamente.
      const continua = step.esegui(contestoCorrente);

      if (!continua) {
        // L'errore è già stato loggato nel contesto dal wrapper di esecuzione dello step.
        this.logger.warn(`Pipeline '${this.nome}' interrotta definitivamente dallo step '${step.nome}'.`);
        contestoCorrente.interrottoDa = step.nome;
        break;
      }
    }

    this.logger.info(`Esecuzione pipeline '${this.nome}' completata.`);
    return contestoCorrente;
  }
}


// ===================================================================================
// CLASSE BASE PER GLI STEP
// ===================================================================================

/**
 * Classe base astratta per tutti gli step della pipeline.
 * Fornisce una struttura comune, l'accesso alla configurazione, la validazione del contesto
 * e, soprattutto, un wrapper di esecuzione che gestisce automaticamente le eccezioni
 * tramite MyExceptionService.
 * Le classi figlie devono implementare il metodo `_eseguiLogica`.
 */
class StepDocumento {
  /**
   * Costruttore per la classe base dello step.
   * @param {string} nome - Nome identificativo e univoco dello step.
   * @param {Object} configurazioneStep - Configurazione specifica per questo step.
   * @param {MyLoggerService} logger - Servizio di logging condiviso.
   * @param {MyExceptionService} exceptionService - Servizio per la gestione delle eccezioni.
   */
  constructor(nome, configurazioneStep, logger, exceptionService) {
    if (this.constructor === StepDocumento) {
      throw new Error("StepDocumento è una classe astratta e non può essere istanziata direttamente.");
    }
    /** @type {string} */
    this.nome = nome;
    /** @type {Object} */
    this.configurazioneStep = configurazioneStep || {};
    /** @type {MyLoggerService} */
    this.logger = logger;
    /** @type {MyExceptionService} */
    this.exceptionService = exceptionService;
  }

  /**
   * Metodo wrapper (Template Method) che esegue la logica dello step in un contesto protetto.
   * Utilizza MyExceptionService per catturare, classificare e gestire eventuali errori.
   * NON sovrascrivere questo metodo nelle classi figlie. Implementare `_eseguiLogica` invece.
   * @param {Object} contesto - Il contesto condiviso della pipeline.
   * @returns {boolean} true per continuare con il prossimo step, false per interrompere la pipeline.
   */
  esegui(contesto) {
    const risultatoEsecuzione = this.exceptionService.eseguiConGestioneAvanzata(
      () => this._eseguiLogica(contesto),
      {}, // Parametri vuoti, la logica usa il 'contesto' dall'ambito esterno
      {
        nomeOperazione: `Step: ${this.nome}`,
        step: this.nome,
        modalita: 'RECOVERY', // Tenta di recuperare da errori temporanei
        contestoErrore: { classe: contesto.classe, tipoDocumento: contesto.tipoDocumento }
      }
    );

    if (risultatoEsecuzione.successo) {
      return true; // L'esecuzione è andata a buon fine, la pipeline continua.
    } else {
      // L'errore non è stato recuperabile. Logga l'errore finale nel contesto della pipeline.
      this.log(contesto, `Esecuzione fallita definitivamente dopo ${risultatoEsecuzione.tentativi} tentativi. Errore: ${risultatoEsecuzione.errore.messaggio}`, "ERROR");
      contesto.errorePipeline = {
        step: this.nome,
        messaggio: risultatoEsecuzione.errore.messaggio,
        tipo: risultatoEsecuzione.errore.tipo,
        stack: risultatoEsecuzione.errore.stack
      };
      return false; // Interrompe la pipeline.
    }
  }

  /**
   * Metodo astratto che deve essere implementato dalle sottoclassi.
   * Contiene la logica di business specifica dello step.
   * Non deve contenere blocchi try-catch; le eccezioni vengono gestite dal metodo `esegui`.
   * @abstract
   * @param {Object} contesto - Il contesto condiviso della pipeline.
   * @protected
   */
  _eseguiLogica(contesto) {
    throw new Error(`Metodo _eseguiLogica() non implementato per lo step '${this.nome}'.`);
  }

  /**
   * Ottiene un valore di configurazione.
   * La ricerca avviene con priorità: 1) Configurazione specifica dello step, 2) Configurazione globale della pipeline.
   * @param {Object} contesto - Il contesto della pipeline.
   * @param {string} chiave - La chiave del parametro di configurazione.
   * @param {*} [valoreDefault] - Il valore da restituire se la chiave non viene trovata.
   * @returns {*} Il valore della configurazione.
   */
  getConfig(contesto, chiave, valoreDefault) {
    if (this.configurazioneStep && this.configurazioneStep[chiave] !== undefined) {
      return this.configurazioneStep[chiave];
    }
    if (contesto && contesto.configurazionePipeline && contesto.configurazionePipeline[chiave] !== undefined) {
      return contesto.configurazionePipeline[chiave];
    }
    return valoreDefault;
  }

  /**
   * Verifica la presenza dei campi richiesti nel contesto o nel suo contenitore `servizi`.
   * @param {Object} contesto - Il contesto da verificare.
   * @param {string[]} campiRichiesti - Un array dei nomi dei campi richiesti.
   * @returns {boolean} true se tutti i campi sono presenti, false altrimenti.
   */
  verificaContesto(contesto, campiRichiesti) {
    if (!contesto) {
      this.log(contesto, "Contesto mancante o non valido.", "ERROR");
      return false;
    }
    
    for (const campo of campiRichiesti) {
      let presente = false;
      
      // Cerca prima nel contesto principale
      if (contesto[campo] !== undefined && contesto[campo] !== null) {
        presente = true;
      } 
      // Se non trovato, cerca nel contenitore dei servizi
      else if (contesto.servizi && contesto.servizi[campo] !== undefined && contesto.servizi[campo] !== null) {
        presente = true;
      }
      
      if (!presente) {
        this.log(contesto, `Campo o servizio richiesto mancante nel contesto: '${campo}'.`, "ERROR");
        return false;
      }
    }
    return true;
  }

  /**
   * Registra un messaggio di log sia nel logger di sistema sia nel log della pipeline.
   * @param {Object} contesto - Il contesto della pipeline.
   * @param {string} messaggio - Il messaggio da loggare.
   * @param {string} [tipo="INFO"] - Il tipo di log (INFO, WARN, ERROR, DEBUG).
   */
  log(contesto, messaggio, tipo = "INFO") {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp: timestamp,
      step: this.nome,
      tipo: tipo.toUpperCase(),
      messaggio: messaggio
    };

    if (contesto && Array.isArray(contesto.logPipeline)) {
      contesto.logPipeline.push(logEntry);
    }
    
    const messaggioLogSistema = `[${this.nome}] ${messaggio}`;
    switch (tipo.toUpperCase()) {
      case "ERROR": this.logger.error(messaggioLogSistema); break;
      case "WARN": this.logger.warn(messaggioLogSistema); break;
      case "DEBUG": this.logger.debug(messaggioLogSistema); break;
      default: this.logger.info(messaggioLogSistema); break;
    }
  }

  /**
   * Imposta un risultato nel contesto della pipeline, associandolo a questo step.
   * Il risultato viene salvato sia in `contesto.risultatiStep[nomeStep]` sia direttamente in `contesto[chiave]`.
   * @param {Object} contesto - Il contesto della pipeline.
   * @param {string} chiave - La chiave per il risultato.
   * @param {*} valore - Il valore del risultato.
   */
  impostaRisultato(contesto, chiave, valore) {
    if (!contesto) return;
    if (!contesto.risultatiStep) {
      contesto.risultatiStep = {};
    }
    if (!contesto.risultatiStep[this.nome]) {
      contesto.risultatiStep[this.nome] = {};
    }
    contesto.risultatiStep[this.nome][chiave] = valore;
    
    // Per comodità, imposta il risultato anche direttamente nel contesto,
    // ma attenzione a possibili sovrascritture da parte di altri step.
    contesto[chiave] = valore; 
    this.log(contesto, `Risultato '${chiave}' impostato per lo step '${this.nome}'.`, "DEBUG");
  }
}


// ===================================================================================
// STEP PREDEFINITI DELLA PIPELINE
// ===================================================================================

/**
 * Step per selezionare il modello di documento da utilizzare.
 */
class StepSelezionaModello extends StepDocumento {
  constructor(configurazione, logger, exceptionService) {
    super("SelezionaModello", configurazione, logger, exceptionService);
  }

  _eseguiLogica(contesto) {
    this.log(contesto, "Inizio selezione modello.");
    if (!this.verificaContesto(contesto, ['tipoDocumento', 'driveService', 'gestoreDocumenti'])) {
      // Lancia un errore se il contesto non è valido, sarà gestito dal wrapper.
      throw new Error("Contesto non valido per la selezione del modello.");
    }

    const { driveService, gestoreDocumenti } = contesto.servizi;
    let modello = null;

    // Logica di selezione con priorità
    if (typeof contesto._stepSelezionaModelloCustom === 'function') {
      this.log(contesto, "Utilizzo hook di selezione modello personalizzato.");
      modello = contesto._stepSelezionaModelloCustom(contesto);
    }

    if (!modello) {
      const idModelloSpecifico = this.getConfig(contesto, 'idModello', null);
      if (idModelloSpecifico) {
        modello = this._ottieniModelloDaId(contesto, idModelloSpecifico, driveService);
      }
    }
    
    if (!modello) {
      modello = this._ottieniModelloDaGestoreDocumenti(contesto, gestoreDocumenti, driveService);
    }

    if (!modello) {
      throw new Error(`Impossibile selezionare un modello per tipo '${contesto.tipoDocumento}'.`);
    }

    this.log(contesto, `Modello selezionato: ${modello.name} (ID: ${modello.id})`);
    this.impostaRisultato(contesto, 'modelloSelezionato', modello);
  }

  _ottieniModelloDaId(contesto, idModello, driveService) {
    const file = driveService.ottieni(idModello, true, false); // apiAvanzate = true, usaCache = false
    return file ? { id: file.id, name: file.name, mimeType: file.mimeType, webViewLink: file.webViewLink } : null;
  }

  _ottieniModelloDaGestoreDocumenti(contesto, gestoreDocumenti, driveService) {
    const docMetadato = contesto.documentoMetadato || gestoreDocumenti.ottieniPerId(contesto.tipoDocumento);
    if (!docMetadato) return null;

    const modelliJSON = docMetadato.ottieniModelliJSON();
    if (!modelliJSON) return null;

    const modelli = typeof modelliJSON === 'string' ? JSON.parse(modelliJSON) : modelliJSON;
    let idModello = modelli.DEFAULT || modelli; // Semplificato, può essere esteso
    
    return idModello ? this._ottieniModelloDaId(contesto, idModello, driveService) : null;
  }
}

/**
 * Step per determinare la cartella di destinazione del documento.
 */
class StepDeterminaCartella extends StepDocumento {
  constructor(configurazione, logger, exceptionService) {
    super("DeterminaCartella", configurazione, logger, exceptionService);
  }

  _eseguiLogica(contesto) {
    this.log(contesto, "Determinazione cartella di destinazione.");
    if (!this.verificaContesto(contesto, ['tipoDocumento', 'gestoreDB', 'gestoreDocumenti', 'placeholderService'])) {
      throw new Error("Contesto non valido per la determinazione della cartella.");
    }

    const { gestoreDocumenti, placeholderService, gestoreDB } = contesto.servizi;
    const docMetadato = gestoreDocumenti.ottieniPerId(contesto.tipoDocumento);
    if (!docMetadato) {
      throw new Error(`Metadati non trovati per tipo documento '${contesto.tipoDocumento}'`);
    }

    const cartellaParent = docMetadato.ottieniCartellaParent();
    if (!cartellaParent) {
      throw new Error("Cartella parent non definita nei metadati del documento.");
    }

    let percorsoCompleto = placeholderService.sostituisciInStringa(cartellaParent, contesto);
    const patternSottocartelle = docMetadato.ottieniSottocartelle();
    if (patternSottocartelle) {
      const percorsoSottocartella = placeholderService.sostituisciInStringa(patternSottocartelle, contesto);
      if (percorsoSottocartella) {
        percorsoCompleto = `${percorsoCompleto}/${percorsoSottocartella}`;
      }
    }

    this.log(contesto, `Percorso cartella calcolato: ${percorsoCompleto}`);

    const db = gestoreDB.ottieniDatabaseAnnoAttuale();
    if (!db || !db.tables['FOLDER_GEN']) {
      throw new Error("Tabella FOLDER_GEN non disponibile.");
    }

    const cartellaTrovata = db.select().from('FOLDER_GEN').where('PERCORSO CARTELLA', '=', percorsoCompleto).first();
    if (!cartellaTrovata || !cartellaTrovata['ID']) {
      throw new Error(`Cartella non trovata in FOLDER_GEN per il percorso: ${percorsoCompleto}`);
    }

    const cartella = {
      id: cartellaTrovata['ID'],
      name: cartellaTrovata['NOME'] || percorsoCompleto.split('/').pop(),
      webViewLink: cartellaTrovata['LINK'] || '',
      percorso: percorsoCompleto
    };

    this.impostaRisultato(contesto, 'cartellaDestinazione', cartella);
    this.log(contesto, `Cartella di destinazione trovata: ${cartella.name} (ID: ${cartella.id})`);
  }
}

/**
 * Step per generare il nome del file del documento.
 */
class StepGeneraNome extends StepDocumento {
  constructor(configurazione, logger, exceptionService) {
    super("GeneraNome", configurazione, logger, exceptionService);
  }

  _eseguiLogica(contesto) {
    this.log(contesto, "Generazione nome del documento.");
    if (!this.verificaContesto(contesto, ['tipoDocumento', 'gestoreDocumenti', 'placeholderService', 'utils'])) {
      throw new Error("Contesto non valido per la generazione del nome.");
    }

    const { gestoreDocumenti, placeholderService, utils } = contesto.servizi;
    const docMetadato = gestoreDocumenti.ottieniPerId(contesto.tipoDocumento);
    const pattern = docMetadato?.ottieniPatternNomeFile();
    
    let nome;
    if (pattern) {
      nome = placeholderService.sostituisciInStringa(pattern, contesto);
    } else {
      const timestamp = utils.formattaData(new Date(), 'yyyyMMdd_HHmmss');
      nome = `${contesto.tipoDocumento}_${timestamp}`;
      this.log(contesto, `Pattern nome file non trovato, usando fallback: ${nome}`, "WARN");
    }

    const nomePulito = this._pulisciNome(nome);
    this.impostaRisultato(contesto, 'nomeDocumento', nomePulito);
    this.log(contesto, `Nome generato: ${nomePulito}`);
  }

  _pulisciNome(nome) {
    if (!nome) return "Documento_Senza_Nome";
    let pulito = String(nome).replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim();
    return pulito.length > 200 ? pulito.substring(0, 200) : pulito;
  }
}

/**
 * Step per creare fisicamente il documento in Google Drive copiando il modello.
 */
class StepCreaDocumento extends StepDocumento {
  constructor(configurazione, logger, exceptionService) {
    super("CreaDocumento", configurazione, logger, exceptionService);
  }

  _eseguiLogica(contesto) {
    this.log(contesto, "Inizio creazione documento fisico.");
    if (!this.verificaContesto(contesto, ['modelloSelezionato', 'cartellaDestinazione', 'nomeDocumento', 'driveService'])) {
      throw new Error("Contesto non valido per la creazione del documento.");
    }

    const { driveService } = contesto.servizi;
    const { modelloSelezionato, cartellaDestinazione, nomeDocumento } = contesto;

    const fileCopiato = driveService.copiaFile(modelloSelezionato.id, nomeDocumento, cartellaDestinazione.id, true);
    if (!fileCopiato || !fileCopiato.id) {
      throw new Error("La copia del modello è fallita o non ha restituito un file valido.");
    }

    const documentoCreato = {
      id: fileCopiato.id,
      name: fileCopiato.name,
      mimeType: fileCopiato.mimeType,
      webViewLink: fileCopiato.webViewLink,
      parents: fileCopiato.parents || [cartellaDestinazione.id]
    };
    const tipoDocGoogle = this._determinaTipoDocumentoGoogle(documentoCreato.mimeType);

    this.impostaRisultato(contesto, 'documentoCreato', documentoCreato);
    this.impostaRisultato(contesto, 'tipoDocumentoGoogle', tipoDocGoogle);
    this.log(contesto, `Documento creato: ${documentoCreato.name} (ID: ${documentoCreato.id}), Tipo: ${tipoDocGoogle}`);
  }

  _determinaTipoDocumentoGoogle(mimeType) {
    const mimeMap = {
      'application/vnd.google-apps.document': 'docs',
      'application/vnd.google-apps.spreadsheet': 'sheets',
      'application/vnd.google-apps.presentation': 'slides',
      'application/vnd.google-apps.form': 'forms'
    };
    return mimeMap[mimeType] || "unknown";
  }
}

/**
 * Step per impostare i placeholder personalizzati e standard nel contesto.
 */
class StepImpostaPlaceholder extends StepDocumento {
  constructor(configurazione, logger, exceptionService) {
    super("ImpostaPlaceholder", configurazione, logger, exceptionService);
  }

  _eseguiLogica(contesto) {
    this.log(contesto, "Inizio configurazione placeholder.");
    if (!this.verificaContesto(contesto, ['placeholderService', 'gestoreDocumenti', 'utils'])) {
      throw new Error("Contesto non valido per l'impostazione dei placeholder.");
    }

    const { placeholderService, gestoreDocumenti, utils } = contesto.servizi;
    const placeholdersConfig = this.getConfig(contesto, 'placeholders', {});
    let placeholdersDaRegistrare = { ...placeholdersConfig };

    const docMetadato = gestoreDocumenti.ottieniPerId(contesto.tipoDocumento);
    if (docMetadato) {
      const paramsMeta = docMetadato.ottieniParametriAggiuntiviGenerazione();
      if (paramsMeta) {
        const paramsObj = (typeof paramsMeta === 'string') ? JSON.parse(paramsMeta) : paramsMeta;
        placeholdersDaRegistrare = { ...paramsObj, ...placeholdersDaRegistrare };
      }
    }
    
    this._integraPlaceholdersStandard(contesto, placeholdersDaRegistrare, utils);

    for (const nome in placeholdersDaRegistrare) {
      const valore = placeholdersDaRegistrare[nome];
      placeholderService.registraPlaceholder(nome, () => valore);
    }
    this.log(contesto, `Configurazione placeholder completata. Registrati ${Object.keys(placeholdersDaRegistrare).length} placeholder.`);
  }

  _integraPlaceholdersStandard(contesto, placeholders, utils) {
    const datiStandard = {
      classe_nome: contesto.classeOggetto?.ottieniNome() || contesto.classe,
      data_oggi: utils.formattaData(new Date(), 'dd/MM/yyyy'),
      timestamp: utils.formattaData(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      nome_documento: contesto.nomeDocumento,
      tipo_documento: contesto.tipoDocumento
    };

    for (const key in datiStandard) {
      if (datiStandard[key] !== null && placeholders[key] === undefined) {
        placeholders[key] = datiStandard[key];
      }
    }
  }
}

/**
 * Step per sostituire i placeholder nel documento creato.
 */
/**
 * Step per sostituire i placeholder nel documento creato.
 */
class StepSostituisciPlaceholder extends StepDocumento {
  constructor(configurazione, logger, exceptionService) {
    super("SostituisciPlaceholder", configurazione, logger, exceptionService);
  }

  /**
   * @override
   * @protected
   * Contiene la logica specifica per la sostituzione dei placeholder.
   * @param {Object} contesto - Il contesto della pipeline.
   */
  _eseguiLogica(contesto) {
    this.log(contesto, "Inizio sostituzione placeholder nel documento.");
    if (!this.verificaContesto(contesto, ['documentoCreato', 'tipoDocumentoGoogle', 'placeholderService'])) {
      throw new Error("Contesto non valido per la sostituzione dei placeholder.");
    }

    // Estrai le variabili necessarie direttamente dall'oggetto 'contesto'.
    const { placeholderService } = contesto.servizi;
    const { documentoCreato, tipoDocumentoGoogle } = contesto;

    let successo = false;

    if (tipoDocumentoGoogle === 'docs') {
      successo = placeholderService.elaboraDocumento(documentoCreato.id, contesto);
    } else if (tipoDocumentoGoogle === 'sheets') {
      const nomeScheda = this.getConfig(contesto, 'nomeScheda', null);
      successo = placeholderService.elaboraFoglio(documentoCreato.id, contesto, nomeScheda);
    } else {
      this.log(contesto, `Tipo documento '${tipoDocumentoGoogle}' non supportato per sostituzione. Step saltato.`, "WARN");
      successo = true; // Non è un errore, ma non fa nulla.
    }

    if (!successo) {
      // Se il servizio di placeholder restituisce false, lancia un errore per farlo gestire.
      throw new Error("La sostituzione dei placeholder è fallita. Controllare i log del PlaceholderService.");
    }

    this.impostaRisultato(contesto, 'sostituzioneCompletata', true);
    this.log(contesto, "Sostituzione placeholder completata con successo.");
  }
}

/**
 * Step per assegnare i permessi al documento e alla cartella in base ai metadati.
 */
class StepAssegnaPermessi extends StepDocumento {
  constructor(configurazione, logger, exceptionService) {
    super("AssegnaPermessi", configurazione, logger, exceptionService);
  }

  /**
   * @override
   * @protected
   * Contiene la logica specifica per l'assegnazione dei permessi.
   * @param {Object} contesto - Il contesto della pipeline.
   */
  _eseguiLogica(contesto) {
    this.log(contesto, "Inizio assegnazione permessi.");
    if (!this.verificaContesto(contesto, ['documentoCreato', 'tipoDocumento', 'gestoreDocumenti', 'permissionService'])) {
      throw new Error("Contesto non valido per l'assegnazione dei permessi.");
    }

    const { permissionService } = contesto.servizi;

    // Recupera tutte le configurazioni dei permessi da applicare.
    const permessi = this._recuperaPermessi(contesto);

    if (Object.keys(permessi.file).length === 0 && Object.keys(permessi.cartella).length === 0) {
      this.log(contesto, "Nessuna configurazione di permessi trovata. Step saltato.", "INFO");
      return;
    }

    const risultati = { file: [], cartella: [] };

    // Applica i permessi al file creato.
    if (Object.keys(permessi.file).length > 0 && contesto.documentoCreato) {
      this.log(contesto, "Applicazione permessi al FILE.", "DEBUG");
      risultati.file = this._applicaPermessi(
        contesto,
        contesto.documentoCreato.id,
        permessi.file,
        permissionService,
        'file'
      );
    }

    // Applica i permessi alla cartella di destinazione.
    if (Object.keys(permessi.cartella).length > 0 && contesto.cartellaDestinazione) {
      this.log(contesto, "Applicazione permessi alla CARTELLA.", "DEBUG");
      risultati.cartella = this._applicaPermessi(
        contesto,
        contesto.cartellaDestinazione.id,
        permessi.cartella,
        permissionService,
        'cartella'
      );
    }

    const totaleApplicati = risultati.file.length + risultati.cartella.length;
    this.impostaRisultato(contesto, 'permessiApplicati', risultati);
    this.log(contesto, `Applicati ${totaleApplicati} permessi in totale.`);
  }

  /**
   * Raccoglie e consolida tutte le configurazioni dei permessi dai metadati del documento e dalla configurazione dello step.
   * @param {Object} contesto - Il contesto della pipeline.
   * @returns {{file: Object, cartella: Object}} Un oggetto contenente le configurazioni dei permessi per file e cartella.
   * @private
   */
  _recuperaPermessi(contesto) {
    // *** INIZIO CORREZIONE ***
    // Accede correttamente al gestoreDocumenti tramite contesto.servizi
    const { gestoreDocumenti } = contesto.servizi;
    // *** FINE CORREZIONE ***

    const docMetadato = gestoreDocumenti.ottieniPerId(contesto.tipoDocumento);
    if (!docMetadato) {
        this.log(contesto, `Metadati per il documento tipo '${contesto.tipoDocumento}' non trovati. Impossibile determinare i permessi.`, "WARN");
        return { file: {}, cartella: {} };
    }

    const permessi = { file: {}, cartella: {} };

    const ruoli = [
      { nome: 'coord', campo: 'COORD', metodoClasse: 'ottieniCoordinatore' },
      { nome: 'referente', campo: 'REFERENTE', metodoRuolo: true },
      { nome: 'docente', campo: 'DOCENTE', metodoMateria: true },
      { nome: 'tutor', campo: 'TUTOR', metodoClasse: 'ottieniTutorPCTO' },
      { nome: 'alunno', campo: 'ALUNNO', contestoDiretto: true }
    ];

    for (const ruolo of ruoli) {
      const emails = this._ottieniEmailsPerRuolo(contesto, ruolo, docMetadato);
      if (emails.length > 0) {
        const permFile = docMetadato.ottieniPermessiRuolo(ruolo.campo, 'file');
        if (permFile && permFile.toUpperCase() !== 'NESSUNO') {
          permessi.file[ruolo.nome] = { permesso: permFile, emails: emails };
        }

        const permCartella = docMetadato.ottieniPermessiRuolo(ruolo.campo, 'cartella');
        if (permCartella && permCartella.toUpperCase() !== 'NESSUNO') {
          permessi.cartella[ruolo.nome] = { permesso: permCartella, emails: emails };
        }
      }
    }

    // Aggiunge eventuali permessi definiti direttamente nella configurazione dello step
    const permessiConfig = this.getConfig(contesto, 'permessi', {});
    if (permessiConfig.file) {
      Object.assign(permessi.file, permessiConfig.file);
    }
    if (permessiConfig.cartella) {
      Object.assign(permessi.cartella, permessiConfig.cartella);
    }

    return permessi;
  }

  /**
   * Risolve gli indirizzi email per un dato ruolo basandosi sul contesto.
   * @param {Object} contesto - Il contesto della pipeline.
   * @param {Object} ruolo - La configurazione del ruolo.
   * @param {Documento} docMetadato - I metadati del documento.
   * @returns {string[]} Un array di indirizzi email.
   * @private
   */
  _ottieniEmailsPerRuolo(contesto, ruolo, docMetadato) {
    const emails = new Set();
    const { gestoreDB } = contesto.servizi;

    if (ruolo.metodoClasse && contesto.classeOggetto) {
      const metodo = contesto.classeOggetto[ruolo.metodoClasse];
      if (typeof metodo === 'function') {
        const risultato = metodo.call(contesto.classeOggetto);
        (Array.isArray(risultato) ? risultato : [risultato]).forEach(email => email && emails.add(email));
      }
    }

    if (ruolo.metodoRuolo) {
      const idRuoloReferente = docMetadato.ottieniReferente();
      if (idRuoloReferente && gestoreDB) {
        const db = gestoreDB.ottieniDatabaseAnnoAttuale();
        const ruoloObj = db.select().from('RUOLI').where('RUOLO', '=', idRuoloReferente).first();
        if (ruoloObj && ruoloObj['EMAIL DOCENTE']) {
          emails.add(ruoloObj['EMAIL DOCENTE']);
        }
      }
    }

    if (ruolo.metodoMateria && contesto.materia && contesto.classeOggetto) {
      const docentiMateria = contesto.classeOggetto.ottieniDocenteMateria(contesto.materia);
      docentiMateria.forEach(email => email && emails.add(email));
    }

    if (ruolo.contestoDiretto && ruolo.nome === 'alunno' && contesto.alunno) {
      emails.add(contesto.alunno);
    }

    return Array.from(emails).filter(Boolean);
  }

  /**
   * Applica un set di permessi a un file o cartella di Drive.
   * @param {Object} contesto - Il contesto della pipeline.
   * @param {string} idElemento - L'ID del file o della cartella.
   * @param {Object} permessiRuoli - L'oggetto con le configurazioni dei permessi.
   * @param {MyPermissionService} service - Il servizio per la gestione dei permessi.
   * @param {string} tipo - 'file' o 'cartella'.
   * @returns {Object[]} Un array di oggetti che descrivono i permessi applicati.
   * @private
   */
  _applicaPermessi(contesto, idElemento, permessiRuoli, service, tipo) {
    const applicati = [];
    for (const [ruolo, config] of Object.entries(permessiRuoli)) {
      if (!config.emails || config.emails.length === 0) continue;

      const ruoloDrive = this._mappaPermesso(config.permesso);
      if (!ruoloDrive) {
        this.log(contesto, `Permesso non riconosciuto '${config.permesso}' per il ruolo ${ruolo}.`, "WARN");
        continue;
      }

      for (const email of config.emails) {
        // Lancia un'eccezione in caso di errore, che sarà gestita dal wrapper.
        const permesso = service.condividi(idElemento, email, ruoloDrive, 'user', false, '', true);
        applicati.push({ ruolo, email, permesso: ruoloDrive, tipo });
        this.log(contesto, `Permesso ${ruoloDrive} assegnato a ${email} per ${tipo} '${idElemento}'.`);
      }
    }
    return applicati;
  }

  /**
   * Mappa i nomi dei permessi interni ai ruoli di Google Drive.
   * @param {string} permesso - Il nome del permesso (es. 'LETTURA').
   * @returns {string|null} Il ruolo di Google Drive corrispondente o null.
   * @private
   */
  _mappaPermesso(permesso) {
    const mappa = {
      'LETTURA': 'reader',
      'COMMENTO': 'commenter',
      'SCRITTURA': 'writer',
      'PROPRIETARIO': 'owner'
    };
    return mappa[permesso?.toUpperCase()] || null;
  }
}

/**
 * Step per salvare i riferimenti del documento creato nella tabella DOC_GEN.
 */
class StepSalvaRiferimenti extends StepDocumento {
  constructor(configurazione, logger, exceptionService) {
    super("SalvaRiferimenti", configurazione, logger, exceptionService);
  }

  _eseguiLogica(contesto) {
    this.log(contesto, "Salvataggio riferimenti documento.");
    if (!this.verificaContesto(contesto, ['documentoCreato', 'tipoDocumento', 'cartellaDestinazione', 'gestoreDB', 'utils'])) {
      throw new Error("Contesto non valido per il salvataggio dei riferimenti.");
    }

    const { gestoreDB, utils } = contesto.servizi;
    const { documentoCreato } = contesto;
    const db = gestoreDB.ottieniDatabaseAnnoAttuale();
    if (!db.tables['DOC_GEN']) {
      throw new Error("Tabella DOC_GEN non trovata.");
    }

    const datiDoc = this._preparaDatiDocumento(contesto, documentoCreato, utils);
    const docEsistente = db.select().from('DOC_GEN').where('ID', '=', documentoCreato.id).first();
    
    const risultatoDB = docEsistente
      ? db.tables['DOC_GEN'].aggiornaRigaPerId(documentoCreato.id, datiDoc)
      : db.tables['DOC_GEN'].inserisciRiga(datiDoc);

    if (!risultatoDB) {
      throw new Error("Salvataggio del riferimento in DOC_GEN fallito.");
    }

    this.impostaRisultato(contesto, 'riferimentoSalvato', risultatoDB);
    this.log(contesto, `Riferimento ${docEsistente ? 'aggiornato' : 'salvato'} con ID: ${risultatoDB.ID || documentoCreato.id}`);
  }

  _preparaDatiDocumento(contesto, documento, utils) {
    const timestamp = new Date();
    const dati = {
      'ID': documento.id,
      'TIPO': contesto.tipoDocumento,
      'NOME': documento.name,
      'STATO': 'CREATO',
      'PERCORSO CARTELLA': contesto.cartellaDestinazione.percorso,
      'LINK': documento.webViewLink,
      'DATA CREAZIONE': utils.formattaData(timestamp, 'yyyy-MM-dd HH:mm:ss'),
      'DATA ULTIMA MODIFICA': utils.formattaData(timestamp, 'yyyy-MM-dd HH:mm:ss'),
      'CLASSE': contesto.classeOggetto?.ottieniNome(),
      'UTENTE': contesto.alunnoOggetto?.ottieniEmail() || contesto.docenteOggetto?.ottieniEmail(),
      'MATERIA': contesto.materiaOggetto?.ottieniSigla()
    };
    // Rimuove chiavi con valori null o undefined
    Object.keys(dati).forEach(key => (dati[key] == null) && delete dati[key]);
    return dati;
  }
}

/**
 * Step per aggiornare lo stato o eseguire azioni correlate in altre tabelle.
 */
class StepAggiornaStato extends StepDocumento {
  constructor(configurazione, logger, exceptionService) {
    super("AggiornaStato", configurazione, logger, exceptionService);
  }

  _eseguiLogica(contesto) {
    this.log(contesto, "Aggiornamento stato e azioni correlate.");
    // Questo step è spesso opzionale, quindi non lancia errore se il contesto non è completo.
    if (!this.verificaContesto(contesto, ['gestoreDB', 'utils'])) {
      this.log(contesto, "Contesto insufficiente per aggiornare lo stato. Step saltato.", "WARN");
      return;
    }
    // La logica di aggiornamento stato va qui...
    this.log(contesto, "Logica di aggiornamento stato non ancora implementata in dettaglio. Step completato.");
  }
}


// ===================================================================================
// CLASSE BASE PER LA GENERAZIONE DI DOCUMENTI
// ===================================================================================

/**
 * Classe base orchestratrice per la generazione di un tipo specifico di documento.
 * Assembla una pipeline standard e fornisce metodi per personalizzarla e eseguirla.
 */
class DocumentoBase {
  /**
   * @param {Object} configurazione - Configurazione del documento.
   * @param {string} configurazione.nome - Nome del processo/documento (es. "Verbale CDC").
   * @param {string} configurazione.tipoDocumento - Tipo di documento (corrisponde a un ID nella tabella DOCUMENTI).
   * @param {MyLoggerService} [configurazione.logger] - Istanza del logger. Se non fornita, ne viene creata una nuova.
   * @param {Object} [configurazione.opzioniStep] - Configurazioni specifiche da passare ai singoli step.
   */
  constructor(configurazione) {
    this.nome = configurazione.nome;
    this.tipoDocumento = configurazione.tipoDocumento;
    this.opzioniStep = configurazione.opzioniStep || {};

    // Inizializzazione dei servizi (o uso di quelli passati)
    this.logger = configurazione.logger || new MyLoggerService({ livello: 'INFO' });
    this.utils = configurazione.utils || new MyUtilsService();
    this.cache = configurazione.cache || new MyCacheService();
    this.exceptionService = configurazione.exceptionService || new MyExceptionService(this.logger, this.utils);
    this.spreadsheetService = configurazione.spreadsheetService || new MySpreadsheetService(this.logger, this.cache, this.utils);
    this.documentService = configurazione.documentService || new MyDocumentService(this.logger, this.cache, this.utils);
    this.driveService = configurazione.driveService || new MyDriveService(this.logger, this.cache, this.utils);
    this.permissionService = configurazione.permissionService || new MyPermissionService(this.logger, this.cache, this.utils);
    this.mustache = configurazione.mustache || new MyMustache({ logger: this.logger });
    this.gestoreDB = configurazione.gestoreDB || new GestoreDatabaseAnniScolastici(this.logger, this.cache, this.utils, this.spreadsheetService);
    this.gestoreDocumenti = configurazione.gestoreDocumenti || new GestoreDocumenti(this.logger, this.gestoreDB, this.cache, this.utils);
    this.gestoreClassi = configurazione.gestoreClassi || new GestoreClassi(this.logger, this.gestoreDB, this.cache, this.utils);
    this.gestoreAlunni = configurazione.gestoreAlunni || new GestoreAlunni(this.logger, this.gestoreDB, this.cache, this.utils);
    this.gestoreDocenti = configurazione.gestoreDocenti || new GestoreDocenti(this.logger, this.gestoreDB, this.cache, this.utils);
    this.archivioPlaceholder = configurazione.archivioPlaceholder || new ArchivioPlaceholder(this.gestoreDB, this.logger, this.mustache, this.utils, this.driveService);
    this.placeholderService = configurazione.placeholderService || new MyPlaceholderService(this.archivioPlaceholder, this.documentService, this.spreadsheetService, this.logger, this.mustache, this.utils);

    // Creazione della pipeline
    this.pipeline = new DocumentoPipeline(this.nome, this.logger, this.exceptionService);
    this.pipeline.impostaConfigurazione(this.opzioniStep);

    // Configurazione della pipeline standard
    this._configuraPipelineStandard();
  }

  /**
   * Assembla la pipeline con gli step standard.
   * Le classi derivate possono sovrascrivere questo metodo per definire una pipeline diversa.
   * @protected
   */
  _configuraPipelineStandard() {
    this.pipeline
      .aggiungiStep(new StepDeterminaCartella(this.opzioniStep.StepDeterminaCartella, this.logger, this.exceptionService))
      .aggiungiStep(new StepSelezionaModello(this.opzioniStep.StepSelezionaModello, this.logger, this.exceptionService))
      .aggiungiStep(new StepGeneraNome(this.opzioniStep.StepGeneraNome, this.logger, this.exceptionService))
      .aggiungiStep(new StepCreaDocumento(this.opzioniStep.StepCreaDocumento, this.logger, this.exceptionService))
      .aggiungiStep(new StepImpostaPlaceholder(this.opzioniStep.StepImpostaPlaceholder, this.logger, this.exceptionService))
      .aggiungiStep(new StepSostituisciPlaceholder(this.opzioniStep.StepSostituisciPlaceholder, this.logger, this.exceptionService))
      .aggiungiStep(new StepAssegnaPermessi(this.opzioniStep.StepAssegnaPermessi, this.logger, this.exceptionService))
      .aggiungiStep(new StepSalvaRiferimenti(this.opzioniStep.StepSalvaRiferimenti, this.logger, this.exceptionService))
      .aggiungiStep(new StepAggiornaStato(this.opzioniStep.StepAggiornaStato, this.logger, this.exceptionService));
  }
  
  /**
   * Hook per la pre-elaborazione del contesto prima dell'esecuzione della pipeline.
   * @param {Object} contesto - Il contesto preparato.
   * @returns {Object} Il contesto modificato.
   * @protected
   */
  _preEsecuzione(contesto) { return contesto; }

  /**
   * Hook per la post-elaborazione del contesto dopo l'esecuzione della pipeline.
   * @param {Object} contesto - Il contesto finale.
   * @returns {Object} Il contesto modificato.
   * @protected
   */
  _postEsecuzione(contesto) { return contesto; }

  /**
   * Hook per la selezione personalizzata del modello.
   * @param {Object} contesto - Il contesto corrente.
   * @returns {Object|null} L'oggetto modello o null per procedere con la logica standard.
   * @protected
   */
  _stepSelezionaModelloCustom(contesto) { return null; }

  /**
   * Prepara il contesto iniziale per l'esecuzione della pipeline.
   * @param {Object} [parametriInput={}] - I parametri specifici per questa generazione.
   * @returns {Object} Il contesto iniziale completo.
   * @protected
   */
  _preparaContesto(parametriInput = {}) {
    const contesto = {
      ...parametriInput,
      nomePipeline: this.nome,
      tipoDocumento: this.tipoDocumento,
      servizi: {
        logger: this.logger,
        utils: this.utils,
        cache: this.cache,
        exceptionService: this.exceptionService,
        spreadsheetService: this.spreadsheetService,
        documentService: this.documentService,
        driveService: this.driveService,
        permissionService: this.permissionService,
        mustache: this.mustache,
        gestoreDB: this.gestoreDB,
        gestoreDocumenti: this.gestoreDocumenti,
        gestoreClassi: this.gestoreClassi,
        gestoreAlunni: this.gestoreAlunni,
        gestoreDocenti: this.gestoreDocenti,
        archivioPlaceholder: this.archivioPlaceholder,
        placeholderService: this.placeholderService
      },
      _stepSelezionaModelloCustom: (ctx) => this._stepSelezionaModelloCustom(ctx)
    };

    // Arricchisce il contesto con gli oggetti entità completi
    if (parametriInput.classe) {
      contesto.classeOggetto = this.gestoreClassi.ottieniPerNome(parametriInput.classe);
    }
    if (parametriInput.alunno) {
      contesto.alunnoOggetto = this.gestoreAlunni.ottieniPerEmail(parametriInput.alunno);
    }
    if (parametriInput.docente) {
      contesto.docenteOggetto = this.gestoreDocenti.ottieniPerEmail(parametriInput.docente);
    }

    return contesto;
  }

  /**
   * Avvia la generazione del documento.
   * @param {Object} [parametriInput={}] - I parametri specifici per questa esecuzione (es. { classe: '1A LC' }).
   * @returns {Object} Il contesto finale della pipeline.
   */
  genera(parametriInput = {}) {
    this.logger.info(`Avvio generazione documento '${this.nome}' (tipo: ${this.tipoDocumento})`);
    let contesto = this._preparaContesto(parametriInput);
    
    try {
      contesto = this._preEsecuzione(contesto);
      contesto = this.pipeline.esegui(contesto);
      contesto = this._postEsecuzione(contesto);
    } catch (e) {
      this.logger.error(`Errore critico non gestito durante la generazione di '${this.nome}': ${e.message}`);
      contesto.errorePipeline = { step: 'Generale', messaggio: e.message, stack: e.stack };
    }
    
    return contesto;
  }
}