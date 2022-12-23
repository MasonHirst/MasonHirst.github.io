const bioBtn = document.getElementById('bio-btn')
const contactBtn = document.getElementById('contact-btn')
const projectsBtn = document.getElementById('projects-btn')
const skillsBtn = document.getElementById('skills-btn')
const titleBtn = document.getElementById('title-btn')
const bioDiv = document.getElementById('bio-div')
const contactDiv = document.getElementById('contact-div')
const projectsDiv = document.getElementById('projects-div')
const skillsDiv = document.getElementById('skills-div')

const hideAll = () => {
   bioDiv.classList.add('hide')
   contactDiv.classList.add('hide')
   projectsDiv.classList.add('hide')
   skillsDiv.classList.add('hide')
}

bioBtn.addEventListener('click', () => {
   hideAll()
   bioDiv.classList.remove('hide')
})

contactBtn.addEventListener('click', () => {
   hideAll()
   contactDiv.classList.remove('hide')
})

projectsBtn.addEventListener('click', () => {
   hideAll()
   projectsDiv.classList.remove('hide')
})

skillsBtn.addEventListener('click', () => {
   hideAll()
   skillsDiv.classList.remove('hide')
})

titleBtn.addEventListener('click', () => {
   hideAll()
   bioDiv.classList.remove('hide')
})