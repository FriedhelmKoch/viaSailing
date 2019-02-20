////////////////////////////////////////////////////////////////////////////////
// Alle "document ready" JavaScript - Funktionen
////////////////////////////////////////////////////////////////////////////////
      
$(document).ready(function() {
	
	// Drehscheibe für Windrichtung
	//
	$('.windDir').knob({
		change : function (value) {
			//console.log("change : " + value);
		},
		release : function (value) {
			//console.log(this.$.attr('value'));
			console.log("release : " + value);
		},
		cancel : function () {
			console.log("cancel : ", this);
		},
		/*format : function (value) {
			return value + '%';
		},*/
		draw : function () {
			// "tron" case
			if(this.$.data('skin') == 'tron') {
				this.cursorExt = 0.3;
				var a = this.arc(this.cv),  // Arc
					pa,                   	// Previous arc
					r = 1;
				this.g.lineWidth = this.lineWidth;
				if(this.o.displayPrevious) {
					pa = this.arc(this.v);
					this.g.beginPath();
					this.g.strokeStyle = this.pColor;
					this.g.arc(this.xy, this.xy, this.radius - this.lineWidth, pa.s, pa.e, pa.d);
					this.g.stroke();
				}
				this.g.beginPath();
				this.g.strokeStyle = r ? this.o.fgColor : this.fgColor ;
				this.g.arc(this.xy, this.xy, this.radius - this.lineWidth, a.s, a.e, a.d);
				this.g.stroke();
				this.g.lineWidth = 2;
				this.g.beginPath();
				this.g.strokeStyle = this.o.fgColor;
				this.g.arc( this.xy, this.xy, this.radius - this.lineWidth + 1 + this.lineWidth * 2 / 3, 0, 2 * Math.PI, false);
				this.g.stroke();
				return false;
			}
		}
	});
									
	$('#watchSwitch').click(function() {
		$('#popupShowNavigation').popup("open");
	});
						
	// Update der VPP-Schiffsparametern in LocalStorage
	//
	$('.updateShip').click(function() {
		updateVPP();
		$('#popupSaveVPP').popup("open");
	});
	
	return false;
	
}); // Ende Document.Ready


////////////////////////////////////////////////////////////////////////////////
// JavaScript - Funktionen
////////////////////////////////////////////////////////////////////////////////

var best_beat_angel = [];
var best_run_angel = [];
var beat_angel = [];
var MaxHoehe = [];
var functions = [];
var f = function(x) { return undefined; };

// Darstellung der OpenSeaMap Karte mit Markern
function showMap(myLat, myLng) {
	
	// Einlesen der gespeicherten Performancewerte für das Schiff - aus VPP Tabelle
	readVPP();
	
	// Karte mit Koordinaten
	map = L.map('map').setView([myLat, myLng], 13);
	
	// Marker aktuelle Schiffsposition, icon is NOT dragable!
	marker = L.marker([myLat, myLng], {
		icon: myShip, title: 'My ship', draggable: false, opacity: 0.9
	}).addTo(map);
	
	// Textblase zur aktuellen Shiffsposition
	marker.bindPopup("φ: " + dd2dm(myLat, 'lat', 5) + "<br/>&lambda;: " + dd2dm(myLng, 'lng', 5))
	.openPopup();
	
	// OpenSee Map
	openSeaMap = new L.TileLayer('http://a.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 18,
	}).addTo(map);
	
	// Zusätzliche Kartenlayer nachladeb
	var seamarks = new L.TileLayer('http://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
		maxZoom: 18
	}).addTo(map);
	
	var sports = new L.TileLayer('http://tiles.openseamap.org/sport/{z}/{x}/{y}.png', {
		minZoom: 8, maxZoom: 18
	}).addTo(map);
	
	// Create the marker controls
	var marker_controls = new L.Control.SimpleMarkers();
	map.addControl(marker_controls);
	
}

function showPosition(position) {
	myLat = position.coords.latitude;
	myLng = position.coords.longitude;			// Grad,dezimal
	accuracy = position.coords.accuracy;		// meter
	altitude = position.coords.altitude;		// meter
	altitudeAccuracy = position.coords.altitudeAccuracy;	// meter
	heading = position.coords.heading;			// Grad
	speed = position.coords.speed;					// m/s
	
	showMap(myLat, myLng);
}

function handleError(err) {
	switch(error.code){
		case error.PERMISSION_DENIED: alert("Der Nutzer möchte keinen Zugriff auf GPS-Daten teilen."); break;
		case error.POSITION_UNAVAILABLE: alert("Die Geodaten sind nicht erreichbar."); break;
		case error.PERMISSION_DENIED: alert("Timeout erhalten"); break;
		default: alert ("Unbekannter Error"); break;
	}
}

function getLocation() {
	if(navigator.geolocation) {
		// timeout at 60000 milliseconds (60 seconds)
		var options = { timeout:60000,
			enableHighAccuracy: true };
		navigator.geolocation.getCurrentPosition(showPosition, handleError, options);
	} else {
		alert("Sorry, geolocation not supported in this browser");
	}
}

