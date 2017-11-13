var map, tb, url, coordx, coordy, poligonoConsulta, graphico;
require([
    "dojo/dom",
    "dojo/dom-style",
    "dojo/_base/array",
    "dojo/_base/connect",
    "dojo/parser",
    "dojo/query",
    "dojo/on",
    "dojo/dom-construct",

    "esri/Color",
    "esri/config",
    "esri/map",
    "esri/graphic",
    "esri/units",
    "esri/InfoTemplate",
    "esri/dijit/PopupMobile",


    "esri/tasks/GeometryService",
    "esri/tasks/query",

    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/TextSymbol",

    "esri/dijit/Measurement",
    "esri/dijit/OverviewMap",
    "esri/dijit/BasemapGallery",
    'esri/dijit/Basemap',
    'esri/dijit/BasemapLayer',

    "esri/dijit/Scalebar",
    "esri/dijit/Search",
    "esri/dijit/HomeButton",
    "esri/dijit/Legend",
    "esri/dijit/LocateButton",

    "esri/layers/FeatureLayer",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/layers/WMSLayer",
    "esri/layers/WMSLayerInfo"

],
    function (dom, domStyle, array, connect, parser, query, on, domConstruct, Color, esriConfig, Map, Graphic, Units, InfoTemplate, PopupMobile, GeometryService, Query, SimpleLineSymbol, SimpleFillSymbol, TextSymbol,
        Measurement, OverviewMap, BasemapGallery, Basemap, BasemapLayer, Scalebar, Search, HomeButton, Legend, LocateButton, FeatureLayer, ArcGISDynamicMapServiceLayer, WMSLayer, WMSLayerInfo) {
        parser.parse();

        var popup = new PopupMobile(null, domConstruct.create("div"));
        valores = getGET();
        // variables capa de busqueda del servicio a consultar  ------------------------------------------------------------------------------------------------------------------------------
        var rutaServicio = "https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_Resoluciones_Publicas/MapServer";
        var tituloVisor = "<center><font color='white'>Resoluciones Públicas</font></center>";
        dom.byId("tituloVisor").innerHTML = tituloVisor;        
        var numCapaInf = 1;
        var searchFields = ["SOLICITANTE", "NUMEXP"];
        var displayField = "SOLICITANTE";
        var exactMatch = false;
        var name = "Resolución (Solicitante,Expediente)";
        fTemplate = function locate() {

            if (graphico !== undefined) {
                var extension = graphico.geometry.getExtent();
                if (!extension) {
                    map.centerAndZoom(popup.getSelectedFeature().geometry, 15);
                } else {
                    map.setExtent(graphico.geometry.getExtent(), true);
                }
                // cerrar ventana datos
                $(".esriMobileInfoView").css("display", "none");
                $(".esriMobileNavigationBar").css("display", "none");
            }
           
        };
        var infoTemplate = new InfoTemplate("");
        infoTemplate.setTitle("Exp: " + "${NUMEXP:compare}");
        infoTemplate.setContent(getTextContent);
        function getTextContent(graphic) {
            var options = { year: 'numeric', month: '2-digit', day: '2-digit' };
            var urlvisor = graphic.attributes.URL_VISOR;
            var texto =
                "</br><b>" + graphic.attributes.IDTIPOLOGIA + graphic.attributes.CSUBTIPOLOGIA + ": " + graphic.attributes.DSUBTIPOLOGIA + "</b></br>" +
                "</br><b> Expediente: </b> " + graphic.attributes.NUMEXP +
                "</br><b> Número: </b> " + graphic.attributes.NUMEXP.substring(8, 12) + "/" + graphic.attributes.NUMEXP.substring(12, 17) +
                "</br><b> Asunto: </b> " + graphic.attributes.DENOMINACION +
                "</br><b> Solicitante: </b> " + graphic.attributes.SOLICITANTE +
                "</br>" +
                "</br><b> Resolución: </b> " + graphic.attributes.DTIPO_RESOLUCION +
                "</br><b> Fecha Resolución: </b> " + new Date(parseInt(graphic.attributes.FFIN_REAL)).toLocaleDateString("es-ES",options) +
                "</br>" +
                "</br><b> Municipio: </b> " + graphic.attributes.MUNICIPIO +
                "</br><b> Precisión: </b> " + graphic.attributes.DORIGEN + "</br>" +
                "</br><a href=" + graphic.attributes.URL_ENLACE + " target=_blank>Documento Resolución del Expediente</a>" + "  <hr />" +
                '<div id="divlocalizar"> ' +
                '<input type="button" value="Acercar "  id="locate"  title="Centrar Mapa" alt="Centrar Mapa" class = "localizacion" onclick="  fTemplate(); "/> ' + '</div>';
            return texto;
        }

        compare = function (value, key, data) {
            var numexp = data.NUMEXP;
            var ejercicio = numexp.substring(8, 12);
            var exp = numexp.substring(12, 17);
            return ejercicio + "/" + exp;
        };

        var dynamicMSLayer = new esri.layers.ArcGISDynamicMapServiceLayer(rutaServicio, {
            id: "Participacion",
            //opacity: 0.75,
            outFields: ["*"]
        });
        dynamicMSLayer.setImageFormat("png32", true);
        dynamicMSLayer.setInfoTemplates({
            1: { infoTemplate: infoTemplate },
            2: { infoTemplate: infoTemplate },
            3: { infoTemplate: infoTemplate }
        });
        dynamicMSLayer.setVisibleLayers([0, 1, 2, 3]);
        //  otras variables -------------------------------------------------------------------------------------------------------------------------------------------------------------------
        var sls = new SimpleLineSymbol("solid", new Color("#444444"), 3);
        var sfs = new SimpleFillSymbol("solid", sls, new Color([68, 68, 68, 0.25]));
        gsvc = new GeometryService("https://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer");
        esriConfig.defaults.geometryService = gsvc;
        esriConfig.defaults.io.alwaysUseProxy = false;
        // incicializar mapa -------------------------------------------------------------------------------------------------------------------------------------------------------------------
        map = new Map("map", {
            basemap: "gray",
            extent: new esri.geometry.Extent(-2.4, 39.6, 0.7, 43.3),
            infoWindow: popup,
            isZoomSlider: false,
            maxZoom: 19
        });

        map.disableKeyboardNavigation();
        map.addLayer(new esri.layers.GraphicsLayer({ "id": "Geodesic" }));
        map.infoWindow.resize(240, 200);
        //map.infoWindow.startup();

        if (valores !== undefined) {
            var coordenadasZoom = valores["zoomEnvelope"].split(":");
            zoomExtension(coordenadasZoom[0], coordenadasZoom[1], coordenadasZoom[2], coordenadasZoom[3]);
        }
        // widgets -------------------------------------------------------------------------------------------------------------------------------------------------------------------
        // widget geolocate
        geoLocate = new LocateButton({ map: map }, "LocateButton");
        geoLocate.startup();
        // widget scalebar
        var scalebar = new Scalebar({ map: map, attachTo: "bottom-center", scalebarUnit: "metric" });
        // widget medicion
        var measurement = new Measurement({
            map: map,
            defaultAreaUnit: Units.HECTARES,
            defaultLengthUnit: Units.KILOMETERS
        }, dom.byId("measurementDiv")
        );
        measurement.startup();
        // widget overview
        var overviewMapDijit = new OverviewMap({
            map: map,
            attachTo: "bottom-right",
            expandFactor: 3,
            height: 200,
            width: 200,
            color: " #D84E13",
            visible: false,
            opacity: .40
        });

        overviewMapDijit.startup();
        // definimos los mapas base

        var oceano = new BasemapLayer({ url: 'https://server.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer' });
        var oceanoEtiqueta = new BasemapLayer({ url: 'https://server.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Reference/MapServer' });
        // topo item for gallery
        var oceanoBasemap = new Basemap({
            layers: [oceano, oceanoEtiqueta],
            id: 'oceanos',
            title: 'Océanos',
            thumbnailUrl: 'https://www.arcgis.com/sharing/rest/content/items/f9498c1f95714efabb626125cb2bb04a/info/thumbnail/tempoceans.jpg'
        });
        // terreno etiquetas

        var terreno = new BasemapLayer({ url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer' });
        var terrenoEtiqueta = new BasemapLayer({ url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Reference_Overlay/MapServer' });
        // topo item for gallery
        var terrenoBasemap = new Basemap({
            layers: [terreno, terrenoEtiqueta],
            id: 'terreno',
            title: 'Terreno Etiquetas',
            thumbnailUrl: 'https://www.arcgis.com/sharing/rest/content/items/532c8cc75f414ddebc5d665ba00015ca/info/thumbnail/terrain_labels.jpg'
        });

        //topo map
        var topoLayer = new BasemapLayer({ url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer' });
        // topo item for gallery
        var topoBasemap = new Basemap({
            layers: [topoLayer],
            id: 'topo',
            title: 'Topográfico',
            thumbnailUrl: 'https://www.arcgis.com/sharing/rest/content/items/6e03e8c26aad4b9c92a87c1063ddb0e3/info/thumbnail/topo_map_2.jpg'
        });

        //dark grey
        var dkGreyLayer = new BasemapLayer({ url: 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer' });
        var dkGreyLabelsLayer = new BasemapLayer({ url: 'https://services.arcgisonline.com/arcgis/rest/services/Reference/World_Transportation/MapServer' });
        var dkGreyBasemap = new Basemap({
            layers: [dkGreyLayer, dkGreyLabelsLayer],
            id: 'dkGrey',
            title: 'Lona Gris Oscuro',
            thumbnailUrl: 'https://www.arcgis.com/sharing/rest/content/items/a284a9b99b3446a3910d4144a50990f6/info/thumbnail/ago_downloaded.jpg'
        });

        //light grey
        var ltGreyLayer = new BasemapLayer({ url: 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Base/MapServer' });
        var ltGreyLabelsLayer = new BasemapLayer({ url: 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Reference/MapServer' });
        var ltGreyBasemap = new Basemap({
            layers: [ltGreyLayer, ltGreyLabelsLayer],
            id: 'ltGrey',
            title: 'Lona Gris Claro',
            thumbnailUrl: 'https://www.arcgis.com/sharing/rest/content/items/8b3d38c0819547faa83f7b7aca80bd76/info/thumbnail/light_canvas.jpg'
        });
        // imagenes
        var imagenes = new BasemapLayer({ url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer' });
        var etiquetas = new BasemapLayer({ url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer' });
        var imagenBasemap = new Basemap({
            layers: [imagenes, etiquetas],
            id: 'images',
            title: 'Imágenes con etiquetas',
            thumbnailUrl: 'https://www.arcgis.com/sharing/rest/content/items/3027a41ed46d4a9b915590d14fecafc0/info/thumbnail/imagery_labels.jpg'
        });
        // clarity
        var clarity = new BasemapLayer({ url: 'https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer' });
        var clarityBasemap = new Basemap({
            layers: [clarity, etiquetas],
            id: 'clarity',
            title: 'clarity word',
            thumbnailUrl: 'https://www.arcgis.com/sharing/rest/content/items/da10cf4ba254469caf8016cd66369157/info/thumbnail/imagery_clarity_sm.jpg'
        });

        // NACIONAL GEOGRAPIC

        var natGeo = new BasemapLayer({ url: 'https://server.arcgisonline.com/arcgis/rest/services/NatGeo_World_Map/MapServer' });
        var natGeoBasemap = new Basemap({
            layers: [natGeo],
            id: 'natgeo',
            title: 'Nacional Geographic',
            thumbnailUrl: 'https://www.arcgis.com/sharing/rest/content/items/7ec6f7c55cf6478596435f2d501834fa/info/thumbnail/natgeo.jpg'
        });

        // open street map
     
        var street1 = new BasemapLayer({
            type: "WebTiledLayer", url: "https://tile.openstreetmap.org/${level}/${col}/${row}.png"  });

        var streetBasemap = new Basemap({
            layers: [street1],
            id: 'street',
            title: 'Open Street Map',
            thumbnailUrl: 'https://www.arcgis.com/sharing/rest/content/items/d415dff75dd042258ceda46f7252ad70/info/thumbnail/temposm.jpg'
        });

        // widget basemap
        var basemapGallery = new BasemapGallery({
            showArcGISBasemaps: false,
            map: map,
            basemaps: [topoBasemap, dkGreyBasemap, ltGreyBasemap, imagenBasemap, clarityBasemap, natGeoBasemap, streetBasemap, terrenoBasemap, oceanoBasemap]
        }, 'basemapGallery');

        basemapGallery.startup();
        basemapGallery.on("error", function (msg) {
           // console.log(msg);
        });
        // widget home
        var home = new HomeButton({
            map: map
        }, "HomeButton");
        home.startup();


        // Capas necesarias -------------------------------------------------------------------------------------------------------------------------------------------------------------------
        var fcInf = new FeatureLayer(rutaServicio + "/" + numCapaInf);
        var fcMunis = new FeatureLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_Ambitos/MapServer/3");
        var dynamicMSLayerBasico = new esri.layers.ArcGISDynamicMapServiceLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_Ambitos/MapServer", {
            id: "xLimites",
            outFields: ["*"]
        });
        dynamicMSLayerBasico.setVisibleLayers([1, 2, 3]);
        dynamicMSLayerBasico.setImageFormat("png32", true);
        //Eventos -------------------------------------------------------------------------------------------------------------------------------------------------------------------
        $(document).on('change', '#slider-100', function () {
            dynamicMSLayer.setOpacity($("#slider-100").val() / 100);
        });

        on(dom.byId("buscar"), "click", function () {
            buscarExpedientes();
        });

        //click handler for the draw tool buttons
        query(".tool").on("click", function (evt) {
            if (tb) {
                tb.activate(evt.target.id);
                map.setInfoWindowOnClick(false);
            }
        });

        popup.on("selection-change", function () {

            graphico = popup.getSelectedFeature();

            //console.log(graphico);

        });
        map.on("update-end", function () { map.setMapCursor("default"); });
        map.on("update-start", function () { map.setMapCursor("wait"); });
        //add the legend
        map.on("layers-add-result", function (evt) {
            var layerInfo = array.map(evt.layers, function (layer, index) {
                return { layer: layer.layer, title: layer.layer.name };
            });
            if (layerInfo.length > 0) {
                var legendDijit = new Legend({
                    map: map,
                    layerInfos: layerInfo
                }, "legendDiv");
                legendDijit.startup();
            }
        });

        map.on("update-end", function () {
            //projectEnveToEtrs89();
            //dameCoord4326();
            map.setMapCursor("default");
            domStyle.set(dom.byId("procesando"), "display", "none");

        });
        map.on("update-start", function () {
            map.setMapCursor("wait");
            domStyle.set(dom.byId("procesando"), "display", "inline-block");
            $("#popupNested").popup("close");
        });

        on(dom.byId("clearGraphicsM"), "click", function () {
            if (map) {
                measurement.clearResult();
                measurement.setTool("area", false);
                measurement.setTool("distance", false);
                measurement.setTool("location", false);
                map.setInfoWindowOnClick(true);
            }
        });

        measurement.on("measure-end", function (evt) {
            if (evt.toolName === "location") {
                projectToEtrs89(evt.geometry);
            }
            $("[data-role=panel]").panel("open");
        });
        measurement.on("tool-change", function (evt) {
            map.setInfoWindowOnClick(false); dom.byId("etrs").innerHTML = "";
            $("[data-role=panel]").panel("close");
        });

        // funciones   -------------------------------------------------------------------------------------------------------------------------------------------------------------------
        function buscarExpedientes(){
            var fechaOkIni;
            var fechaOkFin;
            var fechasOk = true;
            var fini;
            var ffin;

            var dropd = $("#select-choice-1");
            sql = "IDTIPOLOGIA = " + dropd.find('option:selected').val() + " and ";
            if (dropd.find('option:selected').val() === '00') { sql = ""; }
            var datepi = $("#fechaini");
            var midatestringIni = $("#fechaini").val();
            var midatestringFin = $("#fechafin").val();
            fechaOkIni = validaFecha(midatestringIni);
            fechaOkFin = validaFecha(midatestringFin);
            fini = stringToDate(midatestringIni, 'yyyy-mm-dd', '-');
            ffin = stringToDate(midatestringFin, 'yyyy-mm-dd', '-');
            if (ffin < fini) { fechasOk = false; }
            if (midatestringIni !== undefined & midatestringIni !== "" & midatestringFin !== undefined & midatestringFin !== "" & fechaOkFin & fechaOkIni & fechasOk) {
                sql += "(FFIN_REAL >= date '" + midatestringIni + "' AND FFIN_REAL <= date '" + midatestringFin + "')";
                var layerDefinitions = [];
                layerDefinitions.push(sql);
                layerDefinitions.push(sql);
                layerDefinitions.push(sql);
                layerDefinitions.push(sql);
                layerDefinitions.push(sql);
                dynamicMSLayer.setLayerDefinitions(layerDefinitions);
                $("[data-role=panel]").panel("close");
            }
            else {

                $("#pop").popup("open");
                setTimeout(function () { $("#pop").popup("close"); }, 5000);
                // alert("Debe seleccionar la fecha de inicio y fín"); 
            }

        }
        function stringToDate(_date, _format, _delimiter) {

            var formatLowerCase = _format.toLowerCase();
            var formatItems = formatLowerCase.split(_delimiter);
            var dateItems = _date.split(_delimiter);
            var monthIndex = formatItems.indexOf("mm");
            var dayIndex = formatItems.indexOf("dd");
            var yearIndex = formatItems.indexOf("yyyy");
            var month = parseInt(dateItems[monthIndex]);
            month -= 1;
            var formatedDate = new Date(dateItems[yearIndex], month, dateItems[dayIndex]);
            return formatedDate;
        }

        function setFechas() {
            var d = new Date();
            var dia = d.getDate();
            var mes = d.getMonth() + 1;
            var diaIni = dia;

            if (mes === 2) { // bisiesto
                var bisiesto = (anio % 4 === 0 && (anio % 100 !== 0 || anio % 400 === 0));
                if (dia > 29 || (dia === 29 && !bisiesto)) {

                    diaIni = 28;
                }
            }
            var diaString = dia.toString();
            var mesString = mes.toString();
            var diaIniString = diaIni.toString();

            if (diaString.length < 2) { diaString = '0' + diaString; }
            if (diaIniString.length < 2) { diaIniString = '0' + diaIniString; }
            if (mesString.length < 2) { mesString = '0' + mesString; }

            var fechaHoy = diaString + "/" + mesString + "/" + d.getFullYear();
            var fechaN1 = diaIniString + "/" + mesString + "/" + (d.getFullYear() - 1);	

            dom.byId("fechaini").value = fechaN1;
            dom.byId("fechafin").value = fechaHoy;
            var fechaN1Split = fechaN1.split("/");
            var fechaHoySplit = fechaHoy.split("/");

            var midatestringIni = $("#fechaini").val();
            if (midatestringIni === undefined || midatestringIni === "") {
                dom.byId("fechaini").value = [fechaN1Split[2], fechaN1Split[1], fechaN1Split[0]].join("-");
                dom.byId("fechafin").value = [fechaHoySplit[2], fechaHoySplit[1], fechaHoySplit[0]].join("-");
            }
        }            
        
        function parseDate(fecha) {
            var inter;
            var fechaFinal;
            var indice = fecha.indexOf("/");
            //alert(indice);
            if (indice !== -1) {
                inter = fecha.split("/");
                fechaFinal = inter[0] + "/" + inter[1] + "/" + inter[2];
            } else {
                inter = fecha.split("-");
                fechaFinal = inter[2] + "/" + inter[1] + "/" + inter[0];
            }
            return fechaFinal;
        }

        function validaFecha(fecha) {
            var fecha1 = parseDate(fecha);
            var datePat = /^(\d{1,2})(\/|-)(\d{1,2})(\/|-)(\d{4})$/;
            var fechaCompleta = fecha1.match(datePat);
            if (fechaCompleta === null) {
                return false;
            }

            dia = fechaCompleta[1];
            mes = fechaCompleta[3];
            anio = fechaCompleta[5];

            if (dia < 1 || dia > 31) {

                return false;
            }
            if (mes < 1 || mes > 12) {

                return false;
            }
            if ((mes === 4 || mes === 6 || mes === 9 || mes === 11) && dia === 31) {

                return false;
            }
            if (mes === 2) { // bisiesto
                var bisiesto = (anio % 4 === 0 && (anio % 100 !== 0 || anio % 400 === 0));
                if (dia > 29 || (dia === 29 && !bisiesto)) {

                    return false;
                }
            }
            return true;

        }

        function getGET() {
            // capturamos la url
            var loc = document.location.href;
            // si existe el interrogante
            if (loc.indexOf('?') > 0) {
                // cogemos la parte de la url que hay despues del interrogante
                var getString = loc.split('?')[1];
                // obtenemos un array con cada clave=valor
                var GET = getString.split('&');
                var get = {};
                // recorremos todo el array de valores
                for (var i = 0, l = GET.length; i < l; i++) {
                    var pos = GET[i].indexOf('=');
                    var longitud = GET[i].length;
                    var mikey = GET[i].substring(0, pos);
                    var miVal = GET[i].substring(pos + 1, longitud);
                    var tmp = GET[i].split('=');
                    get[mikey] = unescape(decodeURI(miVal));
                }
                return get;
            }
        }

        function zoomExtension(minx, miny, maxx, maxy) {
            var _extent = new esri.geometry.Extent(minx, miny, maxx, maxy, new esri.SpatialReference({ wkid: 25830 }));
            var outSR = new esri.SpatialReference(3857);
            var params = new esri.tasks.ProjectParameters();
            params.geometries = [_extent];
            params.outSR = outSR;
            gsvc.project(params, function (projectedPoints) {
                pt = projectedPoints[0];
                map.setExtent(projectedPoints[0], true);
            });
        }

        function projectToEtrs89(geometry) {
            var outSR = new esri.SpatialReference(25830);
            var params = new esri.tasks.ProjectParameters();
            params.geometries = [geometry]; //[pt.normalize()];
            params.outSR = outSR;
            var pt;
            gsvc.project(params, function (projectedPoints) {
                pt = projectedPoints[0];
                coordx = pt.x.toFixed(0);
                coordy = pt.y.toFixed(0);
                dom.byId("etrs").innerHTML = "<hr /><b>Coordenada en ETRS89 30N</br><table style='width:100%'><tr><th>X</th><th>Y</th></tr><tr><td>" + pt.x.toFixed(0) + "</td><td>" + pt.y.toFixed(0) + "</td></tr></table><hr />";
            });
        }
        function projectEnveToEtrs89() {
            var outSR = new esri.SpatialReference(25830);
            var params = new esri.tasks.ProjectParameters();
            params.geometries = [map.extent]; //[pt.normalize()];
            params.outSR = outSR;
            var pt;
            gsvc.project(params, function (projectedPoints) {
                pt = projectedPoints[0];
                xmin = pt.xmin.toFixed(0);
                ymin = pt.ymin.toFixed(0);
                xmax = pt.xmax.toFixed(0);
                ymax = pt.ymax.toFixed(0);
            });
        }
        function dameCoord4326() {
            var outSR = new esri.SpatialReference(4326);
            var params = new esri.tasks.ProjectParameters();
            params.geometries = [map.extent.getCenter()]; //[pt.normalize()];
            params.outSR = outSR;
            var pt;
            var newurl = "";
            gsvc.project(params, function (projectedPoints) {
                pt = projectedPoints[0];
            });
        }

        function showLoading() {
            domStyle.set(dom.byId("loading"), "display", "inline-block");
        }
        function hideLoading() {
            domStyle.set(dom.byId("loading"), "display", "none");
        }
        function OpenInNewTab(url) {
            var win = window.open(url);
            win.focus();
        }

        // busquedas -------------------------------------------------------------------------------------------------------------------------------------------------------------------
        var customExtentAndSR = new esri.geometry.Extent(-300000, 4840000, 120000, 5280000, new esri.SpatialReference({ wkid: 3857 }));
        // catastro
        var layer1 = new WMSLayerInfo({
            name: 'Catastro',
            title: 'Catastro',
            queryable: true,
            showPopup: true,
            featureInfoFormat: "jsonp"
        });

        var resourceInfo = {
            extent: customExtentAndSR,
            layerInfos: [layer1]
        };
        var layerCat = new WMSLayer('https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx?', {
            resourceInfo: resourceInfo,
            visibleLayers: ['Catastro']

        });

        layerCat.id = "OVC";
        layerCat.version = "1.1.1";
        layerCat.spatialReferences[0] = 3857;
        layerCat.visible = false;

        ////sigpac
        //var layerSigpacPar = new WMSLayerInfo({
        //    name: 'PARCELA',
        //    title: 'PARCELA'
        //});
        //var layerSigpacRec = new WMSLayerInfo({
        //    name: 'RECINTO',
        //    title: 'RECINTO'
        //});
        //resourceInfo = {
        //    extent: customExtentAndSR,
        //    layerInfos: [layerSigpacPar, layerSigpacRec]
        //};
        //var wmsSigpac = new WMSLayer('https://wms.mapama.es/wms/wms.aspx?', {
        //    resourceInfo: resourceInfo,
        //    visibleLayers: ['PARCELA', 'RECINTO']

        //});
        //wmsSigpac.visible = false;
        //wmsSigpac.id = "SIGPAC";
        //wmsSigpac.version = "1.1.1";
        //wmsSigpac.spatialReferences[0] = 3857;

        var templateCatastro = "<p>Referencia:${REFPAR}</p><p>Municipio:${CODMUN}</p><p>Agregado:${MUNAGR}</p><p>Polígono:${MASA}</p><p>Parcela:${PARCELA}</p>";
        //var templateSigpac = "<p>Referencia:${REFPAR}</p><p>Provincia:${PROVINCIA}</p><p>Municipio:${MUNICIPIO}</p><p>Agregado:${AGREGADO}</p><p>Polígono:${POLIGONO}</p><p>Parcela:${PARCELA}</p>";
        var templateMunicipios = "<p>Código:${C_MUNI_INE}</p><p>Municipio:${D_MUNI_INE}</p><p>Provincia:${PROVINCIA}</p><p>Comarca:${D_COMARCA}</p>";

        var s = new Search({
            enableButtonMode: true,
            enableLabel: false,
            enableInfoWindow: true,
            showInfoWindowOnSelect: true,
            enableSuggestions: true,
            enableSuggestionsMenu: true,
            map: map
        }, "search");
        var sources = [
            {
                featureLayer: fcInf,
                searchFields: searchFields, //["SOLICITANTE","NUMEXP"],
                displayField: displayField, //"SOLICITANTE",
                exactMatch: false,
                name: name, //"Resolución  (Solicitante,Expediente)",
                outFields: ["*"],
                placeholder: " ",
                maxResults: 6,
                maxSuggestions: 6,
                enableSuggestions: true,
                infoTemplate: infoTemplate,
                minCharacters: 0
            }, {
                featureLayer: fcMunis,
                searchFields: ["D_MUNI_INE"],
                displayField: "D_MUNI_INE",
                exactMatch: false,
                name: "Municipios",
                outFields: ["*"],
                placeholder: " ",
                maxResults: 6,
                maxSuggestions: 6,
                enableSuggestions: true,
                infoTemplate: new InfoTemplate("${D_MUNI_INE}", templateMunicipios),
                minCharacters: 0
            }, {
                featureLayer: new esri.layers.FeatureLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_Ambitos/MapServer/5"),
                searchFields: ["REFPAR"],
                displayField: "REFPAR",
                exactMatch: true,
                name: "Parcelas Catastrales",
                outFields: ["*"],
                placeholder: " ",
                maxResults: 6,
                maxSuggestions: 6,
                enableSuggestions: true,
                infoTemplate: new InfoTemplate("${REFPAR}", templateCatastro),
                minCharacters: 0
            },
            //{
            //    featureLayer: new esri.layers.FeatureLayer("https://idearagon.aragon.es/servicios/rest/services/INAGA/INAGA_Ambitos/MapServer/7"),
            //    searchFields: ["REFPAR"],
            //    displayField: "REFPAR",
            //    exactMatch: true,
            //    name: "Parcelas Sigpac",
            //    outFields: ["*"],
            //    placeholder: " ",
            //    maxResults: 6,
            //    maxSuggestions: 6,
            //    enableSuggestions: true,
            //    infoTemplate: new InfoTemplate("${REFPAR}", templateSigpac),
            //    minCharacters: 0
            //},
            {
                locator: new esri.tasks.Locator("//geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer"),
                singleLineFieldName: "SingleLine",
                name: "Geocoding Service",
                localSearchOptions: {
                    minScale: 300000,
                    distance: 50000
                },
                placeholder: "Search Geocoder",
                maxResults: 3,
                maxSuggestions: 6,
                enableSuggestions: false,
                minCharacters: 0
            }];
        s.set("sources", sources);
        s.startup();

        // cambiar la visibilidad de las búsquedas

        on(s, 'search-results', function (e) {

            if (e.errors === null) {

                if (e.activeSourceIndex === 1) {
                    //wmsSigpac.visible = false;
                    layerCat.visible = true;
                } else if (e.activeSourceIndex === 2) {
                    //wmsSigpac.visible = true;
                    layerCat.visible = false;
                } else {
                    //wmsSigpac.visible = false;

                }
                map.setExtent(map.extent);
            }

        });
        on(s, 'clear-search', function (e) {
            dynamicMSLayerBasico.setVisibleLayers([0, 1, 2, 3]);
            //wmsSigpac.visible = false;
            layerCat.visible = false;
        });


        // carga capas -y eventos ------------------------------------------------------------------------------------------------------------------------------------------------------------------

        // inicializar las fechas para realizar la búsqueda del último año
        setFechas();
        buscarExpedientes();
        map.addLayers([dynamicMSLayerBasico, dynamicMSLayer, layerCat]);

        $("#radio-0").click(function () {
            $("#radio-1").prop("checked", false);
            $("#radio-1").checkboxradio("refresh");
            $("#radio-2").prop("checked", false);
            $("#radio-2").checkboxradio("refresh");
            $(this).prop("checked", true);
            $(this).checkboxradio("refresh");
            layerCat.visible = true;
            //wmsSigpac.visible = false;
            map.setExtent(map.extent);
        });

        //$("#radio-1").click(function () {
        //    $("#radio-0").prop("checked", false);
        //    $("#radio-0").checkboxradio("refresh");
        //    $("#radio-2").prop("checked", false);
        //    $("#radio-2").checkboxradio("refresh");
        //    $(this).prop("checked", true);
        //    $(this).checkboxradio("refresh");
        //    layerCat.visible = false;
        //    wmsSigpac.visible = true;
        //    map.setExtent(map.extent);
        //});
        $("#radio-2").click(function () {
            $("#radio-0").prop("checked", false);
            $("#radio-0").checkboxradio("refresh");
            $("#radio-1").prop("checked", false);
            $("#radio-1").checkboxradio("refresh");
            $(this).prop("checked", true);
            $(this).checkboxradio("refresh");
            layerCat.visible = false;
            //wmsSigpac.visible = false;
            map.setExtent(map.extent);
        });
          
    });