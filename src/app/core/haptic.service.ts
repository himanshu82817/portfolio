import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HapticService {

  constructor() { }

  /**
   * Triggers a short haptic feedback vibration.
   */
  vibrate(): void {
    if (navigator.vibrate) {
      navigator.vibrate(10); // 10ms vibration
    }
  }
}
