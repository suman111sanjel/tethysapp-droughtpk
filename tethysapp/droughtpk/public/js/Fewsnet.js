let threddDataSource = 'http://110.34.30.197:8080/thredds';
let currentCatalogMonthly = threddDataSource + '/catalog/sldas/monthly/catalog.xml'
let currentCatalogDekad = threddDataSource + '/catalog/sldas/dekad/catalog.xml'
let currentCatalog3Months = threddDataSource + '/catalog/sldas/quartly/catalog.xml'
let CurrentCatalogMonthlySPI = threddDataSource + '/catalog/sldas/SPIMonthly/catalog.xml'
let CurrentCatalogDekadSPI = threddDataSource + '/catalog/sldas/SPIDekad/catalog.xml'
let CurrentCatalog3MonthsSPI = threddDataSource + '/catalog/sldas/SPIThreeMonth/catalog.xml'
let FewsnetMonthly = threddDataSource + '/catalog/fewsnet/catalog.xml'
let workingYearMonth = '';
let AllMonths = {
    0: "January",
    1: "February",
    2: "March",
    3: "April",
    4: "May",
    5: "June",
    6: "July",
    7: "August",
    8: "September",
    9: "October",
    10: "November",
    11: "December"
}
let clearLayerFlag = false;
app.AllBindedLayersList = [];
app.createConstants = function () {
    app.API = {
        GEOMSAPI: '/apps/' + TethysAppName + '/api/getGeomList/',
        FewsNETTimeSeries: '/apps/' + TethysAppName + '/api/getfewsnettimeseries',
    }
    app.DEFAULTS = {
        COUN: countryName,
        AdminLevel: DefaultAdminLevel,
        // YEARMONTH: '202009'
    }
    app.COLORS = {
        MAXTEMP: '#f97070',
        MINTEMP: '#70a5f9',
        MINRAIN: 'orange',
        MAXRAIN: '',
        AGGRAIN: 'purple',
        NDVI: 'rgba(19,175,8,0.7)',
        NDVIANOM: 'rgba(19, 175, 8, 0.7)',
        SOILMOIST: 'rgba(210, 105, 30, 0.7)',
        EVAP: '',
        SPI1: '',
        LTA: 'black'
    }
}

app.parseParameters = async function () {
    function getParam(name) {
        var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
        if (results == null) {
            return null;
        } else {
            return decodeURI(results[1]) || 0;
        }
    }

    app.baseURL = document.location.href.split('?')[0];
    app.URLparams = {};
    // app.URLparams['c'] = getParam('c');
    app.URLparams['d'] = getParam('d');
    app.URLparams['ym'] = getParam('ym');
    // var today = new Date();
    // var month = today.getMonth();
    // var year = app.DEFAULTS.YEAR;
    // // if month is not december, start from last year
    // // if (month < 12) year--;
    // app.URLparams['y'] = year.toString();//app.DEFAULTS.YEAR;
    let flagChangeURL = false;
    let url = document.location.href;
    // redirect to jumla district if none is selected
    if (!app.URLparams['d']) {
        let ddist = app.DEFAULTS.AdminLevel;
        if (url.includes('?')) {
            url = url + "&d=" + ddist;
        } else {
            url = url + "?d=" + ddist;
        }
        app.URLparams['d'] = ddist;
        flagChangeURL = true;
    }
    if (!app.URLparams['ym']) {

        let firstLastDate = await app.getAvailableDataMonth();
        let initialMonth = firstLastDate.slice(1)[0].getMonth();
        if (initialMonth < 10) {
            initialMonth = '0' + initialMonth.toString();
        }
        workingYearMonth = firstLastDate.slice(1)[0].getFullYear().toString() + initialMonth;
        app.DEFAULTS.YEARMONTH = workingYearMonth
        let defaultYear = app.DEFAULTS.YEARMONTH;
        if (url.includes('?')) {
            url = url + "&ym=" + defaultYear;
        } else {
            url = url + "?ym=" + defaultYear;
        }
        app.URLparams['ym'] = defaultYear;
        flagChangeURL = true;
    }
    if (flagChangeURL) window.history.replaceState({}, 'Nepal', url);
    // activate static options based on URL
    // for periodicity option
    // $("input[name=periodicity][value=" + app.URLparams['p'] + "]").prop("checked", true);
    $("#startDate").val(app.URLparams['ym'].slice(4, 6) + '/' + app.URLparams['ym'].slice(0, 4).toString());
}

