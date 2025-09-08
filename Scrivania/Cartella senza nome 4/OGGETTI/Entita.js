/**
 * Classe base per tutte le entità
 */
class EntitaBase {
  /**
   * @param {Object} dati - Dati grezzi dell'entità
   * @param {MyUtilsService} utils - Servizio utilità
   * @param {GestoreDatabaseAnniScolastici} gestoreDB - Gestore del database
   */
  constructor(dati, utils, gestoreDB) {
    this.dati = dati || {};
    this.utils = utils;
    this.gestoreDB = gestoreDB;
    this.db = gestoreDB ? gestoreDB.ottieniDatabaseAnnoAttuale() : null;
  }
  
  /**
   * Ottiene un valore di proprietà con fallback
   * @param {string} nomeProprieta - Nome della proprietà da ottenere
   * @param {*} valoreDefault - Valore predefinito se la proprietà non esiste
   * @return {*} Valore della proprietà o default
   */
  ottieniProprieta(nomeProprieta, valoreDefault = null) {
    return this.dati[nomeProprieta] !== undefined ? this.dati[nomeProprieta] : valoreDefault;
  }
  
  /**
   * Converte l'oggetto in formato JSON
   * @return {string} Rappresentazione JSON
   */
  toJSON() {
    return JSON.stringify(this.dati);
  }
}

/**
 * Rappresenta un alunno
 */
class Alunno extends EntitaBase {
  constructor(dati, utils, gestoreDB) {
    super(dati, utils, gestoreDB);
  }

  ottieniEmail() {
    return this.ottieniProprieta('EMAIL');
  }

  ottieniNomeCompleto() {
    return this.ottieniProprieta('ALUNNO');
  }

  ottieniClasse() {
    return this.ottieniProprieta('CLASSE');
  }

  ottieniReligione() {
    return this.ottieniProprieta('RELIGIONE', 'Si');
  }

  isRappresentante() {
    return this.ottieniProprieta('RAPPR STUDENTI') === true;
  }

  isRipetente() {
    return this.ottieniProprieta('RIPETENTE') === true;
  }

  ottieniEmailTutor1() {
    return this.ottieniProprieta('EMAIL TUTOR1');
  }

  ottieniEmailTutor2() {
    return this.ottieniProprieta('EMAIL TUTOR2');
  }

  ottieniNote() {
    return this.ottieniProprieta('NOTE', '');
  }

  ottieniPianiPersonalizzati() {
    if (!this.db) return [];
    
    const email = this.ottieniEmail();
    if (!email) return [];
    
    return this.db.select('ID')
      .from('DOC_GEN')
      .where('TIPO', '=', 'DOCUMENTO_PERSONALIZZATO')
      .and('UTENTE', '=', email)
      .execute();
  }

  ottieniTrasferimenti() {
    if (!this.db) return [];
    
    const email = this.ottieniEmail();
    if (!email) return [];
    
    return this.db.select("CHIAVE UNICA")
      .from('TRASF_ALUNNI')
      .where('EMAIL ALUNNO', '=', email)
      .execute();
  }

}

/**
 * Rappresenta una classe scolastica
 */
class Classe extends EntitaBase {
  constructor(dati, utils, gestoreDB) {
    super(dati, utils, gestoreDB);
  }

  ottieniMappaDocentiMaterie() {
    const mappa = {};
    if (!this.db) return mappa;
    
    const sigleMaterie = this.gestoreDB.ottieniSigleMaterie();
    
    for (const sigla of sigleMaterie) {
      const docenti = this.ottieniDocenteMateria(sigla);
      if (docenti && docenti.length > 0) {
        mappa[sigla] = docenti;
      }
    }
    
    return mappa;
  }

  ottieniNome() {
    return this.ottieniProprieta('CLASSE');
  }

  ottieniAnnoCorso() {
    return parseInt(this.ottieniProprieta('ANNO CORSO', '0'), 10);
  }

  ottieniSezione() {
    return this.ottieniProprieta('SEZIONE', '');
  }

  ottieniIndirizzo() {
    return this.ottieniProprieta('INDIRIZZO', '');
  }

  ottieniCoordinatore() {
    const val = this.ottieniProprieta('COORDINATORE', '');
    return val.split(',').map(email => email.trim()).filter(email => email !== '');
  }

  ottieniTutorPCTO() {
    const val = this.ottieniProprieta('TUTOR PCTO', '');
    return val.split(',').map(email => email.trim()).filter(email => email !== '');
  }

  ottieniTutorOrientamento() {
    const val = this.ottieniProprieta('TUTOR ORIENT', '');
    return val.split(',').map(email => email.trim()).filter(email => email !== '');
  }

  isAttiva() {
    return this.ottieniProprieta('ATT') === true;
  }

  isArticolata() {
    return !!this.ottieniProprieta('ARTIC TIPO');
  }

