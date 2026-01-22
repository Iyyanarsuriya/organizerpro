const User = require('../../models/userModel');
const bcrypt = require('bcryptjs');

exports.getSubUsers = async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'owner') {
            return res.status(403).json({ error: 'Only the Workspace Owner can manage team members.' });
        }

        // Fetch users specifically for the IT sector
        const subUsers = await User.findByOwnerId(req.user.id, 'it');
        res.json(subUsers);
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

        let { username, email, password, role } = req.body;
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
            sector: 'it' // Explicitly set sector to IT
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
        if (req.user.role !== 'admin' && req.user.role !== 'owner') {
            return res.status(403).json({ error: 'Only the Workspace Owner can remove team members.' });
        }

        const { id } = req.params;
        // The delete logic in User model checks owner_id, so it's safe. 
        // We could technically verify the user is in 'it' sector, but owner ownership is strong enough.
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
