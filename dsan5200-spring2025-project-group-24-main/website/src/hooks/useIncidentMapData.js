import { useEffect, useState } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import getDataPath from "../utils/getDataPath"; // adjust path as needed

export default function useIncidentMapData() {
  const [baseGeo, setBaseGeo] = useState(null);
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    // Load world map data (GeoJSON)
    d3.json(getDataPath('world-110m.json')).then((world) => {
      const countries = topojson.feature(world, world.objects.countries);
      setBaseGeo(countries);
    });

    // Load incident data from CSV
    d3.csv(getDataPath('data/security_incidents.csv')).then((data) => {
      const parsed = data.map((d) => ({
        Country: d.Country,
        Latitude: +d.Latitude,
        Longitude: +d.Longitude,
        Year: +d.Year,
        Date: d.Date || null,
        Motive: d.Motive || "Unknown",
        "Incident Type": d["Incident Type"],
        ActorType: d["Actor type"],
        Notes: d.Notes,
      }));
      setIncidents(parsed);
    });
  }, []);

  return { baseGeo, incidents };
}