function watchLocation() {
	if(navigator.geolocation) {
		// timeout at 60000 milliseconds (60 seconds)
		var options = { timeout:60000,
			enableHighAccuracy: true };
		watchID = navigator.geolocation.watchPosition(showPosition, handleError, options);
	} else {
		alert("Sorry, geolocation not supported in this browser");
	}
}

// clear the watch that was started earlier
function clearWatch() {
	if (watchID) {
		navigator.geolocation.clearWatch(watchID);
		watchID = null;
	}
}

function initDB() {
	// Wenn Datenbank initialisiert wurde, dann öffnen
	//		if(localStorage.getItem('db_VPP_messwerte')) {                              // ob LocalStorage angelegt wurde?
	
	// Initialieren des bestehenden LocalStorage - VPP: "{"tables":{},"data":{}}"
	//		VPP_messwerteDB = new localStorageDB("VPP_messwerte", localStorage);      // es wird 'db_' vor den Datenbanknamen geschrieben
	
	//	} else {
	// Neu anlegen mit Beispieldaten
	VPP_messwerteDB = new localStorageDB("VPP_messwerte", localStorage);
	
	// Check if the database was just created. Useful for initial database setup
	if(VPP_messwerteDB.isNew()) {
		
		// create the "books" table
		VPP_messwerteDB.createTable("ship", ["code", "datum", "name", "shipTyp", "shipNum", "shipLOA", "shipLWL", "shipBOA", "shipBWL", "shipT", "shipD", "shipB", "shipV", "shipAS", "shipGPH", "ship_6_Array", "ship_8_Array", "ship_10_Array", "ship_12_Array", "ship_14_Array", "ship_16_Array", "ship_18_Array", "ship_20_Array"]);
		
		// mit Schiff VPP Parameter beschreiben
		VPP_messwerteDB.insert("ship", {
			code: 'V1.0', 										// Datenbank Version
			datum: $.getActualiCal('UTC'), 	// aktuelles Datum in UTC
			name: 'Cantaloop IV', 						// Schiffsname oder Name wird über die Save Funktion erst vergeben
			shipTyp: 'Hanse 430 (2007)',      // Schiffstyp
			shipNum: 'GER 5950',							// Schiff-/Segelnummer
			shipLOA: '13.15',                 // Länge über alles
			shipLWL: '12.00',								// Wasserlänge
			shipBOA: '4.250', 								// Breite über alles
			shipBWL: '3.950', 									// Wasserbreite
			shipT: '2.186', 									// Tiefgang
			shipD: '10763',									// Deplacement / Gewicht
			shipB: '3200',  									// Balastgewicht
			shipV: '8500', 									// Verdrängung
			shipAS: '123.50',                // Segelfläche (Haupt/Genua)
			shipGPH: '586.5',
			// VPP-Array
			// Stützpunkte bei: "beat_angel, 52, 60, 75, 90, 110, 120, 135, 150, run_angel, best_beat, best_run" Grad
			ship_6_Array: [45, 3.46, 5.41, 5.81, 6.19, 6.19, 6.20, 6.01, 5.40, 4.55, 142, 3.94, 50, 135],
			ship_8_Array: [43, 4.18, 6.44, 6.89, 7.30, 7.45, 7.49, 7.30, 6.63, 5.70, 148, 4.94, 50, 135],
			ship_10_Array: [43, 4.74, 7.28, 7.66, 7.93, 8.02, 8.15, 8.03, 7.61, 6.73, 151, 5.83, 50, 135],
			ship_12_Array: [42, 5.12, 7.72, 8.03, 8.28, 8.28, 8.56, 8.47, 8.15, 7.58, 154, 6.63, 50, 135],
			ship_14_Array: [42, 5.30, 7.89, 8.18, 8.52, 8.57, 8.81, 8.91, 8.55, 8.12, 166, 7.29, 50, 135],
			ship_16_Array: [41, 5.40, 7.97, 8.25, 8.67, 8.87, 9.03, 9.33, 8.99, 8.50, 180, 7.89, 50, 135],
			ship_18_Array: [41, 5.46, 8.04, 8.30, 8.74, 9.09, 9.22, 9.57, 9.49, 8.92, 180, 8.28, 50, 135],
			ship_20_Array: [42, 5.52, 8.10, 8.35, 8.80, 9.32, 9.41, 9.80, 9.99, 9.34, 180, 8.67, 50, 135]
		});
		VPP_messwerteDB.commit();
	}	
	//	}
}

//
function openDB() {
	VPP_messwerteDB = new localStorageDB("VPP_messwerte", localStorage);
}