  /**
   * Ottiene l'elenco delle sigle materie assegnate alla classe
   * Le materie sono filtrate in base alla presenza di docenti assegnati
   * @return {string[]} Array delle sigle delle materie
   */
  ottieniElencoSigleMaterie() {
    // Verifico se ci sono dati della classe
    if (!this.dati) {
      return [];
    }
    
    // Se non c'è un database collegato, non posso ottenere tutte le materie
    if (!this.gestoreDB) {
      // Ritorno un array vuoto o estraggo solo dalle proprietà disponibili
      return Object.keys(this.dati)
        .filter(key => key === key.toUpperCase() && !['ID', 'CLASSE', 'INDIRIZZO', 'SEZIONE', 'ATT'].includes(key));
    }
    
    try {
      // Ottengo tutte le sigle materie dal gestore DB
      const tutteMaterie = this.gestoreDB.ottieniSigleMaterie();
      
      // Filtro solo quelle che hanno almeno un docente assegnato in questa classe
      const materieAssegnate = tutteMaterie.filter(sigla => {
        const docentiMateria = this.ottieniDocenteMateria(sigla);
        return docentiMateria && docentiMateria.length > 0;
      });
      
      return materieAssegnate;
    } catch (e) {
      // In caso di errore ritorno un array vuoto
      return [];
    }
  }

  ottieniDocenteMateria(siglaMateria) {
    const val = this.ottieniProprieta(siglaMateria, '');
    return val.split(',').map(email => email.trim()).filter(email => email !== '');
  }

  ottieniAlunni() {
    if (!this.db) return [];
    
    const nomeClasse = this.ottieniNome();
    if (!nomeClasse) return [];
    
    return this.db.select('EMAIL')
      .from('ALUNNI')
      .where('CLASSE', '=', nomeClasse)
      .execute();
  }

  ottieniDocumenti() {
    if (!this.db) return [];
    
    const nomeClasse = this.ottieniNome();
    if (!nomeClasse) return [];
    
    return this.db.select('ID')
      .from('DOC_GEN')
      .where('CLASSE', '=', nomeClasse)
      .execute();
  }

  ottieniCartelle() {
    if (!this.db) return [];
    
    const nomeClasse = this.ottieniNome();
    if (!nomeClasse) return [];
    
    return this.db.select('ID')
      .from('FOLDER_GEN')
      .where('CLASSE', '=', nomeClasse)
      .execute();
  }

  ottieniArticParent() {
    return this.ottieniProprieta('ARTIC PARENT');
  }

  ottieniArticChild() {
    const value = this.ottieniProprieta('ARTIC CHILD', '');
    return value.split(',').map(item => item.trim()).filter(item => item !== '');
  }

  ottieniArticFusion() {
    return this.ottieniProprieta('ARTIC FUSION');
  }

  /**
   * Ottiene il progetto PCTO della classe
   * @return {Progetto} Progetto PCTO o null
   */
  ottieniProgettoPCTO() {
    if (!this.db) return null;
    
    const nomeClasse = this.ottieniNome();
    if (!nomeClasse) return null;
    
    return this.db.select()
      .from('PROGETTI')
      .where('CLASSE', '=', nomeClasse)
      .where('TIPO PROGETTO', '=', 'PCTO')
      .first();
  }

  /**
   * Ottiene il progetto di orientamento della classe
   * @return {Progetto} Progetto orientamento o null
   */
  ottieniProgettoOrient() {
    if (!this.db) return null;
    
    const nomeClasse = this.ottieniNome();
    if (!nomeClasse) return null;
    
    return this.db.select()
      .from('PROGETTI')
      .where('CLASSE', '=', nomeClasse)
      .where('TIPO PROGETTO', '=', 'ORIENTAMENTO')
      .first();
  }

  /**
   * Ottiene le ore PCTO della classe
   * @return {number} Ore PCTO
   */
  ottieniOrePCTO() {
    const progetto = this.ottieniProgettoPCTO();
    return progetto ? progetto['ORE VALIDE PCTO'] || 0 : 0;
  }

  /**
   * Ottiene le ore di orientamento della classe
   * @return {number} Ore orientamento
   */
  ottieniOreOrient() {
    const progetto = this.ottieniProgettoOrient();
    return progetto ? progetto['ORE PROGETTO'] || 0 : 0;
  }

  /**
   * Ottiene tutti i progetti della classe
   * @return {Array} Array di progetti
   */
  ottieniProgetti() {
    if (!this.db) return [];
    
    const nomeClasse = this.ottieniNome();
    if (!nomeClasse) return [];
    
    return this.db.select()
      .from('PROGETTI')
      .where('CLASSE', '=', nomeClasse)
      .execute();
  }
}

/**
 * Rappresenta una classe articolata composta da più classi
 */
class ClasseArticolata extends Classe {
  /**
   * @param {Classe[]} classiChild - Array di oggetti Classe che compongono l'articolazione
   */
  constructor(dati, utils, gestoreDB, classiChild) {
    super(dati, utils, gestoreDB);
    this.classiChild = classiChild || [];
  }

