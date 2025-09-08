/**
 * @file RelazioneCondotta.js
 * @description Definisce la classe per la generazione del documento "Relazione Condotta".
 */

/**
 * Classe per generare la Relazione Condotta applicando le protezioni in BATCH.
 */
class RelazioneCondotta extends DocumentoBase {
  /**
   * @param {Object} configurazione - Configurazione del documento, inclusi servizi e opzioni per gli step.
   */
  constructor(configurazione = {}) {
    const configBase = {
      nome: 'Relazione Condotta',
      tipoDocumento: 'CONDOTTA',
      ...configurazione
    };
    super(configBase);
  }

  /**
   * Configura la pipeline di generazione specifica per questo documento.
   * @protected
   */
  _configuraPipelineStandard() {
    this.pipeline
      .aggiungiStep(new StepDeterminaCartella(this.opzioniStep.StepDeterminaCartella, this.logger))
      .aggiungiStep(new StepSelezionaModello(this.opzioniStep.StepSelezionaModello, this.logger))
      .aggiungiStep(new StepGeneraNome(this.opzioniStep.StepGeneraNome, this.logger))
      .aggiungiStep(new StepCreaDocumento(this.opzioniStep.StepCreaDocumento, this.logger))
      .aggiungiStep(new StepInserisciProteggiColonneMaterieBatch(this.opzioniStep.StepInserisciProteggiColonneMaterieBatch, this.logger))
      .aggiungiStep(new StepSalvaRiferimenti(this.opzioniStep.StepSalvaRiferimenti, this.logger));
  }
}

/**
 * Esempio di funzione per generare la Relazione Condotta per una classe specifica.
 *
 * @returns {Object} Il risultato finale della pipeline di generazione del documento.
 */
function generaRelazioneCondotta() {
  const servizi = inizializzaServizi();
  servizi.logger.info("=== AVVIO GENERAZIONE RELAZIONE CONDOTTA ===");

  const classeDiTest = '1A LC';
  const startTime = new Date().getTime();

  // --- CONFIGURAZIONE SPECIFICA PER QUESTO DOCUMENTO ---
  const configRelazione = {
    ...servizi,
    opzioniStep: {
      StepInserisciProteggiColonneMaterieBatch: {
        nomeScheda: 'DATI',
        // NUOVO: Specifica il placeholder da cercare nel modello del foglio
        placeholderAvvio: '{{INIZIO_MATERIE}}',
        // Opzioni per personalizzare il comportamento
        religioneComePrimaColonna: true,
        escludiMateriaSostegno: true,
        escludiMateriaAlternativa: true,
        escludiMateriaReligione: false, 
        docenteAltScriveSuRel: true
      }
    }
  };

  const relazione = new RelazioneCondotta(configRelazione);
  const risultato = relazione.genera({ classe: classeDiTest });

  const endTime = new Date().getTime();
  const tempoEsecuzione = (endTime - startTime) / 1000;
  
  // --- REPORT FINALE ---
  servizi.logger.info("\n=== REPORT GENERAZIONE ===");
  servizi.logger.info(`Classe di test: ${classeDiTest}`);
  servizi.logger.info(`Tempo di esecuzione: ${tempoEsecuzione.toFixed(2)} secondi`);

  if (risultato.errorePipeline) {
    servizi.logger.error(`ERRORE: ${risultato.errorePipeline.messaggio} (Step: ${risultato.errorePipeline.step})`);
  } else if (risultato.documentoCreato) {
    servizi.logger.info(`Documento generato con successo: ${risultato.documentoCreato.name}`);
    servizi.logger.info(`URL: ${risultato.documentoCreato.webViewLink}`);
  }

  return risultato;
}