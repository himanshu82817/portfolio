import { Component, AfterViewInit, HostListener } from '@angular/core';

@Component({
  selector: 'app-light-sky',
  templateUrl: './light-sky.component.html',
  styleUrls: ['./light-sky.component.css']
})
export class LightSkyComponent implements AfterViewInit {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private clouds: any[] = [];
  private numClouds = 6;

  ngAfterViewInit() {
    // this.canvas = document.getElementById("lightSky") as HTMLCanvasElement;
    // this.ctx = this.canvas.getContext("2d")!;
    // this.resizeCanvas();

    // this.generateClouds();
    // this.animate();
  }

  // @HostListener('window:resize')
  // resizeCanvas() {
  //   this.canvas.width = window.innerWidth;
  //   this.canvas.height = window.innerHeight;
  // }

  // generateClouds() {
  //   this.clouds = [];
  //   for (let i = 0; i < this.numClouds; i++) {
  //     this.clouds.push({
  //       x: Math.random() * this.canvas.width,
  //       y: Math.random() * (this.canvas.height / 2),
  //       width: Math.random() * 150 + 100,
  //       height: Math.random() * 50 + 30,
  //       speed: Math.random() * 1 + 0.5,
  //       opacity: Math.random() * 0.5 + 0.3
  //     });
  //   }
  // }

  // drawClouds() {
  //   this.ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  //   this.clouds.forEach((cloud) => {
  //     this.ctx.beginPath();
  //     this.ctx.ellipse(cloud.x, cloud.y, cloud.width, cloud.height, 0, 0, Math.PI * 2);
  //     this.ctx.fill();
  //     cloud.x += cloud.speed;

  //     // Loop clouds to the left when they exit the screen
  //     if (cloud.x > this.canvas.width + 50) {
  //       cloud.x = -cloud.width;
  //     }
  //   });
  // }

  // animate() {
  //   requestAnimationFrame(() => this.animate());
  //   this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  //   this.drawClouds();
  // }
}
