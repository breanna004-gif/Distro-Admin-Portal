import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';

export interface PinSelection {
  kind: 'pickup' | 'dropoff';
  latitude: number;
  longitude: number;
  placeName: string;
}

interface PlaceResult {
  display_name: string;
  lat: string;
  lon: string;
}

@Component({
  selector: 'app-location-pin-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './location-pin-map.html',
  styleUrl: './location-pin-map.css'
})
export class LocationPinMap implements AfterViewInit, OnChanges, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly zone = inject(NgZone);

  @Input() pickupLat: number | null = null;
  @Input() pickupLng: number | null = null;
  @Input() dropoffLat: number | null = null;
  @Input() dropoffLng: number | null = null;
  @Output() pinned = new EventEmitter<PinSelection>();

  @ViewChild('mapHost') mapHost?: ElementRef<HTMLDivElement>;

  mode: 'pickup' | 'dropoff' = 'pickup';
  query = '';
  searching = false;
  searchMessage = '';
  results: PlaceResult[] = [];

  private map?: L.Map;
  private pickupMarker?: L.Marker;
  private dropoffMarker?: L.Marker;
  private framed = false;
  private lookupToken = 0;

  ngAfterViewInit(): void {
    const host = this.mapHost?.nativeElement;
    if (!host) {
      return;
    }

    this.map = L.map(host).setView([-0.42, 37], 6);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(this.map);
    this.map.on('click', (event: L.LeafletMouseEvent) => {
      this.zone.run(() => {
        this.dropPin(this.mode, event.latlng.lat, event.latlng.lng, '');
        this.lookupPlace(this.mode, event.latlng.lat, event.latlng.lng);
      });
    });
    this.syncMarkers();
    setTimeout(() => this.map?.invalidateSize(), 0);
    setTimeout(() => this.map?.invalidateSize(), 250);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) {
      return;
    }
    if (changes['pickupLat'] || changes['pickupLng'] || changes['dropoffLat'] || changes['dropoffLng']) {
      this.syncMarkers();
    }
  }

  ngOnDestroy(): void {
    this.lookupToken += 1;
    this.map?.remove();
  }

  setMode(mode: 'pickup' | 'dropoff'): void {
    this.mode = mode;
  }

  search(): void {
    const query = this.query.trim();
    if (query.length < 2) {
      this.searchMessage = 'Type a place name, then search.';
      this.results = [];
      return;
    }

    this.searching = true;
    this.searchMessage = '';
    this.http.get<PlaceResult[]>('https://nominatim.openstreetmap.org/search', {
      params: {
        format: 'jsonv2',
        q: query,
        limit: '5'
      }
    }).subscribe({
      next: results => {
        this.searching = false;
        this.results = results ?? [];
        this.searchMessage = this.results.length
          ? ''
          : 'No place found. Click the map instead.';
      },
      error: () => {
        this.searching = false;
        this.results = [];
        this.searchMessage = 'Search is unavailable. Click the map to drop the pin.';
      }
    });
  }

  choose(result: PlaceResult): void {
    const latitude = Number(result.lat);
    const longitude = Number(result.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return;
    }
    this.results = [];
    this.query = '';
    this.searchMessage = '';
    this.dropPin(this.mode, latitude, longitude, this.shortPlace(result.display_name));
  }

  private dropPin(
    kind: 'pickup' | 'dropoff',
    latitude: number,
    longitude: number,
    placeName: string
  ): void {
    if (kind === 'pickup') {
      this.pickupLat = latitude;
      this.pickupLng = longitude;
    } else {
      this.dropoffLat = latitude;
      this.dropoffLng = longitude;
    }
    this.syncMarkers();
    this.focus(latitude, longitude);
    this.pinned.emit({ kind, latitude, longitude, placeName });
    if (kind === 'pickup' && this.dropoffLat == null) {
      this.mode = 'dropoff';
    }
  }

  private lookupPlace(kind: 'pickup' | 'dropoff', latitude: number, longitude: number): void {
    const token = ++this.lookupToken;
    this.http.get<PlaceResult>('https://nominatim.openstreetmap.org/reverse', {
      params: {
        format: 'jsonv2',
        lat: String(latitude),
        lon: String(longitude)
      }
    }).subscribe({
      next: result => {
        if (token !== this.lookupToken || !result?.display_name) {
          return;
        }
        this.pinned.emit({
          kind,
          latitude,
          longitude,
          placeName: this.shortPlace(result.display_name)
        });
      },
      error: () => undefined
    });
  }

  private syncMarkers(): void {
    if (!this.map) {
      return;
    }
    this.pickupMarker = this.placeMarker('pickup', this.pickupLat, this.pickupLng, this.pickupMarker);
    this.dropoffMarker = this.placeMarker('dropoff', this.dropoffLat, this.dropoffLng, this.dropoffMarker);
  }

  private placeMarker(
    kind: 'pickup' | 'dropoff',
    latitude: number | null,
    longitude: number | null,
    marker: L.Marker | undefined
  ): L.Marker | undefined {
    if (latitude == null || longitude == null || !this.map) {
      marker?.remove();
      return undefined;
    }
    if (marker) {
      marker.setLatLng([latitude, longitude]);
      return marker;
    }
    return L.marker([latitude, longitude], {
      icon: L.divIcon({
        className: `map-pin map-pin-${kind}`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      }),
      keyboard: false
    }).addTo(this.map);
  }

  private focus(latitude: number, longitude: number): void {
    if (!this.map) {
      return;
    }
    const pickupReady = this.pickupLat != null && this.pickupLng != null;
    const dropoffReady = this.dropoffLat != null && this.dropoffLng != null;
    if (pickupReady && dropoffReady && !this.framed) {
      this.framed = true;
      this.map.fitBounds(L.latLngBounds(
        [this.pickupLat!, this.pickupLng!],
        [this.dropoffLat!, this.dropoffLng!]
      ), { padding: [36, 36], maxZoom: 12 });
      return;
    }
    if (this.map.getZoom() < 12) {
      this.map.flyTo([latitude, longitude], 13);
      return;
    }
    this.map.panTo([latitude, longitude]);
  }

  private shortPlace(displayName: string): string {
    return displayName
      .split(',')
      .map(part => part.trim())
      .filter(Boolean)
      .slice(0, 3)
      .join(', ')
      .slice(0, 300);
  }
}
