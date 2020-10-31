# The PAPS app !
Ce repo contient le code pour le site du paps qui permet de partager des recettes de d'organiser sa liste de course.

Plus d'informations ici: https://docs.google.com/document/d/1QQNS7YFifi6eaitlNc8k2h3rlRvja7o_O6aRMfCU7z0/edit#

Lisez ce fichier avant de contribuer, il contient des bonnes pratiques à suivre: [CONTRIBUTING.md](CONTRIBUTING.md)

## Structure générale du projet

L'application est construire avec NodeJS et Express. Le back-end communique avec le front-end avec Ajax par le end-point `/q`

Elle utilise une base de donnée "mongodb" que l'application lance et gère elle-même. Le dossier vers la base de donnée se trouve dans le fichier de config.

Elle se lance en faisant `npm start` ou `node server.js`

## Installation

### Node

Si Node n'est pas installé, on commence par l'installer avec ces commandes (Pour Ubuntu)

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

Ensuite, il faut installer la base de donner "mongodb".

Utilisez ces instructions pour installer la base de donnée sur Ubuntu: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/

### Pour Ubuntu 20.04

```sh
wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list
sudo apt-get update
sudo apt-get install -y mongodb-org
```

### Pour Windows

Télécharger le "MongoDB Community Server" depuis le site: https://www.mongodb.com/try/download/community Sélectionnez bien Windows, la version 4.4.1 (ou supérieur) et msi pour le type de paquet.

Lancer l'exécutable et suivez les étapes d'installation. Lorsque vous avez fini, ajouter dans votre PATH le chemin vers l'exécutable "mongod.exe". Si vous ne voulez pas modifier votre PATH, ajoutez dans le fichier de configuration le chemin vers l'exécutable dans l'option mongo_program. Par exemple, pour mon installation:

```js
{
    // ...
    "mongo_program":"D:/MongoDB/Server/4.4/bin/mongod.exe", // remplacer ce chemin par celui ou vous avez installer la base de donnée
    // ...
}
```

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

Le back-end communique avec le front avec l'adresse `/q`. Les arguments sont fournis au front avec des paramètres GET. Le back-end utilise une base de donnée mongodb qui se base sur une structure JSON pour stocker les données.

Le schéma de donnée est décrit dans `./doc/fake_data.js` qui permet aussi de peupler la base de donnée avec des données fictives pour tester l'interface. (changer la configuration pour activer les données fictives.)

### Listes des end-points (susceptible de changer.)

`/q?type=recipes`

Renvoie la liste de toutes les recettes publiques du site au format JSON.

`/q?type=users`

Renvoie la liste de tous les utilisateurs publiques du site au format JSON (non implémenté pour l'instant)