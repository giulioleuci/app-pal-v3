/**
 * Servizio ottimizzato per la gestione dei fogli di calcolo Google
 * Implementa strategie di batch, ottimizzazione range e gestione risorse
 * Utilizza pattern API fluent per concatenazione metodi
 */
class MySpreadsheetService extends MyGoogleService {
  /**
   * Costruttore del servizio
   * @param {MyLoggerService} logger - Servizio di logging
   * @param {MyCacheService} cache - Servizio di cache
   * @param {MyUtilsService} utils - Servizio di utilità
   */
  constructor(logger, cache, utils) {
    super(logger, cache, utils);
    this._prefissoCache = 'spreadsheet';
    this._tempoScadenzaCache = 300; // 5 minuti
    this._exceptionService = new MyExceptionService(logger);
    this._maxRetries = 3; // Default retries for exception handling
    
    // Sistema operazioni in batch
    this._batchWriteBuffer = {}; // Buffer per operazioni di scrittura
    this._batchReadBuffer = {}; // Buffer per operazioni di lettura
    this._maxBatchSize = 100; // Dimensione massima per ogni batch
    this._batchTimeout = 10; // Millisecondi di attesa prima di eseguire batch
    
    // Sistema throttling e gestione quota
    this._throttleStatus = {
      requestsThisMinute: 0,
      lastResetTime: new Date().getTime(),
      maxRequestsPerMinute: 60, // Configurabile in base alle esigenze
      pauseThreshold: 50 // Soglia per iniziare a rallentare
    };
    
    // Stato per pattern fluent
    this._risultatoUltimaOperazione = null;
    this._ultimoErrore = null;
    this._spreadsheetCorrente = null;
  }

  /**
   * Ottiene l'ultimo errore verificatosi
   * @return {Error} Oggetto errore
   */
  ottieniUltimoErrore() { 
    return this._ultimoErrore; 
  }
  
  /**
   * Ottiene il risultato dell'ultima operazione
   * @return {*} Risultato
   */
  ottieniRisultato() { 
    return this._risultatoUltimaOperazione; 
  }
  
  /**
   * Ottiene il foglio di calcolo corrente
   * @return {Spreadsheet} Foglio di calcolo corrente
   */
  ottieniSpreadsheet() { 
    return this._spreadsheetCorrente; 
  }

  /**
   * Esegue un'operazione con gestione errori
   * @param {Function} operazione - Funzione da eseguire
   * @param {string} descrizione - Descrizione dell'operazione
   * @return {MySpreadsheetService} this per chiamate fluent
   * @private
   */
  _eseguiOperazione(operazione, descrizione = "") {
    try {
      const risultato = operazione();
      this._risultatoUltimaOperazione = risultato;
      this._ultimoErrore = null;
      return this;
    } catch (e) {
      this._logger.error(`Errore in ${descrizione}: ${e.message}`);
      this._ultimoErrore = e;
      this._risultatoUltimaOperazione = null;
      return this;
    }
  }

  /**
   * Apre il foglio di calcolo attivo
   * @return {MySpreadsheetService} this per chiamate fluent
   */
  apriFoglioAttivo() {
    return this._eseguiOperazione(() => {
      const spreadsheet = this._exceptionService.eseguiConBypass(
        () => SpreadsheetApp.getActiveSpreadsheet(),
        {},
        null
      );
      this._spreadsheetCorrente = spreadsheet;
      return spreadsheet;
    }, "apertura foglio attivo");
  }

  /**
   * Apre un foglio di calcolo Google
   * @param {string} idFoglio - ID del foglio di calcolo
   * @param {boolean} apiAvanzate - Usa API avanzate se true
   * @return {MySpreadsheetService} this per chiamate fluent
   */
  apri(idFoglio, apiAvanzate = true) {
    return this._eseguiOperazione(() => {
      if (apiAvanzate && this._verificaServizioAvanzato('Sheets')) {
        // Verifica l'accesso usando le API avanzate (più efficiente)
        this._exceptionService.eseguiConRetry(
          () => {
            this._controllaQuota();
            return Sheets.Spreadsheets.get(idFoglio, { fields: 'spreadsheetId' });
          }, 
          { idFoglio },
          this._maxRetries
        );
      }
      
      // SpreadsheetApp per apertura effettiva (entrambi i casi)
      const spreadsheet = SpreadsheetApp.openById(idFoglio);
      this._spreadsheetCorrente = spreadsheet;
      return spreadsheet;
    }, "apertura foglio");
  }

  /**
   * Ottiene le schede di un foglio di calcolo
   * @param {Spreadsheet} foglio - Foglio di calcolo Google
   * @param {boolean} apiAvanzate - Usa API avanzate se true
   * @return {MySpreadsheetService} this per chiamate fluent
   */
  ottieniSchede(foglio, apiAvanzate = true) {
    return this._eseguiOperazione(() => {
      const idFoglio = foglio.getId();
      
      if (apiAvanzate && this._verificaServizioAvanzato('Sheets')) {
        const risposta = this._exceptionService.eseguiConRetry(
          () => {
            this._controllaQuota();
            return Sheets.Spreadsheets.get(idFoglio, {
              fields: 'sheets.properties'
            });
          },
          { idFoglio },
          this._maxRetries
        );
        
        if (!risposta.sheets) return [];
        
        return risposta.sheets.map(sheet => ({
          id: sheet.properties.sheetId,
          nome: sheet.properties.title,
          indice: sheet.properties.index,
          nascosta: sheet.properties.hidden || false,
          colore: sheet.properties.tabColor
        }));
      } else {
        const schede = foglio.getSheets();
        
        return schede.map(sheet => ({
          id: sheet.getSheetId(),
          nome: sheet.getName(),
          indice: sheet.getIndex(),
          nascosta: sheet.isSheetHidden(),
          colore: null // Non disponibile in SpreadsheetApp
        }));
      }
    }, "ottenimento schede");
  }

  /**
   * Ottiene una scheda per nome
   * @param {Spreadsheet} foglio - Foglio di calcolo Google
   * @param {string} nomeScheda - Nome della scheda
   * @param {boolean} apiAvanzate - Usa API avanzate se true
   * @return {MySpreadsheetService} this per chiamate fluent
   */
  ottieniSchedaPerNome(foglio, nomeScheda, apiAvanzate = true) {
    return this._eseguiOperazione(() => {
      // Otteniamo tutte le schede
      const schedeResult = this.ottieniSchede(foglio, apiAvanzate).ottieniRisultato();
      
      if (!schedeResult) return null;
      
      // Cerca la scheda per nome
      for (let i = 0; i < schedeResult.length; i++) {
        if (schedeResult[i].nome === nomeScheda) {
          return schedeResult[i];
        }
      }
      
      return null;
    }, "ottenimento scheda per nome");
  }

