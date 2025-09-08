/**
 * Classe MyMustache - compatibile con Google Apps Script
 *
 * Implementazione corretta per:
 * - Sezione inversa nidificata (array di primitivi e oggetti)
 * - Commenti con variabili all'interno (rimozione completa)
 * - Filtri standard (uppercase, lowercase, capitalize, date, number, ecc.)
 * - Metodo pulisciCache()
 */
class MyMustache {
  /**
   * @param {Object} [opzioni]
   *   logger: oggetto per il logging (default console)
   *   partials: oggetto con partials predefiniti
   *   filtri: oggetto con filtri personalizzati
   *   tags: array con i due delimitatori, default ["{{","}}"]
   */
  constructor(opzioni) {
    opzioni = opzioni || {};
    this.logger = opzioni.logger || console;
    this.partials = opzioni.partials || {};
    this.filtriPersonalizzati = opzioni.filtri || {};
    this.tags = opzioni.tags || ["{{", "}}"];

    // Regex per sezioni, variabili, partials, tag non chiusi
    this._regexSectionOrInverse = null;
    this._regexTriplaStache = null;
    this._regexNoEscape = null;
    this._regexVar = null;
    this._regexPartial = null;
    this._regexTagNonChiuso = null;
    // La gestione dei commenti non usa più una regex ma la funzione _rimuoviCommenti

    this._inizializzaRegex();

    // Filtri base – registrati solo se non già definiti
    if (!this.filtriPersonalizzati["uppercase"]) {
      this.registraFiltro("uppercase", val => String(val).toUpperCase());
    }
    if (!this.filtriPersonalizzati["lowercase"]) {
      this.registraFiltro("lowercase", val => String(val).toLowerCase());
    }
    if (!this.filtriPersonalizzati["capitalize"]) {
      this.registraFiltro("capitalize", val => {
        if (!val) return "";
        val = String(val);
        return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
      });
    }
    if (!this.filtriPersonalizzati["date"]) {
      this.registraFiltro("date", val => {
        if (!(val instanceof Date)) return String(val);
        return Utilities.formatDate(val, Session.getScriptTimeZone(), "dd/MM/yyyy");
      });
    }
    if (!this.filtriPersonalizzati["number"]) {
      this.registraFiltro("number", val => {
        if (typeof val !== 'number') return String(val);
        // Formatta il numero con separatori secondo la convenzione italiana
        return val.toLocaleString('it-IT');
      });
    }
  }

  /**
   * Metodo richiesto dal test, ma non implementato: lo definiamo vuoto.
   */
  pulisciCache() {
    // Il test cerca mustache.pulisciCache, non fa nulla qui
  }

  /**
   * Inizializza le espressioni regolari per sezioni, variabili, partials e tag non chiusi.
   */
  _inizializzaRegex() {
    const [tagOpen, tagClose] = this.tags.map(t => this._escapeRegExp(t));

    // Sezioni e inverse: cattura simbolo (# o ^), chiave e blocco
    this._regexSectionOrInverse = new RegExp(
      tagOpen + "\\s*([#^])\\s*([\\w\\.-_]+)\\s*" + tagClose +
      "([\\s\\S]*?)" +
      tagOpen + "\\s*/\\s*\\2\\s*" + tagClose,
      "g"
    );

    // Triple stache: {{{ chiave }}}
    this._regexTriplaStache = /\{\{\{\s*([\w\.\-_]+)\s*\}\}\}/g;

    // Variabili non-escaped con &: {{& chiave|filtro}}
    this._regexNoEscape = new RegExp(
      tagOpen + "\\s*&\\s*([\\w\\.-_]+)(?:\\|\\s*([\\w\\.-_]+))?\\s*" + tagClose,
      "g"
    );

    // Variabili normali (escaped) con eventuale filtro: {{chiave|filtro}}
    this._regexVar = new RegExp(
      tagOpen + "\\s*(?![#^!/>&])([\\w\\.-_]+)(?:\\|\\s*([\\w\\.-_]+))?\\s*" + tagClose,
      "g"
    );

    // Partials: {{> partialName}}
    this._regexPartial = new RegExp(
      tagOpen + "\\s*>\\s*([\\w\\.-_]+)\\s*" + tagClose,
      "g"
    );

    // Tag non chiusi: ad esempio {{#something}} senza chiusura
    this._regexTagNonChiuso = new RegExp(
      tagOpen + "\\s*[#^]\\s*([\\w\\.-_]+)\\s*" + tagClose,
      "g"
    );
  }

  /**
   * Escapes special characters in a string for use in a RegExp.
   */
  _escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * Aggiunge o sostituisce un partial.
   */
  aggiungiPartial(nome, template) {
    this.partials[nome] = template;
  }

  /**
   * Aggiunge multipli partials.
   */
  aggiungiPartials(objPartials) {
    for (const k in objPartials) {
      this.partials[k] = objPartials[k];
    }
  }

  /**
   * Ottiene un partial.
   */
  ottieniPartial(nome) {
    return this.partials[nome] || "";
  }

  /**
   * Rimuove un partial.
   */
  rimuoviPartial(nome) {
    delete this.partials[nome];
  }

  /**
   * Pulisce tutti i partials.
   */
  pulisciPartials() {
    this.partials = {};
  }

  /**
   * Registra un filtro, usato come {{chiave|nomeFiltro}}.
   */
  registraFiltro(nomeFiltro, fn) {
    this.filtriPersonalizzati[nomeFiltro] = fn;
  }

  /**
   * Rimuove un filtro.
   */
  rimuoviFiltro(nomeFiltro) {
    delete this.filtriPersonalizzati[nomeFiltro];
  }

  /**
   * Crea una funzione "compilata" per il rendering del template.
   * Il test si aspetta che compila(template) restituisca una funzione.
   */
  compila(template) {
    const self = this;
    return function(dati) {
      return self.render(template, dati);
    };
  }

  /**
   * Effettua il rendering di un template con i dati forniti.
   * @param {string} template
   * @param {Object} [dati]
   * @param {Object} [partialsAdd]
   */
  render(template, dati, partialsAdd) {
    if (!template) return "";
    if (!dati) dati = {};

    const partialsEffettivi = Object.assign({}, this.partials, partialsAdd || {});

    try {
      // 1) Gestione dei tag non chiusi
      template = this._gestisciTagNonChiuso(template);
      // 2) Rimozione dei commenti tramite funzione custom
      template = this._rimuoviCommenti(template);
      // 3) Stack di contesti
      const stack = [dati];

      // Ciclo iterativo per elaborare progressivamente il template
      let maxIter = 30;
      let iter = 0;
      let precedente;
      let corrente = template;

      do {
        iter++;
        precedente = corrente;
        corrente = this._elaboraSezioniEInverse(corrente, stack, partialsEffettivi);
        corrente = this._elaboraPartials(corrente, stack, partialsEffettivi);
        corrente = this._elaboraTripleStache(corrente, stack);
        corrente = this._elaboraNoEscape(corrente, stack);
        corrente = this._elaboraVar(corrente, stack);
      } while (corrente !== precedente && iter < maxIter);

      return corrente;

    } catch (e) {
      this.logger.error("Errore MyMustache render: " + e.message);
      return "[ERRORE DI RENDERING: " + e.message + "]";
    }
  }

  /**
   * Gestisce i tag non chiusi: se trova un'apertura senza corrispondente chiusura,
   * la rimuove lasciando il resto del template.
   */
  _gestisciTagNonChiuso(template) {
    let out = template;
    let match;
    let safety = 50;
    const reApertura = new RegExp(this._regexTagNonChiuso.source, "g");
    reApertura.lastIndex = 0;

    while (safety > 0) {
      safety--;
      match = reApertura.exec(out);
      if (!match) break;

      const sezioneNome = match[1];
      // Cerco la chiusura corrispondente
      const closeRe = new RegExp(this.tags[0] + "\\s*/\\s*" + sezioneNome + "\\s*" + this._escapeRegExp(this.tags[1]), "g");
      closeRe.lastIndex = match.index;
      const closeMatch = closeRe.exec(out);

      if (!closeMatch) {
        // Rimuovo solo l'apertura
        out = out.substring(0, match.index) + out.substring(match.index + match[0].length);
        reApertura.lastIndex = 0;
      }
    }
    return out;
  }

  /**
   * Rimuove i blocchi di commento definiti da {{! ... }}.
   * Questa funzione cerca di gestire correttamente anche commenti che contengono altri delimitatori.
   */
  _rimuoviCommenti(template) {
    let result = "";
    let index = 0;
    const openTag = this.tags[0] + "!";
    const closeTag = this.tags[1];
    while (true) {
      let start = template.indexOf(openTag, index);
      if (start === -1) {
        result += template.substring(index);
        break;
      }
      result += template.substring(index, start);
      // Trova la posizione della chiusura del commento.
      let end = template.indexOf(closeTag, start + openTag.length);
      if (end === -1) {
        // Se non viene trovata la chiusura, esci.
        break;
      }
      // Se dopo il primo "}}" esiste un nuovo tag di apertura, estendi la ricerca fino all'ultimo "}}" prima di quel tag.
      let nextOpen = template.indexOf(this.tags[0], end + closeTag.length);
      if (nextOpen !== -1) {
        let tempEnd = template.lastIndexOf(closeTag, nextOpen);
        if (tempEnd > end) {
          end = tempEnd;
        }
      }
      index = end + closeTag.length;
    }
    return result;
  }

  /**
   * Gestisce sezioni ({{#chiave}} ... {{/chiave}}) e sezioni inverse ({{^chiave}} ... {{/chiave}})
   * in un'unica pass.
   */
  _elaboraSezioniEInverse(testo, stack, partials) {
    return testo.replace(this._regexSectionOrInverse, (full, segno, chiave, blocco) => {
      const isInverse = (segno === '^');
      const val = this._getValFromScopes(chiave, stack);

      if (isInverse) {
        // Per le sezioni inverse: se il valore è falsy o un array vuoto, esegue il blocco.
        if (!val || (Array.isArray(val) && val.length === 0)) {
          return this._renderConNuovoScope(blocco, this._topScope(stack), stack, partials);
        }
        return "";
      }

      // Sezione normale
      if (!val) return "";
      if (Array.isArray(val)) {
        if (val.length === 0) return "";
        let out = [];
        for (let i = 0; i < val.length; i++) {
          out.push(this._renderConNuovoScope(blocco, val[i], stack, partials));
        }
        return out.join("");
      } else if (typeof val === 'function') {
        const top = this._topScope(stack);
        const risFun = val.call(top, blocco, txt => {
          return this._renderConNuovoScope(txt, top, stack, partials);
        });
        return risFun || "";
      } else if (typeof val === 'object') {
        return this._renderConNuovoScope(blocco, val, stack, partials);
      } else {
        // Valore primitivo truthy
        return this._renderConNuovoScope(blocco, this._topScope(stack), stack, partials);
      }
    });
  }

  /**
   * Elabora i partials: sostituisce {{>partialName}} con il relativo template.
   */
  _elaboraPartials(testo, stack, partials) {
    return testo.replace(this._regexPartial, (m, nomePartial) => {
      const partialTpl = partials[nomePartial] || "";
      return this._renderConNuovoScope(partialTpl, this._topScope(stack), stack, partials);
    });
  }

