/**
 * Funzione principale che esegue tutti i test per i gestori e le entità
 * Esegue nell'ordine tutti i test implementati
 */
function eseguiTuttiITest() {
  // Imposta il livello di logging per i test
  const logger = new MyLoggerService({ livello: 'INFO' });
  logger.info("=== INIZIO ESECUZIONE TEST GESTORI E ENTITÀ ===");
  
  try {
    // Test GestoreAlunni e Alunno
    logger.info("\n\n");
    logger.info("Esecuzione test GestoreAlunni e Alunno");
    const risultatoTestAlunni = testGestoreAlunni();
    logger.info(risultatoTestAlunni);
    
    // Test GestoreClassi e Classe
    logger.info("\n\n");
    logger.info("Esecuzione test GestoreClassi e Classe");
    const risultatoTestClassi = testGestoreClassi();
    logger.info(risultatoTestClassi);
    
    // Test GestoreDocenti e Docente
    logger.info("\n\n");
    logger.info("Esecuzione test GestoreDocenti e Docente");
    const risultatoTestDocenti = testGestoreDocenti();
    logger.info(risultatoTestDocenti);
    
    // Test GestoreMaterie e Materia
    logger.info("\n\n");
    logger.info("Esecuzione test GestoreMaterie e Materia");
    const risultatoTestMaterie = testGestoreMaterie();
    logger.info(risultatoTestMaterie);
    
    // Test GestoreDocumenti e Documento
    logger.info("\n\n");
    logger.info("Esecuzione test GestoreDocumenti e Documento");
    const risultatoTestDocumenti = testGestoreDocumenti();
    logger.info(risultatoTestDocumenti);
    
    // Test GestoreCarenze e Carenza
    logger.info("\n\n");
    logger.info("Esecuzione test GestoreCarenze e Carenza");
    const risultatoTestCarenze = testGestoreCarenze();
    logger.info(risultatoTestCarenze);
    
    // Test GestoreProgetti e Progetto
    logger.info("\n\n");
    logger.info("Esecuzione test GestoreProgetti e Progetto");
    const risultatoTestProgetti = testGestoreProgetti();
    logger.info(risultatoTestProgetti);
    
    logger.info("\n\n");
    logger.info("=== FINE ESECUZIONE TEST GESTORI E ENTITÀ ===");
    return "Tutti i test sono stati completati con successo";
  } catch (e) {
    logger.error("Errore durante l'esecuzione dei test: " + e.message);
    return "Si sono verificati errori durante l'esecuzione dei test";
  }
}

/**
 * Funzione per eseguire singolarmente il test di un gestore e della sua entità
 * @param {string} nomeTest - Nome del test da eseguire
 */
function eseguiTest(nomeTest) {
  const logger = new MyLoggerService({ livello: 'INFO' });
  logger.info("Esecuzione test specifico: " + nomeTest);
  
  try {
    switch (nomeTest.toLowerCase()) {
      case "alunni":
        return testGestoreAlunni();
      case "classi":
        return testGestoreClassi();
      case "docenti":
        return testGestoreDocenti();
      case "materie":
        return testGestoreMaterie();
      case "documenti":
        return testGestoreDocumenti();
      case "carenze":
        return testGestoreCarenze();
      case "progetti":
        return testGestoreProgetti();
      default:
        logger.warn("Test non riconosciuto: " + nomeTest);
        return "Test non riconosciuto. I test disponibili sono: alunni, classi, docenti, materie, documenti, carenze, progetti";
    }
  } catch (e) {
    logger.error("Errore durante l'esecuzione del test " + nomeTest + ": " + e.message);
    return "Si è verificato un errore durante l'esecuzione del test";
  }
}

/**
 * Funzione per testare il GestoreAlunni e l'entità Alunno
 * @returns {string} Messaggio di completamento test
 */
function testGestoreAlunni() {
  Logger.log("=== Test GestoreAlunni e Alunno ===");
  
  // Inizializza i servizi necessari
  const logger = new MyLoggerService({ livello: 'INFO' });
  const cache = new MyCacheService();
  const utils = new MyUtilsService();
  const spreadsheetService = new MySpreadsheetService(logger, cache, utils);
  const gestoreDB = new GestoreDatabaseAnniScolastici(logger, cache, utils, spreadsheetService);
  
  // Instanzia il gestore
  const gestoreAlunni = new GestoreAlunni(logger, gestoreDB, cache, utils);
  
  // Test del metodo inizializza
  Logger.log("Metodo: inizializza()");
  const risultatoInizializza = gestoreAlunni.inizializza();
  Logger.log("Risultato: " + risultatoInizializza);
  
  // Test del metodo caricaDati
  Logger.log("Metodo: caricaDati()");
  const alunni = gestoreAlunni.caricaDati();
  Logger.log("Risultato: " + (alunni ? alunni.length + " alunni caricati" : "Nessun alunno caricato"));
  
  // Test del metodo impostaSoloAttivi
  Logger.log("Metodo: impostaSoloAttivi(false)");
  gestoreAlunni.impostaSoloAttivi(false);
  Logger.log("Risultato: soloAttivi = " + gestoreAlunni.ottieniSoloAttivi());
  
  // Test del metodo ottieniSoloAttivi
  Logger.log("Metodo: ottieniSoloAttivi()");
  const soloAttivi = gestoreAlunni.ottieniSoloAttivi();
  Logger.log("Risultato: " + soloAttivi);
  
  // Test del metodo ottieniPerId
  Logger.log("Metodo: ottieniPerId()");
  if (alunni && alunni.length > 0) {
    const primoAlunno = alunni[0];
    const id = primoAlunno.ottieniEmail();
    const alunnoPerId = gestoreAlunni.ottieniPerId(id);
    Logger.log("Parametri: " + id);
    Logger.log("Risultato: " + (alunnoPerId ? "Alunno trovato: " + alunnoPerId.ottieniNomeCompleto() : "Alunno non trovato"));
  } else {
    Logger.log("Non ci sono alunni per testare ottieniPerId()");
  }
  
  // Test del metodo filtra
  Logger.log("Metodo: filtra()");
  const alunniFiltrati = gestoreAlunni.filtra(alunno => alunno.ottieniClasse() === "1A LC");
  Logger.log("Parametri: alunno => alunno.ottieniClasse() === '1A LC'");
  Logger.log("Risultato: " + (alunniFiltrati ? alunniFiltrati.length + " alunni filtrati" : "Nessun alunno filtrato"));
  
  // Test del metodo ottieniPerEmail
  Logger.log("Metodo: ottieniPerEmail()");
  if (alunni && alunni.length > 0) {
    const email = alunni[0].ottieniEmail();
    const alunnoPerEmail = gestoreAlunni.ottieniPerEmail(email);
    Logger.log("Parametri: " + email);
    Logger.log("Risultato: " + (alunnoPerEmail ? "Alunno trovato: " + alunnoPerEmail.ottieniNomeCompleto() : "Alunno non trovato"));
  } else {
    Logger.log("Non ci sono alunni per testare ottieniPerEmail()");
  }
  
  // Test del metodo ottieniPerClasse
  Logger.log("Metodo: ottieniPerClasse('1A LC')");
  const alunniPerClasse = gestoreAlunni.ottieniPerClasse("1A LC");
  Logger.log("Parametri: '1A LC'");
  Logger.log("Risultato: " + (alunniPerClasse ? alunniPerClasse.length + " alunni trovati" : "Nessun alunno trovato"));
  
  // Test del metodo ottieniPerReligione
  Logger.log("Metodo: ottieniPerReligione('Si')");
  const alunniReligione = gestoreAlunni.ottieniPerReligione("Si");
  Logger.log("Parametri: 'Si'");
  Logger.log("Risultato: " + (alunniReligione ? alunniReligione.length + " alunni trovati" : "Nessun alunno trovato"));
  
  // Test del metodo ottieniRappresentanti
  Logger.log("Metodo: ottieniRappresentanti()");
  const rappresentanti = gestoreAlunni.ottieniRappresentanti();
  Logger.log("Risultato: " + (rappresentanti ? rappresentanti.length + " rappresentanti trovati" : "Nessun rappresentante trovato"));
  
  // Test del metodo ottieniRipetenti
  Logger.log("Metodo: ottieniRipetenti()");
  const ripetenti = gestoreAlunni.ottieniRipetenti();
  Logger.log("Risultato: " + (ripetenti ? ripetenti.length + " ripetenti trovati" : "Nessun ripetente trovato"));
  
  // Test del metodo cercaPerNome
  Logger.log("Metodo: cercaPerNome('Mario')");
  const alunniPerNome = gestoreAlunni.cercaPerNome("Mario");
  Logger.log("Parametri: 'Mario'");
  Logger.log("Risultato: " + (alunniPerNome ? alunniPerNome.length + " alunni trovati" : "Nessun alunno trovato"));
  
  // Test del metodo ottieniConPianiPersonalizzati
  Logger.log("Metodo: ottieniConPianiPersonalizzati()");
  const alunniConPiani = gestoreAlunni.ottieniConPianiPersonalizzati();
  Logger.log("Risultato: " + (alunniConPiani ? alunniConPiani.length + " alunni trovati" : "Nessun alunno trovato"));
  
  // Test dei metodi della classe Alunno
  if (alunni && alunni.length > 0) {
    const alunno = alunni[0];
    Logger.log("\n=== Test Alunno ===");
    
    Logger.log("Metodo: ottieniEmail()");
    Logger.log("Risultato: " + alunno.ottieniEmail());
    
    Logger.log("Metodo: ottieniNomeCompleto()");
    Logger.log("Risultato: " + alunno.ottieniNomeCompleto());
    
    Logger.log("Metodo: ottieniClasse()");
    Logger.log("Risultato: " + alunno.ottieniClasse());
    
    Logger.log("Metodo: ottieniReligione()");
    Logger.log("Risultato: " + alunno.ottieniReligione());
    
    Logger.log("Metodo: isRappresentante()");
    Logger.log("Risultato: " + alunno.isRappresentante());
    
    Logger.log("Metodo: isRipetente()");
    Logger.log("Risultato: " + alunno.isRipetente());
    
    Logger.log("Metodo: ottieniEmailTutor1()");
    Logger.log("Risultato: " + alunno.ottieniEmailTutor1());
    
    Logger.log("Metodo: ottieniEmailTutor2()");
    Logger.log("Risultato: " + alunno.ottieniEmailTutor2());
    
    Logger.log("Metodo: ottieniNote()");
    Logger.log("Risultato: " + alunno.ottieniNote());
    
    Logger.log("Metodo: ottieniPianiPersonalizzati()");
    const pianiPersonalizzati = alunno.ottieniPianiPersonalizzati();
    Logger.log("Risultato: " + (pianiPersonalizzati ? pianiPersonalizzati.length + " piani trovati" : "Nessun piano trovato"));
    
    Logger.log("Metodo: ottieniTrasferimenti()");
    const trasferimenti = alunno.ottieniTrasferimenti();
    Logger.log("Risultato: " + (trasferimenti ? trasferimenti.length + " trasferimenti trovati" : "Nessun trasferimento trovato"));
  }
  
  return "Test GestoreAlunni e Alunno completati";
}


