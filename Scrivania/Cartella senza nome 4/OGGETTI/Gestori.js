/**
 * Classe base per tutti i gestori di entità
 */
class GestoreBase {
  /**
   * @param {MyLoggerService} logger - Servizio di logging
   * @param {GestoreDatabaseAnniScolastici} gestoreDB - Gestore del database anni scolastici
   * @param {MyCacheService} cache - Servizio di caching
   * @param {MyUtilsService} utils - Servizio di utilità
   */
  constructor(logger, gestoreDB, cache, utils) {
    this.logger = logger;
    this.gestoreDB = gestoreDB;
    this.cache = cache;
    this.utils = utils;
    
    this.nomeTabella = this._ottieniNomeTabella();
    this.db = this.gestoreDB.ottieniDatabaseAnnoAttuale();
    this.datiCache = null;

    // Flag per filtrare solo record attivi (valore predefinito: true)
    this._soloAttivi = true;
  }
  
  /**
   * Inizializza il gestore caricando i dati
   */
  inizializza() {
    try {
      this.logger.info(`Inizializzazione ${this.constructor.name}`);
      this.caricaDati();
      return true;
    } catch (e) {
      this.logger.error(`Errore nell'inizializzazione di ${this.constructor.name}: ${e.message}`);
      return false;
    }
  }
  
  /**
   * Carica i dati dal database
   * @param {boolean} forzaAggiornamento - Se true, forza il ricaricamento anche se già in cache
   * @return {Array} Array di dati caricati
   */
  caricaDati(forzaAggiornamento = false) {
    const chiaveCache = this._ottieniChiaveCache();
    
    // Controllo se i dati sono già in cache
    if (!forzaAggiornamento && this.datiCache) {
      return this.datiCache;
    }
    
    // Prova a ottenere dalla cache
    if (!forzaAggiornamento) {
      const datiCached = this.cache.ottieni(chiaveCache);
      if (datiCached) {
        this.datiCache = datiCached;
        return this.datiCache;
      }
    }
    
    // Carica dal database
    let query = this.db.select()
      .from(this.nomeTabella);
    
    // Applica il filtro per i record attivi se necessario
    if (this._soloAttivi) {
      query = this._applicaFiltroAttivi(query);
    }
    
    // Esegui la query
    const righe = query.execute();
    
    // Converti le righe in oggetti entità
    const entita = righe.map(riga => this._creaEntita(riga));
    
    this.datiCache = entita;
    
    // Salva in cache
    this.cache.imposta(chiaveCache, this.datiCache, 300); // 5 minuti
    
    return this.datiCache;
  }

  /**
   * Applica il filtro per i record attivi alla query
   * @param {AdvancedQueryBuilder} query - Query builder
   * @return {AdvancedQueryBuilder} Query builder modificata
   * @private
   */
  _applicaFiltroAttivi(query) {
    // Metodo di base che non fa nulla, da sovrascrivere nelle classi derivate se necessario
    return query;
  }

  /**
   * Imposta se devono essere mostrati solo i record attivi
   * @param {boolean} soloAttivi - Se true, mostra solo i record attivi
   * @return {GestoreBase} This per concatenamento
   */
  impostaSoloAttivi(soloAttivi) {
    if (this._soloAttivi !== soloAttivi) {
      this._soloAttivi = soloAttivi;
      // Invalida la cache per forzare il ricaricamento dei dati
      this.datiCache = null;
    }
    return this;
  }

  /**
   * Ritorna se sono mostrati solo i record attivi
   * @return {boolean} True se sono mostrati solo i record attivi
   */
  ottieniSoloAttivi() {
    return this._soloAttivi;
  }
  
  /**
   * Ottiene un'entità per ID
   * @param {string} id - ID dell'entità
   * @return {EntitaBase} Entità trovata o null
   */
  ottieniPerId(id) {
    try {
      if (!id) return null;
      
      // Verifica se è necessario caricare i dati
      if (!this.datiCache) {
        this.caricaDati();
      }
      
      // Cerca nell'array di entità
      return this.datiCache.find(entita => this._ottieniIdEntita(entita) === id) || null;
    } catch (e) {
      this.logger.error(`Errore nell'ottenere entità per ID ${id}: ${e.message}`);
      return null;
    }
  }
  
  /**
   * Ottiene tutte le entità caricate
   * @return {Array} Tutte le entità
   */
  ottieniTutti() {
    if (!this.datiCache) {
      this.caricaDati();
    }
    
    return this.datiCache || [];
  }

  /**
   * Filtra le entità in base a un criterio
   * @param {Function} filtro - Funzione di filtro
   * @return {Array} Entità filtrate
   */
  filtra(filtro) {
    if (!this.datiCache) {
      this.caricaDati();
    }
    
    if (typeof filtro !== 'function') {
      return this.datiCache;
    }
    
    return this.datiCache.filter(filtro);
  }
  
  /**
   * Ottiene il nome della tabella nel database
   * @private
   */
  _ottieniNomeTabella() {
    throw new Error('Metodo _ottieniNomeTabella deve essere implementato dalla classe derivata');
  }
  
  /**
   * Crea un'entità dai dati grezzi
   * @param {Object} dati - Dati grezzi
   * @private
   */
  _creaEntita(dati) {
    throw new Error('Metodo _creaEntita deve essere implementato dalla classe derivata');
  }
  
  /**
   * Ottiene l'ID di un'entità
   * @param {EntitaBase} entita - Entità
   * @private
   */
  _ottieniIdEntita(entita) {
    throw new Error('Metodo _ottieniIdEntita deve essere implementato dalla classe derivata');
  }
  
  /**
   * Genera una chiave per la cache
   * @private
   */
  _ottieniChiaveCache() {
    return `${this.constructor.name}_${this.nomeTabella}_cache_${this._soloAttivi ? 'attivi' : 'tutti'}`;
  }
}

/**
 * Gestisce gli alunni
 */
class GestoreAlunni extends GestoreBase {
  constructor(logger, gestoreDB, cache, utils) {
    super(logger, gestoreDB, cache, utils);
  }
  
  _ottieniNomeTabella() {
    return 'ALUNNI';
  }
  
  _creaEntita(dati) {
    return new Alunno(dati, this.utils, this.gestoreDB);
  }
  
  _ottieniIdEntita(entita) {
    if (entita instanceof Alunno) {
      return entita.ottieniEmail();
    }
    return entita.dati.EMAIL;
  }

