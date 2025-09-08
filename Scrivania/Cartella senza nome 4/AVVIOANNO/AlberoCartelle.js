/**
 * Crea l'albero di cartelle dell'anno scolastico corrente basandosi sulla tabella DOCUMENTI
 * e registra le informazioni in FOLDER_GEN
 * @returns {Object} Statistiche sulla creazione delle cartelle
 */
function creaAlberoCartelle() {
  // Inizializzazione servizi
  const logger = new MyLoggerService({ livello: 'INFO' });
  const cache = new MyCacheService();
  const utils = new MyUtilsService();
  const spreadsheetService = new MySpreadsheetService(logger, cache, utils);
  const driveService = new MyDriveService(logger, cache, utils);

  // Statistiche
  const stats = {
    cartelleCreateTotali: 0,
    errori: 0,
    dettagli: []
  };

  try {
    logger.info("Avvio creazione albero cartelle per l'anno scolastico corrente");

    // 1. Inizializza il gestore del database anni scolastici
    const gestoreDB = new GestoreDatabaseAnniScolastici(logger, cache, utils, spreadsheetService);

    // 2. Ottieni l'anno scolastico corrente e i relativi dati
    const anni = gestoreDB.ottieniAnniScolastici();
    if (anni.length === 0) {
      throw new Error("Nessun anno scolastico disponibile");
    }
    const annoCorrente = anni[0];

    const datiAnno = gestoreDB._datiAnni.find(anno => anno.nome === annoCorrente);
    if (!datiAnno || !datiAnno.idCartella) {
      throw new Error(`ID cartella non trovato per l'anno scolastico ${annoCorrente}`);
    }

    // 3. Ottieni il database dell'anno corrente
    const db = gestoreDB.ottieniDatabaseAnnoAttuale();

    // 4. Ottieni i dati dalla tabella DOCUMENTI
    if (!db.tables["DOCUMENTI"]) {
      throw new Error("Tabella DOCUMENTI non trovata nel database");
    }
    const documenti = db.tables["DOCUMENTI"].ottieniRighe();
    logger.info(`Trovati ${documenti.length} tipi di documento da elaborare`);

    // 5. Inizializza i gestori necessari
    const gestoreClassi = new GestoreClassi(logger, gestoreDB, cache, utils);
    const gestoreDocenti = new GestoreDocenti(logger, gestoreDB, cache, utils);
    const gestoreAlunni = new GestoreAlunni(logger, gestoreDB, cache, utils);
    const gestoreMaterie = new GestoreMaterie(logger, gestoreDB, cache, utils);

    gestoreClassi.inizializza();
    gestoreDocenti.inizializza();
    gestoreAlunni.inizializza();
    gestoreMaterie.inizializza();

    // 6. Inizializza il servizio placeholder
    const mustache = new MyMustache({ logger: logger });
    const archivioPlaceholder = new ArchivioPlaceholder(gestoreDB, logger, mustache, utils, driveService);
    const placeholderService = new MyPlaceholderService(archivioPlaceholder, null, spreadsheetService, logger, mustache, utils);

    // 7. Crea il gestore registrazione cartelle
    const registrazioneManager = new RegistrazioneCartelleManager(db, logger, utils);

    // 8. Elabora ogni documento e crea le cartelle necessarie
    for (const documento of documenti) {
      const idDocumento = documento["ID"];
      const cartellaParent = documento["CARTELLA PARENT"];
      const schemaSottocartelle = documento["SCHEMA SOTTOCARTELLE"];
      const patternSottocartelle = documento["SOTTOCARTELLE"];
      const schemaOrganizzativo = documento["SCHEMA ORGANIZZATIVO"];
      const anniCorso = documento["ANNI CORSO"] ? documento["ANNI CORSO"].split(",").map(a => a.trim()) : [];

      if (!cartellaParent) continue;

      try {
        // Crea un contesto base per il placeholder service
        const contestoBase = {
          annoScolastico: annoCorrente
        };

        // Sostituisci i placeholder nel percorso della cartella parent
        const percorsoCartellaParent = placeholderService.sostituisciInStringa(cartellaParent, contestoBase);

        // Crea la struttura base (parent) utilizzando la funzione ricorsiva
        const cartellaBase = driveService.creaAlberoCartelle(percorsoCartellaParent, datiAnno.idCartella, true, true);
        if (!cartellaBase || !cartellaBase.id) {
          logger.warn(`Impossibile creare la cartella parent ${percorsoCartellaParent}`);
          continue;
        }
        stats.cartelleCreateTotali++;
        stats.dettagli.push(`Creata struttura cartelle: ${percorsoCartellaParent}`);

        // Registra la cartella principale in FOLDER_GEN
        registrazioneManager.registraCartella({
          TIPO: idDocumento,
          NOME: documento["NOME"],
          "PERCORSO CARTELLA": percorsoCartellaParent,
          ID: cartellaBase.id,
          LINK: cartellaBase.webViewLink,
          "DATA CREAZIONE": utils.formattaData(new Date())
        });

        // Se non è definito uno schema per le sottocartelle, passa al documento successivo
        if (!schemaSottocartelle || !patternSottocartelle) continue;

        // Crea le sottocartelle in base allo schema
        switch (schemaSottocartelle) {
          case "CLASSE":
            _creaSottocartellePerClassi(cartellaBase, patternSottocartelle, gestoreClassi, gestoreMaterie, driveService, placeholderService, registrazioneManager, idDocumento, stats, logger, anniCorso);
            break;
          case "ALUNNO":
            _creaSottocartellePerAlunni(cartellaBase, patternSottocartelle, gestoreAlunni, driveService, placeholderService, registrazioneManager, idDocumento, stats, logger);
            break;
          case "DOCENTE":
            _creaSottocartellePerDocenti(cartellaBase, patternSottocartelle, gestoreDocenti, gestoreClassi, gestoreMaterie, driveService, placeholderService, registrazioneManager, idDocumento, stats, logger);
            break;
          case "CLASSE/MATERIA":
            _creaSottocartellePerClassiMaterie(cartellaBase, patternSottocartelle, gestoreClassi, gestoreMaterie, driveService, placeholderService, registrazioneManager, idDocumento, stats, logger, anniCorso);
            break;
          case "CLASSE/ALUNNO":
            _creaSottocartellePerClassiAlunni(cartellaBase, patternSottocartelle, gestoreClassi, gestoreAlunni, driveService, placeholderService, registrazioneManager, idDocumento, stats, logger, anniCorso);
            break;
          case "DOCENTE/CLASSE":
            _creaSottocartellePerDocentiClassi(cartellaBase, patternSottocartelle, gestoreDocenti, gestoreClassi, driveService, placeholderService, registrazioneManager, idDocumento, stats, logger);
            break;
          case "MATERIA":
            _creaSottocartellePerMaterie(cartellaBase, patternSottocartelle, gestoreMaterie, driveService, placeholderService, registrazioneManager, idDocumento, stats, logger);
            break;
          case "DOCENTE/MATERIA":
            _creaSottocartellePerDocentiMaterie(cartellaBase, patternSottocartelle, gestoreDocenti, gestoreMaterie, driveService, placeholderService, registrazioneManager, idDocumento, stats, logger);
            break;
          case "MATERIA/CLASSE":
            _creaSottocartellePerMaterieClassi(cartellaBase, patternSottocartelle, gestoreMaterie, gestoreClassi, driveService, placeholderService, registrazioneManager, idDocumento, stats, logger, anniCorso);
            break;
          case "DIPARTIMENTO":
            _creaSottocartellePerDipartimenti(cartellaBase, patternSottocartelle, db, driveService, placeholderService, registrazioneManager, idDocumento, stats, logger);
            break;
          default:
            logger.warn(`Schema sottocartelle non supportato: ${schemaSottocartelle}`);
            break;
        }
      } catch (e) {
        logger.error(`Errore nell'elaborazione del documento ${idDocumento}: ${e.message}`);
        stats.errori++;
      }
    }

    logger.info(`Creazione albero cartelle completata. Create ${stats.cartelleCreateTotali} cartelle, con ${stats.errori} errori.`);
    return stats;

  } catch (e) {
    logger.error(`Errore durante la creazione dell'albero cartelle: ${e.message}`);
    stats.errori++;
    return stats;
  }
}