/**
 * Funzione per testare il GestoreClassi e l'entità Classe
 * @returns {string} Messaggio di completamento test
 */
function testGestoreClassi() {
  Logger.log("=== Test GestoreClassi e Classe ===");
  
  // Inizializza i servizi necessari
  const logger = new MyLoggerService({ livello: 'INFO' });
  const cache = new MyCacheService();
  const utils = new MyUtilsService();
  const spreadsheetService = new MySpreadsheetService(logger, cache, utils);
  const gestoreDB = new GestoreDatabaseAnniScolastici(logger, cache, utils, spreadsheetService);
  
  // Instanzia il gestore
  const gestoreClassi = new GestoreClassi(logger, gestoreDB, cache, utils);
  
  // Test del metodo inizializza
  Logger.log("Metodo: inizializza()");
  const risultatoInizializza = gestoreClassi.inizializza();
  Logger.log("Risultato: " + risultatoInizializza);
  
  // Test del metodo caricaDati
  Logger.log("Metodo: caricaDati()");
  const classi = gestoreClassi.caricaDati();
  Logger.log("Risultato: " + (classi ? classi.length + " classi caricate" : "Nessuna classe caricata"));
  
  // Test del metodo impostaSoloAttivi
  Logger.log("Metodo: impostaSoloAttivi(false)");
  gestoreClassi.impostaSoloAttivi(false);
  Logger.log("Risultato: soloAttivi = " + gestoreClassi.ottieniSoloAttivi());
  
  // Test del metodo ottieniSoloAttivi
  Logger.log("Metodo: ottieniSoloAttivi()");
  const soloAttivi = gestoreClassi.ottieniSoloAttivi();
  Logger.log("Risultato: " + soloAttivi);
  
  // Test del metodo ottieniPerId
  Logger.log("Metodo: ottieniPerId()");
  if (classi && classi.length > 0) {
    const primaClasse = classi[0];
    const id = primaClasse.ottieniNome();
    const classePerId = gestoreClassi.ottieniPerId(id);
    Logger.log("Parametri: " + id);
    Logger.log("Risultato: " + (classePerId ? "Classe trovata: " + classePerId.ottieniNome() : "Classe non trovata"));
  } else {
    Logger.log("Non ci sono classi per testare ottieniPerId()");
  }
  
  // Test del metodo filtra
  Logger.log("Metodo: filtra()");
  const classiFiltrate = gestoreClassi.filtra(classe => classe.ottieniAnnoCorso() === 1);
  Logger.log("Parametri: classe => classe.ottieniAnnoCorso() === 1");
  Logger.log("Risultato: " + (classiFiltrate ? classiFiltrate.length + " classi filtrate" : "Nessuna classe filtrata"));
  
  // Test del metodo ottieniPerNome
  Logger.log("Metodo: ottieniPerNome('1A LC')");
  const classePerNome = gestoreClassi.ottieniPerNome("1A LC");
  Logger.log("Parametri: '1A LC'");
  Logger.log("Risultato: " + (classePerNome ? "Classe trovata: " + classePerNome.ottieniNome() : "Classe non trovata"));
  
  // Test del metodo ottieniClassiAttive
  Logger.log("Metodo: ottieniClassiAttive()");
  const classiAttive = gestoreClassi.ottieniClassiAttive();
  Logger.log("Risultato: " + (classiAttive ? classiAttive.length + " classi attive trovate" : "Nessuna classe attiva trovata"));
  
  // Test del metodo ottieniPerAnnoCorso
  Logger.log("Metodo: ottieniPerAnnoCorso(1)");
  const classiPerAnno = gestoreClassi.ottieniPerAnnoCorso(1);
  Logger.log("Parametri: 1");
  Logger.log("Risultato: " + (classiPerAnno ? classiPerAnno.length + " classi trovate" : "Nessuna classe trovata"));
  
  // Test del metodo ottieniClassiBiennio
  Logger.log("Metodo: ottieniClassiBiennio()");
  const classiBiennio = gestoreClassi.ottieniClassiBiennio();
  Logger.log("Risultato: " + (classiBiennio ? classiBiennio.length + " classi trovate" : "Nessuna classe trovata"));
  
  // Test del metodo ottieniClassiTriennio
  Logger.log("Metodo: ottieniClassiTriennio()");
  const classiTriennio = gestoreClassi.ottieniClassiTriennio();
  Logger.log("Risultato: " + (classiTriennio ? classiTriennio.length + " classi trovate" : "Nessuna classe trovata"));
  
  // Test del metodo ottieniPerIndirizzo
  Logger.log("Metodo: ottieniPerIndirizzo('CLA')");
  const classiPerIndirizzo = gestoreClassi.ottieniPerIndirizzo("CLA");
  Logger.log("Parametri: 'CLA'");
  Logger.log("Risultato: " + (classiPerIndirizzo ? classiPerIndirizzo.length + " classi trovate" : "Nessuna classe trovata"));
  
  // Test del metodo ottieniClassiArticolate
  Logger.log("Metodo: ottieniClassiArticolate()");
  const classiArticolate = gestoreClassi.ottieniClassiArticolate();
  Logger.log("Risultato: " + (classiArticolate ? classiArticolate.length + " classi articolate trovate" : "Nessuna classe articolata trovata"));
  
  // Test del metodo ottieniPerCoordinatore
  Logger.log("Metodo: ottieniPerCoordinatore('coordinatore@scuola.edu')");
  const classiPerCoordinatore = gestoreClassi.ottieniPerCoordinatore("coordinatore@scuola.edu");
  Logger.log("Parametri: 'coordinatore@scuola.edu'");
  Logger.log("Risultato: " + (classiPerCoordinatore ? classiPerCoordinatore.length + " classi trovate" : "Nessuna classe trovata"));
  
  // Test del metodo ottieniPerDocente
  Logger.log("Metodo: ottieniPerDocente('docente@scuola.edu', 'FIS')");
  const classiPerDocente = gestoreClassi.ottieniPerDocente("docente@scuola.edu", "FIS");
  Logger.log("Parametri: 'docente@scuola.edu', 'FIS'");
  Logger.log("Risultato: " + (classiPerDocente ? classiPerDocente.length + " classi trovate" : "Nessuna classe trovata"));
  
  // Test dei metodi della classe Classe
  if (classi && classi.length > 0) {
    const classe = classi[0];
    Logger.log("\n=== Test Classe ===");
    
    Logger.log("Metodo: ottieniMappaDocentiMaterie()");
    const mappaDocentiMaterie = classe.ottieniMappaDocentiMaterie();
    Logger.log("Risultato: " + (mappaDocentiMaterie ? "Mappa ottenuta con " + Object.keys(mappaDocentiMaterie).length + " materie" : "Nessuna mappa ottenuta"));
    
    Logger.log("Metodo: ottieniNome()");
    Logger.log("Risultato: " + classe.ottieniNome());
    
    Logger.log("Metodo: ottieniAnnoCorso()");
    Logger.log("Risultato: " + classe.ottieniAnnoCorso());
    
    Logger.log("Metodo: ottieniSezione()");
    Logger.log("Risultato: " + classe.ottieniSezione());
    
    Logger.log("Metodo: ottieniIndirizzo()");
    Logger.log("Risultato: " + classe.ottieniIndirizzo());
    
    Logger.log("Metodo: ottieniCoordinatore()");
    const coordinatori = classe.ottieniCoordinatore();
    Logger.log("Risultato: " + (coordinatori ? coordinatori.join(", ") : "Nessun coordinatore"));
    
    Logger.log("Metodo: ottieniTutorPCTO()");
    const tutorPCTO = classe.ottieniTutorPCTO();
    Logger.log("Risultato: " + (tutorPCTO ? tutorPCTO.join(", ") : "Nessun tutor PCTO"));
    
    Logger.log("Metodo: ottieniTutorOrientamento()");
    const tutorOrientamento = classe.ottieniTutorOrientamento();
    Logger.log("Risultato: " + (tutorOrientamento ? tutorOrientamento.join(", ") : "Nessun tutor orientamento"));
    
    Logger.log("Metodo: isAttiva()");
    Logger.log("Risultato: " + classe.isAttiva());
    
    Logger.log("Metodo: isArticolata()");
    Logger.log("Risultato: " + classe.isArticolata());
    
    Logger.log("Metodo: ottieniElencoSigleMaterie()");
    const sigleMaterie = classe.ottieniElencoSigleMaterie();
    Logger.log("Risultato: " + (sigleMaterie ? sigleMaterie.join(", ") : "Nessuna materia"));
    
    Logger.log("Metodo: ottieniDocenteMateria('ITA')");
    const docentiMateria = classe.ottieniDocenteMateria("ITA");
    Logger.log("Parametri: 'ITA'");
    Logger.log("Risultato: " + (docentiMateria ? docentiMateria.join(", ") : "Nessun docente"));
    
    Logger.log("Metodo: ottieniAlunni()");
    const alunni = classe.ottieniAlunni();
    Logger.log("Risultato: " + (alunni ? alunni.length + " alunni trovati" : "Nessun alunno trovato"));
    
    Logger.log("Metodo: ottieniDocumenti()");
    const documenti = classe.ottieniDocumenti();
    Logger.log("Risultato: " + (documenti ? documenti.length + " documenti trovati" : "Nessun documento trovato"));
    
    Logger.log("Metodo: ottieniCartelle()");
    const cartelle = classe.ottieniCartelle();
    Logger.log("Risultato: " + (cartelle ? cartelle.length + " cartelle trovate" : "Nessuna cartella trovata"));
    
    Logger.log("Metodo: ottieniArticParent()");
    Logger.log("Risultato: " + classe.ottieniArticParent());
    
    Logger.log("Metodo: ottieniArticChild()");
    const articChild = classe.ottieniArticChild();
    Logger.log("Risultato: " + (articChild ? articChild.join(", ") : "Nessuna classe child"));
    
    Logger.log("Metodo: ottieniArticFusion()");
    Logger.log("Risultato: " + classe.ottieniArticFusion());
    
    Logger.log("Metodo: ottieniProgettoPCTO()");
    const progettoPCTO = classe.ottieniProgettoPCTO();
    Logger.log("Risultato: " + (progettoPCTO ? progettoPCTO["NOME PROGETTO"] : "Nessun progetto PCTO"));
    
    Logger.log("Metodo: ottieniProgettoOrient()");
    const progettoOrient = classe.ottieniProgettoOrient();
    Logger.log("Risultato: " + (progettoOrient ? progettoOrient["NOME PROGETTO"] : "Nessun progetto orientamento"));
    
    Logger.log("Metodo: ottieniOrePCTO()");
    Logger.log("Risultato: " + classe.ottieniOrePCTO());
    
    Logger.log("Metodo: ottieniOreOrient()");
    Logger.log("Risultato: " + classe.ottieniOreOrient());
    
    Logger.log("Metodo: ottieniProgetti()");
    const progetti = classe.ottieniProgetti();
    Logger.log("Risultato: " + (progetti ? progetti.length + " progetti trovati" : "Nessun progetto trovato"));
  }
  
  return "Test GestoreClassi e Classe completati";
}

