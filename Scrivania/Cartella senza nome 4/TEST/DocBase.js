// ===================================================================================
// FUNZIONE DI TEST
// ===================================================================================

/**
 * Esegue la pipeline di DocumentoTest e verifica i risultati.
 * Controlla che:
 * 1. Il modello selezionato sia quello fisso.
 * 2. La cartella di destinazione sia quella fissa.
 * 3. Il documento sia stato creato con successo.
 * 4. La pipeline si sia conclusa senza errori o interruzioni.
 *
 * @returns {{risultatoCompleto: Object, verifiche: Object}} Un oggetto contenente il contesto finale e i risultati delle verifiche.
 */
function testaDocumentoTest() {
  // Istanzia la classe di test. I servizi necessari vengono creati internamente.
  const pipelineTest = new DocumentoTest();
  
  const logger = pipelineTest.logger;
  logger.info('=== AVVIO TEST DocumentoTest ===');

  // Esegue la pipeline con parametri minimi.
  const risultato = pipelineTest.genera({
    classe: '1A LC', // Classe di esempio per i placeholder
  });

  // Estrae i risultati specifici degli step per le verifiche.
  const modelloSelezionato = risultato.risultatiStep?.SelezionaModello?.modelloSelezionato || null;
  const cartellaDestinazione = risultato.risultatiStep?.DeterminaCartella?.cartellaDestinazione || null;
  const documentoCreato = risultato.risultatiStep?.CreaDocumento?.documentoCreato || null;

  // Esegue le verifiche sui risultati.
  const verifiche = {
    modelloOk: modelloSelezionato?.id === '1oclkx-PpK-_bpclkTWSxSo3Lhzn_JsBbyMYKCISyD9U',
    cartellaOk: cartellaDestinazione?.id === '1spypsGbne8YzQs9SCN9-eYqSMQe3LLkw',
    documentoCreatoOk: !!documentoCreato,
    pipelineOk: !risultato.errorePipeline && !risultato.interrottoDa
  };

  // Logga i risultati delle verifiche.
  logger.info('--- RISULTATO VERIFICHE ---');
  Object.entries(verifiche).forEach(([k, v]) =>
    logger.info(`${k.padEnd(20)}: ${v ? 'OK' : 'FALLITO'}`)
  );

  if (documentoCreato) {
    logger.info('\nDocumento generato:');
    logger.info(`  Nome : ${documentoCreato.name}`);
    logger.info(`  ID   : ${documentoCreato.id}`);
    logger.info(`  Link : ${documentoCreato.webViewLink}`);
  }

  if (risultato.errorePipeline) {
    logger.error('\n*** ERRORE PIPELINE ***');
    logger.error(JSON.stringify(risultato.errorePipeline, null, 2));
  }
  
  if (risultato.interrottoDa) {
    logger.warn(`\n*** PIPELINE INTERROTTA DALLO STEP: ${risultato.interrottoDa} ***`);
  }

  logger.info('=== FINE TEST DocumentoTest ===');

  // Stampa il log completo raccolto durante l'esecuzione.
  Logger.log('--- LOG COMPLETO DEL TEST ---');
  logger.ottieni().forEach(log => Logger.log(log));

  return {
    risultatoCompleto: risultato, // Restituisce l'intero contesto per il debug.
    verifiche
  };
}