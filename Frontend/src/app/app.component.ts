import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterOutlet } from '@angular/router';
import { GoogleMap, GoogleMapsModule } from '@angular/google-maps';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, GoogleMapsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent  implements OnInit {
  title = 'Frontend';
  center = { lat: 20, lng: 0 };
  zoom = 2;
  @ViewChild('google-map') map: GoogleMap | undefined;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadCountryDataFromBackend();
  }

  loadCountryDataFromBackend() {
    this.http.get<any[]>('http://your-backend.com/api/countries').subscribe((data) => {
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
    this.map.data.addListener('click', (event) => {
      const countryName = event.feature.getProperty('NAME');
      alert(`Clicked on: ${countryName}`);
    });
  }
}