/**
 * Funzione per testare il GestoreDocenti e l'entità Docente
 * @returns {string} Messaggio di completamento test
 */
function testGestoreDocenti() {
  Logger.log("=== Test GestoreDocenti e Docente ===");
  
  // Inizializza i servizi necessari
  const logger = new MyLoggerService({ livello: 'INFO' });
  const cache = new MyCacheService();
  const utils = new MyUtilsService();
  const spreadsheetService = new MySpreadsheetService(logger, cache, utils);
  const gestoreDB = new GestoreDatabaseAnniScolastici(logger, cache, utils, spreadsheetService);
  
  // Instanzia il gestore
  const gestoreDocenti = new GestoreDocenti(logger, gestoreDB, cache, utils);
  
  // Test del metodo inizializza
  Logger.log("Metodo: inizializza()");
  const risultatoInizializza = gestoreDocenti.inizializza();
  Logger.log("Risultato: " + risultatoInizializza);
  
  // Test del metodo caricaDati
  Logger.log("Metodo: caricaDati()");
  const docenti = gestoreDocenti.caricaDati();
  Logger.log("Risultato: " + (docenti ? docenti.length + " docenti caricati" : "Nessun docente caricato"));
  
  // Test del metodo ottieniPerId
  Logger.log("Metodo: ottieniPerId()");
  if (docenti && docenti.length > 0) {
    const primoDocente = docenti[0];
    const id = primoDocente.ottieniEmail();
    const docentePerId = gestoreDocenti.ottieniPerId(id);
    Logger.log("Parametri: " + id);
    Logger.log("Risultato: " + (docentePerId ? "Docente trovato: " + docentePerId.ottieniNomeCompleto() : "Docente non trovato"));
  } else {
    Logger.log("Non ci sono docenti per testare ottieniPerId()");
  }
  
  // Test del metodo filtra
  Logger.log("Metodo: filtra()");
  const docentiFiltrati = gestoreDocenti.filtra(docente => docente.ottieniDipartimento() === "ITA");
  Logger.log("Parametri: docente => docente.ottieniDipartimento() === 'ITA'");
  Logger.log("Risultato: " + (docentiFiltrati ? docentiFiltrati.length + " docenti filtrati" : "Nessun docente filtrato"));
  
  // Test del metodo ottieniPerEmail
  Logger.log("Metodo: ottieniPerEmail('docente@scuola.edu')");
  const docentePerEmail = gestoreDocenti.ottieniPerEmail('leuci.giulio@pietroaldi.com');
  Logger.log("Parametri: 'docente@scuola.edu'");
  Logger.log("Risultato: " + (docentePerEmail ? "Docente trovato: " + docentePerEmail.ottieniNomeCompleto() : "Docente non trovato"));
  Logger.log("Risultato: " + (docentePerEmail ? "Docente trovato: " + docentePerEmail.ottieniEmail() : "Docente non trovato"));
  
  // Test del metodo ottieniPerDipartimento
  Logger.log("Metodo: ottieniPerDipartimento('LETT')");
  const docentiPerDipartimento = gestoreDocenti.ottieniPerDipartimento("LETT");
  Logger.log("Parametri: 'LETT'");
  Logger.log("Risultato: " + (docentiPerDipartimento ? docentiPerDipartimento.length + " docenti trovati" : "Nessun docente trovato"));
  
  // Test del metodo ottieniCoordinatori
  Logger.log("Metodo: ottieniCoordinatori()");
  const coordinatori = gestoreDocenti.ottieniCoordinatori();
  Logger.log("Risultato: " + (coordinatori ? coordinatori.length + " coordinatori trovati" : "Nessun coordinatore trovato"));
  
  // Test del metodo ottieniTutor
  Logger.log("Metodo: ottieniTutor()");
  const tutor = gestoreDocenti.ottieniTutor();
  Logger.log("Risultato: " + (tutor ? tutor.length + " tutor trovati" : "Nessun tutor trovato"));
  
  // Test del metodo cercaPerNome
  Logger.log("Metodo: cercaPerNome('Mario')");
  const docentiPerNome = gestoreDocenti.cercaPerNome("Mario");
  Logger.log("Parametri: 'Mario'");
  Logger.log("Risultato: " + (docentiPerNome ? docentiPerNome.length + " docenti trovati" : "Nessun docente trovato"));
  
  // Test del metodo ottieniConSupplenzeAttive
  Logger.log("Metodo: ottieniConSupplenzeAttive()");
  const data = new Date();
  const docentiConSupplenze = gestoreDocenti.ottieniConSupplenzeAttive(data);
  Logger.log("Parametri: " + data);
  Logger.log("Risultato: " + (docentiConSupplenze ? docentiConSupplenze.length + " docenti trovati" : "Nessun docente trovato"));
  
  // Test dei metodi della classe Docente
  if (docenti && docenti.length > 0) {
    const docente = docenti[0];
    Logger.log("\n=== Test Docente ===");
    
    Logger.log("Metodo: ottieniNome()");
    Logger.log("Risultato: " + docente.ottieniNome());
    
    Logger.log("Metodo: ottieniCognome()");
    Logger.log("Risultato: " + docente.ottieniCognome());
    
    Logger.log("Metodo: ottieniEmail()");
    Logger.log("Risultato: " + docente.ottieniEmail());
    
    Logger.log("Metodo: ottieniNomeCompleto()");
    Logger.log("Risultato: " + docente.ottieniNomeCompleto());
    
    Logger.log("Metodo: ottieniDipartimento()");
    Logger.log("Risultato: " + docente.ottieniDipartimento());
    
    Logger.log("Metodo: ottieniGenere()");
    Logger.log("Risultato: " + docente.ottieniGenere());
    
    Logger.log("Metodo: ottieniClassiCoordinate()");
    const classiCoordinate = docente.ottieniClassiCoordinate();
    Logger.log("Risultato: " + (classiCoordinate ? classiCoordinate.length + " classi trovate" : "Nessuna classe trovata"));
    
    Logger.log("Metodo: ottieniClassiTutorPCTO()");
    const classiTutorPCTO = docente.ottieniClassiTutorPCTO();
    Logger.log("Risultato: " + (classiTutorPCTO ? classiTutorPCTO.length + " classi trovate" : "Nessuna classe trovata"));
    
    Logger.log("Metodo: ottieniClassiTutorOrientamento()");
    const classiTutorOrientamento = docente.ottieniClassiTutorOrientamento();
    Logger.log("Risultato: " + (classiTutorOrientamento ? classiTutorOrientamento.length + " classi trovate" : "Nessuna classe trovata"));
    
    Logger.log("Metodo: ottieniRuoli()");
    const ruoli = docente.ottieniRuoli();
    Logger.log("Risultato: " + (ruoli ? ruoli.length + " ruoli trovati" : "Nessun ruolo trovato"));
    
    Logger.log("Metodo: ottieniSupplenzeTitolare()");
    const supplenzeTitolare = docente.ottieniSupplenzeTitolare();
    Logger.log("Risultato: " + (supplenzeTitolare ? supplenzeTitolare.length + " supplenze trovate" : "Nessuna supplenza trovata"));
    
    Logger.log("Metodo: ottieniSupplenzeSupplente()");
    const supplenzeSupplente = docente.ottieniSupplenzeSupplente();
    Logger.log("Risultato: " + (supplenzeSupplente ? supplenzeSupplente.length + " supplenze trovate" : "Nessuna supplenza trovata"));
  }
  
  return "Test GestoreDocenti e Docente completati";
}

