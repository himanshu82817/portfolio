import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { AboutComponent } from './features/portfolio/components/about/about.component';
import { HeroComponent } from './features/portfolio/components/hero/hero.component';
import { BlogComponent } from './features/portfolio/components/blog/blog.component';
import { ContactComponent } from './features/portfolio/components/contact/contact.component';
import { ExperienceComponent } from './features/portfolio/components/experience/experience.component';
import { ProjectsComponent } from './features/portfolio/components/projects/projects.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent, 
    HeroComponent, 
    AboutComponent,
    ExperienceComponent,
    ProjectsComponent,
    BlogComponent,
    ContactComponent,
    FooterComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'portfolio';
}