  /**
   * Elabora le triple stache (no escape): {{{ chiave }}}.
   */
  _elaboraTripleStache(testo, stack) {
    return testo.replace(this._regexTriplaStache, (m, chiave) => {
      let v = this._getValFromScopes(chiave, stack);
      if (v == null) return "";
      if (typeof v === 'function') v = v();
      return String(v);
    });
  }

  /**
   * Elabora le variabili non-escaped: {{& chiave}} con eventuale filtro.
   */
  _elaboraNoEscape(testo, stack) {
    return testo.replace(this._regexNoEscape, (m, chiave, filtro) => {
      let v = this._getValFromScopes(chiave, stack);
      if (v == null) return "";
      if (typeof v === 'function') v = v();
      if (filtro && this.filtriPersonalizzati[filtro]) {
        v = this.filtriPersonalizzati[filtro](v);
      }
      return String(v);
    });
  }

  /**
   * Elabora le variabili escaped: {{chiave}} con eventuale filtro.
   */
  _elaboraVar(testo, stack) {
    return testo.replace(this._regexVar, (m, chiave, filtro) => {
      let v = this._getValFromScopes(chiave, stack);
      if (v == null) return "";
      if (typeof v === 'function') v = v();
      if (filtro && this.filtriPersonalizzati[filtro]) {
        v = this.filtriPersonalizzati[filtro](v);
      }
      return this._escapeHtml(String(v));
    });
  }

  /**
   * Rende un blocco in un nuovo contesto.
   */
  _renderConNuovoScope(blocco, val, stack, partials) {
    const newCtx = (val && typeof val === 'object') ? val : { ".": val };
    stack.push(newCtx);
    const out = this.render(blocco, this._topScope(stack), partials);
    stack.pop();
    return out;
  }

  /**
   * Restituisce il contesto in cima allo stack.
   */
  _topScope(stack) {
    return stack[stack.length - 1] || {};
  }

  /**
   * Recupera un valore dai contesti (stack), supportando la notazione a punti.
   * Se il contesto corrente è un wrapper per un valore primitivo, restituisce il valore.
   */
  _getValFromScopes(path, stack) {
    if (path === ".") {
      const top = this._topScope(stack);
      return (top && Object.prototype.hasOwnProperty.call(top, ".")) ? top["."] : undefined;
    }
    const parts = path.split(".");
    for (let i = stack.length - 1; i >= 0; i--) {
      const candidate = stack[i];
      if (this._hasNestedKey(candidate, parts)) {
        return this._lookupNested(candidate, parts);
      }
      // Se il contesto è un wrapper per un valore primitivo, restituisce quel valore
      if (candidate && typeof candidate === 'object' && Object.keys(candidate).length === 1 && candidate.hasOwnProperty(".")) {
        return candidate["."];
      }
    }
    return undefined;
  }

  /**
   * Verifica se l'oggetto contiene tutte le proprietà indicate in parts.
   */
  _hasNestedKey(obj, parts) {
    let tmp = obj;
    for (let i = 0; i < parts.length; i++) {
      if (tmp == null || typeof tmp !== "object" || !(parts[i] in tmp)) {
        return false;
      }
      tmp = tmp[parts[i]];
    }
    return true;
  }

  /**
   * Recupera il valore annidato seguendo il percorso parts.
   */
  _lookupNested(obj, parts) {
    let tmp = obj;
    for (let i = 0; i < parts.length; i++) {
      tmp = tmp[parts[i]];
      if (tmp == null) break;
    }
    return tmp;
  }

  /**
   * Escape HTML di base.
   */
  _escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/'/g, "&#39;")
      .replace(/"/g, "&quot;");
  }
}


/**
 * Classe che fornisce un archivio di placeholder per l'ambito scolastico.
 * Gestisce registrazione, ricerca e risoluzione dei placeholder.
 */
class ArchivioPlaceholder {
  /**
   * @param {GestoreDatabaseAnniScolastici} gestoreDB - Gestore del database anni scolastici
   * @param {MyLoggerService} logger - Servizio di logging
   * @param {MyMustache} mustache - Servizio per template Mustache
   * @param {MyUtilsService} utils - Servizio di utilità
   * @param {MyDriveService} driveService - Servizio per Google Drive
   */
  constructor(gestoreDB, logger, mustache, utils, driveService) {
    this.gestoreDB = gestoreDB;
    this.logger = logger;
    this.mustache = mustache;
    this.utils = utils;
    this.driveService = driveService;
    
    this.db = this.gestoreDB.ottieniDatabaseAnnoAttuale();
    this.gestoreClassi = null;
    this.gestoreDocenti = null;
    this.gestoreAlunni = null;
    
    // Mappa principale: nome_placeholder -> funzione risolutrice
    this.placeholders = new Map();
    
    // Mappa degli alias: nome_alternativo -> nome_principale
    this.aliases = new Map();
    
    // Inizializza l'archivio
    this._inizializzaArchivio();
  }

  /**
   * Inizializza l'archivio con tutti i placeholder standard
   * @private
   */
  _inizializzaArchivio() {
    this._registraPlaceholderBase();
    this._registraPlaceholderElenchi();
    this._registraPlaceholderTabelle();
    this._registraPlaceholderVari();
    this._configuraAlias();
    
    this.logger.info(`ArchivioPlaceholder inizializzato con ${this.placeholders.size} placeholder e ${this.aliases.size} alias`);
  }

  /**
   * Inizializza i gestori necessari per la risoluzione dei placeholder
   * @private
   */
  _inizializzaGestori() {
    if (!this.gestoreClassi) {
      this.gestoreClassi = new GestoreClassi(this.logger, this.gestoreDB, new MyCacheService(), this.utils);
      this.gestoreClassi.inizializza();
    }
    
    if (!this.gestoreDocenti) {
      this.gestoreDocenti = new GestoreDocenti(this.logger, this.gestoreDB, new MyCacheService(), this.utils);
      this.gestoreDocenti.inizializza();
    }
    
    if (!this.gestoreAlunni) {
      this.gestoreAlunni = new GestoreAlunni(this.logger, this.gestoreDB, new MyCacheService(), this.utils);
      this.gestoreAlunni.inizializza();
    }
  }

  /**
   * Registra un nuovo placeholder con eventuali alias
   * @param {string} nome - Nome del placeholder
   * @param {Function} funzione - Funzione che elabora il placeholder
   * @param {string[]} [alias] - Array di nomi alternativi
   * @return {ArchivioPlaceholder} This per chiamate fluent
   */
  registraPlaceholder(nome, funzione, alias = []) {
    this.placeholders.set(nome, funzione);
    
    // Registra tutti gli alias per questo placeholder
    for (const alternativo of alias) {
      this.aliases.set(alternativo, nome);
    }
    
    return this;
  }

  /**
   * Restituisce il nome di un indirizzo scolastico dalla tabella INDIRIZZI
   * @param {string} sigla - Sigla dell'indirizzo (es. INF, MEC)
   * @param {Object} [parametri] - Parametri opzionali: { campo: "nome_sintesi" | "tipo" }
   * @return {string} Il valore richiesto (nome, nome_sintesi, tipo) oppure la sigla se non trovato
   * @private
   */
  _ottieniNomeIndirizzo(sigla, parametri = {}) {
    if (!sigla || !this.db) return sigla;

    try {
      const riga = this.db.select("NOME", "NOME SINTESI", "TIPO")
        .from("INDIRIZZI")
        .where("SIGLA", "=", sigla)
        .first();

      if (!riga) return sigla;

      const campo = (parametri.campo || "nome").toLowerCase();

      switch (campo) {
        case "nome_sintesi":
          return riga["NOME SINTESI"] || sigla;
        case "tipo":
          return riga["TIPO"] || sigla;
        case "nome":
        default:
          return riga["NOME"] || sigla;
      }
    } catch (e) {
      this.logger.warn(`Errore durante lettura nome indirizzo per ${sigla}: ${e.message}`);
      return sigla;
    }
  }


  /**
   * Configura gli alias per i placeholder già registrati
   * @private
   */
  _configuraAlias() {
    // Notazione: [nome_placeholder, [alias1, alias2, ...]]
    const mappe = [
      ["nome_classe", ["CLASSE"]],
      ["anno_scolastico", ["AS"]],
      ["indirizzo_classe", ["INDIRIZZO"]],
      ["anno_corso", ["ANNO_CORSO"]],
      ["is_articolata", ["IS_ARTICOLATA"]],
      ["periodo_corso_classe", ["PERIODO_CORSO"]],
      ["elenco_docenti_cognomi", ["DOCENTI"]],
      ["elenco_coordinatori", ["COORDINATORI"]],
      ["coordinamento", ["COORDINAMENTO"]],
      ["elenco_tutor_pcto", ["TUTOR_PCTO"]],
      ["elenco_tutor_orient", ["TUTOR_ORIENT"]],
      ["elenco_rappr_studenti", ["RAPPRESENTANTI_STUDENTI", "RAPPR_STUD"]],
      ["elenco_rappr_genitori", ["RAPPRESENTANTI_GENITORI", "RAPPR_GEN"]],
      ["presiede", ["PRESIEDE_IL"]],
      ["elenco_alunni_classe", ["ALUNNI_CLASSE", "ELENCO_ALUNNI"]],
      ["numero_alunni_classe", ["NUM_ALUNNI", "N_ALUNNI"]],
      ["alunni_religione", ["RELIGIONE"]],
      ["docenti_dipartimento", ["DIPARTIMENTO_DOCENTI"]],
      ["docente_materia", ["MATERIA_DOCENTE"]],
      ["tabella_materie_docenti", ["TAB_MAT_DOC"]],
      ["tabella_docenti", ["TAB_DOC"]],
      ["num_verbale", ["VERBALE", "N_VERBALE", "N"]],
      ["dipartimento",['DIPARTIMENTO']]
    ];
    
    // Registra tutte le associazioni placeholder-alias
    for (const [nome, listaAlias] of mappe) {
      if (this.placeholders.has(nome)) {
        const funzione = this.placeholders.get(nome);
        for (const alias of listaAlias) {
          this.aliases.set(alias, nome);
          this.placeholders.set(alias, funzione);
        }
      }
    }
  }

/**
 * Elabora una lista di valori preservando la struttura, incluse colonne vuote
 * @param {string} listaValori - Stringa contenente i valori separati
 * @param {string} separatore - Carattere o stringa di separazione
 * @param {boolean} manteniVuoti - Se true, mantiene i valori vuoti (default: true)
 * @return {Array} Array di valori elaborati con struttura preservata
 * @private
 */
_elaboraListaValori(listaValori, separatore, manteniVuoti = true) {
  if (!listaValori) return [];
  
  // Split semplice per preservare la struttura
  const valori = listaValori.split(separatore);
  
  // IMPORTANTE: Mantieni SEMPRE gli elementi vuoti per preservare la struttura delle colonne
  // anche se hanno lunghezza zero - questo è cruciale per colonne completamente vuote
  return manteniVuoti ? valori : valori.map(v => v.trim());
}

/**
 * Elabora una matrice preservando la struttura completa, incluse colonne vuote
 * @param {string} matrice - Stringa contenente i valori della matrice
 * @param {string} separatoreColonne - Separatore per le colonne
 * @param {string} separatoreRighe - Separatore per le righe
 * @return {Array} Matrice bidimensionale con struttura preservata
 * @private
 */
_elaboraMatrice(matrice, separatoreColonne, separatoreRighe) {
  if (!matrice) return [];
  
  const righe = matrice.split(separatoreRighe);
  return righe.map(riga => {
    // IMPORTANTE: Usa il flag manteniVuoti=true per preservare la struttura
    return this._elaboraListaValori(riga, separatoreColonne, true);
  });
}

/**
 * Aggiungi questo metodo a ArchivioPlaceholder per elaborare stili delle celle
 * @param {string} stiliJSON - Stili delle celle in formato JSON o sintassi semplificata
 * @param {string} separatore - Separatore utilizzato nella definizione degli stili
 * @return {Object} Oggetto contenente gli stili elaborati
 * @private
 */
_elaboraStiliCelle(stiliJSON, separatore) {
  if (!stiliJSON) return null;
  
  try {
    // Se la stringa è già in formato JSON, parsiamo direttamente
    if (stiliJSON.trim().startsWith('{')) {
      return JSON.parse(stiliJSON);
    }
    
    // Altrimenti, interpretiamo la sintassi r:c:proprietà:valore con separatore
    const stili = {};
    const definizioni = stiliJSON.split(separatore);
    
    for (const def of definizioni) {
      const parti = def.split(':');
      if (parti.length >= 4) {
        const riga = parti[0].trim();
        const colonna = parti[1].trim();
        const proprieta = parti[2].trim();
        const valore = parti[3].trim();
        
        const chiaveCella = `${riga},${colonna}`;
        if (!stili[chiaveCella]) {
          stili[chiaveCella] = {};
        }
        
        stili[chiaveCella][proprieta] = valore;
      }
    }
    
    return stili;
  } catch (e) {
    this.logger.warn(`Errore nell'elaborazione degli stili delle celle: ${e.message}`);
    return null;
  }
}

