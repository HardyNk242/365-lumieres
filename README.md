# 365 lumieres — guide développeur

Application React (Vite + TypeScript, classes Tailwind) pour un plan de lecture biblique sur 365 jours, avec suivi, statistiques, motivations hebdomadaires et prise de notes locale.

## Installation / lancement
- Prérequis : Node.js
- Installer : `npm install`
- Lancer en dev : `npm run dev`
- Build : `npm run build`
- Preview : `npm run preview`
- Aucune variable d’environnement requise pour le plan, les stats, les notes ou les motivations (l’API Bible fallback de `bibleService` peut nécessiter une clé si utilisée).

## Données de lecture
- Plan principal (3 lectures/jour, 365 jours) : `data.ts` (clé `day_1`…`day_365` avec `matin_ancien_testament`, `midi_sagesse_poesie`, `soir_nouveau_testament`).
- Plan combiné texte (référence) : `data/plan_lecture_combine.json`.
- Plans sources individuels (référence) :  
  - `data/Plan_AT_sans_Psaumes_Lamentations_25mai2025_24mai2026.json`  
  - `data/Plan_Midi_Alternance_Psaume_Prov_Eccl_Lam_versets_COMPLET.json`  
  - `data/plan_lecture_nouveau_testament_2025_2026.json`
- Motivations hebdomadaires : `data/motivations.ts` via `getWeeklyMotivation(weekNum, dayNum)`.

## Stockage local (localStorage)
- `biblePlanStartDate` : date de début (ISO, normalisée à 00:00:00).
- `biblePlanProgress` : progression par jour `{ day_12: { matin, midi, soir } }` (migration gère l’ancien format booléen).
- `biblePlanNotes_v1` : notes par jour/partie `{ dayKey: { matin?: string, midi?: string, soir?: string } }`.

## Types clés (`types.ts`)
- `DayPlan`, `ReadingProgress` (map dayKey → `DayProgress`), `DailyStats` (date ISO, progression 0/1/2/3), `ViewMode`, `ScheduleStatus` / `ScheduleStatusLabel`.

## Logique métier (App.tsx)
- Calcul des stats journalières : `buildDailyStats(startDate, progress)` génère 365 entrées avec `progression = completedSlots/3` et `isValidated = progression === 1`.
- Jours échus : `daysElapsed = min(365, max(0, differenceInCalendarDays(today, startDate) + 1))`.
- Constance : si `daysElapsed = 0` → 0, sinon `round((validatedElapsed / daysElapsed) * 100)` borné 0–100.
- Statut de plan : `getScheduleStatus` (ahead / behind / onTime / notStarted) + `getScheduleStatusMessage`.
- Streak : `computeCurrentStreak` (série en cours jusqu’à today, jours futurs ignorés) et `computeBestStreak` (meilleure série historique).
- Auto-avance : quand un jour passe de incomplet à validé (3 cases ou “Tout valider”), overlay de motivation puis navigation au jour suivant après ~1,5 s (pas de nav au jour 365).
- Overlay motivation : `MotivationOverlay` (flottant, ~5 s), remplace l’ancien toast.

## Vues principales
- Lecteur (ViewMode.READER) : navigation jour ±1, bouton “Aujourd’hui”, carte jour (ReadingCard) avec cases à cocher et bouton “Tout valider”.
- Texte (ViewMode.TEXT_VIEW) : `BibleReader` affiche le passage (via `getBibleText`) et une carte de notes fixe en bas de l’écran.
- Calendrier (ViewMode.CALENDAR) : semaines avec état visuel des lectures (0/1/2/3).
- Stats (ViewMode.STATS) : `ProgressChart` (cartes Jours validés, Constance, Streak + message de statut) et courbe de progression journalière.

