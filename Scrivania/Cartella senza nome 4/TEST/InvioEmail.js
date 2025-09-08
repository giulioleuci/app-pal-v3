/**
 * @fileoverview Suite di test per il nuovo sistema di notifiche email a tre livelli.
 */

// Funzione helper per creare mock dei servizi
function creaMockServizi() {
    const logger = new MyLoggerService({ livello: 'DEBUG' });
    
    // Mock database e tabelle
    const mockDB = {
        tables: {
            'DOC_GEN': {
                ottieniTutteLeRighe: () => [
                    { 'ID': 'doc1', 'NOME': 'Piano Lavoro 1A LC', 'LINK': 'https://docs.google.com/doc1', 'CLASSE': '1A LC', 'TIPO': 'PIANO_LAVORO', 'NOTIFICATO': null },
                    { 'ID': 'doc2', 'NOME': 'Piano Lavoro 2B SF', 'LINK': 'https://docs.google.com/doc2', 'CLASSE': '2B SF', 'TIPO': 'PIANO_LAVORO', 'NOTIFICATO': null }
                ],
                ottieniRigaPerId: (id) => mockDB.tables['DOC_GEN'].ottieniTutteLeRighe().find(doc => doc['ID'] === id),
                aggiornaRiga: (riga) => logger.info(`[MOCK] Aggiornata riga documento: ${riga['ID']}`)
            },
            'CARENZE': {
                ottieniTutteLeRighe: () => [
                    { 'EMAIL ALUNNO': 'alunno1@test.com', 'CLASSE ALUNNO': '1A LC', 'DATA REPORT': '07/09/2025', 'MAT': 'Grave', 'ITA': 'Lieve', 'NOTIFICA': null, 'NOTE': 'Necessario recupero' },
                    { 'EMAIL ALUNNO': 'alunno2@test.com', 'CLASSE ALUNNO': '2B SF', 'DATA REPORT': '07/09/2025', 'FIS': 'Lieve', 'NOTIFICA': null }
                ],
                ottieniRighe: () => mockDB.tables['CARENZE'].ottieniTutteLeRighe(),
                aggiornaRiga: (riga) => logger.info(`[MOCK] Aggiornata riga carenza per: ${riga['EMAIL ALUNNO']}`)
            },
            'EMAIL_INVIATE': {
                inserisciRiga: (riga) => {
                    logger.info(`[MOCK] Inserita email inviata: ${riga['EMAIL_DESTINATARI']}`);
                    return { id: 'mock_email_id' };
                }
            },
            'PNT_EMAIL': {
                ottieniTutteLeRighe: () => [
                    {
                        'IDENTIFICATIVO NOTIFICA': 'TEST_PATTERN',
                        'DESCRIZIONE': 'Pattern di Test',
                        'OGGETTO EMAIL': 'Test Notifica',
                        'COLORE HEADER': '#4CAF50',
                        'MSG START': 'Gentile {{DESTINATARIO}}, di seguito i dettagli.',
                        'MSG END': 'Cordiali saluti',
                        'NOREPLY': false,
                        'BOX CONFIG': JSON.stringify([
                            { "TIPO_BOX": "elenco_documenti", "ORDINE": 1, "CONFIG": { "titolo": "Documenti Disponibili" } },
                            { "TIPO_BOX": "elenco_carenze", "ORDINE": 2, "CONFIG": { "titolo": "Carenze Segnalate" } }
                        ])
                    }
                ]
            }
        },
        select: () => ({
            from: (table) => ({
                where: (col, op, val) => ({
                    first: () => {
                        const tableData = mockDB.tables[table];
                        if (tableData && tableData.ottieniTutteLeRighe) {
                            return tableData.ottieniTutteLeRighe().find(row => row[col] === val);
                        }
                        return null;
                    }
                })
            })
        })
    };

    // Mock gestori
    const mockGestoreDB = {
        ottieniDatabaseAnnoAttuale: () => mockDB
    };

    const mockDocenti = [
        { email: 'coordinatore1@test.com', nome: 'Mario', cognome: 'Rossi', classe: '1A LC' },
        { email: 'coordinatore2@test.com', nome: 'Luigi', cognome: 'Bianchi', classe: '2B SF' }
    ];

    const mockAlunni = [
        { email: 'alunno1@test.com', nome: 'Anna', cognome: 'Verdi', classe: '1A LC', tutorEmails: ['genitore1@test.com'] },
        { email: 'alunno2@test.com', nome: 'Marco', cognome: 'Neri', classe: '2B SF', tutorEmails: ['genitore2@test.com'] }
    ];

    const mockMaterie = [
        { sigla: 'MAT', nome: 'Matematica', simbolo: '🔢', colore: '#FF5722' },
        { sigla: 'ITA', nome: 'Italiano', simbolo: '📚', colore: '#2196F3' },
        { sigla: 'FIS', nome: 'Fisica', simbolo: '⚡', colore: '#9C27B0' }
    ];

    const mockGestoreDocenti = {
        ottieniTutti: function() {
            return mockDocenti.map(function(d) {
                return {
                    ottieniEmail: function() { return d.email; },
                    ottieniNomeCompleto: function() { return d.nome + ' ' + d.cognome; },
                    ottieniClasse: function() { return d.classe; },
                    dati: d
                };
            });
        },
        ottieniPerEmail: function(email) {
            var docente = mockDocenti.find(function(d) { return d.email === email; });
            return docente ? {
                ottieniEmail: function() { return docente.email; },
                ottieniNomeCompleto: function() { return docente.nome + ' ' + docente.cognome; },
                ottieniClasse: function() { return docente.classe; },
                dati: docente
            } : null;
        },
        ottieniPerClasse: function(classe) {
            return this.ottieniTutti().filter(function(docente) { return docente.ottieniClasse() === classe; });
        }
    };

    const mockGestoreAlunni = {
        ottieniTutti: function() { 
            return mockAlunni.map(function(a) {
                return {
                    ottieniEmail: function() { return a.email; },
                    ottieniNomeCompleto: function() { return a.nome + ' ' + a.cognome; },
                    ottieniClasse: function() { return a.classe; },
                    ottieniEmailGenitori: function() { return a.tutorEmails; },
                    dati: { 'EMAIL': a.email, 'ALUNNO': a.nome + ' ' + a.cognome, 'CLASSE': a.classe, 'NOME': a.nome, 'COGNOME': a.cognome }
                };
            });
        },
        ottieniPerEmail: function(email) {
            var alunno = mockAlunni.find(function(a) { return a.email === email; });
            return alunno ? {
                ottieniEmail: function() { return alunno.email; },
                ottieniNomeCompleto: function() { return alunno.nome + ' ' + alunno.cognome; },
                ottieniClasse: function() { return alunno.classe; },
                ottieniEmailGenitori: function() { return alunno.tutorEmails; },
                dati: alunno
            } : null;
        },
        ottieniPerClasse: function(classe) {
            return this.ottieniTutti().filter(function(alunno) { return alunno.ottieniClasse() === classe; });
        }
    };

    const mockGestoreMaterie = {
        ottieniPerCodice: (sigla) => {
            const materia = mockMaterie.find(m => m.sigla === sigla);
            return materia ? {
                ottieniNome: () => materia.nome,
                ottieniSimbolo: () => materia.simbolo,
                ottieniColore: () => materia.colore
            } : null;
        }
    };

    const mockGestoreClassi = {
        ottieniPerCodice: function(classe) { return { dati: { 'CLASSE': classe } }; },
        ottieniTutteAttive: function() { 
            return [
                { dati: { 'CLASSE': '1A LC', 'ATT': true, 'COORDINATORE': 'coordinatore1@test.com' }, ottieniCoordinatore: function() { return 'coordinatore1@test.com'; } },
                { dati: { 'CLASSE': '2B SF', 'ATT': true, 'COORDINATORE': 'coordinatore2@test.com' }, ottieniCoordinatore: function() { return 'coordinatore2@test.com'; } }
            ];
        }
    };

    const mockGestorePattern = new GestorePatternEmail(
        { info: () => {} }, logger, mockGestoreDB
    );

    const mockGestoreRuoli = {
        ottieniPerCodice: (codice) => {
            if (codice === 'SUPERVISORE_EMAIL') {
                return { 'EMAIL DOCENTE': 'supervisore@test.com' };
            }
            return null;
        }
    };

    const mockPlaceholderService = {
        risolviPlaceholders: function(testo, contesto) {
            return testo.replace(/\{\{DESTINATARIO\}\}/g, 'Test User');
        }
    };

    // Mock gestori aggiuntivi necessari per CostruttoreDatiEmail
    const mockGestoreDocumentiGenerati = {
        ottieniTutti: () => [
            { 
                ottieniId: () => 'doc1', 
                ottieniNome: () => 'Piano Lavoro Test', 
                ottieniLink: () => 'http://test.com', 
                ottieniTipo: () => 'PIANO_LAVORO', 
                ottieniDataCreazione: () => new Date(), 
                ottieniClasseAssociata: () => '1A', 
                ottieniMateriaAssociata: () => 'MAT' 
            }
        ],
        ottieniPerTipo: (tipo) => {
            const tutti = mockGestoreDocumentiGenerati.ottieniTutti();
            return tutti.filter(doc => doc.ottieniTipo() === tipo);
        },
        filtra: (filtroFunc) => {
            const tutti = mockGestoreDocumentiGenerati.ottieniTutti();
            return tutti.filter(filtroFunc);
        }
    };

    const mockGestoreDocumenti = {
        appartieneallaClasse: function(doc, classe) { return doc.dati['CLASSE'] === classe; },
        haStato: function(doc, stato) { return doc.dati['STATO'] === stato; },
        eNotificato: function(doc) { return !!doc.dati['NOTIFICATO']; }
    };

    const mockGestoreCartelle = {
        ottieniTutti: function() { return []; },
        ottieniPerTipo: function(tipo) { return []; },
        ottieniPerClasse: function(classe) { return []; }
    };

    const mockGestoreCarenze = {
        ottieniTutti: () => [
            { 
                ottieniEmailAlunno: () => 'test@test.com', 
                ottieniNomeCompleto: () => 'Test Alunno', 
                ottieniClasseAlunno: () => '1A', 
                ottieniCarenzaMateria: (materia) => materia === 'MAT' ? 'Grave' : materia === 'ITA' ? 'Lieve' : '', 
                ottieniNote: () => 'Note test',
                isNotificata: () => false
            }
        ],
        ottieniPerClasse: (classe, soloPiuRecenti = true) => {
            return mockGestoreCarenze.ottieniTutti().filter(carenza => carenza.ottieniClasseAlunno() === classe);
        }
    };

    // Mock MyMailService
    const mockMyMailService = {
        _destinatari: [],
        _oggetto: '',
        _corpoHTML: '',
        _ccn: [],
        
        destinatari: function(emails) { this._destinatari = emails; return this; },
        oggetto: function(obj) { this._oggetto = obj; return this; },
        corpoHTML: function(html) { this._corpoHTML = html; return this; },
        ccn: function(emails) { this._ccn = emails; return this; },
        rispondiA: function(email) { return this; },
        nonRispondere: function(flag) { return this; },
        
        invia: function() {
            logger.info(`[MOCK] Email inviata a: ${this._destinatari.join(', ')} | Oggetto: ${this._oggetto}`);
            return Promise.resolve(true);
        }
    };

    return {
        logger: logger,
        gestoreDB: mockGestoreDB,
        gestoreAlunni: mockGestoreAlunni,
        gestoreDocenti: mockGestoreDocenti,
        gestoreMaterie: mockGestoreMaterie,
        gestoreClassi: mockGestoreClassi,
        gestoreDocumentiGenerati: mockGestoreDocumentiGenerati,
        gestoreCartelle: mockGestoreCartelle,
        gestoreCarenze: mockGestoreCarenze,
        gestorePattern: mockGestorePattern,
        gestoreRuoli: mockGestoreRuoli,
        placeholderService: mockPlaceholderService,
        myMailService: mockMyMailService,
        utils: { info: function() {} }
    };
}