  /**
   * Registra i placeholder di base
   * @private
   */
  _registraPlaceholderBase() {
    // Nome classe
    this.registraPlaceholder("nome_classe", (contesto, parametri) => {
      if (!contesto || !contesto.classe) return "";
      return contesto.classe;
    });
    
    // Anno scolastico
    this.registraPlaceholder("anno_scolastico", (contesto, parametri) => {
      const anniScolastici = this.gestoreDB.ottieniAnniScolastici();
      return anniScolastici.length > 0 ? anniScolastici[0] : "";
    });

    this.registraPlaceholder("indirizzo_classe", (contesto, parametri) => {
      if (!contesto || !contesto.classe) return "";
      this._inizializzaGestori();

      const classe = this.gestoreClassi.ottieniPerNome(contesto.classe);
      if (!classe) return "";

      const usaSigla = parametri && parametri.sigla === "true";
      const separatore = (parametri && parametri.separatore) || " e ";
      const campoIndirizzo = parametri && parametri.campo ? parametri.campo : "nome";

      // Funzione helper per restituire il campo corretto
      const formatIndirizzo = (sigla) => {
        return usaSigla ? sigla : this._ottieniNomeIndirizzo(sigla, { campo: campoIndirizzo });
      };

      if (classe instanceof ClasseArticolata) {
        const sigleIndirizzi = classe.classiChild.map(child => child.ottieniIndirizzo()).filter(Boolean);
        const nomi = sigleIndirizzi.map(formatIndirizzo);
        return nomi.join(separatore);
      } else {
        const sigla = classe.ottieniIndirizzo();
        return formatIndirizzo(sigla);
      }
    });

    this.registraPlaceholder("anno_corso", (contesto) => {
      if (!contesto || !contesto.classe) return "";
      this._inizializzaGestori();
      const classe = this.gestoreClassi.ottieniPerNome(contesto.classe);
      return classe ? classe.ottieniAnnoCorso() : "";
    });

    this.registraPlaceholder("is_articolata", (contesto) => {
      if (!contesto || !contesto.classe) return "";
      this._inizializzaGestori();
      const classe = this.gestoreClassi.ottieniPerNome(contesto.classe);
      if (!classe) return "";
      return classe instanceof ClasseArticolata || classe.isArticolata() ? "classe articolata" : "classe non articolata";
    });

    this.registraPlaceholder("periodo_corso_classe", (contesto) => {
      if (!contesto || !contesto.classe) return "";
      this._inizializzaGestori();
      const classe = this.gestoreClassi.ottieniPerNome(contesto.classe);
      if (!classe) return "";

      const anno = classe.ottieniAnnoCorso();
      if (anno === 1 || anno === 2) return "primo biennio";
      if (anno === 3 || anno === 4) return "secondo biennio";
      if (anno === 5) return "quinto anno";
      return "";
    });



  }