  /**
   * Applica il filtro per i record attivi alla query
   * @param {AdvancedQueryBuilder} query - Query builder
   * @return {AdvancedQueryBuilder} Query builder modificata
   * @private
   */
  _applicaFiltroAttivi(query) {
    return query.where('ATT', '!=', false);
  }
  
  /**
   * Ottiene un alunno per email
   * @param {string} email - Email dell'alunno
   * @return {Alunno} Alunno trovato o null
   */
  ottieniPerEmail(email) {
    return this.ottieniPerId(email);
  }
  
  /**
   * Ottiene gli alunni di una classe
   * @param {string} nomeClasse - Nome della classe
   * @return {Array} Alunni della classe
   */
  ottieniPerClasse(nomeClasse) {
    if (!this.db || !nomeClasse) return [];
    
    const query = this.db.select()
      .from(this.nomeTabella)
      .where('CLASSE', '=', nomeClasse);
      
    // Applica il filtro per i record attivi se necessario
    if (this._soloAttivi) {
      query.where('ATT', '!=', false);
    }
    
    const righe = query.execute();
    return righe.map(riga => this._creaEntita(riga));
  }
  
  /**
   * Ottiene gli alunni con un determinato tipo di religione
   * @param {string} tipoReligione - Tipo di religione (Si, Alt., No)
   * @return {Array} Alunni filtrati
   */
  ottieniPerReligione(tipoReligione) {
    if (!this.db || !tipoReligione) return [];
    
    const query = this.db.select()
      .from(this.nomeTabella)
      .where('RELIGIONE', '=', tipoReligione);
      
    // Applica il filtro per i record attivi se necessario
    if (this._soloAttivi) {
      query.where('ATT', '!=', false);
    }
    
    const righe = query.execute();
    return righe.map(riga => this._creaEntita(riga));
  }
  
  /**
   * Ottiene gli alunni che sono rappresentanti di classe
   * @return {Array} Alunni rappresentanti
   */
  ottieniRappresentanti() {
    if (!this.db) return [];
    
    const query = this.db.select()
      .from(this.nomeTabella)
      .where('RAPPR STUDENTI', '=', true);
      
    // Applica il filtro per i record attivi se necessario
    if (this._soloAttivi) {
      query.where('ATT', '!=', false);
    }
    
    const righe = query.execute();
    return righe.map(riga => this._creaEntita(riga));
  }
  
  /**
   * Ottiene gli alunni ripetenti
   * @return {Array} Alunni ripetenti
   */
  ottieniRipetenti() {
    if (!this.db) return [];
    
    const query = this.db.select()
      .from(this.nomeTabella)
      .where('RIPETENTE', '=', true);
      
    // Applica il filtro per i record attivi se necessario
    if (this._soloAttivi) {
      query.where('ATT', '!=', false);
    }
    
    const righe = query.execute();
    return righe.map(riga => this._creaEntita(riga));
  }
  
  /**
   * Cerca alunni per nome/cognome
   * @param {string} testo - Testo da cercare
   * @return {Array} Alunni trovati
   */
  cercaPerNome(testo) {
    if (!this.db || !testo) return [];
    
    const testoLower = testo.toLowerCase();
    
    // Poiché non è possibile utilizzare direttamente il pattern where(campo, operatore, valore)
    // per questa ricerca complessa, usiamo l'array dei dati già caricati e filtriamo
    const alunni = this.caricaDati();
    return alunni.filter(alunno => 
      alunno.ottieniNomeCompleto().toLowerCase().includes(testoLower)
    );
  }
  
  /**
   * Ottiene gli alunni con piani personalizzati
   * @param {string} tipoPiano - Tipo di piano, opzionale
   * @return {Array} Alunni con piani personalizzati
   */
  ottieniConPianiPersonalizzati(tipoPiano = null) {
    if (!this.db) return [];
    
    // Ottieni tutti gli alunni
    const alunni = this.caricaDati();
    
    // Filtra gli alunni che hanno piani personalizzati
    return alunni.filter(alunno => {
      const pianiPersonalizzati = alunno.ottieniPianiPersonalizzati();
      
      // Se non ci sono piani, escludi l'alunno
      if (!pianiPersonalizzati || pianiPersonalizzati.length === 0) {
        return false;
      }
      
      // Se è richiesto un tipo specifico, verifica che esista
      if (tipoPiano) {
        return pianiPersonalizzati.some(piano => piano.TIPO === tipoPiano);
      }
      
      // Altrimenti includi tutti gli alunni con qualsiasi piano
      return true;
    });
  }
}

/**
 * Gestisce le classi
 */
class GestoreClassi extends GestoreBase {
  constructor(logger, gestoreDB, cache, utils) {
    super(logger, gestoreDB, cache, utils);
  }
  
  _ottieniNomeTabella() {
    return 'CLASSI';
  }
  
  _creaEntita(dati) {
    return new Classe(dati, this.utils, this.gestoreDB);
  }
  
  _ottieniIdEntita(entita) {
    if (entita instanceof Classe) {
      return entita.ottieniNome();
    }
    return entita.dati.CLASSE;
  }

  /**
   * Applica il filtro per i record attivi alla query
   * @param {AdvancedQueryBuilder} query - Query builder
   * @return {AdvancedQueryBuilder} Query builder modificata
   * @private
   */
  _applicaFiltroAttivi(query) {
    return query.where('ATT', '=', true);
  }
  
  /**
   * Ottiene una classe per nome
   * @param {string} nomeClasse - Nome della classe
   * @return {Classe} Classe trovata o null
   */
  ottieniPerNome(nomeClasse) {
    return this.ottieniPerId(nomeClasse);
  }
  
  /**
   * Ottiene le classi attive
   * @return {Array} Classi attive
   */
  ottieniClassiAttive() {
    if (!this.db) return [];
    
    const query = this.db.select()
      .from(this.nomeTabella)
      .where('ATT', '=', true);
    
    const righe = query.execute();
    return righe.map(riga => this._creaEntita(riga));
  }
  
  /**
   * Ottiene le classi di un determinato anno di corso
   * @param {number} annoCorso - Anno di corso (1-5)
   * @return {Array} Classi filtrate
   */
  ottieniPerAnnoCorso(annoCorso) {
    if (!this.db || !annoCorso) return [];
    
    const query = this.db.select()
      .from(this.nomeTabella)
      .where('ANNO CORSO', '=', annoCorso);
      
    // Applica il filtro per i record attivi se necessario
    if (this._soloAttivi) {
      query.where('ATT', '=', true);
    }
    
    const righe = query.execute();
    return righe.map(riga => this._creaEntita(riga));
  }
  
