BYBY.init = function() {
	OpenLayers.LonLat.prototype.t = function(){return this.transform(new OpenLayers.Projection("EPSG:4326"),new OpenLayers.Projection("EPSG:900913"));};
    this.map = new OpenLayers.Map({
        div: "map",
		units: 'm',
        projection: new OpenLayers.Projection("EPSG:900913"),
		displayProjection: new OpenLayers.Projection('EPSG:4326'),
		controls: [
			new OpenLayers.Control.TouchNavigation({
                dragPanOptions: {
                    enableKinetic: true
                }
            })/*,
            new OpenLayers.Control.Zoom(),
            new OpenLayers.Control.LayerSwitcher()*/
        ]
    });
    
    var osm = new OpenLayers.Layer.OSM();            
    /*var gmap = new OpenLayers.Layer.Google("Google Streets");*/
    this.map.addLayers([osm]);
	this.map.setCenter(
        new OpenLayers.LonLat(29, 41.06).transform(
            new OpenLayers.Projection("EPSG:4326"),
            this.map.getProjectionObject()
        ), 
        12
    );
	
	BYBY.vector = new OpenLayers.Layer.Vector('Konum');
	this.map.addLayers([BYBY.vector]);
	
	//BYBY.addGeojson('./data/metroDuraklari.geojson');
	//BYBY.addMarkers();
	BYBY.addMarkersNew();
	BYBY.setGeolocate();
	BYBY.hello();
	
};

BYBY.addMarkersNew = function() {
    var markersMetrobus = new OpenLayers.Layer.Markers("Metrobus Duraklari");
	var markersMetro = new OpenLayers.Layer.Markers("Metro Duraklari");
	var markersTramvay = new OpenLayers.Layer.Markers("Tramvay Duraklari");
	var markersFinukuler = new OpenLayers.Layer.Markers("Finükuler Duraklari");
	var markersVapur = new OpenLayers.Layer.Markers("Vapur Duraklari");
	
	this.map.addLayer(markersMetrobus);
	this.map.addLayer(markersMetro);
	this.map.addLayer(markersTramvay);
	this.map.addLayer(markersFinukuler);
	this.map.addLayer(markersVapur);
	
	var size = new OpenLayers.Size(32,32);
	var offsetTSU = new OpenLayers.Pixel(-(size.w / 2), 0);
	var offsetEWC = new OpenLayers.Pixel(size.w / 2, 0);
	
	for (var i = 0; i < this.data.length; i++) {
	    var lonlatTSU = new OpenLayers.LonLat(this.data[i].LAT, this.data[i].LON);
		var markerTSU = new OpenLayers.Marker(lonlatTSU.t(), new OpenLayers.Icon('icon/' + this.data[i].TSU + '.png', size, offsetTSU));
		markerTSU.mid = i;
		if(BYBY.isMobile.any()){
			markerTSU.events.register('touchstart', markerTSU, function (evt) { BYBY.showPopup(this.mid);});
		}
		else{
			markerTSU.events.register('click', markerTSU, function (evt) { BYBY.showPopup(this.mid); });
			markerTSU.events.register('mouseover', markerTSU, function (evt) { var mapDiv = document.getElementById("map"); mapDiv.style.cursor = 'pointer'; });
			markerTSU.events.register('mouseout', markerTSU, function (evt) { var mapDiv = document.getElementById("map"); mapDiv.style.cursor = 'default'; });
		}
		
	    
		switch(this.data[i].HATYPE){
			case 'metro':
				markersMetro.addMarker(markerTSU);
			break;
			case 'metrobus':
				markersMetrobus.addMarker(markerTSU);
			break;
			case 'finukuler':
				markersFinukuler.addMarker(markerTSU);
			break;
			case 'tramvay':
				markersTramvay.addMarker(markerTSU);
			break;
			case 'vapur':
				markersVapur.addMarker(markerTSU);
			break;
			
		}
		if(this.data[i].EWC == 7){
			var lonlatEWC = new OpenLayers.LonLat(this.data[i].LAT, this.data[i].LON);
			var markerEWC = new OpenLayers.Marker(lonlatEWC.t(), new OpenLayers.Icon('icon/' + this.data[i].EWC + '.png', size, offsetEWC));
			markerEWC.mid = i;
			if(BYBY.isMobile.any()){
				markerEWC.events.register('touchstart', markerEWC, function (evt) { BYBY.showPopup(this.mid);});
			}
			else{
				markerEWC.events.register('click', markerEWC, function (evt) { BYBY.showPopup(this.mid); });
				markerEWC.events.register('mouseover', markerEWC, function (evt) { var mapDiv = document.getElementById("map"); mapDiv.style.cursor = 'pointer'; });
				markerEWC.events.register('mouseout', markerEWC, function (evt) { var mapDiv = document.getElementById("map"); mapDiv.style.cursor = 'default'; });
			}
			switch(this.data[i].HATYPE){
				case 'metro':
					markersMetro.addMarker(markerEWC);
				break;
				case 'metrobus':
					markersMetrobus.addMarker(markerEWC);
				break;
				case 'finukuler':
					markersFinukuler.addMarker(markerEWC);
				break;
				case 'tramvay':
					markersTramvay.addMarker(markerEWC);
				break;
				case 'vapur':
					markersVapur.addMarker(markerEWC);
				break;
			}
		}
	}
};