// Gespeicherte Schiffsparameter auslesen und in Schiffsdaten-Page ausgeben
//
function readVPP() {
	recDB = VPP_messwerteDB.query("ship");
	
	for(var i=0 in recDB) {		// das gesamte gespeicherte Array durchlaufen
		
		if(recDB[i].code == 'V1.0') {
			
			$("#shipName").val(recDB[i].name);
			$("#shipTyp").val(recDB[i].shipTyp);
			$("#shipNum").val(recDB[i].shipNum);
			$("#shipLOA").val(recDB[i].shipLOA);
			$("#shipLWL").val(recDB[i].shipLWL);
			$("#shipBOA").val(recDB[i].shipBOA);
			$("#shipBWL").val(recDB[i].shipBWL);
			$("#shipT").val(recDB[i].shipT);
			$("#shipD").val(recDB[i].shipD);
			$("#shipB").val(recDB[i].shipB);
			$("#shipV").val(recDB[i].shipV);
			$("#shipAS").val(recDB[i].shipAS);
			$("#shipGPH").val(recDB[i].shipGPH);
			
			var kn = 4;
			for (j = 6; j <= 20; j += 2) {
				kn += 2;
				if (j !== 18) {
					eval('ship_' + kn + '_beat_angel = recDB[i].ship_' + kn + '_Array[0];');
					eval('ship_' + kn + '_beat = recDB[i].ship_' + kn + '_Array[1];');
					eval('ship_' + kn + '_52 = recDB[i].ship_' + kn + '_Array[2];');
					eval('ship_' + kn + '_60 = recDB[i].ship_' + kn + '_Array[3];');
					eval('ship_' + kn + '_75 = recDB[i].ship_' + kn + '_Array[4];');
					eval('ship_' + kn + '_90 = recDB[i].ship_' + kn + '_Array[5];');
					eval('ship_' + kn + '_110 = recDB[i].ship_' + kn + '_Array[6];');
					eval('ship_' + kn + '_120 = recDB[i].ship_' + kn + '_Array[7];');
					eval('ship_' + kn + '_135 = recDB[i].ship_' + kn + '_Array[8];');
					eval('ship_' + kn + '_150 = recDB[i].ship_' + kn + '_Array[9];');
					eval('ship_' + kn + '_run_angel = recDB[i].ship_' + kn + '_Array[10];');
					eval('ship_' + kn + '_run = recDB[i].ship_' + kn + '_Array[11];');
				}
			}
		}
	}

	var kn = 4;
	for (j = 6; j <= 20; j += 2) {
		kn += 2;
		if (j !== 18) {
			eval('$("#ship_' + kn + '_beat_angel").val(ship_' + kn + '_beat_angel);');
			eval('$("#ship_' + kn + '_beat").val(ship_' + kn + '_beat);');
			eval('$("#ship_' + kn + '_52").val(ship_' + kn + '_52);');
			eval('$("#ship_' + kn + '_60").val(ship_' + kn + '_60);');
			eval('$("#ship_' + kn + '_75").val(ship_' + kn + '_75);');
			eval('$("#ship_' + kn + '_90").val(ship_' + kn + '_90);');
			eval('$("#ship_' + kn + '_110").val(ship_' + kn + '_110);');
			eval('$("#ship_' + kn + '_120").val(ship_' + kn + '_120);');
			eval('$("#ship_' + kn + '_135").val(ship_' + kn + '_135);');
			eval('$("#ship_' + kn + '_150").val(ship_' + kn + '_150);');
			eval('$("#ship_' + kn + '_run_angel").val(ship_' + kn + '_run_angel);');
			eval('$("#ship_' + kn + '_run").val(ship_' + kn + '_run);');
		}
	}
}

