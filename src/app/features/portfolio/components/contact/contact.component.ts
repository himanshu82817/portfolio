import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Imported for form handling

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.component.html',
  styles: []
})
export class ContactComponent {
  
  formData = {
    name: '',
    email: '',
    message: ''
  };

  onSubmit() {
    // Here you would typically connect to an email service (like EmailJS or a backend)
    console.log('Form Submitted:', this.formData);
    alert('Thanks for reaching out! This is a demo form.');
  }
}