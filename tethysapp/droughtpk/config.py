# from t
from tethysapp.droughtpk.app import Droughtpk
TethysAppName=Droughtpk.package
initilizationData={
    'country':'Pakistan',
    'navLogoImage':'/static/'+TethysAppName+'/images/nologo.png',
    'defaultView':{
        'center': [7722373.0917585185, 3584943.0907590967],
        'zoom': 6
    },
    'TethysAppName':TethysAppName,
    'AdminLevel':'l2Islamabad',
}
# let aa=app.map.getView().calculateExtent()
# let center=[(aa[0]+aa[2])/2,(aa[1]+aa[3])/2]