/**
 * Funzione per testare il GestoreMaterie e l'entità Materia
 * @returns {string} Messaggio di completamento test
 */
function testGestoreMaterie() {
  Logger.log("=== Test GestoreMaterie e Materia ===");
  
  // Inizializza i servizi necessari
  const logger = new MyLoggerService({ livello: 'INFO' });
  const cache = new MyCacheService();
  const utils = new MyUtilsService();
  const spreadsheetService = new MySpreadsheetService(logger, cache, utils);
  const gestoreDB = new GestoreDatabaseAnniScolastici(logger, cache, utils, spreadsheetService);
  
  // Instanzia il gestore
  const gestoreMaterie = new GestoreMaterie(logger, gestoreDB, cache, utils);
  
  // Test del metodo inizializza
  Logger.log("Metodo: inizializza()");
  const risultatoInizializza = gestoreMaterie.inizializza();
  Logger.log("Risultato: " + risultatoInizializza);
  
  // Test del metodo caricaDati
  Logger.log("Metodo: caricaDati()");
  const materie = gestoreMaterie.caricaDati();
  Logger.log("Risultato: " + (materie ? materie.length + " materie caricate" : "Nessuna materia caricata"));
  
  // Test del metodo ottieniPerId
  Logger.log("Metodo: ottieniPerId()");
  if (materie && materie.length > 0) {
    const primaMateria = materie[0];
    const id = primaMateria.ottieniSigla();
    const materiaPerId = gestoreMaterie.ottieniPerId(id);
    Logger.log("Parametri: " + id);
    Logger.log("Risultato: " + (materiaPerId ? "Materia trovata: " + materiaPerId.ottieniNome() : "Materia non trovata"));
  } else {
    Logger.log("Non ci sono materie per testare ottieniPerId()");
  }
  
  // Test del metodo filtra
  Logger.log("Metodo: filtra()");
  const materieFiltrate = gestoreMaterie.filtra(materia => materia.ottieniSigla().startsWith("M"));
  Logger.log("Parametri: materia => materia.ottieniSigla().startsWith('M')");
  Logger.log("Risultato: " + (materieFiltrate ? materieFiltrate.length + " materie filtrate" : "Nessuna materia filtrata"));
  
  // Test del metodo ottieniPerSigla
  Logger.log("Metodo: ottieniPerSigla('MAT')");
  const materiaPerSigla = gestoreMaterie.ottieniPerSigla("MAT");
  Logger.log("Parametri: 'MAT'");
  Logger.log("Risultato: " + (materiaPerSigla ? "Materia trovata: " + materiaPerSigla.ottieniNome() : "Materia non trovata"));
  
  // Test del metodo ottieniPerCorsoRecupero
  Logger.log("Metodo: ottieniPerCorsoRecupero()");
  const materieRecupero = gestoreMaterie.ottieniPerCorsoRecupero();
  Logger.log("Risultato: " + (materieRecupero ? materieRecupero.length + " materie trovate" : "Nessuna materia trovata"));
  
  // Test del metodo ottieniPerCorsoRecupero con indirizzo
  Logger.log("Metodo: ottieniPerCorsoRecupero('CLA')");
  const materieRecuperoIndirizzo = gestoreMaterie.ottieniPerCorsoRecupero("CLA");
  Logger.log("Parametri: 'CLA'");
  Logger.log("Risultato: " + (materieRecuperoIndirizzo ? materieRecuperoIndirizzo.length + " materie trovate" : "Nessuna materia trovata"));
  
  // Test del metodo ottieniPerEsame - prima prova
  Logger.log("Metodo: ottieniPerEsame(true)");
  const materiePrimaProva = gestoreMaterie.ottieniPerEsame(true);
  Logger.log("Parametri: true");
  Logger.log("Risultato: " + (materiePrimaProva ? materiePrimaProva.length + " materie trovate" : "Nessuna materia trovata"));
  
  // Test del metodo ottieniPerEsame - seconda prova
  Logger.log("Metodo: ottieniPerEsame(false)");
  const materieSecondaProva = gestoreMaterie.ottieniPerEsame(false);
  Logger.log("Parametri: false");
  Logger.log("Risultato: " + (materieSecondaProva ? materieSecondaProva.length + " materie trovate" : "Nessuna materia trovata"));
  
  // Test del metodo ottieniPerEsame con indirizzo
  Logger.log("Metodo: ottieniPerEsame(true, 'CLA')");
  const materiePrimaProvaIndirizzo = gestoreMaterie.ottieniPerEsame(true, "CLA");
  Logger.log("Parametri: true, 'LS'");
  Logger.log("Risultato: " + (materiePrimaProvaIndirizzo ? materiePrimaProvaIndirizzo.length + " materie trovate" : "Nessuna materia trovata"));
  
  // Test dei metodi della classe Materia
  if (materie && materie.length > 0) {
    const materia = materie[0];
    Logger.log("\n=== Test Materia ===");
    
    Logger.log("Metodo: ottieniSigla()");
    Logger.log("Risultato: " + materia.ottieniSigla());
    
    Logger.log("Metodo: ottieniNome()");
    Logger.log("Risultato: " + materia.ottieniNome());
    
    Logger.log("Metodo: ottieniNomeSintesi()");
    Logger.log("Risultato: " + materia.ottieniNomeSintesi());
    
    Logger.log("Metodo: ottieniColore1()");
    Logger.log("Risultato: " + materia.ottieniColore1());
    
    Logger.log("Metodo: ottieniColore2()");
    Logger.log("Risultato: " + materia.ottieniColore2());
    
    Logger.log("Metodo: ottieniSimbolo()");
    Logger.log("Risultato: " + materia.ottieniSimbolo());
    
    Logger.log("Metodo: ottieniDocumenti()");
    const documenti = materia.ottieniDocumenti();
    Logger.log("Risultato: " + (documenti ? documenti.length + " documenti trovati" : "Nessun documento trovato"));
    
    Logger.log("Metodo: ottieniCartelle()");
    const cartelle = materia.ottieniCartelle();
    Logger.log("Risultato: " + (cartelle ? cartelle.length + " cartelle trovate" : "Nessuna cartella trovata"));
  }
  
  return "Test GestoreMaterie e Materia completati";
}