app.initilizeMap = function () {
    var bounds = [8863793.55240429, 3010895.134840412, 9912517.471608875, 3571840.4869730966];
    var zoomToExtentControl = new ol.control.ZoomToExtent({
        extent: bounds
    });
    app.view = new ol.View(defaultView);

    var OSMLayer = new ol.layer.Tile({
        id: "osm",
        title: "Open Street Map",
        visible: true,
        source: new ol.source.OSM(),
        mask: 0
    });

    var HighLightedLayerSource = new ol.source.Vector();
    app.HighLightedLayer = new ol.layer.Vector({
        id: "highlightedlayer",
        title: "highlightedlayer",
        style: new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#000000',
                width: 1.5
            }),
            fill: new ol.style.Fill({
                color: 'rgba(200, 214, 229,0)'
                // color:'#1abc9c'
            })
        }),
        source: HighLightedLayerSource,
        mask: 0
    });
    app.HighLightedLayer.setZIndex(99);

    var layers = [];
    layers.push(OSMLayer);
    layers.push(app.HighLightedLayer);
    app.map = new ol.Map({
        target: 'map-container',
        layers: layers,
        controls: ol.control.defaults({
            attribution: false
        }).extend([]),
        view: app.view,
        loadTilesWhileAnimating: true,
    });

};

