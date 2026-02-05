/**
 * German School Curriculum (Lehrplan) Data
 * Covers major Bundesländer and school types
 */

export interface CurriculumTopic {
  id: string
  name: string
  nameEn: string
  prerequisites: string[]
  nextTopics: string[]
  keyCompetencies: string[]
  commonMistakes: string[]
  realWorldApplications: string[]
}

export interface SubjectCurriculum {
  topics: Record<string, CurriculumTopic>
  gradeProgression: Record<number, string[]> // grade -> topic IDs
}

export interface Curriculum {
  subjects: Record<string, SubjectCurriculum>
}

// German Math Curriculum (simplified, covers Grundschule through Gymnasium)
export const MATH_CURRICULUM: SubjectCurriculum = {
  topics: {
    // Grundschule (1-4)
    'addition_subtraction': {
      id: 'addition_subtraction',
      name: 'Addition und Subtraktion',
      nameEn: 'Addition and Subtraction',
      prerequisites: [],
      nextTopics: ['multiplication_division', 'place_value'],
      keyCompetencies: ['Grundrechenarten', 'Kopfrechnen', 'Zahlenverständnis'],
      commonMistakes: ['Zehnerübergang vergessen', 'Stellenwert verwechselt', 'Vorzeichen falsch'],
      realWorldApplications: ['Einkaufen', 'Taschengeld zählen', 'Punkte beim Spiel']
    },
    'multiplication_division': {
      id: 'multiplication_division',
      name: 'Multiplikation und Division',
      nameEn: 'Multiplication and Division',
      prerequisites: ['addition_subtraction'],
      nextTopics: ['fractions_intro', 'written_arithmetic'],
      keyCompetencies: ['Einmaleins', 'Teilen mit Rest', 'Umkehraufgaben'],
      commonMistakes: ['Einmaleins-Lücken', 'Division durch Null', 'Reihenfolge falsch'],
      realWorldApplications: ['Verteilen von Süßigkeiten', 'Gruppen bilden', 'Rezepte verdoppeln']
    },
    'place_value': {
      id: 'place_value',
      name: 'Stellenwertsystem',
      nameEn: 'Place Value System',
      prerequisites: ['addition_subtraction'],
      nextTopics: ['large_numbers', 'decimals'],
      keyCompetencies: ['Einer, Zehner, Hunderter', 'Zahlen zerlegen', 'Zahlen vergleichen'],
      commonMistakes: ['Stellen verwechselt', 'Null als Platzhalter vergessen'],
      realWorldApplications: ['Geldbeträge', 'Hausnummern', 'Jahreszahlen']
    },
    'fractions_intro': {
      id: 'fractions_intro',
      name: 'Brüche Einführung',
      nameEn: 'Introduction to Fractions',
      prerequisites: ['multiplication_division'],
      nextTopics: ['fractions_operations', 'decimals'],
      keyCompetencies: ['Bruchteile erkennen', 'Kürzen und Erweitern', 'Brüche vergleichen'],
      commonMistakes: ['Zähler und Nenner verwechselt', 'Falsch gekürzt', 'Ungleichnamige Brüche addiert'],
      realWorldApplications: ['Pizza teilen', 'Kuchenrezepte', 'Zeitangaben (halbe Stunde)']
    },
    // Sekundarstufe I (5-10)
    'fractions_operations': {
      id: 'fractions_operations',
      name: 'Bruchrechnung',
      nameEn: 'Fraction Operations',
      prerequisites: ['fractions_intro', 'multiplication_division'],
      nextTopics: ['ratios_proportions', 'algebra_intro'],
      keyCompetencies: ['Addition/Subtraktion von Brüchen', 'Multiplikation/Division', 'Gemischte Zahlen'],
      commonMistakes: ['Hauptnenner nicht gefunden', 'Division als Multiplikation mit Kehrwert vergessen'],
      realWorldApplications: ['Kochen mit Rezepten', 'Rabatte berechnen', 'Zeitplanung']
    },
    'decimals': {
      id: 'decimals',
      name: 'Dezimalzahlen',
      nameEn: 'Decimal Numbers',
      prerequisites: ['place_value', 'fractions_intro'],
      nextTopics: ['percentages', 'ratios_proportions'],
      keyCompetencies: ['Dezimalstellen', 'Umrechnung Bruch-Dezimal', 'Runden'],
      commonMistakes: ['Komma falsch gesetzt', 'Nullen nach Komma ignoriert', 'Runden falsch'],
      realWorldApplications: ['Geldbeträge', 'Messwerte', 'Sportzeiten']
    },
    'percentages': {
      id: 'percentages',
      name: 'Prozentrechnung',
      nameEn: 'Percentages',
      prerequisites: ['decimals', 'fractions_operations'],
      nextTopics: ['interest_calculation', 'statistics'],
      keyCompetencies: ['Grundwert, Prozentwert, Prozentsatz', 'Erhöhung/Verminderung', 'Dreisatz'],
      commonMistakes: ['Grundwert und Prozentwert verwechselt', 'Prozent von Prozent falsch'],
      realWorldApplications: ['Rabatte beim Einkaufen', 'Notenberechnung', 'Wahlergebnisse']
    },
    'algebra_intro': {
      id: 'algebra_intro',
      name: 'Algebra Einführung',
      nameEn: 'Introduction to Algebra',
      prerequisites: ['fractions_operations'],
      nextTopics: ['linear_equations', 'term_manipulation'],
      keyCompetencies: ['Variablen verstehen', 'Terme aufstellen', 'Einfache Gleichungen'],
      commonMistakes: ['Variable als festen Wert behandelt', 'Vorzeichen bei Klammern'],
      realWorldApplications: ['Unbekannte finden', 'Formeln in Physik', 'Programmierung']
    },
    'linear_equations': {
      id: 'linear_equations',
      name: 'Lineare Gleichungen',
      nameEn: 'Linear Equations',
      prerequisites: ['algebra_intro'],
      nextTopics: ['linear_functions', 'systems_of_equations'],
      keyCompetencies: ['Äquivalenzumformungen', 'Probe machen', 'Textaufgaben lösen'],
      commonMistakes: ['Umformung nur auf einer Seite', 'Division durch Variable', 'Klammern falsch aufgelöst'],
      realWorldApplications: ['Preisvergleiche', 'Mischungsaufgaben', 'Bewegungsaufgaben']
    },
    'geometry_basics': {
      id: 'geometry_basics',
      name: 'Geometrie Grundlagen',
      nameEn: 'Basic Geometry',
      prerequisites: ['multiplication_division'],
      nextTopics: ['area_perimeter', 'angles', 'triangles'],
      keyCompetencies: ['Formen erkennen', 'Symmetrie', 'Koordinatensystem'],
      commonMistakes: ['Formen verwechselt', 'Achsensymmetrie vs Punktsymmetrie'],
      realWorldApplications: ['Kunst und Design', 'Architektur', 'Kartennavigation']
    },
    'area_perimeter': {
      id: 'area_perimeter',
      name: 'Fläche und Umfang',
      nameEn: 'Area and Perimeter',
      prerequisites: ['geometry_basics', 'multiplication_division'],
      nextTopics: ['volume', 'pythagorean_theorem'],
      keyCompetencies: ['Flächenformeln', 'Umfangformeln', 'Einheiten umrechnen'],
      commonMistakes: ['Fläche und Umfang verwechselt', 'Einheiten vergessen', 'Formel falsch angewendet'],
      realWorldApplications: ['Zimmer streichen', 'Garten anlegen', 'Stoff kaufen']
    },
    // Gymnasium Oberstufe
    'functions': {
      id: 'functions',
      name: 'Funktionen',
      nameEn: 'Functions',
      prerequisites: ['linear_equations', 'coordinate_system'],
      nextTopics: ['quadratic_functions', 'exponential_functions'],
      keyCompetencies: ['Funktionsbegriff', 'Graphen zeichnen', 'Definitions-/Wertebereich'],
      commonMistakes: ['x und y verwechselt', 'Asymptoten vergessen', 'Nullstellen falsch berechnet'],
      realWorldApplications: ['Wirtschaftliche Modelle', 'Naturwissenschaften', 'Datenanalyse']
    },
    'quadratic_functions': {
      id: 'quadratic_functions',
      name: 'Quadratische Funktionen',
      nameEn: 'Quadratic Functions',
      prerequisites: ['functions', 'linear_equations'],
      nextTopics: ['polynomial_functions', 'calculus_intro'],
      keyCompetencies: ['Scheitelpunktform', 'pq-Formel', 'Parabel zeichnen'],
      commonMistakes: ['Vorzeichen in pq-Formel', 'Scheitelpunkt falsch berechnet'],
      realWorldApplications: ['Wurfbahnen', 'Brückenbögen', 'Gewinnmaximierung']
    },
  },
  gradeProgression: {
    1: ['addition_subtraction'],
    2: ['addition_subtraction', 'place_value'],
    3: ['multiplication_division', 'place_value', 'geometry_basics'],
    4: ['multiplication_division', 'fractions_intro', 'geometry_basics'],
    5: ['fractions_intro', 'decimals', 'geometry_basics', 'area_perimeter'],
    6: ['fractions_operations', 'decimals', 'area_perimeter'],
    7: ['percentages', 'algebra_intro', 'geometry_basics'],
    8: ['linear_equations', 'percentages', 'geometry_basics'],
    9: ['linear_equations', 'functions', 'geometry_basics'],
    10: ['functions', 'quadratic_functions'],
    11: ['quadratic_functions', 'functions'],
    12: ['quadratic_functions', 'functions'],
  }
}

