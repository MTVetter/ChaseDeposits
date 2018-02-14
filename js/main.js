/* Main JavaScript sheet, Michael Vetter*/

//Add Leaflet map
function createMap(){
    //create the map
    var map = L.map("map",{
        center: [40, -98.5],
        zoom: 4
    });

    //add OSM base tilelayer
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
    }).addTo(map);

    //call getData function
    getData(map);
};

//Use AJAX to load desposit geoJSON data
function getData(map){
    //load the data
    $.ajax("data/Deposits.geojson",{
        dataType: "json",
        success: function(response){

            //create an array for the attributes
            var attributes = processData(response);

            //call function to create and style prop symbols
            createPropSymbols(response, map, attributes);

            //create slider to sequence through the years
            createSlider(map, attributes);
        }
    });
};

function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with population values
        if (attribute.indexOf("Deposits") > -1){
            attributes.push(attribute);
        };
    };

    //check result
    console.log(attributes);

    return attributes
};

//Add circle markers to the map
function createPropSymbols(data, map, attributes){
    //create Leaflet geoJSON layer and add it to the map
    L.geoJson(data, {
        //call pointToLayer
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};

//Create the slider to sequence through the years
function createSlider(map, attributes){
    var SequenceControl = L.Control.extend({
        options: {
            position: "bottomleft"
        },

        onAdd: function(map){
            //create the container div
            var slider = L.DomUtil.create("div", "range-slider-container");
            $(slider).append('<input class="range-slider" type="range" max=7 min=0 step=1 value=0>');

            $(slider).append('<button class="skip" id="reverse" title="Reverse">Reverse</button>');
            $(slider).append('<button class="skip" id="forward" title="Forward">Forward</button>');

            //Elminate the map moving when double clicking
            $(slider).on("mousedown dblclick", function(e){
                L.DomEvent.stopPropagation(e);
            });

            //Elminate the map drag when dragging mouse
            $(slider).on("mousedown", function(){
                map.dragging.disable();
            });
            return slider;
        }
    });

    createTemporalLegend(map, attributes[0]);
    map.addControl(new SequenceControl());

    //Change the buttons to have pictures
    $("#reverse").html('<img src="img/left.png">');
    $("#forward").html('<img src="img/right.png">');

    //Add listeners for the buttons
    $(".skip").click(function(){
        //Get the old index value
        var index = $(".range-slider").val();
        //Increment or decrement based on button click
        if ($(this).attr("id") == "forward"){
            index++;
            //If click past last attribute wrap around to first
            index = index > 6 ? 0 : index;
        } else if ($(this).attr("id") == "reverse"){
            index--;
            //If click past first attribute wrap around to last
            index = index < 0 ? 6 : index;
        };

        //Update the slide
        $(".range-slider").val(index);
        updatePropSymbols(map, attributes[index]);
    });
    $(".range-slider").on("input", function(){
        //Get the new value of the index
        var index = $(this).val();
        updatePropSymbols(map, attributes[index]);
    });
};

//Create a function to update symbols based on slider
function updatePropSymbols(map, attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            //Access the feature's properties
            var props = layer.feature.properties;

            //Update the feature's radius
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);

            //create the popup
            createPopUp(props, attribute, layer, radius);
            updateLegend(map, attribute);
        };
    });
};

//Function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){
    //Determine which attribute to visualize with proportional symbols
    var attribute = attributes[0];

    //Create marker options
    var options = {
        fillColor: "#117ACA",
        color: "#000",
        weight: 1,
        opacity: 0.7,
        fillOpacity: 0.5
    };

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //Create circle marker layer
    var layer = L.circleMarker(latlng, options);

    //Call the create popup function
    createPopUp(feature.properties, attribute, layer, options.radius);

    //Event listeners to open popup on hover
    layer.on({
        mouseover: function(){
            this.openPopup();
        },
        mouseout: function(){
            this.closePopup();
        }
    });

    return layer;
};

//Create popup content
function createPopUp(properties, attribute, layer, radius){
    var popupContent = "<p><b>City:</b> " + properties.City + "</p>";
    var year = attribute.split("_")[1];

    //Add the content to popupContent
    popupContent += "<p><b>Number of deposits in " + year + ":</b> " + properties[attribute] + " thousand</p>";

    //Bind the popup to the layer and create an offset
    layer.bindPopup(popupContent, {
        offset: new L.Point(0, -radius)
    });
};

//Create the temporal legend
function createTemporalLegend(map, attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: "bottomright"
        },

        onAdd: function(map){
            var timestamp = L.DomUtil.create("div", "timestamp-container");
            $(timestamp).append('<div id="timestamp-container">');

            //Start attribute legend svg string
            var svg = '<svg id="attribute-legend" width="160px" height="60px">';

            //Create an array of circle names to base loop on
            var circles = {
                max: 20,
                mean: 40,
                min: 60
            };

            //Loop to add each circle and text to svg string
            for (var circle in circles){
                svg += '<circle class="legend-circle" id="' + circles +
                '"fill="#117ACA" fill-opacity="0.8" stroke="#000000" cx="30"/>';

                //Add text
                svg += '<text id="' + circles + '-text" x="65" y="' + circles[circle] + '"></text>';
            };

            //Close the svg string
            svg += "</svg>";

            //Add the attribute legend svg to the container
            $(timestamp).append(svg);
            return timestamp;
        }
    });
    map.addControl(new LegendControl());
    updateLegend(map, attributes[0]);
};

//Create a function to update the legend
function updateLegend(map, attribute){
    var year = attribute.split("_")[1];
    var content = "Number of Deposits in " + year;
    $(".timestamp-container").text(content);

    //Get the max, mean, and min values as an object
    var circleValues = getCircleValues(map, attribute);

    for (var key in circleValues){
        //Get the radius
        var radius = calcPropRadius(circleValues[key]);

        //Assign the cy and r attributes
        $("#"+key).attr({
            cy: 59 - radius,
            r: radius
        });

        //Add legend text
        $("#"+key+'-text').text(Math.round(circleValues[key]*100)/100 + " thousand");
    };
};

//Calculate the max, mean, and min values for a given attribute
function getCircleValues(map, attribute){
    //start with min at highest possible and max at lowest possible number
    var min = Infinity,
        max = -Infinity;

    map.eachLayer(function(layer){
        //get the attribute value
        if (layer.feature){
            var attributeValue = Number(layer.feature.properties[attribute]);

            //test for min
            if (attributeValue < min){
                min = attributeValue;
            };

            //test for max
            if (attributeValue > max){
                max = attributeValue;
            };
        };
    });

    //set mean
    var mean = (max + min) / 2;

    //return values as an object
    return {
        max: max,
        mean: mean,
        min: min
    };
};

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //scale factor to adjust symbol size evenly
    var scaleFactor = 50;
    //area based on attribute value and scale factor
    var area = attValue * scaleFactor;
    //radius calculated based on area
    var radius = Math.sqrt(area/Math.PI);

    return radius;
};

$(document).ready(createMap);