  /**
   * Crea una nuova scheda
   * @param {Spreadsheet} foglio - Foglio di calcolo Google
   * @param {string} nomeScheda - Nome della nuova scheda
   * @param {number} indice - Posizione della scheda (0-based)
   * @param {boolean} apiAvanzate - Usa API avanzate se true
   * @return {MySpreadsheetService} this per chiamate fluent
   */
  creaScheda(foglio, nomeScheda, indice = null, apiAvanzate = true) {
    return this._eseguiOperazione(() => {
      const idFoglio = foglio.getId();
      
      if (apiAvanzate && this._verificaServizioAvanzato('Sheets')) {
        const richiesta = {
          addSheet: {
            properties: {
              title: nomeScheda
            }
          }
        };
        
        if (indice !== null) {
          richiesta.addSheet.properties.index = indice;
        }
        
        return this._exceptionService.eseguiConRetry(
          () => {
            this._controllaQuota();
            return Sheets.Spreadsheets.batchUpdate({
              requests: [richiesta]
            }, idFoglio);
          },
          { idFoglio, nomeScheda },
          this._maxRetries
        );
      } else {
        if (indice !== null) {
          return foglio.insertSheet(nomeScheda, indice);
        } else {
          return foglio.insertSheet(nomeScheda);
        }
      }
    }, "creazione scheda");
  }

  /**
   * Elimina una scheda
   * @param {Spreadsheet} foglio - Foglio di calcolo Google
   * @param {string|number} idONomeScheda - ID o nome della scheda da eliminare
   * @param {boolean} apiAvanzate - Usa API avanzate se true
   * @return {MySpreadsheetService} this per chiamate fluent
   */
  eliminaScheda(foglio, idONomeScheda, apiAvanzate = true) {
    return this._eseguiOperazione(() => {
      const idFoglio = foglio.getId();
      let sheetId;
      
      // Se è fornito un nome, ottieni l'ID
      if (typeof idONomeScheda === 'string') {
        const scheda = this.ottieniSchedaPerNome(foglio, idONomeScheda, apiAvanzate).ottieniRisultato();
        
        if (!scheda) {
          throw new Error(`Scheda con nome ${idONomeScheda} non trovata`);
        }
        
        sheetId = scheda.id;
      } else {
        sheetId = idONomeScheda;
      }
      
      if (apiAvanzate && this._verificaServizioAvanzato('Sheets')) {
        return this._exceptionService.eseguiConRetry(
          () => {
            this._controllaQuota();
            Sheets.Spreadsheets.batchUpdate({
              requests: [{
                deleteSheet: {
                  sheetId: sheetId
                }
              }]
            }, idFoglio);
            return true;
          },
          { idFoglio, sheetId },
          this._maxRetries
        );
      } else {
        if (typeof idONomeScheda === 'string') {
          // Elimina per nome
          const scheda = foglio.getSheetByName(idONomeScheda);
          
          if (!scheda) {
            throw new Error(`Scheda con nome ${idONomeScheda} non trovata`);
          }
          
          foglio.deleteSheet(scheda);
        } else {
          // Elimina per ID
          const schede = foglio.getSheets();
          let schedaDaEliminare = null;
          
          for (let i = 0; i < schede.length; i++) {
            if (schede[i].getSheetId() === sheetId) {
              schedaDaEliminare = schede[i];
              break;
            }
          }
          
          if (!schedaDaEliminare) {
            throw new Error(`Scheda con ID ${sheetId} non trovata`);
          }
          
          foglio.deleteSheet(schedaDaEliminare);
        }
        return true;
      }
    }, "eliminazione scheda");
  }

  /**
   * Rinomina una scheda
   * @param {Spreadsheet} foglio - Foglio di calcolo Google
   * @param {string|number} idONomeScheda - ID o nome della scheda da rinominare
   * @param {string} nuovoNome - Nuovo nome della scheda
   * @param {boolean} apiAvanzate - Usa API avanzate se true
   * @return {MySpreadsheetService} this per chiamate fluent
   */
  rinominaScheda(foglio, idONomeScheda, nuovoNome, apiAvanzate = true) {
    return this._eseguiOperazione(() => {
      const idFoglio = foglio.getId();
      let sheetId;
      
      // Se è fornito un nome, ottieni l'ID
      if (typeof idONomeScheda === 'string') {
        const scheda = this.ottieniSchedaPerNome(foglio, idONomeScheda, apiAvanzate).ottieniRisultato();
        
        if (!scheda) {
          throw new Error(`Scheda con nome ${idONomeScheda} non trovata`);
        }
        
        sheetId = scheda.id;
      } else {
        // Se è fornito un ID, usiamo quello direttamente
        sheetId = idONomeScheda;
      }
      
      if (apiAvanzate && this._verificaServizioAvanzato('Sheets')) {
        return this._exceptionService.eseguiConRetry(
          () => {
            this._controllaQuota();
            Sheets.Spreadsheets.batchUpdate({
              requests: [{
                updateSheetProperties: {
                  properties: {
                    sheetId: sheetId,
                    title: nuovoNome
                  },
                  fields: 'title'
                }
              }]
            }, idFoglio);
            return true;
          },
          { idFoglio, sheetId, nuovoNome },
          this._maxRetries
        );
      } else {
        if (typeof idONomeScheda === 'string') {
          // Rinomina per nome
          const scheda = foglio.getSheetByName(idONomeScheda);
          
          if (!scheda) {
            throw new Error(`Scheda con nome ${idONomeScheda} non trovata`);
          }
          
          scheda.setName(nuovoNome);
        } else {
          // Rinomina per ID
          const schede = foglio.getSheets();
          let schedaDaRinominare = null;
          
          for (let i = 0; i < schede.length; i++) {
            if (schede[i].getSheetId() === sheetId) {
              schedaDaRinominare = schede[i];
              break;
            }
          }
          
          if (!schedaDaRinominare) {
            throw new Error(`Scheda con ID ${sheetId} non trovata`);
          }
          
          schedaDaRinominare.setName(nuovoNome);
        }
        return true;
      }
    }, "rinomina scheda");
  }