  /**
   * Ottiene tutti gli alunni delle classi articolate ordinati in base a EMAIL ALUNNO
   */
  ottieniAlunni() {
    const alunni = this.classiChild.reduce((acc, classe) => {
      return [...acc, ...classe.ottieniAlunni()];
    }, []);
    
    return alunni.sort((a, b) => {
      const emailA = a['EMAIL ALUNNO'] || '';
      const emailB = b['EMAIL ALUNNO'] || '';
      return emailA.localeCompare(emailB);
    });
  }

  /**
   * Ottiene il numero totale di alunni
   */
  ottieniNumeroAlunni() {
    return this.ottieniAlunni().length;
  }

/**
 * Ottiene l'elenco delle sigle materie assegnate alla classe articolata
 * Include sia le materie comuni che quelle specifiche delle articolazioni
 * @return {string[]} Array delle sigle delle materie
 */
ottieniElencoSigleMaterie() {
  // Se non ci sono classi figlie, uso il comportamento della classe base
  if (!this.classiChild || this.classiChild.length === 0) {
    return super.ottieniElencoSigleMaterie();
  }
  
  try {
    // Raccolgo tutte le materie da tutte le articolazioni
    const materieSet = new Set();
    
    // Aggiungo le materie della classe principale
    const materiePrincipali = super.ottieniElencoSigleMaterie();
    materiePrincipali.forEach(sigla => materieSet.add(sigla));
    
    // Aggiungo le materie di tutte le classi child
    for (const classe of this.classiChild) {
      const materieClasse = classe.ottieniElencoSigleMaterie();
      materieClasse.forEach(sigla => materieSet.add(sigla));
    }
    
    // Converto il Set in array e ordino
    return Array.from(materieSet).sort();
  } catch (e) {
    // In caso di errore ritorno un array vuoto
    return [];
  }
}

  /**
   * Ottiene l'elenco delle materie comuni tra le articolazioni
   * @return {string[]} Array delle sigle delle materie comuni
   */
  ottieniMaterieComuni() {
    // Se non ci sono classi figlie, ritorno un array vuoto
    if (!this.classiChild || this.classiChild.length === 0) {
      return [];
    }
    
    try {
      // Ottengo tutte le materie dalla prima classe
      const materiePrimaClasse = this.classiChild[0].ottieniElencoSigleMaterie();
      
      // Filtro per mantenere solo quelle presenti in tutte le altre classi
      // con lo stesso docente assegnato
      return materiePrimaClasse.filter(sigla => {
        const emailsPrimaClasse = this.classiChild[0].ottieniDocenteMateria(sigla);
        
        // Verifico che tutte le classi abbiano la stessa materia con gli stessi docenti
        return this.classiChild.every(classe => {
          const emailsClasse = classe.ottieniDocenteMateria(sigla);
          
          // Se non ci sono docenti, non è una materia comune
          if (!emailsClasse || emailsClasse.length === 0) return false;
          
          // Confronta se gli array hanno gli stessi elementi (stesso numero di elementi e stessi valori)
          if (emailsClasse.length !== emailsPrimaClasse.length) return false;
          
          // Verifica che tutti i docenti siano gli stessi
          const emailsPrimaClasseSorted = [...emailsPrimaClasse].sort();
          const emailsClasseSorted = [...emailsClasse].sort();
          
          return emailsClasseSorted.every((email, index) => email === emailsPrimaClasseSorted[index]);
        });
      });
    } catch (e) {
      // In caso di errore ritorno un array vuoto
      return [];
    }
  }

  /**
   * Ottiene l'elenco delle materie non comuni per una specifica articolazione
   * @param {string} siglaIndirizzoArticolazione - Sigla dell'indirizzo dell'articolazione
   * @return {string[]} Array delle sigle delle materie non comuni
   */
  ottieniMaterieNonComuni(siglaIndirizzoArticolazione) {
    // Se non ci sono classi figlie o non è specificato l'indirizzo, ritorno array vuoto
    if (!this.classiChild || this.classiChild.length === 0 || !siglaIndirizzoArticolazione) {
      return [];
    }
    
    try {
      // Cerca la classe specifica per l'indirizzo richiesto
      const classe = this.classiChild.find(c => 
        c.ottieniIndirizzo() === siglaIndirizzoArticolazione
      );
      
      if (!classe) return [];

      // Ottengo le materie comuni
      const materieComuni = this.ottieniMaterieComuni();
      
      // Ottengo tutte le materie della classe specifica
      const materieClasse = classe.ottieniElencoSigleMaterie();
      
      // Filtro per ottenere solo le materie non comuni
      return materieClasse.filter(sigla => !materieComuni.includes(sigla));
    } catch (e) {
      // In caso di errore ritorno un array vuoto
      return [];
    }
  }

