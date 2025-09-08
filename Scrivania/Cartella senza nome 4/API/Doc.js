/**
 * Servizio per manipolare documenti Google
 * Usa esclusivamente DocumentApp (senza API avanzate)
 */
class MyDocumentService extends MyGoogleService {
  /**
   * Costruttore del servizio
   * @param {MyLoggerService} logger - Servizio di logging
   * @param {MyCacheService} cache - Servizio di cache
   * @param {MyUtilsService} utils - Servizio di utilità
   */
  constructor(logger, cache, utils) {
    super(logger, cache, utils);
    this._resetStato();
  }
  
  // METODI PRIVATI DI GESTIONE STATO
  _resetStato() {
    this._documentoCorrente = null;
    this._corpoCorrente = null;
    this._tabellaCorrente = null;
    this._elementoCorrente = null;
    this._risultatoUltimaOperazione = null;
    this._ultimoErrore = null;
  }
  
  // GESTIONE ERRORI E RISULTATI
  /**
   * Esegue un'operazione con gestione errori
   * @param {Function} operazione - Funzione da eseguire
   * @param {string} descrizione - Descrizione dell'operazione
   * @return {*} Risultato dell'operazione
   * @private
   */
  _eseguiOperazione(operazione, descrizione = "") {
    try {
      const risultato = operazione();
      this._risultatoUltimaOperazione = risultato;
      this._ultimoErrore = null;
      return risultato;
    } catch (e) {
      this._logger.error(`Errore in ${descrizione}: ${e.message}`);
      this._ultimoErrore = e;
      this._risultatoUltimaOperazione = null;
      return null;
    }
  }
  
  /**
   * Ottiene l'ultimo errore verificatosi
   * @return {Error} Oggetto errore
   */
  ottieniUltimoErrore() { return this._ultimoErrore; }
  
  /**
   * Ottiene il risultato dell'ultima operazione
   * @return {*} Risultato
   */
  ottieniRisultato() { return this._risultatoUltimaOperazione; }
  
  /**
   * Ottiene il documento corrente
   * @return {Document} Documento aperto
   */
  ottieniDocumento() { return this._documentoCorrente; }
  
  // OPERAZIONI DOCUMENTO
  /**
   * Apre un documento per ID
   * @param {string} idDocumento - ID del documento
   * @return {MyDocumentService} this per chiamate fluent
   */
  apri(idDocumento) {
    this._eseguiOperazione(() => {
      this._resetStato();
      this._documentoCorrente = DocumentApp.openById(idDocumento);
      return this._documentoCorrente;
    }, "apertura documento");
    return this;
  }
  
  /**
   * Crea un nuovo documento
   * @param {string} nome - Nome del documento
   * @return {MyDocumentService} this per chiamate fluent
   */
  crea(nome) {
    this._eseguiOperazione(() => {
      this._resetStato();
      this._documentoCorrente = DocumentApp.create(nome);
      return this._documentoCorrente;
    }, "creazione documento");
    return this;
  }
  
  /**
   * Ottiene il corpo del documento
   * @return {MyDocumentService} this per chiamate fluent
   */
  ottieniCorpo() {
    this._eseguiOperazione(() => {
      if (!this._documentoCorrente) {
        throw new Error("Nessun documento aperto");
      }
      this._corpoCorrente = this._documentoCorrente.getBody();
      return this._corpoCorrente;
    }, "ottenimento corpo");
    return this;
  }
  
  // GESTIONE ELEMENTI
  /**
   * Ottiene il numero di figli di un elemento
   * @param {Element} elemento - Elemento padre (default: corpo del documento)
   * @return {MyDocumentService} this per chiamate fluent
   */
  ottieniNumeroFigli(elemento = null) {
    this._eseguiOperazione(() => {
      const el = elemento || this._corpoCorrente;
      if (!el) {
        throw new Error("Elemento non disponibile");
      }
      return el.getNumChildren();
    }, "ottenimento numero figli");
    return this;
  }
  
  /**
   * Ottiene un figlio di un elemento
   * @param {Element} elemento - Elemento padre (default: corpo del documento)
   * @param {number} indice - Indice del figlio
   * @return {MyDocumentService} this per chiamate fluent
   */
  ottieniFiglio(elemento, indice) {
    this._eseguiOperazione(() => {
      const el = elemento || this._corpoCorrente;
      if (!el) {
        throw new Error("Elemento non disponibile");
      }
      return el.getChild(indice);
    }, "ottenimento figlio");
    return this;
  }
  
  /**
   * Ottiene l'indice di un figlio all'interno di un elemento
   * @param {Element} elemento - Elemento padre
   * @param {Element} figlio - Elemento figlio da trovare
   * @return {MyDocumentService} this per chiamate fluent
   */
  ottieniIndiceFiglio(elemento, figlio) {
    this._eseguiOperazione(() => {
      if (!elemento || !figlio) {
        throw new Error("Elemento o figlio non disponibile");
      }
      
      const numChildren = elemento.getNumChildren();
      for (let i = 0; i < numChildren; i++) {
        // Confronta gli elementi usando posizione e tipo invece di equals
        if (elemento.getChild(i) === figlio) {
          return i;
        }
      }
      
      return -1;
    }, "ottenimento indice figlio");
    return this;
  }
  
  /**
   * Verifica se un elemento è un paragrafo
   * @param {Element} elemento - Elemento da verificare
   * @return {MyDocumentService} this per chiamate fluent
   */
  isParagrafo(elemento) {
    this._eseguiOperazione(() => {
      if (!elemento) {
        throw new Error("Elemento non disponibile");
      }
      return elemento.getType() === DocumentApp.ElementType.PARAGRAPH;
    }, "verifica tipo paragrafo");
    return this;
  }
  
  /**
   * Converte un elemento in paragrafo
   * @param {Element} elemento - Elemento da convertire
   * @return {MyDocumentService} this per chiamate fluent
   */
  convertiInParagrafo(elemento) {
    this._eseguiOperazione(() => {
      if (!elemento) {
        throw new Error("Elemento non disponibile");
      }
      
      if (elemento.getType() === DocumentApp.ElementType.PARAGRAPH) {
        return elemento.asParagraph();
      }
      
      throw new Error("L'elemento non è un paragrafo");
    }, "conversione in paragrafo");
    return this;
  }
  
  /**
   * Ottiene il testo di un elemento
   * @param {Element} elemento - Elemento da cui estrarre il testo
   * @return {MyDocumentService} this per chiamate fluent
   */
  ottieniTestoElemento(elemento) {
    this._eseguiOperazione(() => {
      if (!elemento) {
        throw new Error("Elemento non disponibile");
      }
      
      switch(elemento.getType()) {
        case DocumentApp.ElementType.PARAGRAPH:
          return elemento.asParagraph().getText();
        case DocumentApp.ElementType.TEXT:
          return elemento.asText().getText();
        case DocumentApp.ElementType.TABLE_CELL:
          return elemento.asTableCell().getText();
        default:
          throw new Error("Tipo di elemento non supportato per ottenere testo");
      }
    }, "ottenimento testo elemento");
    return this;
  }
  
