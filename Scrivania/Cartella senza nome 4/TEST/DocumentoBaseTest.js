// ===================================================================================
// STEP "FISSI" PER IL TEST
// Questi step utilizzano ID e configurazioni hardcoded per rendere i test prevedibili.
// ===================================================================================

/**
 * StepGeneraNomeFisso:
 * Genera sempre un nome di documento prevedibile per i test, del tipo "DOC TEST PER [NOME_CLASSE]".
 * @extends StepGeneraNome
 */
class StepGeneraNomeFisso extends StepGeneraNome {
  /**
   * @param {MyLoggerService} logger - Servizio di logging.
   * @param {MyExceptionService} exceptionService - Servizio per la gestione delle eccezioni.
   */
  constructor(logger, exceptionService) {
    // Passa una configurazione vuota e i servizi necessari al costruttore della classe base.
    super({}, logger, exceptionService);
  }

  /**
   * @override
   * @protected
   * Contiene la logica specifica per generare un nome di documento fisso.
   * @param {Object} contesto - Il contesto della pipeline.
   */
  _eseguiLogica(contesto) {
    this.log(contesto, 'Generazione nome documento fisso per il test.');

    // Usa il nome della classe dal contesto, con un fallback.
    const nomeClasse = contesto.classe || 'ClasseSconosciuta';
    const nomeDocumento = `DOC TEST PER ${nomeClasse}`;

    this.impostaRisultato(contesto, 'nomeDocumento', nomeDocumento);
    this.log(contesto, `Nome documento fissato: ${nomeDocumento}`);
  }
}

/**
 * StepSelezionaModelloFisso:
 * Seleziona sempre un modello di documento con un ID fisso per i test.
 * @extends StepSelezionaModello
 */
class StepSelezionaModelloFisso extends StepSelezionaModello {
  /**
   * @param {MyLoggerService} logger - Servizio di logging.
   * @param {MyExceptionService} exceptionService - Servizio per la gestione delle eccezioni.
   */
  constructor(logger, exceptionService) {
    super({}, logger, exceptionService);
    /** @const {string} */
    this.ID_MODELLO_FISSO = '1oclkx-PpK-_bpclkTWSxSo3Lhzn_JsBbyMYKCISyD9U';
  }

  /**
   * @override
   * @protected
   * Contiene la logica specifica per selezionare un modello fisso.
   * @param {Object} contesto - Il contesto della pipeline.
   */
  _eseguiLogica(contesto) {
    this.log(contesto, `Selezione modello fisso (ID: ${this.ID_MODELLO_FISSO}).`);
    if (!this.verificaContesto(contesto, ['driveService'])) {
      throw new Error("Servizio 'driveService' mancante nel contesto.");
    }

    const { driveService } = contesto.servizi;
    const file = driveService.ottieni(this.ID_MODELLO_FISSO, true, false);
    
    if (!file) {
      // Lancia un errore che sarà gestito dalla classe base.
      throw new Error(`Modello fisso con ID ${this.ID_MODELLO_FISSO} non trovato o non accessibile.`);
    }

    this.impostaRisultato(contesto, 'modelloSelezionato', {
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      webViewLink: file.webViewLink
    });
  }
}

/**
 * StepDeterminaCartellaFissa:
 * Seleziona sempre una cartella di destinazione con un ID fisso per i test.
 * @extends StepDeterminaCartella
 */
class StepDeterminaCartellaFissa extends StepDeterminaCartella {
  /**
   * @param {MyLoggerService} logger - Servizio di logging.
   * @param {MyExceptionService} exceptionService - Servizio per la gestione delle eccezioni.
   */
  constructor(logger, exceptionService) {
    super({}, logger, exceptionService);
    /** @const {string} */
    this.ID_CARTELLA_FISSA = '1spypsGbne8YzQs9SCN9-eYqSMQe3LLkw';
  }