/**
 * Funzione per testare il GestoreDocumenti e l'entità Documento
 * @returns {string} Messaggio di completamento test
 */
function testGestoreDocumenti() {
  Logger.log("=== Test GestoreDocumenti e Documento ===");
  
  // Inizializza i servizi necessari
  const logger = new MyLoggerService({ livello: 'INFO' });
  const cache = new MyCacheService();
  const utils = new MyUtilsService();
  const spreadsheetService = new MySpreadsheetService(logger, cache, utils);
  const gestoreDB = new GestoreDatabaseAnniScolastici(logger, cache, utils, spreadsheetService);
  
  // Instanzia il gestore
  const gestoreDocumenti = new GestoreDocumenti(logger, gestoreDB, cache, utils);
  
  // Test del metodo inizializza
  Logger.log("Metodo: inizializza()");
  const risultatoInizializza = gestoreDocumenti.inizializza();
  Logger.log("Risultato: " + risultatoInizializza);
  
  // Test del metodo caricaDati
  Logger.log("Metodo: caricaDati()");
  const documenti = gestoreDocumenti.caricaDati();
  Logger.log("Risultato: " + (documenti ? documenti.length + " documenti caricati" : "Nessun documento caricato"));
  
  // Test del metodo ottieniPerId
  Logger.log("Metodo: ottieniPerId()");
  if (documenti && documenti.length > 0) {
    const primoDocumento = documenti[0];
    const id = primoDocumento.ottieniId();
    const documentoPerId = gestoreDocumenti.ottieniPerId(id);
    Logger.log("Parametri: " + id);
    Logger.log("Risultato: " + (documentoPerId ? "Documento trovato: " + documentoPerId.ottieniNome() : "Documento non trovato"));
  } else {
    Logger.log("Non ci sono documenti per testare ottieniPerId()");
  }
  
  // Test del metodo filtra
  Logger.log("Metodo: filtra()");
  const documentiFiltrati = gestoreDocumenti.filtra(documento => documento.ottieniFormato() === "DOCUMENT");
  Logger.log("Parametri: documento => documento.ottieniFormato() === 'DOCUMENT'");
  Logger.log("Risultato: " + (documentiFiltrati ? documentiFiltrati.length + " documenti filtrati" : "Nessun documento filtrato"));
  
  // Test del metodo ottieniPerAnnoCorso
  Logger.log("Metodo: ottieniPerAnnoCorso(1)");
  const documentiPerAnno = gestoreDocumenti.ottieniPerAnnoCorso(1);
  Logger.log("Parametri: 1");
  Logger.log("Risultato: " + (documentiPerAnno ? documentiPerAnno.length + " documenti trovati" : "Nessun documento trovato"));
  
  // Test del metodo ottieniPerFormato
  Logger.log("Metodo: ottieniPerFormato('DOCUMENT')");
  const documentiPerFormato = gestoreDocumenti.ottieniPerFormato("DOCUMENT");
  Logger.log("Parametri: 'DOCUMENT'");
  Logger.log("Risultato: " + (documentiPerFormato ? documentiPerFormato.length + " documenti trovati" : "Nessun documento trovato"));
  
  // Test del metodo ottieniPerSchemaOrganizzativo
  Logger.log("Metodo: ottieniPerSchemaOrganizzativo('UNO PER CLASSE')");
  const documentiPerSchema = gestoreDocumenti.ottieniPerSchemaOrganizzativo("UNO PER CLASSE");
  Logger.log("Parametri: 'UNO PER CLASSE'");
  Logger.log("Risultato: " + (documentiPerSchema ? documentiPerSchema.length + " documenti trovati" : "Nessun documento trovato"));
  
  // Test del metodo ottieniDaStampare
  Logger.log("Metodo: ottieniDaStampare()");
  const documentiDaStampare = gestoreDocumenti.ottieniDaStampare();
  Logger.log("Risultato: " + (documentiDaStampare ? documentiDaStampare.length + " documenti trovati" : "Nessun documento trovato"));
  
  // Test dei metodi della classe Documento
  if (documenti && documenti.length > 0) {
    const documento = documenti[0];
    Logger.log("\n=== Test Documento ===");
    
    Logger.log("Metodo: ottieniId()");
    Logger.log("Risultato: " + documento.ottieniId());
    
    Logger.log("Metodo: ottieniNome()");
    Logger.log("Risultato: " + documento.ottieniNome());
    
    Logger.log("Metodo: ottieniFormato()");
    Logger.log("Risultato: " + documento.ottieniFormato());
    
    Logger.log("Metodo: ottieniIcona()");
    Logger.log("Risultato: " + documento.ottieniIcona());
    
    Logger.log("Metodo: ottieniColore1()");
    Logger.log("Risultato: " + documento.ottieniColore1());
    
    Logger.log("Metodo: ottieniColore2()");
    Logger.log("Risultato: " + documento.ottieniColore2());
    
    Logger.log("Metodo: ottieniGestioneArticolazione()");
    Logger.log("Risultato: " + documento.ottieniGestioneArticolazione());
    
    Logger.log("Metodo: ottieniAnniCorso()");
    const anniCorso = documento.ottieniAnniCorso();
    Logger.log("Risultato: " + (anniCorso ? anniCorso.join(", ") : "Nessun anno di corso"));
    
    Logger.log("Metodo: ottieniSchemaOrganizzativo()");
    Logger.log("Risultato: " + documento.ottieniSchemaOrganizzativo());
    
    Logger.log("Metodo: ottieniCartellaParent()");
    Logger.log("Risultato: " + documento.ottieniCartellaParent());
    
    Logger.log("Metodo: ottieniSchemaSottocartelle()");
    Logger.log("Risultato: " + documento.ottieniSchemaSottocartelle());
    
    Logger.log("Metodo: ottieniSottocartelle()");
    Logger.log("Risultato: " + documento.ottieniSottocartelle());
    
    Logger.log("Metodo: ottieniPatternNomeFile()");
    Logger.log("Risultato: " + documento.ottieniPatternNomeFile());
    
    Logger.log("Metodo: ottieniTabellaSorgente()");
    Logger.log("Risultato: " + documento.ottieniTabellaSorgente());
    
    Logger.log("Metodo: ottieniModelliJSON()");
    Logger.log("Risultato: " + documento.ottieniModelliJSON());
    
    Logger.log("Metodo: ottieniParametriAggiuntiviGenerazione()");
    Logger.log("Risultato: " + documento.ottieniParametriAggiuntiviGenerazione());
    
    Logger.log("Metodo: ottieniReferente()");
    Logger.log("Risultato: " + documento.ottieniReferente());
    
    Logger.log("Metodo: ottieniPermessiCoord()");
    Logger.log("Risultato: " + documento.ottieniPermessiCoord());
    
    Logger.log("Metodo: ottieniPermessiReferente()");
    Logger.log("Risultato: " + documento.ottieniPermessiReferente());
    
    Logger.log("Metodo: ottieniPermessiDocente()");
    Logger.log("Risultato: " + documento.ottieniPermessiDocente());
    
    Logger.log("Metodo: ottieniPermessiTutor()");
    Logger.log("Risultato: " + documento.ottieniPermessiTutor());
    
    Logger.log("Metodo: ottieniPermessiAlunno()");
    Logger.log("Risultato: " + documento.ottieniPermessiAlunno());
    
    Logger.log("Metodo: daStampare()");
    Logger.log("Risultato: " + documento.daStampare());
    
    Logger.log("Metodo: ottieniConsegna()");
    Logger.log("Risultato: " + documento.ottieniConsegna());
  }
  
  return "Test GestoreDocumenti e Documento completati";
}