  /**
   * Ottiene le classi del biennio
   * @return {Array} Classi del biennio
   */
  ottieniClassiBiennio() {
    if (!this.db) return [];
    
    const query = this.db.select()
      .from(this.nomeTabella)
      .where('ANNO CORSO', '<=', 2);
      
    // Applica il filtro per i record attivi se necessario
    if (this._soloAttivi) {
      query.where('ATT', '=', true);
    }
    
    const righe = query.execute();
    return righe.map(riga => this._creaEntita(riga));
  }
  
  /**
   * Ottiene le classi del triennio
   * @return {Array} Classi del triennio
   */
  ottieniClassiTriennio() {
    if (!this.db) return [];
    
    const query = this.db.select()
      .from(this.nomeTabella)
      .where('ANNO CORSO', '>=', 3);
      
    // Applica il filtro per i record attivi se necessario
    if (this._soloAttivi) {
      query.where('ATT', '=', true);
    }
    
    const righe = query.execute();
    return righe.map(riga => this._creaEntita(riga));
  }
  
  /**
   * Ottiene le classi per indirizzo di studi
   * @param {string} indirizzo - Sigla indirizzo
   * @return {Array} Classi filtrate
   */
  ottieniPerIndirizzo(indirizzo) {
    if (!this.db || !indirizzo) return [];
    
    const query = this.db.select()
      .from(this.nomeTabella)
      .where('INDIRIZZO', '=', indirizzo);
      
    // Applica il filtro per i record attivi se necessario
    if (this._soloAttivi) {
      query.where('ATT', '=', true);
    }
    
    const righe = query.execute();
    return righe.map(riga => this._creaEntita(riga));
  }
  
  /**
   * Ottiene le classi articolate principali
   * @return {Array} Classi articolate
   */
  ottieniClassiArticolate() {
    if (!this.db) return [];
    
    // La classe articolata principale è quella che ha definito l'elenco delle classi figlie
    // quindi dobbiamo cercare le classi dove 'ARTIC CHILD' non è vuoto
    const query = this.db.select()
      .from(this.nomeTabella)
      .where('ARTIC CHILD', '!=', '');
      
    // Applica il filtro per i record attivi se necessario
    if (this._soloAttivi) {
      query.where('ATT', '=', true);
    }
    
    const righe = query.execute();
    return righe.map(riga => this._creaEntita(riga));
  }
  
  /**
   * Ottiene le classi coordinate da un docente
   * @param {string} emailDocente - Email del docente coordinatore
   * @return {Array} Classi coordinate
   */
  ottieniPerCoordinatore(emailDocente) {
    if (!this.db || !emailDocente) return [];
    
    // Poiché la query con like non è esattamente quello che vogliamo (potrebbe trovare
    // corrispondenze parziali), usiamo l'array di dati già caricati e filtriamo
    const classi = this.caricaDati();
    return classi.filter(classe => {
      const coordinatori = classe.ottieniCoordinatore();
      return coordinatori.includes(emailDocente);
    });
  }
  
  /**
   * Ottiene le classi con un docente specifico per una materia
   * @param {string} emailDocente - Email del docente
   * @param {string} siglaMateria - Sigla della materia (opzionale)
   * @return {Array} Classi filtrate
   */
  ottieniPerDocente(emailDocente, siglaMateria = null) {
    if (!this.db || !emailDocente) return [];
    
    // Questa query complessa è meglio gestirla con filtri su dati già caricati
    const classi = this.caricaDati();
    
    if (siglaMateria) {
      // Caso con materia specifica
      return classi.filter(classe => {
        const docenti = classe.ottieniDocenteMateria(siglaMateria);
        return docenti.includes(emailDocente);
      });
    } else {
      // Senza materia specifica, controlla tutte le materie possibili
      const sigleMaterie = this.gestoreDB.ottieniSigleMaterie();
      
      return classi.filter(classe => {
        for (const sigla of sigleMaterie) {
          const docenti = classe.ottieniDocenteMateria(sigla);
          if (docenti.includes(emailDocente)) {
            return true;
          }
        }
        return false;
      });
    }
  }
}

/**
 * Gestisce i docenti
 */
class GestoreDocenti extends GestoreBase {
  constructor(logger, gestoreDB, cache, utils) {
    super(logger, gestoreDB, cache, utils);
  }
  
  _ottieniNomeTabella() {
    return 'DOCENTI';
  }
  
  _creaEntita(dati) {
    return new Docente(dati, this.utils, this.gestoreDB);
  }
  
  _ottieniIdEntita(entita) {
    if (entita instanceof Docente) {
      return entita.ottieniEmail();
    }
    return entita.dati.EMAIL;
  }
  
  /**
   * Ottiene un docente per email
   * @param {string} email - Email del docente
   * @return {Docente} Docente trovato o null
   */
  ottieniPerEmail(email) {
    return this.ottieniPerId(email);
  }
  
  /**
   * Ottiene i docenti per dipartimento
   * @param {string} dipartimento - Sigla dipartimento
   * @return {Array} Docenti filtrati
   */
  ottieniPerDipartimento(dipartimento) {
    if (!this.db || !dipartimento) return [];
    
    const query = this.db.select()
      .from(this.nomeTabella)
      .where('DIPARTIMENTO', '=', dipartimento);
    
    const righe = query.execute();
    return righe.map(riga => this._creaEntita(riga));
  }
  
  /**
   * Ottiene i docenti coordinatori
   * @return {Array} Docenti coordinatori
   */
  ottieniCoordinatori() {
    if (!this.db) return [];
    
    // Questa operazione richiede prima di trovare le classi che hanno coordinatori
    const classi = this.db.select()
      .from('CLASSI')
      .execute();
    
    // Raccogliamo tutte le email dei coordinatori
    const emailCoordinatori = new Set();
    classi.forEach(classe => {
      const coordinatori = (classe.COORDINATORE || '').split(',').map(e => e.trim());
      coordinatori.forEach(email => {
        if (email) emailCoordinatori.add(email);
      });
    });
    
    // Ora otteniamo i docenti corrispondenti
    if (emailCoordinatori.size === 0) return [];
    
    const query = this.db.select()
      .from(this.nomeTabella)
      .whereIn('EMAIL', Array.from(emailCoordinatori));
    
    const righe = query.execute();
    return righe.map(riga => this._creaEntita(riga));
  }
  
