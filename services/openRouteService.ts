const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;

interface Coord {
    lat: number;
    lng: number;
}

export const getRoute = async (start: Coord, end: Coord) => {
    try {
        const response = await fetch(
            `https://api.openrouteservice.org/v2/directions/foot-walking?api_key=${ORS_API_KEY}&start=${start.lng},${start.lat}&end=${end.lng},${end.lat}`
        );

        if (!response.ok) {
            throw new Error("Failed to fetch route");
        }

        const data = await response.json();
        return data.features[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]); // Flip to [lat, lng] for Leaflet
    } catch (error) {
        console.error("OpenRouteService Error:", error);
        return null;
    }
};
