# The PAPS app !
Ce repo contient le code pour le site du paps qui permet de partager des recettes de d'organiser sa liste de course.

Plus d'informations ici: https://docs.google.com/document/d/1QQNS7YFifi6eaitlNc8k2h3rlRvja7o_O6aRMfCU7z0/edit#

Lisez ce fichier avant de contribuer, il contient des bonnes pratiques à suivre: [CONTRIBUTING.md](CONTRIBUTING.md)

## Structure générale du projet

L'application est construire avec NodeJS et Express. Le back-end communique avec le front-end avec Ajax par le end-point `/q`

Elle utilise une base de donnée "rethinkdb" que l'application lance et gère elle-même. Le dossier vers la base de donnée se trouve dans le fichier de config.

Elle se lance en faisant `npm start` ou `node server.js`

## Installation

### Node

Si Node n'est pas installé, on commence par l'installer avec ces commandes (Pour Ubuntu ou Debian)

```sh
sudo apt-get install nodejs
sudo apt-get install npm
```

Sur Windows, Node est disponible ici: https://nodejs.org/en/

Pour savoir si Node est installé, entrez la commande `npm -v` dans un terminal. Si elle affiche une version, c'est que Node marche.

### PAPPS

On commence par télécharger le projet et installer les libraries requises par node:

```
git clone https://github.com/vanyle/PAPPS/
cd PAPPS
npm install
```

Ensuite, il faut installer la base de donner "rethinkdb". Les instructions générales se trouvent ici: https://rethinkdb.com/docs/install/

### Pour Debian

```sh
export CODENAME=`lsb_release -cs`
echo "deb https://download.rethinkdb.com/repository/debian-$CODENAME $CODENAME main" | sudo tee /etc/apt/sources.list.d/rethinkdb.list
wget -qO- https://download.rethinkdb.com/repository/raw/pubkey.gpg | sudo apt-key add -
sudo apt-get update
sudo apt-get install rethinkdb
```

### Pour Ubuntu

```sh
source /etc/lsb-release && echo "deb https://download.rethinkdb.com/repository/ubuntu-$DISTRIB_CODENAME $DISTRIB_CODENAME main" | sudo tee /etc/apt/sources.list.d/rethinkdb.list
wget -qO- https://download.rethinkdb.com/repository/raw/pubkey.gpg | sudo apt-key add -
sudo apt-get update
sudo apt-get install rethinkdb
```

### Pour Windows

Téléchargez "RethinkDB" depuis cette URL: https://download.rethinkdb.com/repository/raw/windows/rethinkdb-2.3.5.zip

Décompressez le zip téléchargé et mettez l'exécutable `rethinkdb.exe` dans votre PATH ou dans le même dossier que `database.js` i.e. `/back`

## Faire marcher le HTTPS

Par défaut, le site utilise HTTP. Si vous le lancer, vous verrez aussi une erreur comme quoi le HTTPS ne marche pas du type: "Unable to start HTTPS Server. Did you put the HTTPS secrets inside ./secret/ ?"

Pour faire marcher le HTTPS, il faut faire exactement ça, mettre les clefs HTTPS dans le dossier secret, qui devra alors ressembler à ça:

![contenu_du_dossier_secret](./doc/1.png)

Vous pouvez alors lancer le serveur et le https marchera. Pour obtenir les clefs HTTPS, suivez le tutoriel de Viarezo avec Let's Encrypt et certbot. Celui-ci stocke les clefs dans `/etc/letsencrypt/live/` habituellement.

Alternativement, vous pouvez changer la valeur de `https_secret` dans la config pour mettre le chemin vers vos clef (`/etc/letsencrypt/live/nom_du_site` en général si vous utilisez certbot)

## Structure du front-end

Le front-end se trouve dans le dossier `/client`. Tout fichier se trouvant dedans est fourni de manière statique au client et est accesible à l'adresse correspondant au nom du fichier (par exemple `client/style.css` est disponible à l'adresse `www.nom_du_site.com/style.css`)

Je recommande de séparer le front en plusieurs fichiers `.html` avec chaque fichier correspondant à un onglet du site. De plus, je recommande les bibliothèques suivantes:

- https://fontawesome.com/ pour les icones (version 5)
- https://fullcalendar.io/ pour le calendrier
- https://editorjs.io/ pour l'éditeur de recette (je sais pas si ça sera nécessaire mais si les gens veulent mettre des titres dans leurs recettes et du gras, ça peut être sympa)
- Eviter JQuery si possible sauf si vous estimez que c'est absolument nécessaire.

Bien sûr, vous pouvez utiliser les bibliothèques que vous voulez, ce sont des suggestions. Sinon, prenez bien les version `minified` des bibliothèques quand vous les intégrez.

## Structure du back-end

Le back-end communique avec le front avec l'adresse `/q`. Les arguments sont fournis au front avec des paramètres GET. Le back-end utilise une base de donnée RethinkDB qui se base sur une structure JSON pour stocker les données. Plus d'info ici: https://rethinkdb.com/

Le schéma de donnée est décrit dans `./doc/fake_data.js` qui permet aussi de peupler la base de donnée avec des données fictives pour tester l'interface. (changer la configuration pour activer les données fictives.)

### Listes des end-points (susceptible de changer.)

GET `/q?type=recipes`

Renvoie la liste de toutes les recettes publiques du site au format JSON.

GET `/q?type=users`

Renvoie la liste de tous les utilisateurs publiques du site au format JSON (non implémenté pour l'instant)

N'importe quel end-point est susceptible de générer une erreur lorsqu'il est appelé. Dans ce cas, il retournera un objet de la forme `{error:"Description of the error"}`. La description de l'erreur ne dévoile aucune information confidentielle sur la structure de la backend. Des exemples d'erreurs sont: `database not ready. Please wait a bit.`  ou `type option not recognized`