function updateVPP() {
	recDB = VPP_messwerteDB.query("ship");
	
	for(var i=0 in recDB) {		// das gesamte gespeicherte DB-Array durchlaufen
		
		if(recDB[i].code == 'V1.0') {
			
			// Linear Interpolierte Werte für die Windstärke 18kn
			var ship_18_beat_angel = parseInt((parseInt($("#ship_16_beat_angel").val()) + parseInt($("#ship_20_beat_angel").val())) / 2);
			var ship_18_beat = round((parseFloat($("#ship_16_beat").val()) + parseFloat($("#ship_20_beat").val())) / 2, 2);
			var ship_18_52 = round((parseFloat($("#ship_16_52").val()) + parseFloat($("#ship_20_52").val())) / 2, 2);
			var ship_18_60 = round((parseFloat($("#ship_16_60").val()) + parseFloat($("#ship_20_60").val())) / 2, 2);
			var ship_18_75 = round((parseFloat($("#ship_16_75").val()) + parseFloat($("#ship_20_75").val())) / 2, 2);
			var ship_18_90 = round((parseFloat($("#ship_16_90").val()) + parseFloat($("#ship_20_90").val())) / 2, 2);
			var ship_18_110 = round((parseFloat($("#ship_16_110").val()) + parseFloat($("#ship_20_110").val())) / 2, 2);
			var ship_18_120 = round((parseFloat($("#ship_16_120").val()) + parseFloat($("#ship_20_120").val())) / 2, 2);
			var ship_18_135 = round((parseFloat($("#ship_16_135").val()) + parseFloat($("#ship_20_135").val())) / 2, 2);
			var ship_18_150 = round((parseFloat($("#ship_16_150").val()) + parseFloat($("#ship_20_150").val())) / 2, 2);
			var ship_18_run_angel = parseInt((parseInt($("#ship_16_run_angel").val()) + parseInt($("#ship_20_run_angel").val())) / 2);
			var ship_18_run = round((parseFloat($("#ship_16_run").val()) + parseFloat($("#ship_20_run").val())) / 2, 2);
			
			// Schiff mit neuen VPP Parameter beschreiben
			VPP_messwerteDB.insertOrUpdate("ship", {
				code: 'V1.0'
				}, {
				code: 'V1.0', 										// Datenbank Version
				datum: $.getActualiCal('UTC'), 	// Änderungsdatum in UTC
				name: $("#shipName").val(),
				shipTyp: $("#shipTyp").val(),
				shipNum: $("#shipNum").val(),
				shipLOA: $("#shipLOA").val(),
				shipLWL: $("#shipLWL").val(),
				shipBOA: $("#shipBOA").val(),
				shipBWL: $("#shipBWL").val(),
				shipT: $("#shipT").val(),
				shipD: $("#shipD").val(),
				shipB: $("#shipB").val(),
				shipV: $("#shipV").val(),
				shipAS: $("#AS").val(),
				shipGPH: $("#shipGPH").val(),
				// VPP-Array
				ship_6_Array: [$("#ship_6_beat_angel").val(), $("#ship_6_beat").val(), $("#ship_6_52").val(), $("#ship_6_60").val(), $("#ship_6_75").val(), $("#ship_6_90").val(), $("#ship_6_110").val(), $("#ship_6_120").val(), $("#ship_6_135").val(), $("#ship_6_150").val(), $("#ship_6_run_angel").val(), $("#ship_6_run").val()],
				ship_8_Array: [$("#ship_8_beat_angel").val(), $("#ship_8_beat").val(), $("#ship_8_52").val(), $("#ship_8_60").val(), $("#ship_8_75").val(), $("#ship_8_90").val(), $("#ship_8_110").val(), $("#ship_8_120").val(), $("#ship_8_135").val(), $("#ship_8_150").val(), $("#ship_8_run_angel").val(), $("#ship_8_run").val()],
				ship_10_Array: [$("#ship_10_beat_angel").val(), $("#ship_10_beat").val(), $("#ship_10_52").val(), $("#ship_10_60").val(), $("#ship_10_75").val(), $("#ship_10_90").val(), $("#ship_10_110").val(), $("#ship_10_120").val(), $("#ship_10_135").val(), $("#ship_10_150").val(), $("#ship_10_run_angel").val(), $("#ship_10_run").val()],
				ship_12_Array: [$("#ship_12_beat_angel").val(), $("#ship_12_beat").val(), $("#ship_12_52").val(), $("#ship_12_60").val(), $("#ship_12_75").val(), $("#ship_12_90").val(), $("#ship_12_110").val(), $("#ship_12_120").val(), $("#ship_12_135").val(), $("#ship_12_150").val(), $("#ship_12_run_angel").val(), $("#ship_12_run").val()],
				ship_14_Array: [$("#ship_14_beat_angel").val(), $("#ship_14_beat").val(), $("#ship_14_52").val(), $("#ship_14_60").val(), $("#ship_14_75").val(), $("#ship_14_90").val(), $("#ship_14_110").val(), $("#ship_14_120").val(), $("#ship_14_135").val(), $("#ship_14_150").val(), $("#ship_14_run_angel").val(), $("#ship_14_run").val()],
				ship_16_Array: [$("#ship_16_beat_angel").val(), $("#ship_16_beat").val(), $("#ship_16_52").val(), $("#ship_16_60").val(), $("#ship_16_75").val(), $("#ship_16_90").val(), $("#ship_16_110").val(), $("#ship_16_120").val(), $("#ship_16_135").val(), $("#ship_16_150").val(), $("#ship_16_run_angel").val(), $("#ship_16_run").val()],
				ship_18_Array: [ship_18_beat_angel, ship_18_beat, ship_18_52, ship_18_60, ship_18_75, ship_18_90, ship_18_110, ship_18_120, ship_18_135, ship_18_150, ship_18_run_angel, ship_18_run],
				ship_20_Array: [$("#ship_20_beat_angel").val(), $("#ship_20_beat").val(), $("#ship_20_52").val(), $("#ship_20_60").val(), $("#ship_20_75").val(), $("#ship_20_90").val(), $("#ship_20_110").val(), $("#ship_20_120").val(), $("#ship_20_135").val(), $("#ship_20_150").val(), $("#ship_20_run_angel").val(), $("#ship_20_run").val()]
			});
			VPP_messwerteDB.commit();
		}
	}
	
	// Interpolation alle Stützpunkte bei 16 Knoten:
	bestValue = Interpoliere_VPP(16, ['41 5.40', '52 7.97', '60 8.25', '75 8.67', '90 8.87', '110 9.03', '120 9.33', '135 8.99', '150 8.50', '180 7.89']);
}

