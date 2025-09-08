/**
 * Servizio unificato per rappresentare e gestire una singola tabella (scheda) 
 * di un database basato su Google Spreadsheet.
 * 
 * Questa classe implementa il LAZY LOADING: i dati vengono caricati dal foglio
 * di calcolo solo quando sono strettamente necessari, ottimizzando le performance
 * di inizializzazione e riducendo le chiamate API.
 * 
 * È responsabile di:
 * - Caricare e memorizzare in cache i dati di una scheda "on-demand".
 * - Fornire un'interfaccia a oggetti per le righe.
 * - Eseguire operazioni CRUD (Create, Read, Update, Delete) sul foglio di calcolo.
 * - Gestire chiavi primarie e colonne virtuali calcolate.
 */
class MyTableService {
    /**
     * @param {string} sheetName - Il nome della scheda che rappresenta la tabella.
     * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} spreadsheet - L'oggetto Spreadsheet che contiene la scheda.
     * @param {MySpreadsheetService} spreadsheetService - Il servizio per interagire con le API di Sheets.
     * @param {MyLoggerService} logger - Il servizio di logging.
     * @param {MyUtilsService} utils - Il servizio di utilità.
     */
    constructor(sheetName, spreadsheet, spreadsheetService, logger, utils) {
        this.sheetName = sheetName;
        this.spreadsheet = spreadsheet;
        this.spreadsheetService = spreadsheetService;
        this.logger = logger;
        this.utils = utils;

        /** @private @type {string|null} */
        this._chiavePrimariaManuale = null;
        /** @private @type {Object<string, Function>} */
        this._colonneVirtuali = {};
        /** @private @type {Object[]} */
        this._righeCache = null; // Inizializzato a null per il lazy loading
        /** @private @type {boolean} */
        this._datiCaricati = false;
        /** @private @type {Object<string, Object>} */
        this._indici = {};

        /** @type {string[]} */
        this.colonne = this._caricaIntestazione();
        /** @private @type {string} */
        this._campoChiave = this._determinaChiavePrimaria();
    }

    // --- METODI PUBBLICI ---

    /**
     * Ottiene tutte le righe della tabella come un array di oggetti.
     * I dati vengono caricati dal foglio di calcolo solo la prima volta che questo metodo viene chiamato.
     * @returns {Object[]} Un array di oggetti, dove ogni oggetto rappresenta una riga.
     */
    ottieniRighe() {
        this._assicuraDatiCaricati();
        // Restituisce una copia delle righe con le colonne virtuali applicate
        return this._righeCache.map(riga => this._applicaColonneVirtuali({ ...riga }));
    }

    /**
     * Inserisce una nuova riga nel foglio di calcolo.
     * Se la chiave primaria non è fornita, ne viene generata una automaticamente.
     * @param {Object} objRiga - Un oggetto che rappresenta la riga da inserire.
     * @returns {Object} L'oggetto riga completo, inclusa la chiave primaria generata e le colonne virtuali.
     */
    inserisciRiga(objRiga) {
        const rigaCompleta = { ...objRiga };
        this._applicaColonneVirtuali(rigaCompleta);

        if (!rigaCompleta[this._campoChiave]) {
            rigaCompleta[this._campoChiave] = this.utils.generaUuid();
        }

        const colonneFisiche = this.colonne.filter(col => !this._colonneVirtuali[col]);
        const rowData = colonneFisiche.map(col => rigaCompleta[col] ?? '');

        const newRowIndex = this._ottieniProssimaRigaVuota();
        const rangeA1 = `A${newRowIndex}:${this._convertiIndiceInColonna(colonneFisiche.length)}${newRowIndex}`;

        this.spreadsheetService.impostaValori(this.spreadsheet, this.sheetName, rangeA1, [rowData], true);
        this.logger.info(`Inserita nuova riga in ${this.sheetName} alla riga ${newRowIndex}`);
        
        this._invalidaCacheInterna();
        
        return rigaCompleta;
    }

    /**
     * Aggiorna una riga esistente identificata dalla sua chiave primaria.
     * @param {string|number} id - Il valore della chiave primaria della riga da aggiornare.
     * @param {Object} objRiga - Un oggetto contenente i campi da aggiornare.
     * @returns {Object} L'oggetto riga completo dopo l'aggiornamento.
     */
    aggiornaRigaPerId(id, objRiga) {
        this._assicuraDatiCaricati();
        const targetRowIndex = this._trovaIndiceRigaPerId(id); // Indice 0-based nell'array _righeCache

        if (targetRowIndex === -1) {
            throw new Error(`Nessuna riga trovata con ${this._campoChiave}=${id} in ${this.sheetName}.`);
        }

        const rigaOriginale = this._righeCache[targetRowIndex];
        const rigaDaAggiornare = { ...rigaOriginale, ...objRiga };
        this._applicaColonneVirtuali(rigaDaAggiornare);

        const colonneFisiche = this.colonne.filter(col => !this._colonneVirtuali[col]);
        const rowData = colonneFisiche.map(col => rigaDaAggiornare[col] ?? '');
        
        const sheetRowIndex = targetRowIndex + 2; // +1 per l'header, +1 per essere 1-based
        const rangeA1 = `A${sheetRowIndex}:${this._convertiIndiceInColonna(colonneFisiche.length)}${sheetRowIndex}`;
        
        this.spreadsheetService.impostaValori(this.spreadsheet, this.sheetName, rangeA1, [rowData], true);
        
        this._invalidaCacheInterna();
        return rigaDaAggiornare;
    }

    /**
     * Elimina una riga dal foglio di calcolo identificata dalla sua chiave primaria.
     * @param {string|number} id - Il valore della chiave primaria della riga da eliminare.
     * @returns {boolean} `true` se l'eliminazione ha avuto successo, `false` altrimenti.
     */
    eliminaRigaPerId(id) {
        this._assicuraDatiCaricati();
        const targetRowIndex = this._trovaIndiceRigaPerId(id); // Indice 0-based

        if (targetRowIndex === -1) {
            this.logger.warn(`Nessuna riga trovata con ${this._campoChiave}=${id} in ${this.sheetName} per l'eliminazione.`);
            return false;
        }
        
        const sheet = this.spreadsheet.getSheetByName(this.sheetName);
        sheet.deleteRow(targetRowIndex + 2); // +2 perché l'indice è 0-based e c'è l'header

        this._invalidaCacheInterna();
        this.logger.info(`Riga ${targetRowIndex + 2} eliminata da ${this.sheetName}`);
        return true;
    }