  /**
   * Ottiene i docenti con ruoli di tutoraggio (PCTO/Orientamento)
   * @return {Array} Docenti tutor
   */
  ottieniTutor() {
    if (!this.db) return [];
    
    // Questa operazione richiede prima di trovare le classi che hanno tutor
    const classi = this.db.select()
      .from('CLASSI')
      .execute();
    
    // Raccogliamo tutte le email dei tutor
    const emailTutor = new Set();
    classi.forEach(classe => {
      const tutorPCTO = (classe['TUTOR PCTO'] || '').split(',').map(e => e.trim());
      const tutorOrient = (classe['TUTOR ORIENT'] || '').split(',').map(e => e.trim());
      
      tutorPCTO.forEach(email => {
        if (email) emailTutor.add(email);
      });
      
      tutorOrient.forEach(email => {
        if (email) emailTutor.add(email);
      });
    });
    
    // Ora otteniamo i docenti corrispondenti
    if (emailTutor.size === 0) return [];
    
    const query = this.db.select()
      .from(this.nomeTabella)
      .whereIn('EMAIL', Array.from(emailTutor));
    
    const righe = query.execute();
    return righe.map(riga => this._creaEntita(riga));
  }
  
  /**
   * Cerca docenti per nome/cognome
   * @param {string} testo - Testo da cercare
   * @return {Array} Docenti trovati
   */
  cercaPerNome(testo) {
    if (!this.db || !testo) return [];
    
    // Per questa ricerca complessa, usiamo l'array dei dati già caricati e filtriamo
    const docenti = this.caricaDati();
    const testoLower = testo.toLowerCase();
    
    return docenti.filter(docente => {
      const nomeCompleto = docente.ottieniNomeCompleto().toLowerCase();
      return nomeCompleto.includes(testoLower);
    });
  }
  
  /**
   * Ottiene i docenti con supplenze attive
   * @param {Date} data - Data di riferimento (default: oggi)
   * @return {Array} Docenti con supplenze
   */
  ottieniConSupplenzeAttive(data = new Date()) {
    if (!this.db) return [];
    
    const dataStr = this.utils.formattaData(data, 'yyyy-MM-dd');
    
    // Prima otteniamo tutte le supplenze attive alla data specificata
    const supplenze = this.db.select()
      .from('SUPPLENZE')
      .where('DATA INIZIO', '<=', dataStr)
      .where('DATA FINE', '>=', dataStr)
      .execute();
    
    // Raccogliamo le email dei docenti titolari
    const emailTitolari = new Set();
    supplenze.forEach(supplenza => {
      if (supplenza['DOCENTE TITOLARE']) {
        emailTitolari.add(supplenza['DOCENTE TITOLARE']);
      }
    });
    
    if (emailTitolari.size === 0) return [];
    
    // Ora otteniamo i docenti titolari
    const query = this.db.select()
      .from(this.nomeTabella)
      .whereIn('EMAIL', Array.from(emailTitolari));
    
    const righe = query.execute();
    return righe.map(riga => this._creaEntita(riga));
  }
}


/**
 * Gestisce i ruoli (tabella RUOLI)
 */
class GestoreRuoli extends GestoreBase {
  constructor(logger, gestoreDB, cache, utils) {
    super(logger, gestoreDB, cache, utils);
  }

  _ottieniNomeTabella() {
    return 'RUOLI';
  }

  _creaEntita(dati) {
    return new Ruolo(dati, this.utils, this.gestoreDB);
  }

  _ottieniIdEntita(entita) {
    return entita.ottieniCodice();
  }

  /**
   * Ottiene un ruolo tramite il suo codice identificativo.
   * @param {string} codiceRuolo - Il codice del ruolo (es. "DIRIGENTE").
   * @returns {Ruolo|null} L'entità Ruolo o null se non trovata.
   */
  ottieniPerCodice(codiceRuolo) {
    return this.ottieniPerId(codiceRuolo);
  }

  /**
   * Ottiene tutti i ruoli ricoperti da un docente specifico.
   * @param {string} emailDocente - L'email del docente.
   * @returns {Ruolo[]} Un array di entità Ruolo.
   */
  ottieniPerDocente(emailDocente) {
    return this.filtra(ruolo => ruolo.ottieniEmailDocente() === emailDocente);
  }

  /**
   * Cerca ruoli il cui nome contiene una determinata stringa.
   * @param {string} testo - Il testo da cercare nel nome del ruolo.
   * @returns {Ruolo[]} Un array di entità Ruolo che corrispondono alla ricerca.
   */
  cercaPerNome(testo) {
    const testoLower = testo.toLowerCase();
    return this.filtra(ruolo => ruolo.ottieniNome().toLowerCase().includes(testoLower));
  }

  /**
   * Ottiene tutti i ruoli che sono assegnati a un singolo docente specifico.
   * (es. Dirigente, DSGA, etc.)
   * @returns {Ruolo[]} Un array di ruoli singoli.
   */
  ottieniRuoliSingoli() {
    return this.filtra(ruolo => ruolo.isRuoloSingolo());
  }

  /**
   * Ottiene tutti i ruoli che non sono assegnati a un singolo docente specifico,
   * ma sono gestiti a livello di altre entità (es. Coordinatore di classe).
   * @returns {Ruolo[]} Un array di ruoli multipli.
   */
  ottieniRuoliMultipli() {
    return this.filtra(ruolo => !ruolo.isRuoloSingolo());
  }
}

/**
 * Gestisce le materie
 */
class GestoreMaterie extends GestoreBase {
  constructor(logger, gestoreDB, cache, utils) {
    super(logger, gestoreDB, cache, utils);
  }
  
  _ottieniNomeTabella() {
    return 'MATERIE';
  }
  
  _creaEntita(dati) {
    return new Materia(dati, this.utils, this.gestoreDB);
  }
  
  _ottieniIdEntita(entita) {
    if (entita instanceof Materia) {
      return entita.ottieniSigla();
    }
    return entita.dati.SIGLA;
  }
  
  /**
   * Ottiene una materia per sigla
   * @param {string} sigla - Sigla della materia
   * @return {Materia} Materia trovata o null
   */
  ottieniPerSigla(sigla) {
    return this.ottieniPerId(sigla);
  }
  