// Verarbeite übergeben VPP Werte für eine bestimmte Windgeschwindigleit
function Interpoliere_VPP(wind, werteArray) {
	
	// Variablen für Interpolation
	var points, minX, maxX, minY, maxY;
	var ERROR_MSG = {
		'ParseError': 'Die Eingabe konnte nicht eingelesen werden.',
		'NotEnoughPoints': 'Anzal der Stützpunkte nicht ausreichend.',
		'InvalidChars': 'Die Eingabe der Stützpunkte beinhaltet falsche Zeichen.',
		'SameXDifferentY': 'Zwei Stützpunkte haben den gleichen x-Wert, allerdings unterschiedliche y-Werte.'
	};
	
	// Parsen des übergegebenen Strings
	var rows = werteArray;
	var valid = true;
	points = [];
	
	for (var i = 0; i < rows.length; i++) {
		var val = rows[i].split(/\s+/g);
		if (val.length !== 2) {
			valid = false;
			break;
		}
		else {
			// Kontrolle der eingegebenen Stützunkte
			// input can contain: "-" "." \d
			if (!/^\d+$/.test(val[0]) || /^\d+$/.test(val[1])) {
				showError('InvalidChars');
				return;
			}
			
			var x = parseFloat(val[0].replace(String.fromCharCode(8722), '-')),
			y = parseFloat(val[1].replace(String.fromCharCode(8722), '-'));
			
			// check if parsing worked
			if (isNaN(x) || isNaN(y)) {
				valid = false;
				break;
			}
			
			// fill points array with the values which have been parsed
			points.push({
				x: x,
				y: y
			});
		}
	}
	
	// check for parse error
	if (!valid) {
		showError('ParseError');
		return;
	}
	
	try {
		points = processPoints(points);
	}
	catch(error) {
		showError(error.message);
		return;
	}
	
	var minMax = getMinMax(points);
	
	minX = minMax.minX;
	maxX = minMax.maxX;
	minY = minMax.minY;
	maxY = minMax.maxY;
	
	//alert(points.toSource());
	functions = cubicSplineInterpolation(points);
	//alert(functions.toSource());
	
	lastX = undefined;
	
	// output
	showEquations();
	showTable();
	calc_store_BestBrng(wind);
	
	$('#interpolation').popup("open");
	
}


// Berechnung den schnellsten Kurs für ein bestimmte Windstärke
function calc_store_BestBrng(wind) {
	
	var sortARR = [];

	// Spline Funktionsgleichungen
	f = function(x) {
		for (var i = 0; i < functions.length; i++) {
			if (functions[i].range.xmin <= x && functions[i].range.xmax >= x) {
				return functions[i].a * x * x * x + functions[i].b * x * x + functions[i].c * x + functions[i].d;
			}
		}
		return undefined;
	};
	
	// Array für Windstärke befüllen
	for (var i = 1; i <= 180; i++) {
		beat_angel[i] = (typeof f(i) === 'undefined') ? '0' : round(f(i), 4);
		MaxHoehe[i] = round(beat_angel[i] * MathD.cos(i), 4);
	}
	
	// VPP-Werte in assoziatives Array konvertieren und absteigend nach max. Höhe 'h' sortieren
	for (var i = 0; i <= 90; i++) {
		sortARR[i] = [];
		sortARR[i] = {'Winkel':i, 'v':beat_angel[i], 'h':MaxHoehe[i]};   // Assoziatives Array
	}
	
	alert(wind + ' : ' + sortArr[0]['h']);
	
	sortARR.sort(function(a, b){
		var a = a.h, b = b.h;
		return(a == b) ? 0 : (a > b) ? -1 : 1;	// !!! mit: "-1 und 1" vertauschen für aufsteigend sortieren
	});
	// in sortArr[0]['h'] steht die höchste Höhe für den Winkel sortARR[0]['Winkel']
	
						alert('Hallo ' + wind + '  ' + sortArr[0]['h']);


}





// Ausgabe aller Stützpunkte
function showPoints() {
	var html = '';
	for (var i = 0; i < points.length; i++) {
		if (i !== 0) html += '; ';
		html += 'P' + i + '=(' + points[i].x + '|' + points[i].y + ')';
	}
	document.getElementById('point-output').innerHTML = html;
}

// Ausgabe der Gleichungen
function showEquations() {
	var html = '<b>Kubische Gleichungen:</b><br/>';
	for (var i = 0; i < functions.length; i++) {
		var f = functions[i];
		// approximate output
		html += 's' + i + '(x) = ' + roundEng(f.a) + ' * x^3 + ' + roundEng(f.b) + ' * x^2 + ' + roundEng(f.c) + ' * x + ' + roundEng(f.d) + ', if x Element in [' + f.range.xmin + ',' + f.range.xmax + ']' + ((i !== functions.length - 1) ? ', </br>' : '</br>');
	}
	$('#equation-output').empty();
	$('#equation-output').append(html);

}

