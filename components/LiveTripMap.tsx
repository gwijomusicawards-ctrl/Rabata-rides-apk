"use client";
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

type Point = { lat: number; lng: number; label?: string } | null;
export default function LiveTripMap({ pickup, driver, destination }: { pickup: Point; driver: Point; destination?: Point }) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ pickup?: mapboxgl.Marker; driver?: mapboxgl.Marker; destination?: mapboxgl.Marker }>({});
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const hasInitial = Boolean(driver || pickup || destination);

  useEffect(() => {
    if (!host.current || !token) return;
    mapboxgl.accessToken = token;
    const initial = driver || pickup || destination;
    if (!initial) return;
    map.current = new mapboxgl.Map({
      container: host.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [initial.lng, initial.lat],
      zoom: 13,
      attributionControl: true
    });
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    return () => { map.current?.remove(); map.current = null; markers.current = {}; };
  }, [token, hasInitial]);

  useEffect(() => {
    if (!map.current || !token || !pickup || !destination) return;
    const m = map.current;
    const drawRoute = async () => {
      try {
        const coords = `${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}`;
        const response = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=geojson&overview=full&access_token=${token}`);
        const json = await response.json();
        const geometry = json.routes?.[0]?.geometry;
        if (!geometry || !m) return;
        const apply = () => {
          const source = m.getSource("rabalata-route") as mapboxgl.GeoJSONSource | undefined;
          if (source) source.setData({ type: "Feature", properties: {}, geometry });
          else {
            m.addSource("rabalata-route", { type: "geojson", data: { type: "Feature", properties: {}, geometry } });
            m.addLayer({ id: "rabalata-route-line", type: "line", source: "rabalata-route", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": "#f5b900", "line-width": 5, "line-opacity": 0.9 } });
          }
        };
        if (m.isStyleLoaded()) apply(); else m.once("load", apply);
      } catch { /* The live markers remain useful if route directions are unavailable. */ }
    };
    void drawRoute();
  }, [pickup?.lat, pickup?.lng, destination?.lat, destination?.lng, token]);

  useEffect(() => {
    if (!map.current) return;
    const m = map.current;
    const update = (key: "pickup" | "driver" | "destination", point: Point, color: string) => {
      if (!point) { markers.current[key]?.remove(); delete markers.current[key]; return; }
      if (!markers.current[key]) {
        const el = document.createElement("div"); el.className = `trip-marker ${key}`;
        markers.current[key] = new mapboxgl.Marker({ element: el, color }).setLngLat([point.lng, point.lat]).addTo(m);
      } else markers.current[key]!.setLngLat([point.lng, point.lat]);
    };
    update("pickup", pickup, "#f5b900"); update("driver", driver, "#48c78e"); update("destination", destination || null, "#f5f5f5");
    const points = [pickup, driver, destination || null].filter(Boolean) as Exclude<Point, null>[];
    if (points.length > 1) {
      const bounds = new mapboxgl.LngLatBounds(); points.forEach(p => bounds.extend([p.lng, p.lat]));
      m.fitBounds(bounds, { padding: 65, maxZoom: 15, duration: 700 });
    } else if (points.length === 1) m.easeTo({ center: [points[0].lng, points[0].lat], duration: 500 });
  }, [pickup?.lat, pickup?.lng, driver?.lat, driver?.lng, destination?.lat, destination?.lng]);

  if (!token) return <div className="map-placeholder"><strong>Mapbox setup required</strong><span>Add NEXT_PUBLIC_MAPBOX_TOKEN to your deployment environment to display the live map.</span></div>;
  if (!pickup && !driver && !destination) return <div className="map-placeholder"><strong>Waiting for location permission</strong><span>Share your location or wait for the driver to start location sharing during an active trip.</span></div>;
  return <div className="live-map-wrap"><div ref={host} className="live-map"/><div className="map-legend"><span><i className="pickup-dot"/> Pickup</span><span><i className="driver-dot"/> Driver</span><span><i className="destination-dot"/> Destination</span></div></div>;
}