    /**
     * Imposta manualmente la colonna da utilizzare come chiave primaria.
     * @param {string} nomeColonna - Il nome della colonna da usare come PK.
     * @returns {MyTableService} L'istanza corrente per il chaining.
     */
    impostaChiavePrimaria(nomeColonna) {
        this._chiavePrimariaManuale = nomeColonna;
        this._campoChiave = this._determinaChiavePrimaria();
        return this;
    }

    /**
     * Definisce una colonna virtuale, il cui valore è calcolato dinamicamente.
     * @param {string} nomeColonna - Il nome della nuova colonna virtuale.
     * @param {Function} funzioneCalcolo - Una funzione che accetta un oggetto riga e restituisce il valore calcolato.
     * @returns {MyTableService} L'istanza corrente per il chaining.
     */
    definisciColonnaVirtuale(nomeColonna, funzioneCalcolo) {
        if (typeof funzioneCalcolo !== 'function') {
            throw new Error(`La funzione di calcolo per la colonna virtuale "${nomeColonna}" deve essere una funzione.`);
        }
        this._colonneVirtuali[nomeColonna] = funzioneCalcolo;
        if (!this.colonne.includes(nomeColonna)) {
            this.colonne.push(nomeColonna);
        }
        return this;
    }

    /**
     * Ottiene una singola riga tramite il valore della sua chiave primaria.
     * @param {*} valorePK - Il valore della chiave primaria da cercare.
     * @returns {Object|null} L'oggetto riga trovato o `null` se non esiste.
     */
    ottieniPerPK(valorePK) {
        this._assicuraDatiCaricati();
        const targetRowIndex = this._trovaIndiceRigaPerId(valorePK);
        if (targetRowIndex === -1) {
            return null;
        }
        const rigaTrovata = { ...this._righeCache[targetRowIndex] };
        return this._applicaColonneVirtuali(rigaTrovata);
    }

    // --- METODI PRIVATI ---

    /**
     * Invalida la cache interna dei dati, forzando un ricaricamento alla prossima richiesta.
     * @private
     */
    _invalidaCacheInterna() {
        this._datiCaricati = false;
        this._righeCache = null;
        this._indici = {};
    }

    /**
     * Carica i dati dal foglio di calcolo se non sono già stati caricati.
     * @private
     */
    _assicuraDatiCaricati() {
        if (this._datiCaricati) return;
        
        this.logger.debug(`Lazy loading dati per la tabella: ${this.sheetName}`);
        
        const dati = this.spreadsheetService.ottieniValori(this.spreadsheet, this.sheetName, "A1:ZZ", true).ottieniRisultato() || [];
        if (dati.length < 1) {
            this.logger.warn(`Nessun dato (nemmeno l'header) trovato nella scheda ${this.sheetName}`);
            this._righeCache = [];
            this._datiCaricati = true;
            return;
        }
        
        const header = dati[0];
        const righe = [];
        for (let i = 1; i < dati.length; i++) {
            if (!dati[i] || dati[i].every(cell => cell === "")) continue;
            const riga = {};
            for (let j = 0; j < header.length; j++) {
                if (header[j]) {
                    riga[header[j]] = dati[i][j] ?? null;
                }
            }
            righe.push(riga);
        }
        this._righeCache = righe;
        this._datiCaricati = true;
    }

    /**
     * Trova l'indice (0-based) di una riga nell'array `_righeCache` dato il valore della sua chiave primaria.
     * @param {string|number} id - Il valore della chiave primaria.
     * @returns {number} L'indice della riga o -1 se non trovata.
     * @private
     */
    _trovaIndiceRigaPerId(id) {
        // Usa un indice se disponibile per performance
        if (this._indici[this._campoChiave] && this._indici[this._campoChiave][id] !== undefined) {
            return this._indici[this._campoChiave][id];
        }
        // Altrimenti, scansione lineare
        return this._righeCache.findIndex(riga => {
            const rigaConVirtuali = this._applicaColonneVirtuali({ ...riga });
            return rigaConVirtuali[this._campoChiave] == id;
        });
    }

    /**
     * Calcola l'indice della prossima riga vuota nel foglio di calcolo.
     * @returns {number} L'indice della riga (1-based).
     * @private
     */
    _ottieniProssimaRigaVuota() {
        this._assicuraDatiCaricati();
        return this._righeCache.length + 2; // +1 per l'header, +1 per la nuova riga
    }

    /**
     * Legge la prima riga del foglio per determinare le intestazioni delle colonne.
     * @returns {string[]} Un array con i nomi delle colonne.
     * @private
     */
    _caricaIntestazione() {
        const headerData = this.spreadsheetService.ottieniValori(this.spreadsheet, this.sheetName, "A1:ZZ1", true).ottieniRisultato();
        if (!headerData || headerData.length === 0) {
            throw new Error(`Nessuna intestazione trovata nella scheda ${this.sheetName}`);
        }
        return headerData[0].filter(col => col && col.trim() !== '');
    }

    /**
     * Determina la chiave primaria della tabella seguendo una logica predefinita.
     * @returns {string} Il nome della colonna usata come chiave primaria.
     * @private
     */
    _determinaChiavePrimaria() {
        if (this._chiavePrimariaManuale) return this._chiavePrimariaManuale;
        if (this.colonne.includes("ID")) return "ID";
        const idField = this.colonne.find(col => col.toUpperCase().endsWith("_ID"));
        if (idField) return idField;
        return this.colonne[0] || "ID"; // Fallback alla prima colonna
    }

    /**
     * Applica le funzioni delle colonne virtuali a un oggetto riga.
     * @param {Object} riga - L'oggetto riga da arricchire.
     * @returns {Object} L'oggetto riga con i valori delle colonne virtuali calcolati.
     * @private
     */
    _applicaColonneVirtuali(riga) {
        for (const nomeColonna in this._colonneVirtuali) {
            try {
                riga[nomeColonna] = this._colonneVirtuali[nomeColonna](riga);
            } catch (e) {
                this.logger.warn(`Errore nel calcolo della colonna virtuale "${nomeColonna}": ${e.message}`);
                riga[nomeColonna] = null;
            }
        }
        return riga;
    }

    /**
     * Converte un indice di colonna (1-based) nella sua notazione A1 (es. 1 -> A, 27 -> AA).
     * @param {number} indice - L'indice della colonna (1-based).
     * @returns {string} La lettera della colonna.
     * @private
     */
    _convertiIndiceInColonna(indice) {
        let colonna = '';
        let tempIndex = indice;
        while (tempIndex > 0) {
            const modulo = (tempIndex - 1) % 26;
            colonna = String.fromCharCode(65 + modulo) + colonna;
            tempIndex = Math.floor((tempIndex - modulo) / 26);
        }
        return colonna;
    }
}

