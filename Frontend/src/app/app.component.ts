import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient,HttpClientModule } from '@angular/common/http';
import { RouterOutlet } from '@angular/router';
//import { GoogleMap, GoogleMapsModule } from '@angular/google-maps';
import * as L from 'leaflet';
import {Country} from './country';
import * as GeoJSON from 'geojson';
import proj4 from 'proj4';

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
            return {color:'blue'};
          },
          onEachFeature: (feature: { properties: { name: any;code:any; }; }, layer: { on: (arg0: string, arg1: () => void) => void; }) => {
            layer.on('click', () => {
              this.http.get('http://localhost:8080/translate-hello',{responseType: 'text', params:{cc:feature.properties.code}}).subscribe({
                next(value) {
                  alert(`Hello in: ${feature.properties.name} is ${value}`);
                },
                error(err) {
                  console.log("Error in transaltion: ")
                  console.log(err);
                  alert("Failed to get the translation.")
                },
              })
              
            });
          },
        }).addTo(this.map);
        //this.map.eachLayer(l => console.log(l))

      });
    });
  }
}
