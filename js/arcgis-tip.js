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
        var mapServiceURL = $(this).data('service'),
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
          columns =  [
            {
              name: 'ProjectID',
              title: 'Project ID'
            },
            {
              name: 'FiscalYear',
              title: 'Fiscal Year',
              filter: true

            },
            {
              name: 'ProjectTitle',
              title: 'Project Title'
            },
            {
              name: 'StartTerminus',
              title: 'Start Terminus'
            },
            {
              name: 'EndTerminus',
              title: 'End Terminus'
            },
            {
              name: 'LeadAgency',
              title: 'Lead Agency',
              filter: true
            },
            {
              name: 'AllAgencies',
              title: 'All Agencies',
              filter: true
            },
            {
              name: 'FundType',
              title: 'Fund Type'
            },
            {
              name: 'FederalFunding',
              title: 'Federal Funding',
              render: formatCurrency,
              visible: false
            },
            {
              name: 'StateFunding',
              title: 'State Funding',
              render: formatCurrency,
              visible: false
            },
            {
              name: 'LeadAgencyFunding',
              title: 'Lead Agency Funding',
              render: formatCurrency,
              visible: false
            },
            {
              name: 'OtherAgencyFunding',
              title: 'Other Agency Funding',
              render: formatCurrency,
              visible: false
            },
            {
              name: 'TotalCost',
              title: 'Total Cost',
              render: formatCurrency
            },
            {
              name: 'Description',
              title: 'Description'
            },
            {
              name: 'ProjectCategory',
              title: 'Project Category',
              visible: false,
              filter: true
            },
            {
              name: 'NonInfrastructure',
              title: 'Non-Infrastructure',
              visible: false,
              filter: true
            },
            {
              name: 'MultiAgency',
              title: 'Multi-Agency',
              visible: false,
              filter: true
            },
            {
              name: 'AdvancedConstruction',
              title: 'Advanced Construction',
              visible: false,
              filter: true
            }
          ],
          displayResults = function () {
            var rows = [];
            $.each(featureSets, function (i, featureSet) {
              $.each(featureSet.features, function (i, feature) {
                var row = [];
                $.each(columns, function (i, column) {
                  row.push(feature.attributes[column.name]);
                });
                rows.push(row);
              });
            });
            $('#tip-table').DataTable({
              dom: 'Bfrtip',
              data: rows,
              paging: false,
              info: false,
              columns: columns,
              buttons: [
                'colvis'
              ],
              initComplete: function () {
                var api = this.api(),
                  table = api.table().node();

                console.log(table);
                $.each(columns, function(i, colDef) {
                  if (colDef.filter) {
                    console.log(colDef.name);
                    var column = api.column(colDef.name + ':name'),
                      wrapper = $('<div class="tip-filter"></div>')
                        .insertBefore(table),
                      label = $('<label></label>')
                        .attr('for', colDef.name)
                        .text(colDef.title + ':')
                        .appendTo(wrapper),
                      select = $('<select></select>')
                        .attr('id', colDef.name)
                        .attr('name', colDef.name)
                        .append('<option value=""></option>')
                        .appendTo(wrapper)
                        .on('change', function () {
                            var val = $.fn.dataTable.util.escapeRegex($(this).val());
                            column.search( val ? '^'+val+'$' : '', true, false ).draw();
                        });

                  column.data().unique().sort().each( function (d, j) {
                    select.append('<option value="'+d+'">'+d+'</option>')
                  });
                  }
                });

              }
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
