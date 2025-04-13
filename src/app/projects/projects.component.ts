import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-projects',
  imports: [CommonModule],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.css'
})
export class ProjectsComponent {
    activeItem = -1;

    projects = [
      {
        images:[
          "assets/profile.png"
        ],
        heading:'Loan Origination System (SMC Finance)',
        techStack:[
          {
            name:"Angular",
            icon:"assets/skills/Angular.png"
          },
          {
            name:"NestJS",
            icon:"assets/skills/Nestjs.png"
          },
          {
            name:"SQL Server",
            icon:"assets/skills/SQLServer.png"
          },
          {
            name:"GCP",
            icon:"assets/skills/GCP.png"
          },
          {
            name:"TypeORM",
            icon:"assets/skills/Typeorm.png"
          },
        ],
        about:{
          description:"Worked as a Full Stack Developer on a robust Loan Origination System (LOS) tailored for internal teams at SMC Finance. The platform streamlined the loan processing workflow—from lead creation to approval and disbursement—enhancing efficiency and compliance."
        },
        contributions:[
          "Developed and maintained multiple modules including Lead Management, Document Verification, Credit Analysis, and Loan Approval.",
          "Designed and implemented dynamic forms using Angular Reactive Forms for customer onboarding.",
          "Built secure and scalable RESTful APIs in NestJS for data validation, document storage, and workflow automation.",
          "Integrated SQL Server using TypeORM, optimizing queries and managing relationships between loan applications, users, and transactions.",
          "Collaborated with credit teams to build custom dashboards for tracking application status and KPIs.",
          "Deployed modules on Google Cloud Platform, ensuring availability and reliability.",
        ],
        summery:'This system significantly reduced manual processing, minimized errors, and improved turnaround time for loan approvals.'
      },
      {
        images:[
          "assets/profile.png"
        ],
        heading:'Loan Origination System (SMC Finance)',
        techStack:[
          {
            name:"Angular",
            icon:"assets/skills/Angular.png"
          },
          {
            name:"NestJS",
            icon:"assets/skills/Nestjs.png"
          },
          {
            name:"SQL Server",
            icon:"assets/skills/SQLServer.png"
          },
          {
            name:"GCP",
            icon:"assets/skills/GCP.png"
          },
          {
            name:"TypeORM",
            icon:"assets/skills/Typeorm.png"
          },
        ],
        about:{
          description:"Worked as a Full Stack Developer on a robust Loan Origination System (LOS) tailored for internal teams at SMC Finance. The platform streamlined the loan processing workflow—from lead creation to approval and disbursement—enhancing efficiency and compliance."
        },
        contributions:[
          "Developed and maintained multiple modules including Lead Management, Document Verification, Credit Analysis, and Loan Approval.",
          "Designed and implemented dynamic forms using Angular Reactive Forms for customer onboarding.",
          "Built secure and scalable RESTful APIs in NestJS for data validation, document storage, and workflow automation.",
          "Integrated SQL Server using TypeORM, optimizing queries and managing relationships between loan applications, users, and transactions.",
          "Collaborated with credit teams to build custom dashboards for tracking application status and KPIs.",
          "Deployed modules on Google Cloud Platform, ensuring availability and reliability.",
        ],
        summery:'This system significantly reduced manual processing, minimized errors, and improved turnaround time for loan approvals.'
      },
      {
        images:[
          "assets/profile.png"
        ],
        heading:'Loan Origination System (SMC Finance)',
        techStack:[
          {
            name:"Angular",
            icon:"assets/skills/Angular.png"
          },
          {
            name:"NestJS",
            icon:"assets/skills/Nestjs.png"
          },
          {
            name:"SQL Server",
            icon:"assets/skills/SQLServer.png"
          },
          {
            name:"GCP",
            icon:"assets/skills/GCP.png"
          },
          {
            name:"TypeORM",
            icon:"assets/skills/Typeorm.png"
          },
        ],
        about:{
          description:"Worked as a Full Stack Developer on a robust Loan Origination System (LOS) tailored for internal teams at SMC Finance. The platform streamlined the loan processing workflow—from lead creation to approval and disbursement—enhancing efficiency and compliance."
        },
        contributions:[
          "Developed and maintained multiple modules including Lead Management, Document Verification, Credit Analysis, and Loan Approval.",
          "Designed and implemented dynamic forms using Angular Reactive Forms for customer onboarding.",
          "Built secure and scalable RESTful APIs in NestJS for data validation, document storage, and workflow automation.",
          "Integrated SQL Server using TypeORM, optimizing queries and managing relationships between loan applications, users, and transactions.",
          "Collaborated with credit teams to build custom dashboards for tracking application status and KPIs.",
          "Deployed modules on Google Cloud Platform, ensuring availability and reliability.",
        ],
        summery:'This system significantly reduced manual processing, minimized errors, and improved turnaround time for loan approvals.'
      },
      {
        images:[
          "assets/profile.png"
        ],
        heading:'Loan Origination System (SMC Finance)',
        techStack:[
          {
            name:"Angular",
            icon:"assets/skills/Angular.png"
          },
          {
            name:"NestJS",
            icon:"assets/skills/Nestjs.png"
          },
          {
            name:"SQL Server",
            icon:"assets/skills/SQLServer.png"
          },
          {
            name:"GCP",
            icon:"assets/skills/GCP.png"
          },
          {
            name:"TypeORM",
            icon:"assets/skills/Typeorm.png"
          },
        ],
        about:{
          description:"Worked as a Full Stack Developer on a robust Loan Origination System (LOS) tailored for internal teams at SMC Finance. The platform streamlined the loan processing workflow—from lead creation to approval and disbursement—enhancing efficiency and compliance."
        },
        contributions:[
          "Developed and maintained multiple modules including Lead Management, Document Verification, Credit Analysis, and Loan Approval.",
          "Designed and implemented dynamic forms using Angular Reactive Forms for customer onboarding.",
          "Built secure and scalable RESTful APIs in NestJS for data validation, document storage, and workflow automation.",
          "Integrated SQL Server using TypeORM, optimizing queries and managing relationships between loan applications, users, and transactions.",
          "Collaborated with credit teams to build custom dashboards for tracking application status and KPIs.",
          "Deployed modules on Google Cloud Platform, ensuring availability and reliability.",
        ],
        summery:'This system significantly reduced manual processing, minimized errors, and improved turnaround time for loan approvals.'
      },
      {
        images:[
          "assets/profile.png"
        ],
        heading:'Loan Origination System (SMC Finance)',
        techStack:[
          {
            name:"Angular",
            icon:"assets/skills/Angular.png"
          },
          {
            name:"NestJS",
            icon:"assets/skills/Nestjs.png"
          },
          {
            name:"SQL Server",
            icon:"assets/skills/SQLServer.png"
          },
          {
            name:"GCP",
            icon:"assets/skills/GCP.png"
          },
          {
            name:"TypeORM",
            icon:"assets/skills/Typeorm.png"
          },
        ],
        about:{
          description:"Worked as a Full Stack Developer on a robust Loan Origination System (LOS) tailored for internal teams at SMC Finance. The platform streamlined the loan processing workflow—from lead creation to approval and disbursement—enhancing efficiency and compliance."
        },
        contributions:[
          "Developed and maintained multiple modules including Lead Management, Document Verification, Credit Analysis, and Loan Approval.",
          "Designed and implemented dynamic forms using Angular Reactive Forms for customer onboarding.",
          "Built secure and scalable RESTful APIs in NestJS for data validation, document storage, and workflow automation.",
          "Integrated SQL Server using TypeORM, optimizing queries and managing relationships between loan applications, users, and transactions.",
          "Collaborated with credit teams to build custom dashboards for tracking application status and KPIs.",
          "Deployed modules on Google Cloud Platform, ensuring availability and reliability.",
        ],
        summery:'This system significantly reduced manual processing, minimized errors, and improved turnaround time for loan approvals.'
      },
      {
        images:[
          "assets/profile.png"
        ],
        heading:'Loan Origination System (SMC Finance)',
        techStack:[
          {
            name:"Angular",
            icon:"assets/skills/Angular.png"
          },
          {
            name:"NestJS",
            icon:"assets/skills/Nestjs.png"
          },
          {
            name:"SQL Server",
            icon:"assets/skills/SQLServer.png"
          },
          {
            name:"GCP",
            icon:"assets/skills/GCP.png"
          },
          {
            name:"TypeORM",
            icon:"assets/skills/Typeorm.png"
          },
        ],
        about:{
          description:"Worked as a Full Stack Developer on a robust Loan Origination System (LOS) tailored for internal teams at SMC Finance. The platform streamlined the loan processing workflow—from lead creation to approval and disbursement—enhancing efficiency and compliance."
        },
        contributions:[
          "Developed and maintained multiple modules including Lead Management, Document Verification, Credit Analysis, and Loan Approval.",
          "Designed and implemented dynamic forms using Angular Reactive Forms for customer onboarding.",
          "Built secure and scalable RESTful APIs in NestJS for data validation, document storage, and workflow automation.",
          "Integrated SQL Server using TypeORM, optimizing queries and managing relationships between loan applications, users, and transactions.",
          "Collaborated with credit teams to build custom dashboards for tracking application status and KPIs.",
          "Deployed modules on Google Cloud Platform, ensuring availability and reliability.",
        ],
        summery:'This system significantly reduced manual processing, minimized errors, and improved turnaround time for loan approvals.'
      },
    ]


    readMore(index:number){
      this.activeItem = index
    }

    clear(){
      this.activeItem = -1
    }
}
