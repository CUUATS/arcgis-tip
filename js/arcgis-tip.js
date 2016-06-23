require([
  "esri/map",
  "esri/layers/ArcGISDynamicMapServiceLayer",
  "esri/tasks/query",
  "esri/tasks/QueryTask",
  "esri/dijit/Legend",
  "esri/geometry/Point",
  "esri/SpatialReference",
  "esri/graphic",
  "esri/symbols/SimpleMarkerSymbol",
  "esri/symbols/SimpleLineSymbol",
  "esri/tasks/IdentifyTask",
  "esri/tasks/IdentifyParameters",
  "dojo/_base/Color",
  "dojo/promise/all",
  "dojo/domReady!"
], function(
    Map,
    ArcGISDynamicMapServiceLayer,
    Query,
    QueryTask,
    Legend,
    Point,
    SpatialReference,
    Graphic,
    SimpleMarkerSymbol,
    SimpleLineSymbol,
    IdentifyTask,
    IdentifyParameters,
    Color,
    all) {
  (function ($) {
    $(function () {
      $('.arcgis-tip').each(function () {
        var START_FY = 2017,
          END_FY = 2020,
          MARKER_TYPES = ['point', 'multipoint'],
          mapServiceURL = $(this).data('service'),
          tipVersion = $(this).data('version'),
          layerQuery = "(FiscalYear >= " + START_FY +
            " AND FiscalYear <= " + END_FY +
            ") OR AdvancedConstruction = 'Yes'",
          layerDefs = [layerQuery, layerQuery],
          pointTask = new QueryTask(mapServiceURL + '0'),
          linearTask = new QueryTask(mapServiceURL + '1'),
          query = new Query(),
          map = new Map("map", {
            center: [-88.2, 40.1],
            zoom: 10,
            basemap: "gray"
          }),
          identifyTask = new IdentifyTask(mapServiceURL),
          identifyParameters = new IdentifyParameters(),
          dmsLayer = new ArcGISDynamicMapServiceLayer(mapServiceURL, {
            "opacity" : 1.0
          }),
          markerSymbol = new esri.symbol.SimpleMarkerSymbol(
            esri.symbol.SimpleMarkerSymbol.STYLE_SQUARE,
            12,
            new esri.symbol.SimpleLineSymbol(
              esri.symbol.SimpleLineSymbol.STYLE_SOLID,
              new dojo.Color([255, 0, 0]),
              3
            ),
            new dojo.Color([0, 0, 0, 0])
          ),
          lineSymbol = new esri.symbol.SimpleLineSymbol(
            esri.symbol.SimpleLineSymbol.STYLE_DASH,
            new dojo.Color([255, 0, 0]),
            3
          );
          customizePDFDoc = function(doc) {
            // Page setup
            doc.pageMargins = [40, 40, 40, 40];

            // Styles
            doc.styles.tableHeader = {
              alignment: 'left',
              bold: true,
              fontSize: 8,
              color: 'white',
              fillColor: 'black'
            };

            doc.styles.title = {
              alignment: 'center',
              bold: true,
              fontSize: 12
            };

            doc.styles.message = {
              alignment: 'center',
              fontSize: 10
            };

            doc.styles.tableBodyEven.fontSize = 8;
            doc.styles.tableBodyOdd.fontSize = 8;

            // Document margins
            doc.content[0].margin = [0, 0, 0, 6];

            // Table column widths
            var colWidths = [];
            $('#tip-table').dataTable().api().columns(':visible').every(function(idx) {
              var col = columns[idx];
              colWidths.push(col.pdfWidth ? col.pdfWidth : 'auto');
            });
            doc.content[2].table.widths = colWidths;

            // Active filters
            var filterValues = [];
            $('.tip-filter select').each(function() {
              var value = $(this).val();
              if (value) {
                filterValues.push([$(this).prev('label').text(), value]);
              }
            });
            var searchValue = $('#tip-table_filter input[type="search"]').val();
            if (searchValue) {
              filterValues.push(['Keyword:', searchValue]);
            }
            if (filterValues.length) {
              var filterString = $.map(filterValues, function(item) {
                return item.join(' ');
              }).join('; ');
              doc.content[1].text += ' \u2014 Filters Applied: ' + filterString;
            }
          },
          initFilters = function(api) {
            var table = api.table().node(),
              buttons = api.buttons().container(),
              filters = $('<div id="tip-advanced-filters"></div>')
                .insertBefore(table)
                .hide(),
            filterIds = [];

          $.each(columns, function(i, colDef) {
            if (colDef.filter) {
              filterIds.push(colDef.name);

              var column = api.column(colDef.name + ':name'),
                wrapper = $('<div class="tip-filter"></div>')
                  .appendTo(filters),
                filterTitle = colDef.filterTitle ? colDef.filterTitle : colDef.title,
                label = $('<label></label>')
                  .attr('for', colDef.name)
                  .text(filterTitle + ':')
                  .appendTo(wrapper),
                select = $('<select></select>')
                  .attr('id', colDef.name)
                  .attr('name', colDef.name)
                  .append('<option value=""></option>')
                  .appendTo(wrapper)
                  .on('change', function () {
                      var val = $.fn.dataTable.util.escapeRegex($(this).val()),
                        regex = colDef.multiValue ? '(^|,|\\s)' + val + '(\\s|,|$)' : '^' + val + '$';
                      column.search(val ? regex : '', true, false).draw();
                  }),
                allValues = column.data().unique().sort(),
                choices = colDef.multiValue ? splitChoices(allValues) : allValues;

              $.each(choices, function (i, choice) {
                $('<option></option>')
                  .text(choice)
                  .attr('value', choice)
                  .appendTo(select);
              });
            }
          });

          $('<a></a>')
            .text('Reset filters')
            .attr('aria-controls', filterIds.join(' '))
            .attr('href', '#')
            .addClass('dt-button tip-filter-reset')
            .appendTo(filters)
            .click(function(e) {
              e.preventDefault();
              $('.tip-filter select').val('').change();
            });

          $('<a></a>')
            .text('Advanced filters')
            .attr('href', '#')
            .addClass('dt-button tip-filter-toggle')
            .prependTo(buttons)
            .click(function(e) {
              e.preventDefault();
              filters.slideToggle(200);
            });
          },
          extractParams = function(url) {
            var parts = url.substring(1).split('&'),
              params = {};
            $.each(parts, function(i, part) {
              var pair = part.split('=');
              params[decodeURIComponent(pair[0])] =
                decodeURIComponent(pair[1]).replace('+', ' ');
            });
            return params;
          },
          initProjectSelection = function(api) {
            $('a.project-link').click(function(e) {
              var params = extractParams($(this).attr('href'));
              setCurrentProject(
                api,
                parseInt(params.id),
                parseInt(params.layer));
              e.preventDefault();
            });
          },
          setCurrentProject = function(api, oid, layer) {
            map.graphics.clear();
            $.each(api.data(), function(i, feature) {
              if (feature.attributes.OBJECTID == oid
                  && feature._layerIndex == layer) {
                displayProjectAttributes(feature);
                if (hasGeometry(feature)) {
                  var symbol =
                      (MARKER_TYPES.indexOf(feature.geometry.type) != -1) ?
                      markerSymbol : lineSymbol,
                    graphic = new Graphic(feature.geometry, symbol);
                  map.graphics.add(graphic);
                  zoomToGeometry(feature.geometry);
                }
              }
            });
          },
          hasGeometry = function(feature) {
            var geom = feature.geometry;
            return (geom && !(geom.type == 'point' && !$.isNumeric(geom.x)));
          },
          zoomToGeometry = function(geom) {
            var extent = geom.getExtent();
            if (extent && extent.xmax != extent.xmin) {
              map.setExtent(extent, true);
            } else if (geom.type == 'point') {
              map.centerAndZoom(geom, 14);
            } else if (geom.type == 'multipoint') {
              var point = new Point(geom.points[0], geom.spatialReference);
              map.centerAndZoom(point, 14);
            }
          },
          clearCurrentProject = function(e) {
            $('#feature-attributes').hide();
            $('#legend').show();
            $('#info-pane').scrollTop(0);
            map.graphics.clear();
            e.preventDefault();
          },
          displayProjectAttributes = function(feature) {
            $('#legend').hide();
            var container = $('#feature-attributes').empty().show(),
              infoPane = container.parent(),
              clearLink = $('<a href="#">&laquo; Clear selection</a>')
                .click(clearCurrentProject).appendTo(container),
              title = $('<h2>Project Details</h2>').appendTo(container),
              dl = $('<dl>').appendTo(container);
            $.each(columns, function(i, column) {
              $('<dt>').text(column.title).appendTo(dl);
              var value = feature.attributes[column.name];
              if (column.render && column.name != 'ProjectID')
                value = column.render(value);
              $('<dd>').text(value || '\u2014').appendTo(dl);
            });
            if (!hasGeometry(feature))
              $('<p class="message-info">This project is not mapped.</p>')
                .insertBefore(dl);
            infoPane.scrollTop(0);
            clearLink.focus();
            $('html, body').scrollTop(infoPane.offset().top);
          },
          identifyFeature = function(e) {
            identifyParameters.geometry = e.mapPoint;
            identifyParameters.mapExtent = map.extent;
            identifyParameters.width = map.width;
            identifyParameters.height = map.height;

            identifyTask.execute(identifyParameters).then(function(res) {
              if (res.length) {
                var api = $('#tip-table').dataTable().api();
                $.each(res, function(i, result) {
                  var attrs = result.feature.attributes,
                    fy = parseInt(attrs['Fiscal Year']),
                    ac = attrs['Advanced Construction'] == 'Yes';
                  // Only display projects that are visible in the
                  // current TIP.
                  if ((fy >= START_FY && fy <= END_FY) || ac) {
                    setCurrentProject(api, attrs.OBJECTID, result.layerId);
                    return false;
                  }
                });

              }
            });
          },
          formatCurrency = function(value) {
            if (value !== null) {
              return '$' + value.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
            }
            return null;
          },
          formatFeatureLink = function(data, type, row, meta) {
            var params = $.param({
              id: row.attributes.OBJECTID,
              layer: row._layerIndex
            });
            return '<a class="project-link" href="#' + params + '">' + data +
              '</a>';
          },
          dtButtons = [
            'colvis', 'copy', 'csv', 'excel', {
              extend: 'pdfHtml5',
              text: 'PDF/Print',
              orientation: 'landscape',
              pageSize: 'LETTER',
              title: 'Transportation Improvement Program FY 2017-2020',
              message: tipVersion,
              exportOptions: {
                columns: ':visible'
              },
              customize: customizePDFDoc
            }
          ],
          columns =  [
            {
              name: 'ProjectID',
              data: 'attributes.ProjectID',
              title: 'Project ID',
              render: formatFeatureLink
            },
            {
              name: 'FiscalYear',
              data: 'attributes.FiscalYear',
              title: 'Fiscal Year',
              filter: true

            },
            {
              name: 'ProjectTitle',
              data: 'attributes.ProjectTitle',
              title: 'Project Title'
            },
            {
              name: 'StartTerminus',
              data: 'attributes.StartTerminus',
              title: 'Start Terminus'
            },
            {
              name: 'EndTerminus',
              data: 'attributes.EndTerminus',
              title: 'End Terminus'
            },
            {
              name: 'LeadAgency',
              data: 'attributes.LeadAgency',
              title: 'Lead Agency'
            },
            {
              name: 'AllAgencies',
              data: 'attributes.AllAgencies',
              title: 'All Agencies',
              filter: true,
              multiValue: true,
              filterTitle: 'Agency'
            },
            {
              name: 'FundType',
              data: 'attributes.FundType',
              title: 'Fund Type'
            },
            {
              name: 'FederalFunding',
              data: 'attributes.FederalFunding',
              title: 'Federal Funding',
              render: formatCurrency,
              visible: false,
              pdfWidth: 40
            },
            {
              name: 'StateFunding',
              data: 'attributes.StateFunding',
              title: 'State Funding',
              render: formatCurrency,
              visible: false,
              pdfWidth: 40
            },
            {
              name: 'LeadAgencyFunding',
              data: 'attributes.LeadAgencyFunding',
              title: 'Lead Agency Funding',
              render: formatCurrency,
              visible: false,
              pdfWidth: 40
            },
            {
              name: 'OtherAgencyFunding',
              data: 'attributes.OtherAgencyFunding',
              title: 'Other Agency Funding',
              render: formatCurrency,
              visible: false,
              pdfWidth: 40
            },
            {
              name: 'TotalCost',
              data: 'attributes.TotalCost',
              title: 'Total Cost',
              render: formatCurrency,
              pdfWidth: 40
            },
            {
              name: 'Description',
              data: 'attributes.Description',
              title: 'Description'
            },
            {
              name: 'ProjectCategory',
              data: 'attributes.ProjectCategory',
              title: 'Project Category',
              visible: false,
              filter: true
            },
            {
              name: 'NonInfrastructure',
              data: 'attributes.NonInfrastructure',
              title: 'Non-Infrastructure',
              visible: false,
              filter: true
            },
            {
              name: 'MultiAgency',
              data: 'attributes.MultiAgency',
              title: 'Multi-Agency',
              visible: false,
              filter: true
            },
            {
              name: 'AdvancedConstruction',
              data: 'attributes.AdvancedConstruction',
              title: 'Advanced Construction',
              visible: false,
              filter: true
            }
          ],
          splitChoices = function(choices, sep) {
            if (typeof(sep) === 'undefined') sep = ',';
            var results = [];
            $.each(choices, function(i, value) {
              $.each(value.split(sep), function(i, part) {
                var part = $.trim(part);
                if (results.indexOf(part) == -1) results.push(part);
              });
            });
            results.sort();
            return results;
          },
          makeRowObject = function(feature, layerIndex) {
            feature._layerIndex = layerIndex;
            return feature;
          },
          displayResults = function(featureSets) {
            var rows = [];
            $.each(featureSets, function (layerIndex, featureSet) {
              $.each(featureSet.features, function (i, feature) {
                rows.push(makeRowObject(feature, layerIndex));
              });
            });
            $('#tip-table').DataTable({
              dom: 'Bfrtip',
              data: rows,
              paging: false,
              info: false,
              columns: columns,
              buttons: dtButtons,
              initComplete: function () {
                var api = this.api();
                initFilters(api);
                initProjectSelection(api);
              }
            });
          };

        // Add layers to the map.
        dmsLayer.setLayerDefinitions(layerDefs);
        map.addLayer(dmsLayer);

        // Create the legend.
        var legendDijit = new Legend({
          map: map,
          layerInfos: [{layer: dmsLayer, title: 'Legend'}]
        }, 'legend');
        legendDijit.startup();

        // Set up identify feature.
        identifyParameters.tolerance = 5;
        identifyParameters.returnGeometry = false;
        identifyParameters.layerIds = [0, 1];
        identifyParameters.layerOption = IdentifyParameters.LAYER_OPTION_TOP;
        map.on('click', identifyFeature);

        // Set up the table.
        query.where = layerQuery;
        query.returnGeometry = true;
        query.outFields = ['*'];
        query.outSpatialReference = new SpatialReference(3857);

        // Query the service layers, and populate the table.
        all([
          pointTask.execute(query),
          linearTask.execute(query)]).then(displayResults);
      });
    });
  })(jQuery);
});