  /**
   * Ottiene le materie per corsi di recupero
   * @param {string} indirizzo - Indirizzo di studi (opzionale)
   * @return {Array} Materie filtrate
   */
  ottieniPerCorsoRecupero(indirizzo = null) {
    if (!this.db) return [];
    
    const query = this.db.select()
      .from(this.nomeTabella)
      .where('CORSO RECUPERO', '!=', '');
    
    const righe = query.execute();
    
    if (!indirizzo) {
      return righe.map(riga => this._creaEntita(riga));
    }
    
    // Filtra ulteriormente per indirizzo
    const materieFiltrate = righe.filter(riga => {
      const corsiRecupero = riga['CORSO RECUPERO'] || '';
      return corsiRecupero.includes(indirizzo);
    });
    
    return materieFiltrate.map(riga => this._creaEntita(riga));
  }
  
  /**
   * Ottiene le materie per esame (prima o seconda prova)
   * @param {boolean} primaProva - Se true, filtra per prima prova, altrimenti seconda
   * @param {string} indirizzo - Indirizzo di studi (opzionale)
   * @return {Array} Materie filtrate
   */
  ottieniPerEsame(primaProva = true, indirizzo = null) {
    if (!this.db) return [];
    
    const campo = primaProva ? 'PRIMA PROVA' : 'SECONDA PROVA';
    
    const query = this.db.select()
      .from(this.nomeTabella)
      .where(campo, '!=', '');
    
    const righe = query.execute();
    
    if (!indirizzo) {
      return righe.map(riga => this._creaEntita(riga));
    }
    
    // Filtra ulteriormente per indirizzo
    const materieFiltrate = righe.filter(riga => {
      const prove = riga[campo] || '';
      return prove.includes(indirizzo);
    });
    
    return materieFiltrate.map(riga => this._creaEntita(riga));
  }
}

/**
 * Gestisce i documenti
 */
class GestoreDocumenti extends GestoreBase {
  constructor(logger, gestoreDB, cache, utils) {
    super(logger, gestoreDB, cache, utils);
  }
  
  _ottieniNomeTabella() {
    return 'DOCUMENTI';
  }
  
  _creaEntita(dati) {
    return new Documento(dati, this.utils, this.gestoreDB);
  }
  
  _ottieniIdEntita(entita) {
    if (entita instanceof Documento) {
      return entita.ottieniId();
    }
    return entita.dati.ID;
  }
  
  /**
   * Ottiene un documento per ID
   * @param {string} id - ID del documento
   * @return {Documento} Documento trovato o null
   */
  ottieniPerId(id) {
    return super.ottieniPerId(id);
  }
  
  /**
   * Ottiene i documenti per anno di corso
   * @param {number} annoCorso - Anno di corso (1-5)
   * @return {Array} Documenti filtrati
   */
  ottieniPerAnnoCorso(annoCorso) {
    if (!this.db || !annoCorso) return [];
    
    const documenti = this.caricaDati();
    
    // Filtra documenti per anno di corso
    return documenti.filter(documento => {
      const anniCorso = documento.ottieniAnniCorso();
      return anniCorso.includes(annoCorso);
    });
  }
  
  /**
   * Ottiene i documenti per formato
   * @param {string} formato - Formato (DOCUMENT/SPREADSHEET)
   * @return {Array} Documenti filtrati
   */
  ottieniPerFormato(formato) {
    if (!this.db || !formato) return [];
    
    const query = this.db.select()
      .from(this.nomeTabella)
      .where('FORMATO DOCUMENTO', '=', formato);
    
    const righe = query.execute();
    return righe.map(riga => this._creaEntita(riga));
  }
  
  /**
   * Ottiene i documenti per schema organizzativo
   * @param {string} schema - Schema organizzativo
   * @return {Array} Documenti filtrati
   */
  ottieniPerSchemaOrganizzativo(schema) {
    if (!this.db || !schema) return [];
    
    const query = this.db.select()
      .from(this.nomeTabella)
      .where('SCHEMA ORGANIZZATIVO', '=', schema);
    
    const righe = query.execute();
    return righe.map(riga => this._creaEntita(riga));
  }
  
  /**
   * Ottiene i documenti da stampare
   * @return {Array} Documenti da stampare
   */
  ottieniDaStampare() {
    if (!this.db) return [];
    
    const query = this.db.select()
      .from(this.nomeTabella)
      .where('STAMPARE', '=', true);
    
    const righe = query.execute();
    return righe.map(riga => this._creaEntita(riga));
  }
}

/**
 * Gestisce le carenze degli alunni
 */
class GestoreCarenze extends GestoreBase {
  constructor(logger, gestoreDB, cache, utils) {
    super(logger, gestoreDB, cache, utils);
  }
  
  _ottieniNomeTabella() {
    return 'CARENZE';
  }
  
  _creaEntita(dati) {
    return new Carenza(dati, this.utils, this.gestoreDB);
  }
  
  _ottieniIdEntita(entita) {
    // ID composto: EMAIL_ALUNNO + DATA_REPORT
    return `${entita.ottieniEmailAlunno()}_${entita.ottieniDataReport()}`;
  }
  
  /**
   * Filtra le carenze più recenti per alunno
   * @param {Array} carenze - Lista di carenze da filtrare
   * @return {Array} Carenze più recenti per ogni alunno
   * @private
   */
  _filtraSoloPiuRecenti(carenze) {
    const mappaAlunni = new Map();
    
    carenze.forEach(carenza => {
      const emailAlunno = carenza.ottieniEmailAlunno();
      const dataReport = carenza.ottieniDataReport();
      
      if (!mappaAlunni.has(emailAlunno) || 
          dataReport > mappaAlunni.get(emailAlunno).ottieniDataReport()) {
        mappaAlunni.set(emailAlunno, carenza);
      }
    });
    
    return Array.from(mappaAlunni.values());
  }
  
  /**
   * Ottiene le carenze per un alunno
   * @param {string} emailAlunno - Email dell'alunno
   * @param {boolean} soloPiuRecente - Se true, restituisce solo la carenza più recente
   * @return {Array} Carenze dell'alunno ordinate per data
   */
  ottieniPerAlunno(emailAlunno, soloPiuRecente = true) {
    if (!this.db || !emailAlunno) return [];
    
    const query = this.db.select()
      .from(this.nomeTabella)
      .where('EMAIL ALUNNO', '=', emailAlunno)
      .orderBy('DATA REPORT', 'DESC');
    
    const righe = query.execute();
    const carenze = righe.map(riga => this._creaEntita(riga));
    
    if (soloPiuRecente && carenze.length > 0) {
      return [carenze[0]]; // Ritorna solo la carenza più recente
    }
    
    return carenze;
  }
  