/**
 * Classe per gestire la registrazione delle cartelle nella tabella FOLDER_GEN
 */
class RegistrazioneCartelleManager {
  /**
   * Costruttore del manager di registrazione cartelle
   * @param {MyDatabaseService} db - Database service
   * @param {MyLoggerService} logger - Servizio di logging
   * @param {MyUtilsService} utils - Servizio utilità
   */
  constructor(db, logger, utils) {
    this.db = db;
    this.logger = logger;
    this.utils = utils;
    
    // Verifica se la tabella esiste
    this.tabellaOK = this.db && this.db.tables && this.db.tables["FOLDER_GEN"];
    
    if (!this.tabellaOK) {
      this.logger.error("Tabella FOLDER_GEN non disponibile nel database");
    }
  }
  
registraCartella(datiCartella) {
  if (!this.tabellaOK) {
    this.logger.error("Impossibile registrare la cartella: tabella FOLDER_GEN non disponibile");
    return false;
  }
  
  if (!datiCartella || !datiCartella.ID) {
    this.logger.error("Dati cartella o ID mancanti per la registrazione");
    return false;
  }
  
  try {
    // Verifica se la cartella è già presente nel database
    const cartellaEsistente = this.db.select()
      .from("FOLDER_GEN")
      .where("ID", "=", datiCartella.ID)
      .first();
    
    let risultato = null;
    
    if (cartellaEsistente) {
      // Usa direttamente la stessa sintassi del codice originale
      risultato = this.db.tables["FOLDER_GEN"].aggiornaRigaPerId(datiCartella.ID, datiCartella);
    } else {
      // Usa direttamente la stessa sintassi del codice originale
      risultato = this.db.tables["FOLDER_GEN"].inserisciRiga(datiCartella);
    }
    
    if (!risultato) {
      this.logger.warn(`Operazione non riuscita per la cartella ${datiCartella.ID}`);
      return false;
    }
    
    return true;
  } catch (e) {
    this.logger.error(`Errore nella registrazione della cartella ${datiCartella.ID}: ${e.message}`);
    return false;
  }
}
  
  /**
   * Crea un oggetto contestoRegistrazione per la registrazione della cartella
   * @param {Object} dati - Dati base
   * @param {string} percorsoBase - Percorso base della cartella
   * @param {string} nomeSottocartella - Nome della sottocartella
   * @return {Object} Oggetto contesto
   */
  creaContestoRegistrazione(dati, percorsoBase, nomeSottocartella) {
    return {
      classe: dati.classe || null,
      utente: dati.utente || null,
      materia: dati.materia || null,
      percorsoCompleto: `${percorsoBase}/${nomeSottocartella}`,
      utils: this.utils
    };
  }
}

/**
 * Funzione ausiliaria per creare una singola cartella (se non esiste già).
 * @param {string} nome - Nome della cartella
 * @param {string} idParent - ID della cartella padre
 * @param {MyDriveService} driveService - Servizio Drive
 * @param {MyLoggerService} logger - Logger
 * @param {Object} contestoRegistrazione - Contesto per la registrazione
 * @param {RegistrazioneCartelleManager} registrazioneManager - Manager registrazione cartelle
 * @param {string} tipoDocumento - Tipo di documento
 * @return {Object} Cartella creata o null
 */
function creaSingolaCartella(nome, idParent, driveService, logger, contestoRegistrazione, registrazioneManager, tipoDocumento) {
  const cartella = driveService.creaCartella(nome, idParent, true, true);
  if (!cartella || !cartella.id) {
    logger.warn(`Impossibile creare la cartella ${nome} in ${idParent}`);
    return null;
  }
  
  // Registra la cartella in FOLDER_GEN
  if (registrazioneManager && tipoDocumento) {
    registrazioneManager.registraCartella({
      TIPO: tipoDocumento,
      NOME: nome,
      "PERCORSO CARTELLA": contestoRegistrazione.percorsoCompleto || nome,
      ID: cartella.id,
      LINK: cartella.webViewLink,
      CLASSE: contestoRegistrazione.classe || null,
      UTENTE: contestoRegistrazione.utente || null,
      MATERIA: contestoRegistrazione.materia || null,
      "DATA CREAZIONE": contestoRegistrazione.utils ? 
        contestoRegistrazione.utils.formattaData(new Date()) : 
        new Date().toISOString()
    });
  }
  
  return cartella;
}

