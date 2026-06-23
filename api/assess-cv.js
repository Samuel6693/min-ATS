/* global Buffer, process */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const geminiApiKey = process.env.GEMINI_API_KEY
const geminiModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash'

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

const assessmentSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    score: {
      type: 'integer',
      minimum: 0,
      maximum: 100,
      description: 'Candidate match score from 0 to 100.',
    },
    summary: {
      type: 'string',
      description: 'Short practical explanation of the match.',
    },
    strengths: {
      type: 'array',
      items: { type: 'string' },
      description: 'Reasons this candidate fits the job.',
    },
    concerns: {
      type: 'array',
      items: { type: 'string' },
      description: 'Missing skills, risks, or unclear areas.',
    },
    recommendation: {
      type: 'string',
      enum: ['strong_match', 'possible_match', 'weak_match'],
      description: 'Final hiring recommendation bucket.',
    },
  },
  required: ['score', 'summary', 'strengths', 'concerns', 'recommendation'],
}

function getBearerToken(req) {
  const authHeader = req.headers.authorization || ''

  if (!authHeader.startsWith('Bearer ')) {
    return null
  }

  return authHeader.slice('Bearer '.length)
}

function getGeminiOutputText(geminiResult) {
  if (geminiResult.output_text) {
    return geminiResult.output_text
  }

  return geminiResult.steps
    ?.flatMap((step) => step.content || [])
    .find((content) => content.type === 'text')
    ?.text
}

async function canAccessWorkspace(token, customerId) {
  const { data: userResult, error: userError } = await supabaseAdmin.auth.getUser(token)

  if (userError || !userResult.user) {
    return false
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, role')
    .eq('id', userResult.user.id)
    .single()

  if (profileError || !profile) {
    return false
  }

  return profile.role === 'admin' || profile.id === customerId
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!geminiApiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is missing' })
  }

  const token = getBearerToken(req)

  if (!token) {
    return res.status(401).json({ error: 'Missing user session' })
  }

  const { candidateId, jobId, customerId } = req.body

  if (!candidateId || !jobId || !customerId) {
    return res.status(400).json({
      error: 'candidateId, jobId, and customerId are required',
    })
  }

  const hasAccess = await canAccessWorkspace(token, customerId)

  if (!hasAccess) {
    return res.status(403).json({ error: 'Not allowed to assess this candidate' })
  }

  const [candidateResult, jobResult] = await Promise.all([
    supabaseAdmin
      .from('candidates')
      .select('id, name, email, cv_url')
      .eq('id', candidateId)
      .eq('customer_id', customerId)
      .single(),
    supabaseAdmin
      .from('jobs')
      .select('id, title, description')
      .eq('id', jobId)
      .eq('customer_id', customerId)
      .single(),
  ])

  if (candidateResult.error || !candidateResult.data) {
    return res.status(404).json({ error: 'Candidate not found' })
  }

  if (jobResult.error || !jobResult.data) {
    return res.status(404).json({ error: 'Job not found' })
  }

  const candidate = candidateResult.data
  const job = jobResult.data

  if (!candidate.cv_url) {
    return res.status(400).json({ error: 'Candidate has no CV file' })
  }

  const { data: cvFile, error: downloadError } = await supabaseAdmin.storage
    .from('candidate-cvs')
    .download(candidate.cv_url)

  if (downloadError) {
    return res.status(400).json({ error: downloadError.message })
  }

  const cvBytes = Buffer.from(await cvFile.arrayBuffer())
  const cvBase64 = cvBytes.toString('base64')

  const geminiResponse = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/interactions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey,
      },
      body: JSON.stringify({
        model: geminiModel,
        input: [
          {
            type: 'document',
            data: cvBase64,
            mime_type: 'application/pdf',
          },
          {
            type: 'text',
            text: `You are a recruiting assistant. Assess this candidate CV against the job. Be practical, concise, and do not invent experience that is not in the CV.

Candidate: ${candidate.name} (${candidate.email})

Job title: ${job.title}
Job description:
${job.description || 'No job description provided.'}

Return only the structured assessment.`,
          },
        ],
        response_format: {
          type: 'text',
          mime_type: 'application/json',
          schema: assessmentSchema,
        },
      }),
    },
  )

  const geminiResult = await geminiResponse.json()

  if (!geminiResponse.ok) {
    return res.status(geminiResponse.status).json({
      error:
        geminiResult.error?.message ||
        geminiResult.message ||
        'CV assessment failed',
    })
  }

  const outputText = getGeminiOutputText(geminiResult)

  if (!outputText) {
    return res.status(500).json({ error: 'Gemini returned no assessment text' })
  }

  return res.status(200).json({
    assessment: JSON.parse(outputText),
  })
}