  /**
   * Ottiene il docente di una materia comune
   */
  ottieniDocenteMateriaComune(siglaMateria) {
    const materieComuni = this.ottieniMaterieComuni();
    if (!materieComuni.includes(siglaMateria)) return null;
    return this.classiChild[0].ottieniDocenteMateria(siglaMateria);
  }

  /**
   * Ottiene il docente di una materia non comune per una specifica articolazione
   */
  ottieniDocenteMateriaNonComune(siglaMateria, siglaIndirizzoArticolazione) {
    const classe = this.classiChild.find(c => 
      c.ottieniIndirizzo() === siglaIndirizzoArticolazione
    );
    if (!classe) return null;

    const materieNonComuni = this.ottieniMaterieNonComuni(siglaIndirizzoArticolazione);
    if (!materieNonComuni.includes(siglaMateria)) return null;
    
    return classe.ottieniDocenteMateria(siglaMateria);
  }
}

/**
 * Rappresenta un docente
 */
class Docente extends EntitaBase {
  constructor(dati, utils, gestoreDB) {
    super(dati, utils, gestoreDB);
  }

  ottieniNome() {
    return this.ottieniProprieta('NOME', '');
  }

  ottieniCognome() {
    return this.ottieniProprieta('COGNOME', '');
  }

  ottieniEmail() {
    return this.ottieniProprieta('EMAIL');
  }

  ottieniNomeCompleto() {
    return `${this.ottieniNome()} ${this.ottieniCognome()}`.trim();
  }

  ottieniDipartimento() {
    return this.ottieniProprieta('DIPARTIMENTO');
  }

  ottieniGenere() {
    return this.ottieniProprieta('GENERE', 'M');
  }

  ottieniClassiCoordinate() {
    if (!this.db) return [];
    
    const email = this.ottieniEmail();
    if (!email) return [];
    
    return this.db.select('CLASSE')
      .from('CLASSI')
      .where('COORDINATORE', '=', email)
      .execute();
  }

  ottieniClassiTutorPCTO() {
    if (!this.db) return [];
    
    const email = this.ottieniEmail();
    if (!email) return [];
    
    return this.db.select('CLASSE')
      .from('CLASSI')
      .where('TUTOR PCTO', '=', email)
      .execute();
  }

  ottieniClassiTutorOrientamento() {
    if (!this.db) return [];
    
    const email = this.ottieniEmail();
    if (!email) return [];
    
    return this.db.select('CLASSE')
      .from('CLASSI')
      .where('TUTOR ORIENT', '=', email)
      .execute();
  }

  ottieniRuoli() {
    if (!this.db) return [];
    
    const email = this.ottieniEmail();
    if (!email) return [];
    
    return this.db.select('RUOLO')
      .from('RUOLI')
      .where('EMAIL DOCENTE', '=', email)
      .execute();
  }

  ottieniSupplenzeTitolare() {
    if (!this.db) return [];
    
    const email = this.ottieniEmail();
    if (!email) return [];
    
    return this.db.select("CHIAVE UNICA")
      .from('SUPPLENZE')
      .where('DOCENTE TITOLARE', '=', email)
      .execute();
  }

  ottieniSupplenzeSupplente() {
    if (!this.db) return [];
    
    const email = this.ottieniEmail();
    if (!email) return [];
    
    return this.db.select("CHIAVE UNICA")
      .from('SUPPLENZE')
      .where('SUPPLENTE', '=', email)
      .execute();
  }
}

/**
 * Rappresenta una materia
 */
class Materia extends EntitaBase {
  constructor(dati, utils, gestoreDB) {
    super(dati, utils, gestoreDB);
  }

  ottieniSigla() {
    return this.ottieniProprieta('SIGLA');
  }

  ottieniNome() {
    return this.ottieniProprieta('NOME');
  }

  ottieniNomeSintesi() {
    return this.ottieniProprieta('NOME SINTESI');
  }

  ottieniColore1() {
    return this.ottieniProprieta('COLORE1');
  }

  ottieniColore2() {
    return this.ottieniProprieta('COLORE2');
  }

  ottieniSimbolo() {
    return this.ottieniProprieta('SIMBOLO');
  }

  ottieniDocumenti() {
    if (!this.db) return [];
    
    const sigla = this.ottieniSigla();
    if (!sigla) return [];
    
    return this.db.select('ID')
      .from('DOC_GEN')
      .where('MATERIA', '=', sigla)
      .execute();
  }

  ottieniCartelle() {
    if (!this.db) return [];
    
    const sigla = this.ottieniSigla();
    if (!sigla) return [];
    
    return this.db.select('ID')
      .from('FOLDER_GEN')
      .where('MATERIA', '=', sigla)
      .execute();
  }
}

/**
 * Rappresenta un documento
 */
class Documento extends EntitaBase {
  constructor(dati, utils, gestoreDB) {
    super(dati, utils, gestoreDB);
  }

  ottieniId() {
    return this.ottieniProprieta('ID');
  }

  ottieniNome() {
    return this.ottieniProprieta('NOME');
  }