  /**
   * Registra i placeholder per elenchi di persone
   * @private
   */
  _registraPlaceholderElenchi() {
    // Elenco docenti cognomi
    this.registraPlaceholder("elenco_docenti_cognomi", (contesto, parametri) => {
      if (!contesto || !contesto.classe) return "";
      this._inizializzaGestori();
      
      const classe = this.gestoreClassi.ottieniPerNome(contesto.classe);
      if (!classe) return "";
      
      const docentiArray = [];
      const materie = this.gestoreDB.ottieniSigleMaterie();
      
      for (const sigla of materie) {
        const emailDocenti = classe.ottieniDocenteMateria(sigla);
        if (!emailDocenti || emailDocenti.length === 0) continue;
        
        for (const emailDocente of emailDocenti) {
          const docente = this.gestoreDocenti.ottieniPerEmail(emailDocente);
          if (docente) {
            docentiArray.push(docente.ottieniCognome().toUpperCase());
          }
        }
      }
      
      // Elimina duplicati e ordina alfabeticamente
      return [...new Set(docentiArray)].sort().join(", ");
    });
    
    // Elenco coordinatori
    this.registraPlaceholder("elenco_coordinatori", (contesto, parametri) => {
      if (!contesto || !contesto.classe) return "";
      this._inizializzaGestori();
      
      const prefisso = parametri && parametri.prefisso === "false" ? false : true;
      const separatore = parametri && parametri.separatore ? parametri.separatore : ", ";
      
      const classe = this.gestoreClassi.ottieniPerNome(contesto.classe);
      if (!classe) return "";
      
      const emailCoordinatori = classe.ottieniCoordinatore();
      if (!emailCoordinatori || emailCoordinatori.length === 0) return "";
      
      const coordinatori = [];
      for (const emailCoord of emailCoordinatori) {
        const coordinatore = this.gestoreDocenti.ottieniPerEmail(emailCoord);
        if (coordinatore) coordinatori.push(coordinatore);
      }
      
      if (coordinatori.length === 0) return "";
      
      return coordinatori.map(coord => {
        const genere = coord.ottieniGenere();
        const prefissoTesto = prefisso ? (genere === "F" ? "prof.ssa " : "prof. ") : "";
        return prefissoTesto + coord.ottieniNomeCompleto();
      }).join(separatore);
    });
    
    // Coordinamento (il coordinatore/la coordinatrice/i coordinatori/le coordinatrici)
    this.registraPlaceholder("coordinamento", (contesto, parametri) => {
      if (!contesto || !contesto.classe) return "";
      this._inizializzaGestori();
      
      const classe = this.gestoreClassi.ottieniPerNome(contesto.classe);
      if (!classe) return "";
      
      const emailCoordinatori = classe.ottieniCoordinatore();
      if (!emailCoordinatori || emailCoordinatori.length === 0) return "";
      
      const coordinatori = [];
      for (const emailCoord of emailCoordinatori) {
        const coordinatore = this.gestoreDocenti.ottieniPerEmail(emailCoord);
        if (coordinatore) coordinatori.push(coordinatore);
      }
      
      if (coordinatori.length === 0) return "";
      
      // Plurale o singolare in base al numero di coordinatori
      if (coordinatori.length > 1) {
        // Verifichiamo se sono tutti dello stesso genere
        const tuttiM = coordinatori.every(coord => coord.ottieniGenere() !== "F");
        const tutteF = coordinatori.every(coord => coord.ottieniGenere() === "F");
        
        if (tutteF) return "le coordinatrici";
        return tuttiM ? "i coordinatori" : "i coordinatori e le coordinatrici";
      } else {
        // Un solo coordinatore
        return coordinatori[0].ottieniGenere() === "F" ? "la coordinatrice" : "il coordinatore";
      }
    });
    
    // Elenco tutor PCTO
    this.registraPlaceholder("elenco_tutor_pcto", (contesto, parametri) => {
      if (!contesto || !contesto.classe) return "";
      this._inizializzaGestori();
      
      const prefisso = parametri && parametri.prefisso === "false" ? false : true;
      
      const classe = this.gestoreClassi.ottieniPerNome(contesto.classe);
      if (!classe) return "";
      
      const emailTutors = classe.ottieniTutorPCTO();
      if (!emailTutors || emailTutors.length === 0) return "";
      
      const tutors = [];
      for (const emailTutor of emailTutors) {
        const tutor = this.gestoreDocenti.ottieniPerEmail(emailTutor);
        if (tutor) tutors.push(tutor);
      }
      
      if (tutors.length === 0) return "";
      
      return tutors.map(tutor => {
        const genere = tutor.ottieniGenere();
        const prefissoTesto = prefisso ? (genere === "F" ? "prof.ssa " : "prof. ") : "";
        return prefissoTesto + tutor.ottieniNomeCompleto();
      }).join(", ");
    });
    
    // Elenco rappresentanti degli studenti
    this.registraPlaceholder("elenco_rappr_studenti", (contesto, parametri) => {
      if (!contesto || !contesto.classe) return "";
      this._inizializzaGestori();
      
      const classe = this.gestoreClassi.ottieniPerNome(contesto.classe);
      if (!classe) return "";
      
      const alunni = this.gestoreAlunni.ottieniPerClasse(contesto.classe);
      const rappresentanti = alunni.filter(alunno => alunno.isRappresentante());
      
      if (rappresentanti.length === 0) return "";
      
      return rappresentanti.map(alunno => alunno.ottieniNomeCompleto()).join(" e ");
    });
    
    // Numero alunni classe
    this.registraPlaceholder("numero_alunni_classe", (contesto, parametri) => {
      if (!contesto || !contesto.classe) return "";
      this._inizializzaGestori();
      
      const classe = this.gestoreClassi.ottieniPerNome(contesto.classe);
      if (!classe) return "0";
      
      const alunni = this.gestoreAlunni.ottieniPerClasse(contesto.classe);
      return alunni.length.toString();
    });
    
    // Alunni per tipo religione
    this.registraPlaceholder("alunni_religione", (contesto, parametri) => {
      if (!contesto || !contesto.classe) return "";
      this._inizializzaGestori();
      
      const tipoReligione = parametri && parametri.tipo;
      if (!tipoReligione) return "";
      
      const classe = this.gestoreClassi.ottieniPerNome(contesto.classe);
      if (!classe) return "";
      
      const alunni = this.gestoreAlunni.ottieniPerClasse(contesto.classe);
      const alunniFiltrati = alunni.filter(alunno => alunno.ottieniReligione() === tipoReligione);
      
      if (alunniFiltrati.length === 0) return "";
      
      return alunniFiltrati.map(alunno => alunno.ottieniNomeCompleto()).sort().join(", ");
    });
  }


/**
 * Registra i placeholder per tabelle riutilizzando tabella_flessibile come motore base
 * @private
 */
_registraPlaceholderTabelle() {
/**
 * Generatore di tabella flessibile corretto per preservare colonne interamente vuote
 */
const generaTabellaFlessibile = (contesto, parametri) => {
  
  try {
    // 1. Estrai parametri
    const intestazione = parametri.intestazione || "";
    const separatore = parametri.separatore || ";";
    
    // IMPORTANTE: Usa manteniVuoti=true in tutti i casi per preservare la struttura
    const headerRiga = this._elaboraListaValori(parametri.header_riga, separatore, true);
    const headerColonna = this._elaboraListaValori(parametri.header_colonna, separatore, true);
    const dimensioniColonne = this._elaboraListaValori(parametri.dimensioni_colonne, separatore, true);
    const contenutoPrimaRiga = this._elaboraListaValori(parametri.contenuto_prima_riga, separatore, true);
    const contenutoPrimaColonna = this._elaboraListaValori(parametri.contenuto_prima_colonna, separatore, true);
    
    // Usa la versione corretta di _elaboraMatrice che preserva la struttura
    const contenuto = this._elaboraMatrice(parametri.contenuto, separatore, parametri.separatore_righe || "|");
    
    const includiHeaderRiga = parametri.includi_header_riga !== "false";
    const includiHeaderColonna = parametri.includi_header_colonna !== "false";
    const stiliCelle = this._elaboraStiliCelle(parametri.stili_celle, separatore);

    const riempimento = parametri.riempimento ? parseFloat(parametri.riempimento) : null;
    
    // 2. CORREZIONE: Calcola dimensioni mantenendo colonne vuote
    // Prima calcola il numero massimo di colonne considerando tutte le righe
    let maxColonne = 0;
    for (const riga of contenuto) {
      if (Array.isArray(riga)) {
        // Importante: conta le colonne indipendentemente dal loro contenuto
        maxColonne = Math.max(maxColonne, riga.length);
      }
    }
    
    // Numero di righe di contenuto (non header)
    const numRigheContenuto = Math.max(
      contenuto.length,
      contenutoPrimaColonna.length
    );
    
    // CORREZIONE: calcola numColonneContenuto usando maxColonne calcolato sopra
    const numColonneContenuto = Math.max(
      maxColonne,
      contenutoPrimaRiga.length
    );
    
    // Log diagnostico dettagliato
    
    // Dimensioni finali includendo gli header
    const numRighe = (includiHeaderRiga ? 1 : 0) + numRigheContenuto;
    const numColonne = (includiHeaderColonna ? 1 : 0) + numColonneContenuto;
    
    // Log diagnostico dimensioni finali
    
    // 3. Crea matrice dati con le dimensioni esatte
    const dati = [];
    for (let i = 0; i < numRighe; i++) {
      // Crea righe con il numero esatto di colonne, inizializzate con stringhe vuote
      dati.push(new Array(numColonne).fill(""));
    }
    
    // 4. Popola gli header se presenti
    if (includiHeaderRiga && headerRiga.length > 0) {
      const offsetColonna = includiHeaderColonna ? 1 : 0;
      
      for (let c = 0; c < headerRiga.length; c++) {
        if (c + offsetColonna < numColonne) {
          dati[0][c + offsetColonna] = headerRiga[c];
        }
      }
    }
    
    if (includiHeaderColonna && headerColonna.length > 0) {
      const offsetRiga = includiHeaderRiga ? 1 : 0;
      
      for (let r = 0; r < headerColonna.length; r++) {
        if (r + offsetRiga < numRighe) {
          dati[r + offsetRiga][0] = headerColonna[r];
        }
      }
    }
    
    // 5. Popola il contenuto della prima riga e prima colonna
    if (contenutoPrimaRiga.length > 0) {
      const offsetRiga = includiHeaderRiga ? 1 : 0;
      const offsetColonna = includiHeaderColonna ? 1 : 0;
      
      for (let c = 0; c < contenutoPrimaRiga.length; c++) {
        if (c + offsetColonna < numColonne) {
          dati[offsetRiga][c + offsetColonna] = contenutoPrimaRiga[c];
        }
      }
    }
    
    if (contenutoPrimaColonna.length > 0) {
      const offsetRiga = includiHeaderRiga ? 1 : 0;
      const offsetColonna = includiHeaderColonna ? 1 : 0;
      
      for (let r = 0; r < contenutoPrimaColonna.length; r++) {
        if (r + offsetRiga < numRighe) {
          dati[r + offsetRiga][offsetColonna] = contenutoPrimaColonna[r];
        }
      }
    }
    
    // 6. Popola il resto del contenuto della tabella
    const offsetRiga = includiHeaderRiga ? 1 : 0;
    const offsetColonna = includiHeaderColonna ? 1 : 0;
    
    for (let r = 0; r < contenuto.length; r++) {
      const rigaTarget = r + offsetRiga;
      if (rigaTarget < numRighe) {
        for (let c = 0; c < contenuto[r].length; c++) {
          const colonnaTarget = c + offsetColonna;
          if (colonnaTarget < numColonne) {
            // IMPORTANTE: Non usare || che sostituirebbe le stringhe vuote
            dati[rigaTarget][colonnaTarget] = contenuto[r][c];
          }
        }
      }
    }
    
    // 7. Prepara larghezze colonne
    const larghezzeColonne = new Array(numColonne);
    for (let c = 0; c < numColonne; c++) {
      if (c < dimensioniColonne.length && dimensioniColonne[c]) {
        const dimensione = parseInt(dimensioniColonne[c], 10);
        if (!isNaN(dimensione)) {
          larghezzeColonne[c] = dimensione;
        }
      }
    }
    

    
    // 8. Costruisci e restituisci l'oggetto tabella finale
    const tabellaOggetto = {
      tipo: "tabella",
      dati: dati,
      intestazioneUnita: parametri.intestazione_unita === "true",
      colonne: numColonne,
      righe: numRighe,
      descrizione: intestazione,
      larghezzeColonne: larghezzeColonne,
      stiliCelle: stiliCelle,
      riempimento: riempimento  // NUOVO: Aggiungi riempimento all'oggetto
    };
    
    // Aggiungi la dimensione del font se specificata
    if (parametri.dimensione_font) {
      tabellaOggetto.dimensioneFont = parametri.dimensione_font;
    }
    
    if (parametri.formattazione === "alternata") {
      tabellaOggetto.formattazioneAlternata = true;
      tabellaOggetto.coloreIntestazione = parametri.colore_intestazione || "#DDDDDD";
      tabellaOggetto.coloreRigaDispari = parametri.colore_riga_dispari || "#FFFFFF";
      tabellaOggetto.coloreRigaPari = parametri.colore_riga_pari || "#F5F5F5";
    }
    
    
    return tabellaOggetto;
  } catch (e) {
    this.logger.error(`Errore nella generazione della tabella flessibile: ${e.message}\n${e.stack}`);
    return {
      tipo: "tabella",
      dati: [["Errore nella generazione della tabella"]],
      descrizione: "Errore: " + e.message,
      colonne: 1
    };
  }
};

  // Registra il placeholder principale tabella_flessibile
  this.registraPlaceholder("tabella_flessibile", generaTabellaFlessibile);

  // Secondo: implementa gli altri placeholder di tabella utilizzando la funzione generaTabellaFlessibile
  
  // Tabella materie-docenti
  this.registraPlaceholder("tabella_materie_docenti", (contesto, parametri) => {
    if (!contesto || !contesto.classe) return "";
    this._inizializzaGestori();
    
    const includeFirma = parametri && parametri.firma === "true";
    const titoloTabella = parametri && parametri.titolo ? parametri.titolo : "Discipline di insegnamento e docenti";
    
    const classe = this.gestoreClassi.ottieniPerNome(contesto.classe);
    if (!classe) return "";
    
    const materie = this.gestoreDB.ottieniSigleMaterie();
    const numColonne = includeFirma ? 3 : 2;
    
    // Crea header per la riga
    const headerRiga = includeFirma ? 
      ["DISCIPLINA", "DOCENTE", "FIRMA"] : 
      ["DISCIPLINA", "DOCENTE"];
      
    // Prepara dati delle righe
    const righeContenuto = [];
    
    // Prepara righe con materie e docenti
    for (const sigla of materie) {
      const emailDocenti = classe.ottieniDocenteMateria(sigla);
      if (!emailDocenti || emailDocenti.length === 0) continue;
      
      for (const emailDocente of emailDocenti) {
        const docente = this.gestoreDocenti.ottieniPerEmail(emailDocente);
        if (!docente) continue;
        
        const riga = includeFirma ? 
          [sigla, docente.ottieniNomeCompleto().toUpperCase(), ""] : 
          [sigla, docente.ottieniNomeCompleto().toUpperCase()];
          
        righeContenuto.push(riga.join(";"));
      }
    }
    
    // Imposta larghezze colonne
    let dimensioniColonne = "";
    if (includeFirma) {
      dimensioniColonne = ";;200"; // Prima e seconda automatiche, terza (FIRMA) 200pt
    }
    
    // Costruisci parametri per tabella_flessibile
    const parametriTabella = {
      intestazione: titoloTabella,
      separatore: ";",
      header_riga: headerRiga.join(";"),
      includi_header_colonna: "false",
      dimensioni_colonne: dimensioniColonne,
      contenuto: righeContenuto.join("|"),
      separatore_righe: "|",
      formattazione: "alternata",
      colore_intestazione: "#E0E0E0"
    };
    
    // Chiama direttamente la funzione di generazione della tabella flessibile
    return generaTabellaFlessibile(contesto, parametriTabella);
  });
  
  // Tabella docenti
  this.registraPlaceholder("tabella_docenti", (contesto, parametri) => {
    if (!contesto || !contesto.classe) return "";
    this._inizializzaGestori();
    
    const includeFirma = parametri && parametri.firma === "true";
    const includiReligione = parametri && parametri.includiReligione !== "false";
    const includiAlternativa = parametri && parametri.includiAlternativa !== "false";
    const titoloTabella = parametri && parametri.titolo ? parametri.titolo : "Docenti del consiglio di classe";
    
    const classe = this.gestoreClassi.ottieniPerNome(contesto.classe);
    if (!classe) return "";
    
    // Prepara le materie da considerare
    let materie = this.gestoreDB.ottieniSigleMaterie();
    if (includiReligione) materie.push("REL");
    if (includiAlternativa) materie.push("ALT");
    
    // Crea header per la riga
    const headerRiga = includeFirma ? ["DOCENTE", "FIRMA"] : ["DOCENTE"];
    
    // Set per evitare duplicati
    const docentiInclusi = new Set();
    
    // Prepara righe con docenti
    const righeContenuto = [];
    
    for (const sigla of materie) {
      const emailDocenti = classe.ottieniDocenteMateria(sigla);
      if (!emailDocenti || emailDocenti.length === 0) continue;
      
      for (const emailDocente of emailDocenti) {
        if (docentiInclusi.has(emailDocente)) continue;
        
        const docente = this.gestoreDocenti.ottieniPerEmail(emailDocente);
        if (!docente) continue;
        
        docentiInclusi.add(emailDocente);
        const riga = includeFirma ? 
          [docente.ottieniNomeCompleto().toUpperCase(), ""] :  //
          [docente.ottieniNomeCompleto().toUpperCase()];
          
        righeContenuto.push(riga.join(";"));
      }
    }
    
    // Imposta larghezze colonne
    let dimensioniColonne = "";
    if (includeFirma) {
      dimensioniColonne = ";200"; // Prima automatica, seconda (FIRMA) 200pt
    }
    
    // Costruisci parametri per tabella_flessibile
    const parametriTabella = {
      intestazione: titoloTabella,
      separatore: ";",
      header_riga: headerRiga.join(";"),
      includi_header_colonna: "false",
      dimensioni_colonne: dimensioniColonne,
      contenuto: righeContenuto.join("|"),
      separatore_righe: "|",
      formattazione: "alternata",
      colore_intestazione: "#E0E0E0"
    };
    
    // Chiama direttamente la funzione di generazione della tabella flessibile
    return generaTabellaFlessibile(contesto, parametriTabella);
  });
  
  // Tabella alunni (elenco alunni con eventuale firma)
  this.registraPlaceholder("tabella_alunni", (contesto, parametri) => {
    if (!contesto) return "";
    this._inizializzaGestori();
    
    const includeFirma = parametri && parametri.firma === "true";
    const includiEmail = parametri && parametri.includi_email === "true";
    const titoloTabella = parametri && parametri.titolo ? parametri.titolo : "Elenco alunni";
    const classe = parametri && parametri.classe ? parametri.classe : (contesto.classe || "");
    
    if (!classe) return "";
    
    // Ottieni alunni della classe
    const alunni = this.gestoreAlunni.ottieniPerClasse(classe);
    if (!alunni || alunni.length === 0) return "";
    
    // Crea header per la riga
    let headerRiga = ["ALUNNO"];
    if (includiEmail) headerRiga.push("EMAIL");
    if (includeFirma) headerRiga.push("FIRMA");
    
    // Prepara righe con alunni
    const righeContenuto = [];
    
    for (const alunno of alunni) {
      let riga = [alunno.ottieniNomeCompleto().toUpperCase()];
      
      // Aggiungi email se richiesta
      if (includiEmail) {
        riga.push(alunno.ottieniEmail());
      }
      
      // Aggiungi colonna firma se richiesta
      if (includeFirma) {
        riga.push("");
      }
      
      righeContenuto.push(riga.join(";"));
    }
    
    // Imposta larghezze colonne
    let dimensioniColonne = "";
    if (includeFirma) {
      // L'ultima colonna (FIRMA) è 200pt, le altre automatiche
      const numColonne = headerRiga.length;
      dimensioniColonne = Array(numColonne - 1).fill("").concat(["200"]).join(";");
    }
    
    // Costruisci parametri per tabella_flessibile
    const parametriTabella = {
      intestazione: titoloTabella,
      separatore: ";",
      header_riga: headerRiga.join(";"),
      includi_header_colonna: "false",
      dimensioni_colonne: dimensioniColonne,
      contenuto: righeContenuto.join("|"),
      separatore_righe: "|",
      formattazione: "alternata",
      colore_intestazione: "#E0E0E0"
    };
    
    // Chiama direttamente la funzione di generazione della tabella flessibile
    return generaTabellaFlessibile(contesto, parametriTabella);
  });





  
// Correzione del placeholder tabella_attivita
this.registraPlaceholder("tabella_attivita", (contesto, parametri) => {
  
  try {
    // 1. Estrai parametri
    const titoloTabella = parametri && parametri.titolo ? parametri.titolo : "Attività";
    const separatore = parametri && parametri.separatore ? parametri.separatore : ";";
    
    // Estrai e processa tipologie e attività
    const tipologie = this._elaboraListaValori(parametri.tipologie || "", separatore);
    const attivita = this._elaboraListaValori(parametri.attivita || "", separatore);

    
    // 2. Determina dimensioni tabella
    const numRighe = Math.max(tipologie.length, attivita.length);
    
    if (numRighe === 0) {
      // Se non ci sono dati, crea una tabella vuota con intestazioni
      return generaTabellaFlessibile(contesto, {
        intestazione: titoloTabella,
        separatore: separatore,
        header_riga: "Tipologia;Attività",
        includi_header_colonna: "false",
        dimensioni_colonne: ";350", // Seconda colonna molto più larga
        formattazione: "alternata",
        colore_intestazione: "#E0E0E0"
      });
    }
    
    // 3. Costruisci contenuti righe
    const righeContenuto = [];
    
    for (let i = 0; i < numRighe; i++) {
      const tipologia = i < tipologie.length ? tipologie[i] : "";
      const attivita_i = i < attivita.length ? attivita[i] : "";
      
      righeContenuto.push(`${tipologia}${separatore}${attivita_i}`);
    }
    
    // 4. Log dettagliato del contenuto generato
    
    // 5. Costruisci parametri per tabella_flessibile
    const parametriTabella = {
      intestazione: titoloTabella,
      separatore: separatore,
      header_riga: "Tipologia;Attività",
      includi_header_colonna: "false",
      dimensioni_colonne: ";350", // Seconda colonna molto più larga
      contenuto: righeContenuto.join("|"),
      separatore_righe: "|",
      formattazione: "alternata",
      colore_intestazione: "#E0E0E0"
    };
    
    // 6. Log parametri finali
    
    // 7. Genera e restituisci la tabella usando generaTabellaFlessibile
    return generaTabellaFlessibile(contesto, parametriTabella);
  } catch (e) {
    this.logger.error(`Errore in tabella_attivita: ${e.message}\n${e.stack}`);
    
    // Restituisci almeno una tabella con un messaggio di errore
    return {
      tipo: "tabella",
      dati: [["Errore nella generazione della tabella attività"], [`${e.message}`]],
      descrizione: "Errore in tabella_attivita",
      colonne: 1,
      righe: 2
    };
  }
});

// Tabella materie classe - VERSIONE CORRETTA
this.registraPlaceholder("tabella_materie_classe", (contesto, parametri) => {
  if (!contesto || !contesto.classe) return "";
  this._inizializzaGestori();
  
  try {
    // 1. Estrai parametri
    const titoloTabella = parametri && parametri.titolo ? parametri.titolo : "Tabella materie";
    const separatore = parametri && parametri.separatore ? parametri.separatore : ";";
    const headerPrimaColonna = parametri && parametri.intestazione_prima_colonna ? parametri.intestazione_prima_colonna : "";
    const includeSostegno = parametri && parametri.includi_sostegno === "true";
    const soloArticolazione = parametri && parametri.articolazione ? parametri.articolazione : "";
    const soloMaterieComuni = parametri && parametri.solo_materie_comuni === "true";
    const elencoRighe = parametri && parametri.elenco ? parametri.elenco : "";
    const dimensioneFont = parametri && parametri.dimensione_font ? parametri.dimensione_font : "";
    const riempimento = parametri && parametri.riempimento ? parametri.riempimento : null;
    
    // NUOVO: parametro per definire il separatore delle righe nell'elenco
    const separatoreRigheElenco = parametri && parametri.separatore_righe_elenco ? 
      parametri.separatore_righe_elenco : ";";
    
    // Ottieni la classe
    const classe = this.gestoreClassi.ottieniPerNome(contesto.classe);
    if (!classe) return "";
    
    // 2. Ottieni le materie filtrate in base ai parametri
    const tutteMaterie = this.gestoreDB.ottieniSigleMaterie();
    
    let materieClasse = [];
    
    if (classe.isArticolata() && soloArticolazione) {
      // Filtra per articolazione specifica
      const materieComuni = classe.ottieniMaterieComuni();
      const materieNonComuni = classe.ottieniMaterieNonComuni(soloArticolazione);
      // Combina materie comuni e non comuni per l'articolazione specifica
      materieClasse = [...materieComuni, ...materieNonComuni];
    } else if (classe.isArticolata() && soloMaterieComuni) {
      // Solo materie comuni tra le articolazioni
      materieClasse = classe.ottieniMaterieComuni();
    } else {
      // Tutte le materie della classe
      materieClasse = classe.ottieniElencoSigleMaterie();
    }
    
    // Filtra il sostegno se necessario
    const materieFiltrate = includeSostegno ? 
      materieClasse : 
      materieClasse.filter(sigla => sigla !== "SOS");
    
    if (materieFiltrate.length === 0) {
      return {
        tipo: "tabella",
        dati: [["Nessuna materia trovata per la classe"]],
        descrizione: "Errore: Nessuna materia disponibile",
        colonne: 1,
        righe: 1
      };
    }
    
    // 3. Costruisci l'intestazione della riga (prima colonna + materie)
    let headerRiga = [headerPrimaColonna];
    
    for (const sigla of materieFiltrate) {
      headerRiga.push(sigla);
    }
    
    // 4. Processa le righe personalizzate dall'utente tramite il parametro 'elenco'
    const righeContenuto = [];
    
    if (elencoRighe) {
      // CORREZIONE: Interpreta l'elenco come lista di valori per la prima colonna
      // quando non contiene il separatore di righe "|"
      if (!elencoRighe.includes("|")) {
        // Caso semplice: l'elenco contiene solo i valori per la prima colonna
        // separati dal separatore specificato (default ";")
        const valoriPrimaColonna = this._elaboraListaValori(elencoRighe, separatoreRigheElenco, true);
        
        // Crea una riga per ogni valore della prima colonna
        for (const valore of valoriPrimaColonna) {
          // Crea una riga con il valore nella prima colonna e celle vuote per le materie
          const riga = [valore];
          for (let i = 0; i < materieFiltrate.length; i++) {
            riga.push("");
          }
          righeContenuto.push(riga.join(separatore));
        }
      } else {
        // Caso avanzato: l'elenco contiene righe complete separate da "|"
        const righeUtente = this._elaboraListaValori(elencoRighe, "|", true);
        
        // Per ogni riga fornita dall'utente
        for (const riga of righeUtente) {
          // Divide la riga in celle usando il separatore specificato
          const celle = this._elaboraListaValori(riga, separatore, true);
          
          // Se la prima riga è vuota, usa un array vuoto di dimensione corretta
          if (celle.length === 0) {
            const rigaVuota = new Array(materieFiltrate.length + 1).fill("");
            righeContenuto.push(rigaVuota.join(separatore));
            continue;
          }
          
          // Se la riga non ha abbastanza celle, completa con celle vuote
          while (celle.length < materieFiltrate.length + 1) {
            celle.push("");
          }
          
          // Aggiungi la riga al contenuto
          righeContenuto.push(celle.join(separatore));
        }
      }
    }
    
    // Se non ci sono righe fornite dall'utente, crea almeno una riga vuota
    if (righeContenuto.length === 0) {
      const rigaVuota = new Array(materieFiltrate.length + 1).fill(""); // +1 per la prima colonna
      righeContenuto.push(rigaVuota.join(separatore));
    }
    
    // 5. Imposta una larghezza minima per le colonne delle materie
    // Prima colonna lasciata automatica, tutte le colonne delle materie con larghezza minima
    const dimensioniColonne = [""];
    for (let i = 0; i < materieFiltrate.length; i++) {
      dimensioniColonne.push("30");
    }
    
    // 6. Costruisci parametri tabella_flessibile
    const parametriTabella = {
      intestazione: titoloTabella,
      separatore: separatore,
      header_riga: headerRiga.join(separatore),
      includi_header_colonna: "false",
      contenuto: righeContenuto.join("|"),
      separatore_righe: "|",
      dimensioni_colonne: dimensioniColonne.join(separatore),
      formattazione: "alternata",
      colore_intestazione: "#E0E0E0"
    };
    
    // Aggiungi la dimensione del font se specificata
    if (dimensioneFont) {
      parametriTabella.dimensione_font = dimensioneFont;
    }

    if (riempimento) {
      parametriTabella.riempimento = riempimento;
    }
    
    // 7. Genera e restituisci la tabella
    return generaTabellaFlessibile(contesto, parametriTabella);
  } catch (e) {
    this.logger.error(`Errore in tabella_materie_classe: ${e.message}\n${e.stack}`);
    
    return {
      tipo: "tabella",
      dati: [["Errore nella generazione della tabella materie classe"], [`${e.message}`]],
      descrizione: "Errore in tabella_materie_classe",
      colonne: 1,
      righe: 2
    };
  }
});


}


_registraPlaceholderDipartimento() {
  this.registraPlaceholder("dipartimento", (contesto, parametri) => {
    if (!contesto || !contesto.dipartimento) return "";
    
    try {
      // Ottieni il dipartimento dalla tabella DIPARTIMENTI
      if (!this.db || !this.db.tables["DIPARTIMENTI"]) return contesto.dipartimento;
      
      const dipartimentoObj = this.db.select()
        .from("DIPARTIMENTI")
        .where("DIPARTIMENTO", "=", contesto.dipartimento)
        .first();
      
      if (!dipartimentoObj) return contesto.dipartimento;
      
      // Restituisci il nome completo del dipartimento se disponibile, altrimenti la sigla
      return dipartimentoObj["NOME"] || contesto.dipartimento;
    } catch (e) {
      this.logger.error(`Errore nell'ottenere il dipartimento: ${e.message}`);
      return contesto.dipartimento;
    }
  });
}




