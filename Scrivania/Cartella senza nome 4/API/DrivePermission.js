/**
 * Servizio per la gestione di Google Drive
 */
class MyDriveService extends MyGoogleService {
  constructor(logger, cache, utils) {
    super(logger, cache, utils);
    this._prefissoCache = 'drive';
    this._tempoScadenzaCache = 300; // 5 minuti
  }

  /**
   * Verifica se il servizio avanzato Drive è disponibile
   * @return {boolean} True se il servizio è disponibile
   * @private
   */
  _verificaDriveAvanzato() {
    try {
      // Verifica se l'oggetto globale Drive esiste e ha il metodo Files
      return typeof Drive !== 'undefined' && typeof Drive.Files !== 'undefined';
    } catch (e) {
      this._logger.warn(`Errore nella verifica del servizio Drive: ${e.message}`);
      return false;
    }
  }

  /**
   * Ottiene un file/cartella dal suo ID
   * @param {string} idFile - ID del file/cartella
   * @param {boolean} apiAvanzate - Usa API avanzate se true
   * @param {boolean} usaCache - Usa la cache se true
   * @return {Object} File/cartella o null
   */
  ottieni(idFile, apiAvanzate = true, usaCache = true) {
    const chiaveCache = this._generaChiaveCache(this._prefissoCache, idFile, 'ottieni');
    
    return this._ottieniOEsegui(chiaveCache, () => {
      try {
        if (apiAvanzate && this._verificaDriveAvanzato()) {
          const richiesta = Drive.Files.get(idFile, {
            fields: 'id,name,mimeType,parents,modifiedTime,createdTime,webViewLink,owners'
          });
          return richiesta;
        } else {
          // Fallback a DriveApp
          const file = DriveApp.getFileById(idFile);
          return {
            id: file.getId(),
            name: file.getName(),
            mimeType: file.getMimeType(),
            modifiedTime: file.getLastUpdated().toISOString(),
            createdTime: file.getDateCreated().toISOString(),
            webViewLink: file.getUrl(),
            owners: [{
              emailAddress: file.getOwner().getEmail()
            }]
          };
        }
      } catch (e) {
        this._logger.error(`Impossibile ottenere il file/cartella con ID ${idFile}: ${e.message}`);
        return null;
      }
    }, this._tempoScadenzaCache, usaCache);
  }

  /**
   * Ottiene un file dal suo nome
   * @param {string} nomeFile - Nome del file
   * @param {string} idCartella - ID della cartella in cui cercare
   * @param {boolean} includiSottocartelle - Cerca anche nelle sottocartelle
   * @param {boolean} apiAvanzate - Usa API avanzate se true
   * @param {boolean} usaCache - Usa la cache se true
   * @return {Object} File o null
   */
  ottieniFilePerNome(nomeFile, idCartella = null, includiSottocartelle = false, apiAvanzate = true, usaCache = true) {
    const chiaveCache = this._generaChiaveCache(this._prefissoCache, `${idCartella}_${nomeFile}`, 'ottieniFilePerNome');
    
    return this._ottieniOEsegui(chiaveCache, () => {
    try {
      if (apiAvanzate && this._verificaDriveAvanzato()) {
        let query = `name = '${nomeFile.replace(/'/g, "\\'")}' and mimeType != 'application/vnd.google-apps.folder' and trashed = false`;
        
        if (idCartella) {
          query += ` and '${idCartella}' in parents`;
        }
        
        const risultati = Drive.Files.list({
          q: query,
          fields: 'files(id,name,mimeType,parents,modifiedTime,createdTime,webViewLink,owners)',
          spaces: 'drive'
        });
        
        if (risultati.files && risultati.files.length > 0) {
          return risultati.files[0];
        }
      } else {
        // Fallback a DriveApp
        let file;
        if (idCartella) {
          const folder = DriveApp.getFolderById(idCartella);
          const fileIter = folder.getFilesByName(nomeFile);
          if (fileIter.hasNext()) {
            file = fileIter.next();
          }
        } else {
          const fileIter = DriveApp.getFilesByName(nomeFile);
          if (fileIter.hasNext()) {
            file = fileIter.next();
          }
        }
        
        if (file) {
          return {
            id: file.getId(),
            name: file.getName(),
            mimeType: file.getMimeType(),
            modifiedTime: file.getLastUpdated().toISOString(),
            createdTime: file.getDateCreated().toISOString(),
            webViewLink: file.getUrl(),
            owners: [{
              emailAddress: file.getOwner().getEmail()
            }]
          };
        }
      }
      
      return null;
    } catch (e) {
      this._logger.error(`Errore nel cercare il file ${nomeFile}: ${e.message}`);
      return null;
    }
    }, this._tempoScadenzaCache, usaCache);
  }

  /**
   * Ottiene tutti i file contenuti in una cartella
   * @param {string} idCartella - ID della cartella
   * @param {boolean} apiAvanzate - Usa API avanzate se true
   * @param {boolean} usaCache - Usa la cache se true
   * @return {Object[]} Array di file
   */
  ottieniFile(idCartella, apiAvanzate = true, usaCache = true) {
    const chiaveCache = this._generaChiaveCache(this._prefissoCache, idCartella, 'ottieniFile');

    return this._ottieniOEsegui(chiaveCache, () => {
      try {
        if (apiAvanzate && this._verificaDriveAvanzato()) {
          const query = `'${idCartella}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`;
          
          const risultati = Drive.Files.list({
            q: query,
            fields: 'files(id,name,mimeType,parents,modifiedTime,createdTime,webViewLink,owners)',
            spaces: 'drive'
          });
          
          return risultati.files || [];
        } else {
          const cartella = DriveApp.getFolderById(idCartella);
          const fileIterator = cartella.getFiles();
          const files = [];
          
          while (fileIterator.hasNext()) {
            const file = fileIterator.next();
            files.push({
              id: file.getId(),
              name: file.getName(),
              mimeType: file.getMimeType(),
              modifiedTime: file.getLastUpdated().toISOString(),
              createdTime: file.getDateCreated().toISOString(),
              webViewLink: file.getUrl(),
              owners: [{
                emailAddress: file.getOwner().getEmail()
              }]
            });
          }
          
          return files;
        }
      } catch (e) {
        this._logger.error(`Errore nell'ottenere i file della cartella ${idCartella}: ${e.message}`);
        return [];
      }
    }, this._tempoScadenzaCache, usaCache);
  }



