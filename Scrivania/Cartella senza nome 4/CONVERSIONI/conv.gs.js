/**
 * Crea e popola i fogli PCTO per ogni alunno elencato in un foglio master.
 * 
 * 1. Apre un foglio elenco, una cartella di destinazione e un file modello.
 * 2. Per ogni alunno nell'elenco:
 *    a. Crea una copia del modello nella cartella di destinazione.
 *    b. Personalizza la copia con il nome dell'alunno.
 *    c. Copia e trasforma i dati specifici dell'alunno da un altro foglio sorgente.
 */
function creaEPopolaFogliPCTO_Riformulato() {
  // --- 1. Definizione delle Risorse ---
  const ID_FOGLIO_ELENCO = '1Nku64xIBHGya1QQM_8_qsDR1oadn-py4A7ii7kS5WMw';
  const ID_CARTELLA_DESTINAZIONE = '1UpkDhoSKKBEMl64GJxRU2JqRhdV0TfT-';
  const ID_FILE_MODELLO = '13xB8vRw1VAV-OHM2Kth6z-TD-fUGjI-W80FaugMtcl4';

  try {
    // --- Apertura delle risorse necessarie ---
    const foglioElenco = SpreadsheetApp.openById(ID_FOGLIO_ELENCO).getSheets()[0];
    const cartellaDestinazione = DriveApp.getFolderById(ID_CARTELLA_DESTINAZIONE);
    const fileModello = DriveApp.getFileById(ID_FILE_MODELLO);

    console.log('Risorse aperte con successo.');

    // --- Lettura dei dati dal foglio elenco ---
    const dati = foglioElenco.getDataRange().getValues();
    const intestazioni = dati[0];
    const righeDati = dati.slice(1);

    const idxNome = intestazioni.indexOf('Nome Alunno');
    const idxEmail = intestazioni.indexOf('Email Alunno');
    const idxIdDocumento = intestazioni.indexOf('ID Documento');

    if (idxNome === -1 || idxEmail === -1 || idxIdDocumento === -1) {
      throw new Error('Una o più colonne necessarie (Nome Alunno, Email Alunno, ID Documento) non sono state trovate nelle intestazioni.');
    }

    // --- 2. Iterazione su ogni riga del foglio elenco ---
    for (const riga of righeDati) {
      const nomeAlunno = riga[idxNome];
      const emailAlunno = riga[idxEmail];
      const idDocumentoAperto = riga[idxIdDocumento];

      if (!nomeAlunno || !idDocumentoAperto) {
        console.warn(`Riga saltata perché mancano il nome dell'alunno o l'ID del documento.`);
        continue;
      }

      console.log(`--- Inizio elaborazione per: ${nomeAlunno} ---`);

      try {
        // --- a. Crea una copia del file modello ---
        const nomeNuovoFile = `${nomeAlunno} - PCTO - ${emailAlunno}`;
        const nuovoFile = fileModello.makeCopy(nomeNuovoFile, cartellaDestinazione);
        const nuovoSpreadsheet = SpreadsheetApp.openById(nuovoFile.getId());
        console.log(`Copiato modello in nuovo file: "${nomeNuovoFile}"`);

        // --- b. Scrivi il nome dell'alunno nel foglio MASCHERA ---
        const foglioMaschera = nuovoSpreadsheet.getSheetByName('MASCHERA');
        if (foglioMaschera) {
          foglioMaschera.getRange('A2').setValue(nomeAlunno);
          console.log(`Nome alunno scritto nella cella A2 del foglio MASCHERA.`);
        } else {
          console.error(`Foglio "MASCHERA" non trovato nel nuovo file per ${nomeAlunno}.`);
        }

        // --- c. Apri il file sorgente dell'alunno (APERTO) ---
        const spreadsheetAperto = SpreadsheetApp.openById(idDocumentoAperto);
        console.log(`Aperto il foglio sorgente con ID: ${idDocumentoAperto}`);

        // --- d. Apri i fogli SINTESI e PROGETTI ---
        const foglioSintesi = spreadsheetAperto.getSheetByName('SINTESI');
        const foglioProgetti = nuovoSpreadsheet.getSheetByName('PROGETTI');

        if (!foglioSintesi) {
          console.error(`Foglio "SINTESI" non trovato nel file sorgente di ${nomeAlunno}.`);
          continue;
        }
        if (!foglioProgetti) {
          console.error(`Foglio "PROGETTI" non trovato nel nuovo file per ${nomeAlunno}.`);
          continue;
        }
        
        // --- e. Copia e trasforma i dati da APERTO a NUOVO ---
        // --- INIZIO MODIFICA ---

        // 1. Leggi i dati sorgente in un array
        const rangeSorgente = foglioSintesi.getRange('B12:E31');
        const datiSorgente = rangeSorgente.getValues();

        // 2. Trasforma l'array datiSorgente per adattarlo alla nuova struttura
        // Il metodo .map() crea un nuovo array applicando una funzione a ogni elemento (riga)
        const datiTrasformati = datiSorgente.map(rigaSorgente => {
          // rigaSorgente è un array [col B, col C, col D, col E]
          const nuovaRiga = [
            rigaSorgente[0], // Col A di NUOVO <- Col B di APERTO (indice 0)
            rigaSorgente[1], // Col B di NUOVO <- Col C di APERTO (indice 1)
            '',              // Col C di NUOVO <- Vuota
            rigaSorgente[2], // Col D di NUOVO <- Col D di APERTO (indice 2)
            '',              // Col E di NUOVO <- Vuota
            rigaSorgente[3]  // Col F di NUOVO <- Col E di APERTO (indice 3)
          ];
          return nuovaRiga;
        });

        // 3. Scrivi l'array trasformato nel range di destinazione (A2:F21)
        // Il range ora ha 20 righe e 6 colonne
        const rangeDestinazione = foglioProgetti.getRange(2, 1, 20, 6); // Riga 2, Colonna 1, per 20 righe, 6 colonne
        rangeDestinazione.setValues(datiTrasformati);

        // --- FINE MODIFICA ---
        
        console.log(`Dati copiati e trasformati con successo da SINTESI a PROGETTI.`);
        console.log(`URL del nuovo file: ${nuovoSpreadsheet.getUrl()}`);

      } catch (err) {
        console.error(`ERRORE durante l'elaborazione di ${nomeAlunno}: ${err.message}`);
      }
    }

    console.log('--- Processo completato con successo! ---');

  } catch (e) {
    console.error(`ERRORE CRITICO che ha interrotto lo script: ${e.message}`);
    Logger.log(`ERRORE CRITICO: ${e.stack}`);
  }
}