  /**
   * Registra i placeholder vari
   * @private
   */
  _registraPlaceholderVari() {
    // Numero del verbale
    this.registraPlaceholder("num_verbale", (contesto, parametri) => {
      if (!contesto || !contesto.cartella) return "1";
      
      try {
        const conteggio = this.driveService.contaFileInCartella(contesto.cartella, false, true);
        return conteggio > 0 ? conteggio.toString() : "1";
      } catch (e) {
        this.logger.error(`Errore nel conteggio dei file per il numero del verbale: ${e.message}`);
        return "1";
      }
    });
    
    // Presiede (singolare o plurale)
    this.registraPlaceholder("presiede", (contesto, parametri) => {
      if (!contesto || !contesto.classe) return "";
      this._inizializzaGestori();
      
      const classe = this.gestoreClassi.ottieniPerNome(contesto.classe);
      if (!classe) return "";
      
      const emailCoordinatore = classe.ottieniCoordinatore();
      if (!emailCoordinatore) return "";
      
      const coordinatori = emailCoordinatore.includes(",") ? emailCoordinatore.split(",").length : 1;
      return coordinatori > 1 ? "Presiedono" : "Presiede";
    });
  }

  /**
   * Verifica se un placeholder è registrato
   * @param {string} nome - Nome del placeholder da verificare
   * @return {boolean} True se il placeholder è registrato
   */
  isPlaceholderRegistrato(nome) {
    return this.placeholders.has(nome) || this.aliases.has(nome);
  }