/**
 * Classe per gestire le condizioni delle query
 */
class QueryCondition {
  /**
   * Costruttore della classe
   * @param {string} campo - Nome del campo
   * @param {string} operatore - Operatore di confronto
   * @param {*} valore - Valore da confrontare
   * @param {string} tipo - Tipo di connettore logico (AND/OR)
   */
  constructor(campo, operatore, valore, tipo = 'AND') {
    this.campo = campo;
    this.operatore = operatore || '=';
    this.valore = valore;
    this.tipo = tipo.toUpperCase();
    this.sottoCondizioni = [];
  }
  
  /**
   * Confronta un valore con il criterio della condizione
   * @param {*} valoreRiga - Valore da confrontare
   * @return {boolean} Risultato del confronto
   */
  confrontaValore(valoreRiga) {
    // Gestione valori null/undefined
    if (valoreRiga === null || valoreRiga === undefined) {
      if (this.operatore === '=' || this.operatore === '==') {
        return this.valore === null || this.valore === undefined;
      } else if (this.operatore === '!=' || this.operatore === '<>') {
        return this.valore !== null && this.valore !== undefined;
      }
      return false;
    }
    
    // Confronto in base all'operatore
    switch (this.operatore) {
      case '=':
      case '==':
        return valoreRiga == this.valore;
      case '!=':
      case '<>':
        return valoreRiga != this.valore;
      case '>':
        return valoreRiga > this.valore;
      case '>=':
        return valoreRiga >= this.valore;
      case '<':
        return valoreRiga < this.valore;
      case '<=':
        return valoreRiga <= this.valore;
      case 'LIKE':
        if (typeof valoreRiga !== 'string') {
          return false;
        }
        const pattern = this.valore.toString().replace(/%/g, '.*');
        const regex = new RegExp(`^${pattern}$`, 'i');
        return regex.test(valoreRiga.toString());
      case 'IN':
        return Array.isArray(this.valore) && this.valore.includes(valoreRiga);
      case 'NOT IN':
        return Array.isArray(this.valore) && !this.valore.includes(valoreRiga);
      case 'CONTAINS':
        return typeof valoreRiga === 'string' && 
               typeof this.valore === 'string' && 
               valoreRiga.toLowerCase().includes(this.valore.toLowerCase());
      default:
        return false;
    }
  }
  
  /**
   * Aggiunge una sottocondizione
   * @param {QueryCondition} condizione - Condizione da aggiungere
   * @return {QueryCondition} This per concatenamento
   */
  aggiungiSottoCondizione(condizione) {
    this.sottoCondizioni.push(condizione);
    return this;
  }
  
/**
 * Valuta la condizione per una riga
 * @param {Object} riga - Riga da valutare
 * @return {boolean} Risultato della valutazione
 */
valuta(riga) {
  // Se non ci sono sottocondizioni, valuta direttamente
  if (this.sottoCondizioni.length === 0) {
    // Caso particolare: condizione radice senza campo
    if (!this.campo || !this.operatore) {
      return true;
    }
    
    // CORREZIONE: Gestione campi prefissati
    let valoreRiga = riga[this.campo];
    
    // Se il valore è undefined, prova con i prefissi delle tabelle
    if (valoreRiga === undefined) {
      // Cerca nelle chiavi che terminano con il nome del campo
      const suffisso = `.${this.campo}`;
      for (const chiave in riga) {
        if (chiave.endsWith(suffisso)) {
          valoreRiga = riga[chiave];
          break;
        }
      }
    }
    
    return this.confrontaValore(valoreRiga);
  }
  
  // Inizializza risultato con la condizione corrente se specificate
  let risultato = true;
  
  if (this.campo && this.operatore) {
    // CORREZIONE: Gestione campi prefissati
    let valoreRiga = riga[this.campo];
    
    // Se il valore è undefined, prova con i prefissi delle tabelle
    if (valoreRiga === undefined) {
      // Cerca nelle chiavi che terminano con il nome del campo
      const suffisso = `.${this.campo}`;
      for (const chiave in riga) {
        if (chiave.endsWith(suffisso)) {
          valoreRiga = riga[chiave];
          break;
        }
      }
    }
    
    risultato = this.confrontaValore(valoreRiga);
  }
  
  // Applica le sottocondizioni con operatore logico appropriato
  for (const sottoCondizione of this.sottoCondizioni) {
    if (this.tipo === 'AND') {
      risultato = risultato && sottoCondizione.valuta(riga);
      if (!risultato) break; // Cortocircuito
    } else {
      risultato = risultato || sottoCondizione.valuta(riga);
      if (risultato) break; // Cortocircuito
    }
  }
  
  return risultato;
}
}

/**
 * Classe per gestire le aggregazioni nelle query
 */
class QueryAggregation {
  /**
   * Costruttore della classe
   * @param {string} funzione - Funzione di aggregazione
   * @param {string} campo - Campo da aggregare
   * @param {string} alias - Alias per il risultato
   */
  constructor(funzione, campo, alias = null) {
    this.funzione = funzione.toUpperCase();
    this.campo = campo;
    this.alias = alias || `${this.funzione}_${this.campo}`;
  }
  
  /**
   * Calcola l'aggregazione su un set di righe
   * @param {Array} righe - Righe su cui calcolare
   * @return {*} Risultato dell'aggregazione
   */
  calcola(righe) {
    if (!righe || righe.length === 0) {
      return null;
    }
    
    // Estrai valori del campo, escludendo null/undefined
    const valori = righe
      .map(r => r[this.campo])
      .filter(v => v !== null && v !== undefined);
    
    if (valori.length === 0) {
      return null;
    }
    
    // Applica la funzione di aggregazione
    switch (this.funzione) {
      case 'COUNT':
        return valori.length;
      case 'SUM':
        return valori.reduce((acc, val) => {
          const num = parseFloat(val);
          return acc + (isNaN(num) ? 0 : num);
        }, 0);
      case 'AVG':
        return valori.reduce((acc, val) => {
          const num = parseFloat(val);
          return acc + (isNaN(num) ? 0 : num);
        }, 0) / valori.length;
      case 'MIN':
        return Math.min(...valori.map(v => {
          const num = parseFloat(v);
          return isNaN(num) ? 0 : num;
        }));
      case 'MAX':
        return Math.max(...valori.map(v => {
          const num = parseFloat(v);
          return isNaN(num) ? 0 : num;
        }));
      default:
        return null;
    }
  }
}

