const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

exports.getSubUsers = async (req, res) => {
    try {
        // Only owners (or those with an implied usage of this endpoint) can see their team
        // If I am a sub-user, my owner_id is set.
        // If I am an owner, my owner_id is null.

        // Strategy: Only 'owner' role can list users? or anyone in the team?
        // Let's assume only the Owner (the one who pays/registered) can manage the team.
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only the Workspace Admin can manage team members.' });
        }

        const subUsers = await User.findByOwnerId(req.user.id);
        res.json(subUsers);
    } catch (error) {
        console.error('getSubUsers error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.createSubUser = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only the Workspace Admin can add team members.' });
        }

        let { username, email, password, role } = req.body;
        username = username?.trim();
        email = email?.trim().toLowerCase();
        password = password?.trim();

        if (!password || password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const userId = await User.create({
            username,
            email,
            password: hashedPassword,
            role: role || 'user', // Default to user (child)
            owner_id: req.user.id // This links them to the current logged-in owner
        });

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
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only the Workspace Admin can remove team members.' });
        }

        const { id } = req.params;
        const success = await User.delete(id, req.user.id);

        if (!success) {
            return res.status(404).json({ error: 'User not found or you do not have permission to delete them.' });
        }

        res.json({ message: 'Users removed successfully' });
    } catch (error) {
        console.error('deleteSubUser error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
