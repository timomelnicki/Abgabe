"use strict";
/*
registrieren überprüft ob die eingabe kein leeren string enthält, wenn das der fall ist werden die Daten zum Server geschickt
*/
async function registrieren() {
    console.log("Sending form data.");
    let artikelform = document.getElementById("artikelformular");
    let data = new FormData(artikelform);
    if (data.get("name") == "" || data.get("beschreibung") == "" || data.get("bild") == "" || data.get("preis") == "") {
        alert("Ungültige Eingabe");
    }
    let formData = JSON.stringify({ "name": data.get("name"),
        "beschreibung": data.get("beschreibung"),
        "bild": data.get("bild"),
        "preis": parseInt(data.get("preis")), "status": "frei",
        "student": "" });
    await doRequest("artikel", "POST", formData);
    console.log("Data sent.");
}
//Ausgabe der Datenbank je nach Seiten angepasst
async function showArtikellist() {
    if (document.body.id == "Startseite") {
        localStorage.removeItem("id");
        localStorage.setItem("id", JSON.stringify([]));
    }
    let response = await doRequest("Artikel", "GET", "");
    let artikel;
    response.json().then(js => {
        artikel = js;
        createTabelle(artikel);
    });
}
function createTabelle(_artikel) {
    let tabelle = document.getElementById("tabelle");
    let page = document.body.id;
    for (let i = 0; i < _artikel.length; i++) {
        if (JSON.parse(localStorage.getItem("id")).includes(_artikel[i]._id) || page !== "reservieren") {
            let zeile = document.createElement("tr");
            let zelle = document.createElement("td");
            zelle.innerHTML = _artikel[i].name;
            zeile.appendChild(zelle);
            zelle = document.createElement("td");
            if (page == "Verleih") {
                let dropdown = document.createElement("select");
                let auswahl = document.createElement("option");
                auswahl.text = "frei";
                let auswahl2 = document.createElement("option");
                auswahl2.text = "reserviert";
                let auswahl3 = document.createElement("option");
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
                let image = document.createElement("img");
                image.src = _artikel[i].bild;
                zelle.appendChild(image);
                zeile.appendChild(zelle);
                zelle = document.createElement("td");
                zelle.innerHTML = "" + _artikel[i].preis;
                zeile.appendChild(zelle);
            }
            if (page == "Studierend") {
                zelle = document.createElement("td");
                let box = document.createElement("input");
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
            if (page == "Verleih") {
                zelle = document.createElement("td");
                zelle.innerHTML = _artikel[i].student;
                zeile.appendChild(zelle);
            }
            tabelle.appendChild(zeile);
        }
    }
}
//Allgemeine Methode zur Ausführung von Anfragen
async function doRequest(_pathName, _method, _body) {
    //Server URLs
    let serverUrl = "https://gisabgabewise2021.herokuapp.com/"; //Remote
    //let serverUrl: string = "http://localhost:8100/"; //Local
    let response;
    // GET Anfragen müssen ohne body und POST anfragen mit body gesendet werden
    if (_method === "GET") {
        response = fetch(serverUrl + _pathName, {
            method: _method,
            headers: {
                "Content-Type": "application/json"
            }
        });
    }
    else {
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
function summe(_artikel) {
    let preisSumme = 0;
    let ausgewaehlteArtikel = JSON.parse(localStorage.getItem("id"));
    for (let i = 0; i < _artikel.length; i++) {
        for (let j = 0; j < ausgewaehlteArtikel.length; j++) {
            if (_artikel[i]._id == ausgewaehlteArtikel[j]) {
                preisSumme += _artikel[i].preis;
            }
        }
    }
    let summenDiv = document.getElementById("Summe");
    summenDiv.textContent = preisSumme + "€";
}
//Status von Mitarbeitern veränderbar
async function aendern(_artikelId, _status) {
    console.log("Sending form data.");
    let formData;
    if (_status == "frei") {
        formData = JSON.stringify({
            "artikel_id": _artikelId,
            "status": _status,
            "student": ""
        });
    }
    else {
        formData = JSON.stringify({
            "artikel_id": _artikelId,
            "status": _status
        });
    }
    let response = await doRequest("status", "POST", formData);
    console.log("Data sent.");
    console.log(response);
}
//Artikel werden für Reservierung im Local Storage hinterlegt
async function merken(_artikelId, _check) {
    let ids = JSON.parse(localStorage.getItem("id"));
    if (ids == null) {
        ids = [];
    }
    if (_check == true) {
        let enthalten = false;
        for (let i = 0; i < ids.length; i++) {
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
        let idx = -1;
        for (let i = 0; i < ids.length; i++) {
            if (ids[i] == _artikelId) {
                idx = i;
            }
        }
        if (idx > -1) {
            ids.splice(idx, 1);
        }
        localStorage.setItem("id", JSON.stringify(ids));
    }
}
//Speichert die Artikel im localStorage ab
async function reservieren() {
    let ids = JSON.parse(localStorage.getItem("id"));
    let form = document.getElementById("studentname");
    let data = new FormData(form);
    let studentenName = data.get("student");
    if (ids == null || !studentenName) {
        alert("Ungültige Anfrage");
    }
    else {
        console.log("Data sent.");
        //Daten in JSON Objekt schreiben
        let formData = JSON.stringify({
            artikel_id: ids,
            student: data.get("student")
        });
        console.log("Sending request: " + formData);
        let response = await doRequest("Student", "POST", formData);
        console.log("Data sent.");
        console.log(response);
    }
}
showArtikellist();
//# sourceMappingURL=Client.js.map