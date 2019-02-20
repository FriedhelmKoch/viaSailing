(function() {
	// const
	var ERROR_MSG = {
			'ParseError': 'Die Eingabe konnte nicht eingelesen werden.',
			'NotEnoughPoints': 'Anzal der Stützpunkte nicht ausreichend.',
			'InvalidChars': 'Die Eingabe der Stützpunkte beinhaltet falsche Zeichen.',
			'SameXDifferentY': 'Zwei Stützpunkte haben den gleichen x-Wert, allerdings unterschiedliche y-Werte.'
		};

	// HTML elements
	var btnShowExample = textareaUserInput = $('#user-input'), btnInterpolate = $('#interpolate'), divEquationOutput = $('#equation-output'), divOutput = $('#output'), divPointOutput = $('#point-output'), divErrorMsg = $('#error-msg'), graphBoard, inputX = $('#input-x'), outputY = $('#y-value-output');

	var functions = [];
	var f = function(x) { return undefined; };
  var beat_angel = [];
 
	var keepAspectRatio = false;

	// interpolation vars
	var points, minX, maxX, minY, maxY;

	textareaUserInput.on('change keyup', function() {
		hideError();

		if (textareaUserInput.val().length > 0) {
			btnInterpolate.removeAttr('disabled');
		}
		else {
			btnInterpolate.attr('disabled', 'disabled');
		}
	});

	btnInterpolate.on('click', function() {
		hideError();
		inputX.val('');

		var userInput = textareaUserInput.val().trim();

		// parse the user input
		var rows = userInput.split(/\s*\n+\s*/g);
										
										alert(userInput + '<br/>' + rows);
										
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
		outputY.html('');
                    
		// output
		showPoints();
		showEquations();
		visualize();
    showTable();
		divOutput.removeClass('hide');
	}).trigger('change');
 

	$('#keepAspectRatioInput').on('click', function() {
		keepAspectRatio = $(this).is(':checked');
		visualize();
	});

 
 
//	var lastX = undefined;
	inputX.on('change keyup', function() {
            
		if (!inputX.val()) {
      fofx = '';
			return;
		}
		
    var x = parseFloat(inputX.val());
            
    var fofx = f(x);
//  alert(fofx.toSource());
            
    if (typeof fofx === 'undefined') fofx = 's(' + x + ') ist undefiniert'; // Funktion undefiniert, wenn nicht Definitionsbereich
    else fofx = roundEng(fofx); // round to four digits
            
    // Ausgabe individueller Punkt auf Spline
    document.getElementById('y-value-output').innerHTML = fofx;
            
	});

 
 
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
		var html = '';
		for (var i = 0; i < functions.length; i++) {
			var f = functions[i];
			// approximate output
			html += 's' + i + '(x) = ' + roundEng(f.a) + ' * x^3 + ' + roundEng(f.b) + ' * x^2 + ' + roundEng(f.c) + ' * x + ' + roundEng(f.d) + ', if x Element in [' + f.range.xmin + ',' + f.range.xmax + ']' + ((i !== functions.length - 1) ? ', </br>' : '</br>');
    }
    document.getElementById('equation-output').innerHTML = html;
	}
 
  // Ausgabe des Graphen
	function visualize() {
 
		JXG.Options.axis.ticks.strokeColor = "#D0D0D0"; // hide grid
		var graphMinX = minX, graphMaxX = maxX, graphMinY = minY, graphMaxY = maxY;
		var maxPaddingX, maxPaddingY;

		var deltaX = Math.abs(graphMaxX - graphMinX), deltaY = Math.abs(Math.abs(graphMaxY - graphMinY));
		var maxDelta = Math.max(deltaX, deltaY), minDelta = Math.min(deltaX, deltaY);

		if (keepAspectRatio) {
			// length units to add at the axis which has the lower delta value
			var offset = (maxDelta / 2 - minDelta / 2);

			if (deltaX === maxDelta) { // y-axis has the lower delta value
				graphMinY -= offset;
				graphMaxY += offset;
			}
			else { // x-axis has the lower delta value
				graphMinX -= offset;
				graphMaxX += offset;
			}

			// same padding for both axes
			maxPaddingX = maxDelta * .2;
			maxPaddingY = maxPaddingX;
		}
		else {
			// padding
			maxPaddingX = deltaX * .2;
			maxPaddingY = deltaY * .2;
		}

		graphBoard = JXG.JSXGraph.initBoard('visualization', { boundingbox:[ graphMinX - maxPaddingX, graphMaxY + maxPaddingY, graphMaxX + maxPaddingX, graphMinY - maxPaddingY], axis: true, showCopyright: false });

		// Stützpunkte
		for (var i = 0; i < points.length; i++) {
			var point = points[i];
//	 		graphBoard.create('point', [point.x, point.y], { style: 6, name: 'P' + i, fillcolor: '#3278B4', stroke: '#3278B4', strokecolor: '#3278B4' });
	 	}

    // Spline Funktionsgleichungen
	 	f = function(x) {
 			for (var i = 0; i < functions.length; i++) {
 				if (functions[i].range.xmin <= x && functions[i].range.xmax >= x) {
 					return functions[i].a * x * x * x + functions[i].b * x * x + functions[i].c * x + functions[i].d;
 				}
 			}
 			return undefined;
 		};
 
 	 	// Zeichne Funktion
 		graphBoard.create('functiongraph',
        [f],
        {strokewidth: 2, strokecolor: '#3278B4', strokeopacity: '0.9' });

	}
 
	// Ausgabe der Wertetabelle
	function showTable() {
		// Array für Windstärke 6-12kt befüllen
		for (var i = 1; i <= 180; i++) {
			beat_angel[i] = (typeof f(i) === 'undefined') ? '0' : roundEng(f(i));
		}
		var html = '<table border="1">';
		for (var i = 1; i <= 30; i++) {
			html += '<tr>' +
			'<td class="box">' + i + '°</td><td>' + beat_angel[i] + '</td>' +
			'<td class="box">' + (30 - - i) + '°</td><td>' + beat_angel[30+i] + '</td>' +  // kleiner Trick um zwei num-Strings zu addieren
			'<td class="box">' + (60 - - i) + '°</td><td>' + beat_angel[60+i] + '</td>' +
			'<td class="box">' + (90 - - i) + '°</td><td>' + beat_angel[90+i] + '</td>' +
			'<td class="box">' + (120 - - i) + '°</td><td>' + beat_angel[120+i] + '</td>' +
			'<td class="box">' + (150 - - i) + '°</td><td>' + beat_angel[150+i] + '</td>' +
			'</tr>';
		}
		html += '</table>';
		document.getElementById('table-output').innerHTML = html;
	}

	function showError(code) {
		divErrorMsg.html(ERROR_MSG[code]).removeClass('hide');
		divOutput.addClass('hide');
	}

	function hideError() {
		divErrorMsg.addClass('hide');
	}
 
 function map(x, inMin, inMax, outMin, outMax) { return (x-inMin) * (outMax-outMin) / (inMax-inMin) + outMin; } // maps a value
 
 function round(x) {
    return x.toExponential(4);
 }
 
 function roundEng(x) {
    var str = round(x).replace('e+0', '').replace('e+', 'e');
    if (str.replace('e', '').length !== str.length) {
      // exponent existing
      str = str.replace('e', ' * 10^');
    }
    return str;
 }
 
})();