  ottieniFormato() {
    return this.ottieniProprieta('FORMATO DOCUMENTO');
  }

  ottieniIcona() {
    return this.ottieniProprieta('ICONA');
  }

  ottieniColore1() {
    return this.ottieniProprieta('COLORE1');
  }

  ottieniColore2() {
    return this.ottieniProprieta('COLORE2');
  }

  ottieniGestioneArticolazione() {
    return this.ottieniProprieta('GESTIONE ARTICOLAZIONE');
  }

  ottieniAnniCorso() {
    const anni = this.ottieniProprieta('ANNI CORSO');
    return typeof anni === 'string' ? anni.split(',').map(a => parseInt(a.trim(), 10)) : [];
  }

  ottieniSchemaOrganizzativo() {
    return this.ottieniProprieta('SCHEMA ORGANIZZATIVO');
  }

  ottieniCartellaParent() {
    return this.ottieniProprieta('CARTELLA PARENT');
  }

  ottieniSchemaSottocartelle() {
    return this.ottieniProprieta('SCHEMA SOTTOCARTELLE');
  }

  ottieniSottocartelle() {
    return this.ottieniProprieta('SOTTOCARTELLE');
  }

  ottieniPatternNomeFile() {
    return this.ottieniProprieta('PATTERN NOME FILE');
  }

  ottieniTabellaSorgente() {
    return this.ottieniProprieta('TABELLA_SORGENTE');
  }

  ottieniModelliJSON() {
    return this.ottieniProprieta('MODELLI JSON');
  }

  ottieniParametriAggiuntiviGenerazione() {
    return this.ottieniProprieta('PARAMETRI AGGIUNTIVI GENERAZIONE');
  }

  ottieniReferente() {
    return this.ottieniProprieta('REFERENTE');
  }

  ottieniPermessiCoord(tipo = 'file') {
    return tipo === 'file' ? 
      this.ottieniProprieta('PERM_FILE_COORD') : 
      this.ottieniProprieta('PERM_FOLD_COORD');
  }

  ottieniPermessiReferente(tipo = 'file') {
    return tipo === 'file' ? 
      this.ottieniProprieta('PERM_FILE_REFERENTE') : 
      this.ottieniProprieta('PERM_FOLD_REFERENTE');
  }

  ottieniPermessiDocente(tipo = 'file') {
    return tipo === 'file' ? 
      this.ottieniProprieta('PERM_FILE_DOCENTE') : 
      this.ottieniProprieta('PERM_FOLD_DOCENTE');
  }

  ottieniPermessiTutor(tipo = 'file') {
    return tipo === 'file' ? 
      this.ottieniProprieta('PERM_FILE_TUTOR') : 
      this.ottieniProprieta('PERM_FOLD_TUTOR');
  }

  ottieniPermessiAlunno(tipo = 'file') {
    return tipo === 'file' ? 
      this.ottieniProprieta('PERM_FILE_ALUNNO') : 
      this.ottieniProprieta('PERM_FOLD_ALUNNO');
  }

  ottieniPermessiRuolo(ruolo, tipo = 'file') {
    const chiave = tipo === 'file' ? 
      `PERM_FILE_${ruolo}` : 
      `PERM_FOLD_${ruolo}`;
    return this.ottieniProprieta(chiave);
  }

  daStampare() {
    return this.ottieniProprieta('STAMPARE') === true;
  }

  ottieniConsegna() {
    return this.ottieniProprieta('CONSEGNA');
  }
}

/**
 * Rappresenta una carenza di un alunno
 */
class Carenza extends EntitaBase {
  constructor(dati, utils, gestoreDB) {
    super(dati, utils, gestoreDB);
  }

  /**
   * Ottiene l'email dell'alunno
   * @return {string} Email dell'alunno
   */
  ottieniEmailAlunno() {
    return this.ottieniProprieta('EMAIL ALUNNO');
  }

  /**
   * Ottiene la classe dell'alunno
   * @return {string} Classe dell'alunno
   */
  ottieniClasseAlunno() {
    return this.ottieniProprieta('CLASSE ALUNNO');
  }

  /**
   * Ottiene la data del report
   * @return {string} Data del report
   */
  ottieniDataReport() {
    return this.ottieniProprieta('DATA REPORT');
  }

  /**
   * Ottiene la data di notifica
   * @return {string} Data di notifica
   */
  ottieniNotifica() {
    return this.ottieniProprieta('NOTIFICA');
  }

  /**
   * Ottiene il numero di assenze
   * @return {number} Numero di assenze
   */
  ottieniAssenze() {
    const assenze = this.ottieniProprieta('ASSENZE');
    return assenze !== undefined && assenze !== null ? assenze : 0;
  }

  /**
   * Ottiene le note
   * @return {string} Note
   */
  ottieniNote() {
    return this.ottieniProprieta('NOTE', '');
  }