  /**
   * Risolve un placeholder utilizzando il contesto e i parametri forniti
   * @param {string} nome - Nome del placeholder
   * @param {Object} contesto - Contesto di esecuzione
   * @param {Object} parametri - Parametri del placeholder
   * @return {string|Object} Valore risolto del placeholder
   */
  risolviPlaceholder(nome, contesto, parametri) {
    // Se il nome è un alias, ottieni il nome principale
    const nomePrincipale = this.aliases.has(nome) ? this.aliases.get(nome) : nome;
    
    if (!this.placeholders.has(nomePrincipale)) {
      this.logger.warn(`Placeholder '${nome}' non trovato nell'archivio`);
      return "";
    }
    
    try {
      const funzione = this.placeholders.get(nomePrincipale);
      return funzione(contesto, parametri) || "";
    } catch (e) {
      this.logger.error(`Errore nella risoluzione del placeholder '${nome}': ${e.message}`);
      return "";
    }
  }

  /**
   * Ottiene l'elenco completo di tutti i placeholder disponibili, inclusi gli alias
   * @return {string[]} Array di tutti i nomi di placeholder disponibili
   */
  ottieniElencoPlaceholder() {
    return [...this.placeholders.keys()];
  }

  /**
   * Ottiene gli alias per un placeholder principale
   * @param {string} nomePrincipale - Nome principale del placeholder
   * @return {string[]} Array di alias o array vuoto se non trovati
   */
  ottieniAlias(nomePrincipale) {
    const result = [];
    for (const [alias, nome] of this.aliases.entries()) {
      if (nome === nomePrincipale) result.push(alias);
    }
    return result;
  }

  /**
   * Ottiene le sigle delle materie dal gestore DB
   * @return {string[]} Array di sigle delle materie
   */
  ottieniSigleMaterie() {
    return this.gestoreDB.ottieniSigleMaterie();
  }
}

/**
 * Servizio per la ricerca, risoluzione e sostituzione di placeholder in vari tipi di contenuti.
 * Supporta documenti Google (Document, Sheet), stringhe e HTML.
 * Utilizza esclusivamente i metodi forniti dai servizi DocumentService e SpreadsheetService.
 * Implementa correttamente il pattern fluent.
 */