  /**
   * Imposta il testo di un elemento
   * @param {Element} elemento - Elemento su cui impostare il testo
   * @param {string} testo - Testo da impostare
   * @return {MyDocumentService} this per chiamate fluent
   */
impostaTestoElemento(elemento, testo) {
  this._eseguiOperazione(() => {
    if (!elemento) {
      throw new Error("Elemento non disponibile");
    }
    
    // CORREZIONE: Assicurati che il testo non sia mai una stringa vuota
    const testoEffettivo = (testo === null || testo === undefined || testo === "") ? "\u200B" : String(testo);
    
    switch(elemento.getType()) {
      case DocumentApp.ElementType.PARAGRAPH:
        return elemento.asParagraph().setText(testoEffettivo);
      case DocumentApp.ElementType.TEXT:
        return elemento.asText().setText(testoEffettivo);
      case DocumentApp.ElementType.TABLE_CELL:
        return elemento.asTableCell().setText(testoEffettivo);
      default:
        throw new Error("Tipo di elemento non supportato per impostare testo");
    }
  }, "impostazione testo elemento");
  return this;
}

  
  // GESTIONE TESTO
  /**
   * Imposta o appende testo al documento
   * @param {string} testo - Testo da impostare
   * @param {boolean} appendMode - Se true appende, altrimenti sostituisce
   * @return {MyDocumentService} this per chiamate fluent
   */
  impostaTesto(testo, appendMode = false) {
    this._eseguiOperazione(() => {
      if (!this._corpoCorrente) {
        throw new Error("Corpo del documento non disponibile");
      }
      
      if (appendMode) {
        return this._corpoCorrente.appendParagraph(testo);
      } else {
        this._corpoCorrente.clear();
        return this._corpoCorrente.appendParagraph(testo);
      }
    }, "impostazione testo");
    return this;
  }
  
  /**
   * Imposta testo formattato al documento
   * @param {Object[]} elementi - Array di oggetti {testo, stile}
   * @param {boolean} appendMode - Se true appende, altrimenti sostituisce
   * @return {MyDocumentService} this per chiamate fluent
   */
  impostaTestoFormattato(elementi, appendMode = false) {
    this._eseguiOperazione(() => {
      if (!this._corpoCorrente) {
        throw new Error("Corpo del documento non disponibile");
      }
      
      if (!appendMode) {
        this._corpoCorrente.clear();
      }
      
      for (const elemento of elementi) {
        const paragrafo = this._corpoCorrente.appendParagraph("");
        const testo = paragrafo.appendText(elemento.testo);
        
        if (elemento.stile) {
          const stile = elemento.stile;
          if (stile.bold) testo.setBold(true);
          if (stile.italic) testo.setItalic(true);
          if (stile.underline) testo.setUnderline(true);
          if (stile.fontSize) testo.setFontSize(stile.fontSize);
          if (stile.fontFamily) testo.setFontFamily(stile.fontFamily);
          if (stile.foregroundColor) testo.setForegroundColor(stile.foregroundColor);
          if (stile.backgroundColor) testo.setBackgroundColor(stile.backgroundColor);
          
          if (stile.alignment) {
            let alignment;
            switch(stile.alignment) {
              case 'left': alignment = DocumentApp.HorizontalAlignment.LEFT; break;
              case 'center': alignment = DocumentApp.HorizontalAlignment.CENTER; break;
              case 'right': alignment = DocumentApp.HorizontalAlignment.RIGHT; break;
              case 'justify': alignment = DocumentApp.HorizontalAlignment.JUSTIFY; break;
              default: alignment = DocumentApp.HorizontalAlignment.LEFT;
            }
            paragrafo.setAlignment(alignment);
          }
          
          if (stile.heading) {
            let heading;
            switch(stile.heading) {
              case 1: heading = DocumentApp.ParagraphHeading.HEADING1; break;
              case 2: heading = DocumentApp.ParagraphHeading.HEADING2; break;
              case 3: heading = DocumentApp.ParagraphHeading.HEADING3; break;
              case 4: heading = DocumentApp.ParagraphHeading.HEADING4; break;
              case 5: heading = DocumentApp.ParagraphHeading.HEADING5; break;
              case 6: heading = DocumentApp.ParagraphHeading.HEADING6; break;
              default: heading = DocumentApp.ParagraphHeading.NORMAL;
            }
            paragrafo.setHeading(heading);
          }
        }
      }
      
      return true;
    }, "impostazione testo formattato");
    return this;
  }
  