/**
 * Crea sottocartelle per ogni classe, usando PlaceholderService per sostituire i placeholder.
 * @param {Object} cartellaBase - Oggetto cartella base
 * @param {string} pattern - Pattern per i nomi delle sottocartelle
 * @param {GestoreClassi} gestoreClassi - Gestore delle classi
 * @param {GestoreMaterie} gestoreMaterie - Gestore delle materie
 * @param {MyDriveService} driveService - Servizio Drive
 * @param {MyPlaceholderService} placeholderService - Servizio per i placeholder
 * @param {RegistrazioneCartelleManager} registrazioneManager - Manager registrazione cartelle
 * @param {string} tipoDocumento - Tipo di documento
 * @param {Object} stats - Statistiche da aggiornare
 * @param {MyLoggerService} logger - Logger
 * @param {string[]} anniCorso - Lista degli anni di corso per cui creare le cartelle
 */
function _creaSottocartellePerClassi(cartellaBase, pattern, gestoreClassi, gestoreMaterie, driveService, placeholderService, registrazioneManager, tipoDocumento, stats, logger, anniCorso = []) {
  const classiAttive = gestoreClassi.ottieniClassiAttive();

  for (const classe of classiAttive) {
    try {
      const nomeClasse = classe.ottieniNome();
      const indirizzo = classe.ottieniIndirizzo() || "";
      const annoCorso = classe.ottieniAnnoCorso();
      const sezione = classe.ottieniSezione();
      
      // Verifica se la classe rientra negli anni di corso specificati
      if (anniCorso.length > 0 && !anniCorso.includes(annoCorso.toString())) {
        continue;
      }
      
      // Crea un contesto per il placeholder service
      const contesto = {
        classe: nomeClasse,
        indirizzo: indirizzo,
        anno: annoCorso.toString(),
        sezione: sezione,
        annoScolastico: gestoreClassi.gestoreDB.ottieniAnniScolastici()[0]
      };
      
      // Sostituisci i placeholder nel nome della cartella
      const nomeSottocartella = placeholderService.sostituisciInStringa(pattern, contesto);
      
      // Crea contesto di registrazione
      const contestoRegistrazione = registrazioneManager.creaContestoRegistrazione(
        { classe: nomeClasse },
        cartellaBase.name,
        nomeSottocartella
      );
      
      const nuovaCartella = creaSingolaCartella(
        nomeSottocartella, 
        cartellaBase.id, 
        driveService, 
        logger, 
        contestoRegistrazione, 
        registrazioneManager, 
        tipoDocumento
      );
      
      if (nuovaCartella) {
        stats.cartelleCreateTotali++;
        stats.dettagli.push(`Creata sottocartella per classe: ${nomeSottocartella}`);
      }
    } catch (e) {
      logger.error(`Errore nella creazione della sottocartella per la classe: ${e.message}`);
      stats.errori++;
    }
  }
}

/**
 * Crea sottocartelle per ogni alunno, organizzate per classe, usando PlaceholderService.
 * @param {Object} cartellaBase - Oggetto cartella base
 * @param {string} pattern - Pattern per i nomi delle sottocartelle
 * @param {GestoreAlunni} gestoreAlunni - Gestore degli alunni
 * @param {MyDriveService} driveService - Servizio Drive
 * @param {MyPlaceholderService} placeholderService - Servizio per i placeholder
 * @param {RegistrazioneCartelleManager} registrazioneManager - Manager registrazione cartelle
 * @param {string} tipoDocumento - Tipo di documento
 * @param {Object} stats - Statistiche da aggiornare
 * @param {MyLoggerService} logger - Logger
 */
function _creaSottocartellePerAlunni(cartellaBase, pattern, gestoreAlunni, driveService, placeholderService, registrazioneManager, tipoDocumento, stats, logger) {
  const alunni = gestoreAlunni.caricaDati(true);
  const alunniPerClasse = {};

  for (const alunno of alunni) {
    const classeAlunno = alunno.ottieniClasse();
    if (!classeAlunno) continue;
    if (!alunniPerClasse[classeAlunno]) {
      alunniPerClasse[classeAlunno] = [];
    }
    alunniPerClasse[classeAlunno].push(alunno);
  }

  for (const classe in alunniPerClasse) {
    try {
      let folderForStudents = cartellaBase;
      let cartellaClasse = null;
      
      // Se il pattern contiene {CLASSE}, creiamo prima le cartelle per classe
      if (pattern.includes("{CLASSE}")) {
        const contestoClasse = {
          classe: classe,
          annoScolastico: gestoreAlunni.gestoreDB.ottieniAnniScolastici()[0]
        };
        
        const nomeCartellaClasse = placeholderService.sostituisciInStringa(classe, contestoClasse);
        
        // Crea contesto di registrazione per la classe
        const contestoRegistrazioneClasse = registrazioneManager.creaContestoRegistrazione(
          { classe: classe },
          cartellaBase.name,
          nomeCartellaClasse
        );
        
        cartellaClasse = creaSingolaCartella(
          nomeCartellaClasse, 
          cartellaBase.id, 
          driveService, 
          logger, 
          contestoRegistrazioneClasse, 
          registrazioneManager, 
          tipoDocumento
        );
        
        if (cartellaClasse) {
          stats.cartelleCreateTotali++;
          folderForStudents = cartellaClasse;
        }
      }
      
      // Crea cartelle per ogni alunno della classe
      for (const alunno of alunniPerClasse[classe]) {
        const nomeAlunno = alunno.ottieniNomeCompleto();
        const emailAlunno = alunno.ottieniEmail();
        
        // Crea contesto per il placeholder service
        const contestoAlunno = {
          alunno: nomeAlunno,
          classe: classe,
          email: emailAlunno,
          annoScolastico: gestoreAlunni.gestoreDB.ottieniAnniScolastici()[0]
        };
        
        // Sostituisci i placeholder nel nome della cartella
        const nomeSottocartella = placeholderService.sostituisciInStringa(pattern, contestoAlunno);
        
        // Percorso completo per la registrazione
        const percorsoBase = cartellaClasse ? `${cartellaBase.name}/${cartellaClasse.name}` : cartellaBase.name;
        
        // Crea contesto di registrazione per l'alunno
        const contestoRegistrazioneAlunno = registrazioneManager.creaContestoRegistrazione(
          { classe: classe, utente: emailAlunno },
          percorsoBase,
          nomeSottocartella
        );
        
        const nuovaCartella = creaSingolaCartella(
          nomeSottocartella, 
          folderForStudents.id, 
          driveService, 
          logger, 
          contestoRegistrazioneAlunno, 
          registrazioneManager, 
          tipoDocumento
        );
        
        if (nuovaCartella) {
          stats.cartelleCreateTotali++;
          stats.dettagli.push(`Creata sottocartella per alunno: ${nomeSottocartella} in ${classe}`);
        }
      }
    } catch (e) {
      logger.error(`Errore nella creazione delle sottocartelle per la classe ${classe}: ${e.message}`);
      stats.errori++;
    }
  }
}

