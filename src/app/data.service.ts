import { Injectable } from '@angular/core';
import { Project } from './projects-page/project.model';
import { ExperienceModel } from './landing-page/experience.model';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  experiences: ExperienceModel[] = [
    new ExperienceModel(
      true,
      'Full Stack Developer',
      'Fidelity Investments',
      'https://res.cloudinary.com/dk9vsivmu/image/upload/v1689656944/Screenshot_2023-07-17_at_11.08.01_PM_vueaa4.png',
      'Salt Lake City, Utah',
      'Jul 2023',
      'Present',
      'I am currently working on a team to improve and expand the money-transferring experience for web clients.',
      [
        'I am currently working on a team to improve and expand the money-transferring experience for web clients.',
      ]
    ),
    new ExperienceModel(
      true,
      'Junior Software Developer',
      'Sparkz Development',
      'https://res.cloudinary.com/dk9vsivmu/image/upload/v1689657359/sparkz-logo_gqcisu.png',
      'Pleasant Grove, Utah',
      'Jan 2023',
      'Jul 2023',
      'I participated in an agile development team, developing a web platform for building and hosting client websites.',
      [
        'Contributed to the development of Sparkz Cloud (web application for building / managing websites) in order to add features for a better/optimized user experience.',
        'Built several websites for different clients using Sparkz Cloud and CSS to help find bugs in the software and transition clients to our services.',
        'Optimized and updated the code in several websites to be mobile-friendly and look presentable on all screen sizes to ensure all website visitors have a professional experience.',
      ]
    ),
    new ExperienceModel(
      true,
      'Student Developer',
      'Devmountain',
      'https://res.cloudinary.com/dk9vsivmu/image/upload/v1689657549/devmountain-logo_my7756.png',
      'Lehi, Utah',
      'Jul 2022',
      'Jan 2023',
      'Attended a night-class course for learning the basics of web development. I then enrolled and completed the full-time program.',
      [
        'Developed a SPA using React that acts as a social platform for dad-jokes, in order to allow users to submit jokes and interact with jokes from other users.',
        'Provided a complete and secure authentication system using password-validator, JWT, bcrypt, and a OTP email system for recovering passwords in order to provide users a complete account system.',
        'Integrated the SendInBlue api to enable the server to email users important info, such as one-time-passwords in order to ensure users had valid emails and increase security.',
        'Styled the app after auth0’s authentication pages using the Material UI library in order to make an industry standard login page, and improve the page’s responsiveness to user activity.',
      ]
    ),
    new ExperienceModel(
      false,
      'Lumber Associate',
      'Home Depot',
      'https://res.cloudinary.com/dk9vsivmu/image/upload/v1689697716/home-depot-logo_aout2p.png',
      'American Fork, UT',
      'Feb 2022',
      'Nov 2022',
      'Maintained the department by cutting lumber for customers, restocking with a forklift, and answering questions.',
      [
        'Increased sales by preemptively restocking products with a forklift to ensure availability for customers.',
        'Organized and tracked stock using zebra scanners and softphone technologies to increase efficiency.',
        'Developed skill in understanding customer needs through experience and careful listening to ensure I was offering the correct help.',
      ]
      ),
      new ExperienceModel(
        true,
        'Sheets Programmer',
        'CAL-MAT',
        'https://res.cloudinary.com/dk9vsivmu/image/upload/v1689657647/CAL-MAT-logo_stclag.png',
        'Sacramento, CA',
        'Jun 2021',
        'Jan 2022',
        'Developed spreadsheet formulas and structures for the California emergency medical services authority to help with tracking assetts.',
        [
          'Helped create a database for the State of California using Google Sheets to enable users to filter and effectively track millions of pieces of emergency medical equipment.',
          'Oversaw proper equipment tracking as the database lead in the Biomedical department to maintain organization.',
          'Loaded trucks and organized overhead racking by operating stand-up and sit-down forklifts to enable CAL-MAT to respond quickly to emergencies.',
        ]
      ),
    new ExperienceModel(
      false,
      'Compactor Technician',
      'Northwest Compacting',
      'https://res.cloudinary.com/dk9vsivmu/image/upload/v1689697716/northwest-compacting-logo_fmgjbj.jpg',
      'Sacramento, CA',
      'Nov 2020',
      'Jul 2021',
      'Repaired and refurbished industrial compactors to resell, or to fulfill customer needs.',
      [
        'Repaired and serviced compactors in response to service calls to enable clients to run operations normally.',
        'Repaired and renovated compactors in a shop setting, using welders, torch cutters, plasma cutters, metal fabrication, electrical repair, assembling manifolds, and fixing hydraulics, to maximize company profits.',
        'Operated large forklifts and equipment to move industrial compactors to ensure client needs were met on time.',
      ]
    ),
    new ExperienceModel(
      false,
      'Full-time Missionary',
      'Church of Jesus Christ of Latter Day Saints',
      'https://res.cloudinary.com/dk9vsivmu/image/upload/v1689697825/church-text-logo_aenpr0.png',
      'Minneapolis, MN',
      'Nov 2018',
      'Nov 2020',
      'Served a two year mission in various areas throughout Wisconsin and Minnesota, teaching people about Jesus Christ.',
      [
        'Served a two year mission in various areas throughout Wisconsin and Minnesota, teaching people about Jesus Christ',
        'Learned how to teach effectively by working to make religious lessons easier to understand, and by teaching four new missionaries how to work effectively in the mission field.',
        'Served in Missionary leadership positions, where I worked to ensure time and efforts were spent as efficiently as possible.',
      ]
    ),
    new ExperienceModel(
      false,
      'Service Champion',
      'Border Foods',
      'https://res.cloudinary.com/dk9vsivmu/image/upload/v1689697716/border-foods-logo_qfxlx3.png',
      'Sacramento, CA',
      'Feb 2018',
      'Nov 2018',
      'Developed skills in multitasking and working efficiently/effectively to keep pace with the food service industry.',
      [
        'Developed skills in multitasking and working efficiently/effectively to keep pace with the food service industry.',
        'Maintained efficient service speeds using POS technologies to ensure customers were served quickly and accurately.',
        'Increased ability to memorize recipes and protocols through repetition to ensure a consistent customer experience.',
      ]
    ),
  ];

  projects: Project[] = [
    new Project(
      'Pokerface',
      'pokerface',
      'A scrum voting app for agile development teams. Join a game room with your team and vote on stories or tickets.',
      'I followed many designs and UI flows from planningpokeronline.com in order to practice creating modern and clean web apps.',
      'https://res.cloudinary.com/dk9vsivmu/image/upload/v1689308270/Screenshot_2023-07-13_at_10.12.49_PM_xfert1.png',
      'https://res.cloudinary.com/dk9vsivmu/image/upload/v1689621644/Screenshot_2023-07-17_at_1.20.06_PM_et9vyc.png',
      'https://pokerface.fly.dev/',
      'https://github.com/MasonHirst/pokerface-meetings',
      true,
    ),
    new Project(
      'Kmail',
      'kmail',
      'A recreation of the Gmail web app, along with a messaging feature. Utilizes an express backend with a socket server for live chats.',
      'I utilized Material UI with React to create a UI similar to Google in order to practice professional and responsive design.',
      'https://res.cloudinary.com/dk9vsivmu/image/upload/v1689356433/Screenshot_2023-07-14_at_11.37.29_AM_j9nzmn.png',
      'https://res.cloudinary.com/dk9vsivmu/image/upload/v1689621804/Screenshot_2023-07-17_at_1.21.51_PM_qp6md9.png',
      'https://kmail.fly.dev/',
      'https://github.com/MasonHirst/kmail-react-build',
      true,
    ),
    new Project(
      'Malena Hirst',
      'malena-hirst',
      "A portfolio and class signup website for my wife's brand, Malena Hirst. Built in React, with an express server and PostreSQL database.",
      'This website features a dynamic form for adding participants, and uses the SendInBlue API to email signup details to the participant and the class instructor.',
      'https://res.cloudinary.com/dk9vsivmu/image/upload/v1689358083/Screenshot_2023-07-14_at_12.07.28_PM_dmjsbp.png',
      'https://res.cloudinary.com/dk9vsivmu/image/upload/v1689623098/Screenshot_2023-07-17_at_1.44.37_PM_tkyyvh.png',
      'https://malenahirst.fly.dev',
      'https://github.com/MasonHirst/malena-website',
      false,
    ),
    new Project(
      'Haven Homeless Shelter',
      'haven-homeless-shelter',
      'My Sparkz Dev internship asked me to build this app to learn the Vue framework, and to test my coding abilities.',
      'This project uses Vue and a Docker local database to manage residents at a homeless shelter',
      'https://res.cloudinary.com/dk9vsivmu/image/upload/v1689700047/haven-shelter-thumbnail_xlwwda.png',
      'https://res.cloudinary.com/dk9vsivmu/image/upload/v1690315250/Screenshot_2023-07-25_at_1.46.51_PM_yv53lo.png',
      '',
      'https://github.com/MasonHirst/homeless-shelter-vue-project',
      false,
    ),
    new Project(
      'Dad Joke Generator',
      'dad-joke-generator',
      'A project to learn about secure authentication and account recovery practices. Create an account and start cringing!',
      'This project used a React front-end with Material UI, and a Node.js backend with a PostgreSQL database, and JWT processes for authentication.',
      'https://res.cloudinary.com/dk9vsivmu/image/upload/v1689628327/Screenshot_2023-07-17_at_3.08.35_PM_cn2csd.png',
      'https://res.cloudinary.com/dk9vsivmu/image/upload/v1689628327/Screenshot_2023-07-17_at_3.08.55_PM_a9vopo.png',
      'https://dad-joke-generator.fly.dev',
      'https://github.com/MasonHirst/dad-joke-generator-capstone',
      false,
    ),
  ];

  getProjects() {
    return this.projects.slice();
  }

  getProject(path: String) {
    return this.projects.filter((proj) => proj.path === path)[0];
  }

  getExperiences() {
    return this.experiences.slice();
  }

  constructor() {}
}