  // GESTIONE TABELLE
/**
 * Crea una tabella in un documento Google Docs con supporto formattazione
 * @param {Document} doc - Documento Google (optional, usa _documentoCorrente se omesso)
 * @param {Array[][]} dati - Array bidimensionale con i dati della tabella
 * @param {boolean} headerRow - Se true, formatta la prima riga come intestazione
 * @param {number} indice - Posizione in cui inserire la tabella (se null, appende in fondo)
 * @param {Array} larghezzeColonne - Array con le larghezze delle colonne (in punti)
 * @param {number} riempimento - Padding delle celle in punti (opzionale, default: null)
 * @param {Object} opzioniFormattazione - Opzioni per la formattazione della tabella
 * @return {MyDocumentService} This per chiamate fluent
 */
creaTabella(doc, dati, headerRow = true, indice = null, larghezzeColonne = [], riempimento = null, opzioniFormattazione = {}) {
  this._eseguiOperazione(() => {
    if (!dati || !Array.isArray(dati) || dati.length === 0) {
      throw new Error("Dati tabella non validi");
    }
    
    // Effettua una copia profonda dei dati per evitare modifiche indesiderate
    const datiCopia = JSON.parse(JSON.stringify(dati));
    
    // Ottieni il documento in cui inserire la tabella
    const documento = doc || this._documentoCorrente;
    if (!documento) {
      throw new Error("Documento non disponibile");
    }
    
    const corpo = documento.getBody();
    
    // Crea la tabella nella posizione corretta
    let tabella;
    if (indice !== null && indice >= 0) {
      tabella = corpo.insertTable(indice);
    } else {
      tabella = corpo.appendTable();
    }
    
    // Calcola il numero corretto di colonne esaminando tutte le righe
    let numColonne = 0;
    for (let i = 0; i < datiCopia.length; i++) {
      if (Array.isArray(datiCopia[i])) {
        numColonne = Math.max(numColonne, datiCopia[i].length);
      }
    }
    
    if (numColonne === 0 && datiCopia.length > 0) {
      numColonne = 1;
    }
    
    // Precalcola le larghezze delle colonne
    const larghezzeOttimali = this._calcolaLarghezzeColonne(datiCopia, numColonne, larghezzeColonne);
    
    // FASE 1: Crea prima tutte le righe e celle
    for (let r = 0; r < datiCopia.length; r++) {
      const riga = (r === 0 && tabella.getNumRows() > 0) ?
        tabella.getRow(0) :
        tabella.appendTableRow();
      
      const rowData = datiCopia[r];
      const celleDaCreare = numColonne - riga.getNumCells();
      
      for (let i = 0; i < celleDaCreare; i++) {
        riga.appendTableCell();
      }
    }
    
    // FASE 2: Imposta i contenuti e le larghezze
    for (let r = 0; r < datiCopia.length; r++) {
      const riga = tabella.getRow(r);
      const rowData = datiCopia[r];
      
      if (Array.isArray(rowData)) {
        for (let c = 0; c < numColonne; c++) {
          const cella = riga.getCell(c);
          const valoreCella = c < rowData.length ? rowData[c] : "";
          const testoEffettivo = (valoreCella === null || valoreCella === undefined || valoreCella === "") ? 
            "\u200B" : String(valoreCella);
          
          cella.setText(testoEffettivo);
          
          if (c < larghezzeOttimali.length && larghezzeOttimali[c]) {
            try {
              cella.setWidth(larghezzeOttimali[c]);
            } catch (e) {
              this._logger.warn(`Impossibile impostare larghezza colonna ${c}: ${e.message}`);
            }
          }
          
          // Applica il padding se specificato
          if (riempimento !== null && riempimento !== undefined && riempimento > 0) {
            cella.setPaddingTop(riempimento);
            cella.setPaddingBottom(riempimento);
            cella.setPaddingLeft(riempimento);
            cella.setPaddingRight(riempimento);
          }
        }
      } else {
        const valoreCella = rowData === null || rowData === undefined || rowData === "" ? 
          "\u200B" : String(rowData);
        
        const cella = riga.getCell(0);
        cella.setText(valoreCella);
        
        if (numColonne > 1) {
          cella.merge();
          
          let larghezzaTotale = 0;
          for (let i = 0; i < numColonne && i < larghezzeOttimali.length; i++) {
            if (larghezzeOttimali[i]) {
              larghezzaTotale += larghezzeOttimali[i];
            }
          }
          
          if (larghezzaTotale > 0) {
            cella.setWidth(larghezzaTotale);
          }
        }
      }
    }
    
    // FASE 3: Applica formattazione alternata se richiesta
    const numRows = tabella.getNumRows();
    
    if (opzioniFormattazione.formattazioneAlternata) {
      const coloreRigaDispari = opzioniFormattazione.coloreRigaDispari || "#FFFFFF";
      const coloreRigaPari = opzioniFormattazione.coloreRigaPari || "#F5F5F5";
      
      // Applica colori alternati a tutte le righe (partendo dalla seconda se c'è header)
      const inizioRigheAlternate = headerRow ? 1 : 0;
      
      for (let r = inizioRigheAlternate; r < numRows; r++) {
        const riga = tabella.getRow(r);
        const numCelle = riga.getNumCells();
        // Considera l'indice relativo per l'alternanza (escludendo header se presente)
        const indiceRelativo = headerRow ? r - 1 : r;
        const colore = (indiceRelativo % 2 === 0) ? coloreRigaDispari : coloreRigaPari;
        
        for (let c = 0; c < numCelle; c++) {
          try {
            riga.getCell(c).setBackgroundColor(colore);
          } catch (e) {
            this._logger.warn(`Impossibile impostare colore cella [${r},${c}]: ${e.message}`);
          }
        }
      }
    }
    
    // FASE 4: Formatta intestazione (prima riga) se richiesto
    if (headerRow && numRows > 0) {
      const primaRiga = tabella.getRow(0);
      const numCelle = primaRiga.getNumCells();
      
      for (let c = 0; c < numCelle; c++) {
        const cella = primaRiga.getCell(c);
        const testo = cella.getText();
        
        // Applica grassetto al testo (se non è solo spazio zero-width)
        if (testo && testo !== "\u200B") {
          try {
            const textElement = cella.editAsText();
            textElement.setBold(0, testo.length - 1, true);
          } catch (e) {
            this._logger.warn(`Impossibile formattare testo intestazione [0,${c}]: ${e.message}`);
          }
        }
        
        // Applica colore di sfondo all'intestazione se specificato
        if (opzioniFormattazione.coloreIntestazione) {
          try {
            cella.setBackgroundColor(opzioniFormattazione.coloreIntestazione);
          } catch (e) {
            this._logger.warn(`Impossibile impostare colore intestazione [0,${c}]: ${e.message}`);
          }
        }
      }
    }
    
    this._tabellaCorrente = tabella;
    return tabella;
  }, "creazione tabella");
  return this;
}

/**
 * Metodo di supporto che calcola le larghezze ottimali delle colonne
 * @param {Array[][]} dati - Array bidimensionale con i dati della tabella
 * @param {number} numColonne - Numero di colonne
 * @param {Array} larghezzeColonneUtente - Array con le larghezze specificate dall'utente
 * @return {Array} Array con le larghezze calcolate
 * @private
 */
_calcolaLarghezzeColonne(dati, numColonne, larghezzeColonneUtente) {
  // Raccogli i valori per colonna
  const valoriPerColonna = [];
  for (let c = 0; c < numColonne; c++) {
    valoriPerColonna.push([]);
  }
  
  // Popola valoriPerColonna dai dati
  for (let r = 0; r < dati.length; r++) {
    const rowData = dati[r];
    if (Array.isArray(rowData)) {
      for (let c = 0; c < numColonne; c++) {
        const valore = c < rowData.length ? rowData[c] : "";
        valoriPerColonna[c].push(valore);
      }
    }
  }
  
  // Calcola larghezze ottimali per ogni colonna
  const larghezzeOttimali = [];
  for (let c = 0; c < numColonne; c++) {
    // Prova a usare larghezza specificata dall'utente
    if (larghezzeColonneUtente && c < larghezzeColonneUtente.length) {
      // Converti a numero se è una stringa
      if (typeof larghezzeColonneUtente[c] === 'string') {
        // Tenta di convertire in numero
        const valoreNumerico = parseFloat(larghezzeColonneUtente[c]);
        if (!isNaN(valoreNumerico)) {
          larghezzeOttimali.push(valoreNumerico);
          continue;
        }
      } 
      // Se è un numero, usa direttamente
      else if (typeof larghezzeColonneUtente[c] === 'number') {
        larghezzeOttimali.push(larghezzeColonneUtente[c]);
        continue;
      }
    }
    
    // Calcola larghezza basata sui contenuti (default = 120pt)
    larghezzeOttimali.push(this._stimaLarghezzaColonna(valoriPerColonna[c]) || 120);
  }
  
  return larghezzeOttimali;
}



  /**
   * Seleziona una tabella per indice
   * @param {number} indiceTabella - Indice della tabella
   * @return {MyDocumentService} this per chiamate fluent
   */
  selezionaTabella(indiceTabella) {
    this._eseguiOperazione(() => {
      if (!this._corpoCorrente) {
        throw new Error("Corpo del documento non disponibile");
      }
      
      const numChildren = this._corpoCorrente.getNumChildren();
      let indiceCorrente = 0;
      
      for (let i = 0; i < numChildren; i++) {
        const child = this._corpoCorrente.getChild(i);
        if (child.getType() === DocumentApp.ElementType.TABLE) {
          if (indiceCorrente === indiceTabella) {
            this._tabellaCorrente = child.asTable();
            return this._tabellaCorrente;
          }
          indiceCorrente++;
        }
      }
      
      throw new Error(`Tabella con indice ${indiceTabella} non trovata`);
    }, "selezione tabella");
    return this;
  }
  