/**
 * Classe per gestire i raggruppamenti nelle query
 */
class QueryGruppo {
  /**
   * Costruttore della classe
   * @param {string|Array} campi - Campi per il raggruppamento
   */
  constructor(campi) {
    this.campi = Array.isArray(campi) ? campi : [campi];
    this.aggregazioni = [];
    this.condizione = null;
  }
  
  /**
   * Calcola la chiave di raggruppamento per una riga
   * @param {Object} riga - Riga da valutare
   * @return {string} Chiave di raggruppamento
   * @private
   */
  _calcolaChiave(riga) {
    return this.campi.map(campo => {
      const valore = riga[campo];
      return (valore === null || valore === undefined) ? 'NULL' : valore.toString();
    }).join('|');
  }
  
  /**
   * Aggiunge un'aggregazione al gruppo
   * @param {QueryAggregation} aggregazione - Aggregazione da aggiungere
   */
  aggiungiAggregazione(aggregazione) {
    this.aggregazioni.push(aggregazione);
  }
  
  /**
   * Imposta la condizione HAVING
   * @param {QueryCondition} condizione - Condizione da applicare dopo il raggruppamento
   */
  impostaCondizione(condizione) {
    this.condizione = condizione;
  }
  
  /**
   * Raggruppa le righe in base ai campi del gruppo
   * @param {Array} righe - Righe da raggruppare
   * @return {Array} Righe raggruppate
   */
  raggruppa(righe) {
    if (!righe || righe.length === 0) {
      return [];
    }
    
    // Crea gruppi in base alla chiave
    const gruppi = {};
    
    for (const riga of righe) {
      const chiave = this._calcolaChiave(riga);
      if (!gruppi[chiave]) {
        gruppi[chiave] = [];
      }
      gruppi[chiave].push(riga);
    }
    
    // Elabora risultati aggregati
    const risultati = [];
    
    for (const chiave in gruppi) {
      const gruppo = gruppi[chiave];
      const rigaRisultato = {};
      
      // Copia i campi di raggruppamento
      const primaRiga = gruppo[0];
      for (const campo of this.campi) {
        rigaRisultato[campo] = primaRiga[campo];
      }
      
      // Calcola le aggregazioni
      for (const agg of this.aggregazioni) {
        rigaRisultato[agg.alias] = agg.calcola(gruppo);
      }
      
      // Applica condizione HAVING se presente
      if (!this.condizione || this.condizione.valuta(rigaRisultato)) {
        risultati.push(rigaRisultato);
      }
    }
    
    return risultati;
  }
}

/**
 * Classe per la gestione della cache delle query
 */
class QueryCache {
  /**
   * Costruttore della classe
   * @param {MyCacheService} service - Servizio di cache
   */
  constructor(service) {
    this.service = service;
    this.prefisso = 'query_';
    this.scadenza = 300; // 5 minuti
  }
  
  /**
   * Genera una chiave unica per la query
   * @param {Object} query - Query builder
   * @return {string} Chiave di cache
   * @private
   */
  _generaChiave(query) {
    const queryJSON = JSON.stringify({
      selectedColumns: query.selectedColumns,
      tableName: query.tableName,
      conditions: query.conditions ? true : false, // Solo presenza, non dettagli
      joins: query.joins.map(j => ({ table: j.tableName, alias: j.alias, type: j.type })),
      groupBy: query.groupBy ? query.groupBy.campi : null,
      orderBy: query.orderBy,
      limite: query.limite,
      offset: query.offset
    });
    
    return this.prefisso + this._hashString(queryJSON);
  }
  
  /**
   * Genera un hash di una stringa
   * @param {string} str - Stringa da trasformare in hash
   * @return {string} Hash esadecimale
   * @private
   */
  _hashString(str) {
    let hash = 0;
    if (str.length === 0) return hash.toString(16);
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Conversione a 32bit
    }
    
    return hash.toString(16);
  }
  
  /**
   * Ottiene risultati dalla cache
   * @param {Object} query - Query builder
   * @return {Array|null} Risultati o null se non in cache
   */
  ottieni(query) {
    if (!this.service) return null;
    
    const chiave = this._generaChiave(query);
    return this.service.ottieni(chiave);
  }
  
  /**
   * Memorizza risultati in cache
   * @param {Object} query - Query builder
   * @param {Array} risultato - Risultati da memorizzare
   * @return {boolean} True se memorizzato con successo
   */
  memorizza(query, risultato) {
    if (!this.service) return false;
    
    const chiave = this._generaChiave(query);
    return this.service.imposta(chiave, risultato, this.scadenza);
  }
  
  /**
   * Invalida la cache per una tabella
   * @param {string} nomeTabella - Nome della tabella
   * @return {boolean} True se l'operazione è riuscita
   */
  invalidaTabella(nomeTabella) {
    if (!this.service) return false;
    
    // Nota: questo metodo è inefficiente ma inevitabile
    // senza un sistema interno di tracciamento delle chiavi
    this.service.pulisci(0);
    return true;
  }
  
  /**
   * Pulisce tutta la cache
   * @return {boolean} True se l'operazione è riuscita
   */
  pulisci() {
    if (!this.service) return false;
    return this.service.pulisci(0);
  }
}

/**
 * Builder unificato per query
 * Versione semplificata che combina QueryBuilder e AdvancedQueryBuilder
 */
class AdvancedQueryBuilder {
  /**
   * Costruttore della classe
   * @param {MyDatabaseService} dbService - Servizio database
   * @param {Array|string} columns - Colonne da selezionare
   */
  constructor(dbService, columns = ['*']) {
    this.dbService = dbService;
    this.selectedColumns = Array.isArray(columns) ? columns : [columns];
    this.tableName = null;
    this.conditions = [];
    this.joins = [];
    this.groupByFields = [];
    this.orderByFields = [];
    this.limite = null;
    this.offset = 0;
    this.usaCache = true;
    
    // Configura cache se disponibile
    this._cache = dbService._cache ? new QueryCache(dbService._cache) : null;
  }
  
  /**
   * Seleziona colonne per la query
   * @param {string|Array} columns - Colonne da selezionare
   * @return {AdvancedQueryBuilder} This per concatenamento
   */
  select(columns) {
    if (Array.isArray(columns)) {
      this.selectedColumns = columns;
    } else if (typeof columns === 'string') {
      this.selectedColumns = [columns];
    } else if (columns === '*' || columns === undefined) {
      this.selectedColumns = ['*'];
    }
    return this;
  }
  