/**
 * Test 1: Sistema completo di notifiche con la nuova architettura
 */
function testSistemaNotificheCompleto() {
    const servizi = creaMockServizi();
    const logger = servizi.logger;
    
    logger.info("=== TEST SISTEMA NOTIFICHE COMPLETO ===");

    try {
        // 1. LIVELLO DATI: Preparazione con CostruttoreDatiEmail
        logger.info("--- Fase 1: Costruzione dati con CostruttoreDatiEmail ---");
        const costruttoreDati = new CostruttoreDatiEmail(
            logger, servizi.gestoreAlunni, servizi.gestoreDocenti, 
            servizi.gestoreMaterie, servizi.gestoreClassi, servizi.gestoreDocumentiGenerati, 
            servizi.gestoreCartelle, servizi.gestoreCarenze
        );

        const pacchettiDiInvio = costruttoreDati
            .aggiungiDatiPerBox('documenti', { 
                tipo: 'PIANO_LAVORO', 
                nonNotificato: true 
            })
            .aggiungiDatiPerBox('carenze', { 
                nonNotificato: true 
            })
            .conDestinatari('coordinatori')
            .aggregaPer(destinatario => destinatario.ottieniEmail())
            .costruisci('TEST_PATTERN');

        logger.info(`Costruiti ${pacchettiDiInvio.length} pacchetti di invio`);

        // Verifica struttura pacchetti
        if (pacchettiDiInvio.length < 1) {
            throw new Error("Dovrebbe essere generato almeno 1 pacchetto");
        }

        const primoPacchetto = pacchettiDiInvio[0];
        if (!primoPacchetto.destinatari || primoPacchetto.destinatari.length === 0) {
            throw new Error("Il pacchetto dovrebbe avere destinatari");
        }

        if (!primoPacchetto.datiPerBox) {
            throw new Error("Il pacchetto dovrebbe avere datiPerBox");
        }

        logger.info("✓ Verifica struttura pacchetti: OK");

        // 2. LIVELLO FORMATTAZIONE: Test FormattatoreDatiEmail
        logger.info("--- Fase 2: Test FormattatoreDatiEmail ---");
        const formattatore = new FormattatoreDatiEmail(
            logger, servizi.gestorePattern, servizi.placeholderService, 
            servizi.gestoreMaterie, servizi.gestoreAlunni
        );

        const htmlGenerato = formattatore.formatta(primoPacchetto);
        
        if (!htmlGenerato || htmlGenerato.length < 100) {
            throw new Error("HTML generato troppo corto o vuoto");
        }

        if (!htmlGenerato.includes('<!DOCTYPE html>')) {
            throw new Error("HTML dovrebbe includere DOCTYPE");
        }

        logger.info("✓ Formattazione HTML: OK");

        // 3. LIVELLO INVIO: Test ProcessoreAzioniPostInvioNotifica
        logger.info("--- Fase 3: Test ProcessoreAzioniPostInvioNotifica ---");
        const processoreAzioni = new ProcessoreAzioniPostInvioNotifica(
            logger, servizi.utils, servizi.gestoreDB, servizi.gestoreAlunni, servizi.gestoreDocenti
        );

        const azioneTest = {
            tipo: 'marca_documento_inviato'
        };

        const risultatoAzione = processoreAzioni.eseguiAzione(azioneTest, {
            datiPerBox: primoPacchetto.datiPerBox
        });

        if (!risultatoAzione) {
            throw new Error("Azione post-invio dovrebbe restituire true");
        }

        logger.info("✓ Azioni post-invio: OK");

        // 4. ORCHESTRAZIONE FINALE: Test GestoreNotifiche
        logger.info("--- Fase 4: Test GestoreNotifiche completo ---");
        const gestoreNotifiche = new GestoreNotifiche(
            logger, servizi.myMailService, formattatore, servizi.gestorePattern,
            servizi.gestoreRuoli, servizi.gestoreDB, processoreAzioni
        );

        const risultatiInvio = gestoreNotifiche.invia(pacchettiDiInvio);

        if (!risultatiInvio) {
            throw new Error("GestoreNotifiche dovrebbe restituire risultati");
        }

        if (risultatiInvio.inviateConSuccesso < 1) {
            throw new Error("Dovrebbe esserci almeno 1 email inviata con successo");
        }

        logger.info(`✓ Invio completato: ${risultatiInvio.inviateConSuccesso} successi, ${risultatiInvio.fallite} fallimenti`);

        logger.info("=== TEST COMPLETATO CON SUCCESSO ===");
        return true;

    } catch (e) {
        logger.error(`!!! TEST FALLITO: ${e.message}`);
        logger.error(e.stack);
        return false;
    }
}