app.createHelpers = function () {


    app.parseIntArr = function (number) {
        return parseInt(number);
    };


    app.getDateString = function (mind, year) {
        mind = parseInt(mind);
        year = parseInt(year);
        if (mind > 12) {
            return [mind - 12, year + 1].join("/");
        }
        return [mind, year].join("/");
    }

    //function to populate l1
    app.populateL1 = async function (e) {
        // $("#selectl1").empty();
        // app.geomListLoading = true
        $("button").attr('disabled', 'disabled');
        // let l0 = app.URLparams['c'];
        // $("#selectl0").val(l0);
        let Level1AndLevel2Data = await app.makeRequest('GET', app.API.GEOMSAPI + '?country=' + app.DEFAULTS.COUN);
        let resp = JSON.parse(Level1AndLevel2Data)


        // $.ajax({
        //     url: app.API.GEOMSAPI,
        //     data: {country: l0},
        //     dataType: 'json',
        //     success: function (resp) {
        resp = resp.sort();
        var l1names = [];
        var l2names = [];
        resp.forEach(function (val) {
            if (val.substr(0, 2) == 'l1') l1names.push(val.substr(2));
            else if (val.substr(0, 2) == 'l2') l2names.push(val.substr(2));
        });
        // resp = resp.map(function(val){return val.substr(2)});
        var options = '';
        for (var i = 0; i < l1names.length; i++) {
            options += '<option value="' + l1names[i] + '">' + l1names[i].replace(/_/g, " ") + '</option>'
        }
        $("#selectl1").html(options).val(l1names[0]);
        var options = '';
        for (var i = 0; i < l2names.length; i++) {
            options += '<option value="' + l2names[i] + '">' + l2names[i].replace(/_/g, " ") + '</option>'
        }
        $("#selectl2").html(options).val(l2names[0]);
        let geom = app.URLparams.d;
        let lev = geom.substr(0, 2);
        let name = geom.substr(2);
        $("#bradio" + lev).attr('checked', true);
        $("#select" + lev).val(name);

        //if (!resp.includes(l2)) l2 = app.DEFAULTS.DIST[l0];
        //$("#selectl2").val(l2);
        $("button").removeAttr('disabled');
        await app.updateGeometry(geom);
        // app.geomListLoading = false
        // app.updateSelectCrop();
        // app.computeClicked();
        //     }
        // });

        if (lev == 'l0') {
            $("#selectl1").prop('disabled', true);
            $("#selectl2").prop('disabled', true);
        } else if (lev == 'l1') {
            $("#selectl1").prop('disabled', false);
            $("#selectl2").prop('disabled', true);
        } else {
            $("#selectl1").prop('disabled', true);
            $("#selectl2").prop('disabled', false);

        }
    }


    // handle year change
    app.onYearChange = function (e) {
        let year = $("#selectyear").val();
        $("#startDate").MonthPicker({
            Button: false,
            MinMonth: new Date(year, 0),
            MaxMonth: new Date(year, 11) < new Date().addMonths(-2) ? new Date(year, 11) : new Date().addMonths(-2),
            OnAfterChooseMonth: function (e) {
                app.onStartChanged(e);
            }
        });
        // $("#endDate").MonthPicker({ Button: false,
        //   MinMonth: new Date(year,0),
        //   MaxMonth: new Date(parseInt(year)+1,11),
        //   OnAfterChooseMonth: function( e ){app.onEndChanged(e);}});
        $("#startDate").val("01/" + year);
        $("#endDate").val("12/" + year);
        app.onStartChanged();
    }

    //process request with current options
    app.computeClicked = async function (e) {
        app.ShowLoadingOnUI(1);
        app.updateURL();
        if (clearLayerFlag) {
            app.removeAllLayers();
            app.addAllLayers();
        }

        clearLayerFlag = true;
        if (initialChartRequest) {
            initialChartRequest = false
        } else {
            // ChartAPIXMLHttpRequest.forEach(function (curVal){
            //    curVal.abort();
            // });
        }
        let param = app.APIParameters();
        let response = await app.makeRequest('GET', app.API.FewsNETTimeSeries + '?params=' + JSON.stringify(param));
        let ParseResponse = JSON.parse(response);
        console.log(ParseResponse);
        // let HighchartSupporingProp = app.CollectHighchartRequiredInfo();
        let ParamObject = {
            title: 'Snow Water Equivalent (kg/m<sup>2</sup>)',
            yAxisMeanTitle: '',
            seriesNameAccumulated: 'Snow Water Equivalent',
            showHideLegend: false,
            series: [{
                name: 'Snow Water Equivalent',
                type: 'spline',
                data: ParseResponse.SeriesData,
                tooltip: {
                    valueSuffix: ' kg/m<sup>2</sup>'
                },
                color: '#800080'
            }]
        }
        let highchartObj = app.highchartObjMeanAndAccumulated(ParamObject)
        let HCObj = app.DrawChart('chart' + '1', highchartObj);
    }
    // update the URL of application based on options
    app.updateURL = function () {
        // let l0 = app.URLparams['c'];
        var geom = app.URLparams['d'];
        // let period = $("#selectdataset").val();
        let ym = $("#startDate").val()
        let yearMonth = ym.slice(3, 7).toString() + ym.slice(0, 2)
        app.URLparams = {
            'd': geom,
            'ym': yearMonth
        }
        let url = app.baseURL + "?d=" + geom +
            "&ym=" + yearMonth;
        if (document.location.href != url) window.history.pushState({}, 'Nepal', url);
        else window.history.replaceState({}, 'Nepal', url);
    }

    app.fetchCropCalendar = function () {
        let sd = $("#startDate").val().split("/").map(app.parseIntArr);
        let ed = $("#endDate").val().split("/").map(app.parseIntArr);
        let year = parseInt($("#selectyear").val());

        if (ed[1] > year) ed[0] += 12;
        return [sd[0], ed[0]];
    }

    app.flyTo = function (location, zi, zf, done) {
        var duration = 1500;
//  var zoom = view.getZoom();
        var zoom = zf;
        var parts = 2;
        var called = false;

        function callback(complete) {
            --parts;
            if (called) {
                return;
            }
            if (parts === 0 || !complete) {
                called = true;
                done(complete);
            }
        }

        app.view.animate({
            center: location,
            duration: duration
        }, callback);

        app.view.animate({
            zoom: zoom - 1,
            duration: duration / 2
        }, {
            zoom: zoom,
            duration: duration / 2
        }, callback);
    }

    app.updateGeometry = async function (AdminLevel) {
        let response = await app.makeRequest('GET', '/static/' + TethysAppName + '/Shapes/' + app.DEFAULTS.COUN + '/' + AdminLevel + '.geojson')
        let fcoll = JSON.parse(response);
        // console.log("----dfef--------------");
        // app.maskCoordinates=fcoll.features[0].geometry.coordinates;
        // debugger;
        var layerSelecd = app.HighLightedLayer.getSource();
        layerSelecd.clear();
        var parser = new ol.format.GeoJSON();
        var features = parser.readFeatures(fcoll, {featureProjection: 'EPSG:3857'});
        app.maskCoordinates=[features[0].getGeometry().getCoordinates()]
        var perveiousExtent = app.view.calculateExtent();
        var zoom_pervious = app.view.getZoom();
        layerSelecd.addFeatures(features);
        var resultExtent = app.HighLightedLayer.getSource().getExtent();
        app.view.fit(resultExtent, app.map.getSize());
        var zoom_final = app.view.getZoom();
        app.view.fit(perveiousExtent, app.map.getSize());
        var location = [(resultExtent[0] + resultExtent[2]) / 2, (resultExtent[1] + resultExtent[3]) / 2]
        app.flyTo(location, zoom_pervious, zoom_final, function () {
        });
        app.WMSCropOrMask('mask');
    }

    app.layerswitcher = function () {
        app.LayerSwitcherSelect = app.createDiv('select-layers-list');
        app.LayerSwitcherSelect.setAttribute("id", "select-layer-switcher");

        let selectLayerListmm = app.createSelect('form-control form-control-sm selectlayers');
        selectLayerListmm.setAttribute("periodicity", "mm");
        let optionmm = app.createOption();
        optionmm.setAttribute("value", "0");
        optionmm.innerText = "No Layer";
        selectLayerListmm.append(optionmm);

        app.LayerSwitcherSelect.append(selectLayerListmm);


        selectLayerListmm.style.display = 'block';
        let olOverlaycontainer = document.querySelector('div.ol-overlaycontainer-stopevent');
        olOverlaycontainer.append(app.LayerSwitcherSelect);

    }

    app.APIParameters = function () {
        let param = {
            "type": "POST",
            "country": app.DEFAULTS.COUN,
            "geom": app.URLparams.d,
            "YearMonth": app.URLparams.ym
        }
        return param
    }

    // app.layers
    app.DateTickInterval__mm = 30 * 24 * 3600 * 1000; //Month
    app.DateTickInterval__3m = 30 * 24 * 3600 * 1000; //Month
    app.DateTickInterval__dd = 10 * 24 * 3600 * 1000; //10 days

    app.DateFormatter__mm = function () {
        let monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        var dt = new Date(this.value);
        dt.setDate(1);
        dt.setMonth(dt.getMonth() - 1);
        return Highcharts.dateFormat('%Y-%b', dt);
    }
    app.DateFormatter__3m = function () {
        let monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        var dt = new Date(this.value);
        var str = dt.getFullYear().toString() + "-";
        str += monthNames[dt.getMonth()][0];
        dt.setDate(1);
        dt.setMonth(dt.getMonth() + 1);
        str += monthNames[dt.getMonth()][0];
        dt.setMonth(dt.getMonth() + 1);
        str += monthNames[dt.getMonth()][0];
        return str;
        // return Highcharts.dateFormat('%Y-%b', this.value)
    }
    app.DateFormatter__dd = function () {
        var dt = new Date(this.value);
        if (dt.getDate() <= 10) {
            return Highcharts.dateFormat('%Y-%b-D1', this.value)
        } else if (dt.getDate() <= 20) {
            return Highcharts.dateFormat('%Y-%b-D2', this.value)
        } else {
            return Highcharts.dateFormat('%Y-%b-D3', this.value)
        }
    }

    app.TickPositioner__mm = function () {
        return undefined
    }

    app.TickPositioner__3m = function () {
        return undefined
    }

    app.TickPositioner__dd = function (data) {
        let PositionList = [];
        data.forEach(function (val) {
            PositionList.push(val[0])
        })
        let TickPositionerFunction = function () {
            return PositionList;
        }
        return TickPositionerFunction
    }

    app.TooltipFormater__dd = function () {
        let funn = function () {
            var dt = new Date(this.x);
            let customDate = ''
            if (dt.getDate() <= 10) {
                customDate = Highcharts.dateFormat('%Y-%b-D1', this.x);
            } else if (dt.getDate() <= 20) {
                customDate = Highcharts.dateFormat('%Y-%b-D2', this.x);
            } else {
                customDate = Highcharts.dateFormat('%Y-%b-D3', this.x);
            }
            let htmlStr = customDate + '<br/>';
            this.points.forEach((val) => {
                let aa = '<span style="color:' + val.color + '">●</span> ' + val.series.name + ': <b>' + val.y + val.series.tooltipOptions.valueSuffix + '</b><br/>';
                htmlStr = htmlStr + aa;
            });
            return htmlStr
        }
        return funn
    }
    app.TooltipFormater__mm = function () {
        let funn = function () {
            let customDate = Highcharts.dateFormat('%Y-%b', this.x);
            let htmlStr = customDate + '<br/>';
            this.points.forEach((val) => {
                let aa = '<span style="color:' + val.color + '">●</span> ' + val.series.name + ': <b>' + val.y + val.series.tooltipOptions.valueSuffix + '</b><br/>';
                htmlStr = htmlStr + aa;
            });
            return htmlStr
        }
        return funn
    }
    app.TooltipFormater__3m = function () {
        let funn = function () {
            let monthNames = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];
            var dt = new Date(this.x);
            dt.setDate(1);
            dt.setMonth(dt.getMonth() + 1);
            var str = dt.getFullYear().toString() + "-";
            str += monthNames[dt.getMonth()][0];
            dt.setDate(1);
            dt.setMonth(dt.getMonth() + 1);
            str += monthNames[dt.getMonth()][0];
            dt.setMonth(dt.getMonth() + 1);
            str += monthNames[dt.getMonth()][0];
            let customDate = str;
            let htmlStr = customDate + '<br/>';
            this.points.forEach((val) => {
                let aa = '<span style="color:' + val.color + '">●</span> ' + val.series.name + ': <b>' + val.y + val.series.tooltipOptions.valueSuffix + '</b><br/>';
                htmlStr = htmlStr + aa;
            });
            return htmlStr
        }
        return funn
    }

    app.ShowLoadingOnUI = function (index) {
        $('#chart' + index.toString()).html('<div class="vertically-center" ><div  class="spinner-border text-primary" role="status">\n' +
            '  <span class="sr-only">Loading...</span>\n' +
            '</div></div></div>');
    }
    app.CollectHighchartRequiredInfo = function (param, mean_data) {
        let tickInterval = app["DateTickInterval__" + param.interval];
        let Dateformater = app["DateFormatter__" + param.interval];
        let TickPositioner = app["TickPositioner__" + param.interval](mean_data);
        let TootTipFormatter = app["TooltipFormater__" + param.interval]();
        return {tickInterval, Dateformater, TickPositioner, TootTipFormatter}
    }
    app.LoadLTSDataAndPlot = async function (param, valueSuffix, HCObj, variable) {
        let responseLTS = await app.makeRequest('GET', app.API.LTAAPI + '?params=' + JSON.stringify(param));
        let ParseResponseLTS = JSON.parse(responseLTS);
        let roundedAndAccumulatedDataLTS = app.getAccumulated(ParseResponseLTS.time_series, variable);
        let ser = {
            name: "Long Term Average",
            type: 'spline',
            yAxis: 1,
            data: roundedAndAccumulatedDataLTS.mean.mean_data,
            tooltip: {
                valueSuffix: valueSuffix
            },
            color: '#2d2d2d'
        }
        HCObj.addSeries(ser);
    }

    app.getAccumulated = function (obj, variable) {
        let keyList = Object.keys(obj);
        let AccumulatedObj = {}
        keyList.forEach(function (key) {
            let currentObj = obj[key];
            let currentRounded = [];
            let newArray = [];
            currentObj.reduce((accumulator, currentValue, currentIndex, array) => {
                let roundedValueOrg = null;
                let newAccumulated = null;
                roundedValueOrg = parseFloat(currentValue[1].toFixed(4));
                newAccumulated = parseFloat((accumulator + roundedValueOrg).toFixed(4));
                if (variable == 'tempMin' || variable == 'tempMax' || variable == 'temp') {
                    roundedValueOrg = parseFloat(VALUESCALE.temp(roundedValueOrg).toFixed(4));
                    newAccumulated = parseFloat(VALUESCALE.temp(newAccumulated).toFixed(4));
                } else if (variable == 'emodisNdvi') {
                    roundedValueOrg = parseFloat(VALUESCALE.emodisNdvi(roundedValueOrg).toFixed(4));
                    newAccumulated = parseFloat(VALUESCALE.emodisNdvi(newAccumulated).toFixed(4));
                } else if (variable == 'ndviAnomaly') {
                    roundedValueOrg = parseFloat(VALUESCALE.ndviAnomaly(roundedValueOrg).toFixed(4));
                    newAccumulated = parseFloat(VALUESCALE.ndviAnomaly(newAccumulated).toFixed(4));
                }
                currentRounded.push([currentValue[0], roundedValueOrg]);
                newArray.push([currentValue[0], newAccumulated]);
                return newAccumulated;
            }, 0);
            AccumulatedObj[key] = newArray;
            obj[key] = currentRounded;
        });
        return {mean: obj, meanAccumulated: AccumulatedObj}
    }

    app.highchartObjMeanAndAccumulated = function (objParam) {
        let obj = {
            title: {
                text: objParam.title,
                // align: 'left',
                style: {"fontSize": "14px"},
                useHTML: true
            },
            xAxis: {
                type: 'datetime',
                dateTimeLabelFormats: { // don't display the dummy year
                    month: '%e. %b',
                    year: '%b'
                },
                title: {
                    text: ''
                },
                tickInterval: objParam.tickInterval,
                tickPositioner: objParam.TickPositioner,
                labels: {
                    formatter: objParam.Dateformater
                }
            },
            yAxis: { // Secondary yAxis
                title: {
                    text: objParam.yAxisMeanTitle,
                    style: {
                        color: '#4b4a4a'
                    }
                },
                labels: {
                    format: '{value}',
                    style: {
                        color: '#4b4a4a'
                    }
                }
            },
            tooltip: {
                useHTML: true,
                shared: true,
                formatter: objParam.TootTipFormatter
            },
            credits: {
                enabled: false
            },
            legend: {
                enabled: objParam.showHideLegend
            },
            series: objParam.series
        }
        return obj
    }

    app.DrawChart = function (divId, HighchartsObj) {
        if ($("#" + divId).highcharts()) {
            $("#" + divId).highcharts().destroy();
        } else {
            $("#" + divId).html('')
        }
        let obj = Highcharts.chart(divId, HighchartsObj)
        return obj;
    }

    app.addYearOnDropDownMenu = function () {
        let htmlStr = '';
        var year = new Date();

        for (; year.getFullYear() >= 2001;) {
            htmlStr = htmlStr + `<option value="${year.getFullYear()}">${year.getFullYear()}</option>`
            year.setFullYear(year.getFullYear() - 1);
        }
        $('#selectyear').html(htmlStr);
    }

    app.prepareDateObjForMapLayer = function () {
        let StartYear = parseInt(app.URLparams['y']);
        let EndYear = parseInt(app.URLparams['y']);
        let StartMonth = parseInt(app.URLparams['sd']) - 1;
        let EndMonth = parseInt(app.URLparams['ed']);
        if (EndMonth > 12) {
            EndYear = EndYear + 1;
            EndMonth = EndMonth - 12;
        }
        EndMonth = EndMonth - 1;
        app.threddsLayer = {
            startDate: new Date(StartYear, StartMonth),
            endDate: new Date(EndYear, EndMonth)
        }
    }
    app.removeAllLayers = function () {
        app.AllBindedLayersList.forEach(function (currLayer) {
            currLayer.setVisible(false);
        });
        $('.timeSliderDiv.custom-thredd-Scroll').html('');
        $('.time-layer-ledgend-div.custom-thredd-Scroll').html('');
        app.AllBindedLayersList.forEach(function (val) {
            val.AllLayersList.forEach(function (currentLayer) {
                app.map.removeLayer(currentLayer);
            });
        });
        app.AllBindedLayersList = [];
        $('select[periodicity="mm"]').html('<option value="0">No Layer</option>');
        $('select[periodicity="3m"]').html('<option value="0">No Layer</option>');
        $('select[periodicity="dd"]').html('<option value="0">No Layer</option>');
        app.prepareDateObjForMapLayer();
    }

    app.onLayerDropdownChange = function () {
        let Param = $('select[periodicity="mm"]').val();
        let completeId = Param;
        app.AllBindedLayersList.forEach(function (currLayer) {
            let properties = currLayer.getProperties();
            if (properties.id === completeId) {
                currLayer.setVisible(true);
            } else {
                currLayer.setVisible(false);
            }
        });
    }


};
app.getAvailableDataMonth = async function () {
    let currentResponse = await app.makeRequest('GET', FewsnetMonthly);
    let parser = new DOMParser();
    let xmlDoc = parser.parseFromString(currentResponse, "text/xml");
    let Datasetcollection = xmlDoc.querySelectorAll('catalogRef');
    let yyyymmList = [];
    for (i of Datasetcollection) {
        let yyyymm = i.getAttribute('name');
        yyyymmList.push(yyyymm);
    }
    let yyyymmListSorted = yyyymmList.sort();
    let FirstYearMonth = yyyymmListSorted.slice(0)[0]
    let LastYearMonth = yyyymmListSorted.slice(-1)[0]
    let FirstLastDate = [new Date(parseInt(FirstYearMonth.slice(0, 4)), parseInt(FirstYearMonth.slice(4, 6)) - 1), new Date(parseInt(LastYearMonth.slice(0, 4)), parseInt(LastYearMonth.slice(4, 6)) - 1)]
    return FirstLastDate
}

