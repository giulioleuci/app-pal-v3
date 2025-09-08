/**
 * Funzione di test per verificare il corretto funzionamento della classe ClasseArticolata
 * Usa il GestoreClassi per identificare e gestire le classi articolate
 */
function testClasseArticolata() {
  // Inizializzazione dei servizi di base necessari
  const logger = new MyLoggerService({ livello: 'DEBUG' });
  logger.info("=== INIZIO TEST CLASSE ARTICOLATA ===");
  
  const cache = new MyCacheService();
  const utils = new MyUtilsService();
  
  try {
    // Inizializzazione del gestore del database anni scolastici
    logger.info("Inizializzazione GestoreDatabaseAnniScolastici...");
    const gestoreDB = new GestoreDatabaseAnniScolastici(logger, cache, utils, new MySpreadsheetService(logger, cache, utils));
    
    // Inizializzazione del gestore classi
    logger.info("Inizializzazione GestoreClassi...");
    const gestoreClassi = new GestoreClassi(logger, gestoreDB, cache, utils);
    const risultatoInizializzazione = gestoreClassi.inizializza();
    
    if (!risultatoInizializzazione) {
      logger.error("Errore nell'inizializzazione del gestore classi");
      return false;
    }
    
    // Ricerca delle classi articolate (classi che hanno ARTIC CHILD non vuoto)
    logger.info("Ricerca classi articolate principali...");
    
    // Query manuale per trovare le classi che hanno effettivamente figli articolati
    const query = gestoreDB.ottieniDatabaseAnnoAttuale().select()
      .from('CLASSI')
      .where('ARTIC CHILD', '!=', '');
      
    if (gestoreClassi.ottieniSoloAttivi()) {
      query.where('ATT', '=', true);
    }
    
    const righeArticolate = query.execute();
    logger.info(`Trovate ${righeArticolate.length} classi articolate principali`);
    
    if (righeArticolate.length === 0) {
      logger.warn("Nessuna classe articolata principale trovata. Impossibile proseguire il test.");
      return false;
    }
    
    // Selezione della prima classe articolata principale per il test
    const rigaArticolata = righeArticolate[0];
    logger.info(`Classe articolata principale selezionata per il test: ${rigaArticolata.CLASSE}`);
    
    const classeArticolataBase = gestoreClassi.ottieniPerNome(rigaArticolata.CLASSE);
    if (!classeArticolataBase) {
      logger.error(`Classe articolata ${rigaArticolata.CLASSE} non trovata nel gestore. Impossibile proseguire.`);
      return false;
    }
    
    // Recupero delle classi figlie (componenti dell'articolazione)
    logger.info("Recupero delle classi figlie...");
    
    // Ottieni le informazioni sull'articolazione
    const articTipo = classeArticolataBase.ottieniProprieta('ARTIC TIPO');
    const articChild = classeArticolataBase.ottieniArticChild();
    
    logger.info(`Tipo articolazione: ${articTipo}`);
    logger.info(`Classi figlie (articChild): ${articChild.join(', ')}`);
    
    if (!articChild || articChild.length === 0) {
      logger.error("Classe articolata senza figli. Impossibile proseguire.");
      return false;
    }
    
    // Recupero delle classi figlie complete
    const classiFiglie = [];
    for (const nomeClasseFiglia of articChild) {
      const classeFiglia = gestoreClassi.ottieniPerNome(nomeClasseFiglia);
      if (classeFiglia) {
        classiFiglie.push(classeFiglia);
        logger.info(`Classe figlia recuperata: ${classeFiglia.ottieniNome()}`);
      } else {
        logger.warn(`Classe figlia non trovata: ${nomeClasseFiglia}`);
      }
    }
    
    if (classiFiglie.length === 0) {
      logger.error("Nessuna classe figlia trovata. Impossibile proseguire.");
      return false;
    }
    
    // Creazione istanza ClasseArticolata
    logger.info("Creazione istanza di ClasseArticolata...");
    const classeArticolata = new ClasseArticolata(
      classeArticolataBase.dati,
      utils,
      gestoreDB,
      classiFiglie
    );
    
    // Test dei metodi di ClasseArticolata
    logger.info("=== TEST DEI METODI ===");
    
    // 1. Test ottieniAlunni
    logger.info("Test 1: ottieniAlunni()");
    const alunni = classeArticolata.ottieniAlunni();
    logger.info(`Numero alunni ottenuti: ${alunni.length}`);
    logger.debug(`Dettaglio primi 3 alunni: ${alunni.slice(0, 3).map(a => a.EMAIL || a['EMAIL ALUNNO']).join(', ')}`);
    
    // 2. Test ottieniNumeroAlunni
    logger.info("Test 2: ottieniNumeroAlunni()");
    const numeroAlunni = classeArticolata.ottieniNumeroAlunni();
    logger.info(`Numero alunni: ${numeroAlunni}`);
    
    // Verifica coerenza tra i due metodi
    if (alunni.length !== numeroAlunni) {
      logger.error(`Incoerenza nella conta degli alunni: ottieniAlunni().length=${alunni.length}, ottieniNumeroAlunni()=${numeroAlunni}`);
    } else {
      logger.info("Verifica coerenza alunni: OK");
    }
    
    // 3. Test ottieniMaterieComuni
    logger.info("Test 3: ottieniMaterieComuni()");
    const materieComuni = classeArticolata.ottieniMaterieComuni();
    logger.info(`Numero materie comuni: ${materieComuni.length}`);
    logger.debug(`Materie comuni: ${materieComuni.join(', ')}`);
    
    // 4. Test ottieniMaterieNonComuni per ogni articolazione
    logger.info("Test 4: ottieniMaterieNonComuni()");
    for (const classeFiglia of classiFiglie) {
      const indirizzo = classeFiglia.ottieniIndirizzo();
      logger.info(`Verifica materie non comuni per articolazione: ${indirizzo}`);
      
      try {
        const materieNonComuni = classeArticolata.ottieniMaterieNonComuni(indirizzo);
        logger.info(`Numero materie non comuni per ${indirizzo}: ${materieNonComuni.length}`);
        logger.debug(`Materie non comuni per ${indirizzo}: ${materieNonComuni.join(', ')}`);
      } catch (e) {
        logger.error(`Errore nel recupero materie non comuni per ${indirizzo}: ${e.message}`);
      }
    }
    
    // 5. Test ottieniDocenteMateriaComune
    if (materieComuni.length > 0) {
      logger.info("Test 5: ottieniDocenteMateriaComune()");
      const materiaComune = materieComuni[0];
      try {
        const docenteMateriaComune = classeArticolata.ottieniDocenteMateriaComune(materiaComune);
        logger.info(`Docente per materia comune ${materiaComune}: ${docenteMateriaComune ? docenteMateriaComune.join(', ') : 'Nessun docente'}`);
      } catch (e) {
        logger.error(`Errore nel recupero docente per materia comune ${materiaComune}: ${e.message}`);
      }
    } else {
      logger.warn("Test 5: Saltato - Nessuna materia comune trovata");
    }
    
    // 6. Test ottieniDocenteMateriaNonComune
    logger.info("Test 6: ottieniDocenteMateriaNonComune()");
    for (const classeFiglia of classiFiglie) {
      const indirizzo = classeFiglia.ottieniIndirizzo();
      try {
        const materieNonComuni = classeArticolata.ottieniMaterieNonComuni(indirizzo);
        
        if (materieNonComuni.length > 0) {
          const materiaNonComune = materieNonComuni[0];
          const docenteMateriaNonComune = classeArticolata.ottieniDocenteMateriaNonComune(materiaNonComune, indirizzo);
          
          logger.info(`Docente per materia non comune ${materiaNonComune} (${indirizzo}): ${docenteMateriaNonComune ? docenteMateriaNonComune.join(', ') : 'Nessun docente'}`);
        } else {
          logger.warn(`Nessuna materia non comune trovata per l'indirizzo ${indirizzo}`);
        }
      } catch (e) {
        logger.error(`Errore nel test ottieniDocenteMateriaNonComune per ${indirizzo}: ${e.message}`);
      }
    }
    
    // 7. Verifica che ogni materia sia classificata correttamente
    logger.info("Test 7: Verifica classificazione materie");
    const materieTotali = [];
    
    // Raccogliamo tutte le materie disponibili dalle classi figlie
    for (const classeFiglia of classiFiglie) {
      const sigleMaterie = gestoreDB.ottieniSigleMaterie();
      for (const sigla of sigleMaterie) {
        if (!materieTotali.includes(sigla) && classeFiglia.ottieniDocenteMateria(sigla).length > 0) {
          materieTotali.push(sigla);
        }
      }
    }
    
    logger.info(`Totale materie trovate: ${materieTotali.length}`);
    
    // Per ogni materia, verifichiamo se è classificata come comune o non comune
    for (const materia of materieTotali) {
      const isComune = materieComuni.includes(materia);
      
      // Verifichiamo se è presente in tutte le classi figlie con lo stesso docente
      let presenteInTutte = true;
      let docenteRiferimento = null;
      
      for (const classeFiglia of classiFiglie) {
        const docentiMateria = classeFiglia.ottieniDocenteMateria(materia);
        
        if (docentiMateria.length === 0) {
          presenteInTutte = false;
          break;
        }
        
        if (docenteRiferimento === null) {
          docenteRiferimento = docentiMateria.join(',');
        } else if (docenteRiferimento !== docentiMateria.join(',')) {
          presenteInTutte = false;
          break;
        }
      }
      
      if (isComune !== presenteInTutte) {
        logger.error(`Incoerenza nella classificazione della materia ${materia}: isComune=${isComune}, presenteInTutteLeClassi=${presenteInTutte}`);
      }
    }
    
    logger.info("=== FINE TEST CLASSE ARTICOLATA ===");
    return true;
    
  } catch (e) {
    logger.error(`Errore generale nel test della classe articolata: ${e.message}`);
    logger.error(e.stack);
    return false;
  }
}

/**
 * Funzione per eseguire il test e stampare i risultati su console/log
 */
function eseguiTestClasseArticolata() {
  try {
    const risultato = testClasseArticolata();
    console.log(`Test completato con ${risultato ? 'successo' : 'errori'}`);
  } catch (e) {
    console.error(`Eccezione durante l'esecuzione del test: ${e.message}`);
    console.error(e.stack);
  }
}