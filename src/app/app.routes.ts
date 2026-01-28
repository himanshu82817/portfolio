import { Routes } from '@angular/router';
import { AboutComponent } from './features/portfolio/components/about/about.component';
import { ExperienceComponent } from './features/portfolio/components/experience/experience.component';
import { ProjectsComponent } from './features/portfolio/components/projects/projects.component';
import { ContactComponent } from './features/portfolio/components/contact/contact.component';
import { BlogComponent } from './features/portfolio/components/blog/blog.component';
import { HeroComponent } from './features/portfolio/components/hero/hero.component';

export const routes: Routes = [
    {
        path: '',
        component:HeroComponent,
        data: { animation: 'home' }
    },
    {
        path: 'about',
        component:AboutComponent,
        data: { animation: 'about' }
    },
    {
        path: 'experience',
        component:ExperienceComponent,
        data: { animation: 'experience' }
    },
    {
        path: 'projects',
        component:ProjectsComponent,
        data: { animation: 'projects' }
    },
    {
        path: 'blog',
        component:BlogComponent,
        data: { animation: 'blog' }
    },
    {
        path: 'contact',
        component:ContactComponent,
        data: { animation: 'contact' }
    }
];