  /**
   * Modifica una cella di tabella
   * @param {number} riga - Indice riga
   * @param {number} colonna - Indice colonna
   * @param {string} contenuto - Contenuto da inserire
   * @param {Object} stile - Stili da applicare
   * @param {number} indiceTabella - Indice tabella (default: tabella corrente)
   * @return {MyDocumentService} this per chiamate fluent
   */
modificaCella(riga, colonna, contenuto, stile = {}, indiceTabella = null) {
  return this._eseguiOperazione(() => {
    const tabella = indiceTabella !== null ? 
      this.selezionaTabella(indiceTabella).ottieniRisultato() : 
      this._tabellaCorrente;
    
    if (!tabella) {
      throw new Error("Tabella non disponibile");
    }
    
    if (riga < 0 || riga >= tabella.getNumRows()) {
      throw new Error(`Indice riga ${riga} fuori range`);
    }
    
    const tableRow = tabella.getRow(riga);
    
    if (colonna < 0 || colonna >= tableRow.getNumCells()) {
      throw new Error(`Indice colonna ${colonna} fuori range`);
    }
    
    const cella = tableRow.getCell(colonna);
    
    // CORREZIONE: Assicurati che contenuto non sia mai una stringa vuota
    const testoEffettivo = (contenuto === null || contenuto === undefined || contenuto === "") ? "\u200B" : String(contenuto);
    cella.setText(testoEffettivo);
    
    // Resto del codice invariato...
    if (stile && Object.keys(stile).length > 0) {
      const testo = cella.editAsText();
      const lunghezzaTesto = testoEffettivo.length;
      
      if (lunghezzaTesto > 0) {
        // Applica stili al testo
        if (stile.bold) testo.setBold(0, lunghezzaTesto - 1, true);
        if (stile.italic) testo.setItalic(0, lunghezzaTesto - 1, true);
        if (stile.underline) testo.setUnderline(0, lunghezzaTesto - 1, true);
        if (stile.fontSize) testo.setFontSize(0, lunghezzaTesto - 1, stile.fontSize);
        if (stile.fontFamily) testo.setFontFamily(0, lunghezzaTesto - 1, stile.fontFamily);
        if (stile.foregroundColor) testo.setForegroundColor(0, lunghezzaTesto - 1, stile.foregroundColor);
        if (stile.backgroundColor) testo.setBackgroundColor(0, lunghezzaTesto - 1, stile.backgroundColor);
      }
      
      // Stili della cella
      if (stile.verticalAlignment) {
        let alignment;
        switch(stile.verticalAlignment) {
          case 'top': alignment = DocumentApp.VerticalAlignment.TOP; break;
          case 'middle': alignment = DocumentApp.VerticalAlignment.CENTER; break;
          case 'bottom': alignment = DocumentApp.VerticalAlignment.BOTTOM; break;
          default: alignment = DocumentApp.VerticalAlignment.CENTER;
        }
        cella.setVerticalAlignment(alignment);
      }
      
      // Imposta allineamento orizzontale
      if (stile.horizontalAlignment) {
        const paragraph = cella.getChild(0).asParagraph();
        let alignment;
        
        switch(stile.horizontalAlignment) {
          case 'left': alignment = DocumentApp.HorizontalAlignment.LEFT; break;
          case 'center': alignment = DocumentApp.HorizontalAlignment.CENTER; break;
          case 'right': alignment = DocumentApp.HorizontalAlignment.RIGHT; break;
          case 'justify': alignment = DocumentApp.HorizontalAlignment.JUSTIFY; break;
          default: alignment = DocumentApp.HorizontalAlignment.LEFT;
        }
        
        paragraph.setAlignment(alignment);
      }
      
      // Padding della cella
      if (stile.padding) {
        const padding = stile.padding;
        cella.setPaddingTop(padding);
        cella.setPaddingBottom(padding);
        cella.setPaddingLeft(padding);
        cella.setPaddingRight(padding);
      }
    }
    
    return cella;
  }, "modifica cella");
  return this;
}



  /**
   * Modifica una riga di tabella
   * @param {number} indiceRiga - Indice riga
   * @param {Array|Object} valori - Valori da inserire
   * @param {number} indiceTabella - Indice tabella (default: tabella corrente)
   * @return {MyDocumentService} this per chiamate fluent
   */
  modificaRiga(indiceRiga, valori, indiceTabella = null) {
    this._eseguiOperazione(() => {
      const tabella = indiceTabella !== null ? 
        this.selezionaTabella(indiceTabella).ottieniRisultato() : 
        this._tabellaCorrente;
      
      if (!tabella) {
        throw new Error("Tabella non disponibile");
      }
      
      if (indiceRiga < 0 || indiceRiga >= tabella.getNumRows()) {
        throw new Error(`Indice riga ${indiceRiga} fuori range`);
      }
      
      const riga = tabella.getRow(indiceRiga);
      const numCells = riga.getNumCells();
      
      // Se valori è un array, aggiorniamo ogni cella
      if (Array.isArray(valori)) {
        for (let c = 0; c < Math.min(numCells, valori.length); c++) {
          riga.getCell(c).setText(String(valori[c] || "\u200B"));
        }
      } 
      // Se valori è un oggetto, assumiamo che le chiavi siano indici di colonna
      else if (typeof valori === 'object') {
        for (const colIdx in valori) {
          const idx = parseInt(colIdx, 10);
          if (!isNaN(idx) && idx >= 0 && idx < numCells) {
            riga.getCell(idx).setText(String(valori[colIdx] || "\u200B"));
          }
        }
      }
      
      return riga;
    }, "modifica riga");
    return this;
  }
  
  /**
   * Modifica una colonna di tabella
   * @param {number} indiceColonna - Indice colonna
   * @param {Array|Object} valori - Valori da inserire
   * @param {number} indiceTabella - Indice tabella (default: tabella corrente)
   * @return {MyDocumentService} this per chiamate fluent
   */
  modificaColonna(indiceColonna, valori, indiceTabella = null) {
    this._eseguiOperazione(() => {
      const tabella = indiceTabella !== null ? 
        this.selezionaTabella(indiceTabella).ottieniRisultato() : 
        this._tabellaCorrente;
      
      if (!tabella) {
        throw new Error("Tabella non disponibile");
      }
      
      const numRows = tabella.getNumRows();
      if (numRows === 0) {
        throw new Error("La tabella non ha righe");
      }
      
      if (indiceColonna < 0 || indiceColonna >= tabella.getRow(0).getNumCells()) {
        throw new Error(`Indice colonna ${indiceColonna} fuori range`);
      }
      
      // Se valori è un array, aggiorniamo ogni cella nella colonna
      if (Array.isArray(valori)) {
        for (let r = 0; r < Math.min(numRows, valori.length); r++) {
          tabella.getRow(r).getCell(indiceColonna).setText(String(valori[r] || "\u200B"));
        }
      } 
      // Se valori è un oggetto, assumiamo che le chiavi siano indici di riga
      else if (typeof valori === 'object') {
        for (const rowIdx in valori) {
          const idx = parseInt(rowIdx, 10);
          if (!isNaN(idx) && idx >= 0 && idx < numRows) {
            tabella.getRow(idx).getCell(indiceColonna).setText(String(valori[rowIdx] || "\u200B"));
          }
        }
      }
      
      return tabella;
    }, "modifica colonna");
    return this;
  }
  
  /**
   * Duplica una riga di tabella
   * @param {number} indiceRiga - Indice riga da duplicare
   * @param {Object} modifiche - Modifiche da applicare alla nuova riga
   * @param {number} indiceTabella - Indice tabella (default: tabella corrente)
   * @return {MyDocumentService} this per chiamate fluent
   */
  duplicaRiga(indiceRiga, modifiche = {}, indiceTabella = null) {
    this._eseguiOperazione(() => {
      const tabella = indiceTabella !== null ? 
        this.selezionaTabella(indiceTabella).ottieniRisultato() : 
        this._tabellaCorrente;
      
      if (!tabella) {
        throw new Error("Tabella non disponibile");
      }
      
      if (indiceRiga < 0 || indiceRiga >= tabella.getNumRows()) {
        throw new Error(`Indice riga ${indiceRiga} fuori range`);
      }
      
      const rigaOrigine = tabella.getRow(indiceRiga);
      const numCells = rigaOrigine.getNumCells();
      
      // Crea una nuova riga dopo quella originale
      const nuovaRiga = tabella.appendTableRow();
      
      // Copia i contenuti dalla riga originale
      for (let c = 0; c < numCells; c++) {
        const cellaTesto = rigaOrigine.getCell(c).getText();
        nuovaRiga.appendTableCell().setText(cellaTesto);
      }
      
      // Applica le modifiche specificate
      if (modifiche && typeof modifiche === 'object') {
        for (const colIdx in modifiche) {
          const idx = parseInt(colIdx, 10);
          if (!isNaN(idx) && idx >= 0 && idx < numCells) {
            nuovaRiga.getCell(idx).setText(String(modifiche[colIdx] || ""));
          }
        }
      }
      
      return nuovaRiga;
    }, "duplica riga");
    return this;
  }
  
