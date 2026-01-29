const User = require('../../models/userModel');
const Member = require('../../models/memberModel');
const bcrypt = require('bcryptjs');

exports.getSubUsers = async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'owner') {
            return res.status(403).json({ error: 'Only the Workspace Owner can manage team members.' });
        }

        // Fetch users specifically for the Education sector
        const subUsers = await User.findByOwnerId(req.user.id, 'education');

        // Fetch members to get extra info if needed (e.g. department, though user doesn't strictly have it)
        const members = await Member.getAllByUserId(req.user.id, null, 'education');

        // Create a map of email to member for quick lookup
        const memberMap = {};
        members.forEach(m => {
            if (m.email) memberMap[m.email.toLowerCase()] = m;
        });

        // Enrich subUsers
        const enrichedUsers = subUsers.map(user => {
            const member = memberMap[user.email?.toLowerCase()];
            return {
                ...user,
                department: member?.department || null // Use department instead of project
            };
        });

        res.json(enrichedUsers);
    } catch (error) {
        console.error('getSubUsers error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.createSubUser = async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'owner') {
            return res.status(403).json({ error: 'Only the Workspace Owner can add team members.' });
        }

        let { username, email, password, role, department } = req.body;
        username = username?.trim();
        email = email?.trim().toLowerCase();
        password = password?.trim();

        if (!password || password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const localId = await User.getNextLocalId(req.user.id);

        const userId = await User.create({
            username,
            email,
            password: hashedPassword,
            role: role || 'user',
            owner_id: req.user.id,
            local_id: localId,
            sector: 'education' // Explicitly set sector to Education
        });

        // Automatically create a Member entry for Attendance tracking/Expenses
        try {
            await Member.create({
                user_id: req.user.id, // Linked to the Owner
                name: username,
                role: role || 'teacher', // Default to teacher or staff
                email: email,
                status: 'active',
                sector: 'education',
                member_type: role === 'admin' || role === 'manager' ? 'employee' : 'employee', // Education usually implies employees
                department: department || null
            });
        } catch (memberError) {
            console.error('Failed to auto-create member for user:', memberError);
            // We don't fail the request, but we log it. User is created.
        }

        res.status(201).json({ message: 'Team member added successfully', userId });
    } catch (error) {
        console.error('createSubUser error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.deleteSubUser = async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'owner') {
            return res.status(403).json({ error: 'Only the Workspace Owner can remove team members.' });
        }

        const { id } = req.params;
        const success = await User.delete(id, req.user.id);

        if (!success) {
            return res.status(404).json({ error: 'User not found or you do not have permission to delete them.' });
        }

        res.json({ message: 'User removed successfully' });
    } catch (error) {
        console.error('deleteSubUser error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
