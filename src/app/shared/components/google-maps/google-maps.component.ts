import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { GoogleMap, GoogleMapsModule } from '@angular/google-maps';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-google-maps',
  imports: [GoogleMapsModule, CommonModule],
  templateUrl: './google-maps.component.html',
  styleUrl: './google-maps.component.scss',
})
export class GoogleMapsComponent implements OnChanges {
  @Input({ required: true }) address!: {
    logradouro: string;
    numero: string;
    bairro: string;
    localidade: string;
  };
  @ViewChild(GoogleMap) map!: GoogleMap;

  apiKey = environment.googleMapsApiKey;

  mapOptions: google.maps.MapOptions | undefined;
  private advancedMarker: google.maps.marker.AdvancedMarkerElement | undefined;

  // O Geocoder não precisa mais ser uma propriedade da classe
  // Vamos instanciá-lo apenas quando formos usar.

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Roda toda vez que o @Input 'address' muda
    if (changes['address'] && this.address && this.address.numero) {
      this.searchOnMap();
    }
  }

  public async searchOnMap(): Promise<void> {
    if (!this.address) return;

    try {
      const { Geocoder } = (await google.maps.importLibrary(
        'geocoding'
      )) as google.maps.GeocodingLibrary;

      const geocoder = new Geocoder();

      const fullAddress = `
      ${this.address.logradouro},
      ${this.address.numero},
      ${this.address.bairro},
      ${this.address.localidade},
      Brasil
    `;

      const response = await geocoder.geocode({
        address: fullAddress,
        componentRestrictions: { country: 'BR' },
      });

      if (response.results[0]) {
        const location = response.results[0].geometry.location;
        this.centerMapAndPlaceMarker(location, fullAddress);
      } else {
        throw new Error('ZERO_RESULTS');
      }
    } catch (e) {
      this.mapOptions = undefined;
      this.cdr.detectChanges();
    }
  }

  private async centerMapAndPlaceMarker(
    location: google.maps.LatLng,
    title: string
  ): Promise<void> {
    if (!this.mapOptions) {
      this.mapOptions = {
        center: location,
        zoom: 17,
        mapId: 'MY_ID', // Lembre-se de usar um Map ID real
      };
      this.cdr.detectChanges();
    } else {
      this.map.googleMap?.setCenter(location);
      this.map.googleMap?.setZoom(17);
    }

    const { AdvancedMarkerElement } = (await google.maps.importLibrary(
      'marker'
    )) as google.maps.MarkerLibrary;
    await new Promise((resolve) => setTimeout(resolve, 0));

    if (this.map?.googleMap) {
      if (this.advancedMarker) {
        this.advancedMarker.map = null;
      }
      this.advancedMarker = new AdvancedMarkerElement({
        position: location,
        map: this.map.googleMap,
        title: title,
      });
    }
  }
}