// Ausgabe der Wertetabelle
function showTable() {
	
	// Spline Funktionsgleichungen
	f = function(x) {
		for (var i = 0; i < functions.length; i++) {
			if (functions[i].range.xmin <= x && functions[i].range.xmax >= x) {
				return functions[i].a * x * x * x + functions[i].b * x * x + functions[i].c * x + functions[i].d;
			}
		}
		return undefined;
	};
	
	// Array für Windstärke 6-12kt befüllen
	for (var i = 1; i <= 180; i++) {
		beat_angel[i] = (typeof f(i) === 'undefined') ? '0' : round(f(i), 4);
		MaxHoehe[i] = round(beat_angel[i] * MathD.cos(i), 4);
	}
	
	var html = '<b>Schnellste Am-Wind-Kurse mit höchster Höhe:</b><br/><table border="1">';
	for (var i = 1; i <= 30; i++) {
		html += '<tr style="border: 1px solid gray;">' +
		'<td class="box">' + i + '°</td><td>' + beat_angel[i] + '</td><td>' + MaxHoehe[i] + '</td>' +
		'<td class="box">' + (30 - - i) + '°</td><td>' + beat_angel[30+i] + '</td><td>' + MaxHoehe[30+i] + '</td>' +  // kleiner Trick um zwei num-Strings zu addieren
		'<td class="box">' + (60 - - i) + '°</td><td>' + beat_angel[60+i] + '</td><td>' + MaxHoehe[60+i] + '</td>' +
		'</tr>';
	}
	html += '</table>';
	
	$('#table-output').empty();
	$('#table-output').append(html);
}

// Hier muss ich noch ein Popup Error programmieren!!!
function showError(code) {
	alert(code);
}

function hideError() {
	alert();
}

function processPoints(points) {
	// sort array by x values
	points.sort(function(a, b) {
		if (a.x < b.x) return -1;
		if (a.x === b.x) return 0;
			return 1;
		});
	
	for (var i = 0; i < points.length; i++) {
		if (i < points.length - 1 && points[i].x === points[i + 1].x) {
			// two points have the same x-value
			
			// check if the y-value is the same
			if (points[i].y === points[i + 1].y) {
				// remove the latter
				points.splice(i, 1);
				i--;
			}
			else {
				throw Error('SameXDifferentY')
			}
		}
	}
	
	if (points.length < 2) {
		throw Error('NotEnoughPoints');
	}
	
	return points;
}

function getMinMax(points) {
	// determine max and min x and y values
	minX = points[0].x;
	maxX = points[0].x;
	minY = points[0].y;
	maxY = points[0].y;
	
	for (var i = 1; i < points.length; i++) {
		minX = Math.min(minX, points[i].x);
		maxX = Math.max(maxX, points[i].x);
		minY = Math.min(minY, points[i].y);
		maxY = Math.max(maxY, points[i].y);
	}
	
	return {
	minX: minX,
	maxX: maxX,
	minY: minY,
	maxY: maxY
	}
}

function cubicSplineInterpolation(p) {
	
	var row = 0;
	var solutionIndex = (p.length - 1) * 4;
	
	// initialize matrix
	var m = []; // rows
	for (var i = 0; i < (p.length - 1) * 4; i++) {
		// columns (rows + 1)
		m.push([]);
		for (var j = 0; j <= (p.length - 1) * 4; j++) {
			m[i].push(0); // fill with zeros
		}
	}
	
	// splines through p equations
	for (var functionNr = 0; functionNr < p.length-1; functionNr++, row += 2) {
		var p0 = p[functionNr], p1 = p[functionNr+1];
		m[row][functionNr*4+0] = Math.pow(p0.x, 3);
		m[row][functionNr*4+1] = Math.pow(p0.x, 2);
		m[row][functionNr*4+2] = Math.pow(p0.x, 1);
		m[row][functionNr*4+3] = 1;
		m[row][solutionIndex] = p0.y;
		m[row+1][(functionNr)*4+0] = Math.pow(p1.x, 3);
		m[row+1][(functionNr)*4+1] = Math.pow(p1.x, 2);
		m[row+1][(functionNr)*4+2] = Math.pow(p1.x, 1);
		m[row+1][(functionNr)*4+3] = 1;
		m[row+1][solutionIndex] = p1.y;
	}
	
	// first derivative
	for (var functionNr = 0; functionNr < p.length - 2; functionNr++, row++) {
		var p1 = p[functionNr+1];
		m[row][functionNr*4+0] = 3*Math.pow(p1.x, 2);
		m[row][functionNr*4+1] = 2*p1.x;
		m[row][functionNr*4+2] = 1;
		m[row][functionNr*4+4] = -3*Math.pow(p1.x, 2);
		m[row][functionNr*4+5] = -2*p1.x;
		m[row][functionNr*4+6] = -1;
	}
	
	// second derivative
	for (var functionNr = 0; functionNr < p.length - 2; functionNr++, row++) {
		var p1 = p[functionNr+1];
		m[row][functionNr*4+0] = 6*p1.x;
		m[row][functionNr*4+1] = 2;
		m[row][functionNr*4+4] = -6*p1.x;
		m[row][functionNr*4+5] = -2;
	}
	
	// boundary conditions
	
	// first and last spline quadratic
	//m[row++][0] = 1;
	//m[row++][solutionIndex-4+0] = 1;*/
	
	// Not-a-knot spline (needs to be adapted - currently second derivative, should be third)
	//m[row][0+0] = 6*p[1].x;
	//m[row][0+1] = 2;
	//m[row][0+4] = -6*p[1].x;
	//m[row++][0+5] = -2;
	//m[row][solutionIndex-8+0] = 6*p[p.length - 1].x;
	//m[row][solutionIndex-8+1] = 2;
	//m[row][solutionIndex-8+4] = -6*p[p.length - 1].x;
	//m[row++][solutionIndex-8+5] = -2;
	
	// natural spline
	m[row][0+0] = 6*p[0].x;
	m[row++][0+1] = 2;
	m[row][solutionIndex-4+0] = 6*p[p.length-1].x;
	m[row][solutionIndex-4+1] = 2;
	
	var coefficients = solveMatrix(m);
	
	var functions = [];
	for (var i = 0; i < coefficients.length; i += 4) {
		functions.push({
			a: coefficients[i],
			b: coefficients[i+1],
			c: coefficients[i+2],
			d: coefficients[i+3],
			range: { xmin: p[i/4].x, xmax: p[i/4+1].x }
		})
	}
	return functions;
}

