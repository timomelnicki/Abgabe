interface Reservierung {
        
    artikel_id: string;
    student: string;
}
interface ListenElement {
    _id: string;
    name: string;
    beschreibung: string;
    bild: string;
    preis: number;
    status: string;
    student: string;
}

async function registrieren(): Promise<void> {
    console.log("Sending form data.");
    let artikelform: HTMLFormElement = <HTMLFormElement> document.getElementById("artikelformular");
    let data: FormData = new FormData(artikelform);
    
    //Daten in JSON Objekt schreiben
    if (data.get("name") == "" || data.get("beschreibung" == "") || data.get("bild") == "" || data.get("preis") == "") {
        alert("Ungültige Eingabe");
    }
    let formData: string = JSON.stringify(
                            {"name": data.get("name") as string, 
                            "beschreibung": data.get("beschreibung") as string,
                            "bild": data.get("bild") as string,
                            "preis": parseInt(data.get("preis") as string),
                            "status": "frei",
                            "student": ""
                            });
                            
    let response: Response = await doRequest("artikel", "POST", formData);
    console.log("Data sent.");
}
//Ausgabe der Datenbank
async function showArtikellist(): Promise<void> {
    if(document.body.id == "Startseite") {
        localStorage.removeItem("id");
    }
    
    let response: Response = await doRequest("Artikel", "GET", "");
    let artikel: Array<ListenElement>;

    response.json().then(js => {
        artikel = <Array<ListenElement>> js;
        createTabelle(artikel);
    });
}
function createTabelle(_artikel: Array<ListenElement>): void {
    let tabelle: HTMLTableElement = <HTMLTableElement> document.getElementById("tabelle");
    let page: string = document.body.id;
    for (let i: number = 0; i < _artikel.length; i++) {
        
        let zeile: HTMLTableRowElement = document.createElement("tr");
        let zelle: HTMLTableDataCellElement = document.createElement("td");
        zelle.innerHTML = _artikel[i].name;
        zeile.appendChild(zelle);

        zelle = document.createElement("td");
        if (page == "Verleih") {
            let dropdown: HTMLSelectElement = <HTMLSelectElement> document.createElement("select");
            let auswahl: HTMLOptionElement = <HTMLOptionElement> document.createElement("option");
            auswahl.text = "frei";
            let auswahl2: HTMLOptionElement = <HTMLOptionElement> document.createElement("option");
            auswahl2.text = "reserviert";
            let auswahl3: HTMLOptionElement = <HTMLOptionElement> document.createElement("option");
            auswahl3.text = "ausgeliehen";
            dropdown.add(auswahl);
            dropdown.add(auswahl2);
            dropdown.add(auswahl3);
            dropdown.onchange = (e) => {
                aendern(_artikel[i]._id, dropdown.value);
            };
            dropdown.value = _artikel[i].status;
            zelle.appendChild(dropdown);
            zeile.appendChild(zelle); 
        }
        else {
        zelle.innerHTML = "" + _artikel[i].status;
        zeile.appendChild(zelle); 
        }
        
        if (page == "Verleih" || page == "reservieren" || page == "Studierend") {
            zelle = document.createElement("td");
            zelle.innerHTML = _artikel[i].beschreibung;
            zeile.appendChild(zelle);

            zelle = document.createElement("td");
            let image: HTMLImageElement = <HTMLImageElement> document.createElement("img");
            image.src = _artikel[i].bild;
            zelle.appendChild(image);
            zeile.appendChild(zelle);
            
            zelle = document.createElement("td");
            zelle.innerHTML = "" + _artikel[i].preis;
            zeile.appendChild(zelle);
        }
        if (page == "Studierend" ) {
            zelle = document.createElement("td");
            let box: HTMLInputElement = <HTMLInputElement> document.createElement("input");
            box.type = "checkbox";
            box.onclick = (e) => {
                merken(_artikel[i]._id, box.checked);
                summe(_artikel);
                if (box.checked) {
                    zeile.classList.add("check");
                }
                else {
                    zeile.classList.remove("check");
                }
            };
            zelle.appendChild(box);
            zeile.appendChild(zelle);

            if (_artikel[i].status == "reserviert" || _artikel[i].status == "ausgeliehen") {
                zeile.classList.add("verliehen");
            }
    }    
        if ( page == "Verleih" ) {
            zelle = document.createElement("td");
            zelle.innerHTML = _artikel[i].student;
            zeile.appendChild(zelle);
    }
        tabelle.appendChild(zeile);
    }
}
//Allgemeine Methode zur Ausführung von Anfragen
async function doRequest(_pathName: string, _method: string, _body: string): Promise<Response> {
    //Server URLs
    //let serverUrl: string = "https://gisabgabewise2021.herokuapp.com/"; //Remote
    let serverUrl: string = "http://localhost:8100/"; //Local
    
    let response: Promise<Response>;

    // GET Anfragen müssen ohne body und POST anfragen mit body gesendet werden
    if (_method === "GET") {
        response = fetch(serverUrl + _pathName, {
            method: _method,
            headers: {
            "Content-Type": "application/json"
            }
        });
    } else {
        response = fetch(serverUrl + _pathName, {
            method: _method,
            headers: {
            "Content-Type": "application/json"
            },
            body: _body
        });
    }
    return response;
}
function summe(_artikel: Array<ListenElement>): void {
    let preisSumme: number = 0;
    let ausgewaehlteArtikel: Array<string> = JSON.parse(localStorage.getItem("id"));

    for (let i: number = 0; i < _artikel.length; i++) {
        for (let j: number = 0; j < ausgewaehlteArtikel.length; j++) {
            if (_artikel[i]._id == ausgewaehlteArtikel[j]) {
                preisSumme += _artikel[i].preis;
            }
        }
    }

    let summenDiv: HTMLDivElement = <HTMLDivElement> document.getElementById("Summe");
    summenDiv.textContent = preisSumme + "€";

}

