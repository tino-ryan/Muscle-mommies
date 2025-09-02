## Third-Party Libraries

### Leaflet:

This project makes use of **Leaflet**, an open-source JavaScript library for interactive maps. Leaflet is lightweight and well-documented. It allows us to embed dynamic maps with markers, popups, and user location features directly into the React interface.

**Documentation**: https://leafletjs.com/reference.html

---

#### How Leaflet is Used

- **MapContainer** and **TileLayer** from `react-leaflet` are used to render a base map with OpenStreetMap tiles.
- **Markers and Popups** display thrift store locations and allow users to see store information when clicking on a marker.
- **Custom Icons** are configured using Leaflet’s `L.Icon` to distinguish between the user’s location (red marker) and store locations (default markers).
- **FitBounds** functionality automatically adjusts the map view so that both the user and nearby stores are visible without manual zooming.

---

#### Why Leaflet Was Chosen

- **Open Source & Free:** Unlike alternatives such as Google Maps, Leaflet does not require API keys or billing, making it wasy to integrate and ideal for this project.
- **Lightweight:** Leaflet’s core library is small in size, ensuring fast load times compared to heavier mapping libraries.
- **Responsive Behavior:** Leaflet maps adapt well to different screen sizes, making them suitable for mobile and desktop use.
- **React Integration:** The react-leaflet library gives us ready-made React components for maps, so we can use them just like normal React code and easily connect them to our app’s state and hooks.
- **Customizability:** Leaflet allows full control over markers, layers, and styles, enabling us to tailor the map experience to the thrift store use case.