  /**
   * Duplica una colonna di tabella
   * @param {number} indiceColonna - Indice colonna da duplicare
   * @param {Object} modifiche - Modifiche da applicare alla nuova colonna
   * @param {number} indiceTabella - Indice tabella (default: tabella corrente)
   * @return {MyDocumentService} this per chiamate fluent
   */
  duplicaColonna(indiceColonna, modifiche = {}, indiceTabella = null) {
    this._eseguiOperazione(() => {
      const tabella = indiceTabella !== null ? 
        this.selezionaTabella(indiceTabella).ottieniRisultato() : 
        this._tabellaCorrente;
      
      if (!tabella) {
        throw new Error("Tabella non disponibile");
      }
      
      const numRows = tabella.getNumRows();
      if (numRows === 0) {
        throw new Error("La tabella non ha righe");
      }
      
      if (indiceColonna < 0 || indiceColonna >= tabella.getRow(0).getNumCells()) {
        throw new Error(`Indice colonna ${indiceColonna} fuori range`);
      }
      
      // Aggiungi una colonna a ogni riga
      for (let r = 0; r < numRows; r++) {
        const riga = tabella.getRow(r);
        const nuovaCella = riga.appendTableCell();
        
        // Copia il contenuto dalla colonna originale o applica la modifica
        if (modifiche && modifiche[r] !== undefined) {
          nuovaCella.setText(String(modifiche[r] || ""));
        } else {
          const testoOrigine = riga.getCell(indiceColonna).getText();
          nuovaCella.setText(testoOrigine);
        }
      }
      
      return tabella;
    }, "duplica colonna");
    return this;
  }

/**
 * Elimina righe specifiche da una tabella
 * @param {Array} indiciRighe - Array di indici delle righe da eliminare (ordinati in modo decrescente)
 * @param {number} indiceTabella - Indice tabella (default: tabella corrente)
 * @return {MyDocumentService} this per chiamate fluent
 */
eliminaRighe(indiciRighe, indiceTabella = null) {
  this._eseguiOperazione(() => {
    const tabella = indiceTabella !== null ? 
      this.selezionaTabella(indiceTabella).ottieniRisultato() : 
      this._tabellaCorrente;
    
    if (!tabella) {
      throw new Error("Tabella non disponibile");
    }
    
    const numRows = tabella.getNumRows();
    if (numRows === 0) {
      throw new Error("La tabella non ha righe");
    }
    
    // Ordina gli indici in ordine decrescente per evitare problemi con indici che cambiano
    // durante l'eliminazione (se non sono già ordinati)
    const indiciOrdinati = [...indiciRighe].sort((a, b) => b - a);
    
    // Verifica validità degli indici
    for (const indice of indiciOrdinati) {
      if (indice < 0 || indice >= numRows) {
        throw new Error(`Indice riga ${indice} fuori range`);
      }
    }
    
    // Elimina le righe in ordine decrescente
    for (const indice of indiciOrdinati) {
      tabella.removeRow(indice);
    }
    
    return tabella;
  }, "eliminazione righe");
  return this;
}

/**
 * Elimina colonne specifiche da una tabella
 * @param {Array} indiciColonne - Array di indici delle colonne da eliminare (ordinati in modo decrescente)
 * @param {number} indiceTabella - Indice tabella (default: tabella corrente)
 * @return {MyDocumentService} this per chiamate fluent
 */
eliminaColonne(indiciColonne, indiceTabella = null) {
  this._eseguiOperazione(() => {
    const tabella = indiceTabella !== null ? 
      this.selezionaTabella(indiceTabella).ottieniRisultato() : 
      this._tabellaCorrente;
    
    if (!tabella) {
      throw new Error("Tabella non disponibile");
    }
    
    const numRows = tabella.getNumRows();
    if (numRows === 0) {
      throw new Error("La tabella non ha righe");
    }
    
    // Determina il numero di colonne dalla prima riga
    const primaRiga = tabella.getRow(0);
    const numColonne = primaRiga.getNumCells();
    
    // Ordina gli indici in ordine decrescente per evitare problemi con indici che cambiano
    const indiciOrdinati = [...indiciColonne].sort((a, b) => b - a);
    
    // Verifica validità degli indici
    for (const indice of indiciOrdinati) {
      if (indice < 0 || indice >= numColonne) {
        throw new Error(`Indice colonna ${indice} fuori range`);
      }
    }
    
    // Elimina le colonne in ogni riga
    for (let r = 0; r < numRows; r++) {
      const riga = tabella.getRow(r);
      
      // Elimina le celle in ordine decrescente
      for (const indice of indiciOrdinati) {
        riga.removeCell(indice);
      }
    }
    
    return tabella;
  }, "eliminazione colonne");
  return this;
}

/**
 * Elimina tutte le righe tranne la prima (intestazione)
 * @param {number} indiceTabella - Indice tabella (default: tabella corrente)
 * @return {MyDocumentService} this per chiamate fluent
 */
eliminaTutteLeRigheTrannePrima(indiceTabella = null) {
  this._eseguiOperazione(() => {
    const tabella = indiceTabella !== null ? 
      this.selezionaTabella(indiceTabella).ottieniRisultato() : 
      this._tabellaCorrente;
    
    if (!tabella) {
      throw new Error("Tabella non disponibile");
    }
    
    // Verifica che esista almeno una riga
    const numRows = tabella.getNumRows();
    if (numRows <= 1) {
      // Nessuna riga da eliminare (c'è solo l'intestazione o la tabella è vuota)
      return tabella;
    }
    
    // Crea un array di indici di tutte le righe tranne la prima
    const indiciDaEliminare = [];
    for (let i = numRows - 1; i > 0; i--) {
      indiciDaEliminare.push(i);
    }
    
    // Usa il metodo esistente per eliminare le righe
    return this.eliminaRighe(indiciDaEliminare, indiceTabella).ottieniRisultato();
  }, "eliminazione righe tranne prima");
  return this;
}

/**
 * Crea una copia di una tabella nel documento
 * @param {number} indiceTabella - Indice della tabella da copiare (default: tabella corrente)
 * @param {number} indicePosizione - Posizione in cui inserire la copia (default: dopo l'originale)
 * @return {MyDocumentService} this per chiamate fluent
 */
duplicaTabella(indiceTabella = null, indicePosizione = null) {
  this._eseguiOperazione(() => {
    const tabella = indiceTabella !== null ? 
      this.selezionaTabella(indiceTabella).ottieniRisultato() : 
      this._tabellaCorrente;
    
    if (!tabella) {
      throw new Error("Tabella non disponibile");
    }
    
    // Ottieni l'indice della tabella originale nel corpo
    const indiceOriginale = indiceTabella !== null ? 
      indiceTabella : 
      this._ottieniIndiceTabella(tabella);
    
    // Se l'indice non è specificato, posiziona dopo l'originale
    const posizioneCopia = indicePosizione !== null ? 
      indicePosizione : 
      indiceOriginale + 1;
    
    // Ottieni i dati della tabella originale
    const numRows = tabella.getNumRows();
    const dati = [];
    
    for (let r = 0; r < numRows; r++) {
      const riga = tabella.getRow(r);
      const numCells = riga.getNumCells();
      const rowData = [];
      
      for (let c = 0; c < numCells; c++) {
        rowData.push(riga.getCell(c).getText());
      }
      
      dati.push(rowData);
    }
    
    // Crea la nuova tabella
    const nuovaTabella = this.creaTabella(
      this._documentoCorrente,
      dati,
      true, // headerRow
      posizioneCopia
    ).ottieniRisultato();
    
    // Copia formattazione e stili dalla tabella originale
    this._copiaFormattazioneTabella(tabella, nuovaTabella);
    
    return nuovaTabella;
  }, "duplicazione tabella");
  return this;
}

/**
 * Copia formattazione e stili da una tabella a un'altra
 * @param {Table} tabellaOrigine - Tabella di origine
 * @param {Table} tabellaDestinazione - Tabella di destinazione
 * @return {boolean} True se l'operazione è riuscita
 * @private
 */
_copiaFormattazioneTabella(tabellaOrigine, tabellaDestinazione) {
  try {
    if (!tabellaOrigine || !tabellaDestinazione) return false;
    
    const numRowsOrigine = tabellaOrigine.getNumRows();
    const numRowsDest = tabellaDestinazione.getNumRows();
    
    const minRows = Math.min(numRowsOrigine, numRowsDest);
    
    // Copia formattazione tabella generale
    try {
      tabellaDestinazione.setBorderColor(tabellaOrigine.getBorderColor());
      tabellaDestinazione.setBorderWidth(tabellaOrigine.getBorderWidth());
    } catch (e) {
      this._logger.warn(`Impossibile copiare formattazione tabella: ${e.message}`);
    }
    
    // Copia formattazione riga per riga, cella per cella
    for (let r = 0; r < minRows; r++) {
      const rigaOrigine = tabellaOrigine.getRow(r);
      const rigaDest = tabellaDestinazione.getRow(r);
      
      try {
        // Copia altezza riga
        rigaDest.setMinimumHeight(rigaOrigine.getMinimumHeight());
      } catch (e) {
        this._logger.warn(`Impossibile copiare altezza riga ${r}: ${e.message}`);
      }
      
      const numCellsOrigine = rigaOrigine.getNumCells();
      const numCellsDest = rigaDest.getNumCells();
      const minCells = Math.min(numCellsOrigine, numCellsDest);
      
      for (let c = 0; c < minCells; c++) {
        try {
          const cellaOrigine = rigaOrigine.getCell(c);
          const cellaDest = rigaDest.getCell(c);
          
          // Copia stile cella
          cellaDest.setBackgroundColor(cellaOrigine.getBackgroundColor());
          cellaDest.setPaddingBottom(cellaOrigine.getPaddingBottom());
          cellaDest.setPaddingLeft(cellaOrigine.getPaddingLeft());
          cellaDest.setPaddingRight(cellaOrigine.getPaddingRight());
          cellaDest.setPaddingTop(cellaOrigine.getPaddingTop());
          cellaDest.setVerticalAlignment(cellaOrigine.getVerticalAlignment());
          cellaDest.setWidth(cellaOrigine.getWidth());
          
          // Copia stile testo
          const testoOrigine = cellaOrigine.editAsText();
          const testoDest = cellaDest.editAsText();
          
          const testoLunghezza = Math.min(testoOrigine.getText().length, testoDest.getText().length);
          
          if (testoLunghezza > 0) {
            try {
              testoDest.setBold(0, testoLunghezza - 1, testoOrigine.isBold(0));
              testoDest.setItalic(0, testoLunghezza - 1, testoOrigine.isItalic(0));
              testoDest.setUnderline(0, testoLunghezza - 1, testoOrigine.isUnderline(0));
              testoDest.setFontFamily(0, testoLunghezza - 1, testoOrigine.getFontFamily(0));
              testoDest.setFontSize(0, testoLunghezza - 1, testoOrigine.getFontSize(0));
              testoDest.setForegroundColor(0, testoLunghezza - 1, testoOrigine.getForegroundColor(0));
            } catch (e) {
              this._logger.warn(`Impossibile copiare stile testo cella [${r},${c}]: ${e.message}`);
            }
          }
          
          // Copia allineamento paragrafo (se disponibile)
          try {
            const parOrigine = cellaOrigine.getChild(0).asParagraph();
            const parDest = cellaDest.getChild(0).asParagraph();
            parDest.setAlignment(parOrigine.getAlignment());
          } catch (e) {
            this._logger.warn(`Impossibile copiare allineamento paragrafo cella [${r},${c}]: ${e.message}`);
          }
        } catch (e) {
          this._logger.warn(`Impossibile copiare stile cella [${r},${c}]: ${e.message}`);
        }
      }
    }
    
    return true;
  } catch (e) {
    this._logger.error(`Errore nella copia formattazione tabella: ${e.message}`);
    return false;
  }
}
  