/**
 * Crea sottocartelle per ogni docente, usando PlaceholderService.
 * @param {Object} cartellaBase - Oggetto cartella base
 * @param {string} pattern - Pattern per i nomi delle sottocartelle
 * @param {GestoreDocenti} gestoreDocenti - Gestore dei docenti
 * @param {GestoreClassi} gestoreClassi - Gestore delle classi
 * @param {GestoreMaterie} gestoreMaterie - Gestore delle materie
 * @param {MyDriveService} driveService - Servizio Drive
 * @param {MyPlaceholderService} placeholderService - Servizio per i placeholder
 * @param {RegistrazioneCartelleManager} registrazioneManager - Manager registrazione cartelle
 * @param {string} tipoDocumento - Tipo di documento
 * @param {Object} stats - Statistiche da aggiornare
 * @param {MyLoggerService} logger - Logger
 */
function _creaSottocartellePerDocenti(cartellaBase, pattern, gestoreDocenti, gestoreClassi, gestoreMaterie, driveService, placeholderService, registrazioneManager, tipoDocumento, stats, logger) {
  const docenti = gestoreDocenti.caricaDati(true);
  const patternIncludeDipartimento = pattern.includes("{DIPARTIMENTO}");

  for (const docente of docenti) {
    try {
      const dipartimento = docente.ottieniDipartimento() || "ALTRO";
      const nomeCompleto = docente.ottieniNomeCompleto();
      const emailDocente = docente.ottieniEmail();
      const cognome = docente.ottieniCognome();
      const nome = docente.ottieniNome();
      
      let folderForDocente = cartellaBase;
      let cartellaDipartimento = null;
      
      // Se il pattern include {DIPARTIMENTO}, creiamo prima la cartella per dipartimento
      if (patternIncludeDipartimento) {
        const contestoDipartimento = {
          dipartimento: dipartimento,
          annoScolastico: gestoreDocenti.gestoreDB.ottieniAnniScolastici()[0]
        };
        
        const nomeDipartimento = placeholderService.sostituisciInStringa(dipartimento, contestoDipartimento);
        
        // Crea contesto di registrazione per il dipartimento
        const contestoRegistrazioneDipartimento = registrazioneManager.creaContestoRegistrazione(
          {},
          cartellaBase.name,
          nomeDipartimento
        );
        
        cartellaDipartimento = creaSingolaCartella(
          nomeDipartimento, 
          cartellaBase.id, 
          driveService, 
          logger, 
          contestoRegistrazioneDipartimento, 
          registrazioneManager, 
          tipoDocumento
        );
        
        if (cartellaDipartimento) {
          stats.cartelleCreateTotali++;
          folderForDocente = cartellaDipartimento;
        }
      }
      
      // Crea contesto per il placeholder service
      const contestoDocente = {
        docente: nomeCompleto,
        email: emailDocente,
        dipartimento: dipartimento,
        cognome: cognome,
        nome: nome,
        annoScolastico: gestoreDocenti.gestoreDB.ottieniAnniScolastici()[0]
      };
      
      // Sostituisci i placeholder nel nome della cartella
      const nomeSottocartella = placeholderService.sostituisciInStringa(pattern, contestoDocente);
      
      // Percorso completo per la registrazione
      const percorsoBase = cartellaDipartimento ? `${cartellaBase.name}/${cartellaDipartimento.name}` : cartellaBase.name;
      
      // Crea contesto di registrazione per il docente
      const contestoRegistrazioneDocente = registrazioneManager.creaContestoRegistrazione(
        { utente: emailDocente },
        percorsoBase,
        nomeSottocartella
      );
      
      const nuovaCartella = creaSingolaCartella(
        nomeSottocartella, 
        folderForDocente.id, 
        driveService, 
        logger, 
        contestoRegistrazioneDocente, 
        registrazioneManager, 
        tipoDocumento
      );
      
      if (nuovaCartella) {
        stats.cartelleCreateTotali++;
        stats.dettagli.push(`Creata sottocartella per docente: ${nomeSottocartella}`);
      }
    } catch (e) {
      logger.error(`Errore nella creazione della sottocartella per il docente: ${e.message}`);
      stats.errori++;
    }
  }
}

/**
 * Crea sottocartelle per classi e materie, usando PlaceholderService.
 * @param {Object} cartellaBase - Oggetto cartella base
 * @param {string} pattern - Pattern per i nomi delle sottocartelle
 * @param {GestoreClassi} gestoreClassi - Gestore delle classi
 * @param {GestoreMaterie} gestoreMaterie - Gestore delle materie
 * @param {MyDriveService} driveService - Servizio Drive
 * @param {MyPlaceholderService} placeholderService - Servizio per i placeholder
 * @param {RegistrazioneCartelleManager} registrazioneManager - Manager registrazione cartelle
 * @param {string} tipoDocumento - Tipo di documento
 * @param {Object} stats - Statistiche da aggiornare
 * @param {MyLoggerService} logger - Logger
 * @param {string[]} anniCorso - Lista degli anni di corso per cui creare le cartelle
 */