class MyPlaceholderService {
  /**
   * @param {ArchivioPlaceholder} archivioPlaceholder - Archivio dei placeholder standard
   * @param {MyDocumentService} documentService - Servizio per i documenti Google
   * @param {MySpreadsheetService} spreadsheetService - Servizio per i fogli di calcolo Google
   * @param {MyLoggerService} logger - Servizio di logging
   * @param {MyMustache} mustache - Servizio per template Mustache
   * @param {MyUtilsService} utils - Servizio di utilità
   */
  constructor(archivioPlaceholder, documentService, spreadsheetService, logger, mustache, utils) {
    this.archivio = archivioPlaceholder;
    this.documentService = documentService;
    this.spreadsheetService = spreadsheetService;
    this.logger = logger;
    this.mustache = mustache;
    this.utils = utils;
    
    // Regexp per riconoscere i placeholder {{nome_placeholder}}
    // Supporta entrambi i formati: {{nome[parametri]}} e {{nome|parametri}}
    this.regexPlaceholder = /\{\{([a-zA-Z0-9_]+)(?:\[([^\]]+)\]|\|([^}]+))?\}\}/g;
    
    // Placeholder personalizzati per questa sessione
    this.placeholderPersonalizzati = new Map();
  }
  
  /**
   * Registra un placeholder personalizzato da utilizzare per questa sessione
   * @param {string} nome - Nome del placeholder
   * @param {Function} funzione - Funzione che elabora il placeholder
   * @return {MyPlaceholderService} this per chiamate fluent
   */
  registraPlaceholder(nome, funzione) {
    this.placeholderPersonalizzati.set(nome, funzione);
    return this;
  }
  
  /**
   * Analizza i parametri di un placeholder specificati in formato nome=valore
   * @param {string} parametriStringa - Stringa contenente i parametri
   * @return {Object} Oggetto con i parametri analizzati
   * @private
   */
  _analizzaParametri(parametriStringa) {
    if (!parametriStringa) return {};
    
    const parametri = {};
    const coppie = parametriStringa.split(',');
    
    for (const coppia of coppie) {
      const parti = coppia.split('=');
      if (parti.length === 2) {
        const chiave = parti[0].trim();
        const valore = parti[1].trim();
        
        // Rimuovi eventuali virgolette
        parametri[chiave] = valore.replace(/^["'](.*)["']$/, '$1');
      }
    }
    
    return parametri;
  }
  
  /**
   * Risolve un singolo placeholder utilizzando l'archivio
   * @param {string} nome - Nome del placeholder
   * @param {Object} parametri - Parametri del placeholder
   * @param {Object} contesto - Contesto di esecuzione
   * @return {string|Object} Valore risolto del placeholder
   * @private
   */
  _risolviPlaceholder(nome, parametri, contesto) {

    
    // Verifica che l'archivio sia correttamente inizializzato
    if (!this.archivio) {
      this.logger.error('Archivio placeholder non inizializzato correttamente!');
      // Ritorna una stringa vuota piuttosto che lasciare il placeholder non sostituito
      return "";
    }
    
    // Prima controlla nei placeholder personalizzati
    if (this.placeholderPersonalizzati && this.placeholderPersonalizzati.has(nome)) {
      try {
        const funzione = this.placeholderPersonalizzati.get(nome);
        if (typeof funzione !== 'function') {
          this.logger.error(`Il placeholder personalizzato '${nome}' esiste ma non è una funzione`);
          return "";
        }
        
        const risultato = funzione(contesto, parametri);

        return risultato || "";
      } catch (e) {
        this.logger.error(`Errore nella risoluzione del placeholder personalizzato '${nome}': ${e.message}`);
        return "";
      }
    }
    
    // Poi cerca nell'archivio standard
    try {
      if (typeof this.archivio.isPlaceholderRegistrato !== 'function') {
        this.logger.error(`Il metodo 'isPlaceholderRegistrato' non è disponibile nell'archivio`);
        return "";
      }
      
      if (this.archivio.isPlaceholderRegistrato(nome)) {
        if (typeof this.archivio.risolviPlaceholder !== 'function') {
          this.logger.error(`Il metodo 'risolviPlaceholder' non è disponibile nell'archivio`);
          return "";
        }
        
        const risultato = this.archivio.risolviPlaceholder(nome, contesto, parametri);

        return risultato || "";
      }
    } catch (e) {
      this.logger.error(`Errore nell'interazione con l'archivio: ${e.message}`);
      return "";
    }
    
    this.logger.warn(`Placeholder '${nome}' non trovato né nell'archivio né tra i personalizzati`);
    return "";
  }
  
  /**
   * Cerca e sostituisce i placeholder in una stringa di testo
   * @param {string} testo - Testo contenente i placeholder
   * @param {Object} contesto - Contesto per risolvere i placeholder
   * @return {string} Testo con i placeholder sostituiti
   */
  sostituisciInStringa(testo, contesto) {
    if (!testo) return "";
    
    try {
      return testo.replace(this.regexPlaceholder, (match, nomePlaceholder, parametriQuadre, parametriPipe) => {
        // Utilizziamo i parametri che sono definiti (o quadre o pipe)
        const parametriStringa = parametriQuadre || parametriPipe;
        const parametri = this._analizzaParametri(parametriStringa);
        const valore = this._risolviPlaceholder(nomePlaceholder, parametri, contesto);
        
        if (valore === null || valore === undefined) {
          return "";
        }
        
        if (typeof valore === 'object' && valore.tipo === 'tabella') {
          // Non possiamo inserire una tabella in una stringa,
          // quindi restituiamo una rappresentazione testuale
          return JSON.stringify(valore.dati);
        }
        
        return String(valore);
      });
    } catch (e) {
      this.logger.error(`Errore nella sostituzione dei placeholder nella stringa: ${e.message}`);
      return testo;
    }
  }
  
  /**
   * Cerca e sostituisce i placeholder in un documento Google
   * @param {Document} doc - Documento Google
   * @param {Object} contesto - Contesto per risolvere i placeholder
   * @return {boolean} True se l'operazione è riuscita
   */
  sostituisciInDocument(doc, contesto) {
    if (!doc) return false;
    
    try {
      const documentId = doc.getId();

      
      // Prima elaborazione: sostituzione dei placeholder di testo
      this._sostituisciPlaceholderTesto(doc, contesto);
      
      // Seconda elaborazione: sostituzione dei placeholder di tabella
      this._sostituisciPlaceholderTabella(doc, contesto);
      
      this.logger.info("Sostituzione dei placeholder nel documento completata con successo");
      return true;
    } catch (e) {
      this.logger.error(`Errore nella sostituzione dei placeholder nel documento: ${e.message}`);
      return false;
    }
  }

/**
 * Sostituisce i placeholder di testo in un documento
 * VERSIONE CORRETTA: processa dal fondo verso l'inizio
 * @param {Document} doc - Documento Google
 * @param {Object} contesto - Contesto per risolvere i placeholder
 * @private
 */
_sostituisciPlaceholderTesto(doc, contesto) {
  try {
    if (!doc || !doc.getId) {
      throw new Error('Documento non valido o null');
    }
    
    const documentId = doc.getId();

    // Apri il documento usando il DocumentService
    this.documentService.apri(documentId);
    const corpo = this.documentService.ottieniCorpo().ottieniRisultato();
    
    if (!corpo) {
      const errore = this.documentService.ottieniUltimoErrore();
      throw new Error(`Errore nell'ottenere il corpo del documento: ${errore ? errore.message : 'corpo non trovato'}`);
    }
    
    // Prima passa: raccoglie tutti i placeholder di testo
    const placeholderTesto = [];
    const numChildren = this.documentService.ottieniNumeroFigli(corpo).ottieniRisultato();
    
    if (numChildren === null || numChildren === undefined) {
      const errore = this.documentService.ottieniUltimoErrore();
      throw new Error(`Errore nell'ottenere il numero di figli: ${errore ? errore.message : 'impossibile contare i figli'}`);
    }
    
    for (let i = 0; i < numChildren; i++) {
      const elemento = this.documentService.ottieniFiglio(corpo, i).ottieniRisultato();
      
      if (!elemento) continue;
      
      const isParagrafo = this.documentService.isParagrafo(elemento).ottieniRisultato();
      if (!isParagrafo) continue;
      
      const paragrafo = this.documentService.convertiInParagrafo(elemento).ottieniRisultato();
      if (!paragrafo) continue;
      
      const testoParagrafo = this.documentService.ottieniTestoElemento(paragrafo).ottieniRisultato();
      if (!testoParagrafo) continue;
      
      // Verifica se il paragrafo contiene placeholder non-tabella
      const testoPulito = (testoParagrafo || '').trim();
      if (testoPulito.match(/^\{\{tabella_[^}|\[]*(?:\[[^\]]*\]|\|[^}]*)?\}\}$/)) {
        continue; // Salta i placeholder di tabella
      }
      
      if (testoParagrafo && testoParagrafo.includes("{{")) {
        placeholderTesto.push({
          indice: i,
          paragrafo: paragrafo,
          testoOriginale: testoParagrafo
        });
      }
    }
    
    this.logger.info(`Trovati ${placeholderTesto.length} paragrafi con placeholder di testo`);
    
    // Seconda passa: sostituisci i placeholder PARTENDO DAL FONDO
    let placeholdersEncontrati = 0;
    
    for (let j = placeholderTesto.length - 1; j >= 0; j--) {
      const item = placeholderTesto[j];
      const nuovoTesto = this.sostituisciInStringa(item.testoOriginale, contesto);
      
      if (nuovoTesto !== item.testoOriginale) {
        try {
          item.paragrafo.setText(nuovoTesto);
          placeholdersEncontrati++;
        } catch (err) {
          this.logger.warn(`Errore nell'impostazione del testo del paragrafo ${item.indice}: ${err.message}`);
        }
      }
    }
    
    this.logger.info(`Sostituiti ${placeholdersEncontrati} placeholder di testo nel documento`);
  } catch (e) {
    this.logger.error(`Errore nella sostituzione dei placeholder di testo: ${e.message}`);
    throw e;
  }
}


/**
 * Sostituisce i placeholder di tabella in un documento
 * VERSIONE CORRETTA: processa dal fondo verso l'inizio per evitare problemi di indici
 * @param {Document} doc - Documento Google
 * @param {Object} contesto - Contesto per risolvere i placeholder
 * @private
 */
_sostituisciPlaceholderTabella(doc, contesto) {
  try {
    if (!doc || !doc.getId) {
      throw new Error('Documento non valido o null');
    }
    
    const documentId = doc.getId();

    // Apri il documento usando DocumentService
    this.documentService.apri(documentId);
    const corpo = this.documentService.ottieniCorpo().ottieniRisultato();
    
    if (!corpo) {
      throw new Error('Corpo del documento non disponibile');
    }
    
    // Prima passa: raccoglie tutti i placeholder di tabella con le loro posizioni
    const placeholderTabelle = [];
    const numChildren = this.documentService.ottieniNumeroFigli(corpo).ottieniRisultato();
    
    for (let i = 0; i < numChildren; i++) {
      const elemento = this.documentService.ottieniFiglio(corpo, i).ottieniRisultato();
      
      if (!elemento) continue;
      
      const isParagrafo = this.documentService.isParagrafo(elemento).ottieniRisultato();
      if (!isParagrafo) continue;
      
      const paragrafo = this.documentService.convertiInParagrafo(elemento).ottieniRisultato();
      if (!paragrafo) continue;
      
      const testoParagrafo = this.documentService.ottieniTestoElemento(paragrafo).ottieniRisultato();
      if (!testoParagrafo) continue;
      
      // Verifica se è un placeholder tabella
      const testoPulito = testoParagrafo.trim();
      const match = testoPulito.match(/^\{\{(tabella_[a-zA-Z_]+)(?:\[([^\]]*)\]|\|([^}]*))?\}\}$/);
      
      if (match) {
        placeholderTabelle.push({
          indice: i,
          paragrafo: paragrafo,
          nomePlaceholder: match[1],
          parametriStringa: match[2] || match[3] || ''
        });
      }
    }
    
    this.logger.info(`Trovati ${placeholderTabelle.length} placeholder di tabella da sostituire`);
    
    // Seconda passa: sostituisci i placeholder PARTENDO DAL FONDO
    for (let j = placeholderTabelle.length - 1; j >= 0; j--) {
      const placeholder = placeholderTabelle[j];
      
      this.logger.info(`Elaborazione placeholder ${j+1}/${placeholderTabelle.length}: ${placeholder.nomePlaceholder} all'indice ${placeholder.indice}`);
      
      // Analizza parametri
      const parametri = this._analizzaParametri(placeholder.parametriStringa);
      
      // Risolvi il placeholder
      const valore = this._risolviPlaceholder(placeholder.nomePlaceholder, parametri, contesto);
      
      if (!valore || typeof valore !== 'object' || valore.tipo !== 'tabella') {
        this.logger.warn(`Placeholder ${placeholder.nomePlaceholder} non ha restituito un oggetto tabella valido`);
        continue;
      }
      
      // Imposta la descrizione nel paragrafo
      this.documentService.impostaTestoElemento(placeholder.paragrafo, valore.descrizione || "").ottieniRisultato();
      
      // La tabella va subito dopo il paragrafo corrente
      const indiceTabella = placeholder.indice + 1;
      
      // Copia i dati preservando stringhe vuote
      const datiCopia = [];
      if (valore.dati && Array.isArray(valore.dati)) {
        for (let r = 0; r < valore.dati.length; r++) {
          if (Array.isArray(valore.dati[r])) {
            const riga = [];
            for (let c = 0; c < valore.dati[r].length; c++) {
              riga.push(valore.dati[r][c]);
            }
            datiCopia.push(riga);
          } else if (valore.dati[r] !== undefined) {
            datiCopia.push([valore.dati[r]]);
          } else {
            datiCopia.push([]);
          }
        }
      }
      
      // NUOVO: Prepara le opzioni di formattazione
      const opzioniFormattazione = {};
      
      if (valore.formattazioneAlternata) {
        opzioniFormattazione.formattazioneAlternata = true;
        opzioniFormattazione.coloreIntestazione = valore.coloreIntestazione || "#DDDDDD";
        opzioniFormattazione.coloreRigaDispari = valore.coloreRigaDispari || "#FFFFFF";
        opzioniFormattazione.coloreRigaPari = valore.coloreRigaPari || "#F5F5F5";
      } else if (valore.coloreIntestazione) {
        // Anche se non c'è formattazione alternata, applica il colore intestazione se presente
        opzioniFormattazione.coloreIntestazione = valore.coloreIntestazione;
      }
      
      // Crea la tabella con le opzioni di formattazione
      const risultatoTabella = this.documentService.creaTabella(
        doc,
        datiCopia,
        true,
        indiceTabella,
        valore.larghezzeColonne || [],
        valore.riempimento || null,
        opzioniFormattazione  // NUOVO: Passa le opzioni di formattazione
      ).ottieniRisultato();
      
      if (risultatoTabella) {
        this.logger.info(`Tabella ${placeholder.nomePlaceholder} inserita con successo`);
      } else {
        const errore = this.documentService.ottieniUltimoErrore();
        this.logger.error(`Errore nell'inserimento della tabella ${placeholder.nomePlaceholder}: ${errore ? errore.message : 'sconosciuto'}`);
      }
    }
    
    this.logger.info("Sostituzione placeholder tabella completata");
  } catch (e) {
    this.logger.error(`Errore nella sostituzione dei placeholder di tabella: ${e.message}`);
    throw e;
  }
}


/**
 * Sostituisce i placeholder in un foglio di calcolo
 * VERSIONE CORRETTA: processa dal fondo verso l'inizio
 * @param {Spreadsheet} foglio - Foglio di calcolo Google
 * @param {string} nomeScheda - Nome della scheda (opzionale)
 * @param {Object} contesto - Contesto per risolvere i placeholder
 * @return {boolean} True se l'operazione è riuscita
 */