/**
 * Funzione per testare il GestoreCarenze e l'entità Carenza
 * @returns {string} Messaggio di completamento test
 */
function testGestoreCarenze() {
  Logger.log("=== Test GestoreCarenze e Carenza ===");
  
  // Inizializza i servizi necessari
  const logger = new MyLoggerService({ livello: 'INFO' });
  const cache = new MyCacheService();
  const utils = new MyUtilsService();
  const spreadsheetService = new MySpreadsheetService(logger, cache, utils);
  const gestoreDB = new GestoreDatabaseAnniScolastici(logger, cache, utils, spreadsheetService);
  
  // Instanzia il gestore
  const gestoreCarenze = new GestoreCarenze(logger, gestoreDB, cache, utils);
  
  // Test del metodo inizializza
  Logger.log("Metodo: inizializza()");
  const risultatoInizializza = gestoreCarenze.inizializza();
  Logger.log("Risultato: " + risultatoInizializza);
  
  // Test del metodo caricaDati
  Logger.log("Metodo: caricaDati()");
  const carenze = gestoreCarenze.caricaDati();
  Logger.log("Risultato: " + (carenze ? carenze.length + " carenze caricate" : "Nessuna carenza caricata"));
  
  // Test del metodo ottieniPerId
  Logger.log("Metodo: ottieniPerId()");
  if (carenze && carenze.length > 0) {
    const primaCarenza = carenze[0];
    const id = gestoreCarenze._ottieniIdEntita(primaCarenza);
    const carenzaPerId = gestoreCarenze.ottieniPerId(id);
    Logger.log("Parametri: " + id);
    Logger.log("Risultato: " + (carenzaPerId ? "Carenza trovata per email: " + carenzaPerId.ottieniEmailAlunno() : "Carenza non trovata"));
  } else {
    Logger.log("Non ci sono carenze per testare ottieniPerId()");
  }
  
  // Test del metodo filtra
  Logger.log("Metodo: filtra()");
  const carenzeFiltrate = gestoreCarenze.filtra(carenza => carenza.ottieniDataReport() === "2023-01-31");
  Logger.log("Parametri: carenza => carenza.ottieniDataReport() === '2023-01-31'");
  Logger.log("Risultato: " + (carenzeFiltrate ? carenzeFiltrate.length + " carenze filtrate" : "Nessuna carenza filtrata"));
  
  // Test del metodo ottieniPerAlunno
  Logger.log("Metodo: ottieniPerAlunno('alunno@scuola.edu', true)");
  const carenzePerAlunno = gestoreCarenze.ottieniPerAlunno("alunno@scuola.edu", true);
  Logger.log("Parametri: 'alunno@scuola.edu', true");
  Logger.log("Risultato: " + (carenzePerAlunno ? carenzePerAlunno.length + " carenze trovate" : "Nessuna carenza trovata"));
  
  // Test del metodo ottieniPerClasse
  Logger.log("Metodo: ottieniPerClasse('1A LC', true)");
  const carenzePerClasse = gestoreCarenze.ottieniPerClasse("1A LC", true);
  Logger.log("Parametri: '1A LC', true");
  Logger.log("Risultato: " + (carenzePerClasse ? carenzePerClasse.length + " carenze trovate" : "Nessuna carenza trovata"));
  
  // Test del metodo ottieniPerData
  Logger.log("Metodo: ottieniPerData('2023-01-31')");
  const carenzePerData = gestoreCarenze.ottieniPerData("2023-01-31");
  Logger.log("Parametri: '2023-01-31'");
  Logger.log("Risultato: " + (carenzePerData ? carenzePerData.length + " carenze trovate" : "Nessuna carenza trovata"));
  
  // Test del metodo ottieniPerMateria
  Logger.log("Metodo: ottieniPerMateria('MAT', true)");
  const carenzePerMateria = gestoreCarenze.ottieniPerMateria("MAT", true);
  Logger.log("Parametri: 'MAT', true");
  Logger.log("Risultato: " + (carenzePerMateria ? carenzePerMateria.length + " carenze trovate" : "Nessuna carenza trovata"));
  
  // Test del metodo ottieniCarenzePiuRecenti
  const oggi = new Date();
  Logger.log("Metodo: ottieniCarenzePiuRecenti()");
  const carenzePiuRecenti = gestoreCarenze.ottieniCarenzePiuRecenti();
  Logger.log("Parametri: " + oggi);
  Logger.log("Risultato: " + (carenzePiuRecenti ? carenzePiuRecenti.length + " carenze trovate" : "Nessuna carenza trovata"));
  
  // Test del metodo ottieniStatistichePerClasse
  Logger.log("Metodo: ottieniStatistichePerClasse('1A LC')");
  const statistichePerClasse = gestoreCarenze.ottieniStatistichePerClasse("1A LC");
  Logger.log("Parametri: '1A LC'");
  Logger.log("Risultato: " + (statistichePerClasse ? statistichePerClasse.length + " statistiche trovate" : "Nessuna statistica trovata"));
  
  // Test del metodo ottieniPerTipologiaCarenza
  Logger.log("Metodo: ottieniPerTipologiaCarenza('scarso impegno', true)");
  const carenzePerTipologia = gestoreCarenze.ottieniPerTipologiaCarenza("scarso impegno", true);
  Logger.log("Parametri: 'scarso impegno', true");
  Logger.log("Risultato: " + (carenzePerTipologia ? carenzePerTipologia.length + " carenze trovate" : "Nessuna carenza trovata"));
  
  // Test del metodo ottieniPerPeriodo
  const dataInizio = new Date(2023, 0, 1); // 1 gennaio 2023
  const dataFine = new Date(2023, 11, 31); // 31 dicembre 2023
  Logger.log("Metodo: ottieniPerPeriodo(dataInizio, dataFine, true)");
  const carenzePerPeriodo = gestoreCarenze.ottieniPerPeriodo(dataInizio, dataFine, true);
  Logger.log("Parametri: " + dataInizio + ", " + dataFine + ", true");
  Logger.log("Risultato: " + (carenzePerPeriodo ? carenzePerPeriodo.length + " carenze trovate" : "Nessuna carenza trovata"));
  
  // Test dei metodi della classe Carenza
  if (carenze && carenze.length > 0) {
    const carenza = carenze[0];
    Logger.log("\n=== Test Carenza ===");
    
    Logger.log("Metodo: ottieniEmailAlunno()");
    Logger.log("Risultato: " + carenza.ottieniEmailAlunno());
    
    Logger.log("Metodo: ottieniClasseAlunno()");
    Logger.log("Risultato: " + carenza.ottieniClasseAlunno());
    
    Logger.log("Metodo: ottieniDataReport()");
    Logger.log("Risultato: " + carenza.ottieniDataReport());
    
    Logger.log("Metodo: ottieniNotifica()");
    Logger.log("Risultato: " + carenza.ottieniNotifica());
    
    Logger.log("Metodo: ottieniAssenze()");
    Logger.log("Risultato: " + carenza.ottieniAssenze());
    
    Logger.log("Metodo: ottieniNote()");
    Logger.log("Risultato: " + carenza.ottieniNote());
    
    Logger.log("Metodo: ottieniCarenzeMaterie()");
    const carenzeMaterie = carenza.ottieniCarenzeMaterie();
    Logger.log("Risultato: " + (carenzeMaterie ? Object.keys(carenzeMaterie).length + " materie con carenze" : "Nessuna materia con carenze"));
    
    // Prendiamo una materia a caso tra quelle con carenze, se ce ne sono
    const materieConCarenze = Object.keys(carenzeMaterie);
    if (materieConCarenze.length > 0) {
      const materiaTest = materieConCarenze[0];
      
      Logger.log("Metodo: ottieniCarenzaMateria('" + materiaTest + "')");
      const carenzaMateria = carenza.ottieniCarenzaMateria(materiaTest);
      Logger.log("Parametri: '" + materiaTest + "'");
      Logger.log("Risultato: " + carenzaMateria);
      
      Logger.log("Metodo: haCarenza('" + materiaTest + "')");
      Logger.log("Parametri: '" + materiaTest + "'");
      Logger.log("Risultato: " + carenza.haCarenza(materiaTest));
    }
    
    Logger.log("Metodo: ottieniAlunno()");
    const alunno = carenza.ottieniAlunno();
    Logger.log("Risultato: " + (alunno ? "Alunno trovato: " + alunno.EMAIL : "Alunno non trovato"));
    
    Logger.log("Metodo: ottieniClasse()");
    const classe = carenza.ottieniClasse();
    Logger.log("Risultato: " + (classe ? "Classe trovata: " + classe.CLASSE : "Classe non trovata"));
    
    Logger.log("Metodo: ottieniMaterieConCarenza()");
    const materieConCarenza = carenza.ottieniMaterieConCarenza();
    Logger.log("Risultato: " + (materieConCarenza ? materieConCarenza.join(", ") : "Nessuna materia con carenza"));
    
    Logger.log("Metodo: ottieniNumeroCarenze()");
    Logger.log("Risultato: " + carenza.ottieniNumeroCarenze());
  }
  
  return "Test GestoreCarenze e Carenza completati";
}