async function aendern(_artikelId: string, _status: string): Promise<void> {
    console.log("Sending form data."); 
    let formData: string = JSON.stringify(
                            {
                                "artikel_id": _artikelId,
                                "status": _status
                            });

    let response: Response = await doRequest("status", "POST", formData);
    console.log("Data sent.");
    console.log(response);
}
async function merken(_artikelId: string, _check: boolean): Promise<void> {
    let ids: Array<string> = JSON.parse(localStorage.getItem("id"));
    if (ids == null) {
        ids = [];
    }
    if (_check == true) {

        let enthalten: boolean = false;
        
        for (let i: number = 0; i < ids.length; i++) {
            if (ids[i] == _artikelId) {
                enthalten = true;
            }
        }
        if (enthalten == false) {
            ids.push(_artikelId);
            localStorage.setItem("id", JSON.stringify(ids));
        }
        
    }
    else {

        for (let i: number = 0; i < ids.length; i++) {
            if (ids[i] == _artikelId) {
                delete ids[i];
            }
        }
        localStorage.setItem("id", JSON.stringify(ids));
    }

}


async function reservieren(): Promise<void> {
    let ids: Array<string> = JSON.parse(localStorage.getItem("id"));
    let form: HTMLFormElement = <HTMLFormElement> document.getElementById("name");
    let data: FormData = new FormData(form);
    let studentenName: string = data.get("student") as string;
    if (ids == null || !studentenName) {
        alert("Ungültige Anfrage");
    }
    else {
        console.log("Data sent.");
        //Daten in JSON Objekt schreiben
        let formData: string = JSON.stringify(
                                {
                                    artikel_id: ids, 
                                    student: data.get("student") as string 
                                });
        console.log("Sending request: " + formData);

        let response: Response = await doRequest("Student", "POST", formData);
        console.log("Data sent.");
        console.log(response);
    }
}


showArtikellist();



