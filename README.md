# The PAPS app !
Ce repo contient le code pour le site du paps qui permet de partager des recettes de d'organiser sa liste de course.

Plus d'informations ici: https://docs.google.com/document/d/1QQNS7YFifi6eaitlNc8k2h3rlRvja7o_O6aRMfCU7z0/edit#

Liser ce fichier avant de contribuer, il contient des bonnes pratiques à suivre: [CONTRIBUTING.md](CONTRIBUTING.md)

## Structure générale du projet

L'application est construire avec NodeJS et Express. Le back-end communique avec le front-end avec Ajax par le end-point `/q`

Elle se lance en faisant `npm start` ou `node server.js`

Elle utilise une base de donnée "mongodb" que l'application lance et gère elle-même. Le dossier vers la base de donnée se trouve dans le fichier de config. Utilisez ces instructions pour installer la base de donnée: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/

TODO: faire un script npm qui installe automatiquement mongodb pour faire un déployement avec seulement `npm install`

## Structure du front-end

Le front-end se trouve dans le dossier `/client`. Tout fichier se trouvant dedans est fourni de manière statique au client et est accesible à l'adresse correspondant au nom du fichier (par exemple `client/style.css` est disponible à l'adresse `www.nom_du_site.com/style.css`)

Je recommande de séparer le front en plusieurs fichiers `.html` avec chaque fichier correspondant à un onglet du site. De plus, je recommande les bibliothèques suivantes:

- https://fontawesome.com/ pour les icones (version 5)
- https://fullcalendar.io/ pour le calendrier
- https://editorjs.io/ pour l'éditeur de recette (je sais pas si ça sera nécessaire mais si les gens veulent mettre des titres dans leurs recettes et du gras, ça peut être sympa)
- Eviter JQuery si possible sauf si vous estimez que c'est absolument nécessaire.

Bien sûr, vous pouvez utiliser les bibliothèques que vous voulez, ce sont des suggestions. Sinon, prenez bien les version `minified` des bibliothèques quand vous les intégrez.

## Structure du back-end

Le back-end communique avec le front avec l'adresse `/q`. Les arguments sont fournis au front avec des paramètres GET. Le back-end utilise une base de donnée mongodb qui se base sur une structure JSON pour stocker les données. Voici le schéma de donnée

```json
{
    "recipes":[
        {
            "title":"string",
            "tags":["beef","pork"],
            "ingredients":["beef","pork"],
            "pre_time":30 // in minutes
            "cook_time":20 // in minutes
            "content":"HTML data to display"
        }
    ]
}
```

(En cours de rédaction)