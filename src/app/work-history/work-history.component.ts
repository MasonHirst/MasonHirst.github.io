import { Component, OnInit } from '@angular/core';
import { DataService } from '../data.service';
import { ExperienceModel } from '../landing-page/experience.model';

@Component({
  selector: 'app-work-history',
  templateUrl: './work-history.component.html',
  styleUrls: ['./work-history.component.css'],
})
export class WorkHistoryComponent implements OnInit {
  experiences: ExperienceModel[]
  isCollapsed: boolean = true;

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.experiences = this.dataService.getExperiences();
  }

  getDateDifference(date1: string, date2: string) {
    if (date2 === 'Present') {
      const [month1, year1] = date1.split(' ');
      const dateObj1 = new Date(`${month1} 1, ${year1}`);
      const dateObj2 = new Date();
      const diffInMonths =
        (dateObj2.getFullYear() - dateObj1.getFullYear()) * 12 +
        (dateObj2.getMonth() - dateObj1.getMonth());
      const years = Math.floor(diffInMonths / 12);
      const months = diffInMonths % 12;

      let result = '';
      if (years > 0) {
        result += `${years} ${years === 1 ? 'year' : 'years'}`;
      }
      if (months > 0) {
        result += ` ${months} ${months === 1 ? 'month' : 'months'}`;
      }
      if (months < 1 && years < 1) return '0 months'
      return result.trim();
    } else {
      const [month1, year1] = date1.split(' ');
      const [month2, year2] = date2.split(' ');
      const dateObj1 = new Date(`${month1} 1, ${year1}`);
      const dateObj2 = new Date(`${month2} 1, ${year2}`);
      const diffInMonths =
        (dateObj2.getFullYear() - dateObj1.getFullYear()) * 12 +
        (dateObj2.getMonth() - dateObj1.getMonth());
      const years = Math.floor(diffInMonths / 12);
      const months = diffInMonths % 12;

      let result = '';
      if (years > 0) {
        result += `${years} ${years === 1 ? 'year' : 'years'}`;
      }
      if (months > 0) {
        result += ` ${months} ${months === 1 ? 'month' : 'months'}`;
      }
      return result.trim();
    }
  }
}
