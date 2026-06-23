/* global Buffer, process */

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'

function loadEnvFile(fileName) {
  if (!existsSync(fileName)) return

  const lines = readFileSync(fileName, 'utf8').split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue
    }

    const [key, ...valueParts] = trimmed.split('=')
    const value = valueParts.join('=').replace(/^["']|["']$/g, '')

    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env')

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const demoCustomerEmail = process.env.DEMO_CUSTOMER_EMAIL

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

const demoJobs = [
  {
    title: 'Frontend Developer',
    description:
      'Build responsive React interfaces, work with APIs, and improve dashboard workflows. Experience with JavaScript, React, CSS, and Git is important.',
    status: 'open',
  },
  {
    title: 'Customer Support Specialist',
    description:
      'Help customers solve product issues, write clear support replies, and document recurring problems for the product team.',
    status: 'open',
  },
  {
    title: 'Backend Developer',
    description:
      'Build secure APIs, database queries, and server-side integrations. Experience with Node.js, SQL, authentication, and cloud deployment is important.',
    status: 'open',
  },
  {
    title: 'UX Designer',
    description:
      'Design practical product flows, wireframes, and polished UI for recruiting software. Experience with user research, Figma, and design systems is important.',
    status: 'open',
  },
  {
    title: 'Recruitment Coordinator',
    description:
      'Coordinate interviews, manage candidate communication, update hiring pipelines, and support recruiters with scheduling and documentation.',
    status: 'open',
  },
  {
    title: 'Full Stack Intern',
    description:
      'Support small frontend and backend tasks in a React and Supabase application. Good learning attitude, basic JavaScript, and Git knowledge are required.',
    status: 'closed',
  },
]

const demoCandidates = [
  {
    name: 'Sara Andersson',
    email: 'sara.andersson@example.com',
    linkedin_url: 'https://www.linkedin.com/in/sara-andersson-demo',
    notes: 'Demo candidate with frontend experience.',
    cvFileName: 'sara-andersson-cv.pdf',
    cvText:
      'Sara Andersson\nFrontend Developer\n\nExperience\n- Built React dashboards for internal tools.\n- Worked with REST APIs, Supabase, JavaScript, HTML, and CSS.\n- Improved responsive layouts and accessibility.\n\nSkills\nReact, JavaScript, CSS, Git, API integration, UI development.',
    jobTitle: 'Frontend Developer',
    stage: 'screening',
  },
  {
    name: 'Jonas Lind',
    email: 'jonas.lind@example.com',
    linkedin_url: 'https://www.linkedin.com/in/jonas-lind-demo',
    notes: 'Demo candidate with support and communication background.',
    cvFileName: 'jonas-lind-cv.pdf',
    cvText:
      'Jonas Lind\nCustomer Support Specialist\n\nExperience\n- Managed support tickets and live chat for SaaS customers.\n- Wrote help center articles and escalated product bugs.\n- Strong written communication and customer empathy.\n\nSkills\nCustomer support, documentation, troubleshooting, communication.',
    jobTitle: 'Customer Support Specialist',
    stage: 'new',
  },
  {
    name: 'Maya Novak',
    email: 'maya.novak@example.com',
    linkedin_url: 'https://www.linkedin.com/in/maya-novak-demo',
    notes: 'Demo candidate with backend API experience.',
    cvFileName: 'maya-novak-cv.pdf',
    cvText:
      'Maya Novak\nBackend Developer\n\nExperience\n- Built Node.js APIs for customer-facing applications.\n- Worked with PostgreSQL, authentication, serverless functions, and deployment pipelines.\n- Improved API validation and error handling.\n\nSkills\nNode.js, SQL, PostgreSQL, authentication, REST APIs, deployment.',
    jobTitle: 'Backend Developer',
    stage: 'interview',
  },
  {
    name: 'Elias Berg',
    email: 'elias.berg@example.com',
    linkedin_url: 'https://www.linkedin.com/in/elias-berg-demo',
    notes: 'Demo candidate with product design background.',
    cvFileName: 'elias-berg-cv.pdf',
    cvText:
      'Elias Berg\nUX Designer\n\nExperience\n- Designed dashboards, forms, and workflow tools for SaaS products.\n- Created wireframes, prototypes, and design system components in Figma.\n- Ran usability interviews and translated feedback into product improvements.\n\nSkills\nFigma, UX research, wireframes, UI design, design systems.',
    jobTitle: 'UX Designer',
    stage: 'offer',
  },
  {
    name: 'Nora Hassan',
    email: 'nora.hassan@example.com',
    linkedin_url: 'https://www.linkedin.com/in/nora-hassan-demo',
    notes: 'Demo candidate for coordination and recruiter support.',
    cvFileName: 'nora-hassan-cv.pdf',
    cvText:
      'Nora Hassan\nRecruitment Coordinator\n\nExperience\n- Scheduled interviews across several hiring teams.\n- Maintained candidate communication and updated ATS pipeline statuses.\n- Prepared candidate summaries and hiring meeting notes.\n\nSkills\nScheduling, candidate communication, ATS tools, documentation, coordination.',
    jobTitle: 'Recruitment Coordinator',
    stage: 'hired',
  },
  {
    name: 'Oliver Smith',
    email: 'oliver.smith@example.com',
    linkedin_url: 'https://www.linkedin.com/in/oliver-smith-demo',
    notes: 'Demo candidate with mixed junior full stack experience.',
    cvFileName: 'oliver-smith-cv.pdf',
    cvText:
      'Oliver Smith\nJunior Full Stack Developer\n\nExperience\n- Built small React components and simple Express endpoints during school projects.\n- Used Git, JavaScript, CSS, and Supabase in portfolio applications.\n- Interested in learning production workflows.\n\nSkills\nJavaScript, React, CSS, Git, Supabase, basic Node.js.',
    jobTitle: 'Full Stack Intern',
    stage: 'screening',
  },
  {
    name: 'Lina Karlsson',
    email: 'lina.karlsson@example.com',
    linkedin_url: 'https://www.linkedin.com/in/lina-karlsson-demo',
    notes: 'Demo candidate connected to frontend but with weaker match.',
    cvFileName: 'lina-karlsson-cv.pdf',
    cvText:
      'Lina Karlsson\nMarketing Assistant\n\nExperience\n- Created newsletters and social posts for a small company.\n- Updated website content in a CMS and coordinated campaign assets.\n- Basic understanding of HTML from content editing.\n\nSkills\nMarketing, copywriting, CMS editing, communication, basic HTML.',
    jobTitle: 'Frontend Developer',
    stage: 'rejected',
  },
]

function escapePdfText(text) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\r?\n/g, ') Tj\n0 -16 Td\n(')
}