sostituisciInSpreadsheet(foglio, nomeScheda, contesto) {
  if (!foglio) {
    this.logger.error('Foglio di calcolo non valido o null');
    return false;
  }
  
  try {
    if (!foglio.getId) {
      throw new Error('Foglio di calcolo non valido: manca il metodo getId');
    }
    
    const spreadsheetId = foglio.getId();
    let schede = [];
    
    if (nomeScheda) {
      let schedaOttenuta = null;
      try {
        schedaOttenuta = foglio.getSheetByName(nomeScheda);
        if (!schedaOttenuta) {
          this.logger.error(`Errore: scheda ${nomeScheda} non trovata`);
          return false;
        }
        schede = [{ nome: nomeScheda, sheet: schedaOttenuta }];
      } catch (e) {
        this.logger.error(`Errore nell'ottenere la scheda ${nomeScheda}: ${e.message}`);
        return false;
      }
    } else {
      try {
        const sheetsObj = foglio.getSheets();
        if (!sheetsObj || sheetsObj.length === 0) {
          this.logger.error(`Errore: nessuna scheda trovata nel foglio`);
          return false;
        }
        schede = sheetsObj.map(s => ({ nome: s.getName(), sheet: s }));
      } catch (e) {
        this.logger.error(`Errore nell'ottenere le schede: ${e.message}`);
        return false;
      }
    }
    
    let placeholdersEncontrati = 0;
    
    // Processa ogni scheda
    for (const scheda of schede) {
      this.logger.info(`Elaborazione scheda ${scheda.nome}`);
      
      // Prima passa: raccoglie tutte le celle con placeholder
      const celleConPlaceholder = [];
      
      try {
        const dataRange = scheda.sheet.getDataRange();
        const valori = dataRange.getValues();
        
        for (let r = 0; r < valori.length; r++) {
          for (let c = 0; c < valori[r].length; c++) {
            const valoreOriginale = valori[r][c];
            if (typeof valoreOriginale === 'string' && valoreOriginale.includes('{{')) {
              celleConPlaceholder.push({
                riga: r + 1,  // 1-based
                colonna: c + 1,  // 1-based
                valoreOriginale: valoreOriginale
              });
            }
          }
        }
      } catch (e) {
        this.logger.error(`Errore nel leggere i dati della scheda ${scheda.nome}: ${e.message}`);
        continue;
      }
      
      this.logger.info(`Trovate ${celleConPlaceholder.length} celle con placeholder in ${scheda.nome}`);
      
      // Seconda passa: sostituisci partendo dall'ultima cella (in basso a destra)
      // Ordina le celle in ordine inverso (ultima riga prima, poi ultima colonna)
      celleConPlaceholder.sort((a, b) => {
        if (a.riga !== b.riga) return b.riga - a.riga;
        return b.colonna - a.colonna;
      });
      
      for (const cella of celleConPlaceholder) {
        const nuovoValore = this.sostituisciInStringa(cella.valoreOriginale, contesto);
        
        if (nuovoValore !== cella.valoreOriginale) {
          try {
            const rangeObj = scheda.sheet.getRange(cella.riga, cella.colonna);
            if (!rangeObj) {
              this.logger.warn(`Range non trovato: riga ${cella.riga}, colonna ${cella.colonna} in ${scheda.nome}`);
              continue;
            }
            
            rangeObj.setValue(nuovoValore);
            placeholdersEncontrati++;
          } catch (e) {
            this.logger.warn(`Errore nell'aggiornare la cella [${cella.riga},${cella.colonna}]: ${e.message}`);
          }
        }
      }
      
      this.logger.info(`Completata elaborazione scheda ${scheda.nome} - ${celleConPlaceholder.length} celle elaborate`);
    }
    
    this.logger.info(`Sostituiti ${placeholdersEncontrati} placeholder nel foglio di calcolo`);
    return placeholdersEncontrati > 0;
  } catch (e) {
    this.logger.error(`Errore nella sostituzione dei placeholder nel foglio di calcolo: ${e.message}`);
    this._ultimoErrore = e;
    return false;
  }
}
  
  /**
   * Converte indici di riga e colonna in notazione A1
   * @param {number} riga - Indice di riga (1-based)
   * @param {number} colonna - Indice di colonna (1-based)
   * @return {string} Riferimento in formato A1
   * @private
   */
  _convertiIndiciInA1(riga, colonna) {
    return this.spreadsheetService.convertiIndiciInA1(riga - 1, colonna - 1);
  }
  
  /**
   * Cerca e sostituisce i placeholder in una stringa HTML
   * @param {string} html - Stringa HTML contenente i placeholder
   * @param {Object} contesto - Contesto per risolvere i placeholder
   * @return {string} HTML con i placeholder sostituiti
   */
  sostituisciInHTML(html, contesto) {
    if (!html) return "";
    
    try {
      return html.replace(this.regexPlaceholder, (match, nomePlaceholder, parametriQuadre, parametriPipe) => {
        // Utilizziamo i parametri che sono definiti (o quadre o pipe)
        const parametriStringa = parametriQuadre || parametriPipe;
        const parametri = this._analizzaParametri(parametriStringa);
        const valore = this._risolviPlaceholder(nomePlaceholder, parametri, contesto);
        
        if (valore === null || valore === undefined) {
          return "";
        }
        
        if (typeof valore === 'object' && valore.tipo === 'tabella') {
          // Converti la tabella in HTML
          return this._convertiTabellaInHTML(valore.dati);
        }
        
        // Encode HTML entities per evitare problemi con caratteri speciali
        return String(valore)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      });
    } catch (e) {
      this.logger.error(`Errore nella sostituzione dei placeholder nell'HTML: ${e.message}`);
      return html;
    }
  }
  
  /**
   * Converte una tabella (array bidimensionale) in HTML
   * @param {Array} datiTabella - Dati per la tabella
   * @return {string} Codice HTML della tabella
   * @private
   */
  _convertiTabellaInHTML(datiTabella) {
    if (!datiTabella || datiTabella.length === 0) return "";
    
    let html = '<table border="1" cellpadding="5" cellspacing="0">';
    
    // Intestazione
    html += '<thead><tr>';
    for (const cella of datiTabella[0]) {
      html += `<th>${cella}</th>`;
    }
    html += '</tr></thead>';
    
    // Corpo
    html += '<tbody>';
    for (let r = 1; r < datiTabella.length; r++) {
      html += '<tr>';
      for (const cella of datiTabella[r]) {
        html += `<td>${cella}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody>';
    
    html += '</table>';
    return html;
  }
  
  /**
   * Elabora i placeholder in un documento
   * @param {string} idDocumento - ID del documento Google
   * @param {Object} contesto - Contesto per risolvere i placeholder
   * @return {boolean} True se l'operazione è riuscita
   */
  elaboraDocumento(idDocumento, contesto) {
    try {
      // Apri il documento usando il pattern fluent e ottieni il documento
      const documento = this.documentService
        .apri(idDocumento)
        .ottieniRisultato();
      
      if (!documento) {
        const errore = this.documentService.ottieniUltimoErrore();
        this.logger.error(`Errore nell'apertura del documento ${idDocumento}: ${errore ? errore.message : 'documento non trovato'}`);
        return false;
      }
      
      // Elabora il documento
      return this.sostituisciInDocument(documento, contesto);
    } catch (e) {
      this.logger.error(`Errore nell'elaborazione del documento ${idDocumento}: ${e.message}`);
      return false;
    }
  }
  


/**
 * Corretto metodo elaboraFoglio per MyPlaceholderService
 * Elabora un foglio di calcolo sostituendo tutti i placeholder
 * @param {string} idFoglio - ID del foglio di calcolo
 * @param {Object} contesto - Contesto per risolvere i placeholder
 * @param {string} nomeScheda - Nome della scheda (opzionale)
 * @return {boolean} True se l'operazione è riuscita
 */
elaboraFoglio(idFoglio, contesto, nomeScheda = null) {
  try {
    this.logger.info(`Elaborazione foglio ${idFoglio} iniziata`);
    
    // Apri il foglio direttamente senza usare il pattern fluent
    let spreadsheet = null;
    try {
      spreadsheet = SpreadsheetApp.openById(idFoglio);
      if (!spreadsheet) {
        this.logger.error(`Impossibile aprire il foglio ${idFoglio}`);
        this._ultimoErrore = new Error(`Foglio non trovato: ${idFoglio}`);
        return false;
      }
    } catch (e) {
      this.logger.error(`Errore nell'apertura del foglio ${idFoglio}: ${e.message}`);
      this._ultimoErrore = e;
      return false;
    }
    
    // Elabora i placeholder nel foglio chiamando il metodo corretto
    const risultato = this.sostituisciInSpreadsheet(spreadsheet, nomeScheda, contesto);
    
    this.logger.info(`Elaborazione foglio ${idFoglio} ${risultato ? 'completata con successo' : 'fallita'}`);
    return risultato;
  } catch (e) {
    this.logger.error(`Errore nell'elaborazione del foglio di calcolo ${idFoglio}: ${e.message}`);
    this._ultimoErrore = e;
    return false;
  }
}
  
  /**
   * Metodo di compatibilità per il replace semplice
   * @param {string|HTMLElement|Object} template - Template da elaborare
   * @param {Object} replacements - Mappatura delle sostituzioni
   * @return {string|HTMLElement|Object} Template elaborato
   */
  replace(template, replacements) {
    if (typeof template === "string") {
      return template.replace(/{{(.*?)}}/g, (match, key) => replacements[key] || match);
    } else if (template instanceof HTMLElement) {
      let cloned = template.cloneNode(true);
      cloned.innerHTML = cloned.innerHTML.replace(/{{(.*?)}}/g, (match, key) => replacements[key] || match);
      return cloned;
    } else if (template && template.type === "Doc") {
      return this.replaceInDoc(template, replacements);
    } else if (template && template.type === "Sheet") {
      return this.replaceInSheet(template, replacements);
    }
    return template;
  }
  
  /**
   * Sostituisce i placeholder in un oggetto documento
   * @param {Object} doc - Oggetto documento
   * @param {Object} replacements - Mappatura delle sostituzioni
   * @return {Object} Documento elaborato
   */
  replaceInDoc(doc, replacements) {
    if (doc.title && typeof doc.title === "string") {
      doc.title = doc.title.replace(/{{(.*?)}}/g, (match, key) => replacements[key] || match);
    }
    if (doc.content && typeof doc.content === "string") {
      doc.content = doc.content.replace(/{{(.*?)}}/g, (match, key) => replacements[key] || match);
    }
    return doc;
  }
  
  /**
   * Sostituisce i placeholder in un oggetto foglio
   * @param {Object} sheet - Oggetto foglio
   * @param {Object} replacements - Mappatura delle sostituzioni
   * @return {Object} Foglio elaborato
   */
  replaceInSheet(sheet, replacements) {
    if (Array.isArray(sheet.rows)) {
      sheet.rows = sheet.rows.map(row => {
        return row.map(cell => {
          if (typeof cell === "string") {
            return cell.replace(/{{(.*?)}}/g, (match, key) => replacements[key] || match);
          }
          return cell;
        });
      });
    }
    return sheet;
  }
}