  /**
   * Imposta la tabella sorgente
   * @param {string} tableName - Nome della tabella
   * @return {AdvancedQueryBuilder} This per concatenamento
   */
  from(tableName) {
    if (!this.dbService.tables[tableName]) {
      throw new Error(`Tabella ${tableName} non trovata nel database.`);
    }
    this.tableName = tableName;
    return this;
  }
  
  /**
   * Aggiunge condizioni WHERE
   * @param {string|Object} campo - Campo o oggetto di condizioni
   * @param {string} operatore - Operatore di confronto
   * @param {*} valore - Valore da confrontare
   * @return {AdvancedQueryBuilder} This per concatenamento
   */
  where(campo, operatore, valore) {
    // Gestione oggetto di condizioni { campo: valore, ... }
    if (typeof campo === 'object' && operatore === undefined && valore === undefined) {
      for (const key in campo) {
        this.conditions.push({
          campo: key,
          operatore: '=',
          valore: campo[key],
          tipo: 'AND'
        });
      }
      return this;
    }
    
    // Aggiunge condizione standard
    this.conditions.push({
      campo: campo,
      operatore: operatore,
      valore: valore,
      tipo: 'AND'
    });
    
    return this;
  }
  
  /**
   * Aggiunge condizioni OR
   * @param {string} campo - Campo
   * @param {string} operatore - Operatore di confronto
   * @param {*} valore - Valore da confrontare
   * @return {AdvancedQueryBuilder} This per concatenamento
   */
  orWhere(campo, operatore, valore) {
    this.conditions.push({
      campo: campo,
      operatore: operatore,
      valore: valore,
      tipo: 'OR'
    });
    
    return this;
  }
  
  /**
   * Alias per orWhere
   */
  or(campo, operatore, valore) {
    return this.orWhere(campo, operatore, valore);
  }
  
  /**
   * Alias per where
   */
  andWhere(campo, operatore, valore) {
    return this.where(campo, operatore, valore);
  }
  
  /**
   * Alias per where
   */
  and(campo, operatore, valore) {
    return this.where(campo, operatore, valore);
  }
  
  /**
   * Shorthand per condizione LIKE
   * @param {string} campo - Campo
   * @param {string} pattern - Pattern con % come wildcards
   * @return {AdvancedQueryBuilder} This per concatenamento
   */
  whereLike(campo, pattern) {
    return this.where(campo, 'LIKE', pattern);
  }
  
  /**
   * Shorthand per condizione IN
   * @param {string} campo - Campo
   * @param {Array} valori - Array di valori possibili
   * @return {AdvancedQueryBuilder} This per concatenamento
   */
  whereIn(campo, valori) {
    if (!Array.isArray(valori)) {
      throw new Error(`whereIn richiede un array di valori per il campo ${campo}`);
    }
    
    return this.where(campo, 'IN', valori);
  }
  
  /**
   * Aggiunge un join tra tabelle
   * @param {string} joinTable - Tabella da unire
   * @param {string} alias - Alias per la tabella
   * @param {Object} onConditions - Condizioni di join { campo1: campo2, ... }
   * @param {string} joinType - Tipo di join (inner, left, right)
   * @return {AdvancedQueryBuilder} This per concatenamento
   */
  join(joinTable, alias, onConditions, joinType = "inner") {
    this.joins.push({
      tableName: joinTable,
      alias: alias || joinTable,
      on: onConditions,
      type: joinType.toLowerCase()
    });
    return this;
  }
  
  /**
   * Shorthand per left join
   * @param {string} joinTable - Tabella da unire
   * @param {string} alias - Alias per la tabella
   * @param {Object} onConditions - Condizioni di join { campo1: campo2, ... }
   * @return {AdvancedQueryBuilder} This per concatenamento
   */
  leftJoin(joinTable, alias, onConditions) {
    return this.join(joinTable, alias, onConditions, "left");
  }
  
  /**
   * Imposta campi per il GROUP BY
   * @param {string|Array} campi - Campi per il raggruppamento
   * @return {AdvancedQueryBuilder} This per concatenamento
   */
  groupBy(campi) {
    const campiArray = Array.isArray(campi) ? campi : [campi];
    this.groupByFields = campiArray;
    
    // Aggiunge automaticamente i campi del groupBy alla selezione
    for (const campo of campiArray) {
      if (!this.selectedColumns.includes(campo) && !this.selectedColumns.includes('*')) {
        this.selectedColumns.push(campo);
      }
    }
    
    return this;
  }
  
  /**
   * Imposta ordinamento
   * @param {string|Array} campi - Campi per l'ordinamento
   * @param {string} direzione - Direzione (ASC/DESC)
   * @return {AdvancedQueryBuilder} This per concatenamento
   */
  orderBy(campi, direzione = 'ASC') {
    const campiArray = Array.isArray(campi) ? campi : [campi];
    const dir = direzione.toUpperCase();
    
    if (dir !== 'ASC' && dir !== 'DESC') {
      throw new Error("La direzione dell'ordinamento deve essere 'ASC' o 'DESC'");
    }
    
    for (const campo of campiArray) {
      this.orderByFields.push({
        campo: campo,
        direzione: dir
      });
    }
    
    return this;
  }
  
  /**
   * Shorthand per orderBy DESC
   * @param {string|Array} campi - Campi per l'ordinamento
   * @return {AdvancedQueryBuilder} This per concatenamento
   */
  orderByDesc(campi) {
    return this.orderBy(campi, 'DESC');
  }
  
  /**
   * Imposta limite di righe
   * @param {number} limite - Numero massimo di righe
   * @return {AdvancedQueryBuilder} This per concatenamento
   */
  limit(limite) {
    this.limite = parseInt(limite, 10);
    return this;
  }
  
  /**
   * Imposta offset di righe
   * @param {number} offset - Numero di righe da saltare
   * @return {AdvancedQueryBuilder} This per concatenamento
   */
  offset(offset) {
    this.offset = parseInt(offset, 10);
    return this;
  }
  
  /**
   * Shorthand per paginazione
   * @param {number} pagina - Numero di pagina (1-based)
   * @param {number} dimensionePagina - Dimensione della pagina
   * @return {AdvancedQueryBuilder} This per concatenamento
   */
  paginate(pagina, dimensionePagina) {
    const numPagina = parseInt(pagina, 10) || 1;
    const dimPagina = parseInt(dimensionePagina, 10) || 10;
    
    this.limite = dimPagina;
    this.offset = (numPagina - 1) * dimPagina;
    
    return this;
  }
  
