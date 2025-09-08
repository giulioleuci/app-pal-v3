/**
 * Testa tutti i placeholder di tabella disponibili nell'ArchivioPlaceholder.
 * Versione corretta che usa la classe esistente nel database
 */
function testaPlaceholdersTabellaCorrected() {
  console.log("=== INIZIO TEST PLACEHOLDER TABELLA (CORRETTO) ===");
  
  // Crea i servizi necessari
  const logger = new MyLoggerService({livello: 'DEBUG'});
  const utils = new MyUtilsService();
  const cache = new MyCacheService();
  const documentService = new MyDocumentService(logger, cache, utils);
  const spreadsheetService = new MySpreadsheetService(logger, cache, utils);
  const gestoreDB = new GestoreDatabaseAnniScolastici(logger, cache, utils, spreadsheetService);
  const driveService = new MyDriveService(logger, cache, utils);
  const mustache = new MyMustache({logger});
  const archivioPlaceholder = new ArchivioPlaceholder(gestoreDB, logger, mustache, utils, driveService);
  const placeholderService = new MyPlaceholderService(archivioPlaceholder, documentService, spreadsheetService, logger, mustache, utils);
  
  // Crea un documento di test
  const doc = DocumentApp.create('Test placeholders tabella CORRETTO ' + new Date().toISOString());
  const docId = doc.getId();
  console.log('Documento di test creato con ID: ' + docId);
  console.log('URL documento: ' + doc.getUrl());
  
  // IMPORTANTE: Usa la classe corretta che esiste nel database
  const contesto = {
    classe: '1A LC', // Cambiato da '1C' a '1A LC'
    dataOdierna: new Date()
  };
  
  // Organizziamo i test per categoria di placeholder
  const tests = {
    "tabella_flessibile": [
      {
        nome: "Tabella base completa",
        placeholder: "{{tabella_flessibile[intestazione=Tabella Flessibile Base, separatore=;, " +
                    "header_riga=Col1;Col2;Col3, header_colonna=Riga1;Riga2;Riga3, " +
                    "contenuto=A1;B1;C1|A2;B2;C2|A3;B3;C3, separatore_righe=|]}}",
        verifiche: ["dimensione 4x4", "presenza intestazione", "header riga e colonna"]
      },
      {
        nome: "Tabella con stili celle",
        placeholder: "{{tabella_flessibile[intestazione=Stili Celle, separatore=;, " +
                    "header_riga=Col1;Col2;Col3, " +
                    "contenuto=A1;B1;C1|A2;B2;C2, separatore_righe=|, " +
                    "stili_celle=0:0:bold:true;0:1:bold:true;0:2:bold:true;1:0:horizontalAlignment:center]}}",
        verifiche: ["stili celle personalizzati", "grassetto e centratura"]
      }
    ],
    
    "tabella_materie_docenti": [
      {
        nome: "Tabella materie-docenti senza firma",
        placeholder: "{{tabella_materie_docenti[titolo=Elenco materie e docenti]}}",
        verifiche: ["dimensione variabile", "presenza intestazione", "due colonne"]
      },
      {
        nome: "Tabella materie-docenti con firma",
        placeholder: "{{tabella_materie_docenti[titolo=Materie e docenti con firma, firma=true]}}",
        verifiche: ["dimensione variabile", "presenza intestazione", "tre colonne", "colonna firma"]
      }
    ],
    
    "tabella_docenti": [
      {
        nome: "Tabella docenti senza firma",
        placeholder: "{{tabella_docenti[titolo=Elenco docenti]}}",
        verifiche: ["dimensione variabile", "presenza intestazione", "una colonna"]
      },
      {
        nome: "Tabella docenti con firma",
        placeholder: "{{tabella_docenti[titolo=Elenco docenti con firma, firma=true]}}",
        verifiche: ["dimensione variabile", "presenza intestazione", "due colonne", "colonna firma"]
      },
      {
        nome: "Tabella docenti con opzioni religione",
        placeholder: "{{tabella_docenti[titolo=Docenti con religione, includiReligione=true, includiAlternativa=true]}}",
        verifiche: ["dimensione variabile", "inclusione religione e alternativa"]
      }
    ],
    
    "tabella_alunni": [
      {
        nome: "Tabella alunni semplice",
        placeholder: "{{tabella_alunni[titolo=Elenco alunni]}}",
        verifiche: ["dimensione variabile", "presenza intestazione", "una colonna"]
      },
      {
        nome: "Tabella alunni con email",
        placeholder: "{{tabella_alunni[titolo=Alunni con email, includi_email=true]}}",
        verifiche: ["dimensione variabile", "due colonne", "colonna email"]
      },
      {
        nome: "Tabella alunni con firma",
        placeholder: "{{tabella_alunni[titolo=Alunni con firma, firma=true]}}",
        verifiche: ["dimensione variabile", "due colonne", "colonna firma"]
      },
      {
        nome: "Tabella alunni completa",
        placeholder: "{{tabella_alunni[titolo=Alunni con email e firma, includi_email=true, firma=true]}}",
        verifiche: ["dimensione variabile", "tre colonne", "colonna email", "colonna firma"]
      }
    ],
    
    "tabella_attivita": [
      {
        nome: "Tabella attività vuota",
        placeholder: "{{tabella_attivita[titolo=Attività (vuota)]}}",
        verifiche: ["due colonne", "tabella vuota con intestazioni"]
      },
      {
        nome: "Tabella attività con dati",
        placeholder: "{{tabella_attivita[titolo=Attività programmate,tipologie=Recupero;Potenziamento;Approfondimento,attivita=Esercizi extra di algebra;Letture avanzate;Progetto di ricerca]}}",
        verifiche: ["due colonne", "3 righe di dati", "seconda colonna larga"]
      },
      {
        nome: "Tabella attività non bilanciate",
        placeholder: "{{tabella_attivita[titolo=Attività non bilanciate, " + 
                    "tipologie=Recupero;Potenziamento;Approfondimento;Altro, " +
                    "attivita=Esercizi extra di algebra;Letture avanzate]}}",
        verifiche: ["due colonne", "4 righe di dati", "gestione righe non bilanciate"]
      }
    ],
    
    "tabella_materie_classe": [
      {
        nome: "Tabella materie classe base",
        placeholder: "{{tabella_materie_classe[titolo=Tabella materie classe base,intestazione_prima_colonna=Elementi,elenco=Conoscenze;Abilità;Competenze]}}",
        verifiche: ["dimensione variabile", "prima colonna con elenco", "colonne per materie"]
      }
    ]
  };
  
  // Funzione ausiliaria per inserire una sezione di test
  const inserisciSezioneTest = (corpo, categoria, testsCategoria) => {
    // Inserisci titolo sezione
    corpo.appendParagraph(`TEST PLACEHOLDER ${categoria}`)
        .setHeading(DocumentApp.ParagraphHeading.HEADING1);
    
    // Inserisci ciascun test nella categoria
    for (let i = 0; i < testsCategoria.length; i++) {
      const test = testsCategoria[i];
      
      // Aggiungi titolo del test
      corpo.appendParagraph(`${i+1}. ${test.nome}`)
          .setHeading(DocumentApp.ParagraphHeading.HEADING2);
      
      // Aggiungi descrizione verifiche attese
      corpo.appendParagraph(`Verifiche attese: ${test.verifiche.join(', ')}`)
          .setHeading(DocumentApp.ParagraphHeading.NORMAL);
      
      // Aggiungi paragrafo con il placeholder
      corpo.appendParagraph(test.placeholder);
      
      // Aggiungi separatore
      corpo.appendParagraph('---')
          .setHeading(DocumentApp.ParagraphHeading.NORMAL);
      
      console.log(`Inserito test ${i+1} per ${categoria}: ${test.nome}`);
    }
    
    // Aggiungi spazio extra dopo la sezione
    corpo.appendParagraph('\n\n')
        .setHeading(DocumentApp.ParagraphHeading.NORMAL);
  };
  
  // Corpo del documento per l'inserimento delle prove
  const corpo = doc.getBody();
  
  // Aggiungi titolo principale al documento
  corpo.appendParagraph("TEST PLACEHOLDERS TABELLA - VERSIONE CORRETTA")
      .setHeading(DocumentApp.ParagraphHeading.TITLE);
  
  // Aggiungi informazioni sul contesto utilizzato
  corpo.appendParagraph(`Contesto utilizzato: classe = '${contesto.classe}'`)
      .setHeading(DocumentApp.ParagraphHeading.NORMAL)
      .setBold(true);
  
  // Inserisci i test di ciascuna categoria
  for (const categoria in tests) {
    console.log(`\n-- SEZIONE TEST: ${categoria} --`);
    inserisciSezioneTest(corpo, categoria, tests[categoria]);
  }
  
  // Chiudi documento per salvare le modifiche
  doc.saveAndClose();
  
  // Riapri il documento con DocumentService per processare i placeholder
  console.log("\nElaborazione dei placeholder...");
  try {
    const risultatoElaborazione = placeholderService.elaboraDocumento(docId, contesto);
    console.log(`Elaborazione completata: ${risultatoElaborazione ? "Successo" : "Fallimento"}`);
  } catch (error) {
    console.error("Errore durante l'elaborazione:", error);
    console.error("Stack trace:", error.stack);
  }
  
  // Riapri il documento per le verifiche
  const docRiaperto = DocumentApp.openById(docId);
  const corpoRiaperto = docRiaperto.getBody();
  
  // Conta e verifica le tabelle
  console.log("\n-- VERIFICA RISULTATI --");
  const numChildren = corpoRiaperto.getNumChildren();
  console.log(`Numero di elementi nel documento: ${numChildren}`);
  
  // Conteggi per categoria
  const conteggiTabelle = {};
  for (const categoria in tests) {
    conteggiTabelle[categoria] = 0;
  }
  
  let tabelleContatore = 0;
  let tabelleCreate = [];
  let placeholderNonSostituiti = [];
  
  // Analizza gli elementi del documento dopo la sostituzione
  for (let i = 0; i < numChildren; i++) {
    const elemento = corpoRiaperto.getChild(i);
    const tipoElemento = elemento.getType();
    
    if (tipoElemento === DocumentApp.ElementType.TABLE) {
      tabelleContatore++;
      const tabella = elemento.asTable();
      const numRighe = tabella.getNumRows();
      const numColonne = numRighe > 0 ? tabella.getRow(0).getNumCells() : 0;
      
      tabelleCreate.push({
        indice: tabelleContatore,
        righe: numRighe,
        colonne: numColonne,
        dimensione: `${numRighe}x${numColonne}`
      });
      
      console.log(`Tabella #${tabelleContatore} trovata: ${numRighe}x${numColonne}`);
      
      // Controlla le larghezze delle colonne
      const larghezzeColonne = [];
      if (numRighe > 0 && numColonne > 0) {
        const primaRiga = tabella.getRow(0);
        for (let c = 0; c < numColonne; c++) {
          try {
            const cella = primaRiga.getCell(c);
            larghezzeColonne.push(cella.getWidth() || "automatica");
          } catch (e) {
            larghezzeColonne.push("error");
          }
        }
      }
      
      console.log(`Larghezze colonne: [${larghezzeColonne.join(", ")}]`);
      
      // Individua a quale categoria appartiene questa tabella
      let categoriaAppartenenza = null;
      let testNumero = 0;
      let testTotale = 0;
      
      for (const categoria in tests) {
        if (tabelleContatore > testTotale && 
            tabelleContatore <= testTotale + tests[categoria].length) {
          categoriaAppartenenza = categoria;
          testNumero = tabelleContatore - testTotale;
          conteggiTabelle[categoria]++;
          break;
        }
        testTotale += tests[categoria].length;
      }
      
      if (categoriaAppartenenza) {
        console.log(`Appartenente a: ${categoriaAppartenenza}, test #${testNumero}`);
      }
    } else if (tipoElemento === DocumentApp.ElementType.PARAGRAPH) {
      const testo = elemento.asParagraph().getText();
      // Controlla se ci sono placeholder non sostituiti
      if (testo.includes('{{') && testo.includes('}}')) {
        placeholderNonSostituiti.push(testo);
        console.log(`ATTENZIONE: Placeholder non sostituito trovato: ${testo}`);
      }
    }
  }
  
  // Riassunto finale
  console.log("\n=== RIASSUNTO FINALE ===");
  console.log(`Totale tabelle create: ${tabelleContatore}`);
  
  for (const categoria in conteggiTabelle) {
    const creati = conteggiTabelle[categoria];
    const attesi = tests[categoria].length;
    const percentuale = Math.round((creati / attesi) * 100);
    
    console.log(`${categoria}: ${creati}/${attesi} tabelle create (${percentuale}%)`);
  }
  
  const percentualeTotale = Math.round((tabelleContatore / Object.values(tests).flat().length) * 100);
  console.log(`Esito complessivo: ${percentualeTotale}% completato`);
  
  if (placeholderNonSostituiti.length > 0) {
    console.log(`\nATTENZIONE: ${placeholderNonSostituiti.length} placeholder non sostituiti:`);
    placeholderNonSostituiti.forEach((p, idx) => {
      console.log(`  ${idx + 1}. ${p}`);
    });
  }
  
  console.log(`\nURL documento con i risultati: ${docRiaperto.getUrl()}`);
  console.log("=== FINE TEST PLACEHOLDER TABELLA (CORRETTO) ===");
  
  return {
    url: docRiaperto.getUrl(),
    tabelleCreate: tabelleCreate,
    percentualeCompletamento: percentualeTotale,
    placeholderNonSostituiti: placeholderNonSostituiti
  };
}

