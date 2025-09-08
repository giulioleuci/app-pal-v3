/**
 * @fileoverview Esempio di utilizzo del nuovo sistema di notifiche per inviare
 * notifiche email utilizzando la nuova architettura a tre livelli per Google Apps Script.
 */

/**
 * Esempio 1: Invio notifica Piani di Lavoro ai coordinatori
 */
function eseguiInvioNotificaPianiLavoro() {
  const servizi = inizializzaServizi(); 
  const logger = servizi.logger;
  const gestoreAlunni = servizi.gestoreAlunni;
  const gestoreDocenti = servizi.gestoreDocenti;
  const gestoreMaterie = servizi.gestoreMaterie;
  const gestoreClassi = servizi.gestoreClassi;
  const gestoreDocumentiGenerati = servizi.gestoreDocumentiGenerati;
  const gestoreCartelle = servizi.gestoreCartelle;
  const gestoreCarenze = servizi.gestoreCarenze;
  const gestorePattern = servizi.gestorePattern;
  const gestoreRuoli = servizi.gestoreRuoli;
  const myMailService = servizi.myMailService;
  const placeholderService = servizi.placeholderService;

  logger.info("=== Avvio job: Invio Notifica Piani di Lavoro ai Coordinatori ===");

  try {
    const costruttoreDati = new CostruttoreDatiEmail(
      logger, gestoreAlunni, gestoreDocenti, gestoreMaterie, gestoreClassi, gestoreDocumentiGenerati, gestoreCartelle, gestoreCarenze
    );

    const pacchettiDiInvio = costruttoreDati
      .aggiungiDatiPerBox('documenti', { 
        tipo: 'PIANO_LAVORO', 
        nonNotificato: true 
      })
      .conDestinatari('coordinatori')
      .aggregaPer(destinatario => destinatario.ottieniEmail())
      .costruisci('NOTIFICA_PIANO_LAVORO');

    if (!pacchettiDiInvio || pacchettiDiInvio.length === 0) {
      logger.info("Nessun Piano di Lavoro trovato da notificare.");
      return;
    }

    logger.info(`Preparati ${pacchettiDiInvio.length} pacchetti di notifica.`);

    const formattatore = new FormattatoreDatiEmail(
      logger, gestorePattern, placeholderService, gestoreMaterie, gestoreAlunni
    );

    const processoreAzioni = new ProcessoreAzioniPostInvioNotifica(
      logger, servizi.utils, servizi.gestoreDB, gestoreAlunni, gestoreDocenti
    );

    const gestoreNotifiche = new GestoreNotifiche(
      logger, myMailService, formattatore, gestorePattern, 
      gestoreRuoli, servizi.gestoreDB, processoreAzioni
    );

    const risultati = gestoreNotifiche.invia(pacchettiDiInvio);
    
    logger.info(`Invio completato. Successi: ${risultati.inviateConSuccesso}, Falliti: ${risultati.fallite}`);
    
    if (risultati.errori && risultati.errori.length > 0) {
      risultati.errori.forEach(errore => {
        logger.error(`Errore pacchetto ${errore.pacchetto} (${errore.pattern}): ${errore.errore}`);
      });
    }

    logger.info("=== Job completato con successo ===");

  } catch (e) {
    logger.error(`!!! Errore critico durante il job di invio notifiche: ${e.message}`);
    logger.error(e.stack);
  }
}

/**
 * Esempio 2: Invio notifica carenze ai genitori
 */