  /**
   * Ottiene le carenze per una classe
   * @param {string} nomeClasse - Nome della classe
   * @param {boolean} soloPiuRecente - Se true, restituisce solo le carenze più recenti per ogni alunno
   * @return {Array} Carenze degli alunni della classe
   */
  ottieniPerClasse(nomeClasse, soloPiuRecente = true) {
    if (!this.db || !nomeClasse) return [];
    
    const query = this.db.select()
      .from(this.nomeTabella)
      .where('CLASSE ALUNNO', '=', nomeClasse);
    
    const righe = query.execute();
    const carenze = righe.map(riga => this._creaEntita(riga));
    
    if (soloPiuRecente) {
      return this._filtraSoloPiuRecenti(carenze);
    }
    
    return carenze;
  }
  
  /**
   * Ottiene le carenze per una data specifica
   * @param {string} data - Data in formato stringa
   * @return {Array} Carenze per la data specificata
   */
  ottieniPerData(data) {
    if (!this.db || !data) return [];
    
    const query = this.db.select()
      .from(this.nomeTabella)
      .where('DATA REPORT', '=', data);
    
    const righe = query.execute();
    return righe.map(riga => this._creaEntita(riga));
  }
  
  /**
   * Ottiene le carenze per materia
   * @param {string} siglaMateria - Sigla della materia
   * @param {boolean} soloPiuRecente - Se true, restituisce solo le carenze più recenti per ogni alunno
   * @return {Array} Carenze per la materia specificata
   */
  ottieniPerMateria(siglaMateria, soloPiuRecente = true) {
    if (!this.db || !siglaMateria) return [];
    
    // Per questa query complessa, usiamo l'array dei dati già caricati e filtriamo
    const carenze = this.caricaDati();
    
    const risultati = carenze.filter(carenza => 
      carenza.haCarenza(siglaMateria)
    );
    
    if (soloPiuRecente) {
      return this._filtraSoloPiuRecenti(risultati);
    }
    
    return risultati;
  }
  
  /**
   * Ottiene le carenze più recenti fino a una data di riferimento
   * @param {Date} dataRiferimento - Data di riferimento (default: oggi)
   * @return {Array} Carenze più recenti per ogni alunno
   */
  ottieniCarenzePiuRecenti(dataRiferimento = new Date()) {
    if (!this.db) return [];
    
    const dataMax = this.utils.formattaData(dataRiferimento, 'yyyy-MM-dd');
    
    // Filtra prima per data
    const query = this.db.select()
      .from(this.nomeTabella)
      .where('DATA REPORT', '<=', dataMax);
    
    const righe = query.execute();
    const carenze = righe.map(riga => this._creaEntita(riga));
    
    // Poi applica il filtro per avere solo le più recenti
    return this._filtraSoloPiuRecenti(carenze);
  }
  
  /**
   * Ottiene le statistiche delle carenze per classe
   * @param {string} nomeClasse - Nome della classe (opzionale)
   * @param {Date} dataRiferimento - Data di riferimento (default: oggi)
   * @return {Object} Statistiche delle carenze
   */
  ottieniStatistichePerClasse(nomeClasse = null, dataRiferimento = new Date()) {
    // Ottieni le carenze più recenti per ogni alunno
    let carenze = this.ottieniCarenzePiuRecenti(dataRiferimento);
    
    // Filtra per classe se specificata
    if (nomeClasse) {
      carenze = carenze.filter(carenza => carenza.ottieniClasseAlunno() === nomeClasse);
    }
    
    // Raggruppa per classe
    const mappaClassi = new Map();
    
    carenze.forEach(carenza => {
      const classeAlunno = carenza.ottieniClasseAlunno();
      
      if (!mappaClassi.has(classeAlunno)) {
        mappaClassi.set(classeAlunno, {
          classe: classeAlunno,
          totaleAlunni: 0,
          alunniConCarenze: 0,
          materieConCarenze: {},
          dettaglioCarenze: {}
        });
      }
      
      const statisticheClasse = mappaClassi.get(classeAlunno);
      statisticheClasse.totaleAlunni++;
      
      const materieConCarenza = carenza.ottieniMaterieConCarenza();
      if (materieConCarenza.length > 0) {
        statisticheClasse.alunniConCarenze++;
        
        // Aggiorna le statistiche per materia
        materieConCarenza.forEach(materia => {
          if (!statisticheClasse.materieConCarenze[materia]) {
            statisticheClasse.materieConCarenze[materia] = 0;
            statisticheClasse.dettaglioCarenze[materia] = [];
          }
          statisticheClasse.materieConCarenze[materia]++;
          statisticheClasse.dettaglioCarenze[materia].push({
            emailAlunno: carenza.ottieniEmailAlunno(),
            descrizioneCarenza: carenza.ottieniCarenzaMateria(materia)
          });
        });
      }
    });
    
    // Converti in array di risultati
    return Array.from(mappaClassi.values()).map(stat => {
      // Ordina le materie per numero di carenze
      const materiePiuFrequenti = Object.entries(stat.materieConCarenze)
        .sort((a, b) => b[1] - a[1])
        .map(([materia, count]) => ({ materia, count }));
      
      // Calcola percentuali solo se ci sono alunni
      const percentualeCarenze = stat.totaleAlunni > 0 
        ? Math.round((stat.alunniConCarenze / stat.totaleAlunni) * 100) 
        : 0;
      
      return {
        classe: stat.classe,
        totaleAlunni: stat.totaleAlunni,
        alunniConCarenze: stat.alunniConCarenze,
        percentualeCarenze: percentualeCarenze,
        materieConCarenze: stat.materieConCarenze,
        materiePiuFrequenti: materiePiuFrequenti.slice(0, 5), // Top 5 materie
        dettaglioCarenze: stat.dettaglioCarenze
      };
    });
  }
  