  /**
   * Ottiene le descrizioni delle carenze per materia
   * @return {Object} Oggetto con le carenze per materia
   */
  ottieniCarenzeMaterie() {
    const materie = this.gestoreDB.ottieniSigleMaterie();
    
    const carenze = {};
    materie.forEach(materia => {
      const descrizioneCarenza = this.ottieniProprieta(materia);
      if (descrizioneCarenza && descrizioneCarenza.trim() !== '') {
        carenze[materia] = descrizioneCarenza;
      }
    });
    
    return carenze;
  }

  /**
   * Ottiene la descrizione della carenza per una specifica materia
   * @param {string} siglaMateria - Sigla della materia
   * @return {string} Descrizione della carenza o null se non presente
   */
  ottieniCarenzaMateria(siglaMateria) {
    return this.ottieniProprieta(siglaMateria);
  }

  /**
   * Ottiene l'alunno associato
   * @return {Alunno} Alunno associato o null
   */
  ottieniAlunno() {
    if (!this.db) return null;
    
    const emailAlunno = this.ottieniEmailAlunno();
    if (!emailAlunno) return null;
    
    const risultato = this.db.select('EMAIL')
      .from('ALUNNI')
      .where('EMAIL', '=', emailAlunno)
      .first();
      
    return risultato;
  }

  /**
   * Ottiene la classe associata
   * @return {Classe} Classe associata o null
   */
  ottieniClasse() {
    if (!this.db) return null;
    
    const classeAlunno = this.ottieniClasseAlunno();
    if (!classeAlunno) return null;
    
    const risultato = this.db.select('CLASSE')
      .from('CLASSI')
      .where('CLASSE', '=', classeAlunno)
      .first();
      
    return risultato;
  }

  /**
   * Verifica se c'è carenza in una materia
   * @param {string} siglaMateria - Sigla della materia
   * @return {boolean} True se c'è carenza
   */
  haCarenza(siglaMateria) {
    const carenza = this.ottieniCarenzaMateria(siglaMateria);
    return carenza !== undefined && carenza !== null && carenza.trim() !== '';
  }

  /**
   * Ottiene le materie con carenza
   * @return {string[]} Array di sigle delle materie con carenza
   */
  ottieniMaterieConCarenza() {
    return Object.keys(this.ottieniCarenzeMaterie());
  }

  /**
   * Ottiene il numero di carenze
   * @return {number} Numero di materie con carenza
   */
  ottieniNumeroCarenze() {
    return this.ottieniMaterieConCarenza().length;
  }
  
}



/**
 * Rappresenta un progetto scolastico
 */
class Progetto extends EntitaBase {
  constructor(dati, utils, gestoreDB) {
    super(dati, utils, gestoreDB);
  }

  /**
   * Ottiene la classe associata al progetto
   * @return {string} Nome della classe
   */
  ottieniClasse() {
    return this.ottieniProprieta('CLASSE');
  }

  /**
   * Ottiene il tipo di progetto
   * @return {string} Tipo di progetto
   */
  ottieniTipoProgetto() {
    return this.ottieniProprieta('TIPO PROGETTO');
  }

  /**
   * Ottiene il nome del progetto
   * @return {string} Nome del progetto
   */
  ottieniNomeProgetto() {
    return this.ottieniProprieta('NOME PROGETTO');
  }

  /**
   * Ottiene le ore totali del progetto
   * @return {number} Ore totali
   */
  ottieniOreProgetto() {
    return this.ottieniProprieta('ORE PROGETTO', 0);
  }

  /**
   * Ottiene le ore valide come PCTO
   * @return {number} Ore valide PCTO
   */
  ottieniOreValidePCTO() {
    return this.ottieniProprieta('ORE VALIDE PCTO', 0);
  }

  /**
   * Ottiene la chiave univoca del progetto
   * @return {string} Chiave univoca
   */
  ottieniChiaveUnivoca() {
    return this.ottieniProprieta('CHIAVE UNIVOCA');
  }

  /**
   * Verifica se il progetto è di tipo PCTO
   * @return {boolean} True se è un progetto PCTO
   */
  isPCTO() {
    return this.ottieniTipoProgetto() === 'PCTO';
  }

  /**
   * Verifica se il progetto è di tipo Orientamento
   * @return {boolean} True se è un progetto di orientamento
   */
  isOrientamento() {
    return this.ottieniTipoProgetto() === 'ORIENTAMENTO';
  }
}


// In OGGETTI/Entita.js

/**
 * Rappresenta una cartella generata dal sistema (tabella FOLDER_GEN)
 */
class CartellaGenerata extends EntitaBase {
  constructor(dati, utils, gestoreDB) {
    super(dati, utils, gestoreDB);
  }

  ottieniId() {
    return this.ottieniProprieta('ID');
  }

  ottieniTipo() {
    return this.ottieniProprieta('TIPO');
  }

  ottieniNome() {
    return this.ottieniProprieta('NOME');
  }

