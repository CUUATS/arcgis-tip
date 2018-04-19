<?php
/**
 * WordPress plugin "ArcGIS Transportation Improvement Program" main file, responsible for initiating the plugin
 *
 * @package ArcGIS Transportation Improvement Program
 * @author Champaign Urbana Urbanized Area Transportation Study
 * @version 0.1
 */

/*
Plugin Name: ArcGIS Transportation Improvement Program
Plugin URI:  https://github.com/cuuats/arcgis-tip
Description: Display transportation improvement program data from ArcGIS
Version:     0.1
Author:      Champaign Urbana Urbanized Area Transportation Study
Author URI:  http://cuuats.org/
License:     GPL2
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Domain Path: /languages
Text Domain: arcgis-tip
*/

/*	Copyright 2016 Champaign Urbana Urbanized Area Transportation Study

	This program is free software; you can redistribute it and/or modify
	it under the terms of the GNU General Public License, version 2, as
	published by the Free Software Foundation.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program; if not, write to the Free Software
	Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

function arcgis_tip_enqueue_scripts () {
  wp_register_style( 'jquery-datatables', 'https://cdn.datatables.net/t/dt/jszip-2.5.0,pdfmake-0.1.18,dt-1.10.11,b-1.1.2,b-colvis-1.1.2,b-html5-1.1.2,b-print-1.1.2/datatables.min.css', array(), null, 'all' );
  wp_register_script( 'jquery-datatables', 'https://cdn.datatables.net/t/dt/jszip-2.5.0,pdfmake-0.1.18,dt-1.10.11,b-1.1.2,b-colvis-1.1.2,b-html5-1.1.2,b-print-1.1.2/datatables.min.js', array( 'jquery-core' ), null, false );

  wp_register_style( 'arcgis-js-api', 'https://js.arcgis.com/3.16/esri/css/esri.css', array(), null, 'all' );
  wp_register_script( 'arcgis-js-api', 'https://js.arcgis.com/3.16/', array(), null, false );

  wp_register_style( 'arcgis-tip', plugins_url( '/css/arcgis-tip.css' , __FILE__ ), array('jquery-datatables', 'arcgis-js-api'), '0.1-3', 'all' );
  wp_register_script( 'arcgis-tip', plugins_url( '/js/arcgis-tip.js' , __FILE__ ), array('jquery-datatables', 'arcgis-js-api'), '0.1-7', false );
}
add_action( 'wp_enqueue_scripts', 'arcgis_tip_enqueue_scripts' );

function arcgis_tip_shortcode ( $atts ) {
  wp_enqueue_style( 'arcgis-tip' );
  wp_enqueue_script( 'arcgis-tip' );
  $atts = shortcode_atts(array(
			'service' => null,
      'version' => null,
      'start' => 2017,
      'end' => 2020,
      'boundary' => null,
		), $atts, 'arcgis_tip' );
  return '<div class="arcgis-tip" data-service="' .
    esc_attr($atts['service']) . '" data-version="' .
    esc_attr($atts['version']) . '" data-start="' .
    esc_attr($atts['start']) . '" data-end="' .
    esc_attr($atts['end']) . '" data-boundary="' .
    esc_attr($atts['boundary']) . '">' .
    '<h2 class="tip-title">' .
    _('Transportation Improvement Program FY', 'arcgis-tip') . $atts['start'] .
    ' - ' . $atts['end'] . '</h2>' .
    '<p class="tip-updated">' . $atts['version'] . '</p>' .
    '<div id="info-pane"><div id="legend">' .
    '</div><div id="feature-attributes"></div></div><div id="map"></div>' .
    '<div class="rpc-table tip-table">' .
    '<table id="tip-table" style="width: 100%;"></table></div>';
}
add_shortcode( 'arcgis-tip', 'arcgis_tip_shortcode' );
