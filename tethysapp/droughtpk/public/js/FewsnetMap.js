let sldasCurrent = [{
    title: 'Snow Water Equivalent',
    ParameterName: 'SWE_inst',
    PropForSLD: [{
        classType: 'Below',
        label: ["less than -50", ""],
        color: '#7E0000',
        value: '-50'
    }, {
        label: ["-50 to -45", ""], color: '#BF0000',
        range: '-50 -45'
    }, {
        label: ["-45 to -40", ""], color: '#F70000',
        range: '-45 -40'
    }, {
        label: ["-40 to -35", ""], color: '#FF0200',
        range: '-40 -35'
    }, {
        label: ["-35 to -30", ""], color: '#FF1A00',
        range: '-35 -30'
    }, {
        label: ["-30 to -25", ""], color: '#FF5E00',
        range: '-30 -25'
    }, {
        label: ["-25 to -20", ""], color: '#FFA700',
        range: '-25 -20'
    }, {
        label: ["-20 to -15", ""], color: '#EDD128',
        range: '-20 -15'
    }, {
        label: ["-15 to -10", ""], color: '#E9DB7E',
        range: '-15 -10'
    }, {
        label: ["-10 to -5", ""], color: '#FCD5D8',
        range: '-10 -5'
    }, {
        label: ["-5 to 0", ""], color: '#FFFFFF',
        range: '-5 0'
    }, {
        label: ["0 to 5", ""], color: '#FFFFFF',
        range: '0 5'
    }, {
        label: ["5 to 10", ""], color: '#E0FFF8',
        range: '5 10'
    }, {
        label: ["10 to 15", ""], color: '#99FFE5',
        range: '10 15'
    }, {
        label: ["15 to 20", ""], color: '#7CFFDD',
        range: '15 20'
    }, {
        label: ["20 to 25", ""], color: '#5EFFFF',
        range: '20 25'
    }, {
        label: ["25 to 30", ""], color: '#305EFF',
        range: '25 30'
    }, {
        label: ["30 to 35", ""], color: '#203AFF',
        range: '30 35'
    }, {
        label: ["35 to 40", ""], color: '#1A30FF',
        range: '35 40'
    }, {
        label: ["40 to 45", ""], color: '#0C16FF',
        range: '40 45'
    }, {
        classType: 'Above',
        label: ["45 or more", ""], color: '#0004CB',
        value: '45'
    }],
    lagendImage: "/static/" + TethysAppName + "/images/legend/FinalNewAirTemperature.jpg"
}];


let LegendParameter = '?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&WIDTH=10&HEIGHT=230&SLD_BODY=';
app.SLDASYearMonth = {};
app.SPIYearMonth = {};

app.addMonthsLayers = async function () {
    let Periodicity = 'mm';
    let fewsnetMonthCatalogUrl = FewsnetMonthly.replace('catalog.xml', app.URLparams['ym'] + '/catalog.xml')
    let currentMonC = await app.makeRequest('GET', fewsnetMonthCatalogUrl);
    let currentMonthParser = new DOMParser();
    let xmlDocCurrentMonth = currentMonthParser.parseFromString(currentMonC, "text/xml");
    let currentMonthDoc = xmlDocCurrentMonth.querySelectorAll('dataset[name$=".nc"]');
    let currentMonthly = [];
    for (kk of currentMonthDoc) {
        let fileName = kk.getAttribute('name');
        let currentwms = fewsnetMonthCatalogUrl.replace("/catalog/", "/wms/").replace("catalog.xml", fileName)
        currentMonthly.push(currentwms);
    }
    let dateisoFormatForLevelFormatter = function (isoDate) {
        let dateObj = Date.parseISO8601(isoDate)
        let FullYear = dateObj.getFullYear().toString();
        let FullMonth = dateObj.getMonth();
        return FullYear + '-' + AllMonths[FullMonth]
    }
    currentMonthly = currentMonthly.sort();
    for (kk of sldasCurrent) {
        let sld = getSLDForThredds(kk.ParameterName, kk.PropForSLD);
        addLayerToMapFewsNet(kk.ParameterName, kk.title, currentMonthly, sld, true, true, kk.ParameterName, Periodicity, dateisoFormatForLevelFormatter, kk.PropForSLD, kk.lagendImage);
    }
}
app.WMSCropOrMask = function (CropOrMask) {
    app.AllBindedLayersList.forEach(function (layerobj) {
        let properties = layerobj.getProperties();
        // app.maskCoordinates
        let coo=app.maskCoordinates
        if (properties.mask) {
            if (CropOrMask == 'crop') {
                layerobj.setCrop(coo);
            } else {
                layerobj.setMask(coo);
            }
        }
        console.log("kk");
    });
    // console.log(app.AllBindedLayersList)
};