  ottieniPercorso() {
    return this.ottieniProprieta('PERCORSO CARTELLA');
  }

  ottieniLink() {
    return this.ottieniProprieta('LINK');
  }

  ottieniClasseAssociata() {
    return this.ottieniProprieta('CLASSE');
  }

  ottieniUtenteAssociato() {
    return this.ottieniProprieta('UTENTE');
  }

  ottieniMateriaAssociata() {
    return this.ottieniProprieta('MATERIA');
  }

  ottieniDataCreazione() {
    const data = this.ottieniProprieta('DATA CREAZIONE');
    return data ? new Date(data) : null;
  }
}

/**
 * Rappresenta un documento generato dal sistema (tabella DOC_GEN)
 * Nota: Il nome dell'entità è DocumentoGenerato per coerenza con la tabella DOC_GEN.
 */
class DocumentoGenerato extends EntitaBase {
  constructor(dati, utils, gestoreDB) {
    super(dati, utils, gestoreDB);
  }

  ottieniId() {
    return this.ottieniProprieta('ID');
  }

  ottieniTipo() {
    return this.ottieniProprieta('TIPO');
  }

  ottieniNome() {
    return this.ottieniProprieta('NOME');
  }

  ottieniStato() {
    return this.ottieniProprieta('STATO');
  }

  ottieniTimestampNotifica() {
    const ts = this.ottieniProprieta('NOTIFICATO');
    return ts ? new Date(ts) : null;
  }

  isNotificato() {
    return !!this.ottieniProprieta('NOTIFICATO');
  }

  ottieniPercorso() {
    return this.ottieniProprieta('PERCORSO CARTELLA');
  }

  ottieniLink() {
    return this.ottieniProprieta('LINK');
  }

  ottieniClasseAssociata() {
    return this.ottieniProprieta('CLASSE');
  }

  ottieniUtenteAssociato() {
    return this.ottieniProprieta('UTENTE');
  }

  ottieniMateriaAssociata() {
    return this.ottieniProprieta('MATERIA');
  }

  ottieniDataCreazione() {
    const data = this.ottieniProprieta('DATA CREAZIONE');
    return data ? new Date(data) : null;
  }

  ottieniDataUltimaModifica() {
    const data = this.ottieniProprieta('DATA ULTIMA MODIFICA');
    return data ? new Date(data) : null;
  }

  ottieniChiaveAlunno() {
    return this.ottieniProprieta('CHIAVE ALUNNO');
  }
}

/**
 * Rappresenta una email inviata dal sistema (tabella EMAIL_INVIATE)
 */
class EmailInviata extends EntitaBase {
  constructor(dati, utils, gestoreDB) {
    super(dati, utils, gestoreDB);
  }

  ottieniChiaveUnivoca() {
    return this.ottieniProprieta('CHIAVE UNIVOCA');
  }

  ottieniDestinatari() {
    const emails = this.ottieniProprieta('EMAIL_DESTINATARI', '');
    return emails.split(',').map(e => e.trim()).filter(Boolean);
  }

  ottieniOggetto() {
    return this.ottieniProprieta('OGGETTO');
  }

  ottieniTimestampInvio() {
    const ts = this.ottieniProprieta('TIMESTAMP_INVIO');
    return ts ? new Date(ts) : null;
  }

  ottieniPatternId() {
    return this.ottieniProprieta('PATTERN_ID');
  }

  ottieniTipoDestinatario() {
    return this.ottieniProprieta('TIPO_DESTINATARIO');
  }

  ottieniDocumentiInviati() {
    const ids = this.ottieniProprieta('DOCUMENTI_INVIATI', '');
    return ids.split(',').map(id => id.trim()).filter(Boolean);
  }

  ottieniCartelleInviate() {
    const ids = this.ottieniProprieta('CARTELLE_INVIATE', '');
    return ids.split(',').map(id => id.trim()).filter(Boolean);
  }

  ottieniStato() {
    return this.ottieniProprieta('STATO');
  }

  ottieniErrore() {
    return this.ottieniProprieta('ERRORE');
  }

  ottieniTestoEmail() {
    return this.ottieniProprieta('TESTO EMAIL');
  }
}


/**
 * Rappresenta un ruolo all'interno dell'istituto (tabella RUOLI)
 */
class Ruolo extends EntitaBase {
  constructor(dati, utils, gestoreDB) {
    super(dati, utils, gestoreDB);
  }

  /**
   * Ottiene il codice identificativo del ruolo (es. "DIRIGENTE", "COLLABORATORE_DS").
   * @returns {string} Il codice del ruolo.
   */
  ottieniCodice() {
    return this.ottieniProprieta('RUOLO');
  }

  /**
   * Ottiene il nome esteso e descrittivo del ruolo.
   * @returns {string} Il nome del ruolo.
   */
  ottieniNome() {
    return this.ottieniProprieta('NOME RUOLO');
  }

