const db = require('../config/db');

const TABLE_NAME = 'education_vendors';

const create = async (data) => {
    const { user_id, name, contact_person, phone, email, address, category } = data;
    const [result] = await db.query(
        `INSERT INTO ${TABLE_NAME} (user_id, name, contact_person, phone, email, address, category) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user_id, name, contact_person || null, phone || null, email || null, address || null, category || null]
    );
    return { id: result.insertId, ...data };
};

const getAllByUserId = async (userId) => {
    const [rows] = await db.query(
        `SELECT * FROM ${TABLE_NAME} WHERE user_id = ? ORDER BY name ASC`,
        [userId]
    );
    return rows;
};

const update = async (id, userId, data) => {
    const { name, contact_person, phone, email, address, category } = data;
    const [result] = await db.query(
        `UPDATE ${TABLE_NAME} SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, category = ? 
         WHERE id = ? AND user_id = ?`,
        [name, contact_person, phone, email, address, category, id, userId]
    );
    return result.affectedRows > 0;
};

const deleteVendor = async (id, userId) => {
    const [result] = await db.query(
        `DELETE FROM ${TABLE_NAME} WHERE id = ? AND user_id = ?`,
        [id, userId]
    );
    return result.affectedRows > 0;
};

module.exports = {
    create,
    getAllByUserId,
    update,
    delete: deleteVendor
};
