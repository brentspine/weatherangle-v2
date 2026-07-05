import { Injectable } from '@angular/core';

interface BoundingBox {
  start: [number, number];
  end: [number, number];
}

@Injectable({
  providedIn: 'root',
})
export class SurpriseLocationService {
  private readonly ranges: BoundingBox[] = [
    { start: [45.706179, -0.791016], end: [53.330873, 24.433594] }, // Europa
    { start: [46.55886, -121.816406], end: [31.353637, -83.232422] }, // USA
    { start: [-4.541943, -70.756084], end: [-22.967151, -42.055922] }, // Südamerika
    { start: [22.512557, 114.257813], end: [40.913513, 74.179688] }, // Asien
    { start: [51.082822, -2.460938], end: [53.455349, -0.219727] }, // GB
    { start: [47.517201, 7.668457], end: [53.683695, 13.227539] }, // Deutschland
    { start: [47.517201, 7.668457], end: [53.683695, 13.227539] }, // Deutschland
    { start: [47.517201, 7.668457], end: [53.683695, 13.227539] }, // Deutschland
  ];

  getRandomLocation(): { lat: number; lon: number } {
    const box = this.ranges[Math.floor(Math.random() * this.ranges.length)];
    const lat = box.start[0] + Math.random() * (box.end[0] - box.start[0]);
    const lon = box.start[1] + Math.random() * (box.end[1] - box.start[1]);
    return { lat, lon };
  }
}
