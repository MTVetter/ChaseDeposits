var map = L.map("map").setView([51.505, -0.09], 13);

L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
}).addTo(map);

//Creates a marker object a lat and long point and this point is added to the map
var marker = L.marker([51.5, -0.09]).addTo(map);

//Creates a circle at the lat and long given with a radius of 500 meters
var circle = L.circle([51.508, -0.11], 500,{
    //Color describes the color of the outline of the circle
    color: "red",
    //fillColor is the color within the circle
    fillColor: "#f03",
    //fillOpacity is the transparentacy of the fill color
    fillOpacity: 0.5
}).addTo(map);

//Creates a polygon from an array of lat and longs
var polygon = L.polygon([
    [51.509, -0.08],
    [51.503, -0.06],
    [51.51, -0.047],
]).addTo(map);

//Binds a popup to the layer with the passed content and sets up the necessary event listeners
//.openPopup opens the bound popup at the specified lat and long
marker.bindPopup("<b>Hello world!</b><br>I am a popup.").openPopup();
circle.bindPopup("I am a circle");
polygon.bindPopup("I am a polygon.");

//Opens popups in certain places of the map
var popup = L.popup()
    //Sets the location that the popup will open
    .setLatLng([51.5, -0.09])
    //Sets the HTML content of the popup
    .setContent("I am a standalone popup")
    //Adds the popup to the map and closes the other one
    .openOn(map);

var popup = L.popup();

function onMapClick(e){
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(map);
}

//When the map is clicked the onMapClick function will be performed
map.on("click", onMapClick);