let addLayerToMapFewsNet = async function (id, title, currentMonthWMS, SLD, showlegend, showControlPanel, ParameterName, Periodicity, dateisoFormatForLevelFormatter, customLegendData, lagendImage) {
    let LegendParameter = '?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&WIDTH=10&HEIGHT=330&SLD_BODY=';
    let legendWMS = '';
    if (Array.isArray(currentMonthWMS)) {
        legendWMS = currentMonthWMS[0];
    } else {
        legendWMS = currentMonthWMS;
    }
    let customLegend = function (LegendData) {
        let outerDiv = app.createDiv('info legend legend-control');
        let span = app.createSpan("legend-text");
        let b = app.createB();
        b.innerText = title;
        span.append(b);

        let br = app.createBr();

        let table = app.createTable("legend-table");
        let tbody = app.createTbody();

        for (kk of LegendData) {
            let tr = app.createTr("legend-row");
            let td1 = app.createTd("legend-symbol");
            td1.style.backgroundColor = kk.color;
            let td2 = app.createTd("legend-text legend-label");
            td2.innerText = kk.label[0]
            let td3 = app.createTd("legend-text");
            td3.innerText = kk.label[1]

            tr.append(td1);
            tr.append(td2);
            tr.append(td3);
            tbody.prepend(tr);
        }
        table.append(tbody);
        outerDiv.append(span);
        outerDiv.append(br);
        outerDiv.append(table);
        setTimeout(function () {
            $(".thredd-layer-image-div").mouseover(function () {
                $(".legend-text").css('font-size', '15px');

            }).mouseout(function () {
                $(".legend-text").css('font-size', '10px');
            });
        }, 500);
        return outerDiv
    }

    var Newlayer = new ol.layer.TimeDimensionTile({

        id: id,
        title: title,
        visible: false,
        opacity: 1,
        legendPath: legendWMS + LegendParameter + encodeURIComponent(SLD).toString(),
        // legendPath: lagendImage,
        ThreddsDataServerVersion: 5,
        serverType: 'TDS',
        alignTimeSlider: 'left',
        timeSliderSize: 'small',
        showlegend: showlegend,
        showControlPanel: showControlPanel,
        Periodicity: Periodicity,
        // dateisoFormatForLevelFormatter: dateisoFormatForLevelFormatter,
        // customLegend: customLegend,
        // customLegendData: customLegendData,
        source: {
            url: currentMonthWMS,
            params: {
                'LAYERS': ParameterName,
                'SLD_BODY': SLD,
                'transparent': true
            }
        },
        mask: true
    });

    await Newlayer.init().then(function (val) {
        app.map.addThreddsLayer(val);
        let properties = Newlayer.getProperties();
        let selectElement = document.querySelector(`select[periodicity="${Periodicity}"]`);
        let option = app.createOption();
        option.setAttribute("periodicity", Periodicity);
        option.setAttribute("value", properties.id);
        option.innerText = properties.title;
        selectElement.append(option);
        app.AllBindedLayersList.push(Newlayer);
        app.WMSCropOrMask('mask');
    }, (error) => console.error(error));
}
// ol.layer.TimeDimensionTile.prototype.setMask = function (Coods) {
//     this.setMaskOrCrop(Coods, 'mask');
// }
// ol.layer.TimeDimensionTile.prototype.setCrop = function (Coods) {
//     this.setMaskOrCrop(Coods, 'crop');
// }
//
// ol.layer.TimeDimensionTile.prototype.setMaskOrCrop = function (Coods, maskOrCrop) {
//     let properties = this.getProperties();
//     if (properties.mask) {
//         var f = new ol.Feature(new ol.geom.MultiPolygon(Coods));
//         if (!Array.isArray(this.maskObjList)) {
//             this.maskObjList = [];
//             if (!this.maskObjList.length) {
//                 let layer = this;
//                 if (properties.hasOwnProperty('ThreddsDataServerVersion')) {
//                     layer.AllLayersList.forEach((timeDimensionLayer, index) => {
//                         this.changeMask(timeDimensionLayer, Coods, index, false, maskOrCrop);
//                     });
//                 } else {
//                     this.changeMask(layer, Coods, 0, false, maskOrCrop);
//                 }
//             }
//         } else {
//             let layer = this;
//             if (properties.hasOwnProperty('ThreddsDataServerVersion')) {
//                 layer.AllLayersList.forEach((timeDimensionLayer, index) => {
//                     this.changeMask(timeDimensionLayer, Coods, index, true, maskOrCrop);
//                 });
//             } else {
//                 this.changeMask(layer, Coods, 0, true, maskOrCrop);
//             }
//         }
//     }
// }
//
// ol.layer.TimeDimensionTile.prototype.changeMask =  function (layer, Coods, ArrayIndex, deleteOrNot, maskOrCrop) {
//     if (deleteOrNot) {
//         layer.removeFilter(this.maskObjList[ArrayIndex]);
//     }
//     var f = new ol.Feature(new ol.geom.MultiPolygon(Coods));
//
//     let MOrC = null;
//     if (maskOrCrop == 'crop') {
//         MOrC = new ol.filter.Crop({feature: f, inner: false});
//     } else {
//         MOrC = new ol.filter.Mask({
//             feature: f,
//             inner: false,
//             fill: new ol.style.Fill({color: [185, 185, 185, 0.7]})
//         });
//     }
//     layer.addFilter(MOrC);
//     MOrC.set('active', true);
//     if (deleteOrNot) {
//         this.maskObjList[ArrayIndex] = MOrC;
//     } else {
//         this.maskObjList.push(MOrC)
//     }
//
// }
//