function _creaSottocartellePerClassiMaterie(cartellaBase, pattern, gestoreClassi, gestoreMaterie, driveService, placeholderService, registrazioneManager, tipoDocumento, stats, logger, anniCorso = []) {
  const classiAttive = gestoreClassi.ottieniClassiAttive();
  const materie = gestoreMaterie.caricaDati(true);

  for (const classe of classiAttive) {
    try {
      const nomeClasse = classe.ottieniNome();
      const annoCorso = classe.ottieniAnnoCorso();
      
      // Verifica se la classe rientra negli anni di corso specificati
      if (anniCorso.length > 0 && !anniCorso.includes(annoCorso.toString())) {
        continue;
      }
      
      // Crea contesto per il placeholder service
      const contestoClasse = {
        classe: nomeClasse,
        annoScolastico: gestoreClassi.gestoreDB.ottieniAnniScolastici()[0]
      };
      
      // Crea contesto di registrazione per la classe
      const contestoRegistrazioneClasse = registrazioneManager.creaContestoRegistrazione(
        { classe: nomeClasse },
        cartellaBase.name,
        nomeClasse
      );
      
      // Crea la cartella della classe
      const cartellaClasse = creaSingolaCartella(
        nomeClasse, 
        cartellaBase.id, 
        driveService, 
        logger, 
        contestoRegistrazioneClasse, 
        registrazioneManager, 
        tipoDocumento
      );
      
      if (!cartellaClasse) continue;
      stats.cartelleCreateTotali++;

      // Crea sottocartelle per le materie
      for (const materia of materie) {
        const siglaMateria = materia.ottieniSigla();
        const nomeMateria = materia.ottieniNome();
        
        // Crea contesto per il placeholder service
        const contestoMateria = {
          classe: nomeClasse,
          materia: siglaMateria,
          nome_materia: nomeMateria,
          annoScolastico: gestoreClassi.gestoreDB.ottieniAnniScolastici()[0]
        };
        
        // Sostituisci i placeholder nel nome della cartella
        const nomeSottocartella = placeholderService.sostituisciInStringa(pattern, contestoMateria);
        
        // Crea contesto di registrazione per la materia
        const contestoRegistrazioneMateria = registrazioneManager.creaContestoRegistrazione(
          { classe: nomeClasse, materia: siglaMateria },
          `${cartellaBase.name}/${nomeClasse}`,
          nomeSottocartella
        );
        
        const nuovaCartella = creaSingolaCartella(
          nomeSottocartella, 
          cartellaClasse.id, 
          driveService, 
          logger, 
          contestoRegistrazioneMateria, 
          registrazioneManager, 
          tipoDocumento
        );
        
        if (nuovaCartella) {
          stats.cartelleCreateTotali++;
          stats.dettagli.push(`Creata sottocartella per materia: ${nomeSottocartella} in ${nomeClasse}`);
        }
      }
    } catch (e) {
      logger.error(`Errore nella creazione delle sottocartelle per la classe ${classe.ottieniNome()}: ${e.message}`);
      stats.errori++;
    }
  }
}

/**
 * Crea sottocartelle per classi e alunni, usando PlaceholderService.
 * @param {Object} cartellaBase - Oggetto cartella base
 * @param {string} pattern - Pattern per i nomi delle sottocartelle
 * @param {GestoreClassi} gestoreClassi - Gestore delle classi
 * @param {GestoreAlunni} gestoreAlunni - Gestore degli alunni
 * @param {MyDriveService} driveService - Servizio Drive
 * @param {MyPlaceholderService} placeholderService - Servizio per i placeholder
 * @param {RegistrazioneCartelleManager} registrazioneManager - Manager registrazione cartelle
 * @param {string} tipoDocumento - Tipo di documento
 * @param {Object} stats - Statistiche da aggiornare
 * @param {MyLoggerService} logger - Logger
 * @param {string[]} anniCorso - Lista degli anni di corso per cui creare le cartelle
 */
function _creaSottocartellePerClassiAlunni(cartellaBase, pattern, gestoreClassi, gestoreAlunni, driveService, placeholderService, registrazioneManager, tipoDocumento, stats, logger, anniCorso = []) {
  const classiAttive = gestoreClassi.ottieniClassiAttive();

  for (const classe of classiAttive) {
    try {
      const nomeClasse = classe.ottieniNome();
      const annoCorso = classe.ottieniAnnoCorso();
      
      // Verifica se la classe rientra negli anni di corso specificati
      if (anniCorso.length > 0 && !anniCorso.includes(annoCorso.toString())) {
        continue;
      }
      
      // Crea contesto per il placeholder service
      const contestoClasse = {
        classe: nomeClasse,
        annoScolastico: gestoreClassi.gestoreDB.ottieniAnniScolastici()[0]
      };
      
      // Crea contesto di registrazione per la classe
      const contestoRegistrazioneClasse = registrazioneManager.creaContestoRegistrazione(
        { classe: nomeClasse },
        cartellaBase.name,
        nomeClasse
      );
      
      // Crea la cartella della classe
      const cartellaClasse = creaSingolaCartella(
        nomeClasse, 
        cartellaBase.id, 
        driveService, 
        logger, 
        contestoRegistrazioneClasse, 
        registrazioneManager, 
        tipoDocumento
      );
      
      if (!cartellaClasse) continue;
      stats.cartelleCreateTotali++;

      // Crea sottocartelle per gli alunni
      const alunniClasse = gestoreAlunni.ottieniPerClasse(nomeClasse);
      for (const alunno of alunniClasse) {
        const nomeAlunno = alunno.ottieniNomeCompleto();
        const emailAlunno = alunno.ottieniEmail();
        
        // Crea contesto per il placeholder service
        const contestoAlunno = {
          alunno: nomeAlunno,
          classe: nomeClasse,
          email: emailAlunno,
          annoScolastico: gestoreClassi.gestoreDB.ottieniAnniScolastici()[0]
        };
        
        // Sostituisci i placeholder nel nome della cartella
        const nomeSottocartella = placeholderService.sostituisciInStringa(pattern, contestoAlunno);
        
        // Crea contesto di registrazione per l'alunno
        const contestoRegistrazioneAlunno = registrazioneManager.creaContestoRegistrazione(
          { classe: nomeClasse, utente: emailAlunno },
          `${cartellaBase.name}/${nomeClasse}`,
          nomeSottocartella
        );
        
        const nuovaCartella = creaSingolaCartella(
          nomeSottocartella, 
          cartellaClasse.id, 
          driveService, 
          logger, 
          contestoRegistrazioneAlunno, 
          registrazioneManager, 
          tipoDocumento
        );
        
        if (nuovaCartella) {
          stats.cartelleCreateTotali++;
          stats.dettagli.push(`Creata sottocartella per alunno: ${nomeSottocartella} in ${nomeClasse}`);
        }
      }
    } catch (e) {
      logger.error(`Errore nella creazione delle sottocartelle per la classe ${classe.ottieniNome()}: ${e.message}`);
      stats.errori++;
    }
  }
}

