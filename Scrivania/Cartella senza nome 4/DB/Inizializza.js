/**
 * Gestisce i database degli anni scolastici e le loro relazioni.
 */
class GestoreDatabaseAnniScolastici {
  /**
   * @param {MyLoggerService} logger - Servizio di logging
   * @param {MyCacheService} cache - Servizio di cache
   * @param {MyUtilsService} utils - Servizio di utilità
   * @param {MySpreadsheetService} spreadsheetService - Servizio per fogli di calcolo
   */
  constructor(logger, cache, utils, spreadsheetService) {
    // Riceviamo i servizi in DI e li salviamo localmente
    this._logger = logger;
    this._cache = cache;
    this._utils = utils;
    this._spreadsheetService = spreadsheetService;

    // Mappa: { "2023-2024": MyDatabaseService, ... }
    this._databases = {};

    // Riferimento al foglio principale (dove sono elencati anni scolastici e ID spreadsheet)
    this._foglioPrincipale = null;

    // Array di oggetti { nome, idDatabase, idCartella } per i vari anni
    this._datiAnni = [];

    // Avvia l'inizializzazione (legge i dati dal foglio)
    this._inizializza();
  }

  /**
   * Ottiene l'elenco di tutte le sigle delle materie dal database
   * @param {boolean} soloAttive - Se true, restituisce solo materie attive
   * @param {string|null} nomeAnno - Nome dell'anno scolastico (null = anno attuale)
   * @param {boolean} usaCache - Se true, utilizza la cache (default: true)
   * @return {string[]} Array di stringhe contenenti le sigle delle materie
   */
  ottieniSigleMaterie(soloAttive = true, nomeAnno = null, usaCache = true) {
    // Determina l'anno da utilizzare
    const annoEffettivo = nomeAnno || (this._datiAnni.length > 0 ? this._datiAnni[0].nome : null);
    
    if (!annoEffettivo) {
      this._logger.error("Nessun anno scolastico disponibile per ottenere le sigle delle materie");
      return [];
    }
    
    // Chiave univoca per la cache che include l'anno
    const chiaveCache = `sigle_materie_${annoEffettivo}_${soloAttive ? 'attive' : 'tutte'}`;
    
    // Se abilitata, verifica se i dati sono già in cache
    if (usaCache) {
      const datiCached = this._cache.ottieni(chiaveCache);
      if (datiCached) {
        return datiCached;
      }
    }
    
    try {
      // Ottiene il database dell'anno specificato o dell'anno attuale
      const db = nomeAnno ? this.ottieniDatabaseAnno(nomeAnno) : this.ottieniDatabaseAnnoAttuale();
      
      if (!db || !db.tables['MATERIE']) {
        this._logger.warn(`Tabella MATERIE non trovata nel database dell'anno ${annoEffettivo}`);
        return [];
      }
      
      // Ottenere tutte le righe dalla tabella MATERIE
      let righeMaterie = db.tables['MATERIE'].ottieniRighe();
      
      // Filtrare per materie attive se richiesto
      if (soloAttive) {
        righeMaterie = righeMaterie.filter(materia => 
          materia['ATT'] === undefined || materia['ATT'] === true
        );
      }
      
      // Estrae le sigle
      const sigleMaterie = righeMaterie
        .map(materia => materia['SIGLA'])
        .filter(sigla => sigla); // Filtra eventuali valori null/undefined
      
      // Salva in cache se abilitata
      if (usaCache) {
        this._cache.imposta(chiaveCache, sigleMaterie, 3600); // Cache di 1 ora
      }
      
      return sigleMaterie;
    } catch (e) {
      this._logger.error(`Errore nell'ottenere le sigle delle materie per l'anno ${annoEffettivo}: ${e.message}`);
      return [];
    }
  }