app.initiUI = async function () {

    $('.bound-dropdown').empty();


    for (var i = 0; i < INDICES.length; i++) {
        $('.bound-dropdown').append('<option value="' + INDICES[i][0] + '">' + INDICES[i][1] + '</option>');
    }

    app.addYearOnDropDownMenu();

    let firstLastDate = await app.getAvailableDataMonth();
    let initialMonth = firstLastDate.slice(1)[0].getMonth();
    if (initialMonth < 10) {
        initialMonth = '0' + initialMonth.toString();
    }
    workingYearMonth = firstLastDate.slice(1)[0].getFullYear().toString() + initialMonth;

    $("#startDate").MonthPicker({
        Button: false,
        // SelectedMonth: initialMonth + '/' + firstLastDate.slice(1)[0].getFullYear().toString(),
        MinMonth: firstLastDate.slice(0)[0],
        MaxMonth: firstLastDate.slice(1)[0],
        OnAfterChooseMonth: function (e) {
            // let date = $("#startDate").val().split('/');
            // workingYearMonth = date.slice(1)[0].toString() + date.slice(0)[0].toString();
        }
    });
    await app.populateL1();
};

app.addAllLayers = async function () {
    await app.addMonthsLayers();

}

app.bindControls = function () {
    // $("#selectl0").on("change", app.populateL1);
    $("input[name=level]").on("change", function (e) {
        // debugger;
        var source = e.target.id;
        var level = source.substr(-2);
        $("#selectl1").prop('disabled', true);
        $("#selectl2").prop('disabled', true);
        $("#select" + level).prop('disabled', false);

        var geom = $("#select" + level).val();
        if (level == 'l0') {
            app.updateGeometry(level + $("#select" + level).text().trim());
            app.URLparams.d = level + $("#select" + level).text().trim();
        } else {
            app.updateGeometry(level + $("#select" + level).val());
            app.URLparams.d = level + $("#select" + level).val();
        }
    });
    $("#selectl1").on("change", function (e) {
        // mapApp.updateGeometry($("#selectl0").val(), $(this).val());
        app.updateGeometry('l1' + $(this).val());
        app.URLparams.d = 'l1' + $(this).val();
        // app.updateSelectCrop();
    });
    $("#selectl2").on("change", function (e) {
        // mapApp.updateGeometry($("#selectl0").val(), $(this).val());
        app.updateGeometry('l2' + $(this).val());
        app.URLparams.d = 'l2' + $(this).val();
        // app.updateSelectCrop();
    });
    $(".compute-indices").on("click", function (e) {
        app.computeClicked(e);
    });
    $("#selectyear").on('change', function (e) {
        app.onYearChange(e);
    });
    $('select[periodicity="mm"]').on("change", function (e) {
        app.onLayerDropdownChange();
    });
};


// Document is ready
jQuery(async function ($) {
    app.createConstants();
    await app.parseParameters();
    app.initilizeMap();
    app.createHelpers();
    await app.initiUI();
    app.layerswitcher();
    app.prepareDateObjForMapLayer();
    app.bindControls();
    app.computeClicked();
    await app.addAllLayers();
});