function eseguiInvioNotificaCarenze() {
  const servizi = inizializzaServizi();
  const logger = servizi.logger;
  const gestoreAlunni = servizi.gestoreAlunni;
  const gestoreDocenti = servizi.gestoreDocenti;
  const gestoreMaterie = servizi.gestoreMaterie;
  const gestoreClassi = servizi.gestoreClassi;
  const gestoreDocumentiGenerati = servizi.gestoreDocumentiGenerati;
  const gestoreCartelle = servizi.gestoreCartelle;
  const gestoreCarenze = servizi.gestoreCarenze;
  const gestorePattern = servizi.gestorePattern;
  const gestoreRuoli = servizi.gestoreRuoli;
  const myMailService = servizi.myMailService;
  const placeholderService = servizi.placeholderService;

  logger.info("=== Avvio job: Invio Notifica Carenze ai Genitori ===");

  try {
    const costruttoreDati = new CostruttoreDatiEmail(
      logger, gestoreAlunni, gestoreDocenti, gestoreMaterie, gestoreClassi, gestoreDocumentiGenerati, gestoreCartelle, gestoreCarenze
    );

    const pacchettiDiInvio = costruttoreDati
      .aggiungiDatiPerBox('carenze', { 
        nonNotificato: true,
        dataReport: new Date().toLocaleDateString('it-IT') 
      })
      .conDestinatari('genitori')
      .aggregaPer(destinatario => destinatario.ottieniEmail())
      .costruisci('NOTIFICA_CARENZE');

    if (!pacchettiDiInvio || pacchettiDiInvio.length === 0) {
      logger.info("Nessuna carenza trovata da notificare.");
      return;
    }

    const formattatore = new FormattatoreDatiEmail(
      logger, gestorePattern, placeholderService, gestoreMaterie, gestoreAlunni
    );

    const processoreAzioni = new ProcessoreAzioniPostInvioNotifica(
      logger, servizi.utils, servizi.gestoreDB, gestoreAlunni, gestoreDocenti
    );

    const gestoreNotifiche = new GestoreNotifiche(
      logger, myMailService, formattatore, gestorePattern, 
      gestoreRuoli, servizi.gestoreDB, processoreAzioni
    );

    const risultati = gestoreNotifiche.invia(pacchettiDiInvio);
    
    logger.info(`Carenze inviate. Successi: ${risultati.inviateConSuccesso}, Falliti: ${risultati.fallite}`);

    logger.info("=== Job completato con successo ===");

  } catch (e) {
    logger.error(`!!! Errore critico durante il job carenze: ${e.message}`);
    logger.error(e.stack);
  }
}

/**
 * Esempio 3: Invio notifica documenti per classe specifica
 */
function eseguiInvioNotificaDocumentiClasse(classeId, tipoDocumento) {
  const servizi = inizializzaServizi();
  const logger = servizi.logger;
  const gestoreAlunni = servizi.gestoreAlunni;
  const gestoreDocenti = servizi.gestoreDocenti;
  const gestoreMaterie = servizi.gestoreMaterie;
  const gestoreClassi = servizi.gestoreClassi;
  const gestoreDocumentiGenerati = servizi.gestoreDocumentiGenerati;
  const gestoreCartelle = servizi.gestoreCartelle;
  const gestoreCarenze = servizi.gestoreCarenze;
  const gestorePattern = servizi.gestorePattern;
  const gestoreRuoli = servizi.gestoreRuoli;
  const myMailService = servizi.myMailService;
  const placeholderService = servizi.placeholderService;

  logger.info(`=== Invio Notifica Documenti per classe ${classeId} ===`);

  try {
    const costruttoreDati = new CostruttoreDatiEmail(
      logger, gestoreAlunni, gestoreDocenti, gestoreMaterie, gestoreClassi, gestoreDocumentiGenerati, gestoreCartelle, gestoreCarenze
    );

    const pacchettiDiInvio = costruttoreDati
      .aggiungiDatiPerBox('documenti', { 
        tipo: tipoDocumento,
        classe: classeId,
        nonNotificato: true 
      })
      .conDestinatari('coordinatori', { classe: classeId })
      .costruisci('NOTIFICA_DOCUMENTI_CLASSE');

    if (!pacchettiDiInvio || pacchettiDiInvio.length === 0) {
      logger.info(`Nessun documento ${tipoDocumento} per la classe ${classeId}.`);
      return;
    }

    const formattatore = new FormattatoreDatiEmail(
      logger, gestorePattern, placeholderService, gestoreMaterie, gestoreAlunni
    );

    const processoreAzioni = new ProcessoreAzioniPostInvioNotifica(
      logger, servizi.utils, servizi.gestoreDB, gestoreAlunni, gestoreDocenti
    );

    const gestoreNotifiche = new GestoreNotifiche(
      logger, myMailService, formattatore, gestorePattern, 
      gestoreRuoli, servizi.gestoreDB, processoreAzioni
    );

    const risultati = gestoreNotifiche.invia(pacchettiDiInvio);
    
    logger.info(`Documenti classe inviati. Successi: ${risultati.inviateConSuccesso}`);

  } catch (e) {
    logger.error(`Errore invio documenti classe: ${e.message}`);
  }
}