  /**
   * Ottiene le carenze per tipologia
   * @param {string} testoCarenza - Testo da cercare nella descrizione delle carenze
   * @param {boolean} soloPiuRecente - Se true, restituisce solo le carenze più recenti per ogni alunno
   * @return {Array} Carenze contenenti il testo specificato
   */
  ottieniPerTipologiaCarenza(testoCarenza, soloPiuRecente = true) {
    if (!this.db || !testoCarenza) return [];
    
    // Questa query complessa richiede filtro su dati già caricati
    const carenze = this.caricaDati();
    const testoLower = testoCarenza.toLowerCase();
    
    const risultati = carenze.filter(carenza => {
      const carenzeMaterie = carenza.ottieniCarenzeMaterie();
      return Object.values(carenzeMaterie).some(descrizione => 
        descrizione.toLowerCase().includes(testoLower)
      );
    });
    
    if (soloPiuRecente) {
      return this._filtraSoloPiuRecenti(risultati);
    }
    
    return risultati;
  }
  
  /**
   * Ottiene le carenze tra due date
   * @param {string|Date} dataInizio - Data di inizio del periodo
   * @param {string|Date} dataFine - Data di fine del periodo (default: oggi)
   * @param {boolean} soloPiuRecente - Se true, restituisce solo le carenze più recenti per ogni alunno
   * @return {Array} Carenze nel periodo specificato
   */
  ottieniPerPeriodo(dataInizio, dataFine = new Date(), soloPiuRecente = true) {
    if (!this.db || !dataInizio) return [];
    
    const inizio = typeof dataInizio === 'string' ? dataInizio : this.utils.formattaData(dataInizio, 'yyyy-MM-dd');
    const fine = typeof dataFine === 'string' ? dataFine : this.utils.formattaData(dataFine, 'yyyy-MM-dd');
    
    const query = this.db.select()
      .from(this.nomeTabella)
      .where('DATA REPORT', '>=', inizio)
      .where('DATA REPORT', '<=', fine);
    
    const righe = query.execute();
    const carenze = righe.map(riga => this._creaEntita(riga));
    
    if (soloPiuRecente) {
      return this._filtraSoloPiuRecenti(carenze);
    }
    
    return carenze;
  }
}

// In OGGETTI/Gestori.js

/**
 * Gestisce le cartelle generate (tabella FOLDER_GEN)
 */
class GestoreCartelleGenerate extends GestoreBase {
  constructor(logger, gestoreDB, cache, utils) {
    super(logger, gestoreDB, cache, utils);
  }

  _ottieniNomeTabella() {
    return 'FOLDER_GEN';
  }

  _creaEntita(dati) {
    return new CartellaGenerata(dati, this.utils, this.gestoreDB);
  }

  _ottieniIdEntita(entita) {
    return entita.ottieniId();
  }

  ottieniPerClasse(nomeClasse) {
    return this.filtra(cartella => cartella.ottieniClasseAssociata() === nomeClasse);
  }

  ottieniPerTipo(tipo) {
    return this.filtra(cartella => cartella.ottieniTipo() === tipo);
  }

  ottieniPerUtente(emailUtente) {
    return this.filtra(cartella => cartella.ottieniUtenteAssociato() === emailUtente);
  }
}

/**
 * Gestisce i documenti generati (tabella DOC_GEN)
 */
class GestoreDocumentiGenerati extends GestoreBase {
  constructor(logger, gestoreDB, cache, utils) {
    super(logger, gestoreDB, cache, utils);
  }

  _ottieniNomeTabella() {
    return 'DOC_GEN';
  }

  _creaEntita(dati) {
    return new DocumentoGenerato(dati, this.utils, this.gestoreDB);
  }

  _ottieniIdEntita(entita) {
    return entita.ottieniId();
  }

  ottieniPerClasse(nomeClasse) {
    return this.filtra(doc => doc.ottieniClasseAssociata() === nomeClasse);
  }

  ottieniPerTipo(tipo) {
    return this.filtra(doc => doc.ottieniTipo() === tipo);
  }

  ottieniNonNotificati() {
    return this.filtra(doc => !doc.isNotificato());
  }

  /**
   * Filtra i documenti in base ai criteri specificati
   * @param {Array} documenti - Array di documenti da filtrare
   * @param {Object} filtri - Oggetto con i criteri di filtro
   * @return {Array} Documenti filtrati
   */
  filtra(documenti, filtri) {
    // Se il primo parametro è una funzione, usa il metodo della classe base
    if (typeof documenti === 'function') {
      return super.filtra(documenti);
    }
    
    // Altrimenti, documenti è l'array e filtri è l'oggetto con i criteri
    if (!filtri || Object.keys(filtri).length === 0) {
      return documenti;
    }
    
    return documenti.filter(doc => {
      // Filtro per tipo
      if (filtri.tipo && doc.ottieniTipo() !== filtri.tipo) {
        return false;
      }
      
      // Filtro per non notificato
      if (filtri.nonNotificato === true && doc.isNotificato()) {
        return false;
      }
      
      // Filtro per classe
      if (filtri.classe && doc.ottieniClasseAssociata() !== filtri.classe) {
        return false;
      }
      
      // Filtro per utente
      if (filtri.utente && doc.ottieniUtenteAssociato() !== filtri.utente) {
        return false;
      }
      
      // Filtro per materia
      if (filtri.materia && doc.ottieniMateriaAssociata() !== filtri.materia) {
        return false;
      }
      
      return true;
    });
  }
}

/**
 * Gestisce le email inviate (tabella EMAIL_INVIATE)
 */
class GestoreEmailInviate extends GestoreBase {
  constructor(logger, gestoreDB, cache, utils) {
    super(logger, gestoreDB, cache, utils);
  }

  _ottieniNomeTabella() {
    return 'EMAIL_INVIATE';
  }

  _creaEntita(dati) {
    return new EmailInviata(dati, this.utils, this.gestoreDB);
  }

  _ottieniIdEntita(entita) {
    return entita.ottieniChiaveUnivoca();
  }

  ottieniPerDestinatario(email) {
    return this.filtra(emailInv => emailInv.ottieniDestinatari().includes(email));
  }

  ottieniPerPattern(patternId) {
    return this.filtra(emailInv => emailInv.ottieniPatternId() === patternId);
  }

  ottieniConErrori() {
    return this.filtra(emailInv => !!emailInv.ottieniErrore());
  }
}


/**
 * Gestisce i progetti scolastici
 */
class GestoreProgetti extends GestoreBase {
  constructor(logger, gestoreDB, cache, utils) {
    super(logger, gestoreDB, cache, utils);
  }
  
  _ottieniNomeTabella() {
    return 'PROGETTI';
  }
  
  _creaEntita(dati) {
    return new Progetto(dati, this.utils, this.gestoreDB);
  }
  