/* 
    interface Bild {
        Pfad: string;
        Name: string;
    }
    interface Daten {
        Koepfe: Array<Bild>;
        Koerper: Array<Bild>;
        Beine: Array<Bild>;
    }
    interface Serverrueckgabe {
        error: string;
        message: string;
    }
    let koepfe: Array<Bild>;
    let koerper: Array<Bild>;
    let beine: Array<Bild>;

    let page: string = document.body.id;

    //jsondaten anfordern
    async function jsondaten(_url: string): Promise<void> {
        console.log("Start jsondaten");
        let response: Response = await fetch(_url);
        let daten: Daten = await response.json();
        console.log("All json", daten);
        
        koepfe = daten.Koepfe;
        koerper = daten.Koerper;
        beine = daten.Beine;

        console.log("Koepfe", koepfe);
        console.log("Koerper", koerper);
        console.log("Beine", beine);
    
    }

    //weiter Button erstellen
    function weiter( _s: string, _testStorage: string): void {
        let divButton: HTMLElement =  document.getElementById("weiter");
        let weiterButton: HTMLButtonElement = document.createElement("button");
        weiterButton.appendChild(document.createTextNode("weiter"));
        divButton.appendChild(weiterButton);

        weiterButton.addEventListener("click", link);
    
        function link(): void {
            if (localStorage.getItem(_testStorage) == null ) {
                alert("Bitte wählen Sie ein Bild aus");
            }
            else {
                document.location.href = _s;
            } 
        }  
    }

    //zurück Button erstellen
    function zurueck ( _s: string): void {
        let divButton: HTMLElement = document.getElementById("zurueck");
        let buttonWeiter: HTMLButtonElement = document.createElement("button");
        buttonWeiter.appendChild(document.createTextNode("zurück"));
        divButton.appendChild(buttonWeiter);

        buttonWeiter.addEventListener("click", link);
    
        function link(): void {
            document.location.href = _s;
        }
    }
    //Serveranfrage für Error oder Message
    async function serveranfrage(_kopf: string, _koerper: string, _beine: string, _url: string): Promise<void> {
        let query: URLSearchParams = new URLSearchParams( { _kopf: localStorage.getItem(_kopf) ,
                                                            _koerper: localStorage.getItem(_koerper) ,
                                                            _beine: localStorage.getItem(_beine) } ) ;
        _url = _url + "?" + query.toString();
        let _antwort: Response = await fetch(_url);
        let _ausgabe: Serverrueckgabe = await _antwort.json();
        let _text: HTMLDivElement = <HTMLDivElement> document.getElementById("serverantwort");
        _text.textContent = "Serverantwort: " + (_ausgabe.error || _ausgabe.message);                                  //entweder error oder message ausgeben da anderes undefined
    }
    //Charakteransicht
    function createBildFinal (_id: string, _nameStorage: string): void {
        let _div: HTMLDivElement = <HTMLDivElement> document.getElementById(_id);
        let _img: HTMLImageElement = document.createElement("img");
        console.log("Pic location: ", localStorage.getItem(_nameStorage));
        _img.setAttribute("src", localStorage.getItem(_nameStorage));
        _div.appendChild(_img);
    }


    //Bilderansicht der einzelnen Koerperteile     
    function createImages(_bilder: Array<Bild>, _koerperteilQuelleStorage: string, _koerperteilNameStorage: string): void {
        let divChoice: HTMLElement = document.getElementById("auswahl");
        let choice: HTMLImageElement = <HTMLImageElement> document.createElement("img");

        //Bilder dem Array-Wert entsprechend erzeugen
        for (let i: number = 0; i < _bilder.length; i++) {
            let divKoerperteil: HTMLDivElement = document.createElement("div");
            let bildKoerperteil: HTMLImageElement = document.createElement("img");

            bildKoerperteil.classList.add("Bild");
            bildKoerperteil.setAttribute("src", _bilder[i].Pfad + "/" + _bilder[i].Name);
            bildKoerperteil.dataset.value = _bilder[i].Name;
            divKoerperteil.appendChild(bildKoerperteil);
            let divBilder: HTMLDivElement = <HTMLDivElement> document.getElementById("Koerperteile");
            divBilder.appendChild(divKoerperteil);

            //Bild auswählen und anzeigen
            function bildAuswahl(): void {
                let auswahlName: string =  _bilder[i].Pfad + "/" + _bilder[i].Name;
                localStorage.setItem(_koerperteilNameStorage, auswahlName);
                choice.setAttribute("src", localStorage.getItem(_koerperteilNameStorage));
                divChoice.appendChild(choice);
            }
            bildKoerperteil.addEventListener("click", bildAuswahl);
        }
    }

    async function main(): Promise<void> {
        await jsondaten("BilderAuswahl.json");
        console.log("HI, my name is... ", page);
        //Entscheidungen für die einzelnen Seiten
        switch (page)  {


            case "SeiteKopf":
                weiter("Koerper.html", "nameKopfStorage");
                console.log("Length heads: ", koepfe);
                createImages( koepfe,  "storageKoepfe", "nameKopfStorage");
                break;


            case "SeiteKoerper":
                weiter("Beine.html", "nameKoerperStorage");
                zurueck("Kopf.html");
                createImages( koerper,  "storageKoerper", "nameKoerperStorage");
                break;
    
    
    
            case "SeiteBeine":
                weiter("Charakteransicht.html", "nameBeineStorage");
                zurueck("Koerper.html");
                createImages( beine,  "storageBeine", "nameBeineStorage");
                break;
    
            case "SeiteCharakteransicht":
                // Endbild erzeugen
                createBildFinal("Kopf", "nameKopfStorage");
                createBildFinal("Koerper", "nameKoerperStorage");
                createBildFinal("Beine", "nameBeineStorage");
                zurueck("Kopf.html");
                serveranfrage("nameKopfStorage", "nameKoerperStorage", "nameBeineStorage", "https://gis-communication.herokuapp.com");
                break;
        }
    }
    main();
*/