  /**
   * Ottiene i valori di un range
   * @param {Spreadsheet} foglio - Foglio di calcolo Google
   * @param {string} nomeScheda - Nome della scheda
   * @param {string} rangeA1 - Range in notazione A1
   * @param {boolean} apiAvanzate - Usa API avanzate se true
   * @return {MySpreadsheetService} this per chiamate fluent
   */
  ottieniValori(foglio, nomeScheda, rangeA1, apiAvanzate = true) {
    return this._eseguiOperazione(() => {
      const idFoglio = foglio.getId();
      
      // Aggiungi al batch di lettura
      const batchKey = `${idFoglio}_${nomeScheda}`;
      if (!this._batchReadBuffer[batchKey]) {
        this._batchReadBuffer[batchKey] = {
          idFoglio: idFoglio,
          nomeScheda: nomeScheda,
          ranges: [],
          timeoutId: null
        };
      }
      
      // Se il buffer è pieno, esegui direttamente
      if (this._batchReadBuffer[batchKey].ranges.length >= this._maxBatchSize) {
        return this._ottieniValoriDiretti(idFoglio, nomeScheda, rangeA1, apiAvanzate);
      }
      
      // Aggiungi al buffer
      this._batchReadBuffer[batchKey].ranges.push({
        rangeA1: rangeA1
      });
      
      // Esegui il batch se siamo al limite o dopo un breve timeout
      if (this._batchReadBuffer[batchKey].ranges.length === this._maxBatchSize) {
        this._eseguiBatchRead(batchKey, apiAvanzate);
      } else if (this._batchReadBuffer[batchKey].ranges.length === 1) {
        // Solo per la prima richiesta, esegui il batch dopo una breve attesa
        Utilities.sleep(this._batchTimeout);
        if (this._batchReadBuffer[batchKey] && this._batchReadBuffer[batchKey].ranges.length > 0) {
          this._eseguiBatchRead(batchKey, apiAvanzate);
        }
      }
      
      // Ottieni i valori direttamente
      return this._ottieniValoriDiretti(idFoglio, nomeScheda, rangeA1, apiAvanzate);
    }, "ottenimento valori");
  }
  
  /**
   * Ottiene valori direttamente, senza batch
   * @param {string} idFoglio - ID del foglio
   * @param {string} nomeScheda - Nome della scheda
   * @param {string} rangeA1 - Range in notazione A1
   * @param {boolean} apiAvanzate - Usa API avanzate se true
   * @return {Array} Matrice di valori
   * @private
   */
  _ottieniValoriDiretti(idFoglio, nomeScheda, rangeA1, apiAvanzate = true) {
    try {
      if (apiAvanzate && this._verificaServizioAvanzato('Sheets')) {
        const range = `${nomeScheda}!${rangeA1}`;
        
        const risposta = this._exceptionService.eseguiConRetry(
          () => {
            this._controllaQuota();
            return Sheets.Spreadsheets.Values.get(idFoglio, range, {
              valueRenderOption: 'UNFORMATTED_VALUE',
              dateTimeRenderOption: 'FORMATTED_STRING'
            });
          },
          { idFoglio, range },
          this._maxRetries
        );
        
        return risposta.values || [];
      } else {
        const funzioneLettura = () => {
          const foglio = SpreadsheetApp.openById(idFoglio);
          const scheda = foglio.getSheetByName(nomeScheda);
          
          if (!scheda) {
            throw new Error(`Scheda con nome ${nomeScheda} non trovata`);
          }
          
          const range = scheda.getRange(rangeA1);
          return range.getValues();
        };
        
        return this._exceptionService.eseguiConRetry(
          funzioneLettura,
          { idFoglio, nomeScheda, rangeA1 },
          this._maxRetries
        );
      }
    } catch (e) {
      this._logger.error(`Errore nell'ottenere i valori dal range ${nomeScheda}!${rangeA1}: ${e.message}`);
      return [];
    }
  }
  
  /**
   * Imposta i valori di un range
   * @param {Spreadsheet} foglio - Foglio di calcolo Google
   * @param {string} nomeScheda - Nome della scheda
   * @param {string} rangeA1 - Range in notazione A1
   * @param {Array} valori - Matrice di valori da impostare
   * @param {boolean} apiAvanzate - Usa API avanzate se true
   * @return {MySpreadsheetService} this per chiamate fluent
   */
  impostaValori(foglio, nomeScheda, rangeA1, valori, apiAvanzate = true) {
    return this._eseguiOperazione(() => {
      const idFoglio = foglio.getId();
      
      // Aggiungi al buffer di scrittura
      const batchKey = `${idFoglio}_write`;
      if (!this._batchWriteBuffer[batchKey]) {
        this._batchWriteBuffer[batchKey] = {
          idFoglio: idFoglio,
          updates: []
        };
      }
      
      this._batchWriteBuffer[batchKey].updates.push({
        range: `${nomeScheda}!${rangeA1}`,
        values: valori
      });
      
      // Esegui batch se raggiunta dimensione massima
      if (this._batchWriteBuffer[batchKey].updates.length >= this._maxBatchSize) {
        this._eseguiBatchWrite(batchKey, apiAvanzate);
      } else if (this._batchWriteBuffer[batchKey].updates.length === 1) {
        // Invece di usare setTimeout, usiamo uno sleep sincrono
        Utilities.sleep(this._batchTimeout);
        if (this._batchWriteBuffer[batchKey] && 
            this._batchWriteBuffer[batchKey].updates.length > 0) {
          this._eseguiBatchWrite(batchKey, apiAvanzate);
        }
      }
      
      return true;
    }, "impostazione valori");
  }

  /**
   * Cancella i valori di un range
   * @param {Spreadsheet} foglio - Foglio di calcolo Google
   * @param {string} nomeScheda - Nome della scheda
   * @param {string} rangeA1 - Range in notazione A1
   * @param {boolean} apiAvanzate - Usa API avanzate se true
   * @return {MySpreadsheetService} this per chiamate fluent
   */
  cancellaValori(foglio, nomeScheda, rangeA1, apiAvanzate = true) {
    return this._eseguiOperazione(() => {
      const idFoglio = foglio.getId();
      
      if (apiAvanzate && this._verificaServizioAvanzato('Sheets')) {
        const range = `${nomeScheda}!${rangeA1}`;
        
        return this._exceptionService.eseguiConRetry(
          () => {
            this._controllaQuota();
            Sheets.Spreadsheets.Values.clear({}, idFoglio, range);
            return true;
          },
          { idFoglio, range },
          this._maxRetries
        );
      } else {
        return this._exceptionService.eseguiConRetry(
          () => {
            const scheda = foglio.getSheetByName(nomeScheda);
            if (!scheda) {
              throw new Error(`Scheda con nome ${nomeScheda} non trovata`);
            }
            const range = scheda.getRange(rangeA1);
            range.clearContent();
            return true;
          },
          { nomeScheda, rangeA1 },
          this._maxRetries
        );
      }
    }, "cancellazione valori");
  }