  _ottieniIdEntita(entita) {
    if (entita instanceof Progetto) {
      return entita.ottieniChiaveUnivoca();
    }
    return entita.dati['CHIAVE UNIVOCA'];
  }
  
  /**
   * Ottiene i progetti per una classe
   * @param {string} nomeClasse - Nome della classe
   * @return {Array} Array di progetti
   */
  ottieniPerClasse(nomeClasse) {
    if (!this.db || !nomeClasse) return [];
    
    const query = this.db.select()
      .from(this.nomeTabella)
      .where('CLASSE', '=', nomeClasse);
    
    const righe = query.execute();
    return righe.map(riga => this._creaEntita(riga));
  }
  
  /**
   * Ottiene i progetti per tipo
   * @param {string} tipoProgetto - Tipo di progetto
   * @return {Array} Array di progetti
   */
  ottieniPerTipo(tipoProgetto) {
    if (!this.db || !tipoProgetto) return [];
    
    const query = this.db.select()
      .from(this.nomeTabella)
      .where('TIPO PROGETTO', '=', tipoProgetto);
    
    const righe = query.execute();
    return righe.map(riga => this._creaEntita(riga));
  }
  
  /**
   * Ottiene i progetti PCTO
   * @return {Array} Array di progetti PCTO
   */
  ottieniProgettiPCTO() {
    return this.ottieniPerTipo('PCTO');
  }
  
  /**
   * Ottiene i progetti di orientamento
   * @return {Array} Array di progetti di orientamento
   */
  ottieniProgettiOrientamento() {
    return this.ottieniPerTipo('ORIENTAMENTO');
  }
  
  /**
   * Ottiene i progetti per nome
   * @param {string} nomeProgetto - Nome del progetto (anche parziale)
   * @return {Array} Array di progetti
   */
  cercaPerNome(nomeProgetto) {
    if (!this.db || !nomeProgetto) return [];
    
    const progetti = this.caricaDati();
    const nomeLower = nomeProgetto.toLowerCase();
    
    return progetti.filter(progetto => 
      progetto.ottieniNomeProgetto().toLowerCase().includes(nomeLower)
    );
  }
  
  /**
   * Ottiene un progetto speciifico per una classe e tipo
   * @param {string} nomeClasse - Nome della classe
   * @param {string} tipoProgetto - Tipo di progetto
   * @return {Progetto} Progetto trovato o null
   */
  ottieniProgetto(nomeClasse, tipoProgetto) {
    if (!this.db || !nomeClasse || !tipoProgetto) return null;
    
    const query = this.db.select()
      .from(this.nomeTabella)
      .where('CLASSE', '=', nomeClasse)
      .where('TIPO PROGETTO', '=', tipoProgetto);
    
    const righe = query.execute();
    if (righe.length === 0) return null;
    
    return this._creaEntita(righe[0]);
  }
}


/**
 * Gestore per i pattern email (tabella PTN_EMAIL).
 * Si occupa di recuperare e mappare i dati dei pattern dal database.
 */
class GestorePatternEmail {
    /**
     * @param {MyUtilsService} utils
     * @param {MyLoggerService} logger 
     * @param {GestoreDatabaseAnniScolastici} gestoreDB 
     */
    constructor(utils, logger, gestoreDB) {
        this.utils = utils; // Aggiunto per coerenza, anche se non usato qui
        this.logger = logger;
        this.gestoreDB = gestoreDB;
        this.db = this.gestoreDB.ottieniDatabaseAnnoAttuale();
        this.nomeTabella = 'PTN_EMAIL';
        this.logger.info("GestorePatternEmail inizializzato correttamente.");
    }

    /**
     * Recupera un pattern per il suo ID univoco.
     * @param {string} idPattern - L'identificativo della notifica.
     * @returns {PatternEmail|null} L'istanza di PatternEmail o null se non trovato.
     */
    ottieniPatternPerId(idPattern) {
        try {
            if (!this.db || !this.db.tables[this.nomeTabella]) {
                throw new Error(`Tabella '${this.nomeTabella}' non trovata nel database.`);
            }

            const record = this.db.select()
                .from(this.nomeTabella)
                .where('IDENTIFICATIVO NOTIFICA', '=', idPattern)
                .first();

            if (!record) {
                this.logger.warn(`Pattern con ID '${idPattern}' non trovato.`);
                return null;
            }
            
            // La classe PatternEmail si trova in OGGETTI/Entita.js
            return PatternEmail.fromDatabaseRecord(record);
        } catch (error) {
            this.logger.error(`Errore durante il recupero del pattern '${idPattern}': ${error.message}`);
            throw error;
        }
    }

    /**
     * Recupera la configurazione dei box associati a un pattern dalla colonna BOX CONFIG.
     * @param {string} idPattern - L'identificativo della notifica.
     * @returns {Array} Array di configurazioni box ordinate per ORDINE.
     */
    ottieniBoxPerPattern(idPattern) {
        try {
            if (!this.db || !this.db.tables[this.nomeTabella]) {
                throw new Error(`Tabella '${this.nomeTabella}' non trovata nel database.`);
            }

            const record = this.db.select()
                .from(this.nomeTabella)
                .where('IDENTIFICATIVO NOTIFICA', '=', idPattern)
                .first();

            if (!record) {
                this.logger.warn(`Pattern con ID '${idPattern}' non trovato per la configurazione box.`);
                return [];
            }

            const boxConfigString = record['BOX CONFIG'];
            if (!boxConfigString) {
                this.logger.debug(`Nessuna configurazione box trovata per il pattern '${idPattern}'.`);
                return [];
            }

            try {
                const configBox = JSON.parse(boxConfigString);
                
                if (!Array.isArray(configBox)) {
                    this.logger.warn(`La configurazione box per il pattern '${idPattern}' non è un array valido.`);
                    return [];
                }

                // Ordina per ORDINE se presente
                const configBoxOrdinata = configBox.sort((a, b) => (a.ORDINE || 0) - (b.ORDINE || 0));
                
                this.logger.info(`Caricati ${configBoxOrdinata.length} box per il pattern '${idPattern}'.`);
                return configBoxOrdinata;

            } catch (parseError) {
                this.logger.error(`Errore nel parsing JSON della configurazione box per '${idPattern}': ${parseError.message}`);
                return [];
            }

        } catch (error) {
            this.logger.error(`Errore durante il recupero della configurazione box per '${idPattern}': ${error.message}`);
            return [];
        }
    }
}
