const Note = require('../../models/noteModel');

exports.getNotes = async (req, res) => {
    try {
        const sector = req.query.sector || 'personal';
        const notes = await Note.findAllByUserId(req.user.id, sector);
        res.json({ success: true, data: notes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createNote = async (req, res) => {
    try {
        const { title, content, color, is_pinned, sector } = req.body;
        const finalSector = sector || req.query.sector || 'personal';
        if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

        const note = await Note.create({
            user_id: req.user.id,
            title,
            content,
            color,
            is_pinned,
            sector: finalSector
        });
        res.status(201).json({ success: true, data: note });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, color, is_pinned, sector } = req.body;
        const finalSector = sector || req.query.sector || 'personal';

        const existing = await Note.findById(id, finalSector);
        if (!existing || existing.user_id !== req.user.id) {
            return res.status(404).json({ success: false, message: 'Note not found' });
        }

        const updated = await Note.update(id, { title, content, color, is_pinned, sector: finalSector });
        if (updated) {
            const newNote = await Note.findById(id, finalSector);
            res.json({ success: true, data: newNote });
        } else {
            res.status(400).json({ success: false, message: 'Update failed' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteNote = async (req, res) => {
    try {
        const { id } = req.params;
        const sector = req.query.sector || req.body.sector || 'personal';
        const existing = await Note.findById(id, sector);
        if (!existing || existing.user_id !== req.user.id) {
            return res.status(404).json({ success: false, message: 'Note not found' });
        }

        const deleted = await Note.delete(id, sector);
        if (deleted) {
            res.json({ success: true, message: 'Note deleted' });
        } else {
            res.status(400).json({ success: false, message: 'Delete failed' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
