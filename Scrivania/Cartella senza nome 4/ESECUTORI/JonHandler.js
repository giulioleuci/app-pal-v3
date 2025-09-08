/**
 * JobHandler per generare piani di lavoro per tutte le classi attive
 * Un piano di lavoro per classe (senza stratificazione per materia/docente)
 * @generator
 * @param {Object} parametri - Parametri del job
 * @yields {Object} Stato di avanzamento
 */
function* jobGeneraPianiLavoroTutti(parametri) {
  const servizi = inizializzaServizi();
  const { statoRipresa = {} } = parametri;
  
  // Ottieni classi attive
  const classi = servizi.gestoreClassi.ottieniClassiAttive();
  const totaleClassi = classi.length;
  
  // Ripresa da dove si era interrotto
  let indiceInizio = statoRipresa.ultimoIndice || 0;
  let completati = statoRipresa.completati || 0;
  let errori = statoRipresa.errori || 0;
  
  servizi.logger.info(`Generazione piani di lavoro: ${totaleClassi} classi da processare`);
  
  for (let i = indiceInizio; i < totaleClassi; i++) {
    const classe = classi[i];
    const nomeClasse = classe.ottieniNome();
    
    try {
      const pianoLavoro = new PianoLavoro();
      
      const risultato = pianoLavoro.genera({
        classe: nomeClasse
      });
      
      if (risultato.documentoCreato) {
        completati++;
        servizi.logger.info(`Piano lavoro generato per classe: ${nomeClasse}`);
      } else {
        errori++;
        servizi.logger.error(`Errore piano lavoro per classe: ${nomeClasse}`);
      }
    } catch (e) {
      errori++;
      servizi.logger.error(`Errore generazione piano lavoro classe ${nomeClasse}: ${e.message}`);
    }
    
    // Yield dello stato per permettere interruzione/ripresa
    yield {
      ultimoIndice: i + 1,
      completati: completati,
      errori: errori,
      percentuale: Math.round(((i + 1) / totaleClassi) * 100),
      classeCorrente: nomeClasse
    };
  }
  
  return {
    completati: completati,
    errori: errori,
    totale: totaleClassi
  };
}