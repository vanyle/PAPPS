# The PAPS app !
Ce repo contient le code pour le site du paps qui permet de partager des recettes de d'organiser sa liste de course.

Plus d'informations ici: https://docs.google.com/document/d/1QQNS7YFifi6eaitlNc8k2h3rlRvja7o_O6aRMfCU7z0/edit#

Liser ce fichier avant de contribuer, il contient des bonnes pratiques à suivre: [CONTRIBUTING.md](CONTRIBUTING.md)

## Structure générale du projet

L'application est construire avec NodeJS et Express. Le back-end communique avec le front-end avec Ajax par le end-point `/q`

Elle se lance en faisant `node server.js`./

Elle utilise une base de donnée "sqlite3" sous la forme de fichier que l'application gère elle-même. Si vous voulez modifier manuellement la base de donnée, elle se trouve dans le dossier `db`