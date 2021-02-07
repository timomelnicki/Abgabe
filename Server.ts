import * as Http from "http";
import * as fs from "fs";
import * as Mongo from "mongodb";
import {ObjectId} from "mongodb";




//Server aufsetzen
export namespace P_3_1Server {
    interface ListenElement {
        name: string;
        beschreibung: string;
        bild: ImageData;
        preis: number;
        status: string;
        student: string;
        _id: string;
    }

    (async function(): Promise<void> {
        console.log("Starting server");
        let port: number = Number(process.env.PORT);
        if (!port)
            port = 8100;

        //Server starten, handle methoden definieren, Server connecten mit der Datenbank   
        let server: Http.Server = Http.createServer();
        server.addListener("request", handleRequest);
        server.addListener("listening", handleListen);
        server.listen(port);
        let url: string = "mongodb+srv://timo:admin@artikelgis.8pkyr.mongodb.net/<dbname>?retryWrites=true&w=majority";
        let options: Mongo.MongoClientOptions;
        let mongoClient: Mongo.MongoClient = new Mongo.MongoClient(url, options);
        await mongoClient.connect();
        
        let dbconnection: Mongo.Collection = mongoClient.db("Artikel").collection("Artikel");
        
        function handleListen(): void {
            console.log("Listening on port " + port);
        }
        function handleRequest (_request: Http.IncomingMessage, _response: Http.ServerResponse): void {
            console.log("Received client request.");
            if (_request.method === "GET") {
                console.log("Request type: GET");
                handleGet(_request, _response);
            } else if (_request.method === "POST") {
                console.log("Request type: POST");
                handlePost(_request, _response);
            } 
        }

        //Post handler
        function handlePost(_request: Http.IncomingMessage, _response: Http.ServerResponse): void {
            let body: string = "";
            _request.on("data", data => {
                body += data;
            });
            //body daten zu JSON parsen
            _request.on("end", async () => {
                console.log("POST body data: '" + body + "'");
                console.log("Request URL: '"  + _request.url + "'");
                //Wenn eine Anfrage von der Student seite kommt, wird eine Reservierung vorbereitet
                if (_request.url == "/Student") {
                    console.log("Performing reservation.");
                    let ids: Array<string> = JSON.parse(body).artikel_id;
                    let artikel: Array<ListenElement> = [];
                    let allesGut: boolean = true;
                    //Abfrage ob die ausgewählten Artikel existieren
                    for (let i: number = 0; i < ids.length; i++) {
                        console.log("ids[" + i + "]: " + ids[i]);
                        let result: Mongo.Collection = await dbconnection.findOne({"_id": new ObjectId(ids[i])});
                        console.log(result);
                        if (result) {
                            console.log("Artikel vorhanden");
                            artikel.push(<ListenElement> JSON.parse(JSON.stringify(result)));
                        }
                        else {
                            allesGut = false;
                        }
                    }
                    //Abfrage ob alle Artikel "frei"" sind
                    for (let i: number = 0; i < artikel.length; i++) {
                        if (artikel[i].status != "frei") {
                            allesGut = false;
                        }
                    }
                    //Aktualiesieren von dem Status der ausgewählten Artikel
                    if (allesGut == true) {
                        for (let i: number = 0; i < artikel.length; i++) {
                            dbconnection.updateOne({"_id": new ObjectId(artikel[i]._id)}, { $set: {status: "reserviert", student: JSON.parse(body).student } });
                            _response.writeHead(200, "Reservierung erfolgreich");
                        }
                    } else {
                        _response.writeHead(200, "Fehler bei der Reservierung. Artikel nicht verfügbar");
                    }
                //direkte Status änderung
                } else if (_request.url == "/status") {
                    console.log("Status wird geändert");
                    let result: Mongo.Collection = await dbconnection.findOne({"_id": new ObjectId(JSON.parse(body).artikel_id)});
                    console.log(result);
                    if (result) {
                            console.log("Status geändert");
                            dbconnection.updateOne({"_id": new ObjectId(JSON.parse(body).artikel_id)}, { $set: {status: JSON.parse(body).status}});
                            _response.writeHead(200, "Status erfolgreich geändert");
                        }
                }
                else if (_request.url == "/artikel") {
                    console.log("Performing registration.");
                    //Datenbank eintrag erstellen
                    let artikel: ListenElement = <ListenElement> JSON.parse(body);
                    dbconnection.insertOne(artikel);
                    _response.writeHead(200, "Artikel erfolgreich Registriert!", {
                        "Content-Type": "text/plain"
                    });
                    
                    
                }
                _response.end(); 
                console.log("Post response: 200 OK");
            }) ;
        }

        //Get handler
        function handleGet(_request: Http.IncomingMessage, _response: Http.ServerResponse): void {
            console.log("Request: " + _request.url);
            //Wenn eine Artikel anfrage kommt packt es alle Datenbank Elemente in einen Array
            if (_request.url == "/Artikel") {
                dbconnection.find({}, {projection: {}})
                .toArray((error, result) => {
                    //bei Fehler entsprechende Meldung
                    if (error) {
                        console.log("Error: " + error);
                        _response.writeHead(500);
                        _response.write("Unerwarteter Fehler");
                    } else {
                        //Artikel werden ausgegeben
                        console.log(result);
                        _response.writeHead(200, {"Content-Type": "text/html" });
                        _response.write(JSON.stringify(result));
                    }
                    _response.end();
                });
            }
            else {
                //Andere Getanfragen landen hier
                //Bei erstem verbinden muss der einzelne / zu Startseite umgewandelt werden
                if  (_request.url == "/") {
                    _request.url = "/Startseite.html";
                }
                //Jede Datei die angefragt wird, wird versucht zurückzuschicken
                fs.readFile("." + _request.url, (error, pgResp) => { //behandlung von error und pageresponse via lambda function
                    if  (error) {
                        //wenn es nicht alle zurückschicken konnte
                        console.log("Error when responding with"  + _request.url);
                        _response.writeHead(404);
                        _response.write("Contents you are looking are Not Found");
                    }   else {
                        //wenn es alle zurückschicken konnte
                        console.log("Successfully sent Response" +  _request.url);
                        if (_request.url.endsWith(".js")) {
                           _response.writeHead(200, {"Content-Type": "text/javascript" });
                        } else if (_request.url.endsWith(".css")) {
                            _response.writeHead(200, {"Content-Type": "text/css" });
                        } else {
                            _response.writeHead(200, {"Content-Type": "text/html" });
                        }
                        _response.write(pgResp);
                    }
                    _response.end(); 
                });
            }
        }
    })();
}