  /**
   * @override
   * @protected
   * Contiene la logica specifica per determinare una cartella fissa.
   * @param {Object} contesto - Il contesto della pipeline.
   */
  _eseguiLogica(contesto) {
    this.log(contesto, `Determinazione cartella fissa (ID: ${this.ID_CARTELLA_FISSA}).`);
    if (!this.verificaContesto(contesto, ['driveService'])) {
      throw new Error("Servizio 'driveService' mancante nel contesto.");
    }

    const { driveService } = contesto.servizi;
    const info = driveService.ottieni(this.ID_CARTELLA_FISSA, true, false);

    if (!info || info.mimeType !== 'application/vnd.google-apps.folder') {
      throw new Error(`L'ID ${this.ID_CARTELLA_FISSA} non corrisponde a una cartella valida.`);
    }

    this.impostaRisultato(contesto, 'cartellaDestinazione', {
      id: info.id,
      name: info.name,
      webViewLink: info.webViewLink,
      parents: info.parents || []
    });
  }
}


// ===================================================================================
// CLASSE DOCUMENTO DI TEST
// ===================================================================================

/**
 * DocumentoTest:
 * Estende DocumentoBase e sostituisce gli step standard con le versioni "fisse"
 * per creare un ambiente di test controllato e prevedibile.
 * @extends DocumentoBase
 */
class DocumentoTest extends DocumentoBase {
  /**
   * @param {Object} [configurazione={}] - Può essere vuota; vengono usati default sensati.
   */
  constructor(configurazione = {}) {
    const configBase = {
      nome: configurazione.nome || 'DocumentoTest',
      tipoDocumento: configurazione.tipoDocumento || 'TEST_DOCUMENT',
      ...configurazione
    };
    
    // Chiama il costruttore di DocumentoBase, che inizializzerà tutti i servizi.
    super(configBase);

    // Ora che this.logger, this.exceptionService e this.pipeline esistono,
    // possiamo sostituire gli step standard con le versioni fisse.
    this.logger.info("Sostituzione degli step standard con versioni fisse per DocumentoTest.");

    this._sostituisciStep('SelezionaModello', new StepSelezionaModelloFisso(this.logger, this.exceptionService));
    this._sostituisciStep('DeterminaCartella', new StepDeterminaCartellaFissa(this.logger, this.exceptionService));
    this._sostituisciStep('GeneraNome', new StepGeneraNomeFisso(this.logger, this.exceptionService));
  }

  /**
   * Metodo helper per sostituire uno step nella pipeline.
   * @param {string} nomeStepDaSostituire - Il nome dello step da rimpiazzare.
   * @param {StepDocumento} nuovoStep - La nuova istanza dello step.
   * @private
   */
  _sostituisciStep(nomeStepDaSostituire, nuovoStep) {
    const index = this.pipeline.steps.findIndex(s => s.nome === nomeStepDaSostituire);
    if (index >= 0) {
      this.pipeline.steps[index] = nuovoStep;
      this.logger.debug(`Step '${nomeStepDaSostituire}' sostituito con '${nuovoStep.nome}'.`);
    } else {
      this.logger.warn(`Step '${nomeStepDaSostituire}' non trovato nella pipeline. Impossibile sostituire.`);
    }
  }

  /**
   * @override
   * Sovrascrive il metodo per aggiungere permessi personalizzati al contesto di test.
   * @param {Object} [parametriInput={}] - I parametri di input per la generazione.
   * @returns {Object} Il contesto preparato.
   * @protected
   */
  _preparaContesto(parametriInput = {}) {
    const contesto = super._preparaContesto(parametriInput);

    // Aggiunge permessi personalizzati al contesto per il test dello StepAssegnaPermessi.
    // Questo simula una configurazione di permessi specifica per questo tipo di documento.
    contesto.opzioniStep = contesto.opzioniStep || {};
    contesto.opzioniStep.StepAssegnaPermessi = contesto.opzioniStep.StepAssegnaPermessi || {};
    contesto.opzioniStep.StepAssegnaPermessi.permessi = {
      file: {
        coordinatoreClasse: {
          permesso: 'SCRITTURA',
          emails: ['leuci.giulio@pietroaldi.com']
        }
      }
    };

    return contesto;
  }
}