/**
 * Crea sottocartelle per docenti e classi, usando PlaceholderService.
 * @param {Object} cartellaBase - Oggetto cartella base
 * @param {string} pattern - Pattern per i nomi delle sottocartelle
 * @param {GestoreDocenti} gestoreDocenti - Gestore dei docenti
 * @param {GestoreClassi} gestoreClassi - Gestore delle classi
 * @param {MyDriveService} driveService - Servizio Drive
 * @param {MyPlaceholderService} placeholderService - Servizio per i placeholder
 * @param {RegistrazioneCartelleManager} registrazioneManager - Manager registrazione cartelle
 * @param {string} tipoDocumento - Tipo di documento
 * @param {Object} stats - Statistiche da aggiornare
 * @param {MyLoggerService} logger - Logger
 */
function _creaSottocartellePerDocentiClassi(cartellaBase, pattern, gestoreDocenti, gestoreClassi, driveService, placeholderService, registrazioneManager, tipoDocumento, stats, logger) {
  const docenti = gestoreDocenti.caricaDati(true);

  for (const docente of docenti) {
    try {
      const nomeCompleto = docente.ottieniNomeCompleto();
      const emailDocente = docente.ottieniEmail();
      const cognome = docente.ottieniCognome();
      
      // Crea contesto per il placeholder service
      const contestoDocente = {
        docente: nomeCompleto,
        email: emailDocente,
        cognome: cognome,
        annoScolastico: gestoreDocenti.gestoreDB.ottieniAnniScolastici()[0]
      };
      
      // Crea contesto di registrazione per il docente
      const contestoRegistrazioneDocente = registrazioneManager.creaContestoRegistrazione(
        { utente: emailDocente },
        cartellaBase.name,
        nomeCompleto
      );
      
      // Crea la cartella del docente
      const cartellaDocente = creaSingolaCartella(
        nomeCompleto, 
        cartellaBase.id, 
        driveService, 
        logger, 
        contestoRegistrazioneDocente, 
        registrazioneManager, 
        tipoDocumento
      );
      
      if (!cartellaDocente) continue;
      stats.cartelleCreateTotali++;

      // Ottieni le classi coordinate dal docente
      const classiCoordinate = docente.ottieniClassiCoordinate();
      const classiDocente = [];
      
      if (classiCoordinate && classiCoordinate.length > 0) {
        for (const classeObj of classiCoordinate) {
          const nomeClasse = classeObj.CLASSE || classeObj.nome;
          if (nomeClasse && !classiDocente.includes(nomeClasse)) {
            classiDocente.push(nomeClasse);
          }
        }
      }

      // Crea sottocartelle per le classi
      for (const nomeClasse of classiDocente) {
        // Crea contesto per il placeholder service
        const contestoClasse = {
          docente: nomeCompleto,
          classe: nomeClasse,
          email: emailDocente,
          cognome: cognome,
          annoScolastico: gestoreDocenti.gestoreDB.ottieniAnniScolastici()[0]
        };
        
        // Sostituisci i placeholder nel nome della cartella
        const nomeSottocartella = placeholderService.sostituisciInStringa(pattern, contestoClasse);
        
        // Crea contesto di registrazione per la classe
        const contestoRegistrazioneClasse = registrazioneManager.creaContestoRegistrazione(
          { classe: nomeClasse, utente: emailDocente },
          `${cartellaBase.name}/${nomeCompleto}`,
          nomeSottocartella
        );
        
        const nuovaCartella = creaSingolaCartella(
          nomeSottocartella, 
          cartellaDocente.id, 
          driveService, 
          logger, 
          contestoRegistrazioneClasse, 
          registrazioneManager, 
          tipoDocumento
        );
        
        if (nuovaCartella) {
          stats.cartelleCreateTotali++;
          stats.dettagli.push(`Creata sottocartella per classe: ${nomeSottocartella} per docente ${nomeCompleto}`);
        }
      }
    } catch (e) {
      logger.error(`Errore nella creazione delle sottocartelle per il docente ${docente.ottieniNomeCompleto()}: ${e.message}`);
      stats.errori++;
    }
  }
}

/**
 * Crea sottocartelle per materie, usando PlaceholderService.
 * @param {Object} cartellaBase - Oggetto cartella base
 * @param {string} pattern - Pattern per i nomi delle sottocartelle
 * @param {GestoreMaterie} gestoreMaterie - Gestore delle materie
 * @param {MyDriveService} driveService - Servizio Drive
 * @param {MyPlaceholderService} placeholderService - Servizio per i placeholder
 * @param {RegistrazioneCartelleManager} registrazioneManager - Manager registrazione cartelle
 * @param {string} tipoDocumento - Tipo di documento
 * @param {Object} stats - Statistiche da aggiornare
 * @param {MyLoggerService} logger - Logger
 */