BYBY.showTitle = function(title) {
    var markerTitle = document.getElementById('markerTitle');
    markerTitle.innerHTML = title +
        '<div style="position:absolute; right:30px; top:30px; color:#f44; cursor:pointer" onclick="BYBY.hideTitle();"><b>Kapat</b></div>';
    markerTitle.style.visibility = 'visible';
}

BYBY.hideTitle = function() {
    var markerTitle = document.getElementById('markerTitle');
    markerTitle.style.visibility = 'hidden';
};

BYBY.setGeolocate = function(){
	var geolocate = new OpenLayers.Control.Geolocate({
		bind: false,
		geolocationOptions: {
			enableHighAccuracy: false,
			maximumAge: 0,
			timeout: 7000
		}
	});
	this.map.addControl(geolocate);
	
	geolocate.events.register("locationupdated",geolocate,function(e) {
		BYBY.vector.removeAllFeatures();
		var circle = new OpenLayers.Feature.Vector(
			OpenLayers.Geometry.Polygon.createRegularPolygon(
				new OpenLayers.Geometry.Point(e.point.x, e.point.y),
				e.position.coords.accuracy/2,
				40,
				0
			),
			{},
			BYBY.style
		);
		var currentlocicon = {
			externalGraphic: "icon/current_location.png",
			graphicWidth: 12,
			graphicHeight: 12,
			fillOpacity: 1
		}
		var currentloc = new OpenLayers.Feature.Vector(e.point, null, currentlocicon);
		BYBY.vector.addFeatures([currentloc, circle]);
		
		if (BYBY.firstGeolocation) {
			BYBY.map.zoomToExtent(BYBY.vector.getDataExtent());
			pulsate(circle);
			BYBY.firstGeolocation = false;
			this.bind = true;
		}
	});
	geolocate.activate();
};

