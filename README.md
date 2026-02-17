<img src="./docs/images/weatherangle-v2-logo-animated.gif" alt="Logo Animation">

Für die ausführliche Dokumentation von Version 1, siehe hier: https://gitlab.ruv.de/XV34989/weatherangle-v1

## Inhalt

**[1. Beschreibung](#beschreibung)**<br>
**&nbsp;&nbsp;&nbsp;&nbsp;[1.1 Lernziele](#lernziele)**<br>
**&nbsp;&nbsp;&nbsp;&nbsp;[1.2 Beschreibung bezüglich PP1](#beschreibung-bezüglich-pp1)**<br>
**[2. Anforderungen](#anforderungen)**<br>
**[3. Design](#design)**<br>
**[4. Projektstruktur](#projektstruktur)**<br>
**[5. Ticketliste](#ticketliste)**<br>

## Beschreibung

Weatherangle-v2 ist, wie der Name bereits preisgibt, die Neuaufsetzung meines ersten Angular-Übungsprojektes. Dadurch, dass WeatherAngle mein erstes eigenes Angular-Projekt war, ist der Code teilweise etwas durcheinander, schlecht verständlich oder nicht optimal strukturiert. Der Zweck des 'Rewrites' ist es das Gelernte erneut anzuwenden, um ein sauberes Projekt zu schreiben. Außerdem sollen weitere Features, wie das Einbinden eines eigenen Backends mit Login und weiteren User-Features vorbereitet werden. Eine Liste an Zielen ist unter [Lernziele](#lernziele) zu finden. Hierzu gehört unter Anderem das Verwenden einer besseren Projektstruktur, eine umfassende Nutzung von Services und das Generelle Üben vom sauberen Programmieren. WeatherAngle-v1 habe ich von GitHub auf GitLab migriert, zum Repository kommt man über [diesen Link](https://gitlab.ruv.de/XV34989/weatherangle-v1). Der bisherige Lernprozess ist dort dokumentiert.  

### Lernziele

Teilweise aus v1 übernommen. Parallelen zu Fächern aus dem Studium wurden notiert.

#### Sinnvolle Projektstruktur
Ziel ist es im Vorhinein einen guten Überblick über die Applikation zu haben, um eine sinnvolle Projektstruktur planen zu können. Mehr dazu unter [Projektstruktur](#projektstruktur)
#### Dokumentation
Auch wenn ich diesbezüglich gutes Feedback bekommen habe möchte ich, gerade in Hinsicht auf die Bewertung, trotzdem dieses Ziel notieren. Alle großen Entscheídungen und Lerneffekte sollten in der README oder unter `/docs` dokumentiert werden. Falls OpenAPI für das Backend benutzt wird, sollte `@Schema` mindestens mit `description` und `example` beschrieben werden.
#### Guards
Der abgeschlossene Bereich sollte mit einem Guard geschützt werden, anstatt nur über bedingte Anzeigen (`*ngIf`) zu arbeiten. Guards prüfen die Berechtigung bereits beim Routing und verhindern so das Laden der Komponente für unautorisierte Nutzer. Das kann die Sicherheit, sowie Performance erhöhen. Außerdem macht die Umsetzung über Guards das Programm potenziell übersichtlicher.
#### Url Manipulation
Die Implementierung in v1 verwendet `window.location.href` für die Navigation, was nicht den Angular Best Practices entspricht. Stattdessen sollte der Angular Router verwendet werden, um eine bessere Integration mit dem Framework zu erreichen. Dies würde auch die Verwendung von Route-Parametern, URL-Query-Parametern und State Management ermöglichen, was die Anwendung robuster und wartbarer machen würde.
#### Observables
Die bisherige Implementierung in v1 verwendet ausschließlich Promises für asynchrone Operationen. Angular basiert jedoch stark auf dem Observable-Pattern, das mehr Flexibilität und Kontrolle über Datenströme bietet. Observables ermöglichen das Abonnieren von Datenänderungen, das Filtern und Transformieren von Daten sowie die Möglichkeit, Datenströme zu kombinieren. Dies ist besonders nützlich für Features wie Auto-Complete in der Suchleiste oder Live-Updates der Wetterdaten. Das Prinzip von Observern haben wir bereits in **OOAD** (_mittlerweile SC genannt_) im 2. Semester behandelt.
#### Reactive Forms
Die aktuelle Implementierung in v1 verwendet Template-Driven Forms mit `ngModel` für Formulare wie das Login-Modal. Diese Herangehensweise macht es schwerer, Formularlogik zu testen und bietet weniger Kontrolle über Validierung und Fehlerbehandlung. Reactive Forms würden eine übersichtlichere Alternative bieten und eine zentralisierte Verwaltung des Formular-Zustands ermöglichen.
#### Kommentare
HTML-Kommentare sollten vermieden werden, da sie im Browser sichtbar sind, was potenzielle Sicherheitsrisiken bergen kann. Stattdessen sollte die Dokumentation von Code-Logik in TypeScript-Dateien oder separater Dokumentation erfolgen. <!-- https://stackoverflow.com/a/35235768/16805423 --> Auch hier können Konzepte/Regeln aus OOAD/SC angewendet werden. 
#### Verwendung von document & window
Die direkte Manipulation des DOM über document.querySelector und der Zugriff auf das window-Objekt sollten in Angular vermieden werden. Stattdessen sollten Angular-spezifische Mechanismen wie `@ViewChild`, `ElementRef` und der Angular Router verwendet werden. Die direkte DOM-Manipulation kann zu XSS-Sicherheitslücken führen, ist schwerer zu testen und umgeht Angulars Change Detection. Zudem kann die Verwendung von window Probleme bei Server-Side-Rendering verursachen.
#### Copyright
In v1 wurde jegliche Nutzung von geschützten Daten mit Beachtung der Lizenz erwähnt. [OpenMeteo](https://open-meteo.com/) benutzt zum Beispiel die Lizenzart [Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/), die auch kommerzielle Nutzung erlaubt, soweit eine [angemessene Quellenangabe](https://wiki.creativecommons.org/wiki/License_Versions#Detailed_attribution_comparison_chart) vorhanden ist. Diese Regeln sollten unbedingt befolgt und dokumentiert werden. Andere Beispiele hierfür waren die Hintergrundbilder, Nominatim oder Google Icons.
#### Tests
Alle Funktionen sollten durch Tests abgedeckt sein. Hierfür werde ich die in RVS eingesetzten Tools benutzen um mich mit diesen weiter vertraut zu machen. Hierzu zählen Unit-Tests via Jasmine und Karma und UI basierte Tests mit Cypress. 

### Beschreibung bezüglich PP1

**Lernziel**: In der ersten Praxisphase sollen die Studierenden vor allem Teamarbeit und Zusammenarbeit in Projekten erlernen und praktisch erfahren. Sie werden im Partnerunternehmen in ein Projektteam integriert, um die in den ersten beiden Semestern erworbenen Informatik- Grundlagen im realen Betrieb anzuwenden und zu vertiefen. Dabei geht es insbesondere darum, über das fachliche hinweg, auch die "überfachlichen" Kompetenzen der Kooperation im Team zu lernen. Die Studierenden lernen, IT- Projekte strukturiert anzugehen, einen Projektplan mit Zielen, Meilensteinen und Zeitplänen zu erstellen und Projektrisiken abzuschätzen. Zudem sollen sie ihre technischen Kenntnisse in einem konkreten Projektumfeld erweitern und "Soft Skills" wie Kommunikations- und Präsentationstechnik, Team- und Problemlösungsfähigkeit trainieren.

**Thema/Projekt**: Die Themenwahl ist relativ frei, sollte jedoch so gewählt sein, dass man es inhaltlich im Begleitmodul „Hausarbeit zu einem aktuellen Thema der Informatik“ behandeln bzw. vertiefen kann. Das kann die Bearbeitung zumindest vereinfachen.

#### Wie werden die Anforderungen durch WeatherAngle erfüllt?

Vorab wichtig: Ziel des Repositories ist nicht nur eine Kopie oder ein "Rewrite" sondern eine Weiterentwicklung mit sauberem Code als Basis. Es handelt sich um eine substanzielle Weiterentwicklung mit neuen Zielen und Verbesserungen. 

## Anforderungen

## Design

## Projektstruktur

## Ticketliste

Filter-Links: [LucaWeatherAngle](https://jira.ruv.de/projects/KXKFZRVS?selectedItem=com.almworks.jira.structure:wi-projectnav-structure&s=%7B%22sQuery%22%3A%7B%22query%22%3A%22labels%20%3D%20%5C%22LucaWeatherAngle%5C%22%22%2C%22type%22%3A%22jql%22%7D%7D#) | [xv34989](https://jira.ruv.de/projects/KXKFZRVS?selectedItem=com.almworks.jira.structure:wi-projectnav-structure&s=%7B%22sQuery%22%3A%7B%22query%22%3A%22assignee%20%3D%20XV34989%22%2C%22type%22%3A%22jql%22%7D%7D#)

- [ ] [KXKFZRVS-1220](https://jira.ruv.de/browse/KXKFZRVS-1220): Ausbildung Luca: Wiederaufbau EU für RVS - [Altes Ticket](https://jira.ruv.de/browse/KXKFZRVS-572)
- [ ] [KXKFZRVS-283](https://jira.ruv.de/browse/KXKFZRVS-283): Ausbildung Luca: Entwicklung Frontend m. Schnittstelle
- [ ] [KXKFZRVS-291](https://jira.ruv.de/browse/KXKFZRVS-291): Ausbildung Luca: Entwicklung Backend
- [ ] [KXKFZRVS-292](https://jira.ruv.de/browse/KXKFZRVS-292): Ausbildung Luca: Unittests für Frontend
- [ ] [KXKFZRVS-576](https://jira.ruv.de/browse/KXKFZRVS-576): Ausbildung Luca: Einarbeitung ng-bootstrap
- [ ] [KXKFZRVS-577](https://jira.ruv.de/browse/KXKFZRVS-577): Ausbildung Luca: Aufbau abgeschlossener Bereich (im Frontend)
- [ ] [KXKFZRVS-744](https://jira.ruv.de/browse/KXKFZRVS-744): Ausbildung Luca: Unittests für Backend
- [ ] [KXKFZRVS-749](https://jira.ruv.de/browse/KXKFZRVS-749): Ausbildung Luca: Umsetzung Login via Backend
- [ ] [KXKFZRVS-881](https://jira.ruv.de/browse/KXKFZRVS-881): Ausbildung Luca: Konzeption Login via Backend
- [ ] [KXKFZRVS-882](https://jira.ruv.de/browse/KXKFZRVS-882): Ausbildung Luca: Umsetzung Registrierung
- [ ] [KXKFZRVS-883](https://jira.ruv.de/browse/KXKFZRVS-883): Ausbildung Luca: Passwort vergessen Funktion
- [ ] [KXKFZRVS-934](https://jira.ruv.de/browse/KXKFZRVS-934): Umfassendes Refactoring der Wetterapp
- [ ] [KXKFZRVS-1217](https://jira.ruv.de/browse/KXKFZRVS-1217): Ausbildung Luca: Analyse für Praxisphase und Vorstellen aller Eckdaten