/**
 * Test 2: Test specifico per Box components
 */
function testBoxComponents() {
    const servizi = creaMockServizi();
    const logger = servizi.logger;
    
    logger.info("=== TEST BOX COMPONENTS ===");

    try {
        // Test BoxElencoDocumenti
        const documenti = [
            { 'NOME': 'Documento 1', 'LINK': 'http://test1.com', 'TIPO': 'TEST' },
            { 'NOME': 'Documento 2', 'LINK': 'http://test2.com', 'TIPO': 'TEST' }
        ];

        const boxDocumenti = new BoxElencoDocumenti(documenti, { titolo: 'Test Documenti' }, servizi);
        const htmlDocumenti = boxDocumenti.render();

        if (!htmlDocumenti.includes('Documento 1') || !htmlDocumenti.includes('http://test1.com')) {
            throw new Error("BoxElencoDocumenti non ha renderizzato correttamente");
        }

        logger.info("✓ BoxElencoDocumenti: OK");

        // Test BoxElencoCarenze
        const carenze = [
            { 'EMAIL ALUNNO': 'test@test.com', 'MAT': 'Grave', 'ITA': 'Lieve', 'NOTE': 'Test note' }
        ];

        const boxCarenze = new BoxElencoCarenze(carenze, { titolo: 'Test Carenze' }, servizi);
        const htmlCarenze = boxCarenze.render();

        if (!htmlCarenze.includes('Matematica') || !htmlCarenze.includes('Grave')) {
            throw new Error("BoxElencoCarenze non ha renderizzato le materie correttamente");
        }

        logger.info("✓ BoxElencoCarenze: OK");

        // Test BoxMateria
        const boxMateria = new BoxMateria('MAT', 'Contenuto test matematica', { titolo: 'Test' }, servizi.gestoreMaterie);
        const htmlMateria = boxMateria.render();

        if (!htmlMateria.includes('Matematica') || !htmlMateria.includes('🔢')) {
            throw new Error("BoxMateria non ha renderizzato correttamente");
        }

        logger.info("✓ BoxMateria: OK");

        logger.info("=== TEST BOX COMPONENTS COMPLETATO ===");
        return true;

    } catch (e) {
        logger.error(`!!! TEST BOX FALLITO: ${e.message}`);
        return false;
    }
}

/**
 * Esegue tutti i test
 */
function eseguiTuttiITest() {
    console.log("Avvio suite completa di test per il sistema di notifiche email");
    
    const risultati = {
        sistemaCompleto: testSistemaNotificheCompleto(),
        boxComponents: testBoxComponents()
    };

    console.log("\n=== RIEPILOGO TEST ===");
    console.log(`Test Sistema Completo: ${risultati.sistemaCompleto ? 'PASS' : 'FAIL'}`);
    console.log(`Test Box Components: ${risultati.boxComponents ? 'PASS' : 'FAIL'}`);

    const tuttiPassati = Object.values(risultati).every(r => r === true);
    console.log(`\nRisultato finale: ${tuttiPassati ? '✅ TUTTI I TEST PASSATI' : '❌ ALCUNI TEST FALLITI'}`);
    
    return tuttiPassati;
}