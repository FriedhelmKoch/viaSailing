L.Control.SimpleMarkers = L.Control.extend({
    options: {
        position: 'topleft'
    },
    
    onAdd: function () {
        var marker_container = L.DomUtil.create('div', 'marker_controls');
        var add_marker_div = L.DomUtil.create('div', 'add_marker_control', marker_container);
        var del_marker_div = L.DomUtil.create('div', 'del_marker_control', marker_container);
        add_marker_div.title = 'Add a marker';
        del_marker_div.title = 'Delete a marker';
        
        L.DomEvent.addListener(add_marker_div, 'click', L.DomEvent.stopPropagation)
            .addListener(add_marker_div, 'click', L.DomEvent.preventDefault)
            .addListener(add_marker_div, 'click', (function () { this.enterAddMarkerMode() }).bind(this));
        
        L.DomEvent.addListener(del_marker_div, 'click', L.DomEvent.stopPropagation)
            .addListener(del_marker_div, 'click', L.DomEvent.preventDefault)
            .addListener(del_marker_div, 'click', (function () { this.enterDelMarkerMode() }).bind(this));
        
        return marker_container;
    },
    
    enterAddMarkerMode: function () {
        if (markerList !== '') {
            for (var marker = 0; marker < markerList.length; marker++) {
                if (typeof(markerList[marker]) !== 'undefined') {
                    markerList[marker].removeEventListener('click', this.onMarkerClickDelete);
                } 
            }
        }
        document.getElementById('map').style.cursor = 'crosshair';
        map.addEventListener('click', this.onMapClickAddMarker);
    },
    
    enterDelMarkerMode: function () {
        for (var marker = 0; marker < markerList.length; marker++) {
            if (typeof(markerList[marker]) !== 'undefined') {
                markerList[marker].addEventListener('click', this.onMarkerClickDelete);
            }
        }
    },
    
    onMapClickAddMarker: function(e) {
        map.removeEventListener('click'); 
        document.getElementById('map').style.cursor = 'auto';

				// Wegpunkt setzen
				var WayPoint_analog = new LatLon(Geo.parseDMS(e.latlng.lat), Geo.parseDMS(e.latlng.lng));
				var WayPoint_dezimal = new L.LatLng(e.latlng.lat, e.latlng.lng);

				// Schiffsposition in analog "48°29′26″N, 011°20′18″E" und dezimal LatLng(48.49054, 11.33821)
				var ShipPoint_analog = new LatLon(Geo.parseDMS(myLat), Geo.parseDMS(myLng));
				var ShipPoint_dezimal = new L.LatLng(myLat, myLng);

				// Kurs "KP" (Bsp: 338.12305164292053 in Grad) und Distanz "c" (Bsp: 1.2345 in km) vom Schiff zum Wegpunkt
				var KP = ShipPoint_analog.bearingTo(WayPoint_analog);  // Kurs "KP" zum Wegpunkt
				var c = ShipPoint_analog.distanceTo(WayPoint_analog);  // Distanz "c" nach vergrößerter Breite, in km
																					 
				// Optionen: KW = Windrichtung - aus Page: windPage / Input des Drehknopfes entnehmen (Bsp: 275 in Grad)
				var KW = parseFloat($('#windRichtung').val());
																					 
				// Windstärke aus Wind-Page Einstellung
				var Windstaerke = $('#windSpeed').val();
																					 
				// Sicherheit zur Layline aus Wind-Page Einstellung
				var Sicherheit = parseInt($('#distLayline').val());
																					 
				// schnellster Kurs - aus Spline-Interpolation ermittelt
				for (var i in best_beat_ARR) {
					if (best_beat_ARR[i]['wind'] = Windstaerke) {
						AlphaA = best_beat_ARR[i]['winkel'];
						v = best_beat_ARR[i]['v'];
					}
				}
																					 
				// Berechnung des ersten Kurses - Rückgabe in Array mit: [0]Winkel, [1]Länge, [2]BetaL, [3]BetaL_Sec, [4]aussenFlag
				var KursWL_ARR = KursWinkel_KursLaenge(WayPoint_analog, ShipPoint_analog, AlphaA, KW, KP, c, Windstaerke, Sicherheit);
																					 
				var KursWinkel = (KursWL_ARR[0] < 360) ? KursWL_ARR[0] : KursWL_ARR[0] - 360;
				var KursLinienlaenge = KursWL_ARR[1];
				var BetaL = KursWL_ARR[2];
				var BetaL_Sec = KursWL_ARR[3];
				var	aussenFlag = KursWL_ARR[4];
																					 
				// Darstellung der Kurslinie
				//     erster Schlag zum Wegpunkt
				var KursLinie = ShipPoint_analog.destinationPoint(KursWinkel, KursLinienlaenge).toString().split(", ");
				var BearingendPoint = new L.LatLng(Geo.parseDMS(KursLinie[0]), Geo.parseDMS(KursLinie[1]));
				var BearingCoordinates = [ShipPoint_dezimal, BearingendPoint];
				var Kurs1 = ShipPoint_analog.destinationPoint(KursWinkel, KursLinienlaenge).toString().split(", ");
																		
				var BearingendPoint_analog = new LatLon(Geo.parseDMS(KursLinie[0]), Geo.parseDMS(KursLinie[1]));
				var BearingendPoint_dezimal = new L.LatLng(Geo.parseDMS(KursLinie[0]), Geo.parseDMS(KursLinie[1]));
																					 																					 
				// Darstellung der ersten Kurslinie
				Kurs = (!aussenFlag ) ? new L.polyline(BearingCoordinates, { color: 'blue', weight: 2, opacity: 0.5, smoothFactor: 1 }).addTo(map) : new L.polyline(BearingCoordinates, { color: '#505050', weight: 1, opacity: 1.0, smoothFactor: 1, dashArray: '20,15' }).addTo(map);

				// Infoseite mit ersten Kursdaten updaten
				$('#Navi_Wegpunkt').empty();
				$('#Navi_Geschwindigkeit').empty();
				if (!aussenFlag) {
					// Performancedaten im Info-Popup ergänzen
					var html = "<table width='100%' cellpadding='1' cellspacing='0' border='0'" +
					"<tr><td align='left'>Bei einer Windstärke von: </td><td align='right'>" + $('#windSpeed').val() + "</td><td align='left'>kn</td></tr>" +
					"<tr><td align='left'>ergibt sich eine Schiffs-Geschwindigkeit: </td><td align='right'>" + round(v, 2) + "</td><td align='left'>kn</td></tr>" +
					"<tr><td align='left'>bei einem optimalen Kurs zum Wind: </td><td align='right'>" + AlphaA + "</td><td align='left'>°</td></tr>" +
					"</table>";
					$('#Navi_Geschwindigkeit').append(html);

					// Wegpunktdaten ergänzen
					var html = "<hr size='1px' align='center' width='70%' color='#c0c0c0' noshade>Wegpunkt: " + "φ: " + dd2dm(e.latlng.lat, 'lat', 5) + "; λ: " + dd2dm(e.latlng.lng, 'lng', 5);
//			var html = "<hr size='1px' align='center' width='70%' color='#c0c0c0' noshade>Wegpunkt: " + "φ: " + round(e.latlng.lat, 6) + "; λ: " + round(e.latlng.lng, 6);
					html +=	"<table width='100%' cellpadding='1' cellspacing='0' border='0'" +
						"<tr><td align='left'>Distanz Luftlinie Schiff-Wegpunkt: </td><td align='right'>" + km2nm(c) + "</td><td align='left'>sm</td></tr>" +
						"<tr><td align='left'>Distanz bis zum 1. Wendepunkt: </td><td align='right'>" + round(KursLinienlaenge, 2) + "</td><td align='left'>sm</td></tr>" +
						"<tr><td align='left'>Zeit bis zum 1. Wendepunkt: </td><td align='right'>" + round(KursLinienlaenge * 60 / v, 2) + "</td><td align='left'>min</td></tr>" +
						"<tr><td align='left'>schnellster Kurs zum 1. Wendepunkt: </td><td align='right'>" + round(KursWinkel, 2) + "</td><td align='left'>°</td></tr>"	+
						"</table>" +
						"<hr size='1px' align='center' width='70%' color='#c0c0c0' noshade>" +
						"1. Wendepunkt: φ: " + dd2dm(Geo.parseDMS(KursLinie[0]), 'lat', 5) + "; λ: " + dd2dm(Geo.parseDMS(KursLinie[1]), 'lng', 5);
//				"1. Wendepunkt: φ: " + round(Geo.parseDMS(KursLinie[0]), 6) + "; λ: " + round(Geo.parseDMS(KursLinie[1]), 6);
					$('#Navi_Wegpunkt').append(html);
				}
																					 
				// Berechnung des zweiten Kurses - Rückgabe in Array mit: [0]Winkel, [1]Länge, [2]BetaL, [3]BetaL_Sec, [4]aussenFlag
				var KP2 = BearingendPoint_analog.bearingTo(WayPoint_analog);  // Kurs "KP" hat sich verändert und wird jetzt vom Endpunkt des ersten Kurses gemessen
				var c2 = BearingendPoint_analog.distanceTo(WayPoint_analog);  // Distanz "c" hat sich verändert und ist der Endpunkt des ersten Kurses
																					 
				var KursWL_ARR = KursWinkel_KursLaenge(WayPoint_analog, BearingendPoint_analog, AlphaA, KW, KP2, c2, Windstaerke, Sicherheit);
																					 
				var KursWinkel2 = KursWL_ARR[0];
				var KursLinienlaenge2 = KursWL_ARR[1];
				var BetaL2 = KursWL_ARR[2];
				var BetaL2_Sec = KursWL_ARR[3];
																					 
				// Darstellung der Kurslinie
				//     zweiter Schlag zum Wegpunkt
				var KursLinie2 = BearingendPoint_analog.destinationPoint(KursWinkel2, KursLinienlaenge2).toString().split(", ");
				var BearingendPoint2 = new L.LatLng(Geo.parseDMS(KursLinie2[0]), Geo.parseDMS(KursLinie2[1]));
				var BearingCoordinates2 = [BearingendPoint_dezimal, BearingendPoint2];
				var Kurs2 = BearingendPoint_analog.destinationPoint(KursWinkel2, KursLinienlaenge2).toString().split(", ");
																					 
				var BearingendPoint2_analog = new LatLon(Geo.parseDMS(KursLinie2[0]), Geo.parseDMS(KursLinie2[1]));
				var BearingendPoint2_dezimal = new L.LatLng(Geo.parseDMS(KursLinie2[0]), Geo.parseDMS(KursLinie2[1]));
																					 
				// Darstellung der zweiten Kurslinie
				Kurs = (!aussenFlag ) ? new L.polyline(BearingCoordinates2, { color: 'blue', weight: 2, opacity: 0.5, smoothFactor: 1 }).addTo(map) : new L.polyline(BearingCoordinates2, { color: '#505050', weight: 1, opacity: 1.0, smoothFactor: 1, dashArray: '20,15' }).addTo(map);

				var KP3 = BearingendPoint2_analog.bearingTo(WayPoint_analog);  // Kurs "KP" hat sich verändert und wird jetzt vom Endpunkt des ersten Kurses gemessen
				var c3 = BearingendPoint2_analog.distanceTo(WayPoint_analog);  // Distanz "c2" hat sich verändert und ist der Endpunkt des ersten Kurses
																					 
				// Infoseite mit zweiten Kursdaten updaten
				if (!aussenFlag) {
					var html = "<table width='100%' cellpadding='1' cellspacing='0' border='0'" +
						"<tr><td align='left'>Distanz Luftlinie 1. Wendepunkt-Wegpunkt: </td><td align='right'>" + km2nm(c2) + "</td><td align='left'>sm</td></tr>" +
						"<tr><td align='left'>Distanz bis zum 2. Wendepunkt: </td><td align='right'>" + round(KursLinienlaenge2, 2) + "</td><td align='left'>sm</td></tr>" +
						"<tr><td align='left'>Zeit bis zum 2. Wendepunkt: </td><td align='right'>" + round(KursLinienlaenge2 * 60 / v, 2) + "</td><td align='left'>min</td></tr>" +
						"<tr><td align='left'>schnellster Kurs zum 2. Wendepunkt: </td><td align='right'>" + round(KursWinkel2, 2) + "</td><td align='left'>°</td></tr>"	+
						"</table>" +
						"<hr size='1px' align='center' width='70%' color='#c0c0c0' noshade>" +
						"2. Wendepunkt: φ: " + dd2dm(Geo.parseDMS(KursLinie2[0]), 'lat', 5) + "; λ: " + dd2dm(Geo.parseDMS(KursLinie2[1]), 'lng', 5);
//				"2. Wendepunkt: φ: " + round(Geo.parseDMS(KursLinie2[0]), 6) + "; λ: " + round(Geo.parseDMS(KursLinie2[1]), 6);
					$('#Navi_Wegpunkt').append(html);
				}

				// Berechnung des dritten Kurses - Rückgabe in Array mit: [0]Winkel, [1]Länge, [2]BetaL, [3]BetaL_Sec, [4]aussenFlag
				var KP4 = BearingendPoint2_analog.bearingTo(WayPoint_analog);  // Kurs "KP" hat sich verändert und wird jetzt vom Endpunkt des ersten Kurses gemessen
				var c4 = BearingendPoint2_analog.distanceTo(WayPoint_analog);  // Distanz "c" hat sich verändert und ist der Endpunkt des ersten Kurses
																					 
				var KursWL_ARR = KursWinkel_KursLaenge(WayPoint_analog, BearingendPoint2_analog, AlphaA, KW, KP3, c3, Windstaerke, Sicherheit);
																					 
				var KursWinkel3 = KursWL_ARR[0];
				var KursLinienlaenge3 = KursWL_ARR[1];
				var BetaL3 = KursWL_ARR[2];
				var BetaL3_Sec = KursWL_ARR[3];

				// Darstellung der Kurslinie
				//     dritter Schlag zum Wegpunkt
				var KursLinie3 = BearingendPoint2_analog.destinationPoint(KursWinkel3, KursLinienlaenge3).toString().split(", ");
				var BearingendPoint3 = new L.LatLng(Geo.parseDMS(KursLinie3[0]), Geo.parseDMS(KursLinie3[1]));
				var BearingCoordinates3 = [BearingendPoint2_dezimal, BearingendPoint3];
				var Kurs3 = BearingendPoint2_analog.destinationPoint(KursWinkel3, KursLinienlaenge3).toString().split(", ");
																					 
				// Darstellung der dritten Kurslinie
				Kurs = (!aussenFlag ) ? new L.polyline(BearingCoordinates3, { color: 'blue', weight: 2, opacity: 0.5, smoothFactor: 1 }).addTo(map) : new L.polyline(BearingCoordinates3, { color: '#505050', weight: 1, opacity: 1.0, smoothFactor: 1, dashArray: '20,15' }).addTo(map);

				// Infoseite mit dritten Kursdaten updaten
				if (!aussenFlag) {
					var html = "<table width='100%' cellpadding='1' cellspacing='0' border='0'" +
						"<tr><td align='left'>Distanz Luftlinie 2. Wendepunkt-Wegpunkt: </td><td align='right'>" + km2nm(c3) + "</td><td align='left'>sm</td></tr>" +
						"<tr><td align='left'>Distanz bis zum 3. Wendepunkt: </td><td align='right'>" + round(KursLinienlaenge3, 2) + "</td><td align='left'>sm</td></tr>" +
						"<tr><td align='left'>Zeit bis zum 3. Wendepunkt: </td><td align='right'>" + round(KursLinienlaenge3 * 60 / v, 2) + "</td><td align='left'>min</td></tr>" +
						"<tr><td align='left'>schnellster Kurs zum 3. Wendepunkt: </td><td align='right'>" + round(KursWinkel3, 2) + "</td><td align='left'>°</td></tr>"	+
						"</table>";
				} else { html = "<hr size='1px' align='center' width='70%' color='#c0c0c0' noshade><b>ACHTUNG:</b> Wegpunkt liegt ausserhalb der Laylines <br>und wird in dieser Version der Applikation nicht berechnet!" }
																					 
				$('#Navi_Wegpunkt').append(html);
																					 
				// Berechnung und Darstellung der Laylines
        //
				// Der Wendewinkel ergibt sich aus den Segeleigenschaften des Schiffes
        var halberWendewinkel = BetaL;
				var halberWendewinkel_Sec = BetaL_Sec;
				var Wendewinkel = halberWendewinkel * 2;				// BeatVMG = 41°, dann ist Winddreieck bei 82°
				var Wendewinkel_Sec = halberWendewinkel_Sec * 2;
				var Wechselwinkel = KW + 180.0;								// Wechsel/Z-Winkel

				// Laylines
				var LayLineWinkel1 = (Wechselwinkel - halberWendewinkel < 360) ? Wechselwinkel - halberWendewinkel : Wechselwinkel - halberWendewinkel - 360;		// 1-te Layline
				var LayLineWinkel2 = (Wechselwinkel + halberWendewinkel < 360) ? Wechselwinkel + halberWendewinkel : Wechselwinkel + halberWendewinkel - 360;		// 2-te Layline
				// vorgeschobene Laylines
				var LayLineWinkel1_Sec = (Wechselwinkel - halberWendewinkel_Sec < 360) ? Wechselwinkel - halberWendewinkel_Sec : Wechselwinkel - halberWendewinkel_Sec - 360;		// 1-te vorgeschobene Layline
				var LayLineWinkel2_Sec = (Wechselwinkel + halberWendewinkel_Sec < 360) ? Wechselwinkel + halberWendewinkel_Sec : Wechselwinkel + halberWendewinkel_Sec - 360;		// 2-te vorgeschobene Layline
																					 
				var LayLineLenght = ShipPoint_analog.distanceTo(WayPoint_analog) * 1.20;         // Verlängerte Layline 120% Distanz zum Wegpunkt
				
				// Stb-Layline
				var KursLayLine1 = WayPoint_analog.destinationPoint(LayLineWinkel1, LayLineLenght).toString().split(", ");
				var LayLinePoint1 = new L.LatLng(Geo.parseDMS(KursLayLine1[0]), Geo.parseDMS(KursLayLine1[1]));
				var LayLineList1 = [WayPoint_dezimal, LayLinePoint1];
				// vorschgeschobene Layline 1 (Stb-Layline)
				var KursLayLine1_Sec = WayPoint_analog.destinationPoint(LayLineWinkel1_Sec, LayLineLenght).toString().split(", ");
				var LayLinePoint1_Sec = new L.LatLng(Geo.parseDMS(KursLayLine1_Sec[0]), Geo.parseDMS(KursLayLine1_Sec[1]));
				var LayLineList1_Sec = [WayPoint_dezimal, LayLinePoint1_Sec];
	
				// Bb-Layline
        var KursLayLine2 = WayPoint_analog.destinationPoint(LayLineWinkel2, LayLineLenght).toString().split(", ");
				var LayLinePoint2 = new L.LatLng(Geo.parseDMS(KursLayLine2[0]), Geo.parseDMS(KursLayLine2[1]));
				var LayLineList2 = [WayPoint_dezimal, LayLinePoint2];
				// vorschgeschobene Layline 2 (Bb-Layline)
				var KursLayLine2_Sec = WayPoint_analog.destinationPoint(LayLineWinkel2_Sec, LayLineLenght).toString().split(", ");
				var LayLinePoint2_Sec = new L.LatLng(Geo.parseDMS(KursLayLine2_Sec[0]), Geo.parseDMS(KursLayLine2_Sec[1]));
				var LayLineList2_Sec = [WayPoint_dezimal, LayLinePoint2_Sec];
                                           
				// Darstellung der Stb-Laylines
				KursLayLine1 = new L.polyline(LayLineList1, {   // Polyline - Steuerbord Layline
					color: 'green', weight: 2, opacity: 0.5, smoothFactor: 1
				}).addTo(map);
				// Darstellung der vorgeschobenen Stb-Layline
				KursLayLine1_Sec = new L.polyline(LayLineList1_Sec, {   // Polyline - Steuerbord Layline
					color: 'green', weight: 2, opacity: 0.5, smoothFactor: 1, dashArray: '10,10'
				}).addTo(map);
				// Darstellung der Bb-Laylines
				KursLayLine2 = new L.polyline(LayLineList2, {   // Polyline - Backbord Layline
					color: 'red', weight: 2, opacity: 0.5, smoothFactor: 1
				}).addTo(map);
				// Darstellung der vorgeschobenen Bb-Layline
				KursLayLine2_Sec = new L.polyline(LayLineList2_Sec, {   // Polyline - Backbord Layline
					color: 'red', weight: 2, opacity: 0.5, smoothFactor: 1, dashArray: '10,10'
				}).addTo(map);
																					 
				// Darstellung Koordinaten, Kurs und Distanz
        var popupContent = "φ: " + dd2dm(e.latlng.lat, 'lat', 5) + "<br/>λ: " + dd2dm(e.latlng.lng, 'lng', 5);
        //var popupContent = "A-C:" + round(AlphaC,2) + " / A-B:" + round(AlphaB,2) + "<br/>A-W:" + + round(AlphaW,2) + " / A-Z:" + round(AlphaZ,2) + "<br/>A-KP:" + round(AlphaKP,2) + " / BetaP: " + round(BetaP,2) + "<br/>Gamma:" + round(Gamma,2) + "<br/>KW:" + round(KW,2) + " / KP:" + round(KP,2) + "<br/>Kurs: " + round(KursWinkel,2) + " / Dist:" + km2nm(c) + "nm";
                                           
        var the_popup = L.popup({maxWidth: 160, closeButton: true});
        the_popup.setContent(popupContent);
                                           
        // Darstellung und Positionierung des Schiffsmarkers
        var marker = L.marker(e.latlng);
        marker.addTo(map);
        marker.bindPopup(the_popup).openPopup();
        markerList.push(marker);
                                           
        // Direkte Peillinie vom Wegpunkt zum Schiff
        var PointList = [ShipPoint_dezimal, WayPoint_dezimal];
        WayPoint2Ship = new L.polyline(PointList, {
					color: '#505050', weight: 1, opacity: 0.5, smoothFactor: 1, dashArray: '20,15'
        }).addTo(map);
		
				$('#popupShowNavigation').popup("open");
																					 
        return false;    
    },

    onMarkerClickDelete: function(e) {
        map.removeLayer(this);
        var marker_index = markerList.indexOf(this);
        delete markerList[marker_index];
        
        for (var marker = 0; marker < markerList.length; marker++) {
            if (typeof(markerList[marker]) !== 'undefined') {
                markerList[marker].removeEventListener('click', arguments.callee);
            } 
        }
				clearAllPolylinesMap();	// Löschen der zugehörigen Polylines
				$('#Navi_Wegpunkt').empty();																	 
				$('#Navi_Wegpunkt').append("<hr size='1px' align='center' width='70%' color='#c0c0c0' noshade><b>ACHTUNG:</b> Kein Wegpunkt definiert!");
																					 
        return false;  
    }
});

var markerList = [];

// Löschen ALLER Polylines innerhalb der Map
function clearAllPolylinesMap(){ 
	for(i in map._layers){ 
		if(map._layers[i]._path != undefined) { 
			try{ map.removeLayer(map._layers[i]); 
			} catch(e){ console.log("problem with " + e + map._layers[i]); } 
		}
	} 
}