  /**
   * Formatta una tabella
   * @param {number} indiceTabella - Indice tabella (default: tabella corrente)
   * @param {Object} opzioni - Opzioni di formattazione
   * @return {MyDocumentService} this per chiamate fluent
   */
  formattaTabella(indiceTabella = null, opzioni = {}) {
    this._eseguiOperazione(() => {
      const tabella = indiceTabella !== null ? 
        this.selezionaTabella(indiceTabella).ottieniRisultato() : 
        this._tabellaCorrente;
      
      if (!tabella) {
        throw new Error("Tabella non disponibile");
      }
      
      const numRows = tabella.getNumRows();
      if (numRows === 0) return tabella;
      
      // Imposta stili delle righe
      if (opzioni.righeAlternate) {
        const coloreDispari = opzioni.coloreRigaDispari || "#ffffff";
        const colorePari = opzioni.coloreRigaPari || "#f3f3f3";
        
        for (let r = 0; r < numRows; r++) {
          const riga = tabella.getRow(r);
          const numCelle = riga.getNumCells();
          const colore = (r % 2 === 0) ? colorePari : coloreDispari;
          
          for (let c = 0; c < numCelle; c++) {
            riga.getCell(c).setBackgroundColor(colore);
          }
        }
      }
      
      // Imposta lo stile della prima riga (intestazione)
      if (opzioni.headerRow && numRows > 0) {
        const primaRiga = tabella.getRow(0);
        const numCelle = primaRiga.getNumCells();
        
        for (let c = 0; c < numCelle; c++) {
          const cella = primaRiga.getCell(c);
          const testo = cella.editAsText();
          const lunghezzaTesto = cella.getText().length;
          
          if (lunghezzaTesto > 0) {
            testo.setBold(0, lunghezzaTesto - 1, true);
            
            if (opzioni.coloreHeader) {
              cella.setBackgroundColor(opzioni.coloreHeader);
            }
            
            if (opzioni.coloreTesto) {
              testo.setForegroundColor(0, lunghezzaTesto - 1, opzioni.coloreTesto);
            }
          }
          
          // Imposta allineamento al centro per l'intestazione
          if (opzioni.centraIntestazione) {
            const par = cella.getChild(0).asParagraph();
            par.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
          }
        }
      }
      
      return tabella;
    }, "formatta tabella");
    return this;
  }
  