  /**
   * Ottiene una cartella dal suo nome
   * @param {string} nomeCartella - Nome della cartella
   * @param {string} idCartellaParent - ID della cartella parent 
   * @param {boolean} includiSottocartelle - Cerca anche nelle sottocartelle
   * @param {boolean} apiAvanzate - Usa API avanzate se true
   * @param {boolean} usaCache - Usa la cache se true
   * @return {Object} Cartella o null
   */
  ottieniCartellaPerNome(nomeCartella, idCartellaParent = null, includiSottocartelle = false, apiAvanzate = true, usaCache = true) {
    const chiaveCache = this._generaChiaveCache(this._prefissoCache, `${idCartellaParent}_${nomeCartella}`, 'ottieniCartellaPerNome');
    
    return this._ottieniOEsegui(chiaveCache, () => {
    try {
      if (apiAvanzate && this._verificaDriveAvanzato()) {
        let query = `name = '${nomeCartella.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
        
        if (idCartellaParent) {
          query += ` and '${idCartellaParent}' in parents`;
        }
        
        const risultati = Drive.Files.list({
          q: query,
          fields: 'files(id,name,mimeType,parents,modifiedTime,createdTime,webViewLink,owners)',
          spaces: 'drive'
        });
        
        if (risultati.files && risultati.files.length > 0) {
          return risultati.files[0];
        }
      } else {
        // Fallback a DriveApp
        let folder;
        if (idCartellaParent) {
          const parentFolder = DriveApp.getFolderById(idCartellaParent);
          const folderIter = parentFolder.getFoldersByName(nomeCartella);
          if (folderIter.hasNext()) {
            folder = folderIter.next();
          }
        } else {
          const folderIter = DriveApp.getFoldersByName(nomeCartella);
          if (folderIter.hasNext()) {
            folder = folderIter.next();
          }
        }
        
        if (folder) {
          return {
            id: folder.getId(),
            name: folder.getName(),
            mimeType: 'application/vnd.google-apps.folder',
            modifiedTime: folder.getLastUpdated().toISOString(),
            createdTime: folder.getDateCreated().toISOString(),
            webViewLink: folder.getUrl(),
            owners: [{
              emailAddress: folder.getOwner().getEmail()
            }]
          };
        }
      }
      
      return null;
    } catch (e) {
      this._logger.error(`Errore nel cercare la cartella ${nomeCartella}: ${e.message}`);
      return null;
    }
    }, this._tempoScadenzaCache, usaCache);
  }

  /**
   * Ottiene tutte le cartelle contenute in una cartella
   * @param {string} idCartella - ID della cartella
   * @param {boolean} ricorsivo - Cerca nelle sottocartelle se true 
   * @param {boolean} apiAvanzate - Usa API avanzate se true
   * @param {boolean} usaCache - Usa la cache se true
   * @return {Object[]} Array di cartelle
   */
  ottieniAlberoCartelle(idCartella, ricorsivo = false, apiAvanzate = true, usaCache = true) {
    const chiaveCache = this._generaChiaveCache(this._prefissoCache, `${idCartella}_${ricorsivo}`, 'ottieniAlberoCartelle');

    return this._ottieniOEsegui(chiaveCache, () => {
      try {
        const cartelle = [];

        if (apiAvanzate && this._verificaDriveAvanzato()) {
          const query = `'${idCartella}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
          
          const risultati = Drive.Files.list({
            q: query,
            fields: 'files(id,name,mimeType,parents,modifiedTime,createdTime,webViewLink,owners)',
            spaces: 'drive'
          });
          
          if (risultati.files) {
            cartelle.push(...risultati.files);

            if (ricorsivo) {
              for (const cartella of risultati.files) {
                const sottoCartelle = this.ottieniAlberoCartelle(cartella.id, true, true, usaCache);
                cartelle.push(...sottoCartelle); 
              }
            }
          }
        } else {
          const cartella = DriveApp.getFolderById(idCartella);
          const cartelleIterator = cartella.getFolders();
          
          while (cartelleIterator.hasNext()) {
            const sottocartella = cartelleIterator.next();
            cartelle.push({
              id: sottocartella.getId(),
              name: sottocartella.getName(),
              mimeType: 'application/vnd.google-apps.folder',
              modifiedTime: sottocartella.getLastUpdated().toISOString(),
              createdTime: sottocartella.getDateCreated().toISOString(),
              webViewLink: sottocartella.getUrl(),
              owners: [{
                emailAddress: sottocartella.getOwner().getEmail()
              }]
            });

            if (ricorsivo) {
              const sottoCartelle = this.ottieniAlberoCartelle(sottocartella.getId(), true, false, usaCache);
              cartelle.push(...sottoCartelle);
            }
          }
        }
        
        return cartelle;
      } catch (e) {
        this._logger.error(`Errore nell'ottenere l'albero delle cartelle per ${idCartella}: ${e.message}`);
        return [];
      }
    }, this._tempoScadenzaCache, usaCache);
  }


  /**
   * Ottiene l'albero completo di cartelle e file
   * @param {string} idCartella - ID della cartella
   * @param {boolean} ricorsivo - Cerca nelle sottocartelle se true
   * @param {boolean} apiAvanzate - Usa API avanzate se true 
   * @param {boolean} usaCache - Usa la cache se true
   * @return {Object[]} Array di file e cartelle
   */
  ottieniAlberoCartelleConFile(idCartella, ricorsivo = false, apiAvanzate = true, usaCache = true) {
    const chiaveCache = this._generaChiaveCache(this._prefissoCache, `${idCartella}_${ricorsivo}`, 'ottieniAlberoCartelleConFile');

    return this._ottieniOEsegui(chiaveCache, () => {
      try {
        const elementi = [];

        if (apiAvanzate && this._verificaDriveAvanzato()) {
          let query = `'${idCartella}' in parents and trashed = false`;
          
          const risultati = Drive.Files.list({
            q: query,
            fields: 'files(id,name,mimeType,parents,modifiedTime,createdTime,webViewLink,owners)',
            spaces: 'drive'
          });
          
          if (risultati.files) {
            elementi.push(...risultati.files);

            if (ricorsivo) {
              const cartelle = risultati.files.filter(f => f.mimeType === 'application/vnd.google-apps.folder');
              for (const cartella of cartelle) {
                const sottoElementi = this.ottieniAlberoCartelleConFile(cartella.id, true, true, usaCache);
                elementi.push(...sottoElementi);
              }
            }
          }
        } else {
          const cartella = DriveApp.getFolderById(idCartella);
          
          // Ottieni file
          const fileIterator = cartella.getFiles();
          while (fileIterator.hasNext()) {
            const file = fileIterator.next();
            elementi.push({
              id: file.getId(),
              name: file.getName(),
              mimeType: file.getMimeType(),
              modifiedTime: file.getLastUpdated().toISOString(),
              createdTime: file.getDateCreated().toISOString(),
              webViewLink: file.getUrl(),
              owners: [{
                emailAddress: file.getOwner().getEmail()
              }]
            });
          }

          // Ottieni cartelle
          const cartelleIterator = cartella.getFolders();
          while (cartelleIterator.hasNext()) {
            const sottocartella = cartelleIterator.next();
            elementi.push({
              id: sottocartella.getId(),
              name: sottocartella.getName(), 
              mimeType: 'application/vnd.google-apps.folder',
              modifiedTime: sottocartella.getLastUpdated().toISOString(),
              createdTime: sottocartella.getDateCreated().toISOString(),
              webViewLink: sottocartella.getUrl(),
              owners: [{
                emailAddress: sottocartella.getOwner().getEmail()
              }]
            });

            if (ricorsivo) {
              const sottoElementi = this.ottieniAlberoCartelleConFile(sottocartella.getId(), true, false, usaCache);
              elementi.push(...sottoElementi);
            }
          }
        }
        
        return elementi;
      } catch (e) {
        this._logger.error(`Errore nell'ottenere l'albero delle cartelle e file per ${idCartella}: ${e.message}`);
        return [];
      }
    }, this._tempoScadenzaCache, usaCache);
  }