/**
 * Funzione di debug per verificare i dati della classe
 */
function debugDatiClasse() {
  console.log("=== DEBUG DATI CLASSE ===");
  
  const logger = new MyLoggerService({livello: 'DEBUG'});
  const utils = new MyUtilsService();
  const cache = new MyCacheService();
  const spreadsheetService = new MySpreadsheetService(logger, cache, utils);
  const gestoreDB = new GestoreDatabaseAnniScolastici(logger, cache, utils, spreadsheetService);
  
  // Test con diverse classi
  const classiDaTestare = ['1C', '1A LC', '1A', '1ALC'];
  
  for (const classe of classiDaTestare) {
    console.log(`\nTest con classe: '${classe}'`);
    try {
      const datiClasse = gestoreDB.recuperaDatiClasse(classe);
      if (datiClasse) {
        console.log(`  - Trovata! Nome completo: ${datiClasse.classe}`);
        console.log(`  - Numero materie: ${Object.keys(datiClasse.materie || {}).length}`);
        console.log(`  - Materie: ${Object.keys(datiClasse.materie || {}).join(', ')}`);
      } else {
        console.log(`  - NON TROVATA`);
      }
    } catch (error) {
      console.log(`  - ERRORE: ${error.message}`);
    }
  }
  
  // Recupera tutte le classi disponibili
  console.log("\n=== CLASSI DISPONIBILI NEL DATABASE ===");
  try {
    const tutteLeClassi = gestoreDB.recuperaTutteLeClassi();
    console.log(`Totale classi trovate: ${tutteLeClassi.length}`);
    tutteLeClassi.forEach((c, idx) => {
      console.log(`  ${idx + 1}. ${c.classe} (${c.indirizzo}${c.articolazione ? ' - ' + c.articolazione : ''})`);
    });
  } catch (error) {
    console.log(`Errore nel recupero classi: ${error.message}`);
  }
  
  console.log("=== FINE DEBUG ===");
}

/**
 * Funzione per eseguire il test corretto
 */
function eseguiTestPlaceholderTabellaCorrected() {
  // Prima esegui il debug per verificare i dati
  debugDatiClasse();
  
  // Poi esegui il test corretto
  return testaPlaceholdersTabellaCorrected();
}