/**
 * Funzione per testare il GestoreProgetti e l'entità Progetto
 * @returns {string} Messaggio di completamento test
 */
function testGestoreProgetti() {
  Logger.log("=== Test GestoreProgetti e Progetto ===");
  
  // Inizializza i servizi necessari
  const logger = new MyLoggerService({ livello: 'INFO' });
  const cache = new MyCacheService();
  const utils = new MyUtilsService();
  const spreadsheetService = new MySpreadsheetService(logger, cache, utils);
  const gestoreDB = new GestoreDatabaseAnniScolastici(logger, cache, utils, spreadsheetService);
  
  // Instanzia il gestore
  const gestoreProgetti = new GestoreProgetti(logger, gestoreDB, cache, utils);
  
  // Test del metodo inizializza
  Logger.log("Metodo: inizializza()");
  const risultatoInizializza = gestoreProgetti.inizializza();
  Logger.log("Risultato: " + risultatoInizializza);
  
  // Test del metodo caricaDati
  Logger.log("Metodo: caricaDati()");
  const progetti = gestoreProgetti.caricaDati();
  Logger.log("Risultato: " + (progetti ? progetti.length + " progetti caricati" : "Nessun progetto caricato"));
  
  // Test del metodo ottieniPerId
  Logger.log("Metodo: ottieniPerId()");
  if (progetti && progetti.length > 0) {
    const primoProgetto = progetti[0];
    const id = primoProgetto.ottieniChiaveUnivoca();
    const progettoPerId = gestoreProgetti.ottieniPerId(id);
    Logger.log("Parametri: " + id);
    Logger.log("Risultato: " + (progettoPerId ? "Progetto trovato: " + progettoPerId.ottieniNomeProgetto() : "Progetto non trovato"));
  } else {
    Logger.log("Non ci sono progetti per testare ottieniPerId()");
  }
  
  // Test del metodo filtra
  Logger.log("Metodo: filtra()");
  const progettiFiltrati = gestoreProgetti.filtra(progetto => progetto.ottieniTipoProgetto() === "PCTO");
  Logger.log("Parametri: progetto => progetto.ottieniTipoProgetto() === 'PCTO'");
  Logger.log("Risultato: " + (progettiFiltrati ? progettiFiltrati.length + " progetti filtrati" : "Nessun progetto filtrato"));
  
  // Test del metodo ottieniPerClasse
  Logger.log("Metodo: ottieniPerClasse('1A LC')");
  const progettiPerClasse = gestoreProgetti.ottieniPerClasse("1A LC");
  Logger.log("Parametri: '1A LC'");
  Logger.log("Risultato: " + (progettiPerClasse ? progettiPerClasse.length + " progetti trovati" : "Nessun progetto trovato"));
  
  // Test del metodo ottieniPerTipo
  Logger.log("Metodo: ottieniPerTipo('PCTO')");
  const progettiPerTipo = gestoreProgetti.ottieniPerTipo("PCTO");
  Logger.log("Parametri: 'PCTO'");
  Logger.log("Risultato: " + (progettiPerTipo ? progettiPerTipo.length + " progetti trovati" : "Nessun progetto trovato"));
  
  // Test del metodo ottieniProgettiPCTO
  Logger.log("Metodo: ottieniProgettiPCTO()");
  const progettiPCTO = gestoreProgetti.ottieniProgettiPCTO();
  Logger.log("Risultato: " + (progettiPCTO ? progettiPCTO.length + " progetti trovati" : "Nessun progetto trovato"));
  
  // Test del metodo ottieniProgettiOrientamento
  Logger.log("Metodo: ottieniProgettiOrientamento()");
  const progettiOrientamento = gestoreProgetti.ottieniProgettiOrientamento();
  Logger.log("Risultato: " + (progettiOrientamento ? progettiOrientamento.length + " progetti trovati" : "Nessun progetto trovato"));
  
  // Test del metodo cercaPerNome
  Logger.log("Metodo: cercaPerNome('Laboratorio')");
  const progettiPerNome = gestoreProgetti.cercaPerNome("Laboratorio");
  Logger.log("Parametri: 'Laboratorio'");
  Logger.log("Risultato: " + (progettiPerNome ? progettiPerNome.length + " progetti trovati" : "Nessun progetto trovato"));
  
  // Test del metodo ottieniProgetto
  Logger.log("Metodo: ottieniProgetto('1A LC', 'PCTO')");
  const progetto = gestoreProgetti.ottieniProgetto("1A LC", "PCTO");
  Logger.log("Parametri: '1A LC', 'PCTO'");
  Logger.log("Risultato: " + (progetto ? "Progetto trovato: " + progetto.ottieniNomeProgetto() : "Nessun progetto trovato"));
  
  // Test dei metodi della classe Progetto
  if (progetti && progetti.length > 0) {
    const progetto = progetti[0];
    Logger.log("\n=== Test Progetto ===");
    
    Logger.log("Metodo: ottieniClasse()");
    Logger.log("Risultato: " + progetto.ottieniClasse());
    
    Logger.log("Metodo: ottieniTipoProgetto()");
    Logger.log("Risultato: " + progetto.ottieniTipoProgetto());
    
    Logger.log("Metodo: ottieniNomeProgetto()");
    Logger.log("Risultato: " + progetto.ottieniNomeProgetto());
    
    Logger.log("Metodo: ottieniOreProgetto()");
    Logger.log("Risultato: " + progetto.ottieniOreProgetto());
    
    Logger.log("Metodo: ottieniOreValidePCTO()");
    Logger.log("Risultato: " + progetto.ottieniOreValidePCTO());
    
    Logger.log("Metodo: ottieniChiaveUnivoca()");
    Logger.log("Risultato: " + progetto.ottieniChiaveUnivoca());
    
    Logger.log("Metodo: isPCTO()");
    Logger.log("Risultato: " + progetto.isPCTO());
    
    Logger.log("Metodo: isOrientamento()");
    Logger.log("Risultato: " + progetto.isOrientamento());
  }
  
  return "Test GestoreProgetti e Progetto completati";
}