function _creaSottocartellePerMaterie(cartellaBase, pattern, gestoreMaterie, driveService, placeholderService, registrazioneManager, tipoDocumento, stats, logger) {
  const materie = gestoreMaterie.caricaDati(true);

  for (const materia of materie) {
    try {
      const siglaMateria = materia.ottieniSigla();
      const nomeMateria = materia.ottieniNome();
      
      // Crea contesto per il placeholder service
      const contestoMateria = {
        materia: siglaMateria,
        nome_materia: nomeMateria,
        annoScolastico: gestoreMaterie.gestoreDB.ottieniAnniScolastici()[0]
      };
      
      // Sostituisci i placeholder nel nome della cartella
      const nomeSottocartella = placeholderService.sostituisciInStringa(pattern, contestoMateria);
      
      // Crea contesto di registrazione per la materia
      const contestoRegistrazioneMateria = registrazioneManager.creaContestoRegistrazione(
        { materia: siglaMateria },
        cartellaBase.name,
        nomeSottocartella
      );
      
      const nuovaCartella = creaSingolaCartella(
        nomeSottocartella, 
        cartellaBase.id, 
        driveService, 
        logger, 
        contestoRegistrazioneMateria, 
        registrazioneManager, 
        tipoDocumento
      );
      
      if (nuovaCartella) {
        stats.cartelleCreateTotali++;
        stats.dettagli.push(`Creata sottocartella per materia: ${nomeSottocartella}`);
      }
    } catch (e) {
      logger.error(`Errore nella creazione della sottocartella per la materia ${materia.ottieniSigla()}: ${e.message}`);
      stats.errori++;
    }
  }
}

/**
 * Crea sottocartelle per docenti e materie, usando PlaceholderService.
 * @param {Object} cartellaBase - Oggetto cartella base
 * @param {string} pattern - Pattern per i nomi delle sottocartelle
 * @param {GestoreDocenti} gestoreDocenti - Gestore dei docenti
 * @param {GestoreMaterie} gestoreMaterie - Gestore delle materie
 * @param {MyDriveService} driveService - Servizio Drive
 * @param {MyPlaceholderService} placeholderService - Servizio per i placeholder
 * @param {RegistrazioneCartelleManager} registrazioneManager - Manager registrazione cartelle
 * @param {string} tipoDocumento - Tipo di documento
 * @param {Object} stats - Statistiche da aggiornare
 * @param {MyLoggerService} logger - Logger
 */
function _creaSottocartellePerDocentiMaterie(cartellaBase, pattern, gestoreDocenti, gestoreMaterie, driveService, placeholderService, registrazioneManager, tipoDocumento, stats, logger) {
  const docenti = gestoreDocenti.caricaDati(true);
  const materie = gestoreMaterie.caricaDati(true);

  for (const docente of docenti) {
    try {
      const nomeCompleto = docente.ottieniNomeCompleto();
      const emailDocente = docente.ottieniEmail();
      
      // Crea contesto per il placeholder service
      const contestoDocente = {
        docente: nomeCompleto,
        email: emailDocente,
        annoScolastico: gestoreDocenti.gestoreDB.ottieniAnniScolastici()[0]
      };
      
      // Crea contesto di registrazione per il docente
      const contestoRegistrazioneDocente = registrazioneManager.creaContestoRegistrazione(
        { utente: emailDocente },
        cartellaBase.name,
        nomeCompleto
      );
      
      // Crea la cartella del docente
      const cartellaDocente = creaSingolaCartella(
        nomeCompleto, 
        cartellaBase.id, 
        driveService, 
        logger, 
        contestoRegistrazioneDocente, 
        registrazioneManager, 
        tipoDocumento
      );
      
      if (!cartellaDocente) continue;
      stats.cartelleCreateTotali++;

      // Crea sottocartelle per le materie
      for (const materia of materie) {
        const siglaMateria = materia.ottieniSigla();
        const nomeMateria = materia.ottieniNome();
        
        // Crea contesto per il placeholder service
        const contestoMateria = {
          docente: nomeCompleto,
          email: emailDocente,
          materia: siglaMateria,
          nome_materia: nomeMateria,
          annoScolastico: gestoreDocenti.gestoreDB.ottieniAnniScolastici()[0]
        };
        
        // Sostituisci i placeholder nel nome della cartella
        const nomeSottocartella = placeholderService.sostituisciInStringa(pattern, contestoMateria);
        
        // Crea contesto di registrazione per la materia
        const contestoRegistrazioneMateria = registrazioneManager.creaContestoRegistrazione(
          { utente: emailDocente, materia: siglaMateria },
          `${cartellaBase.name}/${nomeCompleto}`,
          nomeSottocartella
        );
        
        const nuovaCartella = creaSingolaCartella(
          nomeSottocartella, 
          cartellaDocente.id, 
          driveService, 
          logger, 
          contestoRegistrazioneMateria, 
          registrazioneManager, 
          tipoDocumento
        );
        
        if (nuovaCartella) {
          stats.cartelleCreateTotali++;
          stats.dettagli.push(`Creata sottocartella per materia: ${nomeSottocartella} per docente ${nomeCompleto}`);
        }
      }
    } catch (e) {
      logger.error(`Errore nella creazione delle sottocartelle per il docente ${docente.ottieniNomeCompleto()}: ${e.message}`);
      stats.errori++;
    }
  }
}

/**
 * Crea sottocartelle per materie e classi, usando PlaceholderService.
 * @param {Object} cartellaBase - Oggetto cartella base
 * @param {string} pattern - Pattern per i nomi delle sottocartelle
 * @param {GestoreMaterie} gestoreMaterie - Gestore delle materie
 * @param {GestoreClassi} gestoreClassi - Gestore delle classi
 * @param {MyDriveService} driveService - Servizio Drive
 * @param {MyPlaceholderService} placeholderService - Servizio per i placeholder
 * @param {RegistrazioneCartelleManager} registrazioneManager - Manager registrazione cartelle
 * @param {string} tipoDocumento - Tipo di documento
 * @param {Object} stats - Statistiche da aggiornare
 * @param {MyLoggerService} logger - Logger
 * @param {string[]} anniCorso - Lista degli anni di corso per cui creare le cartelle
 */