function solveMatrix(mat) {
	var len = mat.length;
	for (var i = 0; i < len; i++) { // column
		for (var j = i+1; j < len; j++) {// row
			if (mat[i][i] == 0) { // check if cell is zero
				var k = i;
				// search for an element where this cell is not zero
				while (mat[k][i] == 0) k++;
				// swap rows
				var tmp = mat[k].slice();
				mat[k] = mat[i].slice();
				mat[i] = tmp.slice();
			}
			var fac = -mat[j][i]/mat[i][i];
			for(var k = i; k < len+1; k++) // elements in a row
				mat[j][k] += fac *mat[i][k];
		}
	}
	
	var solution = [];
	for (var i = len-1; i >= 0; i--) { // column
		solution.unshift(mat[i][len]/mat[i][i]);
		for (var k = i-1; k >= 0; k--) {
			mat[k][len] -= mat[k][i] * solution[0];
		}
	}
	
	return solution;
}

/**
 * Rundet eine Zahl 'num' auf x Nachkommastellen: Bsp: round(4.234567, 3);  // 4.235
 *
 */
function round(num, X) {
	X = (!X ? 2 : X);										// Default 2 Nachkommastellen
	if (X < 0 || X > 14) return false;		// Nachkomastellen auf 14 Stellen begrenzen
	var e = Math.pow(10, X);
	var k = (Math.round(num * e) / e).toString();
	if (k.indexOf('.') == -1) k += '.';
	k += e.toString().substring(1);
	return k.substring(0, k.indexOf('.') + X+1);
}

/**
 * Rundet eine Zahl 'x' mit vier Nachkommastellen in Exponenten-Schreibweise: zahl*e^exp, Bsp: "1.2345e4"
 *
 */
function roundExp(x) {
	return x.toExponential(4);
}

/**
 * Rundet eine Zahl 'x' mit vier Nachkommastellen in Eng-Schreibweise: "zahl*10^exp", Bsp: "1.2345 * 10^6"
 *
 */
function roundEng(x) {
	var str = roundExp(x).replace('e+0', '').replace('e+', 'e');
	if (str.replace('e', '').length !== str.length) {
		// exponent existing
		str = str.replace('e', ' * 10^');
	}
	return str;
}

// Koordinaten Konvertierung - GradDezimal in Grad Minute
// Bsp: dd2dms(40.567534, 'long');	// 40° 34.224' E
function dd2dm(degree, lat_long, dez) {
	var factor = (!dez) ? 1000 : Math.pow(10, parseInt(dez));
	var deg = Math.abs(parseInt(degree));
	var min = round((Math.abs(degree) - deg) * 60, 5);
	var sign = (degree < 0) ? -1 : 1;
	var dir = (lat_long == 'lat') ? ((sign > 0) ? 'N' : 'S') : ((sign > 0) ? 'E' : 'W');
	if(!dir)
		return (deg * sign) + '\u00b0' + min + "'";
	else
		return deg + '\u00b0' + min + "'" + dir;
}

// Koordinaten Konvertierung - GradDezimal in Grad Minute Sekunde
// Bsp: dd2dms(40.567534, 'long');	// 40° 34' 3.1224" E
function dd2dms(degree, lat_long, dez) {
	var factor = (!dez) ? 1000 : Math.pow(10, parseInt(dez));
	var deg = Math.abs(parseInt(degree));
	var min = (Math.abs(degree) - deg) * 60;
	var sec = min;
	min = Math.abs(parseInt(min));
	sec = round((sec - min) * 60, 5);
	var sign = (degree < 0) ? -1 : 1;
	var dir = (lat_long == 'lat') ? ((sign > 0) ? 'N' : 'S') : ((sign > 0) ? 'E' : 'W');
	if(!dir)
		return (deg * sign) + '\u00b0' + min + "'" + sec + '"';
	else
		return deg + '\u00b0' + min + "'" + sec + '"' + dir;
}

// Koordinaten Konvertierung - Grad Minute Sekunde in GradDezimal
// Bsp: dms2dd(40, 34, 3.1224, 'E');	// 40,567534° E
function dms2dd(deg, min, sec, dir, dez) {
	var factor = (!dez) ? 1000 : Math.pow(10, parseInt(dez));
	var sign;
	if(dir) {
		sign = (dir.toLowerCase() == 'w' || dir.toLowercase() == 's') ? -1 : 1;
		dir = (dir.toLowerCase() == 'w' || dir.toLowercase() == 's' || dir.toLowercase() == 'n' || dir.toLowercase() == 'e') ? dir.toUpperCase() : '';
	} else {
		sign = (deg < 0) ? -1 : 1;
		dir = '';
	}
	var dec = round((Matg.abs(deg) + ((min * 60) + sec) / 3600), 5);
	if(!dir || dir == '')
		return (dec * sign) + '\u00b0';
	else
		return dec + '\u00b0' + dir;
}