## Organisation des pages et actions
- Accueil (si pas de plan initialisé) : écran de bienvenue avec choix de la date de début ; dès validation, le plan est initialisé et la vue passe au Lecteur sur le jour courant.
- Header global : clic sur le titre “365 lumières” pour revenir à “Aujourd’hui”, switch de vues (Lecteur / Calendrier / Stats), bouton Paramètres (modifie la date de début, reset progression).
- Vue Lecteur : flèches précédent/suivant, bouton “Revenir à aujourd’hui”, carte jour avec Matin/Midi/Soir (cases à cocher), bouton “Tout valider”, ouverture d’une lecture (clique sur une ligne) → bascule en vue Texte.
- Vue Texte : header avec retour et référence, texte biblique, carte de notes flottante en bas (auto-save).
- Vue Calendrier : cartes semaine, clic sur un jour pour ouvrir la vue Lecteur sur ce jour, badge “Aujourd’hui”, pastilles d’état (0/1/2/3 lectures).
- Vue Stats : cartes “Jours validés”, “Constance”, “Streak” (tooltip), message de statut (ahead/onTime/behind/notStarted) et graphique de progression journalière.

## Prise de notes
- Service : `services/notesStorage.ts` (PartKey = `matin` | `midi` | `soir`; load/save/get/setStoredNote/hasNote + hook `useReadingNote(dayKey, partKey)`).
- UI : dans `BibleReader`, carte fixe en bas (fond clair, blur), `textarea` relié au hook, feedback “Enregistrement… / Enregistré ✔ / Enregistrement automatique…”.
- Indicateur : badge ✍️ sur `ReadingCard` si une note existe pour la partie.

## Statistiques (ProgressChart)
- Cartes : Jours validés, Constance, Streak (streak actuel + record), tooltip clair sur le streak.
- Graphique : progression journalière (0/33/66/100 %), axes texte FR.
- Message : statut de plan (ahead/onTime/behind/notStarted) affiché sous les cartes.

## Composants principaux
- `App.tsx` : orchestration, navigation, calculs stats/streak/status, overlay motivation.
- `components/ReadingCard.tsx` : carte jour, toggles, badge note, ouverture lecture.
- `components/BibleReader.tsx` : texte biblique, header sticky, notes flottantes.
- `components/ProgressChart.tsx` : stats + courbe + streak + message.
- `components/MotivationOverlay.tsx` : overlay motivation.
- `services/scheduleStatus.ts` : statut de plan + message.
- `services/notesStorage.ts` : stockage notes + hook.
- `services/bibleService.ts` : récupération texte (JSON local + fallback API).

## Règles et comportements importants
- Clé de jour unique : `day_${n}` (1..365) partagée par progression et notes.
- Validation d’une journée : Matin + Midi + Soir cochés (progression par paliers jusqu’à validation complète).
- Streak : séries de jours validés consécutifs, jours futurs ignorés.
- Motivations : déclenchées quand un jour devient validé (message issu de `data/motivations.ts`), overlay affiché ~5 s.
- Auto-save : progression et notes sont persistées immédiatement en localStorage.

## Codes couleur / style (classes Tailwind)
- Palette principale : indigo (`bg-indigo-50/500/600`, `text-indigo-500/600/700/900`) et slate (`bg-slate-50/100/800/900`, `text-slate-400/500/600/700/800/900`, `border-slate-100/200`), avec accents verts pour la validation (`text-green-600/700/900`, `bg-green-400/50/100/200`) et oranges pour la constance/intermédiaire (`text-orange-600/900`, `bg-orange-50/200`, `bg-yellow-50/200`).

- Fonds et cartes : `bg-white`, variantes translucides (`bg-white/95`, `bg-black/20` pour overlays), blur (`backdrop-blur`), ombres douces (`shadow-sm`, `shadow-xl`, `shadow-[0_4px_15px_rgba(0,0,0,0.1)]`).
- Boutons et badges : arrondis (`rounded-full`, `rounded-2xl/3xl`), bordures fines (`border-slate-100/200`), hover indigo/vert, disabled via opacité.
- Overlays : `bg-slate-900/40` pour le fond, cartes blanches translucides avec blur.


## 🌐 Version en ligne

[![Version en ligne](https://img.shields.io/badge/Live-365%20lumi%C3%A8res-7c3aed)](https://hardynk242.github.io/365-lumieres/)

## 📜 Licence

Ce projet est publié sous licence MIT.

- Tu gardes le droit d’auteur : **© 2025 Hardy Nkodia**.
- Toute personne peut consulter, utiliser ou adapter le code.
- Toute réutilisation doit conserver la mention du copyright et la licence MIT.

Si tu utilises ce projet ou t’en inspires, merci de citer :  
**“365 lumières – développé par Hardy Nkodia”**.

