import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-experience',
  imports: [CommonModule],
  templateUrl: './experience.component.html',
  styleUrl: './experience.component.css'
})
export class ExperienceComponent {
  activeitem:number = 0;
  experiences = [
    {
      company:'Almondz Global Securities Ltd',
      logo:'assets/companies/almondz.png',
      gallery:[],
      timePeriod:'June 2021 - September 2022',
      about:'Lorem ipsum dolor sit amet consectetur adipisicing elit. Vitae nesciunt architecto ea beatae ullam alias vero maiores veniam eveniet! Vitae porro veritatis quae sed hic placeat, ipsa autem distinctio ex rem ullam harum quo quidem natus laborum labore inventore in nobis. Nostrum veritatis consequuntur ducimus maxime molestias blanditiis error optio, repellat quisquam pariatur sed consectetur quae. Fuga cupiditate, inventore velit quo ab repellendus minus sint! Eos consequuntur fugit natus debitis voluptatem non harum ullam, repudiandae eius placeat nesciunt illum temporibus mollitia at delectus repellendus quo aliquam maiores magni neque corporis minus fuga molestias. Corporis recusandae minus reiciendis eveniet consectetur cupiditate mollitia expedita a! Incidunt autem assumenda dolorum, illo ipsam officia, vel eum quod provident repudiandae deserunt sunt fuga nesciunt quasi commodi eos! Reiciendis ipsum architecto modi incidunt assumenda minima ipsam laboriosam quibusdam perferendis soluta. Esse fuga vel temporibus voluptatem ducimus enim repudiandae debitis molestias tempore, saepe ab consectetur odio excepturi placeat mollitia laborum rerum maxime, delectus impedit cupiditate? Sapiente ad deserunt maxime et accusantium voluptatem, vitae placeat. Cumque hic dignissimos recusandae sit deleniti. Nisi pariatur placeat optio architecto natus quos quasi inventore esse aspernatur ab possimus consequatur ipsam, culpa facilis explicabo, aut nesciunt fugit voluptas numquam, consectetur laborum officia. Quia nulla totam non expedita debitis. Aspernatur perferendis ad nulla blanditiis, dolorum sequi iusto a optio, exercitationem, officia illo nihil magnam hic? In perferendis quibusdam, quidem ut hic distinctio molestiae earum explicabo facere quisquam. Accusantium ea laboriosam nemo ipsam officiis eligendi incidunt, voluptas odit itaque, ad vitae quas harum assumenda aliquam necessitatibus quod deleniti exercitationem. Illo necessitatibus magnam, cupiditate aliquam enim repellendus nam saepe deleniti impedit, inventore, voluptatibus at repudiandae obcaecati officia molestiae earum unde eius sint nisi quaerat! Voluptatem voluptatum et autem accusamus quasi fugiat enim sapiente quod sed, ullam ipsum, sit quidem doloribus magni similique minus odio numquam eligendi.'
      
    },
    {
      company:'iTech Mission Private Limited (iTM)',
      logo:'assets/companies/itm.png',
      gallery:[],
      timePeriod:'September 2022 - August 2023',
      about:'Lorem ipsum dolor sit ! Vitae porro veritatis quae sed hic placeat, ipsa autem distinctio ex rem ullam harum quo quidem natus laborum labore inventore in nobis. Nostrum veritatis consequuntur ducimus maxime molestias blanditiis error optio, repellat quisquam pariatur sed consectetur quae. Fuga cupiditate, inventore velit quo ab repellendus minus sint! Eos consequuntur fugit natus debitis voluptatem non harum ullam, repudiandae eius placeat nesciunt illum temporibus mollitia at delectus repellendus quo aliquam maiores magni neque corporis minus fuga molestias. Corporis recusandae minus reiciendis eveniet consectetur cupiditate mollitia expedita a! Incidunt autem assumenda dolorum, illo ipsam officia, vel eum quod provident repudiandae deserunt sunt fuga nesciunt quasi commodi eos! Reiciendis ipsum architecto modi incidunt assumenda minima ipsam laboriosam quibusdam perferendis soluta. Esse fuga vel temporibus voluptatem ducimus enim repudiandae debitis molestias tempore, saepe ab consectetur odio excepturi placeat mollitia laborum rerum maxime, delectus impedit cupiditate? Sapiente ad deserunt maxime et accusantium voluptatem, vitae placeat. Cumque hic dignissimos recusandae sit deleniti. Nisi pariatur placeat optio architecto natus quos quasi inventore esse aspernatur ab possimus consequatur ipsam, culpa facilis explicabo, aut nesciunt fugit voluptas numquam, consectetur laborum officia. Quia nulla totam non expedita debitis. Aspernatur perferendis ad nulla blanditiis, dolorum sequi iusto a optio, exercitationem, officia illo nihil magnam hic? In perferendis quibusdam, quidem ut hic distinctio molestiae earum explicabo facere quisquam. Accusantium ea laboriosam nemo ipsam officiis eligendi incidunt, voluptas odit itaque, ad vitae quas harum assumenda aliquam necessitatibus quod deleniti exercitationem. Illo necessitatibus magnam, cupiditate aliquam enim repellendus nam saepe deleniti impedit, inventore, voluptatibus at repudiandae obcaecati officia molestiae earum unde eius sint nisi quaerat! Voluptatem voluptatum et autem accusamus quasi fugiat enim sapiente quod sed, ullam ipsum, sit quidem doloribus magni similique minus odio numquam eligendi.'
      
    },
    {
      company:'SMC Finance',
      logo:'assets/companies/smc.png',
      gallery:[],
      timePeriod:'October 2023 - working',
      about:'Lorem ipsum dolor sit amet consectetur adipisicing elit. Vitae nesciunt architecto ea beat hic placeat, ipsa autem distinctio ex rem ullam harum quo quidem natus blanditiis error optio, repellat quisquam pariatur sed consectetur quae. Fuga cupiditate, inventore velit quo ab repellendus minus sint! Eos consequuntur fugit natus debitis voluptatem non harum ullam, repudiandae eius placeat nesciunt illum temporibus mollitia at delectus repellendus quo aliquam maiores magni neque corporis minus fuga molestias. Corporis recusandae minus reiciendis eveniet consectetur cupiditate mollitia expedita a! Incidunt autem assumenda dolorum, illo ipsam officia, vel eum quod provident repudiandae deserunt sunt fuga nesciunt quasi commodi eos! Reiciendis ipsum architecto modi incidunt assumenda minima ipsam laboriosam quibusdam perferendis soluta. Esse fuga vel temporibus voluptatem ducimus enim repudiandae debitis molestias tempore, saepe ab consectetur odio excepturi placeat mollitia laborum rerum maxime, delectus impedit cupiditate? Sapiente ad deserunt maxime et accusantium voluptatem, vitae placeat. Cumque hic dignissimos recusandae sit deleniti. Nisi pariatur placeat optio architecto natus quos quasi inventore esse aspernatur ab possimus consequatur ipsam, culpa facilis explicabo, aut nesciunt fugit voluptas numquam, consectetur laborum officia. Quia nulla totam non expedita debitis. Aspernatur perferendis ad nulla blanditiis, dolorum sequi iusto a optio, exercitationem, officia illo nihil magnam hic? In perferendis quibusdam, quidem ut hic distinctio molestiae earum explicabo facere quisquam. Accusantium ea laboriosam nemo ipsam officiis eligendi incidunt, voluptas odit itaque, ad vitae quas harum assumenda aliquam necessitatibus quod deleniti exercitationem. Illo necessitatibus magnam, cupiditate aliquam enim repellendus nam saepe deleniti impedit, inventore, voluptatibus at repudiandae obcaecati officia molestiae earum unde eius sint nisi quaerat! Voluptatem voluptatum et autem accusamus quasi fugiat enim sapiente quod sed, ullam ipsum, sit quidem doloribus magni similique minus odio numquam eligendi.'
      
    }
  ]
}
