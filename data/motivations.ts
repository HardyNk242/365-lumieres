export interface Motivation {
  id: number;
  week: number;
  texte: string;
  reference: string;
}

const MOTIVATIONS: Motivation[] = [
  {
    "id": 1,
    "week": 1,
    "texte": "Bravo journée {dayNumber} validée : Bravo ! 1 journée validée 🎉 Ton Père, qui voit dans le secret, te récompensera.",
    "reference": "Matthieu 6:6"
  },
  {
    "id": 2,
    "week": 2,
    "texte": "Bravo journée {dayNumber} validée : Dieu voit ta fidélité jour après jour, et cela réjouit son cœur.",
    "reference": "Hébreux 6:10 ; 2 Chroniques 16:9"
  },
  {
    "id": 3,
    "week": 3,
    "texte": "Bravo journée {dayNumber} validée : Bien joué ! Chaque lecture t’enracine un peu plus dans sa présence.",
    "reference": "Colossiens 2:6–7 ; Psaume 1:2–3"
  },
  {
    "id": 4,
    "week": 4,
    "texte": "Bravo journée {dayNumber} validée : Ton Père te regarde avancer avec joie — continue, tu grandis !",
    "reference": "Philippiens 1:6 ; Psaume 139:1–3"
  },
  {
    "id": 5,
    "week": 5,
    "texte": "Bravo journée {dayNumber} validée : Une journée de plus dans la lumière : Dieu t’accompagne.",
    "reference": "Psaume 119:105 ; 1 Jean 1:7"
  },
  {
    "id": 6,
    "week": 6,
    "texte": "Bravo journée {dayNumber} validée : Ta constance est précieuse aux yeux de Dieu.",
    "reference": "1 Corinthiens 15:58 ; Galates 6:9"
  },
  {
    "id": 7,
    "week": 7,
    "texte": "Bravo journée {dayNumber} validée : Pas à pas, Dieu façonne ton cœur — et tu progresses !",
    "reference": "Philippiens 2:13 ; Ézéchiel 36:26"
  },
  {
    "id": 8,
    "week": 8,
    "texte": "Bravo journée {dayNumber} validée : Le ciel célèbre chaque petite fidélité. Continue !",
    "reference": "Luc 16:10 ; Matthieu 25:21"
  },
  {
    "id": 9,
    "week": 9,
    "texte": "Bravo journée {dayNumber} validée : Dieu voit ton effort et Il honore ton engagement.",
    "reference": "Matthieu 6:6 ; 1 Samuel 2:30"
  },
  {
    "id": 10,
    "week": 10,
    "texte": "Bravo journée {dayNumber} validée : Bravo pour ta persévérance : tu construis une discipline céleste.",
    "reference": "Romains 5:3–4 ; Hébreux 12:11"
  },
  {
    "id": 11,
    "week": 11,
    "texte": "Bravo journée {dayNumber} validée : Tu avances dans ta foi — et Dieu se plaît à t’éclairer.",
    "reference": "Colossiens 1:9–10 ; 2 Pierre 3:18"
  },
  {
    "id": 12,
    "week": 12,
    "texte": "Bravo journée {dayNumber} validée : +1 point de fidélité dans ton voyage avec Dieu ✨",
    "reference": "Luc 19:17 ; Hébreux 6:10"
  },
  {
    "id": 13,
    "week": 13,
    "texte": "Bravo journée {dayNumber} validée : Chaque jour validé construit un trésor spirituel en toi.",
    "reference": "Matthieu 6:19–21"
  },
  {
    "id": 14,
    "week": 14,
    "texte": "Bravo journée {dayNumber} validée : La constance est une victoire — et tu viens d’en gagner une !",
    "reference": "Jacques 1:12 ; Galates 6:9"
  },
  {
    "id": 15,
    "week": 15,
    "texte": "Bravo journée {dayNumber} validée : Heaven XP +1 : Dieu aime ta soif de Lui.",
    "reference": "1 Corinthiens 3:8 ; 2 Corinthiens 5:10"
  },
  {
    "id": 16,
    "week": 16,
    "texte": "Bravo journée {dayNumber} validée : Tu montes de niveau dans la sagesse aujourd’hui.",
    "reference": "Jacques 1:5 ; Proverbes 2:3–6"
  },
  {
    "id": 17,
    "week": 17,
    "texte": "Bravo journée {dayNumber} validée : Encore une marche gravie dans ton chemin de foi.",
    "reference": "Psaume 84:6–8 ; Philippiens 3:13–14"
  },
  {
    "id": 18,
    "week": 18,
    "texte": "Bravo journée {dayNumber} validée : Belle progression ! Le Seigneur soutient ton rythme.",
    "reference": "1 Thessaloniciens 4:1 ; Colossiens 1:10"
  },
  {
    "id": 19,
    "week": 19,
    "texte": "Bravo journée {dayNumber} validée : Tu avances, et Dieu sourit à ta fidélité.",
    "reference": "Sophonie 3:17 ; Nombres 6:24–26"
  },
  {
    "id": 20,
    "week": 20,
    "texte": "Bravo journée {dayNumber} validée : Continue : tu écris l’histoire d’une foi solide, jour après jour.",
    "reference": "Matthieu 7:24–25 ; Hébreux 11"
  },
  {
    "id": 21,
    "week": 21,
    "texte": "Bravo journée {dayNumber} validée : Tu gagnes en lumière à chaque lecture accomplie.",
    "reference": "Psaume 119:130 ; 2 Corinthiens 4:6"
  },
  {
    "id": 22,
    "week": 22,
    "texte": "Bravo journée {dayNumber} validée : Ton Père voit ton cœur en secret et Il t’enveloppe de Sa paix.",
    "reference": "Matthieu 6:6"
  },
  {
    "id": 23,
    "week": 23,
    "texte": "Bravo journée {dayNumber} validée : Dieu honore ceux qui Le cherchent fidèlement. Aujourd’hui en est une preuve.",
    "reference": "Hébreux 11:6 ; Proverbes 8:17"
  },
  {
    "id": 24,
    "week": 24,
    "texte": "Bravo journée {dayNumber} validée : Dieu aime ton dévouement — Il marche à tes côtés.",
    "reference": "Romains 12:1 ; Psaume 50:23"
  },
  {
    "id": 25,
    "week": 25,
    "texte": "Bravo journée {dayNumber} validée : Ton engagement touche le cœur du Père.",
    "reference": "Malachie 3:16–17 ; Jérémie 29:13"
  },
  {
    "id": 26,
    "week": 26,
    "texte": "Bravo journée {dayNumber} validée : Dieu te fortifie à chaque instant passé dans Sa Parole.",
    "reference": "Ésaïe 40:29–31 ; Philippiens 4:13"
  },
  {
    "id": 27,
    "week": 27,
    "texte": "Bravo journée {dayNumber} validée : Bravo ! Ce temps avec Dieu porte déjà du fruit.",
    "reference": "Jean 15:5 ; Psaume 1:3"
  },
  {
    "id": 28,
    "week": 28,
    "texte": "Bravo journée {dayNumber} validée : Dieu voit ton effort, même discret, et Il le multiplie.",
    "reference": "2 Corinthiens 9:10–11"
  },
  {
    "id": 29,
    "week": 29,
    "texte": "Bravo journée {dayNumber} validée : Le Père se réjouit de chaque minute que tu Lui consacres.",
    "reference": "Sophonie 3:17 ; Luc 10:39–42"
  },
  {
    "id": 30,
    "week": 30,
    "texte": "Bravo journée {dayNumber} validée : Ce moment avec Dieu a de la valeur éternelle.",
    "reference": "2 Corinthiens 4:17–18"
  },
  {
    "id": 31,
    "week": 31,
    "texte": "Bravo journée {dayNumber} validée : Tu te rapproches du cœur de Dieu, un jour à la fois.",
    "reference": "Jacques 4:8 ; Jérémie 30:21"
  },
  {
    "id": 32,
    "week": 32,
    "texte": "Bravo journée {dayNumber} validée : Une graine de foi plantée aujourd’hui portera un fruit demain.",
    "reference": "Marc 4:26–29 ; Galates 6:7–9"
  },
  {
    "id": 33,
    "week": 33,
    "texte": "Bravo journée {dayNumber} validée : Dieu t’attend chaque matin, et tu réponds à Son appel. Bravo !",
    "reference": "Ésaïe 50:4 ; Psaume 5:4"
  },
  {
    "id": 34,
    "week": 34,
    "texte": "Bravo journée {dayNumber} validée : Tu nourris ton âme — et Dieu veille sur ta croissance.",
    "reference": "Matthieu 4:4 ; 1 Pierre 2:2"
  },
  {
    "id": 35,
    "week": 35,
    "texte": "Bravo journée {dayNumber} validée : Continue : Dieu murmure à ton cœur dans ces moments.",
    "reference": "1 Rois 19:12 ; Jean 10:27"
  },
  {
    "id": 36,
    "week": 36,
    "texte": "Bravo journée {dayNumber} validée : Ta marche d’aujourd’hui réjouit le ciel.",
    "reference": "Luc 15:7 ; Michée 6:8"
  },
  {
    "id": 37,
    "week": 37,
    "texte": "Bravo journée {dayNumber} validée : Dieu accueille chaque petit pas avec amour.",
    "reference": "Luc 15:20 ; Zacharie 4:10"
  },
  {
    "id": 38,
    "week": 38,
    "texte": "Bravo journée {dayNumber} validée : Ta fidélité illumine ton chemin, Dieu marche devant toi.",
    "reference": "Proverbes 4:18 ; Psaume 37:23"
  },
  {
    "id": 39,
    "week": 39,
    "texte": "Bravo journée {dayNumber} validée : Chaque lecture est une porte ouverte vers plus de paix.",
    "reference": "Ésaïe 26:3 ; Jean 14:27"
  },
  {
    "id": 40,
    "week": 40,
    "texte": "Bravo journée {dayNumber} validée : Tu t’approches de Dieu — et Il s’approche de toi.",
    "reference": "Jacques 4:8"
  },
  {
    "id": 41,
    "week": 41,
    "texte": "Bravo journée {dayNumber} validée : Ce moment dans la Parole est un cadeau que Dieu chérit.",
    "reference": "Luc 10:39–42 ; Psaume 119:162"
  },
  {
    "id": 42,
    "week": 42,
    "texte": "Bravo journée {dayNumber} validée : Ta discipline spirituelle est un acte d’amour envers Dieu.",
    "reference": "Jean 14:21 ; 1 Jean 5:3"
  },
  {
    "id": 43,
    "week": 43,
    "texte": "Bravo journée {dayNumber} validée : Bravo : tu construis une vie fondée sur le Roc.",
    "reference": "Matthieu 7:24–25"
  },
  {
    "id": 44,
    "week": 44,
    "texte": "Bravo journée {dayNumber} validée : Chaque jour validé forge une force intérieure durable.",
    "reference": "Éphésiens 3:16 ; Colossiens 1:11"
  },
  {
    "id": 45,
    "week": 45,
    "texte": "Bravo journée {dayNumber} validée : Tu gagnes en maturité spirituelle, et Dieu voit ton progrès.",
    "reference": "Hébreux 5:13–14 ; Éphésiens 4:15"
  },
  {
    "id": 46,
    "week": 46,
    "texte": "Bravo journée {dayNumber} validée : Ta constance construit un cœur stable et lumineux.",
    "reference": "Psaume 57:8 ; 1 Corinthiens 15:58"
  },
  {
    "id": 47,
    "week": 47,
    "texte": "Bravo journée {dayNumber} validée : Un jour de plus gagné dans la Parole ! Courage !",
    "reference": "Romains 13:11–12 ; Éphésiens 5:16"
  },
  {
    "id": 48,
    "week": 48,
    "texte": "Bravo journée {dayNumber} validée : Ta persévérance déplace des montagnes invisibles.",
    "reference": "Marc 11:23 ; Hébreux 10:36"
  },
  {
    "id": 49,
    "week": 49,
    "texte": "Bravo journée {dayNumber} validée : Continue : tu bâtis une relation vivante avec Dieu.",
    "reference": "Jean 15:4–5 ; Apocalypse 3:20"
  },
  {
    "id": 50,
    "week": 50,
    "texte": "Bravo journée {dayNumber} validée : Dieu aime te voir venir à Lui avec fidélité.",
    "reference": "Hébreux 4:16 ; Matthieu 11:28"
  },
  {
    "id": 51,
    "week": 51,
    "texte": "Bravo journée {dayNumber} validée : Tu avances dans la vérité, et la vérité te rendra libre.",
    "reference": "Jean 8:31–32 ; Jean 17:17"
  },
  {
    "id": 52,
    "week": 52,
    "texte": "Bravo journée {dayNumber} validée : Le ciel honore chaque minute consacrée à Dieu.",
    "reference": "Hébreux 6:10 ; Matthieu 10:42"
  },
  {
    "id": 53,
    "week": 53,
    "texte": "Bravo journée {dayNumber} validée : Jour après jour, Dieu façonne en toi un cœur victorieux.",
    "reference": "Romains 8:37 ; Philippiens 1:6"
  }
];

export function getWeeklyMotivation(week: number, dayNumber: number): { texte: string; reference: string } {
  // Default to week 1 if out of bounds
  const item = MOTIVATIONS.find(m => m.week === week) ?? MOTIVATIONS[0];
  
  const texte = item.texte.replace("{dayNumber}", String(dayNumber));
  
  return {
    texte,
    reference: item.reference
  };
}