  /**
   * Conta i file presenti in una cartella
   * @param {string} idCartella - ID della cartella
   * @param {boolean} includiCartelle - Se true, include anche le sottocartelle nel conteggio
   * @param {boolean} apiAvanzate - Usa API avanzate se true
   * @param {boolean} usaCache - Usa la cache se true
   * @return {number} Numero di file nella cartella
   */
  contaFileInCartella(idCartella, includiCartelle = false, apiAvanzate = true, usaCache = true) {
    const chiaveCache = this._generaChiaveCache(this._prefissoCache, idCartella, 'contaFileInCartella');
    
    return this._ottieniOEsegui(chiaveCache, () => {
      try {
        if (apiAvanzate && this._verificaDriveAvanzato()) {
          const query = includiCartelle ? 
            `'${idCartella}' in parents and trashed = false` : 
            `'${idCartella}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`;
          
          const risultati = Drive.Files.list({
            q: query,
            fields: 'files(id)',
            spaces: 'drive'
          });
          
          return risultati.files ? risultati.files.length : 0;
        } else {
          const cartella = DriveApp.getFolderById(idCartella);
          
          if (includiCartelle) {
            // Conta sia file che cartelle
            const fileIterator = cartella.getFiles();
            const folderIterator = cartella.getFolders();
            let conteggio = 0;
            
            while (fileIterator.hasNext()) {
              fileIterator.next();
              conteggio++;
            }
            
            while (folderIterator.hasNext()) {
              folderIterator.next();
              conteggio++;
            }
            
            return conteggio;
          } else {
            // Conta solo i file
            const fileIterator = cartella.getFiles();
            let conteggio = 0;
            
            while (fileIterator.hasNext()) {
              fileIterator.next();
              conteggio++;
            }
            
            return conteggio;
          }
        }
      } catch (e) {
        this._logger.error(`Errore nel conteggio dei file nella cartella ${idCartella}: ${e.message}`);
        return 0;
      }
    }, this._tempoScadenzaCache, usaCache);
  }


  /**
   * Crea una cartella con il nome specificato
   * @param {string} nomeCartella - Nome della cartella
   * @param {string} idCartellaParent - ID della cartella parent (null per root)
   * @param {boolean} creaSeEsistente - Se false, restituisce la cartella esistente
   * @param {boolean} apiAvanzate - Usa API avanzate se true
   * @return {Object} La cartella creata o esistente
   */
  creaCartella(nomeCartella, idCartellaParent = null, creaSeEsistente = false, apiAvanzate = true) {
    // Prima cerchiamo se esiste già
    if (!creaSeEsistente) {
      const cartellaEsistente = this.ottieniCartellaPerNome(nomeCartella, idCartellaParent, false, apiAvanzate);
      if (cartellaEsistente) {
        return cartellaEsistente;
      }
    }
    
    try {
      if (apiAvanzate && this._verificaDriveAvanzato()) {
        const fileMetadata = {
          name: nomeCartella,
          mimeType: 'application/vnd.google-apps.folder'
        };
        
        if (idCartellaParent) {
          fileMetadata.parents = [idCartellaParent];
        }
        
        const cartella = Drive.Files.create(fileMetadata, null, {
          fields: 'id,name,mimeType,parents,modifiedTime,createdTime,webViewLink,owners'
        });
        
        // Invalida la cache
        const chiaveCache = this._generaChiaveCache(this._prefissoCache, `${idCartellaParent}_${nomeCartella}`, 'ottieniCartellaPerNome');
        this._cache.rimuovi(chiaveCache);
        
        return cartella;
      } else {
        // Fallback a DriveApp
        let nuovaCartella;
        
        if (idCartellaParent) {
          const parentCartella = DriveApp.getFolderById(idCartellaParent);
          nuovaCartella = parentCartella.createFolder(nomeCartella);
        } else {
          nuovaCartella = DriveApp.createFolder(nomeCartella);
        }
        
        return {
          id: nuovaCartella.getId(),
          name: nuovaCartella.getName(),
          mimeType: 'application/vnd.google-apps.folder',
          parents: idCartellaParent ? [idCartellaParent] : [],
          modifiedTime: nuovaCartella.getLastUpdated().toISOString(),
          createdTime: nuovaCartella.getDateCreated().toISOString(),
          webViewLink: nuovaCartella.getUrl(),
          owners: [{
            emailAddress: nuovaCartella.getOwner().getEmail()
          }]
        };
      }
    } catch (e) {
      this._logger.error(`Errore nella creazione della cartella ${nomeCartella}: ${e.message}`);
      throw e;
    }
  }

  /**
   * Crea un albero di cartelle partendo da un percorso
   * @param {string} percorso - Percorso separato da /
   * @param {string} idCartellaBase - ID della cartella di partenza
   * @param {boolean} apiAvanzate - Usa API avanzate se true
   * @param {boolean} usaCache - Usa la cache se true
   * @return {Object} L'ultima cartella creata
   */
  creaAlberoCartelle(percorso, idCartellaBase = null, apiAvanzate = true, usaCache = true) {
    let percorsoNormalizzato = percorso;
    
    // Rimuove eventuali slash iniziali o finali
    if (percorsoNormalizzato.startsWith('/')) {
      percorsoNormalizzato = percorsoNormalizzato.substring(1);
    }
    
    if (percorsoNormalizzato.endsWith('/')) {
      percorsoNormalizzato = percorsoNormalizzato.substring(0, percorsoNormalizzato.length - 1);
    }
    
    // Se il percorso è vuoto, restituiamo la cartella base
    if (!percorsoNormalizzato) {
      if (idCartellaBase) {
        return this.ottieni(idCartellaBase, apiAvanzate, usaCache);
      } else {
        return {
          id: DriveApp.getRootFolder().getId(),
          name: 'Root',
          mimeType: 'application/vnd.google-apps.folder'
        };
      }
    }
    
    // Dividiamo il percorso in parti
    const parti = percorsoNormalizzato.split('/');
    let idCartellaCorrente = idCartellaBase;
    let cartellaCorrente = null;
    
    // Creiamo ogni cartella nel percorso
    for (let i = 0; i < parti.length; i++) {
      const nomeParte = parti[i].trim();
      
      if (nomeParte) {
        cartellaCorrente = this.creaCartella(nomeParte, idCartellaCorrente, false, apiAvanzate);
        idCartellaCorrente = cartellaCorrente.id;
      }
    }
    
    return cartellaCorrente;
  }