  /**
   * Esegue la query e restituisce i risultati
   * @return {Array} Array di risultati
   */
  execute() {
    if (!this.tableName) {
      throw new Error("È necessario specificare una tabella con from().");
    }
    
    // Verifica cache
    if (this.usaCache && this._cache) {
      const risultatiCache = this._cache.ottieni(this);
      if (risultatiCache !== null) {
        return risultatiCache;
      }
    }
    
    // Ottieni righe di base dalla tabella principale
    let resultRows = this.dbService.tables[this.tableName].ottieniRighe();
    
    // Funzione per prefissare le chiavi di una riga con il nome tabella
    const prefissaRiga = (riga, prefix) => {
      const newRiga = {};
      for (let key in riga) {
        newRiga[`${prefix}.${key}`] = riga[key]; // Versione prefissata
        newRiga[key] = riga[key]; // Mantiene anche la versione non prefissata
      }
      return newRiga;
    };
    
    // Prefissa le righe della tabella principale
    resultRows = resultRows.map(row => prefissaRiga(row, this.tableName));
    
    // Esegui i join
    for (const join of this.joins) {
      if (!this.dbService.tables[join.tableName]) {
        throw new Error(`Tabella di join ${join.tableName} non trovata.`);
      }
      
      const joinRows = this.dbService.tables[join.tableName].ottieniRighe();
      const prefixedJoinRows = joinRows.map(row => prefissaRiga(row, join.alias));
      
      let newResults = [];
      
      // Gestione dei diversi tipi di join
      if (join.type === "inner") {
        // INNER JOIN
        for (const mr of resultRows) {
          const matches = prefixedJoinRows.filter(jr => {
            let ok = true;
            for (let mainCol in join.on) {
              if (mr[mainCol] != jr[join.on[mainCol]]) {
                ok = false;
                break;
              }
            }
            return ok;
          });
          
          if (matches.length > 0) {
            for (const jr of matches) {
              newResults.push({...mr, ...jr});
            }
          }
        }
      } else if (join.type === "left") {
        // LEFT JOIN
        for (const mr of resultRows) {
          const matches = prefixedJoinRows.filter(jr => {
            let ok = true;
            for (let mainCol in join.on) {
              if (mr[mainCol] != jr[join.on[mainCol]]) {
                ok = false;
                break;
              }
            }
            return ok;
          });
          
          if (matches.length > 0) {
            for (const jr of matches) {
              newResults.push({...mr, ...jr});
            }
          } else {
            const joinNull = {};
            for (const col of this.dbService.tables[join.tableName].colonne) {
              joinNull[`${join.alias}.${col}`] = null;
              joinNull[col] = null;
            }
            newResults.push({...mr, ...joinNull});
          }
        }
      } else if (join.type === "right") {
        // RIGHT JOIN
        for (const jr of prefixedJoinRows) {
          const matches = resultRows.filter(mr => {
            let ok = true;
            for (let mainCol in join.on) {
              if (mr[mainCol] != jr[join.on[mainCol]]) {
                ok = false;
                break;
              }
            }
            return ok;
          });
          
          if (matches.length > 0) {
            for (const mr of matches) {
              newResults.push({...mr, ...jr});
            }
          } else {
            const mainEmpty = {};
            for (const col of this.dbService.tables[this.tableName].colonne) {
              mainEmpty[`${this.tableName}.${col}`] = null;
              mainEmpty[col] = null;
            }
            newResults.push({...mainEmpty, ...jr});
          }
        }
      }
      
      resultRows = newResults;
    }
    
    // Applica WHERE
    if (this.conditions.length > 0) {
      resultRows = this._applicaCondizioni(resultRows);
    }
    
    // Applica GROUP BY
    if (this.groupByFields.length > 0) {
      resultRows = this._applicaGroupBy(resultRows);
    }
    
    // Applica ORDER BY
    if (this.orderByFields.length > 0) {
      resultRows = [...resultRows].sort((a, b) => {
        for (const ordinamento of this.orderByFields) {
          const valoroA = a[ordinamento.campo];
          const valoroB = b[ordinamento.campo];
          
          if (valoroA === valoroB) {
            continue;
          }
          
          if (valoroA === null || valoroA === undefined) {
            return ordinamento.direzione === 'ASC' ? -1 : 1;
          }
          
          if (valoroB === null || valoroB === undefined) {
            return ordinamento.direzione === 'ASC' ? 1 : -1;
          }
          
          const comparazione = valoroA < valoroB ? -1 : 1;
          return ordinamento.direzione === 'ASC' ? comparazione : -comparazione;
        }
        
        return 0;
      });
    }
    
    // Applica LIMIT e OFFSET
    if (this.offset > 0 || this.limite !== null) {
      const start = this.offset || 0;
      const end = this.limite !== null ? start + this.limite : undefined;
      resultRows = resultRows.slice(start, end);
    }
    
    // Proiezione solo delle colonne selezionate
    if (this.selectedColumns.length > 0 && !this.selectedColumns.includes('*')) {
      resultRows = resultRows.map(riga => {
        const selezionati = {};
        for (const col of this.selectedColumns) {
          selezionati[col] = riga[col];
        }
        return selezionati;
      });
    }
    
    // Memorizza in cache se abilitata
    if (this.usaCache && this._cache) {
      this._cache.memorizza(this, resultRows);
    }
    
    return resultRows;
  }
  