// Umrechnung Kilometer in Nautische Meilen
function km2nm(km, dez) {
	return round(km / 1.852, dez);
}

// Umrechnung Nautische Meilen in Kilometer
function nm2km(nm, dez) {
	return round(nm * 1.852, dez);
}

// Trigonometrische Funktionen in Grad statt im Radiant
/**
 * converts degree to radians
 * @param degree
 * @returns {number}
 */
var toRadians = function (degree) {
	return degree * (Math.PI / 180);
};

/**
 * Converts radian to degree
 * @param radians
 * @returns {number}
 */
var toDegree = function (radians) {
	return radians * (180 / Math.PI);
}

/**
 * Rounds a number mathematical correct to the number of decimals
 * @param number
 * @param decimals (optional, default: 10)
 * @returns {number}
 */
var roundNumber = function(number, decimals) {
	decimals = decimals || 10;
	return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
}
//the object
var MathD = {
sin: function(number){
	return roundNumber(Math.sin(toRadians(number)));
},
cos: function(number){
	return roundNumber(Math.cos(toRadians(number)));
},
tan: function(number){
	return roundNumber(Math.tan(toRadians(number)));
},
asin: function(number){
	return roundNumber(toDegree(Math.asin(number)));
},
acos: function(number){
	return roundNumber(toDegree(Math.acos(number)));
},
atan: function(number){
	return roundNumber(toDegree(Math.atan(number)));
}
};

/**
 * jQuery getActualiCal plugin
 *
 *  Copyright (c) 2012 Friedhelm Koch (service at vialinked.com)
 *  Not under Open Source License!
 *
 *  Aktuelles Datum in UTC oder Local im iCal Format ISO 8601
 *
 *  Parameter:
 *  	  - UTC ohne Zeit: ( Bsp: $.getActualiCal('UTC', true); )
 *      Rückgabe: jjjjmmdd = 20120512
 *
 *    - UTC mit Zeit: ( Bsp: $.getActualiCal('UTC'); )
 *      Rückgabe: jjjjmmddThhmmssZ = 20120512T131603Z
 *
 *    - Local ohne Zeit: ( Bsp: $.getActualiCal('Local', true); )
 *      Rückgabe: jjjjmmdd = 20120512
 *
 *    - Local mit Zeit: ( Bsp: $.getActualiCal('Local'); )
 *      Rückgabe: jjjjmmddThhmmss = 20120512T131603
 *
 *    - kein Parameter: ( Bsp: $.getActualiCal(); )
 *      Rückgabe Local mit Zeit: jjjjmmddThhmmssZ = 20120512T131603Z
 */
;(function($) {
	$.getActualiCal = function (UTC, para) {
	
	var dt = new Date();
	var yyyy = (/UTC/i.test(UTC)) ? dt.getUTCFullYear() : dt.getFullYear();
	var mm = dt.getUTCMonth()+1;
	if (mm <= 9) { mm = "0" + mm; }
	var dd = (/UTC/i.test(UTC)) ? dt.getUTCDate() : dt.getDate();
	if (dd <= 9) { dd = "0" + dd; }
	var hh = (/UTC/i.test(UTC)) ? dt.getUTCHours() : dt.getHours();
	if (hh <= 9) { hh = "0" + hh; }
	var mi = (/UTC/i.test(UTC)) ? dt.getUTCMinutes() : dt.getMinutes();
	if (mi <= 9) { mi = "0" + mi; }
	var ss = (/UTC/i.test(UTC)) ? dt.getUTCSeconds() : dt.getSeconds();
	if (ss <= 9) { ss = "0" + ss; }
	
	// wenn DT undefiniert, dann iCal komplett, ansonsten nur das Datum zurückgeben
	if(/UTC/i.test(UTC)) {
	var DT = (/undefined/.test(para)) ? yyyy + '' + mm + '' + dd + 'T' + hh + '' + mi + '' + ss + 'Z' : yyyy + '' + mm + '' + dd;
	} else {
	var DT = (/undefined/.test(para)) ? yyyy + '' + mm + '' + dd + 'T' + hh + '' + mi + '' + ss : yyyy + '' + mm + '' + dd;
	}
	return DT;
	
	};
	})(jQuery);

// Header für iPhone/iPad iOS7+ verbreitern
function iOSversion() {
	if (/iP(hone|od|ad)/.test(navigator.platform)) {
		var v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
		return [parseInt(v[1], 10), parseInt(v[2], 10), parseInt(v[3] || 0, 10)];
	} else {
		return false;
	}
}

ver = iOSversion();
if (ver[0] >= 7) {
	$(window).load(function(){
		$('div[data-role="header"]').css('padding-top','20px');
	//	$('.iOS7Header').css('ui-btn-icon-notext:after','-5px');
	});
}

					
// EOF
