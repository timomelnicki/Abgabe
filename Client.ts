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
/*
registrieren überprüft ob die eingabe kein leeren string enthält, wenn das der fall ist werden die Daten zum Server geschickt
*/
async function registrieren(): Promise<void> {
    console.log("Sending form data.");
    let artikelform: HTMLFormElement = <HTMLFormElement> document.getElementById("artikelformular");
    let data: FormData = new FormData(artikelform);
    if (data.get("name") == "" || data.get("beschreibung") == "" || data.get("bild") == "" || data.get("preis") == "") {
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
                            
    await doRequest("artikel", "POST", formData);
    console.log("Data sent.");
}
//Ausgabe der Datenbank je nach Seiten angepasst
async function showArtikellist(): Promise<void> {
    if (document.body.id == "Startseite") {
        localStorage.removeItem("id");
        localStorage.setItem("id", JSON.stringify([]));
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
        if (JSON.parse(localStorage.getItem("id")).includes(_artikel[i]._id) || page !== "reservieren") {
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
            dropdown.onchange = (e) => { //wird von der Methode
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
    }}
}
//Allgemeine Methode zur Ausführung von Anfragen
async function doRequest(_pathName: string, _method: string, _body: string): Promise<Response> {
    //Server URLs
    let serverUrl: string = "https://gisabgabewise2021.herokuapp.com/"; //Remote
    //let serverUrl: string = "http://localhost:8100/"; //Local
    
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
//Rechnet Preise der Artikle zum Ausleihen zusammen
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
//Status von Mitarbeitern veränderbar
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
//Artikel werden für Reservierung im Local Storage hinterlegt
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
//Speichert die Artikel im localStorage ab
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