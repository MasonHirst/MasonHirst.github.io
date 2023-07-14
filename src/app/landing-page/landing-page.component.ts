import { Component } from '@angular/core';
import { ExperienceModel } from './experience.model';
import { Project } from './project.model';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css'],
})
export class LandingPageComponent {
  experiences: ExperienceModel[] = [
    new ExperienceModel(
      'Full Stack Developer',
      'Fidelity Investments',
      'Salt Lake City, Utah',
      'Jul 2023',
      'Present',
      'I am currently working on a team developing a flow for onboarding new clients.'
    ),
    new ExperienceModel(
      'Software Engineer Intern',
      'Sparkz Development',
      'Pleasant Grove, Utah',
      'Jan 2023',
      'Jul 2023',
      'I particpated in an agile development team, developing a web platform for building and hosting client websites.'
    ),
    new ExperienceModel(
      'Student Developer',
      'Devmountain',
      'Lehi, Utah',
      'Jul 2022',
      'Jan 2023',
      'Attended a night-class course for learning the basics of web development. I then enrolled and completed the full-time program.'
    ),
    new ExperienceModel(
      'Sheets programmer',
      'CAL-MAT',
      'Sacramento, CA',
      'Jun 2021',
      'Jan 2022',
      'Developed spreadsheet formulas and structures for the California emergency medical services authority to help with tracking assetts.'
    ),
  ]

  projects: Project[] = [
    new Project(
      'Pokerface',
      'A scrum voting app for agile development teams. Join a game room with your team and vote on stories or tickets.',
      'https://res.cloudinary.com/dk9vsivmu/image/upload/v1689308270/Screenshot_2023-07-13_at_10.12.49_PM_xfert1.png',
      'https://pokerface.fly.dev/home',
      'https://github.com/MasonHirst/pokerface-meetings'
    ),
    new Project(
      'Kmail',
      'A recreation of the Gmail web app, along with a messaging feature. Utilizes an express backend with a socket server for live chats.',
      'https://res.cloudinary.com/dk9vsivmu/image/upload/v1689356433/Screenshot_2023-07-14_at_11.37.29_AM_j9nzmn.png',
      'https://kmail.fly.dev/',
      'https://github.com/MasonHirst/kmail-react-build'
    ),
    new Project(
      'Malena Hirst',
      "A portfolio and class signup website for my wife's brand, Malena Hirst. Built in React, with an express server and PostreSQL database.",
      'https://res.cloudinary.com/dk9vsivmu/image/upload/v1689358083/Screenshot_2023-07-14_at_12.07.28_PM_dmjsbp.png',
      'https://malenahirst.fly.dev',
      'https://github.com/MasonHirst/malena-website'
    )
  ]
}