  /**
   * Esegue un batch di letture
   * @param {string} batchKey - Chiave identificativa del batch
   * @param {boolean} apiAvanzate - Usa API avanzate se true
   * @return {MySpreadsheetService} this per chiamate fluent
   * @private
   */
  _eseguiBatchRead(batchKey, apiAvanzate = true) {
    return this._eseguiOperazione(() => {
      if (!this._batchReadBuffer[batchKey] || 
          this._batchReadBuffer[batchKey].ranges.length === 0) {
        return null;
      }
      
      // Pulisci eventuali timeout
      if (this._batchReadBuffer[batchKey].timeoutId) {
        clearTimeout(this._batchReadBuffer[batchKey].timeoutId);
      }
      
      const batch = this._batchReadBuffer[batchKey];
      const idFoglio = batch.idFoglio;
      const nomeScheda = batch.nomeScheda;
      
      // Copia ranges e resolve per sicurezza
      const ranges = [...batch.ranges];
      
      // Resetta il buffer
      delete this._batchReadBuffer[batchKey];
      
      const eseguiBatchReadFn = () => {
        if (apiAvanzate && this._verificaServizioAvanzato('Sheets')) {
          // Prepara ranges per batch get
          const rangesRaw = ranges.map(r => r.rangeA1);
          
          // Crea un batch di richieste
          this._controllaQuota();
          return Sheets.Spreadsheets.Values.batchGet(idFoglio, {
            ranges: rangesRaw.map(r => `${nomeScheda}!${r}`),
            valueRenderOption: 'UNFORMATTED_VALUE',
            dateTimeRenderOption: 'FORMATTED_STRING',
            majorDimension: 'ROWS'
          });
        } else {
          // Fallback non-API: elabora ogni richiesta singolarmente
          const foglio = SpreadsheetApp.openById(idFoglio);
          const scheda = foglio.getSheetByName(nomeScheda);
          
          if (!scheda) {
            throw new Error(`Scheda con nome ${nomeScheda} non trovata`);
          }
          
          const results = [];
          for (const rangeObj of ranges) {
            results.push(scheda.getRange(rangeObj.rangeA1).getValues());
          }
          return results;
        }
      };
      
      // Usa ExceptionService per gestire errori e retry
      return this._exceptionService.eseguiConRetry(
        eseguiBatchReadFn,
        { idFoglio, nomeScheda, ranges },
        3 // numero fisso di tentativi
      );
    }, "esecuzione batch lettura");
  }
  
  /**
   * Esegue un batch di scritture
   * @param {string} batchKey - Chiave identificativa del batch
   * @param {boolean} apiAvanzate - Usa API avanzate se true
   * @return {MySpreadsheetService} this per chiamate fluent
   * @private
   */
  _eseguiBatchWrite(batchKey, apiAvanzate = true) {
    return this._eseguiOperazione(() => {
      if (!this._batchWriteBuffer[batchKey] || 
          this._batchWriteBuffer[batchKey].updates.length === 0) {
        return null;
      }
      
      const batch = this._batchWriteBuffer[batchKey];
      const idFoglio = batch.idFoglio;
      
      // Copia degli aggiornamenti per sicurezza
      const updates = [...batch.updates];
      
      // Resetta il buffer
      delete this._batchWriteBuffer[batchKey];
      
      const eseguiBatchWriteFn = (parametri) => {
        if (apiAvanzate && this._verificaServizioAvanzato('Sheets')) {
          // Prepara dati per batch update
          const data = updates.map(update => ({
            range: update.range,
            values: update.values
          }));
          
          this._controllaQuota();
          return Sheets.Spreadsheets.Values.batchUpdate({
            valueInputOption: 'USER_ENTERED',
            data: data
          }, idFoglio);
        } else {
          // Fallback non-API
          const foglio = SpreadsheetApp.openById(idFoglio);
          
          for (const update of updates) {
            const [nomeScheda, rangeA1] = update.range.split('!');
            const scheda = foglio.getSheetByName(nomeScheda);
            
            if (!scheda) {
              throw new Error(`Scheda con nome ${nomeScheda} non trovata`);
            }
            
            const range = scheda.getRange(rangeA1);
            range.setValues(update.values);
          }
          
          return updates;
        }
      };
      
      const gestioneErroreBatchWrite = (errore, parametri) => {
        this._logger.error(`Errore nell'esecuzione del batch di scrittura: ${errore.message}`);
        
        // In caso di errore, prova a eseguire singolarmente
        if (apiAvanzate && this._verificaServizioAvanzato('Sheets')) {
          let success = true;
          
          for (const update of updates) {
            try {
              this._exceptionService.eseguiConRetry(
                () => {
                  this._controllaQuota();
                  Sheets.Spreadsheets.Values.update({
                    values: update.values,
                    range: update.range
                  }, idFoglio, update.range, {
                    valueInputOption: 'USER_ENTERED'
                  });
                  return true;
                },
                { update },
                this._maxRetries
              );
            } catch (err) {
              this._logger.error(`Errore nell'aggiornamento singolo del range ${update.range}: ${err.message}`);
              success = false;
            }
          }
          
          return success;
        } else {
          let success = true;
          const foglio = SpreadsheetApp.openById(idFoglio);
          
          for (const update of updates) {
            try {
              const [nomeScheda, rangeA1] = update.range.split('!');
              const scheda = foglio.getSheetByName(nomeScheda);
              
              if (!scheda) {
                continue;
              }
              
              const range = scheda.getRange(rangeA1);
              range.setValues(update.values);
            } catch (err) {
              this._logger.error(`Errore nell'aggiornamento singolo del range ${update.range}: ${err.message}`);
              success = false;
            }
          }
          
          return success;
        }
      };
      
      // Usa ExceptionService per gestire errori e retry
      return this._exceptionService.eseguiConRetry(
        eseguiBatchWriteFn,
        { idFoglio, updates },
        this._maxRetries
      );
    }, "esecuzione batch scrittura");
  }

  /**
   * Controlla lo stato della quota API e attende se necessario
   * @return {MySpreadsheetService} this per chiamate fluent
   * @private
   */
  _controllaQuota() {
    return this._eseguiOperazione(() => {
      // Reset contatore se necessario
      const now = new Date().getTime();
      if (now - this._throttleStatus.lastResetTime > 60000) {
        this._throttleStatus.requestsThisMinute = 0;
        this._throttleStatus.lastResetTime = now;
      }
      
      // Incrementa contatore
      this._throttleStatus.requestsThisMinute++;
      
      // Controllo preventivo quota
      if (this._throttleStatus.requestsThisMinute >= this._throttleStatus.pauseThreshold) {
        const percentQuota = this._throttleStatus.requestsThisMinute / this._throttleStatus.maxRequestsPerMinute;
        
        // Se abbiamo superato il 90% della quota, rallentiamo
        if (percentQuota > 0.9) {
          const delay = Math.min(1000 * percentQuota, 5000);
          Utilities.sleep(delay);
          
          // Se siamo al limite, attendiamo il reset
          if (this._throttleStatus.requestsThisMinute >= this._throttleStatus.maxRequestsPerMinute) {
            const waitTime = 60000 - (now - this._throttleStatus.lastResetTime);
            if (waitTime > 0) {
              this._logger.warn(`Limite quota API raggiunto. Attesa: ${waitTime/1000}s`);
              Utilities.sleep(waitTime);
              this._throttleStatus.requestsThisMinute = 0;
              this._throttleStatus.lastResetTime = new Date().getTime();
            }
          }
        }
      }
      
      return true;
    }, "controllo quota");
  }

