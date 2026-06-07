# TODO - Backoffice/Frontoffice GLPI React

## Étape 1 : Inspection & préparation
- [x] Comprendre le code existant (routes, composants, services).
- [x] Identifier les écarts avec la charte : dark UI + palette bleu ciel + zéro emoji.
- [x] Vérifier l’import existant (`CsvDynamicTester`).

## Étape 2 : LoginBack
- [x] Mettre un champ unique « Code Unique / Mot de passe ».
- [x] Pré-remplir temporairement avec `admin1234`.
- [x] Mettre l’UI en dark (no emoji).


## Étape 3 : Dashboard / Tickets / ItemList / CreateTicket
- [ ] Remplacer les emojis par du texte neutre.
- [ ] Uniformiser le design sombre (fond, bordures, accents #38bdf8/#00d2ff).
- [ ] Conserver les calculs et signatures existantes.


## Étape 4 : ImportData
- [ ] Brancher les fichiers sélectionnés vers `CsvDynamicTester` (sans casser sa signature/sa logique).
- [ ] Remplacer les emojis éventuels dans l’UI.


## Étape 5 : Reset (logs/console UI)
- [ ] Supprimer emojis visibles dans la console si applicables.


## Étape 6 : Validation
- [ ] build/dev pour vérifier absence d’erreurs.
- [ ] Grep/contrôle manuel : aucun emoji dans l’interface.
- [ ] Contrôle GLPI: routes admin fonctionnelles, import/reset opérationnels.


