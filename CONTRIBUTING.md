# Bonnes pratiques et conventions

Les conventions écrites ici sont des **indications**. Ce qui compte est la simplicité et la lisibilité du code (et la performance). Suivre les conventions présentées va améliorer le code dans **la plupart** des cas mais il faut **éviter de les suivre aveuglement** et faire preuve de bon sens.

## Git

Lorsque vous contribuez du code, utiliser la fonction `Pull Request` pour que je puisse m'assurer que le code contribué est de bonne qualité. Aussi, dans vos commits, n'incluez pas des fichiers qui ne sont pas du code ou de la documentation. En particulier, le exécutable `.exe` et les fichiers télécharger par `data_fetcher` ne doivent pas se trouver dans vos commit. Vous pouvez modifier `.gitignore` si nécessaire pour que ce soit bien le cas. Vous pouvez cependant commit des fichiers qui sont utile pour que votre éditeur de texte ou IDE fonctionne correctement.

## Langue

Le contenu des fichiers `.md` est en français. Le contenu des autres fichiers (et le code et ses commentaires) est en anglais.

## Nomenclature

### Constantes

Les constantes sont écrites en majuscules avec des underscores pour séparer les mots:

```cpp
const int FILE_COUNT = 3;
```

### Fonctions

Les fonctions sont écrites en minuscules avec des underscores pour séparer les mots.

```cpp
fetch_website_content("www.google.com");
```

Si la valeur de retour d'une fonction est un booléen (vrai ou faux), son nom doit commencer par "is":

```cpp
if(is_valid(username)){
	// ...
}
```

Si une fonction est appelée uniquement comme une conséquence directe d'un évènement précis et que cet évènement est plus important que ce que fait la fonction elle-même, son nom doit commencer par "on": 

```cpp
on_search_button_pressed(); // event triggered by the user
// or
on_data_received(); // event triggered by another process in the code
```

Si une fonction est pure i.e que celle-ci n'a pas d'effets secondaires (à la manière d'une fonction mathématique) et que seule sa valeur de retour est intéressante, son nom doit commencer par "get"

```cpp
std::string username = get_username();
```

### Variables

Les variables sont en minuscules avec des underscores pour séparer les mots.

### Classes

Les classes sont en minuscules avec des majuscules pour séparer les mots.

```js
let em = new EventManager();
```

## Simplicité

Le code doit être compris par la personne le lisant de manière à rapidement identifier des bugs potentiels. C'est pour cela qu'il faut privilégier les solutions simples même si celle-ci peuvent être plus longues à écrire du moment que l'on ne porte pas atteinte à la performance.

### Utiliser des constantes

Parfois, cependant, le code doit réaliser une tâche qui par sa nature est compliquée. Alors, pour que l'on puisse facilement modifier le comportement du code sans avoir à se préoccuper du fonctionnement interne de la logique, on place les constantes utilisés par le code en début de fichier. De plus, tout nombre différent de -1,1,0 et 2 est un bon candidat pour être remplacé par une constante.

Utiliser des constantes est une bonne idée car si le code à besoin du même nombre à plusieurs endroit, cela évite lorsque l'on modifie le code de modifier le nombre à un seul endroit, ce qui engendrerait des bugs.

```js
// at the start
const MAX_RESULT_DISPLAYED = 10;

// in the middle of the code
for(let i = 0;i < Math.max(MAX_RESULT_DISPLAYED,arr.length);i++){
    console.log(arr[i]);
}
```

### Ne pas compliquer inutilement les opérations booléennes

Aussi, lorsque l'on manipule des booléens, on essaie de minimiser l'utilisation des ifs qui ne sont pas nécessaires:

```js
if(condition == true){ // bad, don't do this
	do_stuff();
}

if(condition){ // good, do this
	do_stuff();
}

if(condition){ // bad
    another_thing = true;
}

another_thing = condition || another_thing; // good (|| means or)
```

### Eviter les répétitions
Dès que l'on remarque que l'on écrit plus de 3 fois quasiment la même chose, on met le code écrit dans une boucle ou une fonction.

Ce code est bon, en effet, l'utilisation d'une boucle rendrait le code moins compréhensible et on ne verrait pas vraiment que l'on compte en binaire.
```js
// Good
performTask(0,0,0);
performTask(1,0,0);
performTask(0,1,0);
performTask(1,1,0);

performTask(0,0,1);
performTask(1,0,1);
performTask(0,1,1);
performTask(1,1,1);
```


```js
// Don't do this
performTask(0);
performTask(1);
performTask(2);
performTask(3);

// Don't do this either.

task1(1);
task2(1);
task3(1);

task1(1);
task2(1);
task3(1);

```

Sinon, ce n'est pas la peine de découper le code en fonctions à par si on s'attend à ce que ce bout de code soit exécuté à un autre endroit. En particulier, il n'y a pas de limite maximale à la taille d'une fonction, du moment qu'il y a des commentaires entre les différentes parties du code de la fonction.

Trop découper en fonctions peut perdre le lecteur si celui-ci doit beaucoup se déplacer dans le fichier pour comprendre ce que fait le code ou même entre des fichiers différents. C'est pour cela que si l'on sépare du code en plusieurs fichiers, on s'assure que les fonctionnalités de chaque fichiers sont assez séparées et que l'on peut comprendre ce que fait une fonction d'un fichier utilisée dans l'autre fichier juste en lisant son nom ou avec un commentaire.

### Ne pas mettre de commentaires sans intérêt

Commenter son code est important. Cependant, il n'est pas utile de mettre des commentaires qui ne font que répéter le nom de la variable ou de la fonction. Les commentaires suivants sont sans intérêt.

```js
let max_val = val[0];
for(let i = 1;i < values.length;i++){ // interate over values to find the biggest value
    if(val[i] > max_val)
        max_val = val[i];
}

let file_content = read_file("a.txt"); // get the content of a.txt
```

Des commentaires utiles seraient par exemple

```js
let max_val = val[0]; // we assume val contains at least one element
for(let i = 1;i < values.length;i++){
    if(val[i] > max_val)
        max_val = val[i];
}

let file_content = read_file("a.txt"); // file_content == "" if a.txt does not exist
```

Ils mettent l'accent sur des cas que l'on oublie facilement mais qui méritent notre attention.
