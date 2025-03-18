import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient,HttpClientModule } from '@angular/common/http';
import { RouterOutlet } from '@angular/router';
//import { GoogleMap, GoogleMapsModule } from '@angular/google-maps';
import * as L from 'leaflet';
import {Country} from './country';
import * as GeoJSON from 'geojson';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent  implements OnInit {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  private map!: L.Map;

  constructor(private http: HttpClient) {} 
  

  ngOnInit() {
    this.initMap();
    this.loadCountryDataFromBackend();
  }

  private initMap() {
    this.map = L.map(this.mapContainer.nativeElement).setView([50, 10], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);
  }

  private loadCountryDataFromBackend() {
    this.http.get<Country[]>('http://localhost:8080/get-countries').subscribe((data) => {
      const geoJsonFeatures: GeoJSON.Feature[] = data.map((country) => ({
        type: 'Feature',
        properties: {
          name: country.name,
          code: country.code,
        },
        geometry: {
          type: 'MultiPolygon',
          coordinates: country.multipolygon, 
        },
      }));
  
      const geoJsonLayer = L.geoJSON(geoJsonFeatures, {
        style: (feature) => {
          return { color: 'blue' };
        },
        onEachFeature: (feature: any, layer: any) => {
          layer.on('click', () => {
            layer.setStyle({ color: 'red' });
            this.http.get('http://localhost:8080/translate-hello', {
              responseType: 'text',
              params: { cc: feature.properties.code }
            }).subscribe({
              next(value) {
                alert(`In ${feature.properties.name} people greet by ${AppComponent.decodeHtml(value)}`);
                layer.setStyle({ color: 'blue' });
              },
              error(err) {
                console.log("Error in translation:", err);
                alert("Failed to get the translation.");
                layer.setStyle({ color: 'blue' });
              },
            });
          });
        },
      });
  
      geoJsonLayer.addTo(this.map); // Add all features at once
    });
  }
  

  static decodeHtml(html: string): string {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.documentElement.textContent || "";
  }
}
