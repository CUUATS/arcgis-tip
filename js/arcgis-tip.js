require([
  "esri/map",
  "esri/layers/ArcGISDynamicMapServiceLayer",
  "esri/tasks/query",
  "esri/tasks/QueryTask",
  "dojo/domReady!"
], function(Map, ArcGISDynamicMapServiceLayer, Query, QueryTask) {
  (function ($) {
    $(function () {
      $('.arcgis-tip').each(function () {
        var columns =  ['ProjectID', 'FiscalYear', 'ProjectTitle', 'StartTerminus', 'EndTerminus', 'LeadAgency', 'AllAgencies', 'FundType', 'FederalFunding', 'StateFunding', 'LeadAgencyFunding', 'OtherAgencyFunding', 'TotalCost', 'Description', 'ProjectCategory', 'NonInfrastructure', 'MultiAgency', 'AdvancedConstruction'],
          columnLabels = ['Project ID', 'Fiscal Year', 'Project Title', 'Start Terminus', 'End Terminus', 'Lead Agency', 'All Agencies', 'Fund Type', 'Federal Funding', 'State Funding', 'Lead Agency Funding', 'Other Agency Funding', 'Total Cost', 'Description', 'Project Category', 'Non Infrastructure', 'Multi Agency', 'Advanced Construction'],
          mapServiceURL = $(this).data('service'),
          layerQuery = "(FiscalYear >= 2017 AND FiscalYear <= 2020) OR AdvancedConstruction = 'Yes'",
          layerDefs = [layerQuery, layerQuery],
          pointTask = new QueryTask(mapServiceURL + '0'),
          linearTask = new QueryTask(mapServiceURL + '1'),
          query = new Query(),
          featureSets = [],
          map = new Map("map", {
            center: [-88.2, 40.1],
            zoom: 10,
            basemap: "topo"
          }),
          dmsLayer = new ArcGISDynamicMapServiceLayer(mapServiceURL, {
            "opacity" : 0.5
          }),
          formatCurrency = function (value) {
            if (value !== null) {
              return '$' + value.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
            }
            return null;
          },
          displayResults = function () {
            var rows = [];
            $.each(featureSets, function (i, featureSet) {
              $.each(featureSet.features, function (i, feature) {
                var row = [];
                $.each(columns, function (i, column) {
                  row.push(feature.attributes[column]);
                });
                rows.push(row);
              });
            });
            $('#tip-table').DataTable({
              dom: 'Bfrtip',
              data: rows,
              columns: $.map(columnLabels, function(label) {
                return {title: label};
              }),
              columnDefs: [
                {
                  targets: [8, 9, 10, 11, 12],
                  render: formatCurrency
                },
                {
                  targets: [8, 9, 10, 11, 14, 15, 16, 17],
                  visible: false
                }
              ],
              buttons: [
                'colvis'
              ]
            });
          },
          success = function (featureSet) {
            featureSets.push(featureSet);
            if (featureSets.length == 2) {
              displayResults();
            }
          };

        // Set up the map.
        dmsLayer.setLayerDefinitions(layerDefs);
        map.addLayer(dmsLayer);

        // Set up the table.
        query.where = layerQuery;
        query.returnGeometry = false;
        query.outFields = ['*'];
        pointTask.execute(query, success);
        linearTask.execute(query, success);
      });
    });
  })(jQuery);
});
