/**
 * Classe per la generazione del documento Piano di Lavoro
 * Estende DocumentoBase per ereditare la pipeline di generazione documenti
 */
class PianoLavoro extends DocumentoBase {
  /**
   * Costruttore della classe PianoLavoro
   * @param {Object} configurazione - Configurazione del documento
   */
  constructor(configurazione = {}) {
    // Configurazione base del documento
    const configBase = {
      nome: 'Piano di Lavoro',
      tipoDocumento: 'PIANO_LAVORO',
      parametriAggiuntivi: {
        ...configurazione.parametriAggiuntivi
      },
      placeholders: {
        ...configurazione.placeholders
      },
      opzioniStep: {
        StepDeterminaTipoDocumento: {
          ...configurazione.opzioniStep?.StepDeterminaTipoDocumento
        },
        StepDeterminaCartella: {
          ...configurazione.opzioniStep?.StepDeterminaCartella
        },
        StepSelezionaModello: {
          ...configurazione.opzioniStep?.StepSelezionaModello
        },
        StepGeneraNome: {
          ...configurazione.opzioniStep?.StepGeneraNome
        },
        StepImpostaPlaceholder: {
          ...configurazione.opzioniStep?.StepImpostaPlaceholder
        },
        StepSostituisciPlaceholder: {
          ...configurazione.opzioniStep?.StepSostituisciPlaceholder
        },
        StepAssegnaPermessi: {
          ...configurazione.opzioniStep?.StepAssegnaPermessi
        },
        StepSalvaRiferimenti: {
          ...configurazione.opzioniStep?.StepSalvaRiferimenti
        },
        StepAggiornaStato: {
          ...configurazione.opzioniStep?.StepAggiornaStato
        },
        ...configurazione.opzioniStep
      }
    };

    // Merge della configurazione
    const configFinale = {
      ...configBase,
      ...configurazione,
      parametriAggiuntivi: { ...configBase.parametriAggiuntivi, ...configurazione.parametriAggiuntivi },
      placeholders: { ...configBase.placeholders, ...configurazione.placeholders },
      opzioniStep: { ...configBase.opzioniStep, ...configurazione.opzioniStep }
    };

    super(configFinale);
  }

  /**
   * Metodo per pre-elaborazione del contesto
   * @param {Object} contesto - Contesto della pipeline
   * @return {Object} Contesto modificato
   * @protected
   */
  _preEsecuzione(contesto) {
    // Validazioni specifiche per il piano di lavoro
    if (!contesto.classe) {
      throw new Error('Classe obbligatoria per il piano di lavoro');
    }

    return contesto;
  }

  /**
   * Metodo per post-elaborazione del contesto
   * @param {Object} contesto - Contesto della pipeline
   * @return {Object} Contesto modificato
   * @protected
   */
  _postEsecuzione(contesto) {
    if (contesto.documentoCreato) {
      this.logger.info(`Piano di lavoro creato: ${contesto.documentoCreato.name}`);
    }
    
    return contesto;
  }
}