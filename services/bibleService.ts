
// Stratégie : Tentative chargement JSON via CDN -> Fallback API OpenRouter
const BIBLE_JSON_URL = "https://cdn.jsdelivr.net/gh/HardyNk242/lsg_bible@main/segond_1910.json";

// Clé API OpenRouter pour le fallback dynamique (au cas où le JSON échoue)
const OPENROUTER_API_KEY = "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";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

interface JsonVerse {
  book_name: string;
  book: number;
  chapter: number;
  verse: number;
  text: string;
}

interface JsonBible {
  metadata: any;
  verses: JsonVerse[];
}

interface Verse {
  type: 'verse';
  num: string;
  text: string;
}

interface Heading {
  type: 'heading';
  text: string;
}

type ContentItem = Verse | Heading;

interface BibleResponse {
  title: string;
  content: ContentItem[];
  source?: 'local' | 'api';
}

// Cache pour stocker la Bible une fois téléchargée
let bibleCache: JsonBible | null = null;
let downloadFailed = false;

// Fonction pour charger la Bible complète
const loadBible = async (): Promise<JsonBible | null> => {
  if (bibleCache) return bibleCache;
  if (downloadFailed) return null;

  try {
    console.log("Téléchargement de la Bible depuis :", BIBLE_JSON_URL);
    const response = await fetch(BIBLE_JSON_URL);
    
    if (!response.ok) {
        throw new Error(`Impossible de télécharger le fichier Bible (${response.status})`);
    }
    
    const data = await response.json();
    bibleCache = data;
    console.log("Bible téléchargée avec succès.");
    return data;
  } catch (error) {
    console.error("Erreur chargement Bible JSON:", error);
    downloadFailed = true; // Activer le mode API Fallback
    return null;
  }
};

// Fonction utilitaire pour parser les plages (ex: "1-3" -> [1,2,3])
const parseRange = (rangeStr: string): number[] => {
  if (!rangeStr) return [];
  const parts = rangeStr.split(/[-–]/).map(p => parseInt(p.trim(), 10)).filter(n => !isNaN(n));
  if (parts.length === 0) return [];
  if (parts.length === 1) return [parts[0]];
  
  const start = parts[0];
  const end = parts[1];
  const list = [];
  for (let i = start; i <= end; i++) {
    list.push(i);
  }
  return list;
};

// --- LOGIQUE FALLBACK API (OPENROUTER) ---
const fetchFromOpenRouter = async (reference: string): Promise<BibleResponse> => {
    console.log("Mode Fallback API activé pour :", reference);
    
    if (!OPENROUTER_API_KEY) {
        return {
            title: "Erreur",
            content: [
                { type: 'heading', text: "Erreur de chargement" },
                { type: 'verse', num: "!", text: "Le fichier Bible n'a pas pu être téléchargé et l'API n'est pas configurée." }
            ]
        };
    }

    const prompt = `
    Tâche : Fournir le texte biblique complet pour la référence : "${reference}".
    Version : Louis Segond (1910).
    
    IMPORTANT : Réponds UNIQUEMENT avec un JSON valide. Pas de texte avant ni après.
    
    Format JSON attendu :
    {
      "title": "${reference}",
      "content": [
        { "type": "heading", "text": "Nom Livre Chapitre X" },
        { "type": "verse", "num": "1", "text": "Texte..." }
      ]
    }
    `;

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "HTTP-Referer": "https://365lumieres.app",
                "X-Title": "365 Lumières",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "google/gemini-2.0-flash-lite-preview-02-05:free",
                messages: [{ role: "user", content: prompt }]
            })
        });

        if (!response.ok) throw new Error(`Erreur API (${response.status})`);

        const data = await response.json();
        let contentString = data.choices[0]?.message?.content || "";
        
        contentString = contentString.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
        
        const parsed = JSON.parse(contentString);
        return { ...parsed, source: 'api' };

    } catch (error) {
        console.error("Erreur API OpenRouter:", error);
        return {
            title: reference,
            content: [
                { type: 'heading', text: "Service indisponible." },
                { type: 'verse', num: "Info", text: "Impossible de récupérer le texte actuellement." }
            ]
        };
    }
};

export const getBibleText = async (reference: string): Promise<BibleResponse> => {
  // 1. Tenter de charger le JSON
  const bible = await loadBible();

  // 2. Si JSON indisponible, utiliser l'API
  if (!bible) {
      return fetchFromOpenRouter(reference);
  }

  // 3. Mode Local (JSON chargé)
  let contentOutput: ContentItem[] = [];
  const cleanRef = reference.replace(/\(.*\)/, '').replace(/\u00A0/g, ' ').trim();
  const segments = cleanRef.split(';').map(s => s.trim());

  for (const segment of segments) {
    // Recherche du livre dans le JSON
    const availableBooks = Array.from(new Set(bible.verses.map(v => v.book_name)));
    availableBooks.sort((a, b) => b.length - a.length);

    let foundBook = "";
    let remainingStr = "";

    for (const bookName of availableBooks) {
        if (segment.toLowerCase().startsWith(bookName.toLowerCase())) {
            foundBook = bookName;
            remainingStr = segment.slice(bookName.length).trim();
            break;
        }
    }

    if (!foundBook) {
        contentOutput.push({ type: 'heading', text: `Livre non trouvé : ${segment}` });
        continue;
    }

    let targetChapters: number[] = [];
    let verseStart = -1;
    let verseEnd = -1;

    if (remainingStr.includes(':')) {
        const parts = remainingStr.split(':');
        const chap = parseInt(parts[0].trim(), 10);
        targetChapters = [chap];
        
        const versesPart = parts[1].trim();
        const vRange = parseRange(versesPart);
        if (vRange.length > 0) {
            verseStart = vRange[0];
            verseEnd = vRange[vRange.length - 1];
        }
    } else {
        targetChapters = parseRange(remainingStr);
    }

    const relevantVerses = bible.verses.filter(v => {
        if (v.book_name !== foundBook) return false;
        if (!targetChapters.includes(v.chapter)) return false;
        if (verseStart !== -1 && targetChapters.length === 1) {
            if (v.verse < verseStart || v.verse > verseEnd) return false;
        }
        return true;
    });

    if (relevantVerses.length === 0) {
        contentOutput.push({ type: 'heading', text: `Texte non trouvé pour ${segment}` });
        continue;
    }

    let currentChapter = -1;
    contentOutput.push({ type: 'heading', text: segment });

    relevantVerses.forEach(v => {
        if (v.chapter !== currentChapter) {
            contentOutput.push({ type: 'heading', text: `${v.book_name} ${v.chapter}` });
            currentChapter = v.chapter;
        }
        contentOutput.push({ 
            type: 'verse', 
            num: v.verse.toString(), 
            text: v.text 
        });
    });
  }

  return {
    title: reference,
    content: contentOutput,
    source: 'local'
  };
};