  /**
   * Forza l'esecuzione di tutti i batch pendenti
   * Utile alla fine di operazioni complesse o prima di chiudere il foglio
   * @return {MySpreadsheetService} this per chiamate fluent
   */
  flushBatch() {
    return this._eseguiOperazione(() => {
      // Esegui tutti i batch di scrittura
      for (const batchKey in this._batchWriteBuffer) {
        if (this._batchWriteBuffer[batchKey] && 
            this._batchWriteBuffer[batchKey].updates.length > 0) {
          this._eseguiBatchWrite(batchKey, true);
        }
      }
      
      // Esegui tutti i batch di lettura
      for (const batchKey in this._batchReadBuffer) {
        if (this._batchReadBuffer[batchKey] && 
            this._batchReadBuffer[batchKey].ranges.length > 0) {
          this._eseguiBatchRead(batchKey, true);
        }
      }
      
      return true;
    }, "flush batch");
  }

  /**
   * Salva e chiude un foglio di calcolo
   * @param {Spreadsheet} foglio - Foglio di calcolo Google da salvare e chiudere
   * @return {MySpreadsheetService} this per chiamate fluent
   */
  salvaEChiudi(foglio) {
    return this._eseguiOperazione(() => {
      // Esegui eventuali batch in sospeso
      this.flushBatch();
      
      // SpreadsheetApp.flush() per forzare l'invio di tutte le modifiche pendenti
      SpreadsheetApp.flush();
      return true;
    }, "salvataggio e chiusura foglio");
  }

  /**
   * Converte una notazione A1 in indici di riga e colonna
   * @param {string} rangeA1 - Range in notazione A1
   * @return {Object} Indici di riga e colonna
   * @private
   */
  _convertiA1InIndici(rangeA1) {
    let startRow, endRow, startCol, endCol;
    
    // Gestisce sia i range singoli che quelli multipli
    if (rangeA1.includes(':')) {
      const [startCell, endCell] = rangeA1.split(':');
      const startIndici = this._convertiCellaA1InIndici(startCell);
      const endIndici = this._convertiCellaA1InIndici(endCell);
      
      startRow = startIndici.row;
      startCol = startIndici.col;
      endRow = endIndici.row + 1; // aggiungiamo 1 perché gli indici API sono esclusivi
      endCol = endIndici.col + 1;
    } else {
      const indici = this._convertiCellaA1InIndici(rangeA1);
      startRow = indici.row;
      startCol = indici.col;
      endRow = startRow + 1;
      endCol = startCol + 1;
    }
    
    return {
      startRow: startRow,
      endRow: endRow,
      startCol: startCol,
      endCol: endCol
    };
  }

  /**
   * Converte una cella in notazione A1 in indici di riga e colonna
   * @param {string} cellaA1 - Cella in notazione A1
   * @return {Object} Indici di riga e colonna
   * @private
   */
  _convertiCellaA1InIndici(cellaA1) {
    let match;
    
    if (cellaA1.includes(':')) {
      throw new Error(`Formato cella non valido, contiene un range: ${cellaA1}`);
    }
    
    // Supporto per range speciali come "A:Z" (intere colonne)
    if (/^[A-Z]+:[A-Z]+$/.test(cellaA1)) {
      const [startCol, endCol] = cellaA1.split(':');
      return {
        row: 0,
        col: this._convertiColonnaA1InIndice(startCol),
        isEntireColumn: true,
        endCol: this._convertiColonnaA1InIndice(endCol)
      };
    }
    
    // Supporto per range speciali come "1:10" (intere righe)
    if (/^[0-9]+:[0-9]+$/.test(cellaA1)) {
      const [startRow, endRow] = cellaA1.split(':').map(n => parseInt(n) - 1);
      return {
        row: startRow,
        col: 0,
        isEntireRow: true,
        endRow: endRow
      };
    }
    
    // Pattern standard "A1"
    match = cellaA1.match(/([A-Z]+)([0-9]+)/);
    
    if (!match) {
      throw new Error(`Formato cella non valido: ${cellaA1}`);
    }
    
    const colA1 = match[1];
    const rowA1 = match[2];
    
    // Converti la colonna da A1 a 0-based
    const col = this._convertiColonnaA1InIndice(colA1);
    
    // Converti la riga da A1 a 0-based
    const row = parseInt(rowA1) - 1;
    
    return { row, col };
  }
  
  /**
   * Converte una colonna A1 in indice
   * @param {string} colA1 - Colonna in formato A1
   * @return {number} Indice colonna (0-based)
   * @private
   */
  _convertiColonnaA1InIndice(colA1) {
    let col = 0;
    for (let i = 0; i < colA1.length; i++) {
      col = col * 26 + (colA1.charCodeAt(i) - 64);
    }
    return col - 1; // 0-based
  }

  /**
   * Converte indici di riga e colonna in notazione A1
   * @param {number} riga - Indice di riga (0-based)
   * @param {number} colonna - Indice di colonna (0-based)
   * @return {string} Cella in notazione A1
   */
  convertiIndiciInA1(riga, colonna) {
    return this._eseguiOperazione(() => {
      // Converti la colonna da 0-based a A1
      let colA1 = '';
      let col = colonna + 1; // 1-based per il calcolo
      
      while (col > 0) {
        const modulo = (col - 1) % 26;
        colA1 = String.fromCharCode(65 + modulo) + colA1;
        col = Math.floor((col - modulo) / 26);
      }
      
      // Converti la riga da 0-based a A1
      const rowA1 = riga + 1;
      
      return colA1 + rowA1;
    }, "conversione indici in A1");
  }

  /**
   * Configura i parametri del servizio
   * @param {Object} config - Oggetto di configurazione
   * @return {MySpreadsheetService} Istanza del servizio per chiamate fluent
   */
  configura(config) {
    return this._eseguiOperazione(() => {
      if (config.maxBatchSize !== undefined) {
        this._maxBatchSize = config.maxBatchSize;
      }
      
      if (config.batchTimeout !== undefined) {
        this._batchTimeout = config.batchTimeout;
      }
      
      if (config.maxRequestsPerMinute !== undefined) {
        this._throttleStatus.maxRequestsPerMinute = config.maxRequestsPerMinute;
      }
      
      if (config.pauseThreshold !== undefined) {
        this._throttleStatus.pauseThreshold = config.pauseThreshold;
      }
      
      return config;
    }, "configurazione");
  }









/**
 * Protegge una scheda completa.
 * PRIMA RIMUOVE tutte le altre protezioni sulla scheda per evitare conflitti.
 * @param {GoogleAppsScript.Spreadsheet.Sheet|string} scheda - Sheet object o nome scheda
 * @param {Array<string>} arrayEmail - Array email degli editor autorizzati
 * @param {string} [descrizione] - Descrizione opzionale della protezione
 * @returns {MySpreadsheetService} Per pattern fluent
 */
proteggiFoglio(scheda, arrayEmail, descrizione) {
  return this._eseguiOperazione(() => {
    if (!this._spreadsheetCorrente) {
      throw new Error('Nessun spreadsheet attivo');
    }
    
    const targetSheet = typeof scheda === 'string' 
      ? this._spreadsheetCorrente.getSheetByName(scheda) 
      : scheda;
    
    if (!targetSheet) {
      throw new Error(`Scheda non trovata: ${scheda}`);
    }

    // **LOGICA DI SICUREZZA CRUCIALE**
    // Rimuove tutte le protezioni esistenti su questo foglio prima di applicarne una nuova a livello di foglio.
    const protezioniEsistenti = targetSheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);
    protezioniEsistenti.forEach(p => p.remove());
    
    const protezione = targetSheet.protect();
    protezione.setDescription(descrizione || `Protezione foglio ${targetSheet.getName()}`);
    protezione.removeEditors(protezione.getEditors()); // Rimuove tutti, incluso il proprietario
    if (arrayEmail.length > 0) {
      protezione.addEditors(arrayEmail);
    }
    // Il proprietario può sempre modificare le protezioni, ma non il foglio se non è nella lista.
    
    this._logger.info(`Foglio protetto: ${targetSheet.getName()}, Editor: ${arrayEmail.join(', ')}`);
    return this;
  }, "protezione foglio");
}