function _creaSottocartellePerMaterieClassi(cartellaBase, pattern, gestoreMaterie, gestoreClassi, driveService, placeholderService, registrazioneManager, tipoDocumento, stats, logger, anniCorso = []) {
  const materie = gestoreMaterie.caricaDati(true);
  const classiAttive = gestoreClassi.ottieniClassiAttive();

  for (const materia of materie) {
    try {
      const siglaMateria = materia.ottieniSigla();
      const nomeMateria = materia.ottieniNome();
      
      // Crea contesto per il placeholder service
      const contestoMateria = {
        materia: siglaMateria,
        nome_materia: nomeMateria,
        annoScolastico: gestoreMaterie.gestoreDB.ottieniAnniScolastici()[0]
      };
      
      // Crea contesto di registrazione per la materia
      const contestoRegistrazioneMateria = registrazioneManager.creaContestoRegistrazione(
        { materia: siglaMateria },
        cartellaBase.name,
        siglaMateria
      );
      
      // Crea la cartella della materia
      const cartellaMateria = creaSingolaCartella(
        siglaMateria, 
        cartellaBase.id, 
        driveService, 
        logger, 
        contestoRegistrazioneMateria, 
        registrazioneManager, 
        tipoDocumento
      );
      
      if (!cartellaMateria) continue;
      stats.cartelleCreateTotali++;

      // Crea sottocartelle per le classi
      for (const classe of classiAttive) {
        const nomeClasse = classe.ottieniNome();
        const annoCorso = classe.ottieniAnnoCorso();
        
        // Verifica se la classe rientra negli anni di corso specificati
        if (anniCorso.length > 0 && !anniCorso.includes(annoCorso.toString())) {
          continue;
        }
        
        // Crea contesto per il placeholder service
        const contestoClasse = {
          materia: siglaMateria,
          nome_materia: nomeMateria,
          classe: nomeClasse,
          annoScolastico: gestoreMaterie.gestoreDB.ottieniAnniScolastici()[0]
        };
        
        // Sostituisci i placeholder nel nome della cartella
        const nomeSottocartella = placeholderService.sostituisciInStringa(pattern, contestoClasse);
        
        // Crea contesto di registrazione per la classe
        const contestoRegistrazioneClasse = registrazioneManager.creaContestoRegistrazione(
          { classe: nomeClasse, materia: siglaMateria },
          `${cartellaBase.name}/${siglaMateria}`,
          nomeSottocartella
        );
        
        const nuovaCartella = creaSingolaCartella(
          nomeSottocartella, 
          cartellaMateria.id, 
          driveService, 
          logger, 
          contestoRegistrazioneClasse, 
          registrazioneManager, 
          tipoDocumento
        );
        
        if (nuovaCartella) {
          stats.cartelleCreateTotali++;
          stats.dettagli.push(`Creata sottocartella per classe: ${nomeSottocartella} per materia ${siglaMateria}`);
        }
      }
    } catch (e) {
      logger.error(`Errore nella creazione delle sottocartelle per la materia ${materia.ottieniSigla()}: ${e.message}`);
      stats.errori++;
    }
  }
}

/**
 * Crea sottocartelle per dipartimenti, usando PlaceholderService.
 * @param {Object} cartellaBase - Oggetto cartella base
 * @param {string} pattern - Pattern per i nomi delle sottocartelle
 * @param {MyDatabaseService} database - Database
 * @param {MyDriveService} driveService - Servizio Drive
 * @param {MyPlaceholderService} placeholderService - Servizio per i placeholder
 * @param {RegistrazioneCartelleManager} registrazioneManager - Manager registrazione cartelle
 * @param {string} tipoDocumento - Tipo di documento
 * @param {Object} stats - Statistiche da aggiornare
 * @param {MyLoggerService} logger - Logger
 */
function _creaSottocartellePerDipartimenti(cartellaBase, pattern, database, driveService, placeholderService, registrazioneManager, tipoDocumento, stats, logger) {
  try {
    // Ottieni tutti i dipartimenti
    const dipartimenti = database.select().from("DIPARTIMENTI").execute();
    if (!dipartimenti || dipartimenti.length === 0) {
      logger.warn("Nessun dipartimento trovato nel database");
      return;
    }

    const annoScolastico = database.gestoreDB ? database.gestoreDB.ottieniAnniScolastici()[0] : "";

    for (const dipartimento of dipartimenti) {
      try {
        const siglaDipartimento = dipartimento["DIPARTIMENTO"];
        const nomeDipartimento = dipartimento["NOME"] || siglaDipartimento;
        
        // Crea contesto per il placeholder service
        const contestoDipartimento = {
          dipartimento: siglaDipartimento,
          nome_dipartimento: nomeDipartimento,
          annoScolastico: annoScolastico
        };
        
        // Sostituisci i placeholder nel nome della cartella
        const nomeSottocartella = placeholderService.sostituisciInStringa(pattern, contestoDipartimento);
        
        // Crea contesto di registrazione per il dipartimento
        const contestoRegistrazioneDipartimento = registrazioneManager.creaContestoRegistrazione(
          {},
          cartellaBase.name,
          nomeSottocartella
        );
        
        const nuovaCartella = creaSingolaCartella(
          nomeSottocartella, 
          cartellaBase.id, 
          driveService, 
          logger, 
          contestoRegistrazioneDipartimento, 
          registrazioneManager, 
          tipoDocumento
        );
        
        if (nuovaCartella) {
          stats.cartelleCreateTotali++;
          stats.dettagli.push(`Creata sottocartella per dipartimento: ${nomeSottocartella}`);
        }
      } catch (e) {
        logger.error(`Errore nella creazione della sottocartella per il dipartimento ${dipartimento["DIPARTIMENTO"]}: ${e.message}`);
        stats.errori++;
      }
    }
  } catch (e) {
    logger.error(`Errore nel recupero dei dipartimenti: ${e.message}`);
    stats.errori++;
  }
}