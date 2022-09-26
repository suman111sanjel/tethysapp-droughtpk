from tethys_sdk.base import TethysAppBase, url_map_maker


class Droughtpk(TethysAppBase):
    """
    Tethys app class for Droughtpk.
    """

    name = 'Drought Watch - Pakistan'
    index = 'droughtpk:Home'
    icon = 'droughtpk/images/icon.gif'
    package = 'droughtpk'
    root_url = 'droughtpk'
    color = '#2c3e50'
    description = ''
    tags = 'Drought-Watch'
    enable_feedback = False
    feedback_emails = []

    def url_maps(self):
        """
        Add controllers
        """
        UrlMap = url_map_maker(self.root_url)

        url_maps = (
            UrlMap(
                name='Home',
                url='droughtpk',
                controller='droughtpk.controllers.Current.home'
            ),UrlMap(
                name='CurrentHome',
                url='droughtpk/current',
                controller='droughtpk.controllers.Current.home'
            ), UrlMap(
                name='SeasonalHome',
                url='droughtpk/seasonal',
                controller='droughtpk.controllers.Seasonal.home'
            ), UrlMap(
                name='OutlookHome',
                url='droughtpk/outlook',
                controller='droughtpk.controllers.Outlook.home'
            ),
            UrlMap(
                name='FewsNETHome',
                url='droughtpk/fewsnet',
                controller='droughtpk.controllers.Fewsnet.home'
            ),
            UrlMap(
                name='geomList',
                url='api/getGeomList',
                controller='droughtpk.api.getGeomList'
            ),
            UrlMap(
                name='Stats',
                url='api/getJsonFromAPI',
                controller='droughtpk.api.getJsonFromBLDAS'
            ),
            UrlMap(
                name='AreaUnder',
                url='api/getAreaUnder',
                controller='droughtpk.api.getAreaUnderFromBLDAS'
            ),
            UrlMap(
                name='LTAstats',
                url='api/getLTAStats',
                controller='droughtpk.api.getLTAStats'
            ),
            UrlMap(
                name='SAAreaUnder',
                url='api/seasonagg',
                controller='droughtpk.api.getSeasonalAggregatedRatio'
            ),
            UrlMap(
                name='PercentageOfNormal',
                url='api/percentageOfNormal',
                controller='droughtpk.api.getPercentageOfNormal'
            ),
            UrlMap(
                name='forecast',
                url='api/getSpatialAverageForecast',
                controller='droughtpk.api.getSpatialAverageForecast'
            ),
            UrlMap(
                name='fewsnet',
                url='api/getfewsnettimeseries',
                controller='droughtpk.api.GetFewsNETTimeSeries'
            ),
        )

        return url_maps
