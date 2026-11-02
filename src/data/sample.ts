import type { Resume } from '../types'
import { blankResume } from './defaults'
import { uid } from '../utils'

/** Sample resume seeded from the owner's ITviec CV (Nguyen Van Hieu). */
export function sampleResume(): Resume {
  const r = blankResume('CV Nguyen Van Hieu – Full Stack')
  r.profile = {
    fullName: 'NGUYEN VAN HIEU',
    title: 'Full Stack Developer',
    email: 'auduongvanhieu@gmail.com',
    phone: '0392284283',
    birthday: '1996-01-05',
    address: 'TP Hồ Chí Minh',
    website: '',
    linkedin: '',
    github: '',
    photo: '/sample-photo.jpg',
  }
  r.summary = [
    '- Proficient in AI tools: n8n, OpenClaw, Claude,...',
    '- Over 5 years of experience working with backend: Golang, NodeJS, MySQL, MongoDB, Microservice, Redis, RabbitMQ',
    '- DevOps skills: Cloudflare, AWS, EC2, S3, CI/CD, Docker, Nginx, Domain management,...',
    '- Over 3 years of experience working with mobile platform: Android (Java, Kotlin), iOS (Swift), React Native',
    '- Worked as team leader for 2 projects',
    '- Proficient in using FE frameworks: Angular, ReactJS, NextJS,...',
    '- English: Basic conversational English',
    '- Some other technologies: Blockchain, Smart contract,...',
    '- Experienced in optimizing advertising campaigns.',
  ].join('\n')
  r.education = [
    {
      id: uid(),
      school: 'Ho Chi Minh City University of Industry and Trade',
      degree: 'Cử nhân',
      major: 'Information Technology',
      start: '2014-01',
      end: '2017-09',
      description: '',
    },
  ]
  r.skillGroups = [
    {
      id: uid(),
      name: 'Core skills',
      skills: [
        ['Database', 5, '5 năm'],
        ['Golang', 5, '5 năm'],
        ['JavaScript', 5, '5 năm'],
        ['MySQL', 5, '5 năm'],
        ['React Native', 5, '5 năm'],
        ['AWS', 4, '3 năm'],
        ['Cloud', 4, '3 năm'],
        ['Kotlin', 4, '3 năm'],
        ['Linux', 4, '3 năm'],
        ['AI', 3, '2 năm'],
        ['Android', 3, '2 năm'],
        ['DevOps', 3, '2 năm'],
      ].map(([name, level, years]) => ({ id: uid(), name: String(name), level: Number(level), years: String(years) })),
    },
  ]
  r.experience = [
    { company: 'Sem Foundry', position: 'Full Stack Developer', start: '2024-04', end: '', current: true },
    { company: 'Công Ty Cổ Phần Dịch Vụ Quản Lý CTM', position: 'Full Stack Developer', start: '2023-10', end: '2024-03', current: false },
    { company: 'Quang Trung Software', position: 'Mobile Apps Developer', start: '2020-05', end: '2023-09', current: false },
    { company: 'DXRES', position: 'Mobile Apps Developer', start: '2019-11', end: '2020-04', current: false },
    { company: 'Quang Trung Software', position: 'Mobile Apps Developer', start: '2019-07', end: '2019-10', current: false },
    { company: 'DSoft', position: 'Mobile Apps Developer', start: '2018-03', end: '2019-06', current: false },
    { company: 'Onsite at Cloud 9', position: 'Mobile Apps Developer', start: '2018-10', end: '2019-02', current: false },
    { company: 'Onsite at IVS', position: 'Mobile Apps Developer', start: '2018-03', end: '2018-09', current: false },
  ].map((e) => ({ id: uid(), description: '', ...e }))
  r.projects = [
    {
      name: 'B02',
      company: 'Sem Foundry (A startup company in Singapore)',
      role: 'Backend Developer, Frontend Developer, Researching AI tools, Optimize advertising campaigns',
      start: '2024-04',
      end: '2026-06',
      description:
        '- Project Description: Project to develop coin mining machine and mini games on Telegram bot\n- Programming Languages: Golang, TypeScript, PHP,...\n- Tools: Cursor, Windsurf, DBeaver,...\n- Used technologies and frameworks: MySQL, NextJS, Microservice, RabbitMQ, Redis, Amazon S3, TON Connect, Smart contract, PropellerAds, n8n, OpenClaw,...',
    },
    {
      name: 'CT Lotus',
      company: 'CTM',
      role: 'Mobile developer, Backend Developer, Frontend Developer',
      start: '2023-10',
      end: '2024-03',
      description:
        '- Project Description: Management system for buying and selling housing products\n- Programming Languages: React Native, TypeScript, NodeJS\n- Tools: Visual Studio Code, Xcode, Android Studio, Figma\n- Used technologies and frameworks: NestJS, TypeORM, CodePush, Angular,...',
    },
    {
      name: 'Zbox QL and Zbox KH',
      company: 'Freelancer',
      role: 'Mobile developer, Backend Developer, Manager, Designer',
      start: '2023-07',
      end: '2023-10',
      description:
        '- Project Description: Sleepbox system management application\n- Programming Languages: React Native, TypeScript, NodeJS\n- Tools: Visual Studio Code, Xcode, Android Studio, Figma\n- Used technologies and frameworks: VPS, Express, Sequelize, CodePush, Cloud Vision API,...',
    },
    {
      name: 'Hana Resolve',
      company: 'Quang Trung Software',
      role: 'Mobile developer, Backend Developer, Leader',
      start: '2023-03',
      end: '2023-06',
      description:
        '- Project Description: Chat application between User and Store to solve problems in life\n- Programming Languages: React Native, TypeScript, NodeJS\n- Tools: Visual Studio Code, Xcode, Android Studio, Figma\n- Used technologies and frameworks: AWS services (EC2, S3, Route53, Lambda), Microservice, CodePush, Sendbird chat library,...',
    },
    {
      name: 'Lifeon',
      company: 'Quang Trung Software',
      role: 'Mobile developer, Backend Developer, Leader',
      start: '2022-03',
      end: '2023-02',
      description:
        '- Project Description: The application connects interior designers with people in need of interior design, providing a commercial platform to sell interior products.\n- Programming Languages: React Native, TypeScript, NodeJS\n- Tools: Visual Studio Code, Xcode, Android Studio, Figma\n- Used technologies and frameworks: AWS services (EC2, S3, Route53, Lambda), Microservice, Social login (Facebook, Google, Zalo, Apple), CodePush, Chat and Call with Sendbird, Payment with Megapay (VNPT Epay),...',
    },
    {
      name: 'REPACE',
      company: 'Quang Trung Software',
      role: 'Mobile developer',
      start: '2021-11',
      end: '2022-03',
      description:
        '- Project Description: The application creates exercise schedules for users. It connects to a Bluetooth device, receives SpO2 and heart rate from the device, thereby providing a suitable exercise schedule for each person.\n- Programming Languages: Kotlin, Swift\n- Tools: Xcode, Android Studio\n- Used technologies and frameworks: Social Login (Google, Facebook, Apple), Bluetooth Low Energy,...',
    },
    {
      name: 'Dorphin',
      company: 'Quang Trung Software',
      role: 'Mobile developer, Backend Developer',
      start: '2021-07',
      end: '2021-11',
      description:
        '- Project Description: Short video viewing application similar to TikTok. The app detects the viewer\'s facial state to evaluate video quality.\n- Programming Languages: React Native, TypeScript, NodeJS\n- Tools: Visual Studio Code, Xcode, Android Studio\n- Used technologies and frameworks: Video player, Face detection camera, CodePush,...',
    },
    {
      name: 'Jim Cons and Jim User',
      company: 'Quang Trung Software',
      role: 'Mobile developer, Backend Developer',
      start: '2020-11',
      end: '2021-06',
      description:
        '- Project Description: The application connects customers and consultants in arranging and decorating home items in a reasonable way.\n- Programming Languages: React Native, TypeScript, NodeJS\n- Tools: Visual Studio Code, Xcode, Android Studio\n- Used technologies and frameworks: CodePush, Chat with Firebase,...',
    },
    {
      name: 'Idorm QL and Idorm SV',
      company: 'Quang Trung Software',
      role: 'Mobile developer',
      start: '2020-05',
      end: '2020-10',
      description:
        '- Project Description: Student management system of Vietnam National University, Ho Chi Minh City: register to rent a room online, receive notifications from the dormitory management center, pay monthly fees for boarding, electricity and water directly on the app,...\n- Programming Languages: React Native, JavaScript\n- Tools: Visual Studio Code, Xcode, Android Studio\n- Used technologies and frameworks: Redux, Redux Saga, CodePush,...',
    },
    {
      name: 'Dxdrex',
      company: 'DXRES',
      role: 'Android developer',
      start: '2019-11',
      end: '2020-04',
      description:
        '- Project Description: Real estate trading application\n- Programming Languages: Java\n- Tools: Android Studio\n- Used technologies and frameworks: MVVM, Chat and Call with Stringee, Google Maps,...',
    },
    {
      name: 'Mosiler App',
      company: 'Quang Trung Software',
      role: 'Mobile developer',
      start: '2019-04',
      end: '2019-10',
      description:
        '- Project Description: App to book a company car in Korea\n- Programming Languages: React Native, JavaScript\n- Tools: Visual Studio Code, Xcode, Android Studio\n- Used technologies and frameworks: Redux, Redux Saga, Naver Map,...',
    },
    {
      name: 'Madocon Okinawa & Kyushu Project',
      company: 'Onsite at Cloud 9',
      role: 'Mobile developer',
      start: '2018-11',
      end: '2019-03',
      description:
        '- Project Description: An app introducing the Okinawa and Kyushu tours in Japan. The app tracks the user\'s current location and displays matching content: images, audio, video, VR, AR,...\n- Programming Languages: Java, C#\n- Tools: Android Studio, Unity,...\n- Used technologies and frameworks: API, MVVM, Unity,...',
    },
    {
      name: 'ALSI_WMS',
      company: 'Onsite at IVS',
      role: 'Developer',
      start: '2018-03',
      end: '2018-10',
      description:
        '- Project Description: Supply chain system, import and export warehouse, built to the requirements of Japanese customers.\n- Programming Languages: Java, SQL, JavaScript\n- Tools: Logic Designer, MS SQL Server,...\n- Used technologies and frameworks: API, intra-mart Accel Platform,...',
    },
    {
      name: 'aLego Management System',
      company: 'DSoft',
      role: 'Mobile developer',
      start: '2017-10',
      end: '2018-03',
      description:
        '- Project Description: A fresh food distribution system based on IoT. Each product is identified by barcode (bCode) and its status is updated in real time across logistics, sales, delivery and customer care.\n- Programming Languages: Java\n- Tools: Android Studio\n- Used technologies and frameworks: API, MVVM,...',
    },
  ].map((p) => ({ id: uid(), link: '', ...p }))
  r.languages = [
    { id: uid(), name: 'Tiếng Việt', level: 'Bản ngữ' },
    { id: uid(), name: 'English', level: 'Basic conversational' },
  ]
  return r
}