  // STRUTTURA DOCUMENTO
  /**
   * Aggiunge una sezione al documento
   * @param {string} titoloSezione - Titolo della sezione
   * @param {number} livello - Livello di intestazione (1-6)
   * @param {string} contenuto - Contenuto della sezione
   * @return {MyDocumentService} this per chiamate fluent
   */
  aggiungiSezione(titoloSezione, livello = 1, contenuto = '') {
    this._eseguiOperazione(() => {
      if (!this._corpoCorrente) {
        throw new Error("Corpo del documento non disponibile");
      }
      
      // Aggiungi il titolo con il livello di intestazione appropriato
      let par;
      
      switch(livello) {
        case 1:
          par = this._corpoCorrente.appendParagraph(titoloSezione);
          par.setHeading(DocumentApp.ParagraphHeading.HEADING1);
          break;
        case 2:
          par = this._corpoCorrente.appendParagraph(titoloSezione);
          par.setHeading(DocumentApp.ParagraphHeading.HEADING2);
          break;
        case 3:
          par = this._corpoCorrente.appendParagraph(titoloSezione);
          par.setHeading(DocumentApp.ParagraphHeading.HEADING3);
          break;
        case 4:
          par = this._corpoCorrente.appendParagraph(titoloSezione);
          par.setHeading(DocumentApp.ParagraphHeading.HEADING4);
          break;
        case 5:
          par = this._corpoCorrente.appendParagraph(titoloSezione);
          par.setHeading(DocumentApp.ParagraphHeading.HEADING5);
          break;
        case 6:
          par = this._corpoCorrente.appendParagraph(titoloSezione);
          par.setHeading(DocumentApp.ParagraphHeading.HEADING6);
          break;
        default:
          par = this._corpoCorrente.appendParagraph(titoloSezione);
          par.setHeading(DocumentApp.ParagraphHeading.HEADING1);
      }
      
      // Aggiungi il contenuto se fornito
      if (contenuto) {
        const contentPar = this._corpoCorrente.appendParagraph(contenuto);
        contentPar.setHeading(DocumentApp.ParagraphHeading.NORMAL);
      }
      
      return par;
    }, "aggiungi sezione");
    return this;
  }
  
  /**
   * Aggiunge un'intestazione al documento
   * @param {string} testo - Testo dell'intestazione
   * @return {MyDocumentService} this per chiamate fluent
   */
  aggiungiIntestazione(testo) {
    this._eseguiOperazione(() => {
      if (!this._documentoCorrente) {
        throw new Error("Documento non disponibile");
      }
      
      const header = this._documentoCorrente.getHeader() || 
                     this._documentoCorrente.addHeader();
      
      header.clear();
      header.appendParagraph(testo);
      
      return header;
    }, "aggiungi intestazione");
    return this;
  }
  
  /**
   * Aggiunge un piè di pagina al documento
   * @param {string} testo - Testo del piè di pagina
   * @return {MyDocumentService} this per chiamate fluent
   */
  aggiungiPieDiPagina(testo) {
    this._eseguiOperazione(() => {
      if (!this._documentoCorrente) {
        throw new Error("Documento non disponibile");
      }
      
      const footer = this._documentoCorrente.getFooter() || 
                     this._documentoCorrente.addFooter();
      
      footer.clear();
      footer.appendParagraph(testo);
      
      return footer;
    }, "aggiungi piè di pagina");
    return this;
  }
  
  /**
   * Aggiunge un indice al documento (simulato con un elenco di titoli)
   * @return {MyDocumentService} this per chiamate fluent
   */
  aggiungiIndice() {
    this._eseguiOperazione(() => {
      if (!this._documentoCorrente || !this._corpoCorrente) {
        throw new Error("Documento o corpo non disponibile");
      }
      
      // Aggiungiamo un titolo per l'indice
      const titolo = this._corpoCorrente.insertParagraph(0, "Indice");
      titolo.setHeading(DocumentApp.ParagraphHeading.HEADING1);
      
      // Troviamo tutti i titoli nel documento
      const numChildren = this._corpoCorrente.getNumChildren();
      const titoli = [];
      
      for (let i = 0; i < numChildren; i++) {
        const child = this._corpoCorrente.getChild(i);
        
        if (child.getType() === DocumentApp.ElementType.PARAGRAPH) {
          const par = child.asParagraph();
          const heading = par.getHeading();
          
          if (heading !== DocumentApp.ParagraphHeading.NORMAL &&
              heading !== DocumentApp.ParagraphHeading.TITLE) {
            
            const level = this._getHeadingLevel(heading);
            
            if (level > 0 && par.getText() !== "Indice") {
              titoli.push({
                testo: par.getText(),
                livello: level
              });
            }
          }
        }
      }
      
      // Inseriamo le voci dell'indice
      let indiceCorrente = 1; // Dopo il titolo "Indice"
      
      for (const titolo of titoli) {
        const indentazione = "  ".repeat(titolo.livello - 1);
        const voceIndice = this._corpoCorrente.insertParagraph(indiceCorrente, indentazione + titolo.testo);
        voceIndice.setHeading(DocumentApp.ParagraphHeading.NORMAL);
        indiceCorrente++;
      }
      
      // Aggiungiamo un paragrafo vuoto dopo l'indice
      this._corpoCorrente.insertParagraph(indiceCorrente, "");
      
      return true;
    }, "aggiungi indice");
    return this;
  }
  
  /**
   * Ottiene il livello numerico dell'intestazione
   * @param {Enum} heading - Tipo di intestazione
   * @return {number} Livello numerico (1-6)
   * @private
   */
  _getHeadingLevel(heading) {
    switch(heading) {
      case DocumentApp.ParagraphHeading.HEADING1: return 1;
      case DocumentApp.ParagraphHeading.HEADING2: return 2;
      case DocumentApp.ParagraphHeading.HEADING3: return 3;
      case DocumentApp.ParagraphHeading.HEADING4: return 4;
      case DocumentApp.ParagraphHeading.HEADING5: return 5;
      case DocumentApp.ParagraphHeading.HEADING6: return 6;
      default: return 0;
    }
  }
  
  // RICERCA E NAVIGAZIONE
/**
 * Ottiene la tabella corrente
 * @return {MyDocumentService} this per chiamate fluent
 */
ottieniTabellaCorrente() {
  this._eseguiOperazione(() => {
    if (!this._tabellaCorrente) {
      throw new Error("Nessuna tabella corrente disponibile");
    }
    return this._tabellaCorrente;
  }, "ottenimento tabella corrente");
  return this;
}


/**
 * Trova la posizione di una tabella immediatamente successiva a una stringa di testo.
 * Imposta la tabella trovata come tabella corrente e restituisce l'indice
 * della tabella nel corpo del documento.
 * @param {string} testoRicerca - Testo da cercare
 * @param {number} indiceInizio - Indice da cui iniziare la ricerca
 * @param {boolean} corrispondenzaEsatta - Se true, cerca corrispondenza esatta
 * @return {MyDocumentService} this per chiamate fluent
 */
trovaPosizioneTabellaDopoStringa(testoRicerca, indiceInizio = 0, corrispondenzaEsatta = false) {
  this._eseguiOperazione(() => {
    if (!this._corpoCorrente) {
      throw new Error("Corpo del documento non disponibile");
    }
    
    const numChildren = this._corpoCorrente.getNumChildren();
    let trovataStringa = false;
    
    for (let i = indiceInizio; i < numChildren; i++) {
      const child = this._corpoCorrente.getChild(i);
      
      if (!trovataStringa) {
        // Cerchiamo prima la stringa
        if (child.getType() === DocumentApp.ElementType.PARAGRAPH) {
          const par = child.asParagraph();
          const testo = par.getText();
          
          if ((corrispondenzaEsatta && testo === testoRicerca) ||
              (!corrispondenzaEsatta && testo.includes(testoRicerca))) {
            trovataStringa = true;
          }
        }
      } else {
        // Dopo aver trovato la stringa, cerchiamo la tabella
        if (child.getType() === DocumentApp.ElementType.TABLE) {
          this._tabellaCorrente = child.asTable();
          return i; // Ritorna l'indice della tabella
        }
      }
    }
    
    return -1; // Tabella non trovata
  }, "ricerca posizione tabella dopo stringa");
  
  return this;
}