  /**
   * Applica le condizioni WHERE
   * @param {Object[]} righe - Righe da filtrare
   * @return {Object[]} Righe filtrate
   * @private
   */
  _applicaCondizioni(righe) {
    return righe.filter(riga => {
      let risultatoFinale = true;
      let ultimoTipo = 'AND';
      
      for (const cond of this.conditions) {
        const valoreRiga = riga[cond.campo];
        let risultatoCondizione = false;
        
        // Valuta la condizione
        switch (cond.operatore) {
          case '=':
            risultatoCondizione = valoreRiga == cond.valore;
            break;
          case '!=':
          case '<>':
            risultatoCondizione = valoreRiga != cond.valore;
            break;
          case '>':
            risultatoCondizione = valoreRiga > cond.valore;
            break;
          case '<':
            risultatoCondizione = valoreRiga < cond.valore;
            break;
          case '>=':
            risultatoCondizione = valoreRiga >= cond.valore;
            break;
          case '<=':
            risultatoCondizione = valoreRiga <= cond.valore;
            break;
          case 'LIKE':
            if (typeof valoreRiga !== 'string') {
              risultatoCondizione = false;
            } else {
              // Gestione wildcard %
              const pattern = cond.valore.replace(/%/g, '.*');
              const regex = new RegExp(`^${pattern}$`, 'i');
              risultatoCondizione = regex.test(valoreRiga);
            }
            break;
          case 'IN':
            risultatoCondizione = Array.isArray(cond.valore) && cond.valore.includes(valoreRiga);
            break;
          case 'NOT IN':
            risultatoCondizione = Array.isArray(cond.valore) && !cond.valore.includes(valoreRiga);
            break;
          default:
            risultatoCondizione = false;
        }
        
        // Combina con il risultato precedente in base al tipo di connettore (AND/OR)
        if (cond.tipo === 'AND') {
          risultatoFinale = risultatoFinale && risultatoCondizione;
        } else if (cond.tipo === 'OR') {
          if (ultimoTipo === 'AND') {
            // Quando passiamo da AND a OR, salviamo il risultato corrente e iniziamo una nuova espressione OR
            risultatoFinale = risultatoFinale || risultatoCondizione;
          } else {
            // Continua la catena OR
            risultatoFinale = risultatoFinale || risultatoCondizione;
          }
        }
        
        ultimoTipo = cond.tipo;
        
        // Short-circuit per AND
        if (cond.tipo === 'AND' && !risultatoFinale) {
          return false;
        }
      }
      
      return risultatoFinale;
    });
  }
  
  /**
   * Raggruppa i risultati per campi
   * @param {Object[]} righe - Righe da raggruppare
   * @return {Object[]} Righe raggruppate
   * @private
   */
  _applicaGroupBy(righe) {
    const gruppi = {};
    
    // Funzione per generare chiave di gruppo
    const generaChiaveGruppo = (riga) => {
      return this.groupByFields.map(campo => {
        const valore = riga[campo];
        return valore === null || valore === undefined ? 'NULL' : String(valore);
      }).join('|');
    };
    
    // Raggruppa i dati
    for (const riga of righe) {
      const chiave = generaChiaveGruppo(riga);
      
      if (!gruppi[chiave]) {
        gruppi[chiave] = [];
      }
      
      gruppi[chiave].push(riga);
    }
    
    // Crea righe risultato
    const risultati = [];
    
    for (const chiave in gruppi) {
      const gruppo = gruppi[chiave];
      const rigaRisultato = {};
      
      // Copia i campi di raggruppamento dalla prima riga
      for (const campo of this.groupByFields) {
        rigaRisultato[campo] = gruppo[0][campo];
      }
      
      risultati.push(rigaRisultato);
    }
    
    return risultati;
  }
  
  /**
   * Alias per execute()
   * @return {Array} Risultati della query
   */
  get() {
    return this.execute();
  }
  
  /**
   * Ottiene solo la prima riga dei risultati
   * @return {Object|null} Prima riga o null
   */
  first() {
    const original = this.limite;
    this.limite = 1;
    const results = this.execute();
    this.limite = original;
    return results.length > 0 ? results[0] : null;
  }
  
  /**
   * Verifica se esistono risultati
   * @return {boolean} True se esistono risultati
   */
  exists() {
    const original = this.limite;
    this.limite = 1;
    const results = this.execute();
    this.limite = original;
    return results.length > 0;
  }
}


/**
 * Servizio per la gestione di database basati su Google Spreadsheet
 * Implementa funzionalità di ORM base con relazioni, query builder e validazione schemi
 */
class MyDatabaseService {
  /**
   * @param {string} idFoglio - ID dello spreadsheet che contiene il database
   * @param {MySpreadsheetService} spreadsheetService - Servizio per i fogli di calcolo
   * @param {MyLoggerService} logger - Servizio di logging
   * @param {MyUtilsService} utils - Servizio di utilità
   */
  constructor(idFoglio, spreadsheetService, logger, utils) {
    this._idFoglio = idFoglio;
    this._spreadsheetService = spreadsheetService;
    this._logger = logger;
    this._utils = utils;
    
    // Strutture dati principali
    this.tables = {}; // Mappa di tabelle: {nomeTabella: TabellaDatabaseObj}
    this.relazioni = {}; // Mappa di relazioni: {nomeTabella: {nomeRelazione: configRelazione}}
    
    // Stato interno
    this._spreadsheet = null;
    this._schede = [];
    this._caricato = false;
    
    // Inizializza il database
    this._inizializza();
  }
  
  /**
   * Inizializza il database caricando tutte le tabelle
   * @private
   */
  _inizializza() {
    try {
      // Apri il foglio di calcolo
      this._spreadsheet = this._spreadsheetService
        .apri(this._idFoglio, true) // usa API avanzate
        .ottieniRisultato();
      
      if (!this._spreadsheet) {
        throw new Error(`Impossibile aprire il foglio con ID ${this._idFoglio}`);
      }
      
      // Ottieni tutte le schede
      this._schede = this._spreadsheetService
        .ottieniSchede(this._spreadsheet, true)
        .ottieniRisultato();
      
      if (!this._schede || this._schede.length === 0) {
        throw new Error(`Nessuna scheda trovata nel foglio ${this._idFoglio}`);
      }
      
      // Crea una tabella per ogni scheda
      for (const scheda of this._schede) {
        if (scheda.nascosta) continue; // Ignora schede nascoste
        
        // Crea una nuova tabella
        const tabella = new MyTableService(
            scheda.nome,
            this._spreadsheet,
            this._spreadsheetService,
            this._logger,
            this._utils
        );
        
        // Aggiungi alla mappa delle tabelle
        this.tables[scheda.nome] = tabella;
        
        // Inizializza la mappa delle relazioni per questa tabella
        this.relazioni[scheda.nome] = {};
      }
      
      this._caricato = true;
      this._logger.info(`Database inizializzato con ${Object.keys(this.tables).length} tabelle`);
    } catch (e) {
      this._logger.error(`Errore nell'inizializzazione del database: ${e.message}`);
      throw e;
    }
  }
  
