/**
 * @fileoverview Job Handler ottimizzato per la creazione massiva dei fogli PCTO.
 * Gestisce la quota API di lettura tramite throttling e mantiene la capacità di ripresa.
 */

// --- CONFIGURAZIONE SPECIFICA DEL JOB ---
const ID_FOGLIO_ELENCO_PCTO = '1Nku64xIBHGya1QQM_8_qsDR1oadn-py4A7ii7kS5WMw';
const ID_CARTELLA_DESTINAZIONE_PCTO = '1Ti7hGiByJWHT66fgPTNhdwhPWxKVhpnV'; // v2
const ID_FILE_MODELLO_PCTO = '13xB8vRw1VAV-OHM2Kth6z-TD-fUGjI-W80FaugMtcl4';
const TIPO_JOB_PCTO = 'CREA_FOGLI_PCTO';

// --- DEFINIZIONE DELLE FUNZIONI DELLO STEP ---

/**
 * [GENERATORE] Legge SOLO l'elenco degli alunni. La lettura dei dati sorgente è spostata nell'azione
 * per permettere la ripresa e gestire i limiti di quota.
 * @returns {Object[]} Array di oggetti, uno per ogni alunno.
 */
function _generaListaAlunniPCTO() {
  console.log("Generatore PCTO: Lettura elenco alunni in corso...");
  const foglioElenco = SpreadsheetApp.openById(ID_FOGLIO_ELENCO_PCTO).getSheets()[0];
  const dati = foglioElenco.getDataRange().getValues();
  const intestazioni = dati.shift();

  const idx = {
    nome: intestazioni.indexOf('Nome Alunno'),
    email: intestazioni.indexOf('Email Alunno'),
    idDoc: intestazioni.indexOf('ID Documento'),
    annoCorso: intestazioni.indexOf('ANNOCORSO')
  };

  if (idx.nome === -1 || idx.email === -1 || idx.idDoc === -1) {
    throw new Error('Generatore PCTO: Colonne necessarie non trovate nel foglio elenco.');
  }

  const alunni = dati.map((riga, index) => {
    if (!riga[idx.nome] || !riga[idx.idDoc] || riga[idx.annoCorso] == '5') {
      return null;
    }
    return {
      rigaOriginale: index + 2,
      nome: riga[idx.nome],
      email: riga[idx.email],
      idDocSorgente: riga[idx.idDoc]
    };
  }).filter(Boolean);

  console.log(`Generatore PCTO: Trovati ${alunni.length} alunni validi da elaborare.`);
  return alunni;
}


/**
 * [AZIONE] Esegue il processo per un singolo alunno, includendo la lettura dei dati sorgente
 * e la determinazione dinamica degli ID dei fogli di destinazione.
 * @param {Object} datiIterazione - Dati dell'alunno corrente.
 * @param {Object} parametri - Parametri statici del job.
 * @returns {Object} Risultato dell'operazione.
 */
function _processaSingoloAlunnoPCTO(datiIterazione, parametri) {
  const alunno = datiIterazione.alunno;
  console.log(`Azione PCTO: Inizio elaborazione per ${alunno.nome} (riga ${alunno.rigaOriginale})`);

  // Leggi i dati sorgente con throttling per evitare errori di quota
  let datiSorgente;
  try {
    Utilities.sleep(1100); 
    const response = Sheets.Spreadsheets.Values.get(alunno.idDocSorgente, 'SINTESI!B12:E31');
    datiSorgente = response.values || [];
  } catch (e) {
    throw new Error(`Impossibile leggere i dati sorgente per ${alunno.nome} (ID: ${alunno.idDocSorgente}): ${e.message}`);
  }
  
  const datiTrasformati = datiSorgente.map(riga => [
      riga[0] || '', riga[1] || '', '', riga[2] || '', '', riga[3] || ''
  ]);
  while (datiTrasformati.length < 20) {
      datiTrasformati.push(['', '', '', '', '', '']);
  }

  // a. Crea copia del modello
  const nomeNuovoFile = `${alunno.nome} - PCTO - ${alunno.email}`;
  const fileCopiato = Drive.Files.copy(
    { name: nomeNuovoFile, parents: [ID_CARTELLA_DESTINAZIONE_PCTO] },
    ID_FILE_MODELLO_PCTO,
    { fields: 'id, webViewLink' }
  );
  const idNuovoFile = fileCopiato.id;

  // *** CORREZIONE: Ottieni dinamicamente gli ID dei fogli dal nuovo file creato ***
  const metadataNuovoFile = Sheets.Spreadsheets.get(idNuovoFile, { fields: 'sheets.properties' });
  const fogli = metadataNuovoFile.sheets.map(s => s.properties);
  
  const foglioMaschera = fogli.find(f => f.title === 'MASCHERA');
  const foglioProgetti = fogli.find(f => f.title === 'PROGETTI');

  if (!foglioMaschera) throw new Error(`Foglio 'MASCHERA' non trovato nel modello per l'alunno ${alunno.nome}.`);
  if (!foglioProgetti) throw new Error(`Foglio 'PROGETTI' non trovato nel modello per l'alunno ${alunno.nome}.`);
  
  const idFoglioMaschera = foglioMaschera.sheetId;
  const idFoglioProgetti = foglioProgetti.sheetId;
  
  console.log(`ID Fogli trovati -> MASCHERA: ${idFoglioMaschera}, PROGETTI: ${idFoglioProgetti}`);

  // b. e e. Prepara le richieste batch usando gli ID dei fogli corretti
  const richiesteBatch = [
    {
      updateCells: {
        rows: [{ values: [{ userEnteredValue: { stringValue: alunno.nome } }] }],
        fields: 'userEnteredValue',
        range: { 
          sheetId: idFoglioMaschera, // ID Dinamico
          startRowIndex: 1, endRowIndex: 2, 
          startColumnIndex: 0, endColumnIndex: 1 
        } // MASCHERA!A2
      }
    },
    {
      updateCells: {
        rows: datiTrasformati.map(riga => ({
          values: riga.map(cella => ({ userEnteredValue: { stringValue: cella } }))
        })),
        fields: 'userEnteredValue',
        range: { 
          sheetId: idFoglioProgetti, // ID Dinamico
          startRowIndex: 1, endRowIndex: 21, 
          startColumnIndex: 0, endColumnIndex: 6 
        } // PROGETTI!A2:F21
      }
    }
  ];

  Sheets.Spreadsheets.batchUpdate({ requests: richiesteBatch }, idNuovoFile);

  console.log(`Azione PCTO: Elaborazione per ${alunno.nome} completata.`);

  // Aggiungi una riga al foglio di riepilogo
  try {
    const summarySheetId = parametri.summarySheetId;
    if (summarySheetId) {
      const foglioRiepilogo = SpreadsheetApp.openById(summarySheetId).getSheets()[0];
      const linkVecchioFoglio = `https://docs.google.com/spreadsheets/d/${alunno.idDocSorgente}/`;
      foglioRiepilogo.appendRow([
        alunno.nome,
        alunno.email,
        idNuovoFile,
        fileCopiato.webViewLink,
        linkVecchioFoglio
      ]);
    }
  } catch (e) {
    console.error(`Errore aggiornamento foglio riepilogo per ${alunno.nome}: ${e.message}`);
  }

  return {
    status: 'COMPLETATO',
    fileCreatoId: idNuovoFile,
    fileCreatoUrl: fileCopiato.webViewLink
  };
}