/**
 * Protegge un range specificato in modo IDEMPOTENTE.
 * Se esiste già una protezione su quel range esatto, la sostituisce.
 * @param {string} rangeA1 - Notazione A1 del range (es. "A1:C10" o "B:B")
 * @param {Array<string>} arrayEmail - Array email degli editor autorizzati
 * @param {string} [descrizione] - Descrizione opzionale della protezione
 * @returns {MySpreadsheetService} Per pattern fluent
 */
proteggiRange(rangeA1, arrayEmail, descrizione) {
  return this._eseguiOperazione(() => {
    if (!this._spreadsheetCorrente) {
      throw new Error('Nessun spreadsheet attivo');
    }
    
    const range = this._spreadsheetCorrente.getRange(rangeA1);
    const sheet = range.getSheet();

    // **LOGICA DI SICUREZZA CRUCIALE**
    // Rimuove eventuali protezioni esistenti ESATTAMENTE su questo range.
    const protezioniEsistenti = sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE);
    protezioniEsistenti.forEach(p => {
      if (p.getRange().getA1Notation() === rangeA1) {
        p.remove();
      }
    });

    // Se l'array di editor è vuoto, non creiamo nessuna protezione.
    if (!arrayEmail || arrayEmail.length === 0) {
        this._logger.info(`Nessun editor fornito per il range ${rangeA1}. Nessuna protezione applicata.`);
        return this;
    }

    const protezione = range.protect();
    protezione.setDescription(descrizione || `Protezione range ${rangeA1}`);
    protezione.removeEditors(protezione.getEditors()); // Rimuove tutti
    protezione.addEditors(arrayEmail);
    
    this._logger.info(`Range protetto: ${rangeA1}, Editor: ${arrayEmail.join(', ')}`);
    return this;
  }, "protezione range");
}





/**
 * Protegge multipli range con protezioni personalizzate
 * @param {Array<string>} rangeA1Array - Array di notazioni A1
 * @param {Array<Array<string>>} arrayDiArrayEmail - Array di array email corrispondenti
 * @param {string} [descrizione] - Descrizione base opzionale
 * @returns {MySpreadsheetService} Per pattern fluent
 */
proteggiRangeMultipli(rangeA1Array, arrayDiArrayEmail, descrizione) {
  return this._eseguiOperazione(() => {
    if (!this._spreadsheetCorrente) {
      throw new Error('Nessun spreadsheet attivo');
    }
    
    if (rangeA1Array.length !== arrayDiArrayEmail.length) {
      throw new Error('Range e array email devono avere la stessa lunghezza');
    }
    
    const spreadsheetId = this._spreadsheetCorrente.getId();
    const richieste = [];
    
    // Prepara tutte le richieste
    rangeA1Array.forEach((rangeA1, index) => {
      const arrayEmail = arrayDiArrayEmail[index];
      const emailsFiltrate = arrayEmail.filter(Boolean);
      
      if (emailsFiltrate.length === 0) {
        this._logger.warn(`Saltato range ${rangeA1}: nessun email valido`);
        return;
      }
      
      const range = this._spreadsheetCorrente.getRange(rangeA1);
      const sheet = range.getSheet();
      const sheetId = sheet.getSheetId();
      
      const startRow = range.getRow() - 1;
      const endRow = startRow + range.getNumRows();
      const startCol = range.getColumn() - 1;
      const endCol = startCol + range.getNumColumns();
      
      richieste.push({
        addProtectedRange: {
          protectedRange: {
            range: {
              sheetId: sheetId,
              startRowIndex: startRow,
              endRowIndex: endRow,
              startColumnIndex: startCol,
              endColumnIndex: endCol
            },
            description: descrizione ? `${descrizione} - ${rangeA1}` : `Protezione ${rangeA1}`,
            editors: { users: emailsFiltrate },
            requestingUserCanEdit: false
          }
        }
      });
    });
    
    if (richieste.length === 0) {
      throw new Error('Nessuna protezione valida da applicare');
    }
    
    // Esegui in batch per performance
    this._eseguiBatchProtezioni(spreadsheetId, richieste);
    
    this._logger.info(`Protezioni multiple applicate: ${richieste.length} range`);
    
    return this;
  });
}

/**
 * Rimuove protezione da una scheda completa
 * @param {GoogleAppsScript.Spreadsheet.Sheet|string} scheda - Sheet object o nome scheda
 * @returns {MySpreadsheetService} Per pattern fluent
 */
rimuoviProtezioneFoglio(scheda) {
  return this._eseguiOperazione(() => {
    if (!this._spreadsheetCorrente) {
      throw new Error('Nessun spreadsheet attivo');
    }
    
    const targetSheet = typeof scheda === 'string' 
      ? this._spreadsheetCorrente.getSheetByName(scheda) 
      : scheda;
    
    if (!targetSheet) {
      throw new Error(`Scheda non trovata: ${scheda}`);
    }
    
    const sheetId = targetSheet.getSheetId();
    const spreadsheetId = this._spreadsheetCorrente.getId();
    
    // Ottieni protezioni tramite API v4
    const rispostaSpreadsheet = Sheets.Spreadsheets.get(spreadsheetId);
    const protezioniSheet = [];
    
    if (rispostaSpreadsheet.sheets) {
      rispostaSpreadsheet.sheets.forEach(sheet => {
        if (sheet.properties.sheetId === sheetId && sheet.protectedRanges) {
          sheet.protectedRanges.forEach(protezione => {
            // Solo protezioni di foglio completo (senza startRow/endRow specifici oltre il foglio)
            if (!protezione.range.startRowIndex && !protezione.range.endRowIndex) {
              protezioniSheet.push(protezione.protectedRangeId);
            }
          });
        }
      });
    }
    
    const richieste = protezioniSheet.map(protectedRangeId => ({
      deleteProtectedRange: { protectedRangeId }
    }));
    
    if (richieste.length > 0) {
      Sheets.Spreadsheets.batchUpdate({
        requests: richieste
      }, spreadsheetId);
    }
    
    this._logger.info(`Protezioni rimosse dal foglio: ${targetSheet.getName()}`);
    
    return this;
  });
}