  /**
   * Imposta una relazione tra due tabelle
   * @param {string} nomeTabella - Nome della tabella principale
   * @param {string} nomeRelazione - Nome della relazione
   * @param {Object} configRelazione - Configurazione della relazione
   * @return {MyDatabaseService} this per chiamate fluent
   */
  impostaRelazione(nomeTabella, nomeRelazione, configRelazione) {
    if (!this.tables[nomeTabella]) {
      this._logger.warn(`Tabella ${nomeTabella} non trovata per impostare relazione ${nomeRelazione}`);
      return this;
    }
    
    if (!this.relazioni[nomeTabella]) {
      this.relazioni[nomeTabella] = {};
    }
    
    // Verifica che la configurazione sia valida
    if (!configRelazione.type || !configRelazione.target) {
      this._logger.warn(`Configurazione relazione ${nomeRelazione} incompleta`);
      return this;
    }
    
    // Aggiunge la relazione
    this.relazioni[nomeTabella][nomeRelazione] = configRelazione;
    return this;
  }
  
  /**
   * Carica i dati correlati per una determinata entità utilizzando una relazione configurata
   * @param {string} nomeTabella - Nome della tabella dell'entità principale
   * @param {string} idEntita - ID dell'entità
   * @param {string} nomeRelazione - Nome della relazione da seguire
   * @return {Array|Object} Dati correlati o null se non trovati
   */
  caricaRelazione(nomeTabella, idEntita, nomeRelazione) {
    try {
      // Verifichiamo se la tabella esiste
      if (!this.tables[nomeTabella]) {
        this._logger.error(`Tabella ${nomeTabella} non trovata nel database`);
        return null;
      }
      
      // Verifichiamo se la relazione è definita
      if (!this.relazioni[nomeTabella] || !this.relazioni[nomeTabella][nomeRelazione]) {
        this._logger.warn(`Relazione ${nomeRelazione} non definita per la tabella ${nomeTabella}`);
        return [];
      }
      
      const relazione = this.relazioni[nomeTabella][nomeRelazione];
      
      // Determiniamo il tipo di relazione e recuperiamo i dati
      if (relazione.type === "many-to-one") {
        // Relazione uno a molti (inversa)
        const qb = this.select()
            .from(relazione.target)
            .where(relazione.foreignKey, '=', idEntita);
        
        const risultati = qb.execute();
        return risultati.length > 0 ? risultati[0] : null;
      } else if (relazione.type === "one-to-many") {
        // Relazione uno a molti
        const qb = this.select()
            .from(relazione.target)
            .where(relazione.foreignKey, '=', idEntita);
        
        return qb.execute();
      } else if (relazione.type === "many-to-many") {
        // Relazione molti a molti tramite tabella di join
        if (!relazione.pivotTable || !relazione.pivotForeignKey || !relazione.pivotRelatedKey) {
          this._logger.error("Relazione many-to-many incompleta: mancano attributi della tabella pivot");
          return [];
        }
        
        // Prima otteniamo gli ID dalla tabella pivot
        const joinQuery = this.select([relazione.pivotRelatedKey])
            .from(relazione.pivotTable)
            .where(relazione.pivotForeignKey, '=', idEntita);
        
        const joinResults = joinQuery.execute();
        
        if (joinResults.length === 0) {
          return [];
        }
        
        // Ora otteniamo le righe correlate
        const relatedIds = joinResults.map(r => r[relazione.pivotRelatedKey]);
        
        return this.select()
            .from(relazione.target)
            .whereIn(relazione.foreignKey, relatedIds)
            .execute();
      } else if (relazione.type === "custom" && typeof relazione.customFunction === 'function') {
        // Supporto per relazioni custom
        return relazione.customFunction(idEntita, this);
      } else {
        this._logger.error(`Tipo di relazione non supportato: ${relazione.type}`);
        return [];
      }
    } catch (e) {
      this._logger.error(`Errore nel caricamento della relazione: ${e.message}`);
      return relazione && relazione.type === "many-to-one" ? null : [];
    }
  }
  
  /**
   * Verifica lo schema del database
   * @return {Object} Risultato della verifica { valido: boolean, errori: string[] }
   */
  verificaSchema() {
    const errori = [];
    let valido = true;
    
    // Verifica la presenza di tabelle
    if (Object.keys(this.tables).length === 0) {
      errori.push("Nessuna tabella trovata nel database");
      valido = false;
    }
    
    // Verifica le relazioni
    for (const nomeTabella in this.relazioni) {
      // Verifica che la tabella esista
      if (!this.tables[nomeTabella]) {
        errori.push(`Relazione definita per tabella inesistente: ${nomeTabella}`);
        valido = false;
        continue;
      }
      
      const relazioniTabella = this.relazioni[nomeTabella];
      
      for (const nomeRelazione in relazioniTabella) {
        const relazione = relazioniTabella[nomeRelazione];
        
        // Verifica che la tabella target esista
        if (relazione.target && !this.tables[relazione.target]) {
          errori.push(`Relazione ${nomeTabella}.${nomeRelazione} fa riferimento a tabella inesistente: ${relazione.target}`);
          valido = false;
        }
        
        // Verifica che il tipo di relazione sia valido
        if (!relazione.type || !['one-to-many', 'many-to-one', 'many-to-many', 'custom'].includes(relazione.type)) {
          errori.push(`Relazione ${nomeTabella}.${nomeRelazione} ha tipo non valido: ${relazione.type}`);
          valido = false;
        }
        
        // Verifica parametri specifici per tipo di relazione
        if (relazione.type === 'many-to-many' && 
            (!relazione.pivotTable || !relazione.pivotForeignKey || !relazione.pivotRelatedKey)) {
          errori.push(`Relazione many-to-many ${nomeTabella}.${nomeRelazione} manca di parametri obbligatori`);
          valido = false;
        }
        
        if (relazione.type === 'custom' && typeof relazione.customFunction !== 'function') {
          errori.push(`Relazione custom ${nomeTabella}.${nomeRelazione} manca della funzione di implementazione`);
          valido = false;
        }
      }
    }
    
    return { valido, errori };
  }
  
/**
 * Crea un nuovo query builder per una selezione
 * @param {string[]} [campi] - Campi da selezionare (default: *)
 * @return {AdvancedQueryBuilder} Query builder
 */
select(campi = ['*']) {
  return new AdvancedQueryBuilder(this, campi);
}
  
  /**
   * Salva tutte le modifiche pendenti nel database
   * @return {MyDatabaseService} this per chiamate fluent
   */
  salva() {
    try {
      // Chiamare flush() sul servizio spreadsheet
      this._spreadsheetService.flushBatch();
      this._logger.info("Database salvato con successo");
      return this;
    } catch (e) {
      this._logger.error(`Errore nel salvataggio del database: ${e.message}`);
      return this;
    }
  }
}