  /**
   * Crea una copia di un file
   * @param {string} idFile - ID del file da copiare
   * @param {string} nuovoNome - Nuovo nome del file (opzionale)
   * @param {string} idCartellaDestinazione - ID della cartella di destinazione
   * @param {boolean} apiAvanzate - Usa API avanzate se true
   * @return {Object} Il nuovo file
   */
  copiaFile(idFile, nuovoNome = null, idCartellaDestinazione = null, apiAvanzate = true) {
    try {
      if (apiAvanzate && this._verificaDriveAvanzato()) {
        let parametri = {};
        
        if (nuovoNome) {
          parametri.name = nuovoNome;
        }
        
        if (idCartellaDestinazione) {
          parametri.parents = [idCartellaDestinazione];
        }
        
        const nuovoFile = Drive.Files.copy(parametri, idFile, {
          fields: 'id,name,mimeType,parents,modifiedTime,createdTime,webViewLink,owners'
        });
        
        return nuovoFile;
      } else {
        // Fallback a DriveApp
        const fileOrigine = DriveApp.getFileById(idFile);
        let nuovoFile;
        
        if (idCartellaDestinazione) {
          const cartellaDest = DriveApp.getFolderById(idCartellaDestinazione);
          nuovoFile = fileOrigine.makeCopy(nuovoNome || fileOrigine.getName(), cartellaDest);
        } else {
          nuovoFile = fileOrigine.makeCopy(nuovoNome || fileOrigine.getName());
        }
        
        return {
          id: nuovoFile.getId(),
          name: nuovoFile.getName(),
          mimeType: nuovoFile.getMimeType(),
          parents: idCartellaDestinazione ? [idCartellaDestinazione] : [],
          modifiedTime: nuovoFile.getLastUpdated().toISOString(),
          createdTime: nuovoFile.getDateCreated().toISOString(),
          webViewLink: nuovoFile.getUrl(),
          owners: [{
            emailAddress: nuovoFile.getOwner().getEmail()
          }]
        };
      }
    } catch (e) {
      this._logger.error(`Errore nella copia del file ${idFile}: ${e.message}`);
      throw e;
    }
  }

  /**
   * Copia una cartella e tutto il suo contenuto
   * @param {string} idCartella - ID della cartella da copiare
   * @param {string} nuovoNome - Nuovo nome della cartella (opzionale)
   * @param {string} idCartellaDestinazione - ID della cartella di destinazione
   * @param {boolean} apiAvanzate - Usa API avanzate se true
   * @return {Object} La nuova cartella
   */
  copiaCartella(idCartella, nuovoNome = null, idCartellaDestinazione = null, apiAvanzate = true) {
    try {
      // Creare la nuova cartella
      const cartellaSorgente = this.ottieni(idCartella, apiAvanzate);
      
      if (!cartellaSorgente) {
        throw new Error(`Cartella con ID ${idCartella} non trovata`);
      }
      
      const nomeNuovaCartella = nuovoNome || cartellaSorgente.name;
      
      const nuovaCartella = this.creaCartella(
        nomeNuovaCartella,
        idCartellaDestinazione,
        true,
        apiAvanzate
      );
      
      // Ottenere tutti i file nella cartella
      const files = this._ottieniFilesInCartella(idCartella, apiAvanzate);
      
      // Copiare ogni file nella nuova cartella
      for (let i = 0; i < files.length; i++) {
        this.copiaFile(files[i].id, files[i].name, nuovaCartella.id, apiAvanzate);
      }
      
      // Ottenere tutte le sottocartelle
      const sottocartelle = this._ottieniSottocartelleInCartella(idCartella, apiAvanzate);
      
      // Copiare ricorsivamente le sottocartelle
      for (let i = 0; i < sottocartelle.length; i++) {
        this.copiaCartella(sottocartelle[i].id, sottocartelle[i].name, nuovaCartella.id, apiAvanzate);
      }
      
      return nuovaCartella;
    } catch (e) {
      this._logger.error(`Errore nella copia della cartella ${idCartella}: ${e.message}`);
      throw e;
    }
  }

  /**
   * Ottiene tutti i file all'interno di una cartella
   * @param {string} idCartella - ID della cartella
   * @param {boolean} apiAvanzate - Usa API avanzate se true
   * @return {Object[]} Array di file
   */
  _ottieniFilesInCartella(idCartella, apiAvanzate = true) {
    try {
      if (apiAvanzate && this._verificaDriveAvanzato()) {
        const query = `'${idCartella}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`;
        
        const risultati = Drive.Files.list({
          q: query,
          fields: 'files(id,name,mimeType)',
          spaces: 'drive'
        });
        
        return risultati.files || [];
      } else {
        const cartella = DriveApp.getFolderById(idCartella);
        const fileIterator = cartella.getFiles();
        const files = [];
        
        while (fileIterator.hasNext()) {
          const file = fileIterator.next();
          files.push({
            id: file.getId(),
            name: file.getName(),
            mimeType: file.getMimeType()
          });
        }
        
        return files;
      }
    } catch (e) {
      this._logger.error(`Errore nell'ottenere i file della cartella ${idCartella}: ${e.message}`);
      return [];
    }
  }