  /**
   * Inizializza il gestore caricando i dati dal foglio principale
   * @private
   */
  _inizializza() {
    try {
      // 1. Apre il foglio "principale" (attivo) tramite lo spreadsheetService
      this._foglioPrincipale = this._spreadsheetService
        .apriFoglioAttivo()
        .ottieniRisultato();

      const schede = this._spreadsheetService
        .ottieniSchede(this._foglioPrincipale, true)
        .ottieniRisultato();
        
      if (!schede || schede.length === 0) {
        this._logger.error("Nessuna scheda trovata nel foglio principale");
        throw new Error("Struttura del foglio principale non valida");
      }

      // 2. Carichiamo i dati dalla prima scheda, ipotizzando contenga "ANNO_SCOLASTICO", "ID_SPREADSHEET", ecc.
      const dati = this._spreadsheetService
        .ottieniValori(
          this._foglioPrincipale,
          schede[0].nome,
          "A1:Z",
          true
        )
        .ottieniRisultato();
        
      if (!dati || dati.length < 2) {
        this._logger.error("Dati insufficienti nel foglio principale");
        throw new Error("Nessun anno scolastico trovato");
      }

      // Cerchiamo le colonne: "ANNO_SCOLASTICO", "ID_SPREADSHEET", "ID_CARTELLA_GOOGLE"
      const intestazione = dati[0];
      const idxAnno = intestazione.indexOf("ANNO_SCOLASTICO");
      const idxSpreadsheet = intestazione.indexOf("ID_SPREADSHEET");
      const idxCartella = intestazione.indexOf("ID_CARTELLA_GOOGLE");

      if (idxAnno === -1 || idxSpreadsheet === -1 || idxCartella === -1) {
        this._logger.error("Colonne mancanti nel foglio principale");
        throw new Error("Struttura del foglio principale non valida");
      }

      // 3. Popoliamo _datiAnni
      for (let i = 1; i < dati.length; i++) {
        const r = dati[i];
        const annoScolastico = r[idxAnno];
        const idSpread = r[idxSpreadsheet];
        const idCartella = r[idxCartella] || null;

        if (annoScolastico && idSpread) {
          this._datiAnni.push({
            nome: annoScolastico,
            idDatabase: idSpread,
            idCartella
          });
        }
      }
      this._logger.info(
        `Caricati ${this._datiAnni.length} anni scolastici dal foglio principale`
      );

      // 4. Carichiamo subito (se esiste) il primo anno come DB attuale
      if (this._datiAnni.length > 0) {
        this.ottieniDatabaseAnnoAttuale();
      }
    } catch (e) {
      this._logger.error(
        `Errore nell'inizializzazione del gestore anni scolastici: ${e.message}`
      );
      throw e;
    }
  }

  /**
   * Ritorna il DB dell'anno corrente (il primo nell'elenco)
   * @return {MyDatabaseService}
   */
  ottieniDatabaseAnnoAttuale() {
    if (this._datiAnni.length === 0) {
      throw new Error("Nessun anno scolastico disponibile");
    }
    return this.ottieniDatabaseAnno(this._datiAnni[0].nome);
  }

  /**
   * Ritorna il DB per un anno scolastico specifico
   * @param {string} nomeAnno es: "2023-2024"
   * @return {MyDatabaseService}
   */
  ottieniDatabaseAnno(nomeAnno) {
    // Se già presente nella cache
    if (this._databases[nomeAnno]) {
      return this._databases[nomeAnno];
    }

    // Cerca i dati dell'anno
    const info = this._datiAnni.find(a => a.nome === nomeAnno);
    if (!info) {
      throw new Error(`Anno scolastico "${nomeAnno}" non trovato`);
    }

    this._logger.info(`Caricamento database per l'anno scolastico: ${nomeAnno}`);

    // Istanzia MyDatabaseService
    const db = new MyDatabaseService(
      info.idDatabase,
      this._spreadsheetService,
      this._logger,
      this._utils
    );

    // Configura relazioni e chiavi primarie
    this._configuraRelazioni(db);

    // Verifica schema
    const check = db.verificaSchema();
    if (!check.valido) {
      this._logger.warn(
        `Schema del database per l'anno ${nomeAnno} ha problemi: ${check.errori.join(', ')}`
      );
    }

    // Salva in cache
    this._databases[nomeAnno] = db;
    return db;
  }

  /**
   * Elenco anni scolastici disponibili
   * @return {string[]}
   */
  ottieniAnniScolastici() {
    return this._datiAnni.map(a => a.nome);
  }