// --- AZIONE FINALE E GESTIONE ERRORE (INVARIATE) ---

function _azioneFinaleJobPCTO(risultati, parametri) {
  const successi = risultati.filter(r => r.risultato && r.risultato.status === 'COMPLETATO').length;
  const errori = risultati.filter(r => r.errore).length;
  const messaggio = `--- JOB PCTO COMPLETATO --- \nAlunni elaborati con successo: ${successi}\nErrori riscontrati: ${errori}`;
  console.log(messaggio);
  
  const summarySheetId = parametri.summarySheetId;
  if (summarySheetId) {
    const urlRiepilogo = `https://docs.google.com/spreadsheets/d/${summarySheetId}/`;
    console.log(`Consulta i risultati nel foglio di riepilogo: ${urlRiepilogo}`);
  }
  return messaggio;
}

function _gestioneErroreJobPCTO(errore, fase, datiIterazione) {
    const nomeAlunno = datiIterazione && datiIterazione.alunno ? datiIterazione.alunno.nome : 'N/D';
    console.error(`Errore PCTO nella fase '${fase}' per l'alunno '${nomeAlunno}': ${errore.message}`);
}


// --- ASSEMBLAGGIO E FUNZIONE DI AVVIO (INVARIATE) ---

const jobHandlerCreazionePCTO = creaJobIterativo({
  livelli: [ { nome: 'alunno', generatore: _generaListaAlunniPCTO } ],
  azione: _processaSingoloAlunnoPCTO,
  azioneFinale: _azioneFinaleJobPCTO,
  gestioneErrore: _gestioneErroreJobPCTO
});

function avviaJobCreazioneFogliPCTO(forzaRipartenza = false) {
  const servizi = inizializzaServizi();
  const jobQueue = new MyJobQueue(servizi.logger, servizi.utils);
  
  const DURATA_MAX_MS = 28 * 60 * 1000;
  jobQueue.impostaDurataMassima(DURATA_MAX_MS);

  const NOME_FOGLIO_RIEPILOGO = 'NUOVI FOGLI PCTO seconda parte';
  const properties = PropertiesService.getScriptProperties();
  const propKeySummaryId = `summary_sheet_id_${TIPO_JOB_PCTO}`;
  let summarySheetId = properties.getProperty(propKeySummaryId);

  if (forzaRipartenza || !summarySheetId) {
    servizi.logger.info(`Creazione di un nuovo foglio di riepilogo: "${NOME_FOGLIO_RIEPILOGO}"`);
    const nuovoFoglioRiepilogo = SpreadsheetApp.create(NOME_FOGLIO_RIEPILOGO);
    summarySheetId = nuovoFoglioRiepilogo.getId();
    properties.setProperty(propKeySummaryId, summarySheetId);

    const sheet = nuovoFoglioRiepilogo.getSheets()[0];
    const intestazioni = ['NOME ALUNNO', 'EMAIL ALUNNO', 'ID FOGLIO CREATO', 'LINK FOGLIO CREATO', 'LINK VECCHIO FOGLIO'];
    sheet.appendRow(intestazioni);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, intestazioni.length).setFontWeight('bold').setBackground("#e0e0e0");
    servizi.logger.info(`Foglio di riepilogo creato. URL: ${nuovoFoglioRiepilogo.getUrl()}`);
  } else {
    servizi.logger.info(`Utilizzo del foglio di riepilogo esistente con ID: ${summarySheetId}`);
  }

  servizi.logger.info(`Avvio del job '${TIPO_JOB_PCTO}'. Durata massima per esecuzione: ${DURATA_MAX_MS / 60000} minuti.`);
  
  registraTuttiJobHandlers(jobQueue);
  
  jobQueue.esegui(
    TIPO_JOB_PCTO,
    TIPO_JOB_PCTO,
    { summarySheetId: summarySheetId },
    forzaRipartenza
  );

  servizi.logger.info("Job avviato. Controllare i log per il progresso e il foglio di riepilogo per i risultati.");
}