function createDemoPdf(text) {
  const pdfText = escapePdfText(text)
  const content = `BT
/F1 12 Tf
50 760 Td
(${pdfText}) Tj
ET`

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    `5 0 obj\n<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream\nendobj\n`,
  ]

  let pdf = '%PDF-1.4\n'
  const offsets = [0]

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf))
    pdf += object
  }

  const xrefOffset = Buffer.byteLength(pdf)
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'

  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`
  pdf += `startxref\n${xrefOffset}\n%%EOF\n`

  return Buffer.from(pdf, 'utf8')
}

async function requireSuccess(result, action) {
  if (result.error) {
    throw new Error(`${action}: ${result.error.message}`)
  }

  return result.data
}

async function findDemoCustomer() {
  const query = supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .order('created_at', { ascending: true })

  if (demoCustomerEmail) {
    const customers = await requireSuccess(
      await query.eq('email', demoCustomerEmail),
      'Load customer profile by DEMO_CUSTOMER_EMAIL',
    )

    if (!customers.length) {
      throw new Error(
        `No profile found for DEMO_CUSTOMER_EMAIL=${demoCustomerEmail}`,
      )
    }

    return customers[0]
  }

  const customers = await requireSuccess(await query, 'Load customer profiles')
  const customerProfiles = customers.filter((profile) => profile.role === 'customer')
  const nonAdminCustomer = customerProfiles.find(
    (profile) => !profile.email.toLowerCase().includes('admin'),
  )
  const selectedCustomer = nonAdminCustomer || customerProfiles[0]

  if (!selectedCustomer) {
    throw new Error('No customer profile found. Create one customer account first.')
  }

  return selectedCustomer
}

async function removeStorageFiles(paths) {
  if (!paths.length) return

  await requireSuccess(
    await supabase.storage.from('candidate-cvs').remove(paths),
    'Remove old CV files',
  )
}

async function clearAppData() {
  console.log('Clearing applications, candidates, jobs, and old CV files...')

  const oldCandidates = await requireSuccess(
    await supabase.from('candidates').select('cv_url'),
    'Load old candidate CV paths',
  )

  const oldCvPaths = oldCandidates
    .map((candidate) => candidate.cv_url)
    .filter(Boolean)
    .filter((path) => !path.startsWith('http://') && !path.startsWith('https://'))

  await requireSuccess(
    await supabase.from('applications').delete().not('id', 'is', null),
    'Delete applications',
  )
  await requireSuccess(
    await supabase.from('candidates').delete().not('id', 'is', null),
    'Delete candidates',
  )
  await requireSuccess(
    await supabase.from('jobs').delete().not('id', 'is', null),
    'Delete jobs',
  )
  await removeStorageFiles(oldCvPaths)
}

async function seedJobs(customerId) {
  console.log('Creating demo jobs...')

  return requireSuccess(
    await supabase
      .from('jobs')
      .insert(demoJobs.map((job) => ({ ...job, customer_id: customerId })))
      .select('id, title'),
    'Seed jobs',
  )
}

async function seedCandidate(customerId, candidate) {
  console.log(`Creating demo candidate: ${candidate.name}`)

  const cvPath = `${customerId}/${randomUUID()}-${candidate.cvFileName}`

  await requireSuccess(
    await supabase.storage
      .from('candidate-cvs')
      .upload(cvPath, createDemoPdf(candidate.cvText), {
        contentType: 'application/pdf',
        upsert: false,
      }),
    `Upload CV for ${candidate.name}`,
  )

  return requireSuccess(
    await supabase
      .from('candidates')
      .insert({
        customer_id: customerId,
        name: candidate.name,
        email: candidate.email,
        linkedin_url: candidate.linkedin_url,
        cv_url: cvPath,
        notes: candidate.notes,
      })
      .select('id, name')
      .single(),
    `Seed candidate ${candidate.name}`,
  )
}

async function main() {
  const customer = await findDemoCustomer()

  console.log(`Keeping auth/profiles. Seeding workspace: ${customer.email}`)

  await clearAppData()

  const jobs = await seedJobs(customer.id)
  const jobByTitle = new Map(jobs.map((job) => [job.title, job]))
  const applications = []

  for (const candidateSeed of demoCandidates) {
    const candidate = await seedCandidate(customer.id, candidateSeed)
    const job = jobByTitle.get(candidateSeed.jobTitle)

    applications.push({
      customer_id: customer.id,
      candidate_id: candidate.id,
      job_id: job.id,
      stage: candidateSeed.stage,
    })
  }

  await requireSuccess(
    await supabase.from('applications').insert(applications),
    'Seed applications',
  )

  console.log('Demo seed complete.')
  console.log(`Jobs: ${jobs.length}`)
  console.log(`Candidates: ${demoCandidates.length}`)
  console.log(`Applications: ${applications.length}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