  /**
   * Configura relazioni e chiavi primarie su tutte le tabelle
   * @param {MyDatabaseService} db
   * @private
   */
  _configuraRelazioni(db) {
    this._logger.info("Imposto chiavi primarie, colonne virtuali e relazioni tra tabelle...");

    // Definizione colonne virtuali
    
    // Configurazione PIANI_PERS
    if (db.tables["PIANI_PERS"]) {
      // Definisci colonna virtuale CHIAVE UNIVOCA
      db.tables["PIANI_PERS"].definisciColonnaVirtuale("CHIAVE UNIVOCA", riga => {
        return `${riga["EMAIL ALUNNO"] || ""}_${riga["TIPO"] || ""}`;
      });
      
      // Imposta come chiave primaria
      db.tables["PIANI_PERS"].impostaChiavePrimaria("CHIAVE UNIVOCA");
    }

    // Configurazione CARENZE
    if (db.tables["CARENZE"]) {
      // Definisci colonna virtuale CHIAVE UNICA
      db.tables["CARENZE"].definisciColonnaVirtuale("CHIAVE UNICA", riga => {
        return `${riga["EMAIL ALUNNO"] || ""}_${riga["DATA REPORT"] || ""}`;
      });
      
      // Imposta come chiave primaria
      db.tables["CARENZE"].impostaChiavePrimaria("CHIAVE UNICA");
    }

    // Configurazione DOC_GEN
    if (db.tables["DOC_GEN"]) {
      // Definisci colonna virtuale CHIAVE ALUNNO
      db.tables["DOC_GEN"].definisciColonnaVirtuale("CHIAVE ALUNNO", riga => {
        return `${riga["ALUNNO"] || ""}_${riga["TIPO"] || ""}`;
      });
      
      // Mantiene "ID" come chiave primaria
      db.tables["DOC_GEN"].impostaChiavePrimaria("ID");
    }

    // Impostiamo manualmente le chiavi primarie per tutte le tabelle note.
    // ATTENZIONE: Se una tabella non ha la colonna specificata, la chiamata
    // 'impostaChiavePrimaria' non troverà nulla. Quindi modifica in base
    // alle reali colonne univoche presenti.

    if (db.tables["CLASSI"]) {
      // Usando "CLASSE" come PK, se è univoca
      db.tables["CLASSI"].impostaChiavePrimaria("CLASSE");
    }

    if (db.tables["RUOLI"]) {
      // Se c'è una colonna ID o RUOLO univoca, modifica a piacere
      db.tables["RUOLI"].impostaChiavePrimaria("RUOLO");
    }

    if (db.tables["EVENTI"]) {
      // Definisci colonna virtuale CHIAVE UNICA
      db.tables["EVENTI"].definisciColonnaVirtuale("CHIAVE UNICA", riga => {
        return `${riga["GRUPPO"] || ""}_${riga["TIPO"] || ""}_${riga["DATA"] || ""}`;
      });
      // Se la colonna univoca si chiama "CHIAVE UNICA"
      db.tables["EVENTI"].impostaChiavePrimaria("CHIAVE UNICA");
    }

    if (db.tables["DOCENTI"]) {
      // Spesso l'EMAIL del docente è univoca
      db.tables["DOCENTI"].impostaChiavePrimaria("EMAIL");
    }


    if (db.tables["DIPARTIMENTI"]) {
      // Se c'è una colonna "NOME_DIP" o "ID" univoca
      db.tables["DIPARTIMENTI"].impostaChiavePrimaria("DIPARTIMENTO");
    }

    if (db.tables["SUPPLENZE"]) {
      // Definisci colonna virtuale CHIAVE UNICA
      db.tables["SUPPLENZE"].definisciColonnaVirtuale("CHIAVE UNICA", riga => {
        return `${riga["DOCENTE TITOLARE"] || ""}_${riga["DATA INIZIO"] || ""}_${riga["SUPPLENTE"] || ""}`;
      });
      // Di solito un ID generato
      db.tables["SUPPLENZE"].impostaChiavePrimaria("CHIAVE UNICA");
    }

    if (db.tables["ALUNNI"]) {
      // Se l'e-mail dell'alunno è unica
      db.tables["ALUNNI"].impostaChiavePrimaria("EMAIL");
    }

    if (db.tables["TRASF_ALUNNI"]) {
      // Definisci colonna virtuale CHIAVE UNICA
      db.tables["TRASF_ALUNNI"].definisciColonnaVirtuale("CHIAVE UNICA", riga => {
        return `${riga["CLASSE"] || ""}_${riga["EMAIL ALUNNO"] || ""}_${riga["DATA IN"] || ""}__${riga["DATA OUT"] || ""}`;
      });
      // Magari un ID
      db.tables["TRASF_ALUNNI"].impostaChiavePrimaria("CHIAVE UNICA");
    }

    

    if (db.tables["MATERIE"]) {
      // Ad es. "SIGLA" univoca
      db.tables["MATERIE"].impostaChiavePrimaria("SIGLA");
    }

    if (db.tables["INDIRIZZI"]) {
      // Se la colonna "SIGLA" è univoca
      db.tables["INDIRIZZI"].impostaChiavePrimaria("SIGLA");
    }

    if (db.tables["DOCUMENTI"]) {
      // Se c'è "ID" o "DOC_ID" ecc.
      db.tables["DOCUMENTI"].impostaChiavePrimaria("ID");
    }

    if (db.tables["PLACEHOLDER"]) {
      // Se esiste un "ID" univoco
      db.tables["PLACEHOLDER"].impostaChiavePrimaria("FORMATO");
    }

    if (db.tables["PTN_EMAIL"]) {
      db.tables["PTN_EMAIL"].impostaChiavePrimaria("IDENTIFICATIVO NOTIFICA");
    }

    if (db.tables["PTN_OPS"]) {
      db.tables["PTN_OPS"].impostaChiavePrimaria("NOME PATTERN");
    }

    if (db.tables["FOLDER_GEN"]) {
      db.tables["FOLDER_GEN"].impostaChiavePrimaria("ID");
    }

  }
}