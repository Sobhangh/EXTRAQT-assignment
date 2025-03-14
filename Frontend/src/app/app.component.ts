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
  imports: [CommonModule, RouterOutlet, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent  implements OnInit {
  title = 'Frontend';
  center = { lat: 20, lng: 0 };
  zoom = 2;
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  private map!: L.Map;

  constructor(private http: HttpClient) {} //
  

  ngOnInit() {
    this.initMap();
    this.loadCountryDataFromBackend();
  }

  private initMap() {
    this.map = L.map(this.mapContainer.nativeElement).setView([20, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);
  }

  private loadCountryDataFromBackend() {
    this.http.get<Country[]>('http://localhost:8080/get-countries').subscribe((data) => {
      data.forEach((country) => {
        console.log(country);
        const geoJsonFeature : GeoJSON.Feature   = {
          type: 'Feature',
          properties: {
            name: country.name,
            code: country.code,
          },
          geometry: {
            type: 'MultiPolygon',
            coordinates: country.multipolygon, // GeoJSON expects nested arrays
          },
        };

        L.geoJSON(geoJsonFeature, {
          style: (feature) => {
            //const code = feature?.properties?.code;
            //return { color: code === 'BE' ? 'blue' : code === 'FR' ? 'red' : 'gray' };
            return {color:'green'};
          },
          onEachFeature: (feature: { properties: { name: any; }; }, layer: { on: (arg0: string, arg1: () => void) => void; }) => {
            layer.on('click', () => {
              alert(`Clicked on: ${feature.properties.name}`);
            });
          },
        }).addTo(this.map);
      });
    });
  }
  /*
  @ViewChild('google-map') map: GoogleMap = new GoogleMap();

  constructor() {} //private http: HttpClient

  ngOnInit() {
    //this.loadCountryDataFromBackend();
  }

  loadCountryDataFromBackend() {
    /*this.http.get<any[]>('http://your-backend.com/api/countries').subscribe((data) => {
      data.forEach((country) => {
        const geoJsonFeature = {
          type: 'Feature',
          properties: {
            NAME: country.name,
            ISO_A2: country.code,
          },
          geometry: {
            type: 'Polygon',
            coordinates: [country.coordinates], // GeoJSON expects nested arrays
          },
        };

        // Add feature to the data layer
        this.map.data.addGeoJson(geoJsonFeature);
      });

      // Apply styling after adding features
      this.styleCountries();
    });
  }

  styleCountries() {
    this.map.data.setStyle((feature) => {
      const countryCode = feature.getProperty('ISO_A2');
      const color = countryCode === 'BE' ? 'blue' : countryCode === 'FR' ? 'red' : 'gray';
      return { fillColor: color, strokeWeight: 1, fillOpacity: 0.6 };
    });

    // Add click event
    this.map.data.addListener('click', (event: { feature: { getProperty: (arg0: string) => any; }; }) => {
      const countryName = event.feature.getProperty('NAME');
      alert(`Clicked on: ${countryName}`);
    });
  }*/
}