/**
 * Rimuove protezione da un range specifico
 * @param {string} rangeA1 - Notazione A1 del range
 * @returns {MySpreadsheetService} Per pattern fluent
 */
rimuoviProtezioneRange(rangeA1) {
  return this._eseguiOperazione(() => {
    if (!this._spreadsheetCorrente) {
      throw new Error('Nessun spreadsheet attivo');
    }
    
    const range = this._spreadsheetCorrente.getRange(rangeA1);
    const sheet = range.getSheet();
    const sheetId = sheet.getSheetId();
    const spreadsheetId = this._spreadsheetCorrente.getId();
    
    // Coordinate target del range
    const startRow = range.getRow() - 1;
    const endRow = startRow + range.getNumRows();
    const startCol = range.getColumn() - 1;
    const endCol = startCol + range.getNumColumns();
    
    // Ottieni protezioni tramite API v4
    const rispostaSpreadsheet = Sheets.Spreadsheets.get(spreadsheetId);
    const protezioniRange = [];
    
    if (rispostaSpreadsheet.sheets) {
      rispostaSpreadsheet.sheets.forEach(sheetData => {
        if (sheetData.properties.sheetId === sheetId && sheetData.protectedRanges) {
          sheetData.protectedRanges.forEach(protezione => {
            const protRange = protezione.range;
            // Confronta coordinate esatte
            if (protRange.startRowIndex === startRow &&
                protRange.endRowIndex === endRow &&
                protRange.startColumnIndex === startCol &&
                protRange.endColumnIndex === endCol) {
              protezioniRange.push(protezione.protectedRangeId);
            }
          });
        }
      });
    }
    
    const richieste = protezioniRange.map(protectedRangeId => ({
      deleteProtectedRange: { protectedRangeId }
    }));
    
    if (richieste.length > 0) {
      Sheets.Spreadsheets.batchUpdate({
        requests: richieste
      }, spreadsheetId);
    }
    
    this._logger.info(`Protezioni rimosse dal range: ${rangeA1}`);
    
    return this;
  });
}

/**
 * Ottiene tutte le protezioni attive
 * @param {string} [tipo] - 'SHEET' o 'RANGE', ometti per entrambi
 * @returns {Array<Object>} Array delle protezioni trovate
 */
ottieniProtezioni(tipo) {
  try {
    if (!this._spreadsheetCorrente) {
      throw new Error('Nessun spreadsheet attivo');
    }
    
    const spreadsheetId = this._spreadsheetCorrente.getId();
    const rispostaSpreadsheet = Sheets.Spreadsheets.get(spreadsheetId);
    const risultato = [];
    
    if (!rispostaSpreadsheet.sheets) {
      this._logger.debug(`Trovate 0 protezioni tipo: ${tipo || 'ALL'}`);
      this._risultatoUltimaOperazione = risultato;
      return risultato;
    }
    
    rispostaSpreadsheet.sheets.forEach(sheetData => {
      const nomeSheet = sheetData.properties.title;
      
      if (sheetData.protectedRanges) {
        sheetData.protectedRanges.forEach(protezione => {
          const protRange = protezione.range;
          const isSheetProtection = !protRange.startRowIndex && !protRange.endRowIndex && 
                                  !protRange.startColumnIndex && !protRange.endColumnIndex;
          
          const tipoProtezione = isSheetProtection ? 'SHEET' : 'RANGE';
          
          // Filtra per tipo se specificato
          if (tipo && tipo !== tipoProtezione) {
            return;
          }
          
          let rangeA1 = null;
          if (tipoProtezione === 'RANGE') {
            // Converti coordinate in notazione A1
            const startRow = (protRange.startRowIndex || 0) + 1;
            const endRow = protRange.endRowIndex || sheetData.properties.gridProperties.rowCount;
            const startCol = (protRange.startColumnIndex || 0) + 1;
            const endCol = protRange.endColumnIndex || sheetData.properties.gridProperties.columnCount;
            
            rangeA1 = `${this._convertColNumToA1(startCol)}${startRow}:${this._convertColNumToA1(endCol)}${endRow}`;
          }
          
          risultato.push({
            id: protezione.protectedRangeId,
            tipo: tipoProtezione,
            foglio: nomeSheet,
            descrizione: protezione.description || '',
            editor: protezione.editors ? protezione.editors.users || [] : [],
            canEdit: !protezione.requestingUserCanEdit,
            range: rangeA1
          });
        });
      }
    });
    
    this._logger.debug(`Trovate ${risultato.length} protezioni tipo: ${tipo || 'ALL'}`);
    this._risultatoUltimaOperazione = risultato;
    this._ultimoErrore = null;
    
    return risultato;
    
  } catch (errore) {
    this._logger.error(`Errore in ottieniProtezioni: ${errore.message}`);
    this._ultimoErrore = errore;
    this._risultatoUltimaOperazione = [];
    return [];
  }
}

/**
 * Configura editor autorizzati su protezione esistente tramite ID
 * @param {number} protectedRangeId - ID della protezione
 * @param {Array<string>} arrayEmail - Nuovi editor autorizzati
 * @returns {MySpreadsheetService} Per pattern fluent
 */
impostaEditorProtezione(protectedRangeId, arrayEmail) {
  return this._eseguiOperazione(() => {
    if (!this._spreadsheetCorrente) {
      throw new Error('Nessun spreadsheet attivo');
    }
    
    const emailsFiltrate = arrayEmail.filter(Boolean);
    
    if (emailsFiltrate.length === 0) {
      throw new Error('Nessun email valido fornito');
    }
    
    const richiesta = {
      updateProtectedRange: {
        protectedRange: {
          protectedRangeId: protectedRangeId,
          editors: { users: emailsFiltrate }
        },
        fields: 'editors'
      }
    };
    
    Sheets.Spreadsheets.batchUpdate({
      requests: [richiesta]
    }, this._spreadsheetCorrente.getId());
    
    this._logger.info(`Editor aggiornati per protezione ${protectedRangeId}: ${emailsFiltrate.length} utenti`);
    
    return this;
  });
}

/**
 * Rimuove tutti gli editor da una protezione tramite ID
 * @param {number} protectedRangeId - ID della protezione
 * @returns {MySpreadsheetService} Per pattern fluent
 */
rimuoviTuttiEditorProtezione(protectedRangeId) {
  return this._eseguiOperazione(() => {
    if (!this._spreadsheetCorrente) {
      throw new Error('Nessun spreadsheet attivo');
    }
    
    const richiesta = {
      updateProtectedRange: {
        protectedRange: {
          protectedRangeId: protectedRangeId,
          editors: { users: [] }
        },
        fields: 'editors'
      }
    };
    
    Sheets.Spreadsheets.batchUpdate({
      requests: [richiesta]
    }, this._spreadsheetCorrente.getId());
    
    this._logger.info(`Rimossi tutti gli editor dalla protezione ${protectedRangeId}`);
    
    return this;
  });
}