BYBY.style = {
    fillColor: '#00e',
    fillOpacity: 0.1,
    strokeWidth: 0
};
BYBY.firstGeolocation = true;
BYBY.showPopup = function(mid){
	var row = BYBY.data[mid];
	var htmlcontent =
				'<div class="listdiv">																				' +
				'<li class="' + row.HATYPE + '">																	' +
				'	<span class="listHat">																			' +
				'		<img src="icon/' + row.HATYPE + '.png" width="24" height="24" alt="' + row.HATYPE + '" />	' +
				'		' + row.HAT + '																				' +
				'	</span>																							' +
				'	<span class="listDurak">' + row.AD + '</span>													' +
				'	<span class="listIcons">																		' +
				'		<img src="icon/' + row.TSU + '.png" width="48" height="48"									' +	
				'			alt="Tekerlekli Sandalye Uygunluk" />													' +	
				'		<img src="icon/' + row.EWC + '.png" width="48" height="48"									' +	
				'			alt="Engelli Tuvaleti Uygunluk" />														' +
				'	</span>																							' +
				'	<span class="listDesc">' + row.BAG + '</span>													' +
				'	<span class="listDesc">' + row.EK + '</span>													' +
				'	<span class="hr"/>																				' +
				'</div>																								';
				'</li>																								';
	var w =  Math.round((BYBY.map.size.w * 3) / 5);
	var h =  Math.round((BYBY.map.size.h * 3) / 5);
	TINY.box.show({html:htmlcontent,animate:false,close:true,mask:true,boxid:'markerpopup', width:w})
}
BYBY.getliHTML = function(row){
		var ll = 'TINY.box.hide();BYBY.map.setCenter((new OpenLayers.LonLat('
				+ row.LAT + ', ' + row.LON + ')).t(), 16);';
		return  '<li class="' + row.HATYPE + '">																	' +
				'	<span class="listHat">																			' +
				'		<img src="icon/' + row.HATYPE + '.png" width="24" height="24" alt="' + row.HATYPE + '" />	' +
				'		' + row.HAT + '																				' +
				'	</span>																							' +
				'	<span class="listDurak">' + row.AD + '</span>													' +
				'	<div style="float:right;cursor:pointer" onclick="' + ll + '"><img src="icon/bgmap.png"></div> 	' +
				'	<span class="listIcons">																		' +
				'		<img src="icon/' + row.TSU + '.png" width="48" height="48"									' +	
				'			alt="Tekerlekli Sandalye Uygunluk" />													' +	
				'		<img src="icon/' + row.EWC + '.png" width="48" height="48"									' +	
				'			alt="Engelli Tuvaleti Uygunluk" />														' +
				'	</span>																							' +
				'	<span class="listDesc">' + row.BAG + '</span>													' +
				'	<span class="listDesc">' + row.EK + '</span>													' +
				'	<span class="hr"/>																				' +
				'</li>																								';
};
BYBY.addList = function(){
	var item = '<input type="text" onkeyup="BYBY.addFilterList(this.value);"><br/><br/>';
	item += '<div id="listdiv">';
	for(var i = 0; i < BYBY.data.length; i++){
		item += BYBY.getliHTML(BYBY.data[i]);
	}
	item += '</div';
	//var h =  Math.round((BYBY.map.size.h * 9) / 10);
	var h =  BYBY.map.size.h
	var w =  Math.round((BYBY.map.size.w * 4) / 5);
	TINY.box.show({html:item,animate:false,close:false,mask:true,boxid:'listpopup',top:-14,left:-17,height:h,width:w});
}
BYBY.addFilterList = function(query){
	var re = new RegExp(query,'i');
	var list = document.getElementById('listdiv');
	var item = '';
	for(var i = 0; i < BYBY.data.length; i++){
		if(BYBY.data[i].AD.match(re)){
			item += BYBY.getliHTML(BYBY.data[i]);
		}
	}
	item += '';
	list.innerHTML = item;
}
BYBY.about = function(){
	var msj = '<center>' +
			'<img src="icon/logo_orj.png">'+
			'<p>Güncel basılı versiyonuna ulaşmak ve proje hakkında bilgi için:</p><p>'+
			'<a target="_blank" href="http://www.beyazyakalilarbisiyapsa.com">beyazyakalilarbisiyapsa.com</a></p>'+
			'<p>Projelerimizi yakından takip etmek için:</p>'+
			'<a target="_blank" href="http://www.facebook.com/groups/445785358862952/">'+
			'<img style="margin-right:16px" src="icon/facebook.png">'+
			'</a>'+
			'<a target="_blank" href="http://twitter.com/bisiyapsak">'+
			'<img style="margin-right:16px" src="icon/twitter.png">'+
			'</a>'+
			'<a target="_blank" href="mailto:mail@beyazyakalilarbisiyapsa.com">'+
			'<img style="margin-right:16px" src="icon/email.png">'+
			'</a>'+
			'<center>';
	TINY.box.show({html:msj,animate:false,close:true,mask:true,boxid:'aboutpopup'});
}
var asd;
BYBY.showTOC = function(){
	var b = BYBY.getVisibility(2);
	
	var htmltemp = 
		'<label for="metro">'+
		'	<div style="cursor: pointer; padding-top:1em; padding-bottom:1em; padding-right:3px; border: 3px solid #E00914; margin-bottom:5px; -moz-border-radius:5px; border-radius:5px;">'+
		'		<input type="checkbox" ' + (BYBY.getVisibility(3) ? 'checked="checked"' : '') + ' id="metro" value="3" onchange="BYBY.changeVisibility(3);">'+
		'			<label for="metro" style="margin-left: 3px;">Metro Durakları</label>'+
		'	</div>'+
		'</label>'+
		'<label for="metrobus">'+
		'	<div style="cursor: pointer; padding-top:1em; padding-bottom:1em; padding-right:3px; border: 3px solid #9b9bb3; margin-bottom:5px; -moz-border-radius:5px; border-radius:5px;">'+
		'		<input type="checkbox" ' + (BYBY.getVisibility(2) ? 'checked="checked"' : '') + ' id="metrobus" value="2" onchange="BYBY.changeVisibility(2);">'+
		'			<label for="metrobus" style="margin-left: 3px;">Metrobüs Durakları</label>'+
		'	</div>'+
		'</label>'+
		'<label for="finükuler">'+
		'	<div style="cursor: pointer; padding-top:1em; padding-bottom:1em; padding-right:3px; border: 3px solid #F0DA18; margin-bottom:5px; -moz-border-radius:5px; border-radius:5px;">'+
		'		<input type="checkbox" ' + (BYBY.getVisibility(5) ? 'checked="checked"' : '') + ' id="finükuler" value="5" onchange="BYBY.changeVisibility(5);">'+
		'			<label for="finükuler" style="margin-left: 3px;">Finükuler Durakları</label>'+
		'	</div>'+
		'</label>'+
		'<label for="tramvay">'+
		'	<div style="cursor: pointer; padding-top:1em; padding-bottom:1em; padding-right:3px; border: 3px solid #943A3C; margin-bottom:5px; -moz-border-radius:5px; border-radius:5px;">'+
		'		<input type="checkbox" ' + (BYBY.getVisibility(4) ? 'checked="checked"' : '') + ' id="tramvay" value="4" onchange="BYBY.changeVisibility(4);">'+
		'			<label for="tramvay" style="margin-left: 3px;">Tramvay Durakları</label>'+
		'	</div>'+
		'</label>'+ 
		'<label for="vapur">'+
		'	<div style="cursor: pointer; padding-top:1em; padding-bottom:1em; padding-right:3px; border: 3px solid #003566; margin-bottom:5px; -moz-border-radius:5px; border-radius:5px;">'+
		'		<input type="checkbox" ' + (BYBY.getVisibility(6) ? 'checked="checked"' : '') + ' id="vapur" value="6" onchange="BYBY.changeVisibility(6);">'+
		'			<label for="vapur" style="margin-left: 3px;">Deniz Taşıtları Durakları</label>'+
		'	</div>'+
		'</label>';
	var h =  Math.round((BYBY.map.size.h * 4) / 5);
	var w =  Math.round((BYBY.map.size.w * 4) / 5);
	TINY.box.show({html:htmltemp,animate:false,close:true,mask:true,boxid:'aboutpopup',height:h,top:3});
}
BYBY.hello = function(){
	var msj = '<center>' +
			'<img src="icon/logo_orj.png">'+
			'<p>İstanbul’un her yanına herkes kolaylıkla ulaşsın, bu güzel şehrin keyfini çıkarsın diye engelli arkadaşlarımızla birlikte İstanbul Hepimizin Ulaşım Haritası\'nı hazırladık. Bu rehberi hem güncel tutmaya hem de yeni noktalar ekleyip engelliye uygunluğunu değerlendirmeye devam edeceğiz.</p>'+
			'<p>Şimdi harita üzerinde dolaşmaya başlayıp durakların engelliye uygunluk durumunu görebilir ve tıklayıp detaylı bilgilere ulaşabilirsiniz.</p>'+
			'<input type="button" value="Hadi Başla!" onclick="TINY.box.hide();"/>'+
			'<center>';
	var h =  Math.round((BYBY.map.size.h * 4) / 5);
	var w =  Math.round((BYBY.map.size.w * 4) / 5);
	TINY.box.show({html:msj,animate:false,close:true,mask:true,boxid:'hellopopup',height:h,width:w});
}
BYBY.changeVisibility = function(layerid){
	BYBY.map.layers[layerid].setVisibility(!BYBY.map.layers[layerid].visibility);
}

BYBY.getVisibility = function(layerid){
	return BYBY.map.layers[layerid].visibility;
}