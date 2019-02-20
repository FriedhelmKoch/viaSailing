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
                                           
				// Coordinates
				// 		wenn aus Datenfeld ausgelesen werden soll
				// 		Bsp: var p1 = new LatLon(Geo.parseDMS($('#lat1').val()), Geo.parseDMS($('#lon1').val()));
        //        in Grad und Minuten-/Sekundenangabe
 
        // ____________ Winkel
                                           
        var c, AlphaW, AlphaZ, AlphaKP, AlphaB, AlphaC, BetaP, BetaL, Gamma, KursWinkel, KursLinienlaenge;

        var ShipPoint_analog = new LatLon(Geo.parseDMS(myLat), Geo.parseDMS(myLng));                  // Schiffsposition
        var ShipPoint_dezimal = new L.LatLng(myLat, myLng);

        var WayPoint_analog = new LatLon(Geo.parseDMS(e.latlng.lat), Geo.parseDMS(e.latlng.lng));    // Wegpunkt
        var WayPoint_dezimal = new L.LatLng(e.latlng.lat, e.latlng.lng);
                                           
				// Kurs "KP" und Distanz "c" vom Schiff zum Wegpunkt
				var KP = ShipPoint_analog.bearingTo(WayPoint_analog);       // Kurs "KP" zum Wegpunkt
				var c = ShipPoint_analog.distanceTo(WayPoint_analog);       // Distanz "c" nach vergrößerter Breite, in km
		
        // KW = Windrichtung - aus Page: windPage / Input des Drehknopfes entnehmen
        var KW = parseFloat($('#windRichtung').val());

        // Kurs zum Wegpunkt innerhalb der LayLine
        var WindStaerke = 16;                       // Aus individueller Einstellung der Windparameter-Page
        var schnellsterWinkel = 50;                 // Berechnet aus Spline-Interpolation
        BetaL = BeatVMG16_Angel;                    // BeatVMG_Angel;

        // schnellster Kurs - aus Spline-Interpolation ermittelt
        AlphaA = schnellsterWinkel;

        // Winkel zum Wind und Nord (kann + bei <180 oder - bei >180 werden)
        AlphaW = (KW < 180 ? KW : KW - 360);

        // Winkel zum Wegpunkt und Nord (kann + bei <180 oder - bei >180 werden)
        AlphaZ = (KP < 180 ? KP : Math.abs(KP - 360));

        //AlphaKP = (brng < 180 ? Math.abs(AlphaZ - AlphaW) : Math.abs(AlphaZ + AlphaW));
        // Winkel zum KP und KW (Differenzwinkel)
        AlphaKP = Math.abs(AlphaZ + AlphaW);
                                           
        AlphaB = Math.abs(AlphaA - AlphaKP);
        AlphaC = Math.abs(AlphaA + AlphaKP);
                                           
        // Holebug versus Streckbug
        if(AlphaC > AlphaB) {
          BetaP = BetaL + AlphaKP;
        } else {
          BetaP = BetaL - AlphaKP;
        }
                                           
        Gamma = 180 - AlphaB - BetaP; // zur Bestimmung der Kurslinienlänge
        
        // Schiff liegt ausserhalb seiner Laylines
        if (BetaL < 2 * AlphaKP) {
          // Kurs (von Nord ausgehend)
          KursWinkel = KP;
          KursLinienlaenge = c;
        } else {
          KursWinkel = (KP < 180 ? AlphaZ + AlphaB : 360 - AlphaZ - AlphaB);
          KursLinienlaenge = c * MathD.sin(AlphaKP + BetaL) / MathD.sin(Gamma);
        }

        // Polyline - erster Kurs zum Wegpunkt
        var KursLinie = ShipPoint_analog.destinationPoint(KursWinkel, KursLinienlaenge).toString().split(", ");
        var BearingendPoint = new L.LatLng(Geo.parseDMS(KursLinie[0]), Geo.parseDMS(KursLinie[1]));
        var BearingCoordinates = [ShipPoint_dezimal, BearingendPoint];
        var Kurs = ShipPoint_analog.destinationPoint(KursWinkel, KursLinienlaenge).toString().split(", ");
        Kurs = new L.polyline(BearingCoordinates, {																// Kurslinie
          color: 'blue',
          weight: 2,
          opacity: 0.5,
          smoothFactor: 1
        }).addTo(map);
                                           
        // Darstellung Koordinaten, Kurs und Distanz
				var popupContent = "φ: " + dd2dm(e.latlng.lat, 'lat', 5) + "<br/>λ: " + dd2dm(e.latlng.lng, 'lng', 5) + "<br/>Distanz: " + km2nm(c) + "nm<br/>Peilung: " + round(KP,2) + "\u00b0<br/>AlphaC: " + round(AlphaC,2) + "/AlphaB: " + round(AlphaB,2) + "<br/>AlpahKP: " + round(AlphaKP,2) + "/BetaP: " + round(BetaP,2) + "<br/>KW: " + round(KW,2) + "<br/>Kurs: " + round(KursWinkel,2);
				
        var the_popup = L.popup({maxWidth: 160, closeButton: true});
        the_popup.setContent(popupContent);
        
				// Darstellung und Positionierung des Schiffsmarkers
        var marker = L.marker(e.latlng);
        marker.addTo(map);
        marker.bindPopup(the_popup).openPopup();
        markerList.push(marker);

        // Polyline - vom Wegpunkt zum Schiff
        var PointList = [ShipPoint_dezimal, WayPoint_dezimal];
				WayPoint2Ship = new L.polyline(PointList, {
					color: '#505050',
					weight: 1,
					opacity: 0.5,
					smoothFactor: 1
				}).addTo(map);

				// ____________ Laylines
                                           
				// Der Wendewinkel ergibt sich aus den Segeleigenschaften des Schiffes
        var halberWendewinkel = BeatVMG16_Angel;
				var Wendewinkel = halberWendewinkel * 2;    // Winddreieck bei 41° BeatVMG = 82°
				
				var Wechselwinkel = KW + 180.0;						  // Wechsel/Z-Winkel

				var LayLineWinkel1 = (Wechselwinkel - halberWendewinkel < 360) ? Wechselwinkel - halberWendewinkel : Wechselwinkel - halberWendewinkel - 360;		// 1-te Layline
				var LayLineWinkel2 = (Wechselwinkel + halberWendewinkel < 360) ? Wechselwinkel + halberWendewinkel : Wechselwinkel + halberWendewinkel - 360;		// 2-te Layline	

				var LayLineLenght = ShipPoint_analog.distanceTo(WayPoint_analog) * 1.20;         // Verlängerte Layline 120% Distanz zum Wegpunkt
				
				var KursLayLine1 = WayPoint_analog.destinationPoint(LayLineWinkel1, LayLineLenght).toString().split(", ");
				var LayLinePoint1 = new L.LatLng(Geo.parseDMS(KursLayLine1[0]), Geo.parseDMS(KursLayLine1[1]));
				var LayLineList1 = [WayPoint_dezimal, LayLinePoint1];
	
        var KursLayLine2 = WayPoint_analog.destinationPoint(LayLineWinkel2, LayLineLenght).toString().split(", ");
				var LayLinePoint2 = new L.LatLng(Geo.parseDMS(KursLayLine2[0]), Geo.parseDMS(KursLayLine2[1]));
				var LayLineList2 = [WayPoint_dezimal, LayLinePoint2];
				
				KursLayLine1 = new L.polyline(LayLineList1, {   // Polyline - Steuerbord Layline
					color: 'green',
					weight: 2,
					opacity: 0.5,
					smoothFactor: 1
				}).addTo(map);

				KursLayLine2 = new L.polyline(LayLineList2, {   // Polyline - Backbord Layline
					color: 'red',
					weight: 2,
					opacity: 0.5,
					smoothFactor: 1
				}).addTo(map);
				
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