/**
 * Trova protezione specifica per un range
 * @param {string} rangeA1 - Notazione A1 del range
 * @returns {Object|null} Dati protezione trovata o null
 */
ottieniProtezionePerRange(rangeA1) {
  try {
    if (!this._spreadsheetCorrente) {
      throw new Error('Nessun spreadsheet attivo');
    }
    
    const range = this._spreadsheetCorrente.getRange(rangeA1);
    const sheet = range.getSheet();
    const sheetId = sheet.getSheetId();
    const spreadsheetId = this._spreadsheetCorrente.getId();
    
    // Coordinate target del range
    const startRow = range.getRow() - 1;
    const endRow = startRow + range.getNumRows();
    const startCol = range.getColumn() - 1;
    const endCol = startCol + range.getNumColumns();
    
    // Ottieni protezioni tramite API v4
    const rispostaSpreadsheet = Sheets.Spreadsheets.get(spreadsheetId);
    
    if (!rispostaSpreadsheet.sheets) {
      this._logger.debug(`Nessuna protezione trovata per range: ${rangeA1}`);
      this._risultatoUltimaOperazione = null;
      return null;
    }
    
    for (const sheetData of rispostaSpreadsheet.sheets) {
      if (sheetData.properties.sheetId === sheetId && sheetData.protectedRanges) {
        for (const protezione of sheetData.protectedRanges) {
          const protRange = protezione.range;
          // Confronta coordinate esatte
          if (protRange.startRowIndex === startRow &&
              protRange.endRowIndex === endRow &&
              protRange.startColumnIndex === startCol &&
              protRange.endColumnIndex === endCol) {
            
            this._logger.debug(`Protezione trovata per range: ${rangeA1}`);
            
            const risultato = {
              id: protezione.protectedRangeId,
              descrizione: protezione.description || '',
              editor: protezione.editors ? protezione.editors.users || [] : [],
              range: rangeA1,
              foglio: sheetData.properties.title
            };
            
            this._risultatoUltimaOperazione = risultato;
            this._ultimoErrore = null;
            
            return risultato;
          }
        }
      }
    }
    
    this._logger.debug(`Nessuna protezione trovata per range: ${rangeA1}`);
    this._risultatoUltimaOperazione = null;
    this._ultimoErrore = null;
    
    return null;
    
  } catch (errore) {
    this._logger.error(`Errore in ottieniProtezionePerRange: ${errore.message}`);
    this._ultimoErrore = errore;
    this._risultatoUltimaOperazione = null;
    return null;
  }
}

/**
 * Esegue operazioni batch per le protezioni con rate limiting
 * @param {string} spreadsheetId - ID del foglio di calcolo
 * @param {Array} richieste - Array di richieste da eseguire
 * @private
 */
_eseguiBatchProtezioni(spreadsheetId, richieste) {
  const maxBatchSize = 10;
  
  for (let i = 0; i < richieste.length; i += maxBatchSize) {
    const batch = richieste.slice(i, i + maxBatchSize);
    
    try {
      Sheets.Spreadsheets.batchUpdate({
        requests: batch
      }, spreadsheetId);
      
      this._logger.debug(`Batch protezioni ${Math.floor(i/maxBatchSize) + 1} eseguito: ${batch.length} richieste`);
      
      // Pausa tra batch per evitare rate limiting
      if (i + maxBatchSize < richieste.length) {
        Utilities.sleep(500);
      }
    } catch (errore) {
      this._logger.error(`Errore batch protezioni ${Math.floor(i/maxBatchSize) + 1}:`, errore);
      throw errore;
    }
  }
}


/**
 * Protegge multipli range con protezioni personalizzate.
 * @param {Array<string>} rangeA1Array - Array di notazioni A1.
 * @param {Array<Array<string>>} arrayDiArrayEmail - Array di array email corrispondenti.
 * @param {Array<string>|string} [descrizioni] - Array di descrizioni o una descrizione base.
 * @returns {MySpreadsheetService} Per pattern fluent.
 */
proteggiRangeMultipli(rangeA1Array, arrayDiArrayEmail, descrizioni) {
  return this._eseguiOperazione(() => {
    if (!this._spreadsheetCorrente) {
      throw new Error('Nessun spreadsheet attivo');
    }
    
    if (rangeA1Array.length !== arrayDiArrayEmail.length) {
      throw new Error('Range e array email devono avere la stessa lunghezza');
    }
    
    const spreadsheetId = this._spreadsheetCorrente.getId();
    const richieste = [];
    
    rangeA1Array.forEach((rangeA1, index) => {
      const arrayEmail = arrayDiArrayEmail[index];
      const emailsFiltrate = arrayEmail.filter(Boolean);
      
      if (emailsFiltrate.length === 0) {
        this._logger.warn(`Saltato range ${rangeA1}: nessun email valido`);
        return;
      }

      // *** CORREZIONE: Gestisce sia un array di descrizioni che una stringa singola ***
      const descrizione = Array.isArray(descrizioni) 
        ? (descrizioni[index] || `Protezione ${rangeA1}`)
        : (descrizioni ? `${descrizioni} - ${rangeA1}` : `Protezione ${rangeA1}`);
      
      const range = this._spreadsheetCorrente.getRange(rangeA1);
      const sheet = range.getSheet();
      const sheetId = sheet.getSheetId();
      
      const startRow = range.getRow() - 1;
      const endRow = startRow + range.getNumRows();
      const startCol = range.getColumn() - 1;
      const endCol = startCol + range.getNumColumns();
      
      richieste.push({
        addProtectedRange: {
          protectedRange: {
            range: {
              sheetId: sheetId,
              startRowIndex: startRow,
              endRowIndex: endRow,
              startColumnIndex: startCol,
              endColumnIndex: endCol
            },
            description: descrizione,
            editors: { users: emailsFiltrate },
            requestingUserCanEdit: false
          }
        }
      });
    });
    
    if (richieste.length === 0) {
      this._logger.warn("Nessuna protezione valida da applicare nel batch.");
      return this; // Non è un errore
    }
    
    this._eseguiBatchProtezioni(spreadsheetId, richieste);
    
    this._logger.info(`Protezioni multiple applicate: ${richieste.length} range`);
    
    return this;
  });
}

/**
 * Converte numero colonna in notazione A1
 * @param {number} colNum - Numero colonna (1-based)
 * @returns {string} Lettera colonna
 * @private
 */
_convertColNumToA1(colNum) {
  let result = '';
  while (colNum > 0) {
    colNum--;
    result = String.fromCharCode(65 + (colNum % 26)) + result;
    colNum = Math.floor(colNum / 26);
  }
  return result;
}



}