// German Language Curriculum
export const GERMAN_CURRICULUM: SubjectCurriculum = {
  topics: {
    'reading_comprehension': {
      id: 'reading_comprehension',
      name: 'Leseverständnis',
      nameEn: 'Reading Comprehension',
      prerequisites: [],
      nextTopics: ['text_analysis', 'argumentation'],
      keyCompetencies: ['Textinhalt erfassen', 'Schlüsselwörter finden', 'Zusammenfassen'],
      commonMistakes: ['Zu oberflächlich gelesen', 'Hauptaussage verfehlt', 'Details übersehen'],
      realWorldApplications: ['Nachrichten verstehen', 'Anleitungen befolgen', 'Bücher genießen']
    },
    'text_analysis': {
      id: 'text_analysis',
      name: 'Textanalyse',
      nameEn: 'Text Analysis',
      prerequisites: ['reading_comprehension'],
      nextTopics: ['interpretation', 'essay_writing'],
      keyCompetencies: ['Stilmittel erkennen', 'Textsorte bestimmen', 'Intention des Autors'],
      commonMistakes: ['Stilmittel nur benannt, nicht erklärt', 'Keine Textbelege', 'Meinung statt Analyse'],
      realWorldApplications: ['Werbung durchschauen', 'Politische Reden verstehen', 'Medienanalyse']
    },
    'argumentation': {
      id: 'argumentation',
      name: 'Argumentation',
      nameEn: 'Argumentation',
      prerequisites: ['reading_comprehension'],
      nextTopics: ['essay_writing', 'debate'],
      keyCompetencies: ['These aufstellen', 'Argumente strukturieren', 'Gegenargumente entkräften'],
      commonMistakes: ['Nur Behauptungen ohne Begründung', 'Keine Beispiele', 'Einseitige Argumentation'],
      realWorldApplications: ['Diskussionen führen', 'Bewerbungsschreiben', 'Überzeugend präsentieren']
    },
    'essay_writing': {
      id: 'essay_writing',
      name: 'Erörterung',
      nameEn: 'Essay Writing',
      prerequisites: ['argumentation', 'text_analysis'],
      nextTopics: ['interpretation'],
      keyCompetencies: ['Einleitung-Hauptteil-Schluss', 'Pro/Contra abwägen', 'Eigene Meinung begründen'],
      commonMistakes: ['Kein roter Faden', 'Schluss ohne eigene Stellungnahme', 'Argumente nicht verknüpft'],
      realWorldApplications: ['Blogbeiträge schreiben', 'Leserbriefe', 'Akademische Arbeiten']
    },
    'grammar_basics': {
      id: 'grammar_basics',
      name: 'Grammatik Grundlagen',
      nameEn: 'Basic Grammar',
      prerequisites: [],
      nextTopics: ['sentence_structure', 'punctuation'],
      keyCompetencies: ['Wortarten', 'Zeitformen', 'Fälle (Kasus)'],
      commonMistakes: ['Dativ/Akkusativ verwechselt', 'Zeitformen gemischt', 'Adjektivendungen'],
      realWorldApplications: ['Korrekt schreiben', 'Fremdsprachen lernen', 'Professionelle Kommunikation']
    },
    'spelling': {
      id: 'spelling',
      name: 'Rechtschreibung',
      nameEn: 'Spelling',
      prerequisites: [],
      nextTopics: ['punctuation', 'grammar_basics'],
      keyCompetencies: ['Groß-/Kleinschreibung', 'Dehnung und Schärfung', 'Fremdwörter'],
      commonMistakes: ['das/dass verwechselt', 'Dehnungs-h vergessen', 's/ss/ß falsch'],
      realWorldApplications: ['Bewerbungen schreiben', 'E-Mails', 'Soziale Medien']
    },
    'punctuation': {
      id: 'punctuation',
      name: 'Zeichensetzung',
      nameEn: 'Punctuation',
      prerequisites: ['grammar_basics'],
      nextTopics: ['sentence_structure'],
      keyCompetencies: ['Kommaregeln', 'Direkte Rede', 'Satzzeichen am Satzende'],
      commonMistakes: ['Komma vor "und"', 'Komma bei Relativsätzen vergessen', 'Doppelpunkt falsch'],
      realWorldApplications: ['Texte strukturieren', 'Lesbarkeit verbessern', 'Missverständnisse vermeiden']
    },
  },
  gradeProgression: {
    1: ['spelling'],
    2: ['spelling', 'grammar_basics'],
    3: ['spelling', 'grammar_basics', 'reading_comprehension'],
    4: ['grammar_basics', 'reading_comprehension', 'punctuation'],
    5: ['grammar_basics', 'reading_comprehension', 'punctuation'],
    6: ['text_analysis', 'grammar_basics', 'punctuation'],
    7: ['text_analysis', 'argumentation', 'punctuation'],
    8: ['argumentation', 'essay_writing'],
    9: ['essay_writing', 'text_analysis'],
    10: ['essay_writing', 'text_analysis'],
    11: ['essay_writing', 'text_analysis'],
    12: ['essay_writing', 'text_analysis'],
  }
}