  /**
   * Ottiene l'email del docente che ricopre questo ruolo, se applicabile.
   * Per ruoli multipli (es. coordinatore), questo campo è vuoto.
   * @returns {string|null} L'email del docente o null se non specificata.
   */
  ottieniEmailDocente() {
    return this.ottieniProprieta('EMAIL DOCENTE');
  }

  /**
   * Verifica se il ruolo è ricoperto da un singolo docente specifico.
   * @returns {boolean} True se il ruolo ha un docente associato, false altrimenti.
   */
  isRuoloSingolo() {
    return !!this.ottieniEmailDocente();
  }

  /**
   * Recupera l'oggetto completo del docente associato a questo ruolo, se presente.
   * @returns {Object|null} L'oggetto dati del docente o null se non associato.
   */
  ottieniDocente() {
    if (!this.db || !this.isRuoloSingolo()) {
      return null;
    }

    const emailDocente = this.ottieniEmailDocente();
    
    return this.db.select()
      .from('DOCENTI')
      .where('EMAIL', '=', emailDocente)
      .first();
  }
}

/**
 * Classe base astratta per le entità email
 */
class EmailBase {
    constructor(dati = {}) {
        if (this.constructor === EmailBase) {
            throw new Error("EmailBase è una classe astratta");
        }
        this.id = dati.id || null;
        this.dataCreazione = dati.dataCreazione || new Date();
        this.dataModifica = dati.dataModifica || new Date();
    }
}

/**
 * Classe che rappresenta un pattern email dalla tabella PTN_EMAIL.
 * Gestisce la mappatura delle colonne del database e l'integrazione
 * automatica dei messaggi di inizio e fine come box di testo.
 */
class PatternEmail extends EmailBase {
    constructor(dati = {}) {
        super(dati);
        this.id = dati.id || null;
        this.descrizione = dati.descrizione || '';
        this.oggetto = dati.oggetto || '';
        this.coloreHeader = dati.coloreHeader || '#4a86e8';
        this.gruppoDestinatari = dati.gruppoDestinatari || '';
        this.noReply = dati.noReply !== undefined ? dati.noReply : false;
        this.replyTo = dati.replyTo || null;
        this.msgStart = dati.msgStart || '';
        this.msgEnd = dati.msgEnd || '';
        this.azioniPostNotifica = dati.azioniPostNotifica || [];
        
        // Proprietà che conterrà la configurazione completa dei box
        this.boxes = this._processaConfigurazioneBox(dati.boxConfig || []);
    }

    /**
     * Processa la configurazione dei box, aggiungendo automaticamente
     * i box per i messaggi di inizio e fine.
     * @private
     * @param {Array<Object>} boxConfig - La configurazione dei box dal database.
     * @returns {Array<Object>} La configurazione completa dei box.
     */
    _processaConfigurazioneBox(boxConfig) {
        const boxesFinali = [];

        // 1. Aggiungi il box per MSG START se presente
        if (this.msgStart) {
            boxesFinali.push({
                TIPO_BOX: 'testo',
                CONTENUTO: this.msgStart,
                COLORE_SFONDO: 'transparent',
                PADDING: '0 0 15px 0',
                BORDO: 'none'
            });
        }

        // 2. Aggiungi i box configurati nel database
        if (Array.isArray(boxConfig)) {
            boxesFinali.push(...boxConfig);
        }

        // 3. Aggiungi il box per MSG END se presente
        if (this.msgEnd) {
            boxesFinali.push({
                TIPO_BOX: 'testo',
                CONTENUTO: this.msgEnd,
                COLORE_SFONDO: 'transparent',
                PADDING: '15px 0 0 0',
                BORDO: 'none'
            });
        }

        return boxesFinali;
    }

    /**
     * Crea un'istanza di PatternEmail da un record del database.
     * @param {Object} record - La riga dalla tabella PTN_EMAIL.
     * @returns {PatternEmail}
     */
    static fromDatabaseRecord(record) {
        let boxConfig = [];
        try {
            // La colonna BOX CONFIG contiene il JSON con la configurazione dei box
            boxConfig = JSON.parse(record['BOX CONFIG'] || '[]');
        } catch (e) {
            console.error(`Errore nel parsing di BOX CONFIG per il pattern ${record['IDENTIFICATIVO NOTIFICA']}: ${e.message}`);
        }

        return new PatternEmail({
            id: record['IDENTIFICATIVO NOTIFICA'],
            descrizione: record['DESCRIZIONE'],
            oggetto: record['OGGETTO EMAIL'],
            coloreHeader: record['COLORE HEADER'],
            gruppoDestinatari: record['GRUPPO DESTINATARI'],
            noReply: record['NOREPLY'],
            replyTo: record['REPLYTO'],
            msgStart: record['MSG START'],
            msgEnd: record['MSG END'],
            azioniPostNotifica: record['AZIONI POST NOTIFICA'] ? JSON.parse(record['AZIONI POST NOTIFICA']) : [],
            boxConfig: boxConfig
        });
    }
}