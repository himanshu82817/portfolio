import { Component, AfterViewInit, HostListener } from '@angular/core';

@Component({
  selector: 'app-night-sky',
  templateUrl: './night-sky.component.html',
  styleUrls: ['./night-sky.component.css']
})
export class NightSkyComponent implements AfterViewInit {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private stars: any[] = [];
  private meteors: any[] = [];
  private numStars = 200;

  ngAfterViewInit() {
    this.canvas = document.getElementById("nightSky") as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d")!;
    this.resizeCanvas();

    this.generateStars();
    this.animate();

    // Generate meteors at random intervals
    setInterval(() => {
      if (Math.random() > 0.7) {
        this.createMeteor();
      }
    }, 1000);
  }

  @HostListener('window:resize')
  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  generateStars() {
    this.stars = [];
    for (let i = 0; i < this.numStars; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        radius: Math.random() * 2,
        brightness: Math.random() * 0.5 + 0.5,
        flickerSpeed: Math.random() * 0.02 + 0.01
      });
    }
  }

  createMeteor() {
    this.meteors.push({
      x: Math.random() * this.canvas.width,
      y: Math.random() * (this.canvas.height / 2),
      length: Math.random() * 80 + 50,
      speed: Math.random() * 6 + 3,
      opacity: 1
    });
  }

  drawStars() {
    this.stars.forEach((star) => {
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
      this.ctx.fill();

      // Twinkle effect
      star.brightness += star.flickerSpeed * (Math.random() > 0.5 ? 1 : -1);
      if (star.brightness < 0.3) star.brightness = 0.3;
      if (star.brightness > 1) star.brightness = 1;
    });
  }

  drawMeteors() {
    for (let i = 0; i < this.meteors.length; i++) {
      const meteor = this.meteors[i];

      this.ctx.beginPath();
      this.ctx.moveTo(meteor.x, meteor.y);
      this.ctx.lineTo(meteor.x + meteor.length, meteor.y + meteor.length);
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${meteor.opacity})`;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      // Move meteor
      meteor.x += meteor.speed;
      meteor.y += meteor.speed;
      meteor.opacity -= 0.02;

      // Remove meteor if it fades
      if (meteor.opacity <= 0) {
        this.meteors.splice(i, 1);
        i--;
      }
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawStars();
    this.drawMeteors();
  }
}