  /**
   * Ottiene tutte le sottocartelle all'interno di una cartella
   * @param {string} idCartella - ID della cartella
   * @param {boolean} apiAvanzate - Usa API avanzate se true
   * @return {Object[]} Array di cartelle
   */
  _ottieniSottocartelleInCartella(idCartella, apiAvanzate = true) {
    try {
      if (apiAvanzate && this._verificaDriveAvanzato()) {
        const query = `'${idCartella}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
        
        const risultati = Drive.Files.list({
          q: query,
          fields: 'files(id,name,mimeType)',
          spaces: 'drive'
        });
        
        return risultati.files || [];
      } else {
        const cartella = DriveApp.getFolderById(idCartella);
        const cartelleIterator = cartella.getFolders();
        const cartelle = [];
        
        while (cartelleIterator.hasNext()) {
          const sottocartella = cartelleIterator.next();
          cartelle.push({
            id: sottocartella.getId(),
            name: sottocartella.getName(),
            mimeType: 'application/vnd.google-apps.folder'
          });
        }
        
        return cartelle;
      }
    } catch (e) {
      this._logger.error(`Errore nell'ottenere le sottocartelle della cartella ${idCartella}: ${e.message}`);
      return [];
    }
  }

  /**
   * Crea un backup di un file o cartella
   * @param {string} idFileOCartella - ID del file o cartella
   * @param {string} idCartellaBackup - ID della cartella per il backup
   * @param {boolean} includiTimestamp - Aggiunge timestamp al nome
   * @param {boolean} apiAvanzate - Usa API avanzate se true
   * @param {boolean} usaCache - Usa la cache se true
   * @return {Object} File o cartella di backup
   */
  creaBackup(idFileOCartella, idCartellaBackup, includiTimestamp = true, apiAvanzate = true, usaCache = true) {
    try {
      const elemento = this.ottieni(idFileOCartella, apiAvanzate, usaCache);
      
      if (!elemento) {
        throw new Error(`Elemento con ID ${idFileOCartella} non trovato`);
      }
      
      let nuovoNome = elemento.name;
      
      if (includiTimestamp) {
        const timestamp = this._utils.formattaData(new Date(), 'yyyy-MM-dd_HH-mm-ss');
        nuovoNome = `${elemento.name}_backup_${timestamp}`;
      }
      
      if (elemento.mimeType === 'application/vnd.google-apps.folder') {
        return this.copiaCartella(idFileOCartella, nuovoNome, idCartellaBackup, apiAvanzate);
      } else {
        return this.copiaFile(idFileOCartella, nuovoNome, idCartellaBackup, apiAvanzate);
      }
    } catch (e) {
      this._logger.error(`Errore nella creazione del backup di ${idFileOCartella}: ${e.message}`);
      throw e;
    }
  }

  /**
   * Sposta un file o cartella in un'altra cartella
   * @param {string} idFileOCartella - ID del file o cartella da spostare
   * @param {string} idNuovaCartella - ID della cartella di destinazione
   * @param {boolean} rimuoviDaAltreCartelle - Rimuove da altre cartelle se true
   * @param {boolean} apiAvanzate - Usa API avanzate se true
   * @param {boolean} usaCache - Usa la cache se true
   * @return {Object} File o cartella spostato
   */
  sposta(idFileOCartella, idNuovaCartella, rimuoviDaAltreCartelle = true, apiAvanzate = true, usaCache = true) {
    try {
      if (apiAvanzate && this._verificaDriveAvanzato()) {
        // Ottieni le cartelle attuali
        const elemento = this.ottieni(idFileOCartella, true, usaCache);
        
        if (!elemento) {
          throw new Error(`Elemento con ID ${idFileOCartella} non trovato`);
        }
        
        let parametri = {
          fileId: idFileOCartella,
          addParents: idNuovaCartella
        };
        
        if (rimuoviDaAltreCartelle && elemento.parents && elemento.parents.length > 0) {
          parametri.removeParents = elemento.parents.join(',');
        }
        
        const elementoAggiornato = Drive.Files.update({}, idFileOCartella, null, {
          addParents: idNuovaCartella,
          removeParents: parametri.removeParents,
          fields: 'id,name,mimeType,parents,modifiedTime,createdTime,webViewLink,owners'
        });
        
        return elementoAggiornato;
      } else {
        // Fallback a DriveApp
        const nuovaCartella = DriveApp.getFolderById(idNuovaCartella);
        
        try {
          // Prova come file
          const file = DriveApp.getFileById(idFileOCartella);
          
          // Aggiunge alla nuova cartella
          nuovaCartella.addFile(file);
          
          // Rimuove dalle altre cartelle se richiesto
          if (rimuoviDaAltreCartelle) {
            const parentIterator = file.getParents();
            while (parentIterator.hasNext()) {
              const parent = parentIterator.next();
              
              if (parent.getId() !== idNuovaCartella) {
                parent.removeFile(file);
              }
            }
          }
          
          return {
            id: file.getId(),
            name: file.getName(),
            mimeType: file.getMimeType(),
            parents: [idNuovaCartella],
            modifiedTime: file.getLastUpdated().toISOString(),
            createdTime: file.getDateCreated().toISOString(),
            webViewLink: file.getUrl(),
            owners: [{
              emailAddress: file.getOwner().getEmail()
            }]
          };
        } catch (ef) {
          // Prova come cartella
          const cartella = DriveApp.getFolderById(idFileOCartella);
          
          // Aggiunge alla nuova cartella
          nuovaCartella.addFolder(cartella);
          
          // Rimuove dalle altre cartelle se richiesto
          if (rimuoviDaAltreCartelle) {
            const parentIterator = cartella.getParents();
            while (parentIterator.hasNext()) {
              const parent = parentIterator.next();
              
              if (parent.getId() !== idNuovaCartella) {
                parent.removeFolder(cartella);
              }
            }
          }
          
          return {
            id: cartella.getId(),
            name: cartella.getName(),
            mimeType: 'application/vnd.google-apps.folder',
            parents: [idNuovaCartella],
            modifiedTime: cartella.getLastUpdated().toISOString(),
            createdTime: cartella.getDateCreated().toISOString(),
            webViewLink: cartella.getUrl(),
            owners: [{
              emailAddress: cartella.getOwner().getEmail()
            }]
          };
        }
      }
    } catch (e) {
      this._logger.error(`Errore nello spostamento dell'elemento ${idFileOCartella}: ${e.message}`);
      throw e;
    }
  }

  /**
   * Rinomina un file o cartella
   * @param {string} idFileOCartella - ID del file o cartella
   * @param {string} nuovoNome - Nuovo nome
   * @param {boolean} apiAvanzate - Usa API avanzate se true
   * @param {boolean} usaCache - Usa la cache se true
   * @return {Object} File o cartella rinominato
   */
  rinomina(idFileOCartella, nuovoNome, apiAvanzate = true) {
    try {
      if (apiAvanzate && this._verificaDriveAvanzato()) {
        const elementoAggiornato = Drive.Files.update({
          name: nuovoNome
        }, idFileOCartella, null, {
          fields: 'id,name,mimeType,parents,modifiedTime,createdTime,webViewLink,owners'
        });
        
        return elementoAggiornato;
      } else {
        // Fallback a DriveApp
        try {
          // Prova come file
          const file = DriveApp.getFileById(idFileOCartella);
          file.setName(nuovoNome);
          
          return {
            id: file.getId(),
            name: file.getName(),
            mimeType: file.getMimeType(),
            modifiedTime: file.getLastUpdated().toISOString(),
            createdTime: file.getDateCreated().toISOString(),
            webViewLink: file.getUrl(),
            owners: [{
              emailAddress: file.getOwner().getEmail()
            }]
          };
        } catch (ef) {
          // Prova come cartella
          const cartella = DriveApp.getFolderById(idFileOCartella);
          cartella.setName(nuovoNome);
          
          return {
            id: cartella.getId(),
            name: cartella.getName(),
            mimeType: 'application/vnd.google-apps.folder',
            modifiedTime: cartella.getLastUpdated().toISOString(),
            createdTime: cartella.getDateCreated().toISOString(),
            webViewLink: cartella.getUrl(),
            owners: [{
              emailAddress: cartella.getOwner().getEmail()
            }]
          };
        }
      }
    } catch (e) {
      this._logger.error(`Errore nella rinomina dell'elemento ${idFileOCartella}: ${e.message}`);
      throw e;
    }
  }

  /**
   * Normalizza il risultato per garantire coerenza tra API e DriveApp
   * @param {Object} risultato - Risultato da normalizzare
   * @param {boolean} daApi - True se proviene dalle API avanzate
   * @return {Object} Risultato normalizzato
   * @private
   */
  _normalizzaRisultato(risultato, daApi = true) {
    if (!risultato) return null;
    
    return {
      id: risultato.id,
      name: risultato.name,
      mimeType: risultato.mimeType,
      isFolder: risultato.mimeType === 'application/vnd.google-apps.folder',
      parents: daApi ? risultato.parents || [] : this._getParents(risultato),
      modifiedTime: risultato.modifiedTime || (risultato.getLastUpdated ? risultato.getLastUpdated().toISOString() : null),
      createdTime: risultato.createdTime || (risultato.getDateCreated ? risultato.getDateCreated().toISOString() : null),
      webViewLink: risultato.webViewLink || (risultato.getUrl ? risultato.getUrl() : null),
      owners: risultato.owners || this._getOwners(risultato)
    };
  }

  /**
   * Ottiene la lista di parents da un file/cartella DriveApp
   * @param {Object} oggetto - File o cartella
   * @return {Array} Lista di ID dei parents
   * @private
   */
  _getParents(oggetto) {
    try {
      const parents = [];
      const iterator = oggetto.getParents();
      while (iterator.hasNext()) {
        parents.push(iterator.next().getId());
      }
      return parents;
    } catch (e) {
      return [];
    }
  }

  /**
   * Ottiene la lista di owners da un file/cartella DriveApp
   * @param {Object} oggetto - File o cartella
   * @return {Array} Lista di owners
   * @private
   */
  _getOwners(oggetto) {
    try {
      const owner = oggetto.getOwner();
      return owner ? [{ emailAddress: owner.getEmail() }] : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Esegue una funzione e salva il risultato in cache se richiesto
   * @param {string} chiaveCache - Chiave della cache
   * @param {Function} callback - Funzione da eseguire
   * @param {number} tempoScadenza - Tempo di scadenza della cache
   * @param {boolean} usaCache - Usa la cache se true
   * @return {Object} Risultato della funzione
   */
  _ottieniOEsegui(chiaveCache, callback, tempoScadenza, usaCache = true) {
    // Se l'utente ha deciso di usare la cache, provo a leggere il dato
    if (usaCache) {
      const datoCache = this._cache.ottieni(chiaveCache);
      if (datoCache) {
        return datoCache;
      }
    }
    // Esegui il callback per ottenere il risultato
    const risultato = callback();
    // Salva il risultato in cache se richiesto e se ottenuto
    if (usaCache && risultato) {
      this._cache.imposta(chiaveCache, risultato, tempoScadenza);
    }
    return risultato;
  }
}

/**
 * Servizio per la gestione dei permessi in Google Drive
 */
class MyPermissionService extends MyGoogleService {
  constructor(logger, cache, utils) {
    super(logger, cache, utils);
    this._prefissoCache = 'permission';
    this._tempoScadenzaCache = 300; // 5 minuti
  }

  /**
   * Verifica se il servizio avanzato Drive è disponibile
   * @return {boolean} True se il servizio è disponibile
   * @private
   */
  _verificaDriveAvanzato() {
    try {
      // Verifica se l'oggetto globale Drive esiste e ha il metodo Permissions
      return typeof Drive !== 'undefined' && typeof Drive.Permissions !== 'undefined';
    } catch (e) {
      this._logger.warn(`Errore nella verifica del servizio Drive: ${e.message}`);
      return false;
    }
  }

  /**
   * Ottiene i permessi di un file o cartella
   * @param {string} idFileOCartella - ID del file o cartella
   * @param {boolean} apiAvanzate - Usa API avanzate se true
   * @return {Object[]} Array di permessi
   */
  ottieniPermessi(idFileOCartella, apiAvanzate = true) {
    const chiaveCache = this._generaChiaveCache(this._prefissoCache, idFileOCartella, 'ottieniPermessi');
    
    return this._ottieniOEsegui(chiaveCache, () => {
      try {
        if (apiAvanzate && this._verificaDriveAvanzato()) {
          const risultato = Drive.Permissions.list(idFileOCartella, {
            fields: 'permissions(id,emailAddress,role,type,domain)'
          });
          
          return risultato.permissions || [];
        } else {
          // Fallback a DriveApp
          let permessi = [];
          let file;
          
          try {
            file = DriveApp.getFileById(idFileOCartella);
          } catch (ef) {
            file = DriveApp.getFolderById(idFileOCartella);
          }
          
          // Ottieni gli editor
          const editorIterator = file.getEditors();
          while (editorIterator.hasNext()) {
            const editor = editorIterator.next();
            permessi.push({
              id: this._utils.generaUuid(), // non disponibile in DriveApp
              emailAddress: editor.getEmail(),
              role: 'writer',
              type: 'user'
            });
          }
          
          // Ottieni i visualizzatori
          const viewerIterator = file.getViewers();
          while (viewerIterator.hasNext()) {
            const viewer = viewerIterator.next();
            permessi.push({
              id: this._utils.generaUuid(), // non disponibile in DriveApp
              emailAddress: viewer.getEmail(),
              role: 'reader',
              type: 'user'
            });
          }
          
          return permessi;
        }
      } catch (e) {
        this._logger.error(`Errore nell'ottenere i permessi per ${idFileOCartella}: ${e.message}`);
        return [];
      }
    }, this._tempoScadenzaCache);
  }

  /**
   * Condivide un file o cartella con un utente o dominio
   * @param {string} idFileOCartella - ID del file o cartella
   * @param {string} emailODominio - Email dell'utente o dominio
   * @param {string} ruolo - Ruolo (reader, commenter, writer, owner)
   * @param {string} tipo - Tipo (user, domain, group, anyone)
   * @param {boolean} sendNotification - Invia notifica email
   * @param {string} messaggio - Messaggio di notifica
   * @param {boolean} apiAvanzate - Usa API avanzate se true
   * @return {Object} Permesso aggiunto
   */
  condividi(idFileOCartella, emailODominio, ruolo = 'reader', tipo = 'user', sendNotification = false, messaggio = '', apiAvanzate = true) {
    try {
      // Invalida la cache dei permessi
      const chiaveCache = this._generaChiaveCache(this._prefissoCache, idFileOCartella, 'ottieniPermessi');
      this._cache.rimuovi(chiaveCache);
      
      if (apiAvanzate && this._verificaDriveAvanzato()) {
        const permissionResource = {
          role: ruolo,
          type: tipo
        };
        
        if (tipo === 'user' || tipo === 'group') {
          permissionResource.emailAddress = emailODominio;
        } else if (tipo === 'domain') {
          permissionResource.domain = emailODominio;
        }

        let opzioni = {
          fields: 'id,emailAddress,role,type,domain'
        };

        // Aggiungi i parametri di notifica solo se necessario
        if (sendNotification && (tipo === 'user' || tipo === 'group')) {
          opzioni.sendNotificationEmail = true;
          if (messaggio) {
            opzioni.emailMessage = messaggio;
          }
        } else {
          opzioni.sendNotificationEmail = false;
        }
        
        const permesso = Drive.Permissions.create(permissionResource, idFileOCartella, opzioni);
        
        return permesso;
      } else {
        // Fallback a DriveApp
        let file;
        let permessoAggiunto = {
          id: this._utils.generaUuid(),
          role: ruolo,
          type: tipo
        };
        
        try {
          file = DriveApp.getFileById(idFileOCartella);
        } catch (ef) {
          file = DriveApp.getFolderById(idFileOCartella);
        }
        
        if (tipo === 'user' || tipo === 'group') {
          permessoAggiunto.emailAddress = emailODominio;
          
          if (ruolo === 'reader') {
            file.addViewer(emailODominio);
          } else if (ruolo === 'writer') {
            file.addEditor(emailODominio);
          } else if (ruolo === 'owner') {
            file.setOwner(emailODominio);
          }
        } else if (tipo === 'domain') {
          permessoAggiunto.domain = emailODominio;
          
          if (ruolo === 'reader') {
            file.setSharing(DriveApp.Access.DOMAIN, DriveApp.Permission.VIEW);
          } else if (ruolo === 'writer') {
            file.setSharing(DriveApp.Access.DOMAIN, DriveApp.Permission.EDIT);
          }
        } else if (tipo === 'anyone') {
          if (ruolo === 'reader') {
            file.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);
          } else if (ruolo === 'writer') {
            file.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.EDIT);
          }
        }
        
        return permessoAggiunto;
      }
    } catch (e) {
      this._logger.error(`Errore nella condivisione di ${idFileOCartella} con ${emailODominio}: ${e.message}`);
      throw e;
    }
  }

  /**
   * Rimuove i permessi di un utente/dominio da un file o cartella
   * @param {string} idFileOCartella - ID del file o cartella
   * @param {string} emailODominioOPermissionId - Email, dominio o ID permesso
   * @param {boolean} apiAvanzate - Usa API avanzate se true
   * @return {boolean} True se riuscito
   */
  rimuoviPermessi(idFileOCartella, emailODominioOPermissionId, apiAvanzate = true) {
    try {
      // Invalida la cache dei permessi
      const chiaveCache = this._generaChiaveCache(this._prefissoCache, idFileOCartella, 'ottieniPermessi');
      this._cache.rimuovi(chiaveCache);
      
      if (apiAvanzate && this._verificaDriveAvanzato()) {
        if (emailODominioOPermissionId.includes('@') || emailODominioOPermissionId.includes('.')) {
          // È un'email o un dominio, dobbiamo trovare l'ID permesso
          const permessi = this.ottieniPermessi(idFileOCartella, true);
          
          for (let i = 0; i < permessi.length; i++) {
            const p = permessi[i];
            
            if ((p.emailAddress && p.emailAddress === emailODominioOPermissionId) ||
                (p.domain && p.domain === emailODominioOPermissionId)) {
              Drive.Permissions.remove(idFileOCartella, p.id);
              return true;
            }
          }
          
          return false;
        } else {
          // È un ID permesso
          Drive.Permissions.remove(idFileOCartella, emailODominioOPermissionId);
          return true;
        }
      } else {
        // Fallback a DriveApp
        let file;
        
        try {
          file = DriveApp.getFileById(idFileOCartella);
        } catch (ef) {
          file = DriveApp.getFolderById(idFileOCartella);
        }
        
        if (emailODominioOPermissionId.includes('@')) {
          // È un'email
          try {
            file.removeViewer(emailODominioOPermissionId);
            file.removeEditor(emailODominioOPermissionId);
            return true;
          } catch (e) {
            this._logger.warn(`Errore nella rimozione dei permessi per ${emailODominioOPermissionId}: ${e.message}`);
            return false;
          }
        } else if (emailODominioOPermissionId.includes('.')) {
          // È un dominio, ma DriveApp non supporta la rimozione diretta di domini
          return false;
        } else {
          // È un ID permesso, ma DriveApp non supporta gli ID permesso
          return false;
        }
      }
    } catch (e) {
      this._logger.error(`Errore nella rimozione dei permessi per ${emailODominioOPermissionId}: ${e.message}`);
      return false;
    }
  }

  /**
   * Modifica i permessi di un utente/dominio su un file o cartella
   * @param {string} idFileOCartella - ID del file o cartella
   * @param {string} emailODominioOPermissionId - Email, dominio o ID permesso
   * @param {string} nuovoRuolo - Nuovo ruolo (reader, commenter, writer, owner)
   * @param {boolean} apiAvanzate - Usa API avanzate se true
   * @return {Object} Permesso aggiornato o null
   */
  modificaPermessi(idFileOCartella, emailODominioOPermissionId, nuovoRuolo, apiAvanzate = true) {
    try {
      // Invalida la cache dei permessi
      const chiaveCache = this._generaChiaveCache(this._prefissoCache, idFileOCartella, 'ottieniPermessi');
      this._cache.rimuovi(chiaveCache);
      
      if (apiAvanzate && this._verificaDriveAvanzato()) {
        let permissionId = emailODominioOPermissionId;
        
        if (emailODominioOPermissionId.includes('@') || emailODominioOPermissionId.includes('.')) {
          // È un'email o un dominio, dobbiamo trovare l'ID permesso
          const permessi = this.ottieniPermessi(idFileOCartella, true);
          
          for (let i = 0; i < permessi.length; i++) {
            const p = permessi[i];
            
            if ((p.emailAddress && p.emailAddress === emailODominioOPermissionId) ||
                (p.domain && p.domain === emailODominioOPermissionId)) {
              permissionId = p.id;
              break;
            }
          }
          
          if (permissionId === emailODominioOPermissionId) {
            // Non abbiamo trovato il permissionId
            return null;
          }
        }
        
        const permessoAggiornato = Drive.Permissions.update({
          role: nuovoRuolo
        }, idFileOCartella, permissionId, {
          fields: 'id,emailAddress,role,type,domain'
        });
        
        return permessoAggiornato;
      } else {
        // Fallback a DriveApp
        let file;
        
        try {
          file = DriveApp.getFileById(idFileOCartella);
        } catch (ef) {
          file = DriveApp.getFolderById(idFileOCartella);
        }
        
        if (emailODominioOPermissionId.includes('@')) {
          // È un'email
          try {
            // Prima rimuoviamo tutti i permessi esistenti
            file.removeViewer(emailODominioOPermissionId);
            file.removeEditor(emailODominioOPermissionId);
            
            // Poi aggiungiamo il nuovo permesso
            if (nuovoRuolo === 'writer' || nuovoRuolo === 'owner') {
              file.addEditor(emailODominioOPermissionId);
              
              if (nuovoRuolo === 'owner') {
                file.setOwner(emailODominioOPermissionId);
              }
            } else if (nuovoRuolo === 'reader' || nuovoRuolo === 'commenter') {
              file.addViewer(emailODominioOPermissionId);
            }
            
            // Restituiamo un oggetto permesso simulato
            return {
              id: this._utils.generaUuid(),
              emailAddress: emailODominioOPermissionId,
              role: nuovoRuolo,
              type: 'user'
            };
          } catch (e) {
            this._logger.warn(`Errore nella modifica dei permessi per ${emailODominioOPermissionId}: ${e.message}`);
            return null;
          }
        } else if (emailODominioOPermissionId.includes('.')) {
          // È un dominio
          if (nuovoRuolo === 'writer') {
            file.setSharing(DriveApp.Access.DOMAIN, DriveApp.Permission.EDIT);
          } else if (nuovoRuolo === 'reader') {
            file.setSharing(DriveApp.Access.DOMAIN, DriveApp.Permission.VIEW);
          }
          
          return {
            id: this._utils.generaUuid(),
            domain: emailODominioOPermissionId,
            role: nuovoRuolo,
            type: 'domain'
          };
        } else {
          // È un ID permesso, ma DriveApp non supporta gli ID permesso
          return null;
        }
      }
    } catch (e) {
      this._logger.error(`Errore nella modifica dei permessi per ${emailODominioOPermissionId}: ${e.message}`);
      return null;
    }
  }

  /**
   * Imposta i permessi di un file/cartella ricorsivamente
   * @param {string} idFileOCartella - ID del file o cartella
   * @param {string} emailODominio - Email dell'utente o dominio
   * @param {string} ruolo - Ruolo (reader, commenter, writer, owner)
   * @param {string} tipo - Tipo (user, domain, group, anyone)
   * @param {boolean} ricorsivo - Applica ai file/cartelle contenuti
   * @param {boolean} apiAvanzate - Usa API avanzate se true
   * @return {Object[]} Array di permessi aggiunti
   */
  impostaPermessiRicorsivi(idFileOCartella, emailODominio, ruolo = 'reader', tipo = 'user', ricorsivo = true, apiAvanzate = true) {
    try {
      const permessiAggiunti = [];
      
      // Imposta i permessi sul file/cartella principale
      const permesso = this.condividi(idFileOCartella, emailODominio, ruolo, tipo, false, '', apiAvanzate);
      
      if (permesso) {
        permessiAggiunti.push({
          id: idFileOCartella,
          permesso: permesso
        });
      }
      
      // Se è ricorsivo e la risorsa è una cartella, procedi con i contenuti
      if (ricorsivo) {
        try {
          // Verifica se è una cartella
          DriveApp.getFolderById(idFileOCartella);
          
          // Ottieni tutti i file nella cartella
          const driveService = new MyDriveService(this._logger, this._cache, this._utils);
          const files = driveService._ottieniFilesInCartella(idFileOCartella, apiAvanzate);
          
          // Imposta i permessi su ogni file
          for (let i = 0; i < files.length; i++) {
            const permessoFile = this.condividi(files[i].id, emailODominio, ruolo, tipo, false, '', apiAvanzate);
            
            if (permessoFile) {
              permessiAggiunti.push({
                id: files[i].id,
                permesso: permessoFile
              });
            }
          }
          
          // Ottieni tutte le sottocartelle
          const sottocartelle = driveService._ottieniSottocartelleInCartella(idFileOCartella, apiAvanzate);
          
          // Imposta i permessi ricorsivamente sulle sottocartelle
          for (let i = 0; i < sottocartelle.length; i++) {
            const permessiSottocartella = this.impostaPermessiRicorsivi(
              sottocartelle[i].id,
              emailODominio,
              ruolo,
              tipo,
              ricorsivo,
              apiAvanzate
            );
            
            permessiAggiunti.push(...permessiSottocartella);
          }
        } catch (e) {
          // Non è una cartella, quindi ignora l'operazione ricorsiva
        }
      }
      
      return permessiAggiunti;
    } catch (e) {
      this._logger.error(`Errore nell'impostazione dei permessi ricorsivi su ${idFileOCartella}: ${e.message}`);
      throw e;
    }
  }

  /**
   * Ottiene il link di condivisione di un file o cartella
   * @param {string} idFileOCartella - ID del file o cartella
   * @param {string} tipoAccesso - Tipo di accesso (view, edit, comment)
   * @param {boolean} apiAvanzate - Usa API avanzate se true
   * @return {string} Link di condivisione
   */
  ottieniLinkCondivisione(idFileOCartella, tipoAccesso = 'view', apiAvanzate = true) {
    try {
      let role = 'reader';
      
      if (tipoAccesso === 'edit') {
        role = 'writer';
      } else if (tipoAccesso === 'comment') {
        role = 'commenter';
      }
      
      if (apiAvanzate && this._verificaDriveAvanzato()) {
        // Aggiorna o crea il permesso anyone con il ruolo specificato
        const permessoEsistente = this.ottieniPermessi(idFileOCartella, true)
          .find(p => p.type === 'anyone');
        
        if (permessoEsistente) {
          this.modificaPermessi(idFileOCartella, permessoEsistente.id, role, true);
        } else {
          this.condividi(idFileOCartella, '', role, 'anyone', false, '', true);
        }
        
        const file = Drive.Files.get(idFileOCartella, {
          fields: 'webViewLink'
        });
        
        return file.webViewLink;
      } else {
        // Fallback a DriveApp
        let file;
        
        try {
          file = DriveApp.getFileById(idFileOCartella);
          
          if (tipoAccesso === 'view') {
            return file.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW).getUrl();
          } else if (tipoAccesso === 'edit') {
            return file.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.EDIT).getUrl();
          } else {
            return file.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.COMMENT).getUrl();
          }
        } catch (ef) {
          file = DriveApp.getFolderById(idFileOCartella);
          
          if (tipoAccesso === 'view') {
            return file.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW).getUrl();
          } else if (tipoAccesso === 'edit') {
            return file.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.EDIT).getUrl();
          }
        }
      }
    } catch (e) {
      this._logger.error(`Errore nell'ottenere il link di condivisione per ${idFileOCartella}: ${e.message}`);
      throw e;
    }
  }



}