  /**
   * Ottiene i titoli del documento
   * @return {MyDocumentService} this per chiamate fluent
   */
  ottieniTitoli() {
    this._eseguiOperazione(() => {
      if (!this._corpoCorrente) {
        throw new Error("Corpo del documento non disponibile");
      }
      
      const numChildren = this._corpoCorrente.getNumChildren();
      const titoli = [];
      
      for (let i = 0; i < numChildren; i++) {
        const child = this._corpoCorrente.getChild(i);
        
        if (child.getType() === DocumentApp.ElementType.PARAGRAPH) {
          const par = child.asParagraph();
          const heading = par.getHeading();
          
          if (heading !== DocumentApp.ParagraphHeading.NORMAL &&
              heading !== DocumentApp.ParagraphHeading.TITLE) {
            
            const level = this._getHeadingLevel(heading);
            
            if (level > 0) {
              titoli.push({
                testo: par.getText(),
                livello: level,
                indice: i
              });
            }
          }
        }
      }
      
      return titoli;
    }, "ottenimento titoli");
    return this;
  }
/**
 * Completa la classe con i metodi mancanti
 */


/**
 * Esporta il documento in formato PDF
 * @param {string} nomeFile - Nome del file PDF
 * @param {string} idCartellaDest - ID della cartella di destinazione (default: root)
 * @return {MyDocumentService} this per chiamate fluent
 */
esportaPDF(nomeFile, idCartellaDest = null) {
  this._eseguiOperazione(() => {
    if (!this._documentoCorrente) {
      throw new Error("Documento non disponibile");
    }
    
    // Ottieni il documento come blob PDF
    const blob = this._documentoCorrente.getAs('application/pdf');
    blob.setName(nomeFile);
    
    // Salva nella cartella specificata o nella root
    let folder;
    if (idCartellaDest) {
      folder = DriveApp.getFolderById(idCartellaDest);
    } else {
      folder = DriveApp.getRootFolder();
    }
    
    const file = folder.createFile(blob);
    return file;
  }, "esportazione PDF");
  return this;
}

/**
 * Salva e chiude il documento
 * @return {MyDocumentService} this per chiamate fluent
 */
salvaEChiudi() {
  this._eseguiOperazione(() => {
    if (!this._documentoCorrente) {
      throw new Error("Documento non disponibile");
    }
    
    // In DocumentApp non c'è un metodo esplicito per salvare e chiudere
    // Il salvataggio viene fatto automaticamente dopo ogni modifica
    return true;
  }, "salvataggio documento");
  return this;
}

/**
 * Stima la larghezza ottimale per una colonna usando metriche precise
 * @param {Array} valori - Valori da analizzare
 * @param {number} fontSize - Dimensione del font in punti
 * @return {number} Larghezza stimata in punti
 * @private
 */
_stimaLarghezzaColonna(valori, fontSize = 11) {
  if (!valori || valori.length === 0) return 120;

  // Costanti per Arial 11pt (in punti)
  const CARATTERI_GRANDI = {
    'W': 10.12, 'M': 9.98, 'O': 8.95, 'G': 8.91, 'Q': 8.95,
    'C': 8.14, 'D': 8.91, 'H': 8.91, 'N': 8.91, 'U': 8.91,
    'V': 8.14, 'X': 8.14, 'Y': 8.14, 'À': 8.14, 'È': 8.14
  };

  const CARATTERI_MEDI = {
    'A': 7.95, 'B': 7.95, 'E': 7.56, 'F': 7.12, 'K': 7.56,
    'P': 7.56, 'R': 7.95, 'S': 7.56, 'T': 7.12, 'Z': 7.12,
    'a': 6.67, 'b': 6.67, 'd': 6.67, 'g': 6.67, 'h': 6.67,
    'n': 6.67, 'p': 6.67, 'q': 6.67, '@': 7.95, '&': 7.95
  };

  const CARATTERI_PICCOLI = {
    'i': 3.34, 'j': 3.34, 'l': 3.34, 'r': 4.45, 's': 5.56,
    't': 4.45, 'c': 5.56, 'e': 5.56, 'o': 5.56, 'x': 5.56,
    'z': 5.56, '.': 3.34, ',': 3.34, ':': 3.34, ';': 3.34,
    '!': 3.34, 'I': 3.89, '|': 3.34, '(': 4.45, ')': 4.45
  };

  // Valore medio per caratteri non mappati
  const VALORE_MEDIO = 6.5;
  
  // Padding di sicurezza (in punti)
  const PADDING = 14;

  // Funzione per calcolare larghezza carattere con dimensione font
  const getLarghezzaCarattere = (char) => {
    const baseWidth = CARATTERI_GRANDI[char] || 
                     CARATTERI_MEDI[char] || 
                     CARATTERI_PICCOLI[char] || 
                     VALORE_MEDIO;
    
    // Aggiusta per dimensione font diversa da 11pt
    const scaleFactor = fontSize / 11;
    return baseWidth * scaleFactor;
  };

  // Calcola larghezza massima
  let maxWidth = 0;
  
  for (const valore of valori) {
    const strValore = String(valore || "");
    let larghezzaRiga = 0;
    
    // Calcola larghezza per ogni carattere
    for (const char of strValore) {
      larghezzaRiga += getLarghezzaCarattere(char);
    }
    
    maxWidth = Math.max(maxWidth, larghezzaRiga);
  }

  // Aggiungi padding e limita tra 60 e 450 punti
  const larghezzaFinale = Math.min(450, Math.max(60, maxWidth + PADDING));
  
  return larghezzaFinale;
}

/**
 * Ottiene l'indice di una tabella nel documento
 * @param {Table} tabella - Tabella da trovare
 * @return {number} Indice della tabella nel corpo o -1 se non trovata
 * @private
 */
_ottieniIndiceTabella(tabella) {
  if (!this._corpoCorrente || !tabella) return -1;
  
  const numChildren = this._corpoCorrente.getNumChildren();
  
  for (let i = 0; i < numChildren; i++) {
    const child = this._corpoCorrente.getChild(i);
    if (child.getType() === DocumentApp.ElementType.TABLE) {
      const tabellaCorrente = child.asTable();
      // Confronto strutturale: verifica numero di righe e altre proprietà se necessario
      if (tabellaCorrente.getNumRows() === tabella.getNumRows()) {
        // Se necessario, aggiungi più controlli per confermare che è la stessa tabella
        const sonoStessaTabella = true; // Semplificato per questo esempio
        if (sonoStessaTabella) {
          return i;
        }
      }
    }
  }
  
  return -1;
}

/**
 * Filtra attributi non sicuri da un oggetto di stile
 * @param {Object} attributi - Attributi da filtrare
 * @return {Object} Attributi filtrati sicuri
 * @private
 */
_filtroAttributiSicuri(attributi) {
  if (!attributi || typeof attributi !== 'object') return {};
  
  const attributiSicuri = {};
  const allowedAttributes = [
    'bold', 'italic', 'underline', 'fontSize', 'fontFamily',
    'foregroundColor', 'backgroundColor', 'alignment',
    'heading', 'verticalAlignment', 'horizontalAlignment',
    'padding'
  ];
  
  for (const attr of allowedAttributes) {
    if (attributi[attr] !== undefined) {
      attributiSicuri[attr] = attributi[attr];
    }
  }
  
  return attributiSicuri;
}
}