// In TEST/NuoviGestori.js

/**
 * Esegue tutti i test per i nuovi gestori e le relative entità.
 */
function eseguiTestNuoviGestori() {
  const logger = new MyLoggerService({ livello: 'INFO' });
  logger.info("=== INIZIO ESECUZIONE TEST NUOVI GESTORI ===");

  try {
    testGestoreCartelleGenerate(logger);
    logger.info("\n---");
    testGestoreDocumentiGenerati(logger);
    logger.info("\n---");
    testGestoreEmailInviate(logger);
  } catch (e) {
    logger.error(`ERRORE CRITICO DURANTE I TEST: ${e.message}\n${e.stack}`);
  }

  logger.info("=== FINE ESECUZIONE TEST NUOVI GESTORI ===");
}

/**
 * Funzione per testare GestoreCartelleGenerate e l'entità CartellaGenerata.
 * @param {MyLoggerService} logger - Servizio di logging.
 */
function testGestoreCartelleGenerate(logger) {
  logger.info("=== Test GestoreCartelleGenerate e CartellaGenerata ===");
  const servizi = inizializzaServizi();
  const gestore = new GestoreCartelleGenerate(servizi.logger, servizi.gestoreDB, servizi.cache, servizi.utils);

  // Test caricamento dati
  const tutteLeCartelle = gestore.caricaDati();
  if (!tutteLeCartelle || tutteLeCartelle.length === 0) {
    logger.warn("Nessuna cartella trovata in FOLDER_GEN. Test parziale.");
    return;
  }
  logger.info(`Caricate ${tutteLeCartelle.length} cartelle.`);

  // Test ottieniPerId e metodi dell'entità
  const primaCartella = tutteLeCartelle[0];
  const idTest = primaCartella.ottieniId();
  const cartellaById = gestore.ottieniPerId(idTest);

  if (cartellaById && cartellaById.ottieniId() === idTest) {
    logger.info(`ottieniPerId('${idTest}') -> SUCCESSO`);
    logger.info(`  - Nome: ${cartellaById.ottieniNome()}`);
    logger.info(`  - Tipo: ${cartellaById.ottieniTipo()}`);
    logger.info(`  - Classe: ${cartellaById.ottieniClasseAssociata() || 'N/A'}`);
    logger.info(`  - Data Creazione: ${cartellaById.ottieniDataCreazione()}`);
  } else {
    logger.error(`ottieniPerId('${idTest}') -> FALLITO`);
  }

  // Test filtri
  const classeTest = '1A LC';
  const cartelleClasse = gestore.ottieniPerClasse(classeTest);
  logger.info(`ottieniPerClasse('${classeTest}') -> Trovate ${cartelleClasse.length} cartelle.`);

  const tipoTest = 'PIANO_LAVORO';
  const cartelleTipo = gestore.ottieniPerTipo(tipoTest);
  logger.info(`ottieniPerTipo('${tipoTest}') -> Trovate ${cartelleTipo.length} cartelle.`);
}

/**
 * Funzione per testare GestoreDocumentiGenerati e l'entità DocumentoGenerato.
 * @param {MyLoggerService} logger - Servizio di logging.
 */
function testGestoreDocumentiGenerati(logger) {
  logger.info("=== Test GestoreDocumentiGenerati e DocumentoGenerato ===");
  const servizi = inizializzaServizi();
  const gestore = new GestoreDocumentiGenerati(servizi.logger, servizi.gestoreDB, servizi.cache, servizi.utils);

  // Test caricamento dati
  const tuttiIDocumenti = gestore.caricaDati();
  if (!tuttiIDocumenti || tuttiIDocumenti.length === 0) {
    logger.warn("Nessun documento trovato in DOC_GEN. Test parziale.");
    return;
  }
  logger.info(`Caricati ${tuttiIDocumenti.length} documenti.`);

  // Test ottieniPerId e metodi dell'entità
  const primoDocumento = tuttiIDocumenti[0];
  const idTest = primoDocumento.ottieniId();
  const docById = gestore.ottieniPerId(idTest);

  if (docById && docById.ottieniId() === idTest) {
    logger.info(`ottieniPerId('${idTest}') -> SUCCESSO`);
    logger.info(`  - Nome: ${docById.ottieniNome()}`);
    logger.info(`  - Stato: ${docById.ottieniStato()}`);
    logger.info(`  - Notificato: ${docById.isNotificato()}`);
    logger.info(`  - Data Modifica: ${docById.ottieniDataUltimaModifica()}`);
  } else {
    logger.error(`ottieniPerId('${idTest}') -> FALLITO`);
  }

  // Test filtri
  const documentiNonNotificati = gestore.ottieniNonNotificati();
  logger.info(`ottieniNonNotificati() -> Trovati ${documentiNonNotificati.length} documenti.`);
}

/**
 * Funzione per testare GestoreEmailInviate e l'entità EmailInviata.
 * @param {MyLoggerService} logger - Servizio di logging.
 */
function testGestoreEmailInviate(logger) {
  logger.info("=== Test GestoreEmailInviate e EmailInviata ===");
  const servizi = inizializzaServizi();
  const gestore = new GestoreEmailInviate(servizi.logger, servizi.gestoreDB, servizi.cache, servizi.utils);

  // Test caricamento dati
  const tutteLeEmail = gestore.caricaDati();
  if (!tutteLeEmail || tutteLeEmail.length === 0) {
    logger.warn("Nessuna email trovata in EMAIL_INVIATE. Test parziale.");
    return;
  }
  logger.info(`Caricate ${tutteLeEmail.length} email.`);

  // Test ottieniPerId e metodi dell'entità
  const primaEmail = tutteLeEmail[0];
  const idTest = primaEmail.ottieniChiaveUnivoca();
  const emailById = gestore.ottieniPerId(idTest);

  if (emailById && emailById.ottieniChiaveUnivoca() === idTest) {
    logger.info(`ottieniPerId('${idTest}') -> SUCCESSO`);
    logger.info(`  - Oggetto: ${emailById.ottieniOggetto()}`);
    logger.info(`  - Destinatari: [${emailById.ottieniDestinatari().join(', ')}]`);
    logger.info(`  - Pattern ID: ${emailById.ottieniPatternId()}`);
    logger.info(`  - Stato: ${emailById.ottieniStato()}`);
  } else {
    logger.error(`ottieniPerId('${idTest}') -> FALLITO`);
  }

  // Test filtri
  const emailTest = primaEmail.ottieniDestinatari()[0];
  if (emailTest) {
      const emailPerDestinatario = gestore.ottieniPerDestinatario(emailTest);
      logger.info(`ottieniPerDestinatario('${emailTest}') -> Trovate ${emailPerDestinatario.length} email.`);
  }

  const emailConErrori = gestore.ottieniConErrori();
  logger.info(`ottieniConErrori() -> Trovate ${emailConErrori.length} email.`);
}