// All curricula
export const GERMAN_SCHOOL_CURRICULUM: Record<string, SubjectCurriculum> = {
  'Mathematik': MATH_CURRICULUM,
  'Mathe': MATH_CURRICULUM,
  'Math': MATH_CURRICULUM,
  'Deutsch': GERMAN_CURRICULUM,
  'German': GERMAN_CURRICULUM,
}

// Helper function to find relevant topics based on weaknesses
export function findRelevantTopics(
  subject: string,
  grade: number,
  weaknesses: string[]
): CurriculumTopic[] {
  const curriculum = GERMAN_SCHOOL_CURRICULUM[subject]
  if (!curriculum) return []

  const relevantTopics: CurriculumTopic[] = []
  const gradeTopics = curriculum.gradeProgression[grade] || []

  // Search for topics that match weaknesses
  for (const weakness of weaknesses) {
    const lowerWeakness = weakness.toLowerCase()

    for (const topicId of gradeTopics) {
      const topic = curriculum.topics[topicId]
      if (!topic) continue

      // Check if weakness matches topic name, competencies, or common mistakes
      const matches =
        topic.name.toLowerCase().includes(lowerWeakness) ||
        topic.nameEn.toLowerCase().includes(lowerWeakness) ||
        topic.keyCompetencies.some(c => c.toLowerCase().includes(lowerWeakness)) ||
        topic.commonMistakes.some(m => m.toLowerCase().includes(lowerWeakness))

      if (matches && !relevantTopics.find(t => t.id === topic.id)) {
        relevantTopics.push(topic)
      }
    }
  }

  // If no matches, return all grade-level topics
  if (relevantTopics.length === 0) {
    return gradeTopics.map(id => curriculum.topics[id]).filter(Boolean)
  }

  return relevantTopics
}

// Get prerequisites for a topic
export function getPrerequisites(
  subject: string,
  topicId: string
): CurriculumTopic[] {
  const curriculum = GERMAN_SCHOOL_CURRICULUM[subject]
  if (!curriculum) return []

  const topic = curriculum.topics[topicId]
  if (!topic) return []

  return topic.prerequisites
    .map(id => curriculum.topics[id])
    .filter(Boolean)
}

// Get next topics after mastering current
export function getNextTopics(
  subject: string,
  topicId: string
): CurriculumTopic[] {
  const curriculum = GERMAN_SCHOOL_CURRICULUM[subject]
  if (!curriculum) return []

  const topic = curriculum.topics[topicId]
  if (!topic) return []

  return topic.nextTopics
    .map(id => curriculum.topics[id])
    .filter(Boolean)
}
