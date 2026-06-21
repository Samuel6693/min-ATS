import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { email, password, fullName, role } = req.body

    if (!email || !password || !role) {
        return res.status(400).json({ error: 'Email, password, and role are required' })
    }

    if (!['admin', 'customer'].includes(role)) {
        return res.status(400).json({ error: 'Role must be admin or customer' })
    }

    const { data: createdUser, error: createUserError } =
        await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        })

    if (createUserError) {
        return res.status(400).json({ error: createUserError.message })
    }

    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
        id: createdUser.user.id,
        email,
        full_name: fullName || null,
        role,
    })

    if (profileError) {
        return res.status(400).json({ error: profileError.message })
    }

    return res.status(201).json({
        user: {
            id: createdUser.user.id,
            email: createdUser.user.email,